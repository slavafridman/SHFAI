import type { Clock } from "./current-shifts-contracts.mts";
import { stationEnvelope } from "./station-arrival-validation.mts";
import { stationClassify, stationNow } from "./station-arrival-domain.mts";
import { MemoryStageArrivalStore } from "./stage-arrival-memory.mts";
import { stageArrivalReadAdapters } from "./stage-arrival-fixture.mts";

export function createStationArrivalFixture(value: unknown, clock: Clock, zone: string) {
  const envelope = stationEnvelope(value);
  // Resolve every supplied civil original before listen, not only selected rows.
  const now = stationNow(clock);
  for (const row of envelope.stageRows) stationClassify(row, now, zone);
  const store = new MemoryStageArrivalStore(envelope.stageRows, clock, undefined, envelope.stationFacts);
  return { store, ...stageArrivalReadAdapters(store) };
}
