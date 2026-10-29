import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

// Bounded public-module/compiled-object inspection, not a whole-bundle secret
// certification (business copy legitimately mentions Oracle and synthetic mode).
const profile = process.argv[2];
assert.ok(['dev', 'test', 'production'].includes(profile), 'Expected dev|test|production');
const root = fileURLToPath(new URL('../', import.meta.url));
const config = JSON.parse(readFileSync(join(root, 'angular.json'), 'utf8'));
assert.equal(config.projects['fixture-slice'].architect.build.defaultConfiguration, 'production');
for (const [name, file] of [
  ['production', 'environment.ts'], ['dev', 'environment.dev.ts'], ['test', 'environment.testing.ts'],
]) {
  const source = readFileSync(join(root, 'src/environments', file), 'utf8');
  const match = source.match(/Object\.freeze\(\{\s*appEnv:\s*'([^']+)',\s*apiBasePath:\s*'([^']+)',?\s*\}\)/);
  assert.ok(match, `Exact public object only: ${file}`);
  assert.deepEqual(match.slice(1), [name, '/api']);
  assert.doesNotMatch(source, /process\.env|import\.meta\.env|SHF_|password|credential|nativeBinding|syntheticAdministratorEnabled/);
}
// Optional explicit browser output for isolated developer packaging. The default
// remains unchanged for existing callers; never rebuild or modify either path.
const directory = process.argv[3]
  ? resolve(process.argv[3])
  : join(root, 'dist/fixture-slice/browser');
const js = readdirSync(directory).filter(name => /^(?:main|chunk)(?:-.*)?\.js$/.test(name));
assert.equal(js.filter(name => /^main(?:-.*)?\.js$/.test(name)).length, 1, 'One current main bundle required');
const objects = js.flatMap(file => {
  const bundle = readFileSync(join(directory, file), 'utf8');
  return [...bundle.matchAll(/Object\.freeze\(\{\s*appEnv:\s*["']([^"']+)["'],\s*apiBasePath:\s*["']([^"']+)["'],?\s*\}\)/g)]
    .map(match => ({ match, file }));
});
assert.equal(objects.length, 1, 'Exactly one public environment in emitted application');
assert.deepEqual(objects[0].match.slice(1), [profile, '/api']);
assert.doesNotMatch(objects[0].match[0], /SHF_|password|credential|localhost|synthetic|native/i);
console.log(`PASS public build profile=${profile}; exact keys=appEnv,apiBasePath; apiBasePath=/api; bundle=${objects[0].file}`);
