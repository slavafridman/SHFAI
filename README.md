# Shifter — local Windows developer delivery

This repository contains the existing backend and Angular fixture slices, not a
feature-complete Shifter release. Packaging is not deployment, authentication
readiness, M2–M5 completion, production approval or a release certificate.

## Prerequisites

- Native Windows PowerShell 5.1 (`powershell.exe`); no WSL or Docker.
- Approved installed Node.js **24.21.0**, npm **11.19.0**, TypeScript **5.9.3**.
- Existing locked packages: Angular **21.2.25**, Angular CLI/build **21.2.27**,
  Material/CDK **21.2.14**, `oracledb` **26.0.0**, and the explicitly approved
  frontend test-tool patch Vitest **4.0.9**. Dependencies must already be
  installed in their existing locations. Missing/mismatched dependencies stop
  delivery; the script never installs or upgrades them.
- Native `.mts` execution uses Node 24 type stripping; backend `typecheck` is
  no-emit, not a backend transpilation step.
- Oracle 11g / Thick Client **19.3** is the approved external combination for
  separately authorized Oracle work. No client is bundled, loaded or verified
  against a database by this delivery command. Offline checks are not live
  interoperability certification.

## One entrypoint

From the repository root:

```powershell
powershell.exe -NoProfile -File scripts/Build-Shifter.ps1 -Profile test -Validation
```

`-Profile dev|test|production` is mandatory; no implicit DEV fallback.
`-Validation` runs both full offline test suites. Both typechecks, the selected
Angular build, existing public profile check, runtime-closure verification and
ZIP assertions always run. Native child failures retain their real nonzero exit
code and no failed run leaves a successful ZIP/stage.

Actual existing package commands are reused:

```text
backend/fixture-slice:  npm run typecheck
frontend/fixture-slice: npm run typecheck
backend/fixture-slice:  npm test              (with -Validation)
frontend/fixture-slice: npm test              (with -Validation)
frontend/fixture-slice: npm run build:<profile> -- --output-path <owned-output>
frontend/fixture-slice: npm run check:profile -- <profile> <owned-output>/browser
```

Output is exclusively
`.shifter-developer-delivery/<profile>/frontend-build`, `stage`, and
`shifter-developer-<profile>.zip`. Each rerun replaces only those three exact
owned outputs. An alternate/broad/source `-OutputDirectory` is rejected; links
and junctions are rejected. Do not use the same profile concurrently. No cleanup
touches the pilot-owned `frontend/fixture-slice/dist` or other shared build folders.
Angular may use its existing local build cache. Tests use their established
isolated doubles; no live Oracle/broker check or app service start is requested.

For focused tooling checks (no application build, no DB/service):

```powershell
powershell.exe -NoProfile -File scripts/Test-Build-Shifter.ps1
```

### Known validation limitation

Historical Vitest **4.0.8** runs intermittently reported
`[vitest-pool]: Timeout starting threads runner` before collecting any tests
and remained alive after reporting the error. The user-approved **4.0.9** patch
includes upstream PR **9027**: the vendor's outer startup budget previously
expired at 5 seconds around an inner 10-second budget; published defaults are
now 90/60 seconds. This is an approved upstream test-tool correction, not a
local timeout override. Delivery adds no automatic retries, worker-pool changes,
vendor edits or forced-success exits.

The precise underlying OS/Worker-start delay cause is not established by that
patch or by later passing runs. Runtime validation is evidenced only by a
specific `-Validation` invocation completing both suites and exiting naturally
with 0; approval/installing 4.0.9 alone is not a passing result. A recurrence
fails that validation gate and must be investigated by frontend tooling/QA.
Stop only the failed run's identified owned processes if it does not exit;
do not terminate a pilot or another operator's process.

The supported command without `-Validation` produces a compiled developer
snapshot with typechecks/profile/packaging checks, but does not run either full
unit suite and must not be reported as full-validation success.

## Distribution boundaries

The ZIP contains the backend `server.mts` import closure (including type-only
dependencies), unchanged backend package manifest/lock, three explicitly
validated inert config examples, selected compiled browser assets, generated
third-party notices when present, and versioned delivery/build README text.
It excludes tests/test drivers, live-check entrypoints, application source maps
outside the selected dev browser build, `.env` files, private operator files,
allowances/sessions, credentials, personal data, screenshots, legacy code,
`node_modules` and Oracle client libraries. Inputs are explicitly enumerated;
the repository is never recursively swept into an archive. No `.env` is read,
no environment dump is made, and no credentials are embedded.

Runtime dependencies are **not bundled**. After extraction, an operator may
explicitly run `npm ci --omit=dev` inside the packaged `backend` using the
unchanged lockfile. That is a user-run online installation step, not performed
by the build. The package does not contain the source/test toolchain needed to
rerun `typecheck` or `npm test`; run those from this source checkout.

See `scripts/DeveloperDistribution.README.md` for explicit isolated fixture
startup, configuration constraints and the temporary synthetic-login limitation.
The frontend keeps frozen `{appEnv, apiBasePath}` with relative `/api`.
There is no packaged static server or new routing/auth framework. Serving the
assets and mapping `/api` require separately approved operator configuration.
Browser profile selection does not authorize backend access or native writes.
