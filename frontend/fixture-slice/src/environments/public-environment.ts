/** Build metadata only: never identity, authorization, backend source or secrets. */
export interface PublicEnvironment {
  readonly appEnv: 'dev' | 'test' | 'production';
  readonly apiBasePath: '/api';
}
