import { OracleReadOnlyError } from './errors.js';
import type { OracleReadOnlyDatabase, OracleShiftColumn } from './read-only-database.js';

type DiagnosticMode = 'connectivity' | 'shift-columns';
type DiagnosticDatabase = Pick<OracleReadOnlyDatabase, 'checkConnectivity' | 'getShiftColumnMetadata' | 'close'>;

export interface OracleDiagnosticReport {
  readonly connectivity: 'verified';
  readonly readOnly: true;
  readonly columns?: readonly OracleShiftColumn[];
}

export function parseOracleDiagnosticMode(arguments_: readonly string[]): DiagnosticMode {
  if (arguments_.length === 0) {
    return 'connectivity';
  }
  if (arguments_.length === 1 && arguments_[0] === '--metadata') {
    return 'shift-columns';
  }
  throw new OracleReadOnlyError('ORACLE_CONFIG_INVALID', null, 'Oracle diagnostic arguments (--metadata only)');
}

export async function runOracleDiagnostics(
  database: DiagnosticDatabase,
  mode: DiagnosticMode,
): Promise<OracleDiagnosticReport> {
  let report: OracleDiagnosticReport | undefined;
  const failures: unknown[] = [];
  try {
    if (mode !== 'connectivity' && mode !== 'shift-columns') {
      throw new OracleReadOnlyError('ORACLE_CONFIG_INVALID');
    }
    await database.checkConnectivity();
    report = {
      connectivity: 'verified',
      readOnly: true,
      ...(mode === 'shift-columns' ? { columns: await database.getShiftColumnMetadata() } : {}),
    };
  } catch (error: unknown) {
    failures.push(error);
  }
  try {
    await database.close();
  } catch (error: unknown) {
    failures.push(error);
  }
  if (failures.length > 1) {
    throw new AggregateError(failures, 'Oracle diagnostic read and cleanup failed.');
  }
  if (failures.length === 1) {
    throw failures[0];
  }
  if (report === undefined) {
    throw new OracleReadOnlyError('ORACLE_RESULT_INVALID');
  }
  return report;
}
