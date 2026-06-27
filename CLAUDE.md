# Project: PerunApp (working name)

## What this is
<!-- TODO: one-paragraph description of the product. -->

## Target user
<!-- TODO: who it's for. -->

## Scope (what to build)
<!-- TODO: MVP scope as a numbered list. -->

## Explicitly OUT of scope for MVP
<!-- TODO: list the tempting things you are deliberately NOT building yet. -->

## Coding conventions
- TypeScript strict mode (adjust to the chosen stack)
- Keep core logic isolated and unit-testable (no UI/DB coupling)
- Small, reviewable commits; explain each change before making it

## Karpathy Method — Environment (Layer 3)
This repo runs the Karpathy three-layer build discipline. How it routes:

**Skills (in `.claude/skills/`, model-invoked by description):**
- `karpathy-method` — invoke at the START of any multi-step build. Drives the
  Spec → Verifier → Environment loop and the definition-of-done.
- `karpathy-guidelines` — behavioral rules for writing/reviewing each change
  (simplicity, surgical edits, surface assumptions).

**Where knowledge lives:** `.claude/knowledge/` is the durable knowledge base
(design decisions, taxonomy, progression rules, ruled-out dead-ends). Add to it
rather than re-deriving. See `.claude/knowledge/README.md`.

**Hard rules (always-do):**
- Before building anything multi-step, include a verification plan
  (measurable definition-of-done + the green signal you'll run).
- State assumptions explicitly as `(inferred)`; stop the user on the ones that
  most change the design before writing code.
- If about to do something for the third time, turn it into a skill.

**Verifier gate (enforced, not optional):** `git commit`/`git push` are blocked
by the `.claude/hooks/verify-gate.sh` PreToolUse hook until a fresh
`.claude/.verify-pass` marker exists (written after the green signal runs).
This is the physical form of "external signal, not self-report."

**Never-do (ask first):**
- Never declare work "done" without external signal green — say
  `blocked: verification incomplete` instead. (Enforced by the hook above.)
- Never bypass the verifier gate silently. The only sanctioned bypass is
  `[skip-verify]` in the git command, which is logged to `.claude/.verify-log`.

## Agent orchestration (TMNT pod)
Coding/planning work routes through the TMNT pod in `.claude/agents/tmnt/`:
- **splinter** (sensei) — turns intent into a written goal; hands off to leonardo.
- **leonardo** (lead) — decomposes the goal, dispatches specialists, runs the verifier gate.
- **donatello** (backend), **michelangelo** (frontend), **raphael** (QA) — Codex wrappers
  that do the actual code work and verify the definition-of-done.

Agent persistent memory is **isolated to this project**
(`.claude/agents/memory/`) — these agents read/write their memory here, so
PerunApp keeps its own session history independent of other projects.
