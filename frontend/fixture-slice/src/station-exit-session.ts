import { Injectable } from '@angular/core';
import { uuid, type ArrivalSelection } from './stage-arrival-contract';

/** Separate exit namespace. Only opaque attempts survive reload; no token,
 * tuple, identity, draft, receipt or authority is restored. Unknown bindings
 * block all work after reload. Source/actor/unit changes cannot escape a tuple. */
@Injectable({ providedIn: 'root' })
export class StationExitSession {
  selection: ArrivalSelection | null = null;
  private readonly unresolved = new Set<string>();
  private readonly bindings = new Map<string, string>();
  private readonly settled = new Set<string>();
  private readonly terminals = new Set<string>();
  private readonly slot = 'shfNativeStationExitSafety';
  constructor() {
    this.merge(history.state);
    try {
      const raw = sessionStorage.getItem(this.slot);
      if (raw !== null) {
        const list: unknown = JSON.parse(raw);
        if (!Array.isArray(list) || !list.length || !list.every(item => this.valid(item)))
          throw Error('Invalid exit safety');
        this.merge({ shfNativeStationExitSafety: list });
      }
    } catch { this.unresolved.add(crypto.randomUUID()); }
  }
  private valid(item: unknown): item is { commandId: string; kind: string; mode: string } {
    return !!item && typeof item === 'object' && 'commandId' in item && uuid(item.commandId) &&
      'kind' in item && item.kind === 'station-exit' && 'mode' in item && item.mode === 'test-oracle-controlled';
  }
  merge(state: unknown) {
    if (!state || typeof state !== 'object' || !('shfNativeStationExitSafety' in state)) return;
    const list = state.shfNativeStationExitSafety;
    if (!Array.isArray(list) || !list.length || !list.every(item => this.valid(item))) {
      this.unresolved.add(crypto.randomUUID()); return;
    }
    for (const item of list) if (!this.settled.has(item.commandId)) this.unresolved.add(item.commandId);
  }
  marker() {
    return this.unresolved.size ? { shfNativeStationExitSafety: [...this.unresolved].map(commandId =>
      ({ commandId, kind: 'station-exit', mode: 'test-oracle-controlled' })) } : {};
  }
  uncertain() { return this.unresolved.size > 0; }
  affects(s: ArrivalSelection | null) {
    return [...this.unresolved].some(attempt => !s || !this.bindings.has(attempt) || this.bindings.get(attempt) === this.key(s));
  }
  recorded(s: ArrivalSelection) { return this.terminals.has(this.key(s)); }
  blocked(s: ArrivalSelection | null) { return this.affects(s) || !!s && this.recorded(s); }
  begin(s: ArrivalSelection, attempt: string) {
    if (s.dataSource !== 'oracle-test' || !uuid(attempt) || this.blocked(s) || this.settled.has(attempt)) return false;
    this.unresolved.add(attempt); this.bindings.set(attempt, this.key(s));
    try { this.persist(); return true; } catch { return false; } // no dispatch, conservative marker
  }
  private persist() {
    if (this.unresolved.size) sessionStorage.setItem(this.slot, JSON.stringify(this.marker().shfNativeStationExitSafety));
    else sessionStorage.removeItem(this.slot);
    const { shfNativeStationExitSafety: ignored, ...state } = history.state ?? {};
    history.replaceState({ ...state, ...this.marker() }, '');
  }
  resolve(s: ArrivalSelection, attempt: string, committed = true) {
    if (s.dataSource !== 'oracle-test' || !this.unresolved.has(attempt) || this.bindings.get(attempt) !== this.key(s)) return false;
    this.unresolved.delete(attempt);
    try {
      this.persist(); this.settled.add(attempt);
      if (committed) this.terminals.add(this.key(s));
      return true;
    } catch {
      this.unresolved.add(attempt);
      try { this.persist(); } catch { /* In-memory block retained. */ }
      return false;
    }
  }
  private key(s: ArrivalSelection) { return JSON.stringify([s.employeeId, s.shiftDayId]); }
}
