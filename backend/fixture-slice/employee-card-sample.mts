import { sampleConfig } from "./current-shifts-sample.mts";
import type { EmployeeCardFixtureData } from "./employee-card-fixture.mts";
export { sampleConfig };
// Isolated synthetic data only, same employee keys as existing workflow samples.
export const sampleEmployeeCardFixture: EmployeeCardFixtureData = {
  employees: [
    { employeeId: "9007199254740993", firstName: "עובד", lastName: "סינתטי", orgUnitId: "T01", jobCode: "11", innerJobCode: "101" },
    { employeeId: "2", firstName: "נועם", lastName: "כהן", orgUnitId: "T01", jobCode: "-9", innerJobCode: null },
  ],
  units: [
    { code: "T01", label: "צוות סינתטי", unitType: "J01", parentCode: "01" },
    { code: "01", label: "מוקד סינתטי", unitType: "G01", parentCode: null },
  ],
  activeJobPairs: [{ code: "11", label: "תפקיד סינתטי" }],
  innerJobs: [{ code: "101", label: "תפקיד פנימי סינתטי" }],
};
