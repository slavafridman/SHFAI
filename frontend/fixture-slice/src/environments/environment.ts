import type { PublicEnvironment } from './public-environment';

// Default build remains production; this does not assert backend readiness.
export const environment: PublicEnvironment = Object.freeze({
  appEnv: 'production',
  apiBasePath: '/api',
});
