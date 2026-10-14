export const DEMO_PARAMETER_SOURCE = 'synthetic-parameter-catalog-1';
export const DEMO_PARAMETER_CODES = [
  'shf.param.minutesArrivalBeforeStation',
  'shf.param.differenceBetweenShifts',
  'shf.param.minimalShiftDuration',
] as const;
export type DemoParameterCode = typeof DEMO_PARAMETER_CODES[number];

export interface DemoParameterResolution {
  readonly effectiveValue: string | null;
  readonly resolution: 'unit' | 'default' | 'unknown';
}
export interface DemoSystemParameter extends DemoParameterResolution {
  readonly code: DemoParameterCode;
  readonly name: string;
  readonly orgUnit: { readonly id: string; readonly name: string };
  readonly unitValue: string | null;
  readonly defaultValue: string | null;
  readonly measurement: 'unverified';
}

export function isDemoParameterCode(value: unknown): value is DemoParameterCode {
  return typeof value === 'string' && DEMO_PARAMETER_CODES.some(code => code === value);
}
export function isDemoParameterValue(value: unknown): value is string | null {
  return value === null || (typeof value === 'string' && /^\d{1,38}(?:\.\d{1,9})?$/.test(value));
}
export function resolveDemoParameter(unitValue: string | null, defaultValue: string | null): DemoParameterResolution {
  if (!isDemoParameterValue(unitValue) || !isDemoParameterValue(defaultValue)) {
    throw new RangeError('Invalid synthetic parameter value.');
  }
  if (unitValue !== null) { return { effectiveValue: unitValue, resolution: 'unit' }; }
  if (defaultValue !== null) { return { effectiveValue: defaultValue, resolution: 'default' }; }
  return { effectiveValue: null, resolution: 'unknown' };
}
