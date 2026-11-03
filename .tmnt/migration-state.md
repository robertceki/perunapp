# Codex migration - state reconciliation

Date: 2026-11-03
Repository: F:/Projects/perunapp
Branch: chore/migrate-claude-to-codex
Scope: migrate the execution environment; no application task resumption.

## FOUND - directly inspected

- Four roles have last-log pointers to existing repository session logs: Leonardo S1 (2026-06-27), Donatello S7 (2026-06-28), Michelangelo S18 (2026-06-28), Raphael S2 (2026-06-27). Their active pointers now use repository-relative paths.
- Leonardo's active_goal pointer now resolves locally to .tmnt/goal.md. That file is the 2026-06-27 audit-remediation PLAN ONLY goal, not the current Codex migration specification.
- Splinter remains current_session 1 with last_session_log marked pending. No Splinter log is present in the session-logs directory; no replacement was invented.
- Leonardo's current_session is 2, while the referenced last closed log is S1. No session counter was changed; that alone does not prove an error.
- The board headline says all substantive tasks are done, but T2 and T6 remain partial and T8 and T9 remain blocked in the task rows. Memory separately records T8/T9 completion. These are conflicting historical records, not a verified present-day backlog.
- Current package.json declares React, TypeScript, Vite, build and lint scripts. It has no test script. Historical Expo/Jest test results therefore do not establish current automated-test availability.
- No explicit per-task retry ledger was found in the inspected board and Leonardo memory. The migrated policy remains at most one automatic retry per task; prior usage is not established.

## INFERRED

- Role memories, the audit goal, and the board describe different historical stages. Automatically resuming them would risk dispatching obsolete work.
- Completed-task prose and historical verification claims need fresh repository evidence before reuse as current status.

## UNKNOWN - do not invent or reset

- Authoritative completion of the old partial/blocked tasks and any still-required live database/manual checks.
- A closed Splinter session log, current external user memory, and prior retry usage for legacy tasks.
- Full workflow equivalence and VS Code parity; existing CLI component checks do not establish either.

## Resume rule

Read this note with the role memory before resuming. Resolve pointers from the repository root. Keep original counters, historical statements, goal, board, and session logs intact.
Do not automatically execute the legacy goal or dispatch tasks from its board during migration. User instructions and the approved migration increment define current scope.
For a deliberately resumed legacy task, reconcile its latest goal, board row, implementation diff, verification, and retry evidence first. If prior retry usage cannot be established, surface it as unknown before redispatch; never reset it to zero by assumption.
A later workflow fixture must have explicitly isolated goal/board/evidence paths rather than overwrite these historical files.

## Verification

- Each repaired pointer was resolved to an existing file within this repository.
- Pointer edits were byte-local replacements; no newline, session-counter, or historical-content rewrite was performed.
- SHA-256 comparisons confirmed unchanged legacy goal, board, Splinter pointer, and all existing session logs during this step.
- No application code, database state, original role definitions, commit, push, or branch switch is part of this step.

## Accepted migration status — 2026-11-03

The controlled parent-launch workflow passed. The original actual IDE startup failed home discovery; a later explicitly parent-approved startup passed. The actual IDE canary was not blocked, so automatic IDE hook enforcement must not be relied upon. The user explicitly accepted this limitation. See .tmnt/runs/migration-final-status.md for current use and retained evidence. Temporary migration probes were removed at the user's request; do not resume them or reconstruct/reset their retry history. Legacy goal/board reconciliation requirements above remain unchanged.
