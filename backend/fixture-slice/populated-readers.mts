// Each request derives its relational readers from one fresh committed snapshot.
import type { ShiftSnapshot } from "./shift-management-model.mts";
import type { CancellationSnapshot } from "./station-exit-cancellation-domain.mts";
import type { RawShiftDay, EmployeeShiftDayReader } from "./contracts.mts";
import type { CurrentRuntimeOptions } from "./synthetic-identity.mts";
import type { CurrentFixtureData } from "./current-shifts-fixture.mts";
import type { ShiftItemsFixtureData } from "./shift-items-fixture.mts";
import { CurrentFixtureReader } from "./current-shifts-fixture.mts";
import { FixtureReader } from "./fixture-reader.mts";
import { SearchFixtureReader } from "./shift-search-fixture.mts";
import { MyShiftsFixtureReader } from "./my-shifts-fixture.mts";
import { ShiftItemsFixtureReader } from "./shift-items-fixture.mts";
import { AttendanceFixtureReader } from "./attendance-fixture.mts";
import { EmployeeCardFixtureReader } from "./employee-card-fixture.mts";
import { fullCatalog } from "./populated-world.mts";
import type { cancellationInquiryMetadata } from "./populated-world.mts";

export interface InquirySnapshot {
  employee: { employeeId: string; employeeNumber: string; firstName: string; lastName: string; orgUnitId: string;
    jobCode: string | null; innerJobCode: string | null };
  activityOptions: ShiftSnapshot["activityOptions"];
  days: Array<{
    baseline: Pick<ShiftSnapshot["days"][number]["baseline"], "shiftDayId" | "employeeNumber" | "startLocal" |
      "endLocal" | "dayType" | "splitShift" | "source" | "remark"> &
      { activityCode: string | null; siteId: string | null; workFromHome: string | null };
    overlay: ShiftSnapshot["days"][number]["overlay"];
    attendance: ShiftSnapshot["days"][number]["attendance"];
  }>;
}
export function managementInquirySnapshot(s: ShiftSnapshot): InquirySnapshot {
  return { employee: { ...s.employee, jobCode: "11", innerJobCode: "101" },
    activityOptions: s.activityOptions, days: s.days };
}
export function cancellationInquirySnapshot(f: CancellationSnapshot,
  metadata: ReturnType<typeof cancellationInquiryMetadata>): InquirySnapshot {
  if (metadata.employeeId !== f.employeeId || metadata.shiftDayId !== f.shiftDayId || metadata.orgUnitId !== f.orgUnitId)
    throw Error("Explicit cancellation inquiry binding mismatch");
  const value = (row: Record<string, string | null> | null, key: string) => {
    if (!row || !Object.hasOwn(row, key) || row[key] !== null && typeof row[key] !== "string")
      throw Error("Missing synthetic physical before-image");
    return row[key];
  };
  const required = (row: Record<string, string | null> | null, key: string): string => {
    const v = value(row, key); if (v === null) throw Error("Missing synthetic identity"); return v;
  };
  const e = f.rows.SHF_EMPLOYEES!, d = f.rows.SHF_EMPLOYEE_DAY!;
  return { employee: { employeeId: required(e, "EMPLOYEE_ID"), employeeNumber: required(e, "EMP_ID_NUMBER"),
    firstName: required(e, "FIRST_NAME"), lastName: required(e, "LAST_NAME"), orgUnitId: required(e, "ORG_UNIT_ID"),
    jobCode: metadata.jobCode, innerJobCode: metadata.innerJobCode },
    activityOptions: [], days: [{
      baseline: { shiftDayId: required(d, "SHF_EMPLOYEE_DAY_ID"), employeeNumber: required(d, "EMP_ID_NUMBER"),
        startLocal: required(d, "WM_SHIFT_START_DATETIME"), endLocal: required(d, "WM_SHIFT_END_DATETIME"),
        dayType: required(d, "WM_DAY_TYPE"), activityCode: value(d, "WM_SCH_ACTIVITY_ID_DATA"), siteId: value(d, "WM_SITE_ID"),
        workFromHome: metadata.workFromHome, splitShift: value(d, "SPLIT_SHIFT"), source: required(d, "SOURCE"),
        remark: metadata.remark }, overlay: null, attendance: structuredClone(f.rows.SHF_ATTENDANCE),
    }] };
}
export function fullReaderSnapshot(snapshot: InquirySnapshot, items: ShiftItemsFixtureData["items"]) {
  const e = snapshot.employee, catalog = fullCatalog();
  const attendanceValue = (a: ShiftSnapshot["days"][number]["attendance"], key: string): string | null => {
    if (a === null) return null;
    if (!Object.hasOwn(a, key) || a[key] !== null && typeof a[key] !== "string")
      throw Error("Invalid synthetic attendance before-image");
    return a[key] as string | null;
  };
  const days = snapshot.days.map(({ baseline: b, overlay: o }) => ({
    shiftDayId: b.shiftDayId, employeeKey: b.employeeNumber, changedEmployeeKey: o?.employeeNumber ?? null,
    baselineStartLocal: b.startLocal, changedStartLocal: o?.startLocal ?? null,
    baselineEndLocal: b.endLocal, changedEndLocal: o?.endLocal ?? null,
    baselineDayType: Number(b.dayType), changedDayType: o?.dayType == null ? null : Number(o.dayType),
    cancellationReason: o?.cancelReasonCode ?? null, baselineActivityData: b.activityCode,
    changedActivityData: o?.activityCode ?? null, baselineHome: b.workFromHome, changedHome: o?.workFromHome ?? null,
    hasChange: o !== null,
  }));
  const details: RawShiftDay[] = snapshot.days.flatMap(({ baseline: b, overlay: o, attendance: a }) => {
    // Management cancellation transfers ownership to the existing sentinel. Do not invent a binding.
    if ((o?.employeeNumber ?? b.employeeNumber) !== e.employeeNumber.slice(0, 8)) return [];
    return [{ employeeId: e.employeeId, shiftDayId: b.shiftDayId, firstName: e.firstName, lastName: e.lastName,
      orgUnitId: e.orgUnitId, baselineStartLocal: b.startLocal, changedStartLocal: o?.startLocal ?? null,
      baselineEndLocal: b.endLocal, changedEndLocal: o?.endLocal ?? null,
      baselineActivityData: b.activityCode, changedActivityData: o?.activityCode ?? null,
      baselineSiteId: b.siteId, changedSiteId: o?.siteId ?? null,
      stageArrivalLocal: attendanceValue(a, "STAGE_ARRIVAL_TIME"),
      stationArrivalLocal: attendanceValue(a, "STATION_ARRIVAL_TIME"),
      stationExitLocal: attendanceValue(a, "STATION_EXIT_TIME") }];
  });
  const innerJobs = [{ code: "101", label: "תפקיד פנימי סינתטי", active: 1, orgUnitId: e.orgUnitId }];
  const exceptions = [{ code: "1", label: "חריגה סינתטית" }];
  const data: CurrentFixtureData = { catalog, days,
    employees: [{ employeeId: e.employeeId, employeeNumber: e.employeeNumber,
      firstName: e.firstName, lastName: e.lastName, teamCode: e.orgUnitId, innerJobCode: e.innerJobCode }],
    attendance: snapshot.days.flatMap(d => d.attendance === null ? [] : [{
      shiftDayId: d.baseline.shiftDayId, missingReason: attendanceValue(d.attendance, "MISS_REASON_ID"),
      stationArrivalLocal: attendanceValue(d.attendance, "STATION_ARRIVAL_TIME") }]),
    activities: snapshot.activityOptions, innerJobs, missingReasons: [],
  };
  const selectedItems = new ShiftItemsFixtureReader({ contexts: details.map(detail => ({
    detail, innerJobCode: e.innerJobCode, unit: { code: e.orgUnitId, label: "צוות סינתטי", moked: catalog.mokedUnits[0] },
  })), items, activities: snapshot.activityOptions, innerJobs, exceptions, timeoffs: [] });
  selectedItems.assertDetailCoherence(details);
  return {
    detail: new FixtureReader(details),
    current: new CurrentFixtureReader(data, ["T001"]),
    search: new SearchFixtureReader({ ...data, innerJobs, exceptions, cancelLogins: [],
      days: days.map((day, index) => ({ ...day, markers: {
        remark: snapshot.days[index].baseline.remark, cancelLoginApplier: null,
        baselineSplit: snapshot.days[index].baseline.splitShift, changedSplit: snapshot.days[index].overlay?.splitShift ?? null,
        source: snapshot.days[index].baseline.source, baselineExtension: null, changedExtension: null, exceptionCode: null,
      } })) }),
    schedule: new MyShiftsFixtureReader({ ...data, days }),
    items: selectedItems,
    attendance: new AttendanceFixtureReader({ ...data, innerJobs, exceptions,
      days: days.map(d => ({ ...d, baselineSplitEndLocal: null, changedSplitEndLocal: null, exceptionCode: null })),
      attendance: snapshot.days.flatMap(d => d.attendance === null ? [] : [{
        shiftDayId: d.baseline.shiftDayId, stageArrivalLocal: attendanceValue(d.attendance, "STAGE_ARRIVAL_TIME"),
        stationArrivalLocal: attendanceValue(d.attendance, "STATION_ARRIVAL_TIME"),
        stationExitLocal: attendanceValue(d.attendance, "STATION_EXIT_TIME"),
        missingReasonCode: attendanceValue(d.attendance, "MISS_REASON_ID"), briefingCode: attendanceValue(d.attendance, "TADREECH"),
      }]),
    }),
    card: new EmployeeCardFixtureReader({ employees: [{ employeeId: e.employeeId, firstName: e.firstName,
      lastName: e.lastName, orgUnitId: e.orgUnitId, jobCode: e.jobCode, innerJobCode: e.innerJobCode }],
      units: [...catalog.mokedUnits.map(m => ({ ...m, parentCode: null })),
        ...catalog.teams.map(t => ({ ...t, parentCode: t.parentMokedCode }))],
      activeJobPairs: [{ code: "11", label: "תפקיד סינתטי" }], innerJobs,
    }, ["T001"]),
  };
}
export function fullReadPorts(readSnapshot: () => InquirySnapshot, items: ShiftItemsFixtureData["items"]) {
  const fresh = () => fullReaderSnapshot(readSnapshot(), items);
  fresh(); // Validate all seven sources before HTTP listen.
  const tagged = <T,>(port: T): T & { dataSource: "isolated-fixture" } =>
    Object.assign(port as T & object, { dataSource: "isolated-fixture" as const });
  const detail: EmployeeShiftDayReader = tagged<EmployeeShiftDayReader>({ readByDayId: id => fresh().detail.readByDayId(id) });
  const options: CurrentRuntimeOptions = {
    reader: tagged<CurrentRuntimeOptions["reader"]>({
      readMokedOptions: ids => fresh().current.readMokedOptions(ids),
      readRows: s => fresh().current.readRows(s) }),
    searchReader: tagged<NonNullable<CurrentRuntimeOptions["searchReader"]>>({
      readCatalog: ids => fresh().search.readCatalog(ids), readRows: s => fresh().search.readRows(s) }),
    myShiftsReader: tagged<NonNullable<CurrentRuntimeOptions["myShiftsReader"]>>({
      readEmployeeContext: (id, grants) => fresh().schedule.readEmployeeContext(id, grants),
      readRows: s => fresh().schedule.readRows(s), withRead: work => fresh().schedule.withRead(work) }),
    shiftItemsReader: { dataSource: "isolated-fixture", read: (s, signal) => fresh().items.read(s, signal) },
    employeeCardReader: { dataSource: "isolated-fixture", read: (s, signal) => fresh().card.read(s, signal) },
    attendanceReader: { dataSource: "isolated-fixture",
      readContext: (ids, signal) => fresh().attendance.readContext(ids, signal),
      read: (s, signal) => fresh().attendance.read(s, signal) },
  };
  return { detail, options };
}
