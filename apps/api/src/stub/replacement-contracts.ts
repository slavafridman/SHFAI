export interface DemoReplacementShift {
  readonly id: string;
  readonly employeeId: string;
  readonly employeeName: string;
  readonly startLocal: string;
  readonly endLocal: string;
  readonly siteId: string | null;
}

export interface DemoReplacementCandidate {
  readonly id: string;
  readonly shift: DemoReplacementShift;
}

export interface DemoReplacementIssue {
  readonly code: string;
  readonly message: string;
}

export interface DemoReplacementPreview {
  readonly previewOnly: true;
  readonly saved: false;
  readonly accepted: false;
  readonly policyVersion: 'synthetic-replacement-policy-1';
  readonly sourceShiftId: string;
  readonly candidateId: string;
  readonly eligibility: 'eligible-under-demo-policy' | 'blocked' | 'confirmation-required' | 'unknown';
  readonly blockers: readonly DemoReplacementIssue[];
  readonly warnings: readonly DemoReplacementIssue[];
  readonly unknowns: readonly DemoReplacementIssue[];
}

export interface DemoReplacementFacts {
  readonly jobsCompatible: boolean | null;
  readonly sourceAttendanceClear: boolean | null;
  readonly candidateAttendanceClear: boolean | null;
  readonly restMinutes: readonly [number | null, number | null, number | null, number | null];
  readonly reviewRequired: boolean | null;
}

export interface DemoReplacementList {
  readonly source: DemoReplacementShift;
  readonly items: readonly DemoReplacementCandidate[];
  readonly policyVersion: 'synthetic-replacement-policy-1';
  readonly clockLocal: '2026-10-13T08:00:00';
  readonly nextCursor: null;
}
