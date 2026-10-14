export interface DemoReportSpan {
  readonly startLocal: string;
  readonly endLocal: string;
}

export interface DemoReportSchedule {
  readonly active: boolean;
  readonly shift: DemoReportSpan;
  readonly breaks: readonly DemoReportSpan[];
  readonly exceptions: readonly DemoReportSpan[];
}

export interface DemoReportStaff {
  readonly employeeId: string;
  readonly unitId: string;
  readonly baseline: DemoReportSchedule;
  readonly modified: DemoReportSchedule;
}

export interface DemoReportQuery {
  readonly fromLocal: string;
  readonly toExclusiveLocal: string;
  readonly includeBreaks: boolean;
  readonly includeExceptions: boolean;
}

export interface DemoStaffingReportRow {
  readonly startLocal: string;
  readonly endExclusiveLocal: string;
  readonly baselineGrossMinutes: number;
  readonly baselineAvailableMinutes: number;
  readonly modifiedGrossMinutes: number;
  readonly modifiedAvailableMinutes: number;
  readonly requiredHeadcount: number | null;
  readonly requiredMinutes: number | null;
  readonly baselineGapMinutes: number | null;
  readonly modifiedGapMinutes: number | null;
}

export interface DemoStaffingReport {
  readonly sourceVersion: 'synthetic-report-source-1';
  readonly unitId: 'synthetic-team-a';
  readonly intervalMinutes: 15;
  readonly query: DemoReportQuery;
  readonly intervals: readonly DemoStaffingReportRow[];
  readonly totals: {
    readonly baselineGrossMinutes: number;
    readonly baselineAvailableMinutes: number;
    readonly modifiedGrossMinutes: number;
    readonly modifiedAvailableMinutes: number;
    readonly knownForecastIntervals: number;
    readonly missingForecastIntervals: number;
    readonly knownRequiredMinutes: number;
    readonly knownBaselineStaffMinutes: number;
    readonly knownModifiedStaffMinutes: number;
    readonly knownBaselineGapMinutes: number;
    readonly knownModifiedGapMinutes: number;
    readonly comparisonScope: 'known-forecast-intervals-only';
  };
  readonly warnings: readonly string[];
}
