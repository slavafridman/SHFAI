---
name: j2ee-websphere-engineering
description: 'Design, implement, debug, and review enterprise information systems using J2EE, Java EE, IBM WebSphere, Struts, TIBCO EMS/JMS, Oracle SQL and PL/SQL, HTML, JSP, Dojo, and JavaScript. Use when working on legacy enterprise architecture, EJBs, servlets, transaction boundaries, messaging reliability, database performance, or frontend defects in this stack.'
argument-hint: 'Describe the feature, defect, design question, or review target.'
---

# J2EE and WebSphere Engineering

## Purpose

Apply the judgment and technical depth expected of a software engineer with 30 years of enterprise information-system design and delivery. Produce compatible, maintainable, evidence-backed solutions across the backend, integration, database, and frontend layers. Check actual code and runtime behavior instead of relying on presumed expertise.

## Workflow

### 1. Establish the Task and Compatibility Baseline

- Identify the requested outcome: design, implementation, debugging, performance investigation, or code review. For design and review requests, do not modify application code unless requested.
- Start from the supplied file, symbol, failing command, error, or user-visible behavior. Read applicable repository instructions and preserve existing user changes.
- Establish the Java language level, J2EE/Java EE level, WebSphere edition and version, Struts major version, EMS client and broker versions, Oracle server and JDBC driver versions, Dojo version, and supported browsers for the affected path.
- Distinguish traditional WebSphere from Liberty and Struts 1 from Struts 2. Determine whether the application uses `javax.*` or `jakarta.*`; never migrate namespaces implicitly.
- When a relevant version or runtime setting cannot be established locally, state the uncertainty and request only the information needed for the next decision.
- Preserve the current stack and public contracts by default. Discuss modernization when it materially improves security, supportability, maintainability, or a demonstrated operational constraint; compare benefits, migration effort, compatibility risks, and deployment impact.
- Keep modernization proposals separate from the requested compatible change. Dependency upgrades, namespace migrations, and platform changes require an explicit request or approval.

### 2. Trace the Controlling Code Path

- Follow the smallest relevant path from the entry point to the code that controls the behavior. Typical paths are Struts action -> service/EJB -> Oracle or JMS, and EMS destination -> message-driven bean -> service -> Oracle.
- For frontend defects, trace the JSP or tag library, Dojo/JavaScript handler, request payload, server-side validation, and rendered response as needed.
- Identify ownership of request state, database connections, JMS sessions, transactions, and resource cleanup. Locate a nearby test or a reproducible, authorized check.
- Form one falsifiable local hypothesis and choose the cheapest check that could disconfirm it before editing. Avoid mapping unrelated modules.
- Work in source and configuration files. Leave generated classes, deployment archives, bundled libraries, and vendored Dojo code unchanged unless the task specifically requires them.

### 3. Select the Work Path

- **Design:** Define functional and operational requirements, component responsibilities, integration contracts, transaction boundaries, security controls, and failure recovery. Compare viable options and recommend one with explicit compatibility and operational tradeoffs.
- **Implementation:** Reuse the nearest established pattern, preserve existing APIs and data contracts, and implement the smallest complete change.
- **Debugging:** Reproduce the symptom, correlate relevant sanitized logs and request/message identifiers, test the local hypothesis, and fix the controlling cause.
- **Performance:** Establish a baseline and identify whether time is spent in SQL, lock waits, connection pools, JVM activity, messaging, network calls, or browser work before proposing tuning.
- **Review:** Report concrete bugs, security risks, compatibility regressions, and missing tests first, ordered by severity with file references and evidence. Keep speculative improvements separate.

### 4. Apply the Relevant Technology Checks

#### J2EE and IBM WebSphere

- Respect the installed Java/J2EE API level, WAR/EAR/EJB packaging, deployment descriptors, declared interfaces, JNDI names, and serialization contracts.
- Prefer container-managed resources and supported lifecycle APIs. Do not introduce unmanaged threads or bypass established connection and session management.
- Identify container-managed versus bean-managed transactions and JTA boundaries. Do not manually commit or roll back a connection participating in a container-managed transaction.
- If Oracle and JMS must commit atomically, verify actual XA resource enlistment and recovery configuration. Otherwise document the failure window and use the existing idempotency, compensation, or outbox pattern where appropriate.
- Investigate classloading, security roles, transaction timeouts, thread pools, and resource pools using configuration and diagnostics appropriate to the installed WebSphere edition and version. Do not tune settings without evidence.

#### Struts

- For Struts 1, inspect action mappings, `ActionForm`, validation, and `ActionForward`. For Struts 2, inspect action configuration, results, interceptors, and value binding. Do not mix framework-specific patterns.
- Keep request-specific mutable state out of shared handlers and services. Follow existing form-binding and validation conventions, with authoritative validation on the server.
- Check authorization for each affected action and resource, CSRF protection for state changes, input binding restrictions, and context-appropriate output escaping.
- Keep business logic in the existing service layer rather than JSPs or presentation handlers.

#### TIBCO EMS and JMS

- Establish queue versus topic semantics, JNDI connection factory and destination bindings, persistence, acknowledgment mode, transaction mode, durable subscriptions where applicable, and the broker's actual recovery settings.
- Trace receive, processing, commit/acknowledgment, rollback, and retry paths. Acknowledge success only after required work completes, consistent with the configured JMS or container transaction mode.
- Expect duplicate delivery and design or preserve idempotent processing using stable business or message identifiers. Do not claim exactly-once business effects merely because messages are persistent or XA is enabled.
- Verify bounded redelivery, poison-message handling, and the configured failed-message destination. Preserve ordering only where the contract requires it; do not assume a default dead-letter setup.
- Check consumer concurrency, JMS session thread safety, reconnection, and resource cleanup. Avoid logging credentials or full sensitive payloads.

#### Oracle Database

- Use bind variables and appropriate JDBC types. Preserve numeric precision, null handling, sequence usage, and resource cleanup patterns supported by the installed Java level.
- Diagnose slow SQL using authorized execution plans, representative bind values and cardinalities, and available lock/wait information. Recommend indexes or SQL changes based on evidence, accounting for write cost and existing indexes.
- Inspect PL/SQL signatures, exception mapping, transaction ownership, and commit behavior. Account for Oracle DDL's implicit commits when planning schema changes.
- Check date/timestamp semantics, time zones, NLS-dependent conversions, and multilingual character handling. Avoid implicit conversions that change behavior or prevent index use.
- Keep production investigation read-only unless explicitly authorized otherwise. Schema changes and data corrections require a reviewed execution plan, validation, and a realistic rollback or recovery plan.

#### HTML, JSP, Dojo, and JavaScript

- Preserve existing JSP tag libraries, Dojo widgets, module-loading style, supported JavaScript syntax, and browser compatibility. Check whether the code uses legacy Dojo loading or AMD before changing dependencies.
- Escape untrusted values for their actual HTML, attribute, URL, or JavaScript context. Do not move database access or domain logic into JSPs or browser code.
- Verify request parameters, server-side validation errors, asynchronous updates, widget lifecycle, and affected loading, empty, and error states. Avoid duplicate event registration and stale widget references.
- Preserve the application's established visual language and right-to-left layout where applicable. Provide keyboard access, visible focus, and meaningful accessible names; write accessibility labels in Hebrew for this workspace.
- For visible UI changes, check the affected interaction and layout at relevant desktop and mobile sizes. State explicitly when the application server or browser environment is unavailable.

### 5. Implement and Validate Incrementally

- Make a small, reversible change in the controlling code path, including a focused regression test when the repository has a suitable test location.
- Immediately run the cheapest meaningful check after the first substantive edit. Prefer the reproducer or targeted test, then a narrow compile, lint, or configuration check.
- If the check exposes a local defect, repair the same path and rerun it. If it disproves the hypothesis, step to the nearest owning abstraction before broadening investigation.
- Verify the success path and relevant failure paths. For transaction or messaging changes, check rollback, duplicate delivery, retry exhaustion, and partial failure where applicable.
- Use the repository's actual build and deployment tooling. Do not assume Maven, Gradle, modern Java, an available application server, or access to EMS and Oracle.
- Do not deploy, change broker settings, rotate credentials, or execute production writes without explicit authorization. Never print or store secrets in diagnostics or skill resources.

### 6. Deliver the Result

- For code changes, summarize the behavior changed, reference the affected files, and report the checks actually run and their outcomes.
- For design, provide the recommended architecture, alternatives considered, integration and transaction contracts, operational implications, and unresolved assumptions.
- For reviews, lead with severity-ordered findings and evidence; if none are found, say so and identify remaining verification gaps.
- Distinguish local test evidence from environment-specific integration verification. Name unavailable checks and the concrete command or scenario needed to complete them.

## Completion Criteria

- The requested outcome is covered without unrelated refactoring or silent modernization.
- Relevant runtime versions and configuration assumptions are verified or explicitly marked unknown.
- Existing public interfaces, data semantics, transaction ownership, and messaging contracts are preserved or intentionally changed with approval.
- Relevant security, resource lifecycle, concurrency, database, and frontend risks have been checked.
- Focused validation covers the changed behavior and meaningful failure paths, or remaining environment limitations are stated clearly.
- Generated artifacts, unrelated user changes, and sensitive environment data remain untouched.
- The final response is concise, evidence-backed, and clear about any deployment or integration steps still required.