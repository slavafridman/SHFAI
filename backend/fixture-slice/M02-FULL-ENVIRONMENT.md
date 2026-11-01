# M02 populated isolated environment

Task `SHF-M02-2026-11-01`; operational baseline **§53-v0.1**, accepted in the
caller request under USER full-test-environment / approved remainder. Existing
R7, management-v0.1, C52-v0.2 and §52-config-v0.1 shapes/grant order are unchanged.
This is synthetic application/HTTP verification, **not legacy parity, Oracle
readiness, real authentication, physical metadata certification or EMS completion**.

## Source and entrypoints

- `populated-world.mts`: pure JSON-compatible dataset constructors, catalog,
  before-images, inquiry-only C52 metadata, frozen clock and exact inquiry paths.
- `populated-readers.mts`: typed management/C52 snapshot normalization and all
  seven existing relational `Fixture*Reader` classes. No SQL double or HTTP stub.
- `populated-config.mts`: bounded explicit configuration/CLI whitelist.
- `populated-server.mts`: `startFullTestEnvironment(mode, options)`,
  asynchronous `createFullTestWorld(mode, scenario?)`, and
  `checkFullTestReadiness(started, expectedMode, callerSignal?)`. The internal
  readiness input requires only the existing `mode` and `url`. Import does not
  start a server.
- `server.mts` reexports these functions so the existing literal
  `Get-ShifterClosure` includes the four top-level modules. Names intentionally
  avoid `test` (the current packaging closure rejects that substring).
- `oracle-session.mts`: only the driver loading seam changed: `import("oracledb")`
  is inside `createOraclePool`, before its unchanged client/pool configuration.
  Shared helper imports no longer eagerly load a driver. Native Clock,
  transactions, client constraints and pool options are unchanged.

No new dependencies, runtime assets, test-directory runtime imports, schema,
API routes, public contract edits or Docker changes. Synthetic before-images
are JSON-compatible **in module constructors**, not separately loaded JSON
files; the current closure forbids new runtime file assets. JSON roundtrip,
Hebrew, string IDs/minutes and whole civil seconds have focused assertions.

```ts
import { startFullTestEnvironment, checkFullTestReadiness } from "./server.mts";
const started = await startFullTestEnvironment("READONLY", {
  profile: "test",
  deploymentClass: "isolated-test-demo",
  syntheticAdministratorEnabled: true,
  port: 0, // or an explicitly selected 1..65535; binds only 127.0.0.1
  origins: ["http://localhost:4200"], // exact caller-selected loopback origins
  environment: {}, // explicitly supplied, never process ENV fallback
});
await checkFullTestReadiness(started, "READONLY"); // identity + 11 actual GETs
// Caller owns server lifetime; stopBackendServer(started.server) drains it.
```

Three independent worlds:

| Mode | Capabilities | Source and selected data |
|---|---|---|
| `READONLY` | existing ordered R7 only | employee1, days19001/19002; two items19001 |
| `management` | existing ordered management14 only | same inquiry facts plus simple target19003 |
| `cancellation` | existing ordered R7 + C52 prepare/commit only | fixed9001/6201; items truthfully empty |

No default: absent, `NONE`, unknown or combined modes reject. Stage/F2/late/native
exit and other writer families are unavailable. The management test-oracle-write
**capability literal** remains in its existing family; it does not authorize a
driver, pool, native application or partner. Authentication failures do not
return Administrator. Mock privileges do not bypass business validation.

## CLI environment — names and admitted values only

Command from `backend/fixture-slice`: **`node populated-server.mts`** with a
caller-owned clean child environment. A normal inherited host shell environment
is intentionally not accepted. DevOps owns the later internal Node/Docker launch.

| Key | Allowed values |
|---|---|
| `SHF_FULL_MODE` | `READONLY`, `management`, `cancellation` |
| `SHF_FULL_PROFILE` | `test` |
| `SHF_FULL_DEPLOYMENT_CLASS` | `isolated-test-demo` |
| `SHF_FULL_SYNTHETIC_ADMINISTRATOR` | `true` |
| `SHF_FULL_PORT` | canonical decimal `0`..`65535` |
| `SHF_FULL_ORIGINS` | JSON array of bounded, unique canonical loopback HTTP(S) origins |
| `NODE_ENV` | absent, `development`, `test` |

Windows Node's `spawn(...,{env:{}})` itself inserts these OS keys:
`HOMEDRIVE`, `HOMEPATH`, `LOGONSERVER`, `PATH`, `SYSTEMDRIVE`, `SYSTEMROOT`,
`TEMP`, `USERDOMAIN`, `USERNAME`, `USERPROFILE`, `WINDIR`.
CLI ingress admits these names on Windows only, **never reads/logs their values
or forwards them to fixture configuration**. This bounded platform exception
was required by an actual clean-child failure and retest; it is not a private
operator/credential loader. The programmatic environment remains the strict
seven-key configuration whitelist.

Other keys reject before source fixtures/provider/server construction:
Oracle/native/write/coordinator/partner/credential inputs, arbitrary historical
fixture loaders, `NODE_OPTIONS`, and unknown keys. Production/profile/config
conflicts also reject. No `.env`, files, private operator state, credential
provider, endpoint resolver, DNS or pool factory is consulted.

CLI prints only synthetic mode, actual bound port, fixed clock/zone, and
11 successful inquiry probes; failure prints a constant diagnostic. No fixture
or identity/credential contents are logged.

## Dataset / precise synthetic inquiry examples

Common catalog: M001/G01, T001/J01; only T001 is granted. T002 is an ungranted
sibling, T003 under M002 also ungranted. Job11/innerJob101, activity1,
start/end reason1, cancel reasonC1 are synthetic catalogs; activity2 has null label.
Private synthetic employee number001234567 joins by00123456; it is not identity
selection or real personal data.

Epoch **2026-11-01T12:00:00.123Z, UTC, frozen-demo**. It does not tick, silently
rebase dates, reset tokens, or change native systemClock. Explicit test-only C52
`advanceClock` tests expiry. This frozen launcher follows the caller's explicit
clock instruction rather than §53's proposed ticking launcher.

19001: Nov1 11:00→18:00, type4, activity1, site7001/homeN; stage11:00:01,
station11:01:00, exitnull, missingnull, briefing1. Break11:20→11:35/minutes15;
exception12:20→12:25/minutes5/type1; remarks are plain synthetic Hebrew text.
19002: Nov2 23:00→Nov3 01:00, no attendance/items. Management19003:
Nov4 09:00→10:00, no dependencies. Attendance on19001 blocks its management
commands without globally blocking the simple target/create.

Use Q:

`attendanceDate=2026-11-01&timeFrom=11:00&timeTo=11:00&teamCodes=T001&innerJobCodes=101&workLocations=site`

Seven GETs (Q means substitution, not a literal query key):

1. `/api/v1/current-shifts?mode=at&attendanceDate=2026-11-01&currentTime=12:00`
2. `/api/v1/shift-search?Q`
3. `/api/v1/my-shifts?mode=selected&employeeId=1&dateFrom=2026-11-01&dateTo=2026-11-07`
4. `/api/v1/employees/1/shift-days/19001`
5. `/api/v1/employees/1/shift-days/19001/breaks-and-exceptions`
6. `/api/v1/employees/1/operational-card`
7. `/api/v1/attendance?Q`

Readiness also checks current/search/attendance `/filter-context` and
`/api/v1/my-shifts/context?mode=selected&employeeId=1`.
Current's catalog legitimately publishes scoped parentM001, not teamT001.
Readiness verifies actual selected IDs, source, scope, headers and mode; missing
ports fail despite healthy identity. It is a fresh-world probe, not a new
`/readyz` route or a promise that a consumed writer remains eligible.

Readiness has **one finite 1,000 ms total AbortSignal deadline per invocation**,
shared by identity plus all 11 sequential inquiry fetches and their JSON/text
body reads. Delayed earlier responses consume this same budget; no per-request
reset or `Promise.race` leaves requests active. The optional internal caller
signal is combined with that deadline, so it can only shorten/cancel it.
Timeout/caller abort rejects without a success-shaped fallback or error
translation; the existing Docker `fullReady` catch reports false. The 1,000 ms
budget fits the existing 1,500 ms readiness / 2 s Docker healthcheck limits,
subject to event-loop scheduling. Readiness results, identity/capability order,
frozen fixture/native clocks and business validation are unchanged.
Owned loopback tests delay identity and one valid inquiry before stalling
headers (default 1,000 ms) or an unfinished body (100 ms injected signal).
They verify timeout rejection, caller reason propagation, cancellation of the
pending HTTP request and zero sockets/active requests after owned cleanup.
These tests do not issue fixture commands or access Oracle.

C52 keeps its existing9001/6201/999999991 identifiers and fixed manifest version,
not translated management IDs. Planned11:00→12:01, station11:00,
exit11:59:50, original synthetic legacy user. Physical activity is null
(`WM_SCH_ACTIVITY_ID_DATA`), site7001; explicitly ID-bound inquiry-only job,
innerJob, home and remark facts are null. **Do not use management's innerJob/home
filters to force rows into this world.** Its search/attendance Q is:

`attendanceDate=2026-11-01&timeFrom=11:00&timeTo=11:00&teamCodes=T001`

Replace selected employee/day paths with9001/6201. All seven ports are available;
C52 items is an honest200 empty collection. `fullInquiryPaths(mode)` returns
exact runnable paths including the four contexts.

Management tests create Nov5, change19003's end to10:30, cancel19003, CSV-create
Nov6/Nov7. For unchanged start the **startReasonCode must be null**; end reason1.
This corrects the synthetic example, not the strict business rule.
Committed state installs atomically in the existing management fixture;
every inquiry rebuilds from `inspect().snapshot`. Cancel transfers ownership to
the existing sentinel: selected detail/items404; list inquiries omit it;
management's cancellation context remains `already-cancelled`.
Rollback preserves the snapshot with legitimate sequence gaps.

C52 sends one explicitly two-consent command; only exit/time-user are cleared.
Detail and attendance immediately reflect that store. Receipt is `simulated`,
both ACK timestampsnull, partner `not-invoked`. No replay/consumption/expiry reset.

## Verification / limitations

Focused M02 command:

`node --import ./test/populated-driver-tripwire.mts --test test/populated-environment.test.mts test/populated-entrypoint.test.mts`

The strict import tripwire forbids driver resolution even if errors are caught.
CLI tests use clean bounded child ENV and stop their own processes.

Authoritative full regression command: **`npm test`**, the unchanged installed
package script `node --test "test/*.test.mts"`. The November1 validation-gap
closure ran this command once, after `npm run typecheck`, with no extra import,
`NODE_OPTIONS`, driver override, installation, retries, skips or budget changes.
It passed on the first attempt; no factory-lazy-import/test repair was needed.

The previous full measurement used
`node --import ./test/isolated-driver-double.mts --test "test/*.test.mts"`.
That global fail-closed driver double was an isolated historical result, **not
the bare package baseline or native factory verification**. It is not used by
the authoritative commands below. The earlier strict whole-portfolio import
ban encountered historical native/driver imports; this does not establish a
failure of bare `npm test`. M02 alone retains its stricter zero-resolution trap.

The check shell removes every inherited environment key except this explicit
OS/tooling whitelist (case-insensitive names):
`PATH`, `PATHEXT`, `SYSTEMROOT`, `WINDIR`, `SYSTEMDRIVE`, `COMSPEC`, `TEMP`, `TMP`,
`USERPROFILE`, `HOMEDRIVE`, `HOMEPATH`, `APPDATA`, `LOCALAPPDATA`, `PROGRAMFILES`,
`PROGRAMFILES(X86)`, `PROGRAMW6432`, `OS`, `PROCESSOR_ARCHITECTURE`,
`NUMBER_OF_PROCESSORS`; it then sets only `NODE_ENV=test`.
Thus inherited `SHF_*`, `NODE_OPTIONS` and npm configuration overrides are
absent. No host environment values are printed, no environment file is read,
and no real target or credential is supplied. Tests own their synthetic inputs.

No live Oracle connections, Oracle DML, credential loading, broker work,
Docker/build operation or frontend/browser/AT/egress verification is claimed.
The bare full suite is static/synthetic/double-based regression, not live
Oracle/client certification and not a globally instrumented zero-connect test.
The separate M02 trap proves zero driver-resolution attempts for its portfolio
and its three clean CLI children; it does not make that claim for every
historical native module in the bare suite.

Read-only legacy evidence was checked at
`old/SHF/src/bzq/shf/model/ShiftDataModel.java:5801–5835` (overnight adjustment
and sequence allocation) and `AttendanceDataModel.java:2197–2248` (recorded-exit
validation and clearing only exit time/user). No legacy code was edited or run.

Next: parent/QA review source-stable composition; DevOps owns clean isolated
entrypoint packaging and actual Docker/egress/browser verification. Native TEST
remains separate and blocked on operator-owned approved environment/access.

### Authoritative source-freeze validation-gap results (2026-11-01)

All commands below ran from `backend/fixture-slice` on Node24.21.0.

| Command / portfolio | Actual result |
|---|---|
| strict M02 command above | exit0; 43 passed, 0 failed/skipped/cancelled/todo; 3041.3611ms; zero driver-resolution attempts |
| `npm run typecheck` | exit0 |
| **bare `npm test`** | **exit0; 2031 passed, 0 failed/skipped/cancelled/todo; 25608.0896ms; supplied1988 + new43** |

Original bare failure/root cause: **none observed**. Repaired paths: **none**.
Only this validation document changes in the gap-closure task; native factory
implementation/options and existing tests are preserved. The previous guarded
112-test owner run and guarded2031 run remain historical, not substitutes for
the measured bare result. No second full run was necessary.

No runtime, test, checker, contract or dependency source changed during this
closure, so the checks cover the same executable source snapshot. This document
update is not a generated source-hash/build/archive certification. Parent
DevOps owns later canonical build/hash generation and verification; Docker,
browser/AT, egress and live Oracle/partner checks remain not run. This closes
the bare validation gap only, not publication approval or native readiness.

### Final integrated environment checkpoint

The later canonical TEST build passed bare2035 backend tests and802 frontend
tests, both typechecks, all three profiles and148-module closure validation.
Independent Docker/browser checks exercised populated READONLY at18080,
management at18081 and cancellation at18082, all on127.0.0.1.
Management create/change/cancel/two-row CSV and one C52 cancellation were
performed through actual Angular controls with explicitly simulated outcomes.
The writer worlds retain their committed/consumed state and validated older
images; READONLY alone was upgraded for final purpose/readiness hardening.
Do not advertise all three as the same latest image or automatically reset
writer authority. Exact image/version/QA limits are recorded in
[PROJECT_STATUS](../../docs/PROJECT_STATUS.md) and
[design53.6](../../docs/SHF_REVERSE_ENGINEERING_DESIGN.md#536-accepted-composition-and-actual-populated-test-verification).
Live Oracle remains blocked by absent approved process configuration; this
populated synthetic environment does not establish Oracle or release readiness.
