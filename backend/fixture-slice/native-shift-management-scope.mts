// Fixed backend-owned §49 read scope, not caller-selected table names.
export const shiftManagementSourceTables = Object.freeze([
  "SHF_EMPLOYEES", "SHF_EMPLOYEE_DAY", "SHF_DAY_CHANGES", "SHF_ATTENDANCE",
  "SHF_ORG_UNIT", "SHF_ORG_UNITS_SHF_SITES", "SHF_SYSTEM_PARAM", "SHF_UNIT_PARAM",
  "SHF_ACTIVITY_TYPE", "SHF_EVENT_REASON", "SHF_EMPLOYEE_REPORTS", "SHF_EMPLOYEE_EVENTS",
  "SHF_EMPLOYEE_EXCEPTIONS", "SHF_EMPLOYEE_EXCEPTIONS_BASE", "SHF_REPLACE_CANDIDATES",
  "SHF_REPLACE_BREAK_CANDIDATES", "SHF_TIME_CHANGE_CANDIDATES", "SHF_SHIFT_REDUCE_CANDIDATE",
] as const);
export const shiftManagementPolicyKeys = Object.freeze({
  minimum: "shf.param.minimalShiftDuration", maximum: "shf.param.maximalShiftDurationForCR",
  gap: "shf.param.differenceBetweenShifts", managed: "shf.param.managedBreakEnabled",
});
