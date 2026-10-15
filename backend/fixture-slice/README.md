# SHF-RW-03: isolated fixture backend

Implements approved section 13 v0.1 of `docs/SHF_REVERSE_ENGINEERING_DESIGN.md`;
section 15 records approval. No Oracle, EMS, business writes, real authentication,
framework or dependency installation. All included test identities/rows are synthetic.

Observed execution environment: Node 24.21.0, npm 11.19.0 on Windows.
Native `.mts` stripping executes erasable TypeScript; **it does not type-check**.
No installed static checker was found. npm/build/scaffolding is unnecessary here.

From repository root:

```powershell
node --test backend/fixture-slice/test/projection.test.mts backend/fixture-slice/test/contract.test.mts backend/fixture-slice/test/use-case.test.mts backend/fixture-slice/test/http.test.mts
```

HTTP tests bind `127.0.0.1` on ephemeral ports and close all listeners/connections.
They exercise the actual five-second request budget. The only routes are:

- `GET /api/v1/identity`
- `GET /api/v1/employees/{employeeId}/shift-days/{shiftDayId}`

Both prohibit query/body input and send `Cache-Control: no-store`.
Identity is not an authorization token; every request authenticates independently.
Administrator has exactly `shift-day:read`, no employee identity, and cannot
bypass source validation, explicit employee context or the fixture-unit allowlist.

Optional executable: `node backend/fixture-slice/server.mts`. It **fails closed
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
