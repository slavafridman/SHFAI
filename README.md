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

## Production Docker image preparation (not deployment)

The approved packaging target is **Linux amd64 containers**, built from native
Windows PowerShell using Docker Desktop without WSL commands. This is separate
from the developer ZIP. No application behavior, authentication provider,
backend listener binding, database schema or EMS transport is changed.

- [Backend image](docker/backend.Dockerfile): existing Node 24 native `.mts`
  runtime, non-root `node`, locked production dependencies only, no lifecycle
  scripts, Oracle client libraries, credentials or automatic synthetic login.
  The base image must contain Node **24.21.0** and npm **11.19.0**; the image
  build verifies both rather than silently upgrading either.
- [Frontend image](docker/frontend.Dockerfile): approved unprivileged NGINX
  Debian Bookworm baseline, UID/GID 101, port 8080, compiled production browser
  assets and generated third-party notices. [NGINX configuration](docker/nginx.conf)
  supports SPA deep links, immutable hashed JS/CSS, noncached HTML and missing
  asset 404s. `/api` and `/api/*` deliberately return **503**, not the SPA or a
  simulated backend response. `/healthz` checks **only the static frontend**;
  it does not assert backend, authentication or Oracle readiness.
- [Build context](.dockerignore): default-deny allowlist of the generated
  production payload and NGINX configuration. No repository sources outside the
  validated runtime closure, tests, legacy files, `.env`, private configuration,
  source maps, installed host dependencies or Oracle clients are sent to Docker.
  Use the repository root as the context; do not bypass the ignore file.

### Build command

The platform owner must select available, supported Linux base manifests from
the approved repositories, review their provenance/vulnerability results and
record their immutable digests. Tags alone are rejected because upstream tags
move. No digest is invented or silently substituted. Resolve the public image
references with `docker buildx imagetools inspect node:24.21.0-bookworm-slim`
and `docker buildx imagetools inspect nginxinc/nginx-unprivileged:stable-bookworm`
once the engine/registry are available; confirm the selected manifests include
`linux/amd64`. Base availability and Linux Oracle compatibility are not proven
by successful Windows source tests.

Replace both placeholders with the reviewed 64-character SHA-256 digests:

```powershell
powershell.exe -NoProfile -File scripts\Build-Docker-Shifter.ps1 `
  -NodeImage 'node:24.21.0-bookworm-slim@sha256:<reviewed-node-digest>' `
  -NginxImage 'nginxinc/nginx-unprivileged:stable-bookworm@sha256:<reviewed-nginx-digest>' `
  -ImageTag 'production-preparation'
```

The [Docker builder](scripts/Build-Docker-Shifter.ps1) checks the Linux engine,
runs the existing **production** source build **with `-Validation`** (both full
offline suites, typechecks, profile/closure/ZIP and production-auth rejection
checks), then builds `shifter-backend:<tag>` and `shifter-frontend:<tag>`.
It checks NGINX syntax and production authentication rejection inside transient,
read-only, network-isolated containers, and prints local image IDs only after
all checks pass. No ports, databases or brokers are opened by these checks.
Builds fetch public base images and locked npm runtime packages; source
validation uses the already installed approved toolchain. It never pushes,
logs in to a registry, deploys or changes Docker Desktop settings.

A nonzero command stops dependent work and is propagated. A failed later image
build/check can leave intermediate or tagged local images; those are **not a
successful preparation result**. Do not publish them. Docker cache and existing
images are never broadly pruned or removed. Do not run this command concurrently
with another production-profile developer build because they share its exact
owned staging paths.

Focused, offline packaging checks:

```powershell
powershell.exe -NoProfile -File scripts\Test-Docker-Shifter.ps1
```

These are static/mocked checks, not image-build or container-runtime evidence.
Current verification and infrastructure blockers are in
[the project checkpoint](docs/PROJECT_STATUS.md).

### Remaining deployment gates

**These images are not an operable production deployment.** The current backend
intentionally rejects production without a real authentication provider, rejects
synthetic Administrator in production, and still binds to `127.0.0.1`. Its
production default has no configuration, so `docker run shifter-backend:<tag>`
exits nonzero rather than opening a service. Do not set DEV/synthetic mode to
bypass that gate. No backend port or healthcheck claims a working production API.

Before any release: the authentication/architecture owner must supply the
approved real provider and production configuration; application/platform owners
must approve and test backend network binding and same-origin `/api` routing;
the Oracle/platform owner must approve Linux Thick Client compatibility,
licensing, approved external secrets and scoped access; QA must run actual image
HTTP/deep-link/API-negative, shutdown and end-to-end checks; the platform owner
must record image digests, vulnerability/provenance checks, TLS and rollback
configuration; the user must explicitly approve release/deployment and registry
publication. Production Compose operation remains excluded while these gates are
unresolved. The separate explicit local-demo package below does not remove them.

## Explicit empty DEV Docker demo package — Docker-v0.1

**Task SHF-BUILD-51-DOCKER-LOCAL-v0.1, 1 November 2026: built and container-checked,
not deployed.** The current Linux Docker engine is available; the historical
engine failure is not the result of this run. No service was left running and
the URL below is an operator target, not a verified host endpoint.

This packaging-only extension uses one nonroot container: the unchanged backend
listens on `127.0.0.1:4301`, and unprivileged NGINX listens on 8080 and proxies
the original `/api` paths over shared container loopback. No application source,
listener guard, capability, business API, authentication contract or lockfile is
changed. Only explicit `dev` plus `synthetic-empty-dev` is supported. TEST demo,
management/CSV fixture modes, real login, Oracle and native writes are excluded.

### Prerequisites, provenance and exact inputs

- Native Windows PowerShell, Node **24.21.0** / npm **11.19.0**, and the existing
  installed source toolchain: TypeScript **5.9.3**, Angular **21.2.25**,
  CLI/build **21.2.27**, Material/CDK **21.2.14**, Vitest **4.0.9**.
- This run verified Docker Desktop **4.73.1**, Linux amd64 engine **29.4.3**,
  Compose **5.1.3**, using the existing local Desktop connection. No WSL,
  context/settings change, restart, registry login/push or host install.
- Reviewed public repository/index references (Linux amd64 selection):
  `node:24.21.0-bookworm-slim@sha256:d6aa754f16b3197301076f047b5def2f02ea1dbbc2ca920407d46d7ec7f87b20`
  and
  `nginxinc/nginx-unprivileged:stable-bookworm@sha256:cd33960e98e93d4d63385790ff7f8f5bf2ca95184c581b7f42ae8aea1139fbfc`.
  `docker buildx imagetools inspect <reference>` and isolated base execution
  verified public manifests, Bookworm, Node/npm and NGINX **1.28.0**. This is
  reference/runtime provenance review, **not** signature, SBOM or vulnerability
  certification. The final demo Dockerfile rechecks exact binaries, Debian and
  `ldd` resolution. It retains the complete trusted NGINX base and copies only
  the Node executable, Bookworm `libstdc++`/`libgcc` and locked runtime dependency
  closure from the Node stage. No apt upgrade or new supervisor dependency.
- Locked `oracledb` **26.0.0** is installed using
  `npm ci --omit=dev --ignore-scripts --no-audit --no-fund` **inside the build
  only**. Its presence is not execution: fixture startup has forbidden pool
  factories and a driver-import tripwire. npm and development dependencies
  are absent from the final demo image. No Oracle Client is supplied; Oracle
  11g/Thick Client 19.3 interoperability remains untested and outside demo scope.

[Build-LocalDemo-Shifter.ps1](scripts/Build-LocalDemo-Shifter.ps1) reuses
`Build-Shifter.ps1 -Profile dev -Validation` unless explicit
`-ReuseValidatedPayload` is selected. Reuse requires full-validation DEV metadata
at current HEAD, a matching canonical scoped source-byte snapshot, canonical ZIP names/bytes/hashes, and
current exact `.mts` import closure/manifests/example hashes. It emits each
context path, byte count and SHA256. A unique temporary context contains only
the 126-module closure, manifests/lockfile, approved inert DEV example, selected
browser JS/CSS/index and five packaging files, guarded by an exact generated
per-file default-deny `.dockerignore`. It is removed in `finally`.
The repository root is **never uploaded** by this builder. The existing root
`.dockerignore` remains production-only. No maps, tests, legacy, host
`node_modules`, operator files, secrets, `.env`, Git, user docs or private
configuration enter the demo context. DEV generated no third-party notice file;
none was invented or borrowed from a different profile.

The canonical builder records `SOURCE` rows (path, length and SHA256), their
canonical UTF-8/LF aggregate hash and file count in `BUILD.md`, and rejects
source-byte changes between the beginning and successful end of the build.
These rows cover enumerated backend modules/tests/package/tooling inputs and
the three inert config examples, plus frontend source/checks/package/tooling
inputs; they are evidence, not bundled source. Documentation and private
operator inputs are not read for this proof. Uncommitted approved UI changes
can therefore be validated without changing Git or pretending HEAD identifies
their bytes. Old HEAD-only metadata is rejected, even if its full-validation
marker is present. After source changes, run one fresh canonical DEV
`-Validation` before selecting `-ReuseValidatedPayload`; refreshing TEST and
PRODUCTION ZIPs without `-Validation` does not claim another full-suite pass.

### QA-UI-01 packaging refresh — 1 November 2026

Executed from `D:\AIProjects\SHFAI`, with existing dependencies and the reviewed
immutable Node/NGINX bases unchanged:

```powershell
powershell.exe -NoProfile -File scripts/Test-Build-Shifter.ps1
powershell.exe -NoProfile -File scripts/Build-Shifter.ps1 -Profile dev -Validation
powershell.exe -NoProfile -File scripts/Build-Shifter.ps1 -Profile test
powershell.exe -NoProfile -File scripts/Build-Shifter.ps1 -Profile production
powershell.exe -NoProfile -File scripts/Build-LocalDemo-Shifter.ps1 `
  -DemoOptIn synthetic-empty-dev -ReuseValidatedPayload
powershell.exe -NoProfile -File scripts/Test-LocalDemo-Shifter.ps1 `
  -ContainerChecks -IngressContainerChecks -ComposeChecks -HostPort 18080
powershell.exe -NoProfile -File scripts/Test-Docker-Shifter.ps1
```

All exited 0. Focused delivery checks: **45**; fresh DEV backend tests:
**1,863**, frontend: **751 / 55 files**; static/mocked production Docker
checks: **26** (not production image rebuilds). All three builds passed
typechecks, public profile checks, exact closure/ZIP checks and extracted
production rejection with zero live dependency IO. The old HEAD-only DEV
proof was separately rejected before Docker build.

New `shifter-local-demo:dev` image ID:
`sha256:58af8fb65767455e59f43044efc4bf846385777335df8c9c28b25843b1794082`.
Actual isolated container checks: **55 focused assertions plus embedded
runtime checks**, including production/default/Oracle-injection rejection,
UID101, readiness and failure honesty, PID supervision and graceful drain.
An additional no-network/read-only image probe compared all **157 application
files** against current DEV stage lengths/SHA256. The **162-file** strict
temporary context had manifest SHA256
`C933F8EBF5A39D544969B8A1170944341DDA333C50175C0917DA38A0F4BB9032`.
The locked dependency-install layer was cached; no host install or fresh
container dependency installation ran.

Source snapshot: **418 files**, SHA256
`715C5C0F46DDCDF1C0CB1597E1AE941D16152916C28315E25C5E3CB97D6C0263`.
Runtime closure: **126 modules**, canonical path/length/hash rows SHA256
`BF1874E94F2D3712BF90B810DED993802582826A4748B85C3C94228EB944FEEF`.
Hashes use UTF-8 rows joined by LF with a final LF.

| Refreshed ZIP under `.shifter-developer-delivery/` | Bytes | Entries | SHA256 |
|---|---:|---:|---|
| `dev/shifter-developer-dev.zip` | 2,247,414 | 204 | `F57D86A638028C7132F143480B5482F6FCF7E0096ADDFCCE365D2B456DD5EBCB` |
| `test/shifter-developer-test.zip` | 742,819 | 162 | `B3A8DD78B8A5E69514BFFEAFA884B9299CF6DA412131508F67723C95EFA00A43` |
| `production/shifter-developer-production.zip` | 742,853 | 162 | `162C2B13F7F1218AA35DFEF71D1B69119BD337E891855E8B5AFAADC689DCAF14` |

No service operation was performed. At handoff, project `shf-local-demo`
still ran the old healthy demo image `sha256:d5ca4625abce8e51d8bb77f4c1e9f6c1950e675a6fcf95f26b426cfde6d21fb7`
behind unchanged ingress image
`sha256:51119d5d5f661a7b81de52e10f265b8a4c2cb4fa7baba5f48abe8baadd32188a`
on `127.0.0.1:18080`. PortPreflight was intentionally not requested: its
absent-project/free-port gate does not apply to this already-owned service.
Compose configuration checks restored the process host-port environment;
all invocation-owned probes and temporary build context were removed.
QA/service operator must recreate the known owned demo using the new image
and independently retest the skip-link in a browser. Production preparation
images were not rebuilt; their older frontend UI remains stale despite the
refreshed production ZIP. Synthetic login still verifies no real credentials,
and no live Oracle/EMS, production readiness or release approval is asserted.

### Build and bounded checks (executed, not deployment)

From `D:\AIProjects\SHFAI`:

```powershell
powershell.exe -NoProfile -File scripts\Build-Shifter.ps1 -Profile dev -Validation
powershell.exe -NoProfile -File scripts\Build-LocalDemo-Shifter.ps1 `
  -DemoOptIn synthetic-empty-dev -ReuseValidatedPayload
powershell.exe -NoProfile -File scripts\Test-Docker-Shifter.ps1
powershell.exe -NoProfile -File scripts\Test-LocalDemo-Shifter.ps1 -ContainerChecks
```

Without `-ContainerChecks`, the last command runs only focused syntax,
configuration and local Node opt-in rejection checks. With it, real containers
use `--network none`, no published ports, read-only root, bounded tmpfs, UID101,
capability drop, no-new-privileges and Docker init. Each unique owned probe is
stopped/removed; no deployment network is provisioned.

For host-port validation without building an image or starting a service:

```powershell
powershell.exe -NoProfile -File scripts\Test-LocalDemo-Shifter.ps1 -ComposeChecks
```

This runs strict decimal-port tests and real Compose configuration checks for
the unset default8080 and explicit18080, asserting fixed `127.0.0.1` ingress and
container target8080. The process host-port variable is restored in `finally`.
`--env-file NUL` prevents automatic `.env` loading. These are configuration
checks, not container/runtime or readiness checks.

Validated source: `4fea20e83820097b41ec701a96fe0be5c9b8f9c1`, approved50
implementation `1d5bc6a`; no backend/frontend changes. The DEV source run passed
**1,863 backend tests / 748 frontend tests**, both typechecks, Angular DEV
profile and canonical ZIP/closure/production-negative checks. DEV ZIP:
204 entries, 2,226,200 bytes,
SHA256 `768C2B1934DABD2AB9DA705C96D0DB5EAFD1741A6F9B52DB583BAD46A7BE9A5A`.
Actual demo context: **162 files / approximately 5.15 MB** transferred.
Sorted UTF-8/LF `path<TAB>bytes<TAB>SHA256` context manifest SHA256:
`4957BA6283B37A16DFF60A0D4A6C14558CB14048A4EDF69418199B02FA581FE2`
(excludes the `.dockerignore` generated from that exact file list).
Image build verified Node/npm/driver versions, shared-library closure and
`nginx -t`. **21 focused assertions plus embedded runtime checks** verify synthetic identity, real HTTP responses,
eight index assets, Hebrew/RTL index and SPA deep link, missing-asset 404s,
no API-to-SPA fallback, read-only writes rejected, graceful drain/reaping and
fail-fast on either child loss. Backend-down gateway 503 is observed in a
transient fault probe; unresponsive backend identity separately makes readiness
503. No mock HTTP results or live dependencies are used.

The existing production builder also ran with `-ImageTag production-preparation`
and the two exact references above. Its required full production source
validation passed **1,863 / 748** again; both production images built,
NGINX syntax and actual image production-auth gates passed with **zero pool
calls**. This is image preparation, never production operation.
An additional transient production frontend/Node probe with no host ports
verified static health, both bare/descendant API503s, Hebrew/RTL deep link,
nine index assets and missing-asset404.

Final local image IDs (not registry publication or release approval):

| Image | ID |
|---|---|
| `shifter-local-demo:dev` | `sha256:d5ca4625abce8e51d8bb77f4c1e9f6c1950e675a6fcf95f26b426cfde6d21fb7` |
| `shifter-backend:production-preparation` | `sha256:391a131c34d46b66e799021b512cd97a96f4f5dcf7d1541a8813bdc3e2503a77` |
| `shifter-frontend:production-preparation` | `sha256:3f189a8f5a38c03a87fe5fd4c4ca53b72dc8010296c33cb8c07ce6772d87f12e` |

Failed iterations were not suppressed: the new manifest parser initially
overwrote PowerShell regex captures; an initial notices requirement did not
match DEV output; initial HTTP expectations incorrectly assumed configured
optional readers; and a fault probe froze the readiness owner while trying to
query readiness. These packaging/test defects were corrected and the actual
build/checks rerun. Ad-hoc native `node -e` smoke commands also failed because
Windows argument handling removed embedded double quotes; the committed checks
use explicit stdin instead. Existing production Dockerfiles still emit
`InvalidDefaultArgInFrom` lint warnings for required explicit base arguments;
Windows PowerShell also formats successful NGINX stderr as `NativeCommandError`
records. Actual commands exited0 and no nonzero result was suppressed/retried.

### Deliberate operator-only service operation — NOT RUN

#### November 1 local-demo ingress correction

Publishing the combined demo's port on an internal-only Docker network did
not program host ingress. The corrected manifest moves the **sole** published
port to `ingress`, a plain NGINX process on an ordinary bridge and the shared
internal `demo` network. The combined Node/demo service has **only** the internal
network and exposes8080; neither Node4301 nor a demo host port is published.
Node's application loopback binding and the validated demo image are unchanged.
This is the accepted isolated local-demo tradeoff, not production/shared-host
approval: **ingress can egress**. Its proxy routes only to fixed `demo:8080`;
that configuration is not a firewall or whole-topology zero-egress guarantee.
No Oracle settings, credentials, Node executable, host mounts or socket are
added to ingress.

Build only the correction, without source tests or rebuilding the demo:

```powershell
powershell.exe -NoProfile -File scripts\Build-LocalDemo-Shifter.ps1 `
  -DemoOptIn synthetic-empty-dev -IngressOnly
powershell.exe -NoProfile -File scripts\Test-LocalDemo-Shifter.ps1 `
  -ComposeChecks -IngressContainerChecks -HostPort 18080
```

The ingress builder uses the exact cached NGINX digest above, `--pull=false`
and build-step `--network none`. BuildKit did contact the public registry for
pinned manifest/auth metadata; no base layers or packages were downloaded.
It stages only `Dockerfile` and `nginx.local-demo-ingress.conf` under a unique
`.shifter-developer-delivery/ingress-context-*` directory, with a generated
default-deny two-file allowlist, then removes that context in `finally`.
No full-repository context, application payload or private inputs are sent.
NGINX1.28.0, Debian Bookworm, curl7.88.1 and UID101 were verified in the build;
`nginx -t` passed in a nonroot/read-only/no-network probe with a synthetic
`demo` host mapping. No host tools were installed.

Built image: `shifter-local-demo-ingress:dev`,
ID `sha256:51119d5d5f661a7b81de52e10f265b8a4c2cb4fa7baba5f48abe8baadd32188a`.
The existing demo remains
`sha256:d5ca4625abce8e51d8bb77f4c1e9f6c1950e675a6fcf95f26b426cfde6d21fb7`.
Ingress uses init, UID101, read-only root, 16MiB tmpfs, drop ALL,
no-new-privileges, no restart, 20s SIGQUIT stop grace and bounded memory/PIDs.
It bypasses base entrypoint filesystem rewrites and owns only NGINX.
All paths, including readiness, pass to the same fixed upstream resolved at
startup after `demo` is healthy. No fallback to HTML/success, automatic retry,
request/response buffering or request logs. Connection/timeouts map502/504 to
503 with explicitly unknown business outcome; upstream business responses are
not intercepted. Docker's internal DNS is used, not an external/Oracle resolver.
Ingress health uses the base's installed `curl --fail` against the proxied
`/readyz`, never a static200.

Fresh checks: **38** static/local assertions; **43** with Compose checks
(default8080 and explicit18080; exact two services/networks, Node internal-only,
ingress-only loopback port, healthy dependency, full readiness, restored ENV);
**45** with isolated ingress checks. The latter actually verified nonroot,
read-only writes rejected, no Node, all-path upstream-down503, readiness probe
failure and graceful SIGQUIT exit0. Existing demo `-ContainerChecks` passed
**53** assertions plus embedded HTTP/runtime/fault checks, including default/
production/Oracle-injection rejection. These totals include the new topology
assertions, not additional source-suite runs.
Three test defects were repaired and retested: a comment matched the resolver
guard, Compose JSON omitted default `internal:false`, and Windows native stdin
sent CRLF to POSIX sh (now explicitly stripped).
Actual two-network startup, host readiness/identity, API-byte/header forwarding,
and actual Node internal-network isolation remain **operator/independent QA**
checks; isolated `network=none` probes do not certify those properties.
The packaging role has not started/replaced/stopped the existing owned service.
Preflight deliberately still rejects any existing project containers: the
service owner must establish exact ownership/state and reconcile the previously
running internal-only demo before the fresh absent-project preflight below.
Do not use automatic restart/replacement or touch the unrelated port8080 owner.
The actual explicit18080 preflight was run and exited1 at the existing-project
gate, as intended; the caller's `SHF_DEMO_HOST_PORT` was restored. The prior
`shf-local-demo-demo-1` (`e4e186a791c5...`) remains running/healthy and untouched.
No fresh port-free or host-readiness claim follows from this blocked preflight.

[compose.local-demo.yml](docker/compose.local-demo.yml) has a literal, visible
synthetic-empty DEV opt-in; choosing this file explicitly enables that demo.
The image by itself defaults to production and rejects startup. Supplied
production, TEST, Oracle/native/coordinator, fixture override or `NODE_OPTIONS`
inputs fail before application loading/pools. The clean child environment uses
only the approved DEV example, port4301 and `SHF_FIXTURE_ROWS='[]'`.
Do not load an operator ENV file or add credentials/native flags to Compose.

The corrected local-demo manifest retains default host8080 and container8080,
now on ingress rather than the internal-only combined demo.
`SHF_DEMO_HOST_PORT` allows an **explicit** alternate host port only; the
`127.0.0.1` binding is fixed. This operational choice requires no image rebuild,
API/auth change or production configuration change. Compose interpolation alone
is not a strict port validator: use the mandatory preflight below.
Nondecimal values, 0, 65536, wildcard/address injection and expressions fail
before native invocation; no automatic scanning or reassignment is performed.

For this local-demo request, host8080 is occupied by unrelated
`proxy_proxy` PID9352: **do not contact, stop or restart it**. The explicit
alternate is **18080**, subject to a fresh preflight. The existing
`shifter-local-demo:dev` image above is reused unchanged.
An authorized service operator/QA, not the packaging check, performs startup:

```powershell
$previousHostPort = [Environment]::GetEnvironmentVariable('SHF_DEMO_HOST_PORT', 'Process')
try {
  $env:SHF_DEMO_HOST_PORT = '18080' # Explicit caller choice, not a discovered fallback.
  powershell.exe -NoProfile -File scripts\Test-LocalDemo-Shifter.ps1 `
    -ComposeChecks -PortPreflight -HostPort $env:SHF_DEMO_HOST_PORT
  if ($LASTEXITCODE -ne 0) { throw 'Preflight failed; no service operation permitted' }
  docker compose --env-file NUL -p shf-local-demo -f docker\compose.local-demo.yml `
    up -d --wait --wait-timeout 30
  if ($LASTEXITCODE -ne 0) { throw 'Demo startup failed; do not claim deployment success' }
  curl.exe --fail --max-time 3 http://127.0.0.1:18080/readyz
  if ($LASTEXITCODE -ne 0) { throw 'Demo readiness probe failed' }
} finally {
  if ($null -eq $previousHostPort) { Remove-Item Env:SHF_DEMO_HOST_PORT -ErrorAction SilentlyContinue }
  else { [Environment]::SetEnvironmentVariable('SHF_DEMO_HOST_PORT', $previousHostPort, 'Process') }
}
```

Preflight fails closed if *any* `shf-local-demo` containers already exist
(including stopped containers), if any TCP listener occupies the requested port,
if loopback exclusive bind fails, or if Docker/configuration inspection fails.
It never contacts an existing service or changes another project. Availability
is point-in-time: a later bind race must fail startup, not trigger a retry on
another port. If18080 is occupied, report it to the parent/operator; only their
explicitly chosen18081 may receive one bounded follow-up probe.

Target URL for this explicit choice: **http://127.0.0.1:18080/**.
Default without an override remains **http://127.0.0.1:8080/**.
Stop/remove only this project after the operator has verified ownership:

```powershell
docker compose --env-file NUL -p shf-local-demo -f docker\compose.local-demo.yml down --timeout 20
```

Compose publishes only the explicitly selected ingress host loopback port.
Demo uses only the internal project network; ingress also uses an ordinary
bridge. Both are nonroot101 with init, read-only root, bounded tmpfs (demo32MiB/
ingress16MiB), cap-drop ALL, no-new-privileges, no restart, 20s stop grace,
bounded processes/memory and no mounts, Docker socket, devices, host networking
or persistent volumes. All demo state is volatile. **Actual corrected Compose
host ingress and Node internal-network external egress containment are NOT
RUN/NOT certified** by the packaging checks; ingress egress is an accepted
local-demo limitation, not an isolation property.
`network=none` denial was verified separately; it does not establish Compose
isolation. Operator/QA must verify both on the actual service before acceptance.

`/healthz` is static-only. `/readyz` validates the actual synthetic identity,
DEMO scope, seven read capabilities and child liveness; it does **not** certify
all readers, data, commands, real authentication, Oracle or CTI/EMS completion.
Synthetic Administrator has `employeeId=null` and is not password-verified.
The approved empty example intentionally returns missing-query400 for the
four list routes, shift-day404 for synthetic IDs, and **DEPENDENCY_UNAVAILABLE
503** for unconfigured items/card/filter-context readers. No seven-read-data
success claim or fake employee data. DEV maps are excluded and not served.
NGINX access/error request logging is disabled; the supervisor logs only bounded
configuration-free lifecycle messages. Gateway connection failure503 carries
an explicit non-business diagnostic and unknown outcome, never a receipt or
rollback assertion. No retries or implicit Administrator fallback.

Remaining owners: authorized operator for service operation and actual ingress/
internal-network containment; independent QA for browser interaction/accessibility,
data-rich fixtures and acceptance; platform/security for base vulnerability/
signature review. Production authentication, Oracle/client/secrets and live EMS
remain separate architecture/application/infrastructure decisions, not blockers
to the bounded empty-demo image and not authorized by its successful packaging.

## Populated isolated TEST Docker packaging — M02, November 1

**Task:** `SHF-PKG-M02-FULL-TEST-20261101`. **Status:** packaging verified;
independent QA/service acceptance pending. This section supersedes no empty DEV
defaults. “Full test environment” means populated existing implemented workflows,
**not full legacy parity**, M01 completion, or remaining milestone completion.
No application/contracts, locks, schema, private configuration, native allowance/
coordinator files, or legacy artifacts were edited by this packaging task.

### Package and source evidence

- Native Windows `D:\AIProjects\SHFAI`; Docker Desktop Linux engine 29.4.3,
  `desktop-linux`, linux/amd64. No WSL, daemon restart, prune, publishing or service
  operation was performed.
- Approved Node **24.21.0**, npm **11.19.0**, TypeScript **5.9.3**;
  Angular core **21.2.25**, CLI/build **21.2.27**, Material/CDK **21.2.14**,
  Vitest **4.0.9**. Immutable Node/NGINX base digests remain those above;
  actual NGINX **1.28.0**, Bookworm, UID101. Runtime has only locked
  `oracledb` **26.0.0**, no npm/dev dependencies/Oracle Client.
  Driver presence is not a connection: parent readiness and backend launcher
  have driver-import rejection hooks. No driver double replaces canonical tests.
- Source HEAD `7ec8e729e96eca371194e5aff21aedcd830e2506`; M02 modules remain
  unpublished working-tree inputs. Canonical source snapshot: **467 files**,
  SHA256 `488F236AB4BFB1E39FB1DDC49A30C2566287D43FD711AF1DDF35CEA0FBA7C778`.
  Final snapshot matched before/after builds and container checks.
- Explicit runtime roots `server.mts,populated-server.mts`: **148 modules**
  across all three developer profiles. Only literal reachable imports, including
  existing application/fixture modules, are copied; no arbitrary module scan,
  test subtree, source assets or unrelated subtree copy.
- Purpose-built Docker context: **190 files**, no repository/private upload,
  SHA256 `972D5699ED68C17C7BD68BE3AC291B35DBDF0B05E549FCADA5B947A2A7F70331`.
  Image check matched **182 runtime/browser file SHA256 values** against the
  canonical validated TEST ZIP/stage. Per-file manifests are in each `BUILD.md`.
  The packaging-only stdin probe is not bundled.

| M02 runtime module (actual source/stage/image byte proof) | SHA256 |
|---|---|
| `populated-config.mts` | `FA0FB7765D3D6F7FC274635D6937970981BBB3608FF671BB941736FC78154B90` |
| `populated-readers.mts` | `21F94E0C01E154FEB23120D48F4FC4C8177A6EA72D4DDE4F81B28383F6EF4A32` |
| `populated-server.mts` | `7BA2FFA791C907485B53C38F171FAD231070A9CEDE7C1A0E26F09E77557399ED` |
| `populated-world.mts` | `13A9C8047683E83E5A5F03958C0386E094CBDA514C15315D6328158D2B52B8D8` |

| Developer ZIP under `.shifter-developer-delivery/<profile>/` | Bytes | Entries | SHA256 |
|---|---:|---:|---|
| `dev/shifter-developer-dev.zip` | 2339499 | 232 | `6D592973003A34004C58A4A538FBDBC621F3B7A236D284114476A66EEF420674` |
| `test/shifter-developer-test.zip` | 810067 | 186 | `81C1F55A34A1B1DEC6C0FB7FF57BFF466103CB68EEE043112AFF2C461F2D073C` |
| `production/shifter-developer-production.zip` | 810738 | 186 | `E0FD935727DA7B18413BABA92F26D56067A804039D8589ED2467DEF971A0EABC` |

TEST ZIP retains its original canonical-run README; this checkout section is the
new operational handoff. DEV/production ZIPs include the subsequently updated
distribution README. Runtime/browser source bytes match across the source freeze;
profile-specific compiled assets intentionally differ. No TEST ZIP was manually
restaged or relabeled as validated after tests.

**New image:** `shifter-full-test:test`,
`sha256:dc7708d1a58e410b11c9744aafdba36878b8c9c366a908fddd68cc5d2292901d`,
120249379 bytes. Empty `shifter-local-demo:dev` and ingress tags were not replaced.
Image default `NODE_ENV=production` rejects startup without deliberate opt-in.
An immutable image-purpose file also rejects an explicit empty DEV opt-in on
the TEST image; environment overrides cannot mismatch backend/browser profiles.
The locked npm dependency stage needs registry access on a cold cache; image
runtime checks have **network none**. Cold-cache/offline reproducibility is not
claimed. Immutable bases are not automatically upgraded.

### Exact commands and check distinctions

Run from the repository root; no dependency/tool installation on Windows:

```powershell
powershell.exe -NoProfile -File scripts/Build-Shifter.ps1 -Profile test -Validation
powershell.exe -NoProfile -File scripts/Test-Build-Shifter.ps1
powershell.exe -NoProfile -File scripts/Build-Shifter.ps1 -Profile dev
powershell.exe -NoProfile -File scripts/Build-Shifter.ps1 -Profile production
powershell.exe -NoProfile -File scripts/Build-LocalDemo-Shifter.ps1 -DemoOptIn synthetic-full-test -Mode READONLY -ReuseValidatedPayload
powershell.exe -NoProfile -File scripts/Test-FullTest-Shifter.ps1 -ContainerChecks
powershell.exe -NoProfile -File scripts/Test-FullTest-Shifter.ps1 -ComposeChecks
powershell.exe -NoProfile -File scripts/Test-LocalDemo-Shifter.ps1
```

- **Canonical TEST, one full run, exit0:** actual backend/frontend TSC; bare
  backend `npm test` **2031 passed, 0 failed/skipped**; frontend `npm test`
  **802 passed / 58 files**; actual TEST Angular build/profile check, ZIP raw-name/
  byte manifest checks, extracted production/native rejection guards. DEV and
  production final builds exit0 without repeated full suites; production still
  lacks real authentication. Focused build tests **53 PASS**, empty-demo local
  configuration checks **38 PASS**.
- **Configuration, exit0:** three valid exclusive modes/seven invalid local
  pre-import configs; resolved Compose image/profile/mode, UID101, read-only/init,
  exact bounded tmpfs, 127-only host port and internal Node network. Not an
  actual Compose deployment or egress certification.
- **Container, exit0:** nginx syntax/nonroot/read-only; actual payload hashes;
  eleven invalid pre-import configs and five rejected startup processes
  (default/production/Oracle/coordinator injection/empty-DEV purpose mismatch); three sequential exclusive
  synthetic processes with real proxy identity, all **7 populated inquiries +
  4 scoped contexts** returning200, exact capabilities **7/14/9** respectively.
  Management change committed to fixture and read back; cancellation cleared
  the pre-recorded fixture exit, read back, and rejected replay. Both writers
  rejected a different loopback Origin. Native partner completion not invoked.
  All three backend/proxy processes drained/reaped exit0, `forced=false`.
  Network-none probe had no default route; no host ports/mounts were opened.
- **Earlier failures retained:** first DEV build rejected the two previously
  unlisted existing cancellation component stylesheet maps; corrected only the
  exact DEV-only allowlist and tested TEST/production rejection. First container
  harness incorrectly assumed a flat context `dataSource` and used unsafe
  SIGKILL cleanup; the owned ephemeral container was stopped (exit143), then
  the harness was corrected to existing nested DTO/readiness semantics and
  graceful cleanup. An attempted network-none dependency-stage build failed
  `EAI_AGAIN` acquiring locked `oracledb`; dependency-stage networking restored,
  runtime remained network-none. Resolved Compose checks also corrected an
  inline tmpfs YAML list and a checker assumption about omitted `internal:false`.
  No application repair, weakened canonical baseline or blind full-suite retry.

### Operator/QA commands — NOT executed by packaging

Use a fresh PowerShell session without inherited native/private configuration.
The separately named opt-in is mandatory; choose **one** exact mode explicitly.
All fixture people/data are synthetic. Clock is frozen
`2026-11-01T12:00:00.123Z` in **UTC**, not real time. Mode/state is per-process
and volatile; recreating a process resets it. Grants are never concatenated.
`READONLY` exposes no native-write capability; browser flags are not authorization.
Both writer families require the explicit caller Origin; no Host-derived allowlist.

```powershell
$env:SHF_DEMO_OPT_IN = 'synthetic-full-test'
$env:SHF_FULL_MODE = 'READONLY' # or exactly management / cancellation, not all
$env:SHF_FULL_ORIGINS = '["http://127.0.0.1:18080"]'
$env:SHF_DEMO_HOST_PORT = '18080'
docker image inspect --format '{{.Id}}' shifter-full-test:test
docker compose --env-file NUL -p shf-local-demo -f docker/compose.full-test.yml config --quiet
# ONLY after QA accepts the source-built image and service owner verifies ownership:
docker compose --env-file NUL -p shf-local-demo -f docker/compose.full-test.yml up -d --pull never
docker compose --env-file NUL -p shf-local-demo -f docker/compose.full-test.yml ps
curl.exe --fail http://127.0.0.1:18080/readyz
# Cleanup ONLY when that owner explicitly ends this synthetic project:
docker compose --env-file NUL -p shf-local-demo -f docker/compose.full-test.yml down --timeout 20
```

Using the owned `shf-local-demo` project above is an intentional operator-only
replacement step; packaging did not execute it. Preserve any running empty demo
until QA explicitly accepts replacement. At this task's inspections the existing
two demo containers were **exited(0)**, contrary to the incoming running-state
description; packaging did not stop/restart them. Parent/service owner must
reconcile that state before operation. For a separately approved writer port,
change **both** host port and the exact Origin JSON and use a separately owned
project; never start combined worlds or union capabilities in one process.

`/readyz` is the existing packaging-only readiness URL, not a new application
API: it uses M02's programmatic readiness to verify exact synthetic identity,
selected capabilities and populated inquiry/context coherence. `/healthz`
remains static-only. Ready output explicitly disclaims native Oracle/EMS readiness.

**Not run / owners:** QA owns actual browser/native-button visibility, interaction/
RTL/accessibility and source-built acceptance; service owner owns actual host
ingress and internal-network TCP egress verification. Demo's Node is on the
internal network only; separate ingress also has an ordinary bridge and may
egress—accepted local limitation, not zero-egress proof for the entire topology.
No live Oracle/EMS, native Linux Client setup, coordinator provisioning, fuse
reset, schema changes, release, security/signature scan or deployment performed.
Oracle 11.2.0.4/Thick Client19.3 compatibility remains separately authorized
native-environment work; zero live configuration/connections here. Production
login remains blocked pending the authentication owner. Next action: parent/
independent QA accepts this exact image/source snapshot, then service owner
performs only their explicitly approved replacement/probes.
