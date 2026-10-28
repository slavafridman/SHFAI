import { Injectable } from '@angular/core';
import { uuid, type ArrivalSelection } from './stage-arrival-contract';

/** Opaque F2 safety only. Never serialize actor/tuple, tokens, reasons or receipt.
 * A reload has no binding evidence, so an unresolved marker stops fixture work.
 * In this document only the dependent tuple is blocked, not unrelated workers. */
@Injectable({ providedIn: 'root' })
export class StationArrivalSession {
  selection: ArrivalSelection | null = null;
  private readonly unresolved = new Set<string>();
  private readonly native = new Set<string>();
  private readonly bindings = new Map<string, string>();
  private readonly settled = new Set<string>();
  private readonly terminals = new Set<string>();
  private readonly slot = 'shfStationArrivalSafety';
  private readonly nativeSlot = 'shfNativeStationArrivalSafety';
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
    try {
      const raw = sessionStorage.getItem(this.nativeSlot);
      if (raw !== null) {
        const list: unknown = JSON.parse(raw);
        if (!Array.isArray(list) || !list.length || !list.every(item =>
          item?.kind === 'station-arrival' && item?.mode === 'test-oracle-controlled' && uuid(item.commandId)))
          throw Error('Invalid native F2 safety');
        this.merge({ shfNativeStationSafety: list });
      }
    } catch { const attempt = crypto.randomUUID(); this.native.add(attempt); this.unresolved.add(attempt); }
  }
  merge(state: unknown) {
    if (state && typeof state === 'object' && 'shfF2Safety' in state && Array.isArray(state.shfF2Safety))
      for (const item of state.shfF2Safety) if (uuid(item) && !this.settled.has(item)) this.unresolved.add(item);
    if (state && typeof state === 'object' && 'shfNativeStationSafety' in state && Array.isArray(state.shfNativeStationSafety))
      for (const item of state.shfNativeStationSafety) if (item?.kind === 'station-arrival' &&
        item?.mode === 'test-oracle-controlled' && uuid(item.commandId) && !this.settled.has(item.commandId)) {
        this.native.add(item.commandId); this.unresolved.add(item.commandId);
      }
  }
  marker() {
    const fixture = [...this.unresolved].filter(id => !this.native.has(id));
    return { ...(fixture.length ? { shfF2Safety: fixture } : {}),
      ...(this.native.size ? { shfNativeStationSafety: [...this.native].map(commandId =>
        ({ commandId, kind: 'station-arrival', mode: 'test-oracle-controlled' })) } : {}) };
  }
  uncertain() { return this.unresolved.size > 0; }
  affects(s: ArrivalSelection | null) {
    return !!s && [...this.unresolved].some(attempt =>
      !this.bindings.has(attempt) || this.bindings.get(attempt) === this.key(s));
  }
  recorded(s: ArrivalSelection) { return this.terminals.has(this.key(s)); }
  blocked(s: ArrivalSelection | null) { return s ? this.affects(s) || this.recorded(s) : this.uncertain(); }
  begin(s: ArrivalSelection, attempt: string) {
    if (!['isolated-fixture', 'oracle-test'].includes(s.dataSource) || !uuid(attempt) || this.blocked(s) || this.settled.has(attempt)) return false;
    this.unresolved.add(attempt); this.bindings.set(attempt, this.key(s));
    if (s.dataSource === 'oracle-test') this.native.add(attempt);
    try { this.persist(); return true; } catch {
      // No dispatch; retain conservative marker if either write succeeded.
      return false;
    }
  }
  private persist() {
    const fixture = [...this.unresolved].filter(id => !this.native.has(id));
    if (fixture.length) sessionStorage.setItem(this.slot, JSON.stringify(fixture));
    else sessionStorage.removeItem(this.slot);
    if (this.native.size) sessionStorage.setItem(this.nativeSlot, JSON.stringify(this.marker().shfNativeStationSafety));
    else sessionStorage.removeItem(this.nativeSlot);
    const { shfF2Safety: ignored, shfNativeStationSafety: ignoredNative, ...state } = history.state ?? {};
    history.replaceState({ ...state, ...this.marker() }, '');
  }
  resolve(s: ArrivalSelection, attempt: string, committed = true) {
    if (!this.unresolved.has(attempt) || this.bindings.get(attempt) !== this.key(s) ||
      this.native.has(attempt) !== (s.dataSource === 'oracle-test')) return false;
    this.unresolved.delete(attempt);
    this.native.delete(attempt);
    try {
      this.persist(); this.settled.add(attempt);
      if (committed) this.terminals.add(this.key(s));
      return true;
    } catch {
      this.unresolved.add(attempt); if (s.dataSource === 'oracle-test') this.native.add(attempt);
      try { this.persist(); } catch { /* In-memory block is retained. */ }
      return false;
    }
  }
  private key(s: ArrivalSelection) {
    // Source-specific namespace; actor/grant/unit drift cannot make an
    // unresolved native employee/day safe. No attribution is inferred.
    return JSON.stringify(s.dataSource === 'oracle-test' ? [s.dataSource, s.employeeId, s.shiftDayId] :
      [s.dataSource, s.employeeId, s.shiftDayId, s.orgUnitId]);
  }
}
