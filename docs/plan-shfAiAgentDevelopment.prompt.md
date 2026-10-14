# Plan: SHF AI-Agent Development Directives

Task ID: SHF-DEV-PLAN-20261013
Revision: 1.1 AI execution baseline, 2026-10-13
Status: review. The earlier human-team calendar estimate is superseded. Architecture/API/UI/release approvals remain pending.
Publication target: d:/AIProjects/SHFAI/docs/SHF_PROJECT_DIRECTIVES.md, ordinary project documentation. This repository file does not exist and is not written in Plan mode. This document is session planning memory, not repository publication.

## 1. Confirmed Scope And Evidence

### Current Progress Snapshot — 2026-10-14, After R08 Staffing Preview Demo

| Round | Current status | Evidence / next gate |
| --- | --- | --- |
| R01 | Review / partial | Source-backed proposals and separately approved demo contracts; full business architecture/API/UI approval pending. |
| R02 | Local foundation working / partial | Reproducible app commands, tests, lint, strict types and builds; CI, deployment and complete contract generation pending. |
| R03 | Adapter implemented / real reads blocked | Read-only Oracle adapter tested offline; both approved hostname attempts failed NJS-530 before authentication. SEC identity and DBA metadata remain missing. |
| R04 | Synthetic demo done | Personal shifts, calendars, details, overnight/null/reassignment cases; no real Oracle parity or G3 acceptance. |
| R05 | Approved synthetic demo done | Messages, employee search/card and skills/events/education views; education explicitly invented, no writes or real employee data. |
| R06 | Approved synthetic range-read demo done | Fixed-team schedule/attendance table/detail and calendars; current-instant/live reads, real scope and parity remain pending. No arrival/departure registration or corrections. |
| R07 | Approved break and shift/split preview demos done / round partial | Pure synthetic calculations and scoped reads; full real policy, attendance/offer eligibility and zero-effect Oracle proof pending. |
| R08 | Approved replacement and staffing read/preview demos done / round partial | Synthetic outcomes and conditional one-slot counts; full real policy, freshness/precondition/atomic-capacity evidence and acceptance remain pending. |
| R09–R10 | Planned | Reports, exceptions and admin not implemented. |
| R11 | Deferred / gated | No business writes authorized or enabled. |
| R12–R13 | Pending | Full security/load/assistive-technology/UAT/recovery/release evidence and accountable sign-off pending. |

Latest completed check: 84 backend + 79 frontend tests (163 total),
lint/types/builds pass; initial UI bundle 431.23 kB. Synthetic browser checks
cover responsive RTL, focus, errors and text resizing, not full AA certification.
The 45–90 active-hour estimate remains provisional; no elapsed delivery date or
percentage-complete claim is inferred from a working demonstration.

Oracle remains paused. Required owners: DBA/network for a reachable host and
approved metadata/data scope; SEC for trusted identity/employment/scope policy;
user/ARC for real API/UI baselines; business/QA/operations for UAT and release.
This snapshot supersedes earlier no-scaffold/no-runtime wording as current status;
older sections remain historical execution evidence.

- Node.js/TypeScript backend; supported modern Angular, Material/CDK/Material 3, HTML/CSS; Hebrew/RTL and Hebrew accessibility names.
- Oracle Database 21c is user-confirmed, not live-verified; Thin mode is proposed. Existing schema remains unchanged: no DDL/migrations/new tables, columns, indexes, sequences, triggers or procedures and no field/status overloading.
- TIBCO work is abstract API ports, DTOs, documented semantics and clearly isolated doubles only. No live broker/bridge transport, publisher/consumer, Java/.NET bridge or transport worker.
- Batch CTI/SAP/BI and scheduled SMS/IWD/pool are designed but excluded from current implementation, scheduling, packaging, deployment and batch-only tests.
- old/ is read-only evidence, never a build/execution target. Protect user changes, credentials and personal data. Database reads/metadata/test mutations each need approved environment, permissions and data scope. Never mutate production business data.
- Current release prioritizes interactive reads/previews. Each local write needs its own verified existing-schema concurrency, retry/precondition, audit, recovery and writer-ownership gate. Partner-dependent commands stay unavailable with zero business/ledger/sequence/partner effects. Preview never deletes offers or allocates correlation records.
- Main evidence: technical design revision 2.0 Sections 1.3, 3, 4.6, 5.7, 7.11, 9.2, 10 and 11; agent brief and source catalog. No new application scaffold was visible at workspace root; .git exists. No app/Oracle/partner/browser check was executed to estimate this plan.

## 2. AI Execution Model

Sprints are now gated AI delivery rounds, not two-week human calendar iterations. Role names are responsibilities, not full-time humans or claims that those named agents are installed.

Default execution topology: one implementing agent performs role-specific missions sequentially, with separate review/test passes. Only Explore is currently listed as invocable; three previous exploration invocations returned no usable output, so successful parallel coding is not established. Do not assume always-on agents, unattended overnight runs, persistent waiting workers or a peer messaging bus. Human UAT, manual Hebrew screen-reader assessment and accountable sign-off are separate verification/elapsed-time gates; assigning an AI QA role does not automate or satisfy them.

If the harness later supports approved independent coding agents, backend and frontend may work concurrently on disjoint files after shared contract approval. QA can prepare cases concurrently, but verifies a particular finished artifact/version. Shared contracts, transaction helpers and shell/theme writes remain serialized. Measure real elapsed improvement; never divide total work by the number of roles.

Atomic mission size: target 5-30 active minutes for a small independently checked change; permit a 30-60 minute timebox for a bounded complex investigation or test. Split larger missions by endpoint, rule, SQL projection, UI state or recovery case. These are initial timeboxes, not measured velocity. Exhausting a timebox produces a reviewed next step or named blocker, not weakened tests or an invented done status.

Every substantive edit is followed immediately by the cheapest focused behavior/contract/type/UI check. Repair the same slice and rerun before expanding. Track reading, edits, tool/build/test durations, review/retest and interruption recovery rather than code-generation time alone.

## 3. Role Ownership

| Code | Responsibility | Exclusive ownership |
| --- | --- | --- |
| PM | project-orchestrator | Mission/dependency board, forecasts, approval log, directives publication and handoffs; cannot approve release for the user. |
| ARC | system_architect | Shared OpenAPI/API/UI/bridge contracts and architecture decisions; sole shared-contract writer. |
| UX | ui_designer | Hebrew/RTL workflow/prototype/copy and accessibility-state specification. |
| BE | server-side-developer | Node use cases/domain policies, existing Oracle repositories, abstract-port consumers and their unit tests; assign one owner per core/feature file. |
| FE | ui-developer | Angular shell/features/typed forms and component tests; one shared shell/theme owner. |
| QA | quality-assurance | Contract, API, integration, E2E/accessibility/regression evidence, defects and changed-evidence retests; no unassigned application fixes. |
| OPS | devop-manager | CI/container/configuration/observability/runbooks and approved deployment; no schema/broker provisioning. |
| DBA | Human data/platform owner | Oracle metadata/grants/support, approved access and fixtures, existing writer/transaction contracts. |
| SEC | Human identity/security owner | Trusted actor/session/service identity, security/privacy acceptance. |
| PO | Human product/business/user owner | Scope priorities, business-rule decisions, UAT and explicit architecture/API/UI/release authorization. |
| EXT | Human partner/integration owner | Future authoritative API/transport/ack/idempotency/status/reconciliation contracts. |

All roles may be performed as sequential bounded agent passes where appropriate. Human authority/access decisions do not become agent approvals. If specialized roles are unavailable, PM routes work to an available primary agent rather than inventing an invocation.

## 4. Corrected Current-Stage Timeline

The ranges below are provisional active AI execution budgets for one implementing agent with repository/tool access and approved inputs. They include local investigation, implementation and focused checking, but exclude external human/DBA/partner waiting. They are not committed completion forecasts. Rebaseline after R01 readiness and the first measured vertical slice R04.

| Round | Active budget | Increment | Entry/exit dependency |
| --- | --- | --- | --- |
| R01 | 1-2 h | Scope, supported stack, first API/UI contracts and gate requests | Explicit G1 approval; metadata/identity waits recorded separately |
| R02 | 2-4 h | Authorized Node/Angular scaffold, CI and test/error/DTO foundations | Depends G1; reproducible actual commands, G2 |
| R03 | 3-6 h | Trusted identity/scope, Oracle adapter, unavailable bridge behavior | Depends approved identity/data access and G2 |
| R04 | 3-6 h | Personal-shifts read-only vertical slice | Depends R03; golden/scope/RTL parity and zero effects, G3 |
| R05 | 2-4 h | Employee/card/detail and message reads | Depends G3 and feature contracts |
| R06 | 3-6 h | Operational schedule and attendance reads | Shared effective-shift projection and role policy first |
| R07 | 4-8 h | Break views and pure shift/break previews | Rule fixtures/contracts; zero-effect preview gate G4 |
| R08 | 4-8 h | Replacement/staffing-request read/preview workflows | Depends shared shift/break/eligibility rules |
| R09 | 3-6 h | Exceptions and bounded forecast/WFM reports | Approved read sources, interval/precision contracts |
| R10 | 2-4 h | Existing CTI/learning/admin views; deferred-stage design register | No producers/dispatchers; read/preview beta |
| R11 | 3-6 h | Narrow local-write proof/implementation or explicit deferral | Per-capability existing-storage/writer gate G5 |
| R12 | 4-8 h | Security/performance/accessibility/UIT/UAT/rollback evidence | Current-scope tests and booked human acceptance; G6 |
| R13 | 2-4 h | Approved rollout, smoke checks and handover preparation | Explicit user release and operations window; G7 |

Arithmetic: R01-R04 = 9-18 active hours; R01-R13 = 36-72 active hours. A provisional 25% debugging/integration reserve gives 45-90 active hours. This is approximately 6-12 eight-hour supervised execution-day equivalents, NOT an elapsed calendar promise or unattended-running claim. Hypercare observation continues for an operations-approved window; its passive observation interval is not counted as active development effort.

Actual calendar duration = dependency-critical active execution + approvals/access/partner waiting + operational/UAT observation windows. Overlapping waits and independent work are counted once in a measured dependency schedule; do not sum overlapping clocks or assume no waiting. No kickoff date or external turnaround commitments were supplied.

If local-write proof fails, R11 ends with a blocked/deferral decision, not a completed write feature. PO approves the read/preview release scope and PM reallocates only to already approved quality work. A successfully generated UI or passing mocks cannot clear live Oracle, identity, recovery or business acceptance gates.

## 5. Atomic Missions By Round

Mission format: ID - sole role owner - prerequisite - independently reviewable output / focused acceptance. Split any mission exceeding its timebox. Round budgets are capacity reservations; commit only ready missions within them. All implementation below is planned, not executed.

### R01 Baseline
- R01.1 PM; planning request -> task board, role availability and current/conditional/deferred scope; check no human FTE/week assumption remains.
- R01.2 PO; R01.1 -> priorities and actor acceptance; no course/taxi placeholder expansion.
- R01.3 ARC; R01.2 -> supported Node/Angular/Material/driver/tooling matrix and explicit framework decision; verify official compatibility before installing.
- R01.4 ARC; R01.3 -> /me/capabilities/personal-shifts/errors/date/number/null contract baseline; lossless IDs and organizational authorization explicit.
- R01.5 UX; R01.4 -> personal-workspace RTL/state prototype; Hebrew labels, LTR isolation, focus and mobile layout.
- R01.6 QA; R01.4 -> synthetic baseline/override/changed-owner/cancelled/split/home-work/scope fixtures and expected outcomes.
- R01.7 PM; R01.2 -> requests to DBA/SEC/OPS for authorized metadata/identity/platform inputs; status blocked with owner until evidence arrives. Do not query anything under this planning task.

### R02 Foundation
- R02.1 BE; G1 -> authorized Node/persistence skeleton and unit runner; clean lockfile install/build/typecheck, no old/batch/broker packaging.
- R02.2 FE; G1 -> standalone Angular/Material shell; lang/RTL, route focus and stable viewports.
- R02.3 ARC; R01.4 -> reproducible shared schema/client generation; consumers cannot alter contracts implicitly.
- R02.4 BE; R02.1/R02.3 -> bounded DTO/problem-details/request-local context; malformed/denied/concurrent-user tests.
- R02.5 FE; R02.2/R02.3 -> typed API/state handling; no authoritative token/permission browser storage.
- R02.6 QA; scaffold -> contract/E2E/a11y smoke harness; distinguish synthetic from real dependencies.
- R02.7 OPS; approved platform -> CI command manifest/container baseline/secret scans; discover actual commands and exclude old/archives, workers and DDL.

### R03 Identity, Oracle, Abstract Bridge
- R03.1 BE; approved SEC trust/session decision -> /me trusted identity; spoofed actor and expiry cases.
- R03.2 BE; R03.1 + approved hierarchy metadata -> scoped/self-service policy; fixed/special-unit/team-parent/cross-unit and parallel-user cases.
- R03.3 BE; approved DBA environment/data scope -> bounded Thin SHF pool and read-only WFM boundary; lossless NUMBER, date/null/NLS, timeout/cleanup tests on authorized fixtures.
- R03.4 ARC; R01 contracts -> managed-break/policy/status/result and deferred SMS/IWD DTOs; command/transaction/shift IDs distinct, source flag ON=0/OFF=1 documented.
- R03.5 BE; R03.4 -> unavailable abstract port and isolated doubles; 503 and zero mutation/sequence/function/partner effects.
- R03.6 FE; identity/capability contract -> capability/session display; Hebrew unavailable reason and no hidden legacy fallback.
- R03.7 QA; completed slice -> actual session/scope/Oracle cleanup/unavailable checks with static/mocked/live labels.
- R03.8 OPS; pools/capabilities -> redacted health/readiness/drain instrumentation; no secrets/XML/PII in logs.

### R04 Personal Shifts
- R04.1 BE; R03 + fixtures -> existing baseline/override bounded projection; correct source/original/effective owner, cancellation/split/site/home-work.
- R04.2 BE; R04.1 + approved contract -> /me/shifts/detail; pagination/filter/object-scope and zero GET effects.
- R04.3 FE; approved contract then API -> personal table/detail states and query restoration; real permitted results and responsive RTL.
- R04.4 QA; R04 API/UI -> golden comparison and denied/empty/failure cases; no business/ledger/partner writes.
- R04.5 QA; UI ready -> keyboard/Hebrew assistive-technology/focus checks; record manual gaps, not an unsupported AA certificate.
- R04.6 PO; evidence -> first-slice acceptance without implied production permission.
- R04.7 PM; measured completed missions -> replace remaining provisional budgets with measured per-role/tool/check/rework data.

### R05 Employees And Messages
- R05.1 ARC; priorities -> minimized scoped employee/message schemas and recipient ownership.
- R05.2 BE; contracts/core -> bounded employee search/card; leading-zero IDs and PII/object denial.
- R05.3 BE; contracts/core -> skills/events/education/message reads; no placeholder integrations or dispatch.
- R05.4 FE; employee API -> list/card/tabs; long Hebrew names and focus/deep links.
- R05.5 FE; message API -> personal list/detail; no unapproved read/deletion mutations.
- R05.6 QA; slice -> permission/pagination/state/RTL regression; recipient isolation.

### R06 Operational Reads
- R06.1 ARC; G3 -> date/unit/site/asOf/provenance and planned-vs-actual contracts.
- R06.2 BE; shared projection -> current/range schedule reads; changed/swapped-owner scope.
- R06.3 BE; approved mappings -> attendance reads; null stage/station/departure/missing/late correctly represented, no event registration.
- R06.4 FE; schedule API -> scan-oriented filter/table/detail; stable selection and freshness.
- R06.5 FE; attendance API -> planned/actual view; unavailable event/correction actions truthfully shown.
- R06.6 QA; completed slice -> midnight/scope/multi-tab/filter/error and value parity.

### R07 Pure Rules And Breaks
- R07.1 ARC; core -> preview inputs/errors/warnings/deltas/current-state token; no operation or cleanup side effects.
- R07.2 BE; fixtures -> isolate shift duration/date-window/missing-reason/split policies; remove validateUpdate offer-deletion from preview.
- R07.3 BE; fixtures -> break-range/inter-break/source/lead-time policies and planned/actual mapping; 60-minute/zero-duration/seconds/overnight boundaries.
- R07.4 FE; preview API -> shift/split editor; retained draft, Hebrew errors/focus, uncommitted proposal distinction.
- R07.5 FE; break API -> planned/actual/preview controls; no fake integration success.
- R07.6 QA; completed slice -> prove zero SQL/sequence/function/offer/message effects on every preview path; boundary tests.

### R08 Eligibility Workflows
- R08.1 ARC; G4 -> offer/swap/candidate/request/capacity validation contracts; both-entity scope and warning semantics.
- R08.2 BE; shared rules -> replacement/manager-swap eligibility preview; rest gap, inner job, site/night and both-participant checks.
- R08.3 BE; core -> reinforcement/time-change/reduction request/candidate reads; lead time, capacity and stale candidate.
- R08.4 FE; offer API -> candidate comparison and confirmation preview; no unapproved acceptance.
- R08.5 FE; request API -> staffing tabs/details; keyboard selection and truthful unavailable apply.
- R08.6 QA; completed slice -> equality/warning/second-owner/capacity tests; no repository deletion, messages or consumed capacity.

### R09 Exceptions And Reports
- R09.1 ARC; priorities -> full-day/timed exception and interval/inclusion/precision contracts; BI publication and unverified async stores excluded.
- R09.2 BE; core -> bounded exception/time-off reads; baseline/source/cancellation provenance.
- R09.3 BE; authorized WFM/core -> one bounded forecast/report query at a time; partial 15-minute overlap, baseline/modified totals, null/empty and approved rounding.
- R09.4 FE; exception API -> timed/day views; no unapproved cancellation.
- R09.5 FE; reports API -> inclusion filters/interval/asOf/source presentation; bounded data and correct totals.
- R09.6 QA; completed slice -> scope/rounding/partial overlap and report states; any approved synchronous download separately checks format/formula injection. No invented async export storage.

### R10 Existing Result/Admin Views And Deferred Design
- R10.1 ARC; priorities -> read CTI/learning/admin contracts; actual/rewarded/manual and assigned/sent/completed distinctions.
- R10.2 BE; authorized existing data -> CTI/learning reads and freshness; no recalculation/SAP/IWD producer.
- R10.3 BE; elevated scope -> parameter/job/building reads; no schema editor or managed-flag dispatch.
- R10.4 FE; read APIs -> CTI/learning accessible state views; no payroll replay/dispatch.
- R10.5 FE; admin API -> read/draft forms; draft never shown as saved.
- R10.6 ARC; design Sections 6/7 + owner inputs -> future CTI1-4/SAP/BI/SMS/IWD/pool dependency/recovery register; no batch code/tests/schedules.
- R10.7 QA; beta -> current-scope role/UI regression and package producer/transport exclusion review.

### R11 Conditional Local Writes
- R11.1 DBA; explicitly approved inputs -> existing lock/precondition/idempotency/audit/commit/writer proof for one candidate; no new object or field overload.
- R11.2 ARC; DBA + business evidence -> per-command go/no-go and unknown-commit/replay contract; memory/cache alone insufficient.
- R11.3 BE; G5 + isolated mutation permission -> one approved bounded command at a time, e.g. remark/preference; same-connection revalidation/update/audit/commit/rollback, no HTTP wait or hidden notifications.
- R11.4 FE; approved command -> truthful edit/reason/duplicate/stale-reconciliation states; otherwise keep unavailable.
- R11.5 QA; approved fixture scope -> real Oracle concurrency/rollback/duplicate-or-state-precondition/unknown-commit cases; mocks cannot clear G5.
- R11.6 PO; evidence -> approve included commands or explicit read/preview release deferral. Do not label blocked writes done.

### R12 Release Evidence
- R12.1 SEC; scope -> authentication/CSRF/CORS/CSP/session/privacy/dependency review; denied-scope and sensitive logging tests.
- R12.2 BE; approved isolated load profile -> bounded latency/pool/lock/event-loop evidence; no new indexes or production load testing.
- R12.3 FE; device/browser matrix -> targeted RTL/reflow/keyboard/focus fixes; 320 CSS pixels, 200% text resize, no overlapping content.
- R12.4 QA; current artifacts -> complete regression/UIT and applicable WCAG A/AA keyboard/Hebrew reader/contrast/targets/announcements; manual gaps recorded.
- R12.5 PO; booked representatives -> UAT cases and explicit sign-off; time awaiting people excluded from agent execution.
- R12.6 OPS; approved staging -> container/deploy/drain/readiness/rollback rehearsal; no worker/broker/DDL/batch packaging.
- R12.7 PM; evidence -> release go/no-go package, exact blockers/risks/owners; no automatic release approval.

### R13 Approved Delivery
- R13.1 PO; G6 -> explicit audience/capability/window/release authorization and rollback triggers.
- R13.2 OPS; permission/runbook -> controlled capability routing/deployment; no blanket legacy writer/producer shutdown.
- R13.3 QA; permitted smoke data/actions -> approved non-destructive checks; no production mutation/partner test inferred.
- R13.4 PM; owners -> Hebrew support/handover and incident routing; unavailable functions accurately documented.
- R13.5 OPS; authorized rollout -> monitor during the operations-defined observation window; active investigation and passive hypercare elapsed time reported separately, no blanket legacy shutdown.
- R13.6 PO; smoke/observation/handover evidence -> explicitly accept the delivered current-stage scope; excluded producers and full legacy retirement remain deferred.

## 6. Dependencies, Parallelism And Completion Gates

Critical path: approved contracts/toolchain -> runnable foundation -> trusted identity and approved Oracle mapping -> verified personal-shifts projection -> shared pure shift/break policies -> workflow previews/beta -> local-write inclusion/deferral -> acceptance/recovery evidence -> explicit release -> owned rollout.

Parallel work is limited to real harness capability and disjoint edits after prerequisites: UI against approved synthetic schemas vs backend mapping; independent feature modules; QA case preparation vs development. Real end-to-end checks wait for the integrated version. One writer owns shared contracts/core transaction utilities/shell/theme. No assumed agent background scheduler, automatic QA fix loop or setting change.

G1: user approves architecture/API/UI baseline. G2: actual supported reproducible commands and authorized environment/harness. G3: first read-only parity/RTL/scope/zero effects. G4: pure preview and bridge unavailable safety. G5: per-command existing-storage/writer/recovery and real approved Oracle evidence, or formal deferral. G6: build/type/lint/unit/contracts/integration/security/load/E2E/accessibility/UIT/UAT/rollback evidence for delivered scope. G7: explicit release and controlled ownership/handover. Generated output, passing mocks and a tool permission are not approval.

Mission Ready: single owner/exclusive files, approved prerequisite versions, allowed environment/data, synthetic or approved fixtures, small falsifiable hypothesis and cheap check. Mission Done: output meets acceptance, focused check immediately after first edit, local repair/retest, risk-scaled evidence, review/traceability and no prohibited effects. Missing input -> blocked with accountable owner, not running. Final API/UI/release sign-off remains separately recorded.

Handoff includes task ID, objective, baseline versions, exclusive paths, allowed actions/environment/data, exclusions, dependencies, artifact and focused check. Return ready/running/blocked/review/done plus exact findings/changed paths/check results, blocker owner, risk and next action. No inherited conversation or direct peer bus assumed; never re-invoke a role already in active chain. If concurrency/nesting is unavailable, serialize and disclose.

## 7. Measurement And Reforecast

For every mission record started/ended time, active minutes, external-blocked minutes, tool/install/build/test minutes, reviewer/retest rounds, artifact version and verification type (static/mocked/real Oracle/browser/human acceptance). R01 establishes readiness costs; R04 measures a representative complete slice. Forecast remaining work from observed rule/query/UI-state complexity and dependency paths, not human FTE weeks, source line counts or raw agent count. A failed check adds explicit repair/retest work; scope correctness is never reduced to hit a timebox.

Existing design command: .\docs\Inspect-ShfDesign.ps1 -Mode Validate -DocumentationScope CurrentProject. Its previous pass is historical static evidence for the brief/design/catalog, not this plan or the future app. Wider All previously failed on an unrelated companion link. Discover actual app commands in R02; no existing npm/Playwright suite or current runtime pass is assumed.

## 8. Later Stages: No Artificial AI Calendar Acceleration

Future scope needs separate approval. Replace the earlier future-week forecasts with bounded readiness investigations and re-estimate implementation only when contracts/resources are known:

| Stage | Initial agent readiness timebox | External prerequisite / later estimate |
| --- | --- | --- |
| Live API bridge + synchronized writes | 2-4 h | EXT authoritative API/auth/ack/status/idempotency + DBA existing proposal/preimage/conflict/result/replay storage proof. ARC approves async semantics; then estimate client/final-apply, duplicate/late/remote-success-local-failure tests and rollout from actual contracts. No current live transport is authorized. |
| Batch CTI/SAP/BI/SMS/IWD/pool | 4-8 h | Separate batch approval, existing run/claim/checkpoint/manifest recovery, payroll/BI/SAP byte/rounding fixtures and sender/pool contracts. Then split each producer into bounded implementation/recovery tests. No batch-only test/code/scheduling now. CTI/SAP/BI need not wait for EMS if independently approved; SMS/IWD require their specific bridge prerequisites. |
| Full legacy retirement | 2-4 h for inventory/runbook review | All replacement producers/capabilities accepted and pending remote/SAP/lease effects reconciled; operations owns disablement/window/observation. Not accomplished by replacement UI alone. |

These readiness timeboxes are not total future-development estimates. No new storage is implied: inadequate existing recovery keeps the affected future feature blocked until an explicit user scope decision.

## 9. Blockers And Publication

- User/ARC: architecture/API/UI and release approvals.
- DBA/platform: confirmed Oracle21c environment/patch/support, metadata/PLSQL/grants, scoped data/test access and competing-writer behavior.
- SEC/business: trusted identity and organizational/session policies.
- DBA/ARC: per-write durable retry/audit/precondition/local-apply recovery under unchanged schema.
- EXT: future partner contract, transport, local/remote recovery and runtime tests.
- PO/QA/operations: acceptance/load/browser/assistive-technology/RPO/RTO requirements, booked UAT/release/observation windows.
- User/PM: actual directives publication requires an Agent-mode handoff; Plan mode only persists this memory. Publication alone does not authorize scaffolding, DB access, live bridge or batch implementation.

Relevant existing full paths: d:/AIProjects/SHFAI/docs/AGENT_INSTRUCTION.md; d:/AIProjects/SHFAI/docs/SHF_REVERSE_ENGINEERED_TECHNICAL_DESIGN.md; d:/AIProjects/SHFAI/docs/SHF_SOURCE_CONTRACT_CATALOG.md; d:/AIProjects/SHFAI/docs/SHF_SCHEMA_DISCOVERY_READ_ONLY.sql; d:/AIProjects/SHFAI/docs/Inspect-ShfDesign.ps1. Legacy rule anchors are ShiftDataModel.validateUpdate, BreakDataModel.checkShiftBreakForm/checkBreakRange, SwitchModel.validateReplace and ForecastModel interval logic; all old/ evidence stays read-only.

Review result: mission units converted to active agent timeboxes, human staffing/calendar forecasts removed, budget totals explicitly summed, external gates separated, genuine parallelism not assumed. These are desk-reviewed provisional budgets, not runtime measurements. Next action: review this AI baseline, then publish the directives via authorized mode handoff and calibrate from R04 before committing elapsed delivery dates.

## 10. Authorized Local Foundation Execution

Task ID: SHF-FOUNDATION-20261013. Status: done for the explicitly approved local
foundation only; the broader plan remains in review.

On 2026-10-13 the user approved creating a local TypeScript NestJS/Fastify API,
modern Angular/Material Hebrew/RTL shell, isolated tests and build tooling in this
repository. This narrow authorization permits foundation work before full G1
approval; it does not approve business architecture/API/UI baselines, database
access, identity, writes, transport, CI/deployment infrastructure or release.

The [root README](../readme.md) records the plan analysis, exact selected versions,
workspace commands, executed validation and unresolved gates. The new application
is under [apps/api](../apps/api/) and [apps/web](../apps/web/). No legacy source was
changed or executed. No Oracle or partner connection, business endpoint, mock
employee result, schema object, batch process or deployment was introduced.

Clean lockfile installation, lint, strict type checks, five isolated tests, both
production builds and local HTTP/browser smoke checks passed. Browser checks
covered Hebrew/RTL, skip-link focus, narrow reflow, 200% text resizing and targeted
text contrast; they do not prove full WCAG compliance or human acceptance.
The restricted `.npmrc` file was not created or modified.

R02 is partially implemented, not fully done: contract/client generation,
trusted identity, agreed DTO/error conventions, CI and approved deployment
configuration remain pending. R01, G1 and the first connected R04 slice remain
blocked on user/architect API/UI decisions and SEC/DBA prerequisites. No measured
business-slice velocity or calendar commitment is inferred from scaffold checks.

## 11. Personal-Shifts Baseline Continuation

Task ID: SHF-R01-PS-BASELINE-20261013. Status: review for the proposed baseline;
the bounded source-analysis/documentation mission is complete, not G1 approval.

The user requested continuation after the local foundation. The next safe work
was a read-only source trace and draft baseline, not connected implementation.
The same implementing assistant performed sequential architect, UI and QA design
responsibilities; no parallel-agent acceleration or human sign-off is claimed.

R01-PS-1.0 is contained in the existing technical design:

- [Section 3.6.1](SHF_REVERSE_ENGINEERED_TECHNICAL_DESIGN.md#361-r01-personal-shifts-baseline-r01-ps-10): active personal-shifts source trace, identity/capabilities, bounded list/detail DTOs, privacy, errors and read sequence.
- [Section 4.6.1](SHF_REVERSE_ENGINEERED_TECHNICAL_DESIGN.md#461-first-slice-personal-workspace-r01-ps-10): Hebrew/RTL first-screen controls, loading/empty/denied/failure/session states and focus/accessibility acceptance.
- [Section 10.3.1](SHF_REVERSE_ENGINEERED_TECHNICAL_DESIGN.md#1031-first-slice-synthetic-acceptance-matrix): 17 proposed synthetic cases with exact outcomes and verification levels; none executed as business tests.

The trace distinguishes the active UNION from commented-out NVL SQL, documents
the strict lower-date predicate, absent upper bound and day-start sorting, and identifies
different attendance join keys in personal-list versus detail source. The
target's half-open date window, bounded pagination, provenance privacy and
failure behavior are proposals requiring explicit approval, not existing parity.

Missing prerequisites and accountable owners:

| Prerequisite | Owner / blocked work |
| --- | --- |
| Approve architecture/API/UI R01-PS-1.0 and intentional date/order/privacy behavior | User/ARC/PO; business endpoint and feature-screen implementation. |
| Trusted session/employment link and self-service permission semantics | SEC/business; `/me`, capability authorization and actor-scoped reads. |
| Approved Oracle environment, least-privilege grants, identity/day/change cardinality and field types | DBA/platform; repository SQL, driver proof and live characterization. |
| Cancellation and null-flag meaning; business time zone/DST interpretation | DBA/PO; effective projection and temporal acceptance results. |
| Bounded cursor codec/context/size and concurrent-refresh behavior | ARC; final list pagination contract and generated consumers. |
| Hebrew screen-reader/UAT environment and accountable acceptance | QA/PO; complete-process accessibility and business acceptance. |

Documentation validation is static evidence only. The [root README](../readme.md)
links the review artifacts and distinguishes these proposals from the previously
verified disconnected scaffold. No application code, schema, driver, broker,
legacy source or deployment was changed in this continuation.

Executed static checks: scoped design validation passed (five JSON examples,
1,125 local links and 776 source-line references); focused DTO/case-inventory
assertions passed; 14 README/plan local links and anchors passed on retest after
correcting an ad hoc PowerShell overload error; tracked whitespace check passed.
These results are recorded in technical-design Section 10.5. The 17 planned
business scenarios remain NOT RUN; no G1/G3/UAT/release gate is cleared.

## 12. Approved Isolated Personal-Shifts Code

Task ID: SHF-R01-PS-ISOLATED-20261013. Status: done for isolated code/test scope;
connected feature and full baseline remain blocked/review.

The user explicitly selected approval for isolated personal-shifts DTOs, pure
mapping/filter rules and synthetic tests only. This supersedes the immediately
preceding schema-only preparation direction, but does not approve live endpoints,
Oracle connections, schema changes, identity decisions, partner transport or
deployment. No standalone schema artifact or new dependency was introduced.

Changed application paths:

- [DTO contracts](../apps/api/src/personal-shifts/contracts.ts), owned by the
  architect responsibility.
- [Pure helpers](../apps/api/src/personal-shifts/personal-shifts.ts), owned by the
  backend responsibility.
- [Synthetic tests](../apps/api/test/personal-shifts.test.ts) and
  [route-free regression](../apps/api/test/application.test.ts), owned by QA.
- [API runner manifest](../apps/api/package.json), expanded to include both tests.

One assistant performed these responsibilities sequentially. The inputs are
resolved synthetic facts plus supplied scope, not Oracle metadata or identity
evidence. Unknown inclusion, invalid facts and cursor requests fail explicitly.
The helper does not decide cancellation, time zones or actual source overrides;
it does not generate a fake cursor/HTTP success envelope. No AppModule wiring,
business endpoint, SQL, driver, live partner call or legacy change was made.

Executed evidence: 22 isolated personal-shifts tests plus two API foundation
regressions passed; strict workspace type checks and both production builds
passed. Lint initially caught an imprecise numeric literal in a rejection fixture;
it was corrected and targeted lint/retest passed. Frontend tests/browser checks
were not rerun because no frontend behavior changed.

This partially advances the R01 fixture/rule foundation and R04 projection
preparation; it is not an implemented Oracle projection, G3 parity result or
business acceptance. Section 11's user/ARC/SEC/DBA prerequisites still block the
connected slice. The [root README](../readme.md) and technical-design Section
10.3.2 record the exact distinction.

## 13. Operational Oracle Adapter, No Live Execution

Task ID: SHF-ORACLE-READONLY-20261013. Status: done for real adapter implementation
and offline checks; connected personal-shifts business reads remain blocked.

The user requested real Oracle access, confirmed the target is production/shared,
and explicitly selected **no live checks; implement the adapter without connecting**.
No credential is included in this plan. The target alias is configured externally;
its Oracle Net resolution, exact service/version/grants and approved read scope
have not been verified. No connection, metadata or business SELECT was executed.

Implemented:

- [Configuration](../apps/api/src/oracle/configuration.ts): explicit enablement,
  externally supplied credentials/TNS directory, no write mode or provider URL.
- [Real read-only adapter](../apps/api/src/oracle/read-only-database.ts): lazy
  private bounded Thin pool, only fixed connectivity/shift-column metadata SELECTs,
  read-only transactions, rollback/release/drop, redacted errors and drained close.
- [Nest registration](../apps/api/src/oracle/oracle.module.ts) and
  [manual check](../apps/api/src/oracle/check.ts): no startup connection, no
  business HTTP endpoint; manual real check remains disabled/not authorized.
- [Offline tests](../apps/api/test/oracle-read-only.test.ts): isolated doubles,
  not partner/Oracle simulation presented as real results.
- Existing dependency manifests and root lockfile: node-oracledb 26.0.0,
  @types/oracledb 7.0.3, and explicit check command.

Evidence: 20 Oracle adapter tests plus the existing 24 backend tests passed,
root lint/workspace types/both builds passed, actual driver import confirmed
Thin mode offline, and the disabled CLI returned `ORACLE_DISABLED`/exit 1.
Frontend behavior is unchanged. Actual database transaction enforcement, network,
metadata, authentication and personal-shift parity are NOT RUN.

No production mutation, business row read, metadata discovery, secret file,
schema/grant change, Thick-mode fallback, transport or batch work was introduced.
The supplied account's privileges are unknown; DBA should approve an existing
least-privilege account and read window before activation. An environment flag
does not constitute approval. SEC identity and DBA mapping/cancellation/time-zone
proof still block the real business slice; the adapter is R03 foundation only.

Final offline reproducibility check: clean `npm ci` and full `npm run check`
passed, including 44 backend and three frontend tests (47 total), lint, strict
types and both production builds. Five dependency install-script review warnings
were reported without adding script approvals. Scoped documentation validation
passed five JSON examples, 1,137 local links and 776 source references. All live
Oracle checks remain NOT RUN in accordance with the user's explicit choice.

## 14. Diagnostic Attempt and Approved Stub Redirect

Task IDs: SHF-ORACLE-METADATA-20261013 (blocked), SHF-STUB-API-20261013.
The user later explicitly authorized one connectivity and three-table column
metadata diagnostic, without business rows or writes. Bounded local Oracle
configuration searches found no TNS entry; the user supplied an Easy Connect
address. A secure local credential prompt was used; no password was stored.

The first VS Code shell task lost nested quoting and failed with ORACLE_DISABLED
before any connection. A file-based PowerShell prompt fixed that invocation.
The subsequent approved live attempt failed with **NJS-530 (host not found)**.
The metadata step did not run; no business read or mutation occurred. DBA/network
ownership of the correct reachable target remains the named blocker.

The user then explicitly requested **stub data API responses**. This authorizes
an opt-in synthetic read API, not real identity/Oracle/partner behavior:

- [Stub module](../apps/api/src/stub/stub.module.ts) serves `/api/v1/me`,
  capabilities, bounded personal shifts and scoped detail.
- [Fixtures](../apps/api/src/stub/fixtures.ts) contain only invented values and
  dates; personal projection/filter rules are reused.
- Startup, headers and response bodies label the mode synthetic/unauthenticated.
  Stub and enabled Oracle modes cannot coexist; no Oracle module is loaded in
  stub mode, and failed Oracle reads never automatically become stub success.
- Writes, partner completion and cursor pagination remain unavailable. Default
  non-stub business routes remain absent; the UI is unchanged.
- [Tests](../apps/api/test/stub-api.test.ts) cover markers, fixed demo identity,
  filters, empty/error results, scope/redaction, insufficient-page rejection and
  absent write routes.

Diagnostic command/orchestrator and the secure prompt/task are retained but not
rerun after the redirect. The [README](../readme.md) documents exact local stub
startup and October 2026 fixture dates. No G1, real Oracle parity, identity,
human UAT or release approval is inferred from synthetic API responses.

Executed checks: full `npm run check` passed lint/types, 53 backend and three
frontend tests (56 total), and both production builds. Scoped documentation
validation passed five JSON examples, 1,140 links and 776 source references.
Loopback HTTP smoke on temporary port 3100 passed: three synthetic shift items,
explicit unauthenticated identity and no-store/source headers. The temporary
server was stopped; no Oracle check was retried after the redirect.

## 15. User-Approved Angular Stub Workflow

Task ID: SHF-STUB-UI-20261013. Status: done for the synthetic read-only screen;
real Oracle/identity/business acceptance remain blocked.

The user explicitly selected implementation of the Angular personal-shifts screen
with stub data. This scope is a demonstration workflow, not G1 approval of real
business contracts, identity, database access, writes, partner transport or release.
The UI responsibility changed only web consumers/tests/configuration and existing
documentation; shared backend DTOs and API contracts were not changed.

Implemented artifacts:

- [API client](../apps/web/src/app/shifts-api.ts): same-origin read requests,
  type-only reuse of existing DTOs and runtime rejection of unlabelled, malformed
  or non-synthetic responses. No browser token/permission authority or fake fallback.
- [Screen](../apps/web/src/app/personal-shifts.ts) and
  [template](../apps/web/src/app/personal-shifts.html): Hebrew/RTL read-only
  table/detail, inclusive date controls, one-to-31-day bounds, fixed October 2026
  demo defaults, explicit loading/empty/error/retry states and preserved dates.
- [Styles](../apps/web/src/app/personal-shifts.scss): logical layout, bounded
  scrollable semantic table and responsive detail/filter controls.
- [Proxy](../apps/web/proxy.conf.json): local Angular development `/api/**` to
  port 3000; no CORS expansion or infrastructure/deployment change.
- [Tests](../apps/web/src/app/personal-shifts.spec.ts): identity/capability gate,
  calendar conversion, empty/failure distinction, malformed data rejection,
  detail/redaction, stale request cancellation, invalid bounds and detail failure.
  Existing shell tests were adapted to the actual HTTP-backed demo.

Executed evidence: `npm run check` passed lint, strict workspace/templates,
53 backend and 11 frontend tests (64 total), and both production builds.
Browser checks used the updated UI at port 4201 because 4200 was already occupied.
Port 3000 was also occupied by an existing API; its explicit synthetic and
unauthenticated responses were verified before reuse. Neither existing user
process was stopped. The temporary UI server was stopped after validation.

Browser checks passed initial three shifts through the real local proxy, split
details, skip-link/main focus, detail heading/row focus restoration,
1280/768/320 CSS pixel page reflow and 200% text resizing. Empty and invalid
filters, first-invalid-field focus, a browser-injected synthetic 503, retained
dates and retry recovery passed. The expected injected 503 resource error is not
a real Oracle failure. Manual Hebrew assistive-technology assessment, full AA
conformance, real business parity and stakeholder UAT remain NOT RUN.

No Oracle connection was attempted in this step; no write/partner/batch action
or production capability was enabled. The next safe milestone is user review of
the demonstrated workflow and selecting the next synthetic read capability.

## 16. Approved Synthetic Edge-Case Expansion

Task ID: SHF-STUB-EDGES-20261013. Status: done for the synthetic fixture/UI test
scope; real Oracle, identity and business acceptance remain blocked.

The user selected expansion for overnight, unknown/null and reassignment cases.
Shared API/DTO contracts and pure business mapping rules remain unchanged.

- [Fixtures](../apps/api/src/stub/fixtures.ts) now yield five visible shifts in
  the existing October 14-17 range. Added overnight and unknown/null examples,
  plus an outgoing reassignment that is deliberately inaccessible. Original IDs
  and incoming-reassignment privacy remain stable.
- [API tests](../apps/api/test/stub-api.test.ts) prove effective-start half-open
  bounds, next-day end preservation, explicit nulls, list/detail parity and
  incoming/outgoing owner scope. Missing and inaccessible detail responses agree.
- [UI](../apps/web/src/app/personal-shifts.html) explicitly marks a different
  end date, shows full local start/end/home-work detail, distinguishes unknown
  and missing/redacted baseline, and labels same-day actions with start times.
  Single-result feedback uses singular Hebrew.
- [Client guard](../apps/web/src/app/shifts-api.ts) rejects a response supplying
  baseline values while claiming they are redacted/not-present.
- [UI tests](../apps/web/src/app/personal-shifts.spec.ts) prove overnight display,
  four unknown fields, absent unknown split gap, reassignment redaction and
  fail-closed contradictory baseline data.

Checks: 56 backend plus 14 frontend tests (70 total), lint, strict types/templates
and both production builds passed. Initial API test registration was accidentally
nested in a method loop; it was corrected and the same runner passed on retest.

## 23. Approved R07 Break Views and Pure Preview Demo

Task ID: SHF-R07-BREAK-PREVIEW-STUB-20261014. Status: done for the approved
synthetic break-read/change-preview increment; R07 overall remains partial.

The user explicitly approved synthetic break views and pure break-change previews
with Hebrew/RTL controls and isolated tests. This authorizes calculations only,
not saving, offer cleanup, Oracle access, ID allocation, partner requests or
simulated command completion.

### Rule Evidence and Explicit Synthetic Policy

[checkValidBreakRangeWithShift](../old/SHF/src/bzq/shf/model/BreakDataModel.java#L3174)
checks positive duration depending on source and margins from shift edges.
[checkBreakRange](../old/SHF/src/bzq/shf/model/BreakDataModel.java#L3200) rejects
a gap smaller than its allowed range.
[checkShiftBreakForm](../old/SHF/src/bzq/shf/model/BreakDataModel.java#L3218)
defaults the shift margin to 60 minutes and applies inter-break checks
conditionally by source. The
[constant](../old/SHF/src/bzq/shf/utils/SHFConstants.java#L56) is 60 minutes.
These are source observations, not verified current unit/partner policy.

The architect-owned [demo DTO](../apps/api/src/stub/break-contracts.ts) separates
planned and nullable actual break local timestamps, policy/read eligibility,
proposal input and explicitly unsaved preview output.
`synthetic-break-policy-1` uses 60-minute edges and gaps, equality allowed,
minute-precision proposal input and a synthetic duration bound 1–120 minutes.
The 120-minute bound is a demo input limit, not an observed legacy requirement.
Zero duration/deletion, arbitrary source flags, managed/split/unknown-source policy,
lead-time rules and DST instant/paid-duration arithmetic are not implemented.

Wall-time arithmetic uses a Gregorian UTC axis internally solely to add calendar
minutes, without asserting an Oracle instant or timezone offset. Actual read
timestamps retain seconds; proposals accept `:00` seconds only. Overnight proposals
use an explicit calendar date and can end on the next day. The legacy method's
same-shift-date parsing is not silently copied as an overnight restriction.

### Implementation and Verification

- [Fresh scoped fixtures](../apps/api/src/stub/break-fixtures.ts) reuse personal
  effective-shift projection. Populated normal/overnight cases, nullable actuals,
  unverified split/managed policy and an empty unknown source are explicit.
- [Pure function](../apps/api/src/stub/break-preview.ts) validates exact body
  fields, duration/calendar shape, shift margins and gap/overlap, and returns
  before/proposed values without mutating input or generating operation IDs.
- [GET/POST controller](../apps/api/src/stub/breaks.controller.ts) exposes
  `/api/v1/shifts/{id}/breaks` and
  `/api/v1/shifts/{id}/break-change-previews`. POST returns 200 calculation,
  `previewOnly: true`, `saved: false`, policy version and warnings—not 201/202
  acceptance or completion. Scoped missing/foreign IDs agree; save/delete/apply
  endpoints remain absent. Both responses are synthetic/unauthenticated/no-store.
- [Client](../apps/web/src/app/breaks-api.ts) rejects malformed, saved/completed,
  wrong-shift/proposal and inconsistent-duration responses.
  [Screen](../apps/web/src/app/breaks.ts) /
  [template](../apps/web/src/app/breaks.html) shows planned/actual table, an
  explicit local-date calendar/time/duration draft, unsaved result, rule errors,
  focus and unavailable policy. Draft edits cancel stale requests and clear
  old results. Shift replacement cancels preview and resets an empty source's
  previous draft instead of retaining another shift's date.
- [API/unit tests](../apps/api/test/break-preview.test.ts) cover exact and
  one-minute boundaries, overlap, zero/oversize/invalid/seconds inputs, duration
  extremes, overnight, unsupported policies, repeated immutable output and
  GET before/after both successful and rejected POST. These pure/isolated checks
  do not constitute database-side zero-effect evidence.
- [UI tests](../apps/web/src/app/breaks.spec.ts) cover marker/shape checks, explicit
  unsaved result, retained error draft, unavailable submit, local input rejection,
  draft/shift cancellation, saved/inconsistent-result rejection and empty reset.

Latest checks: 69 backend + 50 frontend tests (119 total), full lint,
strict types/templates and production builds passed. Initial production bundle
426.75 kB remains under unchanged 500 kB warning; breaks is an immediate deferred
chunk with Hebrew loading/error states. A test initially selected the calendar
button instead of submit; its locator was corrected and the same unavailable-
submit assertion passed. No assertions were weakened or cases skipped.

Browser checks used updated isolated API/UI ports 3107/4207 and a session proxy.
Actual seconds/nulls, an exact 60-minute-gap preview, a rejected 59-minute gap,
retained draft, focus on the preview, unchanged read table, stale-result clearing,
overnight next-day preview, calendar keyboard operation, split-policy unavailable
and empty source passed. 1280/768/320 page reflow and 200% resizing passed.
Shared-page/pointer interruptions were resolved with fresh self-contained checks.
Temporary servers/proxy were cleaned up; existing user processes were preserved.

No Oracle, business write, offer deletion, sequence/function allocation, broker
or live partner request occurred. Real-policy mapping, source/managed lead-time
and deletion semantics, full shift/split previews and G4 live proof remain pending.
Review this bounded demo before authorizing the next R07 policy increment.

## 24. Approved Shift-Time and Split-Shift Pure Preview Demo

Task ID: SHF-R07-SHIFT-SPLIT-PREVIEW-STUB-20261014. Status: done for approved
synthetic calculation scope; real R07/G4/business acceptance remain pending.

The user explicitly approved synthetic shift-time and split-shift previews,
calculating an unsaved proposal only. No Oracle, saving, offer cleanup, ID
allocation or partner request is authorized. Scope is personal demo employee A.

### Evidence, Synthetic Policy and Deliberate Limits

[validateUpdate](../old/SHF/src/bzq/shf/model/ShiftDataModel.java#L3604) parses new
start/end, checks missing reason, relative date bounds, unit minimum duration,
offers and optional split validation. Its `cancelBreakSwitch` branch can delete
break candidates while validating. That mutation is excluded entirely.
[validateSplitShift](../old/SHF/src/bzq/shf/model/ShiftDataModel.java#L5739)
checks split order/range, first-part minimum 120 minutes, gap minimum 120 minutes,
and second-part start no earlier than a calendar time based on 16:00.
Production parameters/time interpretation and safe write ownership are unverified.

The architect-owned [demo DTO](../apps/api/src/stub/shift-preview-contracts.ts)
defines explicit minute-precision start/end local strings, nonblank reason up to
200 characters and `split: null` or explicit local gap endpoints.
`synthetic-shift-policy-1` uses:

- Start dates October 14-17, 2026, bounded overnight end; no relative live clock.
- Span 240-960 minutes and at least 240 proposed work minutes. These fixed
  thresholds/window and reason bound are demo choices, not recovered unit values.
- Split first part and gap at least 120 minutes, second-part start at/after
  16:00 on the start date. A second-part minimum of 120 minutes is an explicit
  additional synthetic constraint, not observed in the inspected legacy method.
- Existing planned breaks must remain inside the proposed shift and not overlap
  the split gap (half-open intervals). Conflict is rejected, not cleaned up.
  This is containment/gap compatibility, not full break-margin/offer policy.
- Unknown-source and partner-managed policy remains unavailable. No actual
  attendance, availability, offers, unit parameter or live-source eligibility is
  asserted. DST/UTC/paid-duration decisions remain blocked.

### Implementation

- [Shared wall-time parser](../apps/api/src/personal-shifts/wall-time.ts)
  centralizes strict Gregorian minute parsing for break and shift previews. UTC
  is an arithmetic axis only, not a source timezone or real business instant;
  existing break regressions passed after extraction.
- [Pure shift calculation](../apps/api/src/stub/shift-preview.ts) uses fresh
  scoped source/break facts, validates order/window/span/split/break compatibility,
  and clones before/proposed schedules. It allocates no operation/correlation IDs.
- [Controller](../apps/api/src/stub/shift-previews.controller.ts) exposes
  `GET /api/v1/shifts/{id}/shift-preview-context` and
  `POST /api/v1/shifts/{id}/shift-change-previews`. POST returns 200 with
  `previewOnly: true`, `saved: false`, policy version, minute totals and warnings,
  never apply/acceptance/completion. Normal write routes remain absent.
- Existing personal-shifts capability advertises synthetic preview only; writes
  remain false. Responses preserve synthetic/unauthenticated/no-store markers.
- [Client](../apps/web/src/app/shift-preview-api.ts) verifies context/actor/ID,
  submitted values, split endpoints, unsaved markers and exact minute consistency.
  It rejects completion-shaped or internally inconsistent responses.
- [UI](../apps/web/src/app/shift-preview.ts) /
  [template](../apps/web/src/app/shift-preview.html) supplies start/end calendars
  and local times, optional split gap calendars/times, reason, retained draft,
  unavailable policy, errors and focus-managed before/proposed result.
  Draft changes cancel in-flight work and remove stale results.

### Verification and Status

[Unit/API tests](../apps/api/test/shift-preview.test.ts) passed for plain/split
minute totals, exact and one-minute boundaries, strict body/date/reason inputs,
overnight, policy gating, break-conflict rejection, scope and repeated immutable
POST/GET. [UI tests](../apps/web/src/app/shift-preview.spec.ts) passed calendar/
body/segment rendering, retained rejected draft, cancellation, unsaved and wrong-
minute result rejection, and unavailable source. No real database effects were
tested or inferred.

Full `npm run check` passed **74 backend + 58 Angular tests (132 total)**,
lint, strict types/templates and both builds. Initial bundle **428.07 kB**,
below unchanged 500 kB warning. The new view is an immediate deferred feature
with explicit Hebrew chunk loading/error feedback.

Browser verification used updated isolated API/UI ports 3108/4208 and a session
proxy. Plain 600-minute and split 480-work/120-gap results, two explicit segments,
four calendars, focus, stale-result removal, conflict rejection with retained
draft, overnight 480-minute result, unavailable source, 1280/768/320 reflow and
200% resizing passed. An initial assertion preceded Angular's checkbox render;
condition-based hidden/visible waits passed without altering product behavior.
Temporary servers/proxy were cleaned up; existing user processes were preserved.

No original shift/break/offer was changed, no transaction/sequence allocated,
and no Oracle or partner request ran. Full real rule characterization, unit
configuration, attendance/offer eligibility, durable preconditions and G4 proof
remain pending. Next candidate is R08 read/eligibility workflow design and
synthetic fixtures, requiring a separate user scope/contract decision.

Additional focused check: all 10 break/shift preview unit/API tests passed under
`America/Los_Angeles`, preserving local calendar arithmetic in a UTC-negative
runtime. Scoped documentation validation passed 1,155 local links and 779 source
references; README/plan anchors and tracked whitespace passed. These are isolated
checks, not new live database or business timezone evidence.

## 25. Approved R08 Replacement Candidates and Eligibility Preview

Task ID: SHF-R08-REPLACEMENT-STUB-20261014. Status: done for the approved
synthetic candidate-list/eligibility increment; R08 overall remains partial.

The user explicitly selected replacement candidates and eligibility preview.
No acceptance, saving, Oracle access, repository cleanup or partner request was
approved. These fixtures form a separate, clearly labelled scenario, not live
availability or a reinterpretation of the operational attendance demo.

### Source Evidence and Synthetic Contract

[SwitchModel.validateReplace](../old/SHF/src/bzq/shf/model/SwitchModel.java#L69)
checks distinct times, switchable inner jobs, rest/attendance for both shifts,
and confirmable repository/exception/extension conditions.
[CheckValidDate.checkSwitch](../old/SHF/src/bzq/shf/utils/CheckValidDate.java#L323)
queries an employee's other effective shifts using a configured minimum hours.
[ReplaceModel.checkShiftsForSwitch](../old/SHF/src/bzq/shf/model/ReplaceModel.java#L991)
filters lead time, duration difference, jobs, night/site, own shifts and attendance.
Source filters and warning booleans are not proof of runtime policy or authority
to call `removeLimit` or mutate offers.

The architect-owned [DTOs](../apps/api/src/stub/replacement-contracts.ts) define
minimal synthetic source/candidate shifts, reason-code/text arrays and four
eligibility outcomes:

- `eligible-under-demo-policy`: only the listed synthetic checks pass; not approval.
- `blocked`: at least one known blocker, even if other facts remain unknown.
- `confirmation-required`: synthetic review flag with no known blockers/unknowns;
  confirmation/cleanup is not implemented.
- `unknown`: incomplete facts cannot become eligible.

All previews retain `previewOnly: true`, `saved: false`, `accepted: false`.
No operation/correlation or accepted state is returned.

`synthetic-replacement-policy-1` fixes rest at 660 minutes on four sides
(source before/after and candidate before/after), allowed duration difference
120 minutes, minimum lead 120 minutes and night starts at/after 22:00 or before
06:00 with matching sites. Equality passes these demo thresholds. These numbers,
night definition and equality rules are synthetic choices, not verified live
parameters. Clock is frozen at `2026-10-13T08:00:00`, not current request time.
Rest/compatibility/attendance/review facts are supplied resolved fixtures, not
computed from a real neighboring schedule or read from Oracle.

### Implementation and Verification

- [Scenario fixtures](../apps/api/src/stub/replacement-fixtures.ts) define a
  source shift `91000001` for demo employee A and four team-A candidates:
  suitable, blocked, review-required and unknown. A foreign-team candidate is
  omitted. Separate IDs avoid contradictory claims about previous attendance
  fixtures; profile internals and four rest values are not exposed in the list.
- [Pure policy](../apps/api/src/stub/replacement-preview.ts) separates blockers,
  warnings and unknowns; it never mutates input or performs lookup/cleanup.
- [GET/POST controller](../apps/api/src/stub/replacement.controller.ts) exposes
  `GET /api/v1/replacement-candidates?limit=100` and
  `POST /api/v1/replacement-eligibility-previews` with body `{candidateId}` only.
  Fixed source/team ownership and candidate scope are enforced before calculation.
  Default limit 25/max 100; insufficient page size fails explicitly. Foreign and
  absent candidate IDs return identical 404; actor/unit/confirm overrides rejected.
- [Client](../apps/web/src/app/replacement-api.ts) checks synthetic markers,
  both-entity context, scope, unaccepted flags and agreement between classification
  and blocker/warning/unknown arrays. It rejects a result labelled eligible while
  carrying blockers.
- [UI](../apps/web/src/app/replacement.ts) /
  [template](../apps/web/src/app/replacement.html) shows a read-only candidate
  comparison table and focus-managed outcome with separate reasons. Candidate
  selection/refresh cancels old previews; errors retain the list without invented
  eligibility. There is no acceptance/confirmation/save control.
- [Unit/API tests](../apps/api/test/replacement-preview.test.ts) verify all four
  outcomes, each side's rest boundary, mixed known-short/unknown facts, owner/time/
  duration/lead/night/attendance checks, immutable repeated reads, hidden scope
  and absent acceptance endpoints.
- [UI tests](../apps/web/src/app/replacement.spec.ts) verify categories, safe text,
  scope and context rejection, unaccepted/contradictory results, stale cancellation,
  empty/failure list behavior and no write/acceptance calls.

Full `npm run check` passed **78 backend + 65 Angular tests (143 total)**,
lint, strict types/templates and both builds. Initial bundle **430.76 kB**,
under unchanged 500 kB warning. Replacement is an immediate deferred view with
Hebrew loading/error states.

Browser checks on isolated updated ports 3109/4209 passed four categories,
unsaved/unaccepted labels, unchanged four-row list, keyboard result/return focus,
1280/768/320 reflow and 200% resizing. Injected 503 retained candidates, showed
an explicit error and recovered a demo-only suitable result on retry.
Temporary servers/proxy were cleaned up; existing user servers were preserved.

No live Oracle/attendance/neighbor-schedule or partner call, business mutation,
offer cleanup or release occurred. Rest and other policies need real mappings,
both-resource authorization and characterization before live use.
Next candidate: R08 staffing-request read stubs, under a separate user decision.

## 26. Approved R08 Staffing Request and Candidate Reads

Task ID: SHF-R08-STAFFING-READ-STUB-20261014. Status: done for approved
synthetic reinforcement/time-change/reduction list/detail/candidate reads.
Full R08 and real eligibility/write/release gates remain pending.

The user explicitly approved all three read-only request types. No registration,
assignment, approval, cancellation, Oracle access or partner request is authorized.

### Source Evidence and Minimal Demo Contract

- [populateShiftAddRequests](../old/SHF/src/bzq/shf/model/ShiftDataModel.java#L1965)
  reads reinforcement request dates, requested/original counts and allowed-unit scope.
- [populateShiftChangeRequests](../old/SHF/src/bzq/shf/model/ShiftDataModel.java#L4674)
  reads time-change requests and counts approved candidates; candidate options
  are projected by
  [populateChangeRequestOptions](../old/SHF/src/bzq/shf/model/ShiftDataModel.java#L4919).
- [populateReduceRequest](../old/SHF/src/bzq/shf/model/ReduceDataModel.java#L68),
  [approved counts](../old/SHF/src/bzq/shf/model/ReduceDataModel.java#L616) and
  [candidate reads](../old/SHF/src/bzq/shf/model/ReduceDataModel.java#L668)
  distinguish request capacity from approved results.
  [checkTimeForReduceShift](../old/SHF/src/bzq/shf/model/ReduceDataModel.java#L386)
  uses a unit-configured lead-time parameter. No mutating approval/reduction
  code was executed or copied as a read.

The architect-owned [DTO](../apps/api/src/stub/staffing-contracts.ts) includes
synthetic string request ID, type, fixed unit, title, local interval, nullable
requested/approved/remaining counts, nullable deadline, explicit deadline/
freshness states and nullable text note. Candidate rows expose invented ID/name,
explicit current/stale/unknown freshness and nullable source timestamp/note.
No live eligibility, authority, assignment or real personal record is implied.

Clock remains frozen at `2026-10-13T08:00:00`. Capacity and deadline/freshness
facts are invented, not production parameter calculations. Zero remaining is
distinct from unknown/null; an approved count in a fixture is not approval
performed by this app. Current means current within the frozen scenario, not live.

### Implementation and Checks

- [Fixtures](../apps/api/src/stub/staffing-fixtures.ts) define five visible
  requests: available reinforcement, full/stale/elapsed time-change, reduction
  with empty candidates, unknown capacity/deadline/freshness, and a second time-
  change with stale candidates. Foreign-unit request/candidate fixtures are hidden.
- [Controller](../apps/api/src/stub/staffing.controller.ts) exposes:
  `GET /api/v1/staffing-requests?kind=all&limit=100`,
  `GET /api/v1/staffing-requests/{id}`, and
  `GET /api/v1/staffing-requests/{id}/candidates?limit=100`.
  Kind filtering, default 25/max 100, fixed team scope, uniform foreign/missing
  404 and explicit insufficient-page failure apply. Unsupported selectors and
  cursor input are rejected. No mutating route exists.
- [Client](../apps/web/src/app/staffing-api.ts) validates synthetic clock/markers,
  unit/context, exact capacity consistency and filtered kinds. Candidate scope
  and request identity must agree; unknown data is not converted to zero.
- [UI](../apps/web/src/app/staffing.ts) /
  [template](../apps/web/src/app/staffing.html) provides type filter, scan-oriented
  counts/status table, focus-managed detail, on-demand candidate reads and explicit
  empty/error/retry. Full capacity, elapsed deadline and stale candidates are
  labelled; no register/assign/approve/cancel controls exist. No new editable date
  field was introduced; displayed deadlines are read-only.
- [API tests](../apps/api/test/staffing.test.ts) and
  [UI tests](../apps/web/src/app/staffing.spec.ts) cover all types, scope,
  no writes, read immutability, counts/nulls, stale/unknown/empty candidates,
  literal note text, malformed/contradictory/wrong-context data, filter preservation
  and cancellation of old list/detail/candidate reads.

Full `npm run check` passed **80 backend + 72 Angular tests (152 total)**,
lint, strict types/templates and both builds. Initial bundle **431.23 kB**,
below unchanged 500 kB warning. The screen is an immediate deferred feature
with Hebrew loading/error feedback. Initial strict compilation exposed a fixture
freshness literal and nullable-capacity narrowing; proper explicit types/guards
were added and checks passed without casts or weakened assertions.

Browser checks used updated isolated API/UI ports 3110/4210 and a session proxy.
Five-request load, kind filter, zero/full versus unknown capacity, elapsed deadline,
stale/unknown candidates, literal note, empty reduction candidates, keyboard detail/
return focus, 1280/768/320 reflow and 200% resizing passed. Injected 503 retained
detail, displayed no fake candidates and recovered two scoped candidates on retry.
An unavailable shared page was replaced with a fresh self-contained browser check.
Temporary servers/proxy were cleaned up; existing user processes were preserved.

No Oracle or real staffing workflow ran. Candidate listing is not eligibility,
nor registration/approval evidence. Request/candidate freshness requires real
precondition revalidation before any future command. Staffing capacity/eligibility
previews, real business characterization and G4/G5/UAT/release remain pending.
Next candidate: separately approve staffing eligibility/capacity preview design,
or R09 read-only exceptions/reporting; do not infer a write approval.

## 27. Approved R08 Pure Staffing Eligibility and Capacity Preview

Task ID: SHF-R08-STAFFING-PREVIEW-STUB-20261014. Status: done for the explicitly
approved pure synthetic preview increment. Full R08 business parity, real policy,
authorization, atomic capacity and acceptance remain pending.

The user approved completing the demo with pure staffing eligibility/capacity
previews, no assignment or approval. Every result is a calculation only and
includes `previewOnly: true`, `saved: false`, `assigned: false`, `approved: false`.

### Source and Synthetic Boundaries

[Reinforcement apply](../old/SHF/src/bzq/shf/model/ShiftDataModel.java#L3307)
allocates a sequence and decrements capacity while inserting employee-day data.
Those effects are excluded. Time-change
[validateChangeRequest](../old/SHF/src/bzq/shf/model/ShiftDataModel.java#L4524)
checks interval/length constraints from unit parameters; reduction
[checkTimeForReduceShift](../old/SHF/src/bzq/shf/model/ReduceDataModel.java#L386)
checks configured lead time. Prior request/approved-count reads distinguish
capacity from successful actions. No legacy mutating path or query was executed.

`synthetic-staffing-policy-1` uses a frozen October 13 clock and fixed 120-minute
lead, with deadline equality allowed. These are demo choices, not verified live
parameters. Job/interval/duplicate-participation flags are resolved invented
facts, not full live matching or flexible time-change-range characterization.
Current request/candidate freshness and the exact scenario timestamp are required.
Stale/unknown facts are unknown, not eligible; known blockers take precedence.
Counts must be nonnegative exact integers with `remaining = requested - approved`.
Zero/full capacity, elapsed deadline and duplicate participation block.

Only a suitable-under-demo result has `capacityIfApplied`: requested unchanged,
approved hypothetically +1 and remaining hypothetically -1. Blocked/unknown
results return null, never negative or invented capacity. This is not a reserved
slot, assignment or precondition proof; repeated/concurrent hypothetical results
leave actual fixture counts unchanged. A future real command needs authorized
same-transaction revalidation and verified existing-schema concurrency/recovery.

### Implementation and Evidence

- [Shared DTO](../apps/api/src/stub/staffing-contracts.ts) adds isolated facts,
  capacity snapshots and explicitly unassigned/unapproved preview output.
- [Pure function](../apps/api/src/stub/staffing-preview.ts) calculates from
  supplied immutable facts using the shared strict wall-time parser. No I/O,
  ID allocation, workflow invocation or resource write occurs.
- Existing [fixtures](../apps/api/src/stub/staffing-fixtures.ts) preserve earlier
  cases, add visible populated reduction request `93000007`, and demonstrate
  duplicate candidate `staff-candidate-5` for time-change `93000005`. Six requests
  are now visible; empty reduction `93000003` and foreign request `93000006`
  retain their meanings.
- Existing [controller](../apps/api/src/stub/staffing.controller.ts) adds
  `POST /api/v1/staffing-requests/{id}/eligibility-previews` with exact body
  `{candidateId}` only. Request and candidate must both be in fixed demo scope.
  Foreign/missing resources agree on 404; submitted capacity/approval fields
  are rejected. No assignment/registration/approval route was added.
- Existing [client](../apps/web/src/app/staffing-api.ts) checks markers/context,
  before counts against the displayed request, outcome against blocker/unknown
  arrays, and exact conditional one-slot arithmetic. Saved/assigned/approved
  or contradictory results are rejected. Read-only capability remains usable
  when preview capability is absent or false, with explicit unavailable feedback.
- Existing [screen](../apps/web/src/app/staffing.ts) /
  [template](../apps/web/src/app/staffing.html) adds focus-managed per-candidate
  calculation and conditional counts, without mutating the existing request/
  candidate display. Candidate, card and filter refresh cancel pending previews.
- [Unit/API tests](../apps/api/test/staffing-preview.test.ts) and
  [UI tests](../apps/web/src/app/staffing-preview.spec.ts) verify all types,
  positive/full/unknown/stale/duplicate, exact last-slot/lead/deadline boundaries,
  before/after and concurrent immutability, both-resource scope, strict body,
  unassigned/unsaved guards, cancellation and failures.

Full `npm run check` passed **84 backend + 79 Angular tests (163 total)**,
lint, strict types/templates and builds. Initial bundle **431.23 kB** stays
under unchanged 500 kB warning. Existing staffing feature chunk owns the new
UI, rather than adding a separate screen framework.

Browser checks used updated isolated API/UI ports 3111/4211 and a session proxy.
Six-request list, hypothetical reinforcement/reduction capacity, full/expired
block, unknown context, duplicate block, unchanged table/counters, focus/return,
last-slot zero projection and stale candidate unknown passed. Injected 503 kept
detail/candidates and displayed no fake projection. 1280/768/320 page reflow and
200% text resizing passed. Temporary servers/proxy were cleaned up; existing
user processes were preserved.

No Oracle, live staffing/identity, assignment, registration, approval, cancellation
or partner action ran. Approved R08 demo scope is reviewable; full source-policy
coverage, actual freshness/atomic capacity, real G4/G5/UAT and release are NOT RUN.
Next candidate: separately approve R09 read-only exceptions/time-off or bounded
reporting stubs; no write approval is inferred.
Final UI labels/grammar were also retested. No test was weakened or excluded.

Browser checks used a new stub on loopback port 3102 and UI on 4202 through a
temporary session-only proxy, avoiding existing user servers. Five-row load,
overnight/local detail, four unknown fields, redaction, focus restoration,
effective-start filtering, 320/768/1280 CSS pixel page reflow and 200% text resize
passed. Initial shared-page checks were interrupted by a click timeout and an
unavailable page; self-contained fresh-page checks passed. Both temporary servers
and the temporary proxy were cleaned up afterward.

No Oracle call, real identity/data, write, partner, batch, schema or deployment
work occurred. Full Hebrew assistive-technology/UAT and live parity remain
NOT RUN. Review the expanded demonstration before choosing another capability.

## 17. Approved R05 Personal Messages Stub

Task ID: SHF-R05-MESSAGES-STUB-20261013. Status: done for approved synthetic
read-only messages API/UI; R05 employee/card features and real message reads
remain pending. This does not clear the R04 real parity/G3 gate.

The user explicitly approved a personal messages list/detail stub API and
Hebrew/RTL screen. Read-status mutations, deletion, offer acceptance, Oracle
access and trusted identity stay disabled.

Read-only legacy trace:

- The [catalog](SHF_SOURCE_CONTRACT_CATALOG.md#1-complete-struts-route-catalog)
  maps `/message/messages` to
  [MessagesAction.showMessages](../old/SHF/src/bzq/shf/actions/MessagesAction.java#L62).
- [MessageModel.getAllMessage](../old/SHF/src/bzq/shf/model/MessageModel.java#L46)
  selects recipient messages and then calls `updateToRead`: reading the legacy
  screen is not mutation-free. This hidden effect is intentionally excluded.
- [ReplaceMassageDao.select](../old/SHF/src/bzq/shf/dao/ReplaceMassageDao.java#L264)
  scopes employee, excludes deleted messages and sorts creation time descending.
  Source evidence does not establish actual database types/grants or live scope.

The sequential architect responsibility owns the
[minimal synthetic DTO](../apps/api/src/stub/message-contracts.ts): exact string
ID, `createdLocal`, `subject`, plain `text`, nullable `note`, boolean-or-null
`isRead`, and nullable message-type code. No recipient identifier or whole
legacy form is exposed. This is a demo contract, not a real schema/API baseline.

Implemented:

- [Fixtures](../apps/api/src/stub/message-fixtures.ts): three visible invented
  messages (unread/read/unknown), plus hidden foreign/deleted fixtures.
- Existing [stub controller](../apps/api/src/stub/stub.module.ts): capability,
  `GET /api/v1/me/messages` with bounded status/limit, and scoped detail.
  No SQL, writes, partner calls or real identity. Insufficient limit returns
  explicit unavailability; unsupported selectors/cursors are rejected.
- [UI client](../apps/web/src/app/messages-api.ts) /
  [screen](../apps/web/src/app/personal-messages.ts) /
  [template](../apps/web/src/app/personal-messages.html): same-origin synthetic
  reads, Hebrew status filter, explicit loading/empty/error/retry, safe text,
  focus-managed detail and no read-status changes.
- Existing duplicate response checks were extracted into
  [shared frontend guards](../apps/web/src/app/stub-response.ts), preserving
  existing shifts behavior.
- [API tests](../apps/api/test/stub-messages.test.ts) and
  [UI tests](../apps/web/src/app/personal-messages.spec.ts) verify recipient
  privacy, unchanged flags, safe text, filters, malformed responses, superseded
  reads and absent write/acceptance endpoints.

Executed evidence: `npm run check` passed lint, strict types/templates,
58 backend and 21 frontend tests (79 total), and both production builds.
An initial controller-method insertion error was corrected before API tests
passed. UI tests caught filter submit not wired through a form directive;
native submit handling was fixed and tests passed without weakening assertions.

Browser checks used updated isolated stub/UI ports 3103/4203 and a temporary
session-only proxy. Three-message load, unknown filter, unchanged unread status
after opening, literal HTML-like text, detail heading/return focus,
1280/768/320 CSS pixel reflow and 200% text resizing passed. Injected synthetic
empty and 503 responses were distinguished, and retry recovered the list.
The expected 503 resource warning is a test injection, not live Oracle evidence.
Temporary servers/proxy were cleaned up; existing user servers were preserved.

All responses retain explicit synthetic/unauthenticated markers and no-store
headers. Full accessibility/human UAT, real identity/Oracle message parity,
concurrency/write proof and release remain NOT RUN. Next milestone: review the
messages demo, then select an approved employee-card or operational read stub
increment; do not claim all R05 work complete.

## 18. Calendars and Approved R05 Employee Stub

Task ID: SHF-CALENDAR-EMPLOYEES-STUB-20261013. Status: done for calendars and
synthetic employee search/card only; broader R05 and real data remain pending.

The user requested calendar elements for relevant inputs and explicitly selected
the next read-only employee search/card stub API/UI increment. No real identity,
Oracle access, writes, schema, deployment or partner scope was approved.

### Calendar Controls

- [Calendar adapter](../apps/web/src/app/calendar.ts) and
  [tests](../apps/web/src/app/calendar.spec.ts): visible Material datepickers for
  both shift bounds, Hebrew locale/assistive labels, strict ISO parsing, leap/day
  validation and local-component date-only serialization. Invalid formatting
  fails explicitly; no UTC conversion of a selected local day.
- [Shift template](../apps/web/src/app/personal-shifts.html) and
  [screen](../apps/web/src/app/personal-shifts.ts): accessible calendar toggles
  while preserving inclusive end, maximum 31 days and half-open request semantics.
  Invalid input prevents the request and receives focus.

### Employee Evidence and Minimal Demo Contract

- [Catalog](SHF_SOURCE_CONTRACT_CATALOG.md#1-complete-struts-route-catalog)
  identifies employee search/card routes.
  [EmployeeDataAction](../old/SHF/src/bzq/shf/actions/EmployeeDataAction.java#L54)
  separates scoped search from self/card permission paths.
- [populateEmployeeList](../old/SHF/src/bzq/shf/model/EmployeeDataModel.java#L587)
  includes name/job/status/unit filters, a 500-row cap and allowed-unit scope;
  [populate](../old/SHF/src/bzq/shf/model/EmployeeDataModel.java#L736) reads a rich
  card by employee ID. These source observations do not prove database metadata
  or deployed authorization. Rich identity/address/contact fields are not copied.
- The architect responsibility owns the
  [demo DTO](../apps/api/src/stub/employee-contracts.ts): exact string ID,
  invented display name, synthetic unit ID/name and nullable job name only.
  Demo name/ID substring search is not claimed to reproduce legacy name-prefix
  or all employee filters.

### Implementation and Verification

- [Employee controller](../apps/api/src/stub/employees.controller.ts) /
  [fixtures](../apps/api/src/stub/employee-fixtures.ts): three visible team-A
  fixtures and an inaccessible team-B record. Bounded search length 80,
  limit default 25/max 100, fixed demo scope, minimized card and uniform denied/
  absent 404. No user-selected unit/actor, fake pagination or mutating endpoint.
- [UI client](../apps/web/src/app/employees-api.ts) /
  [screen](../apps/web/src/app/employees.ts) /
  [template](../apps/web/src/app/employees.html): Hebrew read-only search/card,
  long/mixed names, unknown job, synthetic labels, visible errors, preserved
  search, stale-request cancellation and focus behavior.
- Existing stub response/error transport was extracted into
  [shared HTTP helpers](../apps/api/src/stub/stub-http.ts) so employee endpoints
  reuse labels, redacted rejection logging and Problem Details.
- [API tests](../apps/api/test/stub-employees.test.ts) and
  [UI tests](../apps/web/src/app/employees.spec.ts) cover scoped/minimized data,
  exact IDs, bounds, search, privacy, safe text, failures and cancellation.

Full checks passed: 60 API + 31 Angular tests (91 total), lint, strict types/
templates and both production builds. Calendar-only tests also passed under
`Pacific/Auckland` and `America/Los_Angeles`. These are isolated runtime zones,
not approval of Oracle/JVM business-time interpretation.

The initial calendar build exceeded the unchanged 500 kB warning budget at
676.76 kB. Loading shifts/calendar immediately after the shell reduced it to
508.56 kB; also deferring the employee feature reduced the measured initial
bundle to **423.81 kB**. Budgets were not increased. Both immediate deferred
features have Hebrew loading/error states and shell tests render both chunks.
Relevant tests/builds passed after each adjustment.

Browser verification used isolated updated stub/UI ports 3104/4204 and a session
proxy. Calendar selection preserved ISO day/inclusive filtering; Hebrew month
navigation, keyboard open/Escape/focus return and 296px RTL popup at 320px passed.
Employee keyboard search/card, exact ID, mixed name, unknown job, empty/failure/
retry, 1280/768/320 reflow and 200% text resizing passed. Initial pointer/shared-
page interruption and a premature month-change assertion were corrected with
fresh self-contained checks and condition-based calendar waits.

Temporary servers/proxy were cleaned up; existing user servers were preserved.
No database or partner request, business mutation, production deployment or real
identity occurred. Full Hebrew assistive-technology/UAT and real employee parity
remain NOT RUN. R05 skills/events/education and all real connected gates remain
pending; the next read-only stub capability needs user selection.

## 19. Oracle Connectivity Retry, 2026-10-14

Task ID: SHF-ORACLE-CONNECTIVITY-20261014. Status: blocked by host resolution.

The user requested a real connection retry and confirmed service `SHIFTER` at
`CTIDBT_WFMT:1521`. The operational/shared classification is retained. Scope was
one constant SELECT connectivity probe only: no metadata, business rows, writes
or schema changes. The user explicitly approved replacing the existing
credential-bearing VS Code task with a secure prompt, without retaining or
reproducing its secret.

Changed: [prompt script](../scripts/Invoke-ShfOracleMetadata.ps1) adds
`-ConnectivityOnly`; [VS Code task](../.vscode/tasks.json) uses process invocation,
external password entry and the confirmed host/port/service. Existing metadata
mode is unchanged unless the connectivity-only switch is supplied. Environment
values are restored after the command. No secret is embedded in the new task.

Executed checks: script syntax and credential-free task assertions passed,
the API build passed, and seven existing diagnostic-orchestrator tests passed.
The one live connectivity attempt then returned `ORACLE_READ_FAILED` /
**NJS-530 (host not found)** and exit 1. No listener connection, authentication,
metadata SELECT or business-data read succeeded. The supplied credentials and
service name are not verified merely because they were configured.

Blocker owner: DBA/network platform. Required input: reachable FQDN/IP for the
approved server and any required corporate VPN/DNS context. Do not guess domains,
scan hosts, change local DNS/hosts, change credentials or retry automatically.
Keep the existing explicitly synthetic application mode unchanged. Credential
rotation for secrets previously shared/stored belongs to the credential owner;
this task did not rotate passwords or edit history.

## 20. Explicit Full-Host Retry, 2026-10-14

Task ID: SHF-ORACLE-FULLHOST-20261014. Status: blocked by host resolution.

The user explicitly requested `CTIDBT_WFMT.host`; the previously confirmed port
1521 and service SHIFTER were retained. Only the credential-free task's host
was changed. Task target/scope assertions and prompt-script syntax passed.
One secure-prompt connectivity-only attempt at 08:59 returned
`ORACLE_READ_FAILED` / **NJS-530 (host not found)** and exit 1.

The listener and authentication were not reached; neither credentials nor
service are runtime-verified. No metadata/business read, write, schema action,
host scan or automatic retry was performed. Existing stub application mode is
unchanged. DBA/network owner must supply a resolvable/reachable FQDN/IP or the
required corporate VPN/DNS context. Passwords are not stored in the task or logs.

## 21. Approved R05 Employee Child Stub Views

Task ID: SHF-R05-EMPLOYEE-CHILDREN-20261014. Status: done for the approved
synthetic skills/events/education increment. R05 real data, authorization,
legacy parity and human acceptance remain blocked; G3 is not cleared.

The user explicitly selected skills/events/education demo views after Oracle
host resolution failed. No Oracle retries, business rows, writes, partner,
schema, batch or deployment actions are authorized by this increment.

Source evidence:

- [EmployeeDataAction](../old/SHF/src/bzq/shf/actions/EmployeeDataAction.java#L134)
  routes employee events to `populateEvents`, skills to `populateSkills(-1)`,
  and education to a view container.
- [populateSkills](../old/SHF/src/bzq/shf/model/EmployeeDataModel.java#L239)
  selects active skills, optionally language-filtered.
  [populateEvents](../old/SHF/src/bzq/shf/model/EmployeeDataModel.java#L291)
  combines attendance reasons and other employee events.
- [Education JSP](../old/SHFWeb/WebContent/jsp/employeeCard/employee_education.jsp)
  hosts skills/courses; `populateCourses` is an empty placeholder. Therefore the
  education demo is explicitly invented UI data, not a recovered live contract
  or permission to implement learning/courses.

Implemented:

- Architect-owned [demo DTOs](../apps/api/src/stub/employee-contracts.ts) add
  section names and record ID/label/nullable detail/date. No rich personal data.
- [Child fixtures](../apps/api/src/stub/employee-records.ts) provide populated,
  empty and unknown cases for existing demo employees.
- Existing [controller](../apps/api/src/stub/employees.controller.ts) exposes
  scoped GET-only skills/events/education endpoints, reusing the employee
  gate and fixed team A scope. Responses include employee/section context,
  synthetic/no-store markers, bounded limit and explicit unsupported pagination.
- Existing [client](../apps/web/src/app/employees-api.ts) verifies employee ID,
  section, row shapes and synthetic metadata.
  [Card UI](../apps/web/src/app/employees.html) adds on-demand labelled sections,
  pressed-state buttons, loading/error/retry/empty/unknown feedback and literal
  text. Reads are cancelled on section change, card replacement/close or search.
- [API tests](../apps/api/test/stub-employee-records.test.ts) and existing
  [UI tests](../apps/web/src/app/employees.spec.ts) cover all three sections,
  recipient scope, minimized records, list immutability, absent writes,
  wrong-employee response rejection, cancellation, empty/error/retry and safe text.

Verification: full `npm run check` passed 62 backend + 34 Angular tests
(96 total), lint, strict types/templates and both builds. The initial production
bundle remains 423.81 kB under unchanged warning limits. The initial existing
close-button test clicked the newly first section button; its locator was
corrected to the close action, then the same acceptance passed on retest.

Browser checks used isolated updated API/UI ports 3105/4205 and a session proxy:
all three sections, literal HTML-like event text, explicit education disclaimer,
empty and unknown fixtures, keyboard selection, close focus return,
1280/768/320 reflow and 200% resizing passed. An injected synthetic 503 retained
the card, cleared stale section rows and recovered two events on retry. Temporary
servers/proxy were cleaned up; existing user processes were preserved.

R05 synthetic messages, employee search/card and child views now provide a
reviewable demo. This does not mean real R05 completion or approved production
permissions. Next candidate: separately approve R06 operational schedule/attendance
read stubs after reviewing this increment. Oracle resolution remains DBA/network
owned; no live check was attempted here.

## 22. Progress Report and Approved R06 Operational Demo

Task ID: SHF-R06-OPERATIONAL-STUB-20261014. Status: done for the explicitly
approved synthetic range-read schedule/attendance increment. Full real R06/G3,
identity, Oracle parity, UAT and release remain pending.

The user requested a progress report and approved operational schedule/attendance
stub APIs with Hebrew/RTL read-only views. The current progress snapshot is saved
near the start of this plan. Approval excludes arrival/departure registration,
correction, Oracle access and real organizational authorization.

### Evidence and Demo Contract

[AttendanceDataModel.populateAttendance](../old/SHF/src/bzq/shf/model/AttendanceDataModel.java#L55)
selects stage arrival, station arrival/exit, late/missing fields and joins
attendance by employee-day ID. The
[list projection](../old/SHF/src/bzq/shf/model/AttendanceDataModel.java#L365)
retains baseline/override and attendance fields.
[Current-shift SQL](../old/SHF/src/bzq/shf/model/ShiftDataModel.java#L987)
uses effective ownership/day type and an instant interval. These source references
do not establish runtime Oracle metadata, identity or deployed behavior.

The architect-owned [R06 demo contracts](../apps/api/src/stub/operational-contracts.ts)
reuse the existing `PersonalShiftItem` with an invented employee display name.
Attendance adds nullable local stage/station-arrival/exit strings, nullable exact
nonnegative integer late minutes and nullable synthetic missing reason.
Zero is not null; missing time is labelled not recorded in the demo, not inferred
absence. No actual duration/payroll/state transition is calculated.

Endpoints:

- `GET /api/v1/shifts?from=...&toExclusive=...&limit=100`
- `GET /api/v1/attendance?from=...&toExclusive=...&limit=100`

Both use fixed synthetic team A, half-open effective-start calendar bounds,
maximum 31 days, limit default 25/max 100 and deterministic start/ID order.
Client actor/unit/site overrides and cursor input are not supported. Responses
include synthetic/unauthenticated markers, `unitId`, items, null next cursor,
fresh read timestamp and display business zone. Oversized matching pages fail
explicitly instead of fake truncation. Read time is not a verified historical
snapshot or Oracle SCN. Current-instant queries and configurable unit/site filters
are not claimed implemented by this range-only demo.

### Implementation and Checks

- [Fixtures](../apps/api/src/stub/operational-fixtures.ts) reuse the existing
  pure effective projection per fixed team employee. Seven permitted shifts
  include transferred ownership and overnight work. A synthetic outside-team
  row and excluded shift remain absent. Baselines stay redacted.
- [Controller](../apps/api/src/stub/operational.controller.ts) exposes only
  approved reads with existing stub transport/errors. Attendance values are
  explicit fixtures; undefined fixture mappings fail rather than invent defaults.
- [UI client](../apps/web/src/app/operational-api.ts) validates synthetic/unit/
  employee scope, shared item shapes and actual nullable types; it rejects
  baseline leakage or malformed late-minute values.
- [UI](../apps/web/src/app/operational.ts) /
  [template](../apps/web/src/app/operational.html) provides schedule/attendance
  mode buttons, scan-oriented planned/actual table, inline focus-managed detail,
  calendars, empty/loading/error/retry and freshness. There are no registration,
  correction or other business commands.
- Calendar range validation was extracted into the existing
  [calendar helper](../apps/web/src/app/calendar.ts) for both personal/operational
  views, preserving inclusive-end semantics. Shared shift guards were reused,
  not replaced with a second business projection.
- [API tests](../apps/api/test/stub-operational.test.ts) and
  [UI tests](../apps/web/src/app/operational.spec.ts) cover mode cancellation,
  scope, planned/actual parity, zero/null/missing values, overnight exit, bounds,
  empty/error cases and absent writes. Calendar regression covers the shared range.

`npm run check` passed: **64 backend + 41 frontend tests (105 total)**,
lint, strict types/templates and both production builds. Initial production
bundle **424.28 kB**, below unchanged 500 kB warning budget. The operational
feature is an immediate deferred chunk with Hebrew loading/error states.

Browser checks used isolated updated ports 3106/4206 and a session proxy.
Seven-row schedule/attendance, zero versus unknown lateness, next-day actual
departure, detail/return focus, 1280/768/320 page reflow, 200% text resizing,
single-day three-row filtering, calendar keyboard dismissal, empty results and
injected 503/retry passed. An initial Escape assertion ran before calendar focus
was ready; retry used a focused calendar-day control with condition-based waits
and passed. The injected 503 is synthetic test evidence, not Oracle failure.
Temporary servers/proxy were cleaned up; existing user servers were preserved.

No Oracle connection, metadata/business query, write, real identity or production
operation occurred. Next candidate is R07 pure preview/break design and synthetic
fixtures, only after a separate user scope/contract decision. Do not mark the
real business gates complete based on this demonstration.

Final presentation retest kept timestamps/IDs unbroken inside the labelled
horizontal table region rather than wrapping technical values mid-number.
At 320px, the 1,223px table stayed inside its 273px scroll region with no page
overflow. The 41 UI tests, full lint and frontend build passed again afterward;
the initial bundle remains 424.28 kB. Scoped documentation validation passed
1,152 local links and 778 source-line references. A progress snapshot link typo
was caught by the broader README anchor check, corrected and passed on retest.
