import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { randomUUID } from "node:crypto";
import { validateIds } from "./contract-validation.mts";
import { SliceError, toProblem } from "./errors.mts";
import type { SliceRuntime } from "./synthetic-identity.mts";
import { CurrentShiftError, currentProblem } from "./current-shifts-errors.mts";
import { parseCurrentQuery } from "./current-shifts-validation.mts";
import { withRequestBudget } from "./request-budget-context.mts";

export const REQUEST_BUDGET_MS = 5000;
export const RESPONSE_LIMIT_BYTES = 16 * 1024;
export const CURRENT_RESPONSE_LIMIT_BYTES = 2 * 1024 * 1024;
export const REQUEST_TARGET_LIMIT_BYTES = 8 * 1024;
export function serializeSuccess(value: unknown, byteLimit = RESPONSE_LIMIT_BYTES): string {
  const json = JSON.stringify(value);
  if (typeof json !== "string" || Buffer.byteLength(json, "utf8") > byteLimit)
    throw new SliceError("INTERNAL_ERROR");
  return json;
}
function route(request: IncomingMessage) {
  if (request.method !== "GET") throw new SliceError("INVALID_REQUEST");
  const target = request.url ?? "";
  if (Buffer.byteLength(target, "utf8") > REQUEST_TARGET_LIMIT_BYTES)
    throw new SliceError("INVALID_REQUEST", [{ name: "query", reason: "unsupported" }]);
  const question = target.indexOf("?");
  const path = question < 0 ? target : target.slice(0, question);
  if (path === "/api/v1/current-shifts" || path === "/api/v1/current-shifts/filter-context") {
    if (path.endsWith("/filter-context")) {
      if (question >= 0)
        throw new CurrentShiftError("INVALID_REQUEST", [{ name: "query", reason: "unsupported" }]);
      return { kind: "current-context" as const };
    }
    const raw = question < 0 ? "" : target.slice(question + 1);
    try {
      // URLSearchParams alone silently repairs malformed escapes/UTF-8.
      for (const pair of raw.split("&"))
        for (const part of pair.split("=")) decodeURIComponent(part.replaceAll("+", " "));
    } catch {
      throw new CurrentShiftError("INVALID_REQUEST", [{ name: "query", reason: "invalid-format" }]);
    }
    if (raw.includes("#")) throw new CurrentShiftError("INVALID_REQUEST");
    return { kind: "current-list" as const, query: parseCurrentQuery(new URLSearchParams(raw)) };
  }
  if (target.includes("?"))
    throw new SliceError("INVALID_REQUEST", [{ name: "query", reason: "unsupported" }]);
  if (target === "/api/v1/identity") return { kind: "identity" as const };
  const match = /^\/api\/v1\/employees\/([^/]*)\/shift-days\/([^/]*)$/.exec(target);
  if (!match) throw new SliceError("INVALID_REQUEST");
  let employeeId: string, shiftDayId: string;
  try { employeeId = decodeURIComponent(match[1]); shiftDayId = decodeURIComponent(match[2]); }
  catch { throw new SliceError("INVALID_REQUEST"); }
  validateIds(employeeId, shiftDayId);
  return { kind: "detail" as const, employeeId, shiftDayId };
}
async function requireEmptyBody(request: IncomingMessage): Promise<void> {
  // Any nonempty body is unsupported. Stop at the first byte; never collect it.
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    if (chunk.length > 0)
      throw new SliceError("INVALID_REQUEST", [{ name: "body", reason: "unsupported" }]);
  }
}
function send(response: ServerResponse, status: number, contentType: string, payload: string) {
  response.writeHead(status, {
    "Content-Type": contentType, "Cache-Control": "no-store",
    "Content-Length": Buffer.byteLength(payload, "utf8"),
    "X-Content-Type-Options": "nosniff",
  });
  response.end(payload);
}
export function createLoopbackServer(runtime: SliceRuntime) {
  const server = createServer(async (request, response) => {
    const requestId = randomUUID();
    const currentEndpoint = (request.url ?? "").split("?")[0] === "/api/v1/current-shifts" ||
      (request.url ?? "").split("?")[0] === "/api/v1/current-shifts/filter-context";
    const cancellation = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let abort: () => void = () => {};
    try {
      const deadline = new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          cancellation.abort(new SliceError("DEPENDENCY_TIMEOUT"));
          reject(cancellation.signal.reason);
        }, REQUEST_BUDGET_MS);
        abort = () => {
          if (!response.writableFinished) {
            cancellation.abort(new SliceError("INTERNAL_ERROR"));
            reject(cancellation.signal.reason);
          }
        };
        response.once("close", abort);
      });
      // One budget spans authentication, input streaming and read. No automatic retries.
      // Promise.race suppresses late success; fixture/provider work has no connection to cancel.
      const work = async () => {
        const authorization = request.headers.authorization;
        const principal = await runtime.authenticate({
          authorization: typeof authorization === "string" ? authorization : null,
        });
        cancellation.signal.throwIfAborted();
        const selected = route(request);
        await requireEmptyBody(request);
        cancellation.signal.throwIfAborted();
        if (selected.kind === "identity") return runtime.identity(principal);
        if (selected.kind === "current-context") return await runtime.currentContext(principal, cancellation.signal);
        if (selected.kind === "current-list") return await runtime.currentList(principal, selected.query, cancellation.signal);
        return await runtime.read(principal, selected.employeeId, selected.shiftDayId);
      };
      const value = await Promise.race([
        withRequestBudget(cancellation.signal, REQUEST_BUDGET_MS, work), deadline,
      ]);
      if (!response.destroyed) send(response, 200, "application/json; charset=utf-8",
        serializeSuccess(value, currentEndpoint ? CURRENT_RESPONSE_LIMIT_BYTES : RESPONSE_LIMIT_BYTES));
    } catch (error) {
      if (!response.destroyed && !response.headersSent) {
        const problem = currentEndpoint ? currentProblem(
          error instanceof SliceError && error.code === "INVALID_REQUEST"
            ? new CurrentShiftError("INVALID_REQUEST", error.invalidParameters?.map(p => ({
              name: p.name === "body" ? "body" : "query", reason: p.reason,
            }))) : error, requestId) : toProblem(error, requestId);
        response.setHeader("Connection", "close");
        send(response, problem.status, "application/problem+json; charset=utf-8", JSON.stringify(problem));
        // Reject unread body without retaining a slow or oversized stream.
        request.resume();
      }
    } finally {
      if (timer) clearTimeout(timer);
      response.removeListener("close", abort);
    }
  });
  server.requestTimeout = REQUEST_BUDGET_MS;
  server.headersTimeout = REQUEST_BUDGET_MS;
  server.maxHeadersCount = 64;
  // Guard even direct callers of server.listen; there is no public bind override.
  const listen = server.listen.bind(server);
  server.listen = ((port: number, host: string, callback?: () => void) => {
    if (host !== "127.0.0.1" && host !== "::1") throw new Error("Loopback binding required");
    return listen(port, host, callback);
  }) as typeof server.listen;
  return server;
}
