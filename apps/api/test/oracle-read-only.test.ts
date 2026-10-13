import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { BindParameters, ExecuteOptions, PoolAttributes } from 'oracledb';
import { loadOracleConfiguration } from '../src/oracle/configuration.js';
import { OracleReadOnlyError, safeOracleDriverCode } from '../src/oracle/errors.js';
import {
  OracleReadOnlyDatabase,
  type ReadOnlyOracleConnection,
  type ReadOnlyOracleFactory,
  type ReadOnlyOraclePool,
} from '../src/oracle/read-only-database.js';

const syntheticEnvironment = {
  ORACLE_ENABLED: 'true',
  ORACLE_READ_ONLY: 'true',
  ORACLE_USER: 'synthetic-read-user',
  ORACLE_PASSWORD: 'synthetic-not-a-real-password',
  ORACLE_CONNECT_STRING: 'SYNTHETIC_ALIAS',
  ORACLE_CONFIG_DIR: 'D:\\SyntheticOracleNet',
};

interface Scenario {
  rows?: readonly unknown[];
  omitRows?: boolean;
  setupFailure?: Error;
  queryFailure?: Error;
  rollbackFailure?: Error;
  releaseFailure?: Error;
  acquisitionFailure?: Error;
  poolFailure?: Error;
  poolCloseFailure?: Error;
  beforeQuery?: () => Promise<void>;
  beforePoolClose?: () => Promise<void>;
}

class FakeConnection implements ReadOnlyOracleConnection {
  callTimeout = 0;
  readonly events: string[] = [];
  readonly statements: { sql: string; binds: BindParameters; options: ExecuteOptions }[] = [];
  dropped = false;

  constructor(private readonly scenario: Scenario) {}

  async execute(sql: string, binds: BindParameters, options: ExecuteOptions) {
    this.statements.push({ sql, binds, options });
    if (sql === 'SET TRANSACTION READ ONLY') {
      this.events.push('read-only');
      if (this.scenario.setupFailure !== undefined) {
        throw this.scenario.setupFailure;
      }
      return {};
    }
    this.events.push('select');
    await this.scenario.beforeQuery?.();
    if (this.scenario.queryFailure !== undefined) {
      throw this.scenario.queryFailure;
    }
    return this.scenario.omitRows ? {} : { rows: this.scenario.rows ?? [{ ok: 1 }] };
  }

  async rollback() {
    this.events.push('rollback');
    if (this.scenario.rollbackFailure !== undefined) {
      throw this.scenario.rollbackFailure;
    }
  }

  async close(options?: { drop: boolean }) {
    this.events.push('release');
    this.dropped = options?.drop === true;
    if (this.scenario.releaseFailure !== undefined) {
      throw this.scenario.releaseFailure;
    }
  }
}

class FakePool implements ReadOnlyOraclePool {
  readonly connections: FakeConnection[] = [];
  readonly closeCalls: number[] = [];

  constructor(private readonly scenario: Scenario) {}

  async getConnection() {
    if (this.scenario.acquisitionFailure !== undefined) {
      throw this.scenario.acquisitionFailure;
    }
    const connection = new FakeConnection(this.scenario);
    this.connections.push(connection);
    return connection;
  }

  async close(drainSeconds: number) {
    this.closeCalls.push(drainSeconds);
    await this.scenario.beforePoolClose?.();
    if (this.scenario.poolCloseFailure !== undefined) {
      throw this.scenario.poolCloseFailure;
    }
  }
}

class FakeFactory implements ReadOnlyOracleFactory {
  readonly options: PoolAttributes[] = [];
  readonly pool: FakePool;

  constructor(private readonly scenario: Scenario = {}, readonly thin = true) {
    this.pool = new FakePool(scenario);
  }

  async createPool(options: PoolAttributes) {
    this.options.push(options);
    if (this.scenario.poolFailure !== undefined) {
      throw this.scenario.poolFailure;
    }
    return this.pool;
  }
}

function fixture(scenario: Scenario = {}) {
  const factory = new FakeFactory(scenario);
  const logs: string[] = [];
  const database = new OracleReadOnlyDatabase(
    loadOracleConfiguration(syntheticEnvironment),
    factory,
    { error: message => { logs.push(message); } },
  );
  return { database, factory, logs };
}

function isError(code: OracleReadOnlyError['code']) {
  return (error: unknown) => error instanceof OracleReadOnlyError && error.code === code;
}

function metadataRows() {
  return ['SHF_EMPLOYEE_DAY', 'SHF_DAY_CHANGES', 'SHF_EMPLOYEES'].map(tableName => ({
    tableName, columnName: 'SYNTHETIC_COLUMN', dataType: 'NUMBER', precision: 38, scale: 0, nullable: 'N',
  }));
}

test('Oracle configuration is opt-in and cannot enable write mode', () => {
  assert.deepEqual(loadOracleConfiguration({}), { enabled: false });
  assert.deepEqual(loadOracleConfiguration({ ORACLE_ENABLED: 'false' }), { enabled: false });
  for (const value of ['', 'yes', 'TRUE']) {
    assert.throws(() => loadOracleConfiguration({ ORACLE_ENABLED: value }), isError('ORACLE_CONFIG_INVALID'));
  }
  assert.throws(() => loadOracleConfiguration({ ORACLE_READ_ONLY: 'false' }), isError('ORACLE_CONFIG_INVALID'));
});

test('external credentials are required and never interpolated into configuration errors', () => {
  for (const field of ['ORACLE_USER', 'ORACLE_PASSWORD', 'ORACLE_CONNECT_STRING']) {
    assert.throws(() => loadOracleConfiguration({
      ...syntheticEnvironment, [field]: '',
    }), (error: unknown) => {
      assert.ok(isError('ORACLE_CONFIG_INVALID')(error));
      assert.ok(error instanceof Error && !error.message.includes(syntheticEnvironment.ORACLE_PASSWORD));
      return true;
    });
  }
  const configuration = loadOracleConfiguration({ ...syntheticEnvironment, ORACLE_PASSWORD: ' synthetic secret ' });
  assert.ok(configuration.enabled);
  assert.equal(configuration.password, ' synthetic secret ');
});

test('TNS aliases require an external config directory and reject embedded credentials/providers', () => {
  assert.throws(() => loadOracleConfiguration({
    ...syntheticEnvironment, ORACLE_CONFIG_DIR: '',
  }), isError('ORACLE_CONFIG_INVALID'));
  const viaTnsAdmin = loadOracleConfiguration({
    ...syntheticEnvironment, ORACLE_CONFIG_DIR: undefined, TNS_ADMIN: 'D:\\SyntheticOracleNet',
  });
  assert.ok(viaTnsAdmin.enabled);
  assert.equal(viaTnsAdmin.configDir, 'D:\\SyntheticOracleNet');
  for (const connectString of ['user/password@alias', 'https://config-provider.invalid/config', 'host:70000/service', 'host:0/service']) {
    assert.throws(() => loadOracleConfiguration({
      ...syntheticEnvironment, ORACLE_CONNECT_STRING: connectString,
    }), isError('ORACLE_CONFIG_INVALID'));
  }
  assert.ok(loadOracleConfiguration({
    ...syntheticEnvironment, ORACLE_CONNECT_STRING: 'tcps://synthetic-host:1521/synthetic-service', ORACLE_CONFIG_DIR: undefined,
  }).enabled);
});

test('disabled adapter and construction/shutdown make no driver calls', async () => {
  const factory = new FakeFactory();
  const database = new OracleReadOnlyDatabase({ enabled: false }, factory, { error: () => {} });
  assert.equal(factory.options.length, 0);
  await assert.rejects(database.checkConnectivity(), isError('ORACLE_DISABLED'));
  await database.close();
  assert.equal(factory.options.length, 0);
  assert.equal(factory.pool.connections.length, 0);
});

test('pool creation is lazy, bounded and shared between separate read leases', async () => {
  const { database, factory } = fixture();
  assert.equal(factory.options.length, 0);
  await Promise.all([database.checkConnectivity(), database.checkConnectivity()]);
  assert.equal(factory.options.length, 1);
  const options = factory.options[0];
  assert.equal(options?.poolMin, 0);
  assert.equal(options?.poolMax, 2);
  assert.equal(options?.queueMax, 10);
  assert.equal(options?.queueTimeout, 5000);
  assert.equal(options?.connectTimeout, 10);
  assert.equal(options?.transportConnectTimeout, 5);
  assert.equal(options?.retryCount, 0);
  assert.equal(options?.configDir, syntheticEnvironment.ORACLE_CONFIG_DIR);
  assert.equal(factory.pool.connections.length, 2);
  await database.close();
  assert.deepEqual(factory.pool.closeCalls, [10]);
});

test('each probe starts read-only, never commits, and rolls back/releases after the SELECT', async () => {
  const { database, factory } = fixture();
  assert.deepEqual(await database.checkConnectivity(), { connected: true, readOnly: true });
  const connection = factory.pool.connections[0];
  assert.ok(connection);
  assert.deepEqual(connection.events, ['read-only', 'select', 'rollback', 'release']);
  assert.equal(connection.callTimeout, 5000);
  assert.equal(connection.statements[1]?.sql, 'SELECT 1 AS "ok" FROM DUAL');
  assert.ok(connection.statements.every(statement => statement.options.autoCommit === false));
  assert.equal(connection.statements[1]?.options.maxRows, 513);
  assert.ok(!connection.statements.some(statement => /\b(INSERT|UPDATE|DELETE|MERGE|COMMIT|NEXTVAL|BEGIN)\b/i.test(statement.sql)));
  await database.close();
});

test('Thick mode is rejected before any pool is created', async () => {
  const factory = new FakeFactory({}, false);
  const database = new OracleReadOnlyDatabase(loadOracleConfiguration(syntheticEnvironment), factory, { error: () => {} });
  await assert.rejects(database.checkConnectivity(), isError('ORACLE_THIN_REQUIRED'));
  assert.equal(factory.options.length, 0);
});

test('metadata read uses only fixed table binds and omits business data/defaults/source', async () => {
  const { database, factory } = fixture({ rows: metadataRows() });
  const columns = await database.getShiftColumnMetadata();
  assert.equal(columns.length, 3);
  assert.equal(columns[0]?.precision, 38);
  assert.equal(columns[0]?.nullable, false);
  const statement = factory.pool.connections[0]?.statements[1];
  assert.ok(statement);
  assert.deepEqual(statement.binds, {
    owner: 'SHIFTER', days: 'SHF_EMPLOYEE_DAY', changes: 'SHF_DAY_CHANGES', employees: 'SHF_EMPLOYEES',
  });
  assert.ok(statement.sql.includes('FROM all_tab_columns'));
  assert.ok(!/DATA_DEFAULT|ALL_SOURCE|EMP_ID_NUMBER/i.test(statement.sql));
  await database.close();
});

test('missing/malformed metadata and result overflow fail instead of returning partial success', async () => {
  for (const rows of [
    [],
    metadataRows().slice(0, 2),
    [...metadataRows(), { ...metadataRows()[0], tableName: 'UNAPPROVED_TABLE' }],
    [...metadataRows(), { ...metadataRows()[0], nullable: 'unexpected' }],
    [...metadataRows(), { ...metadataRows()[0], precision: '38' }],
  ]) {
    const { database, factory } = fixture({ rows });
    await assert.rejects(database.getShiftColumnMetadata(), isError('ORACLE_RESULT_INVALID'));
    assert.deepEqual(factory.pool.connections[0]?.events, ['read-only', 'select', 'rollback', 'release']);
    await database.close();
  }
  const { database } = fixture({ rows: Array.from({ length: 513 }, () => metadataRows()[0]) });
  await assert.rejects(database.getShiftColumnMetadata(), isError('ORACLE_RESULT_LIMIT'));
  await database.close();
});

test('missing/wrong connectivity result cannot become connected success', async () => {
  for (const scenario of [{ omitRows: true }, { rows: [] }, { rows: [{ ok: '1' }] }]) {
    const { database } = fixture(scenario);
    await assert.rejects(database.checkConnectivity(), isError('ORACLE_RESULT_INVALID'));
    await database.close();
  }
});

test('pool/acquisition errors do not leak driver text or credentials and do not invent results', async () => {
  const sensitive = `${syntheticEnvironment.ORACLE_PASSWORD} synthetic-address`;
  const driverError = Object.assign(new Error(sensitive), { code: 'ORA-01017' });
  for (const scenario of [{ poolFailure: driverError }, { acquisitionFailure: driverError }]) {
    const { database, logs } = fixture(scenario);
    await assert.rejects(database.checkConnectivity(), (error: unknown) => {
      assert.ok(error instanceof OracleReadOnlyError);
      assert.equal(error.code, 'ORACLE_READ_FAILED');
      assert.equal(error.driverCode, 'ORA-01017');
      assert.ok(!error.message.includes(sensitive));
      assert.equal(Object.hasOwn(error, 'cause'), false);
      return true;
    });
    assert.ok(!JSON.stringify(logs).includes(syntheticEnvironment.ORACLE_PASSWORD));
    assert.ok(!JSON.stringify(logs).includes('synthetic-address'));
    await database.close();
  }
});

test('failed read-only setup never executes a SELECT and still performs cleanup', async () => {
  const { database, factory } = fixture({ setupFailure: new Error('synthetic setup failure') });
  await assert.rejects(database.checkConnectivity(), isError('ORACLE_READ_FAILED'));
  assert.deepEqual(factory.pool.connections[0]?.events, ['read-only', 'rollback', 'release']);
  await database.close();
});

test('query failure rolls back/releases and is not replaced by an empty result', async () => {
  const { database, factory } = fixture({ queryFailure: Object.assign(new Error('synthetic query failure'), { code: 'ORA-03135' }) });
  await assert.rejects(database.checkConnectivity(), isError('ORACLE_READ_FAILED'));
  assert.deepEqual(factory.pool.connections[0]?.events, ['read-only', 'select', 'rollback', 'release']);
  await database.close();
});

test('read and rollback/release failures are all retained as redacted errors, with a dirty lease dropped', async () => {
  const { database, factory, logs } = fixture({
    queryFailure: new Error(syntheticEnvironment.ORACLE_PASSWORD),
    rollbackFailure: new Error(syntheticEnvironment.ORACLE_PASSWORD),
    releaseFailure: new Error(syntheticEnvironment.ORACLE_PASSWORD),
  });
  await assert.rejects(database.checkConnectivity(), (error: unknown) => {
    assert.ok(error instanceof AggregateError);
    const failures: unknown[] = error.errors;
    assert.equal(failures.length, 3);
    assert.ok(failures.every(failure => failure instanceof OracleReadOnlyError));
    assert.ok(!JSON.stringify(failures).includes(syntheticEnvironment.ORACLE_PASSWORD));
    return true;
  });
  assert.equal(factory.pool.connections[0]?.dropped, true);
  assert.deepEqual(factory.pool.connections[0]?.events, ['read-only', 'select', 'rollback', 'release']);
  assert.equal(logs.length, 3);
  await database.close();
});

test('cleanup failure after a successful SELECT does not report connected success', async () => {
  const { database } = fixture({ releaseFailure: new Error('synthetic release failure') });
  await assert.rejects(database.checkConnectivity(), isError('ORACLE_CLEANUP_FAILED'));
  await database.close();
});

test('an in-flight query owns its connection until completion, not until a timer race', { timeout: 1000 }, async () => {
  let finishQuery: (() => void) | undefined;
  let queryEntered: (() => void) | undefined;
  const pending = new Promise<void>(resolve => { finishQuery = resolve; });
  const entered = new Promise<void>(resolve => { queryEntered = resolve; });
  const { database, factory } = fixture({
    beforeQuery: async () => { queryEntered?.(); await pending; },
  });
  const read = database.checkConnectivity();
  await entered;
  assert.deepEqual(factory.pool.connections[0]?.events, ['read-only', 'select']);
  finishQuery?.();
  await read;
  assert.deepEqual(factory.pool.connections[0]?.events, ['read-only', 'select', 'rollback', 'release']);
  await database.close();
});

test('shutdown drains the pool, remains idempotent and rejects subsequent reads', async () => {
  const { database, factory } = fixture();
  await database.checkConnectivity();
  await database.onApplicationShutdown();
  await database.close();
  assert.deepEqual(factory.pool.closeCalls, [10]);
  await assert.rejects(database.checkConnectivity(), isError('ORACLE_CLOSED'));
  assert.equal(factory.pool.connections.length, 1);
});

test('pool shutdown failure is explicit and redacted', async () => {
  const scenario: Scenario = { poolCloseFailure: new Error(syntheticEnvironment.ORACLE_PASSWORD) };
  const { database, factory, logs } = fixture(scenario);
  await database.checkConnectivity();
  await assert.rejects(database.close(), isError('ORACLE_CLEANUP_FAILED'));
  assert.ok(logs.some(log => log.includes('pool_close')));
  assert.ok(!JSON.stringify(logs).includes(syntheticEnvironment.ORACLE_PASSWORD));
  delete scenario.poolCloseFailure;
  await database.close();
  assert.deepEqual(factory.pool.closeCalls, [10, 10]);
  await assert.rejects(database.checkConnectivity(), isError('ORACLE_CLOSED'));
});

test('concurrent shutdown callers await the same drain instead of returning early', { timeout: 1000 }, async () => {
  let finishClose: (() => void) | undefined;
  let closeEntered: (() => void) | undefined;
  const pending = new Promise<void>(resolve => { finishClose = resolve; });
  const entered = new Promise<void>(resolve => { closeEntered = resolve; });
  const { database, factory } = fixture({
    beforePoolClose: async () => { closeEntered?.(); await pending; },
  });
  await database.checkConnectivity();
  const first = database.close();
  await entered;
  const second = database.close();
  assert.deepEqual(factory.pool.closeCalls, [10]);
  finishClose?.();
  await Promise.all([first, second]);
  assert.deepEqual(factory.pool.closeCalls, [10]);
});

test('only approved machine driver codes are retained, never arbitrary error text', () => {
  assert.equal(safeOracleDriverCode({ code: 'ORA-01017' }), 'ORA-01017');
  assert.equal(safeOracleDriverCode({ code: 'NJS-040' }), 'NJS-040');
  assert.equal(safeOracleDriverCode({ code: 'DPI-1047' }), 'DPI-1047');
  for (const error of [null, 'ORA-01017', { code: 'ORA-01017 ' }, { code: syntheticEnvironment.ORACLE_PASSWORD }]) {
    assert.equal(safeOracleDriverCode(error), null);
  }
});
