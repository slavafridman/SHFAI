import { sampleConfig, sampleDetailRows } from "./current-shifts-sample.mts";
import type { ShiftItemsFixtureData } from "./shift-items-fixture.mts";
export { sampleConfig };
// Explicit synthetic opt-in sample. Same selected employee/day as current sample.
export const sampleShiftItemsDetailRows = structuredClone(sampleDetailRows);
export const sampleShiftItemsFixture: ShiftItemsFixtureData = {
  contexts: [{ detail: sampleShiftItemsDetailRows[0],
    unit: { code: "T01", label: "צוות סינתטי",
      moked: { code: "01", label: "מוקד סינתטי", unitType: "G01" } }, innerJobCode: "00" }],
  activities: [{ code: "A", label: "פעילות סינתטית" }], innerJobs: [],
  exceptions: [{ code: "-9", label: "חריגה סינתטית" }], timeoffs: [],
  items: [
    { shiftDayId: "1", stateCode: "4", typeCode: null, startLocal: "2024-02-29T23:30:17",
      endLocal: "2024-03-01T00:00:19", durationMinutes: "30", breakExitLocal: null,
      breakReturnLocal: null, remark: "נתוני בדיקה בלבד", sourceCode: "DEL", cancellationReason: null },
    { shiftDayId: "1", stateCode: "2", typeCode: "0", startLocal: "2024-03-01T00:30:17",
      endLocal: "2024-03-01T01:00:19", durationMinutes: "-2", breakExitLocal: null,
      breakReturnLocal: null, remark: null, sourceCode: "TEST", cancellationReason: null },
    { shiftDayId: "1", stateCode: "7", typeCode: "-9", startLocal: "2024-03-01T00:30:18",
      endLocal: "2024-02-29T23:00:00", durationMinutes: "99999999999999999999999999999999999999",
      breakExitLocal: null, breakReturnLocal: null, remark: "<b>טקסט בלבד</b>",
      sourceCode: "TEST", cancellationReason: null },
  ],
};
