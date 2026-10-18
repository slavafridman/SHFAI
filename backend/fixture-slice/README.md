# SHF-RW-03 / SHF-RW-04 / SHF-IMPL-API-01: read-only backend

Implements approved section 13 v0.1 of `docs/SHF_REVERSE_ENGINEERING_DESIGN.md`;
section 15 records detail approval and section 17 approves the local tooling.
Section 19 v0.1 / 22.3 approve the list; section 22.4 approves bounded Oracle test
reads with driver 26.0.0 Thick and the existing Client 19.3. No EMS, business writes,
real authentication, runtime framework, schema changes or production deployment.
All checked-in identities/rows are synthetic; live checks output aggregates only.

Observed execution environment: Node 24.21.0, npm 11.19.0 on Windows.
The package requires Node 24. Native `.mts` stripping executes erasable TypeScript;
**it does not type-check**. Development-only tooling is pinned to TypeScript 5.9.3,
`@types/node` 24.19.2 and `undici-types` 7.24.6 (also overridden to that exact version).
The backend-local lockfile records registry URLs and SHA-512 integrity values.
No root workspace or emitted build is needed.
Oracle runtime dependency: exact `oracledb` 26.0.0; necessary development types:
exact `@types/oracledb` 7.0.3 (no bundled driver declarations). The used API subset
compiles strictly and was executed with the approved installed full client.

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
`npm test` invokes four original regression, two current-list and one Oracle-double file:

```powershell
node --test test/projection.test.mts test/contract.test.mts test/use-case.test.mts test/http.test.mts test/current-shifts.test.mts test/current-http.test.mts test/oracle.test.mts
```

SHF-RW-04 verification: strict typecheck passed and all 34 runtime tests passed.
The type-only provider binding repair preserves fail-closed startup; HTTP test
JSON values are narrowed with actual object/string assertions, not unchecked casts.
Checks are static or synthetic/loopback only; they do not verify live infrastructure.

HTTP tests bind `127.0.0.1` on ephemeral ports and close all listeners/connections.
They exercise the actual five-second request budget. Routes are:

- `GET /api/v1/identity`
- `GET /api/v1/employees/{employeeId}/shift-days/{shiftDayId}`
- `GET /api/v1/current-shifts/filter-context` (explicit current fixture required)
- `GET /api/v1/current-shifts` (explicit current fixture required)

Identity/detail prohibit query/body input; context prohibits query/body and list
accepts only section 19 query keys, with no body. All send `Cache-Control: no-store`.
Identity is not an authorization token; every request authenticates independently.
Administrator has exactly `["shift-day:read", "current-shifts:read"]`, no employee identity, and cannot
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
This is **not** an Oracle hard-cancellation/SLA, UI or deployment verification.
Explicitly authorized live acceptance results are recorded separately below.

## SHF-IMPL-API-01 — section 19 v0.1 / identity seam v0.2

Approval is recorded in section 22.3 (15 October 2026, 14:55 +03:00).
Canonical `contracts.mts` and `current-shifts-contracts.mts` remain architect-owned
and were not edited by this implementation. Detail DTO/GET/error contract is unchanged.

The application validates modes, permissions, catalog membership and configured-zone
clock; the immutable relational fixture reader handles exact J01 scope plus G01
parent filtering, effective employee prefix join, independent non-null overlays,
day type 4/cancellation-null, inclusive start/exclusive end, attendance priority,
catalog projection, ambiguity and stable numeric-ID ordering. There are no command,
procedure, autonomous-function, sequence, messaging, retry or cache paths.

Additional explicit environment variable:

- `SHF_CURRENT_SHIFTS_FIXTURE`: JSON `CurrentFixtureData` from
  `current-shifts-fixture.mts`, containing `catalog`, `employees`, `days`,
  `attendance`, `activities`, `innerJobs`, `missingReasons`. Empty arrays are
  explicit values, not missing dependencies. Every synthetic grant must resolve
  to a J01 team with a direct G01 parent. At most 100 parents/grants; source arrays
  are bounded at 25000 and catalog/source fields are runtime checked.

Omission disables **only** the two new GETs (503 `DEPENDENCY_UNAVAILABLE`);
explicit malformed fixture/hierarchy fails startup. This is not Oracle fallback.
Current fixture mode is rejected for production.

Transport limits: 8 KiB request target; existing 5-second end-to-end budget;
16 KiB identity/detail response budget unchanged; current context/list response
budget 2 MiB UTF-8. Oversize success serialization yields sanitized 500
`INTERNAL_ERROR`, never truncation or a partial page. A normal 100-row page is
tested. Extreme valid field combinations can exceed the budget; reduce page size.
Abort checkpoints after catalog/read suppress late success and prevent follow-on
reads; already-started port promises cannot be forcibly cancelled by these contracts.

Context defaults sample one server instant, preserve `minute > 10` hour advance
and `:00`, including named-zone rollover/DST (`Calendar.add` hour semantics).
Current-mode samples once and truncates seconds. At-mode is pure civil filtering,
including DST gap/overlap. Pagination defaults 25/0, maxima 100/10000; lookahead,
stable effective-start/day-ID/employee-ID order, no total count or cross-request
snapshot. Current page 2 must use at-mode with the returned applied minute.

### Exact local sample handoff to UI

`current-shifts-sample.mts` exports **only synthetic opt-in data**:
`sampleConfig`, `sampleCurrentFixture`, `sampleDetailRows`. No browser fixture or
frontend file was edited. From this backend directory in PowerShell:

```powershell
$sampleJson = @'
import {sampleConfig,sampleCurrentFixture,sampleDetailRows} from "./current-shifts-sample.mts";
console.log(JSON.stringify({config:sampleConfig,current:sampleCurrentFixture,rows:sampleDetailRows}));
'@ | node --input-type=module
$sample = $sampleJson | ConvertFrom-Json
$env:SHF_FIXTURE_CONFIG = ConvertTo-Json -InputObject $sample.config -Depth 20 -Compress
$env:SHF_FIXTURE_ROWS = ConvertTo-Json -InputObject @($sample.rows) -Depth 20 -Compress
$env:SHF_CURRENT_SHIFTS_FIXTURE = ConvertTo-Json -InputObject $sample.current -Depth 20 -Compress
$env:SHF_FIXTURE_PORT = '3000'
npm start
```

Use the frontend's established local proxy; no CORS/server bind expansion is added.
Manual search: `GET /api/v1/current-shifts?mode=at&attendanceDate=2024-03-01&currentTime=00:00`.
Parent `01` is optional; employee team is `T01`, not `01`. Row link:
`/api/v1/employees/9007199254740993/shift-days/1`, with unchanged detail DTO.
The sample is deliberately dated: current-mode uses today's server instant and
will normally be empty, never rebases sample dates or claims real Oracle records.
Stop the explicitly started server with Ctrl+C.

### Verification boundary

Focused native tests characterize backend NEXT01-01..11, backend deadline/abort
part of NEXT01-12 and row/detail identity part of NEXT01-13. Browser stale-result
generation, filter reset/back navigation, loading/focus/RTL/accessibility and
NEXT01-14 belong to UI/QA; no browser/a11y pass is claimed here.
Legacy evidence: `ShiftDataModel.java` defaults 277–312 and current SQL 987–1044;
`AgentDayBean.java` mappings and section 19 source chain; all read only, not executed.
The source contract catalog was unavailable; section 19 served as locator.

## Stage 2 — approved bounded Oracle read-only adapter (§22.4)

Source is explicit and coherent across all GETs, never automatic fallback:

| Mode | identity/detail marker | context/list marker |
|---|---|---|
| fixture | `isolated-fixture` | `isolated-fixture` |
| approved Oracle test | `oracle` | `oracle-read-only` |

`contracts.mts` retains its original identity/detail union and fixture startup
type. Internal `runtime-config.mts` realizes the separately approved Oracle
configuration, without editing canonical contracts. Source-bound Oracle readers
are required together; mixing them with fixtures is rejected. Outside explicitly
enabled isolated synthetic identity, `createRuntime` still requires an installed
real provider, or fails; this executable intentionally supplies no real provider.

### Oracle operator configuration / UI handoff

Use **`SHF_ORACLE_CONFIG`**, not `SHF_FIXTURE_CONFIG`, for a JSON object with:

```json
{
  "deploymentClass": "isolated-test-demo",
  "authenticationMode": "synthetic",
  "syntheticAdministratorEnabled": true,
  "syntheticOrgUnitIds": ["<operator-approved-exact-J01-code>"],
  "dataSource": "oracle-read-only",
  "oracleTestScopeConfirmed": true,
  "businessTimeZone": "<explicit-approved-IANA-zone>"
}
```

The placeholders must be replaced by the operator's approved test scope/zone;
they are not usable fixture grants or evidence of the real business policy.
The bounded live check used one actual J01 team **in memory only**, and explicit
test interpretation `Asia/Jerusalem`; no employee/team IDs or business records
are copied into this README. Mock Administrator grants application capabilities,
not infrastructure permission. The independent test-scope flag is mandatory.

Required environment-only infrastructure settings (inject using the approved
local secret mechanism, never command arguments, source/brief parsing, fixtures
or committed files):

- `SHF_ORACLE_CONNECT_STRING`: approved configured TNS test alias
  `CTIDBT_WFMT.world` (only that test alias, with optional `.world`, is allowed).
- `SHF_ORACLE_USER`, `SHF_ORACLE_PASSWORD`: authorized test read credentials.
- `SHF_ORACLE_CLIENT_LIB_DIR`: directory of the **existing** `oci.dll` 19.3 x64.
  `(Split-Path (Get-Command sqlplus.exe).Source)` locates the reused installation;
  no OS PATH/TNS/client installation is changed.
- `SHF_ORACLE_PORT`: explicit decimal loopback port 0–65535.

Remove fixture configuration/row variables when choosing Oracle; supplying both
configuration sources or any fixture rows in Oracle mode is rejected. Missing
secrets, incompatible client, failed connection/catalog/provider or production
mock mode fails explicitly before listening. `npm start` / `node server.mts` uses
the selected configuration and binds loopback only. Stop with Ctrl+C; the owned
pool is closed by `stopBackendServer`. Do not start a live browser session merely
because mocked identity is available; operator-controlled live use is separate.

The frontend API URLs and query/DTO fields do not change. Existing local proxy
setup applies; source guards must accept the Oracle marker pair above. Real
current-mode can honestly return an empty 200 even when historical at-mode has
rows. This task did not edit frontend fixtures or run browser/Oracle screenshots.

### Persistence/transaction safeguards

- `OracleReadSession`: pool max 4, queue max 20, queue timeout 2s, per-call timeout
  bounded by the remaining 5s request budget. Async request context propagates
  deadline/abort to the native session without altering canonical port signatures.
- One leased connection and `SET TRANSACTION READ ONLY` snapshot for each related
  catalog/ambiguity/window/label operation. `autoCommit:false`; rollback and release
  attempted on every exit. Native break is awaited before releasing a busy lease;
  late acquisition is cleaned up before any query starts. No commit, DML, DDL,
  PL/SQL, custom SHF function, sequence, locking query, retry/cache or broker path.
- Gregorian session required. SQL selects precision-safe decimal ID text using
  `TO_CHAR(...,'TM9', explicit NLS numeric characters)` and AD civil DATE text with
  full seconds. IDs and source DATEs never pass through JS Number/Date. Source
  validation rejects invalid IDs, dates, multiplicity, hierarchy or overbounds.
- List SQL pushes exact team AND optional parent scope, effective interval,
  day-type 4 and cancellation-null. Disjoint null/non-null changed-employee
  branches preserve NVL semantics/cardinality, including `e_old`, while exposing
  existing source-observed employee-number/prefix indexes. No new index or hint.
- Bounded duplicate-day existence probe **before** pagination, same snapshot,
  including empty pages. Oracle 11 `ROW_NUMBER()` stable numeric ordering;
  window at most limit+1 (101), detail at most two. No total count or readAll.
- Only needed list columns are selected. Catalog options are scope-bound, max
  100 + overflow sentinel; page labels are looked up only for requested codes,
  in <=1000-code chunks with <=1001-row result cap and duplicate validation.
  Shared pure projection is used by fixture and Oracle readers.

Network connection establishment uses the existing native client's TNS/network
settings, which were not modified. Queue/call/HTTP budgets and late lease cleanup
are enforced, but hard cancellation of pending native establishment and a five-
second SLA for every possible live selection are **not proven**. Native break/
cleanup failure and first-query timeout are explicit errors, never fixture success.

### Exact checks and outcomes

From `backend/fixture-slice`:

- `node --test test/current-shifts.test.mts`: initial focused function repaired
  native strip-only parameter-property syntax, then passed; expanded suite passes.
- `node --test test/current-shifts.test.mts test/current-http.test.mts`:
  original harness failures (unknown JSON narrowing / ECONNRESET close wait) were
  repaired; final behavior included in full regression.
- `node --test test/oracle.test.mts`: **11/11** isolated infrastructure checks,
  including SQL bounds/scope, same-snapshot ambiguity, cleanup, acquisition/abort,
  source coherence, sanitized errors and no fallback.
- `npm run typecheck`: PASS, strict noEmit includes every new source/test/live-check.
- `npm test`: **71/71** = original 34 + 26 current-list + 11 Oracle-double tests.
- `npm ls --depth=0`: pinned Node/TypeScript baseline retained; driver 26.0.0 and
  Oracle types 7.0.3 installed, no framework/native-client/system installation.

**Authorized actual checks, separate from `npm test`:**

- Inline native Node stdin smoke: explicit existing `initOracleClient(libDir)`,
  `SET TRANSACTION READ ONLY`, SELECT 1, rollback/close — PASS. Actual driver
  26.0.0 Thick, Client 19.3.0.0.0, DB 11.2.0.4.0. Catalog metadata read returned
  22 bounded column records and Gregorian calendar; prior readiness established
  database charset IW8ISO8859P8 / national AL16UTF16.
- `node --input-type=module` stdin harness invoking
  `runOracleLiveCheck(environment)` from `oracle-live-check.mts`: PASS. The
  one-off authorized harness loaded the already approved reference in memory;
  **application/checker code never parses the brief**. No secret file/argument or
  business-record output was created.
- Final exact CLI `node oracle-live-check.mts` with the authorized reference
  injected into a disposable process environment by the external one-off
  harness: same PASS, including real environment bootstrap and shutdown.
- Result: NUMBER >2^53 text, Gregorian leap-date/full seconds and synthetic Hebrew
  VARCHAR bind roundtrip PASS; one bounded candidate; context options **1**,
  at-list (limit 2) **2**, current-list (limit 1) **0**, offset 10000 **0**;
  detail shape/source PASS; **4** actual loopback API GETs PASS; actual environment
  bootstrap/identity/owned pool shutdown PASS. All own ephemeral servers closed.
- Before repair, a global candidate query caused NJS-500/connection loss, and a
  list exceeded the 5s budget. Candidate discovery was changed to ten bounded
  primary-key candidates; employee join SQL was split into source-equivalent
  branches. Subsequent actual checks passed; no runtime retry/fallback was added.

To repeat the live check only with explicitly authorized, injected environment:
set `SHF_ORACLE_TEST_SCOPE_CONFIRMED=true` in addition to the infrastructure keys,
then `node oracle-live-check.mts`. It emits counts/booleans only, verifies actual
environment startup and closes its resources. It does not connect during `npm test`.

Not run here: real provider, production/deployment, legacy execution, writes,
autonomous-function/EMS/batch checks, hostile-network hard-cancellation probe,
browser/RTL/accessibility verification. UI/QA owners retain NEXT01-12 browser
generation/state and NEXT01-14; caller-reported frontend results are not claimed
as this backend task's checks.

## SHF-SEARCH-API-18 — approved search v0.1

Implemented against approved design §§23/24 v0.1, approval §25, and the
architect-owned `shift-search-contracts.mts`. Canonical contracts were not edited.
The two independent read-only GETs are:

- `/api/v1/shift-search/filter-context` (no query or body).
- `/api/v1/shift-search?attendanceDate=2026-10-15&timeFrom=10:00&timeTo=10:00`
  with optional `mokedCode`, comma-delimited `teamCodes`, `innerJobCodes`,
  `workLocations=home,site`, `limit`, `offset`, `sort=effective-start-asc`.
  Each key occurs once; no GET bodies, unknown keys, empty lists, sentinels,
  implicit conversions or repeated keys. Dates are Gregorian YYYY-MM-DD,
  minutes HH:mm; equal start bounds are valid. Upper bound is exactly `:00`,
  not the entire final minute. Defaults are limit 25 / offset 0.

Authentication precedes grammar, then centralized independent
`shift-search:read`, scoped catalogs/filter policy and reading/projection.
Synthetic Administrator now has exactly
`["shift-day:read","current-shifts:read","shift-search:read"]`, employeeId null.
Production rejection and the real-provider replacement seam are unchanged;
no authentication/configuration error grants Administrator or switches sources.
Search alone does not grant current/detail access or infrastructure authority.

`ReadShiftSearch` reuses the configured-zone clock/default rounding, exact
principal validation, policy, row/catalog validators, numeric ordering and
five-second request-budget/abort context. Both endpoints return no-store JSON
or sanitized problem JSON, including `AMBIGUOUS_SHIFT_SEARCH` before pagination
even for empty pages. Catalog/row output is allowlisted, not serialized source
objects. Empty results remain 200. Unknown source/provider exceptions never
expose raw Oracle details or business values.

### Controlling source and retained differences from current

Read-only source evidence: `old/SHF/src/bzq/shf/model/ShiftDataModel.java`
329–450, 475–654 (active `populateShiftList`, not ORIGINAL FUNCTION);
`old/SHF/src/bzq/shf/bean/AgentDayBean.java` field mappings/effective getters;
`old/SHF/src/bzq/shf/utils/ComplexCodeTable.java` role/exception catalogs;
the SQL/control/permission trace in §§23.1–23.6.

Search readers implement baseline without **any** day change UNION ALL changed
rows. Changed membership needs its own employee/type 4/start and null
cancellation; missing reason must be NULL (0 excludes), absent attendance can
qualify. No employee-active, overlap, same-day-end, activity or status filter.
Raw baseline versus changed home drives location filtering: omitted includes
NULL, both selected excludes NULL, effective display may still fall back.
`e_old` uses the changed employee in the changed branch. Employee, old employee,
attendance, cancel-login and change multiplicity are preserved, not deduplicated.
Scope/optional parent/role/location predicates precede ambiguity and windowing.

Effective display preserves original seconds/local dates/decimal strings.
The seven flags retain remark/applier presence (not cancellation), asymmetric
same-reference location change, nonnull time change, effective split, lowercase
source prefix `f`, reassignment and home-only extension presence. No remark
bodies, applier/updater values, extension values or personal references leave
projection. Fallback is baseline positive exception only if effective activity
has no nonempty raw tokens; unknown activity labels do not trigger fallback.

### Explicit fixture handoff (backend-owned only)

`shift-search-sample.mts` exports:

- `sampleConfig` (existing isolated source/zone/exact T01 grant).
- `sampleSearchFixture` (synthetic employee **1001**, day **3001**, 15 October
  2026 10:00:00–18:00:37; separate from the existing current sample).
- `sampleSearchDetailRows` for the existing effective-detail endpoint.

To start an isolated executable, explicitly supply:

- `SHF_FIXTURE_CONFIG=JSON.stringify(sampleConfig)`, `SHF_FIXTURE_PORT`.
- `SHF_FIXTURE_ROWS=JSON.stringify(sampleSearchDetailRows)`; combine with existing
  sample detail rows if both sample workflows are needed.
- `SHF_CURRENT_SHIFTS_FIXTURE=JSON.stringify(sampleCurrentFixture)` (existing
  shared catalog/current fixture).
- `SHF_SHIFT_SEARCH_FIXTURE=JSON.stringify(sampleSearchFixture)`.

All values above are operator-provided environment values, not automatic
defaults. Search fixture requires the explicit shared current configuration.
No search fixture means search returns dependency unavailable, never current
data or silently fabricated search results. No frontend file was changed;
the frontend owner controls any extension of its separate fixture loader.

`SearchFixtureReader` is an isolated relational double. `SearchFixtureData`
reuses the current catalog/employees/attendance, adds explicit `hasChange`
(including all-null changes), source markers, scoped active roles, exception
labels and cancel-login multiplicity. Multiple change rows may share a day ID.
Fixture methods clone/allowlist output and never mutate supplied data.

### Oracle and native verification

`OracleSearchReader` implements the canonical port with bound predicates,
Oracle-11-compatible ROW_NUMBER window, full-scope ambiguity probe, <=limit+1
(<=101) page rows, <=100 parents / <=1000 teams / <=1000 selectable roles.
Overflow/duplicate/malformed catalogs fail; page-code labels are separately
bounded, may resolve inactive entries, and unresolved labels stay null.
No full-schema/catalog/business-data preload or arbitrary DISTINCT/first row.
Each related catalog or page operation uses one explicit read-only transaction,
Gregorian-session guard, rollback and release. Cancellation breaks the active
native call; break/rollback failure discards the unsafe lease. No DML, DDL,
PL/SQL, custom functions/procedures, commits, locks, retries or EMS.
Underlying Oracle scan cost/query plans and cross-request snapshots are not
claimed; concurrent legacy writers may change page membership.

No new runtime/dependency installation: Node **24.21.0**, TypeScript **5.9.3**,
node-oracledb **26.0.0**, installed Thick Client **19.3**, existing Oracle 11.2.
Environment-only Oracle keys remain `SHF_ORACLE_CONFIG`, `SHF_ORACLE_PORT`,
`SHF_ORACLE_CONNECT_STRING`, `SHF_ORACLE_USER`, `SHF_ORACLE_PASSWORD`,
`SHF_ORACLE_CLIENT_LIB_DIR`. The typed config explicitly selects
`dataSource:"oracle-read-only"`, isolated deployment, exact grants, zone and
`oracleTestScopeConfirmed:true`. Oracle startup always constructs coherent
detail/current/search readers and prohibits fixture inputs; no Oracle failure
falls back to fixtures. Identity/detail retain source `oracle`; search/context
use `oracle-read-only`.

Executed on 18 October 2026:

- First coherent focused check:
  `node --test test/shift-search.test.mts`: **1/1 PASS**.
- Expanded focused:
  `node --test test/shift-search.test.mts test/search-http.test.mts test/oracle-search.test.mts`:
  **22/22 PASS**, subsequently extended by two characterization tests.
- Repair check:
  `node --test test/shift-search.test.mts test/current-http.test.mts`: **PASS**.
- `npm run typecheck`: **PASS**, strict no-emit/erasable TypeScript.
- `npm test` and `npm test -- --test-reporter=dot`: **95/95 PASS**, 71 existing +
  24 new. Native Node uses the established package file list; the latter
  invocation emitted the normal per-test reporter, not dots. No live connection
  in `npm test`. Unknown/inactive/nonselectable roles use 400 with
  `innerJobCodes/invalid-format` (not scope-enumeration 403).
- Authorized actual `node oracle-search-live-check.mts`: **PASS**. The external
  disposable operator harness injected the approved reference into process
  environment only; application/checker code never reads the brief. NUMBER
  >2^53, Gregorian leap date/full seconds and synthetic Hebrew mapping PASS.
  **10** candidate keys, **1** candidate, scoped catalog **1 parent / 1 team /
  0 selectable roles**, search limit 2 **2 rows**, selected result/detail
  ID/start/end coherence PASS, source coherence PASS, **4** HTTP GETs PASS,
  explicit environment bootstrap/search/shutdown PASS. Only counts/flags output.
- Existing actual `node oracle-live-check.mts`: **PASS** after search changes;
  **1** candidate, **1** parent, at-list **2**, current **0**, ceiling **0**,
  **4** HTTP GETs and environment bootstrap PASS.

Initial checks exposed unsupported TS parameter properties, test type-narrowing
errors and two stale two-capability expectations. These were repaired and
rerun; final checks above pass. Mock Oracle tests cover SQL/binds/read-only
lifecycle/failure/abort/discard, not query-plan or hostile-network guarantees.
All owned listeners and pools were closed by finally paths.

Not run: real authentication provider, production/deployment, business writes,
legacy execution, EMS/batch, browser/RTL/accessibility checks, full catalog/data
coverage, Oracle load plans and forced live network/cancellation failures.
Remaining UI/browser verification belongs to frontend/QA; no implementation
blocker or unresolved contract change was found. Ready for caller review.
