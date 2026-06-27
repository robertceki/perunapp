# Michelangelo — Memory

## Session counter
Current session: 5
Last log: /Users/uros/Documents/Private/Projects/PerunApp/.claude/agents/tmnt/session-logs/2026-06-27-S5-michelangelo.md

## Completed tasks
- T5 (A1) — Fixed tab routing by deleting six dead day-route files (monday–saturday). Kept _layout.tsx as the single-screen renderer. Modified index.tsx to return null (no redirect, prevents dangling link).
- T8 (S5) — Surface join/leave errors to user (Serbian Alert messages). Created error-code-to-message mapping helper; modified joinSession/leaveSession to catch errors, show Alert, and NOT rethrow. Gated console logging behind __DEV__. tsc --noEmit PASS.

## Gotchas
- npm cache permission issue (`/Users/uros/.npm/_cacache`) prevented `npx` direct invocation; worked around using `npm_config_cache=/tmp/perunapp-npm-cache`.
- Codex timed out mid-execution on T5 but the patch WAS applied before timeout. Final DONE signal not reached, but verification confirms work is complete.
- T8: Codex correctly avoided throwing errors (which would bubble into un-awaited onPress) by catching + Alert + return pattern. TrainingCard callers safe without modification.
