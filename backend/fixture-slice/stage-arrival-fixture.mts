import type { EmployeeShiftDayReader, RawShiftDay } from "./contracts.mts";
import type { AttendanceReadPort } from "./attendance-contracts.mts";
import type { Clock, CurrentShiftReadPort } from "./current-shifts-contracts.mts";
import type { AttendanceFixtureData } from "./attendance-fixture.mts";
import type { CurrentFixtureData } from "./current-shifts-fixture.mts";
import type { StageArrivalFactsV1 } from "./stage-arrival-contracts.mts";
import { AttendanceFixtureReader } from "./attendance-fixture.mts";
import { CurrentFixtureReader } from "./current-shifts-fixture.mts";
import { FixtureReader } from "./fixture-reader.mts";
import { MemoryStageArrivalStore } from "./stage-arrival-memory.mts";
import { stageFail } from "./stage-arrival-errors.mts";

// Read projections of the SAME owned snapshot, not a second mutable fixture
// database. After an UNKNOWN they show actual current state without attributing
// it to a command. No new public fields are added to the seven read DTOs.
function projections(rows: StageArrivalFactsV1[]) {
  const teams = new Map<string, string>(), parents = new Set<string>();
  for (const row of rows) {
    if (teams.has(row.orgUnitId) && teams.get(row.orgUnitId) !== row.parentUnitId) stageFail("INVALID_SOURCE_DATA");
    teams.set(row.orgUnitId, row.parentUnitId); parents.add(row.parentUnitId);
  }
  const catalog = {
    mokedUnits: [...parents].map(code => ({ code, label: "מוקד סימולציה", unitType: "G01" as const })),
    teams: [...teams].map(([code, parentMokedCode]) => ({ code, parentMokedCode, label: "צוות סימולציה", unitType: "J01" as const })),
  };
  const employees = [...new Map(rows.map(row => [row.selection.employeeId, row])).values()].map((f, index) => ({
    employeeId: f.selection.employeeId, employeeNumber: String(index + 1).padStart(8, "0"),
    firstName: "עובד/ת", lastName: "דוגמה", teamCode: f.orgUnitId, innerJobCode: null,
  }));
  const days = rows.map(f => {
    const e = employees.find(e => e.employeeId === f.selection.employeeId)!;
    return { shiftDayId: f.selection.shiftDayId, employeeKey: e.employeeNumber, changedEmployeeKey: null,
      // These are already the exact validated effective snapshot. The command
      // does not reimplement NEW_EMPLOYEE_ID/NEW_SHIFT_* resolution.
      baselineStartLocal: f.planned.startLocal, baselineEndLocal: f.planned.endLocal,
      changedStartLocal: null, changedEndLocal: null, baselineDayType: 4, changedDayType: null,
      cancellationReason: null, baselineActivityData: null, changedActivityData: null,
      baselineHome: "N", changedHome: null, hasChange: false,
      baselineSplitEndLocal: null, changedSplitEndLocal: null, exceptionCode: null };
  });
  const detail: RawShiftDay[] = rows.map(f => ({
    ...f.selection, firstName: "עובד/ת", lastName: "דוגמה", orgUnitId: f.orgUnitId,
    baselineStartLocal: f.planned.startLocal, changedStartLocal: null,
    baselineEndLocal: f.planned.endLocal, changedEndLocal: null,
    baselineActivityData: null, changedActivityData: null, baselineSiteId: null, changedSiteId: null,
    stageArrivalLocal: f.attendance?.stageArrivalLocal ?? null,
    stationArrivalLocal: f.attendance?.stationArrivalLocal ?? null, stationExitLocal: f.attendance?.stationExitLocal ?? null,
  }));
  const current: CurrentFixtureData = { catalog, employees, days,
    activities: [], innerJobs: [], missingReasons: [],
    attendance: rows.flatMap(f => f.attendance ? [{ shiftDayId: f.selection.shiftDayId, missingReason: null,
      stationArrivalLocal: f.attendance.stationArrivalLocal }] : []) };
  const attendance: AttendanceFixtureData = { catalog, employees, days, activities: [], innerJobs: [], exceptions: [],
    attendance: rows.flatMap(f => f.attendance ? [{ shiftDayId: f.selection.shiftDayId,
      stageArrivalLocal: f.attendance.stageArrivalLocal, stationArrivalLocal: f.attendance.stationArrivalLocal,
      stationExitLocal: f.attendance.stationExitLocal, missingReasonCode: null,
      briefingCode: f.attendance.briefing === null ? null : f.attendance.briefing ? "1" : "0" }] : []) };
  return { current, attendance, detail };
}
export function stageArrivalReadAdapters(store: MemoryStageArrivalStore) {
  const source = store.source;
  const snapshot = () => projections(store.inspectSnapshot().rows);
  const detail: EmployeeShiftDayReader & { dataSource: "isolated-fixture"; stageArrivalSource: typeof source } = {
    dataSource: "isolated-fixture", stageArrivalSource: source,
    readByDayId: day => new FixtureReader(snapshot().detail).readByDayId(day),
  };
  const current: CurrentShiftReadPort & { dataSource: "isolated-fixture"; stageArrivalSource: typeof source } = {
    dataSource: "isolated-fixture", stageArrivalSource: source,
    readMokedOptions: (...args) => new CurrentFixtureReader(snapshot().current).readMokedOptions(...args),
    readRows: (...args) => new CurrentFixtureReader(snapshot().current).readRows(...args),
  };
  const attendance: AttendanceReadPort & { stageArrivalSource: typeof source } = {
    dataSource: "isolated-fixture", stageArrivalSource: source,
    readContext: (...args) => new AttendanceFixtureReader(snapshot().attendance).readContext(...args),
    read: (...args) => new AttendanceFixtureReader(snapshot().attendance).read(...args),
  };
  return { detail, current, attendance };
}
export function createStageArrivalFixture(rows: unknown, clock: Clock) {
  if (!Array.isArray(rows)) stageFail("INVALID_SOURCE_DATA");
  // Runtime assertion before passing to canonical typed memory constructor.
  const checked: StageArrivalFactsV1[] = [];
  for (const row of rows) { validateFacts(row); checked.push(row); }
  const store = new MemoryStageArrivalStore(checked, clock);
  return { store, ...stageArrivalReadAdapters(store) };
}
import { facts as validateFacts } from "./stage-arrival-validation.mts";
