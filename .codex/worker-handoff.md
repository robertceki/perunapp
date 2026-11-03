# Parent-launched worker handoff

Approved transport change: the user answered "da" to moving the worker-launch operation to main Codex while preserving five roles, specialist-owned prompts/verification, a separate worker, and at most one automatic retry per implementation task.

## Specialist request

Do not run the adapter or nested CLI from a specialist shell. Validate the dispatched task and write a new request JSON in the active task's evidence directory under .tmnt/runs. Preserve earlier requests/results. Treat this as awaiting_worker, not done, failed, or an automatic retry.

Required request fields:

- requestId: unique within this task/attempt; never reuse an executed request.
- role: donatello, michelangelo, or raphael.
- task: original board task ID; phase: initial or correction; retryUsed: the current recorded board value (0 or 1).
- repository: F:/Projects/perunapp.
- goal, board, specRevision: actual current paths and approved revision, plus approvalEvidence referring to the real user authorization.
- allowedFiles: exact permitted worker output files inside the repository.
- dod: original task DoD, verbatim; prompt: the full bounded worker prompt from your role template, including allowed files, constraints, DoD and DONE / QUESTION output contract.

Do not put executable launch code, arbitrary CLI flags, or a substitute executable in the request. Do not store credentials. The parent interprets fields as data and reviews them against the actual approved task.

Return the existing HANDOFF envelope with a worker request rather than a specialist dispatch:

```text
=== HANDOFF ===
WORKER_REQUEST: <absolute request JSON path>
context: task=<original ID>, role=<your role>, phase=<initial/correction>, retry_used=<0/1>
THEN: return the actual adapter result to this specialist for independent verification
=== END HANDOFF ===
```

## Main Codex execution

Main Codex consumes WORKER_REQUEST on its own execution surface; a separate CLI orchestrator inside a restricted shell must return the request to its controlling Codex session, not attempt another nested launch. No new scheduler or permission bypass is introduced.

1. Read the request once as data and retain that same in-memory object for validation and launch. Compute SHA-256 over the exact request bytes, bind it to requestId, role, original task, phase and originating specialist, and record them before launch. Do not reload a different payload after review. Check its role, original task ID, allowed files, repository, DoD, SPEC approval/revision and retry count against the actual goal/board. Reject conflicting or unapproved scope. Track requestId, request hash, phase and launch state in board/evidence before launch; never launch a request twice after resume. Unknown launch state or a hash/identity mismatch is blocked until reconciled, not permission to re-execute.
2. Use the verified Desktop CLI path below and existing run-worker adapter, from the repository root. Request normal parent-managed permission if that execution surface needs it. If denied/unavailable, return blocked with evidence; never change sandbox boundaries to force success.
### Windows IDE parent permission boundary

The actual IDE startup probe failed with home discovery when tools.exec_command omitted sandbox_permissions (default use_default). The adapter's --sandbox flag applies only to the worker, not to the shell launching the adapter.

For this verified Windows IDE surface, main Codex must request the launch through the tool's supported parent approval mechanism: tools.exec_command with sandbox_permissions="require_escalated" and a concrete justification for the bounded adapter launch. This is a normal per-command approval request, not a worker CLI bypass. Keep the worker's approved read-only/workspace-write sandbox unchanged. Do not modify HOME, CODEX_HOME, USERPROFILE, persistent settings, or hook trust to force startup. Do not use dangerous bypass flags.

If the parent tool does not support this request or approval is denied/unavailable, return blocked with evidence. Do not emulate approval, rerun automatically, or consume/reset a task retry without Leonardo's existing ledger. Preserve the original failed attempt. A separately identified no-tools startup diagnostic is not an application correction and must not be presented as completing the failed task.

3. Load the prompt from JSON and pipe it as UTF-8; do not interpolate it into shell source or evaluate request text. Compare the prompt allowed-file list, DoD and worker boundary against its structured fields and approved task before launch. The approved baseline uses workspace-write and the existing network-enabled worker contract; dependencies still need task authorization. No dangerous sandbox/approval/trust bypass flags.

```powershell
# Main Codex only, from F:/Projects/perunapp.
# Read once, review the same $request below, bind its SHA-256/requestId and record launch state before invocation.
$request = Get-Content -Raw -LiteralPath '<reviewed request JSON path>' | ConvertFrom-Json
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$request.prompt | node .codex/scripts/run-worker.mjs --cli 'C:\Users\rober\AppData\Local\OpenAI\Codex\bin\22cfb1d302613eae\codex.exe' --role $request.role --task $request.task --sandbox workspace-write --timeout-ms 900000
$adapterExit = $LASTEXITCODE
```

4. Return requestId, exact request SHA-256, originating specialist and the unaltered adapter JSON, adapter exit code, actual worker exit, finalPath/eventsPath/stderrPath and requestId to the original specialist in WORKER_RESULT context. Keep all attempt evidence. Do not report success on behalf of the specialist.
5. The specialist must match requestId, request SHA-256, task/phase and returned evidence paths to its pending authored request before accepting the result. A mismatch is blocked. The specialist reads the evidence, independently executes its DoD and reports to Leonardo. A verify/DONE transport response means verification required; QUESTION means blocked; nonzero exit, timeout or missing terminator means failed. Manual checks stay pending. If the specialist's DoD tool requires permission unavailable there, return that requirement to the parent and independently assess the actual returned evidence; do not claim an unperformed check.
6. Leonardo owns retry decisions and records use before the single correction dispatch. Launch transport does not add another retry budget or reset an existing one. Failed historical fixtures remain failed evidence; new acceptance fixtures must be explicit, isolated and must not disguise retries of application tasks.

The adapter writes each worker's response.md, events.jsonl and stderr.log in a fresh .tmnt/runs/<task>-<role>-*/ directory. Capture the worker thread ID from thread.started when present. On timeout inspect partial changes and cleanup evidence before any retry. The commit/push hook contract remains unchanged.
