import type { IncomingMessage, ServerResponse } from "node:http";
import type { Duplex } from "node:stream";
import { randomUUID } from "node:crypto";
import type { SliceRuntime } from "./synthetic-identity.mts";
import { mutationHeaders, mutationBody, sendMutation } from "./stage-arrival-http.mts";
import { withRequestBudget } from "./request-budget-context.mts";
import { linkBackendShutdown } from "./backend-lifecycle.mts";
import { selection } from "./stage-arrival-validation.mts";
import { cancellationCommand, cancellationDraft } from "./station-exit-cancellation-validation.mts";
import { cancellationProblem } from "./station-exit-cancellation-errors.mts";
import { StageArrivalError, stageFail } from "./stage-arrival-errors.mts";
import { checkStageBudget } from "./stage-arrival-memory.mts";
import { serializeSuccess } from "./http-adapter.mts";

const pattern = /^\/api\/v1\/employees\/([^/]*)\/shift-days\/([^/]*)\/station-exit-cancellation\/(context|validations|commands)$/;
export const isCancellationRoute = (target: string) => pattern.test(target.split("?")[0]);
export function cancellationParserProblem(error: Error, socket: Duplex) {
  if (!("rawPacket" in error) || !Buffer.isBuffer(error.rawPacket)) return false;
  const line = error.rawPacket.subarray(0, 8192).toString("latin1").split("\r\n", 1)[0];
  const target = /^[A-Z]+ ([^ ]+) HTTP\/1\.[01]$/.exec(line)?.[1];
  if (!target || !isCancellationRoute(target)) return false;
  const overflow = "code" in error && error.code === "HPE_HEADER_OVERFLOW";
  const p = cancellationProblem(new StageArrivalError(overflow ? "REQUEST_TOO_LARGE" : "INVALID_REQUEST"), randomUUID());
  const payload = JSON.stringify(p);
  if (socket.writable && !socket.destroyed) socket.end(
    `HTTP/1.1 ${p.status} ${overflow ? "Payload Too Large" : "Bad Request"}\r\nConnection: close\r\n` +
    `Content-Type: application/problem+json; charset=utf-8\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\n` +
    `Content-Length: ${Buffer.byteLength(payload)}\r\n\r\n${payload}`);
  else socket.destroy();
  return true;
}
export async function handleCancellation(request: IncomingMessage, response: ServerResponse,
  runtime: SliceRuntime, origins: readonly string[] = []) {
  const requestId = randomUUID(), abort = new AbortController(), unlink = linkBackendShutdown(abort);
  const close = () => { if (!response.writableEnded) abort.abort(); };
  request.once("aborted", close); response.once("close", close);
  let timer: ReturnType<typeof setTimeout> | undefined, commandId: string | null = null;
  let attempted = false, terminalKnown = false;
  const m = pattern.exec((request.url ?? "").split("?")[0])!, post = m[3] !== "context";
  const allow = post ? "POST" : "GET";
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => { abort.abort(); reject(new StageArrivalError(
        attempted && !terminalKnown ? "COMMAND_OUTCOME_UNKNOWN" : "DEPENDENCY_TIMEOUT")); }, 5000);
      timer.unref();
    });
    const result = await Promise.race([withRequestBudget(abort.signal, 5000, async () => {
      if (request.method !== allow) throw new StageArrivalError("INVALID_REQUEST", "none", true);
      if ((request.url ?? "").includes("?")) stageFail("INVALID_REQUEST");
      mutationHeaders(request, post, origins, 16384);
      if (post && (typeof request.headers.origin !== "string" || !origins.includes(request.headers.origin))) stageFail("FORBIDDEN");
      if (runtime.attendanceStationExitCancellationMode === "disabled" || !runtime.cancellation) stageFail("LIVE_WRITES_DISABLED");
      const principal = await runtime.authenticate({ authorization: request.headers.authorization ?? null });
      checkStageBudget(abort.signal);
      const target = selection({ employeeId: m[1], shiftDayId: m[2] });
      const input = await mutationBody(request, post, abort.signal, 16384);
      if (!post) return runtime.cancellation.context(principal, target, abort.signal);
      if (m[3] === "validations") return runtime.cancellation.validate(principal, target, cancellationDraft(input), abort.signal);
      const cmd = cancellationCommand(input); commandId = cmd.commandId; attempted = true;
      try {
        const r = await runtime.cancellation.command(principal, target, cmd, abort.signal);
        checkStageBudget(abort.signal);
        serializeSuccess(r); terminalKnown = true; return r;
      } catch (e) {
        terminalKnown = e instanceof StageArrivalError && e.effect !== "unknown";
        throw e;
      }
    }), timeout]);
    serializeSuccess(result); sendMutation(response, 200, result);
  } catch (e) {
    const problem = cancellationProblem(e, requestId, commandId);
    if (!response.headersSent && !response.destroyed) {
      response.setHeader("Connection", "close");
      if (problem.status === 405) response.setHeader("Allow", allow);
      sendMutation(response, problem.status, problem, true); request.resume();
    }
  } finally {
    if (timer) clearTimeout(timer); unlink();
    request.removeListener("aborted", close); response.removeListener("close", close);
  }
}
