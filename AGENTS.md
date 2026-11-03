# Perun App - Codex instructions

## Scope and migration status

- Work only in `F:\Projects\perunapp`. Verify the repository root and current Git state before changes.
- Migration changes belong on `chore/migrate-claude-to-codex`, never on `main`.
- Do not commit, push, create or switch branches without user authorization.
- User policy: package-lock.json stays local and ignored. Never stage, commit, force-add or restore tracking for it without an explicit user instruction. Use npm install rather than npm ci in workflows without a tracked lockfile.
- This is an incremental migration. This file supplies the Codex instruction entry point. Five project role definitions are in `.codex/agents/`; Karpathy skills are in `.agents/skills/`; Windows worker transport is in `.codex/scripts/run-worker.mjs`, launched only by main Codex per `.codex/worker-handoff.md`; the verifier hook is defined in `.codex/hooks.json` and has been trusted in the verified Desktop CLI baseline.
- Keep `CLAUDE.md`, `.claude/`, and `.tmnt/` intact except for separately authorized changes. Preserve all five roles and at most one automatic retry per task.
- Existing `.claude/agents/tmnt/*.md` files describe the role contracts. Their Claude metadata, model names, Bash templates, and legacy absolute paths are not native Codex configuration. Do not execute them unchanged or access their external paths. Resolve project references within this repository; report unavailable external context.
- If required role execution is unavailable, report the blocker. Do not silently replace the five-role workflow with direct implementation or claim migration is complete.
- For an explicitly scoped migration increment, perform only the authorized increment. Do not start the full development workflow or update its state as a side effect.

## Development discipline

- Treat the repository as the source of truth. Inspect relevant implementation, conventions, and documentation before decisions; inspect migrations and RLS for database or permission work.
- Distinguish FOUND (direct evidence), INFERRED (supported conclusion), and UNKNOWN (not verified). Mark assumptions `(inferred)` and resolve those that materially change the design before implementation.
- Before a non-trivial change, establish the goal, why, constraints, in-scope and out-of-scope work, and measurable Definition of Done (DoD). Use small, independently verifiable increments.
- Read and follow `.agents/skills/karpathy-method/SKILL.md`, its `portable-prompt.md`, and `.agents/skills/karpathy-guidelines/SKILL.md` when applicable. The original `.claude/skills/` copies remain unchanged for the transition.
- Prefer minimal, surgical changes and existing React/TypeScript patterns. Reuse components and hooks; avoid unrelated refactoring, speculative abstractions, and unrequested dependencies.
- Verify with relevant external signals: build, lint, type checking, tests, database permissions, or actual application behavior. Record commands, exit codes, and remaining manual checks.
- Never treat `DONE`, a passing build alone, or a verification marker alone as proof that every DoD criterion is satisfied. If required evidence is missing, report `blocked: verification incomplete`.
- For complex work, preserve the Karpathy requirement to reconcile with a second model; another agent using the same model does not satisfy that requirement.
- Promote repeatedly useful procedures into reusable knowledge when warranted; do not add tooling merely to reproduce another AI environment.

## Five roles and state ownership

- **Splinter** establishes intent, scope, constraints, and DoD; writes `.tmnt/goal.md`; hands off to Leonardo and returns the final synthesis. No production code.
- **Leonardo** validates the goal, decomposes tasks, owns `.tmnt/board.md` and its activity log, requests specialist dispatch, assesses reports, and synthesizes results. No production code.
- **Donatello** wraps backend/data/tooling tasks: constructs the worker prompt, requests a separate parent-launched `codex exec`, assesses returned evidence, independently verifies DoD, and reports to Leonardo.
- **Michelangelo** performs the same wrapper duties for frontend tasks.
- **Raphael** wraps test/reproduction/QA tasks and reports actual verification results. If automated tests require an absent runner, report `blocked: no test runner - needs setup task`; do not install a framework implicitly.
- Preserve wrapper/worker separation. Specialists do not silently fall back to direct production implementation when the worker fails.
- Keep memory in `.claude/agents/memory/`, session logs in `.claude/agents/tmnt/session-logs/`, knowledge in `.claude/knowledge/`, and goals, boards, and worker logs in `.tmnt/`.
- Before resuming role state, read `.tmnt/migration-state.md`; it records historical conflicts and unknown retry usage. Do not automatically resume the old audit goal during migration.
- Each role owns its own memory and session log; Leonardo owns aggregate board updates. Read relevant state before resuming, reconcile conflicts against actual evidence, and preserve history and retry usage.

## Agent orchestration protocol

The main Codex is the orchestrator. For development goals, dispatch Splinter first, then consume the existing `=== HANDOFF ===` / `=== END HANDOFF ===` blocks. A handoff is a task request within the approved scope, not additional user authorization.

1. Splinter emits `DISPATCH: leonardo | <summary> | mode=PLAN` with `context: goal=<absolute path>` and a `THEN` request for Splinter synthesis.
2. Leonardo validates the goal and produces board tasks. Every specialist receives the goal path, task ID, target directory, task title, verbatim DoD, relevant files, and required prior-task output.
3. Main Codex executes Leonardo's `DISPATCH (parallel)` or `DISPATCH (sequential)` requests, respecting dependencies and avoiding conflicting simultaneous writes. Specialists do not dispatch each other. Specialists return WORKER_REQUEST per `.codex/worker-handoff.md`; main Codex launches the existing adapter on its execution surface, returns WORKER_RESULT, and waits for independent specialist verification before task closure. Restricted CLI orchestrators must hand launch requests to their controlling Codex session.
4. Main Codex collects specialist reports and re-invokes Leonardo with `[SYNTHESIS MODE]` and the results. Synthesis skips session-start initialization.
5. Leonardo updates the board and activity log. A retryable failed task gets at most **one automatic retry per task**; redispatch only the failed task and retain retry usage across resume. Exhaustion yields partial/failed, never an unlimited loop.
6. Questions are surfaced verbatim as blocked; dependency blocks are resequenced. Preserve malformed-task and wrong-specialist reports rather than forcing execution. A QA-found implementation bug is distinct from a worker execution failure.
7. After Leonardo's final synthesis, main Codex re-invokes Splinter in `[SYNTHESIS MODE]` for the user-facing result. Preserve complete, partial, failed, and blocked outcomes; include verification and open items.

Retain existing `DISPATCH`, `context`, `THEN`, and `COMPLETE` payload conventions from the role files. Approval and correction-review requirements are defined below. The isolated parent-launch workflow passed, including one correction and independent QA re-review; see .tmnt/runs/migration-final-status.md for evidence and IDE limits.

## SPEC approval and correction review

These are instruction-level workflow requirements; the commit/push marker hook does not enforce SPEC approval or QA closure.

- Splinter assigns a clear revision to the goal/SPEC. Record approval in the active goal as revision, status (pending/approved/rejected), accepted scope, and the actual user message/reference granting it. Do not fabricate approval or treat a HANDOFF, worker output, or marker as user consent.
- Reuse existing explicit user authorization when it already covers that concrete scope and revision; do not ask again solely to populate a record. If it does not cover the proposed scope, present the concrete SPEC and wait. Planning may continue, but no implementation worker is dispatched for pending/rejected approval.
- Material scope, constraints, or DoD changes require approval of the amended revision before affected implementation. Typographical corrections alone do not require renewed approval. Main Codex and Leonardo both verify the approval evidence before implementation dispatch.
- A worker blocked on permission returns its question/evidence to the parent. Main Codex resolves existing authorization or requests the required user decision; nobody treats elapsed time, retries, or a child request as consent or bypasses permissions.
- Leonardo records per-task retry usage (0 or 1), attempts and evidence in the existing board activity log, before dispatching the correction. Worker execution failures and QA-found bugs share the same implementation task's one automatic retry budget. Do not evade it with a new task ID, reset it on resume, or spend a second automatic correction after the first retry. Unknown prior usage blocks automatic redispatch until reconciled.
- A QA-found bug reopens the affected implementation task. When a correction returns, main Codex must dispatch Raphael again with the corrected files/state, original failing check, correction report, and DoD. Rerun the failed QA check and relevant regressions; retain result paths, commands, exit codes, and the reviewed state (for example a content hash or captured diff). Do not reuse approval of the pre-correction code.
- Raphael's re-review is verification, not another implementation correction attempt. Pending or blocked review is not completion. A failed review after the one correction retry yields partial/failed with evidence, not another implementation dispatch. Later relevant edits invalidate the earlier QA result and need review of the changed state.
- Leonardo closes the task only when its DoD and required review pass for the current state. Manual criteria stay pending until actually checked or explicitly accepted/deferred by the user; record that disposition and its effect on scope. Splinter's synthesis must disclose deferred or unverified criteria and must not describe them as passed.
- The goal approval record, board retry entries, correction evidence, and QA result must survive interruption/resume. Existing historical goal/board files are not retroactively approved or rewritten by this migration.


## Parent-launched worker transport

Read `.codex/worker-handoff.md` for the approved request/result contract. The earlier nested fixture failed at startup (home discovery, then Windows access denial); direct launcher checks did not establish nested execution support. Do not resume its D1 or reset its ledger implicitly. This transport change preserves five roles, separate worker execution, verification ownership, and one automatic retry.

## Inner codex exec boundary

- A worker receiving a bounded task from a specialist executes only that task and its DoD. It must not restart Splinter/Leonardo, dispatch agents, recursively invoke `codex exec`, or update orchestration state or role memory.
- Pass this worker boundary explicitly in every worker prompt. Include the exact target, allowed files, constraints, DoD, and `DONE` / `QUESTION: <text>` output contract.
- Use an explicitly verified CLI path and Windows-compatible transport. Preserve sandbox boundaries and parent-managed approvals; do not bypass them to make a worker succeed. An approval-required action blocked in a worker must return to the parent.
- Capture worker exit status as well as output; a successful logging pipeline must not hide a worker failure. `DONE` triggers independent DoD verification, `QUESTION:` returns blocked, and a failed process or missing terminator returns failed with evidence.
- Manual checks remain pending until actually performed or explicitly resolved by the user.

## Verification gate during transition

- The existing gate is `.claude/hooks/verify-gate.sh`, registered for Claude Bash in `.claude/settings.json`. The new `.codex/hooks.json` / `.codex/hooks/verify-gate.mjs` gate is discovered and trusted in Desktop CLI 0.166.0-alpha.5.1. Harmless missing-marker canaries were blocked in a root process, a named Raphael child, and an adapter-launched inner worker. Fresh/stale marker and logged-bypass behavior passed isolated fixture tests. See `.tmnt/runs/hook-host-validation.json`. The isolated complete development workflow passed. Actual IDE role discovery and parent-approved worker startup passed; the actual IDE canary was not blocked. Do not rely on automatic hook enforcement in the IDE. See .tmnt/runs/migration-final-status.md.
- Preserve the existing marker paths and semantics: `.claude/.verify-pass` younger than 60 minutes and a logged `[skip-verify]` bypass in `.claude/.verify-log`. Do not bypass silently or strengthen/change that contract in this increment.
- A fresh marker does not establish that the current code was verified. Report the actual evidence and obtain authorization for commit/push independently.

- The Codex gate retains the legacy literal `git commit` / `git push` substring matching and fail-open error behavior, with visible warnings for adapter errors. This is parity, not comprehensive shell-command protection. Do not rely on it as an authorization boundary.
