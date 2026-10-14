import { localWallMinute } from '../personal-shifts/wall-time.js';
import type { DemoReplacementCandidate, DemoReplacementFacts, DemoReplacementIssue, DemoReplacementPreview, DemoReplacementShift } from './replacement-contracts.js';

export function previewReplacement(
  source: DemoReplacementShift,
  candidate: DemoReplacementCandidate,
  facts: DemoReplacementFacts,
): DemoReplacementPreview {
  const blockers: DemoReplacementIssue[] = [];
  const warnings: DemoReplacementIssue[] = [];
  const unknowns: DemoReplacementIssue[] = [];
  const add = (target: DemoReplacementIssue[], code: string, message: string) => target.push({ code, message });
  const start = localWallMinute(source.startLocal);
  const end = localWallMinute(source.endLocal);
  const candidateStart = localWallMinute(candidate.shift.startLocal);
  const candidateEnd = localWallMinute(candidate.shift.endLocal);
  const clock = localWallMinute('2026-10-13T08:00:00');
  if (start === null || end === null || candidateStart === null || candidateEnd === null || clock === null
    || end <= start || candidateEnd <= candidateStart) {
    add(unknowns, 'TIME_FACTS_UNVERIFIED', 'זמני המשמרות אינם מאומתים לתרחיש ההדגמה.');
  } else {
    if (start === candidateStart && end === candidateEnd) {
      add(blockers, 'SAME_SHIFT_TIMES', 'אין התאמה למשמרות באותם זמנים בדיוק.');
    }
    if (Math.abs((end - start) - (candidateEnd - candidateStart)) > 120) {
      add(blockers, 'DURATION_DIFFERENCE', 'פער משכי המשמרות עולה על 120 דקות בהדגמה.');
    }
    if (start - clock < 120 || candidateStart - clock < 120) {
      add(blockers, 'LEAD_TIME_TOO_SHORT', 'נדרשות לפחות 120 דקות לפי שעון ההדגמה הקפוא.');
    }
    const night = [source.startLocal, candidate.shift.startLocal].some(value => {
      const hour = Number(value.slice(11, 13));
      return hour >= 22 || hour < 6;
    });
    if (night) {
      if (source.siteId === null || candidate.shift.siteId === null) {
        add(unknowns, 'NIGHT_SITE_UNKNOWN', 'אתר משמרת לילה אינו ידוע.');
      } else if (source.siteId !== candidate.shift.siteId) {
        add(blockers, 'NIGHT_SITE_MISMATCH', 'משמרות לילה בהדגמה דורשות אתר תואם.');
      }
    }
  }
  if (source.employeeId === candidate.shift.employeeId) {
    add(blockers, 'SAME_EMPLOYEE', 'מועמד חייב להיות עובד הדגמה אחר.');
  }
  for (const [value, code, message, unknownMessage] of [
    [facts.jobsCompatible, 'INCOMPATIBLE_JOBS', 'התפקידים אינם תואמים בנתוני ההדגמה.', 'תאימות התפקידים אינה מאומתת.'],
    [facts.sourceAttendanceClear, 'SOURCE_ATTENDANCE', 'קיימת מגבלת נוכחות סינתטית במשמרת המקור.', 'מצב הנוכחות במשמרת המקור אינו מאומת.'],
    [facts.candidateAttendanceClear, 'CANDIDATE_ATTENDANCE', 'קיימת מגבלת נוכחות סינתטית במשמרת המועמד.', 'מצב הנוכחות במשמרת המועמד אינו מאומת.'],
  ] as const) {
    if (value === false) { add(blockers, code, message); }
    else if (value !== true) { add(unknowns, code + '_UNKNOWN', unknownMessage); }
  }
  const restMinutes = Array.from(facts.restMinutes);
  if (restMinutes.length !== 4 || restMinutes.some(value => value === null
    || !Number.isSafeInteger(value) || value < 0)) {
    add(unknowns, 'REST_FACTS_UNKNOWN', 'זמני המנוחה לפני ואחרי לשני המשתתפים אינם מאומתים.');
  }
  if (restMinutes.some(value => value !== null && Number.isSafeInteger(value) && value >= 0 && value < 660)) {
    add(blockers, 'REST_GAP_TOO_SHORT', 'נדרשות לפחות 660 דקות מנוחה בכל צד לשני המשתתפים בהדגמה.');
  }
  if (facts.reviewRequired === true) {
    add(warnings, 'REVIEW_REQUIRED', 'דגל מאגר או חריגה סינתטי מחייב בדיקה. אין כאן אישור, ניקוי מאגר או קבלת הצעה.');
  } else if (facts.reviewRequired !== false) {
    add(unknowns, 'REVIEW_FACT_UNKNOWN', 'מצב בדיקת ההצעות או החריגות אינו מאומת.');
  }
  return {
    previewOnly: true, saved: false, accepted: false, policyVersion: 'synthetic-replacement-policy-1',
    sourceShiftId: source.id, candidateId: candidate.id,
    eligibility: blockers.length ? 'blocked' : unknowns.length ? 'unknown'
      : warnings.length ? 'confirmation-required' : 'eligible-under-demo-policy',
    blockers, warnings, unknowns,
  };
}
