import type { PersonalShiftItem } from '../personal-shifts/contracts.js';

export interface DemoBreak {
  readonly id: string;
  readonly startLocal: string;
  readonly endLocal: string;
  readonly actualStartLocal: string | null;
  readonly actualEndLocal: string | null;
}

export interface DemoBreakView {
  readonly shift: PersonalShiftItem;
  readonly breaks: readonly DemoBreak[];
  readonly previewAvailable: boolean;
  readonly unavailableReason: string | null;
  readonly policy: {
    readonly version: 'synthetic-break-policy-1';
    readonly edgeMinutes: 60;
    readonly gapMinutes: 60;
    readonly minDurationMinutes: 1;
    readonly maxDurationMinutes: 120;
  };
}

export interface DemoBreakProposal {
  readonly breakId: string;
  readonly startLocal: string;
  readonly durationMinutes: number;
}

export interface DemoBreakPreview {
  readonly previewOnly: true;
  readonly saved: false;
  readonly policyVersion: 'synthetic-break-policy-1';
  readonly before: DemoBreak;
  readonly proposed: { readonly id: string; readonly startLocal: string; readonly endLocal: string };
  readonly durationMinutes: number;
  readonly warnings: readonly string[];
}
