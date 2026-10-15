import { describe, expect, it } from 'vitest';
import { detail, displayTime, id, localTime, identity } from './contract';
import { fixtureIdentity, fixtureRow } from './test-fixtures';

describe('UI02-02/07/10 wire boundary', () => {
  it('preserves canonical decimal strings without trimming or numeric coercion', () => {
    for (const bad of ['', ' ', '01', '+1', '-1', '1e2', '١', '１', '1 ', '1'.repeat(39)]) {
      expect(id(bad), bad).toBe(false);
    }
    expect(id('9'.repeat(38))).toBe(true);
    expect(id('9'.repeat(10), 10)).toBe(true);
    expect(id('9'.repeat(11), 10)).toBe(false);
  });
  it('preserves local seconds and both dates without timezone conversion', () => {
    expect(localTime('2024-02-29T23:30:00')).toBe(true);
    expect(localTime('2026-02-29T23:30:00')).toBe(false);
    expect(localTime('0000-01-01T00:00:00')).toBe(false);
    expect(localTime('2026-10-15T23:30:00Z')).toBe(false);
    expect(displayTime('2026-10-15T23:30:00')).toBe('15/10/2026 23:30:00');
    expect(displayTime('2026-10-16T07:00:00')).toBe('16/10/2026 07:00:00');
    expect(displayTime(null)).toBe('לא זמין');
  });
  it('rejects absent fields and mismatched responses', () => {
    expect(detail({}, '1001', '2001')).toBe(false);
    expect(detail(null, '1001', '2001')).toBe(false);
  });
  it('approved identity has both capabilities; Oracle detail must match the verified identity source', () => {
    const principal = fixtureIdentity();
    expect(identity(principal)).toBe(true);
    principal.principal.capabilities = ['shift-day:read'];
    expect(identity(principal)).toBe(false);
    principal.principal.capabilities = ['shift-day:read', 'current-shifts:read'];
    principal.dataSource = 'oracle';
    expect(identity(principal)).toBe(true);
    const row = fixtureRow(); row.dataSource = 'oracle';
    expect(detail(row, '1001', '2001', 'oracle')).toBe(true);
    expect(detail(row, '1001', '2001', 'isolated-fixture')).toBe(false);
  });
});
