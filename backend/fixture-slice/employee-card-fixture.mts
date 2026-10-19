import type { EmployeeOperationalCardReadPort, EmployeeOperationalCardReadSelection,
  EmployeeOperationalCardReadResult } from "./employee-card-contracts.mts";
import { record } from "./contract-validation.mts";
import { cardLabel, cardSourceFailure, numericCardCode, projectEmployeeCardRow } from "./read-employee-card.mts";
import { mokedOption, plainLabel, unitCode } from "./current-shifts-validation.mts";

export interface EmployeeCardFixtureData {
  employees: Array<{ employeeId: string; firstName: string; lastName: string;
    orgUnitId: string | null; jobCode: string | null | 0; innerJobCode: string | null | 0 }>;
  units: Array<{ code: string; label: string; unitType: string; parentCode: string | null }>;
  // Synthetic catalog source pairs, already grouped as the Oracle active-job SQL.
  // No status/HR fields in selected employee fixtures.
  activeJobPairs: Array<{ code: string; label: string | null }>;
  innerJobs: Array<{ code: string; label: string | null }>;
}
// Isolated synthetic test double, never an Oracle-error fallback.
export class EmployeeCardFixtureReader implements EmployeeOperationalCardReadPort {
  readonly dataSource = "isolated-fixture" as const;
  private readonly snapshot: EmployeeCardFixtureData;
  constructor(input: unknown, startupTeamIds?: readonly string[]) {
    if (!record(input) || !Array.isArray(input.employees) || !Array.isArray(input.units) ||
        !Array.isArray(input.activeJobPairs) || !Array.isArray(input.innerJobs) ||
        input.employees.length > 100 || input.units.length > 200 ||
        input.activeJobPairs.length > 200 || input.innerJobs.length > 200) cardSourceFailure();
    // Explicit ingress copy: unknown source fields are neither retained nor published.
    const rows = (v: unknown): Record<string, unknown> => record(v) ? v : cardSourceFailure();
    const str = (v: unknown): string => typeof v === "string" ? v : cardSourceFailure();
    const nullable = (v: unknown): string | null => v === null ? null : str(v);
    const code = (v: unknown): string | null | 0 => v === 0 ? 0 : nullable(v);
    this.snapshot = structuredClone({
      employees: input.employees.map(v => { const r = rows(v); return {
        employeeId: str(r.employeeId), firstName: str(r.firstName), lastName: str(r.lastName),
        orgUnitId: nullable(r.orgUnitId), jobCode: code(r.jobCode), innerJobCode: code(r.innerJobCode) }; }),
      units: input.units.map(v => { const r = rows(v); return {
        code: str(r.code), label: str(r.label), unitType: str(r.unitType), parentCode: nullable(r.parentCode) }; }),
      activeJobPairs: input.activeJobPairs.map(v => { const r = rows(v); return { code: str(r.code), label: nullable(r.label) }; }),
      innerJobs: input.innerJobs.map(v => { const r = rows(v); return { code: str(r.code), label: nullable(r.label) }; }),
    });
    if (startupTeamIds) this.teamsForScope(startupTeamIds);
  }
  async read(selection: EmployeeOperationalCardReadSelection, signal?: AbortSignal): Promise<EmployeeOperationalCardReadResult> {
    signal?.throwIfAborted();
    const { employeeId, exactTeamIds } = selection;
    const rows = this.snapshot.employees.filter(e => e.employeeId === employeeId).slice(0, 2);
    if (!rows.length || rows.some(e => e.orgUnitId === null || !exactTeamIds.includes(e.orgUnitId)))
      return { kind: "not-found" };
    if (rows.length > 1) return { kind: "ambiguous-employee" };
    const teams = this.teamsForScope(exactTeamIds);
    const e = rows[0], unit = teams.find(t => t.code === e.orgUnitId);
    if (!unit) cardSourceFailure();
    const lookup = (value: unknown, job: boolean) => {
      const code = numericCardCode(value);
      if (code === null) return null;
      const matches = (job && code.startsWith("-") ? [] :
        (job ? this.snapshot.activeJobPairs : this.snapshot.innerJobs).filter(v => v.code === code));
      // Active-job input is grouped source pairs, not last-wins labels.
      const pairs = job ? matches.filter((v, i) => matches.findIndex(p =>
        p.code === v.code && p.label === v.label) === i) : matches;
      if (pairs.length > 1) cardSourceFailure();
      return { code, label: pairs.length ? cardLabel(pairs[0].label) : null };
    };
    return { kind: "one", row: projectEmployeeCardRow({ employeeId: e.employeeId, employee: {
      firstName: e.firstName, lastName: e.lastName, unit,
      job: lookup(e.jobCode, true), innerJob: lookup(e.innerJobCode, false),
    } }, employeeId, exactTeamIds) };
  }
  private teamsForScope(exactTeamIds: readonly string[]) {
    if (exactTeamIds.length > 100 || new Set(exactTeamIds).size !== exactTeamIds.length) cardSourceFailure();
    const teams = exactTeamIds.map(code => {
      const matches = this.snapshot.units.filter(u => u.code === code);
      if (matches.length !== 1) cardSourceFailure();
      const team = matches[0];
      const parents = this.snapshot.units.filter(u => u.code === team.parentCode);
      if (!unitCode(code) || team.unitType !== "J01" || !plainLabel(team.label, 1) ||
          parents.length !== 1 || parents[0].code === code || !mokedOption(parents[0])) cardSourceFailure();
      return { code, label: team.label,
        moked: { code: parents[0].code, label: parents[0].label, unitType: "G01" as const } };
    });
    const seenParents = new Map<string, string>();
    for (const t of teams) {
      if (seenParents.has(t.moked.code) && seenParents.get(t.moked.code) !== t.moked.label) cardSourceFailure();
      seenParents.set(t.moked.code, t.moked.label);
    }
    return teams;
  }
}
