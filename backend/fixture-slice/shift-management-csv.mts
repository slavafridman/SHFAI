import { decimalId, localDateTime } from "./contract-validation.mts";
import { assertShiftWorkAllowed, nextShiftCivilDate } from "./shift-management-domain.mts";
import { shiftFail, ShiftManagementError } from "./shift-management-errors.mts";
import type { CsvColumnV1, CsvShiftEncodingV1, CsvShiftPreviewRowV1, ShiftDraftV1,
  ShiftWarningCodeV1 } from "./shift-management-contracts.mts";

const columns: readonly CsvColumnV1[] = [
  "personalId", "activityCode", "date", "location", "startTime", "endTime",
];
const header = columns.join(",");
const maximumBytes = 1048576;
const maximumRows = 100;
type CreateDraft = Extract<ShiftDraftV1, { kind: "create" }>;
// Backend-private parse result, NOT a REST preview or command authority.
// No raw/full9/first8 identity is retained or returned.
export interface ParsedShiftCsvRow {
  line: number;
  draft: CreateDraft | null;
  errors: CsvShiftPreviewRowV1["errors"];
  warningCodes: ShiftWarningCodeV1[];
}
export interface ParsedShiftCsv { rows: ParsedShiftCsvRow[] }

function invalidBody(): never {
  return shiftFail("INVALID_REQUEST", {
    invalidParameters: [{ name: "body", reason: "invalid-format" }],
  });
}
// Strict single-byte roundtrip map: WHATWG decoder replacement/unsupported
// bytes must not be accepted as evidence of Windows-1255 representability.
let windows1255: ReadonlyMap<string, number> | undefined;
function windowsMap(): ReadonlyMap<string, number> {
  if (windows1255) return windows1255;
  const decoder = new TextDecoder("windows-1255", { fatal: true });
  const map = new Map<string, number>();
  for (let byte = 0; byte <= 255; byte++) {
    try {
      const character = decoder.decode(Uint8Array.of(byte));
      if ([...character].length === 1 && character !== "\uFFFD" && !map.has(character))
        map.set(character, byte);
    } catch { /* Undefined single-byte positions are not representable. */ }
  }
  windows1255 = map;
  return map;
}
function decode(bytes: Uint8Array, encoding: CsvShiftEncodingV1): string {
  let text: string;
  try {
    // Keep BOM visible so precisely one UTF-8 byte-zero BOM can be removed.
    text = new TextDecoder(encoding, { fatal: true, ignoreBOM: true }).decode(bytes);
  } catch { return invalidBody(); }
  if (encoding === "utf-8") {
    const roundtrip = new TextEncoder().encode(text);
    if (roundtrip.length !== bytes.length || roundtrip.some((byte, i) => byte !== bytes[i]))
      return invalidBody();
    if (text.startsWith("\uFEFF")) text = text.slice(1);
  } else {
    const map = windowsMap();
    let i = 0;
    for (const character of text) {
      if (map.get(character) !== bytes[i++]) return invalidBody();
    }
    if (i !== bytes.length) return invalidBody();
  }
  // Newlines are structural only. Every other C0/C1 control and every further
  // BOM is invalid, including inside quotes; no multiline CSV is admitted.
  if (text.includes("\uFEFF") || /[\u0000-\u0009\u000B\u000C\u000E-\u001F\u007F-\u009F]/u.test(text))
    return invalidBody();
  return text;
}
function cells(line: string): string[] | null {
  const result: string[] = [];
  let at = 0;
  while (true) {
    let cell = "";
    // Only ASCII spaces at cell edges are trimmed. Quotes wrap whole fields.
    while (line[at] === " ") at++;
    if (line[at] === '"') {
      at++;
      let closed = false;
      while (at < line.length) {
        const character = line[at++];
        if (character !== '"') cell += character;
        else if (line[at] === '"') { cell += '"'; at++; }
        else { closed = true; break; }
      }
      if (!closed) return invalidBody();
      while (line[at] === " ") at++;
      if (at < line.length && line[at] !== ",") return invalidBody();
    } else {
      const start = at;
      while (at < line.length && line[at] !== ",") {
        if (line[at] === '"') return invalidBody();
        at++;
      }
      cell = line.slice(start, at);
    }
    result.push(cell.replace(/^ +| +$/g, ""));
    if (result.length > columns.length) return null;
    if (at === line.length) break;
    at++;
  }
  return result.length === columns.length ? result : null;
}
function csvDate(value: string): string | null {
  if (!/^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/.test(value)) return null;
  const [day, month, year] = value.split("/");
  const date = `${year}-${month}-${day}`;
  return localDateTime(date + "T00:00:00") ? date : null;
}
const time = (value: string) => /^(?:[01][0-9]|2[0-3]):[0-5][0-9]$/.test(value);

export function parseShiftCsv(bytes: Uint8Array, encoding: CsvShiftEncodingV1,
  selectedFullPersonalId: string, signal?: AbortSignal): ParsedShiftCsv {
  assertShiftWorkAllowed(signal);
  if (encoding !== "utf-8" && encoding !== "windows-1255")
    shiftFail("UNSUPPORTED_MEDIA_TYPE", {
      invalidParameters: [{ name: "charset", reason: "unsupported" }],
    });
  if (!(bytes instanceof Uint8Array)) return invalidBody();
  if (bytes.byteLength > maximumBytes) shiftFail("REQUEST_TOO_LARGE");
  // Selected identity must already have been scoped and uniquely resolved by
  // the snapshot adapter; this parser never performs discovery/prefix lookup.
  if (typeof selectedFullPersonalId !== "string" || !/^[0-9]{9}$/.test(selectedFullPersonalId))
    shiftFail("INVALID_SOURCE_DATA");
  const text = decode(bytes, encoding);
  // Retain enough lines to prove overflow, never allocate an unbounded line
  // array for a body consisting almost entirely of newline bytes.
  const lines = text.split(/\r\n|\n/, maximumRows + 3);
  if (lines.at(-1) === "") lines.pop(); // At most one optional terminal newline.
  if (lines.some(line => line.includes("\r"))) return invalidBody();
  if (lines[0] !== header)
    shiftFail("BUSINESS_VALIDATION_FAILED", {
      ruleViolations: [{ row: 1, field: null, code: "CSV_INVALID_HEADER" }],
    });
  if (lines.length < 2) return invalidBody();
  if (lines.length - 1 > maximumRows)
    shiftFail("BUSINESS_VALIDATION_FAILED", {
      ruleViolations: [{ row: null, field: null, code: "CSV_LIMIT_EXCEEDED" }],
    });
  const rows: ParsedShiftCsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    assertShiftWorkAllowed(signal);
    const row: ParsedShiftCsvRow = { line: i + 1, draft: null, errors: [], warningCodes: [] };
    rows.push(row);
    const values = cells(lines[i]);
    if (!values) { row.errors.push({ column: "row", code: "CSV_INVALID_ROW" }); continue; }
    const [rawPersonalId, activityCode, dateCell, locationCell, startTime, endTime] = values;
    const idValid = /^(?:X)?[0-9]{9}$/.test(rawPersonalId);
    if (!idValid) row.errors.push({ column: "personalId", code: "CSV_INVALID_ROW" });
    else {
      const full9 = rawPersonalId.startsWith("X") ? rawPersonalId.slice(1) : rawPersonalId;
      if (full9 !== selectedFullPersonalId)
        row.errors.push({ column: "personalId", code: "CSV_EMPLOYEE_MISMATCH" });
      // No first8 is derived here: no downstream identity lookup is necessary.
    }
    if (!decimalId(activityCode)) row.errors.push({ column: "activityCode", code: "CSV_INVALID_ROW" });
    const date = csvDate(dateCell);
    if (date === null) row.errors.push({ column: "date", code: "CSV_INVALID_ROW" });
    if (!/^[hHmM]?$/.test(locationCell)) row.errors.push({ column: "location", code: "CSV_INVALID_ROW" });
    if (!time(startTime)) row.errors.push({ column: "startTime", code: "CSV_INVALID_ROW" });
    if (!time(endTime) || time(startTime) && endTime === startTime)
      row.errors.push({ column: "endTime", code: "CSV_INVALID_ROW" });
    if (row.errors.length || date === null) continue;
    let endDate = date;
    if (endTime < startTime) {
      try { endDate = nextShiftCivilDate(date); }
      catch (error) {
        if (!(error instanceof ShiftManagementError) || error.code !== "BUSINESS_VALIDATION_FAILED") throw error;
        row.errors.push({ column: "date", code: "CSV_INVALID_ROW" }); continue;
      }
      row.warningCodes.push("OVERNIGHT_NORMALIZED");
    }
    row.draft = {
      kind: "create", startLocal: `${date}T${startTime}:00`, endLocal: `${endDate}T${endTime}:00`,
      activityCode, workLocation: locationCell.toLowerCase() === "h" ? "home" : "site", remark: null,
    };
  }
  // Same interval is conflicting even if activity/location differs. All rows
  // are for the exact selected full9; no personal ID belongs in the map key.
  const intervals = new Map<string, ParsedShiftCsvRow[]>();
  for (const row of rows) {
    assertShiftWorkAllowed(signal);
    if (!row.draft) continue;
    const key = row.draft.startLocal + "/" + row.draft.endLocal;
    const group = intervals.get(key) ?? [];
    group.push(row); intervals.set(key, group);
  }
  for (const group of intervals.values()) {
    if (group.length < 2) continue;
    for (const row of group) {
      row.draft = null;
      row.errors.push({ column: "row", code: "CSV_DUPLICATE" });
    }
  }
  return { rows };
}
