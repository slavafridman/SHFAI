# SHF-F2-UI-20 — station arrival, isolated joint fixture only

Implements the approved §§41–42/F2 visual baseline v0.1 and the architect-owned
`backend/fixture-slice/station-arrival-contracts.mts` v0.1 (20 October approval).
No framework, dependency, lockfile or public-environment changes. Existing F1
fixture/native behavior remains separate; this is **not native F2**, M1,
deployment or completion of the externally blocked TEST F1 pilot.

The attendance row action appears only for the exact joint fixture identity
(11 ordered capabilities, synthetic actor/employeeId=null, exact team grant,
coherent fixture read source). Read7/F1 fixture9/native10 never expose F2.
Both explicit server modes and the joint fixture envelope are required; see
[backend F2 startup](../../backend/fixture-slice/README.md#f2-station-arrival--approved-isolated-fixture-v01-20-october).
There is no browser authorization toggle or live-to-fixture fallback.

Routes: `/station-arrival` is a chooser; the canonical selected route is
`/employees/:employeeId/shift-days/:shiftDayId/station-arrival`.
Direct entry/reload does not manufacture a selection/command. An attendance
selection or optional F1 review/success carries volatile context; F2 always
reads its **own fresh context**, never F1 preparation. Stage may be NULL.
Existing stage, briefing and other non-station facts are not edited.
Time/zone/window/minutes come from the server; no date, time, remark, device,
password, CTI or employee-ID input is added to the command page.

Pure validation → late warning/explicit ACK if required → whole-operation
review → explicit simulation confirmation. No automatic command or retry.
Pending, abort/navigation, transport loss, invalid receipt/source and stale
generation cannot produce fake success or zero-effect claims. A proven
`STALE_PREPARATION` requires explicit **fresh context** before another review.
The station-only receipt labels isolated memory receipt/audit and
`partnerCompletion=not-invoked`; it is not durable recovery/audit certification.

F1 fixture, F2 and native safety are separate:
`shfStageArrivalSafety`, `shfStationArrivalSafety`, `shfNativeArrivalSafety`.
History uses opaque `shfF1Safety`/`shfF2Safety`/existing native markers.
No actor/tuple, reason, token, fingerprint or receipt is serialized there.
Within a document only the dependent fixture tuple is cross-blocked; after
reload opaque unresolved markers conservatively block fixture work.
Known settlement is not resurrected by an older F2 entry in the same document.
There is **no browser reset/reconciliation/replay control**: an owner-started
fresh fixture process is a new demo, never resolution of an old outcome.
The prior native guard is not weakened.

### Focused and browser checks

Run from this directory after backend and frontend owners are source-stable:

```powershell
npm test -- --include='src/station-arrival*.spec.ts'
npm test
npm run typecheck
npm run build:production
npm run check:profile -- production
node checks/station-arrival-browser-check.mjs
node checks/station-arrival-browser-check.mjs --fixture-proxy
```

The browser checker owns **ephemeral port0 UI/backend listeners and an ephemeral
Chrome debugging port/profile**, and closes only those resources. Chrome must
already exist at `C:/Program Files/Google/Chrome/Application/chrome.exe`.
No installation, private environment, Oracle, DNS lookup or shared listener is
used. Without the flag it intercepts synthetic HTTP (including lost response);
with `--fixture-proxy` it uses the actual stable backend joint memory store,
runtime and HTTP adapter, **without interception**. Both use the production
Angular artifact, synthetic facts only. Generated screenshots remain under
ignored `.angular/browser-evidence/F2-*-SYNTHETIC.png`.

Browser checks cover desktop/mobile RTL, dialog keyboard trap/Escape, exact
opener and nearest visible focus, screenshot-pixel ring contrast, reduced
motion, origin filters/vertical/RTL scroll/Back/Forward and UNKNOWN/reload.
They are not full WCAG 2.2 AA conformance, manual AT or real-native proof.
See [verification and limitations](VERIFICATION.md).

# SHF-NATIVE-ARRIVAL-UI-20 — existing Angular F1 + controlled TEST mode

## SHF-ENV-PROFILES-20 — public build profiles

Uses the approved installed Node24.21.0/npm11.19.0, TypeScript5.9.3,
Angular21.2.25, Material/CDK21.2.14, existing CLI/build21.2.27 and lockfile.
No dependencies, installs, parallel toolchain, Docker/WSL or CI were added.

From this package directory (PowerShell or another npm-capable shell):

```powershell
npm run typecheck
npm test
npm run build:dev
npm run check:profile -- dev
npm run build:test
npm run check:profile -- test
npm run build:production
npm run check:profile -- production
```

`build:dev` selects Angular's existing `development` configuration;
`build:test` selects `test`; `build:production` selects `production`.
`npm run build` remains the unchanged default production build, with existing
budgets, optimization and Material styles preserved. Every build replaces the
same `dist/fixture-slice/browser` output; inspect it **before** the next build.
`npm start` still serves DEV on loopback with the existing proxy, not a new
server or production deployment. No remote proxy/CORS access is provisioned.

`src/environments/environment.ts` defaults to production;
`environment.dev.ts` and `environment.testing.ts` are Angular replacements.
The TEST filename intentionally avoids the runner's `*.test.ts` discovery.
Their frozen typed public object has **only**:

```json
{ "appEnv": "production", "apiBasePath": "/api" }
```

DEV/TEST differ only in `appEnv`. All API requests use this same-origin,
relative `/api` base, including arrival calls. No production bundle points at
localhost. These names are build metadata, **not** backend identity/source,
verified credentials, authentication, roles, capabilities, TEST marker or
write enablement. There is no visible environment badge or new UI behavior,
no private-config fetch, no `process.env` forwarding and no public secret keys.
Authorization still depends on the existing validated server identity/contracts.
An arbitrary browser flag cannot enable backend/native write rights.

`check:profile` inspects the three public source literals and the emitted
application/shared chunks for exactly the selected two-field object and
relative `/api`; secret/native config fields must not occur in that object.
This is a **bounded public-module/build-shape check**, not a claim to scan
all business explanatory text for Oracle words or certify the whole bundle.
All three builds plus the unit suite are synthetic/offline checks, not a real
Oracle/native pilot, browser accessibility certification or production release.

The backend independently requires exact server-only `SHF_APP_ENV`
(`dev|test|production`) consistent with its explicit `deploymentClass`; absence
preserves its old explicit source configuration, never an implicit DEV default.
See [backend profile quick start and sanitized JSON examples](../../backend/fixture-slice/README.md#shf-env-profiles-20--dev--test--production).
DEV is explicitly isolated fixture/synthetic only; TEST defaults to read-only
Oracle with separately supplied private scope/secrets, while isolated fixture
QA is also allowed. The examples' empty secret/grant placeholders fail unless
the authorized operator supplies actual configuration. Never bundle/copy
private Oracle values into these modules. Native TEST remains default-off and
requires its existing double opt-in, private grants/marker/window/external
allowance and exact loopback frontend Origin. None is supplied by a build name.

**Production build support is not production startup readiness.** Backend
production rejects synthetic/fixture/F1/native TEST context and otherwise
explicitly stops with `Real authentication provider not configured`; no
Administrator fallback and no production DB connection. Real authentication,
approved production Oracle configuration, HTTPS external reverse proxy,
secret management and infrastructure are separate owner prerequisites, not
created here. Local config overrides/logs remain ignored under `config-local/`,
`logs/`, `*.log`; no secret-file loader or generated environment file exists.

## Current delivery: approved §43.5 / §43.7 / §45 v0.1

### Independent-QA follow-up: UI-D01 / UI-D02 (20 October)

Both confirmed focus defects are fixed; developer retest PASS, ready for the
same independent QA's bounded two-defect retest before publication. API/design
versions and business behavior are unchanged.

* Arrival buttons have scoped `3px solid #002f65` keyboard outlines with3px
  offset. Only arrival dialog overlays opt into `.shf-arrival-dialog`; Material
  overlays are outside the component style boundary. No generic Material global
  override or `!important`. Aria-disabled uses separate foreground/background
  treatment, not opacity on the button/ring; same DOM/duplicate-submit guards.
* Native dialog auto-restore is disabled. Exact-opener restoration follows
  Angular `afterNextRender`, with measured sticky-header/ring margins and
  `scrollIntoView(nearest)` only if outside the usable viewport. Result callbacks
  only reveal a node that still owns focus; changed generations, departed views
  and user navigation do not receive stolen focus. No timer/poll/magic Y offset.
* `node checks/native-arrival-browser-check.mjs --focus-retest` checks all
  1440×900/390×900/320×900-font30 review/Cancel/enabled final-confirm/pending/
  SUCCESS/UNKNOWN states. It measures exact focus, full ring bounds, hit-testing,
  ancestor opacity, solid outline and **actual screenshot ring/adjacent pixels**,
  not nominal computed width alone. Measured contrast12.5332:1 in dialog and
  12.6179:1 on opener; all required states pass≥3.
* Focused component/generation checks87/87; complete suite430/430
  (original427+3 focused regressions). Typecheck/build and native interception/
  typed HTTP stub pass. See current `VERIFICATION.md` follow-up for measurements.

Native frontend support reuses the existing F1 route/layout; it does **not**
implement a writer or grant access to Oracle. Canonical DTOs are imported
**type-only** from `backend/fixture-slice/oracle-stage-arrival-contracts.mts`
and the unchanged fixture companion. No dependency installs/upgrades, new
application, identity fields, read DTO fields or deployment tooling.

| Explicit server identity | Arrival mode / public sources | UI behavior |
|---|---|---|
| Ordered read7, including `dataSource=oracle` | Read-only; list `oracle-read-only`, detail `oracle` | Existing seven read views; no arrival command controls |
| Ordered read7 + prepare + commit =9, synthetic/null employee, fixture identity | F1; `isolated-fixture` throughout | Existing simulation/warning/fixture receipt, unchanged |
| Same ordered9 + `attendance-stage-arrival:test-oracle-write` =10, synthetic/null employee, identity `oracle` | Controlled TEST; reads remain Oracle; arrival context/validation/receipt `oracle-test` | Actual TEST-write disclosure, on-time/null-draft only, whole-operation confirmation dialog |

Neither Administrator role text, browser settings, selected employee nor a
failed Oracle request can select/enable native mode. No nine-right identity
requirement is erroneously applied to native10. Missing/malformed identity,
wrong sources, reordered/partial/extra rights (including future F2) fail closed.
Selection must originate from the coherent authorized attendance row. Cold
direct routes without the volatile selected row remain a chooser. Backend
admission alone binds the private allowlisted synthetic marker, exact resource,
grants, before-image, current policy/window and operator allowance; the UI cannot
change that scope. No private key, before-image or raw write-account field was
added to any public DTO.

### Native operation and honest outcome

The same GET `…/stage-arrival/context`, PURE POST `…/validations`, and POST
`…/commands` paths are used. No fallback/status/retry/reset endpoint. Native
PURE request is exactly `{lateReasonCode:null,lateRemark:null}`. Ready responses
have no warnings/reason catalog/late overrides. No arrival date/time or client
clock input exists; all full local date/seconds/zone values are server-owned.
The client only measures elapsed token lifetime using a monotonic clock.

Whole-operation review identifies selected employee/day/team, planned range,
current stage NULL → proposed server time, TADREECH NULL/0 →0, and protected
server-side synthetic operator stamping. Its raw stamp is not public, so it
is not invented/displayed. A Material dialog requires the checkbox **and**
explicit final button. Native command adds exactly
`operationConfirmation:{accepted:true}`; inherited `confirmation:null` is
**not** whole-operation consent. Cancel/Escape discard preparation, send no
command or automatic API read/prepare, and retain the exact focusable opener.
New explicit preparation is required. Native late/ineligible/expired requests
are refused, never converted to F1 late actions or backdated.

Native success requires a strictly matching `oracle-test-committed` /
`oracle-test` receipt, three public recorded fields, COMMIT acknowledgment
timestamp and independent matching-readback timestamp in the canonical shape.
The frontend validates the backend attestation; it does **not** independently
read Oracle or expose a private operator stamp. `replayed=false`,
`receiptPersistence=none`, `partnerCompletion=not-invoked`; there is no durable
receipt/global exactly-once/partner-completion claim. Native success is never
labeled simulation. Fixture success remains explicitly simulation.

Before POST, a native opaque `{commandId,kind:"stage-arrival",
mode:"test-oracle-controlled"}` marker enters history **and tab sessionStorage**
(`shfNativeArrivalSafety`). No employee/name/team/actor/token/fingerprint,
payload or receipt is serialized. SessionStorage carries ONLY this conservative
blocker across full-document source/config switches as well as reload; it is
not a personal cache or authorization source. F1 keeps its existing UUID history
marker. A pending/UNKNOWN native attempt globally blocks new context/prepare/
command for both native and fixture selections, including10→9→7→10. There is
no reset UI, new-demo advice for unresolved native outcomes, automatic recovery
or inferred zero effect. Corrupt/unavailable native safety persistence fails
closed. Back/Forward never restore consent/preparation/receipt or auto-submit.

Only an exactly bound valid receipt or definitive canonical none/rolled-back
response resolves the active attempt; changed identity/source/grants during
flight cannot clear it. A known native success is terminal for the same
employee/day in the current service even after actor/unit changes. After
restart the backend current-stage/token/consumed-allowance checks remain
authoritative. No durable replay/reconciliation service is invented. New tabs,
cleared browser storage and cross-instance/crash durability cannot be secured
by a frontend marker; operator/backend admission remains required.

### Environments and verification boundary

Frontend selection is entirely from approved public identity + coherent
read/context sources, not a frontend environment variable/local privilege flag.
Deployment support remains a backend/operator delivery requirement:

* **dev:** explicitly isolated fixture sources and synthetic authentication.
* **test:** separately configured server-side Oracle accounts/secrets and
  independently enabled scoped `test-oracle-controlled` admission; reads stay
  read-only. Private marker/window/allowance checks remain server-owned.
* **production:** real authentication and public configuration are prerequisites;
  synthetic auth/TEST commands must be rejected server-side, without dev/test
  fallback. This frontend does not create new deployment configuration/schema
  or claim that a synthetic login verified credentials.

QA here uses **synthetic HTTP interception for native mode**, not actual
Oracle/native-adapter execution. F1 proxy checks use the actual isolated
memory fixture runtime and cannot establish native persistence. A real native
UI→prepare→confirm→COMMIT/readback of the approved synthetic TEST tuple is
**NOT RUN** by this frontend owner. Backend/operator/QA must first establish
current eligibility and actual authorized attendance-list reachability; do not
substitute a test double to close that live evidence gap. See `VERIFICATION.md`.

Native browser reproduction (free owned ports only; stop helper after check):

```powershell
npm run typecheck
npm test
npm run build
# separate attached helper process, no API proxy:
node checks/serve-stage-arrival.mjs --port=4406
node checks/native-arrival-browser-check.mjs
```

For a separate **typed synthetic HTTP stub**, without Fetch interception, stop
the4406 static helper and start these two owned helpers instead, each in its
own attached process. This does not start the native backend or access Oracle:

```powershell
node checks/serve-native-arrival-double.mts --synthetic-native-http-double
node checks/serve-stage-arrival.mjs --port=4406 --native-http-double-proxy
node checks/native-arrival-browser-check.mjs --http-double
```

The stub is on4407, with canonical type-only DTO imports, invented employee/day
and fixed Clock/receipt values. Its counters are synthetic acceptances, **not
COMMITs or database effects**. The check proves normal same-origin HTTP
GET/POST/POST, consent/cancel/pending focus, exact source receipt and updated
synthetic detail/list with exact attendance-return opener/filter preservation.
It does not prove the parallel native adapter, private bindings, grants,
transaction/cancellation or actual readback.

Backend handoff received: `ba8f` READY OFFLINE420/420, as relayed by caller, not
rerun by this frontend owner. Backend README and
`native-stage-arrival-config.mts` were read for the exact **operator-owned**
configuration schema. All read/write account values, independent identity and
metadata binding, ownership/freeze attestations, UTC window and external
one-attempt allowance path stay server/operator-only. No such private packet or
path is bundled in frontend configuration, DTOs or fixtures. Preserve the same
operator allowance across restarts; browser reset/new UUID cannot reopen it.
The prepared `_B` eligibility window is expired per handoff: real current
eligibility/list reachability must be revalidated by the operator, never
backdated or replaced by this stub.

Chrome runner owns9406/random profile; public user ports are not used. Evidence
is synthetic-only `.angular/browser-evidence/NATIVE-*-SYNTHETIC.png`. Helpers/
profiles are cleaned up after checks. No full WCAG conformance assertion.

---

# Historical SHF-F1-UI-20 baseline (fixture-only delivery)

The following records the earlier F1 implementation and its prior approval/
verification boundaries. Statements that native DML was not approved describe
that historical step, not the subsequent bounded §43/§45 implementation approval.

## Approved F1 v0.1 / implementation boundary (20 October 2026)

Authority: approved design §§38/39 including **39.7**, HTML
`#stage-arrival`, canonical approval **§40 v0.1** (user20Oct11:19), and the
**§40.5 internal compatibility erratum** (public DTOs/operations unchanged).
Canonical wire names are imported **type-only** from
`backend/fixture-slice/stage-arrival-contracts.mts`. No read DTO fields,
identity fields, dependencies, backend files or legacy files were changed by
this frontend task. Angular21 / Material21 / TS5.9 and Node24 remain installed.

The new actual Angular route is
`/employees/:employeeId/shift-days/:shiftDayId/stage-arrival`.
Enter through an explicit **fixture attendance result row**. A cold route without
the volatile selected row shows an attendance chooser, not employee-ID inputs or
a default employee. Null inquiry actuals do **not** prove attendance-row existence:
the canonical context must explicitly admit F1; `ATTENDANCE_ROW_REQUIRED` and
already-recorded contexts have no validation/command control. No automatic
attendance INSERT, optimistic row update or Oracle view mutation exists.

F1 controls require the exact ordered **nine** actual capabilities, synthetic
actor with `employeeId=null`, `dataSource=isolated-fixture`, exact selected team
grant and coherent row/context/source. The two new capabilities are independently
`attendance-stage-arrival:prepare` and `attendance-stage-arrival:commit`.
The existing **seven** read capabilities remain valid, including Oracle identity
source `oracle` / list source `oracle-read-only`; that mode never enables F1.
Administrator text, browser state and selected employee never grant authority.
The backend remains responsible for authentication, capability and business rules.

Exactly three operations, no queries:

| Operation | Meaning |
|---|---|
| `GET …/stage-arrival/context` | Source-bound read-only context |
| `POST …/stage-arrival/validations` | PURE `{lateReasonCode,lateRemark:null}` |
| `POST …/stage-arrival/commands` | Only explicit **אישור סימולציה**, once per attempt |

The client checks canonical unknown values atomically, success status/media/
no-store/nosniff and bounded serialized DTO sizes; tokens/receipts/context/actor/
grants/draft/warning/time binding must still match before action and delivery.
Requests have a5000ms budget and no retry/polling/cache. Tokens never enter URLs,
history, logs, Web Storage, IndexedDB or cookies.

### Time, warning, review and volatile result semantics

All business times/minutes come from the server. Planned/existing/evaluated local
timestamps include seconds and the server's business zone; UTC expiry is labeled.
No arrival date/time picker, browser-derived lateness, editable minutes or private
free-text field exists. Optional canonical remark is always explicitly null.
Reason options are only the returned catalog. The browser measures **elapsed**
token lifetime conservatively with its monotonic clock, never business time.
The isolated browser fixture uses a clearly synthetic fixed server clock;
normal backend commit time is freshly sampled by the backend, not supplied by UI.

Pure validation or late-warning acknowledgment performs **zero commands**.
Unchecked/generic/stale acknowledgment is rejected. Material warning Cancel/
native Escape discards preparation, preserves the reason and restores its exact
opener. Acknowledgment opens whole-operation review, never submits. Final confirm
is a separate button, not a form submit/implicit Enter handler. Pending button
uses aria-disabled plus a synchronous handler guard and keeps its DOM/focus.

Only a matching `fixture-committed` receipt is success, with
`partnerCompletion=not-invoked`: **not real arrival, Oracle DML, real
authentication, durable audit or partner completion**. No native DML is approved.
Malformed/wrong-source/wrong-media command success, unproved transport/5xx failure
or canonical unknown remains **UNKNOWN**, with no success or confirmed-zero claim.
Canonical proven-none/rolled-back failures are distinct and never automatically
retried; stale preparation requires explicit validation/review again.

### UNKNOWN / history / starting another demonstration instance

BEFORE sending a command the client writes a minimal history safety marker:
opaque UUID attempt(s) only, no employee/name/team/token/draft/receipt values.
The in-memory actor/source/tuple binding stays separate. App navigation and
Back/Forward conservatively propagate/merge unresolved markers. Reload with lost
volatile context/token/receipt shows **RECOVERY REQUIRED** and does not prepare.
Because the opaque marker contains no personal tuple, recovery conservatively
blocks **all F1 selections** in that history context, including the unresolved
same tuple. Ordinary chooser navigation cannot turn UNKNOWN into ready/zero.

There is deliberately **no reset/retry/status/lookup endpoint or local reset
button**. The UI cannot prove that clearing local state reset the backend.
An operator must explicitly start a genuinely separate isolated fixture process/
application instance for a new demonstration; the old UNKNOWN tab stays unresolved.
Starting another instance is not reconciliation, redo, undo or proof about the
old operation. No automatic source/session switch is inferred from identity.
The guard is bounded to the retained browser history context, not cross-tab/global
or durable protection; a new tab, discarded history or process loss supplies no
durable idempotency proof. Server tokens/receipts are process-local and volatile.

### Local checks and ready-to-relay fixture proxy helper

Run from `frontend/fixture-slice` with the **existing** installed dependencies:

```powershell
npm test -- --include=src/stage-arrival-contract.spec.ts --include=src/stage-arrival-page.spec.ts --include=src/stage-arrival-generation.spec.ts
npm test
npm run typecheck
npm run build
node checks/serve-stage-arrival.mjs
# In another shell; creates/closes only its own Chrome/profile on9398:
node checks/stage-arrival-browser-check.mjs
```

Only owned free loopback ports4388(UI),4398(fixture backend) and9398(CDP) are used.
Never reuse an occupied port or stop a user application. Existing Oracle/user
instances4350/4349/4319/4328/4320 are not targets.

**Real fixture proxy now PASS after parent READY for §40.5.** All three native
Chrome hints (`sec-ch-ua`, `sec-ch-ua-mobile`, `sec-ch-ua-platform`) were observed
unchanged on F1 requests. No header stripping, browser-feature workaround or API
interception is used. The earlier context400 failure remains in VERIFICATION.
The prepared helper uses the backend's actual sample configuration including
`attendanceStageArrivalMode:"isolated-fixture"`, coherent snapshot/store/readers,
synthetic opt-in and an explicitly injected fixed test Clock. The executable
backend's separate opt-in input is `SHF_STAGE_ARRIVAL_FIXTURE`, with
`SHF_FIXTURE_CONFIG`; never supply Oracle settings or mix the old read fixtures.
Parent's final READY reports focused113/full336/strict backend PASS (caller
evidence, not rerun here). Use separate owned shells:

```powershell
node checks/serve-stage-arrival-fixture.mjs --isolated-fixture --scenario=clean
node checks/serve-stage-arrival.mjs --fixture-proxy
node checks/stage-arrival-browser-check.mjs --fixture-proxy --scenario=clean
```

Do not run the static and proxy helpers simultaneously on4388. These helpers
have no production control/reset endpoints and never read inherited environment/
credential files or acquire an Oracle adapter. The browser proxy driver does not
intercept API calls. Its context must actually be admitted, or it stops explicitly
instead of inventing ready data. It configures the existing exact
`stageArrivalOrigins` allowlist for the UI origin4388. Stop the owned helpers
afterwards.

Repeat with **matching** `--scenario=late`, `unknown`, `stale`, or `expired` on
fixture helper and browser driver. Each scenario is an explicitly new owned
fixture process and Chrome history/profile; stop only the prior owned helper.
These switches exist in test scripts only, not StartupConfig, HTTP query/body,
production controls or reset endpoints. They use the canonical injected Clock
and existing isolated MemoryStore fault/revision seams:

* clean: cancel0, PURE0, explicit UI confirm1, actual readback; explicit
  **test-only KNOWN receipt replay** after server-token expiry adds1 HTTP POST
  but no additional stage/receipt/audit. This is not application retry behavior.
* late: native warning Escape0, reason preserved, checkbox acknowledgment/review0,
  explicit confirm1, actual attendance/already-recorded-context readback.
* unknown: fault **after atomic installation** returns canonical503 UNKNOWN.
  Actual stage/receipt/audit exist, but UI never claims success/zero. Reload and
  chooser/same tuple remain blocked with no new context/validation/command.
* stale/expired: revision conflict or injected server-token expiry returns409,
  stage/receipt/audit remain0/0/0, no automatic validation/command.

Known successful tuples may reread canonical already-recorded context without
being mislabeled UNKNOWN; they still cannot prepare or register again.
The real readbacks use existing attendance/detail projections of the SAME
snapshot, not an operation-status endpoint and not an Oracle view.

The real sample's explicit attendance inquiry uses20Oct2026 /10:30–10:30
(planned start), not10:00; the earlier10:00 empty result was honest and was not
auto-filled. The F1 sample installs only coherent attendance/current/detail read
projections. Optional search/schedule/items/card adapters are not installed there
and must fail honestly; their ordinary seven-capability fixture/browser suites
remain separate and unchanged in capability meaning.

`checks/stage-arrival-legacy-check.mjs` wraps the existing native Chrome driver
on the same owned UI/CDP ports. Existing `SHF_ATTENDANCE_ONLY`, `SHF_CARD_ONLY`,
`SHF_ITEMS_ONLY` select its original specialized checks. Only synthetic ignored
screenshots live in `.angular/browser-evidence`. Nothing is published.
See the newest VERIFICATION section for measured results and historical failures.
Keyboard/geometry checks and sampled visual review are **not full WCAG conformance**;
screen reader, complete contrast/zoom/AT and live Oracle checks are not claimed.

---

# SHF-ATTENDANCE-UI-19 — historical actual Angular attendance inquiry

## Latest root correction — whole keyboard-modal readiness / cold CDP focus

The initial calendar Escape had bypassed the narrower picker lifecycle checks.
The stock runner now applies one common barrier **before every native modal
Escape**, not a new per-assertion wait:

- create a new owned CDP page instead of selecting an arbitrary `/json/list`
  tab; activate with `Page.bringToFront` and require actual document focus;
- native input/mouse/key entry uses that active page; calendar toggles use the
  real focused button + native Enter;
- require focus in the intended live calendar/select/dialog,0 finite opening
  animations,3 stable geometry frames and coherent aria/open state;
- inspect the installed CDK body-keydown/native cancel listener, then record
  trusted native Escape keydown/keyup delivery. No recovery key or fake focus.

Source evidence: Material datepicker `close()` intentionally returns while
`_isAnimating` is true. Both independent cold runs actually started with
`document.hasFocus=false` and observed an initial calendar opening animation.
They now send its **single Escape only after readiness**.

Bounded developer result: **cold FULL A PASS**, **one review-only PASS**,
**cold FULL B PASS**, with two different newly created Chrome user-data
profiles. FROM/TO still use exactly the two separate select/dialog Escapes.
All62 physical dates/corners and D01 focus criteria pass in each run.
All relevant helper regressions **20/20 PASS**, strict typecheck PASS.
No application/CSS/API/dependency change or broad suite/Oracle rerun.
SAME QA owns the final stock-full retest; see VERIFICATION for source/trace
evidence, preserved failed history, exact bounded checks and teardown.

## Latest narrow correction — select Escape, then dialog Escape

Independent QA has closed D01/D02/H02. Its remaining full-runner finding was
two Escapes dispatched back-to-back while a Material select was still closing.
This is fixed **only in the checker**, with no application/CSS/API change.

`checks/picker-overlay.ts` observes this picker's exact panel/aria/focus and
scoped finite animations. After the first native Escape, the select panel must
be absent, `aria-expanded=false`, actual focus back on `picker-minute`, and
finite select/dialog animations complete for2 consecutive rAF observations.
Only then does the second native Escape close the dialog; removal, exact opener
focus and the opener's afterClosed-driven `aria-expanded=false` are required.
Deadline5000ms; no sleeps, retries, Cancel button or extra third Escape.
The earlier hour-select Escape is its original separate preparatory check.

Final bounded sequence **full attendance PASS → review-only PASS → one fresh
full attendance repeat PASS**. Both FROM/TO values remain unchanged after the
two-key select/dialog cancellation. Each run retains31+31 physical calendar
selections,≥44px/corner assertions and the D01 focus checks.
`npm test -- --include src/picker-overlay.spec.ts`: **3/3 PASS**;
`npm run typecheck`: **PASS**. No broad old suite/Oracle rerun.
See [VERIFICATION.md](VERIFICATION.md) for preserved failures and the SAME-QA
final narrow full-runner handoff. No new approval/contract gate.

## H02 follow-up — measured calendar readiness, no application/CSS changes

Latest independent QA closed **D01/H01** and confirmed292/strict/build/old
browser/proxy modes. Its remaining finding was **H02**: the calendar checker
sampled opening animation, not a confirmed new application layout defect.

The stock bounded/full attendance runners now share
`checks/calendar-geometry.ts` on **every calendar open**:

- only the actual popup/calendar and positioning ancestors are observed;
  finite entry/month/cell animations finish first, infinite ripples are ignored;
- current month, focused day and any aria-active descendant must agree;
- the same cell nodes, exact rects and corner hit-test state are stable for
  **3 consecutive rAF samples**, with a **5000ms rejection deadline**;
- the original **≥44×44** and four-corner assertions are unchanged. Stable
  undersize/clipping is returned as failing data, never polled until it passes.

Native Enter activates the real focused Material toggle; all31+31 date
selections remain physical mouse clicks. Final stock **full attendance and
review-only PASS**: each selected31 normal +31 root/main/calendar30px dates,
minimum45.703125×45.6875px,0 corner failures,0 finite animations at measurement.
Six focused checker regressions and strict app typecheck PASS. The pre-H02
full292/build were not rerun for this test-driver-only change; no new aggregate
full-suite pass is claimed.

Same independent QA owns D02 closure/retest; publication is not implied.
See the latest [VERIFICATION.md](VERIFICATION.md) entry, including failed
historical animation sampling and the additional stock-opener diagnostic.

## Independent-QA correction — UI19-D01/D02

Implemented the two confirmed findings under the same approved §35/36/37
v0.1 baseline; no contract, business-rule, navigation-history or dependency
change:

- Scoped reload `:focus-visible` outline: **3px**, offset3px, **12.62:1**
  against #fafafa. Actual Tab/Space tests at1440/320 retain the same DOM node
  through pending→200/503, send only one GET and keep the ring unobscured.
- Attendance-only **Material touch datepicker**, public
  `panelClass="shf-attendance-calendar"` and scoped portal stylesheet.
  At320px CDK block-scroll frees the reserved scrollbar: client305→320,
  real day targets **≥45.70×45.69px**. All31 dates were physically clicked
  at normal and30px root/main/calendar text, with corner hit-tests against
  scrollbar clipping, no offscreen targets or page overflow. Existing search
  picker stays296px; no global calendar resize.
- Root runner fix: effective `:disabled` (including fieldset ancestry), enabled
  submit, completed context/progress and expected server defaults before entry.
  Shared physical Ctrl+A/insertText/Tab blur verifies Angular acceptance and
  rendered DOM. No arbitrary delay, assertion skip or operator-only workaround.
  Full navigation in the proxy runner also crosses a new-document barrier.
  Four regression cases cover delayed identity/context and inherited disabling.
- Stock attendance → base → card → items → items-review runners pass **chained**,
  including original09:00/date assertions. All actual fixture-proxy flag
  variants pass without interception; card proxy additionally verifies the
  authoritative outgoing date/minute and accepted applied response.

Developer retest is PASS; **the same independent QA owns the bounded retest**,
not a new approval gate. Failed historical runs and corrected test-development
attempts remain in [VERIFICATION.md](VERIFICATION.md).

## Approved baseline — 19 October 2026

Implemented **§35/36 v0.1 + existing HTML `#attendance`**, approved by the user
at 13:46 and recorded in **§37 v0.1**. Type-only canonical imports are from
`backend/fixture-slice/attendance-contracts.mts`. The exact synthetic identity
now requires the prior six capabilities followed by **`attendance:read`**;
missing, duplicate or reordered synthetic rights fail closed. Real-provider
capabilities remain independent; Administrator role alone grants nothing.
Synthetic `employeeId=null` is never the selected employee.

The existing Angular **21.2.25**, Material/CDK **21.2.14**, TS **5.9.3**,
Node **24.21.0** / npm **11.19.0** stack is retained. No dependencies, manifest,
lockfile, scaffold, backend, shared contracts, design, legacy or root files
were changed. Historical implementation records below retain their original
six-capability baseline; this section supersedes that count for current usage.

- New navigation group **נוכחות → בירור נוכחות**, route **`/attendance`**.
  Exactly two new resource GETs: `/api/v1/attendance/filter-context` and
  `/api/v1/attendance`; identity and existing linked resources are unchanged.
  Neither attendance resource is called without validated independent rights.
- One strict Gregorian DD/MM/YYYY Material datepicker and two independent
  all-minute HH:mm Material dialogs. Defaults come exclusively from context.
  Equal bounds are valid; inversion is an associated TO error, not midnight
  rollover. The helper explains planned start **OR split restart**, inclusive
  at seconds00, **not actual arrival**. No current/NOW control or auto-polling.
- Exact scoped moked/team/internal-job/location filters; parent changes retain
  compatible teams only. Empty location selection is omitted, not an invented
  home/site default. Catalog changes retain unavailable selections for explicit
  correction, without widening scope.
- Twelve source-mapped columns reflow to labeled mobile records. Planned
  endpoints/location/activity/job are separate from independently nullable full
  local stage/station-arrival/station-exit timestamps. Raw missing-reason
  NULL/0/negative and briefing NULL/false/true remain distinct, never a factual
  absence/late/current-worker status. Unknown activity labels retain exact codes.
  No private HR/reference/user fields, write buttons, export, CTI or EMS.
- Strict atomic unknown-payload guards validate source/zone/applied filters,
  pagination/order/own day IDs, exact J01/direct-G01 hierarchy, bounds and nested
  row shapes. They deliberately do **not** copy search's start-in-range rule:
  split-end-only/null-start rows are legitimate, and split-end is not public.
  Raw branch location membership also cannot be reconstructed from display
  fallback. Only the backend decides membership.
- Edits clear stale rows immediately. Apply starts at offset0; paging freezes
  the applied query and follows returned lookahead without inventing totals.
  Explicit reload starts again at offset0. The same mounted reload element
  preserves focus through pending and terminal states; duplicate activation
  during pending sends no GET. Denied reload is focusable/aria-disabled and its
  handler cannot issue resource requests.
- Own employee/day links lead to card, schedule, detail and items. Volatile,
  per-history-entry cloned drafts/requests/actor/upstream metadata retain page,
  vertical/RTL scroll and exact opener through nested Back/Forward journeys.
  A removed opener falls back to results with a Hebrew changed-results notice.
  No employee-keyed global cache, personal return URL/blob, browser storage or
  API response cache is introduced. Cold entry invents no employee/day.

## Reproduce checks (from this directory)

```powershell
npm test -- --include src/attendance*.spec.ts
npm test -- --include src/attendance*.spec.ts --include src/browser-readiness.spec.ts
npm test
npm run typecheck
npm run build
```

Pre-H02 full verification checkpoint: **39 attendance cases +4 driver-readiness cases**,
**43/43 focused**, **292/292 overall** (286 original checkpoint +6 QA
regressions), **20 files**, strict app typecheck and production build.
See [VERIFICATION.md](VERIFICATION.md) for exact browser/proxy variants,
nonpassing harness attempts, evidence and limitations.

### Explicit synthetic integration only

`checks/serve-synthetic.mjs` forwards only its constructed synthetic environment,
never the parent's Oracle settings. Additive opt-in:

```powershell
$env:SHF_UI_ATTENDANCE_FIXTURE='1'
$env:SHF_UI_ITEMS_FIXTURE='1'
$env:SHF_UI_EMPLOYEE_CARD_FIXTURE='1'
$env:SHF_FIXTURE_PORT='4358' # verify genuinely free; own helpers only
node checks/serve-synthetic.mjs
```

It uses frontend-owned `fixtures/attendance.synthetic.json` in the stable
backend `AttendanceFixtureData` shape, explicitly sends **`SHF_ATTENDANCE_FIXTURE`**
and **merges** new own-ID detail rows with prior current/search rows.
Schedule/items/card fixture seams stay available; existing detail rows are not
replaced. Backend `attendance-sample.mts` was read as handoff evidence, not
mutated or substituted for the existing multi-screen frontend fixtures.

In another owned helper process:

```powershell
npm exec ng serve -- --host 127.0.0.1 --port 4348 --proxy-config proxy.attendance.conf.json
```

Use a separate isolated Chrome profile/CDP9368 (verify free first), never a
user session. Set the following for each browser check:

```powershell
$env:SHF_UI_URL='http://127.0.0.1:4348'
$env:SHF_CDP_URL='http://127.0.0.1:9368'
$env:SHF_ATTENDANCE_ONLY='1'
node checks/browser-check.mjs       # actual Angular/Chrome, synthetic interception
node checks/fixture-proxy-check.mjs # actual Angular -> proxy -> Node; NO interception
```

The default stock attendance suite includes D01/D02. For the same QA's bounded
retest only, add `SHF_ATTENDANCE_REVIEW_ONLY=1` to the intercepted browser command
(keep `SHF_ATTENDANCE_ONLY=1`). It physically measures all four reload lifecycles
and all31 calendar targets twice, using the same assertions as the full suite.

Do not leave `*_ONLY` flags set when running other suites. Screenshots are
**SYNTHETIC**, under ignored `.angular/browser-evidence/`. These checks are not
Oracle UI verification, real login verification, release approval or a WCAG
conformance claim. See verification for helper teardown and bounded QA handoff.

---

# SHF-EMPLOYEE-UI-19 — read-only operational employee card

## Approved baseline and implementation — 19 October 2026

Implemented **§32 v0.1 + §33 v0.1 + `#employee-card` visual**, accepted at
19 October 08:41 and materialized in **§34 v0.1**. Canonical erased types:
`backend/fixture-slice/employee-card-contracts.mts`; identity consumes the exact
six capabilities in §34, including the independent `employee:read`. No backend,
shared type, design, root manifest, legacy or `.github` edits by this task.

- Selected route: `/employees/:employeeId/operational-card` (caller-assigned
  route spelling); exactly one `GET /api/v1/employees/{employeeId}/operational-card`
  after validated identity. No query/body/context/catalog/related-resource calls.
- `/employee-card` is an honest **no-selection** menu/preview entry. It offers
  existing source routes, not an employee-ID form, synthetic self or default person.
- Actual name anchors on current/search, selected schedule header/rows,
  accepted detail and accepted items use their **own employee ID**. Existing
  employee/day shift actions remain distinct. Missing `employee:read` produces
  plain names with Hebrew unavailability help; other read workflows still work.
- Strict unknown boundary checks ID, exact granted team, direct G01/non-self
  parent, names/labels, nullable signed 38-digit jobs, zone and source pairing.
  `oracle` identity maps to `oracle-read-only` card; fixtures cannot mix with
  Oracle. An explicit nested allowlist projection discards unknown extras
  before component state/DOM; never stores a broad HR payload.
- Only names, current master team/direct parent, job/internal job and collapsed
  internal-ID/source/zone disclosure. Missing job is **לא צוין**; present code
  with null label is **תיאור לא זמין** plus original code. No shift activity,
  site, times or attendance are promoted into employee attributes. No HR tabs,
  image/contact/personal-reference fields, editors or write controls.
- Synthetic app actor remains `employeeId=null`, visibly separate from selected
  employee. Persistent identity/source indication is enabled on this page.
  No fallback Administrator or new authentication claims.
- Volatile `ViewHistory` preserves independent draft/applied requests, paging,
  scroll/RTL-table position, disclosures and exact name opener through nested
  search → schedule → detail → items → card and reverse/Back/Forward. History
  stores opaque tokens and allowlisted route-origin labels only, not card data;
  restoration also requires matching route provenance. Cold links never
  fabricate prior results. Return reloads/revalidates the original resource.
- Superseded requests are canceled and generation/ID/identity-source/scope
  epochs guard every outcome. Identity recheck removes the entire card
  immediately. All terminal errors clear success. Reload/retry is one stable
  native focusable button with guarded `aria-disabled` pending state.

### Checks and isolated local reproduction

Existing Node **24.21.0**, npm **11.19.0**, Angular **21.2.25**,
Material/CDK **21.2.14**, TS **5.9.3**, CLI/build **21.2.27** retained;
no installs/upgrades/manifest changes. Final: **249/249 tests**, strict
typecheck and production build PASS. These are the previous **196 + 53** new
card guard/component/ineffective-abort tests. Chrome **155.0.8059.84** card,
old workflows and actual isolated Node proxy checks PASS; details, exact
commands, earlier harness failures and verification limits are in
[VERIFICATION.md](VERIFICATION.md#shf-employee-ui-19--19-october-2026).

Use only checked-free own ports, not running user services. This task used
UI **4348**, backend **4358**, CDP **9368**, all stopped at completion.
From this directory, in separate owned shells:

```powershell
$env:SHF_FIXTURE_PORT='4358'
$env:SHF_UI_ITEMS_FIXTURE='1'
$env:SHF_UI_EMPLOYEE_CARD_FIXTURE='1'
node checks/serve-synthetic.mjs
# Separate shell:
node node_modules/@angular/cli/bin/ng.js serve --host 127.0.0.1 --port 4348 --proxy-config proxy.employee-card.conf.json
```

The explicit UI helper loads `fixtures/employee-card.synthetic.json` through
the backend's confirmed `SHF_EMPLOYEE_CARD_FIXTURE` seam:
`employees`, `units`, `activeJobPairs`, `innerJobs`. These invented IDs
1001/1002 and TEST-U/P01 hierarchy are isolated from the backend's different
sample module and from real data. No backend sample/config edits are needed.
Missing card fixture configuration never enables an app fallback.

The actual proxy runs do **not** intercept HTTP and refuse non-fixture identity.
They do not verify Oracle/native drivers, real authentication, production
authorization/deployment or full WCAG conformance. Screenshots/profile are
synthetic-only, ignored under `.angular/`; no personal data or business storage.

---

# SHF-ITEMS-UI-18 — prior implementation and verification history

## Selected breaks and partial exceptions — approved v0.1

Implemented **§29 API + §30 UI + visual `#shift-items`**, explicitly approved
18 October 2026 14:17 and materialized in **§31 v0.1**. Canonical types are
type-only imports/exports from `backend/fixture-slice/shift-items-contracts.mts`;
no shared/backend/design artifacts or dependencies are changed here.

- Actual route: `/employees/:employeeId/shift-days/:shiftDayId/breaks-and-exceptions`.
  Four separate actions on current/search/schedule/detail use the clicked
  effective pair. Existing day-detail actions remain separate. Direct valid
  keys are reauthorized by the server; invalid keys/query fail closed. No actor,
  employee-ID or date/time entry form on this view and no extra context API.
- One `GET` with only `limit/offset/sort=start-asc`; `unknown` JSON is checked
  before committing its entire nested detail/context/items/page. Validate both
  IDs, source, hierarchy, kind/state/type consistency, Gregorian seconds,
  natural keys, order, precision and paging. Required stored duration is a
  **string**, never nullable: null/malformed values fail the whole response.
  Preserve negative/zero/38-digit values and earlier ends without calculation.
  Break actuals are nullable; non-break actuals are null and shown “לא חל”.
- Both `shift-items:read` and `shift-day:read` are required. Consume the exact
  approved five-capability synthetic session, never grant from the role.
  A previous valid four-capability identity retains its four existing screens
  but gets no items right. No missing-identity Administrator fallback.
- Atomic loading/empty/error/success, sanitized problem allowlists including
  `AMBIGUOUS_SHIFT_ITEMS`, manual reload0 and bounded offset paging without a
  total. Abort plus identity/context generations reject stale responses.
  Reload stays the same focusable DOM button during pending/failure; repeated
  keyboard activation cannot repeat its GET. No polling/cache/browser storage.
- `ViewHistory` keeps independent **volatile metadata only** per opaque history
  token: filters/drafts, offsets, upstream navigation, vertical/RTL table scroll,
  opener and keyed disclosures. No result bodies, identity or authorization are
  cached. Only random token/navigationId enter history state, never personal
  query/return URLs. Items/detail excursions return rather than create cycles;
  missing volatile history honestly offers current-shift discovery.
- Hebrew/RTL shell, selected parent navigation, existing trapped mobile drawer,
  full-second separate LTR date/time tokens, escaped remarks/raw DEL provenance,
  all eight fields on narrow cards and internally scrolling desktop table.
  Header/sidebar are sticky for this view. No standalone items menu, write,
  approval, swap, EMS, status synthesis, calendar or timepicker controls.

### Isolated synthetic verification setup

Backend readiness/handoff was explicitly supplied by the caller. The existing
frontend helper now supports **explicit** `SHF_UI_ITEMS_FIXTURE=1`, mapping its
unchanged synthetic detail rows to identical item contexts and 30 synthetic
items per day. It supplies the backend's `SHF_SHIFT_ITEMS_FIXTURE` seam, never
Oracle environment/config. Without that flag existing fixture inputs remain
unchanged. See `VERIFICATION.md` for actual results and failed-attempt history.

From this folder, **check port ownership first**; never stop unknown/demo
processes. The completed run used separate owned ports 4348/4358/9368 and left
the user's 4328/4320 untouched:

```powershell
# Owned Node test helper (stop after tests).
$env:SHF_UI_ITEMS_FIXTURE='1'
$env:SHF_FIXTURE_PORT='4348'
node checks/serve-synthetic.mjs

# Separate owned Angular process.
npm start -- --port 4358 --proxy-config fixtures/proxy.items.synthetic.json

# Separate isolated Chrome, with its OWN profile.
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --headless=new --disable-gpu --no-first-run --no-default-browser-check --disable-background-networking --remote-debugging-port=9368 --user-data-dir=D:\AIProjects\SHFAI\frontend\fixture-slice\.angular\items18-chrome about:blank

# Check process, after readiness.
$env:SHF_UI_URL='http://127.0.0.1:4358'
$env:SHF_CDP_URL='http://127.0.0.1:9368'
$env:SHF_ITEMS_ONLY='1'
node checks/browser-check.mjs       # intercepted synthetic errors/states/history
node checks/fixture-proxy-check.mjs # actual Node proxy, interception DISABLED

# Existing broad intercepted browser regressions:
Remove-Item Env:SHF_ITEMS_ONLY -ErrorAction SilentlyContinue
node checks/browser-check.mjs
```

These are local test helpers, **not** application mock-login/browser-auth flags.
Screenshots are synthetic only under ignored `.angular/browser-evidence/`.
No live Oracle UI screenshots, production/real-provider test or full WCAG claim.

Real standalone Angular application, not the design HTML or another prototype.
Approved boundaries: baseline **§13 API/detail v0.1**, original **§14 UI v0.1**
(behavior retained), **§17 exact tooling**, **§19 current-list v0.1** and its
additive two-capability identity seam, accepted **§21 visual v0.1 including the
timepicker**. Approval records and the additive source delta are in
**§22.3–22.4** of `../../docs/SHF_REVERSE_ENGINEERING_DESIGN.md`.
Search implements approved **§23 API v0.1 + §24 UI v0.1 + visual `#search`**,
explicitly accepted **18 October 2026 10:11 +03:00** and materialized in **§25**.
Schedule implements approved **§26 API v0.1 + §27 UI v0.1 + visual `#my-shifts`**,
explicitly accepted 18 October 2026 12:02 and recorded in **§28 v0.1**.
This completes the bounded read-only schedule feature, not the entire application.
No shared/backend/design files are owned or edited by this frontend task.

## Implemented presentation

- `/` opens `/current-shifts`, the primary business entry: shared Hebrew/RTL
  SHF header, right desktop navigation, accessible narrow-screen modal drawer,
  breadcrumbs, compact filters, applied-minute context, semantic results,
  empty/loading/error states and bounded previous/next pagination.
- Exact approved palette: navy `#16254F`, primary `#056AE5`, `#FAFAFA`, white
  12px surfaces, system Segoe UI/Arial stack. No CDN/fonts/icons/assets fetch.
  Schedule, search, current list and detail are independently capability-gated.
- Actual **Material Datepicker**, Hebrew calendar names/assistive labels,
  strict `DD/MM/YYYY` parsing/display, wire `YYYY-MM-DD`. Invalid typed dates
  stay entered; never US-order parsing or fallback to browser “today”.
- Separate strict typed **HH:mm** plus a Material-dialog hour/minute picker:
  24 zero-padded hours, all 60 minutes, no AM/PM, one-minute precision.
  Valid text seeds the choices; explicit apply commits; cancel/Escape preserves
  the text and returns focus to the exact clock button. Invalid text is retained,
  reported and focused instead of repaired or opening the picker. Current mode
  disables both input and clock; no read-only detail timestamp gets a picker.
  The installed Material 21.2.14 built-in timepicker supports intervals in
  seconds / `m` / `h`, but selects immediately. The existing MatDialog/MatSelect
  composition intentionally preserves the approved apply/cancel **hour/minute**
  interaction instead of inheriting its 30-minute default. No dependency added.
- Parent options come from the authorized **G01 catalog**, never from guessed
  unit IDs. “All authorized” is a distinct UI selection serialized by omission,
  not a fabricated catalog row. Employee J01 team and its parent are distinct.
- Current mode samples the **server** minute once per explicit request; no
  polling/live clock. Switching off reloads server defaults. Pagination sends
  **at-mode with the applied minute**, preserving the evaluated-current notice.
  Refresh starts at offset zero. No total count/snapshot/export/edit claims.
  At the offset ceiling, explain that filters must be narrowed.
- All ten legacy business expressions remain represented (weekday and date
  share a column); an additional explicit detail link is the approved
  modernization. Missing-reason display takes priority, no recorded attendance
  does not mean absence, ordered/duplicate activities are retained, unresolved
  catalog labels stay explicit. Start/end dates survive overnight boundaries.
- `/employees/:employeeId/shift-days/:shiftDayId` remains a read-only compact
  detail page with complete local dates and 24-hour seconds, no UTC conversion.
  Employee context is separate from synthetic identity. Detail unit IDs are
  honestly secondary raw values, not names. A matching supported list origin can
  supply **explicitly labeled originating-list** team/parent text; the detail
  contract itself still has no catalog description.
- List → detail → back/browser Back re-reads after identity validation, restoring
  applied filters/page, current-mode indication, vertical and table scroll, and
  the exact originating link. Only volatile UI context is kept; no business
  result/identity cache, browser storage or arbitrary return URL is trusted.
  Direct detail entry honestly offers a new list/diagnostic entry, not invented
  recovered results. A missing row in a fresh list cannot supply a fake opener.
- `/shift-day` and its form/deep links are preserved. Technical ID entry is a
  **secondary collapsed diagnostic disclosure**, never a date filter or the
  primary business page. Known synthetic IDs only; no employee search implied.
- `/shift-search` loads only identity and authorized filter context on entry.
  Explicit submit applies **one date and two independent HH:mm start bounds**,
  inclusive at seconds `00`. Equal bounds are valid; reversed bounds stay entered
  with an error on `timeTo`. No current/overlap mode, UTC conversion, full-day
  invented default, polling, hidden result request or local sorting.
- Search reuses the actual Material Datepicker/civil adapter and one target-aware
  `MinutePicker` dialog. Named G01 parent, scoped J01 teams, active internal-role
  multiselects and home/site filters come only from context. Changing parent
  clears teams. No locations means no restriction (including raw null); selecting
  both means home/site only. No employee/activity/job/status/cancel controls.
- Search results retain full local times/dates, ordered activities/explicit
  exception fallback and unknown labels, separate team/parent, seven labeled
  informational markers (not inferred cancellation/status) and effective-detail
  links using the result's own employee/day IDs. The semantic table is internally
  scrollable on desktop and stacked/labeled at <=760px. No total/statistics.
- Search → effective detail → back/browser Back/Forward restores committed
  filters/page/scroll/exact opener after rechecking identity/context and refetching.
  Current/search origins stay separate; direct detail has an honest context-entry
  fallback. Filter edits immediately clear rows and saved search context.
- 400 field mapping, 401/403 context invalidation, explicit retries, malformed/
  source-mismatched payload rejection and late A-after-B guards fail closed.
  Disappeared catalogue selections stay as an explicit unavailable draft until
  the user clears them; no silent widening. Backend remains authoritative.

## Identity, data source and contract boundary

Canonical DTOs are imported **type-only** from backend-owned `contracts.mts`
and `current-shifts-contracts.mts` / `shift-search-contracts.mts` /
`my-shifts-contracts.mts`; no backend runtime code enters the bundle.
Unknown JSON is validated at runtime, including context, exact applied request,
page window, parent relationship, dates, Unicode bounds and source consistency.
Only eight approved GETs are consumed (including schedule context and results), with no body, automatic retry,
mutation or persistent cache; the HTTP client requests `cache: 'no-store'`.

Explicit coherent source pairs:

| Identity / detail | Context / list | Visible source |
|---|---|---|
| `isolated-fixture` | `isolated-fixture` | isolated synthetic fixtures |
| `oracle` | `oracle-read-only` | **Oracle TEST — read only** |

Mixed/unknown sources fail closed, not literal-equality rejection of the approved
Oracle pair and not fixture fallback on Oracle error. Source selection belongs
to the backend. No Oracle driver, credentials or direct DB/browser calls here.
Synthetic Administrator is always identified as synthetic/local with **no real
password verification** and null employee. Exact approved capabilities are
`["shift-day:read", "current-shifts:read", "shift-search:read", "my-shifts:read"]`, in that order
for the synthetic principal; real principals may carry individual capabilities.
Each workflow checks its capability
independently. No Administrator fallback, browser authorization flag or inference
of employee identity. Backend policy remains authoritative on every request.
Production synthetic-mode rejection remains backend-enforced; do not deploy this
local/isolated demo. An optimized build is not deployment authorization.

Existing detail 401/403/404/503/500, malformed-response, explicit retry,
generation/cancellation, source validation and exact reload-focus behavior are
retained. The new list independently guards identity/context/list generations;
filter edits clear results immediately and late success/error cannot resurrect
old data. Refresh stays the exact focusable button through pending and 200/503,
while duplicate activation is suppressed. No business overlays/duration rules
were moved into presentation.

## Versions and checks

Existing installed baseline retained, **no install/manifest/lockfile changes**:
Node **24.21.0**, npm **11.19.0**, Angular **21.2.25**, Material/CDK **21.2.14**,
CLI/build **21.2.27**, TypeScript **5.9.3**, RxJS **7.8.2**, tslib **2.8.1**,
Vitest **4.0.8**, existing jsdom **27.1.0**. Compatibility evidence is recorded
in the historical verification; installed adapter/date/time/dialog declarations
were inspected for this implementation. Current official overview returns an
SPA shell; the attempted content URL returned 404, so no new remote component
documentation-content verification is claimed.

From `D:\AIProjects\SHFAI\frontend\fixture-slice`:

```powershell
npm test -- --include=src/current-shifts-page.spec.ts --include=src/current-shifts-generation.spec.ts
npm test
npm run typecheck
npm run build
```

Historical SHF-SEARCH-UI-18 results: **99/99 tests**, typecheck and production build
pass. Actual Chrome with intercepted synthetic HTTP and actual fixture-proxy
checks both pass; see the dated verification entry for exact scope and caveats.

Tests use Angular/Vitest/jsdom, not a browser or database. See `VERIFICATION.md`
for exact executed results and historical failed/repaired checks. Lazy list
routing keeps the production initial bundle within the existing budget.
Generated `dist/`, `.angular/`, node_modules and synthetic screenshots are ignored.

## Explicit synthetic fixture backend and proxy

From repository root, in a separate terminal, **only supplied synthetic JSON**:

```powershell
$env:SHF_FIXTURE_CONFIG = Get-Content frontend/fixture-slice/fixtures/config.synthetic.json -Raw -Encoding UTF8
$env:SHF_FIXTURE_ROWS = Get-Content frontend/fixture-slice/fixtures/rows.synthetic.json -Raw -Encoding UTF8
$env:SHF_CURRENT_SHIFTS_FIXTURE = Get-Content frontend/fixture-slice/fixtures/current-shifts.synthetic.json -Raw -Encoding UTF8
$env:SHF_FIXTURE_PORT = '4310'
node backend/fixture-slice/server.mts
```

Current-list fixture uses the backend's existing `CurrentFixtureData` envelope:
explicit G01/J01 hierarchy, employees/days/attendance and bounded label sets.
No fixture is bundled into the application or automatically substituted.
Current/default server time may legitimately return **empty**. To see the known
overnight row, manually search **15/10/2026 23:59**, parent
**מוקד בדיקה סינתטי**, then open day `2001`, employee `1001`.
The existing 38-digit diagnostic pair / day `2002` remains available separately;
its end-before-start values are preserved, not silently repaired.

In the frontend directory:

```powershell
npm start -- --port 4328
```

`proxy.conf.json` remains the existing `/api/**` → `http://127.0.0.1:4310`.
Explicit loopback only. No CORS widening or Oracle settings in frontend config.
Stop owned services when done; clear the fixture environment variables.

### Schedule/search-inclusive isolated fixture helper (recommended for the checks)

Backend handoff uses approved `SHF_MY_SHIFTS_FIXTURE` and `SHF_SHIFT_SEARCH_FIXTURE` in addition to the
existing fixture config/rows/current fixture/port; no runtime config field was added.
The frontend-owned helper passes **only explicit synthetic configuration** to
the existing backend `startFromEnvironment`. It merges current and search detail
rows with a duplicate-pair assertion, and expands a synthetic search template to
30 distinct day IDs (`3001`–`3030`) to exercise 25+5 search/schedule pagination.
Schedule uses that same synthetic actor/day source and corresponding detail pairs;
the duplicate-pair assertion runs before startup. No app fallback.
No backend source is edited; no Oracle configuration/environment is forwarded.

Check ports **4318 / 4328 / 9338 are free** before starting owned test services:

```powershell
# frontend/fixture-slice, separate terminals; stop all owned services afterward
node checks/serve-synthetic.mjs
npm start -- --port 4328 --proxy-config proxy.schedule.conf.json --prebundle=false

# Isolated Chrome, unique profile and free CDP port (same installed executable)
$profile = Join-Path (Get-Location) '.angular/search-ui18-browser'
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --headless=new --disable-extensions --no-first-run --no-default-browser-check --disable-background-networking --disable-component-update --disable-sync --remote-debugging-address=127.0.0.1 --remote-debugging-port=9338 "--user-data-dir=$profile" about:blank

$env:SHF_UI_URL = 'http://127.0.0.1:4328'
$env:SHF_CDP_URL = 'http://127.0.0.1:9338'
node checks/browser-check.mjs
node checks/fixture-proxy-check.mjs
```

The first check intercepts **all** API requests with synthetic responses. Optional
`SHF_SEARCH_ONLY=1` or `SHF_SCHEDULE_ONLY=1` skips the older current/detail block,
but still runs search plus schedule; omit both for the full regression.
The second disables interception and verifies actual Angular → proxy → explicit
synthetic backend current/search/schedule/detail workflows, no-store responses and browser
Back/Forward at 1440/390/320. For a manual known search use **15/10/2026,
10:00–10:00**; narrower **10:01–10:01** is a real empty result. Do not point these
checks at a shared, real-data or Oracle server. Other hosts/ports are not authorized.

### Implemented schedule behavior / SHF-SCHEDULE-UI-18

- `/my-shifts` requests `GET /api/v1/my-shifts/context?mode=self`.
  Synthetic employeeId remains null: an honest no-selection panel, real
  current/search links, no ID form, no list GET and no invented personal schedule.
- Separate current/search row actions open `/my-shifts/selected/:employeeId`.
  Context revalidates selection and supplies employee/team/parent labels, zone,
  source and default14 dates before the list GET. Selected URL is not a grant.
  Real-self is tested only with verified-provider doubles; no provider/login is
  implemented and real selected mode is not enabled.
- Two distinct Material calendars reuse the strict civil adapter and Hebrew
  assistive labels. Inclusive 1–31 calendar dates, years 0001–9999, explicit
  Apply/Reload, no browser-clock defaults, elapsed-millisecond or UTC arithmetic.
  Dirty edits clear old rows and abort requests without erasing entered text.
- Schedule rows show weekday, both civil dates, HH:mm with seconds in Hebrew
  accessible precision text, null-end unavailable, ordered/duplicate activities
  and explicit unknown labels. No attendance, invented status/site, editing,
  swap, break, request or export command is exposed.
- Nested current/search → schedule → own-ID detail → schedule → exact source row
  retains committed filters/minute/page, range, scroll/RTL table scroll, technical
  disclosure and opener. Each return refetches/revalidates; missing opener falls
  back to the real heading. Only volatile navigation selectors/labels/form state
  are kept, never result or principal caches, return URLs or browser storage.
- Strict unknown-JSON guards enforce principal/mode/actor/default/source/zone,
  applied range/ID, row ownership/order, nullable end and exact page invariants.
  Generation guards protect caption, rows, messages, focus and permission even
  when transport cancellation is deliberately ineffective. Identity recheck
  retains date input and starts a fresh context/list generation.

Latest schedule validation: **141/141 UI tests (100 existing + 41 new)**,
strict application typecheck and production build PASS. See the dated
SHF-SCHEDULE-UI-18 entry in `VERIFICATION.md` for actual browser/proxy distinctions,
retest history and remaining manual accessibility review. Historical search-only
counts below are retained as evidence of earlier milestones, not current totals.

### Actual Chrome checks (no additional npm package)

Start a separate isolated Chrome profile on a **free** loopback CDP port 9322,
using the installed executable (never reuse/kill an unknown user browser):

```powershell
$profile = Join-Path (Get-Location) '.angular/ui01-browser'
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --headless=new --no-first-run --no-default-browser-check --disable-background-networking --disable-component-update --disable-sync --remote-debugging-address=127.0.0.1 --remote-debugging-port=9322 "--user-data-dir=$profile" about:blank
$env:SHF_UI_URL = 'http://127.0.0.1:4328'
$env:SHF_CDP_URL = 'http://127.0.0.1:9322'
node checks/browser-check.mjs
node checks/fixture-proxy-check.mjs
```

`browser-check.mjs`: actual Angular/Chrome at 1440×900, 390×844 and 320×844;
**all API requests intercepted with clearly synthetic test fixtures**. Tests
calendar/time dialog, keyboard/focus, RTL/reflow, long values, source notices,
navigation, pagination, empty/error/retry and late requests. Saves the exact
reload element and checks object identity (never BODY text as a focus oracle).

`fixture-proxy-check.mjs`: **real Angular proxy → owned loopback fixture backend**,
no HTTP interception. Refuses non-fixture identity **before opening business UI**.
Checks current/search/detail/no-store and real browser Back/Forward with filters/page/scroll/opener.
Both scripts save screenshots only under ignored `.angular/browser-evidence/`.
Do not run either against Oracle or capture real employee information.

No screen-reader, full contrast/AT/zoom suite or WCAG-conformance claim follows
from these bounded checks. No frontend runtime against live Oracle was performed.
Source-observed evidence: `ShiftDataAction` 118–132; `ShiftDataModel` 924–1074;
`shifts_table.jsp` 37–96; detail popup 49–74 and `AgentDayBean` 1016–1030.
Search evidence additionally includes `ShiftDataModel.populateShiftList`
395–451 / 569–653 and `shifts_search_table.jsp` 78–190, interpreted through
approved §§23/24/25. Source contract catalog is absent.
Legacy was read only, never built/executed.
This implements the approved **search + current inquiry + detail**, not the whole SHF
migration: my-shifts, employee cards, editing, exports, totals, EMS and
batch remain outside this frontend slice.
