import type { IncomingMessage, ServerResponse } from "node:http";
import type { Duplex } from "node:stream";
import { randomUUID } from "node:crypto";
import type { SliceRuntime } from "./synthetic-identity.mts";
import { SliceError } from "./errors.mts";
import { ShiftManagementError, shiftFail, shiftProblem, shiftUnknown } from "./shift-management-errors.mts";
import { parseCsvShiftCommand, parseShiftCommand, parseShiftJson, parseShiftPreparationRequest,
  parseShiftSelection, validShiftReceipt } from "./shift-management-validation.mts";
import { assertShiftWorkAllowed } from "./shift-management-domain.mts";
import { withRequestBudget } from "./request-budget-context.mts";
import { linkBackendShutdown } from "./backend-lifecycle.mts";
import type { CsvShiftEncodingV1 } from "./shift-management-contracts.mts";
import { validateStageArrivalHttpOptions } from "./stage-arrival-http.mts";

const workspace = /^\/api\/v1\/employees\/([^/]*)\/shift-management\/(context|preparations|commands|csv-previews|csv-commands)$/;
const selected = /^\/api\/v1\/employees\/([^/]*)\/shift-management\/shift-days\/([^/]*)\/context$/;
export const isShiftManagementRoute = (target: string) => {
  const path = target.split("?")[0]; return workspace.test(path) || selected.test(path);
};
export interface ShiftManagementHttpOptions { shiftManagementOrigins?: readonly string[] }
export function validateShiftManagementHttpOptions(options: ShiftManagementHttpOptions) {
  validateStageArrivalHttpOptions({ stageArrivalOrigins: options.shiftManagementOrigins });
}
function checkHeaders(request: IncomingMessage, post: boolean, csv: boolean, origins: readonly string[]) {
  const allowed = new Set(["host", "connection", "content-length", "transfer-encoding", "content-type",
    "authorization", "accept", "accept-encoding", "user-agent", "origin", "sec-fetch-mode", "sec-fetch-site",
    "sec-fetch-dest", "referer", "accept-language", "cache-control", "pragma", "sec-ch-ua", "sec-ch-ua-mobile",
    "sec-ch-ua-platform"]);
  const seen = new Set<string>();
  if (Buffer.byteLength(request.rawHeaders.join("\r\n")) > 16384) shiftFail("REQUEST_TOO_LARGE");
  if (request.headers["content-encoding"] !== undefined) shiftFail("UNSUPPORTED_MEDIA_TYPE");
  for (let i = 0; i < request.rawHeaders.length; i += 2) {
    const key = request.rawHeaders[i].toLowerCase();
    if (seen.has(key) || !allowed.has(key)) shiftFail("INVALID_REQUEST");
    seen.add(key);
  }
  const origin = request.headers.origin;
  if (origin !== undefined && !origins.includes(origin) ||
      post && (typeof origin !== "string" || !origins.includes(origin))) shiftFail("FORBIDDEN");
  if (post && (request.headers["sec-fetch-site"] !== undefined &&
      !["same-origin", "same-site"].includes(String(request.headers["sec-fetch-site"])) ||
      request.headers["sec-fetch-mode"] !== undefined &&
      !["cors", "same-origin"].includes(String(request.headers["sec-fetch-mode"])) ||
      request.headers["sec-fetch-dest"] !== undefined && request.headers["sec-fetch-dest"] !== ""))
    shiftFail("FORBIDDEN");
  const contentType = request.headers["content-type"];
  let encoding: CsvShiftEncodingV1 | undefined;
  if (post && csv) {
    const match = typeof contentType === "string" &&
      /^text\/csv\s*;\s*charset=(?:"(utf-8|windows-1255)"|(utf-8|windows-1255))$/i.exec(contentType);
    if (!match) shiftFail("UNSUPPORTED_MEDIA_TYPE");
    const label = (match[1] ?? match[2]).toLowerCase();
    encoding = label === "utf-8" ? "utf-8" : "windows-1255";
  } else if (post && (typeof contentType !== "string" ||
      !/^application\/json(?:\s*;\s*charset=(?:utf-8|"utf-8"))?$/i.test(contentType)))
    shiftFail("UNSUPPORTED_MEDIA_TYPE");
  const length = request.headers["content-length"], maximum = csv ? 1048576 : 16384;
  if (length !== undefined && (!/^(?:0|[1-9][0-9]{0,19})$/.test(length) || BigInt(length) > BigInt(maximum)))
    shiftFail("REQUEST_TOO_LARGE");
  return encoding;
}
async function collect(request: IncomingMessage, post: boolean, maximum: number, signal: AbortSignal) {
  const buffers: Buffer[] = []; let size = 0;
  // A body stalled between chunks must not keep tracked backend work alive
  // after its deadline. This hook is removed before any application command.
  const cancel = () => { request.destroy(); };
  signal.addEventListener("abort", cancel, { once: true });
  try {
    assertShiftWorkAllowed(signal);
    for await (const chunk of request.iterator({ destroyOnReturn: false })) {
      assertShiftWorkAllowed(signal);
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      size += buffer.byteLength;
      if (!post && size) shiftFail("INVALID_REQUEST");
      if (size > maximum) shiftFail("REQUEST_TOO_LARGE");
      buffers.push(buffer);
    }
    assertShiftWorkAllowed(signal); return Buffer.concat(buffers, size);
  } finally { signal.removeEventListener("abort", cancel); }
}
function serialize(value: unknown): string {
  const json = JSON.stringify(value);
  if (typeof json !== "string" || Buffer.byteLength(json) > 2097152) shiftFail("INVALID_SOURCE_DATA");
  return json;
}
function send(response: ServerResponse, status: number, payload: string, problem = false) {
  response.writeHead(status, { "Content-Type": `${problem ? "application/problem+json" : "application/json"}; charset=utf-8`,
    "Content-Length": Buffer.byteLength(payload), "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  response.end(payload);
}
export async function handleShiftManagement(request: IncomingMessage, response: ServerResponse,
  runtime: SliceRuntime, options: ShiftManagementHttpOptions) {
  const requestId = randomUUID(), abort = new AbortController(), unlink = linkBackendShutdown(abort);
  const path = (request.url ?? "").split("?")[0], dayMatch = selected.exec(path), match = workspace.exec(path);
  const operation = dayMatch ? "context" : match?.[2];
  const post = operation !== "context", csv = operation === "csv-previews", allow = post ? "POST" : "GET";
  let commandId: string | null = null, employeeId: string | null = null;
  let commandAttempted = false, terminalKnown = false, timer: ReturnType<typeof setTimeout> | undefined;
  const lost = () => {
    if (!response.writableFinished) {
      abort.abort();
      if (commandAttempted && employeeId) runtime.shiftManagement?.quarantineTransport(employeeId);
    }
  };
  request.once("aborted", lost); response.once("close", lost);
  try {
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        abort.abort();
        if (commandAttempted && employeeId) runtime.shiftManagement?.quarantineTransport(employeeId);
        reject(commandAttempted && !terminalKnown ? shiftUnknown() : new ShiftManagementError({
          status: 503, code: "DEPENDENCY_TIMEOUT", effect: "none", nextAction: "stop",
        }));
      }, 5000); timer.unref();
    });
    const payload = await Promise.race([withRequestBudget(abort.signal, 5000, async () => {
      if (request.method !== allow) {
        response.setHeader("Allow", allow);
        throw new ShiftManagementError({ status: 405, code: "INVALID_REQUEST",
          effect: "none", nextAction: "correct-and-validate" });
      }
      if (!runtime.shiftManagement) shiftFail("LIVE_WRITES_DISABLED");
      const encoding = checkHeaders(request, post, csv, options.shiftManagementOrigins ?? []);
      if ((request.url ?? "").includes("?") || Buffer.byteLength(request.url ?? "") > 8192) shiftFail("INVALID_REQUEST");
      const principal = await runtime.authenticate({ authorization: request.headers.authorization ?? null });
      let rawEmployee: string, rawDay: string | null;
      try {
        rawEmployee = decodeURIComponent(dayMatch?.[1] ?? match?.[1] ?? "");
        rawDay = dayMatch ? decodeURIComponent(dayMatch[2]) : null;
      } catch { return shiftFail("INVALID_REQUEST"); }
      const selection = parseShiftSelection({ employeeId: rawEmployee, shiftDayId: rawDay });
      employeeId = selection.employeeId;
      const bytes = await collect(request, post, csv ? 1048576 : 16384, abort.signal);
      if (!post) return serialize(await runtime.shiftManagement.context(principal, selection, abort.signal));
      if (csv) {
        if (!encoding) shiftFail("UNSUPPORTED_MEDIA_TYPE");
        return serialize(await runtime.shiftManagement.previewCsv(principal, selection.employeeId, bytes, encoding, abort.signal));
      }
      let raw: string;
      try { raw = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes); }
      catch { return shiftFail("INVALID_REQUEST"); }
      const input = parseShiftJson(raw, abort.signal);
      if (operation === "preparations")
        return serialize(await runtime.shiftManagement.prepare(principal, selection.employeeId,
          parseShiftPreparationRequest(input), abort.signal));
      const command = operation === "csv-commands" ? parseCsvShiftCommand(input) : parseShiftCommand(input);
      commandId = command.commandId; commandAttempted = true;
      const receipt = "previewToken" in command ?
        await runtime.shiftManagement.commandCsv(principal, selection.employeeId, command, abort.signal) :
        await runtime.shiftManagement.command(principal, selection.employeeId, command, abort.signal);
      if (!validShiftReceipt(receipt, { employeeId: selection.employeeId, commandId: command.commandId,
        kind: "previewToken" in command ? "csv-create" : command.draft.kind,
        source: runtime.shiftManagement.reference.dataSource, zone: runtime.shiftManagement.businessTimeZone }))
        throw shiftUnknown();
      try { const json = serialize(receipt); terminalKnown = true; return json; }
      catch { throw shiftUnknown(); }
    }), timeout]);
    if (!response.destroyed) send(response, 200, payload);
  } catch (error) {
    const normalized = error instanceof SliceError && error.code === "UNAUTHENTICATED" ?
      new ShiftManagementError({ status: 401, code: "UNAUTHENTICATED", effect: "none", nextAction: "stop" }) :
      error instanceof SliceError && error.code === "DEPENDENCY_UNAVAILABLE" ?
        new ShiftManagementError({ status: 503, code: "DEPENDENCY_UNAVAILABLE", effect: "none", nextAction: "stop" }) : error;
    const problem = shiftProblem(commandAttempted && !terminalKnown && !(normalized instanceof ShiftManagementError) ?
      shiftUnknown() : normalized, requestId, commandId);
    if (problem.effect === "unknown" && employeeId) runtime.shiftManagement?.quarantineTransport(employeeId);
    if (!response.destroyed && !response.headersSent) {
      response.setHeader("Connection", "close");
      send(response, problem.status, serialize(problem), true);
    }
    request.resume();
  } finally {
    if (timer) clearTimeout(timer);
    request.removeListener("aborted", lost); response.removeListener("close", lost); unlink();
  }
}
export function shiftManagementParserProblem(error: Error, socket: Duplex): boolean {
  if (!("rawPacket" in error) || !Buffer.isBuffer(error.rawPacket)) return false;
  const line = error.rawPacket.subarray(0, 8192).toString("latin1").split("\r\n", 1)[0];
  const target = /^[A-Z]+ ([^ ]+) HTTP\/1\.[01]$/.exec(line)?.[1];
  if (!target || !isShiftManagementRoute(target)) return false;
  const overflow = "code" in error && error.code === "HPE_HEADER_OVERFLOW";
  const problem = shiftProblem(new ShiftManagementError(overflow ?
    { status: 413, code: "REQUEST_TOO_LARGE", effect: "none", nextAction: "correct-and-validate" } :
    { status: 400, code: "INVALID_REQUEST", effect: "none", nextAction: "correct-and-validate" }), randomUUID());
  const payload = serialize(problem);
  if (socket.writable && !socket.destroyed) socket.end(
    `HTTP/1.1 ${problem.status} ${overflow ? "Payload Too Large" : "Bad Request"}\r\n` +
    "Connection: close\r\nContent-Type: application/problem+json; charset=utf-8\r\n" +
    "Cache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\n" +
    `Content-Length: ${Buffer.byteLength(payload)}\r\n\r\n${payload}`);
  else socket.destroy();
  return true;
}
