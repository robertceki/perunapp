#!/usr/bin/env bash
# Karpathy Layer-2 verifier gate (PreToolUse on Bash).
# Blocks `git commit` / `git push` until a FRESH verification marker exists,
# making "external signal, not self-report" physical rather than honor-system.
#
# Clear the gate after the green signal runs:
#     echo "criteria + what went green" > .claude/.verify-pass
# Trivial change? Put [skip-verify] in the git command — it is LOGGED, not silent.
set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

input="$(cat)"
cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // ""' 2>/dev/null)"

# Only gate done-class actions.
case "$cmd" in
  *"git commit"*|*"git push"*) : ;;
  *) exit 0 ;;
esac

# Escape hatch for trivial work — allowed, but recorded so the bypass is visible.
if printf '%s' "$cmd" | grep -q '\[skip-verify\]'; then
  printf '%s skip-verify: %s\n' "$(date -u +%FT%TZ)" "$cmd" >> .claude/.verify-log 2>/dev/null || true
  exit 0
fi

marker=".claude/.verify-pass"
if [ -f "$marker" ] && [ -n "$(find "$marker" -mmin -60 2>/dev/null)" ]; then
  exit 0
fi

cat >&2 <<'MSG'
blocked: verification incomplete (Karpathy Layer 2)

No fresh .claude/.verify-pass marker (< 60 min). Before commit/push:
  1. State the measurable definition of done.
  2. Run the green signal (build / tests / type-check) and confirm it passes.
  3. Record it:  echo "criteria + what went green" > .claude/.verify-pass
Trivial change with no buildable surface? Add [skip-verify] to the command (logged).
MSG
exit 2
