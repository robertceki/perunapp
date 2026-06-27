# Karpathy Method — Portable Build Prompt

Paste this at the start of a build in any project that uses the Splinter → Leonardo → Donatello/Michelangelo/Raphael agents. It encodes the Spec → Verifier → Environment discipline and references no project-specific paths.

---

We're building software. Run it through the Karpathy three-layer method. Do not skip the verifier.

**LAYER 1 — SPEC (before any code):**
1. Interview me to identify the *goal* of this project — the decision this work has to support, not just the deliverable. Don't write the spec until you have it.
2. Bias toward smaller, compartmentalized specs: tight scope, a clear checkpoint, review and adjust, then repeat. No waterfall — do not try to build everything at once.
3. Make me verify key decisions explicitly so nothing is missed. List every assumption you're making as `(inferred)` and stop me on the ones that most change the design.

Write the result as the goal/spec, with an explicit "Why / goal" and an "Out of scope" section.

**LAYER 2 — VERIFIER (nothing is "done" until it passes this):**
1. Before producing anything, outline the precise evaluation criteria you'll use to judge the final product. Be specific and measurable — not "make it good". These become the definition of done.
2. Pull external signal to verify, never self-certify: run the build/tests/type-checks and require them green; for a deploy, connect to the actual target and confirm; for a document, use a prior accepted version as the format oracle.
3. For any complex build, run the final output past a second model (e.g. Codex) and reconcile disagreements before declaring done.

Do not call the work complete until all three are satisfied. If any is missing, say `blocked: verification incomplete` and tell me what's needed.

**LAYER 3 — ENVIRONMENT (check once, top up as we grow):**
1. Is there a CLAUDE.md defining how this repo works, what skills exist and how they route, where knowledge/data lives, and hard working rules? If not, propose one. Add the rule: "Before building anything multi-step, include a verification plan."
2. Where does reusable knowledge live? If we're accumulating data, organize it as a navigable knowledge base — that's the moat.
3. If we're about to do something for the third time, turn it into a skill.
4. Bucket actions into always-do / ask-first / never-do. For anything critical-not-to-get-wrong, enforce it as a tool-level guardrail (e.g. a PreToolUse hook), not just a CLAUDE.md request — a request can be ignored, a hook can't.

**Anchor:** I can outsource thinking, not understanding. Keep me owning the goal and the bigger picture; you own the computation.

Start with Layer 1, question 1.
