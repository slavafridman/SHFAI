# Shifter project state

Last updated: 2026-10-20, synthetic Oracle TEST fixture prepared and verified.

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
| Current TEST metadata and fixture preflight | done within scope | Three fixture tables, 84 columns and 22 enabled/validated constraints; required columns/FKs/current literal defaults checked, enabled triggers/visible VPD zero; not native UPDATE grant or safety certification |
| Eligible TEST record | time-sensitive, revalidate | New synthetic dataset verified eligible at read-back, with approximately four minutes left in its allowed window; do not assume eligibility now |
| Synthetic TEST data preparation | done: PREPARED_VERIFIED | Three acknowledged INSERTs, one successful COMMIT and separate read-only read-back; first arrival still NULL |
| Preflight connection health | review | Earlier NJS-500/failed rollback remains unexplained; a later single read-only connection completed six SELECTs and cleanup successfully |
| Native readiness checkpoint | done: documentation / review: proposal | Plan and partial preflight recorded; publication is included in this scoped checkpoint; verify synchronization before resuming |
| Actual Oracle UPDATE | blocked | Needs fresh grants/window/concurrency validation, approved APP43 contract and section 43.8 exact-record/three-field execution/read-back scope; successful TEST restoration is not mandatory |

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

Do not execute a native arrival UPDATE, `SELECT FOR UPDATE`, changing procedures,
custom functions, schema changes or native arrival smoke tests yet.
The user's later conditional authorization permits only the test-fixture
preparation below. Do not falsify the Clock or rewrite real employees' planned
dates to manufacture an eligible existing candidate.

### Conditional test-data preparation authorization

After asking to find any suitable record, the user explicitly allowed changing
an existing record or creating a new one if none was found. Prefer one new,
clearly synthetic TEST dataset rather than overwriting real staff history.
One assigned operator may create at most a new synthetic employee, planned day
and attendance row using the existing schema after current metadata, constraints,
references, key allocation and enabled-trigger checks.

The following attempt chronology is historical; the final successful result
below supersedes its preparation-blocked and next-action statements, not the
native APP43 approval gate.

Initial preparation stopped at identity verification with zero mutations and
successful cleanup. Diagnosis identified a launcher expectation error:
SERVER_HOST had been compared to an alias. Database, user and schema matched.
Independent configured TNS SID and endpoint DNS checks then passed; expected
identity was not copied from the database answer.

The corrected preparation launcher subsequently ran, but its final output was
truncated. Exit code 0 is not proof of success because the launcher caught
errors. Original INSERT/sequence/COMMIT counts and its cleanup are unverified;
this is reporting uncertainty, not an observed Oracle COMMIT failure.

A new verified TEST read-only connection executed three SELECTs. The exact
public synthetic marker `SHF_TEST_ARRIVAL_20261020` matched zero employee rows.
At that reconciliation no complete committed fixture was available.
Children/orphans were not queried
separately, so their absence is not claimed. No creation retry or further
mutation was performed. Reconciliation rollback, release and pool close all
succeeded.

Current metadata from this check covers three tables, 84 column records, three
validated PKs and two validated FKs, no unvalidated constraints, and zero
enabled triggers/visible VPD policies. These facts do not prove execution of
the original INSERTs or resolve possible sequence gaps.
The next diagnostic is offline recovery of the launcher's existing sanitized
phase/error evidence; do not reconnect or repeat creation to obtain it.

That offline recovery ended without the original terminal report. The original
catch did not set a nonzero exit code; the precise phase/error and counters
remain unknown. Do not classify it as an Oracle connection failure.

One final preparation attempt was then assigned under the user's existing
conditional authorization, only after repairing observability. Its generated
aggregate journal contains phase, error code, acknowledged mutation/sequence
counts, commit outcome and cleanup, never credentials or private record values.
It must use a distinct explicit synthetic generation or safely reuse a fully
verified one, not repeat the unknown original INSERTs. Maximum scope remains
three synthetic business rows and one writer transaction; a new failure or
unknown COMMIT stops the attempt without retry. No actual arrival is recorded.

That observed attempt stopped before DML, with error
`UNPLANNED_ATTENDANCE_DEFAULT` during metadata/default validation. The harness
rejected a non-NULL default on an omitted attendance field. It is not an
Oracle connection error. Metadata: 84 columns, 22 enabled/validated constraints,
zero enabled triggers and visible VPD; all identity checks passed.
INSERT attempts/rows and NEXTVAL attempts were zero, COMMIT was not attempted,
and rollback/release/pool close succeeded. A sanitized aggregate journal was
written and reread; it contains no private row keys or credentials.

The next step at that time was an offline check of the retrieved default expression and all
three planned INSERT mappings. A safe static default must be distinguished
from a changing/function-backed default before any revised preparation plan.
Do not repeat the failed creation or silently ignore the default check.

Offline review established that the rejected expression was a SQL literal, not
a clock/sequence/custom-function default. The prior harness wrongly required
all omitted attendance fields to be NULL. Historical metadata identifies
`TADREECH_P2=0`; its current value must still be confirmed. The revised plan
explicitly allows briefing flags at zero while arrival timestamps/users remain
NULL. It must collect all current defaults, required columns, constraints,
reference validity and policy/window findings before allocating keys or writing.
Unknown/function-backed defaults still stop the task. This is a correction to
fixture preparation, not authorization to weaken arrival eligibility.

### Final preparation result: PREPARED_VERIFIED

The corrected full preflight and one controlled transaction completed:

- Public synthetic marker: `SHF_TEST_ARRIVAL_20261020_B`. Use this exact marker
  for controlled rediscovery; private primary keys are not stored here.
- One acknowledged INSERT into each of `SHF_EMPLOYEES`,
  `SHF_EMPLOYEE_DAY` and `SHF_ATTENDANCE`; **COMMIT acknowledged SUCCESS**.
- One existing day-sequence NEXTVAL was acknowledged. Sequence allocation is
  nontransactional; it is not a schema change or a reversible counter.
- A separate read-only connection verified one matching employee, day and
  attendance row and unique synthetic ownership; source `SYNTHETIC_DAYS=1`.
  Both connection identities
  matched the independently configured TEST expectations.
- Full preflight: 84 columns, 22 enabled/validated constraints, all required
  columns and FK values checked, zero enabled triggers/visible VPD policies.
- Current literal defaults confirmed. Both briefing flags are explicitly zero;
  `TADREECH=0` and `TADREECH_P2=0`; stage arrival/user and station/P2
  arrival timestamps/users remain NULL.
- Real server Clock was used; initial planned lead was 20 minutes.
  Eligibility was true at verification, with approximately **four minutes
  remaining**. This is historical evidence, not permission to bypass the
  temporal policy after the window expires. Current eligibility is UNKNOWN:
  freshly revalidate before admission, without fake Clock, planned-date changes
  or automatic new INSERTs.
- Writer and read-back rollback/release/pool closure succeeded. The sanitized
  aggregate journal was written and reread; no private keys or credentials
  were included.

This is actual TEST data creation, not a native arrival registration.
No stage-arrival UPDATE, station arrival, Oracle write-adapter implementation,
CTI, EMS, DDL or production operation was performed. Successful TEST data may
remain under the user's decision. Earlier failed/unknown attempts remain
historical evidence and must not be mistaken for this verified transaction.

Preparation must be atomic, with no stage arrival recorded: stage time remains
NULL. Stop before INSERT if required rules or side effects are unknown; no DDL,
catalog changes, native arrival UPDATE, CTI or EMS is authorized by this task.
Real current-day planning for a new synthetic fixture is permitted; falsifying
the server Clock or changing existing real business dates is not.

The assigned operator completed data preparation, not implementation or approval
of the section 43 native application contract. COMMIT outcome and independent
read-back are recorded above; preparation is done, not running.

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

At that selection checkpoint native execution was blocked on a suitable
existing TEST record, not on general DB access or mandatory restoration.
The later synthetic preparation supplied records; current eligibility remains
time-sensitive and native contract/execution approval is still pending.

### Broader selection: SHF-SUITABLE-CANDIDATE-20

The user authorized finding any suitable record, broadening the read-only search
across TEST J01 teams with valid G01 membership:

- One connection succeeded after TEST identity verification. Of four SELECT
  attempts, three succeeded, including one business aggregate.
- The necessary TODAY set of existing attendance rows with stage NULL,
  effective ownership, activity-day and no cancellation was empty.
- A separate upcoming-candidate query failed with ORA-01785 because its ORDER BY
  expression was directly over UNION ALL. This was a query error, not a second
  zero-result assertion; upcoming/window/policy assessment was not completed.
- No candidate keys or before-image were obtained. Rollback, release and pool
  closure succeeded; DML/COMMIT were zero.

Do not reinterpret the failed query as proof about all possible days.
The successful empty necessary TODAY set triggered conditional synthetic-fixture
preparation, not authorization to rewrite historical records or silently change
native arrival eligibility.

## Open blockers

| Blocker | Evidence and owner |
|---|---|
| Connection failure / failed rollback | DBA/platform must investigate NJS-500 and confirm the next safe connection attempt; no automatic reconnect/test UPDATE |
| Native update temporal eligibility | Synthetic fixture exists, but its short allowed window must be rechecked against real Clock before any future arrival write |
| Preparation observability | Latest transaction and separate read-back verified; earlier unknown attempt and possible sequence allocation remain historical, not a completed fixture |
| Native adapter/API approval | Section 43 is review-only; user + architect |
| Exact native three-field TEST mutation/read-back authorization | Section 43.8 scope is not granted by fixture INSERT approval; user + DBA/security. Successful TEST restoration is not mandatory; any later requested compensating write needs its own authorization |
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
2. Rediscover the verified synthetic generation by exact public marker and
   revalidate its current values, scope and real temporal eligibility before
   any native arrival command. Do not INSERT another fixture automatically or
   change its plan/Clock when the allowed window expires.
   The earlier NJS-500 remains separately unexplained.
3. Before native execution, fill the separate section 43.8 authorization for
   account/actor/record, three SET fields and before-images, proposed values,
   one COMMIT/read-back. Leaving a successful TEST change is already approved;
   any later compensating restoration requires its own precise conditions.
4. Resume only after prerequisites change; recheck the approved record and
   environment. The one conditional synthetic preparation is completed, not
   an automatic repeat authorization; no native arrival UPDATE is running. Do not falsify
   Clock, rewrite real business dates, retry an unknown write or silently switch
   back to F2 fixture work.

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

## Latest completed step: SHF-TEST-FIXTURE-PREPARE-20

- State: PREPARED_VERIFIED. Actual three-row TEST INSERT transaction and
  separate read-back completed as described above.
- Exclusive writer: one assigned operator; no parallel native writers.
- Expected scope: at most three new synthetic records in existing TEST tables,
  stage arrival still NULL; no application changes or native arrival command.
- Initial attempt: zero INSERT/UPDATE/sequence/COMMIT; rollback and cleanup
  succeeded. Its SERVER_HOST comparison error was corrected using independent
  configured TNS/DNS identity, which passed on the diagnostic connection.
- Corrected launch: original INSERT/sequence/COMMIT and cleanup unverified.
  Reconciliation: one connection, three successful SELECTs, zero exact-marker
  employees; rollback/release/pool close succeeded, no further mutations.
- Earlier observed attempt: zero INSERT/sequence attempts, COMMIT not attempted;
  metadata/default validation rejected an omitted non-NULL default.
  Rollback/release/pool close succeeded. No fixture or stage arrival was created
  in that attempt; the subsequent corrected transaction succeeded.
- Completed corrected transaction: INSERT counts 1/1/1, acknowledged NEXTVAL 1,
  COMMIT SUCCESS; separate exact-marker read-back passed and stage time NULL.
  No further mutation is scheduled.
- Do not store private keys, before-images or credentials here. A public
  non-personal synthetic marker may identify the fixture for controlled
  rediscovery; the successfully prepared generation's marker is recorded above.
- Checkpoint paths: this file, targeted section 43/44 evidence changes and the
  standard verifier JSON refresh. No application code changed. Publication
  validation is recorded in the checkpoint below; do not treat old suites as
  rerun or data preparation as an implemented arrival feature.

## Publication checkpoint: SHF-TEST-FIXTURE-CHECKPOINT-20

- Completed documentation validation for the actual PREPARED_VERIFIED result:
  three acknowledged synthetic INSERTs, one acknowledged existing-sequence
  NEXTVAL, successful COMMIT and independent read-only read-back; stage arrival
  remains NULL. Native UPDATE/application writer and UI read-back of this new
  row were not implemented or verified in this step.
- Initial index empty; `main` and fetched `origin/main` both at
  `02252b828cbc63c4a70398bc6ac9c911dd24117c`, ahead/behind 0/0.
  Exactly three publication paths: `docs/PROJECT_STATUS.md`,
  `docs/SHF_REVERSE_ENGINEERING_DESIGN.md` and
  `docs/reverse-engineering/verification.json`.
- Root command `node docs\reverse-engineering\verify-evidence.mjs` passed with
  the documented duplicate legacy route anomaly: 31 CSVs, 10,000 inventory
  references, 454 source hashes, 391 local links, 250 source line anchors and
  80 physical table/view rows. All 20 Oracle capture hashes match published
  HEAD. Supplemental checks passed for published/scoped link targets, four status
  relative links, unchanged pre-section-43 design evidence, bounded added-text
  sensitive patterns. Default scoped whitespace check passed; staged whitespace
  is checked again before the normal commit, without a whitespace override.
- Normal three-path commit/push is included in this checkpoint, with mandatory
  co-author trailer and final remote-HEAD/ahead-behind/index checks. This
  pre-commit record is not a claim of completed push; locate its resulting
  SHA by `git log --grep=verified -- docs/PROJECT_STATUS.md`, without a
  self-SHA edit loop.
- Twenty-three unrelated dirty paths remain unstaged. Their contents were not
  read or bytewise fingerprinted in this publication; bytewise preservation
  is NOT verified. Restricted environment files, private journals, primary
  keys, personal before-images and raw business records are not published.
  Public evidence contains only the synthetic marker and sanitized aggregates.
- Not run here: application tests/builds, browsers/servers, new Oracle
  connections/queries/mutations, dependencies, native smoke tests, EMS or
  legacy execution. Reported data preparation is a prior executed transaction,
  not a new publication-time DB action. Earlier uncertain-launch counters and
  NJS-500/failed rollback remain historical unknowns, not root-caused.
- Next priority remains M1 native arrival, not more F2 simulation. APP43/source
  DTO and operation/three-SET-field permission controls remain REVIEW.
  Section 43.8 exact native execution/read-back approval and fresh grants,
  eligibility/window/concurrency checks are still required. General TEST
  access and one-fixture creation were already approved and exercised;
  successful TEST restoration is not mandatory. No automatic DB retry follows.

## Previous selection checkpoint: SHF-RECENT-CANDIDATE-CHECKPOINT-20

Historical selection/publication record below. Its missing-fixture and next-gate
statements describe that earlier checkpoint; the verified synthetic preparation
above supersedes them without approving the native application contract.

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
