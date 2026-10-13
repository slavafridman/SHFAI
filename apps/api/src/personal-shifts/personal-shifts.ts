import type {
  PersonalShiftItem,
  PersonalShiftQuery,
  PersonalShiftScope,
  PersonalShiftSelection,
  ShiftSchedule,
} from './contracts.js';

type ErrorCode = 'INVALID_QUERY' | 'DATA_CONTRACT_UNVERIFIED';

export class PersonalShiftsError extends Error {
  readonly errors: readonly { field: string; code: ErrorCode; message: string }[];

  constructor(
    readonly code: ErrorCode,
    message: string,
    field?: string,
  ) {
    super(message);
    this.name = 'PersonalShiftsError';
    this.errors = field === undefined ? [] : [{ field, code, message }];
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new PersonalShiftsError('DATA_CONTRACT_UNVERIFIED', 'מבנה נתוני המשמרת אינו מאומת.');
  }
  return value;
}

function dateOrdinal(value: unknown): number | null {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthLengths = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const monthLength = monthLengths[month - 1];
  if (year < 1 || monthLength === undefined || day < 1 || day > monthLength) {
    return null;
  }
  const previousYear = year - 1;
  const previousDays = monthLengths.slice(0, month - 1).reduce((sum, days) => sum + days, 0);
  return previousYear * 365 + Math.floor(previousYear / 4)
    - Math.floor(previousYear / 100) + Math.floor(previousYear / 400) + previousDays + day;
}

export function parsePersonalShiftQuery(input: unknown): PersonalShiftQuery {
  if (!isRecord(input)) {
    throw new PersonalShiftsError('INVALID_QUERY', 'יש לספק טווח תאריכים תקין.');
  }
  for (const field of Object.keys(input)) {
    if (!['from', 'toExclusive', 'limit', 'cursor'].includes(field)) {
      throw new PersonalShiftsError('INVALID_QUERY', 'מסנן הבקשה אינו נתמך.');
    }
  }
  const fromOrdinal = dateOrdinal(input['from']);
  const toOrdinal = dateOrdinal(input['toExclusive']);
  if (fromOrdinal === null || typeof input['from'] !== 'string') {
    throw new PersonalShiftsError('INVALID_QUERY', 'תאריך ההתחלה אינו תקין.', 'from');
  }
  if (toOrdinal === null || typeof input['toExclusive'] !== 'string') {
    throw new PersonalShiftsError('INVALID_QUERY', 'תאריך הסיום אינו תקין.', 'toExclusive');
  }
  if (toOrdinal <= fromOrdinal || toOrdinal - fromOrdinal > 31) {
    throw new PersonalShiftsError('INVALID_QUERY', 'יש לבחור טווח של יום אחד עד 31 ימים.', 'toExclusive');
  }
  const rawLimit = input['limit'];
  const limit = rawLimit === undefined ? 25
    : typeof rawLimit === 'string' && /^[1-9]\d{0,2}$/.test(rawLimit) ? Number(rawLimit)
      : rawLimit;
  if (typeof limit !== 'number' || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new PersonalShiftsError('INVALID_QUERY', 'מספר המשמרות חייב להיות שלם בין 1 ל־100.', 'limit');
  }
  if (Object.hasOwn(input, 'cursor')) {
    throw new PersonalShiftsError('DATA_CONTRACT_UNVERIFIED', 'דפדוף בין עמודים ממתין לאישור החוזה.', 'cursor');
  }
  return { from: input['from'], toExclusive: input['toExclusive'], limit };
}

function employeeId(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{1,128}$/.test(value)) {
    throw new PersonalShiftsError('DATA_CONTRACT_UNVERIFIED', 'שיוך העובד אינו מאומת.');
  }
  return value;
}

function shiftId(value: unknown): string {
  if (typeof value !== 'string' || !/^[1-9]\d{0,37}$/.test(value)) {
    throw new PersonalShiftsError('DATA_CONTRACT_UNVERIFIED', 'מזהה המשמרת אינו מאומת.');
  }
  return value;
}

function validateScope(scope: PersonalShiftScope): PersonalShiftScope {
  employeeId(scope.actorEmployeeId);
  if (typeof scope.canViewBaseline !== 'boolean') {
    throw new PersonalShiftsError('DATA_CONTRACT_UNVERIFIED', 'הרשאת התכנון המקורי אינה מאומתת.');
  }
  return scope;
}

function localDateTime(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(value)
    || dateOrdinal(value.slice(0, 10)) === null
    || Number(value.slice(11, 13)) > 23
    || Number(value.slice(14, 16)) > 59
    || Number(value.slice(17, 19)) > 59) {
    throw new PersonalShiftsError('DATA_CONTRACT_UNVERIFIED', 'זמן המשמרת המקומי אינו מאומת.');
  }
  return value;
}

function nullableIdentifier(value: unknown): string | null {
  if (value === null || (typeof value === 'string' && value.length > 0 && value.length <= 256)) {
    return value;
  }
  throw new PersonalShiftsError('DATA_CONTRACT_UNVERIFIED', 'מזהה הפעילות או האתר אינו מאומת.');
}

function nullableFlag(value: unknown): boolean | null {
  if (value === null) {
    return null;
  }
  if (typeof value === 'string') {
    if (value.toUpperCase() === 'Y') {
      return true;
    }
    if (value.toUpperCase() === 'N') {
      return false;
    }
  }
  throw new PersonalShiftsError('DATA_CONTRACT_UNVERIFIED', 'דגל נתוני המשמרת אינו מאומת.');
}

function schedule(input: unknown): ShiftSchedule {
  const source = requireRecord(input);
  const startLocal = localDateTime(source['startLocal']);
  const endLocal = localDateTime(source['endLocal']);
  if (endLocal < startLocal) {
    throw new PersonalShiftsError('DATA_CONTRACT_UNVERIFIED', 'סדר זמני המשמרת אינו מאומת.');
  }
  const split = requireRecord(source['split']);
  const enabled = nullableFlag(split['flag']);
  const gapStartLocal = split['gapStartLocal'] === null ? null : localDateTime(split['gapStartLocal']);
  const gapEndLocal = split['gapEndLocal'] === null ? null : localDateTime(split['gapEndLocal']);
  if ((enabled !== true && (gapStartLocal !== null || gapEndLocal !== null))
    || (enabled === true && (gapStartLocal === null || gapEndLocal === null
      || gapStartLocal < startLocal || gapEndLocal > endLocal || gapEndLocal < gapStartLocal))) {
    throw new PersonalShiftsError('DATA_CONTRACT_UNVERIFIED', 'גבולות פיצול המשמרת אינם מאומתים.');
  }
  return {
    employeeId: employeeId(source['employeeId']),
    startLocal,
    endLocal,
    siteId: nullableIdentifier(source['siteId']),
    activityId: nullableIdentifier(source['activityId']),
    workFromHome: nullableFlag(source['workFromHomeFlag']),
    split: { enabled, gapStartLocal, gapEndLocal },
  };
}

// Inputs are isolated, resolved facts, not Oracle rows or an authenticated actor.
export function projectPersonalShift(input: unknown, scope: PersonalShiftScope): PersonalShiftItem | null {
  const actorId = validateScope(scope).actorEmployeeId;
  const source = requireRecord(input);
  const effectiveSource = requireRecord(source['effective']);
  if (employeeId(effectiveSource['employeeId']) !== actorId) {
    return null;
  }
  if (source['eligibility'] === 'excluded') {
    return null;
  }
  if (source['eligibility'] !== 'included') {
    throw new PersonalShiftsError('DATA_CONTRACT_UNVERIFIED', 'כללי הכללת המשמרת אינם מאומתים.');
  }
  const projection = source['projection'];
  if (projection !== 'baseline' && projection !== 'override') {
    throw new PersonalShiftsError('DATA_CONTRACT_UNVERIFIED', 'מקור נתוני המשמרת אינו מאומת.');
  }
  const effective = schedule(effectiveSource);
  const baseline = source['baseline'] === null ? null : schedule(source['baseline']);
  if (projection === 'baseline' && (baseline === null || JSON.stringify(baseline) !== JSON.stringify(effective))) {
    throw new PersonalShiftsError('DATA_CONTRACT_UNVERIFIED', 'התכנון המקורי אינו תואם למקור המשמרת.');
  }
  return {
    id: shiftId(source['id']),
    projection,
    effective,
    baseline: scope.canViewBaseline ? baseline : null,
    baselineAvailability: baseline === null ? 'not-present'
      : scope.canViewBaseline ? 'available' : 'not-authorized',
  };
}

export function selectPersonalShifts(
  input: readonly unknown[],
  scope: PersonalShiftScope,
  query: PersonalShiftQuery,
): PersonalShiftSelection {
  const validatedQuery = parsePersonalShiftQuery(query);
  const validatedScope = validateScope(scope);
  const matches: PersonalShiftItem[] = [];
  const identifiers = new Set<string>();
  for (const source of input) {
    const item = projectPersonalShift(source, validatedScope);
    if (item === null || item.effective.startLocal.slice(0, 10) < validatedQuery.from
      || item.effective.startLocal.slice(0, 10) >= validatedQuery.toExclusive) {
      continue;
    }
    if (identifiers.has(item.id)) {
      throw new PersonalShiftsError('DATA_CONTRACT_UNVERIFIED', 'נמצאו נתוני משמרת כפולים.');
    }
    identifiers.add(item.id);
    matches.push(item);
  }
  matches.sort((left, right) => {
    if (left.effective.startLocal !== right.effective.startLocal) {
      return left.effective.startLocal < right.effective.startLocal ? 1 : -1;
    }
    const leftId = BigInt(left.id);
    const rightId = BigInt(right.id);
    return leftId < rightId ? 1 : leftId > rightId ? -1 : 0;
  });
  return { items: matches.slice(0, validatedQuery.limit), hasMore: matches.length > validatedQuery.limit };
}
