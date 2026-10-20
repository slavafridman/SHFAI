---
description: "Use at session start, after every Shifter project step, on approval or blocker changes, and before reporting completion; maintain the resumable project status checkpoint."
applyTo: "**"
---

# Resumable project state

- At the start of project work, read `docs/PROJECT_STATUS.md`, then the referenced
  brief, project instructions and relevant approved design. Reconcile the
  checkpoint with actual Git state; preserve unrelated user edits.
- At the end of every completed, failed, blocked or approval-gated step, update
  `docs/PROJECT_STATUS.md` before reporting completion and before the step's
  authorized scoped commit/push. Apply this to design and verification steps too.
- Record the step ID/state, approved artifact/version/scope, changed paths,
  actual checks and outcomes, not-run checks, blockers with owners, and the exact
  next safe action. Distinguish historical evidence from current verification.
- Keep one current resume section. Link the source-backed design and existing
  reports instead of duplicating catalogs. Preserve approval boundaries:
  a fixture success or generic continuation is not native DML/release approval.
- Record feature commit references and publication state without a self-commit
  hash loop. Verify remote synchronization when publication is authorized;
  report failures honestly and do not stage unrelated files.
- Never put credentials, real-person records/screenshots, private test-row keys,
  tokens or fingerprints in the checkpoint. Respect content exclusions without
  alternate access or reconstruction.
- Subagents return checkpoint facts to the orchestrator. The orchestrator
  serializes checkpoint edits; parallel artifact owners must not overwrite one
  another's state. If interrupted, write a blocked/running handoff with the
  missing prerequisite and resume action, not an invented success.
