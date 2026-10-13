import { Logger } from '@nestjs/common';
import { loadOracleConfiguration } from './configuration.js';
import { OracleReadOnlyError } from './errors.js';
import { OracleReadOnlyDatabase } from './read-only-database.js';
import { parseOracleDiagnosticMode, runOracleDiagnostics } from './diagnostics.js';

async function check(): Promise<void> {
  const mode = parseOracleDiagnosticMode(process.argv.slice(2));
  const database = new OracleReadOnlyDatabase(loadOracleConfiguration(process.env));
  const report = await runOracleDiagnostics(database, mode);
  if (mode === 'shift-columns') {
    console.log(JSON.stringify(report, null, 2));
  } else {
    Logger.log('Oracle connectivity check passed in a read-only transaction.', 'OracleCheck');
  }
}

check().catch((error: unknown) => {
  Logger.error(JSON.stringify({
    event: 'oracle_check_failed',
    code: error instanceof OracleReadOnlyError ? error.code : 'ORACLE_CHECK_FAILED',
    message: error instanceof OracleReadOnlyError ? error.message : 'Oracle check failed. Review redacted adapter errors.',
  }), undefined, 'OracleCheck');
  process.exitCode = 1;
});
