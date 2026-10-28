# Shifter project state

Last updated: 2026-10-28, diagnostic/design verified and published; approvals pending.

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

### SHF-RESUME-PUBLISH-28 — current resume checkpoint

**State: documentation review PASS / scoped publication DONE.** The current
step records the completed identity-only diagnostic and source-backed proposed
section 46 v0.1, with its separate section 46.1-bootstrap v0.1 approval gate.
Neither proposal is approved by publication. No application changes were made.

Fresh publication checks on 28 October: main HEAD and freshly fetched
origin/main both `ab30f53dcd42974ca2d1b86f1ad7b1ca8a926117`, ahead/behind
0/0, empty index and no conflicts before staging. There are 23 unrelated dirty
paths, inspected by name only and excluded from this publication.
The existing `node docs\reverse-engineering\verify-evidence.mjs` passed:
31 CSVs, 10,000 inventory references, 454 source hashes, 391 design-local
links and 250 line anchors. All 20 historical Oracle capture hashes are
unchanged. The pre-existing duplicate legacy route remains a documented
source anomaly, not a new verification failure.

Publication scope is exactly three paths: this checkpoint,
`docs/SHF_REVERSE_ENGINEERING_DESIGN.md` and the standard generated
`docs/reverse-engineering/verification.json` refresh. Bounded documentation
privacy/secret/private-key/token/DDL and whitespace checks PASS; local-link
closure PASS (395 links across the two documents), verifier relative-import
closure PASS (one import). These checks covered only assigned paths;
the feature publication is verified below. Git reported only the normal
verification JSON LF-to-CRLF conversion warning, not a check failure.
No application typecheck, unit/UI/browser tests, database or DNS operations
are run for this documentation-only step. Earlier backend639/frontend477
totals are historical, not current verification. No dependencies or
infrastructure were changed.

Feature documentation commit
`f6398b35eee3f7d051314a61c644b83022c6ce1b` contains exactly those three
assigned paths and was normally pushed to origin/main. Direct
`git ls-remote origin refs/heads/main` matched local HEAD; tracking
ahead/behind was 0/0, index empty, no conflicts, and all three scoped
working-copy paths matched the published commit. The 23 unrelated dirty
paths remained outside the commit, inspected by name only. No hooks or
signing were bypassed. No check failed; the documented historical duplicate
route anomaly is unchanged.

This status-only follow-up records the already verified feature publication;
its own normal commit/push and direct remote verification follow this edit.
Its SHA is reported in the handoff, not recursively embedded here.

**Next safe action after that checkpoint publication:** stop for the two
explicit user decisions below: section 46.1-bootstrap v0.1 host-reference
trust promotion and section 46 v0.1 native F2 implementation baseline.
Owner: user through parent. Broad TEST permissions are already settled and
are not requested again. No host-trust promotion, native F2 source,
capability, persistence or operational application/Oracle action follows
from this publication.

### SHF-NATIVE-RESUME-28 — diagnostic/design evidence

**State: identity discovery PASS / approval-gated before business access.** On 28 October the user explicitly
confirmed the current Oracle SERVER_HOST and requested continued full project
implementation. This changes the former missing host-confirmation prerequisite.
Record the reference as user-confirmed, not independently DBA-verified; freeze
the exact expected target before checking further business facts. Do not silently
adopt a changed database reply or remove the configured SID/database/account/
endpoint-proof checks.

The operator is reconciling actual Git/runtime state and current TEST identity,
metadata, exact synthetic marker cardinality, actual arrival fields and prior
allowance/outcome before any mutation. All 20 October checks, windows, process
IDs and connection results below are historical. The first handoff is read-only;
application startup, synthetic setup refresh and native command wait for that
result and a scoped operational GO. Existing TEST access and synthetic-data
permissions remain in force; production, schema changes, live EMS/CTI and batch
remain excluded. No restricted environment-file access is authorized.

In parallel, the architect is preparing the next concrete native attendance
slice against the remaining roadmap and controlling legacy station-arrival
behavior. Existing fixture F2 approval is not automatically native F2 approval;
new material API/UI/persistence baselines require explicit approval.
Parent owns this checkpoint; the architect exclusively owns the bounded design
appendix, and the operator has no source-file write ownership.
Previous publication references and blockers below are historical unless
explicitly reaffirmed by current checks.

Initial 28 October readiness handoff: actual local main HEAD is the published
`ab30f53dcd42974ca2d1b86f1ad7b1ca8a926117`, index empty, no conflicts;
cached tracking is 0/0, remote synchronization was not freshly queried.
Node 24.21.0, npm 11.19.0 and oracledb 26.0.0 are locally verified.
Nine fileless synthetic identity/proof cases pass; this is not live Oracle.
The operator did not find a retained exact host/native launcher/trusted TNS
path in the bounded allowed artifacts. DNS, Oracle, metadata/business reads,
application starts, mutations and allowance actions remain zero.
Architect is classifying the user's confirmation as a possible explicit
one-time identity-discovery bootstrap versus the older independent-reference
requirement; no guard is removed while this is unresolved. The operator is
performing bounded legitimate local Oracle Client/TNS location discovery,
not a credential/environment-file or machine-wide search.

Local infrastructure now verified: OCI was located through the installed
client, its normal Oracle Net configuration exists with one unambiguous TEST
alias/SID/endpoint, and explicit Thick initialization passes with Client
19.3.0.0.0. No DNS/Oracle call was needed for this check.
Architect appended section 46 v0.1: next native station arrival is a new
two-column persistence/source/capability baseline, not already authorized by
fixture F2. It also distinguishes a permitted one-time identity observation
from promoting its result to a trusted expected-host reference.
Section 46.1-bootstrap v0.1 requires explicit approval for that promotion
after independently matching DB/INSTANCE/account and full endpoint address
sets; the older no-reply-learning rule is not silently overridden.
One identity-only diagnostic is now assigned; no business reads, metadata,
application startup, setup refresh, allowance or DML may follow it.
Native F2 implementation waits for explicit section 46 approval; broad
continuation and TEST access do not silently approve those new contracts.

Current diagnostic completed: independently expected database (historical
capture), INSTANCE/SID (TNS), user and schema all matched. Exactly one pool,
one connection, one READ ONLY transaction statement and one identity SELECT
were used; rollback acknowledgment, release and pool close all passed.
Provisional host was nonempty and held only in process memory, not persisted
or declared trusted. Oracle Client Thick 19.3 is current runtime evidence.
Oracle Net's explicit default-domain configuration was parsed without guessed
suffixes. Metadata/business SELECT, DNS diagnostics, UPDATE, COMMIT,
FOR UPDATE, sequence, allowance and application-start counts remain zero.

Exact next decisions, owned by the user:
1. Approve section 46.1-bootstrap v0.1: conditional one-time host observation
   on the independently anchored TEST target, full independent configured-
   endpoint address-set equivalence, then one frozen USER-CONFIRMED reference.
   This is a material provenance amendment, not another broad TEST-access ask.
2. Approve section 46 v0.1 native F2 implementation: first on-time station
   arrival for an existing eligible synthetic TEST row, updating only station
   arrival time/user, with canonical native source/capability/receipt changes
   and actual-TEST UI disclosure. Operational execution gates remain separate.
Until these decisions, no native F2 code or host-trust promotion is authorized.
The current verified step is ready for scoped documentation publication;
previous application test totals are historical and were not rerun here.

### SHF-ENV-SID-PUBLISH-20 — current publication checkpoint

**State: offline implementation/QA DONE and PUBLISHED;
real TEST pilot BLOCKED.** Publication GO is not LIVE GO.

- Independent QA `7bc`, caller-confirmed against source-stable owners:
  Phase A frontend 69 focused cases, strict typecheck, all three environment
  builds and emitted-profile checks PASS. Phase B profiles 33/33, native
  focused 158/158, strict backend typecheck, full backend 557/557 and 34/34
  independent actual-entrypoint cases PASS. QA-ENV-01 CLOSED with zero Oracle
  factories/listeners on rejected production contexts. Focused counts overlap
  the full suites; the frontend owner's full suite is 433/433.
- This publication does not rerun those tests, start an application or make
  DNS/Oracle connections. Fresh structural verifier PASS:
  31 CSVs, 10,000 inventory references, 454 source hashes, 391 design-local
  links, 250 line anchors; all 20 historical capture hashes are preserved.
  The documented legacy duplicate route remains unchanged.
- Reviewed scope: backend 17 paths, frontend 11, parent status/design 2, plus
  the required standard verification JSON refresh: 31 candidate paths.
  Manifest dependency/devDependency/override sets are unchanged. Examples
  contain empty secret placeholders or explicitly synthetic double literals;
  public environments contain only build name and relative `/api`.
  Bounded candidate privacy/DDL/private-key/generated-artifact checks found
  no unreviewed secret, private native fixture, new DDL or generated candidate.
  Historical documentation references are not application brief/env parsers.
- Git preflight: main, HEAD and fetched approved origin/main
  `4027aedae8d23348a68b342bb83108a465bb745c`; ahead/behind 0/0, index empty,
  no conflicts. Twenty-three unrelated dirty paths are excluded by names
  only: their contents were NOT read or hashed in this publication.
  Scoped and all-staged whitespace checks PASS without exceptions. Exact
  staged scope is 31 paths; 401 documentation links and 130 relative imports
  resolve to staged or published HEAD artifacts, with no private session-test
  import. All 20 capture hashes match prior HEAD and the refreshed verifier
  matches the staged design. Owner application sources have no unstaged delta.
  Feature commit `03bdd7af2d35502a59fe206f2f9d7edd76ae0d94` published all
  31 authorized paths with normal commit/push and the required co-author.
  Direct remote SHA equals local, ahead/behind 0/0 and index empty verified
  after push. Twenty-three unrelated dirty paths remain outside publication;
  preservation here is names-only, not a renewed bytewise-content assertion.
  This status-only follow-up records the verified feature SHA and result;
  discover its own commit from history without another self-SHA edit loop.
- No production readiness, authentication, real TEST arrival, current
  metadata/grant/freeze/window certification or release is claimed.
  Native TEST remains default-off with read7/fixture9/native10 separation.
  Actual setup refresh, native command/UPDATE/COMMIT and allowance use: zero
  in this publication; existing user instances remain untouched.

Exact live prerequisite: TEST operator/DBA supplies the independently
authoritative exact SERVER_HOST mapping before constructing the immutable
SID endpoint proof. Do not infer it from the DB reply, reverse DNS or suffixes.
Then await a separate parent LIVE GO before any fresh metadata, eligible-row
read, synthetic planning refresh, application startup or UI command.
General TEST access and sections 43/45 approval are already settled.

### SHF-HOST-REFERENCE-20 — bounded independent source discovery

**State: BLOCKED; bounded source discovery complete, no LIVE GO.**
The operator checked two authorized historical captures; neither contains
SERVER_HOST/HOST_NAME. One configured-endpoint forward-CNAME query failed
with DNS_9002, returning zero targets; this does not establish CNAME absence.
The single alternative forward A query used the same configured OS DNS
with DNS-only/no-hosts-file/quick-timeout options and also failed DNS_9002.
No CNAME absence, canonical host or address-set proof can be inferred.
There were zero target-resolution queries and zero Oracle connections,
application starts, setup changes, commands, DML/COMMIT or allowance actions.
No additional retries or fallback searches are planned.
Missing input owner: TEST operator/DBA must supply an authoritative exact host
mapping tied to the configured TNS endpoint, through the private operator
configuration channel without passwords or private row keys in this document.
That changed prerequisite is required before parent LIVE GO can be considered.
The rewrite as a whole and the real arrival pilot remain incomplete.
No DNS-server replacement, public DNS, reverse lookup, guessed suffix/shortname,
DB-reply-seeded lookup, machine-wide search or restricted-file access is allowed.
Only independently declared finite aliases with equal full address sets could
satisfy the unchanged section 45.7 proof. No Oracle connection, application
startup, data refresh, native command or allowance consumption is permitted in
this source-discovery step. If neither source provides the required reference,
stop with the operational input still owned by TEST operator/DBA.

### SHF-F2-CONTRACTS-20 — independent approved implementation

**State: canonical PUBLISHED / fixture implementation and QA PASS / feature PUBLISHED.** The user expressly requested autonomous implementation
after the host-reference blocker was reported. Native TEST F1 remains the
priority and remains externally blocked; no further DNS/Oracle attempts are
planned without the missing authoritative input.
To make independent progress, the architect is verifying and materializing
the previously approved sections 41/42 F2 station-arrival fixture contracts.
This is not native F2 approval, not M1 completion, and not a substitute for a
real Oracle result. If the approval record or prerequisites are insufficient,
the owner must stop rather than invent approval.
The architect confirmed the 20 October 14:21 approval and materialized only
the capability union, new canonical station-arrival types and a focused
contract test. Existing F1 canonical ports need no change. Manual source/shape
review is complete. Direct backend execution now passed the new contract
test 1/1, strict typecheck and existing F1 focused suite 117/117.
The first command-runner attempt was blocked before any command by the host's
maximum sub-agent-depth limit, not by a failing application check. A backend
owner resolved this tooling limitation using direct CLI without nested agents.
The canonical prerequisite is satisfied; backend and UI owners are now
implementing against the frozen types in disjoint package paths.
The backend owner has exclusive noncanonical backend implementation/test/wiring
and README ownership; canonical files remain architect-owned. F1 public behavior and read7/fixture9/native10 remain
protected. Joint F1/F2 fixture capabilities and shared state must follow the
approved explicit mode; nullable stage arrival is not a station prerequisite.
The UI owner has exclusive frontend component/API/guard/history/style/tests
and directly related documentation ownership. No infrastructure/live access,
new framework versions or dependencies are implied. Parent retains status
ownership; canonical-step publication precedes completed consumer publication.

#### SHF-F2-API-20 implementation handoff

Backend owner completed the noncanonical fixture F2 implementation and stopped
writing. Owner-reported current checks: canonical 1/1, station rules/HTTP
71/71, existing F1 117/117, strict typecheck and full backend 629/629 PASS.
Intermediate sample-export, problem-type, URL/test-instance and nested-test
registration failures were corrected before these final runs; they are not
additional product findings or passing runs.

Implemented: three station-arrival operations, explicit joint fixture11 mode,
one shared snapshot/Clock/tuple reservation, nullable stage, pure preparation,
warning/ACK before effect, atomic station-only effect/receipt/audit, shared
revision and separate operation namespaces. Startup wires an independent F2
Origin list; Oracle/native/production F2 configuration rejects before pools.
Changed scope: station application/domain/errors/fixture/validation, shared
stage memory/application/validation/HTTP, policy/config/identity/server,
two station test files and backend README. Canonical types remain unchanged.

Independent SHF-F2-QA-20 Phase A passed canonical/F2 tests 72/72, existing
F1 tests 117/117 and strict typecheck. Its session-only 29-case suite has
26 PASS / 3 FAIL, all reproducing F2-QA-01: the shared Origin truthiness guard
treats an explicitly empty Origin as absent, allowing fixture command effects.
Expected is 403/effect none for every Origin-bearing request not exactly
allowlisted; genuinely absent Origin remains permitted for direct API use.
No browser exploit or production exposure was demonstrated.
Backend owner reproduced 0/8 regression passes before the fix, then corrected
only the shared Origin presence guard and F2/native HTTP tests. Empty and
whitespace headers now deny rather than count as absent. Owner retest:
10/10 new Origin regressions, F2 79/79, F1 117/117, native affected 186/186,
strict typecheck and full backend 639/639 PASS. Actual HTTP assertions cover
403/effect none, zero state/receipt/audit/reservation delta and no native
SQL/port/allowance use. This is owner evidence; independent defect closure
still awaits the QA retest.
Both backend and UI are now SOURCE-STABLE. Independent QA is authorized to
rerun its 29-case suite and execute actual post-fix loopback fixture/browser
integration and final frontend acceptance.

Independent passing cases include shared-tuple exclusion, disjoint-row
concurrency, stage-null station-only effects, pure preparation, explicit/ALS
abort boundaries, genuine 1,000 combined receipts/audits and retention,
privacy and seven fail-before-pool/listen configuration negatives.
These are synthetic Node/HTTP fixtures; Oracle factory calls were zero.
Parent retains checkpoint ownership; no release, native write, browser
accessibility acceptance or full-project completion is claimed.

#### SHF-F2-UI-20 implementation handoff

UI owner declared SOURCE-STABLE. Owner-reported checks: F2 focused tests
36/36, full frontend 469/469 in 35 files, strict typecheck, all three profile
builds/artifact checks PASS. Chrome with synthetic HTTP doubles passed at
1440/390/320 widths, keyboard/Escape, reduced motion, history, UNKNOWN/reload
and visible unobscured exact-opener focus; measured ring contrast 12.6179:1.
Actual loopback fixture-proxy F1-to-F2 integration passed before QA-01's
backend correction, preserving stage/user/briefing, shared revision and one
receipt/audit per operation. That run is explicitly NOT post-fix evidence.
All UI-owned servers/browser processes were closed.

Changed frontend scope: station page/contracts/session/fixtures and four
station spec files; API/identity/routes/attendance actions; F1 page/contracts/
session/view history and three related isolation tests; station browser
checker/server/focus proof; README and existing verification report.
Joint fixture11 gates F2; independent F1/F2/native safety namespaces and null
stage remain explicit. No backend/canonical/dependency changes by UI.
Independent QA may execute stable frontend unit/type/build checks and actual
post-fix backend/proxy/browser integration. Manual assistive-technology testing
and full WCAG/UAT sign-off remain not run.

#### Independent Phase B and remaining F2-QA-02

F2-QA-01 is independently CLOSED: 29/29 API/store cases and all 10 changed
Origin regressions PASS; original empty-Origin command reproductions now
return 403 with zero station/receipt/audit effects.
Independent frontend focused tests 170/170, strict typecheck, three profile
builds/artifact checks and both real Chrome browser modes PASS. Actual
post-backend-fix F1-to-F2 integration preserves shared facts/revision and
separate receipt/audit pairs. Independently dropping each real response after
installation proves UNKNOWN, no retries through history/reload/reselection,
and blocking of the opposite operation on the same uncertain tuple.
Separate operation namespaces do not authorize commands against an uncertain
shared record. Checked widths 1440/390/320 have no page overflow; rendered
focus is 3px, visible/unobscured, measured contrast 12.6179:1.

F2-QA-02 is independently CLOSED: the UI owner corrected the guard from
start >= end to start > end and added eight guard/page boundary cases.
Owner RED 28 PASS / 2 FAIL became GREEN 30/30; focused related frontend
152/152, full frontend 477/477, strict typecheck and all three profile builds/
artifact checks PASS. Both browser modes were freshly rerun successfully
after the correction, using ordinary intervals, not zero-duration browser data.
The zero-duration page test proves review without a command, receipt or
safety marker before explicit confirmation; end-before-start still rejects.
Both consumers are source-stable. QA's previously failing boundary matrix is
now 6/6 PASS, including strengthened actual-backend zero-effect assertions.
The two affected frontend test files independently pass 30/30 and strict
typecheck passes. Ordinary, equal and overnight intervals are accepted;
reversed endpoints reject without validation/command. Actual zero-duration
context/validation preserve business/receipt/audit state 0/0/0 with no active
reservation. A zero-duration real-browser journey was not run; page evidence
is Angular/jsdom. QA recommends the bounded offline implementation checkpoint
for publication with no open product finding in its assigned scope.
Current owner full-suite results are backend 639/639 and frontend 477/477;
focused and independent counts overlap these suites and are not added to them.
Backend remains stable. QA changed no repository files
and closed all its listeners/browser processes. Full WCAG/manual AT/calendar
target coverage and UAT remain unverified.

Next safe action: obtain the unchanged independent SERVER_HOST input from the
TEST operator/DBA. Resume the real TEST pilot only after that input is supplied
and its remaining current-runtime gates pass within the approved scope.
Fixture F2 is complete and published; this does not authorize native F2, new
write contracts, schema changes, production release or EMS/CTI.

#### SHF-F2-CONSUMER-PUBLISH-20 — publication review

Publication review PASS. Feature commit
`04c081ab6ccff7a0e35cd84543c45c8df5ca2f43` was normally pushed to `origin/main`
and independently read back from the remote Git ref. The frozen
checkout scope is exactly 47 paths: 18 backend, 28 frontend and this checkpoint
(28 tracked modifications and 19 new files). The three canonical contract/test
files remain unchanged from `08fc75adaa2d71c49929c84b491f2e5aa5ad7bd4`.
The staged backend scope adds/removes 1,509/37 lines; the frontend scope
adds/removes 1,823/15 lines, including their assigned tests and documentation.
No dependency manifest/lockfile, generated artifact, private fixture, independent
QA harness, verification JSON, legacy file or unrelated customization is included.
The 23 pre-existing noncandidate paths are preserved by exclusion; this is a
names-only scope assertion, not a bytewise comparison or content review.

Static publication checks resolved 324 relative module references, 12 local
Markdown links and six template/style references against HEAD plus the candidate
files. Scoped whitespace and added-content private-key, credential, person-ID,
private-row, DDL and live-data scans passed review. The numeric scan hit is part
of a synthetic UUID; non-loopback URL literals are invalid-Origin test inputs,
not live connections. No application command, test, browser, DNS lookup, Oracle
connection, dependency installation or independent verifier was rerun here.
The owner and independent QA results above remain the runtime evidence:
backend 639/639, frontend 477/477, typechecks, three profile build/artifact checks,
both independently closed findings and the stated browser/boundary limitations.
Native M1 remains externally blocked with zero actual arrivals. After the normal
feature push, actual remote SHA equaled local HEAD, synchronization was 0/0,
the index was empty, all 47 published paths matched the source checkout and the
three canonical files still matched their prerequisite commit. Only the same
23 noncandidate names remained dirty; none were read, hashed or staged.
This status-only follow-up records those observed publication results; its own
commit identity is discoverable from Git history rather than a self-SHA field.

### Environment/SID implementation and QA evidence

1. Native publication is complete, but the actual pilot stopped before business
   reads. The operator proved three launcher expectation errors: database name
   derived from SID, service name equated to SID, and an unsupported exact
   reverse-DNS shortname comparison. One authorized identity-only READ ONLY
   diagnostic now matches the historically documented TEST database, configured
   INSTANCE/SID, independently resolved configured TNS endpoint addresses,
   operator user and schema; all six query aliases/types are valid.
   Business/metadata queries, setup changes, native UPDATE and COMMIT remain
   zero; rollback and pool cleanup passed, allowance is unconsumed.
   Native application binding is still BLOCKED because its exact host/service
   references are not independently available from the SID-only configuration.
   Architect completed the internal compatibility erratum in design section
   45.7: a SID branch may use the independently configured database, instance,
   account and strict DNS-equivalence proof without equating SID with service.
   The existing authoritative service-reference branch remains supported.
   Exactly one branch and one immutable target/proof revision must apply to
   read/write/readback; mismatch denies and post-COMMIT uncertainty remains
   UNKNOWN. Public DTOs, capabilities, business scope and approvals are unchanged.
   Environment owner confirmed native files unchanged and stopped writing.
   Backend owner completed the seven-file private correction and stopped
   writing. SID/service selection, independent bounded proof construction,
   full address-set equality, immutable reference/preparation binding and
   post-COMMIT UNKNOWN behavior are implemented without changing the
   server/runtime seam or public contracts. Legacy service packets remain
   supported. Owner-reported current checks: 78/78 new identity tests,
   184/184 combined native tests, 33/33 profile tests, strict typecheck and
   full backend 557/557 PASS. These are offline doubles, not live DNS/Oracle.
   A material weakening of identity guarantees still requires user approval.
   Never copy the database answer into expected configuration or weaken guards.
   Operator offline preparation now confirms the SID shape with a synthetic
   resolver only. Documented database, configured TNS/SID and historical
   endpoint-DNS verification are available, but an independently authoritative
   exact SERVER_HOST reference is still missing. Live execution remains
   BLOCKED on that operational input; do not learn the alias from a DB reply,
   reverse DNS or suffix inference. This phase made zero real DNS/DB/app-start
   or command calls and left the allowance untouched.
2. SHF-ENV-PROFILES-20 implementation and independent QA are complete and
   published. `SHF_APP_ENV=dev|test|production` is explicit and typed; absent
   selection preserves legacy explicit configuration without a DEV fallback.
   DEV permits only explicitly enabled local fixtures; TEST permits separately
   authorized isolated/test modes; native write remains default-off.
   Production rejects synthetic authentication, fixtures and TEST writes before
   Oracle factories; without real authentication it fails startup explicitly.
   Frontend public configuration has only environment name and relative `/api`.
   Sanitized examples contain no operator secrets. No dependencies changed.
   Owner-reported checks: backend profiles 26/26, full tests 472/472 and strict
   typecheck PASS; frontend full tests 433/433 and strict typecheck PASS;
   DEV, TEST and production builds plus selected-profile artifact checks PASS.
   These are offline checks, not native execution or production readiness.
   Changed artifacts are package scripts/ignores/READMEs, backend environment
   selector/startup/profile tests/config examples, and frontend build profiles,
   public environment modules/API wiring/tests/artifact checker.
3. SHF-ENV-SID-QA-20 Phase A independently passed 69 focused frontend tests,
   strict typecheck, all three environment builds and profile artifact checks.
   HTTP evidence uses Angular doubles; jsdom scrolling warnings do not prove
   real-browser viewport/focus behavior.
   QA-ENV-01 was reproduced by the environment owner in the pure profile
   loader: DEV, TEST and profileless local synthetic configurations were
   accepted with `NODE_ENV=production`. This did not execute a server.
   The owner corrected the profile module, added regressions and documented
   the fixed-message conflict rejection. Seven pure-module regressions PASS,
   including 16 nonconflicting compatibility combinations. Missing NODE_ENV
   retains compatibility; NODE_ENV never implicitly selects an SHF profile.
   Both owners are SOURCE-STABLE. Independent Phase B is now PASS for the
   bounded offline startup/configuration gate: profile tests 33/33, focused
   native tests 158/158, strict typecheck, full backend 557/557, and 34/34
   independent session-only cases PASS. Focused counts overlap the full suite.
   QA-ENV-01 is CLOSED by actual startFromEnvironment tests proving zero
   read/native factories and zero listener calls for conflicting production
   contexts. Independent cases verify legacy 7/9/native10, missing real-provider
   denial, strict SID/account/proof negatives, resolver timeout, immutable
   revision/preparation binding, pure preview and post-COMMIT UNKNOWN/no retry.
   The independent test initially had six fixture-grant omissions; only its
   session fixture was corrected before the final 34/34 run. No application
   defect remained and QA changed no repository files.
   Parent documented the SID private-input shape and proof limits in README.
   Live Oracle/DNS/EMS, current metadata/eligibility/freeze, native COMMIT,
   production deployment and real-browser accessibility remain NOT RUN.
   After native correction, combined checks and independent QA, publish the
   environment/identity checkpoint. The exact next live prerequisite is an
   independently authoritative SERVER_HOST reference, owned by the TEST
   operator/DBA; broad TEST access and native implementation are already
   approved and do not need to be requested again. No application startup,
   synthetic planning refresh or command is authorized by this offline QA pass.
   No production deployment, schema changes or new credentials are implied.
   Latest operator Git preflight: main and remote both
   `4027aedae8d23348a68b342bb83108a465bb745c`, ahead/behind 0/0, index empty.
   Thirty scoped candidate paths (backend 17, frontend 11, parent documents 2)
   are recorded in the private operator journal; 23 unrelated paths were not
   read or hashed. Independent QA and scoped publication now passed; the
   independently authoritative exact SERVER_HOST prerequisite remains open.

### SHF-NATIVE-PILOT-FINAL-20 — current execution checkpoint

**State: OFFLINE READY / feature PUBLISHED; live pilot BLOCKED before business reads.**
This checkpoint supersedes the older implementation/QA-in-progress statements
below; those statements are retained as historical evidence.

- Approved baseline: sections 43/45 v0.1, including the 16:07 approval and
  conditional planning refresh of only the existing exact synthetic marker.
  Production, station/F2, CTI/EMS, DDL, custom functions and legacy execution
  remain excluded. Native commands remain disabled by default.
- Backend owner digest `ba8f446`: four API findings D01–D04 corrected.
  UI owner digest `7605430`: UI-D01/UI-D02 corrected. Caller-provided same
  independent QA digest `35aALL6` closes all six findings, with 26 new
  regressions, 106 native backend tests and independent shutdown/readback/
  allowance/abort and UI focus/HTTP-double evidence. These are offline
  fixtures/doubles, not a live Oracle result or production certification.
- Fresh final verification in this task: backend strict typecheck and
  **446/446 tests PASS**; frontend strict typecheck, **430/430 tests in 30
  files PASS**, and production-assets build PASS. No test runner connected
  to Oracle. A redundant frontend run stalled before totals and its owned
  runner was stopped; the single bounded retry passed in 20.75 seconds.
- Capability boundaries remain read-only **7**, isolated F1 **9**, controlled
  TEST **10**. Native identity is `oracle`, synthetic actor with null employee
  identity; native arrival DTO source is `oracle-test`, not a fixture receipt.
- Initial index empty; main and fetched approved origin/main both
  `0b9c550f1cf696a185526b647bda423c21b96086`, ahead/behind 0/0.
  Twenty-three unrelated paths were identified and a bytewise/deletion
  baseline captured without reading any protected environment file. After
  publication/preflight, all 23 match that baseline and remain unstaged;
  application/design/verifier working copies match the published feature.
- Candidate bounded private-key, literal-password, DDL and brief/protected-file
  parser scans found zero matches. Existing/new synthetic fixtures and the
  three-field SQL/UoW path were reviewed. This is a bounded publication
  review, not a general privacy/security certification.
- Standard evidence verifier PASS: 31 CSVs, 10,000 inventory references,
  454 source hashes, 391 local links, 250 line anchors and 20 preserved Oracle
  captures; the documented legacy duplicate route remains unchanged.
  Scoped staging contains 50 authorized files only. New/existing application
  and all staged documentation whitespace checks PASS without overrides
  (no intentional Markdown hard-break exception was required).
  Staged link closure, normal commit/push and final synchronization are
  checked at publication; no pilot connection precedes those gates.
- Feature publication verified: normal commit
  `8d2c7d6a488a9bd8bfaef2fe6b513ddc1992f4c3`, exactly 50 authorized files;
  pushed origin/main, remote SHA equals local, ahead/behind 0/0, index empty.
  All 395 staged-or-HEAD design/status links resolve; 20 capture hashes match
  the prior published checkpoint. No application or contract correction was
  made by the publication operator.
- One fresh operator READ ONLY preflight connected using the independently
  approved reference in process memory, the existing Client 19.3, local
  CTIDBT_WFMT TNS entry and endpoint DNS. No protected environment file was
  read, reconstructed, compared or used by an application parser.
- **STOP: INDEPENDENT_TEST_IDENTITY_REFERENCE_MISMATCH.** Before any business
  or dictionary query, the exact independently constructed expected DB_NAME,
  SERVER_HOST and SERVICE_NAME did not match; SESSION_USER/CURRENT_SCHEMA
  matched. The sanitized assertion is `ERR_ASSERTION`, not an Oracle write/
  COMMIT failure. No returned database identity was copied into expectations.
  This establishes an operator-reference mismatch, not that the approved TEST
  database is unavailable or that its actual identity has been certified.
- Preflight executed one READ ONLY transaction and one identity SELECT only.
  ROLLBACK acknowledged, connection released and preflight pool closed.
  **Business reads, fresh metadata/constraints/triggers/VPD/grants,
  exact-marker rediscovery and current temporal eligibility NOT RUN.**
  Earlier 84-column/22-constraint/zero-trigger facts remain historical.
- Separate synthetic planning refresh: **NOT RUN**; zero setup UPDATEs,
  zero setup COMMITs, no setup pool created. No original plans were changed.
  Native arrival: **NOT RUN**, zero commands, FOR UPDATE, UPDATEs and COMMITs;
  no allowance created/consumed and no readback/recorded-stage assertion.
  Context/PURE/command HTTP statuses, real Angular review/final confirmation,
  list return and exact opener focus: **NOT RUN**.
- Safe aggregate phase journal: `.git/shf-native-pilot20/result.json`,
  under 8KB, excluding credentials, private employee/day keys, planned times,
  bindings, token/fingerprint or before-images. No retry or reconciliation
  write occurred. The known earlier NJS-500 remains historical/unexplained.
- No new backend, proxy, headed Chrome or native pools were started. There
  are no new user-view PIDs/URLs/logs to claim; existing user applications
  were neither killed nor reconfigured. There are no pilot app pools left open.
  The operator launcher is stopped and its only leased connection/pool closed.
- Required dev/test/production environment-profile work remains **pending
  next task**. No production deployment, real authentication, whole-project
  completion, WCAG conformance or SLA claim is made.

Blocker owner / next safe action: operator/DBA supplies or verifies the exact
independent TEST database/host/service expectation, including required case
and service spelling, against the approved environment reference/DNS rather
than a copied connection answer. Resume only after that prerequisite changes;
do not reconnect automatically or patch application business code. Then fresh
metadata/ownership/window checks must precede any separately authorized
synthetic setup refresh and the one real Angular command. This is not a new
general TEST-access or contract-approval request.
Keep credentials, private keys, plan timestamps, bindings and tokens out of
Git, logs and this checkpoint. Retain any consumed allowance; never retry an
unknown command.

This second publication is status-only and records the actual blocked live
outcome. It does not change sections 43/45, canonical contracts, application
code or the standard verifier JSON, and does not claim native PASS. The final
normal commit/push and remote/index/23-path bytewise checks are verified after
this pre-commit checkpoint without a self-SHA edit loop.

The user asked when real Oracle records could be updated. On 20 October at
14:25, the next priority changed from more fixture features to native write
readiness and a controlled first-arrival plan.

| Work item | State | Owner / next action |
|---|---|---|
| Native first-arrival plan, design section 43 v0.1 | approved; feature published | Section 45 approved; backend/UI and all six offline QA corrections published in `8d2c7d6` |
| Current TEST metadata and fixture preflight | blocked; historical evidence only | Fresh final pilot stopped at independent identity comparison before metadata/business reads; earlier 84 columns/22 constraints are not a fresh assertion |
| Eligible TEST record | time-sensitive, revalidate | New synthetic dataset verified eligible at read-back, with approximately four minutes left in its allowed window; do not assume eligibility now |
| Synthetic TEST data preparation | done: PREPARED_VERIFIED | Three acknowledged INSERTs, one successful COMMIT and separate read-only read-back; first arrival still NULL |
| Preflight connection health | review | Earlier NJS-500/failed rollback remains unexplained; a later single read-only connection completed six SELECTs and cleanup successfully |
| Native readiness checkpoint | offline ready / live blocked | Feature publication verified; exact independent TEST identity reference is the remaining first operator blocker |
| Actual Oracle arrival UPDATE | not executed: identity-blocked | Zero native commands/UPDATE/COMMIT; do not auto-retry or infer eligibility, update or recorded stage |

### Latest approval and requested environments

At 16:07 the user agreed to the requested native adapter step and asked for
dev, test and production support by the end of the process, then said "do next
step". Record section 43 implementation approval and proceed without repeating
general TEST access, candidate-selection or post-success restoration questions.
This approval does not enable production writes, DDL, CTI/EMS or arbitrary
changes to real employees.

Native canonical contract handoff completed: section 45 and
`backend/fixture-slice/oracle-stage-arrival-contracts.mts`.
Backend and UI consumers are implementing the disabled-by-default controlled
TEST writer and existing UI mode changes in disjoint directories.
The prepared synthetic record's old four-minute eligibility is not current;
verify real Clock, source facts and policy again at execution. Only the exact
synthetic test scope may be used. A rejected/expired window is not overridden.

Environment support is a required later delivery item:

- dev: explicit isolated fixture mode, no implicit access to real infrastructure;
- test: explicit Oracle connection/secrets and independently enabled scoped
  native TEST commands;
- production: synthetic login and TEST command modes rejected, no dev/test
  fallback, real authentication/configuration prerequisite;
- secrets stay server-side; frontend gets only public configuration.

Environment support is not production deployment authorization. Do not
automatically provision containers, change the schema or contact production.

### Historical implementation progression: SHF-NATIVE-ARRIVAL-API/UI-20

- Read-only Oracle remains seven-capability, isolated F1 remains nine-capability;
  the new controlled TEST mode has ten, including the explicit native write cap.
- Native identity stays `oracle`; native context/validation/receipt use
  `oracle-test`. A validated success is `oracle-test-committed`, not a fixture
  receipt and not a durable exactly-once guarantee.
- One command may change only stage time, trusted server-principal stamp and
  TADREECH=0 on the operator-allowlisted synthetic row. No INSERT, audit/receipt
  table changes, station/exit/CTI/EMS or schema changes in the command.
- Backend implementation completed: owner-reported strict typecheck and
  **420/420 tests** (340 prior + 80 native) passed. Independent offline backend
  QA confirmed four defects despite the passing suite; corrections are running.
- UI implementation completed: owner-reported **427/427 tests** (357 prior +
  70 native), typecheck, build, native synthetic interception/HTTP-double checks,
  and prior fixture/read-flow browser checks passed. Independent UI QA repeated
  427 tests/typecheck/build/native HTTP-double and prior read-view checks, then
  confirmed two keyboard-focus defects; targeted corrections are running.
- New backend checks are doubles/fixtures only. No native Oracle connection,
  FOR UPDATE, arrival UPDATE, COMMIT or live read-back was executed by the
  implementation task. The previous synthetic-data INSERT is a separate step.
- The writer requires a stable private one-attempt allowance path as well as
  exact TEST identity, marker/record scope and current eligibility. This is not
  a durable receipt or distributed exactly-once guarantee.
- After owner checks, independent QA precedes one controlled TEST UI commit and
  independent read-back, only if current real temporal/scope checks pass.
- Native UI live integration has not run. The typed native HTTP stub is not an
  Oracle adapter or evidence of COMMIT. Current synthetic record window is
  expired according to the owner; an operator must verify it afresh before any
  controlled test operation. The application must not auto-reset its plan.
- Environment profiles remain a subsequent required delivery item; no
  production mode is being activated by these tasks.

### Historical native offline QA findings: SHF-NATIVE-QA-API-20

Independent 420-test/typecheck run passed, but 60 additional synthetic scenarios
found four confirmed failures:

- D01, high: stage time NULL with non-NULL stage user was incorrectly admitted;
  preparation and locked revalidation must reject the orphan stamp.
- D02, high: shutdown could close pools while native COMMIT was still active;
  all operations and cleanup must settle before pool closure.
- D03, medium: an impossible read-back timestamp passed the receipt guard;
  malformed dates cannot establish success.
- D04, medium: an ancestor junction bypassed the external-only allowance path
  boundary; lexical path comparison is insufficient.

Backend owner supplied the four targeted corrections: orphan provenance
rejection, underlying-operation shutdown drain before pool closure, strict
Gregorian receipt instants and physical allowance-path checks. Owner-reported
26 new regressions, 106 native tests, full **446/446** and typecheck passed.
The original four failures were reproduced before the fix. Independent bounded
retest is running; they are not yet declared closed.
Independent
frontend QA may use interception and typed HTTP stubs while backend changes
continue; real backend/native execution is not accepted yet. No Oracle
connection or mutation was performed by this offline QA. Do not start the
controlled TEST update until the findings have been independently closed.

Independent native UI QA confirmed:

- UI-D01: Material confirmation Cancel/final-confirm and the pending opener had
  no visible outline; measured state contrasts were approximately 1.14-1.22:1,
  below the approved 3:1 indicator criterion.
- UI-D02: on 1440x900, the exact focused pending opener was entirely below the
  viewport after dialog closure. Preserving DOM focus alone is insufficient.

UI owner is fixing scoped overlay/component indicators and post-render minimal
scroll/focus visibility, with duplicate-submit and stale-generation guards
preserved. The candidate fix now passed owner-reported **430/430 tests**,
typecheck/build and actual synthetic pixel/geometry checks: indicator contrasts
about 12.53/12.62:1, desktop pending opener visible and hit-testable, one command
despite repeated Space. The correction uses a namespaced visible ring and
afterNextRender restoration with minimal nearest scrolling; no magic offset.
Independent bounded retest remains pending. Functional/privacy/source checks
passed, but these findings must
close before native pilot acceptance. All browser data remains synthetic;
typed HTTP stubs are not evidence of a real Oracle COMMIT.

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
| Section 43 v0.1 | User agreed to native adapter implementation at 16:07; only the prepared synthetic TEST scope, with runtime grants/value/window checks before execution |

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
| Native adapter implementation | Approval received; canonical handoff, backend/UI implementation and independent QA remain |
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

1. Complete the section 43 approved native contract handoff, then backend/UI
   implementation and independent tests. General TEST access and successful
   result retention are already approved; do not ask for them again.
2. Rediscover the verified synthetic generation by exact public marker and
   revalidate its current values, scope and real temporal eligibility before
   any native arrival command. Do not INSERT another fixture automatically or
   change its plan/Clock when the allowed window expires.
   The earlier NJS-500 remains separately unexplained.
3. Before native execution, bind section 43.8 runtime inputs to the exact
   synthetic marker/account/actor, three SET fields, current before-images,
   proposed values and one COMMIT/read-back. Reject mismatches rather than
   broadening to real employee records. Successful TEST changes may remain;
   later compensating restoration requires its own precise conditions.
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
