import { Injectable } from '@angular/core';
import { uuid, type ArrivalSelection } from './stage-arrival-contract';

/** Volatile selection and conservative uncertainty guard. No receipt/token cache.
 * After reload opaque markers deliberately block ALL F1 selections: no personal
 * tuple/actor values need be persisted to protect the unresolved same tuple. */
@Injectable({ providedIn: 'root' })
export class StageArrivalSession {
  selection: ArrivalSelection | null = null;
  private readonly unresolved = new Set<string>();
  private readonly terminal = new Set<string>();
  constructor() { this.merge(history.state); }
  merge(state: unknown) {
    if (state && typeof state === 'object' && 'shfF1Safety' in state) {
      const list = state.shfF1Safety;
      if (Array.isArray(list)) for (const item of list) if (uuid(item)) this.unresolved.add(item);
    }
  }
  persist() {
    if (this.unresolved.size) history.replaceState({ ...history.state,
      shfF1Safety: [...this.unresolved] }, '');
  }
  marker() { return this.unresolved.size ? { shfF1Safety: [...this.unresolved] } : {}; }
  uncertain() { return this.unresolved.size > 0; }
  recorded(s: ArrivalSelection) { return this.terminal.has(this.key(s)); }
  blocked(s?: ArrivalSelection | null) { return this.unresolved.size > 0 || !!s && this.terminal.has(this.key(s)); }
  begin(s: ArrivalSelection, attempt: string) {
    if (this.blocked(s)) return false;
    this.unresolved.add(attempt);
    try { this.persist(); return true; } catch { this.unresolved.delete(attempt); return false; }
  }
  resolve(s: ArrivalSelection, attempt: string, committed = true) {
    if (committed) this.terminal.add(this.key(s));
    this.unresolved.delete(attempt);
    // Update current entry only. Older unresolved entries remain conservative.
    const { shfF1Safety: ignored, ...state } = history.state ?? {};
    history.replaceState({ ...state, ...this.marker() }, '');
  }
  private key(s: ArrivalSelection) { return JSON.stringify([s.dataSource, s.actor, s.employeeId, s.shiftDayId, s.orgUnitId]); }
}
