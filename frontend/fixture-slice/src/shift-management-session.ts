import { Injectable } from '@angular/core';
import { commandId } from './shift-management-contract';

/** One UI safety namespace across all management flows, NOT server authority.
 * Only opaque attempt IDs survive reload. Unknown bindings block all employees.
 * Employee/actor/reference bindings, tokens, CSV and receipts never persist. */
@Injectable({ providedIn: 'root' })
export class ShiftManagementSession {
  private readonly attempts = new Map<string, { employeeId: string; binding: string } | null>();
  private readonly settled = new Set<string>();
  private readonly slot = 'shfShiftManagementSafety';
  constructor() {
    this.merge(history.state);
    try {
      const raw = sessionStorage.getItem(this.slot);
      if (raw !== null) this.read(JSON.parse(raw));
    } catch { this.attempts.set(crypto.randomUUID(), null); }
  }
  private read(list: unknown) {
    if (!Array.isArray(list) || !list.length || !list.every(commandId)) {
      this.attempts.set(crypto.randomUUID(), null); return;
    }
    for (const id of list) if (!this.settled.has(id) && !this.attempts.has(id)) this.attempts.set(id, null);
  }
  merge(state: unknown) {
    if (state && typeof state === 'object' && 'shfManagementSafety' in state) this.read(state.shfManagementSafety);
  }
  marker() { return this.attempts.size ? { shfManagementSafety: [...this.attempts.keys()] } : {}; }
  affectsEmployee(employeeId: string | null) {
    return [...this.attempts.values()].some(b => !b || !employeeId || b.employeeId === employeeId);
  }
  begin(employeeId: string, binding: string, id: string) {
    if (!commandId(id) || this.settled.has(id) || this.affectsEmployee(employeeId)) return false;
    this.attempts.set(id, { employeeId, binding });
    try { this.persist(); return true; } catch { return false; }
  }
  resolve(employeeId: string, binding: string, id: string) {
    const b = this.attempts.get(id);
    if (!b || b.employeeId !== employeeId || b.binding !== binding) return false;
    this.attempts.delete(id);
    try { this.persist(); this.settled.add(id); return true; } catch {
      this.attempts.set(id, b);
      try { this.persist(); } catch { /* Retain conservative in-memory quarantine. */ }
      return false;
    }
  }
  private persist() {
    if (this.attempts.size) sessionStorage.setItem(this.slot, JSON.stringify([...this.attempts.keys()]));
    else sessionStorage.removeItem(this.slot);
    const { shfManagementSafety: ignored, ...state } = history.state ?? {};
    history.replaceState({ ...state, ...this.marker() }, '');
  }
}
