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
