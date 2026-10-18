import { sampleConfig, sampleCurrentFixture, sampleDetailRows } from "./current-shifts-sample.mts";
import { sampleSearchFixture, sampleSearchDetailRows } from "./shift-search-sample.mts";
import type { MyShiftsFixtureData } from "./my-shifts-fixture.mts";
export { sampleConfig };
// Explicit synthetic handoff only: both existing current/search actors remain discoverable.
export const sampleMyShiftsFixture: MyShiftsFixtureData = {
  ...sampleCurrentFixture,
  employees: [sampleCurrentFixture.employees[0],
    { ...sampleSearchFixture.employees[0], employeeNumber: "TEST0002-extra" }],
  days: [
    ...sampleCurrentFixture.days.map(d => ({ ...d, hasChange: false })),
    ...sampleSearchFixture.days.map(d => ({ ...d, employeeKey: "TEST0002" })),
    { ...sampleCurrentFixture.days[0], shiftDayId: "2", hasChange: false,
      baselineStartLocal: "2024-03-01T10:00:00", baselineEndLocal: null, baselineActivityData: null },
  ],
};
export const sampleMyShiftsDetailRows = [...sampleDetailRows, ...sampleSearchDetailRows,
  { ...sampleDetailRows[0], shiftDayId: "2", baselineStartLocal: "2024-03-01T10:00:00",
    baselineEndLocal: null, baselineActivityData: null, stationArrivalLocal: null }];
