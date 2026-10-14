import { localWallMinute } from '../personal-shifts/wall-time.js';
import { STAFFING_CLOCK_LOCAL } from './staffing-fixtures.js';
import type {
  DemoStaffingCandidate, DemoStaffingEligibilityFacts, DemoStaffingPreview, DemoStaffingRequest,
} from './staffing-contracts.js';

export function previewStaffingCandidate(
  request: DemoStaffingRequest,
  candidate: DemoStaffingCandidate,
  facts: DemoStaffingEligibilityFacts,
): DemoStaffingPreview {
  const blockers: { code: string; message: string }[] = [];
  const unknowns: { code: string; message: string }[] = [];
  const capacityBefore = { requested: request.requested, approved: request.approved, remaining: request.remaining };
  const counts = [request.requested, request.approved, request.remaining];
  const consistent = request.requested !== null && request.approved !== null && request.remaining !== null
    && counts.every(value => Number.isSafeInteger(value) && value !== null && value >= 0)
    && request.approved <= request.requested && request.remaining === request.requested - request.approved;
  if (!consistent) {
    unknowns.push({ code: 'CAPACITY_UNVERIFIED', message: 'הקיבולת אינה ידועה או אינה עקבית בנתוני ההדגמה.' });
  } else if (request.remaining === 0) {
    blockers.push({ code: 'CAPACITY_FULL', message: 'לא נותר מקום בבקשת ההדגמה.' });
  }
  if (request.unitId !== 'synthetic-team-a' || !['00000001', '00000002', '00000003'].includes(candidate.employeeId)) {
    blockers.push({ code: 'DEMO_SCOPE_DENIED', message: 'הבקשה או המועמד אינם בהיקף צוות ההדגמה.' });
  }
  if (request.freshness !== 'current' || candidate.freshness !== 'current'
    || candidate.asOfLocal !== STAFFING_CLOCK_LOCAL) {
    unknowns.push({ code: 'STALE_OR_UNKNOWN_CONTEXT', message: 'נתון בקשה או מועמד ישן או לא ידוע; יש לבדוק מחדש.' });
  }
  const clock = localWallMinute(STAFFING_CLOCK_LOCAL);
  const start = localWallMinute(request.startLocal);
  const end = localWallMinute(request.endLocal);
  if (clock === null || start === null || end === null || end <= start) {
    unknowns.push({ code: 'REQUEST_INTERVAL_UNVERIFIED', message: 'טווח הבקשה אינו מאומת.' });
  } else if (start - clock < 120) {
    blockers.push({ code: 'LEAD_TIME_TOO_SHORT', message: 'בהדגמה נדרשות לפחות 120 דקות לפני תחילת הבקשה.' });
  }
  const deadline = localWallMinute(request.deadlineLocal);
  if (deadline === null || clock === null || request.deadlineState === 'unknown') {
    unknowns.push({ code: 'DEADLINE_UNVERIFIED', message: 'מועד אחרון אינו מאומת.' });
  } else {
    if (deadline < clock) {
      blockers.push({ code: 'DEADLINE_ELAPSED', message: 'המועד האחרון חלף לפי שעון התרחיש הקפוא.' });
    }
    if ((request.deadlineState === 'open') !== (deadline >= clock)) {
      unknowns.push({ code: 'DEADLINE_STATE_INCONSISTENT', message: 'מצב המועד אינו תואם לתאריך בתרחיש ההדגמה.' });
    }
  }
  for (const [value, code, message, unknownMessage] of [
    [facts.jobCompatible, 'JOB_NOT_COMPATIBLE', 'התפקיד אינו תואם בנתוני ההדגמה.', 'תאימות התפקיד אינה מאומתת.'],
    [facts.intervalCompatible, 'INTERVAL_NOT_COMPATIBLE', 'טווח העובד אינו תואם בנתוני ההדגמה.', 'תאימות טווח העובד אינה מאומתת.'],
  ] as const) {
    if (value === false) { blockers.push({ code, message }); }
    else if (value !== true) { unknowns.push({ code: code + '_UNKNOWN', message: unknownMessage }); }
  }
  if (facts.registrationExists === true) {
    blockers.push({ code: 'DUPLICATE_REGISTRATION', message: 'קיימת השתתפות סינתטית בתרחיש; אין לבצע רישום כפול.' });
  } else if (facts.registrationExists !== false) {
    unknowns.push({ code: 'REGISTRATION_STATE_UNKNOWN', message: 'מצב השתתפות קודמת אינו מאומת.' });
  }
  const outcome = blockers.length ? 'blocked' : unknowns.length ? 'unknown' : 'eligible-under-demo-policy';
  return {
    previewOnly: true, saved: false, assigned: false, approved: false, policyVersion: 'synthetic-staffing-policy-1',
    requestId: request.id, candidateId: candidate.id, outcome, blockers, unknowns, capacityBefore,
    capacityIfApplied: outcome === 'eligible-under-demo-policy' && consistent && request.approved !== null && request.remaining !== null
      ? { requested: request.requested, approved: request.approved + 1, remaining: request.remaining - 1 } : null,
    warnings: [
      'חישוב מקום אחד בלבד בתרחיש סינתטי. לא נרשם, לא שויך, לא אושר ולא נשמר דבר.',
      'אין אימות נוכחות, מיומנויות, מנוחה, זכויות או פרמטרי יחידה בזמן אמת. קיבולת עתידית מחייבת בדיקה אטומית אמיתית.',
    ],
  };
}
