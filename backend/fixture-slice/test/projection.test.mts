import { test } from "node:test";
import assert from "node:assert/strict";
import { project } from "../projection.mts";
import { row, config } from "./fixtures.mts";

test("baseline and independent non-null overlay preserve source values without mutation", () => {
  const source = row({ changedEndLocal: "2026-10-15T01:00:00", changedActivityData: "  ;raw  " });
  const before = structuredClone(source);
  const result = project(source, config.businessTimeZone);
  assert.deepEqual(result.effectiveShift, {
    startLocal: source.baselineStartLocal, endLocal: source.changedEndLocal,
    activityData: "  ;raw  ", siteId: "3001",
  });
  assert.deepEqual(result.attendance, {
    stageArrivalLocal: null, stationArrivalLocal: null, stationExitLocal: null,
  });
  assert.deepEqual(source, before);
  assert.equal(result.employee.firstName, "עובד");
  assert.equal(result.dataSource, "isolated-fixture");
});
