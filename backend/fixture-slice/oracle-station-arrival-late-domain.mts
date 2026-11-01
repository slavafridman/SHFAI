import { civil, instantFor } from "./stage-arrival-domain.mts";
import { decimalId, text } from "./contract-validation.mts";
import { stageFail } from "./stage-arrival-errors.mts";
import type { NativeRow } from "./oracle-stage-arrival-snapshot.mts";
export function stationLateTiming(f: { planned: { startLocal: string; endLocal: string } }, now: Date, zone: string) {
  const start = instantFor(f.planned.startLocal, zone), end = instantFor(f.planned.endLocal, zone);
  const t = now.getTime(), local = civil(now, zone);
  instantFor(local, zone);
  if (!Number.isFinite(t) || end <= start) stageFail("INVALID_SOURCE_DATA");
  if (local.slice(0, 10) !== f.planned.startLocal.slice(0, 10) || t <= start || t > end)
    stageFail("COMMAND_SCOPE_DEFERRED");
  // Follow shift-management-domain's civil-offset/duration and intermediate
  // offset checks, bounded here by the approved same-date plan. Unique civil
  // endpoints alone do not exclude a transition (or two with equal offsets).
  const nominalStart = Date.parse(f.planned.startLocal + "Z");
  const nominalEnd = Date.parse(f.planned.endLocal + "Z");
  const offset = nominalStart - start;
  if (f.planned.endLocal.slice(0, 10) !== f.planned.startLocal.slice(0, 10) ||
      end - start !== nominalEnd - nominalStart || nominalEnd - end !== offset)
    stageFail("COMMAND_SCOPE_DEFERRED");
  for (let sample = start; sample < end; sample += 3 * 3600000) {
    if (Date.parse(civil(new Date(sample), zone) + "Z") - sample !== offset)
      stageFail("COMMAND_SCOPE_DEFERRED");
  }
  const minutes = Math.floor((t - start) / 60000);
  return { local, minutes, transition: Math.min(start + (minutes + 1) * 60000, end + 1),
    arrivalWindow: { earliestLocal: f.planned.startLocal, latestLocal: f.planned.endLocal } };
}
export function lateReasonCatalog(rows: NativeRow[]) {
  if (rows.length > 1000) stageFail("INVALID_SOURCE_DATA");
  const ids = new Set<string>();
  for (const r of rows) {
    if (!decimalId(r.REASON_ID) || ids.has(r.REASON_ID) || r.SER_TYPE !== "2" ||
        !text(r.REASON_DESC, 256, 1) || !r.REASON_DESC.trim() || /[\p{Cc}\p{Cf}]/u.test(r.REASON_DESC))
      stageFail("INVALID_SOURCE_DATA");
    ids.add(r.REASON_ID);
  }
  return rows.filter(reasonSupported)
    .map(r => ({ code: r.REASON_ID!, label: r.REASON_DESC! }));
}
function reasonSupported(r: NativeRow) {
  return r.REPORTED === "0" && r.REPORT_REQUESTED === "0" &&
    Object.keys(r).every(k => ["REASON_ID", "BRANCH_ID", "REASON_DESC", "REPORTED", "REPORT_REQUESTED", "SER_TYPE"].includes(k));
}
export function requireLateReason(rows: NativeRow[], code: string) {
  lateReasonCatalog(rows);
  const reason = rows.find(r => r.REASON_ID === code);
  if (!reason) stageFail("BUSINESS_VALIDATION_FAILED");
  if (!reasonSupported(reason)) stageFail("COMMAND_SCOPE_DEFERRED");
}
