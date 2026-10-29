import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ShiftManagementSession } from './shift-management-session';
describe('M3 one employee safety namespace (not authorization)', () => {
  beforeEach(() => { history.replaceState({}, ''); sessionStorage.clear(); TestBed.configureTestingModule({}); });
  afterEach(() => { vi.restoreAllMocks(); history.replaceState({}, ''); sessionStorage.clear(); });
  it('quarantines the employee across operations and actor/source/unit binding drift', () => {
    const s = TestBed.inject(ShiftManagementSession), id = crypto.randomUUID();
    expect(s.begin('9001', 'actor/source/unit/create/ref', id)).toBe(true);
    expect(s.affectsEmployee('9001')).toBe(true); expect(s.affectsEmployee('9002')).toBe(false);
    expect(s.begin('9001', 'other actor/csv/new-source', crypto.randomUUID())).toBe(false);
    expect(s.resolve('9001', 'other actor/csv/new-source', id)).toBe(false);
    expect(s.affectsEmployee('9001')).toBe(true);
  });
  it('persists only opaque markers and blocks every employee after reload', () => {
    const s = TestBed.inject(ShiftManagementSession), id = crypto.randomUUID();
    s.begin('9001', 'sensitive-binding-token', id);
    expect(sessionStorage.getItem('shfShiftManagementSafety')).toBe(JSON.stringify([id]));
    expect(JSON.stringify(history.state)).not.toContain('9001');
    expect(JSON.stringify(history.state)).not.toContain('sensitive-binding-token');
    const reload = new ShiftManagementSession();
    expect(reload.affectsEmployee('9002')).toBe(true);
    expect(reload.resolve('9001', 'sensitive-binding-token', id)).toBe(false);
  });
  it('clears only a proven same-bound outcome and does not restore settled authority via Back', () => {
    const s = TestBed.inject(ShiftManagementSession), id = crypto.randomUUID();
    s.begin('9001', 'b', id); const stale = s.marker();
    expect(s.resolve('9001', 'b', id)).toBe(true);
    s.merge(stale); expect(s.affectsEmployee('9001')).toBe(false);
    expect(s.begin('9001', 'b', id)).toBe(false);
  });
  it('corrupt/unavailable safety storage fails closed', () => {
    sessionStorage.setItem('shfShiftManagementSafety', '{"bad":true}');
    expect(new ShiftManagementSession().affectsEmployee('9001')).toBe(true);
    sessionStorage.clear();
    const s = TestBed.inject(ShiftManagementSession);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw Error('unavailable'); });
    expect(s.begin('9001', 'b', crypto.randomUUID())).toBe(false);
    expect(s.affectsEmployee('9001')).toBe(true);
  });
});
