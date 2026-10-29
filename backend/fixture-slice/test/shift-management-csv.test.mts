import test from "node:test";
import assert from "node:assert/strict";
import { parseShiftCsv } from "../shift-management-csv.mts";
import { ShiftManagementError, shiftProblem } from "../shift-management-errors.mts";
import { withRequestBudget } from "../request-budget-context.mts";

const header = "personalId,activityCode,date,location,startTime,endTime";
const selected = "001234567"; // Synthetic private identity, never a route selector.
const bytes = (rows: string[], prefix = header) =>
  new TextEncoder().encode([prefix, ...rows].join("\r\n"));

test("CSV raw9 and one uppercase X preserve zeros and are duplicate creations", () => {
  const result = parseShiftCsv(bytes([
    `${selected},1,01/01/2027,m,09:00,10:00`,
    `X${selected},1,01/01/2027,M,09:00,10:00`,
  ]), "utf-8", selected);
  assert.deepEqual(result.rows.map(row => row.errors), [
    [{ column: "row", code: "CSV_DUPLICATE" }],
    [{ column: "row", code: "CSV_DUPLICATE" }],
  ]);
  assert.ok(result.rows.every(row => row.draft === null));
  assert.ok(!JSON.stringify(result).includes(selected));
});

test("CSV compares full ninth digit before deriving any first8 identity", () => {
  const result = parseShiftCsv(bytes(["001234568,1,01/01/2027,,09:00,10:00"]), "utf-8", selected);
  assert.deepEqual(result.rows[0]?.errors, [
    { column: "personalId", code: "CSV_EMPLOYEE_MISMATCH" },
  ]);
  assert.equal(result.rows[0]?.draft, null);
});

const one = (cell = selected, date = "01/01/2027", location = "m",
  start = "09:00", end = "10:00") => `${cell},1,${date},${location},${start},${end}`;
const code = (expected: string) => (error: unknown) =>
  error instanceof ShiftManagementError && error.code === expected;

for (const identity of ["x001234567", "XX001234567", "00123456", "0001234567",
  "+001234567", "00123456A", "００１２３４５６７", "\u00A0001234567"]) {
  test(`CSV rejects noncanonical personal identity syntax: ${identity.length} characters`, () => {
    const row = parseShiftCsv(bytes([one(identity)]), "utf-8", selected).rows[0];
    assert.deepEqual(row?.errors, [{ column: "personalId", code: "CSV_INVALID_ROW" }]);
    assert.equal(row?.draft, null);
  });
}
test("valid CSV returns only private normalized create drafts, not tokens or identities", () => {
  const parsed = parseShiftCsv(bytes([one(" X001234567 ", "31/12/2026", "H", "23:00", "01:00")]),
    "utf-8", selected);
  assert.deepEqual(parsed, { rows: [{
    line: 2, draft: { kind: "create", startLocal: "2026-12-31T23:00:00",
      endLocal: "2027-01-01T01:00:00", activityCode: "1", workLocation: "home", remark: null },
    errors: [], warningCodes: ["OVERNIGHT_NORMALIZED"],
  }] });
  assert.ok(!JSON.stringify(parsed).includes(selected));
  assert.deepEqual(Object.keys(parsed), ["rows"]);
});
test("CSV BOM at byte zero, LF/CRLF and one final newline are supported", () => {
  for (const newline of ["\n", "\r\n"]) {
    const input = new TextEncoder().encode("\uFEFF" + header + newline + one() + newline);
    assert.equal(parseShiftCsv(input, "utf-8", selected).rows[0]?.errors.length, 0);
  }
});
test("CSV whole-cell quotes and doubled quotes obey strict framing", () => {
  const valid = `"${selected}","1","01/01/2027","m","09:00","10:00"`;
  assert.equal(parseShiftCsv(bytes([valid]), "utf-8", selected).rows[0]?.errors.length, 0);
  for (const invalid of [
    `"${selected}",1,"01/01/2027,m,09:00,10:00`,
    `${selected},1,01/01/2027,"m"x,09:00,10:00`,
    `${selected},1,01/01/2027,m",09:00,10:00`,
  ]) {
    assert.throws(() => parseShiftCsv(bytes([invalid]), "utf-8", selected), code("INVALID_REQUEST"));
  }
  for (const location of ['"m,h"', '"m""h"']) {
    assert.deepEqual(parseShiftCsv(bytes([one(selected, "01/01/2027", location)]),
      "utf-8", selected).rows[0]?.errors, [{ column: "location", code: "CSV_INVALID_ROW" }]);
  }
});
test("CSV header and record width are exact, no blank rows or skipped lines", () => {
  for (const firstLine of [header.toUpperCase(), " " + header, header + ",ERROR",
    header.replace("personalId", '"personalId"')]) {
    assert.throws(() => parseShiftCsv(bytes([one()], firstLine), "utf-8", selected),
      code("BUSINESS_VALIDATION_FAILED"));
  }
  for (const line of ["", one() + ",", one().slice(0, -6)]) {
    const parsed = parseShiftCsv(bytes([line, one(selected, "02/01/2027")]), "utf-8", selected);
    assert.deepEqual(parsed.rows[0]?.errors, [{ column: "row", code: "CSV_INVALID_ROW" }]);
    assert.equal(parsed.rows[1]?.line, 3);
  }
  assert.throws(() => parseShiftCsv(new TextEncoder().encode(header + "\n"), "utf-8", selected),
    code("INVALID_REQUEST"));
});
test("CSV all per-cell errors follow canonical column order without echoing input", () => {
  const parsed = parseShiftCsv(bytes(["PRIVATE,0,29/02/2027,=SUM(A1),9:00,09:00"]),
    "utf-8", selected);
  assert.deepEqual(parsed.rows[0]?.errors.map(error => error.column),
    ["personalId", "activityCode", "date", "location", "startTime"]);
  assert.ok(!JSON.stringify(parsed).includes("PRIVATE"));
  assert.ok(!JSON.stringify(parsed).includes("SUM"));
});
for (const [date, start, end, valid] of [
  ["29/02/2028", "09:00", "10:00", true],
  ["29/02/2100", "09:00", "10:00", false],
  ["29/02/2000", "09:00", "10:00", true],
  ["31/04/2027", "09:00", "10:00", false],
  ["01/01/0000", "09:00", "10:00", false],
  ["31/12/9999", "23:00", "01:00", false],
  ["01/01/2027", "09:00", "09:00", false],
  ["01/01/2027", "24:00", "10:00", false],
  ["01/01/2027", "09:00", "10:60", false],
] as const) {
  test(`CSV strict Gregorian/time grammar ${date} ${start}-${end}`, () => {
    const row = parseShiftCsv(bytes([one(selected, date, "", start, end)]), "utf-8", selected).rows[0];
    assert.equal(row?.errors.length === 0, valid);
    assert.equal(row?.draft !== null, valid);
  });
}
test("CSV duplicate interval is an error on every participant, not activity/location override", () => {
  const rows = [one(), one().replace(",1,", ",2,"), one(selected, "01/01/2027", "h")];
  const parsed = parseShiftCsv(bytes(rows), "utf-8", selected);
  assert.ok(parsed.rows.every(row => row.errors.some(error => error.code === "CSV_DUPLICATE")));
});
test("CSV strict UTF-8/Windows-1255 decoding never guesses or repairs", () => {
  const ascii = bytes([one()]);
  assert.deepEqual(parseShiftCsv(ascii, "windows-1255", selected),
    parseShiftCsv(ascii, "utf-8", selected));
  const hebrew = bytes([one(selected, "01/01/2027", "א")]);
  assert.deepEqual(parseShiftCsv(hebrew, "utf-8", selected).rows[0]?.errors,
    [{ column: "location", code: "CSV_INVALID_ROW" }]);
  const cpHebrew = Uint8Array.from([...bytes([one()]).slice(0, -12), 0xE0,
    ...new TextEncoder().encode(",09:00,10:00")]);
  assert.deepEqual(parseShiftCsv(cpHebrew, "windows-1255", selected).rows[0]?.errors,
    [{ column: "location", code: "CSV_INVALID_ROW" }]);
  for (const invalid of [
    Uint8Array.from([...ascii, 0xC0, 0xAF]),
    Uint8Array.from([...ascii, 0xED, 0xA0, 0x80]),
    Uint8Array.from([...ascii, 0xFF]),
  ]) assert.throws(() => parseShiftCsv(invalid, "utf-8", selected), code("INVALID_REQUEST"));
  // Node's Windows-1255 table defines CA as U+05BA; D9..DF/FB/FC/FF
  // are undefined. Do not copy a guessed "undefined" byte from a fake codec.
  assert.equal(parseShiftCsv(Uint8Array.from([...ascii, 0xCA]), "windows-1255", selected)
    .rows[0]?.errors[0]?.column, "endTime");
  for (const byte of [0xD9, 0xDA, 0xDB, 0xDC, 0xDD, 0xDE, 0xDF, 0xFB, 0xFC, 0xFF])
    assert.throws(() => parseShiftCsv(Uint8Array.from([...ascii, byte]), "windows-1255", selected),
      code("INVALID_REQUEST"));
  assert.throws(() => Reflect.apply(parseShiftCsv, null, [ascii, "UTF8", selected]),
    code("UNSUPPORTED_MEDIA_TYPE"));
});
test("CSV rejects control bytes, embedded/repeated BOM and bare CR", () => {
  for (const suffix of ["\u0000", "\t", "\u007F", "\u0085", "\uFEFF", "\r"]) {
    assert.throws(() => parseShiftCsv(new TextEncoder().encode(header + "\n" + one() + suffix),
      "utf-8", selected), code("INVALID_REQUEST"));
  }
  assert.throws(() => parseShiftCsv(new TextEncoder().encode("\uFEFF\uFEFF" + header + "\n" + one()),
    "utf-8", selected), code("INVALID_REQUEST"));
  assert.throws(() => parseShiftCsv(bytes([`${selected},1,01/01/2027,"m\nh",09:00,10:00`]),
    "utf-8", selected), code("INVALID_REQUEST"));
});
test("CSV 100 row bound accepts 100, rejects 101 without truncation", () => {
  const rows = Array.from({ length: 100 }, (_, i) =>
    one(selected, `${String(i % 28 + 1).padStart(2, "0")}/${String(Math.floor(i / 28) + 1).padStart(2, "0")}/2027`));
  const parsed = parseShiftCsv(bytes(rows), "utf-8", selected);
  assert.equal(parsed.rows.length, 100);
  assert.ok(parsed.rows.every(row => row.errors.length === 0));
  assert.throws(() => parseShiftCsv(bytes([...rows, one()]), "utf-8", selected),
    code("BUSINESS_VALIDATION_FAILED"));
  assert.throws(() => parseShiftCsv(bytes(Array(11000).fill("")), "utf-8", selected),
    code("BUSINESS_VALIDATION_FAILED"));
});
test("CSV encoded-byte bound is inclusive at 1MiB", () => {
  const input = bytes([one()]);
  const padded = new Uint8Array(1048576);
  padded.fill(0x20); padded.set(input);
  assert.equal(parseShiftCsv(padded, "utf-8", selected).rows[0]?.errors.length, 0);
  const oversized = new Uint8Array(1048577);
  assert.throws(() => parseShiftCsv(oversized, "utf-8", selected), code("REQUEST_TOO_LARGE"));
});
test("CSV absent/non-numeric selected private full9 fails as source, not a worker mismatch", () => {
  for (const identity of ["", "A01234567", "00123456", "X001234567"]) {
    assert.throws(() => parseShiftCsv(bytes([one()]), "utf-8", identity), code("INVALID_SOURCE_DATA"));
  }
});
test("CSV explicit and ambient abort/deadline guards stop pure work", async () => {
  const controller = new AbortController(); controller.abort();
  assert.throws(() => parseShiftCsv(bytes([one()]), "utf-8", selected, controller.signal),
    code("DEPENDENCY_TIMEOUT"));
  await withRequestBudget(controller.signal, 5000, async () => {
    assert.throws(() => parseShiftCsv(bytes([one()]), "utf-8", selected), code("DEPENDENCY_TIMEOUT"));
  });
  await withRequestBudget(new AbortController().signal, -1, async () => {
    assert.throws(() => parseShiftCsv(bytes([one()]), "utf-8", selected), code("DEPENDENCY_TIMEOUT"));
  });
});
test("pure error reporting is canonical and never reveals thrown source text", () => {
  const problem = shiftProblem(new Error("PRIVATE SOURCE PAYLOAD"), "synthetic-request");
  assert.equal(problem.code, "INTERNAL_ERROR");
  assert.ok(!JSON.stringify(problem).includes("PRIVATE"));
  try { parseShiftCsv(bytes([one()], "PRIVATE"), "utf-8", selected); }
  catch (error) {
    const invalid = shiftProblem(error, "synthetic-request");
    assert.equal(invalid.code, "BUSINESS_VALIDATION_FAILED");
    assert.deepEqual(invalid.ruleViolations, [{ row: 1, field: null, code: "CSV_INVALID_HEADER" }]);
    assert.equal(invalid.effect, "none");
    assert.ok(!JSON.stringify(invalid).includes("PRIVATE"));
  }
});

test("CSV output does not alias input bytes and exposes no effects/receipt/authority", () => {
  const input = bytes([one()]);
  const before = Uint8Array.from(input);
  const result = parseShiftCsv(input, "utf-8", selected);
  assert.deepEqual(input, before);
  input.fill(0);
  assert.equal(result.rows[0]?.draft?.activityCode, "1");
  for (const forbidden of ["validationToken", "previewToken", "fingerprint", "receipt",
    "dataSource", "partnerCompletion", "personalId", "full9", "first8"])
    assert.ok(!JSON.stringify(result).includes(`"${forbidden}"`));
});
