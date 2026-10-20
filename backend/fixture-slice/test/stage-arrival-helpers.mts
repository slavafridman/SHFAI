import { StageArrivalApplication } from "../stage-arrival-application.mts";
import { MemoryStageArrivalStore } from "../stage-arrival-memory.mts";
import type { StageArrivalTestFault } from "../stage-arrival-memory.mts";
import { sampleStageArrivalConfig, sampleStageArrivalFacts } from "../stage-arrival-sample.mts";
import { createRuntime, SyntheticAdministratorProvider } from "../synthetic-identity.mts";
import { createStageArrivalFixture, stageArrivalReadAdapters } from "../stage-arrival-fixture.mts";
import type { StageArrivalCommitDraftV1, StageArrivalDraftV1, StageArrivalValidationDraftV1 } from "../stage-arrival-contracts.mts";
import type { NativeStageArrivalValidationV1 } from "../oracle-stage-arrival-contracts.mts";

export class VirtualClock {
  milliseconds = Date.parse("2026-10-20T07:22:00.000Z");
  now() { return new Date(this.milliseconds); }
  advance(ms: number) { this.milliseconds += ms; }
}
export const clean: StageArrivalDraftV1 = { lateReasonCode: null, lateRemark: null };
export const late: StageArrivalDraftV1 = { lateReasonCode: "1", lateRemark: null };
export const selected = { employeeId: "9001", shiftDayId: "6201" };
export const principal = () => new SyntheticAdministratorProvider(sampleStageArrivalConfig).authenticate({ authorization: null });
export function commitInput(v: StageArrivalValidationDraftV1 | NativeStageArrivalValidationV1, d = clean,
  commandId = "11111111-1111-4111-8111-111111111111"): StageArrivalCommitDraftV1 {
  return { commandId, draft: d, validationToken: v.validationToken, fingerprint: v.fingerprint,
    confirmation: v.confirmationRequired ? { accepted: true, warningCodes: ["STAGE_ARRIVAL_LATE"] } : null };
}
export function fixture(rows = [structuredClone(sampleStageArrivalFacts)], fault?: StageArrivalTestFault) {
  const clock = new VirtualClock(), store = new MemoryStageArrivalStore(rows, clock, fault);
  return { clock, store, app: new StageArrivalApplication(store, clock, "Asia/Jerusalem") };
}
export async function runtimeFixture() {
  const clock = new VirtualClock(), f = createStageArrivalFixture([sampleStageArrivalFacts], clock);
  const runtime = await createRuntime(sampleStageArrivalConfig, f.detail, undefined, {
    reader: f.current, clock, attendanceReader: f.attendance, stageArrivalStore: f.store,
  });
  return { ...f, clock, runtime };
}

export async function cancellationFixture(layer: "application" | "runtime", fault: StageArrivalTestFault) {
  const f = fixture(undefined, fault), p = await principal();
  if (layer === "application") {
    const v = await f.app.validate(p, selected, clean);
    return { ...f, execute: (signal?: AbortSignal) => f.app.commit(p, selected, commitInput(v), signal) };
  }
  const adapters = stageArrivalReadAdapters(f.store);
  const rt = await createRuntime(sampleStageArrivalConfig, adapters.detail, undefined, {
    reader: adapters.current, clock: f.clock, attendanceReader: adapters.attendance, stageArrivalStore: f.store,
  });
  const v = await rt.stageArrivalValidate(p, selected, clean);
  return { ...f, execute: (signal?: AbortSignal) => rt.stageArrivalCommit(p, selected, commitInput(v), signal) };
}
