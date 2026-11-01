# Shifter: finite remainder and development-completion plan

**Task:** SHF-REMAINDER-52. **Version:** remainder-v0.1. **Date:** 1 November 2026.
**Status:** PLANNING DELIVERED / proposed execution backlog; §52-v0.2 API,
52-config-v0.1 and reviewed 52-UI-v0.2 PENDING USER APPROVAL.
Owner: system_architect; caller owns scheduling, status and publication. No agents invoked.
This requested plan authorizes this document, not unwritten API implementation or live operations.

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
