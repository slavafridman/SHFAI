import { fixtureIdentity } from './test-fixtures';
import { attendanceContextFixture } from './attendance-fixtures';

// Generated synthetic IDs, <=8 Unicode scalars. No Oracle records.
export const scopeIds = (count: number) =>
  Array.from({ length: count }, (_, i) => `אבגדהו${i.toString(36).padStart(2, '0')}`);
export function oracleReadIdentity(count = 1000) {
  const p = fixtureIdentity();
  p.dataSource = 'oracle';
  p.principal.resourceScope.orgUnitIds = scopeIds(count);
  return p;
}
export function oracleReadCatalog(count = 1000, distinctParents = false) {
  const c = attendanceContextFixture();
  c.dataSource = 'oracle-read-only';
  c.mokedOptions = (distinctParents ? scopeIds(count).map((_, i) => `P${String(i).padStart(4, '0')}`) : ['P0000'])
    .map(code => ({ code, label: `מוקד בדיקה ${code}`, unitType: 'G01' }));
  c.teamOptions = scopeIds(count).map((code, i) => ({
    code, label: `צוות בדיקה <תג> & "${i}"`, unitType: 'J01',
    parentMokedCode: c.mokedOptions[distinctParents ? i : 0].code,
  }));
  c.defaults.mokedCode = distinctParents ? null : 'P0000';
  return c;
}
