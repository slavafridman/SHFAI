import { OracleReadOnlyError } from './errors.js';

export type OracleReadOnlyConfiguration =
  | { readonly enabled: false }
  | {
    readonly enabled: true;
    readonly user: string;
    readonly password: string;
    readonly connectString: string;
    readonly configDir?: string;
  };

function required(environment: Readonly<Record<string, string | undefined>>, name: string): string {
  const value = environment[name];
  if (value === undefined || value.length === 0) {
    throw new OracleReadOnlyError('ORACLE_CONFIG_INVALID', null, name);
  }
  return value;
}

export function loadOracleConfiguration(
  environment: Readonly<Record<string, string | undefined>>,
): OracleReadOnlyConfiguration {
  if (environment['ORACLE_READ_ONLY'] !== undefined && environment['ORACLE_READ_ONLY'] !== 'true') {
    throw new OracleReadOnlyError('ORACLE_CONFIG_INVALID', null, 'ORACLE_READ_ONLY (must be true)');
  }
  if (environment['ORACLE_ENABLED'] === undefined || environment['ORACLE_ENABLED'] === 'false') {
    return { enabled: false };
  }
  if (environment['ORACLE_ENABLED'] !== 'true') {
    throw new OracleReadOnlyError('ORACLE_CONFIG_INVALID', null, 'ORACLE_ENABLED');
  }
  const user = required(environment, 'ORACLE_USER').trim();
  const password = required(environment, 'ORACLE_PASSWORD');
  const connectString = required(environment, 'ORACLE_CONNECT_STRING').trim();
  if (user.length === 0) {
    throw new OracleReadOnlyError('ORACLE_CONFIG_INVALID', null, 'ORACLE_USER');
  }
  const configDir = (environment['ORACLE_CONFIG_DIR'] ?? environment['TNS_ADMIN'])?.trim();
  const alias = /^[A-Za-z][A-Za-z0-9_.-]*$/.test(connectString);
  const easyConnect = /^(?:(?:tcp|tcps):\/\/)?[A-Za-z0-9_.-]+(?::([0-9]{1,5}))?\/[A-Za-z0-9_.-]+$/.exec(connectString);
  if ((!alias && easyConnect === null)
    || (easyConnect?.[1] !== undefined && (Number(easyConnect[1]) < 1 || Number(easyConnect[1]) > 65535))) {
    throw new OracleReadOnlyError('ORACLE_CONFIG_INVALID', null, 'ORACLE_CONNECT_STRING');
  }
  if (alias && !configDir) {
    throw new OracleReadOnlyError('ORACLE_CONFIG_INVALID', null, 'ORACLE_CONFIG_DIR or TNS_ADMIN');
  }
  return {
    enabled: true, user, password, connectString,
    ...(configDir ? { configDir } : {}),
  };
}
