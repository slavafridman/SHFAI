# SHF-RW-05 verification — 2026-10-15

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
