# SHF-STATION-EXIT-UI-28 — frontend verification (28 October 2026)

## Approved Vitest4.0.9 patch — 29 October, SOURCE-STABLE / delivery PASS

**State: approved dependency patch and two actual delivery validations PASS;
SOURCE-STABLE for parent final artifact QA/publication.** This supersedes the
unresolved delivery status in historical investigations below. It does not
erase their failures or claim that all Windows/IPC scheduling causes are
known. No more frontend source changes are planned in this handoff.

The user explicitly approved **Vitest4.0.8→4.0.9** on29October. This is a
test-tool patch only. `package.json` now pins exactly4.0.9; no Angular,
Material/CDK, TypeScript, Vite, Node/npm or backend driver version is selected
or upgraded. Existing threads/maxWorkers1 configuration and Angular test target
remain unchanged. Earlier failed thread/fork experiments below remain
historical failed evidence, not passing retries.

### Upstream boundary and installed compatibility

Caller-provided official evidence: Vitest
[`#9027`](https://github.com/vitest-dev/vitest/pull/9027), commit
`5e750f4ba829700120a865db6f2b72fa59ca6f0b`, published in4.0.9, changes the
outer startup deadline which previously enclosed a longer inner deadline.
Direct inspection of installed4.0.9 `cli-api.D48wY175.js` confirms
`WORKER_START_TIMEOUT=9e4`, `START_TIMEOUT=6e4`, `STOP_TIMEOUT=6e4`.
These are **upstream published defaults**, not a local timer patch, raised
workspace timeout or disabled failure gate. No claim is made that every
possible Windows scheduling/IPC issue has been diagnosed.

Direct resolved package-file reads confirm vitest and all seven installed
`@vitest/{expect,mocker,pretty-format,runner,snapshot,spy,utils}` packages4.0.9.
Angular build/CLI21.2.27, core21.2.25, Material/CDK21.2.14, TypeScript5.9.3
and Vite7.3.6 remain unchanged. Installed Angular build peer range is
`vitest:^4.0.8`; installed Vitest supports Node24 and Vite7. Node24.21.0 /
npm11.19.0 remain the approved installed runtime/tooling.

### Installation integrity findings

Manifest pin was changed with apply_patch. Npm generated the lockfile with
`npm install --package-lock-only --ignore-scripts`; the first semantic review
showed exactly nine changed records: root pin plus eight Vitest-family package
entries, no unrelated resolutions. Standard `npm install` and then explicit
`npm install --save-dev --save-exact vitest@4.0.9` reported up-to-date, but direct
file reads still found4.0.8. No runtime test was counted against those stale
files. `npm ls` alone was not treated as sufficient installed-version proof.

The generated npm hidden metadata incorrectly described4.0.9 while package
files remained4.0.8. Targeted `npm config get package-lock-only` and `dry-run`
both returnedfalse; no npmrc or general environment dump was read. Using the
**already installed npm Arborist API**, `loadActual({forceActual:true})`
read the actual filesystem and normal `reify()` installed the eight approved
family packages. `ignoreScripts:true` avoided running unrelated native install
scripts; no peer-force, vendor code edit, dependency override, node_modules
reset, npm ci or manual versioned-lock edit was used.

That cache-refresh reification caused transient normalization differences for
three optional `@emnapi/{core,runtime,wasi-threads}` records. A broad unchanged-
lock assertion failed, prompting a cold baseline review rather than accepting
an unreviewed lock change. This was an installation-review failure, not a
product test failure.

The parent explicitly authorized read-only
`git show ef1554718eb49e894a53d8148cf74f5d1a3f9ee3:frontend/fixture-slice/package-lock.json`
into a unique owned temporary directory. Current approved package.json plus
that published lock were copied there; normal
`npm install --package-lock-only --ignore-scripts --include=optional` generated
the cold lock without node_modules. Every package record was compared against
the baseline. **Final scope: nine changed records (root pin + eight Vitest
family entries),565 unrelated records unchanged.** No new transitive package
or unrelated resolution change is present.

The authoritative baseline actually contains **none** of the three @emnapi
records, and neither does the cold result. The first cold review's guard
incorrectly assumed they had to be present and failed after showing the
correct nine-record diff. Corrected comparison accepts identical absence;
the generated lock was copied whole, not edited by JSON surgery. It also
confirmed that the preceding CLI-normalized root lock already semantically
matched the cold result. Both exact owned cold directories/files were removed;
neither cold resolution created node_modules or changed installed dependencies.
No manual optional-record restoration or wholesale install was performed.

Npm's unchanged audit summary reports9 vulnerabilities
(3moderate/5high/1critical); no automatic audit fix or out-of-scope upgrade
was attempted.

The initial PowerShell5 ConvertFrom-Json helper could not parse npm's empty
root-package key and stopped before running npm; the equivalent Node JSON
review was used. Subsequent metadata-review helpers failed closed when
observing the unrelated normalization. None were hidden or counted as PASS.

### First-attempt actual Angular checks on verified4.0.9

All commands from `frontend/fixture-slice`, existing threads/maxWorkers1:

| Command | Result |
|---|---|
| `npm test -- --include src/environment.spec.ts` |3/3 PASS,1 file, natural exit0,7.92s |
| `npm test` |621/621 PASS,42 files, natural exit0,25.57s |
| `npm run typecheck` |Strict app TSC natural exit0,1.88s |
| `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.spec.json` |Strict spec TSC natural exit0,2.22s |

No failed test startup or test retry occurred after actual4.0.9 files and vendor
deadlines were verified. No tests were removed/added, assertions weakened,
isolation changed or success-shaped forced exit used. Normal frontend dist
was not rebuilt by these checks. Canonical C49 was reported source-stable by
the parent before the checks.

### Two actual delivery-context validations and final artifact

Devop SOURCE-STABLE acknowledgement for all six tool/doc files and C49
canonical/source stability were received before delivery execution. Source
and templates remained frozen. The sole executor then ran this **actual
entrypoint twice sequentially**, not an isolated worker proxy:

```powershell
powershell.exe -NoProfile -File scripts/Build-Shifter.ps1 -Profile test -Validation
```

| First-attempt invocation | Result |
|---|---|
| Delivery run1 |Natural exit0,62.18s; backend1601/1601,fail0; frontend621/621,42 files |
| Delivery run2 |Natural exit0,62.07s; backend1601/1601,fail0; frontend621/621,42 files |

Both runs retained all installed-version, backend/frontend TSC, full test,
isolated TEST build/profile, runtime import-closure, canonical ZIP whitelist
and production refusal gates. The packaged missing-real-provider and
synthetic-production checks passed with **zero pool/service factory calls**.
No retry, timeout-as-success, skipped assertion or forced command termination
was used. The runtime patch's published90/60s defaults remained unmodified.

Both produced the owned canonical developer snapshot:

```text
.shifter-developer-delivery/test/shifter-developer-test.zip
files127; ZIP bytes570729; expanded bytes2016442; runtime closure92
```

Final ZIP SHA256:
`FF6ABF3510365B284EC83EEA31F011E0D971A8760E20CEED1C55A1B3272F2614`.
Independent read-only review of the final raw entry names found **zero
backslashes**, traversal/absolute paths, duplicates or case collisions.
All127 entry contents matched both staging and their current authoritative
source: backend runtime/manifests/examples, isolated browser build, license
notice, root BUILD README and the developer distribution README template.
Thus the new artifact includes the frozen current tool documentation rather
than the old compile-only snapshot's documentation.

`npm run check:profile -- test ../../.shifter-developer-delivery/test/stage/frontend/browser`
passed on the staged payload, preserving exact public keys
`{appEnv,apiBasePath}` and `/api`.

The normal/pilot-owned frontend dist was not used as build output. Its29-file
tree hash was identical before/after both pipelines:
`0bf4fa8e6eed98ab4c61ac502a3d0afcf4cbf69f5bb303c5b09bddc6d497e336`.
After each pipeline and final review, **zero newly retained owned runner/
esbuild services** were observed. Unrelated existing PIDs23452/9152 remained
untouched and present. No helper is left running by this owner.

### Final changed paths and limitations

Exactly four source paths for this approved patch:

```text
frontend/fixture-slice/package.json
frontend/fixture-slice/package-lock.json
frontend/fixture-slice/README.md
frontend/fixture-slice/VERIFICATION.md
```

The existing test configuration stays threads/maxWorkers1 with no net change.
No app component/API, backend source, canonical, root/delivery-tool/profile
checker, dependency override, vendor patch or Git write was made. Only the
explicitly authorized read-only Git lock-baseline operation was performed.
Generated staging/ZIP outputs are the standard delivery script's owned
artifacts, not extra application source edits.

Parent final artifact QA/publication remains separate. These results validate
the approved upstream patch in the observed standalone and actual Windows
delivery contexts; they do not establish an OS scheduling root cause,
performance SLA or all-future-startup guarantee. No DB/DNS/fuse, production
asset server, real authentication provider, deployment, actual live pilot,
manual AT, UAT or full WCAG claim is part of this test-tool patch.

## QA28B-02 actual Angular forks invocation — 29 October, SESSION627

**State: actual supported alternative FAILED; diagnostic evidence
SOURCE-STABLE, packaging/tooling gate BLOCKED.** The parent separately
authorized one complete Angular caller/RPC invocation to remove the isolated
probe's fidelity limitation. No isolated worker probe was run in this step.

The existing supported config was temporarily changed to forks/maxWorkers1,
with no timeout, test-selection, isolation, assertion, dependency or error-gate
weakening. The one actual command, from `frontend/fixture-slice`, was:

```powershell
npm test -- --include src/environment.spec.ts
```

It invoked the unchanged package script:

```text
ng test --watch=false --include src/environment.spec.ts
```

Actual Angular build21.2.27 loaded `vitest.config.ts` and completed the selected
test bundle in16.534s. Vitest4.0.8 then reported:

```text
Error: [vitest-pool]: Timeout starting forks runner.
node_modules/vitest/dist/chunks/cli-api.BQ-bjcRi.js:7235:65
Test Files  no tests
Tests       no tests
Errors      1 error
Start at    09:13:10
Duration    5.02s
transform/setup/collect/tests/environment/prepare: all0ms
```

**FAIL: zero tests collected, one unhandled startup error.** This is evidence
from the real Angular/Vitest caller including its parent RPC routing, not
from the limited standalone probe. It does not diagnose the OS cause or mean
that forks is an unsupported API. No `ERR_INPUT_TYPE_NOT_ALLOWED` was printed.
The installed five-second worker deadline remained unchanged.

The command remained alive after its failure summary; it did **not** return
a natural exit code. The wrapper's planned natural-exit marker was never
reached. Its failed owned subtree was observed as:

```text
node runner16816 → esbuild11224
node runner16816 → node worker24632
```

The owned SESSION627 process tree was stopped for failure cleanup only.
That cleanup is not counted as a passing command or natural exit0.
Pre-existing unrelated Angular/esbuild PIDs23452/9152 were not targeted.

Config was restored to its original threads/maxWorkers1 content. Per the
first-failure rule, no further focused run, full621 run, app/spec TSC or
Build-Shifter execution followed. There is no validated forks mitigation
and no two-run delivery comparison result. Canonical C49 work was not tested
or packaged during its concurrent writing window.

Net follow-up changes are only frontend README/VERIFICATION; the candidate
config edit was restored. No application, API, backend, canonical, dependency,
vendor, delivery script, profile checker, normal dist, DB/DNS or live-write
change is included. Parent should route this concrete real-harness startup
failure to the Windows/Node/Vitest tooling investigation; neither an incomplete
probe nor the old duplicate-CSS issue explains away this observed failure.
No retry, package PASS or release approval is implied.

## QA28B-02 narrow harness diagnosis — 29 October, SESSION625

**State: BLOCKED with failure-path evidence; no corrected-probe authorization
condition established.** This is the one additional harness diagnosis
authorized by the parent, not a retry of the full suite/delivery pipeline.
The restored threads/maxWorkers1 source config was not edited.

The earlier probe explicitly provided `execArgv:[]` to the installed exported
`ForksPoolWorker`. Read-only inspection confirms its `start()` forwards that
array to `child_process.fork(fileEntrypoint, [], {execArgv:this.execArgv,...})`.
Thus the proposed accidental default inheritance of the invoking
`--input-type=module` flag is not established by this harness.

This diagnostic used the same explicit empty child execArgv, emitted events
immediately and captured child stderr **codes only**. Native stderr bytes
were counted, not printed. The installed Angular plugin's root and generated
project resolved forks/maxWorkers1 via an in-memory override; source config
remained untouched. Its complete safe event output was:

```json
{"event":"configuration","ms":0,"rootPool":"forks","rootWorkers":1,"projectPool":"forks","projectWorkers":1,"explicitExecArgvCount":0,"childFileEntry":true}
{"event":"start-sent","ms":15}
{"event":"spawn","ms":16}
{"event":"deadline","ms":5018,"budgetMs":5000,"messages":0,"stderrBytes":0}
{"event":"probe-failed","ms":5018,"classification":"installed-budget-exceeded"}
{"event":"exit","ms":5028,"code":null,"signal":"SIGTERM"}
{"event":"worker-cleaned","ms":5028}
{"event":"context-closed","ms":5029,"messages":0,"stderrBytes":0,"stderrCodes":[]}
```

Command returned **exit1**. The exit signal shown is from normal pool-worker
cleanup after failure, not a pre-deadline child crash. No
`ERR_INPUT_TYPE_NOT_ALLOWED` or other stderr code was emitted. There were
zero native response/RPC messages before the unchanged5000ms deadline.
Spawn at16ms proves child creation, not successful JS entry/environment setup.

### Exact retained probe and API-context limitations

Executed probe: **SESSION625**, an in-memory ESM script supplied to
`node --input-type=module -` from `frontend/fixture-slice`.
An equivalent review copy is retained at
`frontend/fixture-slice/.angular/qa28b02-forks-diagnostic.mjs` (ignored temporary
artifact, not a new suite/test source). Only its relative installed-plugin
import is adjusted for the file's `.angular` location. **That file was not
executed again.** The parent should not rerun it without a new bounded
diagnostic decision after this failure.

Public APIs: `createVitest`, `ForksPoolWorker`, `distDir` from `vitest/node`;
installed Angular `createVitestConfigPlugin`. The worker received the actual
project and its serialized config, installed dist path, method run,
environment jsdom, explicit `execArgv:[]`, inherited environment (not logged),
then the native `start` message with reportMemory=false.

The actual installed `PoolRunner.start()` performs worker.start(), attaches
error/exit/message routing, then sends that same native start message.
`ForksPoolWorker` itself has no extra initialize method. The real parent pool
also installs a bidirectional RPC router; this isolated probe does not service
arbitrary RPC requests. **No RPC request/message was observed in this run**.
Its absence from the probe is still a fidelity limitation, not proof that the
full Angular delivery path would fail with forks. The parent's root/project
comparison and the failure event stream are not an actual delivery-context
operational mitigation result.

No concrete harness defect was confirmed that authorizes the one corrected
probe. Therefore the sequence stopped at this diagnostic failure: no further
probe, focused/full tests, app/spec typechecks or Build-Shifter execution.
The pre-existing unrelated runner/esbuild PIDs23452/9152 remained untouched;
the post-failure observation found only those two, zero newly retained owned
runner/fork/esbuild processes. TEST delivery ZIP remained absent.

**Handoff:** parent may give this retained probe and its exact unsupported
fidelity boundary (parent RPC routing / pre-ready child progress) to the
different-context tooling specialist. No OS/root-cause attribution, forks
capability rejection, automatic retry or package PASS is claimed. Next work
must establish a concrete harness/transport distinction before another
experiment, not loop until green.

## QA28B-02 process-pool comparison — 29 October, stopped at first failure

**State: BLOCKED, no validated mitigation; diagnostic documentation
SOURCE-STABLE.** The parent's29Oct08:59 delivery thread-start failure
(5.04s, zero tests, one unhandled error) is accepted as the before-change
RED evidence. It is not retried here. The parent authorized one-worker forks
comparison and two sequential delivery validations only after prerequisite
checks passed.

The candidate changed only `test.pool` from threads to forks in the existing
`vitest.config.ts`; maxWorkers1, Angular runnerConfig and existing isolation
semantics were unchanged. Read-only installed-source inspection confirmed
Vitest4.0.8 implements `ForksPoolWorker` with child-process IPC and Angular
build21.2.27 merges the configured pool into its generated project.

### First candidate probe — FAIL, exit1

One in-memory Node ESM probe used the existing installed
`createVitestConfigPlugin`, public `createVitest`, `ForksPoolWorker` and
`distDir` APIs. It did not patch a vendor or application file.

Runtime assertions passed and emitted:

```json
{"kind":"effective-angular-runner","rootPool":"forks","rootMaxWorkers":1,"projectPool":"forks","projectMaxWorkers":1,"isolate":false,"environment":"jsdom"}
```

The probe then started the actual installed `workers/forks.js` worker with
that project's serialized configuration and sent native `start`/jsdom setup.
It did **not receive `started` within the unchanged5000ms budget**:

```text
FAIL actual process worker started exceeded unchanged 5000ms budget
Node.js v24.21.0
process exit1
```

This is a failed isolated worker-readiness probe, not a product assertion
failure or a completed Angular/full delivery-context comparison. Zero tests
were intentionally requested by the probe; they are not counted as a passing
suite. The probe did not increase the startup deadline or report success on
timeout. Its finally blocks called the standard pool worker stop and
`ctx.close()`, and the controlling command returned exit1.

**Trace limitation:** resolved budgets and the actual worker readiness
deadline/failure were emitted. The probe recorded spawn/exit event timings
only in memory and printed them on the success path; those timings were not
emitted on this failure. Therefore there is no retained spawn-to-ready trace
to attribute this failure to OS scheduling, IPC, module import or jsdom.
No claim of a fully diagnosed OS root or unsupported forks capability is made.

The first failure stopped the sequence, as instructed. No focused test,
full621 suite, app/spec TSC or delivery validation command was subsequently
run. In particular **zero** invocations of
`scripts/Build-Shifter.ps1 -Profile test -Validation` were made in this
comparison. No retry loop, timeout adjustment, forced command-success exit,
dependency upgrade or additional pool variant was attempted.

### Cleanup, source disposition and handoff

Pre-existing unrelated Angular/esbuild PIDs23452/9152 were recorded before
the probe and left untouched. The post-failure process observation showed
those same two processes and **zero newly retained runner/esbuild/fork-worker
services**. No unrelated process was killed.

Because the candidate failed its first readiness gate, the config was restored
exactly to the prior threads/maxWorkers1 content rather than leaving an
unvalidated forks default for the paused delivery owner. Net changes for this
follow-up are only:

```text
frontend/fixture-slice/README.md
frontend/fixture-slice/VERIFICATION.md
```

No application, API, backend, canonical, dependency/lock, Angular target,
delivery script, root/profile checker, database/DNS, operational fuse,
normal frontend dist or staging/ZIP writer changes are included. The two
actual delivery validations and ZIP raw-name/closure counts remain **NOT RUN**.
No artifact or publication PASS is inferred.

**Next owner action:** parent/QA/devop must decide the next bounded diagnostic
after this first failure. A permitted follow-up should emit fork spawn,
message-ready, error/exit and deadline events immediately on the failure
path, then distinguish this isolated API probe from the actual Angular/
delivery command before claiming a supported pool mitigation. This handoff
does not authorize automatic retries or resumption of packaging as fixed.
The older CSS-context fix remains unchanged and is not conflated with either
startup failure.

## QA28B-02 recurrence — worker-start investigation, not resolved

**State: diagnostic evidence SOURCE-STABLE; recurring delivery-worker defect
BLOCKED / NOT FIXED.** The parent's delivery validation reported zero collected
tests, one `[vitest-pool]: Timeout starting threads runner` error, retained
runner/esbuild processes, propagated failure and no ZIP. That remains a failed
delivery gate. Passing observations below do not replace or negate it.
This investigation changes only this document and README; no application,
test configuration, test script, Angular target, versions, lockfiles, backend,
delivery scripts or devop-owned profile checker was changed.

### Installed source and effective budget

Read-only inspection used the actual installed Angular build21.2.27 unit-test
schema and `runners/vitest/{executor,plugins}.js`, Vitest4.0.8 pool/startup
implementation/types, and the workspace `angular.json`, `vitest.config.ts`,
package scripts and app/spec TS configs.

* `angular.json` already uses the supported `runnerConfig:"vitest.config.ts"`.
  The existing config already specifies `pool:"threads", maxWorkers:1`.
  The Angular adapter merges that test configuration into its generated
  project, not just the root.
* An isolated **runtime resolution using the installed Angular configuration
  plugin and public `createVitest` API** confirmed root pool=threads/maxWorkers1
  and project `fixture-slice` pool=threads/maxWorkers1/environment=jsdom.
  The installed adapter's existing `isolate:false` default was observed, not
  changed. The installed scheduler selects project maxWorkers before root or
  CPU-count defaults. Therefore “the existing one-worker setting is ignored”
  or “this workspace defaults to19 test workers” is not supported.
* In this process `VITEST_MAX_WORKERS` was absent; NODE_OPTIONS/NODE_PATH and
  NG_BUILD_MAX_WORKERS overrides were also absent (only presence was checked,
  not general environment contents). The failed delivery process's effective
  overrides/budget have not been captured by this owner.
* Aggregate host observation: availableParallelism20/logical CPUs20,
  total memory32437MiB, free memory initially13182MiB and later13245/13114MiB,
  Node heap limit4288MiB. These are current observations, **not evidence of
  resource pressure or its absence at the failed delivery startup**.
* Vitest4.0.8 `cli-api.BQ-bjcRi.js:7174,7235` has a hardcoded outer
  `WORKER_START_TIMEOUT=5000`; `:6641` has a separate inner
  `START_TIMEOUT=10000`. Worker creation/entry-module import and the
  `setupEnvironment`/jsdom handshake occur before `"started"` and before test
  collection. A zero-test failure at this boundary is not a product assertion
  failure. These deadlines are not changed here. The Angular schema does not
  expose worker-limit CLI flags; existing `runnerConfig` is the appropriate
  supported configuration seam. Installed Vitest4 types do not declare a
  `minWorkers`/`initTimeout` setting that would repair this boundary.

No evidence justifies pretending that setting maxWorkers1 again, renaming
the working config to `.mts`, or switching to forks fixes this recurrence.
Forks are implemented by this toolchain, but no comparative failure evidence
justifies changing pool semantics/transport. No pool switch, retry, increased
timeout, disabled error gate, vendor patch or dependency upgrade was made.
The previously fixed duplicate-dialog CSS/BundlerContext leak remains a
separate issue; its source fix was not reverted or conflated with startup.

### Bounded probes and exact results

All commands ran from `frontend/fixture-slice`; no backend pipeline or normal
frontend build/output generation was run.

| Command/probe | Result |
|---|---|
| `node --version`; `npm --version` |24.21.0 /11.19.0, unchanged |
| `npm test` — one pre-change observation |621/621,42 files, natural exit0,27.93s; recurrence did not reproduce |
| Isolated installed Angular plugin + `createVitest('test', {config:resolve('vitest.config.ts'),root:process.cwd(),watch:false}, {plugins:[plugin],server:{watch:null}})` | Natural exit0; both resolved worker budgets1, threads/jsdom; `await ctx.close()` |
| One actual exported `ThreadsPoolWorker` using that project/serialized config and installed `distDir` | Worker `"online"`30ms, native `"started"`/jsdom ready870ms, within unchanged5000ms deadline; zero tests intentionally run; stop handshake and normal worker/context cleanup completed; natural exit0 |
| `npm run typecheck` | Strict app TSC natural exit0,1.85s |
| `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.spec.json` | Strict spec TSC natural exit0,2.26s |
| `npm test` — planned unchanged-config observation2 |621/621,42 files, natural exit0,30.67s |
| `npm test` — planned unchanged-config observation3 |621/621,42 files, natural exit0,24.98s |

The two later observations were a predefined sequential diagnostic loop,
stopping on any nonzero code or retained service, **not retries after a
failed startup**. There were no failed commands, zero-test *test-suite* runs,
unhandled startup errors or forced stops in these current observations.
The isolated handshake intentionally runs no tests and is not counted as a
passing suite. Three clean runs on **unchanged configuration are not a fix**,
a performance guarantee or a clean-package result.

Each npm command was timed from invocation until its natural return with a
PowerShell Stopwatch and its actual `$LASTEXITCODE`. The full-test command
remains exactly `ng test --watch=false`. Checks after the sequential
observations and at the end found zero retained frontend esbuild/Angular
runner services; no owned process required forced cleanup.

The budget/handshake probes were in-memory Node ESM scripts, not new files
or installed packages. They imported the installed
`@angular/build/src/builders/unit-test/runners/vitest/plugins.js`
`createVitestConfigPlugin` and `vitest/node`
`createVitest`, `ThreadsPoolWorker`, `distDir`. Plugin options retained
`projectName:"fixture-slice"`, `projectSourceRoot:resolve("src")`, no test
includes/setup files or application plugins, watch=false and coverage disabled
for this isolated configuration probe only. No suite's coverage/setup/error
or test discovery was altered. The worker probe sent the installed protocol's
`start` with environment jsdom and the project's serialized config, required
`started` within the installed5000ms budget, then sent `stop`, awaited
`stopped`, called the standard worker `stop()` and `ctx.close()`. This locates
the native bootstrap phase but is not the full Angular compiled-suite pipeline.

### Specific residual and handoff

**Root of intermittent startup delay remains UNKNOWN.** Evidence rules out
an unbounded/default test-worker budget in this current configuration, not
every possible inherited override or transient delivery-host condition.
The concrete installed-version boundary is the unconfigurable5s pool startup
deadline covering module/bootstrap/jsdom work; the failed run has no captured
online/ready/error/exit timings to distinguish those stages.

Parent/QA + devop/Windows tooling owner should capture those stage timings
and resolved root/project worker budgets **inside the failed delivery command
context**, using a bounded diagnostic trace with no secret/general environment
dump. In particular retain whether the thread reached `online`, when
`started` was sent/received, any worker error/exit, and aggregate resource/
event-loop delay during that5s interval. No blind retry or timeout-as-success.
If that identifies an installed Vitest/Node compatibility defect requiring
a different version, return a version-verified dependency proposal through
the parent; this owner has no automatic upgrade authority.

The delivery/package publication gate is not cleared by this investigation.
App/browser behavior is unchanged; browser tests are not rerun for these
documentation-only findings. The three isolated-output build/profile pairs
and complete backend/package pipeline remain devop-owned/not run here.
No actual Oracle/DNS/readiness/write/fuse, production asset server, deployment,
manual AT, UAT or full WCAG claim is included.

**State: frontend SOURCE-STABLE / parent independent QA pending.** Approved
UI/API/identity/persistence baseline **§47 v0.1**, user acceptance
28Oct11:08+02 recorded in **§47.7**; exact architect-owned
`StationExit{Mode,Blocker,Recorded,Context,Validation,Commit,Receipt,Problem}V1`
and three exit capability additions, parent canonical publication `7bc1918`.
No public/shared type changes by this owner. Native exit implementation is
not early-manager/correction/cancellation UI or live execution approval.

## Evidence and implementation boundary

Read project instructions, brief, UI developer skill, current checkpoint and
§47 source baseline. Catalog absent. Controlling legacy code read-only:
`old/SHF/src/bzq/shf/actions/AttendanceDataAction.java:180–259`
(`agent_exit`, whole-minute early classification) and
`old/SHF/src/bzq/shf/model/AttendanceDataModel.java:1884–1955`
(`exitStation`, station-arrival prerequisite and exactly exit time/user SET).
Source inspection is not deployed/Oracle metadata proof. Server policy/window,
classification and eligibility remain authoritative; UI only validates source
coherence and renders the contract. No legacy execution/edit, Oracle/DNS,
credentials/private environment, production, EMS, batch, dependency, lock,
manifest, canonical, design, status or Git publication writes.

Node24.21.0/npm11.19.0 were observed. Existing Angular21.2.25,
Material+CDK21.2.14 and TS5.9.3 pins retained; no dependency selection/install.
The single existing typed F2 dialog is extended with exit-only content/data,
not copied into another styled component. Its one external stylesheet and
template are retained. The public environment object remains frozen and exact.

## Exact changed paths

All relative to `frontend/fixture-slice`:

```text
README.md
VERIFICATION.md
checks/arrival-focus-proof.mjs
checks/station-arrival-browser-server.mts
checks/native-exit-protocol-backend.mts
checks/station-exit-browser-check.mjs
checks/station-exit-browser-double.mts
src/api.ts
src/attendance-page.html
src/attendance-page.ts
src/contract.ts
src/native-read-views.spec.ts
src/routes.ts
src/stage-arrival-page.ts
src/stage-arrival-session.ts
src/station-arrival-dialog.html
src/station-arrival-dialog.spec.ts
src/station-arrival-dialog.ts
src/station-arrival-page.ts
src/station-arrival-session.ts
src/station-exit-contract.spec.ts
src/station-exit-contract.ts
src/station-exit-fixtures.ts
src/station-exit-page.html
src/station-exit-page.scss
src/station-exit-page.spec.ts
src/station-exit-page.ts
src/station-exit-session.spec.ts
src/station-exit-session.ts
src/view-history.ts
src/workspace-shell.html
```

## Checks actually run

Commands below run from `frontend/fixture-slice`. PASS means command returned
naturally with exit0, not just emitted a successful build/test summary.

| Exact command | Observed result / evidence class |
|---|---|
| `npm run typecheck` | PASS exit0, repeated after final application source; static strict app TSC |
| `npx tsc --noEmit -p tsconfig.spec.json` | PASS exit0 after final spec source; static strict test TSC |
| `npm test -- --include src/station-exit-contract.spec.ts --include src/station-exit-page.spec.ts --include src/station-exit-session.spec.ts --include src/station-arrival-dialog.spec.ts` | PASS73/73,4files, natural exit0,18.375s wall before expanded boundary tests |
| `npm test -- --include src/station-exit-contract.spec.ts --include src/station-exit-page.spec.ts --include src/station-exit-session.spec.ts --include src/station-arrival-dialog.spec.ts --include src/native-read-views.spec.ts` | Final focused PASS124/124,5files, natural exit0; includes all42 native read/source combinations |
| `npm test` | Earlier612/612, natural exit0,47.787s; final **621/621**,42files, natural exit0,51.271s |
| `npm run build:dev` | PASS natural exit0,10.225s wall |
| `npm run check:profile -- dev` | PASS exit0, exact compiled `{appEnv,apiBasePath}` / `/api` |
| `npm run build:test` | PASS natural exit0,10.508s wall |
| `npm run check:profile -- test` | PASS exit0, exact compiled `{appEnv,apiBasePath}` / `/api` |
| `npm run build:production` | Final PASS natural exit0,10.653s wall, initial606.53kB |
| `npm run check:profile -- production` | PASS exit0, exact compiled `{appEnv,apiBasePath}` / `/api` |
| `node checks/station-exit-browser-check.mjs` | PASS exit0 on final production artifact; actual Chrome, typed synthetic HTTP only, no backend runtime |
| `node checks/station-arrival-browser-check.mjs --native-station` | PASS exit0; actual Chrome + existing native F2 typed HTTP regression |
| `node checks/station-arrival-browser-check.mjs` | PASS exit0; actual Chrome + existing fixture F2 HTTP regression |
| `node checks/station-exit-browser-check.mjs --native-protocol-double` | **Post-fix PASS**, natural exit0,4.2244264s wall after parent's 28Oct11:38+02 backend SOURCE-STABLE handoff; actual native HTTP/application/UoW with synthetic protocol pools, not Oracle. Supersedes the provisional pre-fix pass |
| `git --no-pager diff --check -- frontend/fixture-slice` | PASS exit0 from repository root |

Final621 = previous531 +23 exit contract +38 exit page +12 exit safety
+3 shared-dialog +14 seven-read/source tests. Fixtures are synthetic.
Tests cover exact ordered exit10 (not count-only), no arrival rights,
empty-object draft/API guard, B=0/5 server-returned exclusive-boundary−1/0/+1ms,
inclusive latest/+1ms, empty interval, null stage/briefing0/1/NULL and preservation,
early/station-required/window/already states, zero commands before checkbox and
on cancel, stale/expired/grant/context changes, pending duplicate suppression,
strict matching receipt/token/source/envelope/readback, UNKNOWN/reload/history
and source-independent F1/F2/fixture/native uncertainty interlocks.
Full suite retains old native/fixture arrival and all seven inquiry tests.

## Real Chrome observations, not live persistence evidence

Default exit browser run: selected synthetic attendance opener and accessible
name; early and station-required blocks; server policy/seconds/zone/millisecond
bounds; no business inputs; pure review; dialog initially unchecked and
confirmation disabled; keyboard Tab/Shift+Tab trapping, Escape0 commands;
1440/390/320 reflow/RTL and minimum24px targets. Escape restores exact opener.
Pending, success and UNKNOWN320 retain the exact focused confirmation node.
Screenshot-pixel ring contrast **12.6179:1**, solid3px/offset3px, opacity1,
full48px hit-testable/unobscured button. Origin Back restores filters, both
RTL/vertical scroll axes and exact attendance opener; Forward reads fresh
already-recorded state and never restores a receipt. Malformed readback remains
UNKNOWN after reload and fixture-source switch to F1/F2, with no new command
or context escape. Two synthetic commands represent separate success and
UNKNOWN scenarios, not a retry of UNKNOWN. Runtime/external requests errors0.

The final post-fix optional protocol retest used actual runtime admission,
HTTP, exit application, snapshot/UoW and synthetic pools after the parent's
renewed SOURCE-STABLE handoff for the private F2 physical-column correction.
Attendance selected the same tuple; context/validation/Escape consumed
no synthetic allowance and emitted no UPDATE/COMMIT. Whole-operation consent
produced one exact DTO and one UPDATE with exactly `STATION_EXIT_TIME` and
`STATION_EXIT_USER` SET, one COMMIT ACK, then separate matching readback.
Every other synthetic attendance column was compared unchanged, including
NULL stage/briefing. Both arrival endpoints returned403 LIVE_WRITES_DISABLED.
This tests the real native code path against a synthetic protocol, not a
driver, metadata certification, real fuse, Oracle or durable receipt.

## Failures, repairs, tooling risk and exclusions

* Tests-first `npm test -- --include src/station-exit-contract.spec.ts`
  correctly failed exit1 because the guard module did not yet exist.
  Next compile failed exit1 on a zone `unknown` argument; fixed by narrowing
  to its validated string.
* The next same focused command built, but Vitest reported
  `[vitest-pool]: Timeout starting threads runner`, collected no tests, and
  failed to return after120s. The owned failed session was stopped for cleanup;
  **not** counted as a clean exit/PASS. Existing QA28B-02 startup issue
  reproduced; root cause remains unknown. No flags/timeouts/config/dependency/
  vendor/forced-exit workaround was applied. A diagnostic Node worker probe
  initially failed on PowerShell quote mangling; a corrected standalone
  worker returned `ready` in41ms/exit0. This does not diagnose Vitest.
* Strict spec compile caught wrong fixture export and union DI typing;
  corrected. First executed combined focus run passed72/73 and failed exit1:
  departure test asserted the destroyed component reference, not its new
  route instance. Corrected the test reference; focused and full checks passed
  naturally afterward. No retry loop or suppression was used.
* First new browser run failed exit1 on the synthetic success→Forward fixture:
  its server clock preceded its recorded exit, correctly rejected by the
  source guard; fixed the double's post-write clock and expected readonly copy.
  Next run exposed a checker readiness race (optional selector inequality
  passed before the review node existed); fixed by requiring node existence.
  Subsequent typed HTTP runs, including the final artifact, passed exit0.
* Existing nonfatal jsdom scroll and Node module-type warnings remain visible.
  Successful full/focused checks and all final builds returned naturally;
  the earlier startup failure is retained, not relabeled a product success
  or claimed fixed by CSS deduplication.

**Temporary integration blocker RESOLVED.** Parent's 28Oct11:38+02 handoff
confirmed backend SOURCE-STABLE after the private F2
`STATION_LATE_*`→`LATE_*` correction and independent physical SQL identifier
guard. Exit already uses correct `LATE_*`; no exit public DTO/body/mode or
frontend adaptation was needed. No actual backend import/server was started
during the freeze. This owner then ran only the required post-fix protocol
command once: **PASS, natural exit0,4.2244264s wall**, one command,
1440/320 widths, actual backend protocol double only. It confirmed the exact
two exit SET fields, all other attendance columns preserved including NULL
stage/briefing, COMMIT ACK plus separate matching readback, both arrival
endpoints disabled403, zero runtime/external-request errors and visible
success320 focus (pixel contrast12.6179:1,48px,solid3px/offset3px).
The unchanged full621 tests/typechecks/three builds were not repeated.
Parent independent QA remains separate.

Post-fix retest cleanup: Node PID23092 absent, its Chrome child roots0,
`exit-chrome-*` profile directories0; the helper returned through its normal
`finally` cleanup of owned ephemeral UI/protocol listeners, synthetic pools
and temporary synthetic allowance. No owned process/server remains and no
process was forced to exit. Existing nonfatal Node module-type warning only.
Only this `VERIFICATION.md` was edited for the retest; README, application
source, protocol helpers and backend source were left unchanged.

No live Oracle/DNS/credential/private-path access, metadata recertification,
real operational allowance, real write, EMS/partner/CTI completion, production
startup/deployment, manual AT, UAT, full WCAG conformance or accessibility
tool-scan certification. No new agents, Git staging/commit or unrelated edits.
Current parent-owned operational/readiness gates remain unchanged.

Final cleanup observation: retained frontend `esbuild.exe` count0, owned
`exit-chrome-*`/`f2-chrome-*` Chrome roots0 and profile directories0. Browser
helpers closed their port0 UI/protocol listeners/pools and temporary synthetic
allowance directories in `finally`; no owned server remains. Exact process
observation (no process-name killing):

```powershell
@(Get-CimInstance Win32_Process | Where-Object {
  $_.Name -eq 'esbuild.exe' -and
  $_.CommandLine -like '*frontend\fixture-slice\node_modules\@esbuild\*'
}).Count
Get-CimInstance Win32_Process | Where-Object {
  $_.Name -eq 'chrome.exe' -and
  $_.CommandLine -match '--user-data-dir=.*(exit-chrome-|f2-chrome-)'
} | Select-Object ProcessId,ParentProcessId
Get-ChildItem frontend/fixture-slice/.angular -Directory | Where-Object {
  $_.Name -match '^(exit|f2)-chrome-'
} | Select-Object -ExpandProperty Name
```

Final `node --check checks/station-exit-browser-check.mjs` also PASS exit0.
Only the earlier failed Vitest startup session needed cleanup stopping; no
successful build/test was forced to exit. Manifest/lock/angular/public-profile
diff is empty. Source is stable for the caller; no work is left running.

---

# SHF-NATIVE-F2-UI-28 — earlier frontend verification (28 October 2026)

## QA28B-01 owner fix — shared F2 dialog / natural CLI teardown

**State: SOURCE-STABLE, developer fix/retest PASS; independent parent closure
pending.** This section supersedes the earlier teardown diagnosis/limitation
and test totals below. Approval remains §46 v0.1 and §§41–42 v0.1; canonical
V1 contracts and product behavior are unchanged. No backend, canonical,
configuration, dependency, lockfile, vendor, Git, design or status writes.

### Reproduction and necessary refactor

Before editing, `npm run build:production` completed generation in4.769s but
did not return naturally after an observation of more than60s. The owned
ng/npm command and frontend esbuild service were still alive (observed service
PID14068, parent21144). **Clean-exit reproduction FAIL**, not a passing build.
That failed reproduction was stopped for cleanup only. A tests-first new
dialog spec then produced expected missing-component compiler errors; this
pre-fix command also failed to exit naturally and was stopped, not counted
as success.

The independent QA finding identified identical inline style definitions
in the two F2 components, with concurrent BundlerContext creation retaining a
context; this owner did not rerun or modify the installed-package trace.
The source fix replaces both components with **one** `StationArrivalDialog`,
one template and **one external stylesheet**, owned by that component.
Discriminated typed data selects fixture-warning or native-confirmation
content. Shared layout, labels, stable IDs, explicit-checkbox confirmation
and cancel handling now have one definition; branch bodies and exact approved
copy remain separate. This is legitimate component/resource deduplication,
not hash-foiling CSS differences/comments or a vendor/tooling workaround.
Native F1 source and styles remain unchanged.

The page still enforces the original preparation/generation/source binding,
checked consent and fresh re-review before command dispatch. Native dialog
data requires native context/validation; fixture warning is still only a
late-warning acknowledgement, not command consent. All existing dialog IDs,
Material overlay options, Hebrew aria labels, focus return and whole-operation
native confirmation are retained. The six added isolated component cases
cover branch-only content, unchecked/checked consent and cancel for both modes.

### Changed paths for this follow-up only

All relative to `frontend/fixture-slice`:

```text
src/station-arrival-page.ts
src/station-arrival-dialog.ts
src/station-arrival-dialog.html
src/station-arrival-dialog.scss
src/station-arrival-dialog.spec.ts
src/station-arrival-page.spec.ts
src/native-station-arrival-page.spec.ts
README.md
VERIFICATION.md
```

### Exact post-fix commands, codes and wall timings

Commands ran from this package using unchanged installed tooling. Times below
measure the complete command through its **natural return**, not just the
bundler/test summary. No post-fix command was stopped, killed, forced to exit,
wrapped in a success-shaped timeout, or retried after failure.

| Command | Result |
|---|---|
| `npm run typecheck` | PASS, final natural exit0,3.65s |
| `npm test -- --include src/station-arrival-dialog.spec.ts` | First post-fix invocation:6/6 PASS, natural exit0,15.96s |
| `npm test -- --include 'src/*station-arrival*.spec.ts' --include 'src/native-arrival*.spec.ts' --include src/native-read-views.spec.ts` | Three separately counted consecutive invocations, each165/165 PASS /12 files, natural exit0:25.09s,25.62s,24.52s |
| `npm test` | First post-fix full run:531/531 PASS /39 files, natural exit0,45.13s; existing525 +6 new |
| `npm run build:dev` | PASS natural exit0,4.96s |
| `npm run check:profile -- dev` | PASS natural exit0,0.50s |
| `npm run build:test` | PASS natural exit0,5.07s |
| `npm run check:profile -- test` | PASS natural exit0,0.38s |
| `npm run build:production` | PASS natural exit0,5.21s |
| `npm run check:profile -- production` | PASS natural exit0,0.47s |
| `node checks/station-arrival-browser-check.mjs --native-station` | PASS exit0,7.16s; actual Chrome + typed synthetic HTTP |
| `node checks/station-arrival-browser-check.mjs --native-protocol-double` | PASS exit0,5.71s; actual native runtime/HTTP/application/UoW against synthetic pool protocol double |
| `node checks/station-arrival-browser-check.mjs` | PASS exit0,7.49s; actual Chrome + fixture HTTP interception |
| `node checks/station-arrival-browser-check.mjs --fixture-proxy` | PASS exit0,6.42s; actual joint memory fixture backend F1→fresh F2 |

All profile checkers preserve the exact public `{appEnv,apiBasePath}` shape and
`apiBasePath:/api`. Production initial bundle583.20kB; final browser runs use
that artifact. Existing nonfatal jsdom scroll and Node module-type warnings
remain visible; no configuration/package change suppresses them.

Each measured command wrapper started a PowerShell Stopwatch, invoked the
normal command, saved `$LASTEXITCODE` **after the command returned**, and
printed the code/wall time. Focused runs used a three-iteration loop that
exits on any nonzero code; it is not a retry loop. Following each focused
run, full suite and build/profile pair, this exact observation returned0:

```powershell
@(Get-CimInstance Win32_Process | Where-Object {
  $_.Name -eq 'esbuild.exe' -and
  $_.CommandLine -like '*frontend\fixture-slice\node_modules\@esbuild\*'
}).Count
```

Final observation also returned0 owned F2 Chrome roots and found no remaining
`f2-chrome-*` profile directories. All browser helpers closed their owned
listeners/double resources. No retained owned frontend esbuild service or
active build/test helper remains. The root-coupled clean-exit failure is
resolved by this source refactor in these observed checks, rather than
reclassified as a generic runner limitation.

### Behavior, startup distinction and remaining gates

Both native and fixture Chrome dialogs retain1440/390/320 reflow, reduced
motion, keyboard trapping, Escape-before-command zero effects and exact
visible focus return. Native320 Escape/pending/success and fixture focus
checks retain actual screenshot ring contrast12.6179:1, solid3px/offset3px,
opacity1 and full48px hit-testable/unobscured button. Native consent still
sends one command, duplicates are blocked, wrong readback stays UNKNOWN and
reload cannot resend. Actual protocol double preserves every non-station
field, returns ACK+separate readback and F1 disabled403. Fixture integration
preserves its distinct source/receipts and existing F1 behavior.

**QA28B-02 is separate:** no Vitest thread-start timeout or unhandled startup
error occurred in any of the five post-fix test invocations (small spec,
three focused, one full). Every invocation's first startup passed; there
were zero failed-start retries. The earlier intermittent thread-start cause
remains **unknown/not reproduced**, not claimed fixed by CSS deduplication
and not conflated with the independently reproduced BundlerContext leak.
Parent owns independent targeted startup/context-disposal retest before
publication; a recurrence requires diagnosis, not automatic retry.

No live Oracle/DNS/operational allowance, backend QA rerun, manual AT, full
WCAG claim, UAT, dependency upgrade or deployment is included. The external
Oracle DNS/readiness gate remains operator/parent-owned and unchanged.

## Earlier implementation verification — historical counts/teardown finding

**State: implementation SOURCE-STABLE for parent independent QA.** Approved
UI/API baseline: §46 v0.1, explicit user approval 28Oct09:00+02; existing
§§41–42 v0.1 F2 layout and fixture canonicals unchanged. Canonical native
station V1 types/capability were reported source-stable and checked by their
owner before implementation. Backend SOURCE-STABLE was subsequently provided
by the parent before any backend runtime imports/integration in this task.
No live Oracle/DNS/production/EMS/batch operation, credentials, operational
allowance, dependency or lockfile change is included.

## Changed paths (relative to this package)

```text
src/api.ts
src/contract.ts
src/attendance-page.ts
src/station-arrival-contract.ts
src/station-arrival-page.ts
src/station-arrival-page.html
src/station-arrival-session.ts
src/stage-arrival-session.ts
src/workspace-shell.html
src/native-read-views.spec.ts
src/native-station-arrival-fixtures.ts
src/native-station-arrival-contract.spec.ts
src/native-station-arrival-page.spec.ts
src/native-station-arrival-session.spec.ts
checks/station-arrival-browser-check.mjs
checks/station-arrival-browser-server.mts
checks/native-station-browser-double.mts
checks/native-station-protocol-backend.mts
README.md
VERIFICATION.md
```

Only frontend-owned files are edited. Existing unrelated changes, backend,
canonicals, root, `.github`, legacy, design and project status are not edited.
No Git publication is performed by this owner.

## Source evidence and implementation boundary

* `docs/SHF_REVERSE_ENGINEERING_DESIGN.md` §§46.2,46.4–46.6,46.9:
  approved source/capability/consent/receipt grammar, two-field operation,
  optional read-only stage and preserved three-state briefing, native TEST
  copy and fail-closed UNKNOWN semantics. Source catalog is absent.
* Read-only `old/SHF/src/bzq/shf/model/AttendanceDataModel.java:1054–1115`
  (`registerStation`) sets station time/user and warns after SQL; its INSERT
  fallback/finally UI update are NOT adopted. `:2580–2618` (`setTadreech`)
  is a separate mutation, not part of F2.
* Canonicals: `backend/fixture-slice/contracts.mts`,
  `station-arrival-contracts.mts` V1 and new
  `oracle-station-arrival-contracts.mts` V1 / §46 v0.1. All frontend canonical
  imports are type-only/erased. No new public fields/endpoints are invented.
* Existing native F1 guard/session/dialog, fixture F2 layout/API/history,
  `arrival-focus.scss` and global Material3 focus styles are reused.
  No framework/runtime/tooling selection or install was needed:
  Node24.21/npm11.19, Angular21.2.25, Material/CDK21.2.14, TS5.9.3 retained.

Native station10 is read7 + station prepare/commit/test-oracle-write, NOT
native F1's ten-right set. Existing ordered read7/fixture9/native-stage10/
fixture11 sets are unchanged. All seven read views accept the new identity
with their existing Oracle source markers and reject fixture read bodies.
The native station page cannot launch F1; actual backend disabled403 is checked.
Null-stage and briefing NULL/false/true remain independent read-only facts.
Only on-time null draft, null late confirmation, whole-operation accepted
consent and strict native receipt can produce success. Already-recorded
context does not create a receipt. ACK/readback timestamps do not claim exact
DB commit time or durable attribution.

Opaque native F2 safety is separate from all three older namespaces; it
survives supported history/reload without persisting selected personal context.
Actor/unit drift/new UUID cannot clear native employee/day uncertainty;
opposite-operation native UNKNOWN cross-blocks the same tuple. Tokens and
receipts are never restored from history. Cancel/leave/expiry discard
preparations. No automatic retry/poll/reconciliation or reset is added.

## Exact checks and results

All commands below run from `frontend/fixture-slice` on Windows.

| Command | Result / classification |
|---|---|
| `node --version`; `npm --version` | `v24.21.0`; `11.19.0`, unchanged installed tooling |
| `npm run typecheck` | PASS, strict app TSC exit0 (repeated after changes) |
| `npm test -- --include src/native-station-arrival-contract.spec.ts` before implementation | Expected RED compile failure: missing native exports/union branch, establishing test-first boundary |
| `npm test -- --include src/native-station-arrival-contract.spec.ts --include src/station-arrival-contract.spec.ts --include src/native-arrival-contract.spec.ts` | Final focused guard run 17/17 PASS; first startup attempt timed out with no tests, owned worker stopped and rerun passed |
| `npm test -- --include 'src/*station-arrival*.spec.ts' --include 'src/native-arrival*.spec.ts' --include src/native-read-views.spec.ts` | Final **159/159 PASS, 11 files**; Angular compilation and Vitest/jsdom with synthetic typed HTTP, not Oracle/browser |
| `npm test` | Final **525/525 PASS, 38 files** (historical baseline477 +48 new cases); Angular compilation + synthetic tests |
| `npm run build:dev`; `npm run check:profile -- dev` | Build generation PASS; profile checker exit0, frozen exact keys `{appEnv,apiBasePath}`, `/api` |
| `npm run build:test`; `npm run check:profile -- test` | Build generation PASS; profile checker exit0, same frozen public shape |
| `npm run build:production`; `npm run check:profile -- production` | Final build generation PASS (initial583.20kB); artifact/profile checker PASS exit0, frozen exact keys and `/api`; same ng teardown caveat below |
| `node --check checks/station-arrival-browser-check.mjs`; `node --check checks/native-station-browser-double.mts`; `node --check checks/station-arrival-browser-server.mts` | PASS exit0 syntax checks |
| `node node_modules/typescript/bin/tsc --noEmit --strict --module nodenext --target es2024 --types node --typeRoots ../../backend/fixture-slice/node_modules/@types --skipLibCheck --allowImportingTsExtensions checks/native-station-browser-double.mts checks/native-station-protocol-backend.mts checks/station-arrival-browser-server.mts` | PASS exit0, strict owned helper types, installed Node types reused, no install |
| `node checks/station-arrival-browser-check.mjs --native-station` | PASS exit0, real Chrome + typed intercepted synthetic HTTP, no backend runtime imports; details below |
| `node checks/station-arrival-browser-check.mjs --native-protocol-double` | PASS exit0 after backend SOURCE-STABLE, actual backend runtime/HTTP/native application/UoW + Oracle pool protocol doubles, NO Oracle connection |
| `node checks/station-arrival-browser-check.mjs` | PASS exit0, existing fixture F2 synthetic interception regression |
| `node checks/station-arrival-browser-check.mjs --fixture-proxy` | PASS exit0, actual joint memory fixture backend F1 review/commit→fresh F2 review/commit, no interception, no Oracle |

**Runner teardown limitation:** completed Angular test/build summaries are
distinguished from process exit. In this host Angular CLI stayed alive after
the completed Vitest summaries / output-location messages. Owned sessions
were explicitly stopped after recording the results; no clean exit0 is
claimed for those ng invocations. Static `tsc`, profile, syntax, helper TSC
and browser commands exit normally. Changing npm shim, calling ng directly,
or limiting build workers did not remove the teardown issue; no dependency,
CLI or test config was changed to conceal it. Parent/tooling owner may retest
clean CLI teardown independently. Existing jsdom `Window.scrollTo` diagnostics
are not browser scroll proof. Real Chrome supplies the geometry evidence.

## Browser observations (synthetic only)

* Native heading and persistent actual TEST change disclosure; separate
  synthetic Administrator, employee/day/team/source; no F1/late/clock input.
* 1440/390/320 CSS-pixel context and dialog: no page horizontal overflow;
  dialog actions remain visible, targets at least48px; finite animations0
  under reduced motion. Tab/Shift+Tab stay in dialog; Escape sends zero commands,
  invalidates preparation and returns to the **exact retained disabled opener**.
* Screenshot-measured native320 focus after Escape, pending and success:
  solid3px outline, offset3px, effective opacity1, full48px button visible and
  hit-testable/unobscured; actual ring `[0,47,101]` against `[250,250,250]`,
  **contrast12.6179:1**. Existing fixture checks also measured12.6179:1.
* Explicit checkbox/whole-operation consent sends exactly one native command.
  Repeated physical Space activation while pending sends no duplicate.
  Native ACK+readback success is correctly labeled, without fixture success copy.
* Back/Forward retains exact attendance opener, filters, vertical and RTL
  horizontal scroll; Forward does not reconstruct receipt. Wrong preserved
  briefing in post-dispatch native payload becomes UNKNOWN. Native F2 marker
  survives reload, with zero resend/context reopening and no older namespace
  falsely populated. No runtime exceptions/unexpected outbound requests.
* Actual protocol-double integration: real HTTP/native token/fingerprint and
  mandatory native consent, cancel0/update0/commit0/allowance0, then exactly
  one actual UoW UPDATE with only station time/user SET, one COMMIT ACK and
  separate read lease/readback. All other attendance fields equal originals,
  including existing stage/user and briefing=true. Independent detail GET
  agrees; F1 endpoint is disabled403. Temporary allowance is synthetic and
  removed with the owned double directory, never an operational reset.
* Existing actual joint-fixture integration: F1 receipt/audit1/1,
  F2 receipt/audit1/1, active0, stage/user/briefing preserved, revision advanced,
  coherent independent detail readback. This remains a fixture, not native F2.
* Synthetic screenshot samples reviewed: native dialog320/context390; no
  personal data or production screenshots. Screenshots remain ignored artifacts.

### Failures found and corrected

Real Chrome caught native dialog Cancel removing its opener; retaining the
disabledInteractive confirmation button fixed exact return and measurable
focus. Test automation then needed the existing modal-readiness and
checkbox-rendered-enabled barriers (not arbitrary sleeps). Protocol helper
first lacked required source markers; strict runtime correctly refused it.
Its initial fixed future clock was incompatible with ACK ordering and the
receipt wait timed out (source analysis identifies the guard rejection, not a
live observation); the synthetic protocol helper now uses a coherent current
clock. SQL assertion initially counted `=` inside an NLS
string; it now verifies exactly the two column assignment names while
excluding string literals. All browser cases reran successfully.
Initial helper TSC lacked a Node type root / supplied an extra close argument;
the existing backend-local types and correct no-argument double close resolved
that without installations. These were test/helper failures, not live writes.
An optional assigned-path integrity helper could not use Python (unavailable
Windows app alias); the same in-memory check reran with existing Node and
passed for all20 paths (strict UTF-8, final newline, no conflict markers).

## Not run / blockers / next action

No live Oracle/DNS operation, current metadata/readiness, real operational fuse,
controlled write pilot, EMS/CTI, production/deployment, manual AT, full WCAG
conformance or stakeholder UAT was run/claimed. Actual TEST endpoint A/AAAA
ESERVFAIL remains the parent/operator/DNS-network owner's external blocker;
the endpoint syntax correction is not a full target proof. Offline success
does not authorize a write or clear an external uncertain allowance.
Backend implementation has no open dependency for this UI after the parent's
SOURCE-STABLE signal. Next: parent independent UI/API QA and clean CLI
teardown retest; operator-owned readiness/write gates remain separate.
All four browser modes were rerun successfully against the final production
artifact; all owned Chrome profiles/listeners and protocol-double temporary
directories were closed/removed by their bounded checks. No helper is left
running. No blanket accessibility conformance or release approval is implied.

## Historical SHF-F2-UI-20 verification (20 October 2026)

## Latest follow-up — F2-QA-02 equal endpoints (Medium/P2)

**State: developer fix/retest complete, SOURCE-STABLE for parent focused
independent retest.** This is not independent defect closure or whole-project
completion. Approval remains §§41–42/F2 mockup and station canonical v0.1.
§41.2, baseline line4314, expressly permits `end>=start`; zero-duration
intervals are empty for overlap. No new policy, public DTO or backend change.

Only four paths changed in this follow-up, relative to this directory:

```text
src/station-arrival-contract.ts
src/station-arrival-contract.spec.ts
src/station-arrival-page.spec.ts
VERIFICATION.md
```

Production correction is one comparison: reject `startLocal > endLocal`,
not `>=`. Existing F1 context guard already uses the equivalent `end < start`;
no new helper/business-rule abstraction was needed.
Eight added regression cases cover ordinary, equal, overnight and reversed
endpoints at both guard and Angular-page boundaries. The page test selection
now binds both supplied planned endpoints, avoiding a fixture mismatch that
could mask this defect.

### RED → GREEN and exact checks

All commands ran from `frontend/fixture-slice`, on the latest corrected UI
source. No dependencies or tooling changed.

| Command | Actual result |
|---|---|
| `npm test -- --include='src/station-arrival-contract.spec.ts' --include='src/station-arrival-page.spec.ts'` before correction | **RED: 28 PASS, 2 FAIL**. Only zero-duration contract admission and page ready/review path failed, reproducing QA-02. |
| Same command after the one-comparison correction | **GREEN: 30/30 PASS**, 2 files. |
| `npm test -- --include='src/station-arrival*.spec.ts' --include='src/stage-arrival*.spec.ts' --include='src/native-arrival*.spec.ts'` | **152/152 PASS**, 10 files; F2 + existing F1/native. |
| `npm run typecheck` | PASS strict application TSC. |
| `npm test` | **477/477 PASS**, 35 files; focused counts overlap this suite. |
| `npm run build:dev` then `npm run check:profile -- dev` | PASS fresh build and emitted two-key public profile `/api`. |
| `npm run build:test` then `npm run check:profile -- test` | PASS fresh build and emitted two-key public profile `/api`. |
| `npm run build:production` then `npm run check:profile -- production` | PASS fresh production build/budgets and emitted two-key public profile `/api`. Production is the final artifact. |
| `node checks/station-arrival-browser-check.mjs` | PASS **fresh post-UI-fix** Chrome + intercepted synthetic HTTP regression. |
| `node checks/station-arrival-browser-check.mjs --fixture-proxy` | PASS **fresh post-UI-fix** Chrome → actual owned joint-fixture runtime/HTTP/store, without interception. Parent had relayed backend SOURCE-STABLE639 and QA-01 closure before this run. |

Boundary proof is specifically **Angular HttpTestingController**, not an
equal-endpoint browser claim: context with null stage, on-time server capture
10:22:06 and `start=end=2026-10-20T10:30:00` reaches ready and review.
Validation issues no command; receipt remains null, no F2 safety marker is
created, and source fixture facts remain unchanged. Only explicit confirmation
sends one command. Ordinary/overnight paths also pass; `end<start` remains
blocked with no validation/command. These frontend tests prove zero command
delivery before confirmation, not independently measured backend audit counts.

The reused browser scenarios use their existing ordinary endpoints, **not**
the new equal-endpoint boundary. Fresh intercepted aggregate:1440/390/320,
keyboard/dialog/Escape/focus/reduced-motion/history/UNKNOWN checks PASS,
commands2, runtime exceptions0, unexpected requests0. Pixel focus contrast
12.6179:1 in pending/SUCCESS/Escape/UNKNOWN. Fresh actual fixture aggregate:
F1 command1 → new F2 context → F2 command1, F1 receipt/audit1/1 and F2
receipt/audit1/1, active0, preserved stage/user/briefing, advanced shared revision
and matching independent detail readback; runtime exceptions0, unexpected
requests0. These are local synthetic fixture results, never native/Oracle.

Owned ephemeral listeners, Chrome process/profile are closed by the existing
checkers. No user/shared listener touched. No Git, backend, canonical, legacy,
root/status, dependency or lockfile writes; no DB/DNS/EMS or delegated work.
Existing typeless-package warning and jsdom scrollTo notices are informational;
real browser supplies the scroll/focus proof. No failed GREEN reruns.

**Next action / owner:** parent independent QA retests the changed boundary
against this SOURCE-STABLE frontend. No implementation blocker or shared
contract request. Manual AT/full WCAG certification, native pilot and release
remain unclaimed; no automatic full-QA loop was launched.

## Earlier implementation verification — historical results

**State: developer verification complete; SOURCE-STABLE for parent independent
QA.** Authority: caller-confirmed 20 October14:21 approval of §§41–42 and
`design/shifter-redesign-v0.1.html#station-arrival`, canonical station v0.1.
Parent owns PROJECT_STATUS, independent QA and publication. No Git write,
backend/canonical/root/design/legacy/dependency/lockfile change by this owner.

**Integration freshness caveat:** after the last completed verification run,
parent reported backend temporarily unstable for independent QA-01 (explicit
empty Origin incorrectly treated as absent). The actual-fixture browser PASS
below is **pre-fix evidence only**, NOT post-QA-01 integration proof.
No further actual-backend run was launched after that notice.
Frontend source and typed/mock browser checks remain source-stable.
Backend owner + parent must relay renewed SOURCE-STABLE before repeating the
`--fixture-proxy` command; parent owns independent acceptance of that retest.

## Implemented scope and changed paths

All paths relative to `frontend/fixture-slice/`:

* F2 page/state/dialog/presentation: `src/station-arrival-page.{ts,html,scss}`.
* Canonical type-only imports and closed runtime guards:
  `src/station-arrival-contract.ts`; synthetic tests only:
  `src/station-arrival-fixtures.ts`.
* Independent uncertainty/terminal namespace: `src/station-arrival-session.ts`.
* Shared integration: `src/api.ts`, `src/contract.ts`, `src/routes.ts`,
  `src/attendance-page.{ts,html}`, `src/stage-arrival-contract.ts`,
  `src/stage-arrival-page.{ts,html}`, `src/stage-arrival-session.ts`,
  `src/view-history.ts`.
* Tests: `src/station-arrival-{contract,page,session,generation}.spec.ts`;
  persisted-safety isolation setup only in
  `src/stage-arrival-{page,generation}.spec.ts` and
  `src/native-arrival-session.spec.ts`.
* Owned browser verification:
  `checks/station-arrival-browser-check.mjs`,
  `checks/station-arrival-browser-server.mts`;
  `checks/arrival-focus-proof.mjs` adds station host to header geometry,
  retaining the native proof unchanged otherwise.
* `README.md`, `VERIFICATION.md`.

Exact7/9/10/11 identity admission is preserved. F2 requires the joint fixture11
identity/source and explicit row. No Administrator fallback, real credential
claim, editable business timestamp or native F2 affordance.
Pure context/validation; optional NULL stage; warning ACK then explicit full
operation confirmation; strict station receipt and independent errors.
Pending/doubleactivation/expiry/abort/stale generation/UNKNOWN stop safely.
Opaque storage is namespaced; unrelated same-document tuples are not made
uncertain merely by another F2 attempt. Dependent F1/F2 are cross-blocked,
without treating an F2 marker as an F1/native outcome. No reset API or browser
reset is invented. Old unresolved/new demo outcomes are never conflated.

## Exact commands and results

All npm/node commands below were run from `frontend/fixture-slice`.

| Command | Result / evidence class |
|---|---|
| `npx vitest run src/station-arrival-contract.spec.ts --config vitest.config.ts` | First-edit cheapest check PASS2/2, pure static/runtime DTO tests. |
| `npm test -- --include='src/station-arrival*.spec.ts'` | Final focused PASS36/36 in4 files; Angular + HttpTestingController/uncooperative callbacks, not live backend. |
| `npm test -- --include='src/station-arrival*.spec.ts' --include='src/stage-arrival*.spec.ts' --include='src/native-arrival*.spec.ts' --include='src/attendance-page.spec.ts' --include='src/shift-items-navigation.spec.ts'` | Focused regression PASS153/153 before later additive F2 cases; final full suite below subsumes it. |
| `npm test` | Final full PASS469/469 in35 files, including native/history/API/identity regressions. |
| `npm run typecheck` | PASS strict application TSC. |
| `npm run build:dev` then `npm run check:profile -- dev` | PASS build + emitted exact two-key profile `/api`. |
| `npm run build:test` then `npm run check:profile -- test` | PASS build + emitted exact two-key profile `/api`. |
| `npm run build:production` then `npm run check:profile -- production` | PASS budgets/build + emitted exact two-key profile `/api`; final output is production. |
| `node checks/station-arrival-browser-check.mjs` | PASS actual Chrome/production artifact, **synthetic intercepted HTTP**. |
| `node checks/station-arrival-browser-check.mjs --fixture-proxy` | PASS actual Chrome → owned loopback proxy → stable actual joint fixture runtime/HTTP/memory store, **no interception**. Not Oracle/native. |

Browser aggregate (intercepted): widths1440/390/320, dialog Tab/Shift+Tab/Escape,
reduced motion, exact opener focus, real origin filters + vertical/RTL scroll
at matching viewport, Back/Forward without resubmit, known success not UNKNOWN,
pending repeated Space1 command, late ACK0→explicit command1, transport UNKNOWN
and reload barrier. Two commands total; runtime exceptions0; unexpected
requests0. Screenshot pixel focus proof at320 for pending/SUCCESS/Escape/UNKNOWN:
solid3px +3px offset, effective opacity1, full48px button and ring visible,
hit-testable, contrast **12.6179:1** (ring0,47,101; adjacent250,250,250).
No driver focus/scroll assistance after the final action for these proofs.
Visual review of390 context and320 warning confirms Hebrew RTL, readable
24h/full timestamps, bounded overlays and no page overflow.

Actual fixture aggregate: browser F1 review0/commit1 → new F2 context sees that
stage → F2 review0/commit1; store confirms F1 receipt/audit1/1 and independent
F2 receipt/audit1/1, active0, changed shared revision, unchanged
stage/user/briefing. Independent HTTP detail readback agrees with both facts.
Two commands total; runtime exceptions0; unexpected requests0.
The helper uses `createStationArrivalFixture`, `createRuntime`,
`createLoopbackServer`, sample synthetic facts and fixed injected Clock.
This is **actual isolated fixture runtime+HTTP integration**, not environment
bootstrap verification or an independently deployed backend.

## Failed attempts and retests (not hidden)

* Initial expanded Angular run: Vitest worker startup timeout before any tests;
  owned runner stopped. Narrow rerun passed; no tooling/dependency install.
* First full compile after clock guard: TS2345 unknown zone; corrected explicit
  string narrowing. Full rerun initially422 PASS/30 FAIL because new F1 fixture
  safety survived between tests; isolated only the new opaque slots in related
  setup/teardown. Native guard itself was not removed. Focused153 then
  full464 and final469 passed.
* Browser found Material focus specificity and initial disabled ARIA override.
  Added F2-scoped high-contrast rule and supported `disabledInteractive` with
  synchronous guards. A fractional CSS-pixel ring clip was corrected by
  outward-rounded measured scroll clearance. Final screenshot pixel checks PASS.
* Checker-only retries: await checkbox render, optional DOM node while route
  loads, compare origin scroll at the **same viewport**. No app timeout/retry,
  fake geometry or jsdom scroll proof was introduced.
* Existing Node typeless-package warning from shared TS browser helpers and
  jsdom `scrollTo` not-implemented messages remain informational. Browser,
  not jsdom, supplies scroll/geometry evidence. No package metadata changed.

## Source evidence and limitations

Controlling read-only inspection: `old/SHF/src/bzq/shf/model/AttendanceDataModel.java`
registerStation1054–1115, `actions/AttendanceDataAction.java`160–178;
`old/SHFWeb/WebContent/js/attendance.js`491–544 and misnamed
`jsp/employee_arrive_stage.jsp`1–10. Stage is not a station prerequisite.
Legacy write-before-warning/INSERT behavior is intentionally **not** copied;
approved §§41–42 before-write warning/existing-row-only contract controls.
Source-contract catalog was absent; used baseline-linked controlling paths.
Reuse evidence: existing F1/native page guards, SliceApi envelope/timeouts,
ViewHistory/ListNavigation, WorkspaceShell and namespaced arrival focus proof.

Not run/claimed: manual screen-reader/AT, complete zoom/reflow and full contrast
audit, full WCAG2.2AA conformance, production authentication/deployment,
live Oracle/native F2, DNS/DB/broker, real TEST F1 pilot or M1 completion.
Native TEST pilot still externally blocked by independently authoritative
SERVER_HOST input (operator/DBA + parent LIVE GO); no such attempts here.
Backend owner handoff enabled only the actual isolated fixture integration;
its later temporary QA-01 hold now blocks **post-fix** integration retest.
Parent QA should independently exercise source-stable F2UI01–12, especially
real combined runtime expiry/conflict/concurrent preparation and same-entry
history across mobile viewport changes. No open frontend implementation blocker;
the post-fix integration freshness blocker is backend/parent-owned.
No shared-contract request. No browser RESET is provided: a new demo process
does not resolve an old UNKNOWN and no approved reset endpoint exists.

# SHF-NATIVE-ARRIVAL-UI-20 — earlier frontend verification (20 October 2026)

## Latest follow-up — UI-D01/UI-D02 fixed, ready for bounded independent QA retest

**Scope:** the two confirmed focus defects from independent QA35a1, report
lines80–120, not new UI/API behavior. Approved §43/§45 v0.1 unchanged. Developer
fix/retest complete; caller/independent QA owns confirmation before publication.
No backend/canonical/root/project-status/legacy/Git/dependency changes.

### Exact changed paths for this follow-up only

Relative to `frontend/fixture-slice/`:

```text
src/arrival-focus.scss
src/styles.scss
src/stage-arrival-page.scss
src/stage-arrival-page.ts
src/native-arrival-page.spec.ts
checks/arrival-focus-proof.mjs
checks/native-arrival-browser-check.mjs
README.md
VERIFICATION.md
```

**UI-D01:** component keyboard ring specificity now beats Material's
outline:none. Global overlay rule is restricted to
`.cdk-overlay-pane.shf-arrival-dialog`, explicitly opted into by native/F1
arrival dialogs; no generic global Material override or `!important`. Both
`:focus-visible` and focused `.cdk-keyboard-focused` are handled. Whole-button
opacity removed; disabled foreground/background stays separate from full-opacity
ring. Aria-disabled + synchronous command guard and the same button DOM remain.

**UI-D02:** native `restoreFocus:false` prevents the early Material restore.
After dialog close/pending/cancel render, `afterNextRender` restores the exact
opener with `preventScroll`, then checks actual usable viewport geometry.
Sticky-header height and outline/offset margins are measured, not hardcoded Y.
Only an out-of-view opener scrolls with nearest/instant. Success/UNKNOWN/error
callbacks check focus ownership; they never focus a different heading/body or
take focus back from user navigation. Alive/generation/connected checks ignore
stale queued work. No timer, arbitrary delay or application polling.

### Actual rendered Chrome measurements — synthetic only

Measured with three-frame observation barrier after the pending render, **no
driver focus/scroll assistance after final Enter**. Exact focused node, solid3px
outline/3px offset, effective ancestor opacity1 and hit-test checked. The helper
decodes actual Chrome PNG pixels (Node built-ins, no dependency) and compares a
flat ring sample against its adjacent rendered background; this is not a
computed-outline-width-only or body-text assertion.

| Viewport | Cancel / enabled final-confirm contrast | Review/pending/SUCCESS/UNKNOWN opener contrast | Pending bounds / visible height |
|---|---|---|---|
| 1440×900 |12.5332:1 /12.5332:1 |12.6179:1 in all four states |top845.94, bottom893.94, visible48px |
| 390×900 |12.5332:1 /12.5332:1 |12.6179:1 in all four states |top647.94, bottom695.94, visible48px |
| 320×900, font30 |12.5332:1 /12.5332:1 |12.6179:1 in all four states |top429.88, bottom528.63, visible98.75px |

All entries: exact opener remains focused, full ring inside usable viewport,
`hit=true`, contrast≥3. Pending success/unknown branches each POST exactly1 even
after three additional native Space activations. Native HTTP double independently
measures1440 pending845.94–893.94/48px and success744–792/48px, both hit=true and
12.6179:1. This is UI evidence, **not Oracle/native-adapter evidence or full WCAG**.

Synthetic screenshots:
`.angular/browser-evidence/NATIVE-focus-retest-{Cancel,final-confirm}-<width>-SYNTHETIC.png`,
`NATIVE-focus-retest-pending-<width>-{clean,unknown}-SYNTHETIC.png`,
and `NATIVE-focus-retest-{clean,unknown}-<width>[-font30]-SYNTHETIC.png`.
Visually inspected Cancel320-font30 and pending1440; no personal/live data.

### Commands and results for this follow-up

Working directory `frontend/fixture-slice`:

| Exact command | Result |
|---|---|
| `npm test -- --include=src/native-arrival-page.spec.ts --include=src/stage-arrival-page.spec.ts --include=src/stage-arrival-generation.spec.ts` | **PASS87/87**,3 files. New cases assert scoped component ring/overlay opt-in; scroll after pending DOM render with same opener; no scroll in view, no stealing focus on result/user navigation/recheck |
| `npm test` | **PASS430/430**,30 files, original427+3 new focus regressions |
| `npm run typecheck` | PASS exit0 |
| `npm run build` | PASS exit0, actual templates/global+component styles compiled |
| `node --check checks/arrival-focus-proof.mjs`; `node --check checks/native-arrival-browser-check.mjs` | PASS |
| `node checks/serve-stage-arrival.mjs --port=4406` + `node checks/native-arrival-browser-check.mjs --focus-retest` | PASS bounded two-defect pixel/geometry/contrast matrix,30 measurements at three viewports and both outcomes |
| `node checks/native-arrival-browser-check.mjs` against same static helper | PASS complete native interception/guard/reload/source-switch/keyboard matrix |
| `node checks/serve-native-arrival-double.mts --synthetic-native-http-double` + `node checks/serve-stage-arrival.mjs --port=4406 --native-http-double-proxy` + `node checks/native-arrival-browser-check.mjs --http-double` | PASS normal same-origin HTTP to typed synthetic stub; context1/PURE2/command1, added actual pending+success pixel/geometry assertions |
| Existing strict standalone TypeScript command for `checks/serve-native-arrival-double.mts` below | PASS again, no installs |
| `node checks/serve-stage-arrival.mjs` + `node checks/stage-arrival-browser-check.mjs` | PASS unchanged F1 clean/pending Space/late-warning Escape/UNKNOWN/reload/7-read-only scenarios |
| `node checks/stage-arrival-legacy-check.mjs` | PASS unchanged current/detail/search/schedule browser navigation, reload focus and pickers |

Initial focused style test correctly failed when it tried to inspect the external
global stylesheet through jsdom (the unit runner does not attach it). The test
now asserts real component CSS and dialog namespace opt-in; actual overlay CSS
is independently measured in Chrome PNG pixels rather than injected into the
test to create a false pass. jsdom's scrollTo notices are not geometry evidence.

**Remaining/not run:** independent QA35a1's same bounded two-defect retest and
publication decision belong to caller/QA; full WCAG/screen-reader certification
not claimed. Native live integration, real attendance tuple reachability,
Oracle/credentials/environment files and DML remain **NOT RUN**. Backend's
parallel four-defect fix was not touched. Prepared window remains expired and
operator revalidation remains required. Own synthetic helpers/profiles are
closed/cleaned after checks; user application ports untouched.

---

## Current result — UI implemented; independent QA / live backend handoff

Approved contracts: §43.5 / §43.7 and §45 **v0.1**, user20Oct16:07 approval
relayed by caller; canonical
`backend/fixture-slice/oracle-stage-arrival-contracts.mts` type-only imports.
Fixture §38–40 v0.1 / §40.5 remains intact. No canonical/backend/docs/root/
legacy/Git modifications; this owner writes only `frontend/fixture-slice/`.
Project checkpoint publication belongs to caller, not this owner.

Read-first evidence: `docs/PROJECT_STATUS.md`, project instructions, agent brief,
existing ui-developer skill, relevant design baseline and actual Angular F1.
Source contract catalog absent. Controlling read-only source inspected:
`old/SHF/src/bzq/shf/model/AttendanceDataModel.java:1237–1304`,
`old/SHF/src/bzq/shf/actions/AttendanceDataAction.java:317–339`,
`old/SHFWeb/WebContent/js/attendance.js:140–203`. The approved native branch
does not reproduce legacy INSERT fallback, optimistic checkbox or mutating GET.
Source inspection is not proof of deployed Oracle behavior.

Node24.21.0/npm11.19.0 actually reported. Existing Angular21.2.25,
Material/CDK21.2.14, TypeScript5.9.3, RxJS7.8.2, Vitest4.0.8 retained;
no manifest change, dependency install, tooling upgrade or scaffold.

### Changed paths (all relative to `frontend/fixture-slice/`)

* `src/contract.ts`, `src/api.ts`, `src/attendance-page.ts`
* `src/stage-arrival-contract.ts`, `src/stage-arrival-session.ts`
* `src/stage-arrival-page.ts`, `src/stage-arrival-page.html`
* `src/workspace-shell.html`, `src/stage-arrival-generation.spec.ts`
* `src/native-arrival-fixtures.ts`, `src/native-arrival-contract.spec.ts`
* `src/native-arrival-page.spec.ts`, `src/native-arrival-session.spec.ts`
* `src/native-read-views.spec.ts`
* `checks/native-arrival-browser-check.mjs`, `checks/serve-stage-arrival.mjs`
* `checks/serve-native-arrival-double.mts`
* `README.md`, `VERIFICATION.md`

Native10 is separate from read7/F1 fixture9; no future F2 admission or role
promotion. Coherent source-aware context/validation/receipt and private-field
allowlists fail atomically. Native request adds explicit whole-operation consent;
no late path/time controls. Existing API paths and fixture wire shape unchanged.
Review describes all three write fields without exposing/inventing a private
operator stamp. Actual final time is freshly determined by backend.

Pending native safety marker is persisted before POST in history and tab
sessionStorage; only random UUID + command-kind + mode, no personal cache,
tokens, payloads or receipts. This additional opaque tab marker is necessary
because a full-document10→9→7→10 source/config switch loses an Angular service
and current history entry. It is a blocker, never a capability or reset-proof
authorization mechanism. Known outcome resolution is source/attempt-bound;
UNKNOWN remains global across modes and reload, with no new-demo/reset advice.
Exact fixture UUID history behavior remains. Neither client markers nor
backend memory are advertised as durable/global exactly-once.

### Exact checks and evidence classes

Working directory: `D:\AIProjects\SHFAI\frontend\fixture-slice`.

| Command | Measured result / class |
|---|---|
| `npm run typecheck` | PASS, exit0; supported installed stack unchanged |
| `npm test -- --include=src/stage-arrival-contract.spec.ts --include=src/stage-arrival-page.spec.ts --include=src/native-arrival-contract.spec.ts` | PASS49/49 after initial worker startup timeout; fixture regression + native guard tests, Angular/jsdom only |
| `npm test -- --include=src/native-arrival-page.spec.ts --include=src/native-arrival-contract.spec.ts` | PASS33/33 at that checkpoint; additional adversarial cases included in final suite |
| `npm test -- --include=src/native-read-views.spec.ts` | PASS14/14; all seven read views accept native10 with proper Oracle source pairs and reject fixture DTOs without fallback |
| `npm test` | FINAL PASS **427/427**,30 files: original357 +70 native cases (six generation, six contract,35 component, nine safety-session,14 read-view/source cases) |
| `npm run build` | PASS, production Angular templates/assets compiled; not production deployment/auth authorization |
| `node checks/serve-stage-arrival.mjs --port=4406` + `node checks/native-arrival-browser-check.mjs` | PASS on final native implementation checkpoint; Chrome155, synthetic Fetch interception ONLY, owned4406/9406, no Oracle/native writer/account access |
| `node checks/serve-native-arrival-double.mts --synthetic-native-http-double` + `node checks/serve-stage-arrival.mjs --port=4406 --native-http-double-proxy` + `node checks/native-arrival-browser-check.mjs --http-double` | PASS; actual same-origin HTTP to typed synthetic stub on4407, NOT parallel native backend. Context1/PURE2/command1; Escape0, explicit confirm1, pending duplicate Space1/focus, exact native receipt, synthetic `oracle` detail + `oracle-read-only` attendance readback and exact return opener/filter. Stub logs one **synthetic acceptance**, not Oracle effect |
| `.\node_modules\.bin\tsc.cmd --noEmit --strict --target ES2024 --module NodeNext --moduleResolution NodeNext --typeRoots ../../backend/fixture-slice/node_modules/@types --types node --allowImportingTsExtensions --verbatimModuleSyntax --erasableSyntaxOnly checks/serve-native-arrival-double.mts` | PASS, no typecheck suppression or installs; canonical type-only DTOs, existing installed backend Node types reused for test helper |
| `node --check checks/native-arrival-browser-check.mjs`; `node --check checks/serve-stage-arrival.mjs` | PASS, exit0 |
| `node checks/serve-stage-arrival.mjs` + `node checks/stage-arrival-browser-check.mjs` | PASS existing F1 synthetic browser regression; exact old7 read-only denial and fixture9 preserved |
| `node checks/serve-stage-arrival.mjs --fixture-proxy` + `node checks/serve-stage-arrival-fixture.mjs --isolated-fixture --scenario=clean` + `node checks/stage-arrival-browser-check.mjs --fixture-proxy --scenario=clean` | PASS; actual F1 memory runtime over normal HTTP, not native adapter. PURE1, UI command1 + explicit test-only KNOWN replay1, one installed arrival/receipt/audit |
| Same two scenario commands for `late`, `unknown`, `stale`, `expired`, one fresh owned helper per scenario | ALL PASS. Late PURE2/command1/effect1; post-install UNKNOWN command1/effect1 honestly unresolved; stale/expired command1/effect0. No Fetch interception in proxy matrix; no SQL/Oracle |
| `node checks/stage-arrival-legacy-check.mjs` | PASS unchanged current/detail/search/schedule browser suite, synthetic interception |
| `$env:SHF_ATTENDANCE_ONLY='1'; node checks/stage-arrival-legacy-check.mjs` | PASS original attendance suite, filters/25+5/scroll/opener/two actors/Back/Forward/320-font30 |
| `$env:SHF_CARD_ONLY='1'; node checks/stage-arrival-legacy-check.mjs` | PASS card five origins, source/capabilities/races/focus/RTL |
| `$env:SHF_ITEMS_ONLY='1'; node checks/stage-arrival-legacy-check.mjs` | PASS items sources/25+5/errors/keyboard/RTL/320-font30 |

Native Chrome assertions: full-operation checkbox/final button, Cancel/Escape0,
PURE0, command1, duplicate Space while pending1, exact pending/success/UNKNOWN
opener focus, persistent source/auth disclosures, complete date/seconds/zone,
1440×900/390×900/320×900-font30 bounded scrolling dialog and no page horizontal overflow.
Forged clock, wrong selected employee, native late-warning reply, late refusal,
already-recorded context and monotonic expiry send0 commands. Native success
requires exact receipt + ACK/readback; network loss, missing readback or fixture
receipt after POST become UNKNOWN.10→9→7→10 full-document switches and pending
reload add0 context/validation/command requests, no cached result.
Synthetic screenshots generated and visually inspected at320-font30 and1440;
no real records or personal-data captures.

Historical failures fixed before passing runs: missing type narrowing; test
fixture `unknown` HTTP flush typing; worker thread startup timeout (stopped owned
run, rerun passed; later buffered focused run also stopped, visible rerun passed);
new read-test initially called `apply` rather than existing search `search`
handler (test corrected); changed generic read-source text (restored legacy text);
full-document switch originally dropped in-memory safety (opaque tab marker
added); native test-driver final button raced checkbox rendering (effective
readiness barrier added); old F1 known-success string restored without labeling
native success as simulation. The HTTP helper's first standalone typecheck could
not find frontend-local Node types; corrected to the already installed backend
type root, strict typecheck PASS without install. No failed check is counted as passing.
jsdom emits expected `scrollTo`-not-implemented notices; real keyboard/focus/
geometry claims use Chrome, not jsdom. No accessibility scanner or screen-reader
certification; this is **not** full WCAG2.2 conformance.

### Not run / owners / next action

* **Actual native adapter integration and live Oracle write/readback NOT RUN.**
  Native Chrome uses interception or a typed synthetic HTTP stub, not the parallel backend.
  Backend owner/independent QA must exercise the canonical native implementation;
  final operator alone performs the approved controlled synthetic TEST write.
* Current eligibility, prepared-marker/private bindings, current grants/policy/
  window/freeze/allowance, commit acknowledgment and independent database readback
  remain backend/operator evidence. No real IDs/data, ENV/credential files,
  database/Oracle transport or native SQL was accessed/executed by this owner.
* Real authorized attendance-list reachability for the admitted tuple remains
  an explicit live QA prerequisite; no fabricated row closes that gap.
* Durable native receipt/replay/status, general cross-tab/process exactly-once,
  production real authentication and later dev/test/production configuration
  tooling are not implemented by frontend. Required environment behavior is captured in
  README; backend/operator/caller own delivery and deployment decisions.
* Backend `ba8f` READY OFFLINE420/420 (340 old+80 native), strict PASS was
  relayed by caller; not an independently rerun frontend result. Backend README
  and `native-stage-arrival-config.mts` exact private schema were read, with
  no configuration values/ENV files accessed. Separate pools/UoW and external
  one-attempt restart-protection allowance belong to backend/operator; its
  private path never enters browser. Shared canonical contract unchanged.
  Prepared `_B` window is expired per handoff: operator must revalidate actual
  current eligibility; no manufactured Clock or UI override.
* User ports4350/4349/4319/4328/4320/4389/4399 untouched. Only owned
  4388/4398/9398 (F1) and4406/4407/9406 (native) helpers/profiles used and cleaned up.
  No Git action, secret inspection, install, legacy execution or live effect.

---

# Historical SHF-F1-UI-20 verification baseline

Everything below is prior fixture-only evidence; its earlier "no native DML
approval" statements are historical, not a reversal of subsequent §43/§45
implementation approval. Current live evidence remains NOT RUN as stated above.

**Status: UI READY / review for independent QA — actual Angular F1, synthetic
checks and real same-origin fixture proxy matrix PASS after parent §40.5 READY.**
This is not a request to reapprove the accepted F1 scope and is not native DML/
release authorization. The earlier Chrome-header blocker is resolved by the
canonical backend compatibility correction, not a frontend workaround.

## Approved versions and source evidence

* Design §§38/39 v0.1, latest39.7 D01–D03, existing HTML#stage-arrival,
  canonical §40 v0.1 plus **§40.5 internal compatibility erratum**, read directly;
  user20Oct11:19 “Agree. run next step”. Public schemas/operations/capabilities
  unchanged; explicit UoW cancellation and bounded browser metadata clarified.
* Canonical `backend/fixture-slice/stage-arrival-contracts.mts`, type-only imports;
  existing Principal/Identity/read DTO shapes retained. Source catalog absent;
  reverse-engineering baseline and exact §§38/39/40 were read.
* Controlling legacy read-only source:
  `AttendanceDataModel.java:1237–1304` (server clock, update/insert before warning);
  `AttendanceDataAction.java:317–339` (reports then stage action);
  `old/SHFWeb/WebContent/js/attendance.js:140–203` (optimistic checkbox/mutating GET).
  No legacy execution/build/edit; no proof of deployed commit behavior.
* Existing attendance guards/router/ViewHistory/HTTP helper and calendar/
  keyboard-modal readiness helpers inspected and reused.
* Runtime actually reported Node24.21.0 / npm11.19.0. Existing manifests retain
  Angular21.2.25 / Material-CDK21.2.14 / TS5.9.3 / RxJS7.8.2 / Vitest4.0.8.
  No dependency install, upgrade or scaffold.

## Implemented behavior / proof distinctions

Actual Angular route and explicit attendance-row entry, server-admitted eligibility,
reason-only form, PURE validation, native Material warning/checkbox/review,
separate one-command confirm, guarded pending focus, matching fixture receipt,
known-none/rollback error and UNKNOWN/recovery are implemented, not storyboard JS.
Exact ordered nine-cap fixture identity enables F1; seven-cap Oracle remains
valid read-only. No hardcoded actor fallback or selected employee identity.
Read DTOs have no invented attendanceId/feature/mode fields.

Context/validation/receipt/problem allowlists are atomically checked at runtime.
Selected row/day/attendance-day/team/source, actor/grants, draft, preparation
instance/token/fingerprint, time/expiry and exact warning acknowledgment are
compared before action/delivery. Success additionally requires200 JSON,
no-store/nosniff, bounded DTO and fixture-only/not-invoked receipt.
Unknown/wrong envelopes after submission are never false-safe success/zero.
Canonical proven-no-effect5xx is an explicit stopped failure; malformed/unproved
5xx is UNKNOWN. Neither path automatically retries.

Before POST an opaque attempt marker enters history; no business values or
tokens/receipt are serialized. App navigation/Back/Forward merge it. Reload
without the volatile preparation stays RECOVERY REQUIRED. The same tuple cannot
reprepare after pending/UNKNOWN, including chooser navigation. The marker
conservatively blocks all F1 selections after context loss. No local reset or
unapproved API exists: a new genuinely isolated fixture application/process must
be started explicitly by its owner; that never determines the previous outcome.
History/tab loss and cross-instance durable idempotency remain outside this guard.

Time is server-owned and read-only. Monotonic elapsed time only expires a token;
no UI business lateness arithmetic or timestamp is submitted. Fixed-clock fixture
screens, volatile token/receipt retention, no durable idempotency and no Oracle DML
approval are explicitly disclosed. All failure/success/UNKNOWN states retain a
persistent compact yellow/blue simulation/no-Oracle/no-real-arrival notice.

## Exact commands / measured results

Working directory for the following commands: `D:\AIProjects\SHFAI\frontend\fixture-slice`.

| Command | Result / evidence class |
|---|---|
| `npm test -- --include=src/stage-arrival-contract.spec.ts --include=src/stage-arrival-page.spec.ts --include=src/stage-arrival-generation.spec.ts` | Earlier exact run **47/47 PASS**; final F1 set contains49 cases including immutable restored-entry selection and known-success read-only return, executed in the51-case combined run below. Canonical guards, exact HTTP bodies/headers/query/method/budget, atomic source binding, forged ACK, expiry, malformed/unproved failures, known-none stop, wrong-source receipt, reload/history marker and deliberately ineffective cancellation/late A after B. Angular/jsdom + synthetic HTTP only. |
| Same command with `--include=src/workspace-shell.spec.ts` | Final **51/51 PASS**, four files:49 F1 +2 existing shell cases. Added regression distinguishes known-success/read-only return from genuine UNKNOWN without allowing another preparation/command. |
| `npm test` | Final **357/357 PASS**,26 files: all308 original cases +49 F1 cases. Last full run after the known-success versus uncertainty correction passed; jsdom `scrollTo` limitations are not browser evidence. |
| `npm run typecheck` | PASS / exit0, no dependency changes. |
| `npm run build` | PASS / exit0, actual Angular templates and production assets compiled. |
| `node checks/serve-stage-arrival.mjs` | Owned static UI helper4388 READY; no backend/resource/Oracle requests are forwarded. |
| `node checks/stage-arrival-browser-check.mjs` | Native Chrome155, synthetic API interception: PASS. Fresh owned profile/CDP9398, no arbitrary animation sleeps, native keyboard and existing modal readiness barrier. |
| `node checks/serve-stage-arrival-fixture.mjs --isolated-fixture` | Actual READY backend runtime on owned4398 started, canonical sample/config and explicitly injected fixed test Clock, SAME snapshot readers/store; not an HTTP double. |
| `node checks/serve-stage-arrival.mjs --fixture-proxy` | Real same-origin owned UI proxy4388→fixture4398 READY; forwards request headers without silently filtering rejected browser metadata. |
| `node checks/stage-arrival-browser-check.mjs --fixture-proxy` before §40.5 fix | **Historical BLOCKED**, retained, not retroactively PASS. First inquiry10:00 returned honest empty; corrected to actual planned10:30. Subsequent context GET got400 INVALID_REQUEST due to strict header admission. Header names only were inspected. Each reached-context attempt: context1 / validations0 / commands0. No token/body logging or effects. |
| `node checks/stage-arrival-browser-check.mjs --fixture-proxy --scenario=clean` | **PASS**, native hints unchanged; context3 / PURE1 / command HTTP2 = UI confirm1 + explicit test-only KNOWN replay1, four detail readbacks. One atomic stage/receipt/audit1/1/1 even after server-token expiry. |
| Same command with `--scenario=late` | **PASS**; context3 / PURE2 / command1 / detail readbacks5. Warning Escape0 and ACK/review0; final confirm1; stage/receipt/audit1/1/1. |
| Same command with `--scenario=unknown` | **PASS**; context2 / PURE1 / command1 / detail readbacks3. Actual post-install503 with stage/receipt/audit1/1/1; no false success/zero. Reload→chooser→same tuple adds no context, validation or command. |
| Same command with `--scenario=stale` | **PASS**; context2 / PURE1 / command1 / detail readbacks3. Existing isolated revision/policy fault seam produces409; stage/receipt/audit0/0/0; no auto retry. |
| Same command with `--scenario=expired` | **PASS**; context2 / PURE1 / command1 / detail readbacks3. Canonical injected server Clock crosses expiry after PURE response, no sleep/client timestamp;409 and stage/receipt/audit0/0/0. |
| `node checks/stage-arrival-legacy-check.mjs` | Original current/detail/search/schedule browser suite PASS: strict dates, pickers, errors, scope/source, history, RTL/long text. |
| `$env:SHF_ATTENDANCE_ONLY='1'; node checks/stage-arrival-legacy-check.mjs` | PASS: original attendance12 columns/25+5, calendar geometry31 real day clicks at320/font30, two-Escape selectors/dialog, two-actor independent ranges and Back/Forward, original D01/D02 focus/contrast checks. |
| `$env:SHF_CARD_ONLY='1'; node checks/stage-arrival-legacy-check.mjs` | PASS: five origins, nested chains, old source/error/capability/late A-B checks, RTL1440/390/320/font30. |
| `$env:SHF_ITEMS_ONLY='1'; node checks/stage-arrival-legacy-check.mjs` | Initial and unchanged repeat FAILED at existing `items-browser-check.mjs:139`, cold return expected an applied search after full-document navigation had destroyed its volatile source snapshot. Corrected **test setup**, not assertions or application: create an actual search→items source journey before pending cancellation. Retest PASS, including all original source link/own-ID/error/keyboard/RTL assertions. |

Native F1 measured scenarios:

* Explicit attendance→F1→Cancel: command0, exact attendance opener/filter restored.
* Clean PURE prepare0→review0→explicit confirm: command1; four repeated native
  Spaces while pending still command1, same button/focus; actual fixture receipt
  only, partner not invoked.
*1440/390/320 +30px: no page overflow; action targets>=48px. Warning at390 and
 320/font30 traps Tab/Shift+Tab, has settled finite animations and its **entire**
 cancel/review buttons fit the viewport. Full local date/time/zone wraps.
* Browser-only injected elapsed clock crosses token expiry: command0, no auto
  validation/command. This test instrumentation is not production submit logic.
*409 stale: no receipt/automatic retry; existing-row-required context blocks
 validation. Five pure context error classes400/403/404/500/503 send command0.
* Seven-cap Oracle-marked **intercepted test double** remains valid READONLY,
 with no F1 controls, context request or command. No actual Oracle instance used.
* Late warning native Escape: command0 and exact prepare opener. Checked warning
 review still0; only explicit final confirm sends1. Simulated connection loss
 yields UNKNOWN; button/focus and persistent notice remain.
* UNKNOWN reload→actual Angular chooser link→same row remains blocked, no new
 validation/command. Separate independent synthetic pending test tab reloads
 **before receipt**, then chooser→same tuple remains recovery, exactly1 command.
 The prior UNKNOWN tab is not reset or resolved.
* Aggregate final synthetic F1 browser sequence (including independent pending
 test):12 F1 context GETs,6 PURE validations,4 commands total: clean1, stale1,
 late-disconnect1, pending-reload1. Direct/blocked/error/cancel/expiry paths add0.
 No external runtime requests or JS exceptions were reported.

Ignored synthetic screenshots:
`.angular/browser-evidence/F1-*-SYNTHETIC.png`; no tokens/private data on screen,
no publication. Visual inspection exposed initial scroll/notice and large-text
modal-action clipping: corrected only the F1 opt-in shell/layout and measured
entire action bounds, not relaxed assertions. Context-ready desktop compact
primary-action-above-fold is explicitly asserted by the current browser driver.

## Historical failures, blocked checks, risks and next action

* First typecheck exposed a misplaced presentation helper; repaired.
* First test invocation hit existing Windows Vitest thread-start timeout,
 collected0 tests and hung; stopped **only owned shell1001**, reran normally.
 No pool/dependency/timeout manipulation or passing claim for that attempt.
* Initial focused failures exposed asynchronous MatDialog close timing and stale
 test component references after route recreation. Awaited real `afterClosed`
 and used the actual newly routed instance. A later422 test exposed reactive
 enable clearing server errors; corrected control transition, retained assertion.
* Native driver initially selected the wrong active Material option, used Enter
 instead of Space on a checkbox, and used full-document navigation instead of
 the actual chooser RouterLink for the safety scenario. Those attempts failed;
 corrected native drivers/setup, not safety checks. Further visual action clipping
 was fixed in actual F1 layout and now has an explicit viewport-bounds assertion.
* Native wrappers emit the pre-existing Node MODULE_TYPELESS_PACKAGE_JSON warning;
 no manifest change made just to silence it. Full WCAG/AT/screen-reader/all-color/
200% text/400% zoom conformance is **not claimed**.
* Backend initial READY relay: `f5f618`,262/262 (223 old +39), strict and no-Oracle
 import child-hook test. Final §40.5 parent READY: focused113 / full336 / strict,
 explicit pre-install signal+ALS checks and bounded standard client hints.
 Those backend tests are **caller-supplied evidence**, not executed by this task.
 Canonical sample/runtime started successfully. F1 sample has attendance/current/
 detail projections only; optional read adapters are deliberately not fabricated.
* **Historical blocker RESOLVED:** actual Chrome metadata admission. §40.5 adds
 exactly the three known hint names as ignored metadata; no proxy stripping,
 wildcard header bypass or browser-feature workaround. Every final real F1
 request was asserted to retain all three hints. No HTTP Fetch interception was
 enabled in the real proxy driver.
 Existing `stageArrivalOrigins` accepts exact UI origin4388 in the helper for POST.
 No new feature/identity field, operation/reset endpoint or approval gate is needed.
* Follow-up focused invocation hit the same existing Windows worker-start timeout
 at0 collected tests; stopped only owned shell1101. Unmodified rerun passed51,
 then full357. No skipped test, weakened assertion, pool or dependency change.
* Actual readback checks exposed the frontend's local terminal-set conflation:
 a known successful tuple returning from attendance could display recovery.
 Split known recorded membership from unresolved marker membership. Known
 success can GET already-recorded context and stays non-commandable; genuine
 UNKNOWN still blocks context/preparation after reload. New regression + actual
 clean/late return/readback tests PASS. No reset or receipt persistence was added.
* **NOT RUN:** production/live Oracle, EMS/CTI, legacy execution, native DML,
 durable recovery, deployment, screen reader/full-WCAG audit.
* All writes are inside `frontend/fixture-slice/`. No Git/agents, credential/
 publication environment, live PII, database or user app/port access performed.
 Helpers use only owned4388/4398/9398; owned Chrome profiles are removed in finally.
* Final cleanup: stopped only owned `f1-ui-proxy` / `f1-backend-fixture` tool
 sessions; verified **no LISTEN sockets on4388/4398/9398**. No owned `f1-*`
 Chrome profile directories remained. Ignored synthetic screenshots are retained.

Next action: **UI READY for caller's independent QA**, with no remaining frontend
protocol blocker or new approval request. Native Oracle DML remains separately
unapproved. History safety is conservative, volatile and not a durable
reconciliation/idempotency mechanism.

### Real proxy matrix execution details

For each scenario, a genuinely NEW isolated fixture process was started with:

```powershell
node checks/serve-stage-arrival-fixture.mjs --isolated-fixture --scenario=clean
node checks/serve-stage-arrival.mjs --fixture-proxy
node checks/stage-arrival-browser-check.mjs --fixture-proxy --scenario=clean
```

The same exact commands were run with matching `late`, `unknown`, `stale`,
`expired` values. Only the owned prior backend helper was stopped between
scenarios; no reset HTTP endpoint, UI local reset or user-app termination exists.
The helper uses canonical sample/config, injected Clock and the backend's existing
isolated MemoryStore fault/revision seams. `unknown` faults at `installed`,
`stale` changes test policy/revision at `reserved`, `expired` advances the test
Clock after validation. Clean advances only its test Clock after first known
commit to prove receipt replay precedes expired-token rejection. These are
test-process controls, never extra production StartupConfig or wire fields.

Final five-scenario matrix aggregate: **12 context GETs,6 PURE POSTs,6 command
HTTP POSTs =5 intended UI commands +1 explicit KNOWN-success test replay**;
18 explicit existing-detail readbacks. Three isolated processes installed1
stage/receipt/audit each (clean, late, unknown); stale/expired installed0.
This is not a global/durable exactly-once or production side-effect claim.
Initial smoke and historical failed attempts are separate from this matrix.

Node helper `finish` observations logged only operation/status and numeric
installation/receipt/audit counts, never tokens, draft, credentials or response
bodies. They confirmed all context/PURE stages at0/0/0, clean/late commits1/1/1,
retained replay still1/1/1, UNKNOWN503 still1/1/1, and stale/expiry4090/0/0.
Readback was actual same-source attendance/detail projection; no status lookup,
polling or automatic retry was added. UNKNOWN stayed blocked even though the
explicit test readback saw a recorded stage, which cannot attribute a lost
command to the client.

The complete intercepted Chrome suite was rerun after these frontend changes:
PASS, still12 context /6 PURE /4 command requests across its independent cases,
seven-cap Oracle test-double read-only, keyboard/focus/RTL/320+30px and pending/
UNKNOWN reload guards intact. No actual Oracle connection/import/credential/SQL
work was performed.

Final continuation cleanup PASS: every owned scenario backend and the UI proxy
were stopped via their exact tool-session IDs; no LISTEN sockets remained on
4388/4398/9398 and no owned `f1-*` Chrome profile directories remained. Helper
`node --check` syntax checks passed. All actual failed attempts remain recorded
above; no previous400/startup-timeout result is relabeled as a success.

## Changed assigned paths (all under frontend/fixture-slice)

```text
README.md
VERIFICATION.md
src/api.ts
src/contract.ts
src/routes.ts
src/view-history.ts
src/attendance-page.ts
src/attendance-page.html
src/workspace-shell.ts
src/workspace-shell.html
src/workspace-shell.scss
src/stage-arrival-contract.ts
src/stage-arrival-contract.spec.ts
src/stage-arrival-fixtures.ts
src/stage-arrival-generation.spec.ts
src/stage-arrival-page.ts
src/stage-arrival-page.html
src/stage-arrival-page.scss
src/stage-arrival-page.spec.ts
src/stage-arrival-session.ts
checks/serve-stage-arrival.mjs
checks/serve-stage-arrival-fixture.mjs
checks/stage-arrival-browser-check.mjs
checks/stage-arrival-legacy-check.mjs
checks/items-browser-check.mjs
```

---

# SHF-ATTENDANCE-UI-19 — historical whole keyboard-modal readiness / two cold Chrome checks

**Status: developer verification PASS within the requested bounded plan;
ready for SAME-QA final stock-full retest.** Latest QA failure was earlier than
the picker check: the initial calendar was mounted/open but ignored its Escape.
That remains a historical **nonpass**. D01/D02/H02 closures are caller-reported
and not reopened; no new application defect or publication approval is claimed.

## Actual underlying evidence (not a per-assertion workaround)

- **Source-observed:** installed Material21.2.14 `datepicker.mjs` implements
  `close()` with an early return when the content instance `_isAnimating`.
  Its native overlay close stream does call preventDefault and `close()`;
  DOM presence/DOM day focus alone does not imply the opening handler can close.
  CDK21.2.14's `OverlayKeyboardDispatcher` attaches a native **body keydown**
  listener while overlays are attached.
- **Runner-source defect:** old startup bound the first page from `/json/list`,
  did not establish active WebContents/document focus, and initial calendar
  Escape waited only for `mat-calendar` DOM presence. Review-only had a more
  complete calendar geometry barrier, explaining the different entry paths.
- **Observed on BOTH independent cold runs:** a newly created CDP page before
  activation had `{hasFocus:false, visibility:'visible'}`. The initial calendar
  admission saw a finite opening animation (`peakFinite=1`), then waited for0
  and3 stable frames. No intentionally unsafe extra Escape was sent to recreate
  the old failure. The evidence supports the missing admission conditions;
  it does not invent an application keydown fault.
- **After readiness:** one calendar Escape was delivered as trusted keyCode27
  keydown/keyup to an actually focused document, with one installed body handler.
  Calendar dismissal/exact opener assertions passed. FROM/TO select/dialog
  pairs also passed after the same common admission and existing lifecycle
  checks. No ignored ready key was observed, so application handlers were not
  modified.

## Exact changed paths / root implementation

All writes under `frontend/fixture-slice/`:

- New `checks/keyboard-modal.ts`: one self-contained bounded observer for live
  Material calendar/select/dialog and native dialog. Actual document focus,
  intended scope/trigger relationship, aria/open state, no closing select above
  the dialog,0 finite scoped animations and3 identical geometry frames. Ignores
  infinite decorative ripples, never sends a key/focuses/closes anything.
- `checks/browser-check.mjs`: a fresh **owned** CDP target via `/json/new`,
  close only that target afterwards; Page.bringToFront plus actual
  `document.hasFocus()`/visibility before native input, mouse and key-down.
  Every native Escape goes through shared modal readiness, installed listener
  inspection via DOMDebugger, and temporary observational key-event evidence.
  Actual keydown/keyup must be trusted, focused and keyCode27. Calendar
  activation is real native Enter, not Runtime `.click()`/`picker.open()`.
- `checks/attendance-browser-check.mjs`,
  `checks/attendance-review-check.mjs`: use the same active-page native toggle
  activation. No initial/narrow/review Escape bypasses the central barrier.
- New `src/keyboard-modal.spec.ts`:7 focused regressions.
- `README.md`, this file.

No application TypeScript/template/CSS/layout, calendar/picker acceptance
threshold, existing H01 helper, API/canonical/backend, manifests/dependencies,
legacy, Git, database or agent changes. Approved §35/36/37 v0.1 unchanged.
No unrelated page/network-idle wait, animation disabling, fake hasFocus,
arbitrary sleep, Escape retry, Cancel substitution or assertion weakening.

## Native-key evidence / bounded outcomes

Before Escape: Page.bringToFront, actual focused/visible document, focus inside
the frozen intended modal (or its controlling select trigger),3 stable
geometry/control/focus samples,0 finite animations and an installed CDK
body-keydown listener (native dialog uses its cancel listener). Deadline5000ms.
Then exactly one original keydown/up pair. Postconditions remain authoritative;
an ignored ready key would fail, not cause another Escape.

| Deliberate check | Isolation / result |
|---|---|
| cold FULL attendance A | new `.angular/attendance-cold-keyboard-a-19`, new Chrome process: **PASS** |
| stock review-only | one run after A, fresh owned tab: **PASS** |
| cold FULL attendance B | A process stopped/profile removed; new `.angular/attendance-cold-keyboard-b-19`, independent new Chrome process: **PASS** |

Exactly **two cold full attempts**, each passed on its first invocation; no
retry-until-green or third full attempt. Both profiles were required absent
before startup. Same unchanged readiness/key behavior was used; only the
diagnostic defaultPrevented read was corrected from a too-early capture
checkpoint to after native keyup before review/B. A's capture-time false flag
was not an assertion or a swallowed-key claim; actual close assertions passed.
B's final event report records `prevented:true`.

Both FULL runs include:

- initial calendar **one Escape**, actual focus true, trusted keyCode27,
  handlerCount1,0 finite animations and3 stable frames at dispatch;
- FROM/TO: original hour prep, then exactly **two separate** minute-select /
  dialog Escapes, exact opener and both values unchanged; no third recovery key;
- all62 physical calendar date selections, minimum45.703125×45.6875px,
  cornerFailures0/offscreen0/page overflow none, normal and root/main/day30px;
- unchanged D01 keyboard lifecycle:3px ring,12.62:1, same DOM/focus and one GET;
- no browser storage, external runtime requests or JS exceptions.

The single review-only run retains the same62 dates, D01 checks and settled
old-search calendar comparison. All test data/interception is synthetic.
No Oracle or backend fixture server was started for these intercepted runs.

## Exact check commands / scope

Directory `frontend/fixture-slice`:

```powershell
npm test -- --include src/keyboard-modal.spec.ts --include src/calendar-geometry.spec.ts --include src/picker-overlay.spec.ts --include src/browser-readiness.spec.ts
npm run typecheck
```

**20/20 helper regressions PASS**,4 files:7 whole-modal +6 geometry +3 picker
lifecycle +4 context readiness. Existing strict app typecheck PASS; the focused
Angular build also compiles the imported checker TS.
New cases cover a mounted focused calendar with unfocused document, finite
opening animation, moving geometry, select trigger outside listbox/infinite
ripple, closing select above dialog, native modal support, and bounded refusal
when actual focus remains outside the live calendar. Synthetic unit geometry
is not relabeled as native browser evidence.

Chrome155 stock commands used
`SHF_UI_URL=http://127.0.0.1:4348`,
`SHF_CDP_URL=http://127.0.0.1:9368`:

```powershell
$env:SHF_ATTENDANCE_ONLY='1'
node checks/browser-check.mjs # cold A: review flag absent
$env:SHF_ATTENDANCE_REVIEW_ONLY='1'
node checks/browser-check.mjs # single review
# Stop only own A, verify port free; launch NEW independent B profile.
# Use fresh shell/environment (review flag absent):
$env:SHF_ATTENDANCE_ONLY='1'
node checks/browser-check.mjs # cold B
```

No manual synchronization/runtime patch. No broad old tests, production build,
actual proxy, Oracle/native DB, deployment or WCAG audit rerun in this bounded
harness correction. The prior aggregate results remain prior/caller results;
no new aggregate full unit-suite pass is claimed. Existing Node module-type
warning unchanged. Prior initial-calendar and picker/geometry failures remain
below; there were no failed full attempts in this bounded A/B verification.

## SAME-QA last full retest

Owner: **SAME independent QA through caller**. Recreate a fresh own Chrome
profile and free Angular/CDP helpers, run stock full attendance with only
`SHF_ATTENDANCE_ONLY=1`. Check initial native calendar Escape, actual
document.hasFocus/key delivery/listener evidence, FROM/TO pairs and all original
D01/D02 criteria. Any key ignored **after** readiness must stay FAIL with the
event report; do not add another Escape. Publication stays with caller after
that retest. No new approval or API gate.

Cold-check teardown verified: own A process/profile removed before B startup;
after B, only `attendance-cold-keyboard-ui` and `attendance-cold-keyboard-b`
were stopped.4348/9368 are free; only the own A/B profile directories were
removed. No backend, user or parent-QA process/profile/port was altered.
Ignored synthetic evidence is retained.

---

# Historical narrow select/dialog Escape-stack checker correction

**Status: developer verification PASS; ready for SAME-QA final narrow full-runner
retest.** Caller reports independent closure of D01/D02/H02. The new finding
was a reproducible checker sequence: two native Escapes sent while the minute
select was closing; panel closed, dialog remained, focus `picker-minute`.
An operator's extra Escape after settling closed it with values unchanged.
That historical timeout remains a **nonpassing run**, not a confirmed app bug.

## Exact paths / scope

All writes under `frontend/fixture-slice/`:

- New `checks/picker-overlay.ts`: bounded, contract-specific state observer for
  this minute picker's select-open/select-closed/dialog-closed phases.
- `checks/attendance-browser-check.mjs`: call the observer between the original
  separate native Escape inputs; also wait for the original preparatory hour
  select's dismissal before opening the minute select.
- New `src/picker-overlay.spec.ts`:3 focused checker lifecycle regressions.
- `README.md`, this file.

**No application, CSS/layout, calendar geometry checker, H01 shared input
helper, API/canonical/backend, dependency/manifest, Git, database or agent
change.** Approved §35/36/37 v0.1 and all prior44px/corner/focus criteria remain.

## Root sequence / non-weakened assertions

For each FROM and TO target:

1. Observe the real select panel/dialog IDs, expanded aria and finite scoped
   overlay animations. Infinite decorative animations do not block this check.
2. Send **one native Escape** to the minute select.
3. Require panel absence, `aria-expanded=false`, actual focus exactly on
   `picker-minute` inside the still-open dialog, no active finite select/dialog
   animations and **2 consecutive rAF observations** of that same state.
4. Only after those facts, send **one second native Escape** to the dialog.
5. Require no dialog container, focus on the exact
   `attendance-timeFrom-open` / `attendance-timeTo-open`, and opener
   `aria-expanded=false` (set by the application's afterClosed subscription).
   Assert **both** filter values unchanged.

The observer itself sends no key, does not close/focus any component and has a
**5000ms rejecting deadline**. No arbitrary sleep, retry, Cancel activation,
third Escape, skipped assertion or operator-only patch. The hour-select Escape
earlier in the existing test is a separate preparatory interaction, not an extra
key to force the minute-select/dialog pair to pass.

## Exact checks / bounded final sequence

Working directory: `frontend/fixture-slice`.

| Exact command | Result |
|---|---|
| `npm test -- --include src/picker-overlay.spec.ts` | **3/3 PASS**, synthetic checker lifecycle/animation fixtures |
| `npm run typecheck` | **PASS**, existing strict app TypeScript check; focused build also typechecks imported helper |
| `node checks/browser-check.mjs`, `SHF_ATTENDANCE_ONLY=1` | **stock full attendance PASS**, first successful deliberate check |
| same plus `SHF_ATTENDANCE_REVIEW_ONLY=1` | **stock review-only PASS** |
| same after removing `SHF_ATTENDANCE_REVIEW_ONLY` | **stock full attendance PASS**, exactly one fresh-document repeat |

All three browser invocations were in one exit-code-gated sequence, using own
`SHF_UI_URL=http://127.0.0.1:4348`,
`SHF_CDP_URL=http://127.0.0.1:9368`, isolated Chrome155 and intercepted synthetic
APIs only. Full runner performs fresh `Page.navigate` document entry. There
were **exactly two fully successful full-attendance checks**, not an unbounded
rerun loop. No failed development browser invocation in this follow-up.

Both full passes log, independently for FROM and TO:
`selectFocus=picker-minute`, dismissalStableFrames2, finiteAnimations0,
the matching exact opener and unchangedValues=true. The dialog is explicitly
asserted still open between the first and second Escape, then absent afterwards.
No BODY/ancestor approximation.

All three runs preserve the existing D01 checks and D02's31 normal +31
root/main/calendar30px physical selections. Each D02 variant still reports
minimum45.703125×45.6875px,3 stable geometry frames,0 finite animations at
measurement,0 corner failures,0 offscreen targets and no page overflow.
Thus no44px/corner/focus criterion was lowered to fix the Escape checker.
Browser storage/external request/runtime-exception assertions remain PASS.

Three unit cases cover finite dismissal animation plus exact trigger focus,
dialog removal without afterClosed/opener readiness, and bounded rejection on
wrong focus with no injected key/third Escape. Unit fixtures are not claimed as
native browser behavior; the two full Chrome passes provide that evidence.

## Preserved history / limits / handoff

- The caller's original full-runner Escape timeout is retained above and older
  H02/initial nonpassing records remain below. Extra operator Escape demonstrated
  eventual closure but was **not** used by the final committed runner.
- Prior independent D01/D02/H02 closure is caller-reported; this correction
  does not reopen an app defect or silently relabel the timeout as PASS.
- No broad old suite, production build, proxy, backend/native Oracle or database
  run in this bounded harness-only follow-up. No new aggregate full-suite pass
  or WCAG conformance claim. Existing module-typeless warning unchanged.
- **SAME QA through caller** owns the final narrow stock-full retest. Recreate
  own free Angular/Chrome helpers per README, set only
  `SHF_ATTENDANCE_ONLY=1` (not review-only), run
  `node checks/browser-check.mjs`; observe the two Escape checkpoints for both
  targets, unchanged values/exact openers and all existing D01/D02 assertions.
  No new approval/contract gate.

Teardown verified: only `attendance-escape-ui` / `attendance-escape-chrome`
stopped;4348/9368 free; only `.angular/attendance-escape-profile-19` removed.
No backend/user/parent-QA helper or profile affected; synthetic ignored evidence
retained.

---

# Historical H02 calendar-measurement readiness follow-up

**Status: H02 checker correction implemented and developer-verified; ready for
SAME-QA D02 retest. Publication is still pending independent D02 closure.**
Latest caller retest closed D01/H01 and passed292/strict/build/base/card/items/
review and all four actual fixture-proxy variants. Remaining H02 was reproduced
by QA on the10th opening after9 selections: during Material animation,44px
rects and80 corner failures; after rendering,45.703×45.688px and0 failures.
That is **QA-reported timing evidence**, not a newly confirmed application
layout defect. Historical nonpassing runs below are not erased.

## Exclusive changed files for this follow-up

- New `checks/calendar-geometry.ts`: self-contained scoped animation/stability
  checker, shared verbatim by Chrome evaluation and focused regressions.
- `checks/attendance-review-check.mjs`: invoke the checker on every normal and
  root/main/calendar30px opening; native Enter on the real focused toggle,
  with every day selection still a physical mouse click. The old search
  calendar width comparison also samples settled geometry.
- New `src/calendar-geometry.spec.ts`:6 synthetic checker regression cases.
- `README.md`, this file.

All are under `frontend/fixture-slice/`. **No application TypeScript, templates,
CSS/layout, Material panel class, focus ring, API/backend/canonical, dependency,
manifest, legacy, Git or database changes.** H01's input/readiness helper is
not changed. No agent or unknown/user-port/process operation.
Authority remains approved §35/36 v0.1 + HTML#attendance +§37 v0.1.

## Exact measurable geometry-ready contract

For each calendar opening, including each of31 normal +31 font30 iterations:

1. Resolve only the requested calendar, its `.cdk-overlay-pane` subtree and
   own positioning-ancestor animations, not `document.getAnimations`, network
   idle or unrelated background UI. Require one current `mat-month-view`,
   exactly31 cells, October2026 period, the expected focused current day and
   coherent aria-active IDs on the calendar/root/descendants.
2. Active finite Web Animations must be finished; relevant counts are sampled
   both before and after geometry/style reads. Infinite-timing animations are
   ignored so an unrelated continuous focus ripple cannot stall the checker.
3. Require the same calendar/cell node identities and **exactly identical**
   rect/font/viewport/corner-hit snapshots on **3 consecutive rAF callbacks**.
   No geometric epsilon or reduced acceptance threshold is used.
4. Reject at **5000ms** if animation/context/geometry never becomes ready;
   cancel the rAF/deadline on completion or failure. There is no arbitrary
   sleep, test retry or catch-and-ignore.
5. Return the settled snapshot to the original assertions:31 targets,
   **width≥44 and height≥44**, viewport containment and all four inset-corner
   `elementFromPoint` hits, page overflow absent, physical selection and exact
   opener return. **Stable clipping/undersize is returned promptly and FAILS
   those unchanged assertions**, rather than waiting for a lucky passing frame.

The checker does not alter animations, CSS, selected dates, app state or focus.
The runner opens through native keyboard activation of the real toggle; it
does not call `picker.open()` or inject a DOM click. This makes opener focus
explicit during enlarged-text reflow; all date-target selections remain actual
mouse input.

## Checks actually run in this follow-up

Directory: `frontend/fixture-slice`.

| Exact command | Result / distinction |
|---|---|
| `npm test -- --include src/calendar-geometry.spec.ts` | **6/6 PASS**, final invocation, synthetic rAF/animation fixtures; not real geometry |
| `npm run typecheck` | **PASS**, existing strict `tsc --noEmit -p tsconfig.app.json` |
| `node checks/browser-check.mjs`, `SHF_ATTENDANCE_ONLY=1` | **PASS**, final stock full attendance; actual Chrome + synthetic API interception |
| same, plus `SHF_ATTENDANCE_REVIEW_ONLY=1` | **PASS**, final stock review-only immediately after full attendance |

Both final Chrome commands used
`SHF_UI_URL=http://127.0.0.1:4348`,
`SHF_CDP_URL=http://127.0.0.1:9368`, own Chrome155/profile. No runtime/operator
patch, disabled animations, rewritten assertion or per-failure retry was used.
An initial review-only pass also completed before the final paired run.

**Measured in EACH final command:**

| Signal | Normal | Root/main/calendar30px |
|---|---:|---:|
| geometry-ready opens / physical day clicks |31 /31 |31 /31 |
| minimum target width |45.703125px |45.703125px |
| minimum target height |45.6875px |45.6875px |
| consecutive stable rAF snapshots before assertion |3 |3 |
| active finite animations at measurement |0 |0 |
| peak scoped active finite animations observed while waiting |9 |100 |
| corner failures / offscreen targets |0 /0 |0 /0 |
| root client before/during modal |305 /320px |305 /320px |
| page overflow |none |none |

Thus the final pair exercised **124 physical selections**, including the
previously failing10th opening in both variants on both commands. Existing
old-search calendar assertion296px passes after its own geometry barrier.
D01's unchanged four keyboard lifecycle checks also pass with12.62:1 ring,
same node/focus and one GET. Browser reports no local/session storage,
unexpected external requests or runtime exceptions. Evidence remains synthetic
under ignored `.angular/browser-evidence/`.

Six focused regressions prove finite-animation waiting, changing rects until
three stable frames, infinite-ripple nonblocking, stable clipped/undersize facts
returned for caller failure, finite-animation deadline rejection, and
outgoing/wrong focus/aria/month admission refusal. They use synthetic geometry;
the real45.7px/physical/corner findings above come from Chrome, not jsdom.

## Preserved failures and bounded scope

- QA's review-only/full-attendance failures during opening animation remain
  historical nonpasses; earlier immediate corner measurement was not adequate
  evidence of settled targets. D02 is **not independently closed here**.
- One development full-attendance attempt reached normal31 PASS, then the first
  enlarged-text pointer opener produced no popup. Diagnostic state was
  date19/10/2026, opened=false, disabled=false, zero panes/cells; this was not a
  measured static calendar clipping failure. The committed runner now explicitly
  focuses the real toggle and opens it with native Enter, avoiding dependence
  on a reflowing pointer-down/up opener. No date-selection or geometry assertion
  is skipped. The final stock full+review pair passes.
- Existing Node module-typeless warning remains benign; manifests unchanged.
- **Not rerun by this follow-up:** old292 suite, production build, old browser
  modes or actual fixture-proxy modes, per requested harness-only scope. Their
  latest PASS is the caller's independent QA result, not relabeled as a new run.
  Six new tests were added; no aggregate full-suite298 PASS is claimed.
- No live Oracle, backend/native DB checks, real provider, EMS/batch, deployment
  or WCAG conformance assessment. Backend223/native evidence is unchanged.

## SAME-QA retest handoff

On own free helpers/profile as documented in README:

```powershell
$env:SHF_UI_URL='http://127.0.0.1:4348'
$env:SHF_CDP_URL='http://127.0.0.1:9368'
$env:SHF_ATTENDANCE_ONLY='1'
$env:SHF_ATTENDANCE_REVIEW_ONLY='1'
node checks/browser-check.mjs
Remove-Item Env:SHF_ATTENDANCE_REVIEW_ONLY
node checks/browser-check.mjs
```

Require3 stable frames and0 finite animations before every original≥44×44/
four-corner assertion,31+31 physical selections,0 corner failures, no page
overflow. Repeated10th-open failures must remain failures; a persistent static
clip must not be ignored. **Owner: SAME independent QA through caller.**
No new approval or contract question; publication remains blocked until that
owner closes D02.

H02 teardown verified: only `attendance-h02-ui` and `attendance-h02-chrome`
were stopped;4348/9368 are free and only
`.angular/attendance-h02-profile-19` was removed. No backend helper was started
or stopped in this follow-up. Ignored synthetic evidence is retained; no user
or parent-QA process/profile was touched.

---

# Historical independent-QA corrections UI19-D01/D02

**Status: fixes implemented; developer verification PASS; ready for the SAME
independent QA bounded retest.** This is not independent acceptance/publication.
Authority remains approved **§35/36 v0.1 + HTML#attendance + §37 v0.1**.
Canonical API/identity types, backend, manifests/dependencies and history/range
application code are unchanged. QA supplied two confirmed UI defects and
cleared the earlier range observation as a **runner-readiness problem**, not
a confirmed application range bug. Prior failed runs are preserved below.

## Correction paths (all under frontend/fixture-slice)

- `src/attendance-page.scss`: ID-scoped keyboard ring with sufficient
  specificity over Material; enlarged floating labels constrained to their
  own field with visual ellipsis, full Hebrew accessible names retained.
- `src/attendance-page.html`: existing Material datepicker now uses touch UI
  and public attendance-only panelClass.
- New `src/attendance-calendar.scss`; `src/styles.scss` adds only its `@use`.
  CDK portal is outside the component host, so overlay rules must be global
  **but every override is scoped to shf-attendance-calendar**. Root scrollbar
  override is active only while that modal exists. Surface/content overflow,
  divider decoration and Material close-button placement do not cover targets.
  Current/search/schedule calendars are not resized or replaced.
- `src/attendance-page.spec.ts`: two new scoped-style/Material-config cases.
- New `src/browser-readiness.spec.ts`: four shared-driver regression cases.
- New `checks/browser-interactions.ts`: effective readiness expression and
  trusted native input/blur with Angular acceptance and render checkpoint.
- New `checks/attendance-review-check.mjs`: bounded physical D01/D02 retest,
  also included by the full stock attendance runner.
- `checks/attendance-browser-check.mjs`, `checks/browser-check.mjs`,
  `checks/employee-card-browser-check.mjs`, `checks/items-browser-check.mjs`:
  consume shared effective readiness/native input; original assertions retained.
- `checks/fixture-proxy-check.mjs`, `checks/employee-card-proxy-check.mjs`:
  shared physical entry, new-document barriers, scoped form readiness and
  authoritative current query/applied-response assertions.
- `README.md`, this file.

No Git, backend/shared/canonical/legacy/root/.github writes, installs/upgrades,
live Oracle or unknown/user process termination. The stable backend223/native
PASS remains **caller-reported and unchanged**, not rerun or relabeled UI-live.

## Confirmed defects: actual measured correction

### UI19-D01 — keyboard focus ring

At1440×900 and320×844, physical Tab reaches the exact reload button, then
Space→pending→200 or503. Four lifecycle cases PASS:

- `:focus-visible=true`, `document.activeElement===savedButton`, same DOM node;
- solid **3px** outline, **3px** offset, RGB(0,47,101) on #fafafa:
  **12.617858:1** for initial, pending and terminal states;
- opacity1, center hit-test exposed, ring bounds clear of header and viewport;
- repeat Space during pending leaves request delta **exactly1**, not a duplicate;
- no BODY/ancestor-contains approximation.

The generic global focus rule was outranked by Material's button reset.
The fix is component-scoped, with no blind `!important`, and retains the
existing mounted/aria-disabled reload lifecycle.

Evidence: ignored synthetic
`.angular/browser-evidence/attendance19-D01-{1440,320}-{200,503}-SYNTHETIC.png`.

### UI19-D02 — real calendar click targets

At320×844, normal text and forced **30px root/main/calendar-day text**:

| Measurement | Both variants |
|---|---|
| root client width before/during modal | 305 /320px |
| actual Material calendar width | 320px |
| minimum button width /height | **45.703125 /45.6875px** |
| physical date selections | **1–31 each**, 62 total |
| offscreen/covered/clipped day targets | **0** |
| page-wide overflow | **none** |
| return focus after each date | exact datepicker toggle |

Every day target is checked at all four inset corners with `elementFromPoint`,
not only its bounding box/text span, and is physically clicked. This caught
an intermediate scrollport issue: Material's padded divider and hidden
off-surface close button could create scrollbars despite nominal45px rects.
The final scoped surface/content rules remove that coverage, retain a scrollable
viewport-bound content area and keep the close button reachable when focused.
An exploratory root30px pass also exposed floating-label overflow after close;
the component's field-local container sizing corrected it without changing
the complete accessible label or approved copy.

Existing search calendar is explicitly measured at **296px**, with no attendance
panel class. Old current/search/schedule picker regressions pass. This is the
approved≥44px design criterion, **not a claim that the former40px violated
WCAG2.5.8's24px baseline**, and not full WCAG conformance.

Evidence: ignored synthetic
`.angular/browser-evidence/attendance19-D02-grid-320-{normal,30px}-SYNTHETIC.png`.
The final30px screenshot was visually inspected: no scrollbar overlays the
first/last columns; all31 dates are visible.

## Runner root correction / synchronization proof

1. `input.disabled` does not account for a disabled ancestor fieldset; mounted
   initial controls and absence of a progress bar are not context completion.
   Shared `formReadyExpression` requires the scoped live form/input/submit,
   effective native `:disabled=false`, nonempty/expected API fixture defaults
   and no pending progress. Original server-date and09:00 assertions remain.
2. The driver now uses CDP Ctrl+A, native `Input.insertText` and physical Tab
   blur, not `.value=` plus injected input/change events. It checks the accepted
   value and Angular touched/dirty state (an unchanged logical Material date
   legitimately stays pristine).
3. Acceptance/class changes precede Angular's scheduled DOM render. A shared
   two-animation-frame **render checkpoint**, not a fixed sleep or retry, waits
   for e.g. stale table removal. An intermediate stock schedule assertion caught
   the missing render barrier; the original assertion was preserved.
4. Proxy base navigation crosses a new-document marker/path/query barrier,
   so a previous route's ready DOM cannot satisfy a subsequent navigation.
5. Four regression cases import the **same committed predicate**, including
   actual Angular delayed identity→delayed context admission on attendance and
   search, inherited-fieldset disabling, and expected-default/progress gating.
   Browser geometry is not inferred from jsdom's visibility stub.
6. Actual card proxy verifies the outgoing current GET really has
   `attendanceDate=2026-10-15&currentTime=23:59`, gets200, and the accepted UI
   applied echo is23:59 before awaiting the own-ID card link. Its complete stock
   runner passes with **9 successful card responses** on the final chain.

No application history/range change was used to “fix” the old10:00/09:00
observation. Independent QA's physical64-checkpoint/two-actor result remains
its evidence; stock runners now also pass without operator-only synchronization.
The historical proxy timeout is not erased or called a business-source defect:
the producer's effective route/source/query is now asserted directly.

## Final exact checks / distinctions

Working directory `frontend/fixture-slice`; Node24.21.0/npm11.19.0 and the
previously approved Angular21.2.25/Material-CDK21.2.14/TS5.9.3 unchanged:

| Command | Final result |
|---|---|
| `npm test -- --include src/attendance-page.spec.ts` | **21/21 PASS**, including2 new UI cases |
| `npm test -- --include src/attendance-page.spec.ts --include src/browser-readiness.spec.ts` | **25/25 PASS**, focused correction checkpoint |
| `npm test -- --include src/attendance*.spec.ts --include src/browser-readiness.spec.ts` | **43/43 PASS**,4 files:39 attendance +4 driver-readiness |
| `npm test` | **292/292 PASS**,20 files:286 original checkpoint +6 new cases |
| `npm run typecheck` | **PASS**, existing strict `tsc --noEmit -p tsconfig.app.json` |
| `npm run build` | **PASS**, production budgets; initial555.68kB, attendance lazy53.95kB |

Browser environment for every invocation:
`SHF_UI_URL=http://127.0.0.1:4348`,
`SHF_CDP_URL=http://127.0.0.1:9368`, own Chrome155 isolated profile.
All candidate ports were checked free before starting owned helpers. Backend
helper uses only constructed synthetic environment and merged frontend fixtures:
`SHF_UI_ATTENDANCE_FIXTURE=1`, `SHF_UI_ITEMS_FIXTURE=1`,
`SHF_UI_EMPLOYEE_CARD_FIXTURE=1`, `SHF_FIXTURE_PORT=4358`,
`node checks/serve-synthetic.mjs`; Angular helper:
`npm exec ng serve -- --host 127.0.0.1 --port 4348 --proxy-config proxy.attendance.conf.json`.

**One stock intercepted chain, without manual synchronization, all PASS:**

| Exact command | Per-invocation environment |
|---|---|
| `node checks/browser-check.mjs` | `SHF_ATTENDANCE_ONLY=1`, includes D01/D02 |
| same | no `*_ONLY` flags: base current/search/schedule/detail |
| same | `SHF_CARD_ONLY=1` |
| same | `SHF_ITEMS_ONLY=1` |
| same | `SHF_ITEMS_ONLY=1`, `SHF_ITEMS_REVIEW_ONLY=1` |

Flags are cleared between variants; commands were gated on the preceding
exit code. No original date/range/count/keyboard assertion was skipped or
weakened. No operator-only patched runner was used.

**One actual Angular→proxy→Node fixture chain, NO interception, all PASS:**
`node checks/fixture-proxy-check.mjs` with, sequentially,
`SHF_ATTENDANCE_ONLY=1`, no `*_ONLY` flags, `SHF_CARD_ONLY=1`,
`SHF_ITEMS_ONLY=1`. Card had9 and items18 successful browser resource responses.
No Oracle, real-provider login, credential verification, production, EMS/batch
or broad accessibility-conformance check was performed.

## Preserved nonpassing attempts in this correction

- Two focused invocations hit the existing Windows Vitest worker-start timeout,
  collected **zero tests** and hung. Only owned test sessions were stopped;
  the identical final commands passed. No tooling/dependency workaround.
- Initial new unit assertions incorrectly assumed jsdom keyboard modality and
  a string panelClass. Corrected to a scoped CSS-rule assertion plus actual
  Material's normalized array; real keyboard/contrast remains a Chrome check.
- Initial enlarged-root pass exposed Material floating-label overflow and
  initial rect-only calendar sizing hid scrollbar coverage. Fixed scoped label
  containment, divider/close-button/scrollport sizing; strengthened corner
  hit-tests. Final root30px and all31 physical targets pass.
- First native-input helper required dirty even for unchanged dates; actual
  accepted15/10 value was correctly pristine/touched. It now handles unchanged
  semantics without dropping value/touched checks.
- A stock base schedule run caught table DOM before Angular's render had
  cleared it. Added the rendering checkpoint in the shared helper, not a
  sleep, per-case bypass or weaker “no table” assertion. Final full chain PASS.
- Earlier QA-supplied attendance/card/card-proxy readiness failures and the
  initial implementation's nonpassing history are retained below. Their
  original assertions now pass on the committed stock runner.

## SAME-QA bounded retest handoff

Recreate own helpers/profile only on genuinely free ports as above, then:

```powershell
$env:SHF_UI_URL='http://127.0.0.1:4348'
$env:SHF_CDP_URL='http://127.0.0.1:9368'
$env:SHF_ATTENDANCE_ONLY='1'
$env:SHF_ATTENDANCE_REVIEW_ONLY='1'
node checks/browser-check.mjs
```

This committed bounded command uses the same D01/D02 checks included in the
full stock attendance runner:1440/320 × pending/200/503, native Tab/Space,
same node, one GET, visible unobscured≥3:1 ring;320px normal/root30px all31
real day targets≥44×44, full corner exposure, physical selections, no page
overflow and exact opener. Clear `SHF_ATTENDANCE_REVIEW_ONLY` for the complete
attendance runner; clear other flags between base/card/items/proxy cases.
**Owner: the same independent QA through caller.** No contract ambiguity,
backend dependency or new approval gate remains. Final publication stays with
caller after that retest, not implied by this developer report.

Correction teardown verified: only owned `attendance-qa-ui`,
`attendance-qa-backend`, `attendance-qa-chrome` were stopped; listener checks
confirmed4348/4358/9368 free. Removed only
`.angular/attendance-qa-profile-19`, retained ignored synthetic screenshots.
No unknown/user/parent-QA helper or Oracle process was terminated.

---

# Historical SHF-ATTENDANCE-UI-19 implementation verification — 19 October 2026

**Status: frontend implementation done, ready for independent review.**
Authority: §35/36 **v0.1**, existing HTML `#attendance`, user approval13:46,
§37 **v0.1**, canonical `backend/fixture-slice/attendance-contracts.mts`;
exact seven-capability identity delta only. No unresolved contract question.
Historical records below are retained, not rewritten as current test results.

## Ownership / review paths

All task writes are under `frontend/fixture-slice/`, using targeted patches:

- New `src/attendance-contract.ts`, `src/attendance-fixtures.ts`,
  `src/attendance-page.{ts,html,scss}`,
  `src/attendance-{page,contract,generation}.spec.ts`.
- Integrated `src/api.ts`, `src/routes.ts`, `src/contract.ts`,
  `src/test-fixtures.ts`, `src/contract.spec.ts`,
  `src/employee-card-page.spec.ts` (remove the named employee right, not the
  formerly last capability).
- Navigation/history: `src/list-navigation.ts`, `src/view-history.ts`,
  `src/workspace-shell.{ts,html}`, `src/my-shifts-page.{ts,html}`,
  `src/shift-day-page.{ts,html}`, `src/shift-items-page.ts`,
  `src/employee-card-page.ts`. Existing services are extended, not replaced.
  History drafts returned to components are cloned, including Date/array data;
  attendance has an explicit missing-opener results fallback.
- New `fixtures/attendance.synthetic.json`, `proxy.attendance.conf.json`,
  `checks/attendance-browser-check.mjs`, `checks/attendance-proxy-check.mjs`.
- Updated `checks/serve-synthetic.mjs`, `checks/browser-check.mjs`,
  `checks/fixture-proxy-check.mjs`, `checks/items-browser-check.mjs`,
  this file and `README.md`.

No Git operations; no backend/canonical/design/root/.github/legacy edits,
dependency installation/upgrades, Oracle connection, EMS or batch execution.
Unrelated working-tree changes were not reset or replaced. Ports4349/4319/
4328/4320 and all unknown/user listeners were not stopped.

## Evidence and framework

- Approved reverse-engineering baseline §§35/36/37; source-contract catalog
  confirmed absent. Direct read-only evidence includes
  `old/SHF/src/bzq/shf/model/AttendanceDataModel.java:430–465`
  (left attendance join and planned-start OR SPLIT_END predicate) and
  `old/SHFWeb/WebContent/jsp/attendance_table.jsp:175–225`
  (source rendering/independent recorded fields, deferred legacy actions).
  Broader source traces are documented in §35, not claimed as new runtime proof.
- Canonical type-only attendance module and reused current/search/catalog types.
  Exact shape/error/source rules are guarded against unknown JSON. J01 team and
  G01 parent cannot share an exact code; wrong/missing/duplicate hierarchy fails.
  No search-membership or employee-card self-only policy is copied into inquiry.
- Existing Angular21.2.25, Material/CDK21.2.14, CLI/build21.2.27, TS5.9.3,
  Node24.21.0, npm11.19.0 reused; manifest/lockfile unchanged. Existing project
  compatibility evidence and installed runtime were inspected; no new dependency
  selection or fresh external compatibility certification is claimed.
- Actual stable backend `server.mts:65–96`, README attendance section881+ and
  `attendance-sample.mts` were read. Parent later reported stable `ec056…`,
  **223/223 backend + strict + Native Oracle TEST PASS**. Those backend/native
  results are **caller-reported**, not frontend checks executed here.
  Own fixture backend was restarted from the stable files for final proxy runs.

## Commands / measured results

Commands run with working directory `frontend/fixture-slice`:

| Exact command | Result / distinction |
|---|---|
| `node --version`; `npm --version` | **24.21.0 / 11.19.0**, installed runtime |
| `npm test -- --include src/attendance-page.spec.ts` | First coherent test build succeeded; worker-start failure described below. Repaired dialog-close timing assertion, then **12/12 PASS** at that checkpoint. |
| `npm test -- --include src/attendance*.spec.ts` | Final **37/37 PASS**, 3 files:19 page/boundary cases,14 dedicated guard cases,4 deliberately uncooperative-transport generation cases. Synthetic HTTP/jsdom, not browser/Oracle. |
| `npm test` | Final **286/286 PASS**, **19 files** (249 previous +37 attendance). Existing jsdom `window.scrollTo` diagnostic remains; real scroll/focus is checked in Chrome, not inferred from jsdom. |
| `npm run typecheck` | **PASS**, `tsc --noEmit -p tsconfig.app.json`, existing strict config |
| `npm run build` | **PASS**, production build/budgets; initial554.67kB, attendance lazy53.52kB at final application-code build |
| `npm exec ng serve -- --host 127.0.0.1 --port 4348 --proxy-config proxy.attendance.conf.json` | Owned Angular helper, readiness confirmed |
| `node checks/serve-synthetic.mjs` with `SHF_UI_ATTENDANCE_FIXTURE=1`, `SHF_UI_ITEMS_FIXTURE=1`, `SHF_UI_EMPLOYEE_CARD_FIXTURE=1`, `SHF_FIXTURE_PORT=4358` | Owned **isolated-fixture** Node helper, exact seven-cap identity and attendance GET200 verified; fresh stable-backend restart also used |

All browser commands below use **`SHF_UI_URL=http://127.0.0.1:4348`** and
**`SHF_CDP_URL=http://127.0.0.1:9368`**, own isolated
Chrome **155.0.8059.84**, verified-free ports and
`.angular/attendance-profile-19`. `*_ONLY` flags are per invocation:

| Command / additional environment | Result |
|---|---|
| `node checks/browser-check.mjs`; `SHF_ATTENDANCE_ONLY=1` | **PASS**, actual Angular/Material/Chrome, exclusively intercepted synthetic JSON |
| same command, no `*_ONLY` flags | **PASS**, old current/search/detail/schedule browser regressions |
| same command; `SHF_CARD_ONLY=1` | **PASS on isolated rerun**, with one intermittent chained-run failure retained below |
| same command; `SHF_ITEMS_ONLY=1` | **PASS**, old full items browser regressions after exact five-link navigation expectation update |
| same command; `SHF_ITEMS_ONLY=1`, `SHF_ITEMS_REVIEW_ONLY=1` | **PASS**, D01/D02/D03/D04 focused items review, real DOM/keyboard/outline geometry |
| `node checks/fixture-proxy-check.mjs`; `SHF_ATTENDANCE_ONLY=1` | **PASS**, actual Angular → proxy → Node attendance read port, **NO interception**, synthetic fixtures only |
| same command, no `*_ONLY` flags | **PASS**, old current/search/schedule/detail actual proxy regressions after isolating the original schedule fixture interval |
| same command; `SHF_CARD_ONLY=1` | **PASS**, old card actual proxy regressions |
| same command; `SHF_ITEMS_ONLY=1` | **PASS**, old items actual proxy regressions |

## New behavior actually exercised

- Exact GET/query/no-body/no-store API client behavior and independent rights;
  malformed/absent identity and six-right synthetic identity have no fallback or
  reader calls. Real attendance-only double can inquire but has no other
  resource links; Administrator role without attendance right cannot inquire.
- Context-only initial entry and API-supplied clock/defaults; strict Gregorian
  leap input/0001/9999, invalid retained DD/MM/YYYY, en-US with UTC-/UTC+ zones.
  Actual Material calendar Escape and exact opener; both actual Material minute
  dialogs expose24 hours/60 minutes and Apply00:00/23:59/08:07 independently.
  Equality succeeds, inversion focuses associated TO error, no rollover/NOW.
- Planned/split-only/null-start/no-attendance rows; full local seconds and
  next-day actual values; independent stage-only/station-only/exit-only fields,
  negative/0/NULL reason, nullable briefing. Plaintext names/catalog injection
  strings remain text with no img/script/iframe DOM. Exact leading-zero codes,
  unresolved labels, duplicate activity order and unknown location survive.
- Atomic rejection of malformed second row, missing own day, wrong parent kind,
  same-code J01/G01, duplicate catalogs, source/zone/applied/date/order/page
  mismatch, private extra fields and wrong resource problem/status. No cached
  success/partial rows/false inferred403 or attendance-only invented day.
- Page cases include optional-list comma serialization, dirty
  cancellation, immutable applied paging25+5/lookahead, reload offset0 and
  stable actual reload node/focus for400/401/403/500/503. Chrome confirms
  one GET on repeated Space during hold and focus through pending/success/error.
  Generation doubles intentionally deliver callbacks after ineffective abort:
  old success/error/403 cannot change result, permission, announcement or focus.
- Own employee/day links; Attendance→schedule→detail→items→card and exact
  reverse chain; browser Back/Forward; **two employee IDs with independent
  schedule ranges and two attendance entries**. Exact opener, page, RTL and
  vertical scroll restored. Removed opener gives results heading + Hebrew
  changed-results announcement. Existing current/search memories remain intact.
- Actual fixture proxy: merged30 attendance rows,25+5, planned-only/no-attendance,
  split-only08:00 selected by10:00 restart, independent next-day actuals/raw0,
  empty10:01, genuine malformed-query400, privacy projection, no-store/nosniff,
  nested source-preserving schedule/detail/items/card return. No backend edits.
- 1440/390/320, long40-character names and128-character activity codes,
  real30px main text, no page-wide overflow, contained table scroll and
  reachable Material calendar. Hebrew names/error associations and keyboard
  Escape/focus were exercised. Existing regression samples measure dark3px
  focus ring contrast12.62:1 against #fafafa and text/button pairs separately;
  those are limited measurements, **not complete WCAG conformance**.
- Synthetic screenshots only under ignored `.angular/browser-evidence/`;
  desktop/narrow/30px examples inspected. Browser harnesses assert no app
  local/session storage, unexpected external assets/API, or runtime exceptions.

## Nonpassing attempts / risks / not run

1. Two attendance-focused invocations hit the pre-existing five-second Windows
   Vitest worker-start timeout, collected **zero tests** and hung. Only those
   owned sessions were stopped; unchanged subsequent runs passed. The timeout
   runs are not counted as passing.
2. First minute-dialog test asserted before `afterClosed`; fixed test to await
   closure. First full suite found the old employee-card test's positional
   `.pop()` no longer removed employee:read; fixed it to remove that exact
   named right. Neither fix weakens the runtime capability allowlist.
3. Old full items browser expected four sidebar links; now checks the exact
   approved five paths, including attendance. Old proxy schedule15–28October
   also included the newly merged19October days; restricted that original
   30-row scenario explicitly to15–16October. Both reruns passed; assertions
   were not weakened into arbitrary counts.
4. One old card browser run chained after the base suite returned FROM10:00
   where its nested history assertion expected09:00. An isolated unchanged
   full card rerun passed (as did earlier card runs and actual proxy suite).
   Root cause is **not established**; retain as intermittent harness/history
   risk for independent **QA/frontend** recheck rather than assert a repair.
5. Node emits `MODULE_TYPELESS_PACKAGE_JSON` when the browser harness imports
   frontend TS fixtures through Node24's existing type stripping. Benign tooling
   warning, not a browser runtime error; no manifest/dependency change made.
6. **Not run here:** actual Oracle UI/browser, Oracle native checks, real
   identity-provider login, production deployment, EMS/batch, independent
   screen-reader/assistive-technology audit or full WCAG2.2AA assessment.
   Oracle/native evidence belongs to backend owner + later final executor.
   No contract ambiguity or blocked frontend prerequisite remains.

Next action: caller reviews these frontend paths and independent QA repeats
the intermittent old-card chain. Release/final integrated acceptance stays
with caller; backend Native Oracle PASS is not relabeled UI-live PASS.

## Helper teardown

Final stable-backend proxy closure passed attendance, base current/search/
schedule/detail, card and items variants without interception. Afterwards only
owned sessions `attendance-ui`, `attendance-backend-stable` and
`attendance-chrome` were stopped (the earlier owned backend had been stopped
before its stable restart). Listener checks confirmed **4348/4358/9368 released**.
Only the owned `.angular/attendance-profile-19` was recursively removed;
ignored synthetic screenshots were retained. No unknown/user process or parent
QA helper was killed. Final verification rerun after the last test assertions:
**37/37 focused, 286/286 full, typecheck/build PASS**.

---

# SHF-EMPLOYEE-UI-19 — 19 October 2026

**Status: frontend implementation done; ready for caller/independent review.**
Developer verification only, not release approval or independent acceptance.
Controlling approved contracts: §32/33 **v0.1**, existing `#employee-card`
visual, §34 **v0.1**, canonical
`backend/fixture-slice/employee-card-contracts.mts` and additive
`CapabilityV1`/exact six-capability synthetic identity. The caller's explicit
route is `/employees/:employeeId/operational-card`; no API shape changes.
There are no outstanding contract questions or frontend implementation blockers.

## Changed paths and ownership

All writes are under `frontend/fixture-slice/`:

- New: `src/employee-card-contract.ts`, `src/employee-card-fixtures.ts`,
  `src/employee-card-page.{ts,html,scss}`, `src/employee-name.ts`,
  `src/employee-card-{contract,page,generation}.spec.ts`.
- Integration: `src/api.ts`, `src/routes.ts`, `src/contract.ts`,
  `src/test-fixtures.ts`, `src/view-history.ts`,
  `src/workspace-shell.{ts,html,scss}` and five existing
  `src/{current-shifts,shift-search,my-shifts,shift-day,shift-items}-page.{ts,html}`.
- Existing tests aligned without dropping tests:
  `src/contract.spec.ts`, `src/shift-items-{contract,navigation,page}.spec.ts`.
  Missing-right tests use a valid real-provider **test double** rather than
  accepting a malformed partial synthetic Administrator.
- New harness/data: `checks/employee-card-{browser,proxy}-check.mjs`,
  `fixtures/employee-card.synthetic.json`, `proxy.employee-card.conf.json`.
  Updated existing `checks/{browser-check,fixture-proxy-check,serve-synthetic,
  items-browser-check}.mjs`, `README.md`, this document.

No Git commands, dependency installation, legacy execution/build, database,
broker, batch, live user application or agent delegation. Existing caller-owned
dirty changes were not reset/replaced; patches touch only related frontend
ranges. No Git/diff-based certification of the reported 23 dirty paths is made.
Backend changes/readiness belong to the concurrent backend owner, not this UI task.

## Source and static evidence

Read instructions/brief/ui-developer skill; baseline §§32/33/34, canonical
type-only card contract and existing approved HTML `#employee-card:475–510`.
Source catalog is unavailable. Controlling read-only legacy evidence:
`EmployeeTag.java:28–38` links the internal employee ID, not day/personal
reference; `EmployeeDataAction.java:46–94` selects employee/self branches;
`EmployeeDataModel.java:735–763` binds EMPLOYEE_ID in `populate`.
Its broad `t.*`, manager join and logs are deliberately not copied.
`ComplexCodeTable.java:31–34,53–57,68–75` establishes inner jobs, active grouped
job labels and org labels. UI does not reimplement those backend lookup rules.
The new unknown guard rejects required malformed fields and negative job labels
inconsistent with the approved positive-only job source. Extra source fields
are discarded by a recursive explicit projection, not hidden in the DOM.

## Exact commands and fresh results

All npm/Node commands below run from `D:\AIProjects\SHFAI\frontend\fixture-slice`.
Installed runtime observed: Node24.21.0/npm11.19.0; unchanged approved
Angular21.2.25/Material-CDK21.2.14/TS5.9.3/CLI-build21.2.27.

| Command | Actual result / distinction |
|---|---|
| `npm test -- --include src/employee-card-contract.spec.ts --include src/employee-card-page.spec.ts` | Final **48/48 PASS**, two files (30 guard +18 component); initial45/45 before the last three plain-label/sentinel cases; Angular + synthetic HTTP/jsdom |
| `npm test -- --include src/employee-card-generation.spec.ts` | **5/5 PASS**; intentionally ineffective unsubscribe, late success/error/403, identity revocation, scope epoch and destruction |
| `npm test` (final, 19 Oct 09:16 local) | **249/249 PASS**, **16 files** = existing196 + new53; no failed/unhandled tests |
| `npm run typecheck` | **PASS**, strict app tsc/noEmit, canonical types imported only as types |
| `npm run build` | **PASS**, final initial551.47kB / estimated127.83kB; all budgets pass; production output ignored |
| `SHF_CARD_ONLY=1` + `node checks/browser-check.mjs` | **PASS**, actual Chrome155.0.8059.84 + Angular, intercepted synthetic HTTP only; final complete matrix passed twice after final history changes |
| `SHF_ITEMS_ONLY=1` + `node checks/browser-check.mjs` | **PASS**, previous items four origins/nested return/page25/RTL scroll/dirty drafts/25+5/empty/reload/error/keyboard regressions |
| `node checks/browser-check.mjs` (no scenario flag) | **PASS**, previous current/detail/search/schedule calendars/minute pickers, all errors, 25+5, exact focus and nested histories at1440/390/320 |
| `SHF_CARD_ONLY=1` + `node checks/fixture-proxy-check.mjs` | **PASS**, actual Angular→own proxy→Node fixture; **9 browser card200 responses**, five origins/nested exact-focus returns, 1440/390/320, null/unknown, genuine400/404, no-store/nosniff and serialized key allowlist |
| `SHF_ITEMS_ONLY=1` + `node checks/fixture-proxy-check.mjs` | **PASS**, actual Node fixture, **18 browser item200 responses**, four origins and 25+5/previous/reload/detail excursion at1440/390/320, genuine400/404 |
| `node checks/fixture-proxy-check.mjs` (no scenario flag) | **PASS**, actual Node fixture current/detail1440/390; search/schedule1440/390/320, 25+5, equality/empty, Back/Forward and independent exact filters/page/scroll/opener |

The scenario flags in the table are environment variables, not shell syntax.
Exact browser invocation template used (set one flag, or neither for old flows):

```powershell
$env:SHF_UI_URL='http://127.0.0.1:4348'
$env:SHF_CDP_URL='http://127.0.0.1:9368'
$env:SHF_CARD_ONLY='1' # Or SHF_ITEMS_ONLY='1'; independent fresh shell per run.
node checks/browser-check.mjs
# In a fresh shell with the same URL/CDP/one scenario flag:
node checks/fixture-proxy-check.mjs
```

Owned services were started with:

```powershell
$env:SHF_FIXTURE_PORT='4358'
$env:SHF_UI_ITEMS_FIXTURE='1'
$env:SHF_UI_EMPLOYEE_CARD_FIXTURE='1'
node checks/serve-synthetic.mjs
# Separate owned shell:
node node_modules/@angular/cli/bin/ng.js serve --host 127.0.0.1 --port 4348 --proxy-config proxy.employee-card.conf.json
```

Own Chrome only:
`C:\Program Files\Google\Chrome\Application\chrome.exe --headless=new --disable-gpu --no-first-run --no-default-browser-check --disable-background-networking --remote-debugging-port=9368 --user-data-dir=D:/AIProjects/SHFAI/frontend/fixture-slice/.angular/card19-chrome about:blank`.
Ports4348/4358/9368 were checked free before startup; no user port4319/4328/4320
operations. Services/profile closed at completion; evidence PNGs remain ignored.

## Actual card browser coverage and limits

- Five actual name origins and all nested reverse returns, exact own employee
  IDs rather than day IDs; source filters, page25/evaluated minute, physical RTL
  table scroll, vertical scroll, disclosures and exact DOM anchor focus.
  Browser Back/Forward consumes entries without a duplicate card/origin cycle.
- Six-field semantic definition list, collapsed internal identifier, name auto
  direction/LTR codes, no date/time controls, related requests, private/hidden
  sentinel fields, images, HR tabs or command controls. Synthetic actor and source
  indication remain distinct from selected employee, including on scroll.
- Both approved source pairs and source mismatch; null internal job versus
  unresolved negative job; malformed signed zero, wrong resource, self-parent,
  unauthorized team and error400/401/403/404/500/503 all clear the whole card.
  No-card capability denies without card GET while current view still works.
- Identity failure immediately removes prior card; A→B cancellation keeps only
  B. Chrome can truly abort A before late fulfillment, so the **ineffective-abort
  callback proof is the five Angular generation tests**, not a native-abort claim.
- Actual keyboard Space on stable reload generates **one** pending GET despite
  repeated Space and preserves the same element/focus on200/503. Previous
  drawer Tab/Escape, calendars and minute pickers regressions also passed.
- Long40-code-point names,256-character labels,38-digit IDs/codes, widths
  1440×900/390/320 and30px main text wrap without page overflow. Main fields
  above fold1440; one-column mobile. Back/reload targets measured>=48px;
  name links have48px minimum dimensions. Sampled card `dt`/white contrast
  **6.12:1**; previous sampled color pairs also pass their limited thresholds.
- Screenshots: ignored `.angular/browser-evidence/card19-{1440,null-unknown,
  long-1440,long-390,long-320,large-1440,large-390,large-320,proxy-1440,
  proxy-390,proxy-320,proxy-unknown}.png`; desktop and mobile images visually
  inspected. All values are invented synthetic fixtures, not captured data.
- Runtime checks reported no external asset/API requests, business local/session
  storage or JS exceptions. No automatic polling/retry or app fallback source.

## Failed/initial attempts retained for audit

1. First focused test build succeeded but Vitest's existing one-thread runner
   timed out at startup, executed **zero tests**, then hung. Stopped only that
   owned tool session. Same command/config rerun passed45/45; no installation,
   pool changes or skipped test workaround. Later two guard-only attempts
   (`npm test -- --include src/employee-card-contract.spec.ts`) also timed out
   starting the worker with zero executed tests; the hung owned session was
   stopped, the second attempt exited1. No passing result is claimed for those
   commands. Final full249/249 and combined focused48/48 runs passed with the
   same runner/dependencies. Its installed startup ceiling is5s; no dependency
   or test-configuration patch was made to hide the environment startup issue.
2. First `npx ng serve ... --port4348` produced no listener/output. Stopped only
   that owned session and used the installed CLI via `node .../ng.js`; readiness
   then confirmed. No successful browser result is attributed to that attempt.
3. Initial card CDP late-A release failed with **Invalid InterceptionId** because
   Chrome had canceled A. Harness now permits only that precise canceled-ID
   transport outcome; every other CDP failure still fails. Application guards
   were not weakened; late callbacks are separately forced in unit tests.
4. Existing items harness first expected three sidebar links after items denial;
   the approved card adds a fourth independent link. Updated to assert four
   **and** the actual card label/href. Next run caught the prior two-key
   history assertion after allowlisted route-origin preservation was added.
   History now explicitly preserves only opaque token/navigation ID + approved
   origin label, verifies restored token/path, and the assertion checks that
   allowlist. Final complete items run passed, no test removed.
5. One card rerun during the edit/rebuild period saw search09:00 restored as
  10:00 and failed. It was not counted as PASS or silently relaxed. No stable
   reproduction established; the next two complete stable card runs passed the
   unchanged09:00 assertion and final actual proxy passed exact10:00 origin
   restoration. Treat any recurrence as a frontend/harness investigation, not a
   backend contract question.
6. Existing jsdom `Window.scrollTo` not-implemented diagnostics remain. Real
   vertical/horizontal scroll assertions are Chrome checks, not jsdom evidence.

## Not run / owners / next action

- **No Oracle/native/real-provider/production check in this frontend task.**
  Backend offline187/187/typecheck readiness was reported by caller, not rerun
  or relabeled native here. Live TEST/native verification, provider deployment
  and infrastructure safety belong to backend/platform/database owner + caller.
- No screen-reader/assistive-technology session, exhaustive accessibility tree,
  all color/state contrast audit, actual browser400% zoom or full WCAG2.2AA
  certification. Limited keyboard/reflow/contrast evidence is not conformance.
  Independent UI/QA owns remaining acceptance review.
- No source catalog exists in this checkout; controlling legacy anchors and
  approved baseline were used instead. No legacy execution or Hebrew-literal
  recovery claims.
- No frontend blocker or genuine shared-contract question remains. Caller may
  review this frontend and rerun the documented synthetic checks independently;
  release/publication remains caller/user approval, not implied by these results.

---

# SHF-ITEMS-UI-18 verification — 2026-10-18 (historical)

## Independent QA D01–D04 correction — 18 October, 15:07 handoff

**Status: fixed; ready for the SAME independent QA's bounded retest before
publication.** This is developer verification, not independent acceptance.
Approved §29/30 v0.1 / §31 / `#shift-items` unchanged. The original QA findings
and all earlier implementation/check history below remain valid historical
records; the previous193 passing tests did not cover these four findings.

### Exact paths changed in this correction only

- `src/shift-items-page.html`
- `src/shift-items-page.scss`
- `src/shift-items-contract.ts`
- `src/shift-items-page.spec.ts`
- `src/shift-items-contract.spec.ts`
- `checks/browser-check.mjs`
- `checks/items-review-check.mjs` (new narrow Chrome regression runner)
- `VERIFICATION.md`

No `src/styles.scss`/shared shell/upstream style, API shape, canonical/backend,
manifest/dependency, Git, DB, legacy execution or delegation change/action.
Backend `shift-items-validation.mts:51` was read only: the existing rule already
requires different unit/parent codes. No new wire fields or business rules.

### Fixes and actual measured retests

| Finding | Fix and final actual Chrome155 measurements |
|---|---|
| **D01**,38-digit duration wraps | Dedicated named, keyboard-focusable LTR `.duration-value` scroll region: `max-width:100%`, `overflow-x:auto`, `white-space:nowrap`; no truncation/coercion. Mobile cards use block table layout so intrinsic nowrap width cannot expand behind their clipping container. Exact38-nines DOM Range has **1 line at1440/390/320**. Scrollport/client widths **118/291/221px**, full text/scroll width **307px**. Scrolling exposes the final digit; token fits its cell and the cell fits its table region. All8 fields retained on every row, no page overflow; raw JSON remains `pre-wrap`. |
| **D02**,44px toolbar targets | Items toolbar min-height precisely **48px**, not a global control override. Both back/reload measure **48/48px** on1440/390/320. At30px text, back/reload are **48/48**, **137/48**, **182/48px** respectively; wrapping without page overflow. |
| **D03**,self-parent accepted | `itemsResponse` rejects `unit.moked.code === unit.code` after existing parent validation. Unit regression covers both approved source pairs; component regression asserts error and no context/rows. Actual Chrome intercepted otherwise-valid25-item self-parent response gives **0 context/rows**; valid J01/G01 with fixture and Oracle-marked **synthetic** responses still renders3 rows. No live Oracle test. |
| **D04**,outline reset by Material | Scoped `:host button.mat-mdc-button-base:focus-visible` plus local duration focus selector outranks Material's outline reset; no `!important` or global override. Actual Tab→reload, Shift+Tab→back, Tab→reload gives **solid3px outline,3px offset,rgb(0,47,101)** against adjacent **rgb(250,250,250)**: **12.62:1**. At1440 ring's button top/bottom **302.5/350.5px**, header bottom68px; at320 **499.5/547.5px**, header bottom64px. Entire ring fits viewport and is not sticky-header-obscured. |

Reload lifecycle was rechecked with actual CDP keyboard input at
**1440/320 ×200/503**. Repeated Space causes **one GET** in each case; same
reload DOM node/focus remains pending and terminal, native `disabled=false`.
No BODY focus loss. Normal focused opacity is1; measured indicator is the
explicit ring, not Material's12% overlay.

### Exact commands/results for this correction

From `frontend/fixture-slice`:

- `npm test -- --include=src/shift-items-contract.spec.ts --include=src/shift-items-page.spec.ts`
  → before fixes **3 new regressions failed** (D01 + guard/component D03),
  then **50/50 PASS**,2 files:24 guard +26 component.
- `npm test` → **196/196 PASS**,13 files,15:11; previous193 plus3 new
  regressions. Existing jsdom `Window.scrollTo not implemented` diagnostic
  remains; not counted as browser/scroll proof.
- `npm run typecheck` → **PASS**.
- `npm run build` → **PASS**, initial546.95kB, items lazy31.82kB; no budget warnings.
- `node --check checks/browser-check.mjs` → **PASS**.
- `node --check checks/items-review-check.mjs` → **PASS** (including final
  screenshot-target adjustment).

Isolated owned services, same explicit synthetic-only setup as documented below:
Node4348 (`SHF_UI_ITEMS_FIXTURE=1`, `SHF_FIXTURE_PORT=4348`,
`node checks/serve-synthetic.mjs`); Angular4358
(`npm start -- --port 4358 --proxy-config fixtures/proxy.items.synthetic.json`);
headless Chrome9368, separate profile `.angular/items18-review-chrome`.
User4328/4320 were checked before startup and were not used/stopped.

Check process environment:

```powershell
$env:SHF_UI_URL='http://127.0.0.1:4358'
$env:SHF_CDP_URL='http://127.0.0.1:9368'
$env:SHF_ITEMS_ONLY='1'
$env:SHF_ITEMS_REVIEW_ONLY='1'
node checks/browser-check.mjs
```

→ **PASS**, narrow actual Chrome D01–D04 metrics above, real keyboard,
same-DOM200/503 lifecycle, no page overflow/storage/external requests/runtime
exceptions. All HTTP intercepted with synthetic fixtures.

```powershell
Remove-Item Env:SHF_ITEMS_REVIEW_ONLY -ErrorAction SilentlyContinue
node checks/browser-check.mjs
node checks/fixture-proxy-check.mjs
```

→ **both PASS**. Full items intercepted journey/regressions plus **actual
Angular→proxy→Node synthetic fixture**, interception disabled for proxy;
**18 successful browser item responses**, four origins/nested returns,
1440/390/320,25+5/reload, real400/404/no-store.
The two broad non-items browser/proxy runners were not rerun in this narrowly
scoped correction; their previous independent-QA results remain historical,
not newly claimed passes. Full196 unit regression was nevertheless rerun.

Synthetic evidence only:
`.angular/browser-evidence/items18-review-duration-{1440,390,320}.png` and
`items18-review-focus-{1440,320}-{200,503}.png`; final320 duration/focus captures
visually inspected. Initial nowrap implementation exposed native mobile-table
min-content expansion; it was corrected and a real cell/region containment
assertion added, rather than accepting hidden/clipped text as local scrolling.

No new implementation blocker. **Next owner: same independent QA** retests
D01–D04 and accepts/rejects the corrections before caller publication.
Full screen-reader/WCAG2.2 AA conformance, production, live Oracle UI and
transport checks remain not run/outside this bounded correction.
Cleanup verified: owned Angular/Node sessions stopped; surviving owned Chrome
PID26316 stopped specifically. No listeners remain on4348/4358/9368.
User4328/PID6344 and4320/PID2380 remain listening and were not stopped.

## SHF-ITEMS-UI-18 — actual Angular implementation / final verification

**Status: implemented, checks passed; independent QA/release remains caller-owned.**
Approval: **§29 v0.1 + §30 v0.1 + `#shift-items` visual**, user 18 October
14:17 “Agree and continue”, canonical record **§31 v0.1**. Existing Angular
21.2.25 / Material-CDK21.2.14 / TS5.9.3 retained; observed Node24.21.0/npm11.19.0.
No install, new application, Git command, backend/shared/docs/design/root edit,
DB connection, legacy execution or delegation was performed by this UI task.

### Changed paths (relative to `frontend/fixture-slice/`)

New:
`src/shift-items-contract.ts`, `src/shift-items-contract.spec.ts`,
`src/shift-items-fixtures.ts`, `src/shift-items-page.ts`,
`src/shift-items-page.html`, `src/shift-items-page.scss`,
`src/shift-items-page.spec.ts`, `src/shift-items-navigation.spec.ts`,
`src/view-history.ts`, `checks/items-browser-check.mjs`,
`checks/items-proxy-check.mjs`, `fixtures/proxy.items.synthetic.json`.

Updated:
`src/api.ts`, `src/contract.ts`, `src/list-navigation.ts`, `src/routes.ts`,
`src/current-shifts-page.{ts,html,scss}`, `src/shift-search-page.{ts,html}`,
`src/my-shifts-page.{ts,html}`, `src/shift-day-page.{ts,html,scss}`,
`src/workspace-shell.{ts,scss}`, `checks/browser-check.mjs`,
`checks/fixture-proxy-check.mjs`, `checks/serve-synthetic.mjs`,
`README.md`, `VERIFICATION.md`.
Generated build/cache/synthetic captures stay inside this frontend workspace.
No claim of Git diff/hash or byte comparison of the caller's pre-existing work.

### Exact commands and observed outcomes

Commands below ran from `frontend/fixture-slice`:

| Command | Result |
|---|---|
| `npm test -- --include=src/shift-items-contract.spec.ts --include=src/shift-items-page.spec.ts --include=src/shift-items-navigation.spec.ts` | **52/52 PASS**, 3 files (23 guards,24 component,5 four-origin/navigation), final 14:55 |
| `npm test` | **193/193 PASS**,13 files: all prior **141** unchanged tests +52 new; final 14:55 |
| `npm run typecheck` | **PASS**, strict application check |
| `npm run build` | **PASS**, final14:56; initial546.95kB, lazy items31.21kB; no budget warnings |
| `node --check checks/browser-check.mjs` | **PASS** |
| `node --check checks/items-browser-check.mjs` | **PASS** |
| `node --check checks/fixture-proxy-check.mjs` | **PASS** |
| `node --check checks/items-proxy-check.mjs` | **PASS** |
| `node --check checks/serve-synthetic.mjs` | **PASS** |

Unit/component checks use Angular + HttpTestingController + jsdom, **not** a
live API/browser. jsdom still reports `Window.scrollTo not implemented`;
it is not counted as visual/scroll proof. Geometry/history/scroll/focus were
separately checked in actual Chrome155.0.8059.84.

Owned local services/check environment (exact start commands in README):
`SHF_UI_ITEMS_FIXTURE=1`, `SHF_FIXTURE_PORT=4348`,
`node checks/serve-synthetic.mjs`;
`npm start -- --port 4358 --proxy-config fixtures/proxy.items.synthetic.json`;
isolated headless Chrome CDP9368/profile `.angular/items18-chrome`.
`SHF_UI_URL=http://127.0.0.1:4358`, `SHF_CDP_URL=http://127.0.0.1:9368`.

1. **`SHF_ITEMS_ONLY=1; node checks/browser-check.mjs` — PASS.**
   All `/api/v1` calls intercepted with synthetic fixtures. Four real entry
   actions/own pairs; both nested current and search → schedule → detail →
   items → exact detail/schedule/upstream return; optional items → detail →
   items without duplicate forward entries. Independent page25, current minute,
   search range, vertical/RTL scroll and exact DOM opener; dirty draft returns
   without an automatic stale search. Page25+5/previous/reload0/empty, raw DEL,
   signed38-digit duration, null/actual/nonapplicable fields, unknown type/state7,
   escaped XSS-shaped remarks.400/401/403/404/500/503, ambiguity, malformed rows,
   source/employee mismatch, absent/invalid/missing-cap identities, strict query,
   stale abort/late response. Repeat Space→one GET, same reload node/focus,
   drawer Tab containment/Escape/opener, RTL1440/390/320, all8 fields,30px
   item/upstream navigation wrapping, no page overflow, no browser storage,
   external requests or runtime exceptions. This is not a complete WCAG audit.
2. **`Remove-Item Env:SHF_ITEMS_ONLY -ErrorAction SilentlyContinue; node checks/browser-check.mjs`
   — PASS**, existing broad intercepted current/search/schedule/detail checks.
   Actual Material calendars and two independent24/60 pickers, Escape/focus,
   search flags/equality/range, schedule31/32-day limit and Gregorian boundary
   cases, original errors/capabilities/stale work, three viewport widths and
   measured limited color pairs retained. Not a real-provider/authentication test.
3. **`SHF_ITEMS_ONLY=1; node checks/fixture-proxy-check.mjs` — PASS** after
   explicit backend READY handoff. **Actual Angular → own proxy → Node fixture
   read port**, Fetch interception disabled. Rejects Oracle/non-synthetic identity
   before UI access. Four origins + nested returns, three widths,25+5/reload0,
   disclosure/opener/filter restoration, escaped/raw/null/negative/precision
   fields, **18 successful browser item responses**, real server400 query grammar
   and generic404 wrong pair; no-store and no runtime exceptions. Final run uses
   actual CDP Enter activation, not script-only `.click()`.

Only synthetic screenshots were written to ignored `.angular/browser-evidence/`
(`items18-*` and `items18-proxy-*`);1440/320 first fold, table/card rows and30px
navigation captures were visually inspected. Raw pane remains plain text.

### Failed attempts and corrections (not counted as passes)

- Initial test compile errors in a contextual test-lambda type and later draft
  self-type were corrected. Two runs timed out **before collecting tests** while
  starting the existing Vitest thread pool; only the owned hung commands were
  stopped. The unchanged focused/full commands passed on rerun; tooling unchanged.
- Early full suite184/186 exposed changed legacy explicit-back timing. History
  return interception was scoped to active item journeys; original tests were
  not weakened/rewritten. Final prior141 all pass.
- New origin tests caught a programmatic schedule action opener being overwritten
  by departure capture; explicit pending opener now survives, upstream metadata
  remains independent.
- Real Chrome exposed double navigation from RouterLink + explicit return handler
  on new links. They now use safe native hrefs with a single primary-click
  interceptor; modifiers still open direct, server-authorized links.
- Initial browser/checker failures were also corrected: search readiness before
  inputs, exact restored detail opener rather than first-load heading, dynamic
  restored source row rather than hardcoded first page.
- Proxy checks initially used a server-default schedule range excluding synthetic
  days; now explicitly apply15–16October. Later script-only `.click()`/document
  readiness/restoration races caused timeouts or premature row assertions; actual
  CDP Enter, a new-document barrier, two rendered frames and explicit disclosure
  restoration waits make the harness exercise real keyboard/history behavior.
  Final terminal proxy run passed all assertions; failed runs are not passes.

### Evidence, scope and handoff

Read canonical `backend/fixture-slice/shift-items-contracts.mts` and exact
§§29–31. Read controlling legacy evidence, **without execution**:
`old/SHF/src/bzq/shf/model/BreakDataModel.java:617–690` (exact day, cancellation
null, stored duration/exit/entry, start order);
`model/ExceptionDataModel.java:304–375` (separate report and DEL-excluding
update helper, deliberately not imported as inquiry rules).
§29/30 explicitly approve combined partial rows and new current/detail entry;
not a claim that legacy exposed the same combined screen. Source contract
catalog is absent; linked baseline/inventories were used instead.

Backend READY was supplied by caller:161/161/strict check and bounded native
Oracle evidence are **caller-reported**, not executed by this frontend role.
Read stable server/README fixture shape; helper supplies complete identical
detail contexts through explicit `SHF_SHIFT_ITEMS_FIXTURE`. No backend file
write or live DB/Oracle browser screenshot. Required duration null is rejected,
never normalized to0; only canonical nullable fields are accepted.

Not run: independent QA, screen-reader/manual comprehensive WCAG2.2 assessment,
real-provider/production deployment, Oracle UI or live transport checks; no
release approval implied. No remaining implementation/config handoff blocker.
Next owner: caller/independent QA reviews this frontend evidence and any desired
publication; backend evidence stays with its owner. Existing user/demo ports
4328/4320 were not stopped or used for these tests.

**Cleanup verified:** owning tool sessions for Angular4358/Node4348/Chrome9368
were stopped. Chrome's surviving, previously verified owned PID23680 was then
stopped explicitly with `Stop-Process -Id 23680`. Final
`Get-NetTCPConnection -State Listen -LocalPort 4348,4358,9368`
found **no listeners**. Existing4328/PID6344,4320/PID2380 and4318/PID12312
remained listening; none was killed.

---

## SHF-SEARCH-FINAL-18 — publication checks, 18 October 10:56 +03:00

- Backend `npm run typecheck`: **PASS**; `npm test`: **96/96 PASS**.
- Frontend `npm run typecheck`: **PASS**; full `npm test`: **100/100 PASS**,
  eight files, including the new D01 regression; `npm run build`: **PASS**.
  The first full invocation timed out starting the Vitest worker before collecting
  tests; only that owned hung process was stopped. The unchanged command passed
  on rerun. The existing jsdom `scrollTo` diagnostic remains, not a browser check.
- Root `node docs\reverse-engineering\verify-evidence.mjs`:
  **passed_with_documented_source_anomaly**, 454 source hashes verified.
  The pre-existing duplicate legacy route remains explicitly documented.

These are fresh static/synthetic publication checks, not a production release,
complete WCAG assessment, Oracle SLA, or replacement for the independent browser
and authorized Oracle evidence recorded separately.

## SHF-SEARCH-QA-UI-18-D01 — narrow fix, 18 October ~10:49 +03:00

**Status: fixed; return to the same independent QA for narrow retest.**
Approved §23/24 v0.1 / §25 unchanged. Only search result date/time `bdi` elements
gain `.date-time-token { white-space:nowrap; overflow-wrap:normal }`. Existing
date `cell-note` line breaks remain. Table intrinsic sizing now reserves the
unbreakable token width; the existing internal table scroll handles desktop
containment. No global nowrap, fixed column hack or current/detail style change.
Long raw text retains inherited `overflow-wrap:anywhere`.

Changed paths for this fix only (all under `frontend/fixture-slice/`):
`src/shift-search-page.html`, `src/shift-search-page.scss`,
`src/shift-search-page.spec.ts`, `checks/fixture-proxy-check.mjs`, `VERIFICATION.md`.
No API/backend/canonical/manifest/dependency/Git/real-data work.

Commands run from `frontend/fixture-slice`:

- `npm test -- --include=src/shift-search-page.spec.ts --include=src/shift-search-generation.spec.ts`
  → **27/27 PASS**, 2 files (23 component/guard/style cases + 4 generation).
  New regression checks four exact complete LTR tokens, separate date lines,
  class scope and actual computed nowrap/normal styles; nonnumeric fields do not
  receive the class. jsdom scrollTo diagnostic remains; geometry is checked in
  actual Chrome below.
- `npm run typecheck` → **PASS**.
- `npm run build` → **PASS**, no budget warnings; initial 537.08 kB, lazy search
  49.79 kB. `node --check checks/fixture-proxy-check.mjs` → **PASS**.
- Owned test services: `node checks/serve-synthetic.mjs`,
  `npm start -- --port 4328 --proxy-config fixtures/proxy.synthetic.json`,
  isolated Chrome profile `.angular/d01-browser`, CDP 9338.
- `node checks/fixture-proxy-check.mjs` with
  `SHF_UI_URL=http://127.0.0.1:4328`, `SHF_CDP_URL=http://127.0.0.1:9338`,
  **`SHF_SEARCH_TOKEN_ONLY=1`** → **PASS**. Actual Angular → loopback proxy →
  explicit synthetic backend; interception disabled. Narrow D01 branch only,
  not a broad rerun of the recent full QA/browser/nav trace.

Actual DOM Range text-node geometry, first row (all units CSS px):

| Viewport | Page scroll width | Table viewport / scroll width | Start `10:00:00`: token / cell | End date `16/10/2026`: token / cell |
|---|---:|---:|---:|---:|
| 1440×900 | 1425 | 1135 / 1220 | 47.69 / 71.69 | 61.11 / 85.11 |
| 390×844 | 375 | 341 / 341 | 47.69 / 317 | 61.11 / 317 |
| 320×844 | 305 | 271 / 271 | 47.69 / 247 | 61.11 / 247 |

Every viewport: **100/100 date/time tokens occupy exactly one DOM Range line**
(25 rows × four tokens). First-row `15/10/2026`, `10:00:00`, `01:00:13`,
`16/10/2026` remain complete, each `white-space:nowrap` / `overflow-wrap:normal`.
All 25 records retain **10 visible fields and seven indicator items**; all ten
mobile field labels exist. Page width <= viewport (15px vertical scrollbar is
not horizontal overflow). Desktop scroll remains contained; mobile cards have
no internal horizontal overflow. Activity text computes `overflow-wrap:anywhere`.
Observed API responses are 200/no-store; no browser runtime exceptions.
Ignored synthetic captures `.angular/browser-evidence/search18-D01-tokens-{1440,390,320}.png`;
1440/320 captures visually inspected.

Initial narrow harness attempts were not passes: first ran before the dev server
was ready, then a helper scope error and overly strict page-width equality were
corrected (vertical scrollbar permits page width < viewport). The terminal
geometry run above passed. The recent full 99-case/QA trace was deliberately not
rerun for this scoped CSS fix; no new whole-suite total or WCAG claim is made.
Next action: same QA retests D01 token lines/containment before publication.
Owned D01 server process trees and verified isolated Chrome PID 1204 stopped;
cleanup confirmed no listeners on 4318/4328/9338. No unknown user service stopped.

## Search implementation: done (supersedes historical current/detail-only scope below)

**Completed assigned frontend feature, ready for caller/QA review; not a full-app
migration, production release or authentication implementation.** Only
`frontend/fixture-slice/` authored files were edited. No Git command, installs,
dependency/manifest/lockfile changes, backend/canonical/design edits, legacy
execution, Oracle connection, DB metadata/DML/DDL, EMS, batch or deployment.
Other writers' `.github`/`docs` changes were not touched.

### Approved contracts and evidence

- **§23 v0.1 API/search + §24 v0.1 UI + approved HTML `#search`**, approval
  **18 October 2026 10:11 +03:00**, recorded in **§25**. Existing
  §13/14/17/19/21/22 current/detail/tooling baselines retained.
- Type-only imports from architect-owned
  `backend/fixture-slice/shift-search-contracts.mts`, with reused
  `contracts.mts` and `current-shifts-contracts.mts`. No duplicate wire DTO/schema.
  Synthetic identity now requires the exact ordered three approved capabilities;
  real identities can have individual capabilities. No role-only authorization.
- Read project instructions/agent brief/UI skill, exact §§23/24/25 and
  `docs/design/shifter-redesign-v0.1.html#search`; controlling read-only
  `ShiftDataModel.populateShiftList` baseline/changed predicates and ordering,
  especially **395–451, 569–653**, and `shifts_search_table.jsp` **78–190**.
  Source documents start-in-window, raw branch home filtering, ordered activities,
  seven indicators and the distinct original-swap popup; it does not authorize
  revival of deferred actions. Source catalog file is absent (`Test-Path
  docs/SHF_SOURCE_CONTRACT_CATALOG.md` → False). Legacy Hebrew literal parity and
  runtime behavior are not claimed from these static reads.
- Backend owner relayed search readiness (95 backend tests, native Oracle checks).
  Those backend/Oracle results are **caller-reported**, not tests executed by this
  frontend task. This task independently ran the ready backend only in explicitly
  configured **isolated-fixture** mode using its existing server binding.

### Authored paths

- New `src/shift-search-contract.ts`, `shift-search-page.ts/.html/.scss`,
  `shift-search-fixtures.ts`, `shift-search-page.spec.ts`,
  `shift-search-generation.spec.ts`.
- Integrated `src/api.ts`, `routes.ts`, `contract.ts`, `current-shifts-contract.ts`
  (reused core-row guard), `list-navigation.ts`, `current-shifts-page.ts`,
  `shift-day-page.ts/.html`, `workspace-shell.ts/.html` and directly related
  `contract.spec.ts`, `workspace-shell.spec.ts`, `test-fixtures.ts`.
- Extended `checks/browser-check.mjs`, `checks/fixture-proxy-check.mjs`; added
  `checks/serve-synthetic.mjs`, `fixtures/shift-search.synthetic.json`,
  `fixtures/search-detail.synthetic.json`, `fixtures/proxy.synthetic.json`;
  updated this document and `README.md`.
- Generated optimized bundles/test caches and synthetic screenshots are confined
  to existing ignored `dist/` / `.angular/`; screenshots are not live records.

### Actual final commands/results

All npm/Node commands below use `frontend/fixture-slice` as working directory.
No dependencies were selected/upgraded: Node **24.21.0**, npm **11.19.0**,
Angular **21.2.25**, Material/CDK **21.2.14**, CLI/build **21.2.27**,
TS **5.9.3**, RxJS **7.8.2**, Vitest **4.0.8**, existing jsdom **27.1.0**.

| Exact command | Result and evidence class |
|---|---|
| `npm test -- --include=src/shift-search-page.spec.ts` | First coherent edit found a type-guard narrowing error, repaired. Next invocation hit the existing five-second Vitest worker-start timeout; stopped only owned hung shell. Rerun **14/14 PASS** at that checkpoint. |
| `npm test` | Final **99/99 PASS**, **8 files**: 73 existing cases + 26 search cases (22 component/guards + 4 deliberately uncooperative-generation cases). Angular/Vitest/jsdom + synthetic HTTP, not browser/DB. Final run 18 October ~10:37 +03:00. |
| `npm run typecheck` | **PASS** (`tsc --noEmit -p tsconfig.app.json`). |
| `npm run build` | **PASS**, production build, no budget warning. Initial **537.08 kB**, lazy search **49.66 kB**, existing shared lazy chunk **249.05 kB**, lazy current **63.86 kB**; budgets unchanged. |
| `npm start -- --port 4328 --proxy-config fixtures/proxy.synthetic.json` | Owned loopback Angular server; no existing user/demo listener reused or stopped. |
| `node checks/serve-synthetic.mjs` | Owned loopback backend **4318**, explicit fixture config only; no Oracle environment forwarded. Existing current rows + search detail rows merged with duplicate-pair assertion. 30 deterministic synthetic search days exercise 25+5 pagination. Uses approved `SHF_SHIFT_SEARCH_FIXTURE` and existing config/rows/current/port variables only. |
| `node checks/browser-check.mjs` with `SHF_UI_URL=http://127.0.0.1:4328`, `SHF_CDP_URL=http://127.0.0.1:9338`, no `SHF_SEARCH_ONLY` | **PASS**, actual Chrome **155.0.8059.84**, actual Angular/Material; **all HTTP API requests intercepted with synthetic data**. Existing current/detail regressions plus full new search matrix below. |
| Same browser command with `SHF_SEARCH_ONLY=1` | **PASS**, focused real-Chrome search matrix during refinement; not substituted for final full-suite run. |
| `node checks/fixture-proxy-check.mjs` with the same two loopback URL variables | **PASS**, actual Angular → proxy → ready Node backend, **Fetch interception disabled**, explicit synthetic dataset only. Current/detail at 1440/390 and search/detail/Back/Forward at **1440/390/320**; all observed API responses **200 + no-store**, no runtime exceptions. |

Final full test rerun also encountered one more existing Vitest worker-start
timeout before collecting any tests; its owned hung process was stopped and the
same command passed 99/99 on rerun. No timeout invocation is counted as passing.
jsdom emits its known `window.scrollTo` not-implemented diagnostic on restoration;
real scroll and exact opener were independently verified in Chrome.

Browser-harness refinements: initial attempts raced Material select/calendar
closing/opening lifecycle or the previous results DOM. The harness now waits for
unobscured actual pointer targets, Angular rendering after input/click, actual
calendar focus and terminal opening lifecycle before Escape. Earlier failed
runs are not passing evidence. App result focus now scrolls into view on fresh
search (verified visually at 320); restore uses preventScroll + saved scroll.

### Bounded browser/behavior coverage actually run

- **1440×900, 390×844, 320×844**, Hebrew/RTL/right desktop shell and active search,
  mobile menu Escape/exact trigger restoration, no page-wide horizontal overflow.
  Desktop table scroll is contained; mobile uses the same labeled stacked records.
  Synthetic desktop/mobile screenshots captured; 1440/320 intercepted and
  390 actual-proxy screenshots visually inspected. Not every viewport screenshot
  or accessibility tree was manually reviewed.
- Two independent from/to targets share the existing dialog. Actual 24 hours /
  60 minute options; **00:00, 23:59, 08:07**, apply/cancel/Escape, exact opener,
  no change to the other field. Material calendar Escape/opener and strict
  DD/MM/YYYY. Invalid **29/02/2027, 31/04/2026, 00/10/2026, 0001,
  10/15/2026**, malformed minutes and reversed range retain draft/focus. Equal
  **10:00–10:00** succeeds. **29/02/2028, 01/01/0001, 15/10/2026** survive
  en-US locale with **America/Los_Angeles / Pacific/Kiritimati** unchanged.
- Actual named Material parent/team/role/location options, parent-driven team
  reset, single comma-list serialization, selected filters, omission versus both
  home/site semantics. Backend fixture **10:00–10:00** returns actual rows and
  **10:01–10:01** is actually empty (not locally filtered or fabricated).
- Seven noninteractive Hebrew indicator labels, null extension “not applicable,”
  explicit unknown activity label, full end date, exact result employee/day link.
  Original swap/card/export/breaks/commands have no fake links.
- Stable offset 25/5-row second page → effective detail **1001/3026** →
  actual browser Back/Forward retains page/window/selections/vertical and table
  scroll/exact opener, with context revalidation and fresh GETs. Search stays
  selected in detail. Search and current origin remain separate.
- Identity absent/malformed/missing search capability → zero search/context
  requests; individual search-only principal has no detail links. Context/source
  mismatches/malformed rows, 400 field focus, 401/403 denial, 500/503 and retry,
  empty, dirty hiding, no polling/automatic retry. Late browser A-after-B success
  is ignored; unit fake transport additionally sends late error and **403**
  after unsubscribe and verifies unchanged state/announcement/actual focus.
- Existing actual current-list date/minute/current-mode regressions passed.
  Existing exact reload checks **4/4** at 1440/320 × 200/503 preserve the **same
  DOM button object**, pending/terminal focus and one request despite duplicate
  Space — not BODY or merely matching text.
- Intercepted suite asserts no browser storage, external network or JS exceptions;
  real proxy asserts no-store, fixture identity before business reads and no
  runtime exceptions. Screenshot data are synthetic only.

### Explicit verification limits / ownership / next action

No full WCAG conformance claim. Screen-reader/AT behavior, measured contrast,
complete 200%/400% zoom and full search-specific text-spacing matrix, all browser/
OS combinations and real-authenticated-provider deployment remain **not run**;
independent QA owns those acceptance checks. Source Hebrew decoding parity is
not claimed. No production mock startup was executed here (backend owns its
guard); no UI Oracle/live-data query was run. Oracle readiness/95 backend tests
are backend-owner reported only. No frontend implementation blocker remains.
Backend contract handoff integrated with the approved env name and exact three
capabilities; no new endpoint, source marker, config alias or shared change needed.
Caller owns independent review/release decisions; no further approval gate is
invented. Owned test servers/Chrome are stopped after checks; no user demo is left
running by this task.
Cleanup verified: no listeners on owned **4318/4328/9338**. Only verified isolated
Chrome PID **10876** (`search-ui18-browser`, CDP 9338) and owned server process
trees were stopped. Final `node --check checks/browser-check.mjs`,
`node --check checks/fixture-proxy-check.mjs` and
`node --check checks/serve-synthetic.mjs` all passed.

---

# Historical SHF-IMPL-UI-01 verification — 2026-10-15

## Current implementation scope (supersedes historical detail-only scope below)

**Status: frontend implementation done; ready for independent QA/caller review.**

Real Angular **shared RTL shell + current-list filters/results/pagination +
compact effective detail**, using only approved API responses. No prototype
rows/catalog/service in the running application. Current-list approval at
14:55 removed that earlier dependency; the current-list menu is now functional.
Search/my-shifts remain disabled/planned, with no false navigation claims.
No full migration, real authentication, production release or Oracle UI/runtime
verification is claimed.

Approved baselines: **§13 API/detail v0.1; §14 existing behavior v0.1;
§17 exact tooling; §19 v0.1** including additive identity capability revision;
**§21 accepted visual v0.1 with timepicker; §22.3–22.4 approval/source delta**.
Canonical types remain backend-owned. Exact source pairs are fixture/fixture or
identity+detail `oracle` / context+list `oracle-read-only`; mixed/unknown sources
are rejected. Visible Oracle TEST/read-only text does not hide the explicitly
synthetic Administrator/no-password-verification notice. Source-pair tests use
synthetic names and mocked HTTP, not an Oracle read.

### Evidence and ownership

Only authored files under `frontend/fixture-slice/` changed. No Git operations,
dependency installs, package/lockfile changes, other writers' files, backend or
canonical-contract/design edits. No legacy execution, DB/EMS/batch/DDL,
deployment, credentials or real employee screenshots.

Read instructions/brief/UI skill; accepted prototype and §13/17/19/21/22;
installed Material adapter/timepicker/dialog APIs; controlling read-only
`ShiftDataAction` 118–132, `ShiftDataModel` 972–1020, `shifts_table.jsp` 37–98,
detail popup 49–74 and effective getters 1016–1030. The source contract catalog
is absent (`Test-Path docs/SHF_SOURCE_CONTRACT_CATALOG.md` → False).
Source is evidence, not proof of legacy runtime or fresh Oracle metadata.

Material built-in timepicker declares seconds/`m`/`h` interval support and
immediate selection. To preserve approved explicit hour/minute apply/cancel
semantics, use existing Material Dialog + Select: 24/60 choices, minute precision,
strict HH:mm seed, cancel/Escape retention and exact clock focus restoration.
Actual Material Datepicker uses the strict civil-date adapter and Hebrew labels.
No new dependency. Official overview HTTP 200 was an SPA shell, not readable
component documentation; attempted static timepicker content URL returned 404.
Local installed declarations + compile/browser behavior are the verified evidence.

### Executed checks and repairs during this implementation

All npm/Node check commands below run from `frontend/fixture-slice/`.

| Exact command | Actual outcome |
|---|---|
| `node --version`; `npm --version` (repo root) | **24.21.0 / 11.19.0**; approved installed versions retained |
| `npm test -- --include=src/shift-day-page.spec.ts` (first coherent edit) | Test bundle compiled; first invocation hit Vitest's 5-second worker-start timeout, stopped **owned** hung session; no passing tests claimed |
| same focused command, rerun | **28/30**; two assertions described old DOM composition, then adapted to semantic null-field cells and exact diagnostic link |
| `npm test -- --include=src/current-shifts-page.spec.ts --include=src/shift-day-page.spec.ts` | **49/50**; dialog close lifecycle timing repaired with explicit zero transition durations; detail 30/30 |
| `npm test -- --include=src/current-shifts-page.spec.ts --include=src/workspace-shell.spec.ts` | Initially 21/22 plus unhandled exception: `#opener` queried a Material button instance, not ElementRef. Fixed explicit query `read: ElementRef` with correct generic overload |
| same focused command after repair | **22/22**, no unhandled errors |
| `npm run typecheck` | Passed after repairing nullable originating-list context narrowing; later unknown-JSON guards use `unknown`, not `any` |
| `npm run build` (first full-list eager version) | Passed with 841.41 kB initial / 800 kB warning; replaced eager list route with supported lazy route, **did not raise budget** |
| `npm run typecheck`; `npm run build` (lazy route) | Passed; initial **534.65 kB**, lazy list **311.28 kB**, no budget warning at that checkpoint |
| `npm test -- --include=src/current-shifts-page.spec.ts --include=src/current-shifts-generation.spec.ts --include=src/contract.spec.ts` | **31/31** after source-pair, bounded-window and independent stale-generation checks |
| `npm test` (before last two refresh-focus cases) | **70/70**, six files; original forty behavior cases retained with legitimate composition/capability/source adjustments |
| `npm run typecheck`; `npm test -- --include=src/current-shifts-page.spec.ts --include=src/current-shifts-generation.spec.ts` | **PASS; 29/29** after current-refresh exact-element pending/200/503 focus tests |
| `node checks/browser-check.mjs` | **PASS**, actual Chrome **155.0.8059.40**, Angular running on owned loopback 4320, **intercepted synthetic API only**; detailed scope below |
| `node checks/fixture-proxy-check.mjs` | **PASS**, actual Angular → proxy → explicitly configured **fixture-only** backend on owned 4310, no HTTP interception; desktop/mobile list/detail 200 + no-store |

Browser harness initially encountered a stale Vite compiler-error overlay, then
was rerun after restarting **only the owned dev server**. Assertions were fixed
to await applied values/page IDs rather than accepting a previous results table;
Material dialog controls wait for initial focus/rendering. Actual browser found
clock Escape restoration could end on the input; close handling now explicitly
returns to the exact clock button. None of these failed runs is counted as a
passing browser run. Final checks are recorded below after all changes.

### Bounded actual browser coverage

- Intercepted synthetic matrix: **1440×900, 390×844, 320×844**. Real Material
  calendar strict invalid date retention and Escape/opener; 24/60 picker applies
  **08:07**, preserves typed invalid 24:00 / 8:07 / blank, cancel/Escape focus;
  current mode uses server-supplied **08:07**, disables both time controls, and
  switching off reloads defaults. No native US/AM-PM fallback.
- Right desktop menu, honest disabled search/my-shifts, narrow modal drawer
  Tab/Escape/exact opener; no page overflow at either narrow width. Both actual
  shift time values are above the **844px** fold. Palette/RTL/landmarks checked.
- Actual row/detail/back and next/previous offsets; direct detail keeps collapsed
  diagnostic ID form and honest missing-origin landing. Long 38-digit ID,
  40-character name, escaped raw markup, secondary metadata and text spacing
  reflow; raw source is text, not HTML.
- **Exact reload focus 4/4**: 1440/320 × terminal 200/503, actual keyboard Space,
  saved DOM object identity pending/terminal, one request despite repeat Space.
  New list refresh equivalent is independently covered by Angular unit tests.
- Real delayed detail **and list** A/B races; explicit detail 401/403/404/500/503,
  list 400/401/403/500/503, empty result, failed/malformed identity and explicit
  context retry. No automatic fixture fallback, data on identity failure,
  browser storage, external runtime requests or JS exceptions.
- Separate non-intercepted fixture proxy run at **1440×900 / 390×844** uses
  synthetic `15/10/2026 23:59` and day 2001: real backend G01/J01 labels,
  list/detail 200/no-store, full overnight dates, real browser Back restores
  filters/page/vertical **and table** scroll/exact opener. Script refuses Oracle
  identity before opening business UI. Fixture may legitimately show empty at
  the current server minute; application never supplies a fake row.

Representative approved token contrast calculations (not a rendered/full audit):
navy/white **14.88:1**, primary/white **5.00:1**, primary/soft **4.52:1**,
muted/white **6.37:1**. Synthetic screenshots only under ignored
`.angular/browser-evidence/ui01-*.png`; desktop/mobile list/detail/picker,
loading/empty/error, long text and separate proxy snapshots. Representative
desktop/mobile images were opened for visual review.

### Explicit not-run checks / remaining owners

No browser against Oracle or live employee data; Oracle adapter/driver/runtime
readiness belongs to **backend owner + caller**, not a missing frontend API
approval. No screen-reader/AT, exhaustive contrast/zoom or full WCAG 2.2 audit;
QA owns independent acceptance. No deployment/release, full SHF migration,
search/my-shifts, edit/export/totals, live DB/EMS, batch or legacy execution.
All shared contract prerequisites assigned to this frontend are now available.

### Final checks after all source edits — 15:23 +03:00

| Exact command | Final result |
|---|---|
| `npm test` | **PASS 73/73**, six files: current page 27, detail 30, detail generations 7, list generations 3, shell 2, wire boundary 4; no unhandled errors |
| `npm run typecheck` | **PASS**, strict no-emit TypeScript against the now-published canonical source union |
| `npm run build` | **PASS**, strict Angular templates and optimized production-format build; initial **534.67 kB**, lazy list **311.79 kB**, no budget warnings/errors |
| `node checks/browser-check.mjs` | **PASS**, final actual Angular/Chrome 155 synthetic-intercepted matrix, all three viewports, calendar/picker/menu/focus/navigation/states and both list/detail races; exact reload 4/4 |
| `node checks/fixture-proxy-check.mjs` | **PASS**, final actual non-intercepted Angular/proxy/fixture API at 1440/390; list/detail 200 and no-store, real browser Back, filters/page/vertical+table scroll/exact opener |

Final return edge-case: if re-reading the remembered page no longer includes
the originating row, focus the real results heading and announce that the row
is absent. Do not invent a row/opener or leave focus on BODY. This branch is
covered by the added Angular/mocked-HTTP case; browser runs cover the actual
successful-origin return and were rerun after the final change.

Authored paths (all relative to this directory):
`src/workspace-shell.{ts,html,scss,spec.ts}`,
`src/current-shifts-page.{ts,html,scss,spec.ts}`,
`src/current-shifts-contract.ts`, `src/current-shifts-fixtures.ts`,
`src/current-shifts-generation.spec.ts`, `src/civil-date-adapter.ts`,
`src/minute-picker.ts`, `src/list-navigation.ts`, `src/api.ts`,
`src/contract.ts`, `src/contract.spec.ts`, `src/routes.ts`,
`src/shift-day-page.{ts,html,scss,spec.ts}`, `src/generation.spec.ts`,
`src/test-fixtures.ts`, `src/styles.scss`, `fixtures/current-shifts.synthetic.json`,
`checks/browser-check.mjs`, `checks/fixture-proxy-check.mjs`, `README.md`,
and this `VERIFICATION.md`. No manifests, lockfiles or proxy settings changed.

Owned verification processes only: fixture API **22604** (4310), Angular dev
server **24584** (4320), separate Chrome **2452** (9322, dedicated
`.angular/ui01-browser` profile), all stopped. Final rerun used new owned fixture
API **288**, Angular **1444**, Chrome **17452** on the same checked loopback ports;
all three final helper sessions also stopped. These were temporary self-contained
verification helpers, not a user demo or deployed service.

---

# Historical SHF-RW-05 verification — 2026-10-15

Status: **D01/H01 fixes implemented and locally retested; narrowed independent
SHF-QA-02 retest pending through caller**. Only `frontend/fixture-slice/`
authored. No commit/push or deployment. Approved contracts: §13 v0.1 (API/
identity) and §14 v0.1 (UI), plus the caller's explicit tooling/scaffold approval
at 13:07 +03:00. Node 24.21.0 / npm 11.19.0 observed locally.
The 13:26 calendar instruction is accounted for: §14 has string-ID inputs only;
all dates are read-only, so a datepicker is not applicable in this slice.

## Initial implementation checks (historical, before SHF-QA-02)

Working directory unless noted: `D:\AIProjects\SHFAI\frontend\fixture-slice`.

| Command | Result |
|---|---|
| `node --version`; `npm --version` (repository root) | v24.21.0; 11.19.0 |
| `npm install --no-audit --no-fund` | Passed; created local package lock. Repeated after test DOM addition. |
| `npm view jsdom@27.1.0 version engines peerDependencies --json` | Node 24 supported; optional canvas not needed |
| `npm view vitest@4.0.8 engines peerDependencies --json` | Node >=24 and jsdom `*` supported |
| `npm view @angular/build@21.2.27 engines peerDependencies --json` | Node >=24, TS >=5.9 <6 and Vitest ^4.0.8 supported |
| `npm view @angular/material@21.2.14 peerDependencies --json` | CDK exactly 21.2.14, Angular ^21/^22 and RxJS ^7.4 supported |
| `npm test -- --include=src/contract.spec.ts` | Final pass: 3/3 |
| `npm test -- --include=src/shift-day-page.spec.ts` | Final pass: 28/28 |
| `npm test -- --include=src/generation.spec.ts` | Final pass: 7/7 |
| `npm test` | Final pass: 38/38, 3 files; Angular test build also passed |
| `npm run build` | Pass: optimized build, strict Angular templates; initial bundle ~459 kB, no budget errors |
| `npm run typecheck` | Final pass: strict TS no emit |
| `node checks/browser-check.mjs` | Reported pass: actual Chrome 155.0.8059.40, Windows, headless CDP. Reload focus assertion was subsequently proven false-positive by QA (H01); this historical pass did NOT establish reload focus correctness. |
| `git --no-pager diff --check` | Pass for tracked diff; new frontend paths enumerated with `git ls-files --others --exclude-standard .` |

First focused execution was performed immediately after the first coherent
implementation. Failures were repaired, not hidden:

- Angular builder required jsdom/happy-dom: added exactly jsdom **27.1.0** after
  published engine/peer verification, test-only.
- TS `String.isWellFormed` lib mismatch: equivalent Unicode lone-surrogate
  rejection without raising browser/library requirements.
- TS5096 for `allowImportingTsExtensions`: removed the unnecessary option;
  **type-only** `.mts` imports compile without it.
- Windows Vitest fork worker timed out/hung; stopped owned test session and used
  one worker thread. Focused rerun passed.
- Component test required DOM iterable types: added `DOM.Iterable`.
- Actual browser found Material omits aria-invalid on empty required input:
  explicit presentation binding added; browser and unit retests passed.
- First long fixture was 41 characters: corrected to exactly 40. PowerShell's
  default decoding corrupted Hebrew: restarted the owned backend using explicit
  `Get-Content -Raw -Encoding UTF8`; documented that exact command.
- Browser viewport checks now wait for responsive style recomputation before
  collecting screenshots/bounds; initial immediate measurements were discarded.
- Final deep-link regression test found the identity-loading reset cleared an
  initial malformed-route summary. Preserved that local route error, reran the
  focused test (7/7), complete suite (38/38), build and typecheck successfully.

No audit scan is claimed. npm reported deprecated transitive `whatwg-encoding`
and notices about four dependency install scripts; no blanket script approval,
dependency upgrade or global installation was made. Actual tests/build succeeded.

## SHF-QA-02 D01/H01 correction and measured retest — 13:39 +03:00

**History retained:** QA's pre-fix typecheck/build, 38 unit tests and general
browser check passed. QA also reported 18/18 extended groups formally passing,
but recognized that their textual reload-focus check was inadequate. The exact
element-identity check then **failed 4/4** combinations (1280/320 × 200/503):
focus became BODY both pending and terminal. Therefore the previous overall
browser pass was not evidence of UI02-03 reload-focus acceptance.

- **D01 (application, Medium/P2):** native loading `[disabled]` on reload caused
  browser focus loss. `src/shift-day-page.html` now keeps reload natively enabled
  and focusable while loading, with `aria-disabled="true"` and `aria-busy="true"`.
  Native disabling still applies to absent permission/dirty context. The existing
  `reload()` loading/identity/dirty guard is unchanged and suppresses repeat work;
  this is not a delayed focus-restoration workaround.
- **H01 (harness):** removed the `activeElement.textContent.includes(...)` oracle
  that also matched BODY. The harness saves the specific reload DOM element and
  asserts **`document.activeElement === globalThis.__shfReload`**, during a held
  GET, after repeated activation, and after terminal rendering/focus timers.
  Activation is actual CDP **Space keyDown/keyUp**, not `.click()`. Each of the
  four cases starts with the exact `1001/2001` pair, sends first Space, holds the
  response, sends two more Spaces, then releases 200 or 503.

Changed source paths in this correction only:
`src/shift-day-page.html`, `src/shift-day-page.spec.ts`,
`checks/browser-check.mjs`, and this existing `VERIFICATION.md`.
No DTO/API/type/tooling/dependency changes, Git operations, new report, backend
edits, live infrastructure or nested agents.

Exact commands from `frontend/fixture-slice/`:

| Command | Post-fix result |
|---|---|
| `npm test -- --include=src/shift-day-page.spec.ts --filter='D01/H01'` | PASS: **2/2**, 28 unrelated tests skipped by explicit filter. Covers pending native focusability, aria-disabled/busy, exact identity, repeated clicks/handler/submit suppression and terminal 200/503. jsdom only; browser required for native focus behavior. |
| `npm test` | PASS: **40/40** (original 38 + 2 new), 3 files: 30 + 7 + 3 |
| `npm run typecheck` | PASS, strict TypeScript no emit |
| `npm run build` | PASS, strict templates/optimized build; initial **459.60 kB**, no budget errors |
| `node checks/browser-check.mjs` | PASS: Chrome **155.0.8059.40**, Windows, headless CDP; exact matrix below plus retained general/long-string/RTL/validation/race checks |

Actual browser, delayed **isolated intercepted HTTP** detail responses (initial
general workflow still uses real Angular proxy → loopback fixture backend):

| CSS width | Response | Pending activeElement === saved reload | Terminal activeElement === saved reload | Detail GETs including repeated Space |
|---|---|---|---|---|
| 1280 | 200 | **true** | **true** | **1** |
| 1280 | 503 | **true** | **true** | **1** |
| 320 | 200 | **true** | **true** | **1** |
| 320 | 503 | **true** | **true** | **1** |

All four also assert that the saved button is the same connected reload element,
native `disabled` is false pending, aria-disabled/busy are true pending and false
at terminal, and old data is absent while loading. No substring-based focus
assertion remains. Browser check also reported no external app-runtime requests,
uncaught exceptions or local/session storage. Final sampled focus-outline ratio
was **12.53:1**; earlier sampled contrast values below are historical.

Verification-only startup used the README UTF-8 synthetic environment commands,
`npm start -- --port 4320`, and Chrome with isolated profile
`.angular/d01-browser`/loopback debug port 9322. Cleanup completed: owned Angular
and fixture sessions stopped, verified Chrome executable/profile before
`Stop-Process -Id 23468`; final listener probe found **no 4310/4320/9322 listeners**
and no remaining Chrome process using the D01 profile.

**Next owner/action:** caller returns these changed files/evidence to the **same
SHF-QA-02 QA** for narrowed independent D01/H01 retest. This implementation-owner
pass is not independent QA closure or publication approval.

## Acceptance evidence by UI02

| ID | Executed evidence and limits |
|---|---|
| 01 Context/identity | Angular router + mocked HTTP: exact pair, one GET/no query/body, no default employee, null synthetic employee, missing capability blocks. Actual browser: real dev proxy to fixture backend; distinct synthetic/password and fixture notices. |
| 02 Bounds | Unit/HTTP: empty/space/leading zero/sign/exponent/localized digits, 38/39 employee and 10/11 day digit bounds, exact preservation in URL/request/result. Browser: required/format errors, 38-digit fixture. Clipboard hardware/AT not tested. |
| 03 Keyboard/focus | Initial reload-focus claim was invalidated by QA D01/H01. The post-fix exact four-case real-Space/held-response matrix above passes; independent QA retest pending. Other DOM/browser first-invalid/result/error and Tab/Shift+Tab/Enter evidence retained. Full manual every-action Space sequence/AT is not claimed. |
| 04 Structure/names | Unit: one main/h1, skip link, labels/hints/errors/aria-invalid. Browser: Hebrew lang, RTL, native keyboard; explicit aria-invalid fix. Hebrew screen-reader pronunciation/announcement counts not verified. |
| 05 Reflow | Actual 1280 and 320 CSS-pixel Chrome, long name/raw values/ID, essential control bounds, multiline errors, text-spacing overrides, no page-level horizontal overflow; synthetic screenshots viewed. Actual browser 400% zoom and 200% text scaling not run. |
| 06 Contrast/targets | Browser samples: text and error/button contrast >=4.5; current action targets >=48x48; sampled invalid boundary/focused result outline >=3. Not an exhaustive hover/disabled/all-color-state audit. |
| 07 RTL/dates | Unit + actual browser: full overnight dates/seconds, end-before-start left intact, null unavailable, escaped raw activity. Local-calendar leap/year validity tests. No zone conversion/elapsed duration. Mixed-direction screenshot review performed. |
| 08 States/errors | HttpTestingController covers initial/identity loading/failure/retry, detail loading/success/all-null, 400/401/403/404, both 503 and three 500 codes, network/unknown/HTML/mismatched responses. Initial 503 reload-focus assertion was insufficient; superseded by exact post-fix matrix above. |
| 09 Freshness/races | Real HTTP test backend cancellation + deliberately uncooperative subscription double: late A success/error after B, input edit, identity invalidation, old identity completion/error, destruction, route changes, duplicate submit, failed reload. Actual browser intercepted delayed-A/B race passed. |
| 10 Boundaries | Runtime guards/HTTP tests reject mismatch/Oracle/invalid identity and dates; text interpolation verified with literal markup (no executable nodes). Browser storage empty; no external application runtime requests or uncaught browser exceptions. Static source has no mutation/cache/credentials/live infrastructure client. |

Browser screenshots are ignored synthetic artifacts, not personal data:
`.angular/browser-evidence/desktop-rtl.png`, `narrow-rtl-long.png`,
`narrow-text-spacing.png`. Real integration uses only the existing loopback
fixture service, not Oracle/EMS/real login. Error/race browser cases explicitly
use CDP-isolated mocked HTTP. Tests using jsdom are **not** browser results.

Initial browser samples (historical contrast ratios): body 16.34, error 6.15, primary button
6.45, secondary button 6.13, invalid boundary 6.15, focused result outline 16.34.
Visible result outline width/style and minimum 48px action bounds were asserted.
These representative samples are not a whole-theme conformance result.

Initial-run cleanup completed: stopped the owned Angular and fixture PowerShell sessions;
verified isolated Chrome executable/profile before `Stop-Process -Id 25992`.
Final `Get-NetTCPConnection` probe found **no listeners on 4310/4320/9322** and no
remaining Chrome process with this isolated profile. No verification service
was intentionally left running.

## Source and review limits

Read-only controlling sources: `old/SHF/src/bzq/shf/model/ShiftDataModel.java`
150–244; `old/SHF/src/bzq/shf/bean/AgentDayBean.java` 967–1030;
`old/SHFWeb/WebContent/jsp/show_original_shift_popup.jsp` 49–74.
The approved baseline explains the action/route chain and intentional target
differences; no legacy behavior was executed. Normative type imports reference
`backend/fixture-slice/contracts.mts`, unchanged by this task.

D01/H01 local fix/retest is complete; independent QA closure remains with the
same SHF-QA-02 reviewer through the caller. QA owns outstanding screen-reader/manual
keyboard/zoom/text-scale/full contrast matrix evidence and Hebrew business-copy
review. Architect owns future contract revisions; deployment/real identity/live
infrastructure are outside this task. Passing these checks is not WCAG sign-off,
release approval, authentication proof or permission to deploy a synthetic demo.

## SHF-SCHEDULE-UI-18 — 18 October 2026 / approved Angular implementation

**Status: implementation DONE, ready for independent review/QA.**
Approval: §26 API/architecture v0.1 + §27 UI v0.1 + existing HTML `#my-shifts`,
user 18 October 12:02, recorded in §28 v0.1. Canonical owner files consumed
type-only: `backend/fixture-slice/my-shifts-contracts.mts`,
`contracts.mts`, current/search contracts. No canonical/backend/docs-design/root
or legacy file was edited; all task writes are inside `frontend/fixture-slice`.
No Git operation, agent, install, DB connection/query, Oracle application contact,
EMS, batch or legacy build/execution was performed.

### Implemented and reviewed boundary

Source evidence read-only: `old/SHF/src/bzq/shf/actions/ShiftDataAction.java`
134–162 (personal defaults/result branch);
`old/SHF/src/bzq/shf/model/ShiftDataModel.java` 1250–1385 (personal membership,
anomalous changed attendance join, positional descending order);
`old/SHFWeb/WebContent/jsp/shifts_my_shifts_list.jsp` 119–146 and
`shifts_my_shifts_table.jsp` 64–145 (single-date source form/seven expressions).
Target visual: `docs/design/shifter-redesign-v0.1.html#my-shifts`.
Source catalog is absent; controlling baseline §§26–28 and existing Angular
current/search/detail/shell/navigation were used. Target finite range, no
attendance join, cancellation/exact-scope/order and effective-display decisions
are approved intentional differences, not claims about legacy deployed behavior.

Real standalone Angular routes `/my-shifts` and
`/my-shifts/selected/:employeeId`; exactly the approved context/list GETs.
Synthetic self has null employee and never requests a schedule list. No ID form,
implicit employee/default, profile linkage or Administrator fallback. Current and
search expose distinct explicit row schedule actions; existing detail links still
use their own employee/day selectors. The synthetic principal now requires the
exact ordered four-capability array; real individual-capability tests remain
valid. Selected context remains separate from identity and backend grants.

Context is validated before list: mode, actor/null/selection invariants, real-self
binding, synthetic selected permission indication, server default14 (including
year-9999 clamp), zone and coherent source pair. List guards cover applied
employee/range/order, all row employees, Unicode/catalog bounds, end >= start or
null, duplicate/numeric day ordering and exact offset/limit/hasMore/nextOffset.
Only `isolated-fixture` throughout, or identity/detail `oracle` paired with
context/list `oracle-read-only`, is accepted. No invented cancellation,
attendance, site, total, role grant, command or API alias.

Two Material calendars share the existing strict civil adapter and Hebrew
calendar labels. DD/MM/YYYY text is retained on invalid edits, wire dates are
YYYY-MM-DD, calendar ordinal arithmetic has no UTC/DST elapsed-time dependency.
Equal bounds =1, inclusive max31, leap years and 0001–9999 are supported. Server
context alone supplies defaults. Display includes weekday, full start/end dates,
HH:mm, Hebrew accessible seconds precision, overnight label and truthful null end.
Ordered duplicate activity tokens and unknown codes remain visible.

Two-level volatile navigation stores request/form/selector/unit-label/opener/
disclosure/scroll context only, **not result rows or principals**. Every return
reauthenticates, revalidates and refetches. Schedule detail keeps upstream current/
search state intact, uses schedule's own day ID and retains its back path on 404.
Dirty/context/identity/destroy generations abort and independently ignore late
success/error/403 callbacks, even with intentionally ineffective abort.
Identity recheck preserves entered dates and starts a new context/list generation.
The shared mobile native dialog now contains CDK focus-trap anchors **inside**
the modal, with Escape and exact trigger restoration.

### Exact commands and final results

Working directory for the following commands: `D:\AIProjects\SHFAI\frontend\fixture-slice`.
Installed/preserved baseline: Node **24.21.0**, npm **11.19.0**,
Angular **21.2.25**, Material/CDK **21.2.14**, TypeScript **5.9.3**;
no manifest/lock/dependency version change.

| Command | Actual final result / distinction |
|---|---|
| `npm test -- --include src/my-shifts-page.spec.ts --include src/my-shifts-generation.spec.ts` | **41/41 PASS**, 36 schedule component/guard cases + 5 deliberately uncooperative transport cases; Angular with synthetic HTTP/test doubles, not live auth/data |
| `npm test` | **141/141 PASS**, 10 files: existing 100 + new 41. Existing jsdom `Window.scrollTo` not-implemented diagnostic remains; real scroll assertions run separately in Chrome |
| `npm run typecheck` | PASS, `tsc --noEmit -p tsconfig.app.json` |
| `npm run build` | PASS, production Angular output; not deployment authorization |
| `node --check checks/browser-check.mjs` | PASS |
| `node --check checks/fixture-proxy-check.mjs` | PASS |
| `node --check checks/serve-synthetic.mjs` | PASS |
| `node checks/browser-check.mjs` with the environment below | **PASS**, actual Chrome/155.0.8059.84, all API requests intercepted with synthetic data |
| `node checks/fixture-proxy-check.mjs` with the environment below | **PASS**, actual Angular → loopback proxy → stable backend fixture implementation, **Fetch interception disabled**, no Oracle |

Owned isolated startup/check commands actually used:

```powershell
$env:SHF_FIXTURE_PORT = '4318'
node checks/serve-synthetic.mjs
# Separate owned terminal:
npm start -- --port 4328 --proxy-config proxy.schedule.conf.json --prebundle=false
# Own Chrome, not an existing browser:
& 'C:\Program Files\Google\Chrome\Application\chrome.exe' --headless=new --disable-gpu --disable-extensions --disable-component-extensions-with-background-pages --no-first-run --no-default-browser-check --remote-debugging-port=9338 --user-data-dir=D:/AIProjects/SHFAI/frontend/fixture-slice/.angular/chrome-schedule-18-clean about:blank
$env:SHF_UI_URL = 'http://127.0.0.1:4328'
$env:SHF_CDP_URL = 'http://127.0.0.1:9338'
node checks/browser-check.mjs
node checks/fixture-proxy-check.mjs
```

Ports 4318/4328/9338 were checked free before ownership. Existing 4320 application
was neither contacted nor stopped. Fixture helper passes **only explicit
synthetic environment values** to `startFromEnvironment`: config, detail rows,
current fixture, optional search fixture and new `SHF_MY_SHIFTS_FIXTURE`.
It extends the same synthetic search/day template to 30 rows, uses those exact
schedule/detail pairs and rejects duplicate employee/day detail pairs before
startup. Backend stable handoff README/server and `my-shifts-sample.mts` exports
were read; no Oracle environment is forwarded and no missing-fixture fallback
is installed.

### Actual Chrome evidence, not static assertions

At **1440×900, 390×844 and 320×844**, Hebrew/RTL, device scale factor1:

- Fresh synthetic menu: no employee/default/ID input, two real discovery links,
  no list request, active independent navigation and continuous compact mock
  notice without any password-verification claim.
- Both current/search explicit selection paths preserve source caption, actor,
  exact own-ID schedule detail, detail → schedule → exact source opener;
  Browser Back/Forward works. Native proxy additionally verifies schedule's
  vertical/RTL table scroll, retained range and **25+5** pages through day3026.
- Two distinct real Material calendar targets; keyboard Enter/Escape and exact
  trigger restoration; February2024 leap-day selection independently updates
  each target. Strict range31/32/equality, invalid US order/31April/year0000,
  2000/2100 leap behavior, years0001/9999; en-US with Los_Angeles/Auckland keeps
  wire civil dates unchanged.
- Dirty input removes stale row links; late range A cannot replace B.
  Empty/400/401/403/404/500/503, malformed actor/list/source/context responses
  surface explicit failures. 404 on schedule is rejected as noncanonical;
  existing detail404 remains independently valid with a schedule back path.
  Future linked/unlinked real-self and denied real-selected are **doubles only**.
- All six schedule fields remain in narrow cards; date/time tokens are single
  line; a 38-digit selector in opened technical context creates no page overflow.
  Schedule drawer strict Tab containment and Escape/opener restoration pass.
- Existing current/search/detail calendar/minute-picker, seven search flags,
  paging/source/error/identity/race checks and exact detail/current reload focus
  pending/terminal200/503 remain PASS.
- Limited computed-color pairs on white: heading/body **14.88:1**, muted
  **6.37:1**, primary button text/background **5.00:1**. This is not a full
  contrast matrix or proof of all focus/control states.
- Final intercepted run: zero browser storage entries, external requests,
  runtime exceptions **and Angular console errors**. Final native run:
  all observed API responses200/no-store, no runtime/console errors, no interception.
  Synthetic screenshots only: ignored `.angular/browser-evidence/schedule18-*`
  and `schedule18-proxy-*`; selected320 image was also directly inspected.

### Defects/retest history and remaining checks

Do not interpret earlier failed attempts as final PASS:

- First focused compilation exposed the required DateAdapter.parse second
  argument; fixed and rerun. Worker startup intermittently timed out during
  concurrent checks; those owned runners were stopped. Final serial focused/full
  checks completed normally, including the final141-case regression.
- Full regression exposed old three-capability expectations and a legacy
  diagnostic-origin return case. Updated only the approved synthetic delta,
  retained real subset tests, fixed origin restoration; full141 now PASS.
- Ineffective-abort test exposed identity-recheck loading suppression due to
  retained lastRequest. Fixed reset + preservation of typed range; all41 focused
  and all141 regression checks now PASS.
- Browser helper needed real document-load/form-control readiness instead of
  reading the previous document. Calendar focus tests now use actual keyboard
  focus/Enter rather than unfocused programmatic click.
- An initial browser contained injected extension resource requests; a fresh
  **owned** extension-disabled Chrome profile resolved that check.
- During shared Material-helper refactoring, warm Vite prebundling produced
  missing projected Material controls / `mat-form-field must contain a
  MatFormFieldControl`. A cold owned server with `--prebundle=false` resolved
  the observed development-server symptom (cache/token mismatch is the inferred
  cause); dependency versions were not changed. Final cold browser and native
  proxy both PASS.
- Native-helper schedule function was initially nested in the token helper;
  corrected scope and rerun. Strict drawer testing exposed CDK trap anchors
  outside a native modal when attached to dialog itself; moved the trap onto
  an inner container. Final strict containment/Escape test now PASS at390/320.

**Not run / remaining owner:** independent QA/manual screen-reader and full
keyboard/AT/200% text/400% browser zoom/text-spacing/complete contrast-state
matrix; Hebrew business-copy review (QA/business owner). No full WCAG2.2AA
conformance claim. Production mock-startup rejection, real authentication/
employee-link issuance, Oracle SQL/data/plans and backend123-test/Oracle
verification are backend/security/QA-owned and were **not rerun by this UI
task**. Caller-provided backend Oracle results are not UI live-data evidence.
Git preservation/diff/publication checks were not run because Git was excluded.
No API decision/blocker remains; future real-provider/admin browsing and deferred
commands require their own approval. Caller next action: independent integrated
QA/review, then separately authorized publication/release.

Cleanup completed: owned backend4318, Angular4328 and Chrome9338 stopped;
those ports have no remaining listeners. Only the two browser profiles created
by this task were removed. Retained evidence images are synthetic-only under the
ignored frontend cache directory; no real-data/PII screenshots were captured.

### Exact source/document paths changed by this task

All paths below are relative to `frontend/fixture-slice/`; generated build/cache
and synthetic screenshot outputs are not source deliverables.

```text
README.md
VERIFICATION.md
proxy.schedule.conf.json
checks/browser-check.mjs
checks/fixture-proxy-check.mjs
checks/serve-synthetic.mjs
src/api.ts
src/civil-date-adapter.ts
src/contract.ts
src/contract.spec.ts
src/current-shifts-page.html
src/current-shifts-page.ts
src/list-navigation.ts
src/my-shifts-contract.ts
src/my-shifts-fixtures.ts
src/my-shifts-generation.spec.ts
src/my-shifts-page.html
src/my-shifts-page.scss
src/my-shifts-page.spec.ts
src/my-shifts-page.ts
src/routes.ts
src/shift-day-page.html
src/shift-day-page.ts
src/shift-search-page.html
src/shift-search-page.ts
src/shift-search-page.spec.ts
src/test-fixtures.ts
src/workspace-shell.html
src/workspace-shell.spec.ts
src/workspace-shell.ts
```

## U49 §49-v0.1 — 29 October 2026 frontend source-stable handoff

### Authority and implementation classification

Approved baseline: §49-v0.1, §49.10 bounded package decision, §49.11 “Agree 49”
approval record and §49.12 uppercase-X/full-nine private CSV clarification.
Caller supplied UX16040 READY and C49/B49a989 compiler/four-module gate PASS.
Those prior gates were acknowledged, not rerun or relabelled as U49 evidence.
Canonical owner remains architect; no canonical/backend/legacy/tooling edits.

Actual UI implementation includes scoped HTTP client, strict runtime guards,
create/change/logical-cancel/whole CSV preview/apply, source/identity handling,
single external-template/stylesheet Material review, warning/whole consent,
quarantine/native interlocks, selected-row navigation and history restoration.
Only fixture modules/checks fabricate responses; no application fallback does.
The UI never reconstructs a receipt from an already visible/cancelled day.

Evidence read: design §§49.4–49.9/49.11–49.12 and canonical management DTOs/ports;
existing identity/API/routes, history/native sessions, Material dialog/calendar/
minute controls and blue theme. Controlling legacy
`old/SHF/src/bzq/shf/model/ShiftDataModel.java:7645–7665,7827–7832` was read for
uppercase-X normalization and full-ID resolution. The source contract catalog
is absent. No legacy execution/build, schema/DB/DNS/EMS/credentials access.

### Exact executed checks and observed outcomes

Commands below ran from `frontend/fixture-slice`. Tests use the established
Vitest **4.0.9** configuration, with no manifest/runner/worker changes.

| Command | Observed result |
|---|---|
| `npm test -- --include=src/shift-management-contract.spec.ts` | First RED: 1 failed, 2 passed; approved exact read7+management7 rejected by old identity allowlist. Fixed additively; rerun 3/3 PASS. |
| `npm test -- --include=src/shift-management-contract.spec.ts --include=src/shift-management-api.spec.ts` | Initial TS narrowing error in new guard fixed; rerun 15/15 PASS. |
| `npm test -- --include=src/shift-management*.spec.ts` | Intermediate 40 PASS/3 CSV failures: test TextEncoder buffer was from a different jsdom realm, not browser File's ArrayBuffer. Synthetic test reader fixed to return a realm-native byte-identical ArrayBuffer. Subsequent 43/43, then 58/58 PASS as suites expanded. |
| `npm test -- --include=src/shift-management*.spec.ts --include=src/native-read-views.spec.ts --include=src/*session.spec.ts` | 135/135 PASS across 10 files at that checkpoint. |
| `npm run typecheck` | Final app TSC exit 0. |
| `node node_modules/typescript/bin/tsc --noEmit -p tsconfig.spec.json` | Final full-spec TSC exit 0. |
| `npm test` | **Final 698/698 PASS, 50 files, natural exit 0**. Original 621 plus 63 new M3 tests and 14 management-family cases in existing seven-read matrix. 22.15s Vitest duration. Earlier complete checkpoint was697/697 before the final volatile-review-expiry test. |
| `npm run build:dev -- --output-path=.angular/u49-dev` | Final PASS, exit 0. |
| `npm run check:profile -- dev .angular/u49-dev/browser` | PASS: exact public keys `appEnv,apiBasePath`; `/api`. |
| `npm run build:test -- --output-path=.angular/u49-test` | Final PASS, exit 0. |
| `npm run check:profile -- test .angular/u49-test/browser` | PASS: same exact public object. |
| `npm run build:production -- --output-path=.angular/u49-production` | Final PASS, exit 0; existing budgets unchanged. |
| `npm run check:profile -- production .angular/u49-production/browser` | PASS: same exact public object. |
| `node --check checks/shift-management-browser-check.mjs` | PASS, exit 0. |
| `node node_modules/typescript/bin/tsc --allowJs --checkJs --noEmit --strictNullChecks --target es2023 --module nodenext --skipLibCheck --allowImportingTsExtensions --typeRoots ../../backend/fixture-slice/node_modules/@types --types node checks/shift-management-browser-check.mjs` | PASS, exit 0, using already installed Node declarations only; no backend runtime. Initial optional check without explicit Node type roots failed (frontend has no Node typings), then three driver nullability diagnostics were fixed. No dependency installed. |
| `node checks/shift-management-browser-check.mjs` | Final real Chrome / typed HTTP DOUBLE PASS, exit 0; owned servers/browser/profile cleaned. No backend runtime or database. |

One intermediate focused run also found a missing type-only `ShiftDraftV1`
test import after adding negative cases; fixed before final app/spec/full checks.
Full suite emits existing jsdom `scrollTo` “not implemented” warnings; real
scroll/focus verification is classified separately below.

### Browser scope and measured subset

Owned Chrome, production UI artifact, loopback typed HTTP doubles only:

- Create, activity-only change with null time reasons, logical cancel and
  two-row CSV whole-command receipt-shape journeys.
- Raw-byte upload equality, explicit charset, invalid CSV cannot apply,
  no personal ID echo or untrusted-filename HTML interpretation.
- Review initially unchecked; keyboard focus trap, Escape zero commands,
  opener restoration, first syntax-error focus, pending duplicate suppression.
  The new form's Material calendar opens/closes by keyboard and restores its
  toggle focus; the review comparison/dialog reflows at320px without horizontal
  overflow and its visible action buttons meet the sampled24px target minimum.
- Page25 current inquiry → cancel → browser Back: exact submitted query/page/
  sort restored; absent row announces missing opener and focuses results heading.
  Forward obtains fresh already-cancelled context, no receipt/token restore or
  autosubmission.
- Lost response → UNKNOWN; reload remains quarantined. Switching to each
  native F1/F2/exit identity yields recovery with **zero native context,
  preparation or command requests**.
- Separate synthetic identity notice and native-looking TEST versus isolated
  simulation copy; native-looking DTOs here remain **test doubles**.

Measured no page overflow: at CSS viewport widths 1440/390/320, document widths
were 1425/375/305 respectively; visible management buttons minimum49px.
Additional 720px viewport with CSS zoom2 subset had document width705px.
RTL direction and reduced-motion preference were observed. CSV alone uses a
labelled keyboard-focusable horizontal table region.

Computed sRGB contrast subset: primary-button text **5.0006:1**, body text
**14.8763:1**, focus indicator **13.1701:1** against the sampled white surface.
Not a comprehensive contrast audit, browser-native zoom400% test, screen-reader
walkthrough, visual screenshot review or WCAG-conformance certification.

Browser-driver defects corrected during verification: full-page typed list
double incorrectly asserted `hasMore` with one row (corrected to25); cancel
reason selection lacked render synchronization; live-announcement assertion
needed signal-render synchronization. One run stalled on an unbounded CDP wait;
the owned session was explicitly stopped and its unique generated profile
removed. Driver now bounds CDP calls, uses specific UNKNOWN copy rather than
the pending “do not resend” phrase, and subsequent complete runs passed.
Node emits the existing typeless-package-module warning for the shared TS
browser driver; no frozen manifest was altered to silence it.

### Boundaries, pending checks and owners

- **Parent/B49:** backend remains a parallel implementation until parent
  SOURCE-STABLE. Actual Node HTTP/protocol-double integration, pure-preview
  zero-sequence/zero-write spies and real application/UoW CSV rollback/readback
  proof are **NOT RUN by U49**. UI HTTP mocks cannot prove backend atomicity.
- **Parent/operator/DBA:** O49 native effects/allowance/metadata packet and GO
  remain separate; no Oracle mutation/readback acceptance claimed.
- **Parent:** full Windows delivery pipeline, packaging/publication/status and
  release acceptance not run/touched by U49. Isolated output paths avoid
  overwriting the foundation snapshot.
- Existing complete F1/F2/exit browser command journeys were not rerun against
  foundation outputs and misrepresented as current-source proof. Current-source
  unit regressions/full suite and targeted real-Chrome uncertainty interlocks
  passed instead.
- All helpers used here are stopped; no detached server/watch process,
  SQL promise, screenshot output or raw CSV/result log is retained.

### Exact U49 changed source/document paths

Relative to `frontend/fixture-slice/`; generated `.angular/u49-*` build/cache
outputs are not source deliverables. No root status/report or package/lock/
Vitest/environment-checker files changed.

```text
README.md
VERIFICATION.md
checks/shift-management-browser-check.mjs
src/shift-management-contract.ts
src/shift-management-contract.spec.ts
src/shift-management-api.ts
src/shift-management-api.spec.ts
src/shift-management-fixtures.ts
src/shift-management-session.ts
src/shift-management-session.spec.ts
src/shift-management-page.ts
src/shift-management-page.html
src/shift-management-page.scss
src/shift-management-page.spec.ts
src/shift-management-dialog.ts
src/shift-management-dialog.html
src/shift-management-dialog.scss
src/shift-management-dialog.spec.ts
src/shift-management-history.spec.ts
src/shift-management-readviews.spec.ts
src/shift-management-native-interlock.spec.ts
src/contract.ts
src/routes.ts
src/view-history.ts
src/workspace-shell.ts
src/workspace-shell.html
src/current-shifts-page.ts
src/current-shifts-page.html
src/shift-search-page.ts
src/shift-search-page.html
src/my-shifts-page.ts
src/my-shifts-page.html
src/employee-card-page.html
src/attendance-page.ts
src/attendance-page.html
src/shift-day-page.html
src/stage-arrival-session.ts
src/station-arrival-session.ts
src/station-exit-session.ts
src/stage-arrival-page.ts
src/station-arrival-page.ts
src/station-exit-page.ts
src/native-read-views.spec.ts
```

## U49 Phase B — resumed actual-protocol browser integration (29 October 2026)

**Status: PASS for the four requested successful browser/native protocol flows.**
Approved UI/shared API baseline remains `49-v0.1`, including §49.10–49.12;
no public contract, product, dependency, schema or design changes.
The caller authorized the backend SOURCE-STABLE integration. Product inputs were
compared with published `133e8c5af1ed2166cc2cc6f87ced9f584863d724`:

```powershell
git --no-pager diff --name-only 133e8c5af1ed2166cc2cc6f87ced9f584863d724 -- frontend/fixture-slice/src backend/fixture-slice
```

Result: exit 0, no changed paths. Existing `.angular/u49-production/browser`
assets were reused, not rebuilt. Current worktree HEAD was later than the
requested publication; the product-source comparison, not HEAD equality, is
the basis for using those assets. Node `24.21.0`, installed Angular `21.2.25`
and Material `21.2.14` were inspected; no tooling selection/install occurred.

### Persisted checker and evidence boundary

Changed manifest, relative to `frontend/fixture-slice`:

- `checks/shift-management-protocol-browser-check.mjs` — new focused browser flows.
- `checks/owned-protocol-browser.mjs` — small owned CDP helper, reusing
  `physicalInput` and `waitForKeyboardModalReady` and existing Chrome patterns.
- `checks/shift-management-protocol-backend.mts` — integrated the cancelled
  worker's untracked helper; fixed zero-argument fixture factory typing, added a
  receipt accessor and protected physical-row assertions from dumping row data.
- `README.md`, `VERIFICATION.md` — execution/results/limits only.

The original typed HTTP-double management checker remains unchanged.
Source evidence: actual `server.mts` factory seam and shutdown;
pure `test/native-shift-management-runtime-double.mts` and
`test/oracle-shift-management-source-double.mts`; runtime `.test.mts` setup
read as text only (never imported); approved frontend API guards, templates,
dialog and shared contracts. Reverse-engineering baseline inspected; legacy
`old/SHF/src/bzq/shf/model/ShiftDataModel.java:7645–7665` read only for full-nine/
uppercase-X CSV behavior. Source contract catalog absent. No forbidden agent
brief/private configuration/environment publication/operator files read.

**Actual:** installed owned Windows Chrome, existing Angular production bundle,
user controls, actual HTTP/Node application, native admission/persistent
authority, 18-table source assembler, metadata/certificate validation,
locked UoW/snapshot, physical SQL double state, independent post-commit readback.
**Doubled:** Oracle/catalog/endpoint/OS operator packets, exclusively synthetic
through explicit read/native/resolveEndpoint factories. Environment is a
synthetic-only whitelist, not inherited process ENV. Native system clock used;
no fixture-clock override. Each operation has a fresh TEMP authority namespace
and browser profile; no consumed authority is reset.

The proxy preserves actual API bytes/status/security headers and Origin; it
never substitutes successful effects. No manually POSTed command is used.
The CSV file input receives synthetic in-memory bytes; all other editing,
selection, review/consents and command activation use keyboard/CDP interactions.

### Exact checks and results

All commands below except the Git comparison run from `frontend/fixture-slice`.

```powershell
node checks/shift-management-protocol-browser-check.mjs
```

Final saved-source execution: **PASS, exit 0**.

| UI operation | Commands | Commits | Sequence | Locks | Read leases | Physical days / overlays |
|---|---:|---:|---:|---:|---:|---:|
| Create | 1 | 1 | 1 | 1 | 6 | 1 / 0 |
| Activity-only change | 1 | 1 | 0 | 2 | 6 | 1 / 1 |
| Logical cancel | 1 | 1 | 0 | 2 | 6 | 1 / 1 |
| CSV two-row preview + whole apply | 1 | 1 | 2 | 1 | 7 | 2 / 0 |

Each world: two writer/probe leases, zero active SQL at completion, writer
closed before separate readback acquired/closed, consumed authority verified.
The one reported rollback per world is startup/probe cleanup, **not an
adversarial rollback test**. Preview/context/review/Escape preserved all rows
with zero sequence/locks/commits. Actual preparation before/after fields matched
every displayed review field. Confirmed unchecked consents, initial heading
focus, Escape focus restoration, Hebrew synthetic Administrator/no-credential-
verification label, separate employee context and RTL direction.
During an explicitly held native SQL call: no commit, no success, repeat
submission disabled. Final displayed verified receipt count and links matched
actual receipts; native `oracle-test-committed`, not replayed, no partner
invocation; base/source/overlay/minute/attendance semantics verified directly
against double committed state. CSV preview showed two valid rows before one
whole two-row commit; no partial apply UI or command was used.

```powershell
node node_modules/typescript/bin/tsc --noEmit --strict --target ES2024 --module NodeNext --moduleResolution NodeNext --typeRoots ../../backend/fixture-slice/node_modules/@types --types node --allowImportingTsExtensions --verbatimModuleSyntax --erasableSyntaxOnly checks/shift-management-protocol-backend.mts
node --check checks/owned-protocol-browser.mjs
node --check checks/shift-management-protocol-browser-check.mjs
node --check checks/shift-management-protocol-backend.mts
```

Final strict helper TSC and all syntax checks: **PASS, exit 0**.
Initial resumed helper TSC found three fixture-factory argument arity errors;
corrected inside the owned helper without touching backend code.

Optional mixed JS/backend compiler probe:

```powershell
node node_modules/typescript/bin/tsc --allowJs --checkJs --noEmit --strictNullChecks --target ES2024 --module nodenext --skipLibCheck --allowImportingTsExtensions --typeRoots ../../backend/fixture-slice/node_modules/@types --types node checks/shift-management-protocol-browser-check.mjs checks/owned-protocol-browser.mjs
```

**FAIL, exit 2; not a passing gate.** Initial checker nullability/shape errors
were repaired; the probe also traverses unchanged backend modules under flags
different from their strict owner configuration, reporting seven inference
diagnostics in `attendance-errors.mts`, `attendance-fixture.mts`,
`my-shifts-errors.mts`, `native-stage-arrival-config.mts`,
`oracle-attendance-reader.mts`, `shift-management-application.mts` and
`shift-search-errors.mts`. The last local nullable response-header assignment
was fixed afterward; this optional probe was not rerun afterward. Do not edit
backend files to satisfy this auxiliary command. Parent owns disposition;
the strict helper/import graph check above passes.

### Failures, exclusions and cleanup

Harness-only initial failures were fixed without relaxing business assertions:
proxy omitted upstream `nosniff` (UI correctly rejected it); identity assertion
expected English rather than approved Hebrew; ordinary preparation was tested
with CSV-only `state`; immediate selection raced a dynamically mounted cancel
reason control. The helper now condition-waits for a visible enabled control.
Final complete run passed; no product defect identified.

Expected warnings: Node's existing typeless `.ts` helper warning; explicit
TEST LIMITED METADATA COVERAGE waiver. Cross-owner triggers and role/PUBLIC
grants remain UNKNOWN: this does not certify database safety/full rollback.

Not rerun: unchanged 698 UI tests/full three-profile builds, prior Phase A
guards/geometry/Back checks, backend 225/1826 suites. Not covered by this
browser command: adversarial rollback, UNKNOWN/restart faults, absent/failed
identity matrix, full actor navigation, Windows-1255/reflow matrix (prior
Phase A evidence only), live Oracle/EMS, full project/delivery/UAT/WCAG or
release readiness. The inherited helper's optional fault/restart methods are
not invoked and are not claimed as executed evidence. Independent backend QA
owns rollback/adversarial coverage; parent owns aggregation/release decisions.

Every attempt ran `finally` cleanup. Final four worlds confirmed all owned
Chrome processes/profiles, loopback static/proxy and Node listeners, read/native
pools and TEMP authority directories closed/deleted; all leased connections
closed. No shared process/listener termination, raw CSV/body/credential logs,
screenshots, live driver/DNS/Oracle, legacy execution, EMS, schema or Git/lock
edits. Next action: parent review/aggregate this bounded Phase B evidence with
independent backend QA, not a native-live or production GO claim.

## TEST49-H04 / TEST49-H05 — bounded §49 harness repair (29 October 2026)

**Status: done, for parent review.** These are checker defects, not product
business defects. Caller-provided held product baseline `133e8c5` and status
follow-up HEAD reference `19c42a2` were not independently inspected with Git.
Approved UI/shared API baseline remains §49-v0.1, with §49.10/§49.11 “Agree 49”
and §49.12 clarification as recorded above; no contract changes.
Installed runtime was Node 24.21.0; existing Angular 21.2/TypeScript 5.9.3
tooling/declarations were reused without dependency or configuration changes.

### Exact changed manifest and source evidence

All paths below are under `frontend/fixture-slice/`:

- `checks/shift-management-protocol-backend.mts`: remove unsafe receipt
  double-cast. Reuse actual `src/shift-management-contract.ts`
  `managementIdentity`, `managementContext`, `draft`, `preparation`, `csvPreview`,
  `command` and `receipt` guards; keep typed validated observations. Receipt
  binding uses the actual command ID, context observation time and preparation
  effects, not fields taken on trust from the receipt. The narrow temporary
  `registerHooks` bridge follows `checks/shift-management-browser-check.mjs`.
- `checks/shift-management-protocol-browser-check.mjs`: forward observed JSON
  request/content-type to the observer without changing upstream bytes; replace
  the preparation JSDoc cast with the guard-validated typed return. All existing
  physical effects, displayed before/after, purity and readback assertions remain.
- `checks/owned-protocol-browser.mjs`: await `once(chrome, 'spawn')` inside the
  existing try; do not kill/wait for a missing PID or an already-signalled exit;
  put owned-profile removal in cleanup `finally`.
- `checks/owned-protocol-browser.test.mjs` (new): built-in Node test and isolated
  worker; replace only the worker's builtin spawn export using
  `syncBuiltinESMExports`, then call original spawn on a guaranteed-missing
  executable under the captured owned profile. Require ENOENT rejection,
  profile absence and natural worker exit. Parent bounds the historical failure
  and cleans the captured profile even when the worker fails.
- `README.md`: focused commands, guard reuse and isolated negative-test scope.
- `VERIFICATION.md`: this evidence/disposition.

No application/backend/shared-contract/dependency/tooling/Git/Docker edits.
Business behavior/legacy evidence is unchanged from the approved U49 baseline;
this follow-up's controlling implementation evidence is the existing frontend
guards and the owned-browser lifecycle, not new business-rule interpretation.
The reverse-engineering v1.0 baseline remains background evidence; the source
contract catalog is absent. No legacy execution or new live permission.

### Cheap negative check, static checks and exact failures

All commands below ran from `D:\AIProjects\SHFAI\frontend\fixture-slice`.

1. `node --test checks/owned-protocol-browser.test.mjs`
   - Before the H05 helper edit: **FAIL, exit 1**, 1 test / 0 pass / 1 fail,
     8119.5348 ms overall. The isolated worker failed to finish within its
     8-second bound and was terminated with SIGTERM; the assertion requiring
     natural exit failed. Parent cleanup removed the captured profile. This
     demonstrates a safely failing prior behavior, not a real-CDP result.
   - After the H05 edit: **PASS, exit 0**, 1 test / 1 pass / 0 fail,
     241.5494 ms overall; missing executable rejects ENOENT, profile absent,
     worker exits naturally without timer termination. No real Chrome launched.
   - Root cause: spawn errors lacked an early listener; unspawned-child exit
     waiting could stall and profile removal was skipped on close failure.
     The close-timeout branch is structurally protected by `finally`; a
     force-stuck real Chrome/locked-profile scenario was not separately induced.

2. Established strict command attempted with the newly imported frontend graph:

   ```powershell
   node node_modules/typescript/bin/tsc --noEmit --strict --target ES2024 --module NodeNext --moduleResolution NodeNext --typeRoots ../../backend/fixture-slice/node_modules/@types --types node --allowImportingTsExtensions --verbatimModuleSyntax --erasableSyntaxOnly checks/shift-management-protocol-backend.mts
   ```

   **FAIL, exit 2**: 85 module-format diagnostics (67 TS1287, 18 TS1295) in
   unchanged `src/contract.ts`, `src/current-shifts-contract.ts`,
   `src/shift-management-contract.ts` and `src/stage-arrival-contract.ts`.
   NodeNext/verbatim interprets these frontend `.ts` files as CommonJS, whereas
   the frontend uses bundler resolution and Node's existing checker bridge
   loads their ES syntax. No application/package changes made to silence this.

3. Strict targeted helper **and full imported guard/backend graph**:

   ```powershell
   node node_modules/typescript/bin/tsc --noEmit --strict --target ES2024 --module Preserve --moduleResolution Bundler --typeRoots ../../backend/fixture-slice/node_modules/@types --types node --allowImportingTsExtensions --verbatimModuleSyntax --erasableSyntaxOnly checks/shift-management-protocol-backend.mts
   ```

   **PASS, exit 0**. Only module/resolution flags differ from step 2; no
   strictness reduction, skipLibCheck, partial guard duplication or contract
   weakening. H04 root cause was receipt shape/outcome being treated as proof
   of the entire DTO via a double-cast, plus an unnecessary preparation cast.

4. Syntax checks, each **PASS, exit 0** (executed sequentially with success gates):

   ```powershell
   node --check checks/shift-management-protocol-backend.mts
   node --check checks/shift-management-protocol-browser-check.mjs
   node --check checks/owned-protocol-browser.mjs
   node --check checks/owned-protocol-browser.test.mjs
   ```

**Exact optional mixed-checkJs disposition:** the historical command recorded
above (`--allowJs --checkJs --noEmit --strictNullChecks --target ES2024 --module
nodenext --skipLibCheck --allowImportingTsExtensions --typeRoots
../../backend/fixture-slice/node_modules/@types --types node` on the protocol
browser and owned-browser `.mjs` files) previously **FAILED, exit 2**, including
the seven unchanged backend inference diagnostics named above under different
flags. It was not rerun after the prior final header correction, and was
**not rerun in H04/H05**. It is not claimed passed; no broad established-helper
repair attempted. Parent owns disposition of that optional auxiliary probe.
This is separate from step 2's newly observed NodeNext module-format failure.

### Exactly one actual four-flow browser regression

```powershell
node checks/shift-management-protocol-browser-check.mjs
```

**PASS, natural final exit 0**, using existing
`.angular/u49-production/browser`; no rebuild, manual command POST or canned
HTTP success. Actual Angular controls -> loopback byte-forwarding proxy ->
actual Node HTTP/application/native UoW -> independent guarded readback;
only injected Oracle/OS/endpoint protocol boundaries are synthetic doubles.

| Flow | UI commands | Commits | Sequence | Locks | Read leases | Write/probe leases | Physical days / overlays |
|---|---:|---:|---:|---:|---:|---:|---:|
| Create | 1 | 1 | 1 | 1 | 6 | 2 | 1 / 0 |
| Activity-only change | 1 | 1 | 0 | 2 | 6 | 2 | 1 / 1 |
| Logical cancel | 1 | 1 | 0 | 2 | 6 | 2 | 1 / 1 |
| CSV two-row preview/apply | 1 | 1 | 2 | 1 | 7 | 2 | 2 / 0 |

Each world: `fault=none`, `active=0`, `rollbacks=1` (probe/cleanup counter,
not adversarial rollback certification), independent readback true.
All four canonical preparation/receipt guard paths passed without weakening
the physical-row/before-after/purity assertions. Browser assertions also
verified Hebrew synthetic Administrator/no-credential-verification indication,
TEST marker, employee/identity separation, RTL, keyboard review/Escape focus
return, acknowledgments, pending/disabled/no-premature-success and receipt links.

Synthetic-only environment whitelist and **all** read/native/resolveEndpoint
factories remained explicitly injected. Native clock stayed real; no fixture
clock injection. Each world owned a fresh TEMP authority namespace; no consumed
namespace reset or real F1 fuse operation. All four cleanup messages completed:
owned Chrome/profile removal, loopback proxy/Node listener closure, read/native
pool and lease closure, authority TEMP deletion (helper asserts absence).
The negative test also confirmed profile absence. No retained service or
background browser work; successful regression exited without external kill.

Expected warnings only: existing Node typeless-helper reparsing and explicit
TEST LIMITED METADATA COVERAGE waiver. Cross-owner triggers/role/PUBLIC grants
remain UNKNOWN; no database-safety/full-rollback claim.

Not rerun: unchanged 698 frontend/1826 backend suites, full builds/profile
checks/ZIP, earlier Phase A matrix or full project checks. Not covered here:
absent/failed identity matrix, full actor navigation, adversarial faults,
native-live/Oracle/DNS/broker/EMS, full WCAG/UAT, release readiness. No private
config/publication ENV or credentials used for execution. No new product defect
or implementation blocker found. Parent owns review/aggregation and optional
probe disposition; next action is review these two bounded harness fixes.
