import { describe, it, expect } from 'vitest';
import { jointArrivalCapabilities, f1Capabilities, nativeArrivalCapabilities, identity } from './contract';
import { stationIdentity, stationContext, stationValidation } from './station-arrival-contract';
import { arrivalIdentity } from './stage-arrival-contract';
import { stationContextFixture, stationSelectionFixture } from './station-arrival-fixtures';
const principal = (capabilities: readonly string[] = jointArrivalCapabilities, dataSource = 'isolated-fixture') => ({
  dataSource, principal: { subject: 'synthetic:administrator', provider: 'synthetic', synthetic: true,
    displayName: 'Synthetic Administrator (local/isolated only)', roles: ['Administrator'], employeeId: null,
    capabilities: [...capabilities], resourceScope: { orgUnitIds: ['0021'] } },
});
describe('station canonical v0.1 admission', () => {
  it('admits exact joint 11 for F1 and F2 without widening native', () => {
    expect(identity(principal())).toBe(true); expect(stationIdentity(principal())).toBe(true);
    expect(arrivalIdentity(principal())).toBe(true);
    expect(stationIdentity(principal(f1Capabilities))).toBe(false);
    expect(stationIdentity(principal(nativeArrivalCapabilities, 'oracle'))).toBe(false);
    expect(stationIdentity(principal(jointArrivalCapabilities, 'oracle'))).toBe(false);
    expect(stationIdentity(null)).toBe(false);
  });
  it('rejects absent context and F1 warning', () => {
    expect(stationContext(null, {} as never)).toBe(false);
    expect(stationValidation({ state: 'warning-requires-confirmation',
      warnings: [{ code: 'STAGE_ARRIVAL_LATE', minutes: '1' }] }, {} as never)).toBe(false);
  });
  it.each([
    ['ordinary', '2026-10-20T18:30:00', true],
    ['zero-duration', '2026-10-20T10:30:00', true],
    ['overnight', '2026-10-21T02:30:00', true],
    ['end-before-start', '2026-10-20T10:29:59', false],
  ] as const)('admits approved endpoint ordering: %s', (_name, endLocal, accepted) => {
    const c = stationContextFixture(), s = stationSelectionFixture();
    c.planned.endLocal = endLocal; c.arrivalWindow.latestLocal = endLocal;
    s.endLocal = endLocal;
    expect(c.recorded.stageArrivalLocal).toBeNull();
    expect(stationContext(c, s)).toBe(accepted);
  });
});
