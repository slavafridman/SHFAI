import test from "node:test";
import assert from "node:assert/strict";
import { projectItem } from "../shift-items-projection.mts";
import { parseItemsQuery } from "../shift-items-validation.mts";

const row = { shiftDayId: "1", stateCode: "4", typeCode: null,
  startLocal: "2024-02-29T23:59:37", endLocal: "2024-03-01T00:00:13",
  durationMinutes: "-99999999999999999999999999999999999999",
  breakExitLocal: null, breakReturnLocal: null, remark: "<script>plain</script>", sourceCode: "DEL" };
test("BRX18-06/07 pure projection preserves signed precision, seconds, overnight and raw DEL", () => {
  const before = structuredClone(row), result = projectItem(row);
  assert.equal(result.durationMinutes, row.durationMinutes); assert.equal(result.sourceCode, "DEL");
  assert.equal(result.remark, row.remark); assert.equal(result.breakExitLocal, null);
  assert.deepEqual(row, before);
  assert.equal(projectItem({ ...row, endLocal: "2024-02-28T01:02:03" }).endLocal, "2024-02-28T01:02:03");
});
test("BRX18-05 classifications 2/4/7, signed type, unknown label and nonbreak actual applicability", () => {
  for (const [stateCode, kind] of [["2", "timeoff"], ["7", "exception"], ["1", "exception"]]) {
    const r = projectItem({ ...row, stateCode, typeCode: "-9", breakExitLocal: "not-applicable" });
    assert.equal(r.kind, kind); assert.deepEqual(r.type, { code: "-9", label: null });
    assert.equal(r.breakExitLocal, null);
  }
  assert.equal(projectItem({ ...row, stateCode: "2", typeCode: "0", remark: "" }).remark, null);
});
test("BRX18-06 invalid required source including NULL duration never coerced, bad dates rejected", () => {
  for (const patch of [{ durationMinutes: null }, { durationMinutes: "-0" }, { startLocal: null },
    { endLocal: "2023-02-29T00:00:00" }, { sourceCode: "x\n" }, { stateCode: "0" },
    { startLocal: "2024-01-01T00:00" }, { endLocal: "2024-01-01T00:00:00Z" }])
    assert.throws(() => projectItem({ ...row, ...patch }), { code: "INVALID_SOURCE_DATA" });
});
test("BRX18-03 exact query grammar and limits", () => {
  assert.deepEqual(parseItemsQuery(""), { limit: 25, offset: 0, sort: "start-asc" });
  assert.equal(parseItemsQuery("limit=100&offset=10000").limit, 100);
  for (const raw of ["limit=0", "limit=101", "offset=10001", "offset=-1", "limit=01",
    "limit=", "sort=", "kind=break", "limit=1&%6cimit=2", "offset=1e2", "%ff=x",
    "x".repeat(8193), "offset=0#x"]) assert.throws(() => parseItemsQuery(raw), { code: "INVALID_REQUEST" });
});
test("BRX18-07/08 year bounds, full-second actuals, literal source/text and Unicode length", () => {
  const r = projectItem({ ...row, startLocal: "0001-01-01T00:00:00", endLocal: "9999-12-31T23:59:59",
    breakExitLocal: "2024-02-29T23:59:59", breakReturnLocal: "2024-03-01T00:00:01",
    sourceCode: "';--", remark: "😀".repeat(1000), durationMinutes: "0" });
  assert.equal(r.breakReturnLocal, "2024-03-01T00:00:01");
  assert.equal(r.sourceCode, "';--"); assert.equal(r.durationMinutes, "0");
  assert.throws(() => projectItem({ ...row, remark: "😀".repeat(1001) }), { code: "INVALID_SOURCE_DATA" });
  assert.throws(() => projectItem({ ...row, endLocal: "0000-01-01T00:00:00" }), { code: "INVALID_SOURCE_DATA" });
});
