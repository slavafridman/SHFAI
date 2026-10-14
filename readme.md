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

Latest full-host Thin retry, 2026-10-14 at 13:05 local (UTC+03:00): the user
authorized `CTIDBT_WFMT.host:1521/WFMT`, retaining the latest port/service.
`node-oracledb` 26.0.0 reported `thin: true`. Node hostname lookup returned
`ENOTFOUND`; the actual secure-prompt Oracle diagnostic failed with **NJS-530**,
exit 1, before authentication. No metadata/business query ran. The
[credential-free task](.vscode/tasks.json) now targets this endpoint; no password
was stored and stub mode remains unchanged.

Earlier Thin-driver retry, 2026-10-14 at 12:54 local (UTC+03:00): the user
authorized a connectivity-only check to `CTIDBT_WFMT:1521/WFMT` as `SHIFTER`.
Runtime inspection confirmed `node-oracledb` 26.0.0 with `thin: true`; no Oracle
Client initialization or Thick fallback was used. The secure-prompt diagnostic
failed with **NJS-530**, exit 1, consistent with the preceding Node resolver's
`ENOTFOUND` for this hostname. Listener/authentication and service validity
remain unverified; no metadata/business query ran. The
[credential-free task](.vscode/tasks.json) targeted that approved endpoint.
Stub mode remains unchanged; DBA/network resolution is still required.

Follow-up DNS diagnosis, 2026-10-14: both configured internal IPv4 DNS servers
returned server failure for the short name `CTIDBT_WFMT`. A control SOA query
for the configured suffix `bezeq.com` succeeded on the primary server, while
`CTIDBT_WFMT.bezeq.com` returned NXDOMAIN (name does not exist). This narrows
the immediate blocker to the supplied host/current DNS namespace, not a missing
Thin driver or a proven general DNS outage. `CTIDBT_WFMT` may instead be a TNS
alias; that remains unverified. Process `TNS_ADMIN`/`ORACLE_CONFIG_DIR` are unset,
and no `tnsnames.ora` exists in the checked repository root, standalone Oracle
app root or repository `network\admin` directory. These bounded checks do not
exclude an Oracle Net file elsewhere. Obtain the actual HOST/PORT/SERVICE_NAME
from a working client or DBA; no network settings or hosts file were changed.

Full-host retry, 2026-10-14 at 08:59: the user supplied `CTIDBT_WFMT.host`.
One connectivity-only attempt to `CTIDBT_WFMT.host:1521/SHIFTER` again failed
with **NJS-530 (host not found)** and exit 1. Listener/authentication were not
reached; credentials/service remain unverified. No metadata/business query ran.
At that checkpoint, the credential-free VS Code task targeted that hostname.
Stub mode remains unchanged; a reachable DBA-provided FQDN/IP or corrected
corporate DNS/VPN context is still required before another authorized attempt.

Earlier connectivity attempt, 2026-10-14: the user confirmed
`CTIDBT_WFMT:1521/SHIFTER` and authorized one connectivity-only probe with a
secure local credential prompt. It failed with **NJS-530 (host not found)**,
exit code 1, before reaching the listener or authenticating. The password and
service validity therefore remain unverified. No metadata or business query ran.
The DBA/network owner must provide a reachable FQDN/IP and required VPN/DNS
context before a separately authorized retry. No automatic retry or stub-mode
change was made.

With explicit user approval, the existing credential-bearing task was replaced
by a credential-free process task. The
[secure prompt script](scripts/Invoke-ShfOracleMetadata.ps1) now supports
`-ConnectivityOnly`; without that switch its earlier metadata behavior remains
available only for separately approved scopes. No password is stored by the new
task or script. Credentials previously shared in chat/files should be rotated
through the credential owner; no rotation was performed here.

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

### Progress and R06 Operational Schedule/Attendance Demo

The [current progress report](docs/plan-shfAiAgentDevelopment.prompt.md#current-progress-snapshot-2026-10-14-after-r09-reporting-demo)
records the overall plan status. R04/R05 and the new R06 range-read increment
have working synthetic demos; full architecture/business baselines, trusted
identity, Oracle mapping/parity and production acceptance are not complete.
Oracle host resolution remains blocked; this work made no new connection attempt.

The user approved a fixed-team read-only operational screen, below the employee
views, using:

```text
GET /api/v1/shifts?from=2026-10-14&toExclusive=2026-10-18&limit=100
GET /api/v1/attendance?from=2026-10-14&toExclusive=2026-10-18&limit=100
```

The same demo startup commands serve these endpoints. Restart the API to load the
new fixtures. Seven in-scope shifts reuse personal-shift effective projection and
show both demo employees, including reassigned ownership. An outside-team row
and excluded shift are hidden. Original baselines remain redacted.

Switch between `סידור עבודה` and `נוכחות`. The Hebrew/RTL table distinguishes
planned start/end from actual stage/station arrival/exit, zero versus unknown
late minutes, missing reason and overnight departure. Actual values are explicit
synthetic facts—not generated from current time or inferred attendance.
Read-only inline detail and calendar filters reuse existing focus/date rules.
Dates filter effective start, not every shift overlapping the interval.

There are no arrival/departure, correction, save or partner actions. Unit/site
selectors, current-instant queries, historical as-of snapshots and cursor
pagination are not implemented. Labels identify demo scope, not real manager
authority; the client rejects unmarked/incorrect-scope or malformed responses.

Latest validation: **105 tests (64 backend, 41 frontend)**, lint, strict types/
templates and both builds passed. Initial UI bundle **424.28 kB**, below the
unchanged 500 kB warning. Local browser tests verified seven rows, planned/actual
and null/zero distinctions, overnight detail, calendar/date filtering, focus,
empty/error/retry, responsive reflow and 200% text resizing. Temporary servers
were stopped; no real Oracle, identity, accessibility certification or UAT claim.

### R07 Break Reads and Pure Preview Demo

The user approved synthetic break views and pure change previews. The new
[break screen](apps/web/src/app/breaks.ts) reuses the same startup commands.
Choose a demo shift, inspect planned versus nullable actual timestamps, then
enter a local date/calendar, time and duration for an existing break.

```text
GET /api/v1/shifts/{id}/breaks
POST /api/v1/shifts/{id}/break-change-previews
Body: { "breakId": "break-1", "startLocal": "2026-10-14T11:45:00", "durationMinutes": 15 }
```

Preview output is explicitly `previewOnly: true`, `saved: false`; it does not
register an operation or change fixtures. No save/apply/delete route exists.
Successful and rejected previews leave planned and actual values unchanged.
Editing the draft clears stale results, and errors preserve the current input.
All reads/previews remain explicitly synthetic, unauthenticated and no-store.

Synthetic policy: 60 minutes from shift edges and between breaks, equality
allowed; whole-minute proposals lasting 1–120 minutes. Zero is invalid, not
deletion. Actual seconds are preserved for display. These fixed demo settings
are not production parameters; 120 minutes is only a demo input bound.
No DST instant, paid duration, lead-time or partner policy is inferred.

Try normal shift `9007199254740993`: `11:45` for 15 minutes ends at `12:00`
and leaves an exact 60-minute gap before the `13:00` break; `11:46` fails.
For overnight `9007199254740998`, date `2026-10-17`, `01:45` for 15 minutes
ends at `02:00`. Managed/split/unknown-source previews are unavailable, and
unknown shift `9007199254740999` has an empty planned-break collection.

Latest validation: **119 tests (69 backend + 50 frontend)**, lint, strict
types/templates and builds passed; initial UI bundle **426.75 kB**. Browser
checks passed rule boundaries, unchanged planned/actual rows, calendar/overnight,
unavailable/empty cases, draft/focus behavior, 320/768/1280 reflow and 200% text
resizing. Oracle and full real-policy/G4 validation remain blocked/not run.

### R07 Shift-Time and Split-Shift Pure Preview

The user approved a separate synthetic shift/split calculation screen.
Use the same stub API/web commands and restart them for the added routes:

```text
GET /api/v1/shifts/{id}/shift-preview-context
POST /api/v1/shifts/{id}/shift-change-previews
Body: {
  "startLocal": "2026-10-14T08:00:00",
  "endLocal": "2026-10-14T18:00:00",
  "reason": "synthetic demonstration",
  "split": { "gapStartLocal": "2026-10-14T14:00:00", "gapEndLocal": "2026-10-14T16:00:00" }
}
```

For shift `9007199254740993`, this calculates span 600, work 480 and gap 120
minutes, with explicit first and second work segments. Use `split: null` for a
plain proposal. The calendar/time form requires a reason and labels every result
as **not saved**; it cannot apply, delete offers or invoke partners.

Fixed demo policy: start dates October 14-17, span 240-960 minutes, work at least
240 minutes, split first/gap/second parts at least 120 minutes, and second start
at/after 16:00 on the start date. Existing breaks must remain inside shift work
segments; conflicts are rejected without cleanup. The second-part minimum, fixed
duration/window and reason length are demo choices, not verified live settings.
Break-margin/offer/attendance eligibility and DST/paid-duration rules are not
claimed. Wall-time arithmetic is not an Oracle timestamp conversion.

The [pure implementation](apps/api/src/stub/shift-preview.ts) and
[UI](apps/web/src/app/shift-preview.ts) preserve the read source, clear stale
results on editing, retain rejected drafts and reject saved/malformed/wrong-minute
responses. Managed/unknown sources stay unavailable.

Latest validation: **132 tests (74 backend + 58 frontend)**, lint, strict types/
templates and both builds passed. Initial bundle **428.07 kB**, under unchanged
500 kB warning. Browser checks passed plain/split/overnight calculations, explicit
segments, calendars, conflict/error/draft/focus, unavailable policy, narrow layouts
and 200% text resizing. No Oracle, business write or live partner action occurred.

### R08 Replacement Candidate and Eligibility Demo

The user approved a separate synthetic candidate/eligibility workflow. The
[replacement view](apps/web/src/app/replacement.ts) uses the same stub startup
commands after restarting the API:

```text
GET /api/v1/replacement-candidates?limit=100
POST /api/v1/replacement-eligibility-previews
Body: { "candidateId": "candidate-1" }
```

The fixed demo source is `91000001`, separate from the operational attendance
fixtures, and the scenario clock is frozen at `2026-10-13T08:00:00`.
Four candidates demonstrate:

| Candidate | Outcome |
| --- | --- |
| `candidate-1` | Suitable under the demo policy only—not approval. |
| `candidate-2` | Blocked by known synthetic job/attendance/rest facts. |
| `candidate-3` | Review/confirmation required; no confirmation action exists. |
| `candidate-4` | Unknown facts; cannot be labelled eligible. |

A foreign-team candidate stays hidden. Results always contain `previewOnly: true`,
`saved: false`, `accepted: false` and separate blocker/warning/unknown reasons.
Listing a candidate is not a verified eligibility result, and no acceptance,
save, repository cleanup or partner action is available.

Synthetic policy uses four resolved rest-gap facts (both sides for both
participants), minimum 660 minutes, maximum duration difference 120 minutes,
lead at least 120 minutes and matching sites for demo night starts (22:00-06:00).
These numbers/equality rules are demo settings, not observed production values.
Attendance/job/review/rest fixtures are not live neighboring schedules or actual
availability. A known blocker remains blocking even when another fact is unknown.

Latest validation: **143 tests (78 backend + 65 frontend)**, lint, strict types/
templates and both builds passed. Initial bundle **430.76 kB**, under unchanged
500 kB warning. Browser checks passed classifications, unsaved/unaccepted states,
unchanged list, keyboard/focus, injected error/retry, narrow layouts and 200%
text resizing. R08 staffing requests, real identity/data/policy and UAT remain pending.

### R08 Staffing Request and Candidate Read Demo

The user approved synthetic read-only reinforcement, time-change and reduction
views. The [staffing screen](apps/web/src/app/staffing.ts) uses the same demo
startup commands after restarting the API:

```text
GET /api/v1/staffing-requests?kind=all&limit=100
GET /api/v1/staffing-requests/{id}
GET /api/v1/staffing-requests/{id}/candidates?limit=100
```

Kind is `all`, `reinforcement`, `time-change` or `reduction`; default limit 25,
maximum 100. Five visible fixed-team requests include capacity remaining 2,
full capacity remaining 0, and unknown capacity null. Requested and approved
counts remain separate. Deadlines and freshness are explicit facts relative to
the frozen October 13 scenario clock, not the current operational time.

Fixtures: `93000001` available reinforcement; `93000002` full/stale/time-change
with elapsed deadline; `93000003` reduction with empty candidates; `93000004`
unknown reinforcement; `93000005` time-change with a stale candidate. Foreign
request/candidate data stays hidden. A displayed candidate is not eligibility,
registration, approval or assignment. No registration/assignment/approval/
cancellation or partner route/control exists.

Detail/candidate failure preserves valid context, filters survive failures and
superseded requests are cancelled. The client rejects inconsistent capacity,
unmarked data, wrong kinds/units or a different request's candidates. Notes are
plain text. No calendar is needed for these read-only deadline values.

Latest checks: **152 tests (80 backend + 72 frontend)**, lint, strict types/
templates and both builds passed; initial bundle **431.23 kB** under unchanged
500 kB warning. Browser checks covered types, counts/deadlines/stale candidates,
empty/unknown/error/retry, keyboard focus, responsive layouts and 200% resizing.
No Oracle, real identity, eligibility verification, writes or UAT was enabled.

### R08 Pure Staffing Eligibility and Capacity Preview

The user approved pure candidate calculations on the existing staffing screen.
Restart the stub API/web commands to load the added capability and route:

```text
POST /api/v1/staffing-requests/{id}/eligibility-previews
Body: { "candidateId": "staff-candidate-1" }
```

Every calculation is unsaved, unassigned and unapproved. A suitable-under-demo
result shows conditional one-slot capacity: requested unchanged, approved +1 and
remaining -1 **only if a future unavailable command were applied**. The current
request and candidate records never change. Blocked/unknown results have no
projected capacity; calculations do not reserve slots.

Synthetic checks require consistent exact counts, fresh request/candidate facts,
known deadline and at least 120 minutes lead relative to the frozen scenario
clock, compatible job/interval flags and no duplicate participation. These fixed
values and resolved flags are not real unit rules or live candidate eligibility.
Full, elapsed and duplicate cases block; stale/unknown data cannot qualify.

Six requests now include populated reduction `93000007` for preview, preserving
the earlier empty reduction `93000003`. Examples:
- `93000001` / `staff-candidate-1`: conditional remaining 2 → 1.
- `93000005` / `staff-candidate-1`: last-slot conditional remaining 1 → 0;
  actual remains 1. `staff-candidate-5` demonstrates duplicate participation.
- `93000007` / `staff-candidate-1`: reduction demo calculation, not cancellation.
- `93000002`: full/elapsed blocker; `93000004`: unknown capacity/context.

The UI retains read data on calculation failure, cancels stale work and verifies
scope, before snapshot, unsaved flags and exact one-slot output arithmetic.
No editable capacity/approval fields or assignment/save controls exist.

Latest checks: **163 tests (84 backend + 79 frontend)**, full lint/types/builds
passed; initial bundle remains **431.23 kB**. Browser checks passed suitable/
blocked/unknown/duplicate, hypothetical zero, unchanged counts, errors/focus,
narrow layouts and 200% resizing. Oracle, real matching/atomic capacity and
business acceptance remain pending.

### R09 Read-Only Exceptions and Time-Off

The user approved synthetic full-day/timed exceptions and time-off, with original,
changed/cancelled provenance. Restart the existing stub API/web commands:

```text
GET /api/v1/exceptions?from=2026-10-14&toExclusive=2026-10-18&limit=100
GET /api/v1/exceptions/{id}
GET /api/v1/employees/00000001/time-off?from=2026-10-14&toExclusive=2026-10-18
```

The [screen](apps/web/src/app/exceptions.ts) provides Hebrew calendars, full-day/
timed filters, optional cancelled history, employee time-off and read-only detail.
Five active demo records are visible; `includeCancelled=true` adds one cancelled
record. Kind is `all`, `full-day` or `timed`. Date interval is bounded to 31 days,
limit default 25/max 100; no cursor or scope override is available.

Full-day records carry a business date, not invented midnight timestamps or a
24-hour UTC duration. Timed intervals retain local start/end (end exclusive),
including overnight. Filtering uses business/start date, not arbitrary overlap.
Original and changed planning are distinct; redacted original data does not expose
a prior owner. Null reasons stay unknown and remarks render as plain text.
Cancelled history is explicitly non-active; it does not execute cancellation.

Employee `00000001` has two active time-off records and three with history;
`00000002` has a valid empty time-off list. Foreign-team employee/records are
hidden and indistinguishable from absent IDs. Category/day/type mappings are
synthetic—not verified Oracle metadata. There are no cancel, remark update,
publication, export-producer or partner controls.

Latest checks: **173 tests (87 backend + 86 frontend)**, lint, strict types/
templates and builds passed; initial bundle **431.70 kB**. Browser checks passed
full-day/timed/history/original/privacy/null/overnight, calendar/employee filters,
empty/error/date-retention/retry, focus, narrow layouts and 200% resizing.
R09 reporting, real Oracle/identity/metadata/parity and acceptance remain pending.

### R09 Bounded Staffing Versus Forecast Report

The approved [report screen](apps/web/src/app/reports.ts) uses the same stub
startup commands after restarting the API. See the
[execution record](docs/plan-shfAiAgentDevelopment.prompt.md#29-approved-r09-bounded-staffing-versus-forecast-report)
for source evidence and current limitations.

```text
GET /api/v1/reports/staffing-forecast?fromLocal=2026-10-14T08:00:00&toExclusiveLocal=2026-10-14T10:00:00&includeBreaks=true&includeExceptions=true
```

Choose two Hebrew calendar dates, local times and deduction flags. End is
exclusive; endpoints must align to quarter-hours and span 15–240 minutes.
Closed synthetic staffing coverage is October 14 00:00 through October 15
02:00, 2026; outside it returns an explicit source-unavailable error.

Planned and modified staffing use exact integer overlap minutes per employee.
Duplicate shifts and overlapping break/exception deductions are merged, not
counted twice; inactive modified shifts are excluded. Equivalent staff is
minutes / 15 rounded only for display, not totals or full-bucket headcount.
Missing demand stays null, distinct from zero. Comparison totals use known
forecast intervals only, while staffing totals cover the complete requested
window. No known demand means no comparison summary.

Default 08:00–10:00 shows seven minutes / 0.47 in the first modified interval,
225/187 available baseline/modified minutes and known-only gaps -15/-53.
Removing both deductions gives 240/202. Night 23:00–01:00 has 120 minutes;
18:00–19:00 has entirely unknown forecast. Version/read timestamp are explicit
synthetic provenance, not an Oracle snapshot. Portable wall-minute parsing is
shared with the API; no browser Node I/O or real UTC/DST duration is introduced.

Latest full checks: **185 tests (92 backend + 93 frontend)**, lint, strict
types/templates and builds passed; initial bundle **432.35 kB** below unchanged
500 kB warning. Focused report tests/lint passed again after stronger fixtures.
Synthetic browser checks passed metrics/flags/null-zero/overnight/coverage,
failure/date retention/retry, calendar/keyboard focus, 320/768/1280 reflow and
200% resizing. Temporary verification servers/proxy were removed.
No export, publication, batch producer, real forecast, activity weights, write
or Oracle call exists. R09 real parity, identity, manual accessibility/UAT and
release remain pending; R10 read-only scope needs separate approval.

### R05 Employee Skills, Events and Education Demo

The user approved the next R05 synthetic child views. Open a demo employee card,
then choose `מיומנויות`, `אירועים` or `השכלה`. Records are fetched on demand:

```text
GET /api/v1/employees/{id}/skills?limit=100
GET /api/v1/employees/{id}/events?limit=100
GET /api/v1/employees/{id}/education?limit=100
```

All three reuse the employee team's fixed demo scope, synthetic/no-store markers,
uniform foreign/missing 404, default limit 25/max 100 and explicit insufficient-
limit failure. No cursor, scope override or write endpoint is available.
The [demo record DTO](apps/api/src/stub/employee-contracts.ts) includes only
invented string ID/label, nullable detail and nullable local date.
Responses include `employeeId` and `section`; the client verifies both.

Employee `00000001` has populated examples, `00000002` has successful empty
sections, and `00000003` has unknown detail/date examples. Skills represent active
synthetic skill/language entries; events are invented attendance/employee-event
examples, with no correction, cancellation or registration action. Education
records are explicitly invented UI fixtures: the inspected legacy education page
is a skills/courses container, and its courses model is a placeholder. This does
not introduce a course/learning integration or claim a verified education source.

The [employee card](apps/web/src/app/employees.html) uses keyboard-operable
pressed-state section buttons, explicit loading/error/retry/empty states,
literal text rendering and cancellation of old section reads on selection, card
close or new employee search. There are no date-edit inputs in these read-only
sections; existing shift calendars are unchanged.

Latest checks: **62 backend + 34 frontend tests (96 total)**, full lint, strict
types/templates and both builds passed. The initial bundle remains **423.81 kB**
under the unchanged 500 kB warning budget. Browser checks through isolated local
stub/UI ports 3105/4205 passed all three sections, empty/unknown fixtures, safe
text, keyboard/focus restoration, 320/768/1280 page reflow, 200% resizing and an
injected 503 with retry while preserving the card. Temporary servers/proxy were
cleaned up. No Oracle, real personal records, identity, writes or partners were used.

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

### R05 Personal Messages Demo

The user approved a synthetic read-only messages increment. The existing local
API/UI commands also show the messages list/detail section, with three invented
messages and read/unread/unknown filters. Restart the stub API when upgrading
from the previous fixture version; no Oracle command is needed.

| Stub route | Contract |
| --- | --- |
| `GET /api/v1/me/messages?status=all&limit=100` | Scoped synthetic list, newest local creation time first; status is `all`, `unread`, `read` or `unknown`. Limit defaults to 25, maximum 100. Insufficient limit fails explicitly rather than silently truncating. |
| `GET /api/v1/me/messages/{id}` | Synthetic text-only detail; absent, foreign-recipient and deleted IDs return the same 404 problem. |

List/detail fields are defined in the
[demo DTO](apps/api/src/stub/message-contracts.ts): lossless string ID, local
creation time, subject/text, nullable note, nullable boolean read status and
nullable legacy message-type code. Recipient IDs and hidden message bodies are
not returned. These are approved demonstration contracts, not verified Oracle
metadata or authentication. The capability response exposes `personalMessages`
with demo reads enabled and writes disabled.

Legacy `MessageModel.getAllMessage` marks selected messages read. This demo
intentionally does **not** reproduce that mutation: neither listing nor opening
changes read state. Deletion, acceptance/rejection, notification and partner
actions remain unavailable. Angular renders message content as plain text, not
HTML; the synthetic HTML-like test message must appear literally.

Verification: **58 backend and 21 frontend tests (79 total)** passed, along with
full lint, strict types/templates and production builds. Browser checks used
isolated ports 3103/4203, covering three-message load, filtering, unchanged unread
status, safe text rendering, detail/close focus, 320/768/1280 reflow, 200% text
resizing and injected synthetic empty/failure/retry states. Temporary servers and
session proxy were cleaned up. No live database or real authorization was tested.

### Calendars and R05 Employee Search/Card Demo

Both shift date inputs now include visible Angular Material calendar buttons.
Calendar month/day and assistive labels are Hebrew/RTL; typed dates use the
documented `YYYY-MM-DD` format. Impossible/ambiguous dates are rejected.
The [calendar adapter](apps/web/src/app/calendar.ts) converts selected local date
components to ISO dates without using `toISOString()` on the selected value,
avoiding an off-by-one day across time zones. The existing inclusive end-date,
31-day maximum and half-open API range remain unchanged.

The user approved the next synthetic employee increment:

| Stub route | Contract |
| --- | --- |
| `GET /api/v1/employees?search=Demo%20ABC&limit=100` | Bounded name/internal-ID substring search within fixed synthetic team A. Search maximum 80 characters; limit defaults to 25, maximum 100. |
| `GET /api/v1/employees/00000003` | Minimal synthetic card; foreign-team and absent IDs return the same 404 problem. |

The [employee DTO](apps/api/src/stub/employee-contracts.ts) exposes only exact
string `id`, invented `displayName`, synthetic `orgUnit` ID/name and nullable
`jobName`. No identity numbers, phones, addresses or real personal records are
included. The [screen](apps/web/src/app/employees.ts) shows three scoped fixtures,
handles long mixed-direction names, preserves search on failure and manages card
focus. Writes, skill/event/course/taxi integrations and real identity remain
unavailable. This is a demo team scope, not proof of organizational authorization.

Shift/calendar and employee features are loaded with Angular immediate deferred
blocks after shell render, with explicit loading/error feedback. Adding calendar
code initially exceeded the 500 kB initial-bundle warning; budgets were not raised.
The measured initial production bundle is now **423.81 kB**, below that threshold.
This is build evidence, not a production latency or capacity measurement.

Checks: **60 backend + 31 frontend tests (91 total)**, lint, strict types/templates
and both builds passed. Calendar-only tests also passed under `Pacific/Auckland`
and `America/Los_Angeles`. Browser checks covered actual calendar day selection,
inclusive filtering, Hebrew navigation, keyboard open/Escape/focus return and a
296px RTL calendar on a 320px viewport. Employee keyboard search/card, leading
zeros, null jobs, empty/failure/retry, long-name reflow and 200% text resizing
passed against the isolated local stub. No Oracle or real business checks were run.

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