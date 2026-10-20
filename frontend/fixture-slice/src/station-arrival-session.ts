import { Injectable } from '@angular/core';
import { uuid, type ArrivalSelection } from './stage-arrival-contract';

/** Opaque F2 safety only. Never serialize actor/tuple, tokens, reasons or receipt.
 * A reload has no binding evidence, so an unresolved marker stops fixture work.
 * In this document only the dependent tuple is blocked, not unrelated workers. */
@Injectable({ providedIn: 'root' })
export class StationArrivalSession {
  selection: ArrivalSelection | null = null;
  private readonly unresolved = new Set<string>();
  private readonly bindings = new Map<string, string>();
  private readonly settled = new Set<string>();
  private readonly terminals = new Set<string>();
  private readonly slot = 'shfStationArrivalSafety';
  constructor() {
    this.merge(history.state);
    try {
      const raw = sessionStorage.getItem(this.slot);
      if (raw !== null) {
        const list: unknown = JSON.parse(raw);
        if (!Array.isArray(list) || !list.length || !list.every(uuid)) throw Error('Invalid F2 safety');
        this.merge({ shfF2Safety: list });
      }
    } catch { this.unresolved.add(crypto.randomUUID()); }
  }
  merge(state: unknown) {
    if (state && typeof state === 'object' && 'shfF2Safety' in state && Array.isArray(state.shfF2Safety))
      for (const item of state.shfF2Safety) if (uuid(item) && !this.settled.has(item)) this.unresolved.add(item);
  }
  marker() { return this.unresolved.size ? { shfF2Safety: [...this.unresolved] } : {}; }
  uncertain() { return this.unresolved.size > 0; }
  affects(s: ArrivalSelection | null) {
    return !!s && s.dataSource === 'isolated-fixture' && [...this.unresolved].some(attempt =>
      !this.bindings.has(attempt) || this.bindings.get(attempt) === this.key(s));
  }
  recorded(s: ArrivalSelection) { return this.terminals.has(this.key(s)); }
  blocked(s: ArrivalSelection | null) { return s ? this.affects(s) || this.recorded(s) : this.uncertain(); }
  begin(s: ArrivalSelection, attempt: string) {
    if (s.dataSource !== 'isolated-fixture' || !uuid(attempt) || this.blocked(s) || this.settled.has(attempt)) return false;
    this.unresolved.add(attempt); this.bindings.set(attempt, this.key(s));
    try { this.persist(); return true; } catch {
      // No dispatch; retain conservative marker if either write succeeded.
      return false;
    }
  }
  private persist() {
    if (this.unresolved.size) sessionStorage.setItem(this.slot, JSON.stringify([...this.unresolved]));
    else sessionStorage.removeItem(this.slot);
    const { shfF2Safety: ignored, ...state } = history.state ?? {};
    history.replaceState({ ...state, ...this.marker() }, '');
  }
  resolve(s: ArrivalSelection, attempt: string, committed = true) {
    if (!this.unresolved.has(attempt) || this.bindings.get(attempt) !== this.key(s)) return false;
    this.unresolved.delete(attempt);
    try {
      this.persist(); this.settled.add(attempt);
      if (committed) this.terminals.add(this.key(s));
      return true;
    } catch { this.unresolved.add(attempt); return false; }
  }
  private key(s: ArrivalSelection) {
    // Different actor/provider/source must not make the same unresolved row safe.
    return JSON.stringify([s.dataSource, s.employeeId, s.shiftDayId, s.orgUnitId]);
  }
}
