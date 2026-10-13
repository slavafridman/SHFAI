import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseOracleDiagnosticMode, runOracleDiagnostics } from '../src/oracle/diagnostics.js';
import { OracleReadOnlyError } from '../src/oracle/errors.js';
import type { OracleShiftColumn } from '../src/oracle/read-only-database.js';

const columns: readonly OracleShiftColumn[] = [{
  tableName: 'SHF_EMPLOYEE_DAY', columnName: 'SYNTHETIC_COLUMN',
  dataType: 'NUMBER', precision: 38, scale: 0, nullable: false,
}];

function fixture(failures: { probe?: Error; metadata?: Error; close?: Error } = {}) {
  const calls: string[] = [];
  const database = {
    async checkConnectivity(): Promise<{ connected: true; readOnly: true }> {
      calls.push('probe');
      if (failures.probe !== undefined) {
        throw failures.probe;
      }
      return { connected: true, readOnly: true };
    },
    async getShiftColumnMetadata() {
      calls.push('columns');
      if (failures.metadata !== undefined) {
        throw failures.metadata;
      }
      return columns;
    },
    async close() {
      calls.push('close');
      if (failures.close !== undefined) {
        throw failures.close;
      }
    },
  };
  return { database, calls };
}

test('diagnostic modes reject arbitrary or repeated command arguments', () => {
  assert.equal(parseOracleDiagnosticMode([]), 'connectivity');
  assert.equal(parseOracleDiagnosticMode(['--metadata']), 'shift-columns');
  for (const arguments_ of [['--sql'], ['--metadata', '--metadata'], ['SELECT 1 FROM DUAL'], ['synthetic-sensitive-argument']]) {
    assert.throws(() => parseOracleDiagnosticMode(arguments_), (error: unknown) => {
      assert.ok(error instanceof OracleReadOnlyError);
      assert.equal(error.code, 'ORACLE_CONFIG_INVALID');
      assert.ok(!error.message.includes(arguments_.join(' ')));
      return true;
    });
  }
});

test('connectivity-only mode does not expand its authorized scope to metadata', async () => {
  const { database, calls } = fixture();
  assert.deepEqual(await runOracleDiagnostics(database, 'connectivity'), {
    connectivity: 'verified', readOnly: true,
  });
  assert.deepEqual(calls, ['probe', 'close']);
});

test('metadata diagnostic runs exactly the two approved read operations and then closes', async () => {
  const { database, calls } = fixture();
  assert.deepEqual(await runOracleDiagnostics(database, 'shift-columns'), {
    connectivity: 'verified', readOnly: true, columns,
  });
  assert.deepEqual(calls, ['probe', 'columns', 'close']);
});

test('failed probe closes the pool and prevents metadata execution', async () => {
  const failure = new OracleReadOnlyError('ORACLE_READ_FAILED', 'ORA-12514');
  const { database, calls } = fixture({ probe: failure });
  await assert.rejects(runOracleDiagnostics(database, 'shift-columns'), error => error === failure);
  assert.deepEqual(calls, ['probe', 'close']);
});

test('failed metadata closes and never becomes an empty successful report', async () => {
  const failure = new OracleReadOnlyError('ORACLE_RESULT_INVALID');
  const { database, calls } = fixture({ metadata: failure });
  await assert.rejects(runOracleDiagnostics(database, 'shift-columns'), error => error === failure);
  assert.deepEqual(calls, ['probe', 'columns', 'close']);
});

test('read and shutdown failures are both preserved', async () => {
  const read = new OracleReadOnlyError('ORACLE_READ_FAILED');
  const close = new OracleReadOnlyError('ORACLE_CLEANUP_FAILED');
  const { database } = fixture({ probe: read, close });
  await assert.rejects(runOracleDiagnostics(database, 'shift-columns'), (error: unknown) => {
    assert.ok(error instanceof AggregateError);
    assert.deepEqual(error.errors, [read, close]);
    return true;
  });
});

test('a successful read followed by failed pool cleanup does not report success', async () => {
  const failure = new OracleReadOnlyError('ORACLE_CLEANUP_FAILED');
  const { database, calls } = fixture({ close: failure });
  await assert.rejects(runOracleDiagnostics(database, 'shift-columns'), error => error === failure);
  assert.deepEqual(calls, ['probe', 'columns', 'close']);
});
