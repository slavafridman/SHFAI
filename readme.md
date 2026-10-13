# Shifter (SHF)

Local application foundation for the workforce system described in the
[agent brief](docs/AGENT_INSTRUCTION.md) and
[development plan](docs/plan-shfAiAgentDevelopment.prompt.md).

## Approved Scope

On 2026-10-13 the user explicitly approved **the local foundation only**:
TypeScript NestJS/Fastify backend, modern Angular/Material Hebrew/RTL shell,
isolated tests and build tooling in this repository.

This does not approve the draft architecture or business API/UI contracts,
identity mechanism, Oracle access, writes, broker transport, infrastructure,
deployment or release. No business endpoints, database driver, credentials,
partner implementation, batch jobs or simulated employee/shift results are
included. Unimplemented business routes return framework-standard 404 responses.
The web shell does not call the API.

Existing user work is preserved. The [legacy source](old/) remains read-only
evidence and is outside the application compilation and asset inputs.

## Plan Analysis

The plan correctly prioritizes read-only slices and pure previews, separates
external approvals from active execution, and requires individual write/recovery
gates under an unchanged Oracle schema. Its arithmetic is internally consistent:
36-72 active hours, or 45-90 with the proposed 25% reserve. These are provisional
budgets, not measured estimates or a calendar commitment.

Important readiness gaps remain:

- G1 architecture/API/UI approval is pending. This scaffold approval is a narrow
  exception permitting foundation work, not a blanket G1 approval.
- Personal-shifts contracts, synthetic characterization fixtures, trusted
  identity and organizational authorization must precede a connected feature.
- The DBA must authorize an environment, metadata and data scope before any
  Oracle connection; local writes require separate concurrency/recovery proof.
- Browser checks and isolated tests cannot establish Oracle parity, partner
  completion, human UAT, accessibility certification or release readiness.
- The plan's description of available agents is a historical harness snapshot,
  not a permanent tooling constraint. This task uses one implementing assistant
  and makes no parallel-agent speedup claim.
- R02 is only partially covered. Shared contracts/client generation, identity,
  error/DTO conventions, CI and deployment-platform decisions are not completed
  by this scaffold. No unused domain/persistence/integration packages are added.

## Toolchain

Versions were checked against published package engines/peer dependencies and
official support documentation on 2026-10-13:

| Component | Version |
| --- | --- |
| Node.js LTS | 24.21.0; supported project range `^24.15.0` |
| npm | 11.19.0 |
| Angular core, CLI, build, Material/CDK | 22.2.2 |
| TypeScript | 6.0.3, within Angular's `>=6.0 <6.1` range |
| NestJS / Fastify adapter | 12.1.3 |
| Fastify | 5.12.5, adapter dependency locked in the root lockfile |
| RxJS | 7.8.2 |
| Frontend unit runner | Vitest 5.0.4 with jsdom 30.1.2 |
| Backend unit runner | Node.js built-in test runner |

Do not upgrade TypeScript independently to the latest major: the published
Angular compiler/build peer range does not allow TypeScript 7.

References: [Angular compatibility](https://angular.dev/reference/versions),
[Angular support](https://angular.dev/reference/releases),
[Angular testing](https://angular.dev/guide/testing),
[Node releases](https://nodejs.org/en/about/previous-releases).

## Install And Run

Run from the repository root using the versions above:

```powershell
npm ci
```

In two separate terminals:

```powershell
npm run dev:api
```

```powershell
npm run dev:web
```

- API: `http://127.0.0.1:3000`, loopback-only. Set `PORT` to a valid integer
  between 1 and 65535 to change it. There is deliberately no business or health
  endpoint. Restart this command after backend source changes.
- UI: `http://127.0.0.1:4200`, loopback-only with Angular development reload.
- Production compilation: API output in `apps\api\dist`; static UI output in
  `apps\web\dist\shf-web\browser`. Build output does not authorize deployment.
- Use the single root lockfile; do not run independent workspace installs.
- Local configuration files such as `.npmrc` may be restricted by organizational
  policy; no change to the restricted file was made by this task.

## Verification

```powershell
npm run check
```

This runs TypeScript ESLint, strict API and Angular/template type checks,
isolated unit tests and production builds. It does not run legacy code, connect
to Oracle, publish messages or perform business mutations.

Focused commands:

```powershell
npm test --workspace=@shf/api
npm test --workspace=shf-web
npm run typecheck
npm run lint
npm run build
```

API tests use Fastify injection without opening a socket, checking absent
business routes and invalid port configuration. UI tests use jsdom, checking
Hebrew landmarks, the skip link, mixed-direction isolation, disconnected states
and unavailable sign-in. ESLint covers TypeScript; strict Angular compilation
covers template typing, not a full HTML/CSS accessibility audit.

The [web README](apps/web/README.md) defines the shell's accessibility checks.
Human Hebrew screen-reader assessment, live Oracle/identity/partner tests,
business acceptance, performance targets and release approval remain pending.

### Executed Foundation Checks, 2026-10-13

- Clean root `npm ci`: passed.
- Root `npm run check`: passed; lint, strict types, two API tests, three frontend
  tests and both production builds. Initial CommonJS compilation failed against
  NestJS 12's ESM packages; native ESM with NodeNext resolution passed on retest.
- Live loopback smoke: UI returned HTTP 200; `/me/shifts` returned the intended
  HTTP 404. These are local process checks, not live business integration.
- Browser: Hebrew language and RTL direction, keyboard skip-link/main focus,
  disabled sign-in and no horizontal overflow at 1280, 768 and 320 CSS pixels.
- At 320 CSS pixels, introductory text resized from 16px to 32px without
  horizontal overflow. Targeted text contrast checks exceeded 4.5:1; this is not
  a full accessibility assessment.
- Browser reload reported no page errors or requests outside the local UI
  origin. No Oracle, broker or personal-data checks were executed.

The editor test tool did not discover the backend tests; the declared npm/Node
runner executed them successfully. npm emitted install-script review warnings
for four transitive build packages; no additional script approvals were made.
Both clean installation and builds succeeded with the current environment.

## Next Milestone

Complete and approve the R01 personal-shifts API/UI and identity baseline, then
implement one characterized read-only slice with explicit scope and zero effects.
Do not infer permission for business implementation from the local foundation.