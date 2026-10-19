import type { EmployeeOperationalCardReadPort, EmployeeOperationalCardReadSelection,
  EmployeeOperationalCardReadResult } from "./employee-card-contracts.mts";
import { OracleReadSession } from "./oracle-session.mts";
import { alias, labelsFor, numberText, teamsAndParents } from "./oracle-readers.mts";
import { decimalId, record } from "./contract-validation.mts";
import { cardLabel, cardSourceFailure, numericCardCode, projectEmployeeCardRow } from "./read-employee-card.mts";

const fields = [
  alias(numberText("e.employee_id"), "employeeId"), alias("e.first_name", "firstName"),
  alias("e.last_name", "lastName"), alias("e.org_unit_id", "orgUnitId"),
  alias(numberText("e.job_id"), "jobCode"), alias(numberText("e.inner_job_id"), "innerJobCode"),
].join(", ");
export const employeeCardSql = `SELECT "employeeId","firstName","lastName","orgUnitId","jobCode","innerJobCode"
  FROM (SELECT ${fields} FROM SHIFTER.shf_employees e WHERE e.employee_id=TO_NUMBER(:employeeId))
  WHERE ROWNUM <= 2`;
// ComplexCodeTable.getJobRows + SHFConstants.EMPLOYEE_STATUS_ACTIVE=3.
export const employeeJobLabelSql = `SELECT "code","label" FROM (
  SELECT ${numberText("e.job_id")} AS "code", e.job_name AS "label"
  FROM SHIFTER.shf_employees e
  WHERE e.job_id=TO_NUMBER(:jobCode) AND e.job_id>0 AND e.status_id=:activeStatus
  GROUP BY e.job_id,e.job_name) WHERE ROWNUM <= 2`;
export class OracleEmployeeCardReader implements EmployeeOperationalCardReadPort {
  readonly dataSource = "oracle-read-only" as const;
  private readonly session: OracleReadSession;
  constructor(session: OracleReadSession) { this.session = session; }
  async read(selection: EmployeeOperationalCardReadSelection, signal?: AbortSignal): Promise<EmployeeOperationalCardReadResult> {
    if (!decimalId(selection.employeeId)) cardSourceFailure();
    const exactTeamIds = [...selection.exactTeamIds];
    if (!exactTeamIds.length) return { kind: "not-found" };
    return this.session.read(async query => {
      const rows = await query(employeeCardSql, { employeeId: selection.employeeId }, 2);
      if (!rows.length) return { kind: "not-found" };
      for (const row of rows) {
        if (!record(row)) cardSourceFailure();
        if (row.orgUnitId === null || !exactTeamIds.includes(row.orgUnitId as string))
          return { kind: "not-found" };
      }
      if (rows.length > 1) return { kind: "ambiguous-employee" };
      const e = rows[0];
      if (!record(e) || e.employeeId !== selection.employeeId) cardSourceFailure();
      const { teams } = await teamsAndParents(query, exactTeamIds);
      const team = teams.find(t => t.code === e.orgUnitId);
      if (!team) cardSourceFailure();
      const jobCode = numericCardCode(e.jobCode), innerJobCode = numericCardCode(e.innerJobCode);
      let jobLabel: string | null = null;
      if (jobCode !== null && !jobCode.startsWith("-")) {
        const labels = await query(employeeJobLabelSql, { jobCode, activeStatus: 3 }, 2);
        if (labels.length > 1) cardSourceFailure();
        if (labels.length) {
          if (!record(labels[0]) || labels[0].code !== jobCode) cardSourceFailure();
          jobLabel = cardLabel(labels[0].label);
        }
      }
      const innerLabels = innerJobCode === null ? [] :
        await labelsFor(query, "innerJobs", [innerJobCode], cardLabel);
      const row = projectEmployeeCardRow({ employeeId: e.employeeId, employee: {
        firstName: e.firstName, lastName: e.lastName,
        unit: { code: team.code, label: team.label, moked: team.parent },
        job: jobCode === null ? null : { code: jobCode, label: jobLabel },
        innerJob: innerJobCode === null ? null : { code: innerJobCode, label: innerLabels[0]?.label ?? null },
      } }, selection.employeeId, exactTeamIds);
      return { kind: "one", row };
    }, signal);
  }
}
