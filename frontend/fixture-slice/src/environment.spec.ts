import { describe, expect, it } from 'vitest';
import { environment } from './environments/environment';
import { environment as dev } from './environments/environment.dev';
import { environment as test } from './environments/environment.testing';

describe('public build environment (never an authorization source)', () => {
  it('development test target selects the dev replacement', () => {
    expect(environment).toEqual({ appEnv: 'dev', apiBasePath: '/api' });
  });
  for (const [name, value] of [['dev', dev], ['test', test]] as const) {
    it(`${name} contains exactly two immutable public fields and same-origin API base`, () => {
      expect(Object.keys(value).sort()).toEqual(['apiBasePath', 'appEnv']);
      expect(value).toEqual({ appEnv: name, apiBasePath: '/api' });
      expect(Object.isFrozen(value)).toBe(true);
    });
  }
});
