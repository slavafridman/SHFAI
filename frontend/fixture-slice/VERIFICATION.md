# SHF-SEARCH-UI-18 verification — 2026-10-18

## SHF-SEARCH-FINAL-18 — publication checks, 18 October 10:56 +03:00

- Backend `npm run typecheck`: **PASS**; `npm test`: **96/96 PASS**.
- Frontend `npm run typecheck`: **PASS**; full `npm test`: **100/100 PASS**,
  eight files, including the new D01 regression; `npm run build`: **PASS**.
  The first full invocation timed out starting the Vitest worker before collecting
  tests; only that owned hung process was stopped. The unchanged command passed
  on rerun. The existing jsdom `scrollTo` diagnostic remains, not a browser check.
- Root `node docs\reverse-engineering\verify-evidence.mjs`:
  **passed_with_documented_source_anomaly**, 454 source hashes verified.
  The pre-existing duplicate legacy route remains explicitly documented.

These are fresh static/synthetic publication checks, not a production release,
complete WCAG assessment, Oracle SLA, or replacement for the independent browser
and authorized Oracle evidence recorded separately.

## SHF-SEARCH-QA-UI-18-D01 — narrow fix, 18 October ~10:49 +03:00

**Status: fixed; return to the same independent QA for narrow retest.**
Approved §23/24 v0.1 / §25 unchanged. Only search result date/time `bdi` elements
gain `.date-time-token { white-space:nowrap; overflow-wrap:normal }`. Existing
date `cell-note` line breaks remain. Table intrinsic sizing now reserves the
unbreakable token width; the existing internal table scroll handles desktop
containment. No global nowrap, fixed column hack or current/detail style change.
Long raw text retains inherited `overflow-wrap:anywhere`.

Changed paths for this fix only (all under `frontend/fixture-slice/`):
`src/shift-search-page.html`, `src/shift-search-page.scss`,
`src/shift-search-page.spec.ts`, `checks/fixture-proxy-check.mjs`, `VERIFICATION.md`.
No API/backend/canonical/manifest/dependency/Git/real-data work.

Commands run from `frontend/fixture-slice`:

- `npm test -- --include=src/shift-search-page.spec.ts --include=src/shift-search-generation.spec.ts`
  → **27/27 PASS**, 2 files (23 component/guard/style cases + 4 generation).
  New regression checks four exact complete LTR tokens, separate date lines,
  class scope and actual computed nowrap/normal styles; nonnumeric fields do not
  receive the class. jsdom scrollTo diagnostic remains; geometry is checked in
  actual Chrome below.
- `npm run typecheck` → **PASS**.
- `npm run build` → **PASS**, no budget warnings; initial 537.08 kB, lazy search
  49.79 kB. `node --check checks/fixture-proxy-check.mjs` → **PASS**.
- Owned test services: `node checks/serve-synthetic.mjs`,
  `npm start -- --port 4328 --proxy-config fixtures/proxy.synthetic.json`,
  isolated Chrome profile `.angular/d01-browser`, CDP 9338.
- `node checks/fixture-proxy-check.mjs` with
  `SHF_UI_URL=http://127.0.0.1:4328`, `SHF_CDP_URL=http://127.0.0.1:9338`,
  **`SHF_SEARCH_TOKEN_ONLY=1`** → **PASS**. Actual Angular → loopback proxy →
  explicit synthetic backend; interception disabled. Narrow D01 branch only,
  not a broad rerun of the recent full QA/browser/nav trace.

Actual DOM Range text-node geometry, first row (all units CSS px):

| Viewport | Page scroll width | Table viewport / scroll width | Start `10:00:00`: token / cell | End date `16/10/2026`: token / cell |
|---|---:|---:|---:|---:|
| 1440×900 | 1425 | 1135 / 1220 | 47.69 / 71.69 | 61.11 / 85.11 |
| 390×844 | 375 | 341 / 341 | 47.69 / 317 | 61.11 / 317 |
| 320×844 | 305 | 271 / 271 | 47.69 / 247 | 61.11 / 247 |

Every viewport: **100/100 date/time tokens occupy exactly one DOM Range line**
(25 rows × four tokens). First-row `15/10/2026`, `10:00:00`, `01:00:13`,
`16/10/2026` remain complete, each `white-space:nowrap` / `overflow-wrap:normal`.
All 25 records retain **10 visible fields and seven indicator items**; all ten
mobile field labels exist. Page width <= viewport (15px vertical scrollbar is
not horizontal overflow). Desktop scroll remains contained; mobile cards have
no internal horizontal overflow. Activity text computes `overflow-wrap:anywhere`.
Observed API responses are 200/no-store; no browser runtime exceptions.
Ignored synthetic captures `.angular/browser-evidence/search18-D01-tokens-{1440,390,320}.png`;
1440/320 captures visually inspected.

Initial narrow harness attempts were not passes: first ran before the dev server
was ready, then a helper scope error and overly strict page-width equality were
corrected (vertical scrollbar permits page width < viewport). The terminal
geometry run above passed. The recent full 99-case/QA trace was deliberately not
rerun for this scoped CSS fix; no new whole-suite total or WCAG claim is made.
Next action: same QA retests D01 token lines/containment before publication.
Owned D01 server process trees and verified isolated Chrome PID 1204 stopped;
cleanup confirmed no listeners on 4318/4328/9338. No unknown user service stopped.

## Search implementation: done (supersedes historical current/detail-only scope below)

**Completed assigned frontend feature, ready for caller/QA review; not a full-app
migration, production release or authentication implementation.** Only
`frontend/fixture-slice/` authored files were edited. No Git command, installs,
dependency/manifest/lockfile changes, backend/canonical/design edits, legacy
execution, Oracle connection, DB metadata/DML/DDL, EMS, batch or deployment.
Other writers' `.github`/`docs` changes were not touched.

### Approved contracts and evidence

- **§23 v0.1 API/search + §24 v0.1 UI + approved HTML `#search`**, approval
  **18 October 2026 10:11 +03:00**, recorded in **§25**. Existing
  §13/14/17/19/21/22 current/detail/tooling baselines retained.
- Type-only imports from architect-owned
  `backend/fixture-slice/shift-search-contracts.mts`, with reused
  `contracts.mts` and `current-shifts-contracts.mts`. No duplicate wire DTO/schema.
  Synthetic identity now requires the exact ordered three approved capabilities;
  real identities can have individual capabilities. No role-only authorization.
- Read project instructions/agent brief/UI skill, exact §§23/24/25 and
  `docs/design/shifter-redesign-v0.1.html#search`; controlling read-only
  `ShiftDataModel.populateShiftList` baseline/changed predicates and ordering,
  especially **395–451, 569–653**, and `shifts_search_table.jsp` **78–190**.
  Source documents start-in-window, raw branch home filtering, ordered activities,
  seven indicators and the distinct original-swap popup; it does not authorize
  revival of deferred actions. Source catalog file is absent (`Test-Path
  docs/SHF_SOURCE_CONTRACT_CATALOG.md` → False). Legacy Hebrew literal parity and
  runtime behavior are not claimed from these static reads.
- Backend owner relayed search readiness (95 backend tests, native Oracle checks).
  Those backend/Oracle results are **caller-reported**, not tests executed by this
  frontend task. This task independently ran the ready backend only in explicitly
  configured **isolated-fixture** mode using its existing server binding.

### Authored paths

- New `src/shift-search-contract.ts`, `shift-search-page.ts/.html/.scss`,
  `shift-search-fixtures.ts`, `shift-search-page.spec.ts`,
  `shift-search-generation.spec.ts`.
- Integrated `src/api.ts`, `routes.ts`, `contract.ts`, `current-shifts-contract.ts`
  (reused core-row guard), `list-navigation.ts`, `current-shifts-page.ts`,
  `shift-day-page.ts/.html`, `workspace-shell.ts/.html` and directly related
  `contract.spec.ts`, `workspace-shell.spec.ts`, `test-fixtures.ts`.
- Extended `checks/browser-check.mjs`, `checks/fixture-proxy-check.mjs`; added
  `checks/serve-synthetic.mjs`, `fixtures/shift-search.synthetic.json`,
  `fixtures/search-detail.synthetic.json`, `fixtures/proxy.synthetic.json`;
  updated this document and `README.md`.
- Generated optimized bundles/test caches and synthetic screenshots are confined
  to existing ignored `dist/` / `.angular/`; screenshots are not live records.

### Actual final commands/results

All npm/Node commands below use `frontend/fixture-slice` as working directory.
No dependencies were selected/upgraded: Node **24.21.0**, npm **11.19.0**,
Angular **21.2.25**, Material/CDK **21.2.14**, CLI/build **21.2.27**,
TS **5.9.3**, RxJS **7.8.2**, Vitest **4.0.8**, existing jsdom **27.1.0**.

| Exact command | Result and evidence class |
|---|---|
| `npm test -- --include=src/shift-search-page.spec.ts` | First coherent edit found a type-guard narrowing error, repaired. Next invocation hit the existing five-second Vitest worker-start timeout; stopped only owned hung shell. Rerun **14/14 PASS** at that checkpoint. |
| `npm test` | Final **99/99 PASS**, **8 files**: 73 existing cases + 26 search cases (22 component/guards + 4 deliberately uncooperative-generation cases). Angular/Vitest/jsdom + synthetic HTTP, not browser/DB. Final run 18 October ~10:37 +03:00. |
| `npm run typecheck` | **PASS** (`tsc --noEmit -p tsconfig.app.json`). |
| `npm run build` | **PASS**, production build, no budget warning. Initial **537.08 kB**, lazy search **49.66 kB**, existing shared lazy chunk **249.05 kB**, lazy current **63.86 kB**; budgets unchanged. |
| `npm start -- --port 4328 --proxy-config fixtures/proxy.synthetic.json` | Owned loopback Angular server; no existing user/demo listener reused or stopped. |
| `node checks/serve-synthetic.mjs` | Owned loopback backend **4318**, explicit fixture config only; no Oracle environment forwarded. Existing current rows + search detail rows merged with duplicate-pair assertion. 30 deterministic synthetic search days exercise 25+5 pagination. Uses approved `SHF_SHIFT_SEARCH_FIXTURE` and existing config/rows/current/port variables only. |
| `node checks/browser-check.mjs` with `SHF_UI_URL=http://127.0.0.1:4328`, `SHF_CDP_URL=http://127.0.0.1:9338`, no `SHF_SEARCH_ONLY` | **PASS**, actual Chrome **155.0.8059.84**, actual Angular/Material; **all HTTP API requests intercepted with synthetic data**. Existing current/detail regressions plus full new search matrix below. |
| Same browser command with `SHF_SEARCH_ONLY=1` | **PASS**, focused real-Chrome search matrix during refinement; not substituted for final full-suite run. |
| `node checks/fixture-proxy-check.mjs` with the same two loopback URL variables | **PASS**, actual Angular → proxy → ready Node backend, **Fetch interception disabled**, explicit synthetic dataset only. Current/detail at 1440/390 and search/detail/Back/Forward at **1440/390/320**; all observed API responses **200 + no-store**, no runtime exceptions. |

Final full test rerun also encountered one more existing Vitest worker-start
timeout before collecting any tests; its owned hung process was stopped and the
same command passed 99/99 on rerun. No timeout invocation is counted as passing.
jsdom emits its known `window.scrollTo` not-implemented diagnostic on restoration;
real scroll and exact opener were independently verified in Chrome.

Browser-harness refinements: initial attempts raced Material select/calendar
closing/opening lifecycle or the previous results DOM. The harness now waits for
unobscured actual pointer targets, Angular rendering after input/click, actual
calendar focus and terminal opening lifecycle before Escape. Earlier failed
runs are not passing evidence. App result focus now scrolls into view on fresh
search (verified visually at 320); restore uses preventScroll + saved scroll.

### Bounded browser/behavior coverage actually run

- **1440×900, 390×844, 320×844**, Hebrew/RTL/right desktop shell and active search,
  mobile menu Escape/exact trigger restoration, no page-wide horizontal overflow.
  Desktop table scroll is contained; mobile uses the same labeled stacked records.
  Synthetic desktop/mobile screenshots captured; 1440/320 intercepted and
  390 actual-proxy screenshots visually inspected. Not every viewport screenshot
  or accessibility tree was manually reviewed.
- Two independent from/to targets share the existing dialog. Actual 24 hours /
  60 minute options; **00:00, 23:59, 08:07**, apply/cancel/Escape, exact opener,
  no change to the other field. Material calendar Escape/opener and strict
  DD/MM/YYYY. Invalid **29/02/2027, 31/04/2026, 00/10/2026, 0001,
  10/15/2026**, malformed minutes and reversed range retain draft/focus. Equal
  **10:00–10:00** succeeds. **29/02/2028, 01/01/0001, 15/10/2026** survive
  en-US locale with **America/Los_Angeles / Pacific/Kiritimati** unchanged.
- Actual named Material parent/team/role/location options, parent-driven team
  reset, single comma-list serialization, selected filters, omission versus both
  home/site semantics. Backend fixture **10:00–10:00** returns actual rows and
  **10:01–10:01** is actually empty (not locally filtered or fabricated).
- Seven noninteractive Hebrew indicator labels, null extension “not applicable,”
  explicit unknown activity label, full end date, exact result employee/day link.
  Original swap/card/export/breaks/commands have no fake links.
- Stable offset 25/5-row second page → effective detail **1001/3026** →
  actual browser Back/Forward retains page/window/selections/vertical and table
  scroll/exact opener, with context revalidation and fresh GETs. Search stays
  selected in detail. Search and current origin remain separate.
- Identity absent/malformed/missing search capability → zero search/context
  requests; individual search-only principal has no detail links. Context/source
  mismatches/malformed rows, 400 field focus, 401/403 denial, 500/503 and retry,
  empty, dirty hiding, no polling/automatic retry. Late browser A-after-B success
  is ignored; unit fake transport additionally sends late error and **403**
  after unsubscribe and verifies unchanged state/announcement/actual focus.
- Existing actual current-list date/minute/current-mode regressions passed.
  Existing exact reload checks **4/4** at 1440/320 × 200/503 preserve the **same
  DOM button object**, pending/terminal focus and one request despite duplicate
  Space — not BODY or merely matching text.
- Intercepted suite asserts no browser storage, external network or JS exceptions;
  real proxy asserts no-store, fixture identity before business reads and no
  runtime exceptions. Screenshot data are synthetic only.

### Explicit verification limits / ownership / next action

No full WCAG conformance claim. Screen-reader/AT behavior, measured contrast,
complete 200%/400% zoom and full search-specific text-spacing matrix, all browser/
OS combinations and real-authenticated-provider deployment remain **not run**;
independent QA owns those acceptance checks. Source Hebrew decoding parity is
not claimed. No production mock startup was executed here (backend owns its
guard); no UI Oracle/live-data query was run. Oracle readiness/95 backend tests
are backend-owner reported only. No frontend implementation blocker remains.
Backend contract handoff integrated with the approved env name and exact three
capabilities; no new endpoint, source marker, config alias or shared change needed.
Caller owns independent review/release decisions; no further approval gate is
invented. Owned test servers/Chrome are stopped after checks; no user demo is left
running by this task.
Cleanup verified: no listeners on owned **4318/4328/9338**. Only verified isolated
Chrome PID **10876** (`search-ui18-browser`, CDP 9338) and owned server process
trees were stopped. Final `node --check checks/browser-check.mjs`,
`node --check checks/fixture-proxy-check.mjs` and
`node --check checks/serve-synthetic.mjs` all passed.

---

# Historical SHF-IMPL-UI-01 verification — 2026-10-15

## Current implementation scope (supersedes historical detail-only scope below)

**Status: frontend implementation done; ready for independent QA/caller review.**

Real Angular **shared RTL shell + current-list filters/results/pagination +
compact effective detail**, using only approved API responses. No prototype
rows/catalog/service in the running application. Current-list approval at
14:55 removed that earlier dependency; the current-list menu is now functional.
Search/my-shifts remain disabled/planned, with no false navigation claims.
No full migration, real authentication, production release or Oracle UI/runtime
verification is claimed.

Approved baselines: **§13 API/detail v0.1; §14 existing behavior v0.1;
§17 exact tooling; §19 v0.1** including additive identity capability revision;
**§21 accepted visual v0.1 with timepicker; §22.3–22.4 approval/source delta**.
Canonical types remain backend-owned. Exact source pairs are fixture/fixture or
identity+detail `oracle` / context+list `oracle-read-only`; mixed/unknown sources
are rejected. Visible Oracle TEST/read-only text does not hide the explicitly
synthetic Administrator/no-password-verification notice. Source-pair tests use
synthetic names and mocked HTTP, not an Oracle read.

### Evidence and ownership

Only authored files under `frontend/fixture-slice/` changed. No Git operations,
dependency installs, package/lockfile changes, other writers' files, backend or
canonical-contract/design edits. No legacy execution, DB/EMS/batch/DDL,
deployment, credentials or real employee screenshots.

Read instructions/brief/UI skill; accepted prototype and §13/17/19/21/22;
installed Material adapter/timepicker/dialog APIs; controlling read-only
`ShiftDataAction` 118–132, `ShiftDataModel` 972–1020, `shifts_table.jsp` 37–98,
detail popup 49–74 and effective getters 1016–1030. The source contract catalog
is absent (`Test-Path docs/SHF_SOURCE_CONTRACT_CATALOG.md` → False).
Source is evidence, not proof of legacy runtime or fresh Oracle metadata.

Material built-in timepicker declares seconds/`m`/`h` interval support and
immediate selection. To preserve approved explicit hour/minute apply/cancel
semantics, use existing Material Dialog + Select: 24/60 choices, minute precision,
strict HH:mm seed, cancel/Escape retention and exact clock focus restoration.
Actual Material Datepicker uses the strict civil-date adapter and Hebrew labels.
No new dependency. Official overview HTTP 200 was an SPA shell, not readable
component documentation; attempted static timepicker content URL returned 404.
Local installed declarations + compile/browser behavior are the verified evidence.

### Executed checks and repairs during this implementation

All npm/Node check commands below run from `frontend/fixture-slice/`.

| Exact command | Actual outcome |
|---|---|
| `node --version`; `npm --version` (repo root) | **24.21.0 / 11.19.0**; approved installed versions retained |
| `npm test -- --include=src/shift-day-page.spec.ts` (first coherent edit) | Test bundle compiled; first invocation hit Vitest's 5-second worker-start timeout, stopped **owned** hung session; no passing tests claimed |
| same focused command, rerun | **28/30**; two assertions described old DOM composition, then adapted to semantic null-field cells and exact diagnostic link |
| `npm test -- --include=src/current-shifts-page.spec.ts --include=src/shift-day-page.spec.ts` | **49/50**; dialog close lifecycle timing repaired with explicit zero transition durations; detail 30/30 |
| `npm test -- --include=src/current-shifts-page.spec.ts --include=src/workspace-shell.spec.ts` | Initially 21/22 plus unhandled exception: `#opener` queried a Material button instance, not ElementRef. Fixed explicit query `read: ElementRef` with correct generic overload |
| same focused command after repair | **22/22**, no unhandled errors |
| `npm run typecheck` | Passed after repairing nullable originating-list context narrowing; later unknown-JSON guards use `unknown`, not `any` |
| `npm run build` (first full-list eager version) | Passed with 841.41 kB initial / 800 kB warning; replaced eager list route with supported lazy route, **did not raise budget** |
| `npm run typecheck`; `npm run build` (lazy route) | Passed; initial **534.65 kB**, lazy list **311.28 kB**, no budget warning at that checkpoint |
| `npm test -- --include=src/current-shifts-page.spec.ts --include=src/current-shifts-generation.spec.ts --include=src/contract.spec.ts` | **31/31** after source-pair, bounded-window and independent stale-generation checks |
| `npm test` (before last two refresh-focus cases) | **70/70**, six files; original forty behavior cases retained with legitimate composition/capability/source adjustments |
| `npm run typecheck`; `npm test -- --include=src/current-shifts-page.spec.ts --include=src/current-shifts-generation.spec.ts` | **PASS; 29/29** after current-refresh exact-element pending/200/503 focus tests |
| `node checks/browser-check.mjs` | **PASS**, actual Chrome **155.0.8059.40**, Angular running on owned loopback 4320, **intercepted synthetic API only**; detailed scope below |
| `node checks/fixture-proxy-check.mjs` | **PASS**, actual Angular → proxy → explicitly configured **fixture-only** backend on owned 4310, no HTTP interception; desktop/mobile list/detail 200 + no-store |

Browser harness initially encountered a stale Vite compiler-error overlay, then
was rerun after restarting **only the owned dev server**. Assertions were fixed
to await applied values/page IDs rather than accepting a previous results table;
Material dialog controls wait for initial focus/rendering. Actual browser found
clock Escape restoration could end on the input; close handling now explicitly
returns to the exact clock button. None of these failed runs is counted as a
passing browser run. Final checks are recorded below after all changes.

### Bounded actual browser coverage

- Intercepted synthetic matrix: **1440×900, 390×844, 320×844**. Real Material
  calendar strict invalid date retention and Escape/opener; 24/60 picker applies
  **08:07**, preserves typed invalid 24:00 / 8:07 / blank, cancel/Escape focus;
  current mode uses server-supplied **08:07**, disables both time controls, and
  switching off reloads defaults. No native US/AM-PM fallback.
- Right desktop menu, honest disabled search/my-shifts, narrow modal drawer
  Tab/Escape/exact opener; no page overflow at either narrow width. Both actual
  shift time values are above the **844px** fold. Palette/RTL/landmarks checked.
- Actual row/detail/back and next/previous offsets; direct detail keeps collapsed
  diagnostic ID form and honest missing-origin landing. Long 38-digit ID,
  40-character name, escaped raw markup, secondary metadata and text spacing
  reflow; raw source is text, not HTML.
- **Exact reload focus 4/4**: 1440/320 × terminal 200/503, actual keyboard Space,
  saved DOM object identity pending/terminal, one request despite repeat Space.
  New list refresh equivalent is independently covered by Angular unit tests.
- Real delayed detail **and list** A/B races; explicit detail 401/403/404/500/503,
  list 400/401/403/500/503, empty result, failed/malformed identity and explicit
  context retry. No automatic fixture fallback, data on identity failure,
  browser storage, external runtime requests or JS exceptions.
- Separate non-intercepted fixture proxy run at **1440×900 / 390×844** uses
  synthetic `15/10/2026 23:59` and day 2001: real backend G01/J01 labels,
  list/detail 200/no-store, full overnight dates, real browser Back restores
  filters/page/vertical **and table** scroll/exact opener. Script refuses Oracle
  identity before opening business UI. Fixture may legitimately show empty at
  the current server minute; application never supplies a fake row.

Representative approved token contrast calculations (not a rendered/full audit):
navy/white **14.88:1**, primary/white **5.00:1**, primary/soft **4.52:1**,
muted/white **6.37:1**. Synthetic screenshots only under ignored
`.angular/browser-evidence/ui01-*.png`; desktop/mobile list/detail/picker,
loading/empty/error, long text and separate proxy snapshots. Representative
desktop/mobile images were opened for visual review.

### Explicit not-run checks / remaining owners

No browser against Oracle or live employee data; Oracle adapter/driver/runtime
readiness belongs to **backend owner + caller**, not a missing frontend API
approval. No screen-reader/AT, exhaustive contrast/zoom or full WCAG 2.2 audit;
QA owns independent acceptance. No deployment/release, full SHF migration,
search/my-shifts, edit/export/totals, live DB/EMS, batch or legacy execution.
All shared contract prerequisites assigned to this frontend are now available.

### Final checks after all source edits — 15:23 +03:00

| Exact command | Final result |
|---|---|
| `npm test` | **PASS 73/73**, six files: current page 27, detail 30, detail generations 7, list generations 3, shell 2, wire boundary 4; no unhandled errors |
| `npm run typecheck` | **PASS**, strict no-emit TypeScript against the now-published canonical source union |
| `npm run build` | **PASS**, strict Angular templates and optimized production-format build; initial **534.67 kB**, lazy list **311.79 kB**, no budget warnings/errors |
| `node checks/browser-check.mjs` | **PASS**, final actual Angular/Chrome 155 synthetic-intercepted matrix, all three viewports, calendar/picker/menu/focus/navigation/states and both list/detail races; exact reload 4/4 |
| `node checks/fixture-proxy-check.mjs` | **PASS**, final actual non-intercepted Angular/proxy/fixture API at 1440/390; list/detail 200 and no-store, real browser Back, filters/page/vertical+table scroll/exact opener |

Final return edge-case: if re-reading the remembered page no longer includes
the originating row, focus the real results heading and announce that the row
is absent. Do not invent a row/opener or leave focus on BODY. This branch is
covered by the added Angular/mocked-HTTP case; browser runs cover the actual
successful-origin return and were rerun after the final change.

Authored paths (all relative to this directory):
`src/workspace-shell.{ts,html,scss,spec.ts}`,
`src/current-shifts-page.{ts,html,scss,spec.ts}`,
`src/current-shifts-contract.ts`, `src/current-shifts-fixtures.ts`,
`src/current-shifts-generation.spec.ts`, `src/civil-date-adapter.ts`,
`src/minute-picker.ts`, `src/list-navigation.ts`, `src/api.ts`,
`src/contract.ts`, `src/contract.spec.ts`, `src/routes.ts`,
`src/shift-day-page.{ts,html,scss,spec.ts}`, `src/generation.spec.ts`,
`src/test-fixtures.ts`, `src/styles.scss`, `fixtures/current-shifts.synthetic.json`,
`checks/browser-check.mjs`, `checks/fixture-proxy-check.mjs`, `README.md`,
and this `VERIFICATION.md`. No manifests, lockfiles or proxy settings changed.

Owned verification processes only: fixture API **22604** (4310), Angular dev
server **24584** (4320), separate Chrome **2452** (9322, dedicated
`.angular/ui01-browser` profile), all stopped. Final rerun used new owned fixture
API **288**, Angular **1444**, Chrome **17452** on the same checked loopback ports;
all three final helper sessions also stopped. These were temporary self-contained
verification helpers, not a user demo or deployed service.

---

# Historical SHF-RW-05 verification — 2026-10-15

Status: **D01/H01 fixes implemented and locally retested; narrowed independent
SHF-QA-02 retest pending through caller**. Only `frontend/fixture-slice/`
authored. No commit/push or deployment. Approved contracts: §13 v0.1 (API/
identity) and §14 v0.1 (UI), plus the caller's explicit tooling/scaffold approval
at 13:07 +03:00. Node 24.21.0 / npm 11.19.0 observed locally.
The 13:26 calendar instruction is accounted for: §14 has string-ID inputs only;
all dates are read-only, so a datepicker is not applicable in this slice.

## Initial implementation checks (historical, before SHF-QA-02)

Working directory unless noted: `D:\AIProjects\SHFAI\frontend\fixture-slice`.

| Command | Result |
|---|---|
| `node --version`; `npm --version` (repository root) | v24.21.0; 11.19.0 |
| `npm install --no-audit --no-fund` | Passed; created local package lock. Repeated after test DOM addition. |
| `npm view jsdom@27.1.0 version engines peerDependencies --json` | Node 24 supported; optional canvas not needed |
| `npm view vitest@4.0.8 engines peerDependencies --json` | Node >=24 and jsdom `*` supported |
| `npm view @angular/build@21.2.27 engines peerDependencies --json` | Node >=24, TS >=5.9 <6 and Vitest ^4.0.8 supported |
| `npm view @angular/material@21.2.14 peerDependencies --json` | CDK exactly 21.2.14, Angular ^21/^22 and RxJS ^7.4 supported |
| `npm test -- --include=src/contract.spec.ts` | Final pass: 3/3 |
| `npm test -- --include=src/shift-day-page.spec.ts` | Final pass: 28/28 |
| `npm test -- --include=src/generation.spec.ts` | Final pass: 7/7 |
| `npm test` | Final pass: 38/38, 3 files; Angular test build also passed |
| `npm run build` | Pass: optimized build, strict Angular templates; initial bundle ~459 kB, no budget errors |
| `npm run typecheck` | Final pass: strict TS no emit |
| `node checks/browser-check.mjs` | Reported pass: actual Chrome 155.0.8059.40, Windows, headless CDP. Reload focus assertion was subsequently proven false-positive by QA (H01); this historical pass did NOT establish reload focus correctness. |
| `git --no-pager diff --check` | Pass for tracked diff; new frontend paths enumerated with `git ls-files --others --exclude-standard .` |

First focused execution was performed immediately after the first coherent
implementation. Failures were repaired, not hidden:

- Angular builder required jsdom/happy-dom: added exactly jsdom **27.1.0** after
  published engine/peer verification, test-only.
- TS `String.isWellFormed` lib mismatch: equivalent Unicode lone-surrogate
  rejection without raising browser/library requirements.
- TS5096 for `allowImportingTsExtensions`: removed the unnecessary option;
  **type-only** `.mts` imports compile without it.
- Windows Vitest fork worker timed out/hung; stopped owned test session and used
  one worker thread. Focused rerun passed.
- Component test required DOM iterable types: added `DOM.Iterable`.
- Actual browser found Material omits aria-invalid on empty required input:
  explicit presentation binding added; browser and unit retests passed.
- First long fixture was 41 characters: corrected to exactly 40. PowerShell's
  default decoding corrupted Hebrew: restarted the owned backend using explicit
  `Get-Content -Raw -Encoding UTF8`; documented that exact command.
- Browser viewport checks now wait for responsive style recomputation before
  collecting screenshots/bounds; initial immediate measurements were discarded.
- Final deep-link regression test found the identity-loading reset cleared an
  initial malformed-route summary. Preserved that local route error, reran the
  focused test (7/7), complete suite (38/38), build and typecheck successfully.

No audit scan is claimed. npm reported deprecated transitive `whatwg-encoding`
and notices about four dependency install scripts; no blanket script approval,
dependency upgrade or global installation was made. Actual tests/build succeeded.

## SHF-QA-02 D01/H01 correction and measured retest — 13:39 +03:00

**History retained:** QA's pre-fix typecheck/build, 38 unit tests and general
browser check passed. QA also reported 18/18 extended groups formally passing,
but recognized that their textual reload-focus check was inadequate. The exact
element-identity check then **failed 4/4** combinations (1280/320 × 200/503):
focus became BODY both pending and terminal. Therefore the previous overall
browser pass was not evidence of UI02-03 reload-focus acceptance.

- **D01 (application, Medium/P2):** native loading `[disabled]` on reload caused
  browser focus loss. `src/shift-day-page.html` now keeps reload natively enabled
  and focusable while loading, with `aria-disabled="true"` and `aria-busy="true"`.
  Native disabling still applies to absent permission/dirty context. The existing
  `reload()` loading/identity/dirty guard is unchanged and suppresses repeat work;
  this is not a delayed focus-restoration workaround.
- **H01 (harness):** removed the `activeElement.textContent.includes(...)` oracle
  that also matched BODY. The harness saves the specific reload DOM element and
  asserts **`document.activeElement === globalThis.__shfReload`**, during a held
  GET, after repeated activation, and after terminal rendering/focus timers.
  Activation is actual CDP **Space keyDown/keyUp**, not `.click()`. Each of the
  four cases starts with the exact `1001/2001` pair, sends first Space, holds the
  response, sends two more Spaces, then releases 200 or 503.

Changed source paths in this correction only:
`src/shift-day-page.html`, `src/shift-day-page.spec.ts`,
`checks/browser-check.mjs`, and this existing `VERIFICATION.md`.
No DTO/API/type/tooling/dependency changes, Git operations, new report, backend
edits, live infrastructure or nested agents.

Exact commands from `frontend/fixture-slice/`:

| Command | Post-fix result |
|---|---|
| `npm test -- --include=src/shift-day-page.spec.ts --filter='D01/H01'` | PASS: **2/2**, 28 unrelated tests skipped by explicit filter. Covers pending native focusability, aria-disabled/busy, exact identity, repeated clicks/handler/submit suppression and terminal 200/503. jsdom only; browser required for native focus behavior. |
| `npm test` | PASS: **40/40** (original 38 + 2 new), 3 files: 30 + 7 + 3 |
| `npm run typecheck` | PASS, strict TypeScript no emit |
| `npm run build` | PASS, strict templates/optimized build; initial **459.60 kB**, no budget errors |
| `node checks/browser-check.mjs` | PASS: Chrome **155.0.8059.40**, Windows, headless CDP; exact matrix below plus retained general/long-string/RTL/validation/race checks |

Actual browser, delayed **isolated intercepted HTTP** detail responses (initial
general workflow still uses real Angular proxy → loopback fixture backend):

| CSS width | Response | Pending activeElement === saved reload | Terminal activeElement === saved reload | Detail GETs including repeated Space |
|---|---|---|---|---|
| 1280 | 200 | **true** | **true** | **1** |
| 1280 | 503 | **true** | **true** | **1** |
| 320 | 200 | **true** | **true** | **1** |
| 320 | 503 | **true** | **true** | **1** |

All four also assert that the saved button is the same connected reload element,
native `disabled` is false pending, aria-disabled/busy are true pending and false
at terminal, and old data is absent while loading. No substring-based focus
assertion remains. Browser check also reported no external app-runtime requests,
uncaught exceptions or local/session storage. Final sampled focus-outline ratio
was **12.53:1**; earlier sampled contrast values below are historical.

Verification-only startup used the README UTF-8 synthetic environment commands,
`npm start -- --port 4320`, and Chrome with isolated profile
`.angular/d01-browser`/loopback debug port 9322. Cleanup completed: owned Angular
and fixture sessions stopped, verified Chrome executable/profile before
`Stop-Process -Id 23468`; final listener probe found **no 4310/4320/9322 listeners**
and no remaining Chrome process using the D01 profile.

**Next owner/action:** caller returns these changed files/evidence to the **same
SHF-QA-02 QA** for narrowed independent D01/H01 retest. This implementation-owner
pass is not independent QA closure or publication approval.

## Acceptance evidence by UI02

| ID | Executed evidence and limits |
|---|---|
| 01 Context/identity | Angular router + mocked HTTP: exact pair, one GET/no query/body, no default employee, null synthetic employee, missing capability blocks. Actual browser: real dev proxy to fixture backend; distinct synthetic/password and fixture notices. |
| 02 Bounds | Unit/HTTP: empty/space/leading zero/sign/exponent/localized digits, 38/39 employee and 10/11 day digit bounds, exact preservation in URL/request/result. Browser: required/format errors, 38-digit fixture. Clipboard hardware/AT not tested. |
| 03 Keyboard/focus | Initial reload-focus claim was invalidated by QA D01/H01. The post-fix exact four-case real-Space/held-response matrix above passes; independent QA retest pending. Other DOM/browser first-invalid/result/error and Tab/Shift+Tab/Enter evidence retained. Full manual every-action Space sequence/AT is not claimed. |
| 04 Structure/names | Unit: one main/h1, skip link, labels/hints/errors/aria-invalid. Browser: Hebrew lang, RTL, native keyboard; explicit aria-invalid fix. Hebrew screen-reader pronunciation/announcement counts not verified. |
| 05 Reflow | Actual 1280 and 320 CSS-pixel Chrome, long name/raw values/ID, essential control bounds, multiline errors, text-spacing overrides, no page-level horizontal overflow; synthetic screenshots viewed. Actual browser 400% zoom and 200% text scaling not run. |
| 06 Contrast/targets | Browser samples: text and error/button contrast >=4.5; current action targets >=48x48; sampled invalid boundary/focused result outline >=3. Not an exhaustive hover/disabled/all-color-state audit. |
| 07 RTL/dates | Unit + actual browser: full overnight dates/seconds, end-before-start left intact, null unavailable, escaped raw activity. Local-calendar leap/year validity tests. No zone conversion/elapsed duration. Mixed-direction screenshot review performed. |
| 08 States/errors | HttpTestingController covers initial/identity loading/failure/retry, detail loading/success/all-null, 400/401/403/404, both 503 and three 500 codes, network/unknown/HTML/mismatched responses. Initial 503 reload-focus assertion was insufficient; superseded by exact post-fix matrix above. |
| 09 Freshness/races | Real HTTP test backend cancellation + deliberately uncooperative subscription double: late A success/error after B, input edit, identity invalidation, old identity completion/error, destruction, route changes, duplicate submit, failed reload. Actual browser intercepted delayed-A/B race passed. |
| 10 Boundaries | Runtime guards/HTTP tests reject mismatch/Oracle/invalid identity and dates; text interpolation verified with literal markup (no executable nodes). Browser storage empty; no external application runtime requests or uncaught browser exceptions. Static source has no mutation/cache/credentials/live infrastructure client. |

Browser screenshots are ignored synthetic artifacts, not personal data:
`.angular/browser-evidence/desktop-rtl.png`, `narrow-rtl-long.png`,
`narrow-text-spacing.png`. Real integration uses only the existing loopback
fixture service, not Oracle/EMS/real login. Error/race browser cases explicitly
use CDP-isolated mocked HTTP. Tests using jsdom are **not** browser results.

Initial browser samples (historical contrast ratios): body 16.34, error 6.15, primary button
6.45, secondary button 6.13, invalid boundary 6.15, focused result outline 16.34.
Visible result outline width/style and minimum 48px action bounds were asserted.
These representative samples are not a whole-theme conformance result.

Initial-run cleanup completed: stopped the owned Angular and fixture PowerShell sessions;
verified isolated Chrome executable/profile before `Stop-Process -Id 25992`.
Final `Get-NetTCPConnection` probe found **no listeners on 4310/4320/9322** and no
remaining Chrome process with this isolated profile. No verification service
was intentionally left running.

## Source and review limits

Read-only controlling sources: `old/SHF/src/bzq/shf/model/ShiftDataModel.java`
150–244; `old/SHF/src/bzq/shf/bean/AgentDayBean.java` 967–1030;
`old/SHFWeb/WebContent/jsp/show_original_shift_popup.jsp` 49–74.
The approved baseline explains the action/route chain and intentional target
differences; no legacy behavior was executed. Normative type imports reference
`backend/fixture-slice/contracts.mts`, unchanged by this task.

D01/H01 local fix/retest is complete; independent QA closure remains with the
same SHF-QA-02 reviewer through the caller. QA owns outstanding screen-reader/manual
keyboard/zoom/text-scale/full contrast matrix evidence and Hebrew business-copy
review. Architect owns future contract revisions; deployment/real identity/live
infrastructure are outside this task. Passing these checks is not WCAG sign-off,
release approval, authentication proof or permission to deploy a synthetic demo.
