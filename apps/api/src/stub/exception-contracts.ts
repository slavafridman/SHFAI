export type DemoExceptionInterval =
  | { readonly kind: 'full-day'; readonly date: string; readonly startLocal: null; readonly endLocal: null }
  | { readonly kind: 'timed'; readonly date: null; readonly startLocal: string; readonly endLocal: string };

export interface DemoExceptionRecord {
  readonly id: string;
  readonly unitId: 'synthetic-team-a' | 'synthetic-team-b';
  readonly employeeId: string;
  readonly employeeName: string;
  readonly category: 'exception' | 'time-off';
  readonly status: 'active' | 'cancelled';
  readonly provenance: 'baseline' | 'override';
  readonly interval: DemoExceptionInterval;
  readonly originalInterval: DemoExceptionInterval | null;
  readonly originalAvailability: 'available' | 'not-present' | 'not-authorized';
  readonly reason: string | null;
  readonly remark: string | null;
  readonly cancellationReason: string | null;
}
