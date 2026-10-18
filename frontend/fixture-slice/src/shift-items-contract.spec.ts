import { describe, expect, it } from 'vitest';
import { fixtureIdentity } from './test-fixtures';
import { identity } from './contract';
import { itemsResponse, itemsProblem, itemsQuery } from './shift-items-contract';
import { fixtureItems } from './shift-items-fixtures';

describe('ITEMS canonical runtime boundary', () => {
  const request = { employeeId: '1001', shiftDayId: '2001', limit: 25, offset: 0 };
  it('accepts the approved fifth capability additively without breaking old sessions', () => {
    const p = fixtureIdentity();
    expect(identity(p)).toBe(true);
    p.principal.capabilities.push('shift-items:read');
    expect(identity(p)).toBe(true);
    p.principal.capabilities.push('shift-items:read');
    expect(identity(p)).toBe(false);
  });
  it('keeps signed precision, raw DEL, unknown labels, overnight seconds and nulls', () => {
    expect(itemsResponse(fixtureItems(), request, 'isolated-fixture')).toBe(true);
  });
  it('D03 rejects a self-parent hierarchy for both approved source pairs', () => {
    for (const source of ['isolated-fixture', 'oracle'] as const) {
      const v = fixtureItems(); v.shiftDay.dataSource = source;
      expect(itemsResponse(v, request, source)).toBe(true);
      v.displayContext.unit.moked.code = v.displayContext.unit.code;
      expect(itemsResponse(v, request, source)).toBe(false);
    }
  });
  it.each([
    (v: ReturnType<typeof fixtureItems>) => { v.shiftDay.employeeId = '1002'; },
    v => { v.shiftDay.shiftDayId = '2002'; },
    v => { v.shiftDay.dataSource = 'oracle'; },
    v => { v.displayContext.unit.code = 'OTHER'; },
    v => { v.items[0].startLocal = '2026-02-30T10:00:00'; },
    v => { v.items[0].key.startLocal = '2026-10-16T00:00:01'; },
    v => { v.items[0].durationMinutes = '-0'; },
    v => { v.items[0].durationMinutes = null as unknown as string; },
    v => { v.items[0].startLocal = null as unknown as string; },
    v => { v.items[1].breakExitLocal = '2026-10-16T01:00:00'; },
    v => { v.items[1].kind = 'break'; },
    v => { v.items[1].type!.code = '+1'; },
    v => { v.items[1].remark = ''; },
    v => { v.items[0].sourceCode = 'DEL\n'; },
    v => { v.items.push(structuredClone(v.items[0])); },
    v => { v.items.reverse(); },
    v => { v.page.nextOffset = 25; },
    v => { v.page.hasMore = true; },
  ] satisfies Array<(v: ReturnType<typeof fixtureItems>) => void>)('fails the entire response closed on malformed/mixed/mismatched data %#', mutate => {
    const v = fixtureItems(); mutate(v);
    expect(itemsResponse(v, request, 'isolated-fixture')).toBe(false);
  });
  it('accepts oracle detail marker, never oracle-read-only as nested marker', () => {
    const v = fixtureItems(); v.shiftDay.dataSource = 'oracle';
    expect(itemsResponse(v, request, 'oracle')).toBe(true);
    expect(itemsResponse(v, request, 'isolated-fixture')).toBe(false);
    v.shiftDay.dataSource = 'oracle-read-only' as never;
    expect(itemsResponse(v, request, 'oracle')).toBe(false);
  });
  it('validates only the exact query grammar, including decoded duplicates', () => {
    expect(itemsQuery('')).toEqual({ limit: 25, offset: 0, sort: 'start-asc' });
    expect(itemsQuery('limit=100&offset=10000&sort=start-asc')?.offset).toBe(10000);
    for (const q of ['limit=01', 'limit=0', 'offset=-1', 'offset=10001', 'sort=other',
      'kind=break', 'limit=25&%6cimit=25', 'offset=', 'query=' + 'x'.repeat(8192)])
      expect(itemsQuery(q)).toBeNull();
  });
  it('keeps resource-specific ambiguity and invalid parameter allowlists', () => {
    const p = { type: 'urn:shf:problem:AMBIGUOUS_SHIFT_ITEMS', title: 'Synthetic',
      status: 500, code: 'AMBIGUOUS_SHIFT_ITEMS', requestId: 'synthetic-1' };
    expect(itemsProblem(p, 500)).toBe(true);
    expect(itemsProblem({ ...p, status: 409 }, 409)).toBe(false);
    const bad = { ...p, invalidParameters: [{ name: 'employeeName', reason: 'unsupported' }] };
    expect(itemsProblem(bad, 500)).toBe(false);
  });
});
