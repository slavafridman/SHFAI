import type { PrincipalV1 } from "./contracts.mts";
import type { SelectedShiftItemsAccessPolicy, SelectedShiftItemsReadPort,
  SelectedShiftItemsRequestV1, SelectedShiftItemsV1 } from "./shift-items-contracts.mts";
import { validatePrincipal, validateRaw, record } from "./contract-validation.mts";
import { accessPolicy } from "./access-policy.mts";
import { unitCode } from "./current-shifts-validation.mts";
import { project } from "./projection.mts";
import { ShiftItemsError } from "./shift-items-errors.mts";
import { itemsDisplayContext, itemsSourceFailure, selectedItem, validateItemsRequest } from "./shift-items-validation.mts";
import { projectItem } from "./shift-items-projection.mts";

export class GetSelectedShiftItems {
  private readonly reader: SelectedShiftItemsReadPort;
  private readonly policy: SelectedShiftItemsAccessPolicy;
  private readonly zone: string;
  constructor(reader: SelectedShiftItemsReadPort, policy: SelectedShiftItemsAccessPolicy, zone: string) {
    this.reader = reader; this.policy = policy; this.zone = zone;
  }
  async read(p: PrincipalV1, r: SelectedShiftItemsRequestV1,
    signal: AbortSignal = new AbortController().signal): Promise<SelectedShiftItemsV1> {
    signal.throwIfAborted(); validatePrincipal(p); validateItemsRequest(r);
    this.policy.requireSelectedShiftItemsRead(p);
    if (!this.policy.canReadSelectedEmployee(p, r.employeeId)) throw new ShiftItemsError("FORBIDDEN");
    const grants = this.policy.authorizedSelectedShiftItemsUnitIds(p);
    if (grants.length > 100 || new Set(grants).size !== grants.length || !grants.every(unitCode)) itemsSourceFailure();
    if (!grants.length) throw new ShiftItemsError("SHIFT_DAY_NOT_FOUND");
    const limit = r.limit ?? 25, offset = r.offset ?? 0;
    const result = await this.reader.read({ employeeId: r.employeeId, shiftDayId: r.shiftDayId,
      exactTeamIds: grants, limit, offset, sort: "start-asc" }, signal);
    signal.throwIfAborted();
    if (!record(result)) itemsSourceFailure();
    if (result.kind === "not-found") throw new ShiftItemsError("SHIFT_DAY_NOT_FOUND");
    if (result.kind === "ambiguous-context") throw new ShiftItemsError("AMBIGUOUS_SHIFT_DAY");
    if (result.kind === "ambiguous-items") throw new ShiftItemsError("AMBIGUOUS_SHIFT_ITEMS");
    if (result.kind !== "one") itemsSourceFailure();
    validateRaw(result.detail);
    const d = result.detail;
    if (d.shiftDayId !== r.shiftDayId) itemsSourceFailure();
    if (d.employeeId !== r.employeeId || !accessPolicy.canReadShiftDay(p, d))
      throw new ShiftItemsError("SHIFT_DAY_NOT_FOUND");
    if (!itemsDisplayContext(result.displayContext) || result.displayContext.unit.code !== d.orgUnitId ||
        !Array.isArray(result.rows) || result.rows.length > limit + 1) itemsSourceFailure();
    for (const [i, row] of result.rows.entries()) {
      if (!selectedItem(row) || row.key.shiftDayId !== r.shiftDayId) itemsSourceFailure();
      if (i && result.rows[i - 1].startLocal === row.startLocal) throw new ShiftItemsError("AMBIGUOUS_SHIFT_ITEMS");
      if (i && result.rows[i - 1].startLocal > row.startLocal) itemsSourceFailure();
    }
    // Explicit projection: internal adapter/provider additions must not leak.
    const items = result.rows.slice(0, limit).map(row => projectItem({
      shiftDayId: row.key.shiftDayId, stateCode: row.stateCode, typeCode: row.type?.code ?? null,
      startLocal: row.startLocal, endLocal: row.endLocal, durationMinutes: row.durationMinutes,
      breakExitLocal: row.breakExitLocal, breakReturnLocal: row.breakReturnLocal,
      remark: row.remark, sourceCode: row.sourceCode,
    }, row.type?.label ?? null));
    const hasMore = result.rows.length > limit, next = offset + items.length;
    const dc = result.displayContext;
    const label = (v: { code: string; label: string | null }) => ({ code: v.code, label: v.label });
    const response: SelectedShiftItemsV1 = {
      shiftDay: project(d, this.zone, this.reader.dataSource === "oracle-read-only" ? "oracle" : "isolated-fixture"),
      displayContext: { unit: { code: dc.unit.code, label: dc.unit.label,
        moked: { code: dc.unit.moked.code, label: dc.unit.moked.label, unitType: "G01" } },
        activities: dc.activities.map(label), innerJob: dc.innerJob === null ? null : label(dc.innerJob) }, items,
      applied: { sort: "start-asc" }, page: { limit, offset, hasMore,
        nextOffset: hasMore && next <= 10000 ? next : null },
    };
    if (Buffer.byteLength(JSON.stringify(response), "utf8") > 2 * 1024 * 1024) itemsSourceFailure();
    signal.throwIfAborted();
    return response;
  }
}
