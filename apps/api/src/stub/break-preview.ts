import type { DemoBreakProposal, DemoBreakView, DemoBreakPreview } from './break-contracts.js';
import { localWallMinute } from '../personal-shifts/wall-time.js';

export class BreakPreviewError extends Error {
  constructor(readonly code: string, message: string, readonly field: string | null = null) {
    super(message);
  }
}

function localMinute(value: unknown): number {
  const minute = localWallMinute(value);
  if (minute === null) {
    throw new BreakPreviewError('INVALID_PROPOSAL', 'תאריך או שעת ההפסקה אינם תקינים.', 'startLocal');
  }
  return minute;
}

export function parseBreakProposal(value: unknown): DemoBreakProposal {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new BreakPreviewError('INVALID_PROPOSAL', 'יש לספק הצעת הפסקה תקינה.');
  }
  const fields = Object.keys(value);
  if (fields.length !== 3 || fields.some(field => !['breakId', 'startLocal', 'durationMinutes'].includes(field))
    || !('breakId' in value) || typeof value.breakId !== 'string' || !/^break-[1-3]$/.test(value.breakId)
    || !('startLocal' in value) || typeof value.startLocal !== 'string'
    || !('durationMinutes' in value) || typeof value.durationMinutes !== 'number'
    || !Number.isInteger(value.durationMinutes) || value.durationMinutes < 1 || value.durationMinutes > 120) {
    throw new BreakPreviewError('INVALID_PROPOSAL', 'הצעה כוללת מזהה הפסקה, התחלה ומשך שלם של 1–120 דקות בלבד.');
  }
  localMinute(value.startLocal);
  return { breakId: value.breakId, startLocal: value.startLocal, durationMinutes: value.durationMinutes };
}

export function previewBreakChange(view: DemoBreakView, proposal: DemoBreakProposal): DemoBreakPreview {
  const validated = parseBreakProposal(proposal);
  if (!view.previewAvailable) {
    throw new BreakPreviewError('BREAK_PREVIEW_UNAVAILABLE', 'תצוגה מקדימה אינה זמינה למדיניות משמרת זו.');
  }
  const before = view.breaks.find(item => item.id === validated.breakId);
  if (before === undefined) {
    throw new BreakPreviewError('BREAK_NOT_FOUND', 'ההפסקה אינה זמינה במשמרת זו.');
  }
  const start = localMinute(validated.startLocal);
  const end = start + validated.durationMinutes;
  if (start - localMinute(view.shift.effective.startLocal) < view.policy.edgeMinutes
    || localMinute(view.shift.effective.endLocal) - end < view.policy.edgeMinutes) {
    throw new BreakPreviewError('BREAK_OUTSIDE_ALLOWED_RANGE', 'יש לשמור לפחות 60 דקות מתחילת המשמרת ומסופה.', 'startLocal');
  }
  for (const other of view.breaks) {
    if (other.id === before.id) { continue; }
    const otherStart = localMinute(other.startLocal);
    const otherEnd = localMinute(other.endLocal);
    const gap = start >= otherEnd ? start - otherEnd : otherStart - end;
    if (gap < view.policy.gapMinutes) {
      throw new BreakPreviewError('BREAK_GAP_TOO_SHORT', 'יש לשמור לפחות 60 דקות בין הפסקות.', 'startLocal');
    }
  }
  const endLocal = new Date(end * 60_000).toISOString().slice(0, 19);
  if (!/^\d{4}-/.test(endLocal)) {
    throw new BreakPreviewError('INVALID_PROPOSAL', 'זמן סיום ההפסקה אינו בטווח ההדגמה.');
  }
  return {
    previewOnly: true, saved: false, policyVersion: view.policy.version,
    before: { ...before }, proposed: { id: before.id, startLocal: validated.startLocal, endLocal },
    durationMinutes: validated.durationMinutes,
    warnings: ['חישוב הדגמה בלבד: לא נשמר, לא אושר ולא נשלח לשותף. אין חישוב משך UTC או מדיניות שעון קיץ.'],
  };
}
