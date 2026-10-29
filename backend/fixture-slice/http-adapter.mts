import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { Duplex } from "node:stream";
import { randomUUID } from "node:crypto";
import { validateIds } from "./contract-validation.mts";
import { SliceError, toProblem } from "./errors.mts";
import type { SliceRuntime } from "./synthetic-identity.mts";
import { CurrentShiftError, currentProblem } from "./current-shifts-errors.mts";
import { parseCurrentQuery } from "./current-shifts-validation.mts";
import { withRequestBudget, currentRequestBudget } from "./request-budget-context.mts";
import { parseSearchQuery, invalidSearch } from "./shift-search-validation.mts";
import { searchProblem } from "./shift-search-errors.mts";
import { myShiftsProblem } from "./my-shifts-errors.mts";
import { parseMyShiftsQuery, invalidMyShifts } from "./my-shifts-validation.mts";
import { itemsProblem, ShiftItemsError } from "./shift-items-errors.mts";
import { parseItemsQuery } from "./shift-items-validation.mts";
import { EmployeeCardError, cardProblem } from "./employee-card-errors.mts";
import { invalidCard, validateCardRequest } from "./read-employee-card.mts";
import { invalidAttendance, parseAttendanceQuery } from "./attendance-validation.mts";
import { attendanceProblem, AttendanceError } from "./attendance-errors.mts";
import { handleStageArrival, isStageArrivalRoute, stageArrivalParserProblem, validateStageArrivalHttpOptions } from "./stage-arrival-http.mts";
import type { StageArrivalHttpOptions } from "./stage-arrival-http.mts";
import { BackendLifecycle, linkBackendShutdown, registerBackendLifecycle } from "./backend-lifecycle.mts";
import { StageArrivalError, stageProblem } from "./stage-arrival-errors.mts";
import { handleShiftManagement, isShiftManagementRoute, shiftManagementParserProblem,
  validateShiftManagementHttpOptions } from "./shift-management-http.mts";
import type { ShiftManagementHttpOptions } from "./shift-management-http.mts";
import { ShiftManagementError, shiftProblem } from "./shift-management-errors.mts";

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
  const question = target.indexOf("?");
  const path = question < 0 ? target : target.slice(0, question);
  if (path === "/api/v1/attendance" || path === "/api/v1/attendance/filter-context") {
    if (path.endsWith("/filter-context")) {
      if (question >= 0) invalidAttendance("query", "unsupported");
      return { kind: "attendance-context" as const };
    }
    return { kind: "attendance-list" as const,
      query: parseAttendanceQuery(question < 0 ? "" : target.slice(question + 1)) };
  }
  const cardMatch = /^\/api\/v1\/employees\/([^/]*)\/operational-card$/.exec(path);
  if (cardMatch) {
    const rawQuery = question < 0 ? "" : target.slice(question + 1);
    if (Buffer.byteLength(rawQuery, "utf8") > REQUEST_TARGET_LIMIT_BYTES || question >= 0)
      invalidCard("query", "unsupported");
    let employeeId: string;
    try { employeeId = decodeURIComponent(cardMatch[1]); } catch { invalidCard("employeeId"); }
    validateCardRequest({ employeeId });
    return { kind: "employee-card" as const, employeeId };
  }
  const itemMatch = /^\/api\/v1\/employees\/([^/]*)\/shift-days\/([^/]*)\/breaks-and-exceptions$/.exec(path);
  if (itemMatch) {
    let employeeId: string, shiftDayId: string;
    try { employeeId = decodeURIComponent(itemMatch[1]); shiftDayId = decodeURIComponent(itemMatch[2]); }
    catch { throw new SliceError("INVALID_REQUEST"); }
    validateIds(employeeId, shiftDayId);
    return { kind: "shift-items" as const, employeeId, shiftDayId,
      query: parseItemsQuery(question < 0 ? "" : target.slice(question + 1)) };
  }
  const scheduleEndpoint = path === "/api/v1/my-shifts" || path === "/api/v1/my-shifts/context";
  const searchEndpoint = scheduleEndpoint || path === "/api/v1/shift-search" || path === "/api/v1/shift-search/filter-context";
  if (Buffer.byteLength(searchEndpoint ? (question < 0 ? "" : target.slice(question + 1)) : target, "utf8") >
      REQUEST_TARGET_LIMIT_BYTES)
    throw new SliceError("INVALID_REQUEST", [{ name: "query", reason: "unsupported" }]);
  if (scheduleEndpoint) {
    const raw = question < 0 ? "" : target.slice(question + 1);
    try {
      for (const pair of raw.split("&"))
        for (const part of pair.split("=")) decodeURIComponent(part.replaceAll("+", " "));
    } catch { invalidMyShifts("query"); }
    if (raw.includes("#")) invalidMyShifts("query");
    if (path.endsWith("/context"))
      return { kind: "schedule-context" as const, query: parseMyShiftsQuery(new URLSearchParams(raw), false) };
    return { kind: "schedule-list" as const, query: parseMyShiftsQuery(new URLSearchParams(raw), true) };
  }
  if (path === "/api/v1/shift-search" || path === "/api/v1/shift-search/filter-context") {
    if (path.endsWith("/filter-context")) {
      if (question >= 0) invalidSearch("query", "unsupported");
      return { kind: "search-context" as const };
    }
    const raw = question < 0 ? "" : target.slice(question + 1);
    try {
      for (const pair of raw.split("&"))
        for (const part of pair.split("=")) decodeURIComponent(part.replaceAll("+", " "));
    } catch { invalidSearch("query"); }
    if (raw.includes("#")) invalidSearch("query");
    return { kind: "search-list" as const, query: parseSearchQuery(new URLSearchParams(raw)) };
  }
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
export function createLoopbackServer(runtime: SliceRuntime, options: StageArrivalHttpOptions & ShiftManagementHttpOptions = {}) {
  validateStageArrivalHttpOptions(options);
  validateShiftManagementHttpOptions(options);
  const lifecycle = new BackendLifecycle();
  const inFlight = new WeakMap<Duplex, number>();
  // Leave room for the F1 application-level 16KiB header problem response.
  // The native parser still bounds larger malformed transport before dispatch.
  const handle = async (request: IncomingMessage, response: ServerResponse) => {
    const socket = request.socket;
    inFlight.set(socket, (inFlight.get(socket) ?? 0) + 1);
    let released = false;
    const release = () => {
      if (released) return; released = true;
      inFlight.set(socket, Math.max(0, (inFlight.get(socket) ?? 1) - 1));
    };
    response.once("finish", release); response.once("close", release);
    if (isShiftManagementRoute(request.url ?? "")) {
      await handleShiftManagement(request, response, runtime, options); return;
    }
    if (isStageArrivalRoute(request.url ?? "")) {
      await handleStageArrival(request, response, runtime, options); return;
    }
    const requestId = randomUUID();
    const attendanceEndpoint = ["/api/v1/attendance", "/api/v1/attendance/filter-context"]
      .includes((request.url ?? "").split("?")[0]);
    const cardEndpoint = /^\/api\/v1\/employees\/[^/]*\/operational-card$/
      .test((request.url ?? "").split("?")[0]);
    const itemsEndpoint = /^\/api\/v1\/employees\/[^/]*\/shift-days\/[^/]*\/breaks-and-exceptions$/
      .test((request.url ?? "").split("?")[0]);
    const currentEndpoint = (request.url ?? "").split("?")[0] === "/api/v1/current-shifts" ||
      (request.url ?? "").split("?")[0] === "/api/v1/current-shifts/filter-context";
    const searchEndpoint = (request.url ?? "").split("?")[0] === "/api/v1/shift-search" ||
      (request.url ?? "").split("?")[0] === "/api/v1/shift-search/filter-context";
    const scheduleEndpoint = (request.url ?? "").split("?")[0] === "/api/v1/my-shifts" ||
      (request.url ?? "").split("?")[0] === "/api/v1/my-shifts/context";
    const cancellation = new AbortController();
    const unlinkShutdown = linkBackendShutdown(cancellation);
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
        if (attendanceEndpoint && request.method !== "GET") throw new AttendanceError("INVALID_REQUEST");
        if (cardEndpoint && request.method !== "GET") throw new EmployeeCardError("INVALID_REQUEST");
        if (itemsEndpoint && request.method !== "GET") throw new ShiftItemsError("INVALID_REQUEST");
        const authorization = request.headers.authorization;
        const principal = await runtime.authenticate({
          authorization: typeof authorization === "string" ? authorization : null,
        });
        cancellation.signal.throwIfAborted();
        const selected = route(request);
        await requireEmptyBody(request);
        cancellation.signal.throwIfAborted();
        if (selected.kind === "identity") return runtime.identity(principal);
        if (selected.kind === "attendance-context") return await runtime.attendanceContext(principal, cancellation.signal);
        if (selected.kind === "attendance-list") return await runtime.attendanceList(principal, selected.query, cancellation.signal);
        if (selected.kind === "employee-card") return await runtime.employeeCard(principal,
          { employeeId: selected.employeeId }, cancellation.signal);
        if (selected.kind === "shift-items") return await runtime.shiftItems(principal,
          { employeeId: selected.employeeId, shiftDayId: selected.shiftDayId, ...selected.query }, cancellation.signal);
        if (selected.kind === "schedule-context") return await runtime.myShiftsContext(principal, selected.query, cancellation.signal);
        if (selected.kind === "schedule-list") return await runtime.myShiftsList(principal, selected.query, cancellation.signal);
        if (selected.kind === "search-context") return await runtime.searchContext(principal, cancellation.signal);
        if (selected.kind === "search-list") return await runtime.searchList(principal, selected.query, cancellation.signal);
        if (selected.kind === "current-context") return await runtime.currentContext(principal, cancellation.signal);
        if (selected.kind === "current-list") return await runtime.currentList(principal, selected.query, cancellation.signal);
        return await runtime.read(principal, selected.employeeId, selected.shiftDayId);
      };
      const payload = await Promise.race([
        withRequestBudget(cancellation.signal, REQUEST_BUDGET_MS, async () => {
          const value = await work();
          const json = serializeSuccess(value, attendanceEndpoint || itemsEndpoint || currentEndpoint || searchEndpoint || scheduleEndpoint
            ? CURRENT_RESPONSE_LIMIT_BYTES : RESPONSE_LIMIT_BYTES);
          if (performance.now() >= currentRequestBudget()!.deadline) throw new SliceError("DEPENDENCY_TIMEOUT");
          cancellation.signal.throwIfAborted();
          return json;
        }), deadline,
      ]);
      if (!response.destroyed) send(response, 200, "application/json; charset=utf-8",
        payload);
    } catch (error) {
      if (!response.destroyed && !response.headersSent) {
        let problem = attendanceEndpoint ? attendanceProblem(error, requestId) : cardEndpoint ? cardProblem(error, requestId) : itemsEndpoint ? itemsProblem(error, requestId) : scheduleEndpoint ? myShiftsProblem(error, requestId) : searchEndpoint ? searchProblem(error, requestId) : currentEndpoint ? currentProblem(
          error instanceof SliceError && error.code === "INVALID_REQUEST"
            ? new CurrentShiftError("INVALID_REQUEST", error.invalidParameters?.map(p => ({
              name: p.name === "body" ? "body" : "query", reason: p.reason,
            }))) : error, requestId) : toProblem(error, requestId);
        response.setHeader("Connection", "close");
        if ((attendanceEndpoint || cardEndpoint || itemsEndpoint) && request.method !== "GET") {
          problem.status = 405;
          response.setHeader("Allow", "GET");
        }
        let problemPayload = JSON.stringify(problem);
        if (attendanceEndpoint && Buffer.byteLength(problemPayload, "utf8") > RESPONSE_LIMIT_BYTES) {
          problem = attendanceProblem(new AttendanceError("INTERNAL_ERROR"), requestId);
          problemPayload = JSON.stringify(problem);
        }
        send(response, problem.status, "application/problem+json; charset=utf-8", problemPayload);
        // Reject unread body without retaining a slow or oversized stream.
        request.resume();
      }
    } finally {
      unlinkShutdown();
      if (timer) clearTimeout(timer);
      response.removeListener("close", abort);
    }
  };
  const server = createServer({ maxHeaderSize: 32 * 1024 }, (request, response) => {
    if (lifecycle.stopping) {
      // Never authenticate/admit a pipelined request once shutdown starts.
      const problem = isShiftManagementRoute(request.url ?? "") ?
        shiftProblem(new ShiftManagementError({ status: 503, code: "DEPENDENCY_UNAVAILABLE",
          effect: "none", nextAction: "stop" }), randomUUID()) : isStageArrivalRoute(request.url ?? "")
        ? stageProblem(new StageArrivalError("DEPENDENCY_UNAVAILABLE"), randomUUID())
        : toProblem(new SliceError("DEPENDENCY_UNAVAILABLE"), randomUUID());
      response.setHeader("Connection", "close");
      send(response, problem.status, "application/problem+json; charset=utf-8", JSON.stringify(problem));
      request.resume(); return;
    }
    void lifecycle.run(() => handle(request, response)).catch(() => { response.destroy(); });
  });
  registerBackendLifecycle(server, lifecycle);
  server.on("clientError", (error, socket) => {
    // Never inject a "none" problem ahead of an earlier pipelined command's
    // response: that earlier command may already have installed an effect.
    if ((inFlight.get(socket) ?? 0) > 0) { socket.destroy(); return; }
    if (stageArrivalParserProblem(error, socket)) return;
    if (shiftManagementParserProblem(error, socket)) return;
    // Preserve native non-F1 parser rejection semantics. An incomplete/split
    // request-line is not assigned a fabricated business route or outcome.
    if (!socket.writable || socket.destroyed) { socket.destroy(); return; }
    const overflow = "code" in error && error.code === "HPE_HEADER_OVERFLOW";
    socket.end(overflow ? "HTTP/1.1 431 Request Header Fields Too Large\r\nConnection: close\r\n\r\n" :
      "HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n");
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
