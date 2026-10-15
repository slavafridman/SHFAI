# SHF-IMPL-UI-01 — current shifts and effective detail

Real standalone Angular application, not the design HTML or another prototype.
Approved boundaries: baseline **§13 API/detail v0.1**, original **§14 UI v0.1**
(behavior retained), **§17 exact tooling**, **§19 current-list v0.1** and its
additive two-capability identity seam, accepted **§21 visual v0.1 including the
timepicker**. Approval records and the additive source delta are in
**§22.3–22.4** of `../../docs/SHF_REVERSE_ENGINEERING_DESIGN.md`.
No shared/backend/design files are owned or edited by this frontend task.

## Implemented presentation

- `/` opens `/current-shifts`, the primary business entry: shared Hebrew/RTL
  SHF header, right desktop navigation, accessible narrow-screen modal drawer,
  breadcrumbs, compact filters, applied-minute context, semantic results,
  empty/loading/error states and bounded previous/next pagination.
- Exact approved palette: navy `#16254F`, primary `#056AE5`, `#FAFAFA`, white
  12px surfaces, system Segoe UI/Arial stack. No CDN/fonts/icons/assets fetch.
  Search and “my shifts” remain truthfully disabled/planned; the current list
  is functional only with its verified capability.
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

## Identity, data source and contract boundary

Canonical DTOs are imported **type-only** from backend-owned `contracts.mts`
and `current-shifts-contracts.mts`; no backend runtime code enters the bundle.
Unknown JSON is validated at runtime, including context, exact applied request,
page window, parent relationship, dates, Unicode bounds and source consistency.
Only four existing approved GETs are consumed, with no body, automatic retry,
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
`["shift-day:read", "current-shifts:read"]`; each workflow checks its capability
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
npm start -- --port 4320
```

`proxy.conf.json` remains the existing `/api/**` → `http://127.0.0.1:4310`.
Explicit loopback only. No CORS widening or Oracle settings in frontend config.
Stop owned services when done; clear the fixture environment variables.

### Actual Chrome checks (no additional npm package)

Start a separate isolated Chrome profile on a **free** loopback CDP port 9322,
using the installed executable (never reuse/kill an unknown user browser):

```powershell
$profile = Join-Path (Get-Location) '.angular/ui01-browser'
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --headless=new --no-first-run --no-default-browser-check --disable-background-networking --disable-component-update --disable-sync --remote-debugging-address=127.0.0.1 --remote-debugging-port=9322 "--user-data-dir=$profile" about:blank
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
Checks list/detail/no-store and real browser Back with filters/page/scroll/opener.
Both scripts save screenshots only under ignored `.angular/browser-evidence/`.
Do not run either against Oracle or capture real employee information.

No screen-reader, full contrast/AT/zoom suite or WCAG-conformance claim follows
from these bounded checks. No frontend runtime against live Oracle was performed.
Source-observed evidence: `ShiftDataAction` 118–132; `ShiftDataModel` 924–1074;
`shifts_table.jsp` 37–96; detail popup 49–74 and `AgentDayBean` 1016–1030.
Source contract catalog is absent. Legacy was read only, never built/executed.
This implements the approved **current inquiry + detail**, not the whole SHF
migration: search/my-shifts, employee cards, editing, exports, totals, EMS and
batch remain outside this frontend slice.
