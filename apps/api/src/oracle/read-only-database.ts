import { Logger } from '@nestjs/common';
import oracledb from 'oracledb';
import type { BindParameters, ExecuteOptions, InitialiseOptions, PoolAttributes } from 'oracledb';
import type { OracleReadOnlyConfiguration } from './configuration.js';
import { OracleReadOnlyError, safeOracleDriverCode } from './errors.js';

export interface ReadOnlyOracleConnection {
  callTimeout?: number | undefined;
  execute(sql: string, binds: BindParameters, options: ExecuteOptions): Promise<{
    rows?: readonly unknown[] | undefined;
  }>;
  rollback(): Promise<void>;
  close(options?: { drop: boolean }): Promise<void>;
}

export interface ReadOnlyOraclePool {
  getConnection(): Promise<ReadOnlyOracleConnection>;
  close(drainSeconds: number): Promise<void>;
}

export interface ReadOnlyOracleFactory {
  readonly thin: boolean;
  initOracleClient(options: InitialiseOptions): void;
  createPool(options: PoolAttributes): Promise<ReadOnlyOraclePool>;
}

interface ErrorLogger {
  error(message: string): void;
}

export interface OracleShiftColumn {
  readonly tableName: string;
  readonly columnName: string;
  readonly dataType: string;
  readonly precision: number | null;
  readonly scale: number | null;
  readonly nullable: boolean;
}

const TABLES = ['SHF_EMPLOYEE_DAY', 'SHF_DAY_CHANGES', 'SHF_EMPLOYEES'] as const;
const MAX_METADATA_ROWS = 512;
const operations = {
  connectivity: {
    sql: 'SELECT 1 AS "ok" FROM DUAL',
    binds: {},
  },
  shiftColumns: {
    sql: `SELECT * FROM (
      SELECT table_name AS "tableName", column_name AS "columnName",
      data_type AS "dataType", data_precision AS "precision", data_scale AS "scale",
      nullable AS "nullable"
      FROM all_tab_columns
      WHERE owner = :owner AND table_name IN (:days, :changes, :employees)
      ORDER BY table_name, column_id
      ) WHERE ROWNUM <= 513`,
    binds: { owner: 'SHIFTER', days: TABLES[0], changes: TABLES[1], employees: TABLES[2] },
  },
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function record(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    throw new OracleReadOnlyError('ORACLE_RESULT_INVALID');
  }
  return value;
}

function text(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > 128) {
    throw new OracleReadOnlyError('ORACLE_RESULT_INVALID');
  }
  return value;
}

function integerOrNull(value: unknown): number | null {
  if (value === null || (typeof value === 'number' && Number.isSafeInteger(value))) {
    return value;
  }
  throw new OracleReadOnlyError('ORACLE_RESULT_INVALID');
}

export class OracleReadOnlyDatabase {
  #configuration: OracleReadOnlyConfiguration;
  #factory: ReadOnlyOracleFactory;
  #logger: ErrorLogger;
  #poolPromise: Promise<ReadOnlyOraclePool> | undefined;
  #closePromise: Promise<void> | undefined;
  #closed = false;
  #clientInitialized = false;

  constructor(
    configuration: OracleReadOnlyConfiguration,
    factory: ReadOnlyOracleFactory = oracledb,
    logger: ErrorLogger = new Logger('OracleReadOnly'),
  ) {
    this.#configuration = configuration;
    this.#factory = factory;
    this.#logger = logger;
  }

  async checkConnectivity(): Promise<{ readonly connected: true; readonly readOnly: true }> {
    return this.read('connectivity', rows => {
      if (rows.length !== 1 || record(rows[0])['ok'] !== 1) {
        throw new OracleReadOnlyError('ORACLE_RESULT_INVALID');
      }
      return { connected: true, readOnly: true };
    });
  }

  async getShiftColumnMetadata(): Promise<readonly OracleShiftColumn[]> {
    return this.read('shiftColumns', rows => {
      const columns = rows.map(value => {
        const row = record(value);
        const tableName = text(row['tableName']);
        const nullable = row['nullable'];
        if (!TABLES.some(table => table === tableName) || (nullable !== 'Y' && nullable !== 'N')) {
          throw new OracleReadOnlyError('ORACLE_RESULT_INVALID');
        }
        return {
          tableName,
          columnName: text(row['columnName']),
          dataType: text(row['dataType']),
          precision: integerOrNull(row['precision']),
          scale: integerOrNull(row['scale']),
          nullable: nullable === 'Y',
        };
      });
      if (TABLES.some(table => !columns.some(column => column.tableName === table))) {
        throw new OracleReadOnlyError('ORACLE_RESULT_INVALID');
      }
      return columns;
    });
  }

  private async pool(): Promise<ReadOnlyOraclePool> {
    if (this.#closed) {
      throw new OracleReadOnlyError('ORACLE_CLOSED');
    }
    const configuration = this.#configuration;
    if (!configuration.enabled) {
      throw new OracleReadOnlyError('ORACLE_DISABLED');
    }
    if (configuration.mode === 'thick' && !this.#clientInitialized) {
      try {
        this.#factory.initOracleClient({
          libDir: configuration.clientLibDir,
          ...(configuration.configDir ? { configDir: configuration.configDir } : {}),
        });
      } catch (error: unknown) {
        throw new OracleReadOnlyError('ORACLE_CLIENT_INIT_FAILED', safeOracleDriverCode(error));
      }
      if (this.#factory.thin) {
        throw new OracleReadOnlyError('ORACLE_THICK_REQUIRED');
      }
      this.#clientInitialized = true;
    }
    if (configuration.mode === 'thin' && !this.#factory.thin) {
      throw new OracleReadOnlyError('ORACLE_THIN_REQUIRED');
    }
    if (this.#poolPromise === undefined) {
      this.#poolPromise = this.#factory.createPool({
        user: configuration.user,
        password: configuration.password,
        connectString: configuration.connectString,
        ...(configuration.mode === 'thin' ? {
          ...(configuration.configDir ? { configDir: configuration.configDir } : {}),
          connectTimeout: 10, transportConnectTimeout: 5, retryCount: 0,
        } : {}),
        poolMin: 0, poolMax: 2, poolIncrement: 1,
        queueMax: 10, queueTimeout: 5_000,
        stmtCacheSize: 20,
      });
    }
    const pending = this.#poolPromise;
    try {
      return await pending;
    } catch (error: unknown) {
      if (this.#poolPromise === pending) {
        this.#poolPromise = undefined;
      }
      throw error;
    }
  }

  private report(error: OracleReadOnlyError, stage: string): void {
    this.#logger.error(JSON.stringify({ event: 'oracle_read_only_failure', stage, code: error.code, driverCode: error.driverCode }));
  }

  private async read<T>(operation: keyof typeof operations, map: (rows: readonly unknown[]) => T): Promise<T> {
    let connection: ReadOnlyOracleConnection | undefined;
    let value: T | undefined;
    const failures: OracleReadOnlyError[] = [];
    try {
      connection = await (await this.pool()).getConnection();
      connection.callTimeout = 5_000;
      await connection.execute('SET TRANSACTION READ ONLY', {}, { autoCommit: false });
      const statement = operations[operation];
      const result = await connection.execute(statement.sql, statement.binds, {
        autoCommit: false, outFormat: oracledb.OUT_FORMAT_OBJECT,
        maxRows: MAX_METADATA_ROWS + 1, fetchArraySize: 100,
      });
      if (!Array.isArray(result.rows)) {
        throw new OracleReadOnlyError('ORACLE_RESULT_INVALID');
      }
      if (result.rows.length > MAX_METADATA_ROWS) {
        throw new OracleReadOnlyError('ORACLE_RESULT_LIMIT');
      }
      value = map(result.rows);
    } catch (error: unknown) {
      const failure = error instanceof OracleReadOnlyError ? error
        : new OracleReadOnlyError('ORACLE_READ_FAILED', safeOracleDriverCode(error));
      failures.push(failure);
      this.report(failure, operation);
    } finally {
      if (connection !== undefined) {
        let drop = false;
        try {
          await connection.rollback();
        } catch (error: unknown) {
          drop = true;
          const failure = new OracleReadOnlyError('ORACLE_CLEANUP_FAILED', safeOracleDriverCode(error));
          failures.push(failure);
          this.report(failure, 'rollback');
        }
        try {
          if (drop) {
            await connection.close({ drop: true });
          } else {
            await connection.close();
          }
        } catch (error: unknown) {
          const failure = new OracleReadOnlyError('ORACLE_CLEANUP_FAILED', safeOracleDriverCode(error));
          failures.push(failure);
          this.report(failure, 'release');
        }
      }
    }
    if (failures.length > 1) {
      throw new AggregateError(failures, 'Oracle read and/or cleanup failed.');
    }
    if (failures[0] !== undefined) {
      throw failures[0];
    }
    if (value === undefined) {
      const failure = new OracleReadOnlyError('ORACLE_RESULT_INVALID');
      this.report(failure, operation);
      throw failure;
    }
    return value;
  }

  async close(): Promise<void> {
    this.#closed = true;
    if (this.#closePromise === undefined) {
      const pending = this.#poolPromise;
      if (pending === undefined) {
        return;
      }
      this.#closePromise = this.closePool(pending);
    }
    const closing = this.#closePromise;
    try {
      await closing;
    } finally {
      if (this.#closePromise === closing) {
        this.#closePromise = undefined;
      }
    }
  }

  private async closePool(pending: Promise<ReadOnlyOraclePool>): Promise<void> {
    try {
      await (await pending).close(10);
      if (this.#poolPromise === pending) {
        this.#poolPromise = undefined;
      }
    } catch (error: unknown) {
      const failure = new OracleReadOnlyError('ORACLE_CLEANUP_FAILED', safeOracleDriverCode(error));
      this.report(failure, 'pool_close');
      throw failure;
    }
  }

  async onApplicationShutdown(): Promise<void> {
    await this.close();
  }
}
