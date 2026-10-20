import { AsyncLocalStorage } from "node:async_hooks";
import type { Server } from "node:http";
import { SliceError } from "./errors.mts";

// Internal ownership only: no HTTP/configuration/shared DTO contract changes.
const context = new AsyncLocalStorage<BackendLifecycle>();
const servers = new WeakMap<Server, BackendLifecycle>();
export class BackendLifecycle {
  private readonly abort = new AbortController();
  private readonly work = new Set<Promise<unknown>>();
  private readonly cancellations = new Set<AbortController>();
  get stopping() { return this.abort.signal.aborted; }
  get signal() { return this.abort.signal; }
  track<T>(promise: Promise<T>): Promise<T> {
    this.work.add(promise);
    // Both handlers consume the bookkeeping continuation's outcome. Never use
    // an ignored rejecting finally(), or treat HTTP timeout as native settlement.
    void promise.then(() => { this.work.delete(promise); }, () => { this.work.delete(promise); });
    return promise;
  }
  run<T>(work: () => Promise<T>): Promise<T> {
    if (this.stopping) return Promise.reject(new SliceError("DEPENDENCY_UNAVAILABLE"));
    return this.track(context.run(this, work));
  }
  link(controller: AbortController) {
    if (this.stopping) controller.abort(); else this.cancellations.add(controller);
    return () => { this.cancellations.delete(controller); };
  }
  beginShutdown() {
    this.abort.abort();
    for (const controller of this.cancellations) controller.abort();
    this.cancellations.clear();
  }
  async drain() {
    // Admission is closed first. Already owned work may register nested work
    // during cleanup, so drain to a fixed point rather than one old snapshot.
    while (this.work.size) await Promise.allSettled([...this.work]);
  }
}
export function registerBackendLifecycle(server: Server, lifecycle: BackendLifecycle) { servers.set(server, lifecycle); }
export function backendLifecycle(server: Server) { return servers.get(server); }
export function trackBackendWork<T>(promise: Promise<T>) { return context.getStore()?.track(promise) ?? promise; }
export function linkBackendShutdown(controller: AbortController) {
  return context.getStore()?.link(controller) ?? (() => {});
}
export const BACKEND_DRAIN_WAIT_MS = 6000;
export class BackendDrainPendingError extends Error {
  constructor() { super("Backend shutdown remains pending; native work is not force-released"); }
}
export function waitForBackendDrain(completion: Promise<void>, milliseconds = BACKEND_DRAIN_WAIT_MS) {
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new BackendDrainPendingError()), milliseconds);
    void completion.then(() => { clearTimeout(timer); resolve(); }, e => { clearTimeout(timer); reject(e); });
  });
}
