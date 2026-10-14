import type { PersonalShiftItem, ShiftSchedule } from '../personal-shifts/contracts.js';

export interface DemoShiftProposal {
  readonly startLocal: string;
  readonly endLocal: string;
  readonly reason: string;
  readonly split: { readonly gapStartLocal: string; readonly gapEndLocal: string } | null;
}

export interface DemoShiftPreviewContext {
  readonly shift: PersonalShiftItem;
  readonly breaks: readonly { readonly id: string; readonly startLocal: string; readonly endLocal: string }[];
  readonly previewAvailable: boolean;
  readonly unavailableReason: string | null;
  readonly policyVersion: 'synthetic-shift-policy-1';
}

export interface DemoShiftPreview {
  readonly previewOnly: true;
  readonly saved: false;
  readonly policyVersion: 'synthetic-shift-policy-1';
  readonly before: PersonalShiftItem;
  readonly proposed: ShiftSchedule;
  readonly reason: string;
  readonly minutes: {
    readonly span: number; readonly working: number; readonly gap: number;
    readonly firstPart: number | null; readonly secondPart: number | null;
  };
  readonly warnings: readonly string[];
}
