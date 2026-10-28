// Backend-private synthetic TEST pilot syntax, not public numeric API IDs.
// Exact ASCII/case/leading zeros; no numeric conversion or normalization.
export function pilotEmployeeNumber(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9]{8,9}$/.test(value) && Buffer.byteLength(value, "utf8") <= 9;
}
export function pilotEmployeePrefix(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9]{8}$/.test(value) && Buffer.byteLength(value, "utf8") === 8;
}
export function pilotEmployeeNumberColumn(value: { dataType: unknown; dataLength: unknown; charUsed: unknown }): boolean {
  return value.dataType === "VARCHAR2" && value.charUsed === "B" && typeof value.dataLength === "number" &&
    Number.isSafeInteger(value.dataLength) && value.dataLength >= 9;
}
