import { projectPersonalShift } from '../personal-shifts/personal-shifts.js';
import type { DemoBreakView } from './break-contracts.js';
import { createSyntheticShiftFacts } from './fixtures.js';

export function syntheticBreakView(shiftId: string): DemoBreakView | null {
  const shift = createSyntheticShiftFacts().map(fact =>
    projectPersonalShift(fact, { actorEmployeeId: '00000001', canViewBaseline: false }))
    .find(item => item?.id === shiftId);
  if (!shift) { return null; }
  const date = shift.effective.startLocal.slice(0, 10);
  const overnight = shift.id === '9007199254740998';
  const unknown = shift.id === '9007199254740999';
  return {
    shift,
    breaks: unknown ? [] : overnight ? [
      { id: 'break-1', startLocal: '2026-10-17T00:30:00', endLocal: '2026-10-17T00:45:00', actualStartLocal: null, actualEndLocal: null },
      { id: 'break-2', startLocal: '2026-10-17T03:00:00', endLocal: '2026-10-17T03:30:00', actualStartLocal: null, actualEndLocal: null },
    ] : [
      { id: 'break-1', startLocal: `${date}T10:00:00`, endLocal: `${date}T10:15:00`, actualStartLocal: `${date}T10:00:23`, actualEndLocal: `${date}T10:16:08` },
      { id: 'break-2', startLocal: `${date}T13:00:00`, endLocal: `${date}T13:30:00`, actualStartLocal: null, actualEndLocal: null },
    ],
    previewAvailable: shift.id === '9007199254740993' || overnight,
    unavailableReason: shift.effective.split.enabled === true ? 'SPLIT_POLICY_UNVERIFIED'
      : shift.id === '9007199254740995' ? 'MANAGED_POLICY_UNVERIFIED'
        : unknown ? 'BREAK_SOURCE_UNVERIFIED' : null,
    policy: { version: 'synthetic-break-policy-1', edgeMinutes: 60, gapMinutes: 60, minDurationMinutes: 1, maxDurationMinutes: 120 },
  };
}
