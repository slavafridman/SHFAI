import { Injectable } from '@angular/core';
import { uuid, type ArrivalSelection } from './stage-arrival-contract';

/** Volatile selection and conservative uncertainty guard. No receipt/token cache.
 * After reload opaque markers deliberately block ALL F1 selections: no personal
 * tuple/actor values need be persisted to protect the unresolved same tuple.
 * Native uses the SAME opaque marker in sessionStorage as well: changing the
 * server's source and loading a new document must not discard an active TEST
 * attempt. No personal data/token/receipt, no reset UI or authority claim. */
@Injectable({ providedIn: 'root' })
export class StageArrivalSession {
  selection: ArrivalSelection | null = null;
  private readonly unresolved = new Set<string>();
  private readonly native = new Set<string>();
  private readonly attemptBindings = new Map<string, string>();
  private readonly terminal = new Set<string>();
  private readonly nativeSlot = 'shfNativeArrivalSafety';
  private readonly fixtureSlot = 'shfStageArrivalSafety';
  private readonly settled = new Set<string>();
  constructor() {
    this.merge(history.state);
    try {
      const raw = sessionStorage.getItem(this.fixtureSlot);
      if (raw !== null) {
        const list: unknown = JSON.parse(raw);
        if (!Array.isArray(list) || !list.length || !list.every(uuid)) throw Error('Invalid F1 safety');
        this.merge({ shfF1Safety: list });
      }
    } catch { this.unresolved.add(crypto.randomUUID()); }
    try {
      const raw = sessionStorage.getItem(this.nativeSlot);
      if (raw !== null) {
        const list: unknown = JSON.parse(raw);
        if (!Array.isArray(list) || !list.length || !list.every(item =>
          item?.kind === 'stage-arrival' && item?.mode === 'test-oracle-controlled' && uuid(item.commandId)))
          throw Error('Invalid native safety marker');
        this.merge({ shfNativeSafety: list });
      }
    } catch {
      // Unreadable/corrupt safety is not evidence of zero effects.
      const opaque = crypto.randomUUID(); this.native.add(opaque); this.unresolved.add(opaque);
    }
  }
  merge(state: unknown) {
    if (state && typeof state === 'object' && 'shfF1Safety' in state) {
      const list = state.shfF1Safety;
      if (Array.isArray(list)) for (const item of list) if (uuid(item) && !this.settled.has(item)) this.unresolved.add(item);
    }
    if (state && typeof state === 'object' && 'shfNativeSafety' in state) {
      const list = state.shfNativeSafety;
      if (Array.isArray(list)) for (const item of list) {
        if (item?.kind === 'stage-arrival' && item?.mode === 'test-oracle-controlled' && uuid(item.commandId)) {
          this.native.add(item.commandId); this.unresolved.add(item.commandId);
        }
      }
    }
  }
  persist() {
    const fixture = [...this.unresolved].filter(id => !this.native.has(id));
    if (fixture.length) sessionStorage.setItem(this.fixtureSlot, JSON.stringify(fixture));
    if (this.native.size) sessionStorage.setItem(this.nativeSlot, JSON.stringify(this.marker().shfNativeSafety));
    if (this.unresolved.size) history.replaceState({ ...history.state, ...this.marker() }, '');
  }
  marker() {
    const fixture = [...this.unresolved].filter(id => !this.native.has(id));
    return { ...(fixture.length ? { shfF1Safety: fixture } : {}),
      ...(this.native.size ? { shfNativeSafety: [...this.native].map(commandId =>
        ({ commandId, kind: 'stage-arrival', mode: 'test-oracle-controlled' })) } : {}) };
  }
  uncertain() { return this.unresolved.size > 0; }
  affectsEmployee(employeeId: string | null) {
    return [...this.unresolved].some(attempt => {
      const raw = this.attemptBindings.get(attempt);
      if (!raw || !employeeId) return true;
      const b: string[] = JSON.parse(raw);
      return b[b[0] === 'oracle-test' ? 1 : 2] === employeeId;
    });
  }
  nativeUncertain() { return this.native.size > 0; }
  crossAffects(s: ArrivalSelection | null) {
    return [...this.unresolved].some(attempt => {
      const raw = this.attemptBindings.get(attempt);
      if (!s || !raw) return true;
      const b: string[] = JSON.parse(raw);
      return b[0] === 'oracle-test' ? b[1] === s.employeeId && b[2] === s.shiftDayId :
        b[2] === s.employeeId && b[3] === s.shiftDayId;
    });
  }
  affects(s: ArrivalSelection | null) {
    return !!s && [...this.unresolved].some(attempt =>
      !this.attemptBindings.has(attempt) || (() => {
        const binding: string[] = JSON.parse(this.attemptBindings.get(attempt)!);
        if (binding[0] === 'oracle-test') return s.dataSource === 'oracle-test' &&
          binding[1] === s.employeeId && binding[2] === s.shiftDayId;
        return binding[0] === s.dataSource && binding[2] === s.employeeId &&
          binding[3] === s.shiftDayId && binding[4] === s.orgUnitId;
      })());
  }
  recorded(s: ArrivalSelection) { return this.terminal.has(this.key(s)); }
  blocked(s?: ArrivalSelection | null) { return this.unresolved.size > 0 || !!s && this.terminal.has(this.key(s)); }
  begin(s: ArrivalSelection, attempt: string) {
    if (!uuid(attempt) || this.blocked(s)) return false;
    this.unresolved.add(attempt);
    this.attemptBindings.set(attempt, this.key(s));
    if (s.dataSource === 'oracle-test') this.native.add(attempt);
    try { this.persist(); return true; } catch {
      // No POST was initiated. Keep any successfully persisted native marker
      // conservative rather than pretending browser persistence is atomic.
      if (s.dataSource !== 'oracle-test') this.unresolved.delete(attempt);
      return false;
    }
  }
  resolve(s: ArrivalSelection, attempt: string, committed = true) {
    if (!this.unresolved.has(attempt) || this.attemptBindings.get(attempt) !== this.key(s) ||
      this.native.has(attempt) !== (s.dataSource === 'oracle-test')) return false;
    this.unresolved.delete(attempt);
    this.native.delete(attempt);
    try {
      // Update current entry only. Older unresolved entries remain conservative.
      const { shfF1Safety: ignored, shfNativeSafety: ignoredNative, ...state } = history.state ?? {};
      history.replaceState({ ...state, ...this.marker() }, '');
      const fixture = [...this.unresolved].filter(id => !this.native.has(id));
      if (fixture.length) sessionStorage.setItem(this.fixtureSlot, JSON.stringify(fixture));
      else sessionStorage.removeItem(this.fixtureSlot);
      if (s.dataSource === 'oracle-test') {
        if (this.native.size) sessionStorage.setItem(this.nativeSlot, JSON.stringify(this.marker().shfNativeSafety));
        else sessionStorage.removeItem(this.nativeSlot);
      }
      if (committed) this.terminal.add(this.key(s));
      this.settled.add(attempt);
      this.attemptBindings.delete(attempt);
      return true;
    } catch {
      this.unresolved.add(attempt);
      if (s.dataSource === 'oracle-test') this.native.add(attempt);
      try { this.persist(); } catch { /* Retain in-memory block regardless. */ }
      return false;
    }
  }
  private key(s: ArrivalSelection) {
    return JSON.stringify(s.dataSource === 'oracle-test' ? [s.dataSource, s.employeeId, s.shiftDayId] :
      [s.dataSource, s.actor, s.employeeId, s.shiftDayId, s.orgUnitId]);
  }
}
