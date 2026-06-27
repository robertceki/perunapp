---
name: karpathy-method
description: The Karpathy three-layer build discipline (Spec → Verifier → Environment). Use at the START of any multi-step build to force a goal interview, measurable definition-of-done, and an external-signal verifier gate before anything is called "done". Pairs with the verify-gate PreToolUse hook.
license: MIT
---

# Karpathy Method — Three-Layer Build Discipline

A build harness, not a behavioral checklist. Where `karpathy-guidelines` shapes *how* you write each line, this skill governs *whether work is allowed to be called done*. Invoke it before starting any multi-step build.

The full, project-agnostic build prompt lives in [portable-prompt.md](portable-prompt.md) — paste it at the start of a build, or follow its three layers directly:

- **Layer 1 — Spec:** Interview for the *goal* (the decision the work supports), not just the deliverable. Bias to small compartmentalized specs. Mark every assumption `(inferred)` and stop the user on the ones that most change the design. Write a goal with explicit "Why / goal" and "Out of scope" sections.
- **Layer 2 — Verifier:** State precise, measurable definition-of-done *up front*. Pull external signal (build/tests/type-check green; real connection for deploys) — never self-certify. For complex builds, reconcile against a second model. If any of the three is missing, say `blocked: verification incomplete` and stop.
- **Layer 3 — Environment:** Keep CLAUDE.md defining how the repo works, skill routing, where knowledge lives, and hard rules. Promote anything done 3× into a skill. Enforce critical never-do items as tool-level guardrails (PreToolUse hook), not prose.

## Enforcement in this repo
Layer 2 is not honor-system here: the `git commit`/`git push` gate is enforced by `.claude/hooks/verify-gate.sh` (wired in `.claude/settings.json`). It blocks committing until a fresh `.claude/.verify-pass` marker exists. See the "Karpathy Method — Environment" section of [CLAUDE.md](../../../CLAUDE.md) for the working rules and never-do list.
