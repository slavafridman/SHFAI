# Plan: SHF AI-Agent Development Directives

Task ID: SHF-DEV-PLAN-20261013
Revision: 1.1 AI execution baseline, 2026-10-13
Status: review. The earlier human-team calendar estimate is superseded. Architecture/API/UI/release approvals remain pending.
Publication target: d:/AIProjects/SHFAI/docs/SHF_PROJECT_DIRECTIVES.md, ordinary project documentation. This repository file does not exist and is not written in Plan mode. This document is session planning memory, not repository publication.

## 1. Confirmed Scope And Evidence

### Current Progress Snapshot — 2026-10-14, After Unverified SSO Simulation

| Round | Current status | Evidence / next gate |
| --- | --- | --- |
| R01 | Review / partial | Source-backed proposals and separately approved demo contracts; full business architecture/API/UI approval pending. |
| R02 | Local foundation working / partial | Reproducible app commands, tests, lint, strict types and builds; CI, deployment and complete contract generation pending. |
| R03 | Thick connectivity/metadata verified; isolated raw-row mapper tested / round partial | 88 columns observed,33 mapped offline; approved cancellation/type/owner policies implemented in pure mapper. Real fetch/identity/cardinality/Oracle DATE semantics and business read scope remain gated. |
| R04 | Synthetic demo done | Personal shifts, calendars, details, overnight/null/reassignment cases; no real Oracle parity or G3 acceptance. |
| R05 | Approved synthetic demo done | Messages, employee search/card and skills/events/education views; education explicitly invented, no writes or real employee data. |
| R06 | Approved synthetic range-read demo done | Fixed-team schedule/attendance table/detail and calendars; current-instant/live reads, real scope and parity remain pending. No arrival/departure registration or corrections. |
| R07 | Approved break and shift/split preview demos done / round partial | Pure synthetic calculations and scoped reads; full real policy, attendance/offer eligibility and zero-effect Oracle proof pending. |
| R08 | Approved replacement and staffing read/preview demos done / round partial | Synthetic outcomes and conditional one-slot counts; full real policy, freshness/precondition/atomic-capacity evidence and acceptance remain pending. |
| R09 | Approved exceptions/time-off and bounded report demos done / round partial | Full-day/timed/provenance/history views and exact staffing/forecast minutes; real data/parity, activity weights and acceptance remain pending. |
| R10 | Approved synthetic building/job/allowlisted-parameter reads done / round partial | Scoped directories and explicit zero/unknown/default provenance; CTI/learning, deferred-producer register and real permissions/mappings remain pending. |
| R11 | Bounded test remark candidate selected / blocked | User identifies target as test and selects day1255 REMARK; existing corporate SSO/gateway trust and per-command concurrency/audit/schema evidence unresolved. No business API/write enabled. |
| R12–R13 | Pending | Full security/load/assistive-technology/UAT/recovery/release evidence and accountable sign-off pending. |

Latest completed check: 126 backend + 116 frontend tests (242 total),
lint/types/builds pass; initial UI bundle 433.73 kB. Synthetic browser checks
cover responsive RTL, focus, errors and text resizing, not full AA certification.
The 45–90 active-hour estimate remains provisional; no elapsed delivery date or
percentage-complete claim is inferred from a working demonstration.

Oracle business reads remain paused; bounded Thick connectivity passed.
Required owners: DBA for additional metadata/data scope and valid bounded Net
configuration; SEC for trusted identity/employment/scope policy;
user/ARC for real API/UI baselines; business/QA/operations for UAT and release.
This snapshot supersedes earlier no-scaffold/no-runtime wording as current status;
older sections remain historical execution evidence.

- Node.js/TypeScript backend; supported modern Angular, Material/CDK/Material 3, HTML/CSS; Hebrew/RTL and Hebrew accessibility names.
- Oracle Database 11.2.0.4.0 is runtime-verified, superseding the earlier user-declared 21c target. Explicit opt-in Thick mode/Client19.3 connectivity passed; Thin remains the default for other approved targets, with no fallback. Existing schema remains unchanged: no DDL/migrations/new tables, columns, indexes, sequences, triggers or procedures and no field/status overloading.
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
- DBA/platform: Oracle11.2.0.4.0/Client19.3 patch/support review, metadata/PLSQL/grants, scoped data/test access and competing-writer behavior; bounded connectivity is already verified, not business/schema access.
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

## 28. Approved R09 Read-Only Exceptions and Time-Off Demo

Task ID: SHF-R09-EXCEPTIONS-STUB-20261014. Status: done for approved synthetic
exceptions/time-off list/detail increment. R09 reporting, real mapping/parity,
authorization and human acceptance remain pending.

The user explicitly approved full-day/timed records, original/changed/cancelled
provenance and unknown values. Cancellation, remark update, Oracle access,
report publication and partner requests remain disabled.

### Source and Explicit Interval Contract

[EmployeeDataModel.populateExceptions](../old/SHF/src/bzq/shf/model/EmployeeDataModel.java#L1345)
reads timed exception rows and full-day employee-day rows separately, scopes
effective employee ownership and excludes deleted/cancelled entries. Full-day
rows use business date/date+1 and a legacy nominal duration. The
[ExceptionDataModel list](../old/SHF/src/bzq/shf/model/ExceptionDataModel.java#L504)
scopes employee/unit, timed ranges and cancellation. No cancellation/remark
method was executed or wrapped as a read.

The architect-owned [DTO](../apps/api/src/stub/exception-contracts.ts) makes
intervals discriminated: full-day business date with null local start/end, or
timed local start/end with null business date. Full-day does not mean a verified
24-hour UTC duration; timed intervals are half-open. Filter semantics are the
full-day business date or timed-start date within `[from, toExclusive)`, not
arbitrary overlap. Overnight end is preserved.

Records separate category, status, baseline/override provenance, original interval/
availability and nullable reason/remark/cancellation reason. Original data may
be unavailable/redacted and never reveals the prior owner. `time-off` category
is a synthetic mapping, not verified Oracle day/type metadata.

### Implementation and Evidence

- [Fixtures](../apps/api/src/stub/exception-fixtures.ts) include five active team
  records and one optional cancelled-history record, with full-day, changed timed,
  overnight, null fields and redacted original planning. Foreign-unit data is
  excluded. Fixtures are fresh/immutable and contain no real personal records.
- [Controller](../apps/api/src/stub/exceptions.controller.ts) exposes
  `GET /api/v1/exceptions`,
  `GET /api/v1/exceptions/{id}`, and
  `GET /api/v1/employees/{id}/time-off`.
  List reads require bounded calendar dates (maximum 31 days), limit default
  25/max 100, optional kind and explicit `includeCancelled=true`. Active-only
  is default, consistent with observed exclusion; optional history is an approved
  demo extension, not claimed legacy parity. Detail/history reads cause no write.
  Foreign/missing record/employee responses agree; unsupported scope/cursor
  selectors rejected and incomplete pages fail explicitly.
- [Client](../apps/web/src/app/exceptions-api.ts) reuses existing employee scope
  and date helpers, verifies interval discriminants and dates, range/kind/status/
  employee/category context, synthetic markers and redaction consistency.
- [UI](../apps/web/src/app/exceptions.ts) /
  [template](../apps/web/src/app/exceptions.html) shows Hebrew calendars, interval
  and history filters, employee time-off mode, original/current detail, explicit
  null/empty/error/retry, cancelled-not-active labels and focus return. New
  mode/filter reads cancel old list/detail work; there are no mutation controls.
- [API tests](../apps/api/test/exceptions.test.ts) and
  [UI tests](../apps/web/src/app/exceptions.spec.ts) prove date-only full-day
  shape, timed/overnight start inclusion, original/redacted/history/null behavior,
  scope, malformed/unmarked/filter-context rejection, read immutability and
  absent cancellation/remark/write endpoints.

Full `npm run check` passed **87 API + 86 Angular tests (173 total)**,
lint, strict types/templates and both production builds. Initial UI bundle
**431.70 kB** stays under unchanged 500 kB warning. The view is an immediate
deferred chunk with explicit Hebrew loading/error feedback.

Browser verification used updated isolated ports 3112/4212 and a session proxy.
Five active/six history rows, date-only full-day, distinct changed/original
planning, redacted prior owner, unknown reason, literal remark text, cancelled-
not-active detail, calendar keyboard, employee-scoped overnight time-off,
empty employee and injected 503/date-retention/retry passed. Detail/return
focus, 1280/768/320 reflow and 200% resizing passed. Temporary servers/proxy
were cleaned up; existing user processes were preserved.

No Oracle/business data, cancellation, remark update, report publication,
broker/batch or partner action occurred. Real category/type/schema/permission/
timezone mapping and business acceptance remain NOT RUN. Next candidate:
separately approve bounded synthetic reporting/forecast contract and reads to
continue R09; do not infer an export producer, storage or write permission.
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

## 29. Approved R09 Bounded Staffing Versus Forecast Report

Task ID: SHF-R09-STAFFING-REPORT-STUB-20261014. Status: done for the explicitly
approved synthetic read-only report. R09 real mapping/parity and acceptance
remain pending. Oracle, exports, BI publication, batch producers and writes
were explicitly excluded and remain disabled.

### Evidence and Deliberate Metric

Read-only source evidence includes
[partial break deductions](../old/SHF/src/bzq/shf/model/ForecastModel.java#L1330),
[any-overlap headcount paths](../old/SHF/src/bzq/shf/model/ForecastModel.java#L1806),
and [modified/exception buckets](../old/SHF/src/bzq/shf/model/ForecastModel.java#L2170).
These paths do not establish universal legacy parity or deployed behavior.
The approved demo deliberately calculates exact integer staff-minutes instead
of crediting a whole person for every partly overlapping bucket.

Within each half-open 15-minute bucket, merge shifts per permitted employee to
avoid double counting. Clip the union of selected breaks/exceptions to that
employee's shift union and deduct it once. Modified inactive/cancelled shifts
are omitted. Baseline and modified projections are separate. Equivalent
headcount is available minutes / 15, rounded to two decimals for display only;
totals never sum rounded values. No activity weights or actual/payroll inference.

### Contract and Implementation

```text
GET /api/v1/reports/staffing-forecast
  ?fromLocal=2026-10-14T08:00:00
  &toExclusiveLocal=2026-10-14T10:00:00
  &includeBreaks=true&includeExceptions=true
```

Only these four fields are accepted; deduction flags default true. Strict local
minute strings, quarter-hour boundaries and a 15–240 minute window limit output
to 16 rows. Closed synthetic staffing coverage is October 14, 2026 00:00 through
October 15 02:00. Outside coverage returns 503 `REPORT_SOURCE_UNAVAILABLE`,
not zero staff. Bad query returns 400 `INVALID_REPORT_QUERY`; invalid source or
unsafe integer arithmetic returns 503 `REPORT_SOURCE_INVALID`.

Version `synthetic-report-source-1` covers three invented team-A employees;
foreign-team rows are excluded and employee IDs/schedules are not exposed.
Synthetic/unauthenticated body markers, source header and no-store remain
mandatory. Missing forecast is null, distinct from explicit zero demand.
Comparison totals include known-forecast buckets only; full-window staffing
totals retain all buckets. All-missing demand has no comparison summary.

- [Contracts](../apps/api/src/stub/report-contracts.ts),
  [fixtures](../apps/api/src/stub/report-fixtures.ts),
  [calculator](../apps/api/src/stub/report-calculation.ts) and
  [GET controller](../apps/api/src/stub/reports.controller.ts) implement the
  bounded aggregate without writes, reservations or allocated operation IDs.
- [Client](../apps/web/src/app/reports-api.ts) verifies source/scope, query echo,
  safe integer fields, contiguous quarter coverage and all recomputed totals.
- [Screen](../apps/web/src/app/reports.ts) /
  [template](../apps/web/src/app/reports.html) provides two Hebrew calendars,
  time/checkbox filters, semantic table, provenance, precise summaries and
  loading/error/retry. Superseding reads cancel earlier work; failures clear
  stale data but retain dates. Invalid inputs focus their associated field.
- Both sides deliberately reuse the existing portable
  [wall-minute helper](../apps/api/src/personal-shifts/wall-time.ts). Its browser
  import has no Node I/O/dependencies and does not turn wall minutes into real
  Oracle instants or DST-aware paid duration.

### Executed Verification

[API tests](../apps/api/test/report-calculation.test.ts) cover exact partial
overlap, union deductions, duplicate employee shifts, full-day unavailability,
flags, totals, midnight, bounds, unsafe source arithmetic and immutable GET.
[UI tests](../apps/web/src/app/reports.spec.ts) cover capability gating, seven
minutes / 0.47 display, null versus zero, all-missing comparison, deduction
filters, wrong query/scope/order/coverage/totals/types, invalid date/quarter/
four-hour bounds, unmarked responses, cancellation and error retention.

Full `npm run check` passed **92 backend + 93 frontend tests (185 total)**,
lint, strict types/templates and both builds. Final strengthened UI guard/input
tests were retested separately: seven report tests and full lint passed.
Initial production bundle **432.35 kB**, below unchanged 500 kB warning.
Reporting is the ninth immediate deferred feature with explicit loading/error.

Default 08:00–10:00 yields first modified interval exactly seven minutes;
baseline gross/available 240/225, modified 202/187. Seven known and one missing
forecast bucket yield known demand 210, known baseline/modified 195/157 and
known gaps -15/-53. Both deductions off yields 240/202 available minutes.
23:00–01:00 yields 120 available minutes and zero known gap. 18:00–19:00 has
unknown forecast throughout, not zero demand.

Browser checks on isolated ports 3113/4213 verified those values, filters,
overnight and all-missing ranges, coverage errors, injected 503/date retention/
retry, invalid-time focus, calendar Escape/focus return, labelled keyboard
table region, 320/768/1280 reflow and 200% text resizing. Initial UI responsiveness
probe preceded dev compilation; retry after startup confirmed HTTP 200 for
API/UI/proxy, synthetic source and no-store. Screenshot inspection performed.
Temporary servers and named session proxy were removed; user processes and
unrelated Oracle application work were preserved.

Current-project design validation passed 1,161 local links and 780 source-line
references. Separate README/plan checks passed 230 local links and 46 fragments,
including the updated progress anchor. `git diff --check` passed.

No Oracle or business-data read, export, BI/batch execution, schema change,
partner call, deployment or write occurred. Real forecast/staff mapping,
weights/timezone rules, identity, manual Hebrew assistive technology, UAT and
release are NOT RUN. Next candidate: separately approve R10 existing-result/
administrative read-only scope; no producer or command permission is inferred.

## 30. Approved R10 Synthetic Building Directory

Task ID: SHF-R10-BUILDINGS-STUB-20261014. Status: done for the approved
synthetic read-only building list/detail increment; R10 remains partial.
The user explicitly approved fixed demo-unit scope, name/address/capacity,
Hebrew/RTL presentation and tests. Oracle, elevated real permissions,
add/update/delete, team reassignment, dispatch and batch remain excluded.

### Source Evidence and Intentional Differences

The [catalog route](SHF_SOURCE_CONTRACT_CATALOG.md#1-complete-struts-route-catalog)
maps `/admin/manageBuildings` to
[ManageBuildingsAction](../old/SHF/src/bzq/shf/actions/ManageBuildingsAction.java#L34).
Its `view` branch calls
[getAllBuildings](../old/SHF/src/bzq/shf/model/BuildingModel.java#L40), which reads
`SHIFTER.shf_building` constrained to allowed units. The
[form mapping](../old/SHF/src/bzq/shf/forms/BuildingForm.java#L22) identifies
ID/name/unit/address/seat count; physical Oracle metadata is unverified.
The legacy [detail lookup](../old/SHF/src/bzq/shf/model/BuildingModel.java#L81)
filters only by ID. The explicitly approved demo corrects that scope omission:
both reads enforce the same fixed unit and foreign/missing IDs share a 404.
Legacy add/update/delete and team-building assignment are not invoked.

Legacy capacity is a primitive Java integer. The demo deliberately preserves
null as unknown rather than inventing zero; real null/mapping behavior is still
unverified. String IDs remain lossless. The 38-digit ID, 80-character query and
safe nonnegative capacity guards are demo input contracts, not physical column
precision evidence. Addresses and all fixture labels are invented.

### Contract and Implementation

```text
GET /api/v1/buildings?search=&limit=100
GET /api/v1/buildings/94000001
```

List accepts only `search` (ID/name, at most 80 characters, trim/lowercase
matching) and `limit` (default 25, maximum 100). A valid unmatched search is
empty; insufficient limit returns 503 `STUB_PAGINATION_UNAVAILABLE` rather than
silently truncating. Unknown scope/cursor or invalid filters return 400.
Detail accepts no query fields; invalid ID returns 400 and foreign/missing ID
returns identical 404 `BUILDING_NOT_FOUND`.

DTO: string ID/name, fixed demo orgUnit, nullable address and nullable safe
nonnegative integer seatCapacity. Synthetic/unauthenticated marker, no-store
and source header are retained. Read timestamps are technical provenance,
not Oracle SCNs, historical snapshots, occupancy or available-seat measurements.
`buildings.read` is enabled only in the opt-in stub; write is false. This is
not real authentication, elevated authorization or a production admin screen.

- [DTO](../apps/api/src/stub/building-contracts.ts),
  [fixtures](../apps/api/src/stub/building-fixtures.ts) and
  [controller](../apps/api/src/stub/buildings.controller.ts): three visible
  records with capacities 72/0/null; a fourth foreign record stays hidden.
- [Client](../apps/web/src/app/buildings-api.ts): markers, scope, ID/shape,
  nullable fields, safe capacity, duplicate IDs, query matching and unsupported
  item-field leakage are checked before display.
- [Screen](../apps/web/src/app/buildings.ts) /
  [template](../apps/web/src/app/buildings.html): typed reactive search,
  semantic table, literal address text, null/empty/error/retry, read timestamps
  and focus-managed detail. List refresh cancels list/detail work; detail
  failure keeps the list and search. No date-edit fields require calendars.
- The shell adds a tenth immediate deferred feature with explicit Hebrew
  loading/error states, retaining the initial bundle budget.

### Executed Verification and Limits

[Three API tests](../apps/api/test/buildings.test.ts) passed scoped list/detail
and uniform foreign/missing errors, synthetic/no-store, ID/name query bounds,
empty/insufficient-limit cases, read immutability, absent mutation routes and
disabled real-mode routes.
[Seven UI tests](../apps/web/src/app/buildings.spec.ts) plus shell tests passed
capability gating, zero/unknown, literal text/focus return, normalized/empty
search, unsafe/malformed/scope/query/duplicate rejection, cancellation,
80-character bounds, wrong detail ID and failures/retries.
The first UI check caught a missing reactive form binding: search submissions
did not run. Wiring the existing FormGroup pattern fixed it; the same ten
focused UI/shell tests passed on retest, without weakening assertions.

Full `npm run check` passed **95 backend + 100 frontend tests (195 total)**,
lint, strict types/templates and both builds. Initial UI bundle **432.73 kB**
is below the unchanged 500 kB warning. No dependencies were changed.

Isolated ports 3114/4214 returned HTTP 200 through the synthetic/no-store proxy.
Browser checks passed three rows, capacities 72/0/unknown, literal HTML-like
address, detail/return focus, normalized search, unknown detail, empty and
stale-detail clearing, injected list/detail 503 retention/retry, keyboard row
action, 320/768/1280 reflow and 200% text resize. At 320px the feature remained
273px wide with no feature/page overflow; mobile screenshot inspected. The
previously shared browser page was unavailable; a fresh page passed the same
checks. Own servers and named session proxy were stopped/removed afterward.

Scoped design validation passed 1,164 local links and 782 source-line
references. Separate README/plan checks passed 249 links and 52 fragments;
updated progress and execution anchors resolved. `git diff --check` passed.

No Oracle, real building/address data, schema change, mutation, reassignment,
partner/dispatch, producer/batch or deployment occurred. Physical metadata,
real elevated identity/scope, manual Hebrew assistive technology, UAT and
release are NOT RUN. Next candidate: separately approve one R10 read-only
job/parameter or existing-result view; no wider admin/producer permission
is inferred.

## 31. Approved R10 Synthetic Internal Job Directory

Task ID: SHF-R10-INTERNAL-JOBS-STUB-20261014. Status: done for the explicitly
approved synthetic read-only job directory; R10 remains partial. The user
approved ID/name/status filters, list/detail, fixed unit, active/inactive/unknown
states, group code including zero/unknown, Hebrew/RTL UI and tests. Oracle,
edits, group assignment, cache reload, dispatch and batch remain excluded.

### Source Evidence and Unverified Mapping

The [catalog route](SHF_SOURCE_CONTRACT_CATALOG.md#1-complete-struts-route-catalog)
maps `/admin/manageInnerJobs` to
[SystemAdminAction](../old/SHF/src/bzq/shf/actions/SystemAdminAction.java#L263).
The `view` branch reads the cached `innerJobCode` table and filters entries
against allowed units. The `viewUpdate` branch resolves code through the
[cached lookup](../old/SHF/src/bzq/shf/utils/SHFTableUtils.java#L285), which has no
unit predicate; the new demo enforces scope on both list and detail. Maintenance
branches call add/update/delete and table reload; none are implemented or run.
The [bean mapping](../old/SHF/src/bzq/shf/bean/InnerJobBean.java#L10) identifies
unit/active/group fields with primitive integer active/group properties.
[Group reads](../old/SHF/src/bzq/shf/model/SystemAdminModel.java#L932) group cached
jobs by unit and group ID; the demo displays codes only, not assignment or
equivalence/eligibility rules.

Actual Oracle metadata, active-code encoding, cache load/reload freshness and
real elevated authorization are unverified. The mapped JSP was not located as
a loose file in the checked legacy source tree; no archive was opened or legacy
application executed. This is not a recovered visual/parity claim. Nullable
booleans/groups and the status search are explicitly approved synthetic
contracts, not inferred physical column mappings. Group zero stays a code;
neither a group nor active status proves compatibility, availability or skill.

### Contract and Implementation

```text
GET /api/v1/internal-jobs?search=&status=all&limit=100
GET /api/v1/internal-jobs/95000001
```

List accepts only search (ID/name, maximum 80 characters, trim/lowercase),
status (`all`, `active`, `inactive`, `unknown`, default all) and limit (default
25/max 100). Known false matches inactive only; null matches unknown only.
Valid unmatched combinations return empty. Bad query/status/ID is 400;
insufficient limit is 503 `STUB_PAGINATION_UNAVAILABLE`, not silent truncation.
Detail rejects all query fields and gives identical 404
`INTERNAL_JOB_NOT_FOUND` for foreign and missing IDs.

DTO: lossless positive decimal ID string, name, fixed orgUnit, nullable boolean
active, nullable canonical nonnegative decimal groupCode string. Zero is `'0'`,
not null. Code/ID bounds are demo contracts, not physical Oracle precision.
Version `synthetic-job-catalog-1` and technical read timestamp are explicit
synthetic provenance, not legacy cache refresh time, SCN or live data.
Responses retain synthetic/unauthenticated markers, source header and no-store.
`internalJobs.read` is enabled only in the opt-in stub; write is false.

- [Contract](../apps/api/src/stub/internal-job-contracts.ts) shares pure status
  matching/version between [controller](../apps/api/src/stub/internal-jobs.controller.ts)
  and [client](../apps/web/src/app/internal-jobs-api.ts), without Node I/O or
  runtime fixture imports in the browser.
- [Fixtures](../apps/api/src/stub/internal-job-fixtures.ts) include active group
  12, inactive group 0, unknown status/group with lossless ID
  `9007199254740997`, and one hidden foreign job. HTML-like name is literal text.
- [Screen](../apps/web/src/app/internal-jobs.ts) /
  [template](../apps/web/src/app/internal-jobs.html) reuse typed reactive forms,
  signals, semantic table/card, Hebrew labels and mixed-direction code isolation.
  Source/filter echo, nullable fields, duplicate IDs, unsupported item fields
  and wrong scope/status/ID are rejected before display.
- Superseding list/filter work cancels list/detail reads; failures retain inputs,
  detail errors keep the list, and closing detail restores row focus. Invalid
  filters focus their field. No editable dates require calendar controls.
- This is the eleventh immediate deferred feature with explicit loading/error
  states. No edit, assignment, reload or producer/dispatch action exists.

### Executed Verification and Limits

[Three API tests](../apps/api/test/internal-jobs.test.ts) passed scoped shape/
detail, large ID, false/null and group-zero/null separation, exact status and
ID/name filters, bounded/duplicate/malformed queries, uniform foreign/missing
404, immutability, read-only capability and absent edit/group/reload/real routes.
[Eight UI tests](../apps/web/src/app/internal-jobs.spec.ts) plus three shell tests
passed capability gating/disabled/unmarked rejection, lossless/status/group
rendering, exact filter/query matching, empty/literal/detail/focus behavior,
wrong source/scope/type/duplicate/extra-field rejection, cancellation, input
bounds, failed-list/detail retention and retry.

Full `npm run check` passed **98 backend + 108 frontend tests (206 total)**,
lint, strict types/templates and both production builds. Initial UI bundle
**433.22 kB** remains below unchanged 500 kB warning. No dependency changes.

Synthetic servers on isolated 3115/4215 returned HTTP 200 with source/no-store.
Browser checks passed three rows, all three status filters, exact large-ID and
normalized name search, group-zero detail versus unknown, literal HTML-like
name, focus return, valid empty combinations, injected list/detail 503 with
filter/list retention/retry, keyboard row action, 320/768/1280 reflow and 200%
text resize. At 320px the feature stayed within 273px, with table scrolling
contained. The old shared page was unavailable; a fresh page was used. An
initial status assertion preceded rendering; response/filter-echo waits passed
the same checks without weakening them. Element screenshot scroll timed out;
a viewport screenshot succeeded and was inspected. Own servers and named
session proxy were stopped/removed.

Scoped design validation passed 1,167 local links and 784 source-line
references. Separate README/plan validation passed 266 links and 58 fragments,
including the updated progress/execution anchors. `git diff --check` passed.

No Oracle or real job/identity data, schema change, mutation, group assignment,
cache reload, staffing dispatch, partner/batch or deployment occurred. Real
active/group mapping, cache freshness, elevated scope, manual Hebrew assistive
technology, UAT and release are NOT RUN. Next candidate: separately approve
one bounded parameter/existing-result view or the deferred-producer design
register; it does not authorize producer implementation or runtime activation.

## 32. Approved R10 Allowlisted Synthetic System Parameters

Task ID: SHF-R10-PARAMETERS-STUB-20261014. Status: done for the explicitly
approved synthetic read-only parameter view; R10 remains partial. The user
approved three non-sensitive scheduling keys, code/name search, list/detail,
raw unit/default/effective values and provenance. Units/mappings are unverified.
Oracle, edits, lock/managed/pool/SMS/IWD flags, reload and batch remain excluded.
This separate source does not alter any previously approved preview policy.

### Source Evidence and Boundary

The [catalog](SHF_SOURCE_CONTRACT_CATALOG.md#1-complete-struts-route-catalog)
maps `/admin/viewMokedParameters` to
[SystemAdminAction](../old/SHF/src/bzq/shf/actions/SystemAdminAction.java#L72).
[SystemAdminModel](../old/SHF/src/bzq/shf/model/SystemAdminModel.java#L104)
distinguishes unit/moked and division/agaf parameters; its
[view method](../old/SHF/src/bzq/shf/model/SystemAdminModel.java#L143) populates
the form from parameter getters. The
[cache helper](../old/SHF/src/bzq/shf/utils/SHFParameters.java#L29) finds
code/unit records and clears the unit value when the selected record belongs
elsewhere. Its missing-result dereference and cache-order behavior are not
ported or presented as a verified hierarchy.

[SystemParameterForm.getValue](../old/SHF/src/bzq/shf/forms/SystemParameterForm.java#L127)
uses the unit value unless null, then the default. It does not convert strings
or treat zero as missing. The
[getters](../old/SHF/src/bzq/shf/utils/SHFParameters.java#L52) identify the three
allowlisted source codes:

- `shf.param.minutesArrivalBeforeStation`
- `shf.param.differenceBetweenShifts`
- `shf.param.minimalShiftDuration`

Only source names and the null-only fallback are reused. Physical Oracle types,
real values/defaults, units, scope hierarchy, cache freshness, change metadata
and elevated permissions remain unverified. No legacy action/cache or save path
was executed. Unknown supplied values/defaults remain explicit; failed lookups
are not represented as successful defaults.

### Contract and Implementation

```text
GET /api/v1/system-parameters?search=&limit=100
GET /api/v1/system-parameters/shf.param.minutesArrivalBeforeStation
```

Only search (code/name, max 80 characters, trim/lowercase) and limit (default
25/max 100) are accepted. No unit/hierarchy/default override or cursor. Invalid
query/code syntax is 400; insufficient limit is 503
`STUB_PAGINATION_UNAVAILABLE`; valid unmatched search is empty. Unsupported
well-formed codes, including excluded flags, share a 404 `PARAMETER_NOT_FOUND`
with absent codes. Detail accepts no query fields.

DTO: allowlisted code, synthetic name/fixed unit, nullable string unitValue and
defaultValue, nullable string effectiveValue, resolution `unit`/`default`/
`unknown`, and literal measurement `unverified`. Demo numeric strings allow
1–38 digits plus optional 1–9 fractional digits; leading zeros and scale stay
unchanged. These are transport guards, not physical Oracle precision or units.
The shared resolver rejects malformed values instead of substituting defaults.
Non-null unit value wins even at `'0'`; default is used only for null unit value;
both null give null/unknown.

- [Contract/resolver](../apps/api/src/stub/system-parameter-contracts.ts) owns
  allowlist, format, source version and null-only resolution. Both sides reuse
  this pure module without server I/O or browser fixture imports.
- [Fixtures](../apps/api/src/stub/system-parameter-fixtures.ts) give unit0 over
  default5, fallback `'11.50'`, and unknown. A foreign unit's record is deliberately
  first and must not leak into list/detail or default resolution.
- [Controller](../apps/api/src/stub/system-parameters.controller.ts) enforces
  fixed scope/allowlist and existing synthetic/unauthenticated, no-store/source
  transport. Capability `systemParameters.read` is demo-only; write is false.
- [Client](../apps/web/src/app/system-parameters-api.ts) checks scope/source/query,
  duplicates/allowlist, nullable formats, unsupported item fields and recomputed
  effective value/provenance. Numeric JSON values or inferred verified units
  are rejected. No process flags or modification-user data are exposed.
- [Screen](../apps/web/src/app/system-parameters.ts) /
  [template](../apps/web/src/app/system-parameters.html) show separate raw/default/
  selected strings and provenance with Hebrew/RTL labels. Search retains input
  on failure, superseding reads cancel list/detail, detail errors keep the list,
  and focus moves to detail/returns to its row. No editable dates need calendars.
- Technical version `synthetic-parameter-catalog-1` and read timestamp are not
  modification time, cache refresh time, real policy or an Oracle snapshot.
  This is the twelfth immediate deferred feature, not a parameter editor.

### Executed Verification and Limits

[Four API tests](../apps/api/test/system-parameters.test.ts) passed pure zero/
default/unknown resolution, raw precision/scale, invalid input rejection,
scope/allowlist/foreign exclusion, query/limit bounds, flag exclusion, immutable
reads and absent edit/reload/apply/real-mode routes.
[Eight UI tests](../apps/web/src/app/system-parameters.spec.ts) plus three shell
tests passed capability gating, precise raw strings, zero/default/unknown,
search/empty, literal detail/focus, malformed/off-scope/off-allowlist/extra-field
and contradictory provenance rejection, cancellation and errors/retry.

Full `npm run check` passed **102 backend + 116 frontend tests (218 total)**,
lint, strict types/templates and both builds. Initial UI bundle **433.73 kB**,
below unchanged 500 kB warning; no dependencies changed. A foreign-value test
was tightened to compare parsed scoped fields rather than searching for digits
that could occur in a timestamp; all four API tests passed again afterward.

Isolated synthetic ports 3116/4216 returned HTTP 200 with no-store/source markers.
Browser checks passed unit0 over default5, exact `'11.50'`, unknown detail,
normalized search/empty flag search, provenance, detail/return focus, contradictory
source rejection/retry, injected list/detail503 with search/list retention,
keyboard row action, 320/768/1280 reflow and 200% text resize. Mobile feature
width/scroll were both 273px; viewport screenshot inspected. The first response
interception using route.fetch stalled; direct API/proxy health checks remained
200, and a fixed synthetic response passed the unchanged rejection assertion.
Own servers and named session proxy were stopped/removed.

Scoped design validation passed 1,171 local links and 787 source-line references.
Separate README/plan checks passed 285 links and 66 fragments, including the
updated progress/execution anchors. `git diff --check` passed.

No real parameter/Oracle read, schema change, write, preview-rule change, flag
activation, cache reload, partner/batch or deployment occurred. Actual units/
hierarchy/defaults/mappings, elevated scope, manual Hebrew assistive technology,
UAT and release are NOT RUN. Next candidate: separately approve an R10 existing-
result view or deferred-producer dependency/recovery design register, without
producer implementation or activation.

## 33. Approved Oracle 11g Thick Adapter Compatibility

Task ID: SHF-ORACLE11G-THICK-20261014. Status: done for explicit mode support,
11g-compatible metadata SQL and approved connection-only verification.
Metadata/business execution, permissions, API mappings and release remain gated.
The user authorized Thick support after isolated client/connectivity checks,
then explicitly selected process-environment password transport without storing
the secret in the project. No new schema or real business routes are approved.

### Runtime Evidence and Decisions

The earlier 21c statement was corrected by the user to 11.2. An isolated approved
Thick diagnostic returned server **11.2.0.4.0**, client **19.3.0.0.0** and performed
READ ONLY + constant SELECT + rollback/close. Thin had failed NJS-138.
The external TNS alias `CTIDBT_WFMT.world` resolves HOST `wfmt_host`, port1521,
SID `wfmt`; treating the alias as a host caused the earlier DNS failures.
The chosen TNS entry parsed correctly, but another entry beginning at line473
failed Thin's complete-file parsing. The original external file was not edited.

The approved implementation keeps Thin as default, disabled unless enabled.
Thick requires `ORACLE_MODE=thick` and absolute `ORACLE_CLIENT_LIB_DIR`; there is
no automatic fallback or retry between modes. OCI initializes lazily on first
explicit read, not construction/startup/shutdown of an unused adapter.
`configDir` goes to initOracleClient for Thick and createPool for Thin. Mode/
client/Net initialization is process-global; conflicting options fail explicitly
and require a fresh process, not a mode reset. This does not certify full vendor
support or compatibility beyond the measured operations.

### Changed Surfaces and Focused Checks

- [Configuration](../apps/api/src/oracle/configuration.ts): validates opt-in mode,
  absolute external client directory and the existing credential/connect-string
  restrictions. A client directory in Thin mode is rejected, not ignored.
- [Adapter](../apps/api/src/oracle/read-only-database.ts): mode-specific lazy
  initialization and bounded shared pool, fixed allowlisted operations, READ ONLY,
  no autoCommit, rollback/release/drain. Initialization failures retain only safe
  driver codes through [errors](../apps/api/src/oracle/errors.ts).
- Metadata SQL orders an inline view by table/column position, then applies
  `ROWNUM <= 513`. The accepted limit remains512; row513 rejects overflow.
  Fixed owner/three-table binds and excluded defaults/source/business rows are
  unchanged. No metadata query was run against the real database.
- Pool/queue limits2/10 and queue/call5s/drain10s remain. Thin supplies connect10s,
  transport5s/retry0 via supported attributes. Thick does not receive Thin-only
  attributes: approved Net descriptors/files must supply connect/transport/
  retry limits. Neither a per-call timeout nor queue wait is a total deadline.
- [Secure script](../scripts/Invoke-ShfOracleMetadata.ps1): explicit Mode,
  ClientLibDir, optional ConfigDir and UseEnvironmentPassword; restores previous
  process settings. Default CLI remains Get-Credential. Missing environment
  password fails before any connection.
- [VS Code task](../.vscode/tasks.json): explicit Thick/client path and
  connectivity-only scope. Password comes from a masked promptString with no
  default into child-process `ORACLE_PASSWORD`, not command arguments or source.
  No literal real password was saved. Original external Net directory remains
  configured after temporary verification files were removed.
- [Oracle tests](../apps/api/test/oracle-read-only.test.ts): 25 focused cases,
  including default Thin, explicit invalid mode/lib paths, disabled/no native
  initialization, concurrent lazy Thick initialization, redacted initialization/
  mode failures, no fallback on NJS-138, existing cleanup/error cases and 11g
  SQL shape/overflow. The double rejects `close(undefined)` exactly as Thick does.

### Executed Verification and Limits

Full `npm run check` passed **107 backend + 116 frontend tests (223 total)**,
lint, strict types and both builds. Initial bundle remains **433.73 kB**.
No frontend behavior or dependency was changed in this increment.
PowerShell parser/task JSON checks passed. Offline masked-input/no-default and
missing-environment-password rejection checks passed without a connection.

The first live call through the modified adapter completed its read/rollback
but failed release NJS-005 because the previous implementation passed explicit
undefined to close. It was reported as failure, not connected success. The fix
calls `close()` with no argument for normal release and `close({drop:true})`
only for a dirty lease. Focused tests/build and the complete suite passed again.
The corrected pooled adapter then passed a live constant connectivity check
through the secure prompt and again via the masked-input/environment-password
flow: READ ONLY, SELECT1, rollback/release/pool drain completed.

Live attempts used an isolated temporary TNS descriptor for the previously
approved HOST/PORT/SID with connect10s/transport5s/retry0. It was removed and the
task's temporary ConfigDir argument deleted. The original external TNS file's
unrelated syntax issue and timeout settings require owner verification before
using that complete file; no unrelated file/system/network configuration was
changed. Password transport was not exposed in logs/files. The credentials
already shared in chat should be rotated by their owner.

No metadata/business read, DML/procedure/sequence, schema mutation, EMS/partner,
batch or deployment occurred. Database-side logon actions and least privilege
are uncharacterized; a READ ONLY constant test is not a full permission audit.
Next gate: separately approve three-table column metadata in this environment,
then review verified mappings/identity/scope before wiring any real business API.

Current-project documentation validation passed 1,172 local links and 787
source-line references. Separate README/plan validation passed 268 links and
66 fragments. Task JSON, masked environment input, missing-password guard,
temporary-file cleanup and `git diff --check` passed.

## 34. Approved Three-Table Oracle Column Metadata

Task ID: SHF-ORACLE-COLUMN-METADATA-20261014. Status: done for the explicitly
approved bounded column inspection only. The user approved the next three-table
metadata check after successful Thick adapter connectivity. This is not approval
to read business records, discover privileges or wire real business endpoints.

The existing compiled [diagnostic](../apps/api/src/oracle/diagnostics.ts) ran
connectivity then the allowlisted query in the
[adapter](../apps/api/src/oracle/read-only-database.ts). Oracle11g ordered ROWNUM
top-N syntax executed successfully against the previously verified target.
READ ONLY setup, rollback/release on each read and pool cleanup completed.
Report capture timestamp: 2026-10-14T12:08:57.2546049Z (15:08:57 local UTC+03:00).

| SHIFTER table | Column records returned |
| --- | --- |
| SHF_EMPLOYEE_DAY | 25 |
| SHF_DAY_CHANGES | 26 |
| SHF_EMPLOYEES | 37 |
| Total | 88 |

The fixed-bind query returned table/column names, dataType, precision, scale and
nullable only. Types observed: NUMBER28, DATE19, VARCHAR2 41. The result was
complete under the approved512-row limit, all three required tables were present,
and the adapter reported no overflow/missing-table/result/cleanup error.

Observed mapping evidence: SHF_EMPLOYEES.EMPLOYEE_ID is NOT NULL NUMBER with
unspecified numeric precision/scale; SHF_EMPLOYEES.EMP_ID_NUMBER is NOT NULL
VARCHAR2; SHF_EMPLOYEE_DAY.EMP_ID_NUMBER is nullable VARCHAR2. The full88-column
JSON is preserved as a session artifact with capture time and approved scope,
not as synthetic application fixtures. No personal/business values were read.
Numeric safe-integer bounds, actual identifier contents, string lengths, Oracle
DATE timezone semantics, unique/foreign-key constraints, indexes, triggers,
grants, defaults, source and authoritative ownership remain unverified.

The task used the existing masked-password-to-process-environment flow. A
temporary wrapper captured/validated the bounded JSON and printed counts only;
it used an isolated TNS descriptor with approved HOST/PORT/SID and bounded
connect/transport/retry settings, without modifying the original external file.
The wrapper and TNS file were deleted, and the persistent VS Code task was
restored to connectivity-only. No real secret was saved in project artifacts.

No application code changed: the prior full223-test lint/types/build baseline
remains; it was not rerun for this documentation/diagnostic-only step. Wrapper
PowerShell syntax/task JSON and live report connectivity/readOnly/scope/count
validation passed. No business SELECT, DML/procedure/sequence, DDL, EMS/partner,
batch or deployment occurred. Next gate: source-to-column mapping and trusted
identity/read-scope review; any business-data sample needs separate approval.

## 35. Oracle Personal-Shift Source-to-DTO Mapping Review

Task ID: SHF-R01-ORACLE-MAPPING-20261014. Status: done for the user-approved
analysis/documentation step; implementation/policy gates remain blocked by
their named owners. No new Oracle query or application/schema/contract change.
The existing technical design is revision2.2 draft and contains
[R01-PS-ORACLE-MAP-0.1](SHF_REVERSE_ENGINEERED_TECHNICAL_DESIGN.md#362-oracle-personal-shift-mapping-review-r01-ps-oracle-map-01).
This revision is not G1 approval or approval to replace synthetic APIs.

Started at the [catalog personal-shift route](SHF_SOURCE_CONTRACT_CATALOG.md#1-complete-struts-route-catalog),
followed [my_result](../old/SHF/src/bzq/shf/actions/ShiftDataAction.java#L141)
to [active UNION](../old/SHF/src/bzq/shf/model/ShiftDataModel.java#L1233),
[detail](../old/SHF/src/bzq/shf/model/ShiftDataModel.java#L150),
[bean mappings/getters](../old/SHF/src/bzq/shf/bean/AgentDayBean.java#L49) and
[profile identity](../old/SHF/src/bzq/shf/actions/BaseAction.java#L170).
Compared the saved approved 88-column JSON with the existing
[DTO](../apps/api/src/personal-shifts/contracts.ts) and
[normalized projection](../apps/api/src/personal-shifts/personal-shifts.ts#L171).
Legacy source was read only, never built or executed.

Offline checks passed all 33 selected fields (day 15/change 15/employee 3),
13 DATE fields and both NUMBER(10,0) NOT NULL day-key columns. The review maps
every schedule/selection/provenance field or explicitly identifies it as a
derived authorization/transport fact rather than an Oracle column.
Findings requiring review:

- Day-key type/precision is verified; PK/UK/FK and one-change-per-day are not.
  The very large synthetic IDs exceed this physical target and remain tests
  of string transport, not real-data fixtures.
- EMPLOYEE_ID is an unspecified-precision NUMBER, while full and schedule owner
  EMP_ID_NUMBER fields are VARCHAR2. Prefix matching and the current digit-string
  actor contract do not establish an authenticated, unique employment link.
- Physical shift endpoints allow null; normalized DTO endpoints do not.
  Unknown/malformed raw rows require explicit errors, not guessed midnight/end.
- Joined override-row presence, new-field null fallback and eligibility must be
  separated. Active UNION day-type filtering differs from bean getter fallback.
  Do not resurrect baseline rows suppressed by the changed-day branch.
- Home/split columns are NOT NULL VARCHAR2 in their own rows, not proven
  booleans. Absent join rows and invalid tokens are different facts. Independent
  split endpoint fallbacks must not conceal contradictory gaps.
- DATE types are confirmed, but wall-time/timezone/NLS/DST interpretation is not.
  Day-start ORDER BY3 and strict lower bounds differ from normalized effective-
  start half-open range and deterministic ID tie-breaking.
- Source attendance join compares mismatched identifier domains; attendance is
  outside the DTO/metadata scope. Removing the legacy org-unit inner join also
  needs approved existence/scope semantics, not just leaving out a table.
- Cancellation is not explicitly filtered by the active UNION; the predicate in
  its commented predecessor is not an approved inclusion policy.

Owner gates: SEC for trusted identity, baseline visibility and employment scope;
DBA for constraints/uniqueness/exact fetch representations and any additional
metadata/data permission; PO for cancellation/day-type/null/timezone behavior;
ARC for raw-row/API mapping baseline; BE/QA for synthetic raw-row and eventual
approved SQL characterization. No public DTO/route or demo-policy change was
made. Paid/work/attendance/contact/audit fields remain excluded.

No application code changed and no live checks were run. The preceding 223-test
lint/types/build baseline remains, not claimed rerun. The new checks are offline
metadata consistency and documentation references only. Next gate is explicit
policy/input approval for an isolated raw-row mapper; any real business-data
sample, SQL execution or API activation requires separate approval.

Executed documentation checks passed: current-project validator 1,184 local
links and 795 source-line references; separate README/plan checks 280 links and
75 fragments. `git diff --check` passed. No application suite was rerun because
this step changed documentation only.

## 36. Approved Personal-Shift Read Mapping Decisions

Task ID: SHF-R01-MAPPING-POLICY-20261014. Status: done for user-triggered policy
agreement and evidence-backed documentation, not mapper implementation or
real data activation. Current technical design revision2.3 draft includes
[R01-PS-ORACLE-MAP-0.2](SHF_REVERSE_ENGINEERED_TECHNICAL_DESIGN.md#363-approved-read-mapping-policy-r01-ps-oracle-map-02).
The draft is approved only for the explicitly recorded decisions, not G1/release.

The user separately approved:

1. Fail-closed on unknown inclusion, ambiguous owner, duplicate changes or invalid
   required data; no silent omission/remaining-rows-with-warning substitute.
2. Explicit unambiguous owner link to canonical internal EMPLOYEE_ID, never a
   first-eight-character lookup, EMP_ID_NUMBER substitution or demo owner.
3. After rejecting the first proposal to accept a supplied synthetic eligibility
   verdict, source-backed agreement of the real read classification: sentinel
   NEW_EMPLOYEE_ID `'99999999'` OR non-null CANCEL_REASON_CODE excludes a cancelled
   change, independent of dates/day type.
4. Noncancelled controlling day type comes from baseline only when no change
   exists; otherwise NEW_DAY_TYPE is mandatory, without fallback. Type4 is a
   candidate, known1/2/3/5/6/7 exclude, null/unknown/error fails.
5. First isolated mapper accepts strict local YYYY-MM-DDTHH:mm:ss strings only,
   no Date/UTC/offset guessing. Real Oracle DATE extraction/timezone remains a
   separate approval/compatibility boundary.

Read-only evidence extended the existing catalog trace to
[constants](../old/SHF/src/bzq/shf/utils/SHFConstants.java#L48),
[cancelShift update/insert](../old/SHF/src/bzq/shf/model/ShiftDataModel.java#L3732),
[cancelled-reader sentinel](../old/SHF/src/bzq/shf/model/ShiftCancelledModel.java#L112)
and [active-reader null reason](../old/SHF/src/bzq/shf/model/ShiftDataModel.java#L987).
The cancellation method also changes source, cancels day parts and prepares
managed-break SoftPhone deletion requests. None was executed; agreement applies
to read classification only, not a cancellation command or preview that writes.

Design records ordered structure/ambiguity checks, cancellation precedence,
row-presence day-type selection, included-schedule validation and existing
authorization/redaction. Cancellation markers do not require fabricated shift
dates or a real employee link for the sentinel. Duplicate/structural ambiguity
still fails, rather than being hidden by a known cancellation.
Fifteen discriminating acceptance scenarios are specified for future synthetic
raw-row tests, including sentinel-only/reason-only/zero-text reason, changed null
type, unknown types, duplicates, explicit identity, malformed dates and privacy.
These scenarios were not executed as automated tests.

No code, public DTO, fixture, Oracle/EMS call, schema, system configuration or UI
behavior changed. No application tests were rerun for this documentation-only
step; the prior223-test baseline is unchanged. Next step: implement/review the
isolated mapper with synthetic raw rows under this approved policy. Trusted
identity, actual row cardinality/flags, Oracle DATE semantics and any permitted
real business sample or endpoint remain separately gated.

Validation passed: current-project documentation 1,192 local links and 803
source-line references; separate README/plan 286 links and 81 fragments.
`git diff --check` passed. These are documentation checks, not executed mapper
tests or runtime approval of business data.

## 37. Approved Isolated Oracle Personal-Shift Mapper

Task ID: SHF-R01-ORACLE-ISOLATED-MAPPER-20261014. Status: done for the user-
approved pure mapper and synthetic tests under R01-PS-ORACLE-MAP-0.2.
The [implementation evidence](SHF_REVERSE_ENGINEERED_TECHNICAL_DESIGN.md#364-isolated-raw-row-mapper-implementation)
records exact input/representation/validation boundaries. Technical design
revision2.4 remains draft beyond specifically approved isolated behavior.
No repository SELECT, authentication, real DATE conversion, HTTP/business
activation or schema change was authorized or performed.

- [Mapper](../apps/api/src/personal-shifts/oracle-shift-mapping.ts) accepts one
  named-column day, zero/one associated change and explicit exact-key owner
  links. Returns existing PersonalShiftItem or null for known exclusions/
  foreign ownership; ambiguity/unknown/malformed input throws redacted
  DATA_CONTRACT_UNVERIFIED.
- Implements sentinel OR non-null reason cancellation before day type/date
  mapping; known nonactivity excludes, type4 is mapped only after validation,
  changed null/unknown type fails without baseline resurrection.
- Internal IDs are canonical decimal strings; owner keys retain exact strings
  without prefix matching. Day/site key guards reflect observed day/site
  precision where known, without altering the broader existing demo contracts.
- Explicit null new start/end/site/activity/gap endpoints inherit independently;
  undefined/missing is not defaulted. Present raw home/split flags require Y/N.
  Strict local strings pass through unchanged, not driver/browser Date conversion.
- Reuses the [existing projection](../apps/api/src/personal-shifts/personal-shifts.ts#L171)
  for normalized schedules, gap consistency and baseline redaction. Full original/
  effective schedules are validated before actual owner filtering, including
  hidden originals and malformed foreign included rows. Incomplete originals
  are errors rather than a fabricated not-present baseline.
- The existing DTO, projection implementation, capabilities, stub fixtures,
  application wiring and Oracle adapter were not modified.

[Fifteen new tests](../apps/api/test/oracle-shift-mapping.test.ts) passed baseline/
override/transfer, unchanged source fixtures, individual null fallback, site0,
large internal IDs, exact day types, null/unknown errors, all known exclusions,
sentinel-only/reason-only/zero-text reasons, duplicates/wrong associations,
missing/competing/prefix-only links, invalid IDs/flags/times, split gaps,
overnight seconds, baseline privacy and static redacted errors. A mapped sequence
containing an invalid row throws, rather than returning accumulated partial
success. Tests import no driver or external runtime.

The first compile failed because a plain object check did not narrow to Record;
adding a real type predicate fixed it without casts. The focused mapper plus
existing22 projection tests passed **37 checks**. Subsequent strengthened
incomplete-baseline/gap-offset cases passed within the full suite.
Full `npm run check` passed **122 backend + 116 frontend tests (238 total)**,
lint, strict types/templates and both builds. Initial bundle remains
**433.73 kB**, below unchanged500kB warning. No packages changed.
No browser run was required because there is no UI or route behavior change.
Source-reference search confirms no production caller imports the new mapper.

No real Oracle connection/data read, mutation/sequence, constraint/index
discovery, partner/EMS, batch, deploy or user-data fixture was involved.
Remaining owner gates: SEC for trusted authentication/employment/baseline scope;
DBA/business for real cardinality, flag values and Oracle DATE meaning; ARC/BE/QA
for an approved exact fetch representation and any subsequent authorized SQL
characterization. Next step must not infer real API activation from this pure
mapper's passing tests.

Documentation validation passed: current-project checker1,195 local links and
804 source-line references; separate README/plan293 links and85 fragments.
Updated progress/implementation anchors and `git diff --check` passed.

## 38. Real API Request: Test Scope and Corporate SSO Investigation

Task ID: SHF-REAL-API-SSO-REMARK-GATE-20261014. Status: blocked; owner SSO/gateway
for verified identity ingress/callback and accessible SOAP contract. No real
business-data read/write or production deployment performed.

User requested full real read/write API access without schema changes. Required
clarifications confirmed:

- Current target is test, correcting prior working/shared classification for
  proposed checks; actual isolation/partner effects are not independently proven.
- First operation is a remark change, restricted to SHF_EMPLOYEE_DAY_ID1255 and
  field REMARK. Other rows/actions/privilege discovery/DDL remain outside this
  concrete scope; a successful one-row check would not authorize full access.
- Existing corporate authorization must be used; user rejected the proposed
  isolated local-token identity option.
- env=t obtains identity via
  `http://tauths.bezeq.com/obtainuserid/default.asp`.
- User states gateway guarantees user/domain_user provenance, but has no
  document/settings; requested inspection of old sources instead.

Read-only trace from the [catalog](SHF_SOURCE_CONTRACT_CATALOG.md#1-complete-struts-route-catalog)
followed [LoginAction](../old/SHF/src/bzq/shf/actions/LoginAction.java#L53),
[obtainuserid JSP](../old/SHFWeb/WebContent/jsp/shf_obtainUserId.jsp),
[Nemo proxy](../old/SHF/src/bzq/shf/profile/SSOWebProxyNoga.java#L44),
[Login.load](../old/SHF/src/bzq/shf/model/Login.java#L38) and accessible WebSphere
binding/extension. The JSP submits copied parameters to the env-prefixed host.
LoginAction uses domain_user for `getAuthorizationBean(id,semel,clientIp)`;
env=t gives SHT application code, while the visible Nemo host is hardcoded.
Login.load uses separate user for the profile/employee/unit link and combines
Nemo general authorization with security/activity tables and cached hierarchy.
UserProfile is then stored in session with5400-second idle timeout.

No verified provenance/binding check was found in the readable login path.
The accessible web files do not establish gateway transport/ingress policy.
Some deployment search results were suppressed by organizational content
exclusion: no alternative access or content reconstruction was attempted.
Loose obtainuserid server source and a complete readable SOAP WSDL were not
located in the inspected paths; no legacy archive was opened/executed.
Absence from readable source is not proof that external protection does not exist,
but is insufficient to trust browser-supplied user/domain_user in a new API.

The [remark writer](../old/SHF/src/bzq/shf/model/ShiftDataModel.java#L5664)
updates the field by day ID with binds. No ownership/concurrency guarantee can
be inferred for the new command; account-level database access is not application
authorization. Its write code was inspected only, never called.

The [design gate](SHF_REVERSE_ENGINEERED_TECHNICAL_DESIGN.md#731-real-api-request-and-corporate-gateway-trust-blocker)
lists exact missing inputs: authenticated gateway provenance/bypass prevention;
protected identity/callback/session binding; accessible Nemo SOAP and test
settings; real remark permission/resource policy. DBA/business/ARC subsequently
must verify lengths/null behavior, constraints/triggers/co-writers, atomic
preconditions, audit/retry/unknown-commit and authorized restoration without DDL.
No inferred OIDC migration, local fallback identity or full-data permission.

No code, auth/Oracle configuration, secrets, session, database call/UPDATE,
schema, broker/batch or deployment changed. The existing read-only guard and
unavailable real APIs remain intact. Prior238 tests were not rerun; this step is
source/document evidence, not successful SSO or write validation. Resume only
after the required trust/contract artifact or approved equivalent input changes.

Bounded documentation checks passed for the three new source/gate sections:
21 local links,12 source-line references in previously accessible files and4
Markdown anchors. `git diff --check` passed. The broader source validator was
not run for this step to avoid accessing excluded deployment material; no
restricted configuration, SSO endpoint or database was accessed.

## 39. Approved Unverified SSO Claim Simulation

Task ID: SHF-SSO-UNVERIFIED-SIMULATION-20261014. Status: done for the explicit
user choice to accept ordinary POST fields as unverified SSO imitation **without
real rights**. Real corporate gateway/SOAP trust and day1255 remark writes remain
blocked; this is not approval to bypass them or use a local real-data test token.

[Controller](../apps/api/src/stub/sso-simulation.controller.ts) adds only:

```text
POST /api/v1/auth/sso-simulation
{ "user": "synthetic-user", "domain_user": "DEMO\\synthetic-domain-user" }
```

Request accepts exactly two nonblank strings of max128 characters, no C0/DEL
controls and no query fields. Extra role/employee/password/authenticated fields
are invalid400 INVALID_SSO_SIMULATION; values are never echoed in static Hebrew
errors or the result. Synthetic/no-store/source headers apply.
HTTP200 means valid shape accepted, not verified login: simulationOnly=true,
claimsAccepted=true, identityAssurance=unverified, authenticated=false,
sessionCreated=false, permissions=[], oracleAccess=false, nemoContacted=false,
nextStep=VERIFIED_SSO_REQUIRED and technical read time only.

The [stub registration](../apps/api/src/stub/stub.module.ts) exposes preview-only
capability, false write. It does not update actor identity, capabilities or a
session; the real AppModule never registers it, and stub/Oracle simultaneous
activation remains rejected. No cookie/token/operation IDs, network redirects,
SSO/Nemo/Oracle calls, record reads/writes, schema changes or frontend login.
Values are processed for validation only, without storage; use synthetic input.

[Four tests](../apps/api/test/sso-simulation.test.ts) passed successful exact
response/markers/privacy, input/query/length/control/extra-field rejection,
cookie/token claims not granting identity, unchanged me/capabilities, absent
remark write, real-mode404 and stub/Oracle exclusion.
The first full check failed lint no-control-regex; character-code validation
replaced the regex without disabling a rule or accepting controls. The same
focused tests/lint passed, then full `npm run check` passed **126 backend+116
frontend tests (242 total)**, strict types, lint and both production builds.
Initial bundle unchanged **433.73 kB**. No dependency changes or browser check
required for a backend-only simulation.

Updated [contract/evidence](SHF_REVERSE_ENGINEERED_TECHNICAL_DESIGN.md#732-approved-unverified-post-claim-simulation)
and README. The existing blocked real integration task remains blocked; this
isolated simulation cannot satisfy gateway/identity, schema-side effects,
concurrency/audit or live data-authorization gates.

Bounded documentation validation passed three new sections,10 local links,
3 contract/execution anchors and the updated progress anchor; diff whitespace
passed. No excluded deployment source was accessed. No live server, SSO/gateway,
Nemo or database check was run for this synthetic endpoint.
