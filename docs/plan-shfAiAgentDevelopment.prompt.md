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
