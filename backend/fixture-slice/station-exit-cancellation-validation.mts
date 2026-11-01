import type { CancellationCommandV1, CancellationDraftV1 } from "./station-exit-cancellation-contracts.mts";
import { exact } from "./stage-arrival-validation.mts";
import { localDateTime } from "./contract-validation.mts";
import { CancellationError } from "./station-exit-cancellation-errors.mts";
import { stageFail } from "./stage-arrival-errors.mts";
import { parseStageJson } from "./stage-arrival-validation.mts";
import type { CancellationFixtureManifestV1 } from "./station-exit-cancellation-private-contracts.mts";

export function cancellationManifest(raw: string): CancellationFixtureManifestV1 {
  if (Buffer.byteLength(raw) > 16384) throw Error("Cancellation manifest too large");
  const v = parseStageJson(raw);
  if (!exact(v, ["version", "scenarioId", "clockInstant"]) ||
      v.version !== "shf-station-exit-cancellation-fixture-v1" || !cancellationInstant(v.clockInstant))
    throw Error("Explicit cancellation fixture manifest required");
  const scenarioId = v.scenarioId;
  if (scenarioId !== "ready" && scenarioId !== "not-recorded" && scenarioId !== "early-deferred" &&
      scenarioId !== "partner-required" && scenarioId !== "partner-unknown" && scenarioId !== "outcome-unknown" &&
      scenarioId !== "authority-consumed") throw Error("Invalid cancellation fixture scenario");
  return { version: v.version, scenarioId, clockInstant: v.clockInstant };
}

export function cancellationInstant(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(v) &&
    localDateTime(v.slice(0, 19)) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
}
export function cancellationDraft(v: unknown): CancellationDraftV1 {
  if (!exact(v, [])) stageFail("INVALID_REQUEST");
  return {};
}
export function cancellationCommand(v: unknown): CancellationCommandV1 {
  if (!exact(v, ["commandId", "draft", "validationToken", "fingerprint", "warningConfirmation", "operationConfirmation"]) ||
      typeof v.commandId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(v.commandId) ||
      typeof v.validationToken !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(v.validationToken) ||
      typeof v.fingerprint !== "string" || !/^[0-9a-f]{64}$/.test(v.fingerprint) ||
      !exact(v.warningConfirmation, ["accepted", "code"]) ||
      v.warningConfirmation.code !== "RECORDED_EXIT_WILL_BE_CLEARED" ||
      !exact(v.operationConfirmation, ["accepted"])) stageFail("INVALID_REQUEST");
  cancellationDraft(v.draft);
  if (v.warningConfirmation.accepted !== true || v.operationConfirmation.accepted !== true)
    throw new CancellationError("CONFIRMATION_REQUIRED");
  return { commandId: v.commandId, draft: {}, validationToken: v.validationToken, fingerprint: v.fingerprint,
    warningConfirmation: { accepted: true, code: "RECORDED_EXIT_WILL_BE_CLEARED" },
    operationConfirmation: { accepted: true } };
}
