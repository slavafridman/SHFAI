export const DEMO_INTERNAL_JOB_SOURCE = 'synthetic-job-catalog-1';
export type DemoInternalJobStatus = 'all' | 'active' | 'inactive' | 'unknown';

export interface DemoInternalJob {
  readonly id: string;
  readonly name: string;
  readonly orgUnit: { readonly id: string; readonly name: string };
  readonly active: boolean | null;
  readonly groupCode: string | null;
}

export function isInternalJobStatus(value: unknown): value is DemoInternalJobStatus {
  return value === 'all' || value === 'active' || value === 'inactive' || value === 'unknown';
}

export function matchesInternalJobStatus(active: boolean | null, status: DemoInternalJobStatus): boolean {
  return status === 'all' || (status === 'active' && active === true)
    || (status === 'inactive' && active === false) || (status === 'unknown' && active === null);
}
