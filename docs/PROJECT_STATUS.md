# Shifter project state

Last updated: 2026-10-20, recent-record selection and restoration decision.

This is the resumable project checkpoint, not an approval, deployment record,
credential store or replacement for the source-backed design.
Update it at the end of every completed, failed, blocked or approval-gated step.

## Resume here

1. Read this file, the [agent brief](AGENT_INSTRUCTION.md), the
   [project instructions](../.github/copilot-instructions.md), and the relevant
   section of the [design baseline](SHF_REVERSE_ENGINEERING_DESIGN.md).
   Follow the [checkpoint maintenance rule](../.github/instructions/project-state.instructions.md)
   for every project step.
2. Inspect the actual Git branch, HEAD, index and working tree. Preserve unrelated
   user edits; previous checkpoints reported 23 unrelated dirty paths, but that
   count is not a current assertion.
3. Resume the current work below. Do not start another fixture feature merely
   because a previously approved feature remains unimplemented.
4. Verify permissions and current runtime availability before any external
   operation. Old test results, process IDs and local URLs are historical.
5. Record the next result here and include this file in the step's scoped
   commit/push. Obtain any missing approval before dependent implementation.

## Current priority: first controlled TEST Oracle arrival update

The user asked when real Oracle records could be updated. On 20 October at
14:25, the next priority changed from more fixture features to native write
readiness and a controlled first-arrival plan.

| Work item | State | Owner / next action |
|---|---|---|
| Native first-arrival plan, design section 43 v0.1 | review | Proposal and sanitized preflight evidence; not approved for adapter implementation or execution |
| Current TEST metadata, triggers and privileges | done within scope | Five tables and eight enabled/validated constraints checked; visible attendance triggers/policies zero; not a DML safety certification |
| Eligible TEST record | blocked | Latest changed-day candidate is historical/ended and has no attendance row; no eligible record or private handle retained |
| Preflight connection health | review | Earlier NJS-500/failed rollback remains unexplained; a later single read-only connection completed six SELECTs and cleanup successfully |
| Native readiness checkpoint | done: documentation / review: proposal | Plan and partial preflight recorded; publication is included in this scoped checkpoint; verify synchronization before resuming |
| Actual Oracle UPDATE | blocked | Needs resolved connection/data prerequisites, approved native contract and separate named-record execution/restoration authorization |

The user subsequently approved full access to the previously named TEST
CTIDBT_WFMT database. General TEST access is therefore approved and must not be
requested again. This does not supply a selected record, permitted before/after
values or a concurrency window, and does not approve production, DDL, new
contracts or arbitrary business changes.

At 15:11 the user authorized selecting a record by the nearest update date,
interpreted as the most recent actual modification. At 15:13 the user confirmed
that post-test restoration is not mandatory: a successfully committed TEST
result may remain. Do not ask again for general access or mandatory restoration.
Rollback of an unsuccessful, uncommitted transaction and reconciliation of an
unknown COMMIT outcome remain required.

### Completion priority and delivery definitions

See design section 44 v0.1 for the finite proposed completion roadmap:

| Milestone | Measurable delivery boundary |
|---|---|
| M1 | Operational TEST pilot: delivered read views plus one controlled native arrival update and UI read-back |
| M2 | Agreed attendance command cycle: station arrival, exit/early exit, late and administrative actions |
| M3 | Shift creation, modification, cancellation and interactive CSV upload |
| M4 | Exchanges, forced swaps, staffing/reduction/time-change requests, exceptions and break management |
| M5 | Remaining employee/admin/building, messaging/reporting/forecast, CTI administration and IWD timing scope |
| M6 | Integrated acceptance of the agreed coverage |

This is a proposed prioritization, not approval of all contracts or a reduction
of legacy scope. M1 is a pilot, not the complete rewrite. Live EMS, batch, DDL
and production deployment remain excluded. Real authentication remains a
production prerequisite. Do not resume fixture-only F2 expansion by default.

Use bundled milestone contract/UI approvals and focused checks rather than new
approval requests for every internal helper. An exact completion date remains
unknown until remaining work is estimated and external prerequisites are ready.

The first attempt made zero connections because process ENV was absent.
The follow-up used an independently approved operator reference only in memory;
it did connect and did not access the restricted environment file.
No further connection or candidate-search attempt is scheduled automatically.

Do not execute DML, `SELECT FOR UPDATE`, changing procedures, custom functions,
schema changes or native write smoke tests during this preflight.
Do not change the clock or planned dates to manufacture an eligible candidate.

### Native plan boundary

The controlling legacy stage-arrival UPDATE affects
`SHIFTER.SHF_ATTENDANCE.STAGE_ARRIVAL_TIME`, `STAGE_ARRIVAL_USER` and `TADREECH`,
selected by `SHF_EMPLOYEE_DAY_ID`. The follow-up confirmed the relevant column
types and constraints in TEST. This does not prove safe UPDATE execution.

Section 43 proposes one on-time update of an existing eligible TEST row.
It is a proposal, not an implemented or approved native writer.

Before execution, explicitly agree:

- TEST environment and authorized write account, without credentials in Git/chat;
- one private employee/day/attendance record and its exact J01 scope;
- the three permitted fields, before-images, proposed values and time window;
- current constraints, trigger/policy effects and exclusion of competing writers;
- COMMIT/read-back checks; successful TEST changes may remain, as approved;
- a separately approved conditional restoration plan only if restoration is
  subsequently requested;
- STOP/reconciliation behavior for conflict or an unknown commit outcome.

After COMMIT, ordinary rollback cannot restore the record. A compensating UPDATE
cannot be assumed to undo autonomous audit/trigger or partner effects.
No INSERT, DDL, late-reason/report changes, station/exit, CTI or EMS is included.

## Implemented scope

| Feature | Delivered boundary |
|---|---|
| Current shifts, shift search, employee schedule | Oracle TEST read-only inquiries |
| Effective shift details, breaks and partial exceptions | Oracle TEST read-only selected-shift views |
| Operational employee card | Oracle TEST read-only minimal profile; HR/contact/national-ID fields excluded |
| Attendance inquiry | Oracle TEST read-only; planned start OR split-end filtering, separate raw actual timestamps |
| Hebrew/RTL shell, calendars, minute pickers, origin-aware navigation | Implemented and tested in the delivered slices |
| F1: arrival in the operational unit (`stage arrival`) | Isolated in-memory command only; no Oracle write adapter |
| F2: arrival at the workstation (`station arrival`) | Design approved; implementation not started and not the current priority |

F1 and F2 are project phase labels, not technologies. F1 success means only
`fixture-committed`; partner completion is `not-invoked`.
F2 does not necessarily require a stage timestamp under the observed legacy rule.

## Approval ledger

Exact contracts and intentional behavior differences are in the linked baseline.
Keep historical proposal text; use the approval records rather than treating old
"pending" headings as the current decision.

| Artifact | Decision / boundary |
|---|---|
| Sections 13-14, 19-22, 23-25, 26-28, 29-31, 32-34, 35-37 | Approved and implemented read-only slices and their recorded amendments |
| Section 17 tooling | Approved Node.js/Angular/Material/TypeScript baseline; do not upgrade automatically |
| Sections 38-40 and 40.5 | F1 fixture-only approved and implemented; internal cancellation/transport fixes recorded |
| Sections 41-42 and station-arrival mock | User approved 2026-10-20 14:21; only future fixture implementation, not native writes |
| Section 43 v0.1 | Native write readiness proposal; approval and named-record execution gate still pending |

Synthetic Administrator remains explicitly enabled local/isolated-only, with
`employeeId=null`; it is neither real credential verification nor infrastructure
authorization. Production mock startup is blocked.

## Last verified engineering evidence

These are recorded results from earlier steps, not checks rerun when this
checkpoint was initialized.

| Check | Last confirmed result |
|---|---|
| Backend complete suite | 340/340 PASS after executable Origin wiring fix |
| Frontend complete suite | 357/357 PASS for the F1 implementation |
| Backend/frontend TypeScript and Angular build | PASS in the completed F1 milestone |
| Independent F1 QA | Pre-install cancellation zero effects; post-install UNKNOWN; atomic memory effect, replay/concurrency and pure validation checked |
| Actual Chrome -> fixture proxy -> normal backend entrypoint | Context/validation 200, explicit exact-Origin allowlist; user demo left with zero commands |
| Oracle read-only slices | Native checks and selected UI flows passed in their own milestones; not native DML evidence |
| Baseline evidence verifier | 454 source hashes / 20 Oracle captures preserved at the last design checkpoint |

Full WCAG conformance, screen-reader coverage, performance/query-plan guarantees,
SLA and production release approval have not been established.

### Native preflight evidence: SHF-ORACLE-ARRIVAL-PREFLIGHT-20

Overall result: **partial / DATA-BLOCKED**, not PASS.
TEST database/session/host identity was checked against the approved TNS/DNS
endpoint before metadata and business reads. Driver 26 Thick / Client 19.3 was
confirmed. One explicit READ ONLY transaction was started.

- Ten SELECTs succeeded; the eleventh failed with `NJS-500`. No retry or widened
  search was performed.
- Five relevant tables were VALID. Fourteen selected column records and eight
  constraints (five PK, three FK) were returned; all constraints were enabled
  and validated. No UK was returned in this scoped selection.
- Attendance day key: NUMBER(10,0), NOT NULL, PK/FK.
  Stage time: nullable DATE; stage user: nullable VARCHAR2(100 BYTE);
  TADREECH: nullable NUMBER, scale 0.
- Visible attendance triggers, enabled UPDATE triggers and VPD policies: zero.
  Trigger/package bodies were not loaded. Hidden/external effects remain
  unverified.
- The account owns the table and therefore has recognized owner privileges.
  UPDATE ANY TABLE, matching explicit table UPDATE grants and column grants
  were zero. Ownership is not proof of a least-privilege write-account baseline.
- In one exact J01 under G01, the completed aggregate found zero effective
  planned starts TODAY under the real server Clock in Asia/Jerusalem.
  Necessary eligibility therefore fails in that scope. This says nothing
  about other scopes or historical dates.
- The later candidate-key SELECT failed. No candidate was obtained; remaining
  on-time/window/policy conditions were not evaluated.
- Rollback was attempted but failed: **successful rollback is not claimed**.
  The unsafe lease was dropped and the pool closed; no owned resources remained.
- DML, DDL, PL/SQL, COMMIT and FOR UPDATE: **zero**.

These are current read results, not native write proof. Internal scan cost,
current deployed-policy purity and the cause of NJS-500 remain unknown.
No credentials, real employee values or record keys are retained here.

### Offline diagnosis: SHF-ORACLE-OFFLINE-20

Completed without application changes or another database connection:

- 14 independent fault-double assertions and 13 targeted Oracle lifecycle tests
  passed.
- One initial selector command actually ran the complete backend suite:
  **340/340 PASS**. It is a full-suite result, not a focused-test count.
- An NJS-500 query failure remains DEPENDENCY_UNAVAILABLE with its primary cause
  preserved even when rollback or close also fails. Unsafe cleanup calls
  `close(true)`. Successful cleanup must not be inferred from a returned error.
- Failure during cleanup after an otherwise successful read does not return
  success. Abort/break and late acquisition cases passed isolated tests.
- Secondary rollback/close errors are not carried in the returned primary error
  object. This is a diagnostic limitation, not a newly implemented contract.
- No confirmed session-wrapper bug was found; no speculative patch was made.
  Native network/server root cause is still unknown.

DBA/platform should correlate the preflight timestamp with Oracle Net/OCI,
listener, alert and server-session diagnostics, and confirm session and
read-only transaction termination. Do not infer a network cause from NJS-500
alone. No automatic reconnect, broader candidate search or test UPDATE follows
from these offline results.

### Recent-record selection: SHF-RECENT-CANDIDATE-20

The first role-assigned executor performed zero connections because its live
execution scope was unavailable. This was not a database permission denial or
evidence that no records exist. A separately assigned authorized operator then
performed the one bounded read-only selection:

- TEST endpoint/database/user identity checked first; one connection and six
  successful SELECTs.
- Metadata: 73 column records across three relevant tables; PK and source
  meaning checked.
- `SHF_ATTENDANCE` has no reliable last-update timestamp column.
  `SHF_DAY_CHANGES.MODIFICATION_TIME` records a day change, not an attendance
  update. No ID, planned date or ORA_ROWSCN substitute was represented as a
  modification timestamp.
- Ten day-change candidates in one exact J01 were ordered by modification not
  later than database-now, descending/nulls-last, then PK. One was selected.
- The selected day had a unique owner and was not cancelled, but its plan is
  historical and ended, and its attendance row is absent. It is **ineligible**
  for the proposed current/on-time, existing-row arrival UPDATE.
- Remaining policy checks were not performed. No private keys, before-images
  or durable candidate handle were retained; no broader date/team search ran.
- Rollback, connection release and pool close succeeded in this attempt.
  This does not diagnose the earlier NJS-500 or prove that it is resolved.
- DML, DDL, PL/SQL and COMMIT: zero. No application source or fixtures changed.

Native execution remains blocked on a suitable existing TEST record, not on
general DB access or a mandatory post-success restore decision.

## Open blockers

| Blocker | Evidence and owner |
|---|---|
| Connection failure / failed rollback | DBA/platform must investigate NJS-500 and confirm the next safe connection attempt; no automatic reconnect/test UPDATE |
| Eligible named TEST data | Earlier TODAY aggregate was zero; newest changed-day candidate is historical/ended and has no attendance. DBA/data owner must supply a suitable employee/day with existing attendance, stage NULL and a real on-time window |
| Native adapter/API approval | Section 43 is review-only; user + architect |
| Named TEST mutation and restoration authorization | Not granted by fixture approval or generic prior read access; user + DBA/security |
| Attendance live detail HTTP and exact row-opener focus | On 20 October current defaults and one diagnostic previous-day filter both returned 0 rows; QA/data owner needs one known permissible nonempty context |

The live navigation gap is DATA-BLOCKED, not a demonstrated application defect.
Do not repeat unbounded historical searches or claim fixture tests close it.

## Repository and runtime checkpoint

Last recorded published feature/design references:

- `fa40c6e941dc9419ad0f61a19e5e2e6a7a1678bd`: F1 executable Origin fix;
- `0b0ceddc3f4e10dabfaa38c5224e64674a439630`: F2 design checkpoint;
- `1ea16bbcc19e4dac8b9ee1380a4642d0abd4a01d`: resumable checkpoint and workflow rule;
- `ddf4c2bfcf967da9785c2774f250c2c08458db3c`: native readiness plan and partial preflight;
- `3df7c225c5739dbf6938b015ced34bcaee72b35e`: finite completion roadmap and offline diagnosis.

At those publications remote and local HEAD matched. Recheck Git; do not assume
this remains the newest remote commit.
Find the checkpoint commit itself with
`git log -1 --format=%H -- docs/PROJECT_STATUS.md`; do not create a self-hash
edit/commit loop.

Last reported local URLs, not current health checks:

- Oracle read-only attendance: `http://127.0.0.1:4350/attendance`;
- F1 fixture demo: `http://127.0.0.1:4389/attendance`.

Do not reuse old PIDs or stop processes without verifying current ownership.
Never read or bypass access restrictions on the repository-root
`.env.publication19`. Do not store credentials, raw business records, command
tokens, fingerprints, private record keys or real-person screenshots here.

## Checkpoint maintenance: SHF-PROJECT-STATE-20

- User request: 2026-10-20 14:41 +03:00, save project status after every step
  so a new session can resume after interruption.
- Changed paths: `docs/PROJECT_STATUS.md` and
  `.github/instructions/project-state.instructions.md` only. This checkpoint
  and its cross-project workflow rule are published together; the containing
  commit is discoverable with the Git command above, without a self-SHA loop.
- Checks executed: initial index empty; branch `main`; approved origin verified;
  fetch confirmed local HEAD and `origin/main` at the recorded `0b0cedd` baseline.
  Both new files passed ASCII and bounded sensitive-value pattern checks;
  normalized relative Markdown links resolved. The instruction frontmatter
  passed a straight quoted-string pattern check (not a full YAML parser):
  nonempty `description`, `applyTo: "**"`, and matching delimiters.
- Tracked application package folders are `backend/fixture-slice` and
  `frontend/fixture-slice`; the resume Git command runs at repository root.
  No application commands are needed for this documentation-only step.
- Not run: application tests/builds, servers, Oracle queries/DML, native smoke
  tests, and the design evidence verifier. No prior engineering results were
  rerun. At that initialization checkpoint the native follow-up was pending
  and section 43 was still local; the later findings above supersede that state.
- Publication boundary: stage and commit only the two paths above after
  `git diff --cached --check`; verify normal push synchronization and report
  its actual outcome. Preserve all unrelated unstaged edits and deletions.

## Native readiness checkpoint: SHF-NATIVE-ARRIVAL-READINESS-20

Changed paths for this step: this file, section 43 of the existing design
baseline, and the standard evidence verifier's `verification.json` refresh.
No application or canonical API types changed. Publication and structural checks
are documentation-only evidence; do not infer native readiness from them or
from the earlier application tests.

- State: plan completed for review; native preflight **PARTIAL / DATA-BLOCKED**,
  not PASS. STOP for DBA/platform investigation and named eligible TEST data.
  Section 43 v0.1 APP approval and separate section 43.8 execution approval
  remain outstanding; no native write code, write test or DML was performed.
- Publication included in this checkpoint: normal commit/push to the approved
  original GitHub `slavafridman/SHFAI` repository on `main`, only the three paths
  above. Before publication, fetch confirmed HEAD and `origin/main` at
  `1ea16bbcc19e4dac8b9ee1380a4642d0abd4a01d`, ahead/behind 0/0 and initial
  index empty. The published checkpoint SHA is discoverable with the command
  above; this pre-commit record is not a claim that push already succeeded.
- Ran at repository root:
  `node docs\reverse-engineering\verify-evidence.mjs`.
  Result: `passed_with_documented_source_anomaly`; 31 CSV files, 10,000
  inventory row references, 454 source hashes, 391 local document links,
  250 source-line anchors and 80 physical table/view rows checked.
  The known duplicate legacy route remains documented, not newly fixed.
  All 20 Oracle capture hashes match the prior published verification.
- Additional bounded checks passed: four checkpoint relative links resolve;
  all 391 baseline local-link targets exist in published HEAD; 273 baseline
  anchors resolve, including eight explicit HTML IDs. Section 43 introduces
  no Markdown links. No external GitHub link fetch was needed.
  Previous baseline content is preserved after CRLF/LF normalization.
- Checkpoint ASCII and bounded sensitive-pattern checks of added documentation
  passed; these are not a complete secret/PII certification. No private record
  keys, real-person values or before-images were intentionally persisted.
  Restricted environment content was not accessed.
- Exactly three assigned paths staged; default `git diff --cached --check`
  passed, with no whitespace override. Twenty-three unrelated user paths,
  including their unstaged edits/deletions, were fingerprinted for bytewise
  preservation; the already published workflow instruction is unchanged.
  Recheck path scope, preservation and remote synchronization after push.
- Validation-tool corrections: Python was unavailable, so checks used existing
  Node.js without installation. Initial supplemental checks needed EOL
  normalization and HTML-ID support; corrected checks passed. These were
  checker limitations, not broken document links or changed business facts.
- Not run in this documentation step: application tests/builds, servers,
  browser/HTTP checks, new Oracle queries, DML/DDL/PLSQL/COMMIT/FOR UPDATE,
  native smoke tests, live EMS/CTI or legacy execution. Historical engineering
  results above were not rerun. No project-complete, release or deployment claim.

## Exact next safe action

1. Present the single decision packet in section 44.6: section 43 v0.1 approval
   for a disabled-by-default native adapter and the desired pilot/full delivery
   boundary. General TEST database access has already been approved.
   Do not treat approval as permission to execute an UPDATE.
2. Obtain DBA/platform resolution of NJS-500 and a named, eligible TEST fixture
   from the data owner, including an explicit concurrency window.
3. Before native execution, fill the separate section 43.8 authorization for
   account/actor/record, three SET fields and before-images, proposed values,
   one COMMIT/read-back. Leaving a successful TEST change is already approved;
   any later compensating restoration requires its own precise conditions.
4. Resume only after those prerequisites change; recheck current metadata and
   the approved record under the authorized environment. Do not create test
   records, alter dates/Clock, expand scope, retry an unknown write or silently
   switch back to F2 fixture work.

## Completion checkpoint: SHF-COMPLETION-PLAN-20

- Changed paths: section 44 of the design baseline, this status file and the
  standard verifier JSON refresh. Application source and contracts unchanged.
- Completed: finite delivery roadmap, recorded general TEST access approval,
  offline failure-handling diagnosis and current backend regression evidence.
- Not run: frontend checks/build, live Oracle, candidate discovery, native
  UPDATE, restore or deployment. No restricted environment content accessed.
- Publication execution: SHF-COMPLETION-CHECKPOINT-20, documentation-only.
  Initial index was empty; branch `main`, HEAD and fetched `origin/main` were
  `ddf4c2bfcf967da9785c2774f250c2c08458db3c`, ahead/behind 0/0.
  Approved origin was verified without displaying credentials.
- Root `node docs\reverse-engineering\verify-evidence.mjs` passed with
  `passed_with_documented_source_anomaly`: 31 CSV files, 10,000 inventory row
  references, 454 source hashes, 391 local links, 250 source-line anchors and
  80 physical table/view rows. All 20 Oracle capture hashes match published
  HEAD. The documented duplicate legacy route remains unchanged.
- Supplemental checks passed: four status relative links, all 391 baseline
  local targets present in HEAD (including tracked directory descendants) or
  the scoped publication, and nonempty resume/approval/blocker/next-action
  sections. Both actual package README paths exist:
  `backend/fixture-slice/README.md`, `frontend/fixture-slice/README.md`.
  The complete pre-section-44 baseline is preserved after EOL normalization.
  Initial supplemental checker assumptions about directory targets, multiline
  README matching and the appended separator were corrected; no document
  link defect or feature change was needed.
- Bounded added-text secret/PII pattern checks passed without printing values;
  this is not a complete secret/PII certification. Twenty-three unrelated
  dirty user paths were fingerprinted for bytewise preservation. Existing
  design HTML/PNG artifacts are outside this change.
- Scoped publication is ready and included in this checkpoint: exactly this
  file, the existing design baseline and `verification.json`; normal commit
  and push only, with staged whitespace/scope and final synchronization checks.
  Exactly three staged paths, default `git diff --cached --check`, final bounded
  sensitive-pattern checks and bytewise preservation of all 23 unrelated paths
  passed; no whitespace override was needed. This
  pre-commit record does not claim that push has already succeeded; discover
  the resulting SHA using Git history, without a self-commit edit loop.
- No application tests/builds, servers, browser checks, new Oracle connections,
  DML, live EMS or legacy execution ran in this publication step. Today's
  separately completed offline 340 full-suite, 13 focused and 14 fault-double
  results above were not rerun. No application code or new contract was added.
- At that checkpoint M1 inputs remained blocked with user/data-owner/DBA.
  The later post-success restoration decision is recorded above; eligible
  named TEST data and exact mutation instructions are still missing.

## Latest selection checkpoint: SHF-RECENT-CANDIDATE-CHECKPOINT-20

- User input, 20 October: 15:11 select by the most recent actual modification;
  15:13 a successful committed TEST result may remain. General TEST CTIDBT_WFMT
  access is already approved. Neither general access nor restore YES/NO is an
  open decision. Failure rollback remains mandatory; an unknown COMMIT means
  STOP and reconciliation, never retry or blind restoration.
- Completed selection, not a new publication-time attempt: one authorized
  read-only operator connection, identity checked before business reads, six
  successful SELECTs, 73 column records across three tables, PK and TNS/DNS
  checks. Attendance has no reliable last-update timestamp;
  `SHF_DAY_CHANGES.MODIFICATION_TIME` is a day-change timestamp, not an
  attendance-update timestamp. Ten candidates in one J01 were ordered by
  modification <= database-now, descending/nulls-last, then PK; one selected.
  Unique owner and not cancelled, but historical/ended and attendance absent:
  **INELIGIBLE** for the current/on-time existing-row first-arrival update.
  This is not a finding of zero eligible records across the whole database.
- Remaining policy checks NOT RUN; private keys/before-images/handle not
  retained. ROLLBACK, release and pool close succeeded for this attempt.
  Earlier NJS-500 and failed rollback are separate historical evidence, not
  root-caused or certified resolved by this success. No INSERT, UPDATE, DDL,
  PL/SQL, COMMIT, FOR UPDATE, retries or clock/planned-date alteration occurred.
- Changed paths, exactly: `docs/PROJECT_STATUS.md`,
  `docs/SHF_REVERSE_ENGINEERING_DESIGN.md` (targeted sections 43/44), and
  `docs/reverse-engineering/verification.json` (standard verifier refresh).
  No application/native writer or canonical contract change.
- Publication preflight: initial index empty, branch `main`, HEAD and fetched
  `origin/main` at `3df7c225c5739dbf6938b015ced34bcaee72b35e`, ahead/behind
  0/0; approved GitHub origin verified without exposing credentials.
- Executed from repository root:
  `node docs\reverse-engineering\verify-evidence.mjs` passed with
  `passed_with_documented_source_anomaly`: 31 CSVs, 10,000 inventory references,
  454 source hashes, 391 document-local links, 250 line anchors, 80 physical
  table/view rows. All 20 capture hashes match published HEAD; the documented
  duplicate legacy route is unchanged.
- Supplemental checks passed: four status relative links resolve against
  published HEAD or this scoped publication; all 391 design-link targets are
  published or included here, including tracked directory descendants. Design
  content before section 43 is unchanged after EOL normalization. Bounded
  added-text sensitive-pattern checks passed without printing values; this is
  not full secret/PII certification. Default scoped whitespace check passed;
  no whitespace override is needed.
- Publication is included in this checkpoint: exactly the three paths above,
  normal scoped commit and push, mandatory co-author trailer, staged scope/
  whitespace and final remote synchronization checks. This pre-commit record
  does not claim push has already succeeded; discover the resulting SHA from
  Git history without a self-SHA edit/commit loop. Twenty-three unrelated
  dirty user paths stay unstaged and untouched; their contents were not read
  or fingerprinted during publication.
- Not run in this documentation-only step: application tests/builds, browser/
  HTTP/server/process checks, new Oracle connections/queries, DB mutations,
  native smoke tests, EMS/CTI, dependencies or legacy execution. Historical
  backend 340/frontend 357 and offline 340 full-suite, 13 focused and 14
  fault-double results were not rerun and are not fresh publication checks.
  No project-complete, release, deployment or native-write success is claimed.
- Exact next gate: data owner supplies one named eligible existing TEST
  attendance context in the agreed J01/current on-time window, stage NULL;
  user explicitly approves the section 43 native contract (still REVIEW) and
  section 43.8 record/account/actor, exact three SET before/after values,
  concurrency window and COMMIT/read-back scope. Earlier diagnostic follow-up
  stays with DBA/platform. No new query until prerequisites change; stop rather
  than INSERT, overwrite an existing arrival, alter clock/planned dates or
  enumerate historical candidates indefinitely. Successful-result retention
  is settled, not another approval gate.
