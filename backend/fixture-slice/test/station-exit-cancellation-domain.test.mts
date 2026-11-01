import { test } from "node:test";
import assert from "node:assert/strict";
import { cancellationWindow } from "../station-exit-cancellation-domain.mts";

const start = Date.parse("2026-11-01T06:00:00.000Z");
const end = Date.parse("2026-11-01T14:00:00.000Z");
const input = { start, end, arrival: start, exit: end - 6 * 60000,
  now: end, maxEarlyWholeMinutes: 5, maxAfterEndMinutes: 10,
  windowStart: start, windowEnd: end + 3600000 };
test("original ordinary classification uses full instant, strict early boundary", () => {
  assert.equal(cancellationWindow(input).ordinary, false);
  assert.equal(cancellationWindow({ ...input, exit: input.exit + 1 }).ordinary, true);
});
test("now upper equality included, +1ms excluded; operator upper exclusive", () => {
  assert.equal(cancellationWindow({ ...input, exit: end, now: end + 600000 }).within, true);
  assert.equal(cancellationWindow({ ...input, exit: end, now: end + 600001 }).within, false);
  assert.equal(cancellationWindow({ ...input, exit: end, windowEnd: end }).within, false);
});
test("arrival/order/lower boundaries and TTL remain independent of ordinary classification", () => {
  assert.equal(cancellationWindow({ ...input, exit: end + 1 }).ordinary, false);
  assert.equal(cancellationWindow({ ...input, exit: end, arrival: end + 1 }).ordinary, false);
  assert.equal(cancellationWindow({ ...input, exit: end, now: start - 3600001 }).within, false);
  assert.equal(cancellationWindow({ ...input, exit: end, windowEnd: end + 20 }).transition, end + 20);
});
test("invalid policy/time values reject, never inferred defaults", () => {
  for (const patch of [{ maxEarlyWholeMinutes: -1 }, { maxAfterEndMinutes: NaN },
    { end: start - 1 }, { exit: NaN }, { windowEnd: start }])
    assert.throws(() => cancellationWindow({ ...input, ...patch }), /INVALID_SOURCE_DATA/);
});
