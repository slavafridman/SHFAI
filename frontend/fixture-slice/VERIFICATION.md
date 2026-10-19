# SHF-ATTENDANCE-UI-19 — whole keyboard-modal readiness / two cold Chrome checks

**Status: developer verification PASS within the requested bounded plan;
ready for SAME-QA final stock-full retest.** Latest QA failure was earlier than
the picker check: the initial calendar was mounted/open but ignored its Escape.
That remains a historical **nonpass**. D01/D02/H02 closures are caller-reported
and not reopened; no new application defect or publication approval is claimed.

## Actual underlying evidence (not a per-assertion workaround)

- **Source-observed:** installed Material21.2.14 `datepicker.mjs` implements
  `close()` with an early return when the content instance `_isAnimating`.
  Its native overlay close stream does call preventDefault and `close()`;
  DOM presence/DOM day focus alone does not imply the opening handler can close.
  CDK21.2.14's `OverlayKeyboardDispatcher` attaches a native **body keydown**
  listener while overlays are attached.
- **Runner-source defect:** old startup bound the first page from `/json/list`,
  did not establish active WebContents/document focus, and initial calendar
  Escape waited only for `mat-calendar` DOM presence. Review-only had a more
  complete calendar geometry barrier, explaining the different entry paths.
- **Observed on BOTH independent cold runs:** a newly created CDP page before
  activation had `{hasFocus:false, visibility:'visible'}`. The initial calendar
  admission saw a finite opening animation (`peakFinite=1`), then waited for0
  and3 stable frames. No intentionally unsafe extra Escape was sent to recreate
  the old failure. The evidence supports the missing admission conditions;
  it does not invent an application keydown fault.
- **After readiness:** one calendar Escape was delivered as trusted keyCode27
  keydown/keyup to an actually focused document, with one installed body handler.
  Calendar dismissal/exact opener assertions passed. FROM/TO select/dialog
  pairs also passed after the same common admission and existing lifecycle
  checks. No ignored ready key was observed, so application handlers were not
  modified.

## Exact changed paths / root implementation

All writes under `frontend/fixture-slice/`:

- New `checks/keyboard-modal.ts`: one self-contained bounded observer for live
  Material calendar/select/dialog and native dialog. Actual document focus,
  intended scope/trigger relationship, aria/open state, no closing select above
  the dialog,0 finite scoped animations and3 identical geometry frames. Ignores
  infinite decorative ripples, never sends a key/focuses/closes anything.
- `checks/browser-check.mjs`: a fresh **owned** CDP target via `/json/new`,
  close only that target afterwards; Page.bringToFront plus actual
  `document.hasFocus()`/visibility before native input, mouse and key-down.
  Every native Escape goes through shared modal readiness, installed listener
  inspection via DOMDebugger, and temporary observational key-event evidence.
  Actual keydown/keyup must be trusted, focused and keyCode27. Calendar
  activation is real native Enter, not Runtime `.click()`/`picker.open()`.
- `checks/attendance-browser-check.mjs`,
  `checks/attendance-review-check.mjs`: use the same active-page native toggle
  activation. No initial/narrow/review Escape bypasses the central barrier.
- New `src/keyboard-modal.spec.ts`:7 focused regressions.
- `README.md`, this file.

No application TypeScript/template/CSS/layout, calendar/picker acceptance
threshold, existing H01 helper, API/canonical/backend, manifests/dependencies,
legacy, Git, database or agent changes. Approved §35/36/37 v0.1 unchanged.
No unrelated page/network-idle wait, animation disabling, fake hasFocus,
arbitrary sleep, Escape retry, Cancel substitution or assertion weakening.

## Native-key evidence / bounded outcomes

Before Escape: Page.bringToFront, actual focused/visible document, focus inside
the frozen intended modal (or its controlling select trigger),3 stable
geometry/control/focus samples,0 finite animations and an installed CDK
body-keydown listener (native dialog uses its cancel listener). Deadline5000ms.
Then exactly one original keydown/up pair. Postconditions remain authoritative;
an ignored ready key would fail, not cause another Escape.

| Deliberate check | Isolation / result |
|---|---|
| cold FULL attendance A | new `.angular/attendance-cold-keyboard-a-19`, new Chrome process: **PASS** |
| stock review-only | one run after A, fresh owned tab: **PASS** |
| cold FULL attendance B | A process stopped/profile removed; new `.angular/attendance-cold-keyboard-b-19`, independent new Chrome process: **PASS** |

Exactly **two cold full attempts**, each passed on its first invocation; no
retry-until-green or third full attempt. Both profiles were required absent
before startup. Same unchanged readiness/key behavior was used; only the
diagnostic defaultPrevented read was corrected from a too-early capture
checkpoint to after native keyup before review/B. A's capture-time false flag
was not an assertion or a swallowed-key claim; actual close assertions passed.
B's final event report records `prevented:true`.

Both FULL runs include:

- initial calendar **one Escape**, actual focus true, trusted keyCode27,
  handlerCount1,0 finite animations and3 stable frames at dispatch;
- FROM/TO: original hour prep, then exactly **two separate** minute-select /
  dialog Escapes, exact opener and both values unchanged; no third recovery key;
- all62 physical calendar date selections, minimum45.703125×45.6875px,
  cornerFailures0/offscreen0/page overflow none, normal and root/main/day30px;
- unchanged D01 keyboard lifecycle:3px ring,12.62:1, same DOM/focus and one GET;
- no browser storage, external runtime requests or JS exceptions.

The single review-only run retains the same62 dates, D01 checks and settled
old-search calendar comparison. All test data/interception is synthetic.
No Oracle or backend fixture server was started for these intercepted runs.

## Exact check commands / scope

Directory `frontend/fixture-slice`:

```powershell
npm test -- --include src/keyboard-modal.spec.ts --include src/calendar-geometry.spec.ts --include src/picker-overlay.spec.ts --include src/browser-readiness.spec.ts
npm run typecheck
```

**20/20 helper regressions PASS**,4 files:7 whole-modal +6 geometry +3 picker
lifecycle +4 context readiness. Existing strict app typecheck PASS; the focused
Angular build also compiles the imported checker TS.
New cases cover a mounted focused calendar with unfocused document, finite
opening animation, moving geometry, select trigger outside listbox/infinite
ripple, closing select above dialog, native modal support, and bounded refusal
when actual focus remains outside the live calendar. Synthetic unit geometry
is not relabeled as native browser evidence.

Chrome155 stock commands used
`SHF_UI_URL=http://127.0.0.1:4348`,
`SHF_CDP_URL=http://127.0.0.1:9368`:

```powershell
$env:SHF_ATTENDANCE_ONLY='1'
node checks/browser-check.mjs # cold A: review flag absent
$env:SHF_ATTENDANCE_REVIEW_ONLY='1'
node checks/browser-check.mjs # single review
# Stop only own A, verify port free; launch NEW independent B profile.
# Use fresh shell/environment (review flag absent):
$env:SHF_ATTENDANCE_ONLY='1'
node checks/browser-check.mjs # cold B
```

No manual synchronization/runtime patch. No broad old tests, production build,
actual proxy, Oracle/native DB, deployment or WCAG audit rerun in this bounded
harness correction. The prior aggregate results remain prior/caller results;
no new aggregate full unit-suite pass is claimed. Existing Node module-type
warning unchanged. Prior initial-calendar and picker/geometry failures remain
below; there were no failed full attempts in this bounded A/B verification.

## SAME-QA last full retest

Owner: **SAME independent QA through caller**. Recreate a fresh own Chrome
profile and free Angular/CDP helpers, run stock full attendance with only
`SHF_ATTENDANCE_ONLY=1`. Check initial native calendar Escape, actual
document.hasFocus/key delivery/listener evidence, FROM/TO pairs and all original
D01/D02 criteria. Any key ignored **after** readiness must stay FAIL with the
event report; do not add another Escape. Publication stays with caller after
that retest. No new approval or API gate.

Cold-check teardown verified: own A process/profile removed before B startup;
after B, only `attendance-cold-keyboard-ui` and `attendance-cold-keyboard-b`
were stopped.4348/9368 are free; only the own A/B profile directories were
removed. No backend, user or parent-QA process/profile/port was altered.
Ignored synthetic evidence is retained.

---

# Historical narrow select/dialog Escape-stack checker correction

**Status: developer verification PASS; ready for SAME-QA final narrow full-runner
retest.** Caller reports independent closure of D01/D02/H02. The new finding
was a reproducible checker sequence: two native Escapes sent while the minute
select was closing; panel closed, dialog remained, focus `picker-minute`.
An operator's extra Escape after settling closed it with values unchanged.
That historical timeout remains a **nonpassing run**, not a confirmed app bug.

## Exact paths / scope

All writes under `frontend/fixture-slice/`:

- New `checks/picker-overlay.ts`: bounded, contract-specific state observer for
  this minute picker's select-open/select-closed/dialog-closed phases.
- `checks/attendance-browser-check.mjs`: call the observer between the original
  separate native Escape inputs; also wait for the original preparatory hour
  select's dismissal before opening the minute select.
- New `src/picker-overlay.spec.ts`:3 focused checker lifecycle regressions.
- `README.md`, this file.

**No application, CSS/layout, calendar geometry checker, H01 shared input
helper, API/canonical/backend, dependency/manifest, Git, database or agent
change.** Approved §35/36/37 v0.1 and all prior44px/corner/focus criteria remain.

## Root sequence / non-weakened assertions

For each FROM and TO target:

1. Observe the real select panel/dialog IDs, expanded aria and finite scoped
   overlay animations. Infinite decorative animations do not block this check.
2. Send **one native Escape** to the minute select.
3. Require panel absence, `aria-expanded=false`, actual focus exactly on
   `picker-minute` inside the still-open dialog, no active finite select/dialog
   animations and **2 consecutive rAF observations** of that same state.
4. Only after those facts, send **one second native Escape** to the dialog.
5. Require no dialog container, focus on the exact
   `attendance-timeFrom-open` / `attendance-timeTo-open`, and opener
   `aria-expanded=false` (set by the application's afterClosed subscription).
   Assert **both** filter values unchanged.

The observer itself sends no key, does not close/focus any component and has a
**5000ms rejecting deadline**. No arbitrary sleep, retry, Cancel activation,
third Escape, skipped assertion or operator-only patch. The hour-select Escape
earlier in the existing test is a separate preparatory interaction, not an extra
key to force the minute-select/dialog pair to pass.

## Exact checks / bounded final sequence

Working directory: `frontend/fixture-slice`.

| Exact command | Result |
|---|---|
| `npm test -- --include src/picker-overlay.spec.ts` | **3/3 PASS**, synthetic checker lifecycle/animation fixtures |
| `npm run typecheck` | **PASS**, existing strict app TypeScript check; focused build also typechecks imported helper |
| `node checks/browser-check.mjs`, `SHF_ATTENDANCE_ONLY=1` | **stock full attendance PASS**, first successful deliberate check |
| same plus `SHF_ATTENDANCE_REVIEW_ONLY=1` | **stock review-only PASS** |
| same after removing `SHF_ATTENDANCE_REVIEW_ONLY` | **stock full attendance PASS**, exactly one fresh-document repeat |

All three browser invocations were in one exit-code-gated sequence, using own
`SHF_UI_URL=http://127.0.0.1:4348`,
`SHF_CDP_URL=http://127.0.0.1:9368`, isolated Chrome155 and intercepted synthetic
APIs only. Full runner performs fresh `Page.navigate` document entry. There
were **exactly two fully successful full-attendance checks**, not an unbounded
rerun loop. No failed development browser invocation in this follow-up.

Both full passes log, independently for FROM and TO:
`selectFocus=picker-minute`, dismissalStableFrames2, finiteAnimations0,
the matching exact opener and unchangedValues=true. The dialog is explicitly
asserted still open between the first and second Escape, then absent afterwards.
No BODY/ancestor approximation.

All three runs preserve the existing D01 checks and D02's31 normal +31
root/main/calendar30px physical selections. Each D02 variant still reports
minimum45.703125×45.6875px,3 stable geometry frames,0 finite animations at
measurement,0 corner failures,0 offscreen targets and no page overflow.
Thus no44px/corner/focus criterion was lowered to fix the Escape checker.
Browser storage/external request/runtime-exception assertions remain PASS.

Three unit cases cover finite dismissal animation plus exact trigger focus,
dialog removal without afterClosed/opener readiness, and bounded rejection on
wrong focus with no injected key/third Escape. Unit fixtures are not claimed as
native browser behavior; the two full Chrome passes provide that evidence.

## Preserved history / limits / handoff

- The caller's original full-runner Escape timeout is retained above and older
  H02/initial nonpassing records remain below. Extra operator Escape demonstrated
  eventual closure but was **not** used by the final committed runner.
- Prior independent D01/D02/H02 closure is caller-reported; this correction
  does not reopen an app defect or silently relabel the timeout as PASS.
- No broad old suite, production build, proxy, backend/native Oracle or database
  run in this bounded harness-only follow-up. No new aggregate full-suite pass
  or WCAG conformance claim. Existing module-typeless warning unchanged.
- **SAME QA through caller** owns the final narrow stock-full retest. Recreate
  own free Angular/Chrome helpers per README, set only
  `SHF_ATTENDANCE_ONLY=1` (not review-only), run
  `node checks/browser-check.mjs`; observe the two Escape checkpoints for both
  targets, unchanged values/exact openers and all existing D01/D02 assertions.
  No new approval/contract gate.

Teardown verified: only `attendance-escape-ui` / `attendance-escape-chrome`
stopped;4348/9368 free; only `.angular/attendance-escape-profile-19` removed.
No backend/user/parent-QA helper or profile affected; synthetic ignored evidence
retained.

---

# Historical H02 calendar-measurement readiness follow-up

**Status: H02 checker correction implemented and developer-verified; ready for
SAME-QA D02 retest. Publication is still pending independent D02 closure.**
Latest caller retest closed D01/H01 and passed292/strict/build/base/card/items/
review and all four actual fixture-proxy variants. Remaining H02 was reproduced
by QA on the10th opening after9 selections: during Material animation,44px
rects and80 corner failures; after rendering,45.703×45.688px and0 failures.
That is **QA-reported timing evidence**, not a newly confirmed application
layout defect. Historical nonpassing runs below are not erased.

## Exclusive changed files for this follow-up

- New `checks/calendar-geometry.ts`: self-contained scoped animation/stability
  checker, shared verbatim by Chrome evaluation and focused regressions.
- `checks/attendance-review-check.mjs`: invoke the checker on every normal and
  root/main/calendar30px opening; native Enter on the real focused toggle,
  with every day selection still a physical mouse click. The old search
  calendar width comparison also samples settled geometry.
- New `src/calendar-geometry.spec.ts`:6 synthetic checker regression cases.
- `README.md`, this file.

All are under `frontend/fixture-slice/`. **No application TypeScript, templates,
CSS/layout, Material panel class, focus ring, API/backend/canonical, dependency,
manifest, legacy, Git or database changes.** H01's input/readiness helper is
not changed. No agent or unknown/user-port/process operation.
Authority remains approved §35/36 v0.1 + HTML#attendance +§37 v0.1.

## Exact measurable geometry-ready contract

For each calendar opening, including each of31 normal +31 font30 iterations:

1. Resolve only the requested calendar, its `.cdk-overlay-pane` subtree and
   own positioning-ancestor animations, not `document.getAnimations`, network
   idle or unrelated background UI. Require one current `mat-month-view`,
   exactly31 cells, October2026 period, the expected focused current day and
   coherent aria-active IDs on the calendar/root/descendants.
2. Active finite Web Animations must be finished; relevant counts are sampled
   both before and after geometry/style reads. Infinite-timing animations are
   ignored so an unrelated continuous focus ripple cannot stall the checker.
3. Require the same calendar/cell node identities and **exactly identical**
   rect/font/viewport/corner-hit snapshots on **3 consecutive rAF callbacks**.
   No geometric epsilon or reduced acceptance threshold is used.
4. Reject at **5000ms** if animation/context/geometry never becomes ready;
   cancel the rAF/deadline on completion or failure. There is no arbitrary
   sleep, test retry or catch-and-ignore.
5. Return the settled snapshot to the original assertions:31 targets,
   **width≥44 and height≥44**, viewport containment and all four inset-corner
   `elementFromPoint` hits, page overflow absent, physical selection and exact
   opener return. **Stable clipping/undersize is returned promptly and FAILS
   those unchanged assertions**, rather than waiting for a lucky passing frame.

The checker does not alter animations, CSS, selected dates, app state or focus.
The runner opens through native keyboard activation of the real toggle; it
does not call `picker.open()` or inject a DOM click. This makes opener focus
explicit during enlarged-text reflow; all date-target selections remain actual
mouse input.

## Checks actually run in this follow-up

Directory: `frontend/fixture-slice`.

| Exact command | Result / distinction |
|---|---|
| `npm test -- --include src/calendar-geometry.spec.ts` | **6/6 PASS**, final invocation, synthetic rAF/animation fixtures; not real geometry |
| `npm run typecheck` | **PASS**, existing strict `tsc --noEmit -p tsconfig.app.json` |
| `node checks/browser-check.mjs`, `SHF_ATTENDANCE_ONLY=1` | **PASS**, final stock full attendance; actual Chrome + synthetic API interception |
| same, plus `SHF_ATTENDANCE_REVIEW_ONLY=1` | **PASS**, final stock review-only immediately after full attendance |

Both final Chrome commands used
`SHF_UI_URL=http://127.0.0.1:4348`,
`SHF_CDP_URL=http://127.0.0.1:9368`, own Chrome155/profile. No runtime/operator
patch, disabled animations, rewritten assertion or per-failure retry was used.
An initial review-only pass also completed before the final paired run.

**Measured in EACH final command:**

| Signal | Normal | Root/main/calendar30px |
|---|---:|---:|
| geometry-ready opens / physical day clicks |31 /31 |31 /31 |
| minimum target width |45.703125px |45.703125px |
| minimum target height |45.6875px |45.6875px |
| consecutive stable rAF snapshots before assertion |3 |3 |
| active finite animations at measurement |0 |0 |
| peak scoped active finite animations observed while waiting |9 |100 |
| corner failures / offscreen targets |0 /0 |0 /0 |
| root client before/during modal |305 /320px |305 /320px |
| page overflow |none |none |

Thus the final pair exercised **124 physical selections**, including the
previously failing10th opening in both variants on both commands. Existing
old-search calendar assertion296px passes after its own geometry barrier.
D01's unchanged four keyboard lifecycle checks also pass with12.62:1 ring,
same node/focus and one GET. Browser reports no local/session storage,
unexpected external requests or runtime exceptions. Evidence remains synthetic
under ignored `.angular/browser-evidence/`.

Six focused regressions prove finite-animation waiting, changing rects until
three stable frames, infinite-ripple nonblocking, stable clipped/undersize facts
returned for caller failure, finite-animation deadline rejection, and
outgoing/wrong focus/aria/month admission refusal. They use synthetic geometry;
the real45.7px/physical/corner findings above come from Chrome, not jsdom.

## Preserved failures and bounded scope

- QA's review-only/full-attendance failures during opening animation remain
  historical nonpasses; earlier immediate corner measurement was not adequate
  evidence of settled targets. D02 is **not independently closed here**.
- One development full-attendance attempt reached normal31 PASS, then the first
  enlarged-text pointer opener produced no popup. Diagnostic state was
  date19/10/2026, opened=false, disabled=false, zero panes/cells; this was not a
  measured static calendar clipping failure. The committed runner now explicitly
  focuses the real toggle and opens it with native Enter, avoiding dependence
  on a reflowing pointer-down/up opener. No date-selection or geometry assertion
  is skipped. The final stock full+review pair passes.
- Existing Node module-typeless warning remains benign; manifests unchanged.
- **Not rerun by this follow-up:** old292 suite, production build, old browser
  modes or actual fixture-proxy modes, per requested harness-only scope. Their
  latest PASS is the caller's independent QA result, not relabeled as a new run.
  Six new tests were added; no aggregate full-suite298 PASS is claimed.
- No live Oracle, backend/native DB checks, real provider, EMS/batch, deployment
  or WCAG conformance assessment. Backend223/native evidence is unchanged.

## SAME-QA retest handoff

On own free helpers/profile as documented in README:

```powershell
$env:SHF_UI_URL='http://127.0.0.1:4348'
$env:SHF_CDP_URL='http://127.0.0.1:9368'
$env:SHF_ATTENDANCE_ONLY='1'
$env:SHF_ATTENDANCE_REVIEW_ONLY='1'
node checks/browser-check.mjs
Remove-Item Env:SHF_ATTENDANCE_REVIEW_ONLY
node checks/browser-check.mjs
```

Require3 stable frames and0 finite animations before every original≥44×44/
four-corner assertion,31+31 physical selections,0 corner failures, no page
overflow. Repeated10th-open failures must remain failures; a persistent static
clip must not be ignored. **Owner: SAME independent QA through caller.**
No new approval or contract question; publication remains blocked until that
owner closes D02.

H02 teardown verified: only `attendance-h02-ui` and `attendance-h02-chrome`
were stopped;4348/9368 are free and only
`.angular/attendance-h02-profile-19` was removed. No backend helper was started
or stopped in this follow-up. Ignored synthetic evidence is retained; no user
or parent-QA process/profile was touched.

---

# Historical independent-QA corrections UI19-D01/D02

**Status: fixes implemented; developer verification PASS; ready for the SAME
independent QA bounded retest.** This is not independent acceptance/publication.
Authority remains approved **§35/36 v0.1 + HTML#attendance + §37 v0.1**.
Canonical API/identity types, backend, manifests/dependencies and history/range
application code are unchanged. QA supplied two confirmed UI defects and
cleared the earlier range observation as a **runner-readiness problem**, not
a confirmed application range bug. Prior failed runs are preserved below.

## Correction paths (all under frontend/fixture-slice)

- `src/attendance-page.scss`: ID-scoped keyboard ring with sufficient
  specificity over Material; enlarged floating labels constrained to their
  own field with visual ellipsis, full Hebrew accessible names retained.
- `src/attendance-page.html`: existing Material datepicker now uses touch UI
  and public attendance-only panelClass.
- New `src/attendance-calendar.scss`; `src/styles.scss` adds only its `@use`.
  CDK portal is outside the component host, so overlay rules must be global
  **but every override is scoped to shf-attendance-calendar**. Root scrollbar
  override is active only while that modal exists. Surface/content overflow,
  divider decoration and Material close-button placement do not cover targets.
  Current/search/schedule calendars are not resized or replaced.
- `src/attendance-page.spec.ts`: two new scoped-style/Material-config cases.
- New `src/browser-readiness.spec.ts`: four shared-driver regression cases.
- New `checks/browser-interactions.ts`: effective readiness expression and
  trusted native input/blur with Angular acceptance and render checkpoint.
- New `checks/attendance-review-check.mjs`: bounded physical D01/D02 retest,
  also included by the full stock attendance runner.
- `checks/attendance-browser-check.mjs`, `checks/browser-check.mjs`,
  `checks/employee-card-browser-check.mjs`, `checks/items-browser-check.mjs`:
  consume shared effective readiness/native input; original assertions retained.
- `checks/fixture-proxy-check.mjs`, `checks/employee-card-proxy-check.mjs`:
  shared physical entry, new-document barriers, scoped form readiness and
  authoritative current query/applied-response assertions.
- `README.md`, this file.

No Git, backend/shared/canonical/legacy/root/.github writes, installs/upgrades,
live Oracle or unknown/user process termination. The stable backend223/native
PASS remains **caller-reported and unchanged**, not rerun or relabeled UI-live.

## Confirmed defects: actual measured correction

### UI19-D01 — keyboard focus ring

At1440×900 and320×844, physical Tab reaches the exact reload button, then
Space→pending→200 or503. Four lifecycle cases PASS:

- `:focus-visible=true`, `document.activeElement===savedButton`, same DOM node;
- solid **3px** outline, **3px** offset, RGB(0,47,101) on #fafafa:
  **12.617858:1** for initial, pending and terminal states;
- opacity1, center hit-test exposed, ring bounds clear of header and viewport;
- repeat Space during pending leaves request delta **exactly1**, not a duplicate;
- no BODY/ancestor-contains approximation.

The generic global focus rule was outranked by Material's button reset.
The fix is component-scoped, with no blind `!important`, and retains the
existing mounted/aria-disabled reload lifecycle.

Evidence: ignored synthetic
`.angular/browser-evidence/attendance19-D01-{1440,320}-{200,503}-SYNTHETIC.png`.

### UI19-D02 — real calendar click targets

At320×844, normal text and forced **30px root/main/calendar-day text**:

| Measurement | Both variants |
|---|---|
| root client width before/during modal | 305 /320px |
| actual Material calendar width | 320px |
| minimum button width /height | **45.703125 /45.6875px** |
| physical date selections | **1–31 each**, 62 total |
| offscreen/covered/clipped day targets | **0** |
| page-wide overflow | **none** |
| return focus after each date | exact datepicker toggle |

Every day target is checked at all four inset corners with `elementFromPoint`,
not only its bounding box/text span, and is physically clicked. This caught
an intermediate scrollport issue: Material's padded divider and hidden
off-surface close button could create scrollbars despite nominal45px rects.
The final scoped surface/content rules remove that coverage, retain a scrollable
viewport-bound content area and keep the close button reachable when focused.
An exploratory root30px pass also exposed floating-label overflow after close;
the component's field-local container sizing corrected it without changing
the complete accessible label or approved copy.

Existing search calendar is explicitly measured at **296px**, with no attendance
panel class. Old current/search/schedule picker regressions pass. This is the
approved≥44px design criterion, **not a claim that the former40px violated
WCAG2.5.8's24px baseline**, and not full WCAG conformance.

Evidence: ignored synthetic
`.angular/browser-evidence/attendance19-D02-grid-320-{normal,30px}-SYNTHETIC.png`.
The final30px screenshot was visually inspected: no scrollbar overlays the
first/last columns; all31 dates are visible.

## Runner root correction / synchronization proof

1. `input.disabled` does not account for a disabled ancestor fieldset; mounted
   initial controls and absence of a progress bar are not context completion.
   Shared `formReadyExpression` requires the scoped live form/input/submit,
   effective native `:disabled=false`, nonempty/expected API fixture defaults
   and no pending progress. Original server-date and09:00 assertions remain.
2. The driver now uses CDP Ctrl+A, native `Input.insertText` and physical Tab
   blur, not `.value=` plus injected input/change events. It checks the accepted
   value and Angular touched/dirty state (an unchanged logical Material date
   legitimately stays pristine).
3. Acceptance/class changes precede Angular's scheduled DOM render. A shared
   two-animation-frame **render checkpoint**, not a fixed sleep or retry, waits
   for e.g. stale table removal. An intermediate stock schedule assertion caught
   the missing render barrier; the original assertion was preserved.
4. Proxy base navigation crosses a new-document marker/path/query barrier,
   so a previous route's ready DOM cannot satisfy a subsequent navigation.
5. Four regression cases import the **same committed predicate**, including
   actual Angular delayed identity→delayed context admission on attendance and
   search, inherited-fieldset disabling, and expected-default/progress gating.
   Browser geometry is not inferred from jsdom's visibility stub.
6. Actual card proxy verifies the outgoing current GET really has
   `attendanceDate=2026-10-15&currentTime=23:59`, gets200, and the accepted UI
   applied echo is23:59 before awaiting the own-ID card link. Its complete stock
   runner passes with **9 successful card responses** on the final chain.

No application history/range change was used to “fix” the old10:00/09:00
observation. Independent QA's physical64-checkpoint/two-actor result remains
its evidence; stock runners now also pass without operator-only synchronization.
The historical proxy timeout is not erased or called a business-source defect:
the producer's effective route/source/query is now asserted directly.

## Final exact checks / distinctions

Working directory `frontend/fixture-slice`; Node24.21.0/npm11.19.0 and the
previously approved Angular21.2.25/Material-CDK21.2.14/TS5.9.3 unchanged:

| Command | Final result |
|---|---|
| `npm test -- --include src/attendance-page.spec.ts` | **21/21 PASS**, including2 new UI cases |
| `npm test -- --include src/attendance-page.spec.ts --include src/browser-readiness.spec.ts` | **25/25 PASS**, focused correction checkpoint |
| `npm test -- --include src/attendance*.spec.ts --include src/browser-readiness.spec.ts` | **43/43 PASS**,4 files:39 attendance +4 driver-readiness |
| `npm test` | **292/292 PASS**,20 files:286 original checkpoint +6 new cases |
| `npm run typecheck` | **PASS**, existing strict `tsc --noEmit -p tsconfig.app.json` |
| `npm run build` | **PASS**, production budgets; initial555.68kB, attendance lazy53.95kB |

Browser environment for every invocation:
`SHF_UI_URL=http://127.0.0.1:4348`,
`SHF_CDP_URL=http://127.0.0.1:9368`, own Chrome155 isolated profile.
All candidate ports were checked free before starting owned helpers. Backend
helper uses only constructed synthetic environment and merged frontend fixtures:
`SHF_UI_ATTENDANCE_FIXTURE=1`, `SHF_UI_ITEMS_FIXTURE=1`,
`SHF_UI_EMPLOYEE_CARD_FIXTURE=1`, `SHF_FIXTURE_PORT=4358`,
`node checks/serve-synthetic.mjs`; Angular helper:
`npm exec ng serve -- --host 127.0.0.1 --port 4348 --proxy-config proxy.attendance.conf.json`.

**One stock intercepted chain, without manual synchronization, all PASS:**

| Exact command | Per-invocation environment |
|---|---|
| `node checks/browser-check.mjs` | `SHF_ATTENDANCE_ONLY=1`, includes D01/D02 |
| same | no `*_ONLY` flags: base current/search/schedule/detail |
| same | `SHF_CARD_ONLY=1` |
| same | `SHF_ITEMS_ONLY=1` |
| same | `SHF_ITEMS_ONLY=1`, `SHF_ITEMS_REVIEW_ONLY=1` |

Flags are cleared between variants; commands were gated on the preceding
exit code. No original date/range/count/keyboard assertion was skipped or
weakened. No operator-only patched runner was used.

**One actual Angular→proxy→Node fixture chain, NO interception, all PASS:**
`node checks/fixture-proxy-check.mjs` with, sequentially,
`SHF_ATTENDANCE_ONLY=1`, no `*_ONLY` flags, `SHF_CARD_ONLY=1`,
`SHF_ITEMS_ONLY=1`. Card had9 and items18 successful browser resource responses.
No Oracle, real-provider login, credential verification, production, EMS/batch
or broad accessibility-conformance check was performed.

## Preserved nonpassing attempts in this correction

- Two focused invocations hit the existing Windows Vitest worker-start timeout,
  collected **zero tests** and hung. Only owned test sessions were stopped;
  the identical final commands passed. No tooling/dependency workaround.
- Initial new unit assertions incorrectly assumed jsdom keyboard modality and
  a string panelClass. Corrected to a scoped CSS-rule assertion plus actual
  Material's normalized array; real keyboard/contrast remains a Chrome check.
- Initial enlarged-root pass exposed Material floating-label overflow and
  initial rect-only calendar sizing hid scrollbar coverage. Fixed scoped label
  containment, divider/close-button/scrollport sizing; strengthened corner
  hit-tests. Final root30px and all31 physical targets pass.
- First native-input helper required dirty even for unchanged dates; actual
  accepted15/10 value was correctly pristine/touched. It now handles unchanged
  semantics without dropping value/touched checks.
- A stock base schedule run caught table DOM before Angular's render had
  cleared it. Added the rendering checkpoint in the shared helper, not a
  sleep, per-case bypass or weaker “no table” assertion. Final full chain PASS.
- Earlier QA-supplied attendance/card/card-proxy readiness failures and the
  initial implementation's nonpassing history are retained below. Their
  original assertions now pass on the committed stock runner.

## SAME-QA bounded retest handoff

Recreate own helpers/profile only on genuinely free ports as above, then:

```powershell
$env:SHF_UI_URL='http://127.0.0.1:4348'
$env:SHF_CDP_URL='http://127.0.0.1:9368'
$env:SHF_ATTENDANCE_ONLY='1'
$env:SHF_ATTENDANCE_REVIEW_ONLY='1'
node checks/browser-check.mjs
```

This committed bounded command uses the same D01/D02 checks included in the
full stock attendance runner:1440/320 × pending/200/503, native Tab/Space,
same node, one GET, visible unobscured≥3:1 ring;320px normal/root30px all31
real day targets≥44×44, full corner exposure, physical selections, no page
overflow and exact opener. Clear `SHF_ATTENDANCE_REVIEW_ONLY` for the complete
attendance runner; clear other flags between base/card/items/proxy cases.
**Owner: the same independent QA through caller.** No contract ambiguity,
backend dependency or new approval gate remains. Final publication stays with
caller after that retest, not implied by this developer report.

Correction teardown verified: only owned `attendance-qa-ui`,
`attendance-qa-backend`, `attendance-qa-chrome` were stopped; listener checks
confirmed4348/4358/9368 free. Removed only
`.angular/attendance-qa-profile-19`, retained ignored synthetic screenshots.
No unknown/user/parent-QA helper or Oracle process was terminated.

---

# Historical SHF-ATTENDANCE-UI-19 implementation verification — 19 October 2026

**Status: frontend implementation done, ready for independent review.**
Authority: §35/36 **v0.1**, existing HTML `#attendance`, user approval13:46,
§37 **v0.1**, canonical `backend/fixture-slice/attendance-contracts.mts`;
exact seven-capability identity delta only. No unresolved contract question.
Historical records below are retained, not rewritten as current test results.

## Ownership / review paths

All task writes are under `frontend/fixture-slice/`, using targeted patches:

- New `src/attendance-contract.ts`, `src/attendance-fixtures.ts`,
  `src/attendance-page.{ts,html,scss}`,
  `src/attendance-{page,contract,generation}.spec.ts`.
- Integrated `src/api.ts`, `src/routes.ts`, `src/contract.ts`,
  `src/test-fixtures.ts`, `src/contract.spec.ts`,
  `src/employee-card-page.spec.ts` (remove the named employee right, not the
  formerly last capability).
- Navigation/history: `src/list-navigation.ts`, `src/view-history.ts`,
  `src/workspace-shell.{ts,html}`, `src/my-shifts-page.{ts,html}`,
  `src/shift-day-page.{ts,html}`, `src/shift-items-page.ts`,
  `src/employee-card-page.ts`. Existing services are extended, not replaced.
  History drafts returned to components are cloned, including Date/array data;
  attendance has an explicit missing-opener results fallback.
- New `fixtures/attendance.synthetic.json`, `proxy.attendance.conf.json`,
  `checks/attendance-browser-check.mjs`, `checks/attendance-proxy-check.mjs`.
- Updated `checks/serve-synthetic.mjs`, `checks/browser-check.mjs`,
  `checks/fixture-proxy-check.mjs`, `checks/items-browser-check.mjs`,
  this file and `README.md`.

No Git operations; no backend/canonical/design/root/.github/legacy edits,
dependency installation/upgrades, Oracle connection, EMS or batch execution.
Unrelated working-tree changes were not reset or replaced. Ports4349/4319/
4328/4320 and all unknown/user listeners were not stopped.

## Evidence and framework

- Approved reverse-engineering baseline §§35/36/37; source-contract catalog
  confirmed absent. Direct read-only evidence includes
  `old/SHF/src/bzq/shf/model/AttendanceDataModel.java:430–465`
  (left attendance join and planned-start OR SPLIT_END predicate) and
  `old/SHFWeb/WebContent/jsp/attendance_table.jsp:175–225`
  (source rendering/independent recorded fields, deferred legacy actions).
  Broader source traces are documented in §35, not claimed as new runtime proof.
- Canonical type-only attendance module and reused current/search/catalog types.
  Exact shape/error/source rules are guarded against unknown JSON. J01 team and
  G01 parent cannot share an exact code; wrong/missing/duplicate hierarchy fails.
  No search-membership or employee-card self-only policy is copied into inquiry.
- Existing Angular21.2.25, Material/CDK21.2.14, CLI/build21.2.27, TS5.9.3,
  Node24.21.0, npm11.19.0 reused; manifest/lockfile unchanged. Existing project
  compatibility evidence and installed runtime were inspected; no new dependency
  selection or fresh external compatibility certification is claimed.
- Actual stable backend `server.mts:65–96`, README attendance section881+ and
  `attendance-sample.mts` were read. Parent later reported stable `ec056…`,
  **223/223 backend + strict + Native Oracle TEST PASS**. Those backend/native
  results are **caller-reported**, not frontend checks executed here.
  Own fixture backend was restarted from the stable files for final proxy runs.

## Commands / measured results

Commands run with working directory `frontend/fixture-slice`:

| Exact command | Result / distinction |
|---|---|
| `node --version`; `npm --version` | **24.21.0 / 11.19.0**, installed runtime |
| `npm test -- --include src/attendance-page.spec.ts` | First coherent test build succeeded; worker-start failure described below. Repaired dialog-close timing assertion, then **12/12 PASS** at that checkpoint. |
| `npm test -- --include src/attendance*.spec.ts` | Final **37/37 PASS**, 3 files:19 page/boundary cases,14 dedicated guard cases,4 deliberately uncooperative-transport generation cases. Synthetic HTTP/jsdom, not browser/Oracle. |
| `npm test` | Final **286/286 PASS**, **19 files** (249 previous +37 attendance). Existing jsdom `window.scrollTo` diagnostic remains; real scroll/focus is checked in Chrome, not inferred from jsdom. |
| `npm run typecheck` | **PASS**, `tsc --noEmit -p tsconfig.app.json`, existing strict config |
| `npm run build` | **PASS**, production build/budgets; initial554.67kB, attendance lazy53.52kB at final application-code build |
| `npm exec ng serve -- --host 127.0.0.1 --port 4348 --proxy-config proxy.attendance.conf.json` | Owned Angular helper, readiness confirmed |
| `node checks/serve-synthetic.mjs` with `SHF_UI_ATTENDANCE_FIXTURE=1`, `SHF_UI_ITEMS_FIXTURE=1`, `SHF_UI_EMPLOYEE_CARD_FIXTURE=1`, `SHF_FIXTURE_PORT=4358` | Owned **isolated-fixture** Node helper, exact seven-cap identity and attendance GET200 verified; fresh stable-backend restart also used |

All browser commands below use **`SHF_UI_URL=http://127.0.0.1:4348`** and
**`SHF_CDP_URL=http://127.0.0.1:9368`**, own isolated
Chrome **155.0.8059.84**, verified-free ports and
`.angular/attendance-profile-19`. `*_ONLY` flags are per invocation:

| Command / additional environment | Result |
|---|---|
| `node checks/browser-check.mjs`; `SHF_ATTENDANCE_ONLY=1` | **PASS**, actual Angular/Material/Chrome, exclusively intercepted synthetic JSON |
| same command, no `*_ONLY` flags | **PASS**, old current/search/detail/schedule browser regressions |
| same command; `SHF_CARD_ONLY=1` | **PASS on isolated rerun**, with one intermittent chained-run failure retained below |
| same command; `SHF_ITEMS_ONLY=1` | **PASS**, old full items browser regressions after exact five-link navigation expectation update |
| same command; `SHF_ITEMS_ONLY=1`, `SHF_ITEMS_REVIEW_ONLY=1` | **PASS**, D01/D02/D03/D04 focused items review, real DOM/keyboard/outline geometry |
| `node checks/fixture-proxy-check.mjs`; `SHF_ATTENDANCE_ONLY=1` | **PASS**, actual Angular → proxy → Node attendance read port, **NO interception**, synthetic fixtures only |
| same command, no `*_ONLY` flags | **PASS**, old current/search/schedule/detail actual proxy regressions after isolating the original schedule fixture interval |
| same command; `SHF_CARD_ONLY=1` | **PASS**, old card actual proxy regressions |
| same command; `SHF_ITEMS_ONLY=1` | **PASS**, old items actual proxy regressions |

## New behavior actually exercised

- Exact GET/query/no-body/no-store API client behavior and independent rights;
  malformed/absent identity and six-right synthetic identity have no fallback or
  reader calls. Real attendance-only double can inquire but has no other
  resource links; Administrator role without attendance right cannot inquire.
- Context-only initial entry and API-supplied clock/defaults; strict Gregorian
  leap input/0001/9999, invalid retained DD/MM/YYYY, en-US with UTC-/UTC+ zones.
  Actual Material calendar Escape and exact opener; both actual Material minute
  dialogs expose24 hours/60 minutes and Apply00:00/23:59/08:07 independently.
  Equality succeeds, inversion focuses associated TO error, no rollover/NOW.
- Planned/split-only/null-start/no-attendance rows; full local seconds and
  next-day actual values; independent stage-only/station-only/exit-only fields,
  negative/0/NULL reason, nullable briefing. Plaintext names/catalog injection
  strings remain text with no img/script/iframe DOM. Exact leading-zero codes,
  unresolved labels, duplicate activity order and unknown location survive.
- Atomic rejection of malformed second row, missing own day, wrong parent kind,
  same-code J01/G01, duplicate catalogs, source/zone/applied/date/order/page
  mismatch, private extra fields and wrong resource problem/status. No cached
  success/partial rows/false inferred403 or attendance-only invented day.
- Page cases include optional-list comma serialization, dirty
  cancellation, immutable applied paging25+5/lookahead, reload offset0 and
  stable actual reload node/focus for400/401/403/500/503. Chrome confirms
  one GET on repeated Space during hold and focus through pending/success/error.
  Generation doubles intentionally deliver callbacks after ineffective abort:
  old success/error/403 cannot change result, permission, announcement or focus.
- Own employee/day links; Attendance→schedule→detail→items→card and exact
  reverse chain; browser Back/Forward; **two employee IDs with independent
  schedule ranges and two attendance entries**. Exact opener, page, RTL and
  vertical scroll restored. Removed opener gives results heading + Hebrew
  changed-results announcement. Existing current/search memories remain intact.
- Actual fixture proxy: merged30 attendance rows,25+5, planned-only/no-attendance,
  split-only08:00 selected by10:00 restart, independent next-day actuals/raw0,
  empty10:01, genuine malformed-query400, privacy projection, no-store/nosniff,
  nested source-preserving schedule/detail/items/card return. No backend edits.
- 1440/390/320, long40-character names and128-character activity codes,
  real30px main text, no page-wide overflow, contained table scroll and
  reachable Material calendar. Hebrew names/error associations and keyboard
  Escape/focus were exercised. Existing regression samples measure dark3px
  focus ring contrast12.62:1 against #fafafa and text/button pairs separately;
  those are limited measurements, **not complete WCAG conformance**.
- Synthetic screenshots only under ignored `.angular/browser-evidence/`;
  desktop/narrow/30px examples inspected. Browser harnesses assert no app
  local/session storage, unexpected external assets/API, or runtime exceptions.

## Nonpassing attempts / risks / not run

1. Two attendance-focused invocations hit the pre-existing five-second Windows
   Vitest worker-start timeout, collected **zero tests** and hung. Only those
   owned sessions were stopped; unchanged subsequent runs passed. The timeout
   runs are not counted as passing.
2. First minute-dialog test asserted before `afterClosed`; fixed test to await
   closure. First full suite found the old employee-card test's positional
   `.pop()` no longer removed employee:read; fixed it to remove that exact
   named right. Neither fix weakens the runtime capability allowlist.
3. Old full items browser expected four sidebar links; now checks the exact
   approved five paths, including attendance. Old proxy schedule15–28October
   also included the newly merged19October days; restricted that original
   30-row scenario explicitly to15–16October. Both reruns passed; assertions
   were not weakened into arbitrary counts.
4. One old card browser run chained after the base suite returned FROM10:00
   where its nested history assertion expected09:00. An isolated unchanged
   full card rerun passed (as did earlier card runs and actual proxy suite).
   Root cause is **not established**; retain as intermittent harness/history
   risk for independent **QA/frontend** recheck rather than assert a repair.
5. Node emits `MODULE_TYPELESS_PACKAGE_JSON` when the browser harness imports
   frontend TS fixtures through Node24's existing type stripping. Benign tooling
   warning, not a browser runtime error; no manifest/dependency change made.
6. **Not run here:** actual Oracle UI/browser, Oracle native checks, real
   identity-provider login, production deployment, EMS/batch, independent
   screen-reader/assistive-technology audit or full WCAG2.2AA assessment.
   Oracle/native evidence belongs to backend owner + later final executor.
   No contract ambiguity or blocked frontend prerequisite remains.

Next action: caller reviews these frontend paths and independent QA repeats
the intermittent old-card chain. Release/final integrated acceptance stays
with caller; backend Native Oracle PASS is not relabeled UI-live PASS.

## Helper teardown

Final stable-backend proxy closure passed attendance, base current/search/
schedule/detail, card and items variants without interception. Afterwards only
owned sessions `attendance-ui`, `attendance-backend-stable` and
`attendance-chrome` were stopped (the earlier owned backend had been stopped
before its stable restart). Listener checks confirmed **4348/4358/9368 released**.
Only the owned `.angular/attendance-profile-19` was recursively removed;
ignored synthetic screenshots were retained. No unknown/user process or parent
QA helper was killed. Final verification rerun after the last test assertions:
**37/37 focused, 286/286 full, typecheck/build PASS**.

---

# SHF-EMPLOYEE-UI-19 — 19 October 2026

**Status: frontend implementation done; ready for caller/independent review.**
Developer verification only, not release approval or independent acceptance.
Controlling approved contracts: §32/33 **v0.1**, existing `#employee-card`
visual, §34 **v0.1**, canonical
`backend/fixture-slice/employee-card-contracts.mts` and additive
`CapabilityV1`/exact six-capability synthetic identity. The caller's explicit
route is `/employees/:employeeId/operational-card`; no API shape changes.
There are no outstanding contract questions or frontend implementation blockers.

## Changed paths and ownership

All writes are under `frontend/fixture-slice/`:

- New: `src/employee-card-contract.ts`, `src/employee-card-fixtures.ts`,
  `src/employee-card-page.{ts,html,scss}`, `src/employee-name.ts`,
  `src/employee-card-{contract,page,generation}.spec.ts`.
- Integration: `src/api.ts`, `src/routes.ts`, `src/contract.ts`,
  `src/test-fixtures.ts`, `src/view-history.ts`,
  `src/workspace-shell.{ts,html,scss}` and five existing
  `src/{current-shifts,shift-search,my-shifts,shift-day,shift-items}-page.{ts,html}`.
- Existing tests aligned without dropping tests:
  `src/contract.spec.ts`, `src/shift-items-{contract,navigation,page}.spec.ts`.
  Missing-right tests use a valid real-provider **test double** rather than
  accepting a malformed partial synthetic Administrator.
- New harness/data: `checks/employee-card-{browser,proxy}-check.mjs`,
  `fixtures/employee-card.synthetic.json`, `proxy.employee-card.conf.json`.
  Updated existing `checks/{browser-check,fixture-proxy-check,serve-synthetic,
  items-browser-check}.mjs`, `README.md`, this document.

No Git commands, dependency installation, legacy execution/build, database,
broker, batch, live user application or agent delegation. Existing caller-owned
dirty changes were not reset/replaced; patches touch only related frontend
ranges. No Git/diff-based certification of the reported 23 dirty paths is made.
Backend changes/readiness belong to the concurrent backend owner, not this UI task.

## Source and static evidence

Read instructions/brief/ui-developer skill; baseline §§32/33/34, canonical
type-only card contract and existing approved HTML `#employee-card:475–510`.
Source catalog is unavailable. Controlling read-only legacy evidence:
`EmployeeTag.java:28–38` links the internal employee ID, not day/personal
reference; `EmployeeDataAction.java:46–94` selects employee/self branches;
`EmployeeDataModel.java:735–763` binds EMPLOYEE_ID in `populate`.
Its broad `t.*`, manager join and logs are deliberately not copied.
`ComplexCodeTable.java:31–34,53–57,68–75` establishes inner jobs, active grouped
job labels and org labels. UI does not reimplement those backend lookup rules.
The new unknown guard rejects required malformed fields and negative job labels
inconsistent with the approved positive-only job source. Extra source fields
are discarded by a recursive explicit projection, not hidden in the DOM.

## Exact commands and fresh results

All npm/Node commands below run from `D:\AIProjects\SHFAI\frontend\fixture-slice`.
Installed runtime observed: Node24.21.0/npm11.19.0; unchanged approved
Angular21.2.25/Material-CDK21.2.14/TS5.9.3/CLI-build21.2.27.

| Command | Actual result / distinction |
|---|---|
| `npm test -- --include src/employee-card-contract.spec.ts --include src/employee-card-page.spec.ts` | Final **48/48 PASS**, two files (30 guard +18 component); initial45/45 before the last three plain-label/sentinel cases; Angular + synthetic HTTP/jsdom |
| `npm test -- --include src/employee-card-generation.spec.ts` | **5/5 PASS**; intentionally ineffective unsubscribe, late success/error/403, identity revocation, scope epoch and destruction |
| `npm test` (final, 19 Oct 09:16 local) | **249/249 PASS**, **16 files** = existing196 + new53; no failed/unhandled tests |
| `npm run typecheck` | **PASS**, strict app tsc/noEmit, canonical types imported only as types |
| `npm run build` | **PASS**, final initial551.47kB / estimated127.83kB; all budgets pass; production output ignored |
| `SHF_CARD_ONLY=1` + `node checks/browser-check.mjs` | **PASS**, actual Chrome155.0.8059.84 + Angular, intercepted synthetic HTTP only; final complete matrix passed twice after final history changes |
| `SHF_ITEMS_ONLY=1` + `node checks/browser-check.mjs` | **PASS**, previous items four origins/nested return/page25/RTL scroll/dirty drafts/25+5/empty/reload/error/keyboard regressions |
| `node checks/browser-check.mjs` (no scenario flag) | **PASS**, previous current/detail/search/schedule calendars/minute pickers, all errors, 25+5, exact focus and nested histories at1440/390/320 |
| `SHF_CARD_ONLY=1` + `node checks/fixture-proxy-check.mjs` | **PASS**, actual Angular→own proxy→Node fixture; **9 browser card200 responses**, five origins/nested exact-focus returns, 1440/390/320, null/unknown, genuine400/404, no-store/nosniff and serialized key allowlist |
| `SHF_ITEMS_ONLY=1` + `node checks/fixture-proxy-check.mjs` | **PASS**, actual Node fixture, **18 browser item200 responses**, four origins and 25+5/previous/reload/detail excursion at1440/390/320, genuine400/404 |
| `node checks/fixture-proxy-check.mjs` (no scenario flag) | **PASS**, actual Node fixture current/detail1440/390; search/schedule1440/390/320, 25+5, equality/empty, Back/Forward and independent exact filters/page/scroll/opener |

The scenario flags in the table are environment variables, not shell syntax.
Exact browser invocation template used (set one flag, or neither for old flows):

```powershell
$env:SHF_UI_URL='http://127.0.0.1:4348'
$env:SHF_CDP_URL='http://127.0.0.1:9368'
$env:SHF_CARD_ONLY='1' # Or SHF_ITEMS_ONLY='1'; independent fresh shell per run.
node checks/browser-check.mjs
# In a fresh shell with the same URL/CDP/one scenario flag:
node checks/fixture-proxy-check.mjs
```

Owned services were started with:

```powershell
$env:SHF_FIXTURE_PORT='4358'
$env:SHF_UI_ITEMS_FIXTURE='1'
$env:SHF_UI_EMPLOYEE_CARD_FIXTURE='1'
node checks/serve-synthetic.mjs
# Separate owned shell:
node node_modules/@angular/cli/bin/ng.js serve --host 127.0.0.1 --port 4348 --proxy-config proxy.employee-card.conf.json
```

Own Chrome only:
`C:\Program Files\Google\Chrome\Application\chrome.exe --headless=new --disable-gpu --no-first-run --no-default-browser-check --disable-background-networking --remote-debugging-port=9368 --user-data-dir=D:/AIProjects/SHFAI/frontend/fixture-slice/.angular/card19-chrome about:blank`.
Ports4348/4358/9368 were checked free before startup; no user port4319/4328/4320
operations. Services/profile closed at completion; evidence PNGs remain ignored.

## Actual card browser coverage and limits

- Five actual name origins and all nested reverse returns, exact own employee
  IDs rather than day IDs; source filters, page25/evaluated minute, physical RTL
  table scroll, vertical scroll, disclosures and exact DOM anchor focus.
  Browser Back/Forward consumes entries without a duplicate card/origin cycle.
- Six-field semantic definition list, collapsed internal identifier, name auto
  direction/LTR codes, no date/time controls, related requests, private/hidden
  sentinel fields, images, HR tabs or command controls. Synthetic actor and source
  indication remain distinct from selected employee, including on scroll.
- Both approved source pairs and source mismatch; null internal job versus
  unresolved negative job; malformed signed zero, wrong resource, self-parent,
  unauthorized team and error400/401/403/404/500/503 all clear the whole card.
  No-card capability denies without card GET while current view still works.
- Identity failure immediately removes prior card; A→B cancellation keeps only
  B. Chrome can truly abort A before late fulfillment, so the **ineffective-abort
  callback proof is the five Angular generation tests**, not a native-abort claim.
- Actual keyboard Space on stable reload generates **one** pending GET despite
  repeated Space and preserves the same element/focus on200/503. Previous
  drawer Tab/Escape, calendars and minute pickers regressions also passed.
- Long40-code-point names,256-character labels,38-digit IDs/codes, widths
  1440×900/390/320 and30px main text wrap without page overflow. Main fields
  above fold1440; one-column mobile. Back/reload targets measured>=48px;
  name links have48px minimum dimensions. Sampled card `dt`/white contrast
  **6.12:1**; previous sampled color pairs also pass their limited thresholds.
- Screenshots: ignored `.angular/browser-evidence/card19-{1440,null-unknown,
  long-1440,long-390,long-320,large-1440,large-390,large-320,proxy-1440,
  proxy-390,proxy-320,proxy-unknown}.png`; desktop and mobile images visually
  inspected. All values are invented synthetic fixtures, not captured data.
- Runtime checks reported no external asset/API requests, business local/session
  storage or JS exceptions. No automatic polling/retry or app fallback source.

## Failed/initial attempts retained for audit

1. First focused test build succeeded but Vitest's existing one-thread runner
   timed out at startup, executed **zero tests**, then hung. Stopped only that
   owned tool session. Same command/config rerun passed45/45; no installation,
   pool changes or skipped test workaround. Later two guard-only attempts
   (`npm test -- --include src/employee-card-contract.spec.ts`) also timed out
   starting the worker with zero executed tests; the hung owned session was
   stopped, the second attempt exited1. No passing result is claimed for those
   commands. Final full249/249 and combined focused48/48 runs passed with the
   same runner/dependencies. Its installed startup ceiling is5s; no dependency
   or test-configuration patch was made to hide the environment startup issue.
2. First `npx ng serve ... --port4348` produced no listener/output. Stopped only
   that owned session and used the installed CLI via `node .../ng.js`; readiness
   then confirmed. No successful browser result is attributed to that attempt.
3. Initial card CDP late-A release failed with **Invalid InterceptionId** because
   Chrome had canceled A. Harness now permits only that precise canceled-ID
   transport outcome; every other CDP failure still fails. Application guards
   were not weakened; late callbacks are separately forced in unit tests.
4. Existing items harness first expected three sidebar links after items denial;
   the approved card adds a fourth independent link. Updated to assert four
   **and** the actual card label/href. Next run caught the prior two-key
   history assertion after allowlisted route-origin preservation was added.
   History now explicitly preserves only opaque token/navigation ID + approved
   origin label, verifies restored token/path, and the assertion checks that
   allowlist. Final complete items run passed, no test removed.
5. One card rerun during the edit/rebuild period saw search09:00 restored as
  10:00 and failed. It was not counted as PASS or silently relaxed. No stable
   reproduction established; the next two complete stable card runs passed the
   unchanged09:00 assertion and final actual proxy passed exact10:00 origin
   restoration. Treat any recurrence as a frontend/harness investigation, not a
   backend contract question.
6. Existing jsdom `Window.scrollTo` not-implemented diagnostics remain. Real
   vertical/horizontal scroll assertions are Chrome checks, not jsdom evidence.

## Not run / owners / next action

- **No Oracle/native/real-provider/production check in this frontend task.**
  Backend offline187/187/typecheck readiness was reported by caller, not rerun
  or relabeled native here. Live TEST/native verification, provider deployment
  and infrastructure safety belong to backend/platform/database owner + caller.
- No screen-reader/assistive-technology session, exhaustive accessibility tree,
  all color/state contrast audit, actual browser400% zoom or full WCAG2.2AA
  certification. Limited keyboard/reflow/contrast evidence is not conformance.
  Independent UI/QA owns remaining acceptance review.
- No source catalog exists in this checkout; controlling legacy anchors and
  approved baseline were used instead. No legacy execution or Hebrew-literal
  recovery claims.
- No frontend blocker or genuine shared-contract question remains. Caller may
  review this frontend and rerun the documented synthetic checks independently;
  release/publication remains caller/user approval, not implied by these results.

---

# SHF-ITEMS-UI-18 verification — 2026-10-18 (historical)

## Independent QA D01–D04 correction — 18 October, 15:07 handoff

**Status: fixed; ready for the SAME independent QA's bounded retest before
publication.** This is developer verification, not independent acceptance.
Approved §29/30 v0.1 / §31 / `#shift-items` unchanged. The original QA findings
and all earlier implementation/check history below remain valid historical
records; the previous193 passing tests did not cover these four findings.

### Exact paths changed in this correction only

- `src/shift-items-page.html`
- `src/shift-items-page.scss`
- `src/shift-items-contract.ts`
- `src/shift-items-page.spec.ts`
- `src/shift-items-contract.spec.ts`
- `checks/browser-check.mjs`
- `checks/items-review-check.mjs` (new narrow Chrome regression runner)
- `VERIFICATION.md`

No `src/styles.scss`/shared shell/upstream style, API shape, canonical/backend,
manifest/dependency, Git, DB, legacy execution or delegation change/action.
Backend `shift-items-validation.mts:51` was read only: the existing rule already
requires different unit/parent codes. No new wire fields or business rules.

### Fixes and actual measured retests

| Finding | Fix and final actual Chrome155 measurements |
|---|---|
| **D01**,38-digit duration wraps | Dedicated named, keyboard-focusable LTR `.duration-value` scroll region: `max-width:100%`, `overflow-x:auto`, `white-space:nowrap`; no truncation/coercion. Mobile cards use block table layout so intrinsic nowrap width cannot expand behind their clipping container. Exact38-nines DOM Range has **1 line at1440/390/320**. Scrollport/client widths **118/291/221px**, full text/scroll width **307px**. Scrolling exposes the final digit; token fits its cell and the cell fits its table region. All8 fields retained on every row, no page overflow; raw JSON remains `pre-wrap`. |
| **D02**,44px toolbar targets | Items toolbar min-height precisely **48px**, not a global control override. Both back/reload measure **48/48px** on1440/390/320. At30px text, back/reload are **48/48**, **137/48**, **182/48px** respectively; wrapping without page overflow. |
| **D03**,self-parent accepted | `itemsResponse` rejects `unit.moked.code === unit.code` after existing parent validation. Unit regression covers both approved source pairs; component regression asserts error and no context/rows. Actual Chrome intercepted otherwise-valid25-item self-parent response gives **0 context/rows**; valid J01/G01 with fixture and Oracle-marked **synthetic** responses still renders3 rows. No live Oracle test. |
| **D04**,outline reset by Material | Scoped `:host button.mat-mdc-button-base:focus-visible` plus local duration focus selector outranks Material's outline reset; no `!important` or global override. Actual Tab→reload, Shift+Tab→back, Tab→reload gives **solid3px outline,3px offset,rgb(0,47,101)** against adjacent **rgb(250,250,250)**: **12.62:1**. At1440 ring's button top/bottom **302.5/350.5px**, header bottom68px; at320 **499.5/547.5px**, header bottom64px. Entire ring fits viewport and is not sticky-header-obscured. |

Reload lifecycle was rechecked with actual CDP keyboard input at
**1440/320 ×200/503**. Repeated Space causes **one GET** in each case; same
reload DOM node/focus remains pending and terminal, native `disabled=false`.
No BODY focus loss. Normal focused opacity is1; measured indicator is the
explicit ring, not Material's12% overlay.

### Exact commands/results for this correction

From `frontend/fixture-slice`:

- `npm test -- --include=src/shift-items-contract.spec.ts --include=src/shift-items-page.spec.ts`
  → before fixes **3 new regressions failed** (D01 + guard/component D03),
  then **50/50 PASS**,2 files:24 guard +26 component.
- `npm test` → **196/196 PASS**,13 files,15:11; previous193 plus3 new
  regressions. Existing jsdom `Window.scrollTo not implemented` diagnostic
  remains; not counted as browser/scroll proof.
- `npm run typecheck` → **PASS**.
- `npm run build` → **PASS**, initial546.95kB, items lazy31.82kB; no budget warnings.
- `node --check checks/browser-check.mjs` → **PASS**.
- `node --check checks/items-review-check.mjs` → **PASS** (including final
  screenshot-target adjustment).

Isolated owned services, same explicit synthetic-only setup as documented below:
Node4348 (`SHF_UI_ITEMS_FIXTURE=1`, `SHF_FIXTURE_PORT=4348`,
`node checks/serve-synthetic.mjs`); Angular4358
(`npm start -- --port 4358 --proxy-config fixtures/proxy.items.synthetic.json`);
headless Chrome9368, separate profile `.angular/items18-review-chrome`.
User4328/4320 were checked before startup and were not used/stopped.

Check process environment:

```powershell
$env:SHF_UI_URL='http://127.0.0.1:4358'
$env:SHF_CDP_URL='http://127.0.0.1:9368'
$env:SHF_ITEMS_ONLY='1'
$env:SHF_ITEMS_REVIEW_ONLY='1'
node checks/browser-check.mjs
```

→ **PASS**, narrow actual Chrome D01–D04 metrics above, real keyboard,
same-DOM200/503 lifecycle, no page overflow/storage/external requests/runtime
exceptions. All HTTP intercepted with synthetic fixtures.

```powershell
Remove-Item Env:SHF_ITEMS_REVIEW_ONLY -ErrorAction SilentlyContinue
node checks/browser-check.mjs
node checks/fixture-proxy-check.mjs
```

→ **both PASS**. Full items intercepted journey/regressions plus **actual
Angular→proxy→Node synthetic fixture**, interception disabled for proxy;
**18 successful browser item responses**, four origins/nested returns,
1440/390/320,25+5/reload, real400/404/no-store.
The two broad non-items browser/proxy runners were not rerun in this narrowly
scoped correction; their previous independent-QA results remain historical,
not newly claimed passes. Full196 unit regression was nevertheless rerun.

Synthetic evidence only:
`.angular/browser-evidence/items18-review-duration-{1440,390,320}.png` and
`items18-review-focus-{1440,320}-{200,503}.png`; final320 duration/focus captures
visually inspected. Initial nowrap implementation exposed native mobile-table
min-content expansion; it was corrected and a real cell/region containment
assertion added, rather than accepting hidden/clipped text as local scrolling.

No new implementation blocker. **Next owner: same independent QA** retests
D01–D04 and accepts/rejects the corrections before caller publication.
Full screen-reader/WCAG2.2 AA conformance, production, live Oracle UI and
transport checks remain not run/outside this bounded correction.
Cleanup verified: owned Angular/Node sessions stopped; surviving owned Chrome
PID26316 stopped specifically. No listeners remain on4348/4358/9368.
User4328/PID6344 and4320/PID2380 remain listening and were not stopped.

## SHF-ITEMS-UI-18 — actual Angular implementation / final verification

**Status: implemented, checks passed; independent QA/release remains caller-owned.**
Approval: **§29 v0.1 + §30 v0.1 + `#shift-items` visual**, user 18 October
14:17 “Agree and continue”, canonical record **§31 v0.1**. Existing Angular
21.2.25 / Material-CDK21.2.14 / TS5.9.3 retained; observed Node24.21.0/npm11.19.0.
No install, new application, Git command, backend/shared/docs/design/root edit,
DB connection, legacy execution or delegation was performed by this UI task.

### Changed paths (relative to `frontend/fixture-slice/`)

New:
`src/shift-items-contract.ts`, `src/shift-items-contract.spec.ts`,
`src/shift-items-fixtures.ts`, `src/shift-items-page.ts`,
`src/shift-items-page.html`, `src/shift-items-page.scss`,
`src/shift-items-page.spec.ts`, `src/shift-items-navigation.spec.ts`,
`src/view-history.ts`, `checks/items-browser-check.mjs`,
`checks/items-proxy-check.mjs`, `fixtures/proxy.items.synthetic.json`.

Updated:
`src/api.ts`, `src/contract.ts`, `src/list-navigation.ts`, `src/routes.ts`,
`src/current-shifts-page.{ts,html,scss}`, `src/shift-search-page.{ts,html}`,
`src/my-shifts-page.{ts,html}`, `src/shift-day-page.{ts,html,scss}`,
`src/workspace-shell.{ts,scss}`, `checks/browser-check.mjs`,
`checks/fixture-proxy-check.mjs`, `checks/serve-synthetic.mjs`,
`README.md`, `VERIFICATION.md`.
Generated build/cache/synthetic captures stay inside this frontend workspace.
No claim of Git diff/hash or byte comparison of the caller's pre-existing work.

### Exact commands and observed outcomes

Commands below ran from `frontend/fixture-slice`:

| Command | Result |
|---|---|
| `npm test -- --include=src/shift-items-contract.spec.ts --include=src/shift-items-page.spec.ts --include=src/shift-items-navigation.spec.ts` | **52/52 PASS**, 3 files (23 guards,24 component,5 four-origin/navigation), final 14:55 |
| `npm test` | **193/193 PASS**,13 files: all prior **141** unchanged tests +52 new; final 14:55 |
| `npm run typecheck` | **PASS**, strict application check |
| `npm run build` | **PASS**, final14:56; initial546.95kB, lazy items31.21kB; no budget warnings |
| `node --check checks/browser-check.mjs` | **PASS** |
| `node --check checks/items-browser-check.mjs` | **PASS** |
| `node --check checks/fixture-proxy-check.mjs` | **PASS** |
| `node --check checks/items-proxy-check.mjs` | **PASS** |
| `node --check checks/serve-synthetic.mjs` | **PASS** |

Unit/component checks use Angular + HttpTestingController + jsdom, **not** a
live API/browser. jsdom still reports `Window.scrollTo not implemented`;
it is not counted as visual/scroll proof. Geometry/history/scroll/focus were
separately checked in actual Chrome155.0.8059.84.

Owned local services/check environment (exact start commands in README):
`SHF_UI_ITEMS_FIXTURE=1`, `SHF_FIXTURE_PORT=4348`,
`node checks/serve-synthetic.mjs`;
`npm start -- --port 4358 --proxy-config fixtures/proxy.items.synthetic.json`;
isolated headless Chrome CDP9368/profile `.angular/items18-chrome`.
`SHF_UI_URL=http://127.0.0.1:4358`, `SHF_CDP_URL=http://127.0.0.1:9368`.

1. **`SHF_ITEMS_ONLY=1; node checks/browser-check.mjs` — PASS.**
   All `/api/v1` calls intercepted with synthetic fixtures. Four real entry
   actions/own pairs; both nested current and search → schedule → detail →
   items → exact detail/schedule/upstream return; optional items → detail →
   items without duplicate forward entries. Independent page25, current minute,
   search range, vertical/RTL scroll and exact DOM opener; dirty draft returns
   without an automatic stale search. Page25+5/previous/reload0/empty, raw DEL,
   signed38-digit duration, null/actual/nonapplicable fields, unknown type/state7,
   escaped XSS-shaped remarks.400/401/403/404/500/503, ambiguity, malformed rows,
   source/employee mismatch, absent/invalid/missing-cap identities, strict query,
   stale abort/late response. Repeat Space→one GET, same reload node/focus,
   drawer Tab containment/Escape/opener, RTL1440/390/320, all8 fields,30px
   item/upstream navigation wrapping, no page overflow, no browser storage,
   external requests or runtime exceptions. This is not a complete WCAG audit.
2. **`Remove-Item Env:SHF_ITEMS_ONLY -ErrorAction SilentlyContinue; node checks/browser-check.mjs`
   — PASS**, existing broad intercepted current/search/schedule/detail checks.
   Actual Material calendars and two independent24/60 pickers, Escape/focus,
   search flags/equality/range, schedule31/32-day limit and Gregorian boundary
   cases, original errors/capabilities/stale work, three viewport widths and
   measured limited color pairs retained. Not a real-provider/authentication test.
3. **`SHF_ITEMS_ONLY=1; node checks/fixture-proxy-check.mjs` — PASS** after
   explicit backend READY handoff. **Actual Angular → own proxy → Node fixture
   read port**, Fetch interception disabled. Rejects Oracle/non-synthetic identity
   before UI access. Four origins + nested returns, three widths,25+5/reload0,
   disclosure/opener/filter restoration, escaped/raw/null/negative/precision
   fields, **18 successful browser item responses**, real server400 query grammar
   and generic404 wrong pair; no-store and no runtime exceptions. Final run uses
   actual CDP Enter activation, not script-only `.click()`.

Only synthetic screenshots were written to ignored `.angular/browser-evidence/`
(`items18-*` and `items18-proxy-*`);1440/320 first fold, table/card rows and30px
navigation captures were visually inspected. Raw pane remains plain text.

### Failed attempts and corrections (not counted as passes)

- Initial test compile errors in a contextual test-lambda type and later draft
  self-type were corrected. Two runs timed out **before collecting tests** while
  starting the existing Vitest thread pool; only the owned hung commands were
  stopped. The unchanged focused/full commands passed on rerun; tooling unchanged.
- Early full suite184/186 exposed changed legacy explicit-back timing. History
  return interception was scoped to active item journeys; original tests were
  not weakened/rewritten. Final prior141 all pass.
- New origin tests caught a programmatic schedule action opener being overwritten
  by departure capture; explicit pending opener now survives, upstream metadata
  remains independent.
- Real Chrome exposed double navigation from RouterLink + explicit return handler
  on new links. They now use safe native hrefs with a single primary-click
  interceptor; modifiers still open direct, server-authorized links.
- Initial browser/checker failures were also corrected: search readiness before
  inputs, exact restored detail opener rather than first-load heading, dynamic
  restored source row rather than hardcoded first page.
- Proxy checks initially used a server-default schedule range excluding synthetic
  days; now explicitly apply15–16October. Later script-only `.click()`/document
  readiness/restoration races caused timeouts or premature row assertions; actual
  CDP Enter, a new-document barrier, two rendered frames and explicit disclosure
  restoration waits make the harness exercise real keyboard/history behavior.
  Final terminal proxy run passed all assertions; failed runs are not passes.

### Evidence, scope and handoff

Read canonical `backend/fixture-slice/shift-items-contracts.mts` and exact
§§29–31. Read controlling legacy evidence, **without execution**:
`old/SHF/src/bzq/shf/model/BreakDataModel.java:617–690` (exact day, cancellation
null, stored duration/exit/entry, start order);
`model/ExceptionDataModel.java:304–375` (separate report and DEL-excluding
update helper, deliberately not imported as inquiry rules).
§29/30 explicitly approve combined partial rows and new current/detail entry;
not a claim that legacy exposed the same combined screen. Source contract
catalog is absent; linked baseline/inventories were used instead.

Backend READY was supplied by caller:161/161/strict check and bounded native
Oracle evidence are **caller-reported**, not executed by this frontend role.
Read stable server/README fixture shape; helper supplies complete identical
detail contexts through explicit `SHF_SHIFT_ITEMS_FIXTURE`. No backend file
write or live DB/Oracle browser screenshot. Required duration null is rejected,
never normalized to0; only canonical nullable fields are accepted.

Not run: independent QA, screen-reader/manual comprehensive WCAG2.2 assessment,
real-provider/production deployment, Oracle UI or live transport checks; no
release approval implied. No remaining implementation/config handoff blocker.
Next owner: caller/independent QA reviews this frontend evidence and any desired
publication; backend evidence stays with its owner. Existing user/demo ports
4328/4320 were not stopped or used for these tests.

**Cleanup verified:** owning tool sessions for Angular4358/Node4348/Chrome9368
were stopped. Chrome's surviving, previously verified owned PID23680 was then
stopped explicitly with `Stop-Process -Id 23680`. Final
`Get-NetTCPConnection -State Listen -LocalPort 4348,4358,9368`
found **no listeners**. Existing4328/PID6344,4320/PID2380 and4318/PID12312
remained listening; none was killed.

---

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

## SHF-SCHEDULE-UI-18 — 18 October 2026 / approved Angular implementation

**Status: implementation DONE, ready for independent review/QA.**
Approval: §26 API/architecture v0.1 + §27 UI v0.1 + existing HTML `#my-shifts`,
user 18 October 12:02, recorded in §28 v0.1. Canonical owner files consumed
type-only: `backend/fixture-slice/my-shifts-contracts.mts`,
`contracts.mts`, current/search contracts. No canonical/backend/docs-design/root
or legacy file was edited; all task writes are inside `frontend/fixture-slice`.
No Git operation, agent, install, DB connection/query, Oracle application contact,
EMS, batch or legacy build/execution was performed.

### Implemented and reviewed boundary

Source evidence read-only: `old/SHF/src/bzq/shf/actions/ShiftDataAction.java`
134–162 (personal defaults/result branch);
`old/SHF/src/bzq/shf/model/ShiftDataModel.java` 1250–1385 (personal membership,
anomalous changed attendance join, positional descending order);
`old/SHFWeb/WebContent/jsp/shifts_my_shifts_list.jsp` 119–146 and
`shifts_my_shifts_table.jsp` 64–145 (single-date source form/seven expressions).
Target visual: `docs/design/shifter-redesign-v0.1.html#my-shifts`.
Source catalog is absent; controlling baseline §§26–28 and existing Angular
current/search/detail/shell/navigation were used. Target finite range, no
attendance join, cancellation/exact-scope/order and effective-display decisions
are approved intentional differences, not claims about legacy deployed behavior.

Real standalone Angular routes `/my-shifts` and
`/my-shifts/selected/:employeeId`; exactly the approved context/list GETs.
Synthetic self has null employee and never requests a schedule list. No ID form,
implicit employee/default, profile linkage or Administrator fallback. Current and
search expose distinct explicit row schedule actions; existing detail links still
use their own employee/day selectors. The synthetic principal now requires the
exact ordered four-capability array; real individual-capability tests remain
valid. Selected context remains separate from identity and backend grants.

Context is validated before list: mode, actor/null/selection invariants, real-self
binding, synthetic selected permission indication, server default14 (including
year-9999 clamp), zone and coherent source pair. List guards cover applied
employee/range/order, all row employees, Unicode/catalog bounds, end >= start or
null, duplicate/numeric day ordering and exact offset/limit/hasMore/nextOffset.
Only `isolated-fixture` throughout, or identity/detail `oracle` paired with
context/list `oracle-read-only`, is accepted. No invented cancellation,
attendance, site, total, role grant, command or API alias.

Two Material calendars share the existing strict civil adapter and Hebrew
calendar labels. DD/MM/YYYY text is retained on invalid edits, wire dates are
YYYY-MM-DD, calendar ordinal arithmetic has no UTC/DST elapsed-time dependency.
Equal bounds =1, inclusive max31, leap years and 0001–9999 are supported. Server
context alone supplies defaults. Display includes weekday, full start/end dates,
HH:mm, Hebrew accessible seconds precision, overnight label and truthful null end.
Ordered duplicate activity tokens and unknown codes remain visible.

Two-level volatile navigation stores request/form/selector/unit-label/opener/
disclosure/scroll context only, **not result rows or principals**. Every return
reauthenticates, revalidates and refetches. Schedule detail keeps upstream current/
search state intact, uses schedule's own day ID and retains its back path on 404.
Dirty/context/identity/destroy generations abort and independently ignore late
success/error/403 callbacks, even with intentionally ineffective abort.
Identity recheck preserves entered dates and starts a new context/list generation.
The shared mobile native dialog now contains CDK focus-trap anchors **inside**
the modal, with Escape and exact trigger restoration.

### Exact commands and final results

Working directory for the following commands: `D:\AIProjects\SHFAI\frontend\fixture-slice`.
Installed/preserved baseline: Node **24.21.0**, npm **11.19.0**,
Angular **21.2.25**, Material/CDK **21.2.14**, TypeScript **5.9.3**;
no manifest/lock/dependency version change.

| Command | Actual final result / distinction |
|---|---|
| `npm test -- --include src/my-shifts-page.spec.ts --include src/my-shifts-generation.spec.ts` | **41/41 PASS**, 36 schedule component/guard cases + 5 deliberately uncooperative transport cases; Angular with synthetic HTTP/test doubles, not live auth/data |
| `npm test` | **141/141 PASS**, 10 files: existing 100 + new 41. Existing jsdom `Window.scrollTo` not-implemented diagnostic remains; real scroll assertions run separately in Chrome |
| `npm run typecheck` | PASS, `tsc --noEmit -p tsconfig.app.json` |
| `npm run build` | PASS, production Angular output; not deployment authorization |
| `node --check checks/browser-check.mjs` | PASS |
| `node --check checks/fixture-proxy-check.mjs` | PASS |
| `node --check checks/serve-synthetic.mjs` | PASS |
| `node checks/browser-check.mjs` with the environment below | **PASS**, actual Chrome/155.0.8059.84, all API requests intercepted with synthetic data |
| `node checks/fixture-proxy-check.mjs` with the environment below | **PASS**, actual Angular → loopback proxy → stable backend fixture implementation, **Fetch interception disabled**, no Oracle |

Owned isolated startup/check commands actually used:

```powershell
$env:SHF_FIXTURE_PORT = '4318'
node checks/serve-synthetic.mjs
# Separate owned terminal:
npm start -- --port 4328 --proxy-config proxy.schedule.conf.json --prebundle=false
# Own Chrome, not an existing browser:
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --headless=new --disable-gpu --disable-extensions --disable-component-extensions-with-background-pages --no-first-run --no-default-browser-check --remote-debugging-port=9338 --user-data-dir=D:/AIProjects/SHFAI/frontend/fixture-slice/.angular/chrome-schedule-18-clean about:blank
$env:SHF_UI_URL = 'http://127.0.0.1:4328'
$env:SHF_CDP_URL = 'http://127.0.0.1:9338'
node checks/browser-check.mjs
node checks/fixture-proxy-check.mjs
```

Ports 4318/4328/9338 were checked free before ownership. Existing 4320 application
was neither contacted nor stopped. Fixture helper passes **only explicit
synthetic environment values** to `startFromEnvironment`: config, detail rows,
current fixture, optional search fixture and new `SHF_MY_SHIFTS_FIXTURE`.
It extends the same synthetic search/day template to 30 rows, uses those exact
schedule/detail pairs and rejects duplicate employee/day detail pairs before
startup. Backend stable handoff README/server and `my-shifts-sample.mts` exports
were read; no Oracle environment is forwarded and no missing-fixture fallback
is installed.

### Actual Chrome evidence, not static assertions

At **1440×900, 390×844 and 320×844**, Hebrew/RTL, device scale factor1:

- Fresh synthetic menu: no employee/default/ID input, two real discovery links,
  no list request, active independent navigation and continuous compact mock
  notice without any password-verification claim.
- Both current/search explicit selection paths preserve source caption, actor,
  exact own-ID schedule detail, detail → schedule → exact source opener;
  Browser Back/Forward works. Native proxy additionally verifies schedule's
  vertical/RTL table scroll, retained range and **25+5** pages through day3026.
- Two distinct real Material calendar targets; keyboard Enter/Escape and exact
  trigger restoration; February2024 leap-day selection independently updates
  each target. Strict range31/32/equality, invalid US order/31April/year0000,
  2000/2100 leap behavior, years0001/9999; en-US with Los_Angeles/Auckland keeps
  wire civil dates unchanged.
- Dirty input removes stale row links; late range A cannot replace B.
  Empty/400/401/403/404/500/503, malformed actor/list/source/context responses
  surface explicit failures. 404 on schedule is rejected as noncanonical;
  existing detail404 remains independently valid with a schedule back path.
  Future linked/unlinked real-self and denied real-selected are **doubles only**.
- All six schedule fields remain in narrow cards; date/time tokens are single
  line; a 38-digit selector in opened technical context creates no page overflow.
  Schedule drawer strict Tab containment and Escape/opener restoration pass.
- Existing current/search/detail calendar/minute-picker, seven search flags,
  paging/source/error/identity/race checks and exact detail/current reload focus
  pending/terminal200/503 remain PASS.
- Limited computed-color pairs on white: heading/body **14.88:1**, muted
  **6.37:1**, primary button text/background **5.00:1**. This is not a full
  contrast matrix or proof of all focus/control states.
- Final intercepted run: zero browser storage entries, external requests,
  runtime exceptions **and Angular console errors**. Final native run:
  all observed API responses200/no-store, no runtime/console errors, no interception.
  Synthetic screenshots only: ignored `.angular/browser-evidence/schedule18-*`
  and `schedule18-proxy-*`; selected320 image was also directly inspected.

### Defects/retest history and remaining checks

Do not interpret earlier failed attempts as final PASS:

- First focused compilation exposed the required DateAdapter.parse second
  argument; fixed and rerun. Worker startup intermittently timed out during
  concurrent checks; those owned runners were stopped. Final serial focused/full
  checks completed normally, including the final141-case regression.
- Full regression exposed old three-capability expectations and a legacy
  diagnostic-origin return case. Updated only the approved synthetic delta,
  retained real subset tests, fixed origin restoration; full141 now PASS.
- Ineffective-abort test exposed identity-recheck loading suppression due to
  retained lastRequest. Fixed reset + preservation of typed range; all41 focused
  and all141 regression checks now PASS.
- Browser helper needed real document-load/form-control readiness instead of
  reading the previous document. Calendar focus tests now use actual keyboard
  focus/Enter rather than unfocused programmatic click.
- An initial browser contained injected extension resource requests; a fresh
  **owned** extension-disabled Chrome profile resolved that check.
- During shared Material-helper refactoring, warm Vite prebundling produced
  missing projected Material controls / `mat-form-field must contain a
  MatFormFieldControl`. A cold owned server with `--prebundle=false` resolved
  the observed development-server symptom (cache/token mismatch is the inferred
  cause); dependency versions were not changed. Final cold browser and native
  proxy both PASS.
- Native-helper schedule function was initially nested in the token helper;
  corrected scope and rerun. Strict drawer testing exposed CDK trap anchors
  outside a native modal when attached to dialog itself; moved the trap onto
  an inner container. Final strict containment/Escape test now PASS at390/320.

**Not run / remaining owner:** independent QA/manual screen-reader and full
keyboard/AT/200% text/400% browser zoom/text-spacing/complete contrast-state
matrix; Hebrew business-copy review (QA/business owner). No full WCAG2.2AA
conformance claim. Production mock-startup rejection, real authentication/
employee-link issuance, Oracle SQL/data/plans and backend123-test/Oracle
verification are backend/security/QA-owned and were **not rerun by this UI
task**. Caller-provided backend Oracle results are not UI live-data evidence.
Git preservation/diff/publication checks were not run because Git was excluded.
No API decision/blocker remains; future real-provider/admin browsing and deferred
commands require their own approval. Caller next action: independent integrated
QA/review, then separately authorized publication/release.

Cleanup completed: owned backend4318, Angular4328 and Chrome9338 stopped;
those ports have no remaining listeners. Only the two browser profiles created
by this task were removed. Retained evidence images are synthetic-only under the
ignored frontend cache directory; no real-data/PII screenshots were captured.

### Exact source/document paths changed by this task

All paths below are relative to `frontend/fixture-slice/`; generated build/cache
and synthetic screenshot outputs are not source deliverables.

```text
README.md
VERIFICATION.md
proxy.schedule.conf.json
checks/browser-check.mjs
checks/fixture-proxy-check.mjs
checks/serve-synthetic.mjs
src/api.ts
src/civil-date-adapter.ts
src/contract.ts
src/contract.spec.ts
src/current-shifts-page.html
src/current-shifts-page.ts
src/list-navigation.ts
src/my-shifts-contract.ts
src/my-shifts-fixtures.ts
src/my-shifts-generation.spec.ts
src/my-shifts-page.html
src/my-shifts-page.scss
src/my-shifts-page.spec.ts
src/my-shifts-page.ts
src/routes.ts
src/shift-day-page.html
src/shift-day-page.ts
src/shift-search-page.html
src/shift-search-page.ts
src/shift-search-page.spec.ts
src/test-fixtures.ts
src/workspace-shell.html
src/workspace-shell.spec.ts
src/workspace-shell.ts
```
