# Shifter (SHF) Project Instructions

## Scope And Evidence

- Build shifter (SHF) from the business behavior in `old/` and the materials in `docs/`. Start with the [agent brief](../docs/AGENT_INSTRUCTION.md).
- The user confirmed a Node.js backend, modern supported Angular (not AngularJS 1.x), HTML/CSS, Angular Material/CDK and Material 3, the existing Oracle schema, abstract TIBCO EMS API interfaces only, and temporary exclusion of batch processes.
- Current user-approved scope constrains the broader proposals in the design documents and skills. A document, skill, agent invocation or handoff does not approve a technology decision, contract change, schema change or deployment.
- Distinguish source-observed, configured, documented, runtime-verified, inferred, proposed and unknown evidence. Source references do not prove deployed behavior or physical Oracle metadata.
- Use the [source contract catalog](../docs/SHF_SOURCE_CONTRACT_CATALOG.md) to locate a relevant flow, then follow it to the code that decides the business behavior. Historical source paths may need the `old/` prefix.

## Boundaries

- Treat `old/` as read-only evidence for all roles. Do not edit, build or execute legacy applications, batch jobs, generated files, vendor libraries or archives without separate authorization.
- Retain the existing Oracle schema. Do not introduce DDL, migrations, new tables, indexes or sequences without separate approval. Surface requirements for new concurrency, idempotency or outbox storage as decisions, not automatic schema additions.
- Implementing approved persistence code does not authorize connecting to a shared database. Metadata discovery, business-data reads and mutating procedure calls require an explicitly approved environment, permissions and data scope. Never mutate production data.
- EMS work is limited to abstract ports, DTOs, documented semantics and clearly labeled isolated test doubles. Do not implement or provision broker clients, publishers, consumers, transport workers, Java/.NET bridges or live broker connectivity. Do not present simulated partner completion as a real result.
- The [.NET EMS design](../docs/SHF_TIBCO_DOTNET_INTERFACE_DESIGN.md) is partner-contract evidence, not authorization to replace Node.js or build its proposed transport.
- Batch implementation, execution, scheduling, packaging and batch-only tests are excluded. Record any necessary in-scope dependency as deferred rather than silently expanding the project.
- Protect credentials and personal data in code excerpts, fixtures, logs, screenshots and reports. Use synthetic or approved anonymized test data and least-privilege accounts. Preserve existing user changes.

## Engineering And Ownership

- Read the relevant existing skill before domain work. Reuse established utilities, contracts, tests and documents; do not duplicate catalogs or scaffold a project unless that task is authorized.
- Start at a concrete feature, source symbol, endpoint, screen or failing check. Form a local testable hypothesis, make a small grounded change and immediately run the cheapest focused behavior check. Repair and rerun that check before widening scope.
- Keep business rules out of transport and presentation layers. Validation and preview operations must not mutate business data. Preserve approved behavior, not known legacy defects by default.
- Verify supported framework, runtime, driver and tooling compatibility when selecting versions. Do not copy a proposed version from an older design or assume that newest means supported.
- Frontend workflows must support Hebrew/RTL and mixed-direction content. Write accessibility labels and assistive text in Hebrew; include keyboard/focus behavior and WCAG 2.2 AA acceptance criteria.
- Edit only the artifacts assigned to your role/task. Shared contracts have one owner, `system_architect`; coordinate changes before consumers edit against them.
- Discover actual build/test commands before executing them. Distinguish static, mocked and live checks. Report failed, blocked and not-run checks explicitly; do not invent passing tests, conformance or stakeholder sign-off.

## Approval And Collaboration

- `project-orchestrator` coordinates the traditional workflow. Obtain explicit user approval for architecture, API/UI contract baselines and release. Record the approved artifact/version and scope; do not infer approval from silence or a handoff.
- All roles may analyze legacy evidence and request appropriate peers. Carry the task objective, approved decisions, prerequisite versions, input paths, exclusive file ownership, allowed actions/environment, exclusions, acceptance criteria and focused check into every delegation.
- Return a task ID, status, findings/changed paths, evidence, exact check outcomes, blockers with their owners, risks and next action. A subagent needing user approval returns the approval request to its caller; it does not invent approval or wait indefinitely.
- Track `ready`, `running`, `blocked`, `review` and `done`. A blocked task names the missing artifact/decision and owner. Resume it only after that prerequisite changes; never busy-wait or claim a persistent background agent.
- Parallelize only independent tasks with disjoint edits and satisfied prerequisites, using the host's actual concurrent-agent capability. Serialize shared-contract writes. If parallel execution is unavailable, run serially and disclose the limitation.
- Subagents return results to their caller; do not assume a direct peer messaging bus or inherited conversation history. Never invoke a role already in the active delegation chain. Route its requested work to the parent instead.
- Nested invocation depends on the active harness and settings, including `chat.subagents.allowInvocationsFromSubagents` where supported. Do not change settings automatically. If unavailable, return a peer-work request to the caller/orchestrator.
- Handoffs are reviewable user-triggered transitions, not a parallel scheduler. Keep `send: false`. QA fix/retest cycles require a specific defect, changed evidence and a measurable retest, not an automatic delegation loop.
- Tool permissions and these instructions are not a filesystem sandbox. External access, destructive actions and production deployment still require explicit authorization.