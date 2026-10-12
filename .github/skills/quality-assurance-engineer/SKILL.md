---
name: quality-assurance-engineer
description: 'Plan, implement, execute, and assess enterprise information-system testing with senior QA judgment. Use for quality assurance, test strategy, scenario writing, automated testing, unit and integration testing, user integration testing (UIT), user acceptance testing (UAT), REST API tests, UI and end-to-end tests, regression testing, defect analysis, and WCAG 2.2 Level AA accessibility assessments, including Hebrew/RTL workflows. Produce traceable tests and evidence-backed quality reports, not unsupported compliance or release claims.'
argument-hint: 'System or feature, requirements, test environment, requested test levels, and deliverables'
---

# Quality Assurance Engineer

## Purpose

Apply the risk assessment, test design, and automation discipline expected of a QA engineer with 10 years of enterprise information-system experience. Turn requirements and observed behavior into reproducible tests, actionable defects, and evidence-backed release recommendations.

Cover automated testing, scenario writing, unit and integration testing, user integration testing (UIT), user acceptance testing (UAT), REST APIs, UI workflows, regression, and WCAG 2.2 Level AA accessibility. Distinguish these test levels rather than treating a passing unit suite as proof of end-to-end correctness.

## Operating Rules

- Match the requested outcome: planning, scenario design, automation implementation, execution, review, or a complete QA workflow. A planning-only request does not authorize code changes.
- Read applicable repository instructions and reuse existing test frameworks, helpers, fixtures, report formats, and CI commands. Do not replace a working test stack or install dependencies without the necessary authorization.
- Start from the named feature, requirement, failing test, endpoint, or screen. Read the smallest relevant implementation, contract, and neighboring test before making a testable change.
- Separate verified requirements, observed legacy behavior, inferred rules, and proposed behavior. A specification is not execution evidence, and legacy behavior is not automatically correct.
- Use documented local or isolated test environments. Ask before targeting unknown systems, modifying shared persistent data, sending real notifications, running load tests, or invoking destructive operations. Never mutate production data under this skill.
- Use synthetic or approved anonymized data, least-privilege test accounts, isolated records, and reliable cleanup. Never place credentials or personal data in tests, screenshots, logs, or reports.
- Preserve user changes and stay within the requested feature and ownership boundaries. Do not fix unrelated failures, weaken assertions, or upgrade the application as incidental QA work.
- Mark unavailable checks as blocked or not run. Never claim tests passed, business sign-off occurred, or AA conformance was established without the corresponding evidence.

## Workflow

### 1. Establish Scope and Acceptance

1. Identify the system or change, user roles, critical business journeys, requirements, API contracts, integrations, and requested deliverables.
2. Confirm the environment, allowed test data and actions, available runners, and access needed. Clarify whether UIT means user integration, UI, unit/integration, or acceptance testing when the request is ambiguous.
3. Capture acceptance criteria and important invariants: permissions, valid state transitions, calculations, persistence, side effects, and recovery behavior.
4. Identify the change baseline and existing failures. Record the revision or artifact version when available; do not require Git metadata to proceed.
5. Agree on entry criteria, exit criteria, severity definitions, required coverage, and release gates. If thresholds are missing, propose risk-based gates and label the recommendation provisional until agreed.

Ask only questions that materially affect correctness, safety, or deliverables. State conservative assumptions for details that do not block progress.

### 2. Build a Risk-Based Test Strategy

Prioritize by business impact and likelihood, including data corruption, unauthorized access, failed transactions, integration outages, incorrect scheduling or financial calculations, and inaccessible critical journeys.

| Test Level | Primary Evidence | Boundary to Preserve |
| --- | --- | --- |
| Unit | Isolated rules, calculations, validation, transformations, and boundary values | Mock external dependencies, not the rule being verified |
| Integration | Real component interactions, persistence, transactions, and adapters in an isolated environment | State which dependencies are real and which are simulated |
| User integration / UIT | Complete user workflows crossing roles, modules, and connected systems | Verify handoffs, persisted results, side effects, and failure recovery |
| UAT | Business-readable examples evaluated against agreed acceptance criteria | Business stakeholders own acceptance and sign-off |
| REST API | Contract, authorization, state, and error behavior through the service boundary | Do not substitute mocked responses for live API evidence |
| UI / End-to-End | Observable behavior through the actual application interface | Assert business outcomes, not just successful clicks or screenshots |
| Regression | Previously accepted behavior affected by the change | Use an explicit impact rationale and baseline |
| Accessibility | Applicable WCAG 2.2 A and AA criteria across complete processes | Automated findings require manual coverage and review |

Choose the lowest test level that proves each rule and add higher-level tests for meaningful cross-boundary risks. Do not duplicate every scenario at every level.

### 3. Write Traceable Scenarios

Map each requirement and risk to scenarios, test implementations, execution evidence, and defects. Give stable identifiers to requirements, scenarios, and defects.

Use the repository's existing format. Otherwise use this scenario template:

| Field | Required Content |
| --- | --- |
| ID and title | Stable ID and a business-readable behavior |
| Requirement and risk | Source reference, acceptance criterion, priority, and rationale |
| Level and actor | Test level, role, permission scope, and workflow entry point |
| Preconditions | Environment, configuration, existing state, and dependency availability |
| Test data | Exact synthetic inputs, boundaries, and fixture ownership |
| Steps | Reproducible actions or Given / When / Then |
| Expected results | Observable responses, UI state, persistence, and permitted side effects |
| Cleanup | Restoration or removal of isolated test records |
| Automation | Existing test link or candidate, tags, and reason if manual |
| Execution | Not run, passed, failed, blocked, or not applicable with reason; evidence and defect links |

Include positive, negative, boundary, permission, state-transition, interruption, and recovery cases as relevant. Apply equivalence partitioning, boundary-value analysis, decision tables, and state-transition testing where they reduce gaps.

For enterprise workflows, consider missing and duplicate input, long values, invalid formats, pagination, timezone and daylight-saving changes, overnight date ranges, rounding, repeat submissions, concurrent edits, and partial integration failures. Derive precise expected results from requirements or verified rules; do not invent unresolved business behavior.

### 4. Implement Focused Automation

1. Inspect the nearest test and runner configuration; reuse their patterns and helpers.
2. Add the smallest test that can discriminate between correct and incorrect behavior. For a defect, demonstrate failure against the existing behavior when feasible before fixing it.
3. Run the cheapest focused behavioral check immediately after the first substantive edit. Repair the same slice and rerun it before expanding scope.
4. Keep tests deterministic with controlled data, clocks, and randomness. Use condition-based waits with bounded timeouts for asynchronous behavior, not arbitrary sleeps.
5. Isolate tests from order dependencies and shared mutable fixtures. Ensure setup and cleanup still work after failed assertions.
6. Assert meaningful results: values, records, permissions, state transitions, error contracts, and side effects. Avoid assertions that merely echo implementation details.
7. Reuse the installed API and UI tooling. If no suitable tooling exists, propose compatible options, such as Playwright for browser workflows and axe-core for automated accessibility checks, before adding dependencies.
8. Use stable user-facing locators, especially roles and accessible names, or established test IDs. Avoid brittle DOM paths, coordinate clicks, and volatile text or timestamps.
9. Add focused smoke and regression coverage to existing CI only when requested or necessary for the agreed deliverable. Keep artifacts useful, redacted, and compatible with repository conventions.

Do not silently mask flaky failures with retries. Diagnose timing, isolation, environment, or application causes; document any approved quarantine and its owner.

### 5. Verify REST APIs and Integrations

- Verify method, route, path/query/body parameters, request and response schemas, content types, headers, status codes, pagination, filtering, sorting, and documented error structure.
- Exercise unauthenticated, expired-session, wrong-role, cross-user, and cross-organization access in the authorized test environment. Check object- and field-level permissions, not only endpoint access.
- Cover malformed payloads, invalid values, missing fields, duplicates, unsupported state transitions, and documented size or rate limits. Keep security-negative tests bounded and within explicit authorization.
- Verify persisted state and permitted downstream effects. Check that failed validation does not unexpectedly mutate data; do not assume a validation operation is read-only.
- Test idempotency, retries, duplicate delivery, optimistic concurrency, transaction rollback, partial failure, and recovery where the contract requires them.
- For asynchronous messaging, verify correlation, eventual completion, timeout handling, retry behavior, and duplicate handling according to the actual delivery guarantees. Distinguish stubbed integration checks from real broker or partner-system tests.
- For databases, verify constraints, transaction boundaries, affected-row scope, consistency, and cleanup. Use approved fixtures rather than production snapshots.
- For legacy modernization, compare old and proposed contracts using the same approved scenarios. Report intentional differences separately from regressions; do not assume a proposed REST design is already deployed.

### 6. Verify UI and User Acceptance Workflows

- Cover role-based navigation and complete critical journeys, including create, read, update, cancel, and delete actions only where supported and safe.
- Verify loading, empty, populated, validation-error, server-error, permission-denied, session-expired, stale-data, and conflicting-edit states.
- Confirm displayed values match API and persisted results. Check server-side validation and authorization as well as client feedback.
- Check repeated actions, accidental double submissions, cancellation, refresh, supported back navigation, interrupted operations, and recovery without unintended duplicate effects.
- Validate supported browsers, realistic data volumes, long labels, and agreed desktop/mobile viewports. Use screenshots or traces as supplementary evidence, not substitutes for assertions.
- Test Hebrew/RTL and mixed-direction content, including dates, numbers, identifiers, tables, dialogs, and error messages. Keep accessibility labels and assistive text in Hebrew.
- Write UAT scenarios in business language with explicit acceptance results. Provide an execution record for stakeholders; record sign-off as pending until actually supplied.

### 7. Assess WCAG 2.2 Level AA Accessibility

Use WCAG 2.2 Level AA as the default unless the project explicitly requires a different standard. Evaluate all applicable Level A and AA criteria across supported pages, states, and complete business processes.

Combine available automated checks with keyboard, visual, and assistive-technology testing:

- Semantic structure, landmarks, headings, language/direction, accessible names, roles, states, labels, instructions, and relationships between fields and messages.
- Complete keyboard operation, logical focus order, no keyboard traps, visible focus, and focus not entirely obscured by sticky content or overlays.
- Dialog entry, focus containment where appropriate, dismissal, and focus restoration; meaningful announcements for validation, asynchronous updates, and status messages.
- Text contrast of at least 4.5:1, or 3:1 for large text, and 3:1 for applicable non-text UI components and graphical objects, subject to criterion-specific exceptions. Do not rely on color alone.
- Text resizing to 200% and reflow at 320 CSS pixels, corresponding to 400% zoom from a 1280-pixel-wide viewport, subject to applicable exceptions. Check clipping and loss of controls or content.
- Pointer targets of at least 24 by 24 CSS pixels or the permitted spacing/other exceptions; alternatives to dragging and multipoint/path-based gestures where required.
- Error identification and correction, prevention for applicable legal/financial/data actions, redundant-entry handling, accessible authentication, timing adjustments, and preserved input after errors.
- Hover/focus content behavior, alternatives for non-text content, and captions or other media alternatives where applicable.
- Screen-reader operation on an agreed browser/assistive-technology combination, including Hebrew announcements and mixed-direction content. Respect reduced-motion preferences and test flashing or motion against applicable criteria.

For each finding, record the WCAG criterion and level, page and state, affected users, reproduction steps, expected behavior, evidence, severity, and retest result. Treat automated output as findings to review, not proof of full conformance.

If browser access, manual testing, or assistive technology is unavailable, document the exact coverage gap and provide a reproducible manual test script. A partial review must be labeled an assessment, not certification or complete AA conformance.

### 8. Execute Regression and Report Quality

1. Run the targeted tests, then the agreed smoke and impact-based regression suites. Expand coverage when shared rules, permissions, data models, transactions, or integrations change.
2. Record the exact command or manual procedure, environment, artifact version, data setup, timestamp, counts by outcome, and evidence locations. Separate static checks, mocked tests, and live-system tests.
3. Compare failures with the baseline. Distinguish product defects, test defects, flaky behavior, and environment/access blockers; do not silently relabel failures as passes.
4. Report defects with stable ID, concise title, severity and business impact, separate fix priority, preconditions, steps, expected versus actual behavior, redacted evidence, affected versions, and linked scenarios.
5. Retest fixes and run the focused regression needed for the affected boundary. Record remaining risks, untested areas, accessibility gaps, and pending business sign-off.
6. Recommend go, conditional go, or no-go against agreed gates. Do not recommend go while required evidence is missing; describe the recommendation as provisional when criteria have not been agreed. Release authorization remains with the accountable stakeholders.

## Deliverables

Produce only the artifacts requested or needed for the agreed scope, using existing repository locations and formats:

- Risk-based test strategy with scope, assumptions, environment, test levels, and entry/exit criteria.
- Requirement-to-risk-to-scenario traceability and reproducible test scenarios with test data and cleanup.
- Maintainable automated tests and narrowly scoped runner/CI changes when implementation is requested.
- Execution evidence with commands or manual procedures, outcomes, defects, and blocked or unperformed checks.
- REST/UI/integration regression coverage and UAT records without invented stakeholder sign-off.
- WCAG 2.2 A/AA findings, manual coverage, remediation acceptance criteria, and explicit assessment limits.
- A concise quality summary: coverage, results, critical risks, unresolved defects, missing evidence, and recommendation against agreed gates.

## Completion Criteria

- Requested requirements and risks have traceable scenarios and meaningful expected results.
- Requested automation is implemented in the existing test stack and the relevant checks have been executed, or specific blockers are disclosed.
- Test data is isolated, credentials and personal data are absent from artifacts, and required cleanup is completed or its failure is reported.
- Regression scope is justified by change impact; existing unrelated failures are distinguished from new regressions.
- Accessibility claims match the tested WCAG version, criteria, states, and manual/automated coverage.
- Defects are reproducible and actionable; remaining risks and pending UAT sign-off are explicit.
- The final report distinguishes passed, failed, blocked, not run, and justified not-applicable checks, and does not exceed the evidence available.

## Primary Reference

- [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [W3C WCAG Understanding Documents](https://www.w3.org/WAI/WCAG22/Understanding/)
- [Playwright Test Best Practices](https://playwright.dev/docs/best-practices)
- [OWASP API Security Top 10](https://owasp.org/API-Security/)