export type DemoStaffingKind = 'reinforcement' | 'time-change' | 'reduction';

export interface DemoStaffingRequest {
  readonly id: string;
  readonly kind: DemoStaffingKind;
  readonly unitId: 'synthetic-team-a' | 'synthetic-team-b';
  readonly title: string;
  readonly startLocal: string;
  readonly endLocal: string;
  readonly requested: number | null;
  readonly approved: number | null;
  readonly remaining: number | null;
  readonly deadlineLocal: string | null;
  readonly deadlineState: 'open' | 'elapsed' | 'unknown';
  readonly freshness: 'current' | 'stale' | 'unknown';
  readonly note: string | null;
}

export interface DemoStaffingCandidate {
  readonly id: string;
  readonly employeeId: string;
  readonly employeeName: string;
  readonly freshness: 'current' | 'stale' | 'unknown';
  readonly asOfLocal: string | null;
  readonly note: string | null;
}

export interface DemoStaffingCapacity {
  readonly requested: number | null;
  readonly approved: number | null;
  readonly remaining: number | null;
}

export interface DemoStaffingEligibilityFacts {
  readonly jobCompatible: boolean | null;
  readonly intervalCompatible: boolean | null;
  readonly registrationExists: boolean | null;
}

export interface DemoStaffingPreview {
  readonly previewOnly: true;
  readonly saved: false;
  readonly assigned: false;
  readonly approved: false;
  readonly policyVersion: 'synthetic-staffing-policy-1';
  readonly requestId: string;
  readonly candidateId: string;
  readonly outcome: 'eligible-under-demo-policy' | 'blocked' | 'unknown';
  readonly blockers: readonly { readonly code: string; readonly message: string }[];
  readonly unknowns: readonly { readonly code: string; readonly message: string }[];
  readonly capacityBefore: DemoStaffingCapacity;
  readonly capacityIfApplied: DemoStaffingCapacity | null;
  readonly warnings: readonly string[];
}
