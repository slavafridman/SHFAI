// Pure JSON-compatible synthetic before-images. No physical metadata/live proof.
import type { ShiftDayFacts, ShiftSnapshot } from "./shift-management-model.mts";
import type { CurrentShiftFixtureCatalog } from "./current-shifts-contracts.mts";
import type { ShiftItemsFixtureData } from "./shift-items-fixture.mts";
import { fixtureEpoch } from "./populated-config.mts";
import type { FullTestMode } from "./populated-config.mts";

export function fullCatalog(): CurrentShiftFixtureCatalog {
  return { mokedUnits: [
    { code: "M001", label: "מוקד סינתטי", unitType: "G01" },
    { code: "M002", label: "מוקד בדיקה אחר", unitType: "G01" },
  ], teams: [
    { code: "T001", label: "צוות סינתטי", unitType: "J01", parentMokedCode: "M001" },
    { code: "T002", label: "צוות לא מורשה", unitType: "J01", parentMokedCode: "M001" },
    { code: "T003", label: "צוות בדיקה אחר", unitType: "J01", parentMokedCode: "M002" },
  ] };
}
export function fullDay(id: string, start: string, end: string): ShiftDayFacts {
  return { baseline: {
    shiftDayId: id, employeeNumber: "00123456", dateLocal: start.slice(0, 10) + "T00:00:00",
    dayType: "4", startLocal: start, endLocal: end, dayStartLocal: null, dayEndLocal: null,
    activityCode: "1", siteId: "7001", paidMinutes: String((Date.parse(end + "Z") - Date.parse(start + "Z")) / 60000),
    workMinutes: String((Date.parse(end + "Z") - Date.parse(start + "Z")) / 60000),
    workFromHome: "N", splitShift: "N", switchDayId: null, exceptionType: null, timeoffType: null,
    source: "WFM", remark: null,
    preserved: { SPLIT_START: null, SPLIT_END: null, POOL_EXT_NUM: null, POOL_ERR: null },
  }, overlay: null, attendance: null };
}
export function fullManagementSnapshot(writer: boolean): ShiftSnapshot {
  const first = fullDay("19001", "2026-11-01T11:00:00", "2026-11-01T18:00:00");
  first.attendance = {
    SHF_EMPLOYEE_DAY_ID: "19001", STAGE_ARRIVAL_TIME: "2026-11-01T11:00:01", STAGE_ARRIVAL_USER: "synthetic-stage",
    STATION_ARRIVAL_TIME: "2026-11-01T11:01:00", STATION_ARRIVAL_USER: "synthetic-station",
    STATION_EXIT_TIME: null, STATION_EXIT_USER: null, MISS_REASON_ID: null, TADREECH: "1",
    MISSING_TIME: null, MISSING_REMARK: null,
  };
  return {
    reference: { namespace: "shift-management-v0.1", identityRevision: "isolated-synthetic-identity-v1",
      operatorScopeRevision: "isolated-synthetic-scope-v1", mode: "isolated-fixture", dataSource: "isolated-fixture", metadata: null },
    employee: { employeeId: "1", employeeNumber: "001234567", firstName: "בדיקה", lastName: "סינתטית",
      orgUnitId: "T001", prefixEmployeeIds: ["1"], statusCode: "3", workFromHome: "1", siteIds: ["7001"] },
    days: [first, fullDay("19002", "2026-11-02T23:00:00", "2026-11-03T01:00:00"),
      ...(writer ? [fullDay("19003", "2026-11-04T09:00:00", "2026-11-04T10:00:00")] : [])],
    dependencies: [], policy: { minimumMinutes: 30, maximumMinutes: 720, gapMinutes: 60 },
    activityOptions: [{ code: "1", label: "פעילות סינתטית" }, { code: "2", label: null }],
    startEndReasonOptions: [{ code: "1", label: "סיבה סינתטית" }],
    cancelReasonOptions: [{ code: "C1", label: "ביטול סינתטי" }],
    partnerPolicy: { managedBreaks: "disabled", cti: "not-required" },
    textStorage: { charset: "AL32UTF8", remarkBytes: 500, cancelReasonBytes: 10, actorBytes: 100 },
    validUntil: "2026-11-10T00:00:00.000Z", preserved: { SYNTHETIC_POLICY_REVISION: "1" },
  };
}
export function fullItems(): ShiftItemsFixtureData["items"] {
  return [
    { shiftDayId: "19001", stateCode: "4", typeCode: null, startLocal: "2026-11-01T11:20:00",
      endLocal: "2026-11-01T11:35:00", durationMinutes: "15", breakExitLocal: null, breakReturnLocal: null,
      remark: "נתוני בדיקה בלבד", sourceCode: "TEST", cancellationReason: null },
    { shiftDayId: "19001", stateCode: "7", typeCode: "1", startLocal: "2026-11-01T12:20:00",
      endLocal: "2026-11-01T12:25:00", durationMinutes: "5", breakExitLocal: null, breakReturnLocal: null,
      remark: "נתוני בדיקה בלבד", sourceCode: "TEST", cancellationReason: null },
  ];
}
export function frozenFixtureClock() {
  return { now: () => new Date(fixtureEpoch) };
}
// Inquiry-only synthetic NULL facts outside the C52 command's physical scope.
// Bound explicitly to that fixed fixture, never inferred from a real employee.
export function cancellationInquiryMetadata() {
  return { employeeId: "9001", shiftDayId: "6201", orgUnitId: "T001",
    jobCode: null, innerJobCode: null, workFromHome: null, remark: null };
}
export function fullInquiryPaths(mode: FullTestMode): readonly string[] {
  const employee = mode === "cancellation" ? "9001" : "1", day = mode === "cancellation" ? "6201" : "19001";
  const query = "attendanceDate=2026-11-01&timeFrom=11:00&timeTo=11:00&teamCodes=T001" +
    (mode === "cancellation" ? "" : "&innerJobCodes=101&workLocations=site");
  return [
    "/api/v1/current-shifts?mode=at&attendanceDate=2026-11-01&currentTime=12:00",
    "/api/v1/shift-search?" + query,
    `/api/v1/my-shifts?mode=selected&employeeId=${employee}&dateFrom=2026-11-01&dateTo=2026-11-07`,
    `/api/v1/employees/${employee}/shift-days/${day}`,
    `/api/v1/employees/${employee}/shift-days/${day}/breaks-and-exceptions`,
    `/api/v1/employees/${employee}/operational-card`,
    "/api/v1/attendance?" + query,
    "/api/v1/current-shifts/filter-context", "/api/v1/shift-search/filter-context",
    `/api/v1/my-shifts/context?mode=selected&employeeId=${employee}`, "/api/v1/attendance/filter-context",
  ];
}
