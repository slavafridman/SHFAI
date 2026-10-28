# SHF backend: seven reads, isolated arrivals, and default-off controlled native TEST arrivals

## SHF-ENV-PROFILES-20 — DEV / TEST / PRODUCTION

Approved existing tooling only: Windows, Node **24.21.0**, npm **11.19.0**,
TypeScript **5.9.3**, oracledb **26.0.0**. No installation, Docker, WSL,
CI change, live connection or deployment is required for profile checks.
The existing Oracle TEST path remains Thick / installed Client19.3 / historical
DB11.2.0.4; offline profile tests do not recertify live compatibility.

`SHF_APP_ENV` is server-only, exactly **`dev` | `test` | `production`**.
Empty, uppercase, whitespace, unknown names and cross-profile deployment
classes fail closed before any pool creation. No profile grants capabilities.

`NODE_ENV=production` is an additional fail-closed production-context guard:
it rejects `SHF_APP_ENV=dev|test` and nonproduction `deploymentClass`, including
old profileless fixture configuration, before pool creation/listen. It never
silently overrides the SHF profile. Missing `NODE_ENV` preserves compatibility;
other values (including `NODE_ENV=test`) do not select an SHF profile or add
defaults. Aligned production still hits the existing synthetic/TEST rejection
or explicit missing-real-provider blocker.

| Profile | Required existing `deploymentClass` | Sources / startup |
|---|---|---|
| `dev` | `local-development` | Only explicitly configured isolated fixtures; synthetic Administrator must be explicitly enabled. No live Oracle/native TEST through DEV. |
| `test` | `isolated-test-demo` | Isolated fixtures for QA/demo, or separately confirmed `oracle-read-only` TEST. Default example has arrival disabled; no native-write default. |
| `production` | `production` | Synthetic auth/roles, fixture sources, TEST confirmation, F1/native modes, native secret/binding/allowance context and nonproduction callback origins are rejected. Otherwise startup explicitly fails **`Real authentication provider not configured`**. |

**Migration:** if `SHF_APP_ENV` is absent, the old explicit
`SHF_FIXTURE_CONFIG` / `SHF_ORACLE_CONFIG` configuration continues to work,
including the existing read7 / isolated F1=9 / controlled TEST=10 gates.
Absence never creates implicit DEV settings, synthetic login, rows, grants,
port or Oracle secrets. Exactly one source config and its matching explicit
port are still mandatory. Existing identity/source JSON contracts are unchanged.
The public frontend `appEnv` cannot select server modes or enable native rights.

### Sanitized examples and quick start (PowerShell)

Only versioned JSON examples are provided under `config-examples/`; startup
never automatically loads a file or copies operator values. Run from this
package directory. The example's UTC/DEMO values are synthetic, not discovered
business configuration. In a clean, isolated shell with no Oracle/native inputs:

```powershell
$env:SHF_APP_ENV = 'dev'
$env:SHF_FIXTURE_CONFIG = Get-Content -Raw config-examples/dev.example.json
$env:SHF_FIXTURE_PORT = '4310' # choose a free owned loopback port
$env:SHF_FIXTURE_ROWS = '[]'  # explicit empty synthetic dataset
$env:SHF_TEST_ORACLE_STAGE_WRITE_ENABLED = 'false'
npm start
# Ctrl+C closes this owned application; do not stop someone else's ports.
```

For isolated fixture QA under TEST, use the same fixture configuration after
explicitly changing `deploymentClass` to `isolated-test-demo`, set
`SHF_APP_ENV=test`, and supply the same fixture inputs. F1 remains separately
opt-in via its existing mode and coherent fixture packet; it is a simulation,
not an Oracle write.

`test.example.json` instead describes the **default read-only Oracle TEST**
shape. It deliberately has `oracleTestScopeConfirmed:false` and empty grants:
**it must fail unchanged**. `test-secrets.example.json` lists only server key
names and **empty** secret placeholders; it is documentation, not a loader or
working secret packet. With independently approved TEST scope, the operator
must supply actual private grants/confirmation and `SHF_ORACLE_CONFIG`,
`SHF_ORACLE_PORT`, `SHF_ORACLE_CONNECT_STRING`, `SHF_ORACLE_USER`,
`SHF_ORACLE_PASSWORD`, `SHF_ORACLE_CLIENT_LIB_DIR` through the existing private
environment mechanism, never through the browser, Git, URLs or logs. Empty
placeholders and omitted secrets fail; there is no default password or fallback.
Do not copy protected environment files or infer credentials/identity from
briefs. No TEST start/connection is authorized by this quick start.

Native writes still require **both** existing
`attendanceStageArrivalMode=test-oracle-controlled` and exact
`SHF_TEST_ORACLE_STAGE_WRITE_ENABLED=true`, plus the independently approved
private binding, grants, current TEST-only synthetic marker/window and external
operator-controlled allowance described below. Keep the write flag absent or
`false` and omit **all** `SHF_NATIVE_STAGE_*` keys for read-only TEST.
Do not enable it merely to pass startup/health checks. DEV rejects this mode.
The environment task does not modify native identity, metadata, SQL or UoW.

`production.example.json` is a **blocked configuration skeleton**, not an
executable production adapter/provider approval. It reuses the existing
`oracle-read-only` source name without TEST confirmation, has an empty
`realProviderId`, synthetic disabled and arrival disabled. Even supplying a
provider ID cannot install the missing provider; no production connection is
attempted. Supplying fixture/TEST context is rejected earlier. Future real
authentication, production Oracle support/configuration approval, HTTPS
external reverse proxy and infrastructure/secrets approval belong to their
respective application/security/operations owners. TLS/proxy infrastructure is
not provisioned here; no remote/wildcard CORS is added. F1/native Origin
allowlists remain exact canonical loopback origins only.

Local private overrides can be kept in ignored `config-local/`; logs in
ignored `logs/` / `*.log`. Existing build/dependency ignores remain unchanged.
Do not place secrets in versioned examples. There is no dotenv loader.

### Isolated verification

```powershell
npm run test:profiles
npm run typecheck
npm test
```

Profile tests cover exact names/mapping, old explicit configuration, explicit
synthetic opt-in, ordered 7/9/10 rights, empty example rejection, loopback
fixture startup, controlled TEST startup with **pool doubles only**, and
production rejection/missing-provider diagnostic with zero Oracle factory
calls. All temporary listeners/pools/directories are closed/removed by tests.
No actual operator environment file is read and no real SQL/DML is run.

Implements approved section 13 v0.1 of `docs/SHF_REVERSE_ENGINEERING_DESIGN.md`;
section 15 records detail approval and section 17 approves the local tooling.
Section 19 v0.1 / 22.3 approve the list; section 22.4 approves bounded Oracle test
reads with driver 26.0.0 Thick and the existing Client 19.3. Sections 43/45 v0.1
approve the separately gated native TEST arrival adapter below. No EMS,
real authentication, new runtime framework, schema changes or production deployment.
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
npm run typecheck
if ($LASTEXITCODE -eq 0) { npm test }
```

`npm run typecheck` runs `tsc --project tsconfig.json`: strict, noEmit, NodeNext,
ES2024/Node types, including **all** source and test `.mts` files. It also enforces
erasable syntax compatible with native execution. No `skipLibCheck`, strictness
suppression or substitute syntax-stripping check is used.
`npm test` discovers all `test/*.test.mts`, including original regressions,
current/search and employee-schedule application, HTTP and Oracle-double tests:

```powershell
npm test
```

## SHF-NATIVE-ARRIVAL-API-20 — §43/§45 v0.1, controlled TEST only

**Implemented and offline/double-verified; NOT a live Oracle write result, QA
sign-off or production readiness claim.** Existing R=7 and fixture F1=9 behavior
remain separate. Native mode has exactly the same ordered nine rights followed
by `attendance-stage-arrival:test-oracle-write`. No station/F2 rights, broker,
late reason writes, fallback provider or real authentication were added.

### Configuration and actual entrypoint

`npm start` still runs `server.mts` / `startFromEnvironment`. The native account
is a **separate pool/configuration**, not DML through `OracleReadSession`.
No driver/client/dependency versions or manifests were changed. Actual Oracle11
bind/lock/encoding/metadata behavior remains for authorized operator verification;
offline doubles are not a compatibility or least-privilege certification.

Default-off example (no secrets; existing read configuration must separately
be supplied by the operator):

```powershell
$env:SHF_TEST_ORACLE_STAGE_WRITE_ENABLED = 'false'
# Omit all SHF_NATIVE_STAGE_* values.
# In the existing SHF_ORACLE_CONFIG omit attendanceStageArrivalMode or use
# attendanceStageArrivalMode="disabled". This preserves seven read rights.
```

To select the implemented branch, the private `SHF_ORACLE_CONFIG` must specify
`attendanceStageArrivalMode:"test-oracle-controlled"`,
`dataSource:"oracle-read-only"`, `oracleTestScopeConfirmed:true`,
`deploymentClass:"isolated-test-demo"`, `authenticationMode:"synthetic"`,
`syntheticAdministratorEnabled:true`, a real configured IANA
`businessTimeZone`, and the original exact `syntheticOrgUnitIds`.
Native enabling is independent of mock enabling:

| Environment input | Required meaning |
|---|---|
| `SHF_TEST_ORACLE_STAGE_WRITE_ENABLED` | Exact `"true"` only in the native branch. Omitted/`"false"` keeps a disabled branch off; mixed/unknown values fail before listen. |
| `SHF_ORACLE_CONFIG`, `SHF_ORACLE_PORT` | Existing source/configuration and explicit loopback port, unchanged. |
| `SHF_ORACLE_CONNECT_STRING`, `SHF_ORACLE_USER`, `SHF_ORACLE_PASSWORD`, `SHF_ORACLE_CLIENT_LIB_DIR` | Existing environment-only read-account packet. No credential-file/brief parsing. |
| `SHF_NATIVE_STAGE_CONNECT_STRING`, `SHF_NATIVE_STAGE_USER`, `SHF_NATIVE_STAGE_PASSWORD`, `SHF_NATIVE_STAGE_CLIENT_LIB_DIR` | Independently supplied TEST write-account packet, same approved TNS alias restriction and installed Thick Client19.3. Never implicitly copied from the read packet. |
| `SHF_NATIVE_STAGE_BINDING` | Private JSON packet described below; never frontend configuration, checked-in fixtures, logs or URL parameters. |
| `SHF_STAGE_ARRIVAL_ORIGINS` | Required nonempty JSON array in native mode: at most10 distinct canonical exact http(s) loopback frontend Origins, each<=128 characters, entire value<=4096 UTF-8 bytes. No wildcard, remote origin, request-Host inference or Origin stripping. Existing proxy guidance above applies. |

`SHF_NATIVE_STAGE_BINDING` is a strict object with **all** of:

* `marker`: exactly the public synthetic `SHF_TEST_ARRIVAL_20261020_B`.
* `employeeId`, `shiftDayId`, `orgUnitId`: private decimal employee/day keys and
  exact current J01 grant, rediscovered by a read-only exact-marker scan before
  enablement. No real staff or new marker is admitted.
* `readIdentity`, `writeIdentity`: independent expected database and respective
  account/schema, with exactly one identity strategy. Existing
  `{database,host,service,user,schema}` packets retain their authoritative
  service/host comparisons. SID-only connections instead use
  `{database,user,schema,target}` as described below. Both identities must
  designate the same TEST target/proof; SQL always explicitly targets SHIFTER.
  Never infer DB_NAME or SERVICE_NAME from a TNS alias/SID, or copy expected
  values from the connection's identity response.
* `metadataProvider`: optional private selector, exactly `dba-v1` or
  `owner-hybrid-v1`. Omission retains legacy DBA behavior; no ORA-00942 fallback.
  The owner-hybrid visibility/certificate requirements are documented below.
* `metadataDigest`: for omitted/`dba-v1`, lowercase SHA256 of canonical **ordered arrays** returned
  by the nine `nativeMetadataSql` queries exported from
  `oracle-stage-arrival-snapshot.mts`, in export order, including column types,
  byte limits, constraints/constraint columns, triggers, VPD, direct table/
  column grants, direct role grants and dependencies. This is a named operator/
  DBA's current privately reviewed metadata binding, not a fabricated DB
  rowversion. `stage-arrival-domain.mts:fingerprint` defines canonical hashing.
  Compute/review through an independently authorized read-only session before
  enabling; do not guess the digest or use the unit-double proof as live proof.
* `approval`, `freezeOwner`, `recoveryOwner`: nonempty private reference/owners.
* `writerFreezeConfirmed:true`, `noExternalEffectsConfirmed:true`,
  `singleExecutorConfirmed:true`: operator attestations covering this exact
  tuple **and employee/day/report/policy/metadata context**, excluding legacy
  writers through independent readback, and no unapproved autonomous/observer
  effects. These are operational prerequisites, not properties inferred from
  a row lock, Administrator role or zero visible triggers. Do not set them if
  the exclusion/review has not actually been established.
* `windowStart`, `windowEnd`: explicit UTC millisecond-Z instants, start<end;
  the window applies to actual server time, not client timestamps.
* `allowanceFile`: absolute **external operator-controlled** file path outside
  this repository; existing trusted **local physical** parent directory, file
  initially absent. Every ancestor must already exist and be a non-link
  directory. Junction/symlink ancestors and a linked final component are
  rejected. The canonical `realpath` parent is checked against the module's
  actual repository root (not process CWD), and checked again before `wx`.
  Windows case and ordinary/extended DOS drive syntax are normalized; UNC,
  device/volume-GUID namespaces and alternate-stream/trailing-dot aliases are
  rejected fail-closed before network/filesystem lookup of those namespaces.
  No directory, share, ACL or infrastructure is provisioned automatically.
  One synchronous exclusive `wx` create + fsync consumes the admission fuse
  before acquisition. Its contents contain no business data or credentials.
  Keep the **same path** across restarts/executors. Existing file or local
  consumption rejects another attempt, including after UNKNOWN. Do not delete
  it or change its path/approval to retry. Reopening is manual operator/DBA
  reconciliation only. This is neither a command receipt nor a distributed
  exactly-once mechanism; a general multi-instance feature remains unsupported.

#### SID-only target binding (internal compatibility erratum, section 45.7)

For SID-configured connections, both identities use the same target shape:

```typescript
{
  kind: "sid",
  instanceSid: independentlyConfiguredInstanceSid,
  endpointProof: {
    kind: "configured-address-sets",
    revision: independentProofRevision,
    connectionAliases: independentlyValidatedTnsAliases,
    endpoint: { kind: "dns", name: configuredEndpoint, addresses: endpointAddresses },
    serverHosts: [
      { kind: "dns", name: independentlyDeclaredServerHost, addresses: hostAddresses }
    ]
  }
}
```

This is a shape with symbolic references, not a runnable configuration.
Use `kind:"address"` for a literal IP. Supply DB_NAME from an independent
authoritative TEST reference and INSTANCE/SID from the independently configured
connection. Database, instance and each account/schema comparison are exact;
SID is not assumed to equal SERVICE_NAME. The latter is diagnostic only in
this explicitly selected branch; there is no fallback between strategies.

Declare the finite endpoint/server-host names and used connection aliases
before connecting. Resolve only these independently trusted names outside
Oracle. Every normalized address set must be nonempty and equal in full;
overlap alone, wildcard/suffix matching, reverse-name inference and aliases
learned from a database reply are not evidence. The private proof factory
requires an explicitly supplied trusted resolver, has no default live resolver
and bounds resolution to one second. Never fabricate a proof to pass startup.

Read, write and independent readback share one immutable target/proof revision,
with separate exact read/write account expectations. A reference change requires
new construction/preparation; old tokens cannot cross it. Identity failure after
COMMIT remains UNKNOWN/reconcile, not success or an invitation to retry.
All metadata, grants, freeze, allowance and current-eligibility gates still apply.

Startup performs writer SELECT-only metadata/identity and actual zero-row
SELECT privilege probes, followed by rollback,
then a separate read-only exact-marker/prefix/cardinality/source/policy snapshot
and real Clock eligibility check **before listen**. Missing dictionary
visibility for the selected provider (including its mandatory DBA views),
unsupported/virtual columns or nonpersistent-table
objects in the read set, enabled triggers/VPD, unknown safety,
wrong identity, reused allowance, invalid scopes or expired/late data stop
startup. Same-owner SHIFTER privileges are recognized explicitly; accepting
that account is **not** certification of least privilege. Otherwise direct
table UPDATE or all three direct column grants are required; role membership
alone is not used to infer write permission. Read/write accounts must separately
have their actual required SELECT privileges.

No read-only pool or fixture Clock is reused for native DML/time. Native startup
does not read protected `.env` files, collect passwords from the browser,
reschedule/recreate data or run a command automatically.

### Runtime and UI handoff

The three existing paths/methods are unchanged. Identity remains source
`oracle`, synthetic Administrator, `employeeId:null`; existing Oracle inquiries
retain their old source markers. Native context/validation are `oracle-test`.
GET/context and POST/validations end their READ ONLY transactions before review,
perform zero business/receipt/audit DML, and expose no before-images/private
binding. Native draft is exactly null/null; late or unsupported native context
returns `COMMAND_SCOPE_DEFERRED`, not an override/warning-bearing token.

POST/commands uses strict `NativeStageArrivalCommitV1`: fresh opaque token,
fingerprint, UUID, null/null draft, `confirmation:null`, plus
`operationConfirmation:{accepted:true}` for the **whole real TEST operation**.
Duplicate/unknown JSON keys, client Clock/stamp, wrong Origin and missing
confirmation are rejected. The existing three bounded client-hint headers are
still ignored as metadata, never authority. No extra public endpoint, wrapper,
retry or reconciliation API exists.

The ephemeral HMAC fingerprint/token binds source/mode, process nonce, full
actor/grants, private approval/allowance/window, exact full original snapshot,
policy and zone. Tokens expire at min120s/next on-time transition/window-end
and are consumed on attempted command; no durable receipt or replay claim.
Central rights/scope checks repeat under transaction ownership.

The dedicated writer uses autoCommit=false, bounded NOWAIT locks on existing
attendance/day/employee rows, fresh original-value/policy reads and actual
server Clock. Current TODAY, start−60min<=now<=end and
now+actual configured parent policy<=start must all hold. Original fields are
compared independently, and generated null-safe bound predicates cover the
complete attendance before-image plus relevant baseline/overlay/employee/
hierarchy/policy and no outstanding report. No fabricated version column.
Unknown source flags or nonordinary activity/exception provenance defer this
narrow pilot; they are never normalized to eligibility.

Only STAGE_ARRIVAL_TIME / server subject-bound STAGE_ARRIVAL_USER (<=100 UTF-8
bytes) / TADREECH=0 are SET on the existing row. No INSERT/upsert, late triplet,
station/exit/missing/report change, custom SHF function, extra audit/receipt
table or partner invocation. Rows0 require proven rollback/stale; rows>1 or
undefined require invariant failure/rollback. Locks are not cross-table
serializability; the named contextual writer freeze remains mandatory.

Both explicit AbortSignal and ambient ALS/deadline are checked after waits,
staging, UPDATE and synchronously immediately before DML/COMMIT. Native work
and any break settle before rollback/drop/release. Abort during a sent COMMIT
cannot guarantee undo. Pre-COMMIT failures are `rolled-back` only after
acknowledged complete rollback. Unconfirmed rollback after attempted effect,
COMMIT ACK loss, or unavailable/mismatched readback are
`503 COMMAND_OUTCOME_UNKNOWN / unknown / reconcile`, with no automatic retry,
new UUID retry, fake NONE, inferred success or compensating restoration.

Success requires acknowledged COMMIT, released writer lease and an independent
matching READ ONLY readback of all originals except the exact three allowed
after-values. Receipt is `oracle-test-committed`, source `oracle-test`,
`commitAcknowledgedAt`, `readBackVerifiedAt`, `replayed:false`,
`receiptPersistence:"none"`, `partnerCompletion:"not-invoked"`. No `committedAt`
or durable attribution is claimed. Replay cannot overwrite an arrival or
manufacture a receipt. UI must use the canonical native receipt guard, retain
an actual-TEST-write notice separate from synthetic-auth notice, and reconcile
UNKNOWN rather than display fixture success or automatically resend.

The known prepared `_B` record's earlier four-minute margin is historical and
likely expired. **No current live eligibility or arrival UPDATE is claimed.**
Expired data stops the feature; only the parent/operator may separately refresh
the same synthetic setup under its inherited preparation authority, then
revalidate. No backend auto-reset/developer endpoint or live-check autoexecution
was added. This assignment performs no Oracle connection, FOR UPDATE or DML.

### Verification and environment delivery boundary

From `backend/fixture-slice`:

```powershell
node --test test/oracle-stage-arrival.test.mts test/native-stage-arrival-http.test.mts
npm run typecheck
npm test
```

Native N01–N07 tests use explicitly isolated connection/lock/update/commit/
readback doubles and the actual HTTP environment entrypoint with a typed pool
factory seam (not configurable by ENV/HTTP). They cover PURE0, rowcounts0/1/many,
stale facts/grants/marker/policy/token/time, native late refusal, 7/9/10 rights,
production/invalid/mixed mode rejection, Origin forwarding and rejection,
commit uncertainty, unconfirmed rollback, independent readback mismatch,
explicit+ALS cancellation/deadline, pending commit/break cleanup, no replay
overwrite/retry, and both pools' shutdown. Existing F1 module-hook tests still
prohibit Oracle imports in fixture startup. Live checks remain NOT RUN here.

Recorded implementation check,20Oct2026: focused native **80/80 PASS**;
`npm run typecheck` **PASS** (strict/noEmit); full `npm test` **420/420 PASS**
(original340 + native80, zero skips). The first focused TDD run was red because
the native modules did not yet exist; subsequent integration/type failures were
repaired and the final commands above rerun. Installed Node24.21.0,
TypeScript5.9.3, oracledb26.0.0 confirmed without installing/upgrading anything.
**Status: backend implementation complete / REVIEW for independent QA.**
Actual Oracle metadata/privileges/client behavior, current `_B` eligibility,
live DML/COMMIT/readback, UI acceptance and SLA remain unverified by this task.
Parent owns the shared project checkpoint; QA then operator/DBA own the next
controlled execution. No new generic user-access/contract approval is pending.

### Independent QA corrections D01–D04 (20Oct2026)

The four independent findings were reproduced first: **4/4 RED** on
`node --test test/native-arrival-qa-regressions.test.mts`, then repaired:

* **D01:** stage time NULL with any non-NULL stage user is contradictory
  provenance, not a legal zero briefing flag. Pure preparation and the fresh
  locked snapshot both reject `COMMAND_SCOPE_DEFERRED`, without issuing a token
  or UPDATE. Normal NULL/NULL still commits once.
* **D02:** `backend-lifecycle.mts` owns per-server admission and ALL underlying
  request-budget promises, not just HTTP handler/race completion. Shutdown
  rejects new admission, signals pre-COMMIT cancellation, stops the listener/
  HTTP sockets, and awaits SQL/acquisition/COMMIT/break/rollback/readback/release
  settlement before either Oracle pool is closed. Closing an HTTP socket is
  never considered cancellation/settlement of a native operation. Transport
  loss after command send is UNKNOWN; a sent COMMIT cannot be undone by shutdown.
  `stopBackendServer` is idempotent and waits at most6s **per caller**. If still
  pending it throws sanitized `BackendDrainPendingError`, not a success/drained
  claim. The original completion remains owned by the server's shutdown record;
  if native work is still active, pools remain open, with no forced DROP/close
  under that work. Eventual settlement continues cleanup; another stop call
  waits for the same completion, never replays a command. Pool-close failures
  also remain failures. An unresponsive driver therefore requires operator
  attention/manual reconciliation; this is not a guarantee of process exit
  within6s and never an instruction to force release a running COMMIT.
* **D03:** both receipt diagnostics require strict millisecond-Z formatting,
  finite Gregorian instants and exact Date/ISO round-trip. Impossible dates,
  leap-day errors, normalized overflow, whitespace and reversed ordering fail.
  A malformed receipt after COMMIT remains UNKNOWN, never success or NONE.
* **D04:** allowance admission now verifies physical ancestry/boundaries as
  described above, and repeats checks before consumption. Only the verified
  canonical parent is used for exclusive file creation. Tests create/remove
  only their own TEMP links and never consume through a repository junction.
  This is a private trusted-operator directory requirement, **not an OS
  sandbox or protection against a hostile concurrent directory rename**:
  Node path checks and a later open are not one atomic handle-relative
  filesystem transaction. The trusted directory/ancestors must remain stable;
  `wx` independently prevents final-component overwrite/link following.

The added regression file covers active-operation counters and strict ordering
through the **actual environment/HTTP entrypoint** with pool doubles: gated
lease, query, UPDATE, COMMIT, break, rollback, release, readback and read cleanup;
bounded pending drain/repeated stop; read-only and F1 shutdown; Gregorian and
post-commit malformed receipt matrices; physical TEMP junction/final-link/path
normalization and sanitized failures. Shared public DTOs/signatures, caps7/9/10,
Origin/client hints, marker/three-field scope, driver pins and default-off
configuration are unchanged. Same independent QA must retest D01–D04 before
any live operation. No Oracle read or mutation was performed for these fixes.

Final fix verification (offline/doubles only):

```powershell
node --test test/native-arrival-qa-regressions.test.mts
# QA regression26/26 PASS.
node --test test/oracle-stage-arrival.test.mts test/native-stage-arrival-http.test.mts test/native-arrival-qa-regressions.test.mts
# Native80 + QA26 =106/106 PASS.
npm run typecheck
# PASS, strict/noEmit.
npm test
#446/446 PASS, previous420 + QA26; zero failures/skips.
```

Status: **fixes implemented / REVIEW for the same independent QA retest**,
not independent closure or authorization to execute a live command. All owned
TEMP links and test listeners were cleaned up; the gated drain test explicitly
settled its native/break gates and awaited the same owned shutdown completion.

Environment requirements remain intentionally distinct:

* **dev:** existing explicitly isolated fixture mode; no implicit infrastructure.
* **test:** explicit Oracle read secrets plus independently enabled/bound native
  TEST packet above. All secrets and private bindings stay backend/operator-only.
* **production:** synthetic auth and TEST writer modes reject startup; no dev/
  TEST/Admin fallback. Real authentication/environment delivery is a future
  prerequisite, not implemented or authorized by this change.

## SHF-F1-API-20 — isolated fixture only (§38/39/40 v0.1)

**SIMULATION / synthetic identity / no Oracle / no real employee arrival.**
User approval recorded in §40 covers only the F1 memory command, not native DML,
production, EMS, transport, release or durable idempotency. Historical read-only
instructions below remain applicable when F1 is disabled.

The canonical type-only `stage-arrival-contracts.mts` and all existing read DTO
contracts are unchanged. Three operations only, with
`B=/api/v1/employees/{employeeId}/shift-days/{shiftDayId}/stage-arrival`:

* `GET B/context` — pure context, no business/receipt/audit effect.
* `POST B/validations` — pure validation; only ephemeral server-token allocation.
* `POST B/commands` — explicit complete-operation confirmation, atomic installation
  into one **existing** eligible attendance row + receipt + fixture audit.

There is no insert/upsert, undo, receipt query, retry/polling endpoint, real audit
writer or partner completion. `attendanceKey.shiftDayId` is the existing day
relation, **not a newly invented attendance identifier**. Partner completion is
always `not-invoked`. The legacy `registerStage` write-before-warning and fallback
insert are intentionally not reproduced (source: AttendanceDataModel.java
1237–1304; separate addStageLate 1013–1050; action 317–339).

### Exact setup handoff to parent/UI

Existing samples/defaults are unchanged. `stage-arrival-sample.mts` exports
`sampleStageArrivalConfig` and `sampleStageArrivalFacts`: explicit synthetic
employee **9001**, day **6201**, attendance day **6201**, J01 **0021**, parent
G01 **0012**, plan **2026-10-20 10:30–18:30 Asia/Jerusalem**, reason **1**.
These are a separate demonstration snapshot, never live records or a fallback.

Use `startFromEnvironment` in the existing `server.mts`; no new executable:

```powershell
# Deliberately supply only synthetic sample values; no environment files.
Set-Location D:\AIProjects\SHFAI\backend\fixture-slice
$env:SHF_FIXTURE_CONFIG = node --input-type=module -e "import { sampleStageArrivalConfig } from './stage-arrival-sample.mts'; process.stdout.write(JSON.stringify(sampleStageArrivalConfig));"
$env:SHF_STAGE_ARRIVAL_FIXTURE = node --input-type=module -e "import { sampleStageArrivalFacts } from './stage-arrival-sample.mts'; process.stdout.write(JSON.stringify([sampleStageArrivalFacts]));"
# EXAMPLES ONLY: operator chooses a free backend port and the exact existing UI origin.
$env:SHF_FIXTURE_PORT = '4537'
$env:SHF_STAGE_ARRIVAL_ORIGINS = '["http://localhost:4521"]'
npm start
```

In this example, configure the UI's existing same-origin development proxy to
target `http://127.0.0.1:4537`, while the browser address is
`http://localhost:4521`. Replace these example ports with the operator's actual
ports; do not stop another user's listener or strip the browser's `Origin`.
Use **the frontend's canonical Origin**, not the backend/proxy target Host.
Stop this foreground demo with Ctrl+C. Startup remains fail-closed if any
conflicting source configuration is present; no Oracle/environment-file bootstrap
is required. The real demo uses fresh server time: after the sample planned start,
select the synthetic late reason and explicitly confirm the late warning rather
than freezing the clock or bypassing validation.

```typescript
import { startFromEnvironment, stopBackendServer } from "./server.mts";
import { sampleStageArrivalConfig, sampleStageArrivalFacts } from "./stage-arrival-sample.mts";
const server = await startFromEnvironment({
  SHF_FIXTURE_CONFIG: JSON.stringify(sampleStageArrivalConfig),
  SHF_FIXTURE_PORT: "0",
  SHF_STAGE_ARRIVAL_FIXTURE: JSON.stringify([sampleStageArrivalFacts]),
  SHF_STAGE_ARRIVAL_ORIGINS: JSON.stringify(["http://localhost:4521"]),
});
// server.address() supplies the owned ephemeral port; stop when finished:
await stopBackendServer(server);
```

`attendanceStageArrivalMode` is an internal **consumer configuration** addition,
not a new StartupConfig/identity wire field. Omitted/`disabled` keeps **seven**
read capabilities, including Oracle read-only mode; known F1 routes deny
`LIVE_WRITES_DISABLED` before store access. Enabled mode returns exactly the
ordered **nine** rights in §40; actor `employeeId` remains **null**, never 9001.
UI must require the actual rights **and** known same-session fixture source,
not Administrator label or the enlarged TypeScript union. Preserve the persistent
SIMULATION notice on error/UNKNOWN/success; problems deliberately have no new
source/feature fields. Use the normal same-origin local development proxy:
`OPTIONS` is still a wrong method405, not a fourth F1 operation. Programmatic
`createLoopbackServer(runtime, {stageArrivalOrigins: [...]})` accepts only exact
loopback origins (max10), no wildcard/credential cookies; this does not implement
cross-origin browser JSON preflight. The **actual executable/startFromEnvironment
composition** now forwards the same explicitly validated options, not just the
direct HTTP test helper.

Enabled F1 executable requires `SHF_FIXTURE_CONFIG`, `SHF_FIXTURE_PORT` and
`SHF_STAGE_ARRIVAL_FIXTURE`. **Browser/proxy use additionally requires an explicit
`SHF_STAGE_ARRIVAL_ORIGINS`**, a JSON array of frontend origins. Omitting it, or
supplying `[]`, preserves the old deny-all policy for requests carrying Origin:
context/validation/commands return403 FORBIDDEN with no effect. It is not a
workaround to omit/strip Origin; native requests without Origin merely retain
their previous behavior.

The deployment-only origin key is accepted **only in enabled isolated F1**,
never in disabled/seven-read or Oracle-read-only mode, and cannot enable F1.
Validation happens before listen and before Oracle adapter imports/acquisition:
JSON <=4096 UTF-8 bytes, array <=10 distinct strings, each <=128 characters.
Each string must already be a canonical `http://` or `https://` origin with host
exactly `localhost`, `127.0.0.1` or `[::1]`. The operator enumerates exact frontend
scheme/host/port tuples; unlisted ports, IP/hostname alternatives and schemes are
not equivalent grants. No userinfo, path (even `/`), query, fragment, whitespace,
wildcard, duplicate, remote host or URL normalization is accepted. Default ports
must be omitted as in canonical browser Origin serialization. Unknown/malformed
values reject startup; there is no inference from incoming Origin or backend
Host, no request-time allowlist update and no wildcard reflection.

This is internal deployment configuration, not a public DTO/StartupConfig field,
authentication grant or new API operation. The original Origin/CSRF/cookie,
media/body/duplicate/byte limits and exact three Chrome metadata-header policy
remain unchanged.

Independent `SHF_FIXTURE_ROWS`,
`SHF_CURRENT_SHIFTS_FIXTURE`, search/schedule/items/card/attendance fixture
inputs are rejected to prevent split source/session state. Production, Oracle,
unknown mode/configuration, missing mock opt-in, foreign session adapters and
unsupported/native writer adapters fail construction before listen. F1 bootstrap
does not even import Oracle driver/read adapters. No credential file is needed.
Outside synthetic mode the original installed-real-provider requirement remains;
errors never fall back to Administrator.

`createStageArrivalFixture` / `stageArrivalReadAdapters` materialize detail,
current and attendance read projections from the **same** snapshot. These keep
their existing JSON shapes. The executable F1 sample does not install the four
other optional read adapters (their normal dependency-unavailable behavior remains);
adding them requires genuine same-session fixture projections, not attaching live
or independent sample readers. The original disabled seven-read setup is unaffected.
Effective day/employee/team/parent/policy facts are explicit canonical fixture
facts, not a newly implemented legacy/Oracle resolver. The owned session UUID is
generated internally and is not client authority or an identity field.

### Effects, atomicity, time and limits

Context, invalid draft/reason, warning display/acknowledgment, cancel/back:
**zero** attendance fields, receipts and audit entries changed. Cancel sends no
command. No lock is held while a person reviews a warning.

The UoW owns a bounded employee/day reservation; the decision is synchronous.
It rechecks scope, retained command binding, full original facts and revisions,
policy/catalog, opaque token/draft/fingerprint, warnings/minutes, confirmation and
fresh server Clock under ownership. A single snapshot pointer installs existing
attendance stage-time/user/briefing(false), confirmed-late triplet, terminal
receipt and audit **together**. Pre-install failure installs none; `rolled-back`
is emitted only after discarded private staging, never after an installed effect.
There is no database transaction or native/EMS adapter hidden behind these ports.

Server local arrival seconds are truncated, not rounded; preview time is not
commit time. Strict full-precision lateness is `now + policyMinutes > start`;
equality is on-time and subsecond lateness may mean minutes `"0"`. Resolve IANA
zone boundaries uniquely; DST folds/gaps and invalid source facts fail closed.
Production executable uses `systemClock`; the optional second
`startFromEnvironment(env, fixtureClock)` parameter is solely the isolated
test clock seam, never an HTTP/browser timestamp. One business-clock sample
per validation; commit samples freshly while owned.

Tokens use built-in `randomBytes(32)` (43 base64url chars), SHA-256 fingerprints
and full private immutable binding. Lifetime is the earlier of120s and the next
warning/minute transition. Logical TTL is checked on access, lazy cleanup is
bounded. Limits from the canonical contract: <=1000 tokens, <=1000 receipts;
terminal receipt and its memory audit retained15min, not durable. Additional
private implementer bounds: <=1000 source rows and <=1000 active reservations;
no queue/in-flight eviction. Saturation rejects503 before effect. These are local
implementation limits, not new public fields; a different public limit requires
architect/parent agreement. Fault injection and `reviseForIsolatedTest` are
explicit isolated test-double seams, not runtime HTTP commands or resets.

Same retained scoped command/payload can replay once (`replayed=true`) without
another write, even after token expiry; mismatched payload/grants/source/session
cannot reveal the receipt. No global exactly-once, cross-instance/restart durability
or persistent idempotency is claimed. Receipt expiry cannot reconstruct provenance
from attendance equality.

**UNKNOWN**: timeout/abort/lost acknowledgment after installation, unproved
attempted outcome, malformed/wrong-source success -> `COMMAND_OUTCOME_UNKNOWN`,
`effect=unknown`, `nextAction=reconcile`, **not** ordinary retryable503/false zero.
Network loss after sending means UNKNOWN client-side even if no JSON arrives.
No automatic retry/fallback/polling. A later context/detail/attendance read shows
current state but cannot attribute it to the lost command. Process loss destroys
tokens/receipts/audit/state; starting another demo session does **not** resolve or
undo the preceding uncertain attempt. Parent UI owns §39.7 uncertainty/history
safety and cannot turn reload/no token into a new ready command.

### Offline verification

```powershell
npm run test:stage-arrival
npm run typecheck
npm test
```

F01–F10 tests use VirtualClock and synchronous fault doubles; HTTP uses actual
native GET/POST on owned ephemeral loopback listeners and virtual deadlines
(no sleeps). Includes mutex races, every pre-install fault, lost ack/socket,
bounded saturation/retention, strict grammar/media/headers/bodies, seven/nine
mode gates and an isolated child module hook that forbids all Oracle imports.
No live database, native client initialization, DML (even rollback tests), EMS
or frontend/browser acceptance is part of these checks.

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
- `GET /api/v1/shift-search/filter-context` (explicit search fixture required)
- `GET /api/v1/shift-search` (explicit search fixture required)
- `GET /api/v1/my-shifts/context` (explicit schedule fixture required)
- `GET /api/v1/my-shifts` (explicit schedule fixture required)
- `GET /api/v1/employees/{employeeId}/shift-days/{shiftDayId}/breaks-and-exceptions`
  (explicit items fixture in fixture mode)
- `GET /api/v1/employees/{employeeId}/operational-card`
  (explicit employee-card fixture in fixture mode; no query/body)

Identity/detail prohibit query/body input; current/search filter-context prohibits
query/body. Lists and schedule context accept only their canonical query keys,
with no body. All send `Cache-Control: no-store`.
Identity is not an authorization token; every request authenticates independently.
Administrator has exactly `["shift-day:read", "current-shifts:read", "shift-search:read", "my-shifts:read", "shift-items:read", "employee:read"]`,
no employee identity, and cannot
bypass source validation, explicit employee context or the fixture-unit allowlist.

## SHF-EMPLOYEE-API-19 — operational card v0.1

Approved baseline: design sections 32/33 v0.1, approval/canonical handoff section34
(19 October). Architect-owned `employee-card-contracts.mts` and existing public
contracts are consumed unchanged. `employee:read` is independent of the five
existing rights. Real actors can read only their verified nonnull self-ID through
the existing provider seam; this adds no real provider. Explicit isolated synthetic
Administrator can select a scoped employee, but its actor `employeeId` stays null.
Missing capability/actor denial precedes read/hierarchy access. Current exact J01
scope (including leading zeros) is checked on every request, with no inheritance.

Public allowlist: internal `employeeId`, `employee.firstName/lastName`,
`employee.unit.{code,label,moked.{code,label,unitType}}`,
`employee.job/innerJob` (null or `{code,label}`), `businessTimeZone`, `dataSource`.
No shift activity/site, HR/contact/national-ID/reference/manager/settings/dates,
attendance or related-resource prefetch. Unknown input fields are never copied.
Names remain literal JSON text; consuming UI must render them as text, not HTML.
Present unresolved numeric codes keep `label:null`; missing/null/numeric zero
codes are null. Signed nonzero decimal codes retain up to38 digits.

`OracleEmployeeCardReader` uses one existing session/explicit read-only snapshot:
one bound six-column `EMPLOYEE_ID` lookup (cap2), bounded exact hierarchy
(cap101), selected positive active job grouped code/name pairs (cap2),
selected inner-job labels (cap2). Active status3 is from `SHFConstants`;
the selected employee itself has **no** active-status exclusion. The job source
is `ComplexCodeTable.getJobRows`, not a new jobs table. Grouped ambiguity fails
before trimming, and duplicate inner-job identities fail even for equal labels.
Missing/out-of-scope/null-team candidates produce the same404 before labels;
two admitted candidates produce500 `AMBIGUOUS_EMPLOYEE`. Optional unresolved
labels do not permit malformed/missing required hierarchy. No custom function,
write, schema change, legacy initialization, EMS or fallback is involved.

Fixture handoff (UI owner/caller): `employee-card-sample.mts` exports exactly
`sampleConfig` and `sampleEmployeeCardFixture`. Synthetic employee (עובד סינתטי),
internal key `9007199254740993`, shares the existing detail/current sample key and name;
synthetic Noam Cohen (נועם כהן), key `2`, demonstrates unresolved job `-9` and
null inner job. Both use exact synthetic team `T01` / direct moked `01`.
This is not actor identity or evidence about live employees.

Add `SHF_EMPLOYEE_CARD_FIXTURE=JSON.stringify(sampleEmployeeCardFixture)` to
the existing explicit fixture environment, alongside `SHF_FIXTURE_CONFIG`,
`SHF_FIXTURE_ROWS`, `SHF_CURRENT_SHIFTS_FIXTURE`, and `SHF_FIXTURE_PORT`.
No default fixture is installed. Both existing current catalog and card fixture
validate configured exact grants before listen; the card reader owns its immutable
employee/context snapshot.
Oracle construction injects the Oracle card port into the same configured source;
Oracle mode rejects this and every other fixture input. Missing/mismatched port
fails explicitly, never by falling back to a fixture or Administrator.

Focused static/synthetic checks:

```powershell
npm run test:employee-card
npm run typecheck
npm test
```

Card tests cover backend EC18-01–12 application/HTTP/Oracle doubles, total5000ms HTTP
budget/abort/no-late-success, bound queries, native-operation wait ordering,
rollback/release and discard after unsafe cleanup. These do not prove native
Oracle encoding/cancellation, deployed policies/synonyms/grants or query cost.
EC18-13/14 navigation, UI races and accessibility remain the UI/QA owners' checks.
Native TEST checks require environment-only `SHF_ORACLE_CONNECT_STRING`,
`SHF_ORACLE_USER`, `SHF_ORACLE_PASSWORD`, `SHF_ORACLE_CLIENT_LIB_DIR` for the
explicitly approved read-only CTIDBT_WFMT account and one approved candidate.
Do not reuse broad HR/workflow live-check scripts for this card's narrower scope.
Never print source fields/values, credentials, SQL/binds or real identifiers.
No live result is implied by the offline checks.

### Bounded native card checker — SHF-EMPLOYEE-API-19 follow-up

`oracle-employee-card-live-check.mts` is an explicit operator tool, never run
automatically by `npm test` or app startup. It consumes environment-only Oracle
configuration above plus:

- `SHF_ORACLE_TEST_SCOPE_CONFIRMED=true`
- `SHF_ORACLE_EXPECTED_DB_NAME=WFMT`
- `SHF_ORACLE_EXPECTED_SERVER_HOST`: uppercase short canonical server hostname,
  independently established from the approved local TEST TNS endpoint/DNS.
  Do not infer it from the alias spelling or copy it from the database response.

An operator may bootstrap an authorized reference into a child environment in
memory; the checker/application never reads that reference or persists secrets.
No credential command-line arguments, logs, global environment changes or
credential files are needed. With the approved child environment:

```powershell
node oracle-employee-card-live-check.mts
```

Before any business query, it verifies actual Oracle database name/server host/
session user within an explicit read-only transaction. It then checks SELECT1,
38-digit NUMBER text, synthetic Hebrew echo and full-second Gregorian DATE using
existing helpers. Candidate discovery returns one existing J01/direct-G01 team
key and at most10 employee keys in that exact team; only the first employee is
selected. No active-status filter is invented for that employee. One card GET
and one identity GET use the same instrumented native pool/runtime; unrelated
workflow SELECTs and SELECT-star are rejected before execution.

The checker validates exact recursive public JSON shape, source coherence,
six capabilities/null actor, privacy headers, single bounded card snapshot,
label query caps and lease cleanup. Canonical404/500/503 remains an honest
`CANONICAL_ERROR`, not another candidate, relaxed validation or fixture fallback.
Only aggregates/booleans/sanitized codes are printed. A clearly labeled
`isolated-test-double` seam tests the checker itself; it is not native evidence.

**19 October actual native execution:** driver26 Thick/Client19.3; TEST identity,
SELECT1/precision/Hebrew/Gregorian mapping PASS; one team,10 candidate keys,
one employee, two HTTP GETs, card200; exact privacy allowlist/source coherence
PASS. One card snapshot, one employee query, one job-label query and one
inner-job query (one returned row each). Six read-only transactions/leases,
18 statements including transaction housekeeping; every lease rolled back and
released, pool and owned ephemeral listener closed. Two preliminary identity-only
attempts stopped before business reads because the alias spelling was not the
server hostname; the independent configured TNS/DNS identity resolved this.
No real record fields/values or credentials were printed or persisted.
This does not prove query plans, deployed-policy purity, production readiness,
native timeout/break behavior or UI accessibility/navigation.

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

## SHF-SCHEDULE-API-18 — approved employee schedule v0.1

Approved baseline: design **§26/27 v0.1**, approval/canonical handoff **§28 v0.1**
(18 October 12:02 explicit approval). Architect-owned `contracts.mts`,
`current-shifts-contracts.mts`, `shift-search-contracts.mts` and
`my-shifts-contracts.mts` were consumed read-only. This section supersedes only
historical capability/test-count descriptions above, not their recorded results.

### Public fixture/configuration handoff

`my-shifts-sample.mts` exports **`sampleConfig`**, **`sampleMyShiftsFixture`**,
**`sampleMyShiftsDetailRows`**. These are synthetic opt-in samples, not default
startup data or an Oracle failure fallback. They cover both existing current and
search actors, overnight/full-second values, unknown/duplicate activities and a
null end. Current actor: employee `9007199254740993`, range
`2024-02-29..2024-03-01`; search actor: employee `1001`, range
`2026-10-15..2026-10-15`. These identifiers are fixed synthetic fixture values.
UI owns integration into its separate loader/dataset.

From this directory, this optional inline local demo starts an ephemeral
loopback server, verifies selected context/list, and closes it without logging
identity/row payloads:

```powershell
@'
import { sampleConfig, sampleMyShiftsFixture, sampleMyShiftsDetailRows } from "./my-shifts-sample.mts";
import { sampleCurrentFixture } from "./current-shifts-sample.mts";
import { sampleSearchFixture } from "./shift-search-sample.mts";
import { startFromEnvironment, stopBackendServer } from "./server.mts";
const server = await startFromEnvironment({
  SHF_FIXTURE_CONFIG: JSON.stringify(sampleConfig), SHF_FIXTURE_PORT: "0",
  SHF_FIXTURE_ROWS: JSON.stringify(sampleMyShiftsDetailRows),
  SHF_CURRENT_SHIFTS_FIXTURE: JSON.stringify(sampleCurrentFixture),
  SHF_SHIFT_SEARCH_FIXTURE: JSON.stringify(sampleSearchFixture),
  SHF_MY_SHIFTS_FIXTURE: JSON.stringify(sampleMyShiftsFixture)
});
try {
  const base = "http://127.0.0.1:" + server.address().port;
  for (const path of [
    "/api/v1/my-shifts/context?mode=selected&employeeId=9007199254740993",
    "/api/v1/my-shifts?mode=selected&employeeId=9007199254740993&dateFrom=2024-02-29&dateTo=2024-03-01"
  ]) {
    const response = await fetch(base + path);
    if (response.status !== 200) throw Error("Demo failed");
    await response.arrayBuffer();
  }
  console.log("Synthetic context/list PASS");
} finally { await stopBackendServer(server); }
'@ | node --input-type=module
```

`SHF_MY_SHIFTS_FIXTURE` requires explicit `SHF_CURRENT_SHIFTS_FIXTURE`.
Its absence means schedule dependency unavailable, never a silently synthesized
schedule. Oracle bootstrap supplies `OracleMyShiftsReader` and rejects **all**
fixture variables. Existing Oracle configuration/environment keys, explicit
test-scope confirmation, Thick Client 19.3 and isolated-only startup remain
unchanged. No dependencies were installed/upgraded.

### Behavior and evidence

Exact GETs: `/api/v1/my-shifts/context` and `/api/v1/my-shifts`. Both require
explicit `mode=self|selected`, independent `my-shifts:read`, no body, strict
single-occurrence allowlisted query keys. Selected mode additionally requires
the validated enabled local/isolated synthetic Administrator and an explicit
canonical employee ID. Real selected mode is forbidden. Selection never changes
principal identity. Synthetic self context is `employee:null`,
`selectionRequired:true`, `canSelectEmployee:true`; self list is **409
EMPLOYEE_CONTEXT_REQUIRED**, without querying employees/schedules. A future real
provider's validated employee link works via the existing abstract seam;
tests use labeled provider doubles, not implemented real authentication.

Context samples configured-zone Clock once for today..today+13, clamped at year
9999. Lists require both Gregorian dates (years 0001–9999), <=31 inclusive
calendar dates. Arithmetic is civil, not UTC/millisecond/DST elapsed arithmetic.
Unknown/vanished/out-of-scope/unlabelable actors all produce generic **403**.
Exact current J01 grants and direct G01 labels are revalidated per operation;
no parent grant, active-employee filter or Administrator business-rule bypass.

`OracleMyShiftsReader.withRead` reuses **one** `OracleReadSession.read` snapshot
for actor lookup (<=2), full-selection ambiguity/orphan probe (<=1), SQL page
(<=limit+1, <=101) and page-code labels. Bound actor full reference/prefix stay
internal. Baseline type4/no ANY change and changed OWN employee/type4/start,
null cancellation, inclusive START date membership are SQL predicates before
Oracle11 analytic pagination. Display uses approved detail NVL fallbacks,
retains null/overnight/full seconds and numeric-string IDs. Ordering is effective
start/numeric day/numeric employee. Ambiguity before pagination includes empty
later pages; no DISTINCT/latest/first-row masking. No attendance/cancel-login
query, custom function, PL/SQL, business commit, DML/DDL, lock, sequence or EMS.

Rollback/release, abort/native-break/unsafe-drop and total 5000ms budget reuse
existing infrastructure. Responses are allowlisted, <=2MiB, no-store/nosniff;
problems contain only sanitized code/requestId/field metadata. No automatic
retry, partial/late success or Oracle-to-fixture fallback.

Controlling source, inspected read-only:
`old/SHF/src/bzq/shf/model/ShiftDataModel.java:1166–1385` (active
`populateMyShifts`, full reference, own changed fields, anomalous attendance
join, positional descending order);
`actions/ShiftDataAction.java:138–161` (single-date default);
`actions/BaseAction.java:85–139` (profile linkage);
`bean/AgentDayBean.java:963–1060` (effective getters);
`old/SHFWeb/WebContent/WEB-INF/struts-config.xml:394–415` and
`jsp/shifts_my_shifts_table.jsp:64–145` (route/visible fields).
Intentional differences are exactly those approved in §26; no legacy code was
edited, built or executed. No source-contract catalog exists in inspected docs.

### Verification (18 October 2026)

From `backend/fixture-slice`:

- First coherent focused `node --test test/my-shifts.test.mts`: initial native
  strip-only parameter-property failure, repaired immediately, then **3/3 PASS**.
- `node --test test/my-shifts.test.mts test/my-shifts-http.test.mts test/oracle-my-shifts.test.mts`:
  **27/27 PASS**. Includes real-bound/null self seams, scope/reassignment,
  cancellation, leap/DST/year limits, precision/nulls/detail coherence, synthetic
  legacy-anomaly characterization, off-page ambiguity, paging, read purity,
  strict HTTP/errors/body/response/query budgets, no auth/source fallback,
  one snapshot and actor resolution, native abort/cleanup/discard mocks.
- `npm run typecheck`: strict no-emit/erasable **PASS** (an earlier readonly-test
  fixture mutation typing error was repaired and rerun).
- `npm test`: **123/123 PASS**, 96 existing + 27 new, isolated/mocked only.
- Authorized environment-only `node oracle-my-shifts-live-check.mts`: actual
  Node 24.21 / driver 26 Thick Client19.3 / CTIDBT_WFMT **PASS**:
  SELECT1, Gregorian leap DATE/full seconds, synthetic Hebrew, >2^53 precision;
  **10** candidate keys, **1** actor, limit2 → **1** schedule row;
  context/list/detail/source coherence, **3** HTTP GETs, explicit environment
  bootstrap context/list PASS. Output only counts/flags, no person values.
  Operator reference was injected only by a disposable memory-only harness;
  neither application nor checker reads the brief/secrets file. All owned
  listeners/pools are closed in finally paths.

Existing current/search **live** checks were not repeated: no direct regression
requiring them; their full mocked/HTTP/application regressions did run. No
production/live writes, schema changes, EMS/batch, real-provider implementation,
legacy execution, browser/RTL/accessibility checks, load/query-plan assessment or
forced live-network/cancellation failures. Those remain outside this backend
verification; UI/QA own browser acceptance. There is no new contract blocker.

## SHF-ITEMS-API-18 — approved §§29/30 v0.1, canonical §31 v0.1

Approval: 18 October 2026, 14:17, recorded in §31. Architect-owned
`contracts.mts`, `current-shifts-contracts.mts`, `shift-search-contracts.mts`,
`my-shifts-contracts.mts` and `shift-items-contracts.mts` were not edited.
The only identity delta is the exact fifth capability above; synthetic
Administrator still has `employeeId=null`, never a selected employee identity.

One GET, no aliases or additional catalog/context/item endpoints:

```text
/api/v1/employees/{employeeId}/shift-days/{shiftDayId}/breaks-and-exceptions
```

Both `shift-items:read` and `shift-day:read`, then actor permission, are checked
before any port/DB/hierarchy call. Explicit isolated synthetic selection or a
future real verified self must still satisfy exact current J01 scope and existing
detail ownership. Empty grants never mean all. Wrong employee, reassignment,
out-of-scope and vanished/nonresolving day use the same generic404.

Employee IDs are canonical positive decimal strings of up to38 digits; day IDs
up to10. Optional query keys **only** limit1–100/default25, offset0–10000/default0
and sort=`start-asc`/default. Unknown/decoded-duplicate keys, noncanonical values,
query >8192 bytes and any nonempty body yield400. Non-GET yields405/Allow: GET,
with no reader call. Problems use only the §29 allowlist (no409/422), no offending
values, SQL or driver text. Both success/errors are no-store/nosniff.

`GetSelectedShiftItems` owns application authorization and response projection;
`shift-items-projection.mts` owns pure item conversion. `ShiftItemsFixtureReader`
is an explicitly isolated test double. `OracleShiftItemsReader` uses the existing
pool and one `OracleReadSession.read` for Gregorian verification, full detail
context/hierarchy, full-selection duplicate probe, bounded page and scoped
catalogs. `detailContextRows` is the shared session-bound detail primitive, not a
second public detail call/connection. Context ambiguity is checked before
accepting an employee or scope; item tuple ambiguity is checked before offsets,
including an otherwise empty page.

Membership: exact AGENT_DAY_ID, STATE_TYPE>0, cancellation code null. State4 is
break, state2 timeoff, other positive states exception; SOURCE DEL remains raw
data when cancellation is null. Signed/zero type codes and unknown labels remain
honest. Full-second Gregorian local dates, earlier ends/outside-shift intervals,
stored signed38-digit duration and nullable break actuals are never recalculated
or interpreted as completion. Non-break actuals are inapplicable/null.
No whole-day expansion, attendance reasons/reports, command eligibility,
candidate/validation helper, custom function/procedure/sequence, ledger or EMS.

**Duration clarification:** §29/31 and the canonical DTO require a nonnullable
`durationMinutes: string`. An actual NULL is tested as INVALID_SOURCE_DATA,
never zero or an invented duration. The task wording mentioning nullable duration
does not match that approved canonical type; no shared contract was widened.

Oracle uses parameterized exact-day reads, a full day/start duplicate probe and
Oracle11 ROW_NUMBER pagination with <=limit+1<=101 transferred item rows.
No item employee/attendance join, DISTINCT, first-owner selection, OFFSET FETCH,
global catalog preload or unbounded application fetch. Only context/page labels
are resolved; the extra sentinel is not label-hydrated or serialized.
Read-only transaction start, autoCommit=false, rollback and awaited native
break/release/discard use the existing infrastructure. Source failures are503,
never fixture fallback. Total5000ms budget includes serialization; response cap
is2MiB and an oversized resource fails INVALID_SOURCE_DATA. Later pages are
reauthorized independent snapshots, not a frozen cursor/total.

### Fixture handoff through the parent

Exports in **`shift-items-sample.mts`**, all actually used by backend tests:

- `sampleConfig`
- `sampleShiftItemsFixture`
- `sampleShiftItemsDetailRows`

They share the synthetic employee/day and detail facts from
`current-shifts-sample.mts`; use its `sampleCurrentFixture` for existing runtime
catalog configuration. No frontend fixture was edited. Example from this folder,
with no persistent listener left behind:

```javascript
import { sampleConfig, sampleShiftItemsFixture, sampleShiftItemsDetailRows }
  from "./shift-items-sample.mts";
import { sampleCurrentFixture } from "./current-shifts-sample.mts";
import { startFromEnvironment, stopBackendServer } from "./server.mts";
const server = await startFromEnvironment({
  SHF_FIXTURE_CONFIG: JSON.stringify(sampleConfig),
  SHF_FIXTURE_PORT: "0",
  SHF_FIXTURE_ROWS: JSON.stringify(sampleShiftItemsDetailRows),
  SHF_CURRENT_SHIFTS_FIXTURE: JSON.stringify(sampleCurrentFixture),
  SHF_SHIFT_ITEMS_FIXTURE: JSON.stringify(sampleShiftItemsFixture),
});
try {
  // Use server.address() in the owning local test; do not log real records.
} finally { await stopBackendServer(server); }
```

`SHF_SHIFT_ITEMS_FIXTURE` is explicit opt-in; omission disables only this resource
with503, not an invented empty success. Startup rejects a differing detail
snapshot or missing shared current fixture. Oracle startup rejects this and all
other fixture inputs and wires only source-bound Oracle readers. Production
mock rejection and real-provider fail-closed behavior remain unchanged.

### Verification — 18 October 2026

Commands from `backend/fixture-slice`:

```powershell
node --test test/shift-items-projection.test.mts
node --test test/shift-items-projection.test.mts test/shift-items.test.mts test/shift-items-http.test.mts test/oracle-shift-items.test.mts
npm run typecheck
npm test
```

- Cheapest first coherent check: **4/4 PASS** before adapter/runtime expansion.
- Final focused selection: **38/38 PASS**, isolated fixtures/HTTP/Oracle doubles.
- Strict TypeScript5.9.3 no-emit check: **PASS**.
- Full suite: **161/161 PASS** = **123 existing +38 new**, no skips/failures.
- Tests exercise BRX18 backend obligations: capability/actor checks before
  acquisition, generic404/reassignment/full detail ambiguity, off-page tuple
  duplicates, state/cancel/DEL membership, overlays, null/precision/seconds/date
  anomalies, scoped labels, paging/caps, immutable reads, sanitized errors,
  source isolation,5s auth deadline, disconnect/native abort and lease cleanup.
  BRX18-12 browser navigation remains frontend/QA-owned, not backend-certified.

Authorized native command with environment already injected:
`node oracle-shift-items-live-check.mts`. The actual run used a disposable
`node --input-type=module -` operator harness: reference parsed in memory only,
then supplied to `runOracleShiftItemsLiveCheck(env)`; neither app nor checker
reads the brief or a secrets file. No credentials/rows were persisted or printed.

Actual Node24.21 / node-oracledb26 Thick / Client19.3 / CTIDBT_WFMT **PASS**:
SELECT1, NUMBER>2^53, synthetic Hebrew and Gregorian leap DATE/seconds roundtrip;
**10 candidate keys,1 selected day, limit2,2 items**, coherent detail and source;
**1 observed item snapshot** with context/probe/page on one read-only lease,
bounded transfer and rollback/release verified; environment bootstrap and
**2 HTTP GETs** pass. Output is flags/counts only. All owned pools/listeners
closed; pre-existing4328/4320 listeners were not stopped.

Not run: previous live workflow repetitions (covered by full regression),
production/writes/DDL/EMS/batch/legacy execution, live fault injection or
query-plan/load/policy/grant certification, frontend/browser/RTL/a11y checks.
Database/platform owners retain deployed policy/performance/native network
failure risks; frontend/QA own browser acceptance. No dependency installation,
upgrade, root/docs/frontend/legacy/canonical change or deployment was needed.

## SHF-ATTENDANCE-API-19 — approved attendance inquiry v0.1

Authority: design §§35/36 v0.1, approval/canonical handoff §37 v0.1,
user approval 19 October 2026 13:46. `attendance-contracts.mts` and all other
canonical contracts are consumed unchanged. Existing Node24 / TS5.9.3 /
oracledb26 Thick / Client19.3 dependencies and lockfile are unchanged.

New endpoints:

* `GET /api/v1/attendance/filter-context` — **no query, even bare `?`**, no body.
* `GET /api/v1/attendance` — required `attendanceDate=YYYY-MM-DD`,
  `timeFrom=HH:mm`, `timeTo=HH:mm`; optional `mokedCode`, comma-delimited
  `teamCodes`, `innerJobCodes`, `workLocations=home,site`, `limit`, `offset`,
  `sort=effective-start-asc`. Unknown/repeated/array keys, malformed UTF-8,
  coercions, reversed times and bodies fail400. Other methods405/Allow GET.
  Bounds are inclusive at **seconds00**, not the entire final minute.

Both require **only the independent `attendance:read` capability**, never
Administrator role or any of the prior six rights. Synthetic Administrator now
has exactly seven approved capabilities in canonical order, still employeeId
NULL. Existing explicit isolated mock opt-in, production rejection, configured
real-provider replacement seam and no-error-fallback rules remain in force.
No new real provider or credential verification is implemented.

`ReadAttendance` owns admission, defaults, response validation and allowlisted
projection. `AttendanceFixtureReader` is a finite isolated relational double;
`OracleAttendanceReader` uses one `OracleReadSession.read` per context/list GET.
Scope hierarchy, original-grant active role eligibility, filter validation,
relevant multiplicity probe, page and selected labels share that snapshot.
The operation-local AsyncLocalStorage admission holds a frozen copy of ORIGINAL
grants and whether teams were explicitly selected; it is not a request field
or extra port operation. The adapter intersects selected parent/teams against
the same-snapshot hierarchy before any business-row query.

Membership follows controlling `AttendanceDataModel.populateAttendanceList`,
367–705, not current/search eligibility: disjoint baseline-with-no-ANY-change
and changed-own-employee/type4; branch planned start **OR split end**; changed
cancellation must be NULL (zero is excluded). Removed E_OLD and CTI joins.
No active-employee/missing-reason/actual-arrival filter, attendance-only union,
DISTINCT/first-row suppression or changed membership NVL rescue.
Raw branch location controls filtering; changed-nonnull fallback controls display.
Prefix employee, day/change and attendance multiplicity is rejected BEFORE
offset, including an empty requested page. Oracle11 ROW_NUMBER ordering is
effective start NULLS LAST, numeric day/employee IDs; SQL transfers <=limit+1
(<=101), with offset<=10000 and no total. Selected label probes return <=2 per
identity; scoped hierarchy<=101 and role options<=1001 including overflow.
No unbounded employee directory/catalog preload.

`planned` is separate from all three independent actual timestamps; stored
Gregorian local dates/seconds, precision-safe IDs and overnight dates survive
unchanged. Missing attendance gives five NULL fields. MissingReasonCode remains
raw signed integral text, including zero and negatives; there is no absence,
lateness, current-status, duration, counter or reason-description inference.
Briefing is NULL/0/1 only. Unknown selected labels remain NULL; activities retain
order/duplicates and baseline exception fallback applies only with no tokens.
No personal-reference/user/contact/national-ID/private-text fields are selected
into DTOs. Join personal references occur in SQL predicates only.

Both endpoints use no-store/nosniff, sanitized RFC9457 problems, the existing
5000ms end-to-end budget, 8192-byte raw query cap, 2MiB success and16KiB problem
limits. Cancellation/timeout never returns late200 or fixture fallback.
Native break is awaited, rollback/release is attempted, and unsafe leases are
dropped; cleanup can outlast the response deadline. All SQL is bound data and
reviewed nonmutating SELECTs/built-ins under explicit READ ONLY transactions.
No DML/DDL/custom SHF function/procedure/legacy initialization, CTI, EMS or batch.

### Fixture handoff (frontend-owned integration, no frontend changes here)

Exact module: **`backend/fixture-slice/attendance-sample.mts`**.
Exports: **`sampleConfig`, `sampleAttendanceFixture`,
`sampleAttendanceDetailRows`**. Data is synthetic; same catalog/current employee
as existing samples, own day IDs19001/19002. One planned-start match with no
attendance and one split-only match with independent recorded station/exit and
negative raw reason. Use `2026-10-19`, `10:00`–`10:00`.

Environment input is **`SHF_ATTENDANCE_FIXTURE`** (JSON serialized
`sampleAttendanceFixture`), alongside explicit `SHF_FIXTURE_CONFIG`,
`SHF_FIXTURE_PORT`, `SHF_FIXTURE_ROWS` (`sampleAttendanceDetailRows`) and
`SHF_CURRENT_SHIFTS_FIXTURE` (existing `sampleCurrentFixture`). No implicit
sample loading. When adding attendance to an existing multi-screen fixture
handoff, MERGE `sampleAttendanceDetailRows` into the existing detail rows by
their own IDs; do not replace the previous workflows' rows. The minimal
attendance-only detail input above is for a standalone isolated check.
Missing shared current configuration or mixing any fixture with
Oracle configuration fails startup. Oracle uses `OracleAttendanceReader`
automatically alongside the existing source-bound readers, never a fixture
fallback. Existing detail navigation is exercised using the row's OWN IDs;
the sample does not fabricate unimplemented item/card fixtures.

### Checks and authorized native TEST result

From `backend/fixture-slice`:

```powershell
npm run test:attendance
npm run typecheck
npm test
# Explicit operator-only TEST invocation; NOT part of test/start:
npm run check:attendance:oracle
```

`test:attendance` registers five files: pure fixture/query, application/policy,
HTTP, mocked Oracle and isolated native-checker tests. They cover AT19-01–11
backend portions; browser/navigation acceptance AT19-12 remains frontend/QA.
Native checker tests use an explicitly labeled isolated double and never claim
Oracle completion. The existing card native-checker's exact capability check
and seven prior identity regression expectations were updated to seven.

Final executed checks (19 October): `npm run test:attendance` **31/31 PASS**;
`npm run typecheck` (`tsc --project tsconfig.json`) **PASS**; `npm test`
**223/223 PASS** (192 existing +31 attendance). Intermediate strip-only syntax,
strict fixture-index typing, a too-broad SQL-test regexp and the existing card
checker's six-right identity expectation were repaired and rerun. No checks
were left failing. Actual installed versions: Node24.21.0, TypeScript5.9.3,
oracledb26.0.0.

`oracle-attendance-live-check.mts` accepts **environment only**:
existing `SHF_ORACLE_CONNECT_STRING/USER/PASSWORD/CLIENT_LIB_DIR`,
`SHF_ORACLE_TEST_SCOPE_CONFIRMED=true`, new
`SHF_ORACLE_ATTENDANCE_SCOPE_CONFIRMED=true`, and explicit
`SHF_ORACLE_EXPECTED_DB_NAME=WFMT`, `SHF_ORACLE_EXPECTED_SERVER_HOST`,
`SHF_ORACLE_TNS_ENDPOINT`. Supply approved TNS_ADMIN/wallet/native PATH only in
the child environment. The checker has NO file/brief/credential parser.
The operator may bootstrap approved local references **in memory** and invoke
`node oracle-attendance-live-check.mts` in a child; never credentials in command
arguments, persistent environment, output files or logs.

Executed authorized CTIDBT_WFMT check via an in-memory operator
`node --input-type=module -` harness which spawned that exact checker, with
child-only environment. Initial identity gate correctly stopped before business
reads because TNS used an alias; independently DNS-verified alias/canonical-host
equivalence was added, then the bounded check **PASS**:

* Actual Node24.21.0, driver26 Thick, Client19.3; TEST database/session/host and
  TNS endpoint DNS verified **before** business reads.
* SELECT1;38-digit NUMBER; synthetic Hebrew; Gregorian leap date/full seconds
  mapping PASS.
* **1 scoped team,10 candidate keys,1 chosen civil day, limit2;2 returned rows**;
  bounded manual inclusive planned-start/split comparison (10 rows) PASS.
* Identity/context/list HTTP **200/200/200**, coherent Oracle source,
  exact list privacy allowlist and **one snapshot per new GET** PASS.
* **7 leases,7 read-only transactions,28 statements**; rollback/release,
  owned port0 listener closure and pool closure PASS.

Only flags/counts were output. No live row/ID/name/credential was printed,
saved, added to fixtures or Git. No existing listener4349/4319/4328/4320
interaction. Optional live detail was not requested using separately approved
IDs; fixture detail navigation was checked instead.

Not run/claimed: native fault injection, load/plan certification, deployed
VPD/grant review, production, legacy execution, writes, EMS/batch or browser/
RTL/a11y checks. DB/platform owners retain deployed-policy/query-cost/native
failure risks; frontend/QA own UI integration. No release/deployment approval
is inferred from these checks.

## F2 station arrival — approved isolated fixture v0.1 (20 October)

SHF-F2-API-20 implements the approved §§41–42 station flow against the
architect-owned `station-arrival-contracts.mts` v0.1. It is **disabled by
default**, is not a native Oracle feature, and does not establish CTI/device
readiness or real partner completion. Historical native F1/read-only results
above are separate evidence, not F2 live authorization.

### Explicit combined startup and integration

Use the existing `SHF_FIXTURE_CONFIG` and `SHF_FIXTURE_PORT`. Configuration must
explicitly contain **both**
`attendanceStageArrivalMode:"isolated-fixture"` and
`attendanceStationArrivalMode:"isolated-fixture"`, fixture source, synthetic
authentication with explicit Administrator opt-in, and local-development or
isolated-test-demo deployment. Existing `SHF_APP_ENV`/`NODE_ENV=production`
fail-closed guards remain in force. No dependencies or framework versions changed.

In combined mode, supply **only** `SHF_STATION_ARRIVAL_FIXTURE`, a JSON object
with exactly `stageRows` and `stationFacts`. `stageRows` uses the existing
`StageArrivalFactsV1[]` shape (see `stage-arrival-sample.mts` for synthetic
values). Each corresponding `stationFacts` entry has exactly:

```json
{
  "employeeId": "9001",
  "shiftDayId": "6201",
  "revision": "station-original-1",
  "stationArrivalUser": null,
  "stationExitUser": null,
  "stationLate": null,
  "flagPresent": false,
  "locked": false,
  "fullDayExceptionPresent": false,
  "overlappingShiftPresent": false,
  "policyRevision": "station-policy-1"
}
```

Both arrays must cover the same unique tuples (1–1000 entries). Explicit
booleans are fixture evidence, not facts discovered from a real database.
Unknown, duplicate, missing, unmatched or contradictory facts are rejected.
Combined mode rejects `SHF_STAGE_ARRIVAL_FIXTURE` and independent read fixtures;
F1-only mode still uses its original input. Oracle/native/disabled modes reject
F2 fixture input or origins before opening pools/listeners. No driver is loaded
on the combined fixture path and there is no live-to-fixture fallback.

Optional `SHF_STATION_ARRIVAL_ORIGINS` is its own JSON array of at most ten
distinct normalized loopback HTTP(S) origins (JSON ≤4096 bytes, each origin
≤128 characters). It is wired through actual startup to the HTTP handler.
Missing means `[]`; direct local calls without Origin remain supported.
For browser F1 and F2 use, configure **each** feature's own allowlist;
`SHF_STAGE_ARRIVAL_ORIGINS` does not authorize F2. No wildcard or Host inference.

Identity remains unchanged except for the approved ordered capability pair:
read-only **7**, F1 fixture **9**, native TEST F1 **10**, combined fixture **11**.
Combined mode adds `attendance-station-arrival:prepare` and
`attendance-station-arrival:commit` after the F1 pair, never the native-write
capability. Synthetic employeeId stays null. Both new rights are required for
commit; Administrator does not bypass scope or business validation.

### Consumer API and replacement seams

For `B=/api/v1/employees/{employeeId}/shift-days/{shiftDayId}/station-arrival`:

* `GET B/context` → `StationArrivalContextV1`.
* `POST B/validations` with exactly `{lateReasonCode:null|DecimalId}` →
  `StationArrivalValidationV1`.
* Explicit whole-command confirmation submits `POST B/commands` with
  `StationArrivalCommitV1` → `StationArrivalReceiptV1`.
* All successes are 200. There is no reset/status/retry endpoint, native station
  adapter, editable arrival time, late-minute override or remark field.

`createStationArrivalFixture(value, clock, zone)` returns one shared
`MemoryStageArrivalStore` and its existing detail/current/attendance read
projections. `store.station` implements the canonical
`StationArrivalContextPort & StationArrivalUnitOfWorkPort` over that same
owner. `StationArrivalApplication` exposes `context/validate/commit`;
`createRuntime` exposes `stationArrivalContext`, `stationArrivalValidate`,
`stationArrivalCommit` and `attendanceStationArrivalMode`. The existing bounded
HTTP handler/parser now recognizes both operation paths; no parallel server.
Canonical contracts and canonical tests are unchanged.

F2 allows **stage=NULL** and never auto-registers stage/briefing. Commit changes
station arrival/user/late fields and the shared row revision, preserving stage,
stage lateness, briefing, exit, missing/report facts and retained F1 receipts.
Window is inclusive `[plannedStart−60min, plannedEnd]`; lateness uses offset
zero, strict `now>start`, floor minutes (including late `"0"`). DST ambiguity,
invalid originals/Clock and unsupported dependencies fail safely.

Context, validation and human ACK/cancel have zero business/receipt/audit
effects. Token allocation is ephemeral. Fresh Clock, full original base+extra
facts, identity/grants, source/session, expiry, draft and warning minutes are
checked under the **same F1/F2 tuple reservation**. Tokens and receipt keys are
operation-separated. Combined preparation/receipt capacities are bounded;
receipts and memory audits expire together after 15 minutes. No durable or
cross-restart exactly-once claim.

Explicit AbortSignal **and** ambient ALS deadline/cancellation are checked at
the final synchronous pre-install guard. Station write, terminal receipt and
memory audit install as one snapshot. Pre-install cancellation is zero effects;
post-install response/cancellation uncertainty is
`COMMAND_OUTCOME_UNKNOWN/effect:unknown`, not a false rollback. UI must preserve
its approved volatile F1/F2 safety namespaces and must not automatically retry
or infer command completion from attendance. `partnerCompletion` is always
`"not-invoked"`.

### Evidence and isolated checks

Read-only controlling evidence:
`old/SHF/src/bzq/shf/model/AttendanceDataModel.java:1054–1115`,
`registerStation`: strict start-time lateness and station-only target fields.
The legacy UPDATE-before-warning and INSERT fallback are **not** reproduced;
the approved fixture flow requires warning/ACK before effects and an existing
attendance row.

From `backend/fixture-slice`:

```powershell
node --test test/station-arrival-contracts.test.mts
node --test test/station-arrival.test.mts test/station-arrival-http.test.mts
npm run test:stage-arrival
npm run typecheck
npm test
```

Focused F2 coverage includes station with null/pre-existing stage, preserved
F1 lateness/briefing, all blockers, strict DTO/transport/framing/origins,
actual bootstrap and coherent reads, capability modes, disabled/invalid/
production rejection before pools, no authentication error fallback,
cross-operation invalidation/reservation and token/receipt isolation, expiry,
minute boundaries, full-original comparison, restart/grant changes, shared
preparation saturation, DST/leap/overnight cases, atomic injected failures,
explicit/ALS cancellation and owned backend shutdown, and malformed/lost
command results remaining UNKNOWN. All fixtures/doubles are isolated and
synthetic; tests do not connect to Oracle or external partners.

Not run/claimed here: actual UI/backend integration, browser/RTL/a11y QA,
native TEST F1 or F2, database/DNS probes, load certification, production,
EMS/CTI, legacy execution or batch. Parent coordinates independent QA and
publication; this backend task is not whole-project/M1 completion.

## SHF-NATIVE-F2-API-28 — approved §46 native station arrival v0.1

This is a **separate, default-OFF** construction, not a change to fixture F2
or native stage arrival. Implementation approval is §46 v0.1 / §46.9,
28 October 2026 09:00 +02:00. It does **not** authorize operational execution.
Existing read7, fixture-stage9, native-stage10 and joint-fixture11 capability
arrays and inputs remain unchanged. The new exact ordered **native-station10**
is read7 + station prepare + station commit + station test-oracle-write.
Synthetic identity still has `employeeId:null`, identity source `oracle`,
and no credential verification. Business validation and exact J01 scope are
mandatory regardless of Administrator rights.

### Private construction shape (names only; never operator values)

The existing explicit `SHF_ORACLE_CONFIG` requires:

- `attendanceStationArrivalMode:"test-oracle-controlled"`;
- `attendanceStageArrivalMode:"disabled"` (explicit; no combined native writers);
- `dataSource:"oracle-read-only"`, `oracleTestScopeConfirmed:true`,
  `deploymentClass:"isolated-test-demo"`, `authenticationMode:"synthetic"`,
  `syntheticAdministratorEnabled:true`;
- explicit `syntheticOrgUnitIds` and `businessTimeZone`.

All existing read connection/port gates still apply. In addition require exact
`SHF_TEST_ORACLE_STATION_WRITE_ENABLED="true"`, a nonempty separate
`SHF_STATION_ARRIVAL_ORIGINS` JSON array of canonical approved loopback origins,
and these private environment keys:

`SHF_NATIVE_STATION_CONNECT_STRING`, `SHF_NATIVE_STATION_USER`,
`SHF_NATIVE_STATION_PASSWORD`, `SHF_NATIVE_STATION_CLIENT_LIB_DIR`,
`SHF_NATIVE_STATION_BINDING`.

The binding is an exact object with these required keys:

```text
operation = "native-station-arrival-v0.1"
marker, employeeId, shiftDayId, orgUnitId
readIdentity, writeIdentity
stationMetadataDigest
approval, freezeOwner, recoveryOwner
writerFreezeConfirmed = true
noExternalEffectsConfirmed = true
singleExecutorConfirmed = true
windowStart, windowEnd
allowanceFile
```

Marker/scalar/account/frozen-target proof semantics reuse the approved native
identity parser; no learned expectations, new resolver or bypass is installed.
Canonical UTC millisecond window instants must be ordered. The local external
operator allowance filename must begin `station-arrival-`, be separate from
F1, and pass the existing repository-boundary/ancestor/link/junction guards.
This operation-bound **single-attempt fuse** is not a receipt. Preparation
does not create it; a command spends it before acquisition, including failed
or UNKNOWN attempts. Keep its exact path across restart/new UUID. No reset,
replay, setup or automatic reconciliation API exists.

For omitted/`dba-v1` metadata provider, `stationMetadataDigest` is **not the F1 digest**: it is the existing canonical
SHA-256 fingerprint of `{operation, proof}`, with operation above and the
ordered results of exported `stationMetadataSql`. The optional private
`metadataProvider` field also supports explicit `owner-hybrid-v1` with the
versioned provenance certificate below. Operator certification must
cover the F2 table set, station time/user types, at least100 BYTE VARCHAR2 user
capacity, all attendance columns, keys, constraints, disabled triggers/VPD,
dependencies, grants and actual writer SELECT privileges. A matching digest
alone is not external-effects, freeze or live readiness certification.
The same immutable independently configured target/proof revision is required
for read, writer safety, locked transaction and independent readback; account
observations are checked separately.

Omitted mode is disabled. Missing/malformed flags, origins, private inputs,
mixed native/fixture inputs, both native writers, local-development native,
production or conflicting `NODE_ENV=production` reject before pool/listener
creation. Read-only mode requires flag absent/`false` and no station private
keys. Never enable writes just to obtain a healthy startup.

### Behavior and transaction limits

GET context and POST validations use plain-table read-only snapshots and no
legacy mutation helper. Native validation draft is exactly
`{lateReasonCode:null}`. Commands use the canonical native DTO, including
`confirmation:null` **and** `operationConfirmation:{accepted:true}`. Fixture
confirmation/late grammar cannot substitute. Shared strict transport rules
include duplicate/unknown-key rejection and denial of a present empty Origin.
Responses are no-store, source `oracle-test`, with the exact canonical F2
problem union and no Oracle/configuration details.

Only one existing synthetic marker-bound attendance row is eligible. Required
source facts include exact SHF_LOCKED text `"0"` (null/unknown invalid, `"1"`
deferred), effective day/overlay/employee and J01/G01 hierarchy, full attendance
originals, unapproved-report count, counts from **both** per-day exception
relations, and up to1000 complete effective employee-day candidates plus an
overflow lookahead. Discovery includes changed-employee overlays, with no
date-only filter that could miss an overnight interval. Discovery takes the
conservative baseline-or-any-changed-owner union and includes **all** overlays
for those days, so an overlay moved to another employee cannot hide duplicate
cardinality. Coherent moved-away days are validated before exclusion; the
1000 bound applies to this conservative candidate set. Duplicate,
overflow, invalid/unknown/full-day candidate evidence fails closed. Candidate
times must resolve uniquely in the configured zone; half-open overlap permits
adjacency and zero-length intervals. Any selected exception row, including a
partial exception, is conservatively unsupported; it is not labeled full-day.

On-time only: same business date, inclusive start−60min through start/end,
**offset0**, with full-instant start+1ms rejection. Stage may be null or a
coherent pre-existing pair no later than station; briefing NULL/0/1 is admitted
and preserved. Missing/report/flag/locked/split/P2/exception/stage-late/
station-late/exit/unsupported dependencies cannot acquire a ready token.
Tokens bind operation, private scope, identity reference, principal, zone,
complete facts and expiry; tokens from another application/source cannot pass.

A dedicated writer pool/UoW acquires short NOWAIT locks and rereads all facts.
The two-column UPDATE sets **only STATION_ARRIVAL_TIME and
STATION_ARRIVAL_USER**, with individually bound null-safe full attendance and
dependency originals, cardinalities and candidate-set predicates. No INSERT,
late/briefing/stage/mood/exit/report write, stored function, EMS/CTI, schema or
batch operation is included. Contextual writer exclusion remains an operator
freeze prerequisite, not a promise of cross-table serializability from hashes
or attendance-row locks.

Zero affected rows is stale after proved rollback; many/undefined is an
invariant failure, never success. Explicit AbortSignal and ambient ALS/budget
guards cover admission, final pre-DML and pre-COMMIT, including a fresh business
Clock check after UPDATE. Underlying SQL/COMMIT and native break/cleanup promises
remain owned during disconnect/shutdown; pools cannot close ahead of them.
Only COMMIT acknowledgement **and** a new independent identity-checked matching
full-preservation readback yield `oracle-test-committed`. Ambiguous COMMIT,
rollback or readback yields UNKNOWN/reconcile, never inferred success or
automatic replay. The native receipt is nonpersistent (`receiptPersistence:
"none"`); acknowledgement is not an exact commit timestamp or durable
attribution. Partner completion remains `not-invoked`.

### Narrow endpoint-role compatibility fix

The independently configured Oracle Net **endpoint** DNS labels may contain
internal underscores, preserving alphanumeric label boundaries and existing
length limits. **SERVER_HOST mappings remain strict hostname/IP grammar.**
Parser and bounded injected-resolver proof factory enforce the same distinction,
with exact spelling and unchanged equal complete nonempty canonical IPv4/IPv6
sets, alias/account/reference checks. There is no underscore-to-hyphen,
suffix/case learning or fallback. Syntax acceptance cannot fix actual
ESERVFAIL, timeouts, missing families or a mismatched physical target.

### Offline verification / operational handoff

```powershell
node --test test/oracle-station-arrival-contracts.test.mts test/station-arrival-contracts.test.mts
node --test test/oracle-station-arrival-domain.test.mts test/oracle-station-arrival.test.mts test/native-station-arrival-http.test.mts test/native-stage-arrival-identity.test.mts
npm run typecheck
npm test
```

These are static, synthetic protocol-double and owned-loopback checks only;
temporary fuses are created exclusively in owned isolated TEST temporary
directories and removed afterward. No real allowance is consumed. The installed
Node24/npm11/driver26 baseline is retained; operator-reported Oracle11.2.0.4 /
Client19.3 compatibility is not recertified by offline tests.

Operational GO, current complete endpoint target proof, identity/bootstrap,
actual F2 metadata/byte capacity/hidden-effects
certification, eligibility, operational freeze/window and a fresh separate
allowance belong to parent/operator. No live DB/DNS, production, DDL, broker,
legacy execution, credential-file access or frontend/browser checks are run or
claimed by this backend implementation.

## ROOTMETADATA compatibility follow-up — explicit owner-hybrid-v1

This approved internal compatibility fix changes only private metadata/configuration
handling. Public §46 v0.1 contracts, native capabilities, business eligibility,
two-column F2 DML, transaction/fuse/readback rules and default-off gates are
unchanged. It does not approve any database access, application startup or DML.

### Provider selection and mandatory identity

F1 and F2 private binding packets accept one **optional** field:

```text
metadataProvider: "dba-v1" | "owner-hybrid-v1"
```

Omitted means legacy DBA. Explicit `dba-v1` uses identical legacy queries and
digest formula. Explicit null/undefined, empty/unknown values and extra keys
are rejected, not defaulted. Provider selection survives F2's private F1
environment-validation translation. There is **no automatic ORA-00942 fallback**.

`owner-hybrid-v1` requires the independently expected writer account **and**
schema to be exactly `SHIFTER`. Before any dictionary query, the existing
frozen-target identity guard must establish actual `SESSION_USER=SHIFTER` and
`CURRENT_SCHEMA=SHIFTER`, plus the unchanged DB/host/instance-or-service proof.
Changing CURRENT_SCHEMA on a nonowner account is not sufficient. Read-account
identity remains independently checked through its existing binding.

### Exact nine-slot visibility contract

| Slot | owner-hybrid-v1 source / scope |
|---|---|
| 0 | USER_TAB_COLUMNS joined through USER_TABLES for the exact reviewed table set and `temporary='N'`; no unavailable OWNER column |
| 1 | USER_CONSTRAINTS for the exact table set; referenced owner/constraint retained |
| 2 | USER_CONS_COLUMNS for the exact table set |
| 3 | **Unchanged DBA_TRIGGERS**, `table_owner='SHIFTER'`, covering cross-owner triggers |
| 4 | USER_POLICIES for the exact object set; no invalid OBJECT_OWNER predicate |
| 5 | USER_TAB_PRIVS with `OWNER='SHIFTER'`, no grantor filter |
| 6 | USER_COL_PRIVS with `OWNER='SHIFTER'`, no grantor filter |
| 7 | **Unchanged DBA_ROLE_PRIVS**, writer **or PUBLIC**, not USER_ROLE_PRIVS |
| 8 | USER_DEPENDENCIES for the exact object set; no invalid OWNER predicate; external referenced owner/name/type retained |

These are seven USER-query slots plus two retained DBA-query slots. Projection
aliases, sorting, nine-array order, table scope, row bounds, required columns,
type/byte checks, enabled/validated constraints, disabled trigger/VPD rules and
actual zero-row writer SELECT probes remain in force. A missing required view,
error, malformed/overflow result, changed unreviewed facts or failed probe stops
certification. No USER_TRIGGERS/ALL_TRIGGERS substitution or fabricated implicit
grant rows is used. Owner UPDATE access remains recognized as before, not
relabelled as least privilege.

**Minimum retained DBA visibility:** the actual SHIFTER writer must still be
able to query both **DBA_TRIGGERS and DBA_ROLE_PRIVS** with these complete scopes.
The hybrid selector cannot cure their reported ORA-00942 failures. Availability
of the required USER views, especially their Oracle11 projection columns, must
also be verified by the operator. This implementation neither creates views
nor changes privileges.

### Reviewed certificate and preparation provenance

`oracle-stage-arrival-snapshot.mts:nativeMetadataQueries(tableScope, provider)`
defines the exact queries for either provider. Exported `nativeMetadataSql`
and `stationMetadataSql` remain the legacy DBA arrays. The safety consumers
select the explicit provider using their fixed F1 or F2 table scope; they never
recalculate and **accept** a replacement certificate at startup.

For owner-hybrid, use the existing canonical `fingerprint` over exactly:

```text
{
  version: "shf-native-metadata-v1",
  provider: "owner-hybrid-v1",
  owner: "SHIFTER",
  operation: "native-stage-arrival-v0.1" OR "native-station-arrival-v0.1",
  tableScope: ordered Object.keys(nativeTables) OR Object.keys(stationTables),
  proof: [slot0Rows, slot1Rows, ..., slot8Rows]
}
```

`nativeMetadataDigest(provider, operation, tableScope, proof)` implements this
private formula. Supply the reviewed exact result as F1 `metadataDigest` or
F2 `stationMetadataDigest`. Never reuse F1/F2 certificates, DBA/hybrid
certificates or a unit-test certificate. For DBA, the old F1 `fingerprint(proof)`
and F2 `fingerprint({operation,proof})` formulas are unchanged.

The private preparation/UoW construction reference now includes normalized
provider and the supplied certificate as well as the existing target/account
identity (and F2 operation). Provider, reviewed scope/digest or identity drift
requires a new consistent construction/preparation; an app and UoW with
different certificates cannot be combined. Omitted and explicit `dba-v1`
normalize identically. No application file or public DTO change was needed.

Synthetic-only example: an isolated double whose independently configured
writer and observed session are both SHIFTER may set `metadataProvider` to
`owner-hybrid-v1` and compute the envelope from **its synthetic nine arrays**
to exercise pure preparation. Such a digest proves nothing about TEST Oracle.
No live connection details, secrets, reviewed digests or allowance paths are
published here.

### Offline verification and current operator handoff

```powershell
node --test test/native-metadata-provider.test.mts
node --test test/native-metadata-provider.test.mts test/oracle-stage-arrival.test.mts test/oracle-station-arrival.test.mts test/native-stage-arrival-identity.test.mts test/native-stage-arrival-http.test.mts test/native-station-arrival-http.test.mts
npm run typecheck
npm test
```

Checks are synthetic/static/owned-loopback only. No live DB/DNS, grants, new
views, DDL, real allowance consumption, credential-file access or frontend
changes are included.

Current caller reports immutable OS/Oracle Net endpoint proof and native
non-host identity **PASS**; historical direct-DNS ESERVFAIL is not an Oracle
connectivity blocker. Current operational certification remains blocked by
missing visibility of the two retained DBA views above. Parent/operator owns
that visibility resolution, the current independent owner/identity proof and
reviewed provider-specific F2 certificate, followed by the unchanged eligibility,
freeze/window/allowance and separate operational GO gates. Offline tests do not
establish that those operational prerequisites are satisfied.

## Ordinary native station exit — §47 v0.1 (implementation only)

The exit-only path is independent of fixture commands and F1/F2 native command
construction. Its canonical DTOs are `station-exit-contracts.mts`; routes are
`GET .../station-exit/context`, `POST .../station-exit/validations` (exact `{}`)
and `POST .../station-exit/commands` (exact empty draft, token/fingerprint,
UUID and `operationConfirmation: { accepted: true }`). No warning confirmation,
manager override, client timestamp, cancellation, polling or receipt replay.
The source is **oracle-test**, never fixture command data or partner completion.

### Private operator configuration handoff (key names only)

`attendanceStationExitMode` defaults to `disabled`. Enabled spelling is
`test-oracle-controlled`, requiring explicit isolated TEST, Oracle read source,
confirmed test scope, synthetic Administrator opt-in, exact team grants, and
**both** arrival command modes explicitly `disabled`. The provider grants
exact ordered read7 + exit prepare/commit/test-oracle-write, with synthetic
principal employeeId **null**, not the selected employee. Existing read7,
fixture9, F1/F2 native10 and joint fixture11 are unchanged.

Private environment keys:

- `SHF_TEST_ORACLE_EXIT_WRITE_ENABLED` (exact `true` when enabled);
- `SHF_NATIVE_EXIT_CONNECT_STRING`, `SHF_NATIVE_EXIT_USER`,
  `SHF_NATIVE_EXIT_PASSWORD`, `SHF_NATIVE_EXIT_CLIENT_LIB_DIR`,
  `SHF_NATIVE_EXIT_BINDING`;
- `SHF_STATION_EXIT_ORIGINS` (separate nonempty exact isolated-loopback list).

Disabled mode rejects stray exit inputs; there is no exit fixture input.
Production/NODE_ENV production, DEV/local-development, malformed/mixed modes,
missing mock opt-in, foreign binding and missing/invalid Origin configuration
stop before pool/listener creation. Real authentication is not implemented and
authentication/configuration errors never fall back to Administrator.
No private values, credentials, actual certificate or allowance path are
provided here or accepted through the HTTP API.

`ExitBinding` uses the existing independently configured identity/proof,
marker/tuple/team, approval/window/freeze/recovery/exclusion keys, substituting
operation `native-station-exit-v0.1`, `exitMetadataDigest` and an external
`station-exit-` allowance basename. Same operator allowance must survive restart;
new UUIDs, refresh and process restart do not reopen an attempted operation.
Physical ancestry/junction checks and exclusive persistent single-attempt
creation reuse `NativeAllowance`; tests consume **only synthetic TEMP files**.

The exit certificate is separately versioned for **both** metadata providers:
`exitMetadataDigest(binding, proof)` hashes
`{version:"shf-native-exit-metadata-v0.1", provider, owner:"SHIFTER",
operation:"native-station-exit-v0.1", tableScope:Object.keys(exitTables), proof}`.
The ordered nine arrays retain the established query ordering. Owner-hybrid
still requires the actual SHIFTER user/schema and seven owner views plus
**DBA_TRIGGERS and DBA_ROLE_PRIVS**; unreadable/942 is a readiness failure,
never empty evidence or fallback. Arrival certificates cannot authorize exit.

### Rules, evidence and transaction semantics

- Controlling source: `AttendanceDataAction.agent_exit` integer division,
  `AttendanceDataModel.exitStation` existing-row/two-column UPDATE,
  `AgentDayBean.getShiftStart/getShiftEnd/getSiteId`, `SHFParameters`,
  `LoadTables.loadSiteUnitTable`, `ComplexCodeTable.getSystemParameters` and
  `SystemParameterForm.getValue`. Legacy code is read-only and was not executed.
- Full server Clock precision: early iff `now <= end-(B+1)*60000`.
  Ordinary is strictly greater, then bounded by start−60min, end+A inclusive,
  station arrival, TODAY and the operator window. DATE civil-second truncation
  happens **after** classification; no F1 offset or browser Clock. DST
  gaps/folds, malformed facts and arithmetic overflow fail closed.
- Actual unique effective site mapping and original system/default/unit rows
  determine B/A. Nonnull unit override else default; no guessed zero.
  Complete baseline/overlay/employee/org, candidate membership, both exception
  relations, reports and attendance originals are reread under NOWAIT ownership.
- Source/schema cross-check for this new path explicitly uses **LATE_*** for
  station lateness, not the existing F2 helper's `STATION_LATE_*` names.
  Historical `oracle-columns.csv` and controlling legacy source support
  `LATE_REASON_ID/LATE_MINUTES/LATE_REMARK`. Existing F2 is not changed here;
  its naming discrepancy is a separate architect/parent review item.
- Existing coherent station arrival is required; stage is optional. Preserve
  briefing NULL/0/1 and every other attendance column. Locked/missing/flag,
  either late triplet, unsupported/P2 dependencies, reports/exceptions/overlap
  defer; incomplete/coherence/cardinality errors do not become false flags.
- Dedicated short writer transaction uses parameterized SQL, autoCommit=false,
  full null-safe originals/cardinality/absence predicates and **SET only
  STATION_EXIT_TIME and STATION_EXIT_USER**. No INSERT, procedure/function,
  event/mood/report/briefing/late mutation, sequence, DDL, CTI or EMS.
- External named writer exclusion remains mandatory for cross-table eligibility
  inputs through readback/disposition. Row locks/hashes do not certify a freeze.
- Process-local in-flight/UUID conflict checks never replay a receipt and do not
  replace the restart-surviving external fuse. Explicit signal plus ambient
  ALS/deadline guards run immediately before UPDATE/COMMIT; underlying
  acquisition/query/commit/break/rollback/close promises are awaited/drained.
- rowsAffected0 is stale; 1 is only a commit candidate; many/undefined fail.
  Pre-DML errors have effect none; only proved rollback permits rolled-back.
  Unproved rollback, COMMIT ambiguity or missing/mismatched independent full
  identity-checked preservation readback yields UNKNOWN/reconcile, never retry
  or success. Bare existing exit is an observation, not a receipt.

### Offline verification

From `backend/fixture-slice`:

```powershell
node --test test/station-exit-domain.test.mts
node --test test/station-exit-contracts.test.mts test/station-exit-domain.test.mts test/oracle-station-exit.test.mts test/native-station-exit-http.test.mts
npm run typecheck
npm test
```

These are static, synthetic protocol, TEMP allowance and owned-loopback checks,
not live Oracle/OS/DNS verification. They include precise boundaries, stage and
briefing preservation, pure preparation, stale/cross-operation tokens,
source-policy/mapping/original predicates, rowcounts, contention/concurrency,
signal/ALS cancellation, COMMIT/readback uncertainty, metadata942 and shutdown
drain with an uncooperative COMMIT. Commands exit naturally; no forced exit.
No live writes, real allowance consumption or pilot is authorized here.
Caller reports the two retained DBA views still unavailable; operator/DBA owns
that operational prerequisite. Parent owns QA/checkpoint/scoped publication.
