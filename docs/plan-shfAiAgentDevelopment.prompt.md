# Plan: SHF AI-Agent Development Directives

Task ID: SHF-DEV-PLAN-20261013
Revision: 1.1 AI execution baseline, 2026-10-13
Status: review. The earlier human-team calendar estimate is superseded. Architecture/API/UI/release approvals remain pending.
Publication target: d:/AIProjects/SHFAI/docs/SHF_PROJECT_DIRECTIVES.md, ordinary project documentation. This repository file does not exist and is not written in Plan mode. This document is session planning memory, not repository publication.

## 1. Confirmed Scope And Evidence

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
