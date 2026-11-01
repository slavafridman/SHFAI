import { Injectable } from '@angular/core';
import { id } from './contract';
import { exact } from './station-arrival-contract';
import { uuid } from './stage-arrival-contract';

/** UI quarantine, never authorization. Server's persistent employee fence is authoritative.
 * Only opaque UUIDs persist; unknown bindings after reload block ALL native writers,
 * even after source/actor/day/profile changes. No token/receipt/private fields. */
@Injectable({ providedIn: 'root' })
export class NativeCommandSession {
  private readonly attempts = new Map<string, string | null>();
  private readonly settled = new Set<string>();
  private readonly slot = 'shfNativeCommandSafety';
  // Cancellation must not undo an allowance consumed by ANY prior native writer.
  // Separate from old unresolved semantics; opaque markers only across reload.
  private readonly consumed = new Map<string, string | null>();
  private readonly consumedSlot = 'shfNativeConsumedSafety';
  constructor() {
    this.merge(history.state);
    try {
      const consumed = sessionStorage.getItem(this.consumedSlot);
      if (consumed !== null) this.readConsumed(JSON.parse(consumed));
      const raw = sessionStorage.getItem(this.slot);
      if (raw !== null) this.read(JSON.parse(raw));
      for (const [slot, kind] of [
        ['shfNativeArrivalSafety', 'stage-arrival'], ['shfNativeStationArrivalSafety', 'station-arrival'],
        ['shfNativeStationExitSafety', 'station-exit'],
      ]) {
        const previous = sessionStorage.getItem(slot);
        if (previous !== null) this.legacy(JSON.parse(previous), kind);
      }
      const management = sessionStorage.getItem('shfShiftManagementSafety');
      if (management !== null) this.read(JSON.parse(management));
    } catch { this.attempts.set(crypto.randomUUID(), null); }
  }
  private read(v: unknown) {
    if (!Array.isArray(v) || !v.length || !v.every(uuid)) {
      this.attempts.set(crypto.randomUUID(), null); return;
    }
    for (const attempt of v) if (!this.settled.has(attempt) && !this.attempts.has(attempt)) this.attempts.set(attempt, null);
  }
  merge(v: unknown) {
    if (v && typeof v === 'object' && 'shfNativeConsumedSafety' in v) this.readConsumed(v.shfNativeConsumedSafety);
    if (v && typeof v === 'object' && 'shfNativeCommandSafety' in v) this.read(v.shfNativeCommandSafety);
    if (!v || typeof v !== 'object') return;
    for (const [key, kind] of [
      ['shfNativeSafety', 'stage-arrival'], ['shfNativeStationSafety', 'station-arrival'],
      ['shfNativeStationExitSafety', 'station-exit'],
    ]) if (key in v) this.legacy(Reflect.get(v, key), kind);
    if ('shfManagementSafety' in v) this.read(v.shfManagementSafety);
  }
  private legacy(v: unknown, kind: string) {
    if (!Array.isArray(v) || !v.length || !v.every(m => exact(m, 'commandId kind mode') &&
      uuid(m.commandId) && m.kind === kind && m.mode === 'test-oracle-controlled')) {
      this.attempts.set(crypto.randomUUID(), null); return;
    }
    this.read(v.map(m => m.commandId));
  }
  marker() { return this.attempts.size ? { shfNativeCommandSafety: [...this.attempts.keys()] } : {}; }
  private readConsumed(v: unknown) {
    if (!Array.isArray(v) || !v.length || !v.every(uuid)) {
      this.consumed.set(crypto.randomUUID(), null); return;
    }
    for (const attempt of v) if (!this.consumed.has(attempt)) this.consumed.set(attempt, null);
  }
  cancellationUnavailable(employeeId: string | null) {
    return this.affectsEmployee(employeeId) ||
      [...this.consumed.values()].some(employee => !employee || !employeeId || employee === employeeId);
  }
  affectsEmployee(employeeId: string | null) {
    return [...this.attempts.values()].some(employee => !employee || !employeeId || employee === employeeId);
  }
  begin(employeeId: string, attempt: string) {
    if (!id(employeeId) || !uuid(attempt) || this.settled.has(attempt) || this.affectsEmployee(employeeId)) return false;
    this.attempts.set(attempt, employeeId);
    this.consumed.set(attempt, employeeId);
    try {
      sessionStorage.setItem(this.consumedSlot, JSON.stringify([...this.consumed.keys()]));
    } catch { return false; }
    try { this.persist(); return true; } catch { return false; }
  }
  resolve(employeeId: string, attempt: string) {
    if (this.attempts.get(attempt) !== employeeId) return false;
    this.attempts.delete(attempt);
    try { this.persist(); this.settled.add(attempt); return true; } catch {
      this.attempts.set(attempt, employeeId); return false;
    }
  }
  private persist() {
    if (this.attempts.size) sessionStorage.setItem(this.slot, JSON.stringify([...this.attempts.keys()]));
    else sessionStorage.removeItem(this.slot);
    const { shfNativeCommandSafety: ignored, ...state } = history.state ?? {};
    history.replaceState({ ...state, ...this.marker() }, '');
  }
}
