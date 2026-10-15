# SHF-RW-05 — single effective shift-day inquiry

Approved §13 API/identity **v0.1**, §14 UI **v0.1** of
`../../docs/SHF_REVERSE_ENGINEERING_DESIGN.md`. Tooling/scaffold explicitly
approved by the caller's user handoff on 2026-10-15 13:07 +03:00.
This is one read-only Hebrew/RTL Angular page, not employee/day discovery,
real authentication, a production mock switch, or a deployment.

## Windows install / checks

Run from this directory, using **Node 24.21.0 / npm 11.19.0**:

```powershell
Set-Location D:\AIProjects\SHFAI\frontend\fixture-slice
npm ci --no-audit --no-fund
npm test -- --include=src/contract.spec.ts
npm test -- --include=src/shift-day-page.spec.ts
npm test -- --include=src/generation.spec.ts
npm test
npm run build
npm run typecheck
```

`npm test` uses Angular's unit-test builder + Vitest + jsdom, not a browser.
Vitest's single worker **threads** pool avoids the Windows fork/IPC startup
timeout observed here. No globally installed Angular CLI is needed.
`npm run build` is an optimized **production-format build only**, with strict
Angular templates; it does not start services or authorize production usage.
`npm run typecheck` is the additional strict TypeScript no-emit check.
Generated `dist/`, `.angular/`, coverage and node_modules are ignored locally.

Pins: Angular runtime/common/compiler/compiler-cli/forms/router/platform-browser
21.2.25; CLI/build 21.2.27; Material/CDK 21.2.14; TypeScript 5.9.3; RxJS 7.8.2;
tslib 2.8.1; Vitest 4.0.8. `package-lock.json` pins the resolved tree.
The only added test-support dependency is **jsdom 27.1.0**: the first Angular
test invocation explicitly required a DOM environment. Published package
engines allow Node `^20.19.0 || ^22.12.0 || >=24.0.0`; Vitest accepts jsdom `*`.
The optional jsdom canvas peer is not needed/installed.

Compatibility evidence: caller supplied official Angular 21 LTS matrix
(Node ^24, TS >=5.9 <6, RxJS ^7.4); published `@angular/build` engines/peers
and Material/CDK exact pairing were also checked with `npm view`.
References: <https://angular.dev/reference/versions>,
<https://material.angular.dev/guide/theming>,
<https://registry.npmjs.org/@angular%2fbuild/21.2.27>,
<https://registry.npmjs.org/jsdom/27.1.0>.
The installed Material API compiles a real `mat.theme` Material 3 theme.
Arial/system fallback only: no CDN fonts/icons or external runtime assets.

## Explicit synthetic backend + proxy run

Backend startup **fails closed** without its explicit environment configuration.
No new backend endpoint or CORS policy is supplied here. In a separate terminal
from **repository root**, load only the supplied synthetic fixtures:

```powershell
Set-Location D:\AIProjects\SHFAI
$env:SHF_FIXTURE_CONFIG = Get-Content frontend/fixture-slice/fixtures/config.synthetic.json -Raw -Encoding UTF8
$env:SHF_FIXTURE_ROWS = Get-Content frontend/fixture-slice/fixtures/rows.synthetic.json -Raw -Encoding UTF8
$env:SHF_FIXTURE_PORT = '4310'
node backend/fixture-slice/server.mts
```

**Use `-Encoding UTF8`**, including on Windows PowerShell 5: default decoding
can corrupt Hebrew and invalidate the source-length bounds. Ctrl+C stops the
backend; clear these environment variables when finished. Do not reuse personal
data or credentials in either variable/file.

The config explicitly enables a synthetic Administrator for local development,
unit allowlist `TEST-U`, `isolated-fixture`, synthetic interpretation zone
`Asia/Jerusalem`. Neither zone nor unit is a confirmed live-business setting.
Production + synthetic mode is rejected by the existing backend; there is no
browser flag or frontend Administrator fallback. A UI notice is not an
authorization control. Identity is not an employee or an authorization token.
The backend enforces capability, employee context and row/unit policy on every GET.

In this directory, second terminal:

```powershell
npm start
# http://127.0.0.1:4200/shift-day
# Ctrl+C when finished
```

`proxy.conf.json` sends `/api/**` only to **http://127.0.0.1:4310**.
Change that explicit loopback target if your isolated fixture port differs.
Do not broaden CORS, expose this demo publicly, or deploy it.
The API serves only GET identity and GET employee/day; the dev server serves
Angular client routes. Enter these **known synthetic pairs**, never a password:

| Employee | Day | Purpose |
|---|---|---|
| `1001` | `2001` | Hebrew names, overnight dates and seconds, null attendance |
| `99999999999999999999999999999999999999` | `2002` | 38 digits, 40-character name, 100-character raw activity/escaped markup, end-before-start local values |

No pair is prefilled. Any unavailable/context-denied pair gets the same 404 UI.
Known deep link: `/employees/1001/shift-days/2001`; initial form: `/shift-day`.
Back/Forward restores the route pair and re-reads; there is no list or `/me`.

Calendar instruction (2026-10-15 13:26 +03:00): use accessible Hebrew/RTL Material
calendar/datepicker for relevant **date-valued inputs** in approved workflows.
There are **no date-valued inputs in §14**: these two fields are string IDs,
including the day-record ID, not a calendar date. All dates here are read-only.
Consequently no decorative/nonfunctional datepicker or invented date filter/API
has been added. Read-only local components retain their dates without UTC shift.

## Structure / contract boundary

- `src/contract.ts`: **type-only imports** of the normative backend `.mts` DTOs,
  plus runtime guards of unknown JSON, IDs, Unicode bounds, local calendar/time,
  IANA interpretation zone, identity consistency and fixture source.
  The build erases these imports: no backend runtime code enters the browser.
  This bounded app therefore builds within this repository alongside that file.
- `src/api.ts`: only the two approved GETs, no query/body overrides, no-store
  fetch, no automatic retries/persistent business cache or mutation.
- `src/routes.ts`: one shared matcher keeps the same component alive between
  form/detail URLs, avoiding double identity/detail GETs on submit.
- `src/shift-day-page.*`: standalone signals, typed reactive form, Material
  fields/buttons/progress; editable versus committed context; separate identity
  and detail generations, cancellation, teardown and late-response rejection.
  401 clears identity; 403 disables detail until explicit identity recheck.
  Unknown/malformed/mismatched or unexpected Oracle responses never expose rows.
- `src/styles.scss`: Material 3 theme, logical layout, visible focus, reduced motion.

No business overlay calculation, duration, timezone conversion, source-label
catalog, role expansion, password claim or business default exists here.
Raw activity remains one escaped text value, including whitespace/semicolons.
Local dates are losslessly rearranged, not passed through a Date/UTC conversion.

Source-observed evidence (read-only): `ShiftDataModel.populateShift` lines
150–244; `AgentDayBean` effective getters around 967–1030; the JSP
`show_original_shift_popup.jsp` lines 49–74. Its effective start/end getters,
not its “original” name, control this projection. §13.1/§14.1 carry the fuller
route/action/source trace; the source contract catalog is absent. No legacy
build/execution or live Oracle/EMS/DDL/batch operation was performed.

## Optional actual Chrome checks (no additional npm package)

`checks/browser-check.mjs` uses Node's built-in WebSocket and Chrome DevTools
Protocol. It assumes **your own isolated** loopback processes:

1. Start the explicit backend above on 4310.
2. In this directory: `npm start -- --port 4320`.
3. Start a separate, empty Chrome profile (use your installed executable path):

```powershell
$profile = Join-Path (Get-Location) '.angular/browser-check'
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --headless=new --no-first-run --no-default-browser-check --disable-background-networking --disable-component-update --disable-sync --remote-debugging-address=127.0.0.1 --remote-debugging-port=9322 "--user-data-dir=$profile" about:blank
```

4. In this directory: `node checks/browser-check.mjs`.

Never connect this script to a normal/personal browser profile. It navigates the
first page on the **isolated** debug port. It first uses real proxy/fixture HTTP,
then clearly isolated intercepted detail responses for 503 and delayed-A/B race.
Screenshots (synthetic only) go to ignored `.angular/browser-evidence/`.
Output reports viewport/reflow, keyboard/validation/focus, representative measured
theme contrasts/targets, literal markup, external requests and runtime exceptions.

Stop all your verification processes afterwards. Ctrl+C the dev/backend terminals;
close the isolated browser. If needed, find the **specific** owned debug listener
PID with `Get-NetTCPConnection -LocalPort 9322 -State Listen`, verify its executable/
profile, then `Stop-Process -Id <that-owned-PID>`. Do not stop unrelated browsers.

## Verification scope / remaining manual QA

See `VERIFICATION.md` for this run. Unit/DOM checks do **not** demonstrate visual
layout, screen-reader output or full WCAG conformance. Actual browser checks
supplement them; they do not replace a Hebrew screen-reader pass, manual complete
keyboard review, actual 400% browser zoom/200% text scaling, all state/hover/
disabled contrast measurements, OS/AT/browser matrix or business Hebrew review.
These are QA follow-up evidence, not newly invented implementation gates.
