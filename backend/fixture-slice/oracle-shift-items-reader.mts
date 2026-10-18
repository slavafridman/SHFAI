import type { SelectedShiftItemsReadPort, SelectedShiftItemsReadSelection,
  SelectedShiftItemsReadResult } from "./shift-items-contracts.mts";
import { OracleReadSession } from "./oracle-session.mts";
import { alias, civil, detailContextRows, labelsFor, numberText, rawDetail, requireGregorian } from "./oracle-readers.mts";
import { record, text } from "./contract-validation.mts";
import { activityTokens } from "./current-shifts-projection.mts";
import { catalogCode, unitCode } from "./current-shifts-validation.mts";
import { itemsDisplayContext, itemsSourceFailure, validateItemsRequest } from "./shift-items-validation.mts";
import { projectItem } from "./shift-items-projection.mts";
import { currentRequestBudget, withRequestBudget } from "./request-budget-context.mts";

// All SQL is static allowlisted plain-table/catalog reads + formatting built-ins.
// No public detail call or second lease: full detail/hierarchy/probe/page/catalog
// reads execute sequentially in the SAME explicit read-only snapshot.
export class OracleShiftItemsReader implements SelectedShiftItemsReadPort {
  readonly dataSource = "oracle-read-only" as const;
  private readonly session: OracleReadSession;
  constructor(session: OracleReadSession) { this.session = session; }
  async read(s: SelectedShiftItemsReadSelection, signal: AbortSignal): Promise<SelectedShiftItemsReadResult> {
    signal.throwIfAborted();
    validateItemsRequest({ employeeId: s.employeeId, shiftDayId: s.shiftDayId,
      limit: s.limit, offset: s.offset, sort: s.sort });
    if (s.exactTeamIds.length > 100 || new Set(s.exactTeamIds).size !== s.exactTeamIds.length ||
        !s.exactTeamIds.every(unitCode)) itemsSourceFailure();
    if (!s.exactTeamIds.length) return { kind: "not-found" };
    const work = () => this.session.read<SelectedShiftItemsReadResult>(async query => {
      await requireGregorian(query);
      const contexts = await detailContextRows(query, s.shiftDayId, [
        alias("e.emp_id_number", "employeeReference"), alias(numberText("e.inner_job_id"), "innerJobCode"),
        alias("u.org_unit_name", "teamLabel"), alias("u.unit_type_id", "teamType"),
        alias("p.org_unit_id", "parentCode"), alias("p.org_unit_name", "parentLabel"),
        alias("p.unit_type_id", "parentType"),
      ], "LEFT JOIN SHIFTER.shf_org_unit p ON p.org_unit_id=u.parent_unit");
      if (contexts.length > 1) return { kind: "ambiguous-context" };
      if (!contexts.length) return { kind: "not-found" };
      const c = contexts[0], detail = rawDetail(c);
      if (detail.employeeId !== s.employeeId || detail.orgUnitId === null ||
          !s.exactTeamIds.includes(detail.orgUnitId)) return { kind: "not-found" };
      if (!record(c) || !text(c.employeeReference, 128, 8) || c.teamType !== "J01" ||
          !(c.innerJobCode === null || catalogCode(c.innerJobCode))) itemsSourceFailure();
      const unit = { code: detail.orgUnitId, label: c.teamLabel,
        moked: { code: c.parentCode, label: c.parentLabel, unitType: c.parentType } };
      if (!itemsDisplayContext({ unit, activities: [], innerJob: null })) itemsSourceFailure();
      const tokens = activityTokens(detail.changedActivityData ?? detail.baselineActivityData);
      const job = c.innerJobCode === null || c.innerJobCode === "00" ? null : c.innerJobCode;
      const predicate = `FROM SHIFTER.shf_employee_exceptions x
        WHERE x.agent_day_id=TO_NUMBER(:dayId) AND x.state_type>0 AND x.cancel_reason_code IS NULL`;
      const binds = { dayId: s.shiftDayId };
      const duplicate = await query(`SELECT "ambiguous" FROM (
        SELECT 1 AS "ambiguous" ${predicate}
        GROUP BY x.agent_day_id,x.start_time HAVING COUNT(*)>1) WHERE ROWNUM<=1`, binds, 1);
      if (duplicate.length) return { kind: "ambiguous-items" };
      const fields = [
        alias(numberText("x.agent_day_id"), "shiftDayId"), alias(numberText("x.state_type"), "stateCode"),
        alias(numberText("x.exception_type"), "typeCode"), alias(civil("x.start_time"), "startLocal"),
        alias(civil("x.end_time"), "endLocal"), alias(numberText("x.duration"), "durationMinutes"),
        alias(civil("x.exit_time"), "breakExitLocal"), alias(civil("x.entry_time"), "breakReturnLocal"),
        alias("x.remark", "remark"), alias("x.source", "sourceCode"),
      ].join(",");
      const names = [...fields.matchAll(/AS "([A-Za-z]+)"/g)].map(m => `"${m[1]}"`).join(",");
      const values = await query(`SELECT ${names} FROM (
        SELECT ${fields}, ROW_NUMBER() OVER (ORDER BY x.start_time ASC) AS "rowNumber" ${predicate})
        WHERE "rowNumber">:lowerBound AND "rowNumber"<=:upperBound ORDER BY "rowNumber"`,
      { ...binds, lowerBound: s.offset, upperBound: s.offset + s.limit + 1 }, s.limit + 1);
      // Validate raw conversion before scoped catalog hydration; sentinel remains unlabelled.
      const rows = values.map(v => projectItem(v));
      const page = rows.slice(0, s.limit);
      const activities = await labelsFor(query, "activities", tokens);
      const jobs = await labelsFor(query, "innerJobs", job === null ? [] : [job]);
      const timeoffs = await labelsFor(query, "timeoffs", page.flatMap(r => r.kind === "timeoff" ? [r.type!.code] : []));
      const exceptions = await labelsFor(query, "exceptions", page.flatMap(r => r.kind === "exception" ? [r.type!.code] : []));
      const displayContext = { unit,
        activities: tokens.map(code => ({ code, label: activities.find(v => v.code === code)?.label ?? null })),
        innerJob: job === null ? null : { code: job, label: jobs.find(v => v.code === job)?.label ?? null } };
      if (!itemsDisplayContext(displayContext)) itemsSourceFailure();
      for (const r of page) if (r.type !== null)
        r.type.label = (r.kind === "timeoff" ? timeoffs : exceptions).find(v => v.code === r.type!.code)?.label ?? null;
      signal.throwIfAborted();
      return { kind: "one", detail, displayContext, rows };
    });
    const context = currentRequestBudget();
    return withRequestBudget(context ? AbortSignal.any([signal, context.signal]) : signal,
      context ? Math.max(1, context.deadline - performance.now()) : 5000, work);
  }
}
