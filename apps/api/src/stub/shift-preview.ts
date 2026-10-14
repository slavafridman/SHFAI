import { localWallMinute } from '../personal-shifts/wall-time.js';
import { syntheticBreakView } from './break-fixtures.js';
import type { DemoShiftPreview, DemoShiftPreviewContext, DemoShiftProposal } from './shift-preview-contracts.js';

export class ShiftPreviewError extends Error {
  constructor(readonly code: string, message: string, readonly field: string | null = null) { super(message); }
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function minute(value: unknown, field: string): number {
  const result = localWallMinute(value);
  if (result === null) {
    throw new ShiftPreviewError('INVALID_SHIFT_PROPOSAL', 'יש להזין תאריך ושעה מקומיים תקינים בדיוק של דקות.', field);
  }
  return result;
}

export function parseShiftProposal(value: unknown): DemoShiftProposal {
  if (!record(value) || Object.keys(value).length !== 4
    || Object.keys(value).some(key => !['startLocal', 'endLocal', 'reason', 'split'].includes(key))
    || typeof value['startLocal'] !== 'string' || typeof value['endLocal'] !== 'string'
    || typeof value['reason'] !== 'string' || !value['reason'].trim() || value['reason'].length > 200) {
    throw new ShiftPreviewError('INVALID_SHIFT_PROPOSAL', 'הצעה כוללת התחלה, סיום, סיבה של עד 200 תווים ופיצול מפורש בלבד.');
  }
  minute(value['startLocal'], 'startLocal');
  minute(value['endLocal'], 'endLocal');
  let split: DemoShiftProposal['split'] = null;
  if (value['split'] !== null) {
    const gap = value['split'];
    if (!record(gap) || Object.keys(gap).length !== 2 || typeof gap['gapStartLocal'] !== 'string'
      || typeof gap['gapEndLocal'] !== 'string' || Object.keys(gap).some(key => !['gapStartLocal', 'gapEndLocal'].includes(key))) {
      throw new ShiftPreviewError('INVALID_SHIFT_PROPOSAL', 'יש לספק תחילת וסיום פער לפיצול.', 'split');
    }
    minute(gap['gapStartLocal'], 'gapStartLocal');
    minute(gap['gapEndLocal'], 'gapEndLocal');
    split = { gapStartLocal: gap['gapStartLocal'], gapEndLocal: gap['gapEndLocal'] };
  }
  return { startLocal: value['startLocal'], endLocal: value['endLocal'], reason: value['reason'].trim(), split };
}

export function syntheticShiftContext(id: string): DemoShiftPreviewContext | null {
  const source = syntheticBreakView(id);
  if (source === null) { return null; }
  const available = ['9007199254740993', '9007199254740994', '9007199254740998'].includes(id);
  return {
    shift: source.shift,
    breaks: source.breaks.map(item => ({ id: item.id, startLocal: item.startLocal, endLocal: item.endLocal })),
    previewAvailable: available, unavailableReason: available ? null : 'SHIFT_SOURCE_POLICY_UNVERIFIED',
    policyVersion: 'synthetic-shift-policy-1',
  };
}

export function previewShiftChange(context: DemoShiftPreviewContext, input: DemoShiftProposal): DemoShiftPreview {
  const proposal = parseShiftProposal(input);
  if (!context.previewAvailable) {
    throw new ShiftPreviewError('SHIFT_PREVIEW_UNAVAILABLE', 'מדיניות מקור או שותף למשמרת זו לא אומתה.');
  }
  const start = minute(proposal.startLocal, 'startLocal');
  const end = minute(proposal.endLocal, 'endLocal');
  const span = end - start;
  if (proposal.startLocal < '2026-10-14T00:00:00' || proposal.startLocal >= '2026-10-18T00:00:00'
    || proposal.endLocal > '2026-10-19T00:00:00') {
    throw new ShiftPreviewError('SHIFT_OUTSIDE_DEMO_WINDOW', 'התחלת משמרת חייבת להיות בתאריכי ההדגמה 14–17.10.2026.', 'startLocal');
  }
  if (span < 240 || span > 960) {
    throw new ShiftPreviewError('SHIFT_DURATION_INVALID', 'טווח משמרת בהדגמה: 240–960 דקות.', 'endLocal');
  }
  let gapMinutes = 0;
  let firstPart: number | null = null;
  let secondPart: number | null = null;
  let gapStart = 0;
  let gapEnd = 0;
  if (proposal.split !== null) {
    gapStart = minute(proposal.split.gapStartLocal, 'gapStartLocal');
    gapEnd = minute(proposal.split.gapEndLocal, 'gapEndLocal');
    gapMinutes = gapEnd - gapStart;
    firstPart = gapStart - start;
    secondPart = end - gapEnd;
    if (firstPart < 120 || gapMinutes < 120 || secondPart < 120) {
      throw new ShiftPreviewError('SPLIT_DURATION_INVALID', 'בהדגמה נדרשות לפחות 120 דקות בכל חלק ובפער ביניהם.', 'split');
    }
    if (gapEnd < minute(proposal.startLocal.slice(0, 10) + 'T16:00:00', 'gapEndLocal')) {
      throw new ShiftPreviewError('SPLIT_SECOND_PART_TOO_EARLY', 'החלק השני מתחיל לא לפני 16:00 ביום תחילת המשמרת.', 'gapEndLocal');
    }
  }
  if (span - gapMinutes < 240) {
    throw new ShiftPreviewError('SHIFT_WORKING_DURATION_INVALID', 'נדרשות לפחות 240 דקות עבודה בהדגמה.', 'split');
  }
  for (const item of context.breaks) {
    const breakStart = minute(item.startLocal, 'startLocal');
    const breakEnd = minute(item.endLocal, 'endLocal');
    if (breakStart < start || breakEnd > end
      || (proposal.split !== null && breakStart < gapEnd && breakEnd > gapStart)) {
      throw new ShiftPreviewError('PLANNED_BREAK_CONFLICT', 'ההצעה מתנגשת בהפסקה מתוכננת. הפסקות והצעות אינן נמחקות או משתנות.', 'split');
    }
  }
  return {
    previewOnly: true, saved: false, policyVersion: 'synthetic-shift-policy-1',
    before: structuredClone(context.shift),
    proposed: {
      ...structuredClone(context.shift.effective), startLocal: proposal.startLocal, endLocal: proposal.endLocal,
      split: {
        enabled: proposal.split !== null, gapStartLocal: proposal.split?.gapStartLocal ?? null,
        gapEndLocal: proposal.split?.gapEndLocal ?? null,
      },
    },
    reason: proposal.reason, minutes: { span, working: span - gapMinutes, gap: gapMinutes, firstPart, secondPart },
    warnings: [
      'חישוב סינתטי בלבד; לא נשמר ולא נשלח לשותף.',
      'אין אימות זמינות עובדים, נוכחות, הצעות החלפה, פרמטרי יחידה או שעון קיץ. אין מחיקת הצעות או הקצאת מזהים.',
    ],
  };
}
