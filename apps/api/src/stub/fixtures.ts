const employeeA = '00000001';
const employeeB = '00000002';

function schedule(employeeId: string, date: string) {
  return {
    employeeId,
    startLocal: `${date}T08:00:00`,
    endLocal: `${date}T16:00:00`,
    siteId: 'synthetic-site-x',
    activityId: 'synthetic-activity',
    workFromHomeFlag: 'N',
    split: { flag: 'N', gapStartLocal: null, gapEndLocal: null },
  };
}

export function createSyntheticShiftFacts(): readonly unknown[] {
  const baseline = schedule(employeeA, '2026-10-14');
  const split = schedule(employeeA, '2026-10-15');
  const transferred = schedule(employeeB, '2026-10-16');
  const foreign = schedule(employeeB, '2026-10-17');
  return [
    { id: '9007199254740993', projection: 'baseline', eligibility: 'included', baseline, effective: { ...baseline } },
    {
      id: '9007199254740994', projection: 'override', eligibility: 'included', baseline: split,
      effective: {
        ...split, endLocal: '2026-10-15T18:00:00', workFromHomeFlag: 'Y',
        split: { flag: 'Y', gapStartLocal: '2026-10-15T12:00:00', gapEndLocal: '2026-10-15T14:00:00' },
      },
    },
    {
      id: '9007199254740995', projection: 'override', eligibility: 'included', baseline: transferred,
      effective: { ...transferred, employeeId: employeeA, siteId: 'synthetic-site-y' },
    },
    { id: '9007199254740996', projection: 'baseline', eligibility: 'included', baseline: foreign, effective: { ...foreign } },
    { id: '9007199254740997', projection: 'baseline', eligibility: 'excluded', baseline, effective: { ...baseline } },
  ];
}
