# Shifter: finite remainder and development-completion plan

**Task:** SHF-REMAINDER-52. **Version:** remainder-v0.1. **Date:** 1 November 2026.
**Status:** APPROVED execution roadmap remainder-v0.1; §52-v0.2 API,
52-config-v0.1 and reviewed 52-UI-v0.2 explicitly approved by the user
2026-11-01 13:56+02: «Одобряю план remainder-v0.1 и §52-v0.2,
включая52-config-v0.1 и52-UI-v0.2». Canonical handoff: design §52.8.
Owner: system_architect; caller owns scheduling, status and publication. No agents invoked.
The subsequent user mandate allows automatic continuation of future missions and
bounded live Oracle/provisioning/release work through the caller. It is not evidence
of current environment readiness or approval of unwritten API versions; each future
versioned baseline still records/checks its owner/approval boundary. Operational
readiness/provisioning is a separate bounded owner task; no production mutation,
schema change, live EMS or real-auth fallback is authorized by this record.

## 1. Starting point and evidence envelope

Read [PROJECT_STATUS](PROJECT_STATUS.md#current-priority-complete-approved-workflows-and-remaining-development-delivery)
first. Its current resume record supersedes its stale header and historical failures.
**D (checkpoint/caller, not rerun):** bounded §49 CRUD/CSV and §50 late station arrival/global
employee fence are implemented; §51 empty synthetic Docker demo works on loopback port18080.
Latest published feature8580554, status3415476 are caller-supplied provenance, not a fresh Git check.
Last actual reported validation: backend1863/frontend753, all profiles/three ZIPs,
deployed Docker4 keyboard worlds and2 rapid-reopen regressions. Those are not parity percentages.
The demo has no Oracle/EMS and does not demonstrate populated workflows or full development.

Evidence labels: **S** inspected controlling source; **D** existing baseline/checkpoint;
**P** proposed target/work; **U** unverified. No new runtime verification in this task.
The source-contract catalog is absent from the inspected docs listing. Reuse, do not duplicate:
[baseline §4 menu](SHF_REVERSE_ENGINEERING_DESIGN.md#43-shell-and-menu),
[§5 screens](SHF_REVERSE_ENGINEERING_DESIGN.md#5-screen-and-interaction-catalog),
[§6 WF-01–23](SHF_REVERSE_ENGINEERING_DESIGN.md#6-end-to-end-workflow-traceability),
[routes](reverse-engineering/routes.csv), [dispatch branches](reverse-engineering/dispatch-branches.csv),
[navigation](reverse-engineering/navigation.csv), [controls](reverse-engineering/screen-controls.csv).
These lexical inventories are a discovery envelope, not proof every dynamic transition is covered.
M01 must reconcile menus, submenus, route branches and controls against approved target slices.
No claim of whole-legacy parity until that reconciliation is accepted; every unmatched action
gets an owner and implemented/deferred/excluded disposition, not an invented replacement.

**S spot crosscheck:** right_menu.jsp:51–190 covers attendance, shifts, employee, breaks,
forecast, completion, admin and reports; routes.csv also exposes exceptions, pool, mobile and IWD.
AttendanceDataAction:181–260 shows early exit is event creation plus optional mood plus exit,
not a two-column ordinary-exit variation. EmployeeDataModel:1098–1160 uses existing event NEXTVAL.
§52 deliberately chooses **existing-row ordinary station-exit cancellation** first:
AttendanceDataAction:292–300 → AttendanceDataModel:2197–2248; see appended source trace.
This closes one concrete management correction gap without inventing manager authentication,
discarding required event attribution, or claiming all early exits complete.

## 2. Completed foundations versus partial coverage

| Area | Completed bounded baseline (D; selected source inspected) | Remaining, not implied complete |
|---|---|---|
| Runtime/security/shell | Node24.21 native HTTP/.mts, TS5.9.3; Angular21.2 Material/CDK M3; environment gates and synthetic identity | All new action capabilities must be separately approved; real-provider decision/release separate |
| Seven inquiry families | Selected shift day/current/search/my shifts/items/card/attendance, filters/history/navigation | Broader employee tabs/search, exceptions search, cancelled lists, totals, exports, all legacy filter variants |
| Attendance | Stage first-arrival, ordinary station first-arrival/exit, bounded late station first-arrival (§§44–47,50) | Early exit/events/mood, stage lateness, corrections/cancellations, missing/report/flag/briefing actions |
| Shift management | §49 future/simple one-employee create/change/logical cancel, pure CSV preview/all-or-none create | Split, exceptions/break-dependent/post-start, location/reassignment and request-mediated variants |
| Integrations | Abstract-only seams, honest required/unknown deferral | Interactive pool/CTI/IWD/admin contracts; no actual partner completion or transport |
| Delivery | §51 actual empty isolated Docker demo, fresh dev/test/prod ZIPs | Populated synthetic Docker journeys, final refreshed images/packages and business QA |

## 3. Execution contract for every mission

States below are current planning states: **ready** = bounded analysis can start now;
**proposed** = target slice not approved; **blocked** = named prerequisite absent.
Owners are handoff roles, not invoked agents. A prerequisite means its accepted output, not table order.
`F` = completed foundations §§49–51 and existing read/identity contracts; no new mission approval.
`G(ID)` = architect baseline + caller-routed ui-designer review + explicit user approval
for that mission, then serialized canonical materialization/consumer handshake.
Each business mission has G(ID) as an additional implementation prerequisite even if omitted in
the short dependency cell. Planning readiness is never consumer-code readiness.

**Business deliverable pack V:** backend pure domain/application use case; strict versioned
REST DTO/validation/problem/capability contracts; Hebrew/RTL M3 UI including all action states;
existing-schema read/write allowlist and transaction/ACK/readback/UNKNOWN semantics; synthetic
fixtures and unit/API/persistence-double/UI/integrated tests traced to each accepted action.
Preview effects must be0; no legacy mutating validator invocation. Existing objects only.
Per-row “V + …” adds mission-specific backend/UI/API/persistence/test requirements.
**Done for V:** all accepted action cases pass focused tests and integrated populated journeys;
no unclassified branch, unauthorized operation, fake partner receipt or unresolved critical defect.
Deferred cases remain visibly deferred and require business approval; silent omission is not Done.
Parent serializes shared identity, HTTP dispatch, navigation, coordinator and design edits.
Backend and UI may work in disjoint module/test paths only after G; QA independently owns evidence.
No concurrent agents here; “parallel” is a future scheduling possibility, not work already running.

## 4. Finite mission backlog

Source paths below are relative to `old/SHF/src/bzq/shf/` unless stated otherwise.
WF references link through the existing §6 map above to controlling symbols; this is not a new catalog.
“Missing” means not established by completed baseline, not a fresh exhaustive implementation audit.

| ID / phase / owner / state | Scope and controlling entrypoint/business symbol | Prerequisite IDs | Deliverables and measurable Done / approval / disjoint work |
|---|---|---|---|
| M01 / coverage / architect+QA / ready | Reconcile right_menu + jsp/submenu, all active routes/dispatch/controls to WF-01–23 and completed §§13–51 | F | Accepted action disposition attached to existing evidence, including duplicates/stubs/dynamic-link unknowns;0 ownerless actions. User approves finite scope/defer list. Read-only discovery can overlap M02 planning. |
| M02 / demo / backend+UI+DevOps+QA / proposed | Populated isolated Docker fixtures for existing seven reads and approved §49/50 journeys; §51.2–4 loaders, server.mts | F | Reuse validated DTO/loaders; scenario/clock manifest and truthful source labels, no new API. Actual Docker list→detail→action→readback/UNKNOWN journeys pass,0 Oracle factories/operator mounts. Native-only flows stay disabled, not silently simulated as native. User approves packaging/fixture scope; disjoint from M01. |
| M03 / attendance / architect then backend+UI+QA / proposed | NEXT §52: /attendance/cancelExit; AttendanceDataModel.cancelExitStation:2210 | F | V + bounded two-column existing-row exit cancellation; preservation and quarantine tests below. Done = §52 acceptance matrix passes, not all corrections. §52 UI review complete as a proposal; user approval pending; disjoint module work after canonical gate. |
| M04 / attendance / architect then backend+UI+QA / proposed | /attendance/employeeStationExit + employeeEarlyExit; AttendanceDataAction.agent_exit/EarlyExit; EmployeeDataModel.addEvent | M01 | V + early threshold, reason/event/manager attribution/mood assessment; existing event sequence only if authorized by baseline.0 event/exit partial success accepted as success; equality/subminute/midnight and manager-list cases characterized. User approves bounded subtype, explicit gaps; not dependent on M03. |
| M05 / attendance / architect then backend+UI+QA / proposed | /attendance/setAttendance, cancelStation/cancelExit, employee events; registerStage/undoRegisterStage/cancelRegisterStation/cancelLate/cancelStageLate; EmployeeDataModel.cancelEvent | M01,M03 | V + stage-late first-arrival and remaining correction subtypes with exact clearing/preservation fields; no “undo fence” API. Done = each reconciled subtype has tests or approved deferral. G per subtype; separate pure rule analysis can overlap M04. |
| M06 / attendance / architect then backend+UI+QA / proposed | /attendance/addEvent/removeMissing/approveReport/cancelReport; addEvent/cancelMissing/checkReports/approveReport | M01 | V + single-day then explicitly reviewed date-range missing, report requirement/approval lifecycle and employee lock policy. Characterize checkLock counter boundaries and two-table rollback; no partial multi-day success hidden. G before each bounded packet; separate from M04 analysis. |
| M07 / attendance / architect then backend+UI+QA / proposed | /attendance/addFlag/removeFlag/setTadreech; doFlag/removeFlag/setTadreech/addEntryMood | M01 | V + closed flag values and actor encoding, briefing0/1, mood assessment; distinguish UPDATE from legacy INSERT fallbacks. Tests prove all unowned columns unchanged and no implicit arrival/event. G; disjoint analysis, shared attendance UI serialized. |
| M08 / shifts / architect then backend+UI+QA / proposed | /shift/updateShiftExceptions/updateShift/viewExtraShiftDialog; validateSplitShift:5739/validateShiftBreaks:5777/validateUpdate:3604 | M01 | V + first complex split subtype, then break/exception dependent create/change; pure preview replaces candidate-deleting validation. Full interval/equality/16:00/calendar tests; partner required/unknown visibly deferred. G per subtype; pure rules overlap M04. |
| M09 / shifts / architect then backend+UI+QA / proposed | /shift/updateShiftLocation/cancel/addRemark; ShiftDataAction:528,806; ShiftDataModel.cancelShift/checkShiftForCancel | M01 | V + location/work-from-home and reassignment/post-start/dependent cancellation only where controlling branch confirmed; remarks separate. Tests preserve baseline/overlay/source/counters and classify pool/partner blockers. G; any unverified reassignment discovery stays M01, not assumed endpoint. |
| M10 / exceptions / architect then backend+UI+QA / proposed | /exceptions/param/result/addRemark; ExceptionAction:51–89 → ExceptionDataModel.populateAllExceptions/addRemark | M01 | V + bounded inquiry/pagination/export/remark plus action variants found by M01; reuse shift-items read without calling it full exception administration. Done = filter/null/source/remark bounds and permission tests for accepted actions. G; disjoint from shift editor. |
| M11 / breaks / architect then backend+UI+QA / proposed | /break/searchParam and actual exit/return/update routes; BreakDataModel.checkShiftBreakForm:3218 | M01 | V + inquiry/actual-times/planned edits with source eligibility, within-shift/spacing/minutes policy; distinguish corrections from partner callbacks. Equality/overnight/late/source cases pass; no transport. G; independent read UI, shared shift effects serialized. |
| M12 / exchanges / architect then backend+UI+QA / proposed | Replacement repository/candidate/offers/accept/cancel/reject; ReplaceModel.checkValidShiftCandidate:941/offerReplaceToCandidate:146/acceptReplaceOffer:570 | M01 | V + employee marketplace lifecycle, DAO statuses, acceptance recheck and competing offers. Asymmetric gaps/week-year/status races tested; SMS abstract not delivered. G; may overlap M11 after distinct contracts. |
| M13 / exchanges / architect then backend+UI+QA / proposed | Forced swap + break exchange; SwitchModel.validateReplace:69/replaceDays:294; BreakDataModel.checkValidBreakCandidate:961 | M01,M11,M12 | V + hard stop versus confirmable limitation-removal command; break candidates/offers and actual-state checks. Pure check0 writes; two participant all-or-none/readback and race cases pass. G per swap/break packet; shared exchange writes serialized. |
| M14 / messaging / architect then backend+UI+QA / proposed | /message/messages, /message/messages_icon, /messages/deleteMessages/acceptOffer; MessagesAction:62,85,90,124 and WF-09/10 DAO | M01,M12 | V + inbox/icon/delete markers and offer acceptance navigation; reuse acceptance use case, no second permission path. Tests stale offer/not-found/delete state and0 external notification. G; UI/reads disjoint from M13 rules. |
| M15 / staffing / architect then backend+UI+QA / proposed | /shift/inforceShift/addShift/InforcePotential*/addExtraAll; validateInforceRequest:1471 and ShiftDataAction:190–299,962 | M01,M08 | V + management request, potential/options, application/approval/capacity; bounded bulk interactive apply not batch. Tests overnight, min/max, capacity races and all-selected outcome. G; policy discovery may start before M08 implementation. |
| M16 / reductions / architect then backend+UI+QA / proposed | /reduce/reduceShiftReq/approveDeclineReduce; ReduceDataModel:386, WF-14 | M01,M09 | V + request/options/application/approve-decline/cancel lifecycle; close legacy separate cancellation/approval transaction ambiguity. Done = lead-time equality and competing-capacity outcomes tested, no fake notification. G; independent request UI. |
| M17 / time change / architect then backend+UI+QA / proposed | Change requests/options/applications; ShiftDataModel.validateChangeRequest:4524/addShiftChangeRequest:4575 | M01,M08 | V + bounded ranges, eligible application and approval/decline; commented lead-time rule explicitly decided, not resurrected blindly. Duration/order/week/concurrent quota tests pass. G; disjoint request modules from M16. |
| M18 / pool / architect then backend+UI+QA / proposed | /shift/checkPoolExtensionAllocated/poolExtAllocRelease; ShiftDataAction:1076–1110 → ShiftDataModel.poolExtAllocRelease | M01 | V + home-shift inquiry and abstract allocate/release DTOs/completion states. Simulated result labeled; native partner-required mutation deferred. Done = stale/allocation/unknown tests; actual HTTP partner transport excluded. G; separate partner seam. |
| M19 / employee / architect then backend+UI+QA / proposed | /employee/searchResult/showCard/getSkills/getEvents/updateParamSMS/getTeamMembers; EmployeeDataModel.populateEmployeeList/updateEmployeeParameters/populateEvents | M01 | V + employee search/card tabs/events/preferences/parameter edits, skills assignment where mapped; preserve operational-card subset. Courses/taxi functions inspected as empty stubs (populateCourses/populateTaxiOrders), not invented completed integrations. Done = accepted filters/tabs/edits tested and stub disposition approved. G; independent employee UI. |
| M20 / admin / architect then backend+UI+QA / proposed | /admin, SystemAdminAction manageInnerJobs/parameters/skills/activityAim/actualJob; AdminAction EventReasonDao; BuildingModel.updateTeamBuilding:316 | M01 | V + source-backed reason/type/completion catalogs, unit/system policy, skills/jobs/activities, buildings/team assignments. Not generic employee/org CRUD: verify each actual mutator. Tests referential/null/cache invalidation and assignment-unassignment rollback. G per catalog packet; disjoint catalogs possible, shared cache serialized. |
| M21 / completions / architect then backend+UI+QA / proposed | /completion/menu and CTIAction save/update/cancel/job-SAP; CTICompletion.checkCompletion:904/saveCompletions:959 | M01 | V + interactive CTI completion search, duration/overlap, selected save/update/cancel and mappings; login-cancel event/mail branch included via M01. Status transitions and all-selected rollback tests; actual CTI/SAP/mail delivery deferred. G; separate completion modules. |
| M22 / managed breaks / architect then backend+UI+QA / proposed | /admin/optShfSpView/Update; OptShfSpModel:138, BreakDataModel.createMessageTransaction:3260, WF-18/19 | M01 | V + interactive flags/assessment and abstract request/response/callback contracts only.0 ledger function/transport on preview; simulated versus actual completion tests. Native required/unknown partner paths deferred; MDB/SoftPhone transport and workers excluded. G; serialized partner canonical contracts. |
| M23 / forecast / architect then backend+UI+QA / proposed | /forecast/param/marked/late/missing/future/shifting/extension/activities; ForecastModel.sumSchData:3837 | M01 | V + interactive forecast inquiries/drilldowns and any mapped interactive edits, not batch forecast generation. Quarter completeness/sum-average/null/15-minute rollup tested; bounded pagination and as-of. G; disjoint read modules. |
| M24 / reports / architect then backend+UI+QA / proposed | /shift/cancelledResult, attendance/employee/break/exception exports, /wfmReport(/getForecast/getSites), /wfmHRReport, /mobile/Report* | M01,M10,M19 | V + cancelled three-family union, scoped totals/exports, WFM/HR and mobile audit reads. Bounded UTF-8/Hebrew spreadsheet-safe downloads, filters/data/format/error tests; templates only if licensed/available. G per report family; disjoint export code. |
| M25 / IWD / architect then backend+UI+QA / proposed | /IWD/peleParam/Result/Schedule/Cancel; IWDModel.doSchedule:334 | M01 | V + interactive module timing/history/cancel, active-shift/before-end/count/interval rules. Tests prove recorded scheduling is not delivered training; job explicitly deferred. G; independent module. |
| M26 / native verification / operator+DBA+QA / blocked | Existing Oracle read/write ports; §§48–50 limited metadata and command coordinator | F; separate user environment/data/operation GO absent | Approved target-specific metadata/driver/client/charset/least-privilege/exclusion packet, measured capacity and preservation tests only for named workflows. No planning permission to connect. Done = actual evidence and honest failed/not-run cases; can proceed independently of offline business coding after GO. |
| M27 / global QA / QA+UI+business owner / proposed | Cross-family shell, navigation, mixed-direction content and accepted workflow matrix | M01,M02; final closure M03–M25 | Automated regression plus real keyboard/AT/manual Hebrew/RTL/reflow/contrast/UAT evidence.0 open critical defects and each accepted action has actual scenario verdict; test count alone insufficient. Manual/UAT environment and acceptance owner required. Disjoint evidence, fixes by product owners. |
| M28 / final development delivery / DevOps+QA+caller / blocked | Current Build-Shifter/Build-Docker-Shifter and §51 accepted topology | M01–M25,M27; scope/defer acceptance absent | Refresh dev/test/prod ZIPs and pinned actual Docker images from same current source/locks; file/hash/closure/profile/identity/lifecycle checks and populated browser run. Production startup still fail-closed. User authorizes packaging/owned demo update; no native fallback/registry/release. |
| R01 / release gate / user+security+operations+business / blocked | WF-01 real identity seam, production perimeter and operational acceptance | M28; separate real-auth/TLS/live permissions absent | Approve real-provider requirement/ownership and implementation separately, infrastructure TLS/secrets/audit/restore/monitoring/capacity plan, live permissions and business release sign-off. Not this request's implementation scope; no Administrator production substitute. |

## 5. Phases, critical path and parallel scheduling

1. **Foundations retained:** F is done within recorded bounds. Do not redo Docker/empty-demo as
   the entire project or destabilize frozen contracts/dependencies. Read-only modes unchanged.
2. **Coverage and usable development demo:** M01 first; M02 planning alongside it.
   Source-backed §52 review can proceed now; M03 implementation waits G(M03), not full M01 closure.
3. **Business verticals:** priority M03 → M04/M06/M08; then request/exchange/catalog families.
   This is prioritization, not a dependency chain. M04, M06, M08 and M19 rule analysis is disjoint.
   After accepted contracts, backend/UI work may overlap within a slice; shared dispatch/types
   and attendance editor are serialized. M11→M13 and M12→M14 are genuine reuse dependencies.
4. **Native operator integration:** M26 is a separate permission lane, not a reason to halt
   isolated implementation. Measure only approved scopes; no target100/live capacity claims.
5. **QA and final packages:** M27 incrementally follows each vertical, then closes the whole
   accepted matrix; M28 refreshes all three packages and actual populated Docker deployment.
   No estimates/percentages/deadlines are supplied without sized, approved action scope.
6. **Release:** R01 remains separate. If batch/partners/real identity are deferred, record
   exact dependency and affected action; never rename a blocked release “production ready”.

## 6. Completion and operational risk rules

**DEVELOPMENT COMPLETE:** M01's accepted finite interactive envelope is implemented and tested
against approved API/UI contracts; V deliverables and M27/M28 pass; dependency deferrals/exclusions
have explicit business approval with affected actions visible; no unapproved contracts consumed.
A partial subtype cannot close its parent mission. Docker populated demo is a deliverable, not parity.
**RELEASE COMPLETE:** additionally R01 and applicable M26/live acceptance satisfied, including
real identity, TLS, deployment/operations and business sign-off. Neither condition holds today.

Frozen versions remain Node24.21.0/native HTTP/.mts, TS5.9.3, Angular21.2/Material3,
existing Oracle schema and abstract EMS; no DDL/outbox/new broker worker/framework switch.
Inspected package manifests pin Oracle driver26.0.0 and Angular/Material patch lines.
Current public vendor compatibility/support was **not researched** (static-only tools).
Historical Oracle11.2/charset metadata does not certify Node driver26 + Thick Linux client support;
Thin is not a fallback for Oracle11. Native11/Thick/Linux lies outside this demo and requires M26
vendor-supported combination proof. No dependency/client install or version change authorized.

Two limited-metadata UNKNOWN scopes are DBA_TRIGGERS and DBA_ROLE_PRIVS
(`backend/fixture-slice/native-metadata-limited.mts:17–23`); owner-only trigger visibility does not
prove cross-schema effects or complete role-derived grants. External dependency writers are a
separate exclusion risk. Old proof/waiver does not approve a new operation.
SHF_INS_AND_RETURN_LASTID's autonomous INSERT/COMMIT survives outer rollback (baseline §9).
Existing sequence allocation also is not rollbackable. Partner timeout may coexist with actual
partner effects; no distributed atomicity, fake EMS success or automatic retry/reconciliation worker.
Every new native writer must participate in §50 employee-wide local-filesystem coordinator plus its
own old-style allowance. **All attempts** retain consumed authority after success/rollback/UNKNOWN.
Cancellation of attendance data is not cancellation of the attempt fence. Operator reopening only
under separate stopped-writers reconciliation permission; consumed F1 fuse remains untouched.
Other hosts/legacy writers, simultaneous record loss and power-loss guarantees are unresolved.
The current controlled pilot cannot be advertised as daily-use production operations.

## 7. Checks, approval and next handoff

Performed: bounded static reads of current status/design/inventories, controlling attendance/event/
exception/admin/pool source, current canonical identity/exit/coordinator contracts and package manifests;
manual source-to-backlog/§52 comparison; view readback of the two owned document edits.
No exhaustive code inventory generated. No source, status, configuration or dependency edits.
NOT RUN: CLI/Git/hash/link/automated line-count/verifier/tests/typecheck/build/Docker/browser/AT/UAT;
documentation-only view/patch tools and explicit no-operation scope. No new PASS/runtime claims.
No DB/DNS/EMS/batch/legacy execution, operator fuse/credential/config access or services used.

After approval owners reuse actual scripts: backend `npm run typecheck`, `npm test`;
frontend `npm run typecheck`, `npm test`, selected profile build. Architect has run none.
Focused §52 suite names/commands supplied only once approved test files exist, not fictional passes.
Parent owns exact packaging/test command invocation and fresh evidence in PROJECT_STATUS.

**Immediate blockers:** M01 scope acceptance→user/business owner; §52 UI review is complete
as a proposal in design §52.7, not implementation approval;
§52 bundled API/capability/safety approval→user; canonical materialization→architect after approval;
native operation packet/compatibility/exclusion→operator/DBA under separate permission.
**Next action:** caller presents the reviewed §52-v0.2 / 52-config-v0.1 / 52-UI-v0.2,
remainder-v0.1 scope/priorities and the exact §52 approval sentence, then returns approved revision
to architect for canonical handshake. Parent may not infer approval from “complete the project”.

### Immediate execution decisions

1. Accept or amend remainder-v0.1 mission priorities and explicit exclusions.
   This approves a roadmap, not all future API contracts or live operations.
2. Start M01 read-only action reconciliation; its accepted coverage output
   determines the final interactive scope and prevents silently omitting actions.
3. Approve the reviewed §52-v0.2 bundle before M03 code. Cancellation clears
   data, not consumed command authority: a prior coordinated exit needs separate
   operator reconciliation/reopening, which this development approval excludes.
4. Prepare M02's populated synthetic demo baseline alongside M01. Native-only
   functionality must stay disabled or visibly deferred, not masquerade as native.
5. Repeat the contract → implementation → focused/independent QA → GitHub →
   current Docker/package update cycle for each accepted vertical.

The exact next approval wording is recorded once in design §52.6; link this
plan to that authoritative version rather than treating a general continuation
as approval of unpublished contracts.

**Publisher validation (1 November 2026; separate from architect checks above):**
The standard static evidence verifier passed with its documented duplicate-route anomaly:
31 CSVs,10000 references,454 source hashes,436 design links,293 line references,20 historical
capture hashes; its output-file write was suppressed. Assigned-doc checks passed:29 unique
missions with acyclic prerequisites,473 local links,19 Markdown/8 HTML anchors,10 explicit
source paths. One pre-existing user-report anchor was not read under the preservation scope.
Source `#L` references use the existing repository convention; no rendered-page/runtime claim.
Two stale UI-review-pending statements were corrected; no link repair was necessary.
Tests/build/live checks remain NOT RUN; reviewed proposals still require explicit user approval.

## M01 reconciliation — USERAPPROVEDremainder-v0.1

**Task:** M01 / source-backed coverage reconciliation. **Date:** 1 November 2026.
**Result:** finite lexical accounting delivered, **REVIEW; M01 scope closure remains OPEN**.
QA owns only this appended section; architect owns the preceding plan and canonical contracts;
caller serializes status/publication. No agents invoked. The user's November 1 roadmap and
future full-test-environment direction are recorded here; they do not turn unresolved source
behavior into accepted business requirements, or supply unpublished API/UI contract versions.
This section does not update the historical header, approve new endpoints, or claim release.

### Evidence envelope and counting contract

Reused [routes](reverse-engineering/routes.csv), [dispatch](reverse-engineering/dispatch-branches.csv),
[navigation](reverse-engineering/navigation.csv), [controls](reverse-engineering/screen-controls.csv),
and baseline [menu §4.3](SHF_REVERSE_ENGINEERING_DESIGN.md#43-shell-and-menu),
[screens §5](SHF_REVERSE_ENGINEERING_DESIGN.md#5-screen-and-interaction-catalog) and
[WF-01–23 §6](SHF_REVERSE_ENGINEERING_DESIGN.md#6-end-to-end-workflow-traceability).
These are four physical CSVs across **three logical surfaces**: configured routes, Java dispatch,
and UI navigation/controls. Navigation and control figures remain separate even within UI.
The existing 31-CSV/10,000-reference publisher envelope above is historical evidence, **not**
a new denominator or a verifier rerun. No Oracle snapshots, original dirty-file hashes,
status file, operator material, legacy execution or newly concurrent canonical files were used.
The contract catalog was absent from both enumerated HEAD/index docs names; no replacement created.

| Physical input | Rows classified | Unique lexical identities | Duplicate rows beyond identity | Identity definition |
|---|---:|---:|---:|---|
| Routes R | 216 | 215 | 1 | exact configured path |
| Dispatch D | 240 | 237 | 3 | file + method + literal branch |
| Navigation N | 397 | 255 | 142 | exact target, including query suffix |
| Controls C | 1,705 | 1,268 | 437 | file + tag/name/property/type/action/activity, excluding line |

Each physical row receives exactly one bucket below. Duplicate rows are retained in row totals,
not counted as additional distinct action identities. The duplicate route is
`/shift/viewOriginalShiftDialog`; three repeated AdminAction comparisons are not three extra
business actions. **Unique lexical identities are not a count of distinct business actions**:
controls include inputs/error/security tags, several URLs reach the same command, and nested
`action`/`mode` or dynamic links may reveal subactions. No cross-surface unique-action union,
percentage, runtime reachability, full-parity or test-coverage claim is justified.
All captured rows are included, including copies/stubs/unmapped candidates; “active” means
configured route declaration only, not proven activity of every JSP/Java comparison.

Disposition keys: `B` = known bounded foundation overlap (not source parity);
`Mxx` = remaining candidate scope owned by that mission; `S19` = source-empty/stub, M19 owner;
`X22` = excluded native SoftPhone transport, abstract contract remains M22 work;
`Uxx` = unresolved candidate **M01-open**, assigned to mission xx's owner for resolution.
The parser's contextual control assignments are discovery ownership, not invented button semantics.

| Disposition | R | D | N | C |
|---|---:|---:|---:|---:|
| B | 3 | 0 | 24 | 1 |
| Remaining Mxx candidates | 208 | 235 | 344 | 1,608 |
| S19 source-empty/stub | 2 | 2 | 2 | 4 |
| X22 excluded transport | 2 | 2 | 0 | 0 |
| Uxx unresolved, owned | 1 | 1 | 27 | 92 |
| **Sum = input** | **216** | **240** | **397** | **1,705** |

No batch row appears in these four selected inventories: **0 batch rows classified** is not
proof of no batch dependencies. IWD delivery jobs and managed-break workers remain excluded
dependencies. Required pool/CTI/SAP/mail/SMS/EMS completion cannot be counted completed merely
because an abstract port or labeled double exists.

### Mission distribution and requirement traceability

Counts below include the assigned S/X/U rows; parentheses identify unresolved U subsets.
Zeros are real: infrastructure/verification missions have no independent legacy action rows.
Do not manufacture rows for them. Owners are the existing §4 mission owners; all business
missions require architect contract/acceptance resolution, then backend/UI/QA. U rows remain
on M01's closure ledger even when a future implementation mission owns their investigation.

| Mission | R | D | N | C | WF / ownership interpretation |
|---|---:|---:|---:|---:|---|
| M01 | 0 | 0 | 0 | 0 | architect+QA reconciliation gate; owns closure of all U subsets below |
| M02 | 0 | 0 | 0 | 0 | backend+UI+DevOps+QA populated synthetic demonstration, not a legacy endpoint |
| M03 | 1 | 1 | 1 | 0 | WF-03 bounded ordinary exit cancellation; no dedicated captured action-form control |
| M04 | 2 | 2 | 2 | 13 | WF-03 agent exit / early exit, event attribution and mood |
| M05 | 10 | 10 | 12 | 71 | WF-03 attendance inquiry/arrival/stage/correction remainder |
| M06 | 8 | 8 | 12 (2 U) | 43 (1 U) | WF-02/03 employee events, missing/report lifecycle |
| M07 | 3 | 3 | 3 | 0 | WF-03 flag/briefing; controls may be dynamic, zero is not missing functionality proof |
| M08 | 6 | 6 | 8 | 104 | WF-05/06/07 complex editor/addition/CSV remainder |
| M09 | 14 | 13 | 34 (1 U) | 101 | WF-04/08 shift inquiry/location/remarks/cancellation remainder |
| M10 | 7 | 7 | 9 | 50 | exceptions inquiry/remarks **and cancellation**, not only shift-items inquiry |
| M11 | 6 | 6 | 8 | 33 | WF-12 actual/planned breaks and inquiry |
| M12 | 14 | 14 | 20 | 29 | WF-09/10 marketplace, management/employee modes and potential requests |
| M13 | 15 | 15 | 21 | 25 | WF-11/12 forced swaps, break exchange and participant selection |
| M14 | 4 | 4 | 7 (1 U) | 11 | WF-09/10 inbox/delete/accept navigation; old readMessage reference unresolved |
| M15 | 9 | 11 | 36 | 247 | WF-13 staffing/potential/bulk interactive variants |
| M16 | 7 | 17 | 17 | 99 | WF-14 reductions; nested duplicate/edit/insert/delete/decline variants |
| M17 | 12 | 12 | 20 | 125 | WF-15 time-change lifecycle |
| M18 | 2 | 2 | 2 | 1 | WF-23 pool; actual partner completion blocked/deferred, not abstract success |
| M19 | 13 | 13 | 16 | 63 | WF-02 broader employee tabs/search; includes S19 = 2/2/2/4 |
| M20 | 20 (1 U) | 38 | 49 | 200 | WF-22 catalogs/jobs/buildings/cache loader; insertActualJob unresolved |
| M21 | 16 | 16 | 20 | 201 | WF-17 CTI/job-SAP and shift login-cancellation event/mail |
| M22 | 4 | 4 | 3 (1 U) | 6 | WF-18/19; includes X22 = 2/2/0/0; admin SP link unresolved |
| M23 | 16 | 16 | 23 (4 U) | 112 | WF-16 forecast/detail references, no batch generation |
| M24 | 20 | 18 (1 U) | 28 | 58 | WF-21 reports/exports/cancelled/mobile/BI; Bank build unmapped |
| M25 | 4 | 4 | 4 | 21 | WF-20 IWD scheduling/history/cancel; delivery job excluded |
| M26 | 0 | 0 | 0 | 0 | operator+DBA+QA native Oracle TEST evidence, separate environment lane |
| M27 | 0 | 0 | 18 (18 U) | 91 (91 U) | QA+UI+business; shell/shared selectors/copies/dynamic binding resolution |
| M28 | 0 | 0 | 0 | 0 | DevOps+QA+caller refreshed packages/images and populated browser evidence |
| B, outside remaining mission totals | 3 | 0 | 24 | 1 | temporary login/platform/message-bar bounded foundation |
| **Sum, including B** | **216** | **240** | **397** | **1,705** | no additive menu/control/action total |

Menu/submenu filter (`right_menu.jsp` or `/submenu/`) yields **70 N rows and 75 C rows**,
already included above, not additional scope. The literal destination determines its mission;
non-action/shared menu controls go to U27. Relative `bi_cti.jsp` at
[right_menu.jsp:164](../old/SHFWeb/WebContent/jsp/right_menu.jsp#L164) is outside the extracted
application-URL envelope: bind its BI/external-report assessment to M24 and shell traversal
to M27, do not invent a BI implementation or count it as an extra CSV row.

**Completed baseline versus remaining subtypes:** the plan's seven inquiry families, selected
stage/station first-arrival/ordinary exit, §50 bounded late-station arrival, §49 simple
future single-employee create/change/logical-cancel and pure all-or-none CSV, and §51 **empty**
Docker demo remain documented bounded achievements, not rerun here. Their legacy route families
also serve broader branches, so those rows conservatively stay assigned to M05/M08/M09/M19/M24.
No complete legacy result/export/filter/editor family is removed merely because one target
slice passed. M02 populated scenarios, M26 native TEST and M27 accepted scenario verdicts remain work.

### Source-backed gaps, scope additions and owner retest

These are coverage/prerequisite findings, not freshly demonstrated application defects.
Priorities describe closure risk, not an accepted API change.

| ID / priority / owner | Evidence and actual versus expected finite scope | Measurable resolution/retest |
|---|---|---|
| M01-G01 / high / architect+business, M10 | [ExceptionAction:131–169](../old/SHF/src/bzq/shf/actions/ExceptionAction.java#L131) has management `cancel` and employee-card `cancel_exception` with different input date handling; roadmap M10 emphasized inquiry/remarks. Cancellation cannot silently disappear. | **Append M10 scope:** characterize cancel dialog, management cancellation and card partial-exception cancellation; accepted preserve/clear fields, validation, transaction/partner dependencies and negative cases, or explicit business deferral for each. No endpoint auto-approved. |
| M01-G02 / high / architect+backend/UI, M20 | `/admin/insertActualJob` is configured, but no literal `insertActualJob` dispatch comparison is captured; [SystemAdminAction:337](../old/SHF/src/bzq/shf/actions/SystemAdminAction.java#L337) enters `showActualJob`. `/admin`'s absent `admin_main` comparison alone is not this defect: AdminAction separately reads request action. | Resolve the configured insert path against actual deciding code and nested modes; classify legacy mismatch/dead route/accepted behavior, with business owner decision. U20 R=1 stays open. |
| M01-G03 / high / architect+UI+QA, M06/M09/M14/M22/M23 | Unmatched `.do` references: `/addEvent`, `/attendance/addMissing`, `/shift/checkForCancelShift`, `/messages/readMessage`, `/admin/viewSPParameters`, forecast `callingResultDetails`, `breakResultDetails`, `exceptionResultDetails`, `exceptionAllResultDetails`. [admin_submenu:306](../old/SHFWeb/WebContent/jsp/submenu/admin_submenu.jsp#L306) confirms the SP link text; it is not a configured route. | Each of 9 N rows plus 1 C row gets source deciding-symbol trace and accepted implement/defer/exclude/stale disposition. Owner mission follows table. A lexical match in a different feature is not repair evidence. M01 remains open. |
| M01-G04 / medium / architect+UI+QA, M27 | 18 N and 91 C unresolved contextual entries: direct JSP/shared selectors, about/shell targets, copies/temp artifacts, JS-generated controls, security/error/blank fragments. Valid file existence does not bind employee/unit context or prove active actor action. | Resolve consumers/includes/handlers for the accepted UI flow, deduplicate actual capabilities against approved matrix, and explicitly exclude stale artifacts. Reconcile right/left/submenus; real keyboard/focus/RTL checks belong M27, not this source scan. |
| M01-G05 / medium / architect+business, M19 | [EmployeeDataModel:285–305](../old/SHF/src/bzq/shf/model/EmployeeDataModel.java#L285) returns an empty Vector for courses and has an empty taxi method; EmployeeDataAction calls them at185–210. Education simply forwards form state at180–184, unlike populated skills. | Preserve courses/taxi as **source-empty/stub** until explicit business decision; do not invent course/taxi CRUD. M19 must characterize education's input/forward contract separately. S19 has 10 lexical rows, not 10 completed workflows. |
| M01-G06 / medium / architect+business, M24 | [bank/BankHomeAction:27–55](../old/SHF/src/bzq/wfm/report/bank/BankHomeAction.java#L27) compares mode `build`, validates innerJob and forwards; no configured route matches this Action. This is not proof of a working report or a batch action. | U24 D=1: determine active consumer or accept excluded/incomplete report stub; do not implement an imagined bank report. |
| M01-G07 / high / architect+backend/UI, M08/M09/M15/M16/M20 | CSVs capture nested dispatch not exposed as separate routes: staffing `search_potential_inforce_add_inf`/bulk model branch, building view/add/update/delete, reduction duplicate/update/decline/insert/delete at [ReduceDataAction:168–218](../old/SHF/src/bzq/shf/actions/ReduceDataAction.java#L168). Broader inquiry families share baseline routes. | **Scope clarification:** M08 includes remaining CSV subtypes; M09 includes broader shift inquiry/filter/original-dialog variants; M15 includes extra potential branch and interactive all-selected outcome; M16 all nested modes; M20 building and inner-job nested modes/cache loading. Accepted case list and capability matrix must enumerate subtypes before Done. No new mission/API approval inferred. |
| M01-G08 / high / architect+partner+operator/DBA, M18/M21/M22/M25/M26 | WF-18 autonomous integration ledger survives outer rollback; WF-23 pool is partner-dependent; CTI/SAP/mail and IWD recorded scheduling are not delivered outcomes. | Accepted abstract DTO/error/UNKNOWN contracts and labeled doubles; separate actual-completion evidence or explicit affected-action deferral. Preview performs zero writes/ledger/sequence/transport. Approved synthetic Administrator cannot bypass rules, employee/unit context or required completion. |

The U buckets total **121 physical rows** (1 R, 1 D, 27 N, 92 C), not 121 business actions.
They are **all owned**, but not resolved or accepted. The count also does not measure dynamic
actions absent from lexical extraction, or establish the deciding handler for every context-only
control candidate assigned Mxx. U is the detectable unmatched/ambiguous structural subset,
**not a complete count of unresolved business actions**. No business scope sign-off or full parity acceptance.
Caller routes the findings; no silent application fix or automatic agent/fix loop.

### Exact reproducible document check

Dependency-free Node CLI; reuse the existing CSV parser **in memory**, no new source/CSV/report.
This block is executable from the repository root by the PowerShell command immediately below it.
Route/dispatch classification is by deciding action and literal subtype; UI explicit targets take
precedence over contextual filename groups. Unknown defaults are deliberately owned, not success.

```javascript
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {readCsv} from './docs/reverse-engineering/csv.mjs';
const root='docs/reverse-engineering/';
const R=readCsv(root+'routes.csv'),D=readCsv(root+'dispatch-branches.csv');
const N=readCsv(root+'navigation.csv'),C=readCsv(root+'screen-controls.csv');
const base=p=>p.split('/').pop().replace(/\.java$/,'');
function branch(a,b){
 if(['LoginAction','MobileLoginAction'].includes(a))return 'B';
 if(a==='LoadTablesAction')return 'M20';
 if(a==='MessagesAction')return 'M14';
 if(a==='EmployeeDataAction'){
  if(['courses','taxi'].includes(b))return 'S19';
  if(['events','add_event','event_cancel'].includes(b))return 'M06';
  if(b==='inforce_result')return 'M15';if(b==='shifts_switch')return 'M13';
  if(b==='export')return 'M24';return 'M19';
 }
 if(a==='AttendanceDataAction'){
  if(b==='cancel_exit')return 'M03';if(['agent_exit','EarlyExit'].includes(b))return 'M04';
  if(['add_event','removeMissing','approve_report','cancel_report','viewMissing'].includes(b))return 'M06';
  if(['flag','cancel_flag','setTadreech'].includes(b))return 'M07';
  if(b==='export')return 'M24';return 'M05';
 }
 if(a==='ShiftDataAction'||a==='ShiftDataModel'){
  if(/export/i.test(b))return 'M24';
  if(/pool|Pool/.test(b))return 'M18';if(/shift_cancel_login/.test(b))return 'M21';
  if(/Change|change|requestApplications|requestOptions|agentRequests|deleteFromRepositories/.test(b))return 'M17';
  if(/inforce|potential|add_shift_request|add_extra_shift_all|search_add_options/.test(b))return 'M15';
  if(['upsert_shift_check_exceptions','upsert_shift','addFromFile','add_extra_shift','view_add_shift','update_param'].includes(b))return 'M08';
  return 'M09';
 }
 if(a==='BreakDataAction'){
  if(b==='export')return 'M24';
  if(['check_break','change_break','select_offer','insert_break','ask_replace_break','manage_break','cancel_break_offer','reject_break_offer','accept_break_offer','cancel_break_cand'].includes(b))return 'M13';
  return 'M11';
 }
 if(['AdminAction','SystemAdminAction','ManageBuildingsAction'].includes(a))return 'M20';
 if(a==='CTIAction')return b==='export'?'M24':'M21';
 if(a==='ExceptionAction')return b==='export'?'M24':'M10';
 if(a==='ForecastAction')return 'M23';if(a==='IWDAction')return 'M25';
 if(a==='OptShfSpAction')return 'M22';if(a==='SoftPhoneAction')return 'X22';
 if(a==='ReduceDataAction')return 'M16';if(a==='ReplaceAction')return 'M12';
 if(a==='SwitchAction')return 'M13';
 if(['ShiftCancelledAction','PlatformAction','ScheduleHomeAction','ScheduleForecastAction','ScheduleSitesAction'].includes(a))return 'M24';
 if(a==='BankHomeAction')return 'U24';return 'U01';
}
function route(r){
 if(r.path==='/msgBar')return 'B';
 if(r.path==='/admin/insertActualJob')return 'U20';
 return branch(base(r.action_source),r.param);
}
const paths=new Map(R.map(r=>[r.path,r]));
const normalize=t=>t.replace(/^\/shf(?=\/)/,'').split('?')[0].replace(/\.do$/,'');
function target(t){
 const p=normalize(t),r=paths.get(p);
 if(r){if(p==='/reduce/reduceShiftReq'&&/[?&]mode=export(?:&|$)/.test(t))return 'M24';return route(r);}
 if(/\/attendance\/addMissing|^\/addEvent$/.test(p))return 'U06';
 if(/\/forecast\//.test(p))return 'U23';
 if(/\/messages\/readMessage/.test(p))return 'U14';
 if(/\/admin\/viewSPParameters/.test(p))return 'U22';
 if(/\/shift\/checkForCancelShift/.test(p))return 'U09';
 if(/\/jsp\/add_event/.test(p))return 'M06';
 if(/\/jsp\/replace_shift/.test(p))return 'M13';return 'U27';
}
function context(f){
 const n=f.split('/').pop();
 if(/^(emp_courses)\./.test(n))return 'S19';
 if(/^(activity_aim_test|right_menu_copy|shift_submenu_tmp|tmp)\./.test(n))return 'U27';
 if(/^(activity_aim|actual_job|admin|assign_team|manage_buildings|manage_inner_jobs|update_building|update_inner_job|view_completions_types|employee_parameters|eventReason|event_types|event_update_delete|system_parameters|update_skill|update_skills)/.test(n))return 'M20';
 if(/^opt_shf_sp/.test(n))return 'M22';if(/^poolExt/.test(n))return 'M18';
 if(/^peleIWD/.test(n))return 'M25';
 if(/^(bi_cti|shf_usage_report|shift_activity_cancelled|shift_sum|forecast_select|hr_report|schedule_report|site_select)/.test(n))return 'M24';
 if(/^forecast/.test(n))return 'M23';if(/^(cti|add_cancel_login)/.test(n))return 'M21';
 if(/^reduce/.test(n))return 'M16';
 if(/^(agent_change|change_request|shift_time_change|shift_change_request)/.test(n))return 'M17';
 if(/^(shift_add_inforce|shift_inforce)/.test(n))return 'M15';
 if(/^(showManageReplaceBreak|showReplaceBreak|breakShowCandidate|shift_my_breaks)/.test(n))return 'M13';
 if(/^(showManageReplace|showReplace|switchPotential)/.test(n))return 'M12';
 if(/^(replace_shift|shifts_for_switch)/.test(n))return 'M13';
 if(/^break/.test(n))return 'M11';
 if(/^(add_exception_remark|cancel_exception|exception_list|exceptions_table|employee_exceptions)/.test(n))return 'M10';
 if(/^(emp_events|add_event|missing_popup|report_popup)/.test(n))return 'M06';
 if(/^employee_earlyExit/.test(n))return 'M04';
 if(/^(attendance|attend_submenu|employee_arrive|late_popup)/.test(n))return 'M05';
 if(/^(emp_|employee_|employee_submenu)/.test(n))return 'M19';
 if(/^(add_shift|shift_change\.|shift_addFromFile)/.test(n))return 'M08';
 if(/^(add_remark|cancel_shift|show_original_shift|shifts_|shift_submenu)/.test(n))return 'M09';
 if(/^(showMessages|message_bar)/.test(n))return 'M14';return 'U27';
}
const tables=[
 ['R',R,route,r=>r.path],
 ['D',D,r=>branch(base(r.file),r.branch),r=>JSON.stringify([r.file,r.method,r.branch])],
 ['N',N,r=>target(r.target),r=>r.target],
 ['C',C,r=>r.action?target(r.action):context(r.file),
  r=>JSON.stringify([r.file,r.tag,r.name,r.property,r.type,r.action,r.activity])]
];
const buckets={},missions={},uniques=[];
for(const [name,rows,fn,key]of tables){
 const seen=new Map();
 for(const r of rows){
  const k=key(r),v=fn(r);assert(!seen.has(k)||seen.get(k)===v);seen.set(k,v);
  const x=buckets[v]??={};x[name]=(x[name]||0)+1;
  const m=v==='B'?'B':v.replace(/^[SUX]/,'M'),y=missions[m]??={};
  y[name]=(y[name]||0)+1;assert(v==='B'||/^(M|S|U|X)\d{2}$/.test(v));
 }
 uniques.push(seen.size);console.log(name,rows.length,seen.size,rows.length-seen.size);
 assert.equal(Object.values(buckets).reduce((s,x)=>s+(x[name]||0),0),rows.length);
}
assert.deepEqual(tables.map(x=>x[1].length),[216,240,397,1705]);
assert.deepEqual(uniques,[215,237,255,1268]);assert(!buckets.U01);
assert.deepEqual(buckets.U20,{R:1});
console.log('buckets',JSON.stringify(buckets));console.log('missions',JSON.stringify(missions));
console.log('menu subsets',N.filter(r=>/right_menu\.jsp$|\/submenu\//.test(r.file)).length,
 C.filter(r=>/right_menu\.jsp$|\/submenu\//.test(r.file)).length);
const plan=fs.readFileSync('docs/SHF_COMPLETION_PLAN.md','utf8');
const report=plan.slice(plan.indexOf('## M01 reconciliation —'));
const columns=['R','D','N','C'],reported=new Set();
for(const line of report.split('\n')){
 const m=line.match(/^\| (M\d{2}|B, outside remaining mission totals) \|/);
 if(!m)continue;const id=m[1].startsWith('B')?'B':m[1];
 assert(!reported.has(id));reported.add(id);const cells=line.split('|').slice(2,6);
 columns.forEach((c,i)=>assert.equal(parseInt(cells[i].trim(),10),missions[id]?.[c]||0,id+' '+c));
}
assert.equal(reported.size,29);
const grouped={B:{},M:{},S:{},X:{},U:{}};
for(const [key,values]of Object.entries(buckets))
 for(const c of columns)grouped[key[0]][c]=(grouped[key[0]][c]||0)+(values[c]||0);
for(const [label,key]of [['B','B'],['Remaining Mxx candidates','M'],
 ['S19 source-empty/stub','S'],['X22 excluded transport','X'],['Uxx unresolved, owned','U']]){
 const row=report.split('\n').find(l=>l.startsWith('| '+label+' |'));assert(row,label);
 const cells=row.split('|').slice(2,6);
 columns.forEach((c,i)=>assert.equal(parseInt(cells[i].trim().replaceAll(',',''),10),grouped[key][c]||0));
}
assert.equal(columns.reduce((s,c)=>s+(grouped.U[c]||0),0),121);
const before=plan.split('## M01 reconciliation —')[0];
const nodes=new Map();
for(const line of before.split('\n')){
 const match=line.match(/^\| ((?:M|R)\d{2}) \//);if(!match)continue;
 assert(!nodes.has(match[1]));const cell=line.split('|')[3],deps=new Set();
 const expanded=cell.replace(/M(\d{2})[–-]M(\d{2})/g,(_,a,b)=>
  Array.from({length:Number(b)-Number(a)+1},(_,i)=>'M'+String(Number(a)+i).padStart(2,'0')).join(','));
 for(const id of expanded.match(/(?:M|R)\d{2}/g)||[])deps.add(id);
 nodes.set(match[1],[...deps]);
}
assert.equal(nodes.size,29);
for(let i=1;i<=28;i++)assert(nodes.has('M'+String(i).padStart(2,'0')));
const done=new Set(),visiting=new Set();
function visit(id){
 assert(nodes.has(id));assert(!visiting.has(id),'dependency cycle '+id);
 if(done.has(id))return;visiting.add(id);for(const d of nodes.get(id))visit(d);
 visiting.delete(id);done.add(id);
}
for(const id of nodes.keys())visit(id);
const section=plan.slice(plan.indexOf('## M01 reconciliation —'));
const links=[...section.matchAll(/\]\(([^)\s]+)\)/g)].map(x=>x[1]);
for(const link of links)assert(fs.existsSync('docs/'+link.split('#')[0]),link);
console.log('PASS: row sums, printed mission/disposition tables, lexical identity consistency, owned buckets, 29 unique IDs, DAG,',
 links.length,'existing local link paths; source/runtime/business acceptance NOT asserted');
```

Exact PowerShell execution (no output redirection or generated evidence):

```powershell
@'
import fs from 'node:fs';
const p=fs.readFileSync('docs/SHF_COMPLETION_PLAN.md','utf8');
const s=p.slice(p.indexOf('## M01 reconciliation'));
const code=s.match(/```javascript\r?\n([\s\S]*?)```/)[1];
await import('data:text/javascript;base64,'+Buffer.from(code.replace(
 "'./docs/reverse-engineering/csv.mjs'",
 JSON.stringify(new URL('./docs/reverse-engineering/csv.mjs',new URL('file:///'+process.cwd().replaceAll('\\','/')+'/')).href)
)).toString('base64'));
'@ | node --input-type=module
```

### Verification result, risks and next action

**Static only.** CLI probes: `git --no-pager ls-tree -r --name-only HEAD docs .github`
and `git --no-pager ls-files docs .github/skills/quality-assurance-engineer` enumerated names
only (no status/diff/private-file content/hashes). `Get-ChildItem docs/reverse-engineering -File`
confirmed existing evidence names; four `readCsv` inputs were parsed, not a 10,000-row dump.
Focused `Select-String`/range reads traced the findings above. One exploratory
`Select-String` used a nonexistent `.../report/BankHomeAction.java` path and exited1;
the dispatch CSV supplied the real `.../report/bank/BankHomeAction.java`, subsequently read.
This was a discovery-path error, not a failing product test.

The first extraction-command attempt exited1 because the non-ASCII em-dash header marker did
not survive this PowerShell-to-Node stdin encoding; the command marker was made ASCII-safe
within this section and rerun. No application code changed.
The exact CLI check above is the document-only regression: row classifications, printed-table
agreement, duplicate identity consistency, mission IDs/prerequisite DAG and existing local source/evidence paths.
It does not revalidate historical hashes or read linked status/private reports.
**PASS / exit0:** R216/215/1, D240/237/3, N397/255/142, C1705/1268/437
(rows/unique/duplicate); all disposition/mission sums match the inputs; U121 owned physical rows;
menu subsets70 N/75 C; 29 unique roadmap IDs (M01–M28 and R01), acyclic prerequisite graph,
14 existing local link paths in this section. Semantic handlers, rendered anchors and accepted
business actions are not certified by these checks. No unresolved document-check failure remains.
**NOT RUN:** application tests/typechecks/builds, Docker, browser/keyboard/AT/WCAG measurements,
UAT, live Oracle/EMS/partner operations, batch and legacy execution.
**BLOCKED for closure:** U disposition acceptance; mission-specific approved acceptance criteria,
API/UI/capability versions and partner deferrals. Parent supplies versioned changed evidence for
any retest. Passing document checks is not release approval.

**Prioritized next missions:** (1) M01 U closure and M03's bounded contract handshake;
(2) M02 FULL populated synthetic journeys in parallel planning, because empty §51 is inadequate;
(3) M06 and M08 transaction/non-mutating-preview risks, then M04;
(4) M15 (9 routes/11 comparisons/247 controls) and M20 (20/38/200, including unresolved insert)
need nested-mode sizing, while M21 (16/16/201) needs partner-completion boundaries;
(5) M11/M12 before reuse-dependent M13/M14, then remaining families by accepted risk;
(6) M27 actual cross-family/manual/UAT evidence and M28 same-source delivery.
Counts size lexical discovery, not effort or calendar commitments.

**M02 FULL remains explicit work:** approved populated synthetic manifest/clock and safe employee/
unit contexts for all seven inquiries, §49 create/change/cancel/CSV and §50 late-arrival variants;
real Docker list→detail→action→readback/UNKNOWN and empty/loading/error/identity-failure states,
synthetic Administrator indication and approved capability coverage, Hebrew/RTL/mixed direction,
responsive and keyboard/focus journeys, with labeled EMS/partner doubles and native-only disablement.
Fixture/packaging approval is not an invented new API. **Oracle TEST FULL is M26**, not M02:
the future full-environment direction still requires a concrete target/operation/data/permissions,
driver-client/charset compatibility, excluded-writer and cleanup/preservation packet before execution.
Measure actual named reads/writes/rollback/readback only there; no supposedly read-only autonomous
function, production mutation or broker transport. Simulated completion cannot satisfy native work.

**Next handoff:** caller presents this reconciliation and M01-G01–G08 to architect/business owners,
accepts or amends the finite scope/defer list, records approved mission contract versions, and
serializes status. **Ready for owner review, not M01 Done, business sign-off, parity or release.**

## M01 finite follow-up — USERAPPROVEDM01-G01-G08 / 2026-11-01

**Task ID:** M01-FINITE-8. **Status:** DISCOVERY disposition ready for review, with explicit
UNKNOWN; not implementation completion, UAT acceptance, M28 Done or release approval.
This append supersedes only the earlier *discovery disposition* of the 121 unmatched rows.
It preserves the architect header, historical records, original inventories and original
classification algorithm. The caller reports full TEST52 and M02 deployed; neither was rerun
here. Those bounded seven-read/fixture CRUD/CSV/§52 programs do not establish all-mission parity.
User approval supplies finite mission boundaries and auto-next direction, not missing
mission-specific business-critical acceptance, capability/API/UI versions or partner receipts.
No public API, schema, application code, fixture or packaging change is authorized by this append.

### Accounting and evidence interpretation

The original algorithm is reproduced unchanged in memory, then each original U row is joined
by **family + physical CSV record number (header=1)** to the disposition matrix below. Each
join prints the original file/line and lexical identity; repeated targets/tags are retained.
CSV record numbers are not source line numbers or business-action IDs.

| Family | Original captured rows / lexical unique / duplicates | Original U | Source-disposition resolved | Remaining UNCERTAIN | Unclassified / ownerless |
|---|---|---:|---:|---:|---:|
| R | 216 / 215 / 1 | 1 | 1 | 0 | 0 / 0 |
| D | 240 / 237 / 3 | 1 | 1 | 0 | 0 / 0 |
| N | 397 / 255 / 142 | 27 | 26 | 1 | 0 / 0 |
| C | 1,705 / 1,268 / 437 | 92 | 91 | 1 | 0 / 0 |

The per-family values are checked by the CLI below; the overall equation is
**121 =119 source-disposition resolved +2 UNCERTAIN**, with **0 unclassified, 0 ownerless**.
“Resolved” means its source role/mismatch is identified, not that its business disposition
is accepted, the deployed route works, or runtime reachability has been proved. In particular,
an active-source URL with no configured route is a known gap, not an implemented action.
The two UNCERTAIN records describe the **same** form-default hazard on different surfaces;
they are not two distinct business actions. Dynamic actions outside the capture are not counted.

The prior distribution retains M03–M25 plus M27 as **24 mission buckets with captured legacy
rows**, with B separately (25 nonempty buckets including foundation). The finite M03–M27
backlog has **25 mission IDs**; M26 has0 action rows because native verification is an
environment/evidence lane. Do not invent an active branch for it or call all25 implemented.
All active remaining mission branches stay **NOT IMPLEMENTED by this classification**;
bounded TEST52/M02 achievements are separate. M28 delivery/acceptance remains OPEN.

The same31 existing CSV families were parsed for structural shape only (no extraction,
publisher/verifier execution, hash verification, Oracle operation or value disclosure).
Rows remain separate by family; these heterogeneous kinds are not a unique-action union:

| Existing CSV family | Rows | Existing CSV family | Rows |
|---|---:|---|---:|
| classes | 239 | database-usage | 736 |
| dispatch-branches | 240 | fields | 1,633 |
| forms | 50 | forwards | 309 |
| methods | 3,553 | navigation | 397 |
| oracle-arguments | 15 | oracle-columns | 722 |
| oracle-constraints | 371 | oracle-context | 1 |
| oracle-dependencies | 26 | oracle-indexes | 178 |
| oracle-nls | 4 | oracle-objects | 242 |
| oracle-procedures | 9 | oracle-sequences | 17 |
| oracle-server-version | 4 | oracle-source-summary | 9 |
| oracle-synonyms | 0 | oracle-timezones | 1 |
| oracle-transaction-function | 12 | oracle-triggers | 0 |
| parameter-keys | 38 | routes | 216 |
| schema-usage-map | 80 | screen-controls | 1,705 |
| screens | 185 | source-manifest | 454 |
| validation-errors | 699 | — | — |

### Eight group dispositions and controlling source

**M01-G01 — M10, architect+business → backend/UI+QA; discovery DONE, acceptance OPEN.**
[ExceptionAction:131–178](../old/SHF/src/bzq/shf/actions/ExceptionAction.java#L131)
separates `cancel_param`, management `cancel` (form `from`, `ddMMyyyyHHmm`) and card
`cancel_exception` (request `from`, `dd/MM/yyyy-HH:mm`), with distinct forwards/context.
[ExceptionDataModel:54–145](../old/SHF/src/bzq/shf/model/ExceptionDataModel.java#L54)
decides full-day delegation to `ShiftDataModel.cancelShift` versus partial cancellation.
Partial validation requires day ID, start, state type and cancel reason; the update marks
SOURCE=DEL and attribution/reason fields for day+start+state, after shift-source change.
This is not blanket physical deletion. Preserve M10 cancellation variants explicitly;
transaction/error preservation and full-day shift dependencies remain required contract cases.
No new API. No original U rows were assigned G01; source coverage does not close business UAT.

**M01-G02 — M20, architect+backend/UI+business; configured mismatch identified, acceptance OPEN.**
R181 at config:1013 declares `param=insertActualJob`.
[SystemAdminAction:337–376](../old/SHF/src/bzq/shf/actions/SystemAdminAction.java#L337)
handles show/update only and otherwise returns its initially null result; it does **not**
dispatch that configured insert literal. [BaseAction:45–145](../old/SHF/src/bzq/shf/actions/BaseAction.java#L45)
reads configured parameters, not an invented alias/fallback. Actual insertion is reached by
[actual_job.jsp:46–52](../old/SHFWeb/WebContent/jsp/actual_job.jsp#L46)'s dynamic app-name
URL to `updateActualJob`, then
[SystemAdminModel:812–910](../old/SHF/src/bzq/shf/model/SystemAdminModel.java#L812):
category0 deletes; nonzero inserts with update fallbacks on selected insert exceptions.
Thus “missing captured insert comparison” does not mean missing insertion capability.
R181 is resolved as **configured-unhandled**, not active-success or independent API scope.
Owner must accept stale-route disposition and preserve/characterize actual category update,
delete and fallback behavior; the Action's success/error text is not a verified native outcome.

**M01-G03 — M06/M09/M14/M22/M23, architect+UI+QA+business; eight resolved, two UNCERTAIN.**

| Original records | Source status / deciding trace | Owner disposition, not implementation |
|---|---|---|
| N112, C757 | `late_popup.jsp:52` literal `/addEvent.do`; buttons:131/133 lack explicit type. `attendance.jsp:74–83` validates then `attendance.js:195–229` uses configured `/attendance/addEvent.do` AJAX. | M06 **UNCERTAIN form-default submission**: AJAX path is explicit, but default button/native submit interaction is not safely declared inactive. |
| N344 | `attendance.js:408–411` `addMissing()` assigns an unconfigured form URL. Scoped manifest search finds its declaration, no literal call. Actual `saveMissing`:364–398 calls configured attendance/addEvent, not this URL. | M06 inactive-call **candidate**, no static caller; dynamic invocation remains runtime UNKNOWN. Not a second missing-write API. |
| N396 | `shiftjs.js:119–155` `checkShiftForCancelForReduce` requests unconfigured checkForCancelShift; no literal caller found in scoped manifest. Neighbor `checkShiftForCancel`:92–116 uses configured cancel-remark dialog. | M09 inactive-call candidate; reduction-specific intended behavior remains owner review, not an alias invention. |
| N249 | `showMessages.jsp:123` rendered anchor uses readMessage, not HTML/JSP-commented; no corresponding configured route. Dialog display in the same row is separate. | M14 active-source/unmapped link gap. Accept stale/delete-marker disposition or supply controlling changed contract; do not silently implement “read”. |
| N279 | `admin_submenu.jsp:306` live-source onclick navigate(viewSPParameters); no corresponding configured route. | M22 active-source/unmapped menu gap. Abstract managed-break scope only; native SoftPhone transport remains excluded. |
| N363–366 | `forecast.js:99–237` four named AJAX detail functions use missing calling/break/exception/all-exception URLs. Scoped search finds declarations, no literal calls; configured detail families are not these literals. | M23 source handler/unmapped candidates. Do not assert dead deployment, working details or infer batch generation; require accepted interactive subtype decision. |

No unmatched `.do` row inspected here was proved commented-out. “No literal caller” is a bounded
source finding, not exhaustive dynamic reachability. Owner review covers missing outcomes even
when their structural classification is resolved.

**M01-G04 — M27, architect+UI+QA+business; 109 source roles classified, runtime acceptance OPEN.**
The following is the lossless membership matrix for all18 N /91 C original U27 rows.
Ranges are inclusive CSV record numbers, expanded and checked by the executable matrix.

| Records | Classification / controlling evidence | Mission owner disposition |
|---|---|---|
| N68,96 | `employee_card.jsp:468`, `forecast.jsp:64` frame starts at `chooseOption.jsp` placeholder. | M27 shell/display, not an API action. |
| N161,163 | `shf_index.jsp:30,33` top-logo/right-menu frame sources. | M27 shell includes; no independent command. |
| N282,298 | left-side/shift-change submenu about.jsp navigation at65/658. | M27 informational navigation, not business persistence. |
| N135,368–378 | `replace_shift.jsp:54` team selector; `shfutils.js:32,100,128,156,184,214,242,270,301,329,387` AJAX selector destinations. | M27 shared selectors; consumer mission/context retained, no separate mutation API. |
| C929,943–946,949–969 | reset/unit/team/activity/exception/inner-job/timeoff selector tags and hidden context. JSP parameters/disabled branches decide display; see set_multi_activity:8–34. | M27 input/form-selection; M13 switch, M15 staffing, M21 CTI, M23 forecast, M25 IWD consumers do not lose employee/unit restrictions. |
| C947–948 | `set_emps.jsp:41,47` form and onchange `viewShiftsForSwitch`; `replace_shift.jsp:87` reads selected employee; configured getTeamMembers forward reaches fragment. | M27 shared fragment with M13 consumer. Selection triggers inquiry, not separate swap write. |
| C930–936,1552–1569 | security wrapper tags in right/shift-change menus. `SecurityTag.doStartTag`:24–35 includes/skips body using allowedActivities. | M27 capability visibility, not25 independent mutations; server permission/business checks still required. |
| C790,942,970–971,974,1160 | reloadErrors in non-employee/security/blank/fail/success/empty fragments. | M27 error/status presentation, not business command. |
| C1551 | left_side_menu:54 msgIcon beside configured message/messages navigation. | M27/M14 inbox indicator reuse, not new inbox API. |
| C769–770,972–973 | legacy login input/submit and external-identity redirect form/hidden return context. | M27 identity display/navigation; external provider outcome UNKNOWN. Never a target Administrator fallback. No external endpoint invoked. |
| C28–32 | activity_aim_test:53/54 hidden mode/aim, reload error, tag embedded in JS item template:79, insertActivity button:95. | M27 copy/test candidate with M20 activity-aim consumer. No captured incoming reference found; not approved new CRUD. |
| C937–941,1591–1599 | right-menu copy / temporary shift-menu security wrappers. | M27 copy/temp source; no captured incoming consumer found. Do not claim impossible direct/dynamic access. |
| C1658–1661 | tmp.jsp remark textarea, clear/erase buttons, addShiftRemark save:20–32. | M27 temporary fragment with M09 candidate handler; no captured incoming consumer found. Save semantics need accepted consumer, not a new endpoint. |
| C1703–1704 | responsive JS:18 creates elSelect checkbox → trClick; shfgrid:141 is JS comparison `i<checkBox.length`, **not an HTML checkBox tag**. | M27 row-selection state / lexical false-control candidate. Neither is independent API action. |
| C1705–1706 | shfutils:828 readonly cancellation textarea;833 close popup button. | M27 readonly display/dismissal, no cancel command. |

[CheckListTag:64–143](../old/SHF/src/bzq/shf/taglib/CheckListTag.java#L64)
generates checkboxes from request form/property and list values; selection changes UI state.
[set_multi_activity.jsp:8–34](../old/SHFWeb/WebContent/jsp/set_multi_activity.jsp#L8)
binds formName/property/moked/from; this is dynamic **input binding**, not an independent
activity command. [SecurityTag:24–35](../old/SHF/src/bzq/shf/taglib/SecurityTag.java#L24)
controls rendering only. Source-role classification does not verify rendered option scope,
custom-tag runtime values, disabled branch selection, mobile focus, or all actor capabilities.
Copy/temp absence is bounded to inventoried consumers, not a global “dead code” assertion.

**M01-G05 — M19, architect+business; source-empty discovery DONE, feature decision OPEN.**
[EmployeeDataAction:180–210](../old/SHF/src/bzq/shf/actions/EmployeeDataAction.java#L180)
forwards education form state, invokes courses without attaching its return, and invokes taxi.
[EmployeeDataModel:285–305](../old/SHF/src/bzq/shf/model/EmployeeDataModel.java#L285)
returns empty Vector for courses and has empty taxi method; skills is a different populated path.
Existing S19 remains R2/D2/N2/C4, separate from the original121. Do not add imagined courses/taxi
CRUD or business data. Education forward/input acceptance and explicit empty/defer decision stay OPEN.

**M01-G06 — M24, architect+business; unmapped stub discovery DONE, acceptance OPEN.**
D241 uses the actual [bank/BankHomeAction:27–56](../old/SHF/src/bzq/wfm/report/bank/BankHomeAction.java#L27).
Build validates chosen innerJob, sets request form and forwards; non-build sets date defaults.
There is no report construction call in that method and no configured Action route or captured
bank consumer. Classification is **unmapped report stub**, not implemented export or batch.
Owner accepts incomplete/stale disposition or supplies separately approved interactive contract;
do not invent a bank report/path. No blind-path probe in this follow-up.

**M01-G07 — M08/M09/M15/M16/M20, architect+backend/UI+business+QA; sizing DONE, cases OPEN.**
[ShiftDataAction:190–299](../old/SHF/src/bzq/shf/actions/ShiftDataAction.java#L190)
delegates inforce_request to [ShiftDataModel.doAction:1393–1465](../old/SHF/src/bzq/shf/model/ShiftDataModel.java#L1393):
populate/add/update/delete/update_view; null mode defaults update. Add validates;
the update validation call is **commented**, not evidence that validation is enforced.
Update chooses number-only versus broader request by shiftStart; delete touches request/team/
inner-job dependencies. Preserve these branch distinctions; privilege must not preserve a
known validation bypass by default. `search_potential_inforce_add_inf` remains M15's additional
source candidate even where configured linkage is absent; lexical ownership is not activation.
[ShiftDataAction:962–993](../old/SHF/src/bzq/shf/actions/ShiftDataAction.java#L962)
loops all selected potential IDs, skips certain zero-time breaks and catches per-item errors;
it does **not** prove one all-selected transaction. M15 needs accepted partial/all-or-none
semantics rather than silently borrowing pure CSV's bounded all-or-none guarantee.
[ManageBuildingsAction:34–70](../old/SHF/src/bzq/shf/actions/ManageBuildingsAction.java#L34)
has view/add/update/delete/view_update; [BuildingModel:116–200](../old/SHF/src/bzq/shf/model/BuildingModel.java#L116)
writes existing building/team objects, deleting child/parent through separate DBAccess scopes.
[SystemAdminAction:264–335](../old/SHF/src/bzq/shf/actions/SystemAdminAction.java#L264)
inner-job view/add/viewUpdate/update/delete/groups uses allowed-unit filtering and reloadTables;
swallowed exceptions are not acceptance of successful completion. M20 includes these cache/
group/scope cases and G02 category modes. M08 CSV/complex editor, M09 broader inquiry/filter/
original dialog and M16 nested reductions retain the prior G07 scope; no new source parity claim.
Sizing remains M15 R9/D11/N36/C247 and M20 R20/D38/N49/C200, not estimated effort.

**M01-G08 — M21 lead, architect+partner/business → backend+QA; native outcomes DEFERRED/UNKNOWN.**
[CTIAction:81–155](../old/SHF/src/bzq/shf/actions/CTIAction.java#L81)
retains allowed-moked and prior session team in completion selection; the TODO on setCompletion
is not proof of full context enforcement.
[CTICompletion:959–1050](../old/SHF/src/bzq/shf/model/CTICompletion.java#L959)
saves selected employees through DBAccess(false), accumulates failures, rolls back on errors
and commits otherwise; duration and overlap checks precede sequence-backed completion insertion
with SAP_STATUS=0. Local record/status is not SAP delivery or partner acknowledgement.
[ShiftDataAction:1063–1144](../old/SHF/src/bzq/shf/actions/ShiftDataAction.java#L1063)
records login-cancellation event then conditionally calls mail helper; that sequence does not prove
atomic event/mail delivery. Full-day exceptions delegate to broader shift dependencies.
Baseline [WF-17/18 §6](SHF_REVERSE_ENGINEERING_DESIGN.md#6-end-to-end-workflow-traceability)
and [integration §9](SHF_REVERSE_ENGINEERING_DESIGN.md#9-interfaces-messaging-and-transaction-boundaries)
retain autonomous ledger/rollback hazards and abstract EMS outcomes. No ledger/function invoked.
M18 pool, M22 abstract managed-break and M25 IWD scheduling retain deferred partner completion;
batch workers/delivery and broker transport remain excluded. M26 native permissions are not
implied by Docker. Synthetic Administrator never bypasses validation, employee/unit context
or required completion; simulated success must remain labeled. No new DTO/API design here.

### Explicit open evidence / owner retest

| Finding / severity / owner | Expected versus actual / reproduction | Measurable next evidence |
|---|---|---|
| M01-G02 / high scope risk / architect+M20 business/backend | Configured insert must have accepted disposition; R181 → Action337–376 has no insert dispatch while update reaches insertion. Static mismatch, not reproduced application failure. | Accept stale-route disposition; versioned category update/delete/fallback cases and focused isolated retest from changed evidence. |
| M01-G03-FORM / high flow risk / UI+QA+M06 business | Late save should have one approved outcome; N112/C757 expose stale form action plus AJAX and implicit-submit buttons. Browser submission/cancellation behavior UNKNOWN. | Caller-approved existing local/test Chrome instrumentation using synthetic context: capture submit/defaultPrevented, event order and requested URLs without legacy execution; show no duplicate/default stale request. If target cannot reproduce that source behavior, provide approved intended behavior instead. |
| M01-G03-LINKS / high scope risk / architect+M14/M22/M23 business/UI | Accepted links/detail actions cannot silently disappear; matrix shows unmatched active-source/candidate URLs. No runtime failure claimed. | Accept per-subtype stale/defer/interactive disposition or provide changed controlling consumer+versioned contract; synthetic browser route/outcome evidence only after permission. |
| M01-G04-BIND / medium / UI+QA+business | Source roles are known, actual dynamic selector context/reachability is not. | Approved capability matrix version; local/test instrumentation of form/property/moked, selected-row IDs, conditional branches and focus; no actual employee data, external identity call or legacy execution. |
| M01-G07-TX / high / architect+M15/M20 business/backend | Accepted bulk and child/parent/cache failures need truthful outcome; loops/scopes/swallowed errors do not prove atomic success. | Versioned failure/rollback/preservation/capacity cases and isolated doubles from specific changed implementation evidence; no assumed legacy all-or-none. |
| M01-G08-COMP / high / architect+partner+business, operator/DBA for M26 | Required native completion cannot be replaced by a local status or fixture receipt. | Accepted deferred/UNKNOWN outcomes and labeled doubles; separate environment/operation/data/permissions packet for any native retest. |

These are discovery/prerequisite findings, not new executed product-test defects. Caller routes
fixes and decisions; no automatic agent loop. Business-critical unknowns remain review gaps even
when structurally classified. No estimates/deadlines. M27 UAT/WCAG measurements and M28 release/
delivery acceptance cannot be marked Done on this evidence.

### Exact in-memory follow-up regression

Run from `D:\AIProjects\SHFAI`. This block is concatenated after the existing M01 JavaScript
block, reusing its readCsv, tables, ownership and DAG checks. It writes nothing and emits the
exact121-row evidence matrix without code snippets, credentials or personal data.

```javascript
const ledger=[];
function capture(family,spec,group,mission,category,state,trace){
 for(const term of spec.split(',')){
  const [lo,hi=lo]=term.split('-').map(Number);
  for(let record=lo;record<=hi;record++)
   ledger.push({family,record,group,mission,category,state,trace});
 }
}
capture('R','181','M01-G02','M20','configured-unhandled','resolved','SystemAdminAction:337-376 -> SystemAdminModel:812-910');
capture('D','241','M01-G06','M24','unmapped-stub','resolved','bzq/wfm/report/bank/BankHomeAction:27-56');
capture('N','112','M01-G03','M06','form-literal/default-submit','UNCERTAIN','late_popup:52,131 -> attendance:74 -> attendance.js:195-229');
capture('C','757','M01-G03','M06','form-literal/default-submit','UNCERTAIN','late_popup:52,131 -> attendance:74 -> attendance.js:195-229');
capture('N','344','M01-G03','M06','inactive-call-candidate','resolved','attendance.js:408-411; saveMissing:364-398');
capture('N','396','M01-G03','M09','inactive-call-candidate','resolved','shiftjs.js:119-155; neighboring dialog:92-116');
capture('N','249','M01-G03','M14','active-source/unmapped','resolved','showMessages:123');
capture('N','279','M01-G03','M22','active-source/unmapped','resolved','admin_submenu:306');
capture('N','363-366','M01-G03','M23','handler-candidate/unmapped','resolved','forecast.js:99-237');
capture('N','68,96','M01-G04','M27','placeholder-frame','resolved','employee_card:468; forecast:64');
capture('N','161,163','M01-G04','M27','shell-frame','resolved','shf_index:30,33');
capture('N','282,298','M01-G04','M27','informational-navigation','resolved','left_side_menu:65; shift_change_submenu:658');
capture('N','135,368-378','M01-G04','M27','dynamic-selector-link','resolved','replace_shift:54; shfutils.js:32-387');
capture('C','929,943-946,949-969','M01-G04','M27','input/form-selection','resolved','selector JSP parameters/tags; CheckListTag:64-143');
capture('C','947-948','M01-G04','M27','selection/inquiry-M13','resolved','set_emps:41,47 -> replace_shift:87');
capture('C','930-936,1552-1569','M01-G04','M27','capability-wrapper','resolved','right_menu/shift_change_submenu -> SecurityTag:24-35');
capture('C','790,942,970-971,974,1160','M01-G04','M27','error/status-display','resolved','reloadErrors fragments');
capture('C','1551','M01-G04','M27','message-indicator-M14','resolved','left_side_menu:50-54');
capture('C','769-770,972-973','M01-G04','M27','identity-navigation','resolved','login:25,28; shf_obtainUserId:34,46; external outcome UNKNOWN');
capture('C','28-32','M01-G04','M27','test-copy-candidate-M20','resolved','activity_aim_test:53-95; no captured incoming reference');
capture('C','937-941,1591-1599','M01-G04','M27','copy/temp-wrapper','resolved','right_menu_copy/shift_submenu_tmp; no captured incoming reference');
capture('C','1658-1661','M01-G04','M27','temp-remark-candidate-M09','resolved','tmp:20-32; no captured incoming reference');
capture('C','1703-1704','M01-G04','M27','row-selection/lexical-false-control','resolved','shf_responsive:18 -> trClick; shfgrid:141 comparison');
capture('C','1705-1706','M01-G04','M27','readonly-display/dismissal','resolved','shfutils:828,833');
const originalU=new Map();
for(const [family,rows,fn] of tables)rows.forEach((r,i)=>{
 if(fn(r).startsWith('U'))originalU.set(family+':'+(i+2),{r,bucket:fn(r)});
});
const used=new Set(),balance={};
for(const item of ledger){
 const id=item.family+':'+item.record,orig=originalU.get(id);
 assert(orig,'not original U '+id);assert(!used.has(id),'duplicate '+id);used.add(id);
 assert.equal(item.mission,orig.bucket.replace('U','M'));
 assert(/^M01-G0[1-8]$/.test(item.group));assert(nodes.has(item.mission));
 const source=fs.readFileSync(orig.r.file,'latin1').split('\n');
 assert(Number(orig.r.line)>0&&Number(orig.r.line)<=source.length);
 const cell=balance[item.family]??={resolved:0,UNCERTAIN:0};
 cell[item.state]++;
 console.log(JSON.stringify({...item,file:orig.r.file,line:Number(orig.r.line),
  identity:orig.r.path||orig.r.branch||orig.r.target||
   [orig.r.tag,orig.r.name,orig.r.property,orig.r.type,orig.r.action,orig.r.activity]}));
}
assert.equal(originalU.size,121);assert.equal(used.size,121);assert.equal(ledger.length,121);
assert.deepEqual(balance,{R:{resolved:1,UNCERTAIN:0},D:{resolved:1,UNCERTAIN:0},
 N:{resolved:26,UNCERTAIN:1},C:{resolved:91,UNCERTAIN:1}});
assert.equal(ledger.filter(x=>x.state==='resolved').length,119);
assert.equal(ledger.filter(x=>x.state==='UNCERTAIN').length,2);
const gapIds=new Set([...plan.slice(plan.indexOf('## M01 finite follow-up')).matchAll(/M01-G0[1-8]/g)].map(x=>x[0]));
assert.equal(gapIds.size,8);
const remainingIds=Array.from({length:25},(_,i)=>'M'+String(i+3).padStart(2,'0'));
remainingIds.forEach(id=>assert(nodes.has(id)));assert(!missions.M26);
assert.equal(Object.keys(missions).filter(x=>/^M/.test(x)).length,24);
const csvShape={};
for(const name of fs.readdirSync(root).filter(x=>x.endsWith('.csv')).sort()){
 const rows=readCsv(root+name);csvShape[name]=[rows.length,rows.filter(x=>x.file&&x.line).length];
}
assert.equal(Object.keys(csvShape).length,31);
assert.equal(Object.values(csvShape).reduce((sum,x)=>sum+x[1],0),10000);
const sourceProofs=[
 ['old/SHF/src/bzq/shf/actions/SystemAdminAction.java','param.equals("updateActualJob")'],
 ['old/SHF/src/bzq/shf/model/SystemAdminModel.java','insertActualJob();'],
 ['old/SHFWeb/WebContent/js/attendance.js','/shf/attendance/addEvent.do?'],
 ['old/SHFWeb/WebContent/js/shfgrid.js','i<checkBox.length'],
 ['old/SHF/src/bzq/shf/model/EmployeeDataModel.java','public void populateTaxiOrders()'],
 ['old/SHF/src/bzq/shf/model/CTICompletion.java','db.rollback();']
];
sourceProofs.forEach(([file,text])=>assert(fs.readFileSync(file,'latin1').includes(text),file));
assert(!D.some(r=>r.file.endsWith('/SystemAdminAction.java')&&r.branch==='insertActualJob'));
assert(!R.some(r=>r.action_source.endsWith('/bank/BankHomeAction.java')));
for(const p of ['/addEvent','/attendance/addMissing','/shift/checkForCancelShift',
 '/messages/readMessage','/admin/viewSPParameters','/forecast/callingResultDetails',
 '/forecast/breakResultDetails','/forecast/exceptionResultDetails','/forecast/exceptionAllResultDetails'])
 assert(!paths.has(p),p);
const appendix=plan.slice(plan.indexOf('## M01 finite follow-up'));
const appendixLinks=[...appendix.matchAll(/\]\(([^)\s]+)\)/g)].map(x=>x[1]);
let lineAnchors=0;
for(const link of appendixLinks){
 const [file,anchor]=link.split('#'),resolved='docs/'+file;
 assert(fs.existsSync(resolved),link);
 if(anchor?.startsWith('L')){
  assert(Number(anchor.slice(1))>0&&Number(anchor.slice(1))<=fs.readFileSync(resolved,'latin1').split('\n').length,link);
  lineAnchors++;
 }else if(anchor){
  const headings=fs.readFileSync(resolved,'utf8').split('\n').filter(x=>/^#{1,6} /.test(x));
  const slugs=headings.map(x=>x.replace(/^#{1,6} /,'').trim().toLowerCase()
   .replace(/[^\p{L}\p{N}_\s-]/gu,'').replace(/\s/g,'-'));
  assert(slugs.includes(anchor),'missing heading anchor '+link);
 }
}
for(const family of ['R','D','N','C']){
 const row=appendix.split('\n').find(x=>x.startsWith('| '+family+' |'));
 assert(row,'missing printed balance '+family);
 const cells=row.split('|').map(x=>x.trim());
 assert.equal(Number(cells[3]),balance[family].resolved+balance[family].UNCERTAIN);
 assert.equal(Number(cells[4]),balance[family].resolved);
 assert.equal(Number(cells[5]),balance[family].UNCERTAIN);
 assert.equal(cells[6],'0 / 0');
}
console.log('PASS M01-FINITE-8',JSON.stringify({originalU:121,resolved:119,UNCERTAIN:2,
 unclassified:0,ownerless:0,balance,gapIDs:gapIds.size,roadmapIDs:nodes.size,
 remainingMissionIDs:remainingIds.length,legacyMissionBuckets:24,acyclic:true,
 csvFamilies:31,fileLineReferences:10000,appendixLinks:appendixLinks.length,lineAnchors,csvShape}));
```

Exact command (no files generated, no output redirection):

```powershell
@'
import fs from 'node:fs';
const p=fs.readFileSync('docs/SHF_COMPLETION_PLAN.md','utf8');
const prior=p.slice(p.indexOf('## M01 reconciliation')).match(/```javascript\r?\n([\s\S]*?)```/)[1];
const next=p.slice(p.indexOf('## M01 finite follow-up')).match(/```javascript\r?\n([\s\S]*?)```/)[1];
const code=(prior+'\n'+next).replace("'./docs/reverse-engineering/csv.mjs'",
 JSON.stringify(new URL('./docs/reverse-engineering/csv.mjs',
 new URL('file:///'+process.cwd().replaceAll('\\','/')+'/')).href));
await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
'@ | node --input-type=module
```

**Execution:** pending immediate document-only regression below; this placeholder records no
passing runtime test. No legacy/app/fulltest/build/Docker/browser/live/batch command was run.
Static inspection used existing readCsv CLI and scoped file/range/symbol reads only; the
existing writing/hash-based publisher verifier was inspected, **not executed**.
Only this plan append is owned/changed. Parent separately publishes M02/code/progress.

### Recorded static check result and handoff

The exact in-memory command above **PASS / exit0**: original four-family rows/unique/duplicate
figures unchanged; 121 losslessly joined original U records,119 resolved source roles and2
UNCERTAIN (N112/C757),0 unclassified/ownerless;8 gap IDs;29 unique roadmap IDs with acyclic
prerequisites;25 M03–M27 mission IDs,24 nonempty legacy mission buckets (M26 has0);31 CSV
families and10,000 existing file/line references, with heterogeneous row totals kept separate.
Appendix links: **23 existing local paths,21 valid source-line anchors,2 baseline heading
anchors**. Checks establish source classification and document consistency only.
The first follow-up regression exited0. A subsequent inspection found the new §9 heading link
used the wrong slug; corrected within this owned append, added heading-anchor and printed
balance checks, then reran. This was a document-check gap, not an application failure.

Additional exact read-only commands:
`git --no-pager diff --numstat -- docs/SHF_COMPLETION_PLAN.md`,
`git --no-pager diff --check -- docs/SHF_COMPLETION_PLAN.md`.
Whitespace check passed with no output / exit0; final append-only size and unchanged-prefix
comparison are returned to the caller after this result entry. No unrelated dirty-file hashes.
Git status was inspected read-only to preserve user changes, not used to publish/commit/index.

**Passed:** static inventory membership, duplicate retention, source-line bounds, six source
text tripwires, nine absent-route checks, missing configured bank Action, G02 absent literal
dispatch, printed per-family balances, IDs/DAG and appendix links. **Failed:** no remaining
document regression failure after the owned citation correction.
**Blocked:** business-critical subtype decisions, versioned API/UI/capability acceptance,
partner completion/deferral, runtime form-default behavior and dynamic context evidence.
**Not run:** application/unit/API/fulltest/build/typecheck/Docker/browser/mock execution,
keyboard/RTL/responsive/AT/WCAG measurements, UAT, Oracle/DNS/broker/native partner, batch,
legacy execution. No new live or mocked outcome is claimed.
**Next action:** caller reviews each G01–G08 disposition with the named mission/business owner,
publishes plan progress separately from M02 code, and supplies specific approved changed
evidence for focused retest. Discovery disposition is ready; whole-application development,
business acceptance, all mission parity and M28 completion are **not** established.

**Additional deciding-symbol confirmation, same G07/G08 scope:** ShiftDataAction:367–378
`search_potential_inforce_add_inf` constructs ShiftDataModel from ShiftInforceRequestForm,
calls setAddInforceDefaults and forwards form state; it is a default/form branch, not a
separate staffing insert or proof of configured activation. CTIAction:287–305 job-SAP
view/assign/unassign delegates to CTICompletion.getJobs/assignJob/unAssignJob:1094–1177.
Those methods partition cached jobs against assigned IDs and insert/delete existing
SHF_CTI_JOB_TO_SAP mapping rows. Mapping administration is M21 in-scope source behavior,
**not actual SAP transport or completion**; validation/context/transaction acceptance stays OPEN.
