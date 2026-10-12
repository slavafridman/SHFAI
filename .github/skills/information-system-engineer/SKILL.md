---
name: information-system-engineer
description: 'Design modern TypeScript/Node.js information-system backends from existing legacy client-server systems. Use for legacy modernization, backend replacement, reverse engineering business rules, NestJS or Fastify target architecture, REST API design, TIBCO EMS/JMS integration, Oracle and other relational database design, and incremental migration planning. Produce evidence-backed technical designs, technology decisions, integration contracts, and verification plans. Not for routine legacy defect fixes or standalone frontend work.'
argument-hint: 'Describe the legacy system, modernization goal, target backend if known, constraints, and desired design detail.'
---

# Information System Engineer

## Purpose

Apply the practical judgment expected of an information-system engineer with 20 years of client-server architecture experience. Design a modern, supported backend from an existing information system, preserving approved business behavior while improving maintainability, security, reliability, and operational clarity. Use source and runtime evidence rather than presumed expertise.

This is a design workflow. Create or update design documents, not application code, project scaffolding, infrastructure, or production configuration unless separately requested. Preserve user changes and respect repository instructions and access restrictions.

## Inputs and Defaults

- Establish the business scope, legacy entry points, available source and design documents, integration partners, database ownership, and deployment constraints.
- Ask only unanswered questions that change the next design decision. Record provisional assumptions when work can proceed without an answer.
- Prefer TypeScript on a supported Node.js release, using NestJS or Fastify as appropriate. Honor an explicitly requested alternative and explain material compatibility tradeoffs. Do not assume a cloud provider or microservices.
- Reuse an existing relevant design document. If none exists, use the requested output path or propose `docs/<SYSTEM>_BACKEND_MODERNIZATION_DESIGN.md` before saving.
- Keep investigation read-only by default. Do not query sensitive business rows, execute legacy mutating actions, publish messages, or change schemas without explicit authorization.

## Workflow

### 1. Define the Modernization Boundary

1. Identify the requested outcome and one representative business use case to trace first. Establish what will be replaced, retained, adapted, or explicitly excluded.
2. Identify the legacy clients, application services, scheduled jobs, database aliases, stored procedures, and EMS integrations involved in that use case. Inspect actual versions and configuration where available.
3. Establish compatibility obligations: existing consumers, request and response shapes, message schemas, database readers and writers, authentication, and reporting dependencies.
4. Capture measurable requirements for latency, throughput, concurrency, availability, recovery time, recovery point, retention, and deployment. Mark missing targets as assumptions, not measured facts.
5. Separate behavior that must be preserved from defects or obsolete behavior that may change. Require an explicit decision for externally observable changes.

### 2. Recover Business Behavior and Source Contracts

1. Trace the selected use case from its actual entry point through authorization, validation, business decisions, SQL or PL/SQL, transaction completion, messaging, and the returned result.
2. Step past routing and registration code to the implementation that decides or mutates behavior. Use nearby call sites, tests, and descriptors to resolve ambiguities before widening the inventory.
3. Identify hidden effects: database commits inside procedures, triggers, scheduler work, validation that writes data, synchronous message waits, retries, and compensating actions.
4. Record contract details: identifiers, field types, nullability, date and time semantics, decimal precision, status transitions, error codes, confirmation warnings, and side effects.
5. Label evidence as observed in source, declared in configuration, documented, runtime-verified, proposed, or unknown. Cite workspace-relative file paths and symbols. Do not treat old comments or documents as proof when implementation differs.
6. Extend the inventory to the agreed scope using a contract map: legacy entry point -> business rule and authorization -> data and integration effects -> proposed REST or asynchronous operation -> compatibility check.
7. Define characterization cases with sanitized fixtures for representative success and failure behavior. Record inaccessible files and unavailable environments without bypassing restrictions or inventing evidence.

Gate: the selected business flow has an explainable result, transaction boundary, failure path, and source-backed compatibility obligation before its replacement is designed.

### 3. Select a Modern Target Architecture

- Define clear responsibilities for HTTP transport, application use cases, domain rules, persistence, integration adapters, and background workers. Keep business decisions out of controllers and message transport handlers.
- Use a modular monolith as the starting option for tightly coupled business transactions. Split services only for demonstrated ownership, independent deployment, isolation, or scaling needs. Explain consistency and operational costs.
- Start with TypeScript/Node.js. Choose NestJS for established application structure or Fastify for a lean service; NestJS can also use a Fastify adapter. Evaluate team capability, deployment constraints, security support, Oracle drivers, EMS interoperability, and total migration cost. Compare supported Java/Spring Boot or .NET/ASP.NET Core when constraints justify an alternative or integration bridge, and obtain agreement before replacing the preferred primary stack.
- Favor maintained releases and supported standards, not the newest version by default. Verify runtime, driver, framework, broker, and client compatibility against official vendor documentation; include the check date and unresolved gaps.
- For Node.js, keep blocking or CPU-heavy work off the request event loop, define runtime validation independently of TypeScript types, and verify Oracle driver mode, connection pools, and required native dependencies.
- For each major choice, record the recommendation, alternatives, rationale, migration effort, operational consequences, and conditions that would change the decision.
- Include a component/deployment diagram and a sequence diagram for a transaction-sensitive business flow. Show database commits, message publication, acknowledgments, timeouts, and recovery responsibilities explicitly.

Gate: each target component has an owner, deployment responsibility, contract, and justified boundary. Technology choices have a support and interoperability path.

### 4. Design REST API Contracts

- Model business resources and explicit commands where needed. Do not mechanically turn legacy screen routes, JSP forwards, or action names into APIs; client-side navigation is not a backend business endpoint.
- Specify an OpenAPI contract using a version supported by the selected tooling. Define methods, paths, request and response schemas, examples, status codes, authorization, validation, and compatibility rules.
- Keep GET and other safe methods free of business mutations. A legacy validation routine that changes records must not become a supposedly read-only endpoint.
- Define stable identifiers, required versus optional fields, omitted versus null values, enum evolution, monetary precision, large numeric identifiers, timestamps, business-local dates, and time zones.
- Use consistent error contracts, preferably RFC 9457 Problem Details where supported. Distinguish invalid input, authentication failure, forbidden access, conflicts, unavailable dependencies, and confirmable business warnings without exposing internal SQL or secrets.
- Design bounded pagination, filtering, sorting, and export limits. Use cursor/keyset pagination where justified; do not expose unbounded result sets.
- Define write concurrency through an atomic version check, such as ETag/If-Match or a version column. Define idempotency-key scope, persistence, retention, payload matching, and the result returned for duplicate commands.
- For long-running integration work, consider 202 Accepted with an operation resource and documented states. A timeout may mean an unknown outcome, not a business failure; provide status lookup and reconciliation.
- Define authentication and resource-level authorization, including tenant or organizational boundaries where applicable. Specify TLS, input limits, rate controls, audit events, and CSRF protection when cookie-based authentication requires it.
- Preserve required legacy contracts through versioning or adapters. Make intentional changes, deprecation, and consumer migration explicit.

### 5. Design Relational Data and Oracle Boundaries

- Establish actual schema evidence from authorized metadata, DDL, queries, and procedure signatures. Code references alone do not prove column types, constraints, triggers, indexes, or production schema contents.
- Define ownership, entities, keys, relationships, integrity constraints, sequence or identity usage, lifecycle, retention, and indexes justified by access patterns. Enforce critical invariants in the database as well as application validation.
- Map legacy data and stored procedure contracts to the proposed model. Retain suitable SQL and PL/SQL where useful; do not port proven database logic merely to claim modernization.
- Choose ORM, query builder, direct SQL, or a combination based on workload and driver support. Specify bind parameters, least-privilege accounts, connection pooling, and predictable resource cleanup.
- Account for Oracle empty-string/null behavior, NUMBER precision, DATE time components, timestamp and time-zone types, NLS conversions, character encoding, and multilingual data. Document differences if changing database engines.
- Define short transactions, isolation needs, locking, optimistic concurrency, rollback ownership, and procedure commits. Do not hold database locks while waiting for HTTP calls or EMS replies.
- For shared schemas, identify all legacy and new writers. Define ownership during coexistence and prevent incompatible writes or duplicated business effects.
- Plan expand/migrate/contract schema evolution, backfill, reconciliation, constraint validation, and recovery. Account for Oracle DDL implicit commits; do not promise that a transaction rollback can undo a schema deployment.
- Base performance recommendations on representative cardinalities, execution plans, lock behavior, and workload evidence. Label untested index and pool-sizing proposals as hypotheses.

### 6. Design TIBCO EMS Integration and Consistency

#### Establish the Existing Contract

- Verify queue versus topic semantics, destination ownership, factories or bindings, payload type, persistence, acknowledgment and transaction modes, subscriptions, redelivery settings, and recovery behavior from actual code and configuration.
- Record broker and client versions, supported protocols, TLS and authentication requirements, and client support for the target runtime. For Node.js, verify any proposed client or protocol against the deployed EMS broker. When direct support is unavailable or unverified, specify a supported Java or .NET bridge, including its internal command/result contracts, durability, security, and recovery. A generic AMQP or STOMP client is not automatically EMS/JMS-compatible.
- Preserve required XML namespaces, root elements, field names, encoding, headers, and schema versions. Specify schema validation and rejection behavior, including wrong-namespace and malformed-payload cases.
- Distinguish transport message IDs, correlation IDs, business IDs, ledger IDs, transaction IDs, and idempotency keys. Never assume similarly named identifiers are interchangeable.

#### Choose the Processing Model

- Use synchronous HTTP for bounded local operations when appropriate. Use durable asynchronous commands when partner latency, availability, or recovery requirements exceed the request budget.
- If a legacy request/reply contract must remain synchronous, use bounded waits and explicit timeout semantics without retaining database locks. Define reply routing, correlation, expiration, duplicate replies, and late-result reconciliation.
- For database state plus outbound messaging, prefer a transactional outbox when XA is not required: commit the business change and durable publication intent together, then let a worker publish with bounded retries.
- Treat the publish-success/worker-crash window as a duplicate-delivery risk. Design consumer idempotency using a stable key and atomic uniqueness or equivalent concurrency control.
- When inbound processing changes the database, commit deduplication state and domain changes atomically, then acknowledge according to the actual client/container mode. A crash after commit but before acknowledgment must be harmless on redelivery.
- If distributed XA transactions are required, verify both resources, client/container support, enlistment, timeout, and recovery configuration. Document the cost and test recovery; persistence or XA alone does not prove exactly-once business effects.
- For workflows spanning independently committed systems, define explicit states and compensation or reconciliation rather than implying atomic completion.

#### Define Failure Handling

- Specify retryable versus permanent failures, backoff, attempt limits, reconnect behavior, poison-message handling, and an explicitly configured failed-message destination. Do not assume a default dead-letter queue.
- Define ordering requirements per business entity, consumer concurrency, session/thread ownership, and supported grouping or sequencing mechanisms. Do not assume global ordering with parallel consumers.
- Define safe replay, audit, and operator recovery, including deduplication retention and authorized handling of failed messages. Prevent retry storms across HTTP, worker, and broker layers.

Gate: every cross-system command has a durable owner, idempotency strategy, bounded retry policy, timeout interpretation, and reconciliation path.

### 7. Plan Coexistence, Migration, and Operations

- Use incremental replacement with a compatibility facade or anti-corruption adapter when it reduces risk. Start with one testable vertical business flow and explicit routing and ownership rules.
- Plan stages for characterization, target implementation, isolated verification, data migration, controlled traffic cutover, and legacy retirement. Define entry and exit criteria for each stage.
- Avoid uncoordinated dual writes. Shadow execution must not mutate business data or emit partner messages; active parallel consumers must not apply the same business effect twice.
- Define data reconciliation checks, cutover windows, in-flight message handling, rollback triggers, backward-compatible schema requirements, and forward recovery when new writes make rollback impractical.
- Specify deployment and configuration boundaries, secret management, database migrations, TLS/certificate lifecycle, backup/restore, and disaster-recovery responsibilities without assuming a specific cloud provider.
- Design structured logs, metrics, tracing, and audit trails around request, business-operation, and message correlation IDs. Protect personal data and credentials; do not log raw sensitive payloads.
- Monitor latency, failures, database pool saturation, lock contention, queue depth, redelivery, outbox age, and stuck operations. Define alerts and runbooks tied to service objectives.
- Define readiness, liveness, graceful shutdown, draining of requests and consumers, and capacity limits that account for both database and broker constraints.

### 8. Verify and Deliver the Design

1. Check traceability: every in-scope legacy use case maps to target contracts, data ownership, security rules, migration steps, and acceptance cases.
2. Validate available artifacts with repository tooling and appropriate parsers: OpenAPI, JSON examples, XML schemas, SQL metadata, diagrams, and documentation links. Reuse existing checks; do not claim they cover new artifacts without inspecting their scope.
3. Specify contract, characterization, authorization, concurrency, integration, load, and migration tests proportional to the design's risk.
4. Cover critical failure windows: outbox commit before publish, publish before recording success, consumer database commit before acknowledgment, rollback and redelivery, broker restart, retry exhaustion, poison messages, lost or late replies, and concurrent updates.
5. Verify reconciliation and recovery cases, including decimal/date/null mapping, migration completeness, cutover ownership, and rollback or forward recovery.
6. Separate checks actually executed from proposed tests and environment-dependent verification. Name unavailable Oracle, EMS, partner, or deployment checks and what is needed to perform them.
7. Present the recommended design, evidence, alternatives, risks, unresolved questions, and next implementation milestone. Do not describe proposals as deployed or runtime-proven behavior.

## Design Deliverable

Scale detail to the requested scope. Produce one coherent document, updating related existing sections instead of generating duplicate catalogs. Include these sections where relevant; explain omissions rather than inventing detail:

1. Executive recommendation, business scope, constraints, assumptions, and evidence status.
2. Legacy behavior and contract map, including dependencies and hidden side effects.
3. Target components, deployment and sequence diagrams, and technology decision records.
4. REST endpoint contracts, schemas, examples, authorization, errors, and concurrency rules.
5. Relational model, Oracle/procedure mappings, integrity and transaction boundaries.
6. EMS destinations and payload contracts, processing states, consistency, retries, and recovery.
7. Security, observability, capacity, operational ownership, and service objectives.
8. Coexistence, data migration, cutover, rollback or forward recovery, and retirement stages.
9. Acceptance and verification matrix, executed checks, residual risks, and open decisions.

## Completion Criteria

- Approved business behavior and intentional changes are traceable from legacy evidence to the target design.
- Modern technology choices have explicit support, compatibility, maintainability, and migration rationale.
- REST, relational database, and EMS contracts agree on identifiers, states, authorization, and failure semantics.
- Database transactions, message acknowledgments, duplicate processing, partial failures, and reconciliation have explicit owners and recovery paths.
- Migration stages prevent conflicting writers and duplicated side effects, with realistic cutover and recovery criteria.
- Assumptions and unavailable checks remain visible; no secrets, unauthorized writes, deployments, or unrelated application changes were introduced.
- The design ends with a concrete implementation milestone and measurable acceptance criteria.