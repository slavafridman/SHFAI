import { shiftFail } from "./shift-management-errors.mts";
import type { ShiftRuleFieldV1 } from "./shift-management-contracts.mts";
import type { ShiftSnapshot } from "./shift-management-model.mts";

let isoHebrew: ReadonlyMap<string, number> | undefined;
function hebrewMap(): ReadonlyMap<string, number> {
  if (isoHebrew) return isoHebrew;
  const decoder = new TextDecoder("iso-8859-8", { fatal: true });
  const result = new Map<string, number>();
  for (let byte = 0; byte <= 255; byte++) {
    try {
      const character = decoder.decode(Uint8Array.of(byte));
      if (character !== "\uFFFD" && [...character].length === 1 && !result.has(character))
        result.set(character, byte);
    } catch { /* Undefined ISO-8859-8 positions have no representation. */ }
  }
  isoHebrew = result;
  return result;
}
// Database IW8ISO8859P8 is ISO-8859-8, NOT the CSV Windows-1255 codec.
export function shiftTextByteLength(value: string,
  charset: ShiftSnapshot["textStorage"]["charset"]): number | null {
  if (!value.isWellFormed() || value.includes("\uFFFD")) return null;
  if (charset === "AL32UTF8") return Buffer.byteLength(value, "utf8");
  if (charset !== "IW8ISO8859P8") return null;
  const map = hebrewMap();
  for (const character of value) if (!map.has(character)) return null;
  return [...value].length;
}
export function requireShiftTextFits(value: string | null, maximumBytes: number,
  charset: ShiftSnapshot["textStorage"]["charset"], field: ShiftRuleFieldV1 | null): void {
  if (value === null) return;
  const bytes = shiftTextByteLength(value, charset);
  if (bytes === null || bytes > maximumBytes) shiftFail("BUSINESS_VALIDATION_FAILED", {
    ruleViolations: [{ row: null, field, code: "TEXT_NOT_REPRESENTABLE" }],
  });
}
