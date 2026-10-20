import type { IncomingMessage, ServerResponse } from "node:http";
import type { Duplex } from "node:stream";
import { randomUUID } from "node:crypto";
import type { SliceRuntime } from "./synthetic-identity.mts";
import { SliceError } from "./errors.mts";
import { command, parseStageJson, selection, validReceipt } from "./stage-arrival-validation.mts";
import { StageArrivalError, stageFail, stageProblem } from "./stage-arrival-errors.mts";
import { currentRequestBudget, withRequestBudget } from "./request-budget-context.mts";

const pattern = /^\/api\/v1\/employees\/([^/]*)\/shift-days\/([^/]*)\/stage-arrival\/(context|validations|commands)$/;
export const isStageArrivalRoute = (target: string) => pattern.test(target.split("?")[0]);
// Some framing failures happen BEFORE IncomingMessage/our body validator.
// If Node supplies a complete known F1 request-line, return the same sanitized
// problem contract without attempting authentication, reading or effects.
export function stageArrivalParserProblem(error: Error, socket: Duplex): boolean {
  if (!("rawPacket" in error) || !Buffer.isBuffer(error.rawPacket)) return false;
  const line = error.rawPacket.subarray(0, 8192).toString("latin1").split("\r\n", 1)[0];
  const target = /^[A-Z]+ ([^ ]+) HTTP\/1\.[01]$/.exec(line)?.[1];
  if (!target || !isStageArrivalRoute(target)) return false;
  const overflow = "code" in error && error.code === "HPE_HEADER_OVERFLOW";
  const problem = stageProblem(new StageArrivalError(overflow ? "REQUEST_TOO_LARGE" : "INVALID_REQUEST"), randomUUID());
  const payload = JSON.stringify(problem);
  if (socket.writable && !socket.destroyed) socket.end(
    `HTTP/1.1 ${problem.status} ${overflow ? "Payload Too Large" : "Bad Request"}\r\n` +
    "Connection: close\r\nContent-Type: application/problem+json; charset=utf-8\r\n" +
    "Cache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\n" +
    `Content-Length: ${Buffer.byteLength(payload)}\r\n\r\n${payload}`);
  else socket.destroy();
  return true;
}
export interface StageArrivalHttpOptions { stageArrivalOrigins?: readonly string[] }
export function validateStageArrivalHttpOptions(options: StageArrivalHttpOptions) {
  if (options.stageArrivalOrigins && (options.stageArrivalOrigins.length > 10 ||
      options.stageArrivalOrigins.some(origin => {
        try {
          const u = new URL(origin);
          return u.origin !== origin || !["http:", "https:"].includes(u.protocol) ||
            !["127.0.0.1", "[::1]", "localhost"].includes(u.hostname);
        } catch { return true; }
      }))) throw Error("Exact isolated loopback origins required");
}
function headers(request: IncomingMessage, post: boolean, origins: readonly string[]) {
  const allowed = new Set(["host", "connection", "content-length", "transfer-encoding", "content-type",
    "authorization", "accept", "accept-encoding", "user-agent", "origin", "sec-fetch-mode",
    "sec-fetch-site", "sec-fetch-dest", "referer", "accept-language", "cache-control", "pragma",
    // Exactly these browser metadata fields are ignored, never identity or
    // authority. They still count toward16KiB and duplicate-key rejection.
    "sec-ch-ua", "sec-ch-ua-mobile", "sec-ch-ua-platform"]);
  const seen = new Set<string>();
  if (Buffer.byteLength(request.rawHeaders.join("\r\n")) > 16384) stageFail("REQUEST_TOO_LARGE");
  if (request.headers["content-encoding"] !== undefined) stageFail("UNSUPPORTED_MEDIA_TYPE");
  for (let i = 0; i < request.rawHeaders.length; i += 2) {
    const key = request.rawHeaders[i].toLowerCase();
    if (seen.has(key) || !allowed.has(key)) stageFail("INVALID_REQUEST");
    seen.add(key);
  }
  if (request.headers.origin && !origins.includes(request.headers.origin)) stageFail("FORBIDDEN");
  if (post && (typeof request.headers["content-type"] !== "string" ||
      !/^application\/json(?:\s*;\s*charset=(?:utf-8|"utf-8"))?$/i.test(request.headers["content-type"])))
    stageFail("UNSUPPORTED_MEDIA_TYPE");
  const length = request.headers["content-length"];
  if (length !== undefined && (!/^(0|[1-9][0-9]*)$/.test(length) || Number(length) > 8192))
    stageFail("REQUEST_TOO_LARGE");
}
async function body(request: IncomingMessage, post: boolean, signal: AbortSignal): Promise<unknown> {
  const buffers: Buffer[] = []; let size = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    if (signal.aborted) stageFail("DEPENDENCY_TIMEOUT");
    const b = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += b.length;
    if (!post && size) stageFail("INVALID_REQUEST");
    if (size > 8192) stageFail("REQUEST_TOO_LARGE");
    buffers.push(b);
  }
  if (!post) return null;
  let raw: string;
  try { raw = new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(buffers)); }
  catch { return stageFail("INVALID_REQUEST"); }
  return parseStageJson(raw);
}
function send(response: ServerResponse, status: number, value: unknown, problem = false) {
  const payload = JSON.stringify(value);
  response.writeHead(status, { "Content-Type": `${problem ? "application/problem+json" : "application/json"}; charset=utf-8`,
    "Content-Length": Buffer.byteLength(payload), "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  response.end(payload);
}
export async function handleStageArrival(request: IncomingMessage, response: ServerResponse,
  runtime: SliceRuntime, options: StageArrivalHttpOptions) {
  const requestId = randomUUID(), abort = new AbortController();
  let commandId: string | null = null, commandAttempted = false, terminalKnown = false;
  const close = () => { if (!response.writableEnded) abort.abort(); };
  request.once("aborted", close); response.once("close", close);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const match = pattern.exec((request.url ?? "").split("?")[0])!;
  const post = match[3] !== "context", allow = post ? "POST" : "GET";
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        abort.abort();
        reject(new StageArrivalError(commandAttempted && !terminalKnown ? "COMMAND_OUTCOME_UNKNOWN" : "DEPENDENCY_TIMEOUT"));
      }, 5000); timer.unref();
    });
    const payload = await Promise.race([withRequestBudget(abort.signal, 5000, async () => {
      if (request.method !== allow) throw new StageArrivalError("INVALID_REQUEST", "none", true);
      headers(request, post, options.stageArrivalOrigins ?? []);
      const p = await runtime.authenticate({ authorization: request.headers.authorization ?? null });
      if ((request.url ?? "").includes("?")) stageFail("INVALID_REQUEST");
      let target: ReturnType<typeof selection>;
      try { target = selection({ employeeId: decodeURIComponent(match[1]), shiftDayId: decodeURIComponent(match[2]) }); }
      catch { return stageFail("INVALID_REQUEST"); }
      const input = await body(request, post, abort.signal);
      if (abort.signal.aborted || performance.now() >= currentRequestBudget()!.deadline) stageFail("DEPENDENCY_TIMEOUT");
      let value: unknown;
      if (match[3] === "context") value = await runtime.stageArrivalContext(p, target, abort.signal);
      else if (match[3] === "validations") value = await runtime.stageArrivalValidate(p, target, input, abort.signal);
      else {
        const cmd = command(input); commandId = cmd.commandId;
        commandAttempted = true;
        value = await runtime.stageArrivalCommit(p, target, cmd, abort.signal);
        if (!validReceipt(value, cmd, target))
          stageFail("COMMAND_OUTCOME_UNKNOWN");
      }
      const json = JSON.stringify(value);
      if (typeof json !== "string" || Buffer.byteLength(json) > (post ? 16384 : 65536))
        stageFail(commandAttempted ? "COMMAND_OUTCOME_UNKNOWN" : "INTERNAL_ERROR");
      if (abort.signal.aborted || performance.now() >= currentRequestBudget()!.deadline)
        stageFail(commandAttempted ? "COMMAND_OUTCOME_UNKNOWN" : "DEPENDENCY_TIMEOUT");
      terminalKnown = true;
      return value;
    }), timeout]);
    if (!response.destroyed) {
      if (request.headers.origin) response.setHeader("Access-Control-Allow-Origin", request.headers.origin);
      send(response, 200, payload);
    }
  } catch (error) {
    const mapped = commandAttempted && error instanceof SliceError ? new StageArrivalError("COMMAND_OUTCOME_UNKNOWN") :
      error instanceof SliceError &&
      ["UNAUTHENTICATED", "FORBIDDEN", "DEPENDENCY_TIMEOUT", "DEPENDENCY_UNAVAILABLE"].includes(error.code)
      ? new StageArrivalError(error.code === "UNAUTHENTICATED" ? "UNAUTHENTICATED" :
        error.code === "FORBIDDEN" ? "FORBIDDEN" : error.code === "DEPENDENCY_TIMEOUT" ? "DEPENDENCY_TIMEOUT" : "DEPENDENCY_UNAVAILABLE")
      : error instanceof StageArrivalError ? error :
        new StageArrivalError(commandAttempted ? "COMMAND_OUTCOME_UNKNOWN" : "INTERNAL_ERROR");
    const problem = stageProblem(mapped, requestId, commandId);
    if (!response.destroyed && !response.headersSent) {
      if (mapped.methodNotAllowed) response.setHeader("Allow", allow);
      response.setHeader("Connection", "close"); send(response, problem.status, problem, true);
      request.resume();
    }
  } finally {
    if (timer) clearTimeout(timer);
    request.removeListener("aborted", close); response.removeListener("close", close);
  }
}
