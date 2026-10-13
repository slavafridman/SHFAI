export type OracleReadOnlyErrorCode =
  | 'ORACLE_DISABLED'
  | 'ORACLE_CONFIG_INVALID'
  | 'ORACLE_CLOSED'
  | 'ORACLE_THIN_REQUIRED'
  | 'ORACLE_READ_FAILED'
  | 'ORACLE_CLEANUP_FAILED'
  | 'ORACLE_RESULT_INVALID'
  | 'ORACLE_RESULT_LIMIT';

const messages: Record<OracleReadOnlyErrorCode, string> = {
  ORACLE_DISABLED: 'Oracle access is disabled. Enable it only after environment and read scope approval.',
  ORACLE_CONFIG_INVALID: 'Oracle configuration is invalid.',
  ORACLE_CLOSED: 'Oracle access is shutting down or closed.',
  ORACLE_THIN_REQUIRED: 'This adapter requires Oracle Thin mode.',
  ORACLE_READ_FAILED: 'Oracle read failed.',
  ORACLE_CLEANUP_FAILED: 'Oracle connection cleanup failed.',
  ORACLE_RESULT_INVALID: 'Oracle read result or required shift metadata is invalid.',
  ORACLE_RESULT_LIMIT: 'Oracle metadata exceeds the approved bounded result size.',
};

export class OracleReadOnlyError extends Error {
  constructor(
    readonly code: OracleReadOnlyErrorCode,
    readonly driverCode: string | null = null,
    configurationField?: string,
  ) {
    super(configurationField === undefined ? messages[code] : `${messages[code]} Check ${configurationField}.`);
    this.name = 'OracleReadOnlyError';
  }
}

export function safeOracleDriverCode(error: unknown): string | null {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return null;
  }
  return typeof error.code === 'string' && /^(?:ORA-\d{5}|NJS-\d{3}|DPI-\d{4})$/.test(error.code)
    ? error.code : null;
}
