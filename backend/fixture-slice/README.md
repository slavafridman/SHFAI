# SHF-RW-03 / SHF-RW-04: isolated fixture backend

Implements approved section 13 v0.1 of `docs/SHF_REVERSE_ENGINEERING_DESIGN.md`;
section 15 records contract approval and section 17 approves the local tooling.
No Oracle, EMS, business writes, real authentication, framework or production
dependencies. All included test identities/rows are synthetic.

Observed execution environment: Node 24.21.0, npm 11.19.0 on Windows.
The package requires Node 24. Native `.mts` stripping executes erasable TypeScript;
**it does not type-check**. Development-only tooling is pinned to TypeScript 5.9.3,
`@types/node` 24.19.2 and `undici-types` 7.24.6 (also overridden to that exact version).
The backend-local lockfile records registry URLs and SHA-512 integrity values.
No root workspace or emitted build is needed.

Windows PowerShell, from repository root:

```powershell
Set-Location D:\AIProjects\SHFAI\backend\fixture-slice
npm ci --ignore-scripts --no-audit --no-fund
if ($LASTEXITCODE -eq 0) { npm run typecheck }
if ($LASTEXITCODE -eq 0) { npm test }
```

`npm run typecheck` runs `tsc --project tsconfig.json`: strict, noEmit, NodeNext,
ES2024/Node types, including **all** source and test `.mts` files. It also enforces
erasable syntax compatible with native execution. No `skipLibCheck`, strictness
suppression or substitute syntax-stripping check is used.
`npm test` invokes the four existing test files together:

```powershell
node --test test/projection.test.mts test/contract.test.mts test/use-case.test.mts test/http.test.mts
```

SHF-RW-04 verification: strict typecheck passed and all 34 runtime tests passed.
The type-only provider binding repair preserves fail-closed startup; HTTP test
JSON values are narrowed with actual object/string assertions, not unchecked casts.
Checks are static or synthetic/loopback only; they do not verify live infrastructure.

HTTP tests bind `127.0.0.1` on ephemeral ports and close all listeners/connections.
They exercise the actual five-second request budget. The only routes are:

- `GET /api/v1/identity`
- `GET /api/v1/employees/{employeeId}/shift-days/{shiftDayId}`

Both prohibit query/body input and send `Cache-Control: no-store`.
Identity is not an authorization token; every request authenticates independently.
Administrator has exactly `shift-day:read`, no employee identity, and cannot
bypass source validation, explicit employee context or the fixture-unit allowlist.

Optional executable from this directory: `npm start` (runs `node server.mts`).
It **fails closed
without configuration**. An operator must explicitly set all three environment
variables, containing synthetic data only:

- `SHF_FIXTURE_CONFIG`: JSON with `deploymentClass` (`local-development` or
  `isolated-test-demo`), `authenticationMode: "synthetic"`,
  `syntheticAdministratorEnabled: true`, nonempty unique `syntheticOrgUnitIds`
  (max 100, exact 1–8-character IDs, no wildcard), `dataSource: "isolated-fixture"`
  and an explicit valid IANA `businessTimeZone`.
- `SHF_FIXTURE_ROWS`: JSON array of raw-column-shaped synthetic `RawShiftDay`
  rows as defined in `contracts.mts`; explicit `[]` is permitted.
- `SHF_FIXTURE_PORT`: explicit decimal port `0`–`65535`; `0` requests an ephemeral port.

No configuration, credentials, rows or listener addresses are logged. Stop the
optional server with Ctrl+C. No persistent server is started by the checks.
The test zone `Asia/Jerusalem` and unit `TEST-U` are synthetic test settings,
not confirmation of the real business zone/unit.

`FixtureReader` is an isolated double: constructor snapshots rows, maps only
empty activity strings to Oracle-like nulls, checks at most two matching rows,
and returns detached copies. It does not repair bad dates/IDs or interpret
activity/cancellation/day type. Projection preserves nulls, overnight and
end-before-start times, Hebrew, semicolons and exact decimal ID strings.

The real-provider resolver is a replacement seam, exercised only with explicitly
isolated test doubles. No real provider is supplied; missing/failed providers
never fall back to synthetic Administrator. Production mock configuration is
rejected even if another provider is configured.

Timeout/abort suppresses late success and prevents later phases from starting.
An already-started pure fixture read/provider promise cannot be forcibly canceled
through the approved port signature; there are no database connections to release.
This is **not** an Oracle cancellation/SLA, live infrastructure, UI or deployment
verification. Those remain separately gated.
