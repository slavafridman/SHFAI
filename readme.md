# Shifter (SHF)

Application foundation with isolated shift rules and an opt-in read-only Oracle
adapter for the workforce system described in the
[agent brief](docs/AGENT_INSTRUCTION.md) and
[development plan](docs/plan-shfAiAgentDevelopment.prompt.md).

## Approved Scope

On 2026-10-13 the user explicitly approved **the local foundation only**:
TypeScript NestJS/Fastify backend, modern Angular/Material Hebrew/RTL shell,
isolated tests and build tooling in this repository.

The user subsequently approved **isolated personal-shifts implementation and
synthetic tests only** for R01-PS-1.0. Standalone DTO contracts, pure normalized-fact
mapping and bounded calendar/filter rules now exist under
[personal-shifts](apps/api/src/personal-shifts/). The later approved stub API
reuses them; they are not exposed through real-data business endpoints.

The user subsequently requested a real Oracle adapter, classified the target
`ctidbp_wfmp` as production/shared operational, and explicitly chose **no live
checks; implement the real adapter without connecting**. The real driver is now
installed. A later explicitly approved connectivity/three-table metadata attempt
failed host resolution before the metadata query. Business-row reads and real
identity remain unapproved; further Oracle attempts are paused.

This does not approve the draft architecture or business API/UI contracts,
identity mechanism, live Oracle access, writes, broker transport, infrastructure,
deployment or release. No real-data business endpoints, embedded credentials,
partner implementation or batch jobs are included. The user approved a labelled
synthetic read API and, subsequently, the Angular demo screen connected to it.
Default non-stub business routes return framework-standard 404 responses.
The web screen now calls only explicitly labelled synthetic API responses; it
rejects unlabelled or real-mode responses.

Existing user work is preserved. The [legacy source](old/) remains read-only
evidence and is outside the application compilation and asset inputs.

## Plan Analysis

The plan correctly prioritizes read-only slices and pure previews, separates
external approvals from active execution, and requires individual write/recovery
gates under an unchanged Oracle schema. Its arithmetic is internally consistent:
36-72 active hours, or 45-90 with the proposed 25% reserve. These are provisional
budgets, not measured estimates or a calendar commitment.

Important readiness gaps remain:

- G1 architecture/API/UI approval is pending. This scaffold approval is a narrow
  exception permitting foundation work, not a blanket G1 approval.
- Personal-shifts contracts, synthetic characterization fixtures, trusted
  identity and organizational authorization must precede a connected feature.
- The DBA must authorize an environment, metadata and data scope before any
  Oracle connection; local writes require separate concurrency/recovery proof.
- Browser checks and isolated tests cannot establish Oracle parity, partner
  completion, human UAT, accessibility certification or release readiness.
- The plan's description of available agents is a historical harness snapshot,
  not a permanent tooling constraint. This task uses one implementing assistant
  and makes no parallel-agent speedup claim.
- R02 is only partially covered. Shared contracts/client generation, identity,
  error/DTO conventions, CI and deployment-platform decisions are not completed
  by this scaffold. No unused domain/persistence/integration packages are added.

## Toolchain

Versions were checked against published package engines/peer dependencies and
official support documentation on 2026-10-13:

| Component | Version |
| --- | --- |
| Node.js LTS | 24.21.0; supported project range `^24.15.0` |
| npm | 11.19.0 |
| Angular core, CLI, build, Material/CDK | 22.2.2 |
| TypeScript | 6.0.3, within Angular's `>=6.0 <6.1` range |
| NestJS / Fastify adapter | 12.1.3 |
| Fastify | 5.12.5, adapter dependency locked in the root lockfile |
| RxJS | 7.8.2 |
| Frontend unit runner | Vitest 5.0.4 with jsdom 30.1.2 |
| Backend unit runner | Node.js built-in test runner |
| Oracle Thin driver / TypeScript declarations | node-oracledb 26.0.0 / @types/oracledb 7.0.3 |

Do not upgrade TypeScript independently to the latest major: the published
Angular compiler/build peer range does not allow TypeScript 7.

References: [Angular compatibility](https://angular.dev/reference/versions),
[Angular support](https://angular.dev/reference/releases),
[Angular testing](https://angular.dev/guide/testing),
[Node releases](https://nodejs.org/en/about/previous-releases).

## Install And Run

Run from the repository root using the versions above:

```powershell
npm ci
```

In two separate terminals:

```powershell
npm run dev:api
```

```powershell
npm run dev:web
```

- API: `http://127.0.0.1:3000`, loopback-only. Set `PORT` to a valid integer
  between 1 and 65535 to change it. There is deliberately no business or health
  endpoint. Restart this command after backend source changes.
- UI: `http://127.0.0.1:4200`, loopback-only with Angular development reload.
- Production compilation: API output in `apps\api\dist`; static UI output in
  `apps\web\dist\shf-web\browser`. Build output does not authorize deployment.
- Use the single root lockfile; do not run independent workspace installs.
- Local configuration files such as `.npmrc` may be restricted by organizational
  policy; no change to the restricted file was made by this task.

## Verification

```powershell
npm run check
```

This runs TypeScript ESLint, strict API and Angular/template type checks,
isolated unit tests and production builds. It does not run legacy code, connect
to Oracle, publish messages or perform business mutations.

Focused commands:

```powershell
npm test --workspace=@shf/api
npm test --workspace=shf-web
npm run typecheck
npm run lint
npm run build
```

API foundation tests use Fastify injection without opening a socket, checking
absent business routes and invalid port configuration. The isolated
[personal-shifts tests](apps/api/test/personal-shifts.test.ts) check pure mapping
and selection using synthetic facts, without identity, Oracle or partner access.
UI tests use jsdom, checking
Hebrew landmarks, the skip link, mixed-direction isolation, disconnected states
and unavailable sign-in. ESLint covers TypeScript; strict Angular compilation
covers template typing, not a full HTML/CSS accessibility audit.

The [web README](apps/web/README.md) defines the shell's accessibility checks.
Human Hebrew screen-reader assessment, live Oracle/identity/partner tests,
business acceptance, performance targets and release approval remain pending.

### Executed Foundation Checks, 2026-10-13

- Clean root `npm ci`: passed.
- Root `npm run check`: passed; lint, strict types, two API tests, three frontend
  tests and both production builds. Initial CommonJS compilation failed against
  NestJS 12's ESM packages; native ESM with NodeNext resolution passed on retest.
- Live loopback smoke: UI returned HTTP 200; `/me/shifts` returned the intended
  HTTP 404. These are local process checks, not live business integration.
- Browser: Hebrew language and RTL direction, keyboard skip-link/main focus,
  disabled sign-in and no horizontal overflow at 1280, 768 and 320 CSS pixels.
- At 320 CSS pixels, introductory text resized from 16px to 32px without
  horizontal overflow. Targeted text contrast checks exceeded 4.5:1; this is not
  a full accessibility assessment.
- Browser reload reported no page errors or requests outside the local UI
  origin. No Oracle, broker or personal-data checks were executed.

The editor test tool did not discover the backend tests; the declared npm/Node
runner executed them successfully. npm emitted install-script review warnings
for four transitive build packages; no additional script approvals were made.
Both clean installation and builds succeeded with the current environment.

### Isolated Personal-Shifts Implementation

```powershell
npm test --workspace=@shf/api
```

At the isolated-code checkpoint the backend suite had **24 passing tests**: 22 isolated personal-shifts
tests and two foundation regressions. Workspace type checks and both production
builds passed; lint passed after correcting a deliberately unsafe rejection
fixture to construct its numeric input without an imprecise source literal.
The frontend was unchanged, so its three unit tests were not rerun for this slice.

Important implementation boundaries:

- Input facts contain separately resolved `baseline`/`effective` schedules and
  an explicit `eligibility` of `included`, `excluded` or `unverified`. The helper
  does not resolve Oracle columns, interpret cancellation/day-type flags or
  apply legacy override fallbacks. Unverified eligibility fails explicitly.
- Caller-supplied synthetic scope is not authentication. Only a future approved
  request-local identity/policy service may supply real scope and baseline access.
- Calendar validation uses day ordinals without UTC/browser-zone conversion.
  Local timestamp strings are checked and preserved; no business time zone,
  DST instant conversion or paid duration is inferred.
- Selection returns bounded `items` and `hasMore`, not a fabricated HTTP envelope
  or cursor. Providing a cursor fails explicitly until its contract is approved.
- Isolated normalization guards accept canonical positive decimal shift IDs up
  to 38 digits, digit-only employee IDs up to 128 characters, and nullable
  site/activity codes up to 256 characters. These are code-input bounds, not
  claims about physical Oracle column precision or lengths.
- That isolated-code checkpoint added no dependency, schema artifact, database
  adapter or business route. The later adapter below adds a real driver, not a
  connected business endpoint.

## Real Oracle Adapter: Read-Only, Not Activated

The [Oracle module](apps/api/src/oracle/oracle.module.ts) is registered with the
API, but construction/startup performs no database call. The
[read-only adapter](apps/api/src/oracle/read-only-database.ts) creates one lazy
bounded Thin pool only when an explicitly invoked read needs it. It provides:

- A constant `SELECT 1 FROM DUAL` connectivity probe.
- A bounded, fixed-bind column-metadata query for `SHIFTER.SHF_EMPLOYEE_DAY`,
  `SHF_DAY_CHANGES` and `SHF_EMPLOYEES`, excluding business rows, defaults and
  stored source text. This operation has not been run.
- `SET TRANSACTION READ ONLY` before each allowlisted SELECT, `autoCommit: false`,
  rollback and release on every leased-connection path. A failed rollback drops
  the lease. There is no public arbitrary-SQL, commit, DML or PL/SQL operation.
- Pool maximum 2, queue maximum 10, 5-second queue/call timeout settings,
  10-second connect and 5-second transport-connect settings, no driver retries
  and a 10-second shutdown drain. Call timeout is per round-trip, not a total
  request deadline. Cleanup errors remain explicit and redacted.

These are code/mocked-test properties, not live Oracle enforcement evidence.
An account named `SHIFTER` does not establish least privilege, and these controls
do not prevent database-side logon triggers. Prefer a DBA-approved existing read-only account.
No grants, schema changes, production queries or privilege discovery were run.

### External Configuration

Oracle access defaults to disabled. No credentials or Oracle Net files were
created or inspected, and the supplied password was not copied into code/logs.
The [configuration loader](apps/api/src/oracle/configuration.ts) requires:

| Variable | Meaning |
| --- | --- |
| `ORACLE_ENABLED` | Unset/`false` disables access; `true` permits adapter calls only after separate environment/read-scope approval. |
| `ORACLE_READ_ONLY` | Optional `true`; any other provided value is rejected. There is no write mode. |
| `ORACLE_USER` | Externally supplied approved account. |
| `ORACLE_PASSWORD` | Externally supplied secret, never part of the connection string. |
| `ORACLE_CONNECT_STRING` | TNS alias such as `ctidbp_wfmp`, or approved host/port/service Easy Connect string. |
| `ORACLE_CONFIG_DIR` / `TNS_ADMIN` | External directory containing the approved `tnsnames.ora` for an alias; required for a bare TNS alias. |

Alias resolution, service/port, TLS/authentication compatibility, actual database
version/grants and live read scope are unverified. No Thick-mode fallback or
remote configuration provider is implemented. Setting a variable is not approval.

After a separately approved connectivity window, use a local terminal to obtain
the password without putting it in a command line or repository file:

```powershell
$credential = Get-Credential -UserName 'SHIFTER' -Message 'Approved Oracle read-only account'
$env:ORACLE_USER = $credential.UserName
$env:ORACLE_PASSWORD = $credential.GetNetworkCredential().Password
$env:ORACLE_CONNECT_STRING = 'ctidbp_wfmp'
$env:ORACLE_CONFIG_DIR = '<approved external Oracle Net configuration directory>'
$env:ORACLE_READ_ONLY = 'true'
$env:ORACLE_ENABLED = 'true'
try {
  npm run oracle:check
} finally {
  Remove-Item Env:ORACLE_PASSWORD
  Remove-Item Env:ORACLE_ENABLED
  Remove-Variable credential
}
```

Do not execute this against the operational environment under the current
**no-live-checks** instruction. It performs a real connection and constant SELECT,
not a simulation. The command prints success only after read and pool cleanup.
Arrange password rotation through the credential owner if it was shared in chat.

### Offline Verification

[Oracle tests](apps/api/test/oracle-read-only.test.ts) use explicitly synthetic
pool/connection doubles, not real connections. The backend suite now has **44
passing tests**: 20 Oracle adapter tests, 22 pure shift tests and two foundation
regressions. Lint, strict workspace types and both production builds passed.
Real driver import was verified in Thin mode without creating a pool.
Clean `npm ci` followed by `npm run check` passed, including the unchanged
frontend's three tests: **47 tests total**. Install-script review warnings were
reported for five dependencies; no additional script approvals were made, and
Thin loading/builds succeeded.

The disabled CLI guard was checked locally: `ORACLE_DISABLED`, exit code 1.
No live database connectivity or metadata/business query was attempted.
Business routes still return 404; the UI remains disconnected until trusted
identity, verified metadata/mapping, business contracts and data scope are ready.

## Next Milestone

### Approved Synthetic API Mode

The user redirected work to stub API responses after the authorized Oracle probe
failed with **NJS-530 (host not found)**. No column-metadata query or business-row
read completed. Oracle diagnostics are paused; stub results are not an automatic
fallback from a failed real connection.

Start the explicitly synthetic API on loopback:

```powershell
npm run dev:api:stub
```

Alternatively set `SHF_STUB_API=true` before normal API startup. Stub mode rejects
simultaneous Oracle enablement and does not register the Oracle module. The
startup warning, `X-SHF-Data-Source: synthetic-stub` header, and response fields
`mode: "stub"`, `synthetic: true`, `authenticated: false` distinguish every served
stub business response from real data. Responses use `Cache-Control: no-store`.
This is a fixed demo identity, not login or authorization evidence.

| Stub route | Behavior |
| --- | --- |
| `GET /api/v1/me` | Synthetic identity `00000001`; no authentication. |
| `GET /api/v1/me/capabilities` | Demo reads only; writes/previews and integration unavailable. |
| `GET /api/v1/me/shifts?from=2026-10-14&toExclusive=2026-10-18` | Five permitted synthetic shifts: baseline, split/home-work override, incoming reassignment, overnight and unknown/null values. |
| `GET /api/v1/shifts/9007199254740993` | Scoped synthetic detail. Foreign, excluded and missing IDs return the same 404 problem. |

Fixtures are fixed to October 14-17, 2026; other valid date ranges can return an
empty list. Invalid filters return Hebrew Problem Details. A limit smaller than
the matching result count returns 503 `STUB_PAGINATION_UNAVAILABLE` instead of
silently truncating with a fake null cursor. Cursor inputs remain gated.
POST/PUT/PATCH/DELETE routes are absent. The default non-stub API remains
route-free; real personal-shifts endpoints are not enabled.

Implementation: [stub module](apps/api/src/stub/stub.module.ts),
[synthetic fixtures](apps/api/src/stub/fixtures.ts) and
[HTTP regression tests](apps/api/test/stub-api.test.ts).
The later user-approved Angular step now consumes these stub endpoints. Start
`npm run dev:api:stub` and, in another terminal, `npm run dev:web`. The local
Angular proxy uses API port 3000. If port 4200 is occupied, start the UI with
`npm start --workspace=shf-web -- --port 4201`; do not terminate another server
to free the default port.

The [personal-shifts screen](apps/web/src/app/personal-shifts.ts) presents synthetic
results with Hebrew date filters, a semantic RTL table, local-time detail,
split/home-work flags and baseline redaction. It distinguishes loading, empty,
invalid and dependency-failure states, retains dates on failure, suppresses
superseded reads and restores focus after closing details. It performs no write
or real authentication; the real-mode API remains unavailable for business reads.
The [web README](apps/web/README.md) explains the demo workflow and testing limits.

The expanded fixtures retain October 14-17, 2026. Overnight shift
`9007199254740998` starts October 16 at 23:00 and ends October 17 at 06:00;
filtering October 17 alone does not include it merely because it ends that day.
Shift `9007199254740999` has unknown site/activity/home-work/split data, displayed
as `לא ידוע` rather than false or zero. Incoming reassignment hides the original
owner; outgoing reassignment `9007199254741000` is absent and returns the same
404 detail problem as a missing shift. Foreign and excluded fixtures stay hidden.
UI detail labels now include start times to distinguish shifts on the same day.

The latest edge-case check passes **56 backend and 14 frontend tests (70 total)**,
lint, strict types/templates and both builds. Browser verification with isolated
updated stub/UI servers covered overnight/null/reassignment detail, keyboard focus,
start-date filtering, 320/768/1280 CSS pixel reflow and 200% text resizing. These
are synthetic proofs, not Oracle, real authorization or business acceptance.

Latest UI verification: full `npm run check` passed **53 backend and 11 frontend
tests (64 total)**, lint, strict types/templates and both builds. Browser checks
against the local stub/proxy passed detail and keyboard focus, 320/768/1280 CSS
pixel layouts, 200% text resizing, date validation, empty results, injected
synthetic service failure and retry. This does not establish real Oracle parity
or full accessibility conformance.

Verification: `npm run check` passed lint, strict workspace types, **53 backend
tests plus three frontend tests (56 total)** and both builds. A temporary real
loopback server on port 3100 returned HTTP 200, three synthetic shifts and the
required no-store/source markers; identity explicitly reported unauthenticated.
This HTTP smoke made no Oracle calls. The temporary server was stopped afterward.

The [bounded diagnostic orchestrator](apps/api/src/oracle/diagnostics.ts),
[secure credential prompt](scripts/Invoke-ShfOracleMetadata.ps1) and
[VS Code task](.vscode/tasks.json) are retained for a future separately authorized
Oracle attempt. `oracle:inspect-shifts` runs only the connectivity probe followed
by the three-table column query, then closes; it does not read business rows.
An initial shell-quoting failure was corrected; the subsequent live attempt
failed host resolution. No retry or broader database access was performed.

The proposed **R01-PS-1.0** baseline is now prepared in the existing technical
design:

- [Source trace and API contract](docs/SHF_REVERSE_ENGINEERED_TECHNICAL_DESIGN.md#361-r01-personal-shifts-baseline-r01-ps-10).
- [Hebrew/RTL personal-workspace states](docs/SHF_REVERSE_ENGINEERED_TECHNICAL_DESIGN.md#461-first-slice-personal-workspace-r01-ps-10).
- [17 proposed acceptance cases](docs/SHF_REVERSE_ENGINEERED_TECHNICAL_DESIGN.md#1031-first-slice-synthetic-acceptance-matrix), with isolated proof distinguished from pending connected checks.

The source trace found that the active personal-shifts UNION differs from its
commented NVL predecessor: its range is unbounded above, its ordering is by
day-start, and its changed-row attendance join differs from the detail query.
The draft therefore proposes a bounded, minimized read contract rather than
copying the active query blindly. Original/effective ownership, privacy,
cancellation, null flags, local times and failures are explicit.

Approve the baseline's intentional behavior changes and resolve SEC/DBA identity,
environment, cancellation, time-zone, metadata and cursor decisions before
implementing the connected slice. The latest approval permits isolated code and
synthetic tests only; it does not enable the draft routes, manufacture sign-off or
connect to Oracle. The real adapter adds the persistence foundation only; the
latest operational-environment instruction explicitly forbids live checks.