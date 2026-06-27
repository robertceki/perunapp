Reading additional input from stdin...
OpenAI Codex v0.142.0
--------
workdir: /Users/uros/Documents/Private/Projects/PerunApp
model: gpt-5.5
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR] (network access enabled)
reasoning effort: high
reasoning summaries: none
session id: 019f07f3-af7f-79d1-95fb-709fa86f41c0
--------
user
TASK: D4 — Add lint/format/CI config

CONTEXT
Goal file: /Users/uros/Documents/Private/Projects/PerunApp/.tmnt/goal.md
Working directory: /Users/uros/Documents/Private/Projects/PerunApp
Files to consider (read these before changing anything):
- package.json
- package-lock.json

CODING CONSTRAINTS (non-negotiable)
- Simplicity first: minimum code that solves the problem. No speculative features.
- Surgical changes: touch only files listed above, plus any new files explicitly required by the task. Do not refactor adjacent code.
- Match existing style and conventions in this codebase.
- No new dependencies unless the task explicitly requires one.
- If anything is unclear, output a line starting "QUESTION:" and stop without writing code.

DEFINITION OF DONE
1. Add ESLint + Prettier devDependencies: eslint, eslint-config-expo, prettier, eslint-config-prettier. Run npm install.
2. Create eslint.config.js (flat config, ESLint 9+ style for Expo SDK 54 — check eslint-config-expo docs for format).
3. Create .prettierrc (minimal config).
4. Add npm scripts: "lint": "eslint ." and "format": "prettier --write ." — keep existing "test": "jest" intact.
5. Create .github/workflows/ci.yml that runs on push/PR: npm ci, npx tsc --noEmit, npm test, npm run lint. Use actions/checkout@v4 + actions/setup-node@v4 (node 20 or 22).
6. Verify: npx eslint . runs without crashing (warnings OK).

Output: produce the code changes. Then on the last line write: "DONE" or "QUESTION: <text>".
codex
I’ll inspect the goal and package metadata first, then verify Expo’s current flat-config format before making only the requested configuration changes.
exec
/bin/zsh -lc "sed -n '1,240p' .tmnt/goal.md && sed -n '1,240p' package.json && sed -n '1,160p' package-lock.json && git status --short" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
# Goal: PerunApp audit remediation — PLAN ONLY

**Date:** 2026-06-27
**Splinter session:** 1
**Target project:** /Users/uros/Documents/Private/Projects/PerunApp

## What we're building
A prioritized remediation plan (a task board) that turns the findings in
`AUDIT.md` into concrete, owned, verifiable engineering tasks. This is a
**planning deliverable only** — Uros has explicitly said "plan what has to be
fixed before we fix anything." No production code is to be written in this pass.

## Why
A full security / code-quality / dependency sweep (see `AUDIT.md`) surfaced
2 Critical, 5 High, 8 Medium findings plus cleanup. The two blocking-class
issues are: (S1) authorization is enforced only on the client and relies
entirely on Supabase RLS that we cannot see from the repo, and (A1) the tab
routing never renders `<Slot>`, so the six per-day route files are dead code.
Before touching anything we need a sequenced, costed plan.

## Constraints (must hold)
- **No production code changes in this pass.** Output is `board.md` only.
- Every finding in `AUDIT.md` (S1–S5, A1–A9, D1–D5) must map to at least one
  board task OR be explicitly listed as "deferred/tracked" with a reason.
- Each task must name in-bounds files and a verifiable Definition of Done.
- Respect phasing in AUDIT.md §4: Phase 1 = must-fix (S1, S3/S4, A1);
  Phase 2 = hygiene (S2, S5); Phase 3 = quality (A3, A4/A5, A2/A6/A7/A9, D2/D3/D4).
- Treat the client as untrusted; security fixes must be server-side (DB/RLS),
  not JS-only. (inferred — standard Supabase practice)

## Out of scope (explicitly not touching)
- Writing or editing any `.ts`/`.tsx`/SQL/config source files.
- Running `npm audit fix --force` or any dependency upgrade (D1 is track-only).
- The `.env` history scrub (only the public anon key is present today).
- Any new feature work beyond the audit findings.

## Open questions (blockers for executing Phase 1, NOT for producing the plan)
1. Are Supabase RLS policies enabled on `sessions`, `session_participants`,
   `profiles`? Can we get schema/policy read access? (Determines whether S1 is
   "verify" vs "build from scratch.")
2. Routing intent: delete the dead day-route files (recommended) vs. convert to
   real per-day routes? (A1)
3. "Weekly" limit semantics: Mon–Sun, rolling 7 days, or gym-defined? (S4)
4. Is there an admin/coach role, or member self-book only?

The plan must account for #1 by producing BOTH a "verify RLS" task and a
"implement RLS + server-side enforcement" task, gated on the answer.

## Definition of done
- `.tmnt/board.md` exists.
- Every AUDIT.md finding (S1–S5, A1–A9, D1–D5) appears in the board mapped to a
  task with an owner (Donny/Mikey/Raph), a verifiable DoD, and a Blocked-by /
  phase column — or is listed under a "Deferred / tracked" note with a reason.
- The four open questions above are carried into the board's Notes as Phase-1
  gates.
- No source files under `src/`, `app/`, or config were modified (verify:
  `git status --short` shows only `.tmnt/`, `AUDIT.md`, `.gitignore` changes).

## Revision 2026-06-27 — Phase-1 gate answers from Uros
The four open questions are now answered. This unblocks Phase 1 planning; the
board's blocked-by reasons tied to these gates are resolved.
1. **RLS visibility:** Uros will grant Supabase project/DB read access. T1
   (verify) proceeds once access lands; T2 scoping ("harden" vs "build") follows
   T1's findings.
2. **Routing intent:** **Delete** the six dead day-route files + `index.tsx`
   redirect (option a). Keep the single-screen + day-filter approach. T5 is now
   unblocked (pure deletion + verify).
3. **Weekly-limit semantics:** **Monday–Sunday calendar week.** Limit resets
   each Monday. T3/T4 build against this definition.
4. **Admin/coach role:** **Planned but not yet.** Design RLS member-self-book
   only for now, but structure policies so an elevated admin branch can be added
   later without a rewrite. T2 proceeds member-only.

Still required before T1 can actually run: Uros must grant the Supabase access.

## Revision 2026-06-27 (b) — Weekly-limit reset clarified (CORRECTS gate answer #3)
Uros: "Weekly limit for user should be reset on Sunday 00:00."
This supersedes the earlier "Monday–Sunday (resets Monday)" answer.
- **Week window = Sunday 00:00:00 → Saturday 23:59:59** (a Sunday-start week).
- Count resets at the boundary **Sunday 00:00**.
- Timezone: (inferred) the gym's local timezone — likely Europe/Belgrade given the
  Serbian UI strings. **CONFIRM with Uros** before T3/T4 are built; a UTC-vs-local
  mismatch would reset the limit at the wrong local hour.
- Affects T3 (RPC weekly count) and T4 (week filter) only. No effect on the
  current cleanup batch.

## Hand-off to Leonardo
Decompose `AUDIT.md` into a phased remediation `board.md`. This is a planning
pass — produce the board, do NOT dispatch specialists to write code. End your
synthesis with the board summary and the open questions so Splinter can take
them back to Uros for the Phase-1 gate decision.
{
  "name": "peruntreningcentar",
  "main": "expo-router/entry",
  "version": "1.0.0",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "jest"
  },
  "jest": {
    "preset": "jest-expo"
  },
  "dependencies": {
    "@expo/vector-icons": "^15.0.3",
    "@react-native-async-storage/async-storage": "2.2.0",
    "@react-navigation/native": "^7.1.8",
    "@supabase/supabase-js": "^2.106.2",
    "expo": "~54.0.33",
    "expo-constants": "~18.0.13",
    "expo-font": "~14.0.11",
    "expo-linking": "~8.0.11",
    "expo-router": "~6.0.23",
    "expo-splash-screen": "~31.0.13",
    "expo-status-bar": "~3.0.9",
    "expo-web-browser": "~15.0.10",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-native": "0.81.5",
    "react-native-reanimated": "~4.1.1",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
    "react-native-url-polyfill": "^3.0.0",
    "react-native-web": "~0.21.0",
    "react-native-worklets": "0.5.1"
  },
  "devDependencies": {
    "@testing-library/react-native": "^13.3.3",
    "@types/react": "~19.1.0",
    "jest-expo": "~54.0.17",
    "react-test-renderer": "19.1.0",
    "typescript": "~5.9.2"
  },
  "private": true
}
{
  "name": "peruntreningcentar",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "peruntreningcentar",
      "version": "1.0.0",
      "dependencies": {
        "@expo/vector-icons": "^15.0.3",
        "@react-native-async-storage/async-storage": "2.2.0",
        "@react-navigation/native": "^7.1.8",
        "@supabase/supabase-js": "^2.106.2",
        "expo": "~54.0.33",
        "expo-constants": "~18.0.13",
        "expo-font": "~14.0.11",
        "expo-linking": "~8.0.11",
        "expo-router": "~6.0.23",
        "expo-splash-screen": "~31.0.13",
        "expo-status-bar": "~3.0.9",
        "expo-web-browser": "~15.0.10",
        "react": "19.1.0",
        "react-dom": "19.1.0",
        "react-native": "0.81.5",
        "react-native-reanimated": "~4.1.1",
        "react-native-safe-area-context": "~5.6.0",
        "react-native-screens": "~4.16.0",
        "react-native-url-polyfill": "^3.0.0",
        "react-native-web": "~0.21.0",
        "react-native-worklets": "0.5.1"
      },
      "devDependencies": {
        "@testing-library/react-native": "^13.3.3",
        "@types/react": "~19.1.0",
        "jest-expo": "~54.0.17",
        "react-test-renderer": "19.1.0",
        "typescript": "~5.9.2"
      }
    },
    "node_modules/@0no-co/graphql.web": {
      "version": "1.2.0",
      "resolved": "https://registry.npmjs.org/@0no-co/graphql.web/-/graphql.web-1.2.0.tgz",
      "integrity": "sha512-/1iHy9TTr63gE1YcR5idjx8UREz1s0kFhydf3bBLCXyqjhkIc6igAzTOx3zPifCwFR87tsh/4Pa9cNts6d2otw==",
      "license": "MIT",
      "peerDependencies": {
        "graphql": "^14.0.0 || ^15.0.0 || ^16.0.0"
      },
      "peerDependenciesMeta": {
        "graphql": {
          "optional": true
        }
      }
    },
    "node_modules/@babel/code-frame": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/code-frame/-/code-frame-7.29.7.tgz",
      "integrity": "sha512-Aup7aUOfpbAUg2ROOJN6Iw5f9DMBlzu0mIkm/malLQFN/YQgO48wCj0Kxa3sEHJvPVFg7siR+qRInwXd2qhQKw==",
      "license": "MIT",
      "dependencies": {
        "@babel/helper-validator-identifier": "^7.29.7",
        "js-tokens": "^4.0.0",
        "picocolors": "^1.1.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/compat-data": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/compat-data/-/compat-data-7.29.7.tgz",
      "integrity": "sha512-locTkQyKvwIEgBzVrn8693ebc97F2U8ZHjbXwDXJ5Fn2TCpNwTlKcaKLkdHop5c/icOFE7qt7Q9JC5hnKNa6Gg==",
      "license": "MIT",
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/core": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/core/-/core-7.29.7.tgz",
      "integrity": "sha512-RgHBCvtjbOK2gXSNBNIkNoEc9qoVEtau3hj8gEqKQuL3HZAibKarWFEI3Lfm6EYKkLalOh8eSrj9b+ch9H/VBA==",
      "license": "MIT",
      "dependencies": {
        "@babel/code-frame": "^7.29.7",
        "@babel/generator": "^7.29.7",
        "@babel/helper-compilation-targets": "^7.29.7",
        "@babel/helper-module-transforms": "^7.29.7",
        "@babel/helpers": "^7.29.7",
        "@babel/parser": "^7.29.7",
        "@babel/template": "^7.29.7",
        "@babel/traverse": "^7.29.7",
        "@babel/types": "^7.29.7",
        "@jridgewell/remapping": "^2.3.5",
        "convert-source-map": "^2.0.0",
        "debug": "^4.1.0",
        "gensync": "^1.0.0-beta.2",
        "json5": "^2.2.3",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      },
      "funding": {
        "type": "opencollective",
        "url": "https://opencollective.com/babel"
      }
    },
    "node_modules/@babel/generator": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/generator/-/generator-7.29.7.tgz",
      "integrity": "sha512-DkXD5OJQaAQIdZ1bt3UZdEnHAn9Imd3IVBdX03UFe+ony9Ojw5pzr9YVKGDY1jt+Gcn/FnGkNf8r+Vj5NOJWtQ==",
      "license": "MIT",
      "dependencies": {
        "@babel/parser": "^7.29.7",
        "@babel/types": "^7.29.7",
        "@jridgewell/gen-mapping": "^0.3.12",
        "@jridgewell/trace-mapping": "^0.3.28",
        "jsesc": "^3.0.2"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-annotate-as-pure": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-annotate-as-pure/-/helper-annotate-as-pure-7.29.7.tgz",
      "integrity": "sha512-OoK6239jHPuSQOoS0kfTVKn0b/rVTk0seKq4Gd2UMLtmOVLjDC0ki3e+c90Trqv2gMfvJFqkiljrr568+qddiw==",
      "license": "MIT",
      "dependencies": {
        "@babel/types": "^7.29.7"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-compilation-targets": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-compilation-targets/-/helper-compilation-targets-7.29.7.tgz",
      "integrity": "sha512-wem6WaBj4NaVYVdNhLPPVacES6ZJ+KBBfSkTMD3YZxbP3rm3Di85tJU5ljaUNhaOynt+Aj0xruhYuzQBt8n71g==",
      "license": "MIT",
      "dependencies": {
        "@babel/compat-data": "^7.29.7",
        "@babel/helper-validator-option": "^7.29.7",
        "browserslist": "^4.24.0",
        "lru-cache": "^5.1.1",
        "semver": "^6.3.1"
      },
      "engines": {
        "node": ">=6.9.0"
      }
    },
    "node_modules/@babel/helper-create-class-features-plugin": {
      "version": "7.29.7",
      "resolved": "https://registry.npmjs.org/@babel/helper-create-class-features-plugin/-/helper-create-class-features-plugin-7.29.7.tgz",
      "integrity": "sha512-IY3ZD9Tmooqr3TUhc3DUWxiuo8xx1DWLhd5M7hQ+ZWJamqM2BbalrBJb2MisSLoYorOj75U03qULCxQTY9r3hg==",
      "license": "MIT",
      "dependencies": {
        "@babel/helper-annotate-as-pure": "^7.29.7",
        "@babel/helper-member-expression-to-functions": "^7.29.7",
        "@babel/helper-optimise-call-expression": "^7.29.7",
 M .claude/agents/memory/raphael-memory.md
 M package-lock.json
 M package.json
 D src/components/__tests__/StyledText-test.js
?? .claude/agents/tmnt/session-logs/2026-06-27-S1-raphael.md
?? .tmnt/runs/T15-donny.md
?? .tmnt/runs/T17-raph.md
?? .tmnt/runs/T18-donny.md
?? src/constants/__tests__/

web search: 
web search: site:docs.expo.dev guides using-eslint eslint.config.js eslint-config-expo flat config Expo SDK 54
codex
Expo’s SDK 53+ guidance confirms the CommonJS flat-config shape using `eslint-config-expo/flat`. The package files already contain unrelated edits, so I’m checking their exact diff and will preserve them while adding only D4 entries.
exec
/bin/zsh -lc "git diff -- package.json package-lock.json && find .github -maxdepth 3 -type f -print 2>/dev/null || true && rg --files -g 'eslint.config.*' -g '.prettierrc*' -g 'tsconfig.json'" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
diff --git a/package-lock.json b/package-lock.json
index 5ea6c64..d62a83d 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -31,7 +31,9 @@
         "react-native-worklets": "0.5.1"
       },
       "devDependencies": {
+        "@testing-library/react-native": "^13.3.3",
         "@types/react": "~19.1.0",
+        "jest-expo": "~54.0.17",
         "react-test-renderer": "19.1.0",
         "typescript": "~5.9.2"
       }
@@ -1527,6 +1529,14 @@
         "node": ">=6.9.0"
       }
     },
+    "node_modules/@bcoe/v8-coverage": {
+      "version": "0.2.3",
+      "resolved": "https://registry.npmjs.org/@bcoe/v8-coverage/-/v8-coverage-0.2.3.tgz",
+      "integrity": "sha512-0hYQ8SB4Db5zvZB4axdMHGwEaQjkZzFjQiN9LVYvIFB2nSUHW9tYpxWriPrWDASIxiaXax83REcLxuSdnGPZtw==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true
+    },
     "node_modules/@expo/code-signing-certificates": {
       "version": "0.0.6",
       "resolved": "https://registry.npmjs.org/@expo/code-signing-certificates/-/code-signing-certificates-0.0.6.tgz",
@@ -2029,6 +2039,90 @@
         "node": ">=8"
       }
     },
+    "node_modules/@jest/console": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/@jest/console/-/console-29.7.0.tgz",
+      "integrity": "sha512-5Ni4CU7XHQi32IJ398EEP4RrB8eV09sXP2ROqD4bksHrnTree52PsxvX8tpL8LvTZ3pFzXyPbNQReSN41CAhOg==",
+      "devOptional": true,
+      "license": "MIT",
+      "dependencies": {
+        "@jest/types": "^29.6.3",
+        "@types/node": "*",
+        "chalk": "^4.0.0",
+        "jest-message-util": "^29.7.0",
+        "jest-util": "^29.7.0",
+        "slash": "^3.0.0"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
+    "node_modules/@jest/core": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/@jest/core/-/core-29.7.0.tgz",
+      "integrity": "sha512-n7aeXWKMnGtDA48y8TLWJPJmLmmZ642Ceo78cYWEpiD7FzDgmNDV/GCVRorPABdXLJZ/9wzzgZAlHjXjxDHGsg==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "@jest/console": "^29.7.0",
+        "@jest/reporters": "^29.7.0",
+        "@jest/test-result": "^29.7.0",
+        "@jest/transform": "^29.7.0",
+        "@jest/types": "^29.6.3",
+        "@types/node": "*",
+        "ansi-escapes": "^4.2.1",
+        "chalk": "^4.0.0",
+        "ci-info": "^3.2.0",
+        "exit": "^0.1.2",
+        "graceful-fs": "^4.2.9",
+        "jest-changed-files": "^29.7.0",
+        "jest-config": "^29.7.0",
+        "jest-haste-map": "^29.7.0",
+        "jest-message-util": "^29.7.0",
+        "jest-regex-util": "^29.6.3",
+        "jest-resolve": "^29.7.0",
+        "jest-resolve-dependencies": "^29.7.0",
+        "jest-runner": "^29.7.0",
+        "jest-runtime": "^29.7.0",
+        "jest-snapshot": "^29.7.0",
+        "jest-util": "^29.7.0",
+        "jest-validate": "^29.7.0",
+        "jest-watcher": "^29.7.0",
+        "micromatch": "^4.0.4",
+        "pretty-format": "^29.7.0",
+        "slash": "^3.0.0",
+        "strip-ansi": "^6.0.0"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      },
+      "peerDependencies": {
+        "node-notifier": "^8.0.1 || ^9.0.0 || ^10.0.0"
+      },
+      "peerDependenciesMeta": {
+        "node-notifier": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/@jest/core/node_modules/ci-info": {
+      "version": "3.9.0",
+      "resolved": "https://registry.npmjs.org/ci-info/-/ci-info-3.9.0.tgz",
+      "integrity": "sha512-NIxF55hv4nSqQswkAeiOi1r83xy8JldOFDTWiug55KBu9Jnblncd2U6ViHmYgHf01TPZS77NJBhBMKdWj9HQMQ==",
+      "devOptional": true,
+      "funding": [
+        {
+          "type": "github",
+          "url": "https://github.com/sponsors/sibiraj-s"
+        }
+      ],
+      "license": "MIT",
+      "peer": true,
+      "engines": {
+        "node": ">=8"
+      }
+    },
     "node_modules/@jest/create-cache-key-function": {
       "version": "29.7.0",
       "resolved": "https://registry.npmjs.org/@jest/create-cache-key-function/-/create-cache-key-function-29.7.0.tgz",
@@ -2041,6 +2135,16 @@
         "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
       }
     },
+    "node_modules/@jest/diff-sequences": {
+      "version": "30.4.0",
+      "resolved": "https://registry.npmjs.org/@jest/diff-sequences/-/diff-sequences-30.4.0.tgz",
+      "integrity": "sha512-zOpzlfUs45l6u7jm39qr87JCHUDsaeCtvL+kQe/Vn9jSnRB4/5IPXISm0h9I1vZW/o00Kn4UTJ2MOlhnUGwv3g==",
+      "devOptional": true,
+      "license": "MIT",
+      "engines": {
+        "node": "^18.14.0 || ^20.0.0 || ^22.0.0 || >=24.0.0"
+      }
+    },
     "node_modules/@jest/environment": {
       "version": "29.7.0",
       "resolved": "https://registry.npmjs.org/@jest/environment/-/environment-29.7.0.tgz",
@@ -2056,6 +2160,33 @@
         "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
       }
     },
+    "node_modules/@jest/expect": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/@jest/expect/-/expect-29.7.0.tgz",
+      "integrity": "sha512-8uMeAMycttpva3P1lBHB8VciS9V0XAr3GymPpipdyQXbBcuhkLQOSe8E/p92RyAdToS6ZD1tFkX+CkhoECE0dQ==",
+      "devOptional": true,
+      "license": "MIT",
+      "dependencies": {
+        "expect": "^29.7.0",
+        "jest-snapshot": "^29.7.0"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
+    "node_modules/@jest/expect-utils": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/@jest/expect-utils/-/expect-utils-29.7.0.tgz",
+      "integrity": "sha512-GlsNBWiFQFCVi9QVSx7f5AgMeLxe9YCCs5PuP2O2LdjDAA8Jh9eX7lA1Jq/xdXw3Wb3hyvlFNfZIfcRetSzYcA==",
+      "devOptional": true,
+      "license": "MIT",
+      "dependencies": {
+        "jest-get-type": "^29.6.3"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
     "node_modules/@jest/fake-timers": {
       "version": "29.7.0",
       "resolved": "https://registry.npmjs.org/@jest/fake-timers/-/fake-timers-29.7.0.tgz",
@@ -2073,6 +2204,166 @@
         "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
       }
     },
+    "node_modules/@jest/get-type": {
+      "version": "30.1.0",
+      "resolved": "https://registry.npmjs.org/@jest/get-type/-/get-type-30.1.0.tgz",
+      "integrity": "sha512-eMbZE2hUnx1WV0pmURZY9XoXPkUYjpc55mb0CrhtdWLtzMQPFvu/rZkTLZFTsdaVQa+Tr4eWAteqcUzoawq/uA==",
+      "devOptional": true,
+      "license": "MIT",
+      "engines": {
+        "node": "^18.14.0 || ^20.0.0 || ^22.0.0 || >=24.0.0"
+      }
+    },
+    "node_modules/@jest/globals": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/@jest/globals/-/globals-29.7.0.tgz",
+      "integrity": "sha512-mpiz3dutLbkW2MNFubUGUEVLkTGiqW6yLVTA+JbP6fI6J5iL9Y0Nlg8k95pcF8ctKwCS7WVxteBs29hhfAotzQ==",
+      "devOptional": true,
+      "license": "MIT",
+      "dependencies": {
+        "@jest/environment": "^29.7.0",
+        "@jest/expect": "^29.7.0",
+        "@jest/types": "^29.6.3",
+        "jest-mock": "^29.7.0"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
+    "node_modules/@jest/reporters": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/@jest/reporters/-/reporters-29.7.0.tgz",
+      "integrity": "sha512-DApq0KJbJOEzAFYjHADNNxAE3KbhxQB1y5Kplb5Waqw6zVbuWatSnMjE5gs8FUgEPmNsnZA3NCWl9NG0ia04Pg==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "@bcoe/v8-coverage": "^0.2.3",
+        "@jest/console": "^29.7.0",
+        "@jest/test-result": "^29.7.0",
+        "@jest/transform": "^29.7.0",
+        "@jest/types": "^29.6.3",
+        "@jridgewell/trace-mapping": "^0.3.18",
+        "@types/node": "*",
+        "chalk": "^4.0.0",
+        "collect-v8-coverage": "^1.0.0",
+        "exit": "^0.1.2",
+        "glob": "^7.1.3",
+        "graceful-fs": "^4.2.9",
+        "istanbul-lib-coverage": "^3.0.0",
+        "istanbul-lib-instrument": "^6.0.0",
+        "istanbul-lib-report": "^3.0.0",
+        "istanbul-lib-source-maps": "^4.0.0",
+        "istanbul-reports": "^3.1.3",
+        "jest-message-util": "^29.7.0",
+        "jest-util": "^29.7.0",
+        "jest-worker": "^29.7.0",
+        "slash": "^3.0.0",
+        "string-length": "^4.0.1",
+        "strip-ansi": "^6.0.0",
+        "v8-to-istanbul": "^9.0.1"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      },
+      "peerDependencies": {
+        "node-notifier": "^8.0.1 || ^9.0.0 || ^10.0.0"
+      },
+      "peerDependenciesMeta": {
+        "node-notifier": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/@jest/reporters/node_modules/balanced-match": {
+      "version": "1.0.2",
+      "resolved": "https://registry.npmjs.org/balanced-match/-/balanced-match-1.0.2.tgz",
+      "integrity": "sha512-3oSeUO0TMV67hN1AmbXsK4yaqU7tjiHlbxRDZOpH0KW9+CeX4bRAaX0Anxt0tx2MrpRpWwQaPwIlISEJhYU5Pw==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true
+    },
+    "node_modules/@jest/reporters/node_modules/brace-expansion": {
+      "version": "1.1.15",
+      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-1.1.15.tgz",
+      "integrity": "sha512-EwOCDEex4quD37XhqM3omwtMoJjr//isUZz1JopUNWms+4Z2ViyM/k1YIRePpoVNnQhENnxtFjLaxNHrT7xIUg==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "balanced-match": "^1.0.0",
+        "concat-map": "0.0.1"
+      }
+    },
+    "node_modules/@jest/reporters/node_modules/glob": {
+      "version": "7.2.3",
+      "resolved": "https://registry.npmjs.org/glob/-/glob-7.2.3.tgz",
+      "integrity": "sha512-nFR0zLpU2YCaRxwoCJvL6UvCH2JFyFVIvwTLsIf21AuHlMskA1hhTdk+LlYJtOlYt9v6dvszD2BGRqBL+iQK9Q==",
+      "deprecated": "Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me",
+      "devOptional": true,
+      "license": "ISC",
+      "peer": true,
+      "dependencies": {
+        "fs.realpath": "^1.0.0",
+        "inflight": "^1.0.4",
+        "inherits": "2",
+        "minimatch": "^3.1.1",
+        "once": "^1.3.0",
+        "path-is-absolute": "^1.0.0"
+      },
+      "engines": {
+        "node": "*"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/isaacs"
+      }
+    },
+    "node_modules/@jest/reporters/node_modules/istanbul-lib-instrument": {
+      "version": "6.0.3",
+      "resolved": "https://registry.npmjs.org/istanbul-lib-instrument/-/istanbul-lib-instrument-6.0.3.tgz",
+      "integrity": "sha512-Vtgk7L/R2JHyyGW07spoFlB8/lpjiOLTjMdms6AFMraYt3BaJauod/NGrfnVG/y4Ix1JEuMRPDPEj2ua+zz1/Q==",
+      "devOptional": true,
+      "license": "BSD-3-Clause",
+      "peer": true,
+      "dependencies": {
+        "@babel/core": "^7.23.9",
+        "@babel/parser": "^7.23.9",
+        "@istanbuljs/schema": "^0.1.3",
+        "istanbul-lib-coverage": "^3.2.0",
+        "semver": "^7.5.4"
+      },
+      "engines": {
+        "node": ">=10"
+      }
+    },
+    "node_modules/@jest/reporters/node_modules/minimatch": {
+      "version": "3.1.5",
+      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-3.1.5.tgz",
+      "integrity": "sha512-VgjWUsnnT6n+NUk6eZq77zeFdpW2LWDzP6zFGrCbHXiYNul5Dzqk2HHQ5uFH2DNW5Xbp8+jVzaeNt94ssEEl4w==",
+      "devOptional": true,
+      "license": "ISC",
+      "peer": true,
+      "dependencies": {
+        "brace-expansion": "^1.1.7"
+      },
+      "engines": {
+        "node": "*"
+      }
+    },
+    "node_modules/@jest/reporters/node_modules/semver": {
+      "version": "7.8.5",
+      "resolved": "https://registry.npmjs.org/semver/-/semver-7.8.5.tgz",
+      "integrity": "sha512-Y7/KDsb8LjooZpwaqGyulO6DQlksgCncchHGk+sZIY4SBvUocMBEFH5Ur1fI4dV+Jvl0w6cjvucaIi40puRioA==",
+      "devOptional": true,
+      "license": "ISC",
+      "peer": true,
+      "bin": {
+        "semver": "bin/semver.js"
+      },
+      "engines": {
+        "node": ">=10"
+      }
+    },
     "node_modules/@jest/schemas": {
       "version": "29.6.3",
       "resolved": "https://registry.npmjs.org/@jest/schemas/-/schemas-29.6.3.tgz",
@@ -2085,6 +2376,55 @@
         "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
       }
     },
+    "node_modules/@jest/source-map": {
+      "version": "29.6.3",
+      "resolved": "https://registry.npmjs.org/@jest/source-map/-/source-map-29.6.3.tgz",
+      "integrity": "sha512-MHjT95QuipcPrpLM+8JMSzFx6eHp5Bm+4XeFDJlwsvVBjmKNiIAvasGK2fxz2WbGRlnvqehFbh07MMa7n3YJnw==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "@jridgewell/trace-mapping": "^0.3.18",
+        "callsites": "^3.0.0",
+        "graceful-fs": "^4.2.9"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
+    "node_modules/@jest/test-result": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/@jest/test-result/-/test-result-29.7.0.tgz",
+      "integrity": "sha512-Fdx+tv6x1zlkJPcWXmMDAG2HBnaR9XPSd5aDWQVsfrZmLVT3lU1cwyxLgRmXR9yrq4NBoEm9BMsfgFzTQAbJYA==",
+      "devOptional": true,
+      "license": "MIT",
+      "dependencies": {
+        "@jest/console": "^29.7.0",
+        "@jest/types": "^29.6.3",
+        "@types/istanbul-lib-coverage": "^2.0.0",
+        "collect-v8-coverage": "^1.0.0"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
+    "node_modules/@jest/test-sequencer": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/@jest/test-sequencer/-/test-sequencer-29.7.0.tgz",
+      "integrity": "sha512-GQwJ5WZVrKnOJuiYiAF52UNUJXgTZx1NHjFSEB0qEMmSZKAkdMoIzw/Cj6x6NF4AvV23AUqDpFzQkN/eYCYTxw==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "@jest/test-result": "^29.7.0",
+        "graceful-fs": "^4.2.9",
+        "jest-haste-map": "^29.7.0",
+        "slash": "^3.0.0"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
     "node_modules/@jest/transform": {
       "version": "29.7.0",
       "resolved": "https://registry.npmjs.org/@jest/transform/-/transform-29.7.0.tgz",
@@ -2867,27 +3207,113 @@
         "node": ">=20.0.0"
       }
     },
-    "node_modules/@types/babel__core": {
-      "version": "7.20.5",
-      "resolved": "https://registry.npmjs.org/@types/babel__core/-/babel__core-7.20.5.tgz",
-      "integrity": "sha512-qoQprZvz5wQFJwMDqeseRXWv3rqMvhgpbXFfVyWhbx9X47POIA6i/+dXefEmZKoAgOaTdaIgNSMqMIU61yRyzA==",
+    "node_modules/@testing-library/react-native": {
+      "version": "13.3.3",
+      "resolved": "https://registry.npmjs.org/@testing-library/react-native/-/react-native-13.3.3.tgz",
+      "integrity": "sha512-k6Mjsd9dbZgvY4Bl7P1NIpePQNi+dfYtlJ5voi9KQlynxSyQkfOgJmYGCYmw/aSgH/rUcFvG8u5gd4npzgRDyg==",
+      "devOptional": true,
       "license": "MIT",
       "dependencies": {
-        "@babel/parser": "^7.20.7",
-        "@babel/types": "^7.20.7",
-        "@types/babel__generator": "*",
-        "@types/babel__template": "*",
-        "@types/babel__traverse": "*"
+        "jest-matcher-utils": "^30.0.5",
+        "picocolors": "^1.1.1",
+        "pretty-format": "^30.0.5",
+        "redent": "^3.0.0"
+      },
+      "engines": {
+        "node": ">=18"
+      },
+      "peerDependencies": {
+        "jest": ">=29.0.0",
+        "react": ">=18.2.0",
+        "react-native": ">=0.71",
+        "react-test-renderer": ">=18.2.0"
+      },
+      "peerDependenciesMeta": {
+        "jest": {
+          "optional": true
+        }
       }
     },
-    "node_modules/@types/babel__generator": {
-      "version": "7.27.0",
-      "resolved": "https://registry.npmjs.org/@types/babel__generator/-/babel__generator-7.27.0.tgz",
-      "integrity": "sha512-ufFd2Xi92OAVPYsy+P4n7/U7e68fex0+Ee8gSG9KX7eo084CWiQ4sdxktvdl0bOPupXtVJPY19zk6EwWqUQ8lg==",
+    "node_modules/@testing-library/react-native/node_modules/@jest/schemas": {
+      "version": "30.4.1",
+      "resolved": "https://registry.npmjs.org/@jest/schemas/-/schemas-30.4.1.tgz",
+      "integrity": "sha512-i6b4qw5qnP8c5FEeBJg/uZQ4ddrkN6Ca8qISJh0pr7a5hfn3h3v5x60BEbOC7OYAGZNMs1LfFLwnW2CuK8F57Q==",
+      "devOptional": true,
       "license": "MIT",
       "dependencies": {
-        "@babel/types": "^7.0.0"
-      }
+        "@sinclair/typebox": "^0.34.0"
+      },
+      "engines": {
+        "node": "^18.14.0 || ^20.0.0 || ^22.0.0 || >=24.0.0"
+      }
+    },
+    "node_modules/@testing-library/react-native/node_modules/@sinclair/typebox": {
+      "version": "0.34.49",
+      "resolved": "https://registry.npmjs.org/@sinclair/typebox/-/typebox-0.34.49.tgz",
+      "integrity": "sha512-brySQQs7Jtn0joV8Xh9ZV/hZb9Ozb0pmazDIASBkYKCjXrXU3mpcFahmK/z4YDhGkQvP9mWJbVyahdtU5wQA+A==",
+      "devOptional": true,
+      "license": "MIT"
+    },
+    "node_modules/@testing-library/react-native/node_modules/ansi-styles": {
+      "version": "5.2.0",
+      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-5.2.0.tgz",
+      "integrity": "sha512-Cxwpt2SfTzTtXcfOlzGEee8O+c+MmUgGrNiBcXnuWxuFJHe6a5Hz7qwhwe5OgaSYI0IJvkLqWX1ASG+cJOkEiA==",
+      "devOptional": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=10"
+      },
+      "funding": {
+        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
+      }
+    },
+    "node_modules/@testing-library/react-native/node_modules/pretty-format": {
+      "version": "30.4.1",
+      "resolved": "https://registry.npmjs.org/pretty-format/-/pretty-format-30.4.1.tgz",
+      "integrity": "sha512-K6KiKMHTL4jjX4u3Kir2EW07nRfcqVTXIImx50wbjHQTcZPgg+gjVeNTIT3l3L1Rd4UefxfogquC9J37SoFyyw==",
+      "devOptional": true,
+      "license": "MIT",
+      "dependencies": {
+        "@jest/schemas": "30.4.1",
+        "ansi-styles": "^5.2.0",
+        "react-is-18": "npm:react-is@^18.3.1",
+        "react-is-19": "npm:react-is@^19.2.5"
+      },
+      "engines": {
+        "node": "^18.14.0 || ^20.0.0 || ^22.0.0 || >=24.0.0"
+      }
+    },
+    "node_modules/@tootallnate/once": {
+      "version": "2.0.1",
+      "resolved": "https://registry.npmjs.org/@tootallnate/once/-/once-2.0.1.tgz",
+      "integrity": "sha512-HqmEUIGRJ5fSXchkVgR5F7qn48bDBzv0kWj/Kfu5e6uci4UlEeng4331LnBkWffb++Ei3FOVLxo8JJWMFBDMeQ==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">= 10"
+      }
+    },
+    "node_modules/@types/babel__core": {
+      "version": "7.20.5",
+      "resolved": "https://registry.npmjs.org/@types/babel__core/-/babel__core-7.20.5.tgz",
+      "integrity": "sha512-qoQprZvz5wQFJwMDqeseRXWv3rqMvhgpbXFfVyWhbx9X47POIA6i/+dXefEmZKoAgOaTdaIgNSMqMIU61yRyzA==",
+      "license": "MIT",
+      "dependencies": {
+        "@babel/parser": "^7.20.7",
+        "@babel/types": "^7.20.7",
+        "@types/babel__generator": "*",
+        "@types/babel__template": "*",
+        "@types/babel__traverse": "*"
+      }
+    },
+    "node_modules/@types/babel__generator": {
+      "version": "7.27.0",
+      "resolved": "https://registry.npmjs.org/@types/babel__generator/-/babel__generator-7.27.0.tgz",
+      "integrity": "sha512-ufFd2Xi92OAVPYsy+P4n7/U7e68fex0+Ee8gSG9KX7eo084CWiQ4sdxktvdl0bOPupXtVJPY19zk6EwWqUQ8lg==",
+      "license": "MIT",
+      "dependencies": {
+        "@babel/types": "^7.0.0"
+      }
     },
     "node_modules/@types/babel__template": {
       "version": "7.4.4",
@@ -2941,6 +3367,18 @@
         "@types/istanbul-lib-report": "*"
       }
     },
+    "node_modules/@types/jsdom": {
+      "version": "20.0.1",
+      "resolved": "https://registry.npmjs.org/@types/jsdom/-/jsdom-20.0.1.tgz",
+      "integrity": "sha512-d0r18sZPmMQr1eG35u12FZfhIXNrnsPU/g5wvRKCUf/tOGilKKwYMYGqh33BNR6ba+2gkHw1EUiHoN3mn7E5IQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@types/node": "*",
+        "@types/tough-cookie": "*",
+        "parse5": "^7.0.0"
+      }
+    },
     "node_modules/@types/node": {
       "version": "25.9.1",
       "resolved": "https://registry.npmjs.org/@types/node/-/node-25.9.1.tgz",
@@ -2966,6 +3404,13 @@
       "integrity": "sha512-9aEbYZ3TbYMznPdcdr3SmIrLXwC/AKZXQeCf9Pgao5CKb8CyHuEX5jzWPTkvregvhRJHcpRO6BFoGW9ycaOkYw==",
       "license": "MIT"
     },
+    "node_modules/@types/tough-cookie": {
+      "version": "4.0.5",
+      "resolved": "https://registry.npmjs.org/@types/tough-cookie/-/tough-cookie-4.0.5.tgz",
+      "integrity": "sha512-/Ad8+nIOV7Rl++6f1BdKxFSMgmoqEoYbHRpPcx3JEfv8VRsQe9Z4mCXeJBzxs7mbHY/XOZZuXlRNfhpVPbs6ZA==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/@types/yargs": {
       "version": "17.0.35",
       "resolved": "https://registry.npmjs.org/@types/yargs/-/yargs-17.0.35.tgz",
@@ -3019,6 +3464,14 @@
         "node": ">=10.0.0"
       }
     },
+    "node_modules/abab": {
+      "version": "2.0.6",
+      "resolved": "https://registry.npmjs.org/abab/-/abab-2.0.6.tgz",
+      "integrity": "sha512-j2afSsaIENvHZN2B8GOpF566vZ5WVk5opAiMTvWgaQT8DkbOqsTfvNAvHoRGU2zzP8cPoqys+xHTRDWW8L+/BA==",
+      "deprecated": "Use your platform's native atob() and btoa() methods instead",
+      "dev": true,
+      "license": "BSD-3-Clause"
+    },
     "node_modules/abort-controller": {
       "version": "3.0.0",
       "resolved": "https://registry.npmjs.org/abort-controller/-/abort-controller-3.0.0.tgz",
@@ -3056,6 +3509,30 @@
         "node": ">=0.4.0"
       }
     },
+    "node_modules/acorn-globals": {
+      "version": "7.0.1",
+      "resolved": "https://registry.npmjs.org/acorn-globals/-/acorn-globals-7.0.1.tgz",
+      "integrity": "sha512-umOSDSDrfHbTNPuNpC2NSnnA3LUrqpevPb4T9jRx4MagXNS0rs+gwiTcAvqCRmsD6utzsrzNt+ebm00SNWiC3Q==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "acorn": "^8.1.0",
+        "acorn-walk": "^8.0.2"
+      }
+    },
+    "node_modules/acorn-walk": {
+      "version": "8.3.5",
+      "resolved": "https://registry.npmjs.org/acorn-walk/-/acorn-walk-8.3.5.tgz",
+      "integrity": "sha512-HEHNfbars9v4pgpW6SO1KSPkfoS0xVOM/9UzkJltjlsHZmJasxg8aXkuZa7SMf8vKGIBhpUsPluQSqhJFCqebw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "acorn": "^8.11.0"
+      },
+      "engines": {
+        "node": ">=0.4.0"
+      }
+    },
     "node_modules/agent-base": {
       "version": "7.1.4",
       "resolved": "https://registry.npmjs.org/agent-base/-/agent-base-7.1.4.tgz",
@@ -3180,6 +3657,13 @@
       "integrity": "sha512-csOlWGAcRFJaI6m+F2WKdnMKr4HhdhFVBk0H/QbJFMCr+uO2kwohwXQPxw/9OCxp05r5ghVBFSyioixx3gfkNQ==",
       "license": "MIT"
     },
+    "node_modules/asynckit": {
+      "version": "0.4.0",
+      "resolved": "https://registry.npmjs.org/asynckit/-/asynckit-0.4.0.tgz",
+      "integrity": "sha512-Oei9OH4tRh0YqU3GxhX79dM/mwVgvbZJaSNaRk+bshkj0S5cfHcgYakreBjrHwatXKbz+IoIdYLxrKim2MjW0Q==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/babel-jest": {
       "version": "29.7.0",
       "resolved": "https://registry.npmjs.org/babel-jest/-/babel-jest-29.7.0.tgz",
@@ -3566,6 +4050,31 @@
         "node": ">= 0.8"
       }
     },
+    "node_modules/call-bind-apply-helpers": {
+      "version": "1.0.2",
+      "resolved": "https://registry.npmjs.org/call-bind-apply-helpers/-/call-bind-apply-helpers-1.0.2.tgz",
+      "integrity": "sha512-Sp1ablJ0ivDkSzjcaJdxEunN5/XvksFJ2sMBFfq6x0ryhQV/2b/KwFe21cMpmHtPOSij8K99/wSfoEuTObmuMQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "es-errors": "^1.3.0",
+        "function-bind": "^1.1.2"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      }
+    },
+    "node_modules/callsites": {
+      "version": "3.1.0",
+      "resolved": "https://registry.npmjs.org/callsites/-/callsites-3.1.0.tgz",
+      "integrity": "sha512-P8BjAsXvZS+VIDUI11hHCQEv74YT67YUi5JJFNWIqL235sBmjX4+qx9Muvls5ivyNENctx46xQLQ3aTuE7ssaQ==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "engines": {
+        "node": ">=6"
+      }
+    },
     "node_modules/camelcase": {
       "version": "6.3.0",
       "resolved": "https://registry.npmjs.org/camelcase/-/camelcase-6.3.0.tgz",
@@ -3614,6 +4123,16 @@
         "url": "https://github.com/chalk/chalk?sponsor=1"
       }
     },
+    "node_modules/char-regex": {
+      "version": "1.0.2",
+      "resolved": "https://registry.npmjs.org/char-regex/-/char-regex-1.0.2.tgz",
+      "integrity": "sha512-kWWXztvZ5SBQV+eRgKFeh8q5sLuZY2+8WUIzlxWVTg+oGwY14qylx1KbKzHd8P6ZYkAg0xyIDU9JMHhyJMZ1jw==",
+      "devOptional": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=10"
+      }
+    },
     "node_modules/chownr": {
       "version": "3.0.0",
       "resolved": "https://registry.npmjs.org/chownr/-/chownr-3.0.0.tgz",
@@ -3661,6 +4180,14 @@
       "integrity": "sha512-5tK7EtrZ0N+OLFMthtqOj4fI2Jeb88C4CAZPu25LDVUgXJ0A3Js4PMGqrn0JU1W0Mh1/Z8wZzYPxqUrXeBboCQ==",
       "license": "MIT"
     },
+    "node_modules/cjs-module-lexer": {
+      "version": "1.4.3",
+      "resolved": "https://registry.npmjs.org/cjs-module-lexer/-/cjs-module-lexer-1.4.3.tgz",
+      "integrity": "sha512-9z8TZaGM1pfswYeXrUpzPrkx8UnWYdhJclsiYMm6x/w5+nN+8Tf/LnAgfLGQCm59qAOxU8WwHEq2vNwF6i4j+Q==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true
+    },
     "node_modules/cli-cursor": {
       "version": "2.1.0",
       "resolved": "https://registry.npmjs.org/cli-cursor/-/cli-cursor-2.1.0.tgz",
@@ -3714,6 +4241,25 @@
         "node": ">=0.8"
       }
     },
+    "node_modules/co": {
+      "version": "4.6.0",
+      "resolved": "https://registry.npmjs.org/co/-/co-4.6.0.tgz",
+      "integrity": "sha512-QVb0dM5HvG+uaxitm8wONl7jltx8dqhfU33DcqtOZcLSVIKSDDLDi7+0LbAKiyI8hD9u42m2YxXSkMGWThaecQ==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "engines": {
+        "iojs": ">= 1.0.0",
+        "node": ">= 0.12.0"
+      }
+    },
+    "node_modules/collect-v8-coverage": {
+      "version": "1.0.3",
+      "resolved": "https://registry.npmjs.org/collect-v8-coverage/-/collect-v8-coverage-1.0.3.tgz",
+      "integrity": "sha512-1L5aqIkwPfiodaMgQunkF1zRhNqifHBmtbbbxcr6yVxxBnliw4TDOW6NxpO8DJLgJ16OT+Y4ztZqP6p/FtXnAw==",
+      "devOptional": true,
+      "license": "MIT"
+    },
     "node_modules/color": {
       "version": "4.2.3",
       "resolved": "https://registry.npmjs.org/color/-/color-4.2.3.tgz",
@@ -3755,6 +4301,19 @@
         "simple-swizzle": "^0.2.2"
       }
     },
+    "node_modules/combined-stream": {
+      "version": "1.0.8",
+      "resolved": "https://registry.npmjs.org/combined-stream/-/combined-stream-1.0.8.tgz",
+      "integrity": "sha512-FQN4MRfuJeHf7cBbBMJFXhKSDq+2kAArBlmRBvcvFE5BB1HZKXtSFASDhdlz9zOYwxh8lDdnvmMOe/+5cdoEdg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "delayed-stream": "~1.0.0"
+      },
+      "engines": {
+        "node": ">= 0.8"
+      }
+    },
     "node_modules/commander": {
       "version": "7.2.0",
       "resolved": "https://registry.npmjs.org/commander/-/commander-7.2.0.tgz",
@@ -3873,6 +4432,29 @@
         "url": "https://opencollective.com/core-js"
       }
     },
+    "node_modules/create-jest": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/create-jest/-/create-jest-29.7.0.tgz",
+      "integrity": "sha512-Adz2bdH0Vq3F53KEMJOoftQFutWCukm6J24wbPWRO4k1kMY7gS7ds/uoJkNuV8wDCtWWnuwGcJwpWcih+zEW1Q==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "@jest/types": "^29.6.3",
+        "chalk": "^4.0.0",
+        "exit": "^0.1.2",
+        "graceful-fs": "^4.2.9",
+        "jest-config": "^29.7.0",
+        "jest-util": "^29.7.0",
+        "prompts": "^2.0.1"
+      },
+      "bin": {
+        "create-jest": "bin/create-jest.js"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
     "node_modules/cross-fetch": {
       "version": "3.2.0",
       "resolved": "https://registry.npmjs.org/cross-fetch/-/cross-fetch-3.2.0.tgz",
@@ -3905,6 +4487,33 @@
         "hyphenate-style-name": "^1.0.3"
       }
     },
+    "node_modules/cssom": {
+      "version": "0.5.0",
+      "resolved": "https://registry.npmjs.org/cssom/-/cssom-0.5.0.tgz",
+      "integrity": "sha512-iKuQcq+NdHqlAcwUY0o/HL69XQrUaQdMjmStJ8JFmUaiiQErlhrmuigkg/CU4E2J0IyUKUrMAgl36TvN67MqTw==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/cssstyle": {
+      "version": "2.3.0",
+      "resolved": "https://registry.npmjs.org/cssstyle/-/cssstyle-2.3.0.tgz",
+      "integrity": "sha512-AZL67abkUzIuvcHqk7c09cezpGNcxUxU4Ioi/05xHk4DQeTkWmGYftIE6ctU6AEt+Gn4n1lDStOtj7FKycP71A==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "cssom": "~0.3.6"
+      },
+      "engines": {
+        "node": ">=8"
+      }
+    },
+    "node_modules/cssstyle/node_modules/cssom": {
+      "version": "0.3.8",
+      "resolved": "https://registry.npmjs.org/cssom/-/cssom-0.3.8.tgz",
+      "integrity": "sha512-b0tGHbfegbhPJpxpiBPU2sCkigAqtM9O121le6bbOlgyV+NyGyCmVfJ6QW9eRjz8CpNfWEOYBIMIGRYkLwsIYg==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/csstype": {
       "version": "3.2.3",
       "resolved": "https://registry.npmjs.org/csstype/-/csstype-3.2.3.tgz",
@@ -3912,6 +4521,58 @@
       "devOptional": true,
       "license": "MIT"
     },
+    "node_modules/data-urls": {
+      "version": "3.0.2",
+      "resolved": "https://registry.npmjs.org/data-urls/-/data-urls-3.0.2.tgz",
+      "integrity": "sha512-Jy/tj3ldjZJo63sVAvg6LHt2mHvl4V6AgRAmNDtLdm7faqtsx+aJG42rsyCo9JCoRVKwPFzKlIPx3DIibwSIaQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "abab": "^2.0.6",
+        "whatwg-mimetype": "^3.0.0",
+        "whatwg-url": "^11.0.0"
+      },
+      "engines": {
+        "node": ">=12"
+      }
+    },
+    "node_modules/data-urls/node_modules/tr46": {
+      "version": "3.0.0",
+      "resolved": "https://registry.npmjs.org/tr46/-/tr46-3.0.0.tgz",
+      "integrity": "sha512-l7FvfAHlcmulp8kr+flpQZmVwtu7nfRV7NZujtN0OqES8EL4O4e0qqzL0DC5gAvx/ZC/9lk6rhcUwYvkBnBnYA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "punycode": "^2.1.1"
+      },
+      "engines": {
+        "node": ">=12"
+      }
+    },
+    "node_modules/data-urls/node_modules/webidl-conversions": {
+      "version": "7.0.0",
+      "resolved": "https://registry.npmjs.org/webidl-conversions/-/webidl-conversions-7.0.0.tgz",
+      "integrity": "sha512-VwddBukDzu71offAQR975unBIGqfKZpM+8ZX6ySk8nYhVoo5CYaZyzt3YBvYtRtO+aoGlqxPg/B87NGVZ/fu6g==",
+      "dev": true,
+      "license": "BSD-2-Clause",
+      "engines": {
+        "node": ">=12"
+      }
+    },
+    "node_modules/data-urls/node_modules/whatwg-url": {
+      "version": "11.0.0",
+      "resolved": "https://registry.npmjs.org/whatwg-url/-/whatwg-url-11.0.0.tgz",
+      "integrity": "sha512-RKT8HExMpoYx4igMiVMY83lN6UeITKJlBQ+vR/8ZJ8OCdSiN3RwCq+9gH0+Xzj0+5IrM6i4j/6LuvzbZIQgEcQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "tr46": "^3.0.0",
+        "webidl-conversions": "^7.0.0"
+      },
+      "engines": {
+        "node": ">=12"
+      }
+    },
     "node_modules/debug": {
       "version": "4.4.3",
       "resolved": "https://registry.npmjs.org/debug/-/debug-4.4.3.tgz",
@@ -3929,6 +4590,13 @@
         }
       }
     },
+    "node_modules/decimal.js": {
+      "version": "10.6.0",
+      "resolved": "https://registry.npmjs.org/decimal.js/-/decimal.js-10.6.0.tgz",
+      "integrity": "sha512-YpgQiITW3JXGntzdUmyUR1V812Hn8T1YVXhCu+wO3OpS4eU9l4YdD3qjyiKdV6mvV29zapkMeD390UVEf2lkUg==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/decode-uri-component": {
       "version": "0.2.2",
       "resolved": "https://registry.npmjs.org/decode-uri-component/-/decode-uri-component-0.2.2.tgz",
@@ -3938,6 +4606,22 @@
         "node": ">=0.10"
       }
     },
+    "node_modules/dedent": {
+      "version": "1.7.2",
+      "resolved": "https://registry.npmjs.org/dedent/-/dedent-1.7.2.tgz",
+      "integrity": "sha512-WzMx3mW98SN+zn3hgemf4OzdmyNhhhKz5Ay0pUfQiMQ3e1g+xmTJWp/pKdwKVXhdSkAEGIIzqeuWrL3mV/AXbA==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "peerDependencies": {
+        "babel-plugin-macros": "^3.1.0"
+      },
+      "peerDependenciesMeta": {
+        "babel-plugin-macros": {
+          "optional": true
+        }
+      }
+    },
     "node_modules/deep-extend": {
       "version": "0.6.0",
       "resolved": "https://registry.npmjs.org/deep-extend/-/deep-extend-0.6.0.tgz",
@@ -3977,6 +4661,16 @@
         "node": ">=8"
       }
     },
+    "node_modules/delayed-stream": {
+      "version": "1.0.0",
+      "resolved": "https://registry.npmjs.org/delayed-stream/-/delayed-stream-1.0.0.tgz",
+      "integrity": "sha512-ZySD7Nf91aLB0RxL4KGrKHBXl7Eds1DAmEdcoVawXnLD7SDhpNgtuII2aAkg7a7QS41jxPSZ17p4VdGnMHk3MQ==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=0.4.0"
+      }
+    },
     "node_modules/depd": {
       "version": "2.0.0",
       "resolved": "https://registry.npmjs.org/depd/-/depd-2.0.0.tgz",
@@ -4005,12 +4699,57 @@
         "node": ">=8"
       }
     },
+    "node_modules/detect-newline": {
+      "version": "3.1.0",
+      "resolved": "https://registry.npmjs.org/detect-newline/-/detect-newline-3.1.0.tgz",
+      "integrity": "sha512-TLz+x/vEXm/Y7P7wn1EJFNLxYpUD4TgMosxY6fAVJUnJMbupHBOncxyWUG9OpTaH9EBD7uFI5LfEgmMOc54DsA==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "engines": {
+        "node": ">=8"
+      }
+    },
     "node_modules/detect-node-es": {
       "version": "1.1.0",
       "resolved": "https://registry.npmjs.org/detect-node-es/-/detect-node-es-1.1.0.tgz",
       "integrity": "sha512-ypdmJU/TbBby2Dxibuv7ZLW3Bs1QEmM7nHjEANfohJLvE0XVujisn1qPJcZxg+qDucsr+bP6fLD1rPS3AhJ7EQ==",
       "license": "MIT"
     },
+    "node_modules/diff-sequences": {
+      "version": "29.6.3",
+      "resolved": "https://registry.npmjs.org/diff-sequences/-/diff-sequences-29.6.3.tgz",
+      "integrity": "sha512-EjePK1srD3P08o2j4f0ExnylqRs5B9tJjcp9t1krH2qRi8CCdsYfwe9JgSLurFBWwq4uOlipzfk5fHNvwFKr8Q==",
+      "devOptional": true,
+      "license": "MIT",
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
+    "node_modules/domexception": {
+      "version": "4.0.0",
+      "resolved": "https://registry.npmjs.org/domexception/-/domexception-4.0.0.tgz",
+      "integrity": "sha512-A2is4PLG+eeSfoTMA95/s4pvAoSo2mKtiM5jlHkAVewmiO8ISFTFKZjH7UAM1Atli/OT/7JHOrJRJiMKUZKYBw==",
+      "deprecated": "Use your platform's native DOMException instead",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "webidl-conversions": "^7.0.0"
+      },
+      "engines": {
+        "node": ">=12"
+      }
+    },
+    "node_modules/domexception/node_modules/webidl-conversions": {
+      "version": "7.0.0",
+      "resolved": "https://registry.npmjs.org/webidl-conversions/-/webidl-conversions-7.0.0.tgz",
+      "integrity": "sha512-VwddBukDzu71offAQR975unBIGqfKZpM+8ZX6ySk8nYhVoo5CYaZyzt3YBvYtRtO+aoGlqxPg/B87NGVZ/fu6g==",
+      "dev": true,
+      "license": "BSD-2-Clause",
+      "engines": {
+        "node": ">=12"
+      }
+    },
     "node_modules/dotenv": {
       "version": "16.4.7",
       "resolved": "https://registry.npmjs.org/dotenv/-/dotenv-16.4.7.tgz",
@@ -4038,6 +4777,21 @@
         "url": "https://dotenvx.com"
       }
     },
+    "node_modules/dunder-proto": {
+      "version": "1.0.1",
+      "resolved": "https://registry.npmjs.org/dunder-proto/-/dunder-proto-1.0.1.tgz",
+      "integrity": "sha512-KIN/nDJBQRcXw0MLVhZE9iQHmG68qAVIBg9CqmUYjmQIhgij9U5MFvrqkUL5FbtyyzZuOeOt0zdeRe4UY7ct+A==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "call-bind-apply-helpers": "^1.0.1",
+        "es-errors": "^1.3.0",
+        "gopd": "^1.2.0"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      }
+    },
     "node_modules/ee-first": {
       "version": "1.1.1",
       "resolved": "https://registry.npmjs.org/ee-first/-/ee-first-1.1.1.tgz",
@@ -4050,9 +4804,22 @@
       "integrity": "sha512-G/dYE3+AYhyHwzTwg8UbnXf7zqMERYh7l2jJ3QujhFsH8agSYwtnGAR2aZ7f0AakIKJXd5En/Hre4igIUrdlYw==",
       "license": "ISC"
     },
-    "node_modules/emoji-regex": {
-      "version": "8.0.0",
-      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-8.0.0.tgz",
+    "node_modules/emittery": {
+      "version": "0.13.1",
+      "resolved": "https://registry.npmjs.org/emittery/-/emittery-0.13.1.tgz",
+      "integrity": "sha512-DeWwawk6r5yR9jFgnDKYt4sLS0LmHJJi3ZOnb5/JdbYwj3nW+FxQnHIjhBKz8YLC7oRNPVM9NQ47I3CVx34eqQ==",
+      "devOptional": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=12"
+      },
+      "funding": {
+        "url": "https://github.com/sindresorhus/emittery?sponsor=1"
+      }
+    },
+    "node_modules/emoji-regex": {
+      "version": "8.0.0",
+      "resolved": "https://registry.npmjs.org/emoji-regex/-/emoji-regex-8.0.0.tgz",
       "integrity": "sha512-MSjYzcWNOA0ewAHpz0MxpYFvwg6yjy1NG3xteoqz644VCo/RPgnr1/GGt+ic3iJTzQ8Eu3TdM14SawnVUmGE6A==",
       "license": "MIT"
     },
@@ -4065,6 +4832,19 @@
         "node": ">= 0.8"
       }
     },
+    "node_modules/entities": {
+      "version": "6.0.1",
+      "resolved": "https://registry.npmjs.org/entities/-/entities-6.0.1.tgz",
+      "integrity": "sha512-aN97NXWF6AWBTahfVOIrB/NShkzi5H7F9r1s9mD3cDj4Ko5f2qhhVoYMibXF7GlLveb/D2ioWay8lxI97Ven3g==",
+      "dev": true,
+      "license": "BSD-2-Clause",
+      "engines": {
+        "node": ">=0.12"
+      },
+      "funding": {
+        "url": "https://github.com/fb55/entities?sponsor=1"
+      }
+    },
     "node_modules/env-editor": {
       "version": "0.4.2",
       "resolved": "https://registry.npmjs.org/env-editor/-/env-editor-0.4.2.tgz",
@@ -4074,6 +4854,25 @@
         "node": ">=8"
       }
     },
+    "node_modules/error-ex": {
+      "version": "1.3.4",
+      "resolved": "https://registry.npmjs.org/error-ex/-/error-ex-1.3.4.tgz",
+      "integrity": "sha512-sqQamAnR14VgCr1A618A3sGrygcpK+HEbenA/HiEAkkUwcZIIB/tgWqHFxWgOyDh4nB4JCRimh79dR5Ywc9MDQ==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "is-arrayish": "^0.2.1"
+      }
+    },
+    "node_modules/error-ex/node_modules/is-arrayish": {
+      "version": "0.2.1",
+      "resolved": "https://registry.npmjs.org/is-arrayish/-/is-arrayish-0.2.1.tgz",
+      "integrity": "sha512-zz06S8t0ozoDXMG+ube26zeCTNXcKIPJZJi8hBrF4idCLms4CG9QtK7qBl1boi5ODzFpjswb5JPmHCbMpjaYzg==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true
+    },
     "node_modules/error-stack-parser": {
       "version": "2.1.4",
       "resolved": "https://registry.npmjs.org/error-stack-parser/-/error-stack-parser-2.1.4.tgz",
@@ -4083,6 +4882,16 @@
         "stackframe": "^1.3.4"
       }
     },
+    "node_modules/es-define-property": {
+      "version": "1.0.1",
+      "resolved": "https://registry.npmjs.org/es-define-property/-/es-define-property-1.0.1.tgz",
+      "integrity": "sha512-e3nRfgfUZ4rNGL232gUgX06QNyyez04KdjFrF+LTRoOXmrOgFKDg4BCdsjW8EnT69eqdYGmRpJwiPVYNrCaW3g==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">= 0.4"
+      }
+    },
     "node_modules/es-errors": {
       "version": "1.3.0",
       "resolved": "https://registry.npmjs.org/es-errors/-/es-errors-1.3.0.tgz",
@@ -4092,6 +4901,35 @@
         "node": ">= 0.4"
       }
     },
+    "node_modules/es-object-atoms": {
+      "version": "1.1.2",
+      "resolved": "https://registry.npmjs.org/es-object-atoms/-/es-object-atoms-1.1.2.tgz",
+      "integrity": "sha512-HWcBoN6NileqtSydK2FqHbS/LoDd2pqrnQHLyJzBj4kOp/ky2MWMN694xOfkK8/SnUsW2DH7EfyVlydKCsm1Zw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "es-errors": "^1.3.0"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      }
+    },
+    "node_modules/es-set-tostringtag": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/es-set-tostringtag/-/es-set-tostringtag-2.1.0.tgz",
+      "integrity": "sha512-j6vWzfrGVfyXxge+O0x5sh6cvxAog0a/4Rdd2K36zCMV5eJ+/+tOAngRO8cODMNWbVRdVlmGZQL2YS3yR8bIUA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "es-errors": "^1.3.0",
+        "get-intrinsic": "^1.2.6",
+        "has-tostringtag": "^1.0.2",
+        "hasown": "^2.0.2"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      }
+    },
     "node_modules/escalade": {
       "version": "3.2.0",
       "resolved": "https://registry.npmjs.org/escalade/-/escalade-3.2.0.tgz",
@@ -4119,6 +4957,39 @@
         "url": "https://github.com/sponsors/sindresorhus"
       }
     },
+    "node_modules/escodegen": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/escodegen/-/escodegen-2.1.0.tgz",
+      "integrity": "sha512-2NlIDTwUWJN0mRPQOdtQBzbUHvdGY2P1VXSyU83Q3xKxM7WHX2Ql8dKq782Q9TgQUNOLEzEYu9bzLNj1q88I5w==",
+      "dev": true,
+      "license": "BSD-2-Clause",
+      "dependencies": {
+        "esprima": "^4.0.1",
+        "estraverse": "^5.2.0",
+        "esutils": "^2.0.2"
+      },
+      "bin": {
+        "escodegen": "bin/escodegen.js",
+        "esgenerate": "bin/esgenerate.js"
+      },
+      "engines": {
+        "node": ">=6.0"
+      },
+      "optionalDependencies": {
+        "source-map": "~0.6.1"
+      }
+    },
+    "node_modules/escodegen/node_modules/source-map": {
+      "version": "0.6.1",
+      "resolved": "https://registry.npmjs.org/source-map/-/source-map-0.6.1.tgz",
+      "integrity": "sha512-UjgapumWlbMhkBgzT7Ykc5YXUT46F0iKu8SGXq0bcwP5dz/h0Plj6enJqjz1Zbq2l5WaqYnrVbwWOWMyF3F47g==",
+      "dev": true,
+      "license": "BSD-3-Clause",
+      "optional": true,
+      "engines": {
+        "node": ">=0.10.0"
+      }
+    },
     "node_modules/esprima": {
       "version": "4.0.1",
       "resolved": "https://registry.npmjs.org/esprima/-/esprima-4.0.1.tgz",
@@ -4132,6 +5003,26 @@
         "node": ">=4"
       }
     },
+    "node_modules/estraverse": {
+      "version": "5.3.0",
+      "resolved": "https://registry.npmjs.org/estraverse/-/estraverse-5.3.0.tgz",
+      "integrity": "sha512-MMdARuVEQziNTeJD8DgMqmhwR11BRQ/cBP+pLtYdSTnf3MIO8fFeiINEbX36ZdNlfU/7A9f3gUw49B3oQsvwBA==",
+      "dev": true,
+      "license": "BSD-2-Clause",
+      "engines": {
+        "node": ">=4.0"
+      }
+    },
+    "node_modules/esutils": {
+      "version": "2.0.3",
+      "resolved": "https://registry.npmjs.org/esutils/-/esutils-2.0.3.tgz",
+      "integrity": "sha512-kVscqXk4OCp68SZ0dkgEKVi6/8ij300KBWTJq32P/dYeWTSwK41WyTxalN1eRmA5Z9UU/LX9D7FWSmV9SAYx6g==",
+      "dev": true,
+      "license": "BSD-2-Clause",
+      "engines": {
+        "node": ">=0.10.0"
+      }
+    },
     "node_modules/etag": {
       "version": "1.8.1",
       "resolved": "https://registry.npmjs.org/etag/-/etag-1.8.1.tgz",
@@ -4150,6 +5041,118 @@
         "node": ">=6"
       }
     },
+    "node_modules/execa": {
+      "version": "5.1.1",
+      "resolved": "https://registry.npmjs.org/execa/-/execa-5.1.1.tgz",
+      "integrity": "sha512-8uSpZZocAZRBAPIEINJj3Lo9HyGitllczc27Eh5YYojjMFMn8yHMDMaUHE2Jqfq05D/wucwI4JGURyXt1vchyg==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "cross-spawn": "^7.0.3",
+        "get-stream": "^6.0.0",
+        "human-signals": "^2.1.0",
+        "is-stream": "^2.0.0",
+        "merge-stream": "^2.0.0",
+        "npm-run-path": "^4.0.1",
+        "onetime": "^5.1.2",
+        "signal-exit": "^3.0.3",
+        "strip-final-newline": "^2.0.0"
+      },
+      "engines": {
+        "node": ">=10"
+      },
+      "funding": {
+        "url": "https://github.com/sindresorhus/execa?sponsor=1"
+      }
+    },
+    "node_modules/execa/node_modules/mimic-fn": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/mimic-fn/-/mimic-fn-2.1.0.tgz",
+      "integrity": "sha512-OqbOk5oEQeAZ8WXWydlu9HJjz9WVdEIvamMCcXmuqUYjTknH/sqsWvhQ3vgwKFRR1HpjvNBKQ37nbJgYzGqGcg==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "engines": {
+        "node": ">=6"
+      }
+    },
+    "node_modules/execa/node_modules/onetime": {
+      "version": "5.1.2",
+      "resolved": "https://registry.npmjs.org/onetime/-/onetime-5.1.2.tgz",
+      "integrity": "sha512-kbpaSSGJTWdAY5KPVeMOKXSrPtr8C8C7wodJbcsd51jRnmD+GZu8Y0VoU6Dm5Z4vWr0Ig/1NKuWRKf7j5aaYSg==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "mimic-fn": "^2.1.0"
+      },
+      "engines": {
+        "node": ">=6"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/exit": {
+      "version": "0.1.2",
+      "resolved": "https://registry.npmjs.org/exit/-/exit-0.1.2.tgz",
+      "integrity": "sha512-Zk/eNKV2zbjpKzrsQ+n1G6poVbErQxJ0LBOJXaKZ1EViLzH+hrLu9cdXI4zw9dBQJslwBEpbQ2P1oS7nDxs6jQ==",
+      "devOptional": true,
+      "peer": true,
+      "engines": {
+        "node": ">= 0.8.0"
+      }
+    },
+    "node_modules/expect": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/expect/-/expect-29.7.0.tgz",
+      "integrity": "sha512-2Zks0hf1VLFYI1kbh0I5jP3KHHyCHpkfyHBzsSXRFgl/Bg9mWYfMW8oD+PdMPlEwy5HNsR9JutYy6pMeOh61nw==",
+      "devOptional": true,
+      "license": "MIT",
+      "dependencies": {
+        "@jest/expect-utils": "^29.7.0",
+        "jest-get-type": "^29.6.3",
+        "jest-matcher-utils": "^29.7.0",
+        "jest-message-util": "^29.7.0",
+        "jest-util": "^29.7.0"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
+    "node_modules/expect/node_modules/jest-diff": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/jest-diff/-/jest-diff-29.7.0.tgz",
+      "integrity": "sha512-LMIgiIrhigmPrs03JHpxUh2yISK3vLFPkAodPeo0+BuF7wA2FoQbkEg1u8gBYBThncu7e1oEDUfIXVuTqLRUjw==",
+      "devOptional": true,
+      "license": "MIT",
+      "dependencies": {
+        "chalk": "^4.0.0",
+        "diff-sequences": "^29.6.3",
+        "jest-get-type": "^29.6.3",
+        "pretty-format": "^29.7.0"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
+    "node_modules/expect/node_modules/jest-matcher-utils": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/jest-matcher-utils/-/jest-matcher-utils-29.7.0.tgz",
+      "integrity": "sha512-sBkD+Xi9DtcChsI3L3u0+N0opgPYnCRPtGcQYrgXmR+hmt/fYfWAL0xRXYU8eWOdfuLgBe0YCW3AFtnRLagq/g==",
+      "devOptional": true,
+      "license": "MIT",
+      "dependencies": {
+        "chalk": "^4.0.0",
+        "jest-diff": "^29.7.0",
+        "jest-get-type": "^29.6.3",
+        "pretty-format": "^29.7.0"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
     "node_modules/expo": {
       "version": "54.0.35",
       "resolved": "https://registry.npmjs.org/expo/-/expo-54.0.35.tgz",
@@ -5032,6 +6035,23 @@
       "integrity": "sha512-6FPvD/IVyT4ZlNe7Wcn5Fb/4ChigpucKYSvD6a+0iMoLn2inpo711eyIcKjmDtE5XNcgAkSH9uN/nfAeZzHEfg==",
       "license": "BSD-2-Clause"
     },
+    "node_modules/form-data": {
+      "version": "4.0.6",
+      "resolved": "https://registry.npmjs.org/form-data/-/form-data-4.0.6.tgz",
+      "integrity": "sha512-vKatAh4SlVfgbv+YtmhiRjhEMJsYpsG1Y2rMQtR+SVSbytsSD1YGzDIcrAJmdFec88u/+VoGmxnl+80gL1tRCQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "asynckit": "^0.4.0",
+        "combined-stream": "^1.0.8",
+        "es-set-tostringtag": "^2.1.0",
+        "hasown": "^2.0.4",
+        "mime-types": "^2.1.35"
+      },
+      "engines": {
+        "node": ">= 6"
+      }
+    },
     "node_modules/freeport-async": {
       "version": "2.0.0",
       "resolved": "https://registry.npmjs.org/freeport-async/-/freeport-async-2.0.0.tgz",
@@ -5097,6 +6117,31 @@
         "node": "6.* || 8.* || >= 10.*"
       }
     },
+    "node_modules/get-intrinsic": {
+      "version": "1.3.0",
+      "resolved": "https://registry.npmjs.org/get-intrinsic/-/get-intrinsic-1.3.0.tgz",
+      "integrity": "sha512-9fSjSaos/fRIVIp+xSJlE6lfwhES7LNtKaCBIamHsjr2na1BiABJPo0mOjjz8GJDURarmCPGqaiVg5mfjb98CQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "call-bind-apply-helpers": "^1.0.2",
+        "es-define-property": "^1.0.1",
+        "es-errors": "^1.3.0",
+        "es-object-atoms": "^1.1.1",
+        "function-bind": "^1.1.2",
+        "get-proto": "^1.0.1",
+        "gopd": "^1.2.0",
+        "has-symbols": "^1.1.0",
+        "hasown": "^2.0.2",
+        "math-intrinsics": "^1.1.0"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
     "node_modules/get-nonce": {
       "version": "1.0.1",
       "resolved": "https://registry.npmjs.org/get-nonce/-/get-nonce-1.0.1.tgz",
@@ -5115,6 +6160,34 @@
         "node": ">=8.0.0"
       }
     },
+    "node_modules/get-proto": {
+      "version": "1.0.1",
+      "resolved": "https://registry.npmjs.org/get-proto/-/get-proto-1.0.1.tgz",
+      "integrity": "sha512-sTSfBjoXBp89JvIKIefqw7U2CCebsc74kiY6awiGogKtoSGbgjYE/G/+l9sF3MWFPNc9IcoOC4ODfKHfxFmp0g==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "dunder-proto": "^1.0.1",
+        "es-object-atoms": "^1.0.0"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      }
+    },
+    "node_modules/get-stream": {
+      "version": "6.0.1",
+      "resolved": "https://registry.npmjs.org/get-stream/-/get-stream-6.0.1.tgz",
+      "integrity": "sha512-ts6Wi+2j3jQjqi70w5AlN8DFnkSwC+MqmxEzdEALB2qXZYV3X/b1CTfgPLGJNMeAWxdPfU8FO1ms3NUfaHCPYg==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "engines": {
+        "node": ">=10"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
     "node_modules/getenv": {
       "version": "2.0.0",
       "resolved": "https://registry.npmjs.org/getenv/-/getenv-2.0.0.tgz",
@@ -5141,6 +6214,19 @@
         "url": "https://github.com/sponsors/isaacs"
       }
     },
+    "node_modules/gopd": {
+      "version": "1.2.0",
+      "resolved": "https://registry.npmjs.org/gopd/-/gopd-1.2.0.tgz",
+      "integrity": "sha512-ZUKRh6/kUFoAiTAtTYPZJ3hw9wNxx+BIBOijnlG9PnrJsCcSjs1wyyD6vJpaYtgnzDrKYRSqf3OO6Rfa93xsRg==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
     "node_modules/graceful-fs": {
       "version": "4.2.11",
       "resolved": "https://registry.npmjs.org/graceful-fs/-/graceful-fs-4.2.11.tgz",
@@ -5156,6 +6242,35 @@
         "node": ">=8"
       }
     },
+    "node_modules/has-symbols": {
+      "version": "1.1.0",
+      "resolved": "https://registry.npmjs.org/has-symbols/-/has-symbols-1.1.0.tgz",
+      "integrity": "sha512-1cDNdwJ2Jaohmb3sg4OmKaMBwuC48sYni5HUw2DvsC8LjGTLK9h+eb1X6RyuOHe4hT0ULCW68iomhjUoKUqlPQ==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
+    "node_modules/has-tostringtag": {
+      "version": "1.0.2",
+      "resolved": "https://registry.npmjs.org/has-tostringtag/-/has-tostringtag-1.0.2.tgz",
+      "integrity": "sha512-NqADB8VjPFLM2V0VvHUewwwsw0ZWBaIdgo+ieHtK3hasLz4qeCRjYcqfB6AQrBggRKppKF8L52/VqdVsO47Dlw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "has-symbols": "^1.0.3"
+      },
+      "engines": {
+        "node": ">= 0.4"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/ljharb"
+      }
+    },
     "node_modules/hasown": {
       "version": "2.0.4",
       "resolved": "https://registry.npmjs.org/hasown/-/hasown-2.0.4.tgz",
@@ -5201,6 +6316,27 @@
       "integrity": "sha512-JNAzZcXrCt42VGLuYz0zfAzDfAvJWW6AfYlDBQyDV5DClI2m5sAmK+OIO7s59XfsRsWHp02jAJrRadPRGTt6SQ==",
       "license": "ISC"
     },
+    "node_modules/html-encoding-sniffer": {
+      "version": "3.0.0",
+      "resolved": "https://registry.npmjs.org/html-encoding-sniffer/-/html-encoding-sniffer-3.0.0.tgz",
+      "integrity": "sha512-oWv4T4yJ52iKrufjnyZPkrN0CH3QnrUqdB6In1g5Fe1mia8GmF36gnfNySxoZtxD5+NmYw1EElVXiBk93UeskA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "whatwg-encoding": "^2.0.0"
+      },
+      "engines": {
+        "node": ">=12"
+      }
+    },
+    "node_modules/html-escaper": {
+      "version": "2.0.2",
+      "resolved": "https://registry.npmjs.org/html-escaper/-/html-escaper-2.0.2.tgz",
+      "integrity": "sha512-H2iMtd0I4Mt5eYiapRdIDjp+XzelXQ0tFE4JS7YFwFevXXMmOp9myNrUvCg0D6ws8iqkRPBfKHgbwig1SmlLfg==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true
+    },
     "node_modules/http-errors": {
       "version": "2.0.1",
       "resolved": "https://registry.npmjs.org/http-errors/-/http-errors-2.0.1.tgz",
@@ -5230,17 +6366,56 @@
         "node": ">= 0.8"
       }
     },
-    "node_modules/https-proxy-agent": {
-      "version": "7.0.6",
-      "resolved": "https://registry.npmjs.org/https-proxy-agent/-/https-proxy-agent-7.0.6.tgz",
-      "integrity": "sha512-vK9P5/iUfdl95AI+JVyUuIcVtd4ofvtrOr3HNtM2yxC9bnMbEdp3x01OhQNnjb8IJYi38VlTE3mBXwcfvywuSw==",
+    "node_modules/http-proxy-agent": {
+      "version": "5.0.0",
+      "resolved": "https://registry.npmjs.org/http-proxy-agent/-/http-proxy-agent-5.0.0.tgz",
+      "integrity": "sha512-n2hY8YdoRE1i7r6M0w9DIw5GgZN0G25P8zLCRQ8rjXtTU3vsNFBI/vWK/UIeE6g5MUUz6avwAPXmL6Fy9D/90w==",
+      "dev": true,
       "license": "MIT",
       "dependencies": {
-        "agent-base": "^7.1.2",
+        "@tootallnate/once": "2",
+        "agent-base": "6",
         "debug": "4"
       },
       "engines": {
-        "node": ">= 14"
+        "node": ">= 6"
+      }
+    },
+    "node_modules/http-proxy-agent/node_modules/agent-base": {
+      "version": "6.0.2",
+      "resolved": "https://registry.npmjs.org/agent-base/-/agent-base-6.0.2.tgz",
+      "integrity": "sha512-RZNwNclF7+MS/8bDg70amg32dyeZGZxiDuQmZxKLAlQjr3jGyLx+4Kkk58UO7D2QdgFIQCovuSuZESne6RG6XQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "debug": "4"
+      },
+      "engines": {
+        "node": ">= 6.0.0"
+      }
+    },
+    "node_modules/https-proxy-agent": {
+      "version": "7.0.6",
+      "resolved": "https://registry.npmjs.org/https-proxy-agent/-/https-proxy-agent-7.0.6.tgz",
+      "integrity": "sha512-vK9P5/iUfdl95AI+JVyUuIcVtd4ofvtrOr3HNtM2yxC9bnMbEdp3x01OhQNnjb8IJYi38VlTE3mBXwcfvywuSw==",
+      "license": "MIT",
+      "dependencies": {
+        "agent-base": "^7.1.2",
+        "debug": "4"
+      },
+      "engines": {
+        "node": ">= 14"
+      }
+    },
+    "node_modules/human-signals": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/human-signals/-/human-signals-2.1.0.tgz",
+      "integrity": "sha512-B4FFZ6q/T2jhhksgkbEW3HBvWIfDW85snkQgawt07S7J5QXTk6BkNV+0yAeZrM5QpMAdYlocGoljn0sJ/WQkFw==",
+      "devOptional": true,
+      "license": "Apache-2.0",
+      "peer": true,
+      "engines": {
+        "node": ">=10.17.0"
       }
     },
     "node_modules/hyphenate-style-name": {
@@ -5258,6 +6433,19 @@
         "node": ">=20.0.0"
       }
     },
+    "node_modules/iconv-lite": {
+      "version": "0.6.3",
+      "resolved": "https://registry.npmjs.org/iconv-lite/-/iconv-lite-0.6.3.tgz",
+      "integrity": "sha512-4fCk79wshMdzMp2rH06qWrJE4iolqLhCUH+OiuIgU++RB0+94NlDL81atO7GX55uUKueo0txHNtvEyI6D7WdMw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "safer-buffer": ">= 2.1.2 < 3.0.0"
+      },
+      "engines": {
+        "node": ">=0.10.0"
+      }
+    },
     "node_modules/ieee754": {
       "version": "1.2.1",
       "resolved": "https://registry.npmjs.org/ieee754/-/ieee754-1.2.1.tgz",
@@ -5302,6 +6490,27 @@
         "node": ">=16.x"
       }
     },
+    "node_modules/import-local": {
+      "version": "3.2.0",
+      "resolved": "https://registry.npmjs.org/import-local/-/import-local-3.2.0.tgz",
+      "integrity": "sha512-2SPlun1JUPWoM6t3F0dw0FkCF/jWY8kttcY4f599GLTSjh2OCuuhdTkJQsEcZzBqbXZGKMK2OqW1oZsjtf/gQA==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "pkg-dir": "^4.2.0",
+        "resolve-cwd": "^3.0.0"
+      },
+      "bin": {
+        "import-local-fixture": "fixtures/cli.js"
+      },
+      "engines": {
+        "node": ">=8"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
     "node_modules/imurmurhash": {
       "version": "0.1.4",
       "resolved": "https://registry.npmjs.org/imurmurhash/-/imurmurhash-0.1.4.tgz",
@@ -5311,6 +6520,16 @@
         "node": ">=0.8.19"
       }
     },
+    "node_modules/indent-string": {
+      "version": "4.0.0",
+      "resolved": "https://registry.npmjs.org/indent-string/-/indent-string-4.0.0.tgz",
+      "integrity": "sha512-EdDDZu4A2OyIK7Lr/2zG+w5jmbuk1DVBnEwREQvBzspBJkCEbRa8GxU1lghYcaGJCnRWibjDXlq779X1/y5xwg==",
+      "devOptional": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=8"
+      }
+    },
     "node_modules/inflight": {
       "version": "1.0.6",
       "resolved": "https://registry.npmjs.org/inflight/-/inflight-1.0.6.tgz",
@@ -5397,6 +6616,17 @@
         "node": ">=8"
       }
     },
+    "node_modules/is-generator-fn": {
+      "version": "2.1.0",
+      "resolved": "https://registry.npmjs.org/is-generator-fn/-/is-generator-fn-2.1.0.tgz",
+      "integrity": "sha512-cTIB4yPYL/Grw0EaSzASzg6bBy9gqCofvWN8okThAYIxKJZC+udlRAmGbM0XLeniEJSs8uEgHPGuHSe1XsOLSQ==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "engines": {
+        "node": ">=6"
+      }
+    },
     "node_modules/is-number": {
       "version": "7.0.0",
       "resolved": "https://registry.npmjs.org/is-number/-/is-number-7.0.0.tgz",
@@ -5415,6 +6645,27 @@
         "node": ">=8"
       }
     },
+    "node_modules/is-potential-custom-element-name": {
+      "version": "1.0.1",
+      "resolved": "https://registry.npmjs.org/is-potential-custom-element-name/-/is-potential-custom-element-name-1.0.1.tgz",
+      "integrity": "sha512-bCYeRA2rVibKZd+s2625gGnGF/t7DSqDs4dP7CrLA1m7jKWz6pps0LpYLJN8Q64HtmPKJ1hrN3nzPNKFEKOUiQ==",
+      "dev": true,
+      "license": "MIT"
+    },
+    "node_modules/is-stream": {
+      "version": "2.0.1",
+      "resolved": "https://registry.npmjs.org/is-stream/-/is-stream-2.0.1.tgz",
+      "integrity": "sha512-hFoiJiTl63nn+kstHGBtewWSKnQLpyb155KHheA1l39uvtO9nWIop1p3udqPcUd/xbF1VLMO4n7OI6p7RbngDg==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "engines": {
+        "node": ">=8"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
     "node_modules/is-wsl": {
       "version": "2.2.0",
       "resolved": "https://registry.npmjs.org/is-wsl/-/is-wsl-2.2.0.tgz",
@@ -5458,98 +6709,960 @@
         "node": ">=8"
       }
     },
-    "node_modules/jest-environment-node": {
+    "node_modules/istanbul-lib-report": {
+      "version": "3.0.1",
+      "resolved": "https://registry.npmjs.org/istanbul-lib-report/-/istanbul-lib-report-3.0.1.tgz",
+      "integrity": "sha512-GCfE1mtsHGOELCU8e/Z7YWzpmybrx/+dSTfLrvY8qRmaY6zXTKWn6WQIjaAFw069icm6GVMNkgu0NzI4iPZUNw==",
+      "devOptional": true,
+      "license": "BSD-3-Clause",
+      "peer": true,
+      "dependencies": {
+        "istanbul-lib-coverage": "^3.0.0",
+        "make-dir": "^4.0.0",
+        "supports-color": "^7.1.0"
+      },
+      "engines": {
+        "node": ">=10"
+      }
+    },
+    "node_modules/istanbul-lib-source-maps": {
+      "version": "4.0.1",
+      "resolved": "https://registry.npmjs.org/istanbul-lib-source-maps/-/istanbul-lib-source-maps-4.0.1.tgz",
+      "integrity": "sha512-n3s8EwkdFIJCG3BPKBYvskgXGoy88ARzvegkitk60NxRdwltLOTaH7CUiMRXvwYorl0Q712iEjcWB+fK/MrWVw==",
+      "devOptional": true,
+      "license": "BSD-3-Clause",
+      "peer": true,
+      "dependencies": {
+        "debug": "^4.1.1",
+        "istanbul-lib-coverage": "^3.0.0",
+        "source-map": "^0.6.1"
+      },
+      "engines": {
+        "node": ">=10"
+      }
+    },
+    "node_modules/istanbul-lib-source-maps/node_modules/source-map": {
+      "version": "0.6.1",
+      "resolved": "https://registry.npmjs.org/source-map/-/source-map-0.6.1.tgz",
+      "integrity": "sha512-UjgapumWlbMhkBgzT7Ykc5YXUT46F0iKu8SGXq0bcwP5dz/h0Plj6enJqjz1Zbq2l5WaqYnrVbwWOWMyF3F47g==",
+      "devOptional": true,
+      "license": "BSD-3-Clause",
+      "peer": true,
+      "engines": {
+        "node": ">=0.10.0"
+      }
+    },
+    "node_modules/istanbul-reports": {
+      "version": "3.2.0",
+      "resolved": "https://registry.npmjs.org/istanbul-reports/-/istanbul-reports-3.2.0.tgz",
+      "integrity": "sha512-HGYWWS/ehqTV3xN10i23tkPkpH46MLCIMFNCaaKNavAXTF1RkqxawEPtnjnGZ6XKSInBKkiOA5BKS+aZiY3AvA==",
+      "devOptional": true,
+      "license": "BSD-3-Clause",
+      "peer": true,
+      "dependencies": {
+        "html-escaper": "^2.0.0",
+        "istanbul-lib-report": "^3.0.0"
+      },
+      "engines": {
+        "node": ">=8"
+      }
+    },
+    "node_modules/jest": {
       "version": "29.7.0",
-      "resolved": "https://registry.npmjs.org/jest-environment-node/-/jest-environment-node-29.7.0.tgz",
-      "integrity": "sha512-DOSwCRqXirTOyheM+4d5YZOrWcdu0LNZ87ewUoywbcb2XR4wKgqiG8vNeYwhjFMbEkfju7wx2GYH0P2gevGvFw==",
+      "resolved": "https://registry.npmjs.org/jest/-/jest-29.7.0.tgz",
+      "integrity": "sha512-NIy3oAFp9shda19hy4HK0HRTWKtPJmGdnvywu01nOqNC2vZg+Z+fvJDxpMQA88eb2I9EcafcdjYgsDthnYTvGw==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "@jest/core": "^29.7.0",
+        "@jest/types": "^29.6.3",
+        "import-local": "^3.0.2",
+        "jest-cli": "^29.7.0"
+      },
+      "bin": {
+        "jest": "bin/jest.js"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      },
+      "peerDependencies": {
+        "node-notifier": "^8.0.1 || ^9.0.0 || ^10.0.0"
+      },
+      "peerDependenciesMeta": {
+        "node-notifier": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/jest-changed-files": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/jest-changed-files/-/jest-changed-files-29.7.0.tgz",
+      "integrity": "sha512-fEArFiwf1BpQ+4bXSprcDc3/x4HSzL4al2tozwVpDFpsxALjLYdyiIK4e5Vz66GQJIbXJ82+35PtysofptNX2w==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "execa": "^5.0.0",
+        "jest-util": "^29.7.0",
+        "p-limit": "^3.1.0"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
+    "node_modules/jest-circus": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/jest-circus/-/jest-circus-29.7.0.tgz",
+      "integrity": "sha512-3E1nCMgipcTkCocFwM90XXQab9bS+GMsjdpmPrlelaxwD93Ad8iVEjX/vvHPdLPnFf+L40u+5+iutRdA1N9myw==",
+      "devOptional": true,
       "license": "MIT",
+      "peer": true,
       "dependencies": {
         "@jest/environment": "^29.7.0",
-        "@jest/fake-timers": "^29.7.0",
+        "@jest/expect": "^29.7.0",
+        "@jest/test-result": "^29.7.0",
         "@jest/types": "^29.6.3",
         "@types/node": "*",
-        "jest-mock": "^29.7.0",
-        "jest-util": "^29.7.0"
+        "chalk": "^4.0.0",
+        "co": "^4.6.0",
+        "dedent": "^1.0.0",
+        "is-generator-fn": "^2.0.0",
+        "jest-each": "^29.7.0",
+        "jest-matcher-utils": "^29.7.0",
+        "jest-message-util": "^29.7.0",
+        "jest-runtime": "^29.7.0",
+        "jest-snapshot": "^29.7.0",
+        "jest-util": "^29.7.0",
+        "p-limit": "^3.1.0",
+        "pretty-format": "^29.7.0",
+        "pure-rand": "^6.0.0",
+        "slash": "^3.0.0",
+        "stack-utils": "^2.0.3"
       },
       "engines": {
         "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
       }
     },
-    "node_modules/jest-get-type": {
-      "version": "29.6.3",
-      "resolved": "https://registry.npmjs.org/jest-get-type/-/jest-get-type-29.6.3.tgz",
-      "integrity": "sha512-zrteXnqYxfQh7l5FHyL38jL39di8H8rHoecLH3JNxH3BwOrBsNeabdap5e0I23lD4HHI8W5VFBZqG4Eaq5LNcw==",
+    "node_modules/jest-circus/node_modules/jest-diff": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/jest-diff/-/jest-diff-29.7.0.tgz",
+      "integrity": "sha512-LMIgiIrhigmPrs03JHpxUh2yISK3vLFPkAodPeo0+BuF7wA2FoQbkEg1u8gBYBThncu7e1oEDUfIXVuTqLRUjw==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "chalk": "^4.0.0",
+        "diff-sequences": "^29.6.3",
+        "jest-get-type": "^29.6.3",
+        "pretty-format": "^29.7.0"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
+    "node_modules/jest-circus/node_modules/jest-matcher-utils": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/jest-matcher-utils/-/jest-matcher-utils-29.7.0.tgz",
+      "integrity": "sha512-sBkD+Xi9DtcChsI3L3u0+N0opgPYnCRPtGcQYrgXmR+hmt/fYfWAL0xRXYU8eWOdfuLgBe0YCW3AFtnRLagq/g==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "chalk": "^4.0.0",
+        "jest-diff": "^29.7.0",
+        "jest-get-type": "^29.6.3",
+        "pretty-format": "^29.7.0"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
+    "node_modules/jest-cli": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/jest-cli/-/jest-cli-29.7.0.tgz",
+      "integrity": "sha512-OVVobw2IubN/GSYsxETi+gOe7Ka59EFMR/twOU3Jb2GnKKeMGJB5SGUUrEz3SFVmJASUdZUzy83sLNNQ2gZslg==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "@jest/core": "^29.7.0",
+        "@jest/test-result": "^29.7.0",
+        "@jest/types": "^29.6.3",
+        "chalk": "^4.0.0",
+        "create-jest": "^29.7.0",
+        "exit": "^0.1.2",
+        "import-local": "^3.0.2",
+        "jest-config": "^29.7.0",
+        "jest-util": "^29.7.0",
+        "jest-validate": "^29.7.0",
+        "yargs": "^17.3.1"
+      },
+      "bin": {
+        "jest": "bin/jest.js"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      },
+      "peerDependencies": {
+        "node-notifier": "^8.0.1 || ^9.0.0 || ^10.0.0"
+      },
+      "peerDependenciesMeta": {
+        "node-notifier": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/jest-config": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/jest-config/-/jest-config-29.7.0.tgz",
+      "integrity": "sha512-uXbpfeQ7R6TZBqI3/TxCU4q4ttk3u0PJeC+E0zbfSoSjq6bJ7buBPxzQPL0ifrkY4DNu4JUdk0ImlBUYi840eQ==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "@babel/core": "^7.11.6",
+        "@jest/test-sequencer": "^29.7.0",
+        "@jest/types": "^29.6.3",
+        "babel-jest": "^29.7.0",
+        "chalk": "^4.0.0",
+        "ci-info": "^3.2.0",
+        "deepmerge": "^4.2.2",
+        "glob": "^7.1.3",
+        "graceful-fs": "^4.2.9",
+        "jest-circus": "^29.7.0",
+        "jest-environment-node": "^29.7.0",
+        "jest-get-type": "^29.6.3",
+        "jest-regex-util": "^29.6.3",
+        "jest-resolve": "^29.7.0",
+        "jest-runner": "^29.7.0",
+        "jest-util": "^29.7.0",
+        "jest-validate": "^29.7.0",
+        "micromatch": "^4.0.4",
+        "parse-json": "^5.2.0",
+        "pretty-format": "^29.7.0",
+        "slash": "^3.0.0",
+        "strip-json-comments": "^3.1.1"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      },
+      "peerDependencies": {
+        "@types/node": "*",
+        "ts-node": ">=9.0.0"
+      },
+      "peerDependenciesMeta": {
+        "@types/node": {
+          "optional": true
+        },
+        "ts-node": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/jest-config/node_modules/balanced-match": {
+      "version": "1.0.2",
+      "resolved": "https://registry.npmjs.org/balanced-match/-/balanced-match-1.0.2.tgz",
+      "integrity": "sha512-3oSeUO0TMV67hN1AmbXsK4yaqU7tjiHlbxRDZOpH0KW9+CeX4bRAaX0Anxt0tx2MrpRpWwQaPwIlISEJhYU5Pw==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true
+    },
+    "node_modules/jest-config/node_modules/brace-expansion": {
+      "version": "1.1.15",
+      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-1.1.15.tgz",
+      "integrity": "sha512-EwOCDEex4quD37XhqM3omwtMoJjr//isUZz1JopUNWms+4Z2ViyM/k1YIRePpoVNnQhENnxtFjLaxNHrT7xIUg==",
+      "devOptional": true,
       "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "balanced-match": "^1.0.0",
+        "concat-map": "0.0.1"
+      }
+    },
+    "node_modules/jest-config/node_modules/ci-info": {
+      "version": "3.9.0",
+      "resolved": "https://registry.npmjs.org/ci-info/-/ci-info-3.9.0.tgz",
+      "integrity": "sha512-NIxF55hv4nSqQswkAeiOi1r83xy8JldOFDTWiug55KBu9Jnblncd2U6ViHmYgHf01TPZS77NJBhBMKdWj9HQMQ==",
+      "devOptional": true,
+      "funding": [
+        {
+          "type": "github",
+          "url": "https://github.com/sponsors/sibiraj-s"
+        }
+      ],
+      "license": "MIT",
+      "peer": true,
+      "engines": {
+        "node": ">=8"
+      }
+    },
+    "node_modules/jest-config/node_modules/glob": {
+      "version": "7.2.3",
+      "resolved": "https://registry.npmjs.org/glob/-/glob-7.2.3.tgz",
+      "integrity": "sha512-nFR0zLpU2YCaRxwoCJvL6UvCH2JFyFVIvwTLsIf21AuHlMskA1hhTdk+LlYJtOlYt9v6dvszD2BGRqBL+iQK9Q==",
+      "deprecated": "Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me",
+      "devOptional": true,
+      "license": "ISC",
+      "peer": true,
+      "dependencies": {
+        "fs.realpath": "^1.0.0",
+        "inflight": "^1.0.4",
+        "inherits": "2",
+        "minimatch": "^3.1.1",
+        "once": "^1.3.0",
+        "path-is-absolute": "^1.0.0"
+      },
+      "engines": {
+        "node": "*"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/isaacs"
+      }
+    },
+    "node_modules/jest-config/node_modules/minimatch": {
+      "version": "3.1.5",
+      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-3.1.5.tgz",
+      "integrity": "sha512-VgjWUsnnT6n+NUk6eZq77zeFdpW2LWDzP6zFGrCbHXiYNul5Dzqk2HHQ5uFH2DNW5Xbp8+jVzaeNt94ssEEl4w==",
+      "devOptional": true,
+      "license": "ISC",
+      "peer": true,
+      "dependencies": {
+        "brace-expansion": "^1.1.7"
+      },
+      "engines": {
+        "node": "*"
+      }
+    },
+    "node_modules/jest-config/node_modules/strip-json-comments": {
+      "version": "3.1.1",
+      "resolved": "https://registry.npmjs.org/strip-json-comments/-/strip-json-comments-3.1.1.tgz",
+      "integrity": "sha512-6fPc+R4ihwqP6N/aIv2f1gMH8lOVtWQHoqC4yK6oSDVVocumAsfCqjkXnqiYMhmMwS/mEHLp7Vehlt3ql6lEig==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "engines": {
+        "node": ">=8"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/jest-diff": {
+      "version": "30.4.1",
+      "resolved": "https://registry.npmjs.org/jest-diff/-/jest-diff-30.4.1.tgz",
+      "integrity": "sha512-CRpFK0RtLriVDGcPPAnR6HMVI8bSR2jnUIgralhauzYQZIb4RH9AtEInTuQr65LmmGggGcRT6HIASxwqsVsmlA==",
+      "devOptional": true,
+      "license": "MIT",
+      "dependencies": {
+        "@jest/diff-sequences": "30.4.0",
+        "@jest/get-type": "30.1.0",
+        "chalk": "^4.1.2",
+        "pretty-format": "30.4.1"
+      },
+      "engines": {
+        "node": "^18.14.0 || ^20.0.0 || ^22.0.0 || >=24.0.0"
+      }
+    },
+    "node_modules/jest-diff/node_modules/@jest/schemas": {
+      "version": "30.4.1",
+      "resolved": "https://registry.npmjs.org/@jest/schemas/-/schemas-30.4.1.tgz",
+      "integrity": "sha512-i6b4qw5qnP8c5FEeBJg/uZQ4ddrkN6Ca8qISJh0pr7a5hfn3h3v5x60BEbOC7OYAGZNMs1LfFLwnW2CuK8F57Q==",
+      "devOptional": true,
+      "license": "MIT",
+      "dependencies": {
+        "@sinclair/typebox": "^0.34.0"
+      },
+      "engines": {
+        "node": "^18.14.0 || ^20.0.0 || ^22.0.0 || >=24.0.0"
+      }
+    },
+    "node_modules/jest-diff/node_modules/@sinclair/typebox": {
+      "version": "0.34.49",
+      "resolved": "https://registry.npmjs.org/@sinclair/typebox/-/typebox-0.34.49.tgz",
+      "integrity": "sha512-brySQQs7Jtn0joV8Xh9ZV/hZb9Ozb0pmazDIASBkYKCjXrXU3mpcFahmK/z4YDhGkQvP9mWJbVyahdtU5wQA+A==",
+      "devOptional": true,
+      "license": "MIT"
+    },
+    "node_modules/jest-diff/node_modules/ansi-styles": {
+      "version": "5.2.0",
+      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-5.2.0.tgz",
+      "integrity": "sha512-Cxwpt2SfTzTtXcfOlzGEee8O+c+MmUgGrNiBcXnuWxuFJHe6a5Hz7qwhwe5OgaSYI0IJvkLqWX1ASG+cJOkEiA==",
+      "devOptional": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=10"
+      },
+      "funding": {
+        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
+      }
+    },
+    "node_modules/jest-diff/node_modules/pretty-format": {
+      "version": "30.4.1",
+      "resolved": "https://registry.npmjs.org/pretty-format/-/pretty-format-30.4.1.tgz",
+      "integrity": "sha512-K6KiKMHTL4jjX4u3Kir2EW07nRfcqVTXIImx50wbjHQTcZPgg+gjVeNTIT3l3L1Rd4UefxfogquC9J37SoFyyw==",
+      "devOptional": true,
+      "license": "MIT",
+      "dependencies": {
+        "@jest/schemas": "30.4.1",
+        "ansi-styles": "^5.2.0",
+        "react-is-18": "npm:react-is@^18.3.1",
+        "react-is-19": "npm:react-is@^19.2.5"
+      },
+      "engines": {
+        "node": "^18.14.0 || ^20.0.0 || ^22.0.0 || >=24.0.0"
+      }
+    },
+    "node_modules/jest-docblock": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/jest-docblock/-/jest-docblock-29.7.0.tgz",
+      "integrity": "sha512-q617Auw3A612guyaFgsbFeYpNP5t2aoUNLwBUbc/0kD1R4t9ixDbyFTHd1nok4epoVFpr7PmeWHrhvuV3XaJ4g==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "detect-newline": "^3.0.0"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
+    "node_modules/jest-each": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/jest-each/-/jest-each-29.7.0.tgz",
+      "integrity": "sha512-gns+Er14+ZrEoC5fhOfYCY1LOHHr0TI+rQUHZS8Ttw2l7gl+80eHc/gFf2Ktkw0+SIACDTeWvpFcv3B04VembQ==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "@jest/types": "^29.6.3",
+        "chalk": "^4.0.0",
+        "jest-get-type": "^29.6.3",
+        "jest-util": "^29.7.0",
+        "pretty-format": "^29.7.0"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
+    "node_modules/jest-environment-jsdom": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/jest-environment-jsdom/-/jest-environment-jsdom-29.7.0.tgz",
+      "integrity": "sha512-k9iQbsf9OyOfdzWH8HDmrRT0gSIcX+FLNW7IQq94tFX0gynPwqDTW0Ho6iMVNjGz/nb+l/vW3dWM2bbLLpkbXA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@jest/environment": "^29.7.0",
+        "@jest/fake-timers": "^29.7.0",
+        "@jest/types": "^29.6.3",
+        "@types/jsdom": "^20.0.0",
+        "@types/node": "*",
+        "jest-mock": "^29.7.0",
+        "jest-util": "^29.7.0",
+        "jsdom": "^20.0.0"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      },
+      "peerDependencies": {
+        "canvas": "^2.5.0"
+      },
+      "peerDependenciesMeta": {
+        "canvas": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/jest-environment-node": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/jest-environment-node/-/jest-environment-node-29.7.0.tgz",
+      "integrity": "sha512-DOSwCRqXirTOyheM+4d5YZOrWcdu0LNZ87ewUoywbcb2XR4wKgqiG8vNeYwhjFMbEkfju7wx2GYH0P2gevGvFw==",
+      "license": "MIT",
+      "dependencies": {
+        "@jest/environment": "^29.7.0",
+        "@jest/fake-timers": "^29.7.0",
+        "@jest/types": "^29.6.3",
+        "@types/node": "*",
+        "jest-mock": "^29.7.0",
+        "jest-util": "^29.7.0"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
+    "node_modules/jest-expo": {
+      "version": "54.0.17",
+      "resolved": "https://registry.npmjs.org/jest-expo/-/jest-expo-54.0.17.tgz",
+      "integrity": "sha512-LyIhrsP4xvHEEcR1R024u/LBj3uPpAgB+UljgV+YXWkEHjprnr0KpE4tROsMNYCVTM1pPlAnPuoBmn5gnAN9KA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "@expo/config": "~12.0.13",
+        "@expo/json-file": "^10.0.8",
+        "@jest/create-cache-key-function": "^29.2.1",
+        "@jest/globals": "^29.2.1",
+        "babel-jest": "^29.2.1",
+        "jest-environment-jsdom": "^29.2.1",
+        "jest-snapshot": "^29.2.1",
+        "jest-watch-select-projects": "^2.0.0",
+        "jest-watch-typeahead": "2.2.1",
+        "json5": "^2.2.3",
+        "lodash": "^4.17.19",
+        "react-test-renderer": "19.1.0",
+        "server-only": "^0.0.1",
+        "stacktrace-js": "^2.0.2"
+      },
+      "bin": {
+        "jest": "bin/jest.js"
+      },
+      "peerDependencies": {
+        "expo": "*",
+        "react-native": "*",
+        "react-server-dom-webpack": "~19.0.4 || ~19.1.5 || ~19.2.4"
+      },
+      "peerDependenciesMeta": {
+        "react-server-dom-webpack": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/jest-get-type": {
+      "version": "29.6.3",
+      "resolved": "https://registry.npmjs.org/jest-get-type/-/jest-get-type-29.6.3.tgz",
+      "integrity": "sha512-zrteXnqYxfQh7l5FHyL38jL39di8H8rHoecLH3JNxH3BwOrBsNeabdap5e0I23lD4HHI8W5VFBZqG4Eaq5LNcw==",
+      "license": "MIT",
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
+    "node_modules/jest-haste-map": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/jest-haste-map/-/jest-haste-map-29.7.0.tgz",
+      "integrity": "sha512-fP8u2pyfqx0K1rGn1R9pyE0/KTn+G7PxktWidOBTqFPLYX0b9ksaMFkhK5vrS3DVun09pckLdlx90QthlW7AmA==",
+      "license": "MIT",
+      "dependencies": {
+        "@jest/types": "^29.6.3",
+        "@types/graceful-fs": "^4.1.3",
+        "@types/node": "*",
+        "anymatch": "^3.0.3",
+        "fb-watchman": "^2.0.0",
+        "graceful-fs": "^4.2.9",
+        "jest-regex-util": "^29.6.3",
+        "jest-util": "^29.7.0",
+        "jest-worker": "^29.7.0",
+        "micromatch": "^4.0.4",
+        "walker": "^1.0.8"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      },
+      "optionalDependencies": {
+        "fsevents": "^2.3.2"
+      }
+    },
+    "node_modules/jest-leak-detector": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/jest-leak-detector/-/jest-leak-detector-29.7.0.tgz",
+      "integrity": "sha512-kYA8IJcSYtST2BY9I+SMC32nDpBT3J2NvWJx8+JCuCdl/CR1I4EKUJROiP8XtCcxqgTTBGJNdbB1A8XRKbTetw==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "jest-get-type": "^29.6.3",
+        "pretty-format": "^29.7.0"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
+    "node_modules/jest-matcher-utils": {
+      "version": "30.4.1",
+      "resolved": "https://registry.npmjs.org/jest-matcher-utils/-/jest-matcher-utils-30.4.1.tgz",
+      "integrity": "sha512-zvYfX5CaeEkFrrLS9suWe9rvJrm9J1Iv3ua8kIBv9GEPzcnsfBf0bob37la7s67fs0nlBC3EuvkOLnXQKxtx4A==",
+      "devOptional": true,
+      "license": "MIT",
+      "dependencies": {
+        "@jest/get-type": "30.1.0",
+        "chalk": "^4.1.2",
+        "jest-diff": "30.4.1",
+        "pretty-format": "30.4.1"
+      },
+      "engines": {
+        "node": "^18.14.0 || ^20.0.0 || ^22.0.0 || >=24.0.0"
+      }
+    },
+    "node_modules/jest-matcher-utils/node_modules/@jest/schemas": {
+      "version": "30.4.1",
+      "resolved": "https://registry.npmjs.org/@jest/schemas/-/schemas-30.4.1.tgz",
+      "integrity": "sha512-i6b4qw5qnP8c5FEeBJg/uZQ4ddrkN6Ca8qISJh0pr7a5hfn3h3v5x60BEbOC7OYAGZNMs1LfFLwnW2CuK8F57Q==",
+      "devOptional": true,
+      "license": "MIT",
+      "dependencies": {
+        "@sinclair/typebox": "^0.34.0"
+      },
+      "engines": {
+        "node": "^18.14.0 || ^20.0.0 || ^22.0.0 || >=24.0.0"
+      }
+    },
+    "node_modules/jest-matcher-utils/node_modules/@sinclair/typebox": {
+      "version": "0.34.49",
+      "resolved": "https://registry.npmjs.org/@sinclair/typebox/-/typebox-0.34.49.tgz",
+      "integrity": "sha512-brySQQs7Jtn0joV8Xh9ZV/hZb9Ozb0pmazDIASBkYKCjXrXU3mpcFahmK/z4YDhGkQvP9mWJbVyahdtU5wQA+A==",
+      "devOptional": true,
+      "license": "MIT"
+    },
+    "node_modules/jest-matcher-utils/node_modules/ansi-styles": {
+      "version": "5.2.0",
+      "resolved": "https://registry.npmjs.org/ansi-styles/-/ansi-styles-5.2.0.tgz",
+      "integrity": "sha512-Cxwpt2SfTzTtXcfOlzGEee8O+c+MmUgGrNiBcXnuWxuFJHe6a5Hz7qwhwe5OgaSYI0IJvkLqWX1ASG+cJOkEiA==",
+      "devOptional": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=10"
+      },
+      "funding": {
+        "url": "https://github.com/chalk/ansi-styles?sponsor=1"
+      }
+    },
+    "node_modules/jest-matcher-utils/node_modules/pretty-format": {
+      "version": "30.4.1",
+      "resolved": "https://registry.npmjs.org/pretty-format/-/pretty-format-30.4.1.tgz",
+      "integrity": "sha512-K6KiKMHTL4jjX4u3Kir2EW07nRfcqVTXIImx50wbjHQTcZPgg+gjVeNTIT3l3L1Rd4UefxfogquC9J37SoFyyw==",
+      "devOptional": true,
+      "license": "MIT",
+      "dependencies": {
+        "@jest/schemas": "30.4.1",
+        "ansi-styles": "^5.2.0",
+        "react-is-18": "npm:react-is@^18.3.1",
+        "react-is-19": "npm:react-is@^19.2.5"
+      },
+      "engines": {
+        "node": "^18.14.0 || ^20.0.0 || ^22.0.0 || >=24.0.0"
+      }
+    },
+    "node_modules/jest-message-util": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/jest-message-util/-/jest-message-util-29.7.0.tgz",
+      "integrity": "sha512-GBEV4GRADeP+qtB2+6u61stea8mGcOT4mCtrYISZwfu9/ISHFJ/5zOMXYbpBE9RsS5+Gb63DW4FgmnKJ79Kf6w==",
+      "license": "MIT",
+      "dependencies": {
+        "@babel/code-frame": "^7.12.13",
+        "@jest/types": "^29.6.3",
+        "@types/stack-utils": "^2.0.0",
+        "chalk": "^4.0.0",
+        "graceful-fs": "^4.2.9",
+        "micromatch": "^4.0.4",
+        "pretty-format": "^29.7.0",
+        "slash": "^3.0.0",
+        "stack-utils": "^2.0.3"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
+    "node_modules/jest-mock": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/jest-mock/-/jest-mock-29.7.0.tgz",
+      "integrity": "sha512-ITOMZn+UkYS4ZFh83xYAOzWStloNzJFO2s8DWrE4lhtGD+AorgnbkiKERe4wQVBydIGPx059g6riW5Btp6Llnw==",
+      "license": "MIT",
+      "dependencies": {
+        "@jest/types": "^29.6.3",
+        "@types/node": "*",
+        "jest-util": "^29.7.0"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
+    "node_modules/jest-pnp-resolver": {
+      "version": "1.2.3",
+      "resolved": "https://registry.npmjs.org/jest-pnp-resolver/-/jest-pnp-resolver-1.2.3.tgz",
+      "integrity": "sha512-+3NpwQEnRoIBtx4fyhblQDPgJI0H1IEIkX7ShLUjPGA7TtUTvI1oiKi3SR4oBR0hQhQR80l4WAe5RrXBwWMA8w==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "engines": {
+        "node": ">=6"
+      },
+      "peerDependencies": {
+        "jest-resolve": "*"
+      },
+      "peerDependenciesMeta": {
+        "jest-resolve": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/jest-regex-util": {
+      "version": "29.6.3",
+      "resolved": "https://registry.npmjs.org/jest-regex-util/-/jest-regex-util-29.6.3.tgz",
+      "integrity": "sha512-KJJBsRCyyLNWCNBOvZyRDnAIfUiRJ8v+hOBQYGn8gDyF3UegwiP4gwRR3/SDa42g1YbVycTidUF3rKjyLFDWbg==",
+      "license": "MIT",
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
+    "node_modules/jest-resolve": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/jest-resolve/-/jest-resolve-29.7.0.tgz",
+      "integrity": "sha512-IOVhZSrg+UvVAshDSDtHyFCCBUl/Q3AAJv8iZ6ZjnZ74xzvwuzLXid9IIIPgTnY62SJjfuupMKZsZQRsCvxEgA==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "chalk": "^4.0.0",
+        "graceful-fs": "^4.2.9",
+        "jest-haste-map": "^29.7.0",
+        "jest-pnp-resolver": "^1.2.2",
+        "jest-util": "^29.7.0",
+        "jest-validate": "^29.7.0",
+        "resolve": "^1.20.0",
+        "resolve.exports": "^2.0.0",
+        "slash": "^3.0.0"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
+    "node_modules/jest-resolve-dependencies": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/jest-resolve-dependencies/-/jest-resolve-dependencies-29.7.0.tgz",
+      "integrity": "sha512-un0zD/6qxJ+S0et7WxeI3H5XSe9lTBBR7bOHCHXkKR6luG5mwDDlIzVQ0V5cZCuoTgEdcdwzTghYkTWfubi+nA==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "jest-regex-util": "^29.6.3",
+        "jest-snapshot": "^29.7.0"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
+    "node_modules/jest-runner": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/jest-runner/-/jest-runner-29.7.0.tgz",
+      "integrity": "sha512-fsc4N6cPCAahybGBfTRcq5wFR6fpLznMg47sY5aDpsoejOcVYFb07AHuSnR0liMcPTgBsA3ZJL6kFOjPdoNipQ==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "@jest/console": "^29.7.0",
+        "@jest/environment": "^29.7.0",
+        "@jest/test-result": "^29.7.0",
+        "@jest/transform": "^29.7.0",
+        "@jest/types": "^29.6.3",
+        "@types/node": "*",
+        "chalk": "^4.0.0",
+        "emittery": "^0.13.1",
+        "graceful-fs": "^4.2.9",
+        "jest-docblock": "^29.7.0",
+        "jest-environment-node": "^29.7.0",
+        "jest-haste-map": "^29.7.0",
+        "jest-leak-detector": "^29.7.0",
+        "jest-message-util": "^29.7.0",
+        "jest-resolve": "^29.7.0",
+        "jest-runtime": "^29.7.0",
+        "jest-util": "^29.7.0",
+        "jest-watcher": "^29.7.0",
+        "jest-worker": "^29.7.0",
+        "p-limit": "^3.1.0",
+        "source-map-support": "0.5.13"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
+    "node_modules/jest-runner/node_modules/source-map": {
+      "version": "0.6.1",
+      "resolved": "https://registry.npmjs.org/source-map/-/source-map-0.6.1.tgz",
+      "integrity": "sha512-UjgapumWlbMhkBgzT7Ykc5YXUT46F0iKu8SGXq0bcwP5dz/h0Plj6enJqjz1Zbq2l5WaqYnrVbwWOWMyF3F47g==",
+      "devOptional": true,
+      "license": "BSD-3-Clause",
+      "peer": true,
+      "engines": {
+        "node": ">=0.10.0"
+      }
+    },
+    "node_modules/jest-runner/node_modules/source-map-support": {
+      "version": "0.5.13",
+      "resolved": "https://registry.npmjs.org/source-map-support/-/source-map-support-0.5.13.tgz",
+      "integrity": "sha512-SHSKFHadjVA5oR4PPqhtAVdcBWwRYVd6g6cAXnIbRiIwc2EhPrTuKUBdSLvlEKyIP3GCf89fltvcZiP9MMFA1w==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "buffer-from": "^1.0.0",
+        "source-map": "^0.6.0"
+      }
+    },
+    "node_modules/jest-runtime": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/jest-runtime/-/jest-runtime-29.7.0.tgz",
+      "integrity": "sha512-gUnLjgwdGqW7B4LvOIkbKs9WGbn+QLqRQQ9juC6HndeDiezIwhDP+mhMwHWCEcfQ5RUXa6OPnFF8BJh5xegwwQ==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "@jest/environment": "^29.7.0",
+        "@jest/fake-timers": "^29.7.0",
+        "@jest/globals": "^29.7.0",
+        "@jest/source-map": "^29.6.3",
+        "@jest/test-result": "^29.7.0",
+        "@jest/transform": "^29.7.0",
+        "@jest/types": "^29.6.3",
+        "@types/node": "*",
+        "chalk": "^4.0.0",
+        "cjs-module-lexer": "^1.0.0",
+        "collect-v8-coverage": "^1.0.0",
+        "glob": "^7.1.3",
+        "graceful-fs": "^4.2.9",
+        "jest-haste-map": "^29.7.0",
+        "jest-message-util": "^29.7.0",
+        "jest-mock": "^29.7.0",
+        "jest-regex-util": "^29.6.3",
+        "jest-resolve": "^29.7.0",
+        "jest-snapshot": "^29.7.0",
+        "jest-util": "^29.7.0",
+        "slash": "^3.0.0",
+        "strip-bom": "^4.0.0"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
+    "node_modules/jest-runtime/node_modules/balanced-match": {
+      "version": "1.0.2",
+      "resolved": "https://registry.npmjs.org/balanced-match/-/balanced-match-1.0.2.tgz",
+      "integrity": "sha512-3oSeUO0TMV67hN1AmbXsK4yaqU7tjiHlbxRDZOpH0KW9+CeX4bRAaX0Anxt0tx2MrpRpWwQaPwIlISEJhYU5Pw==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true
+    },
+    "node_modules/jest-runtime/node_modules/brace-expansion": {
+      "version": "1.1.15",
+      "resolved": "https://registry.npmjs.org/brace-expansion/-/brace-expansion-1.1.15.tgz",
+      "integrity": "sha512-EwOCDEex4quD37XhqM3omwtMoJjr//isUZz1JopUNWms+4Z2ViyM/k1YIRePpoVNnQhENnxtFjLaxNHrT7xIUg==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "balanced-match": "^1.0.0",
+        "concat-map": "0.0.1"
+      }
+    },
+    "node_modules/jest-runtime/node_modules/glob": {
+      "version": "7.2.3",
+      "resolved": "https://registry.npmjs.org/glob/-/glob-7.2.3.tgz",
+      "integrity": "sha512-nFR0zLpU2YCaRxwoCJvL6UvCH2JFyFVIvwTLsIf21AuHlMskA1hhTdk+LlYJtOlYt9v6dvszD2BGRqBL+iQK9Q==",
+      "deprecated": "Old versions of glob are not supported, and contain widely publicized security vulnerabilities, which have been fixed in the current version. Please update. Support for old versions may be purchased (at exorbitant rates) by contacting i@izs.me",
+      "devOptional": true,
+      "license": "ISC",
+      "peer": true,
+      "dependencies": {
+        "fs.realpath": "^1.0.0",
+        "inflight": "^1.0.4",
+        "inherits": "2",
+        "minimatch": "^3.1.1",
+        "once": "^1.3.0",
+        "path-is-absolute": "^1.0.0"
+      },
+      "engines": {
+        "node": "*"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/isaacs"
+      }
+    },
+    "node_modules/jest-runtime/node_modules/minimatch": {
+      "version": "3.1.5",
+      "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-3.1.5.tgz",
+      "integrity": "sha512-VgjWUsnnT6n+NUk6eZq77zeFdpW2LWDzP6zFGrCbHXiYNul5Dzqk2HHQ5uFH2DNW5Xbp8+jVzaeNt94ssEEl4w==",
+      "devOptional": true,
+      "license": "ISC",
+      "peer": true,
+      "dependencies": {
+        "brace-expansion": "^1.1.7"
+      },
       "engines": {
-        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+        "node": "*"
       }
     },
-    "node_modules/jest-haste-map": {
+    "node_modules/jest-snapshot": {
       "version": "29.7.0",
-      "resolved": "https://registry.npmjs.org/jest-haste-map/-/jest-haste-map-29.7.0.tgz",
-      "integrity": "sha512-fP8u2pyfqx0K1rGn1R9pyE0/KTn+G7PxktWidOBTqFPLYX0b9ksaMFkhK5vrS3DVun09pckLdlx90QthlW7AmA==",
+      "resolved": "https://registry.npmjs.org/jest-snapshot/-/jest-snapshot-29.7.0.tgz",
+      "integrity": "sha512-Rm0BMWtxBcioHr1/OX5YCP8Uov4riHvKPknOGs804Zg9JGZgmIBkbtlxJC/7Z4msKYVbIJtfU+tKb8xlYNfdkw==",
+      "devOptional": true,
       "license": "MIT",
       "dependencies": {
+        "@babel/core": "^7.11.6",
+        "@babel/generator": "^7.7.2",
+        "@babel/plugin-syntax-jsx": "^7.7.2",
+        "@babel/plugin-syntax-typescript": "^7.7.2",
+        "@babel/types": "^7.3.3",
+        "@jest/expect-utils": "^29.7.0",
+        "@jest/transform": "^29.7.0",
         "@jest/types": "^29.6.3",
-        "@types/graceful-fs": "^4.1.3",
-        "@types/node": "*",
-        "anymatch": "^3.0.3",
-        "fb-watchman": "^2.0.0",
+        "babel-preset-current-node-syntax": "^1.0.0",
+        "chalk": "^4.0.0",
+        "expect": "^29.7.0",
         "graceful-fs": "^4.2.9",
-        "jest-regex-util": "^29.6.3",
+        "jest-diff": "^29.7.0",
+        "jest-get-type": "^29.6.3",
+        "jest-matcher-utils": "^29.7.0",
+        "jest-message-util": "^29.7.0",
         "jest-util": "^29.7.0",
-        "jest-worker": "^29.7.0",
-        "micromatch": "^4.0.4",
-        "walker": "^1.0.8"
+        "natural-compare": "^1.4.0",
+        "pretty-format": "^29.7.0",
+        "semver": "^7.5.3"
       },
       "engines": {
         "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
-      },
-      "optionalDependencies": {
-        "fsevents": "^2.3.2"
       }
     },
-    "node_modules/jest-message-util": {
+    "node_modules/jest-snapshot/node_modules/jest-diff": {
       "version": "29.7.0",
-      "resolved": "https://registry.npmjs.org/jest-message-util/-/jest-message-util-29.7.0.tgz",
-      "integrity": "sha512-GBEV4GRADeP+qtB2+6u61stea8mGcOT4mCtrYISZwfu9/ISHFJ/5zOMXYbpBE9RsS5+Gb63DW4FgmnKJ79Kf6w==",
+      "resolved": "https://registry.npmjs.org/jest-diff/-/jest-diff-29.7.0.tgz",
+      "integrity": "sha512-LMIgiIrhigmPrs03JHpxUh2yISK3vLFPkAodPeo0+BuF7wA2FoQbkEg1u8gBYBThncu7e1oEDUfIXVuTqLRUjw==",
+      "devOptional": true,
       "license": "MIT",
       "dependencies": {
-        "@babel/code-frame": "^7.12.13",
-        "@jest/types": "^29.6.3",
-        "@types/stack-utils": "^2.0.0",
         "chalk": "^4.0.0",
-        "graceful-fs": "^4.2.9",
-        "micromatch": "^4.0.4",
-        "pretty-format": "^29.7.0",
-        "slash": "^3.0.0",
-        "stack-utils": "^2.0.3"
+        "diff-sequences": "^29.6.3",
+        "jest-get-type": "^29.6.3",
+        "pretty-format": "^29.7.0"
       },
       "engines": {
         "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
       }
     },
-    "node_modules/jest-mock": {
+    "node_modules/jest-snapshot/node_modules/jest-matcher-utils": {
       "version": "29.7.0",
-      "resolved": "https://registry.npmjs.org/jest-mock/-/jest-mock-29.7.0.tgz",
-      "integrity": "sha512-ITOMZn+UkYS4ZFh83xYAOzWStloNzJFO2s8DWrE4lhtGD+AorgnbkiKERe4wQVBydIGPx059g6riW5Btp6Llnw==",
+      "resolved": "https://registry.npmjs.org/jest-matcher-utils/-/jest-matcher-utils-29.7.0.tgz",
+      "integrity": "sha512-sBkD+Xi9DtcChsI3L3u0+N0opgPYnCRPtGcQYrgXmR+hmt/fYfWAL0xRXYU8eWOdfuLgBe0YCW3AFtnRLagq/g==",
+      "devOptional": true,
       "license": "MIT",
       "dependencies": {
-        "@jest/types": "^29.6.3",
-        "@types/node": "*",
-        "jest-util": "^29.7.0"
+        "chalk": "^4.0.0",
+        "jest-diff": "^29.7.0",
+        "jest-get-type": "^29.6.3",
+        "pretty-format": "^29.7.0"
       },
       "engines": {
         "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
       }
     },
-    "node_modules/jest-regex-util": {
-      "version": "29.6.3",
-      "resolved": "https://registry.npmjs.org/jest-regex-util/-/jest-regex-util-29.6.3.tgz",
-      "integrity": "sha512-KJJBsRCyyLNWCNBOvZyRDnAIfUiRJ8v+hOBQYGn8gDyF3UegwiP4gwRR3/SDa42g1YbVycTidUF3rKjyLFDWbg==",
-      "license": "MIT",
+    "node_modules/jest-snapshot/node_modules/semver": {
+      "version": "7.8.5",
+      "resolved": "https://registry.npmjs.org/semver/-/semver-7.8.5.tgz",
+      "integrity": "sha512-Y7/KDsb8LjooZpwaqGyulO6DQlksgCncchHGk+sZIY4SBvUocMBEFH5Ur1fI4dV+Jvl0w6cjvucaIi40puRioA==",
+      "devOptional": true,
+      "license": "ISC",
+      "bin": {
+        "semver": "bin/semver.js"
+      },
       "engines": {
-        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+        "node": ">=10"
       }
     },
     "node_modules/jest-util": {
@@ -5601,6 +7714,156 @@
         "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
       }
     },
+    "node_modules/jest-watch-select-projects": {
+      "version": "2.0.0",
+      "resolved": "https://registry.npmjs.org/jest-watch-select-projects/-/jest-watch-select-projects-2.0.0.tgz",
+      "integrity": "sha512-j00nW4dXc2NiCW6znXgFLF9g8PJ0zP25cpQ1xRro/HU2GBfZQFZD0SoXnAlaoKkIY4MlfTMkKGbNXFpvCdjl1w==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "ansi-escapes": "^4.3.0",
+        "chalk": "^3.0.0",
+        "prompts": "^2.2.1"
+      }
+    },
+    "node_modules/jest-watch-select-projects/node_modules/chalk": {
+      "version": "3.0.0",
+      "resolved": "https://registry.npmjs.org/chalk/-/chalk-3.0.0.tgz",
+      "integrity": "sha512-4D3B6Wf41KOYRFdszmDqMCGq5VV/uMAB273JILmO+3jAlh8X4qDtdtgCR3fxtbLEMzSx22QdhnDcJvu2u1fVwg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "ansi-styles": "^4.1.0",
+        "supports-color": "^7.1.0"
+      },
+      "engines": {
+        "node": ">=8"
+      }
+    },
+    "node_modules/jest-watch-typeahead": {
+      "version": "2.2.1",
+      "resolved": "https://registry.npmjs.org/jest-watch-typeahead/-/jest-watch-typeahead-2.2.1.tgz",
+      "integrity": "sha512-jYpYmUnTzysmVnwq49TAxlmtOAwp8QIqvZyoofQFn8fiWhEDZj33ZXzg3JA4nGnzWFm1hbWf3ADpteUokvXgFA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "ansi-escapes": "^6.0.0",
+        "chalk": "^4.0.0",
+        "jest-regex-util": "^29.0.0",
+        "jest-watcher": "^29.0.0",
+        "slash": "^5.0.0",
+        "string-length": "^5.0.1",
+        "strip-ansi": "^7.0.1"
+      },
+      "engines": {
+        "node": "^14.17.0 || ^16.10.0 || >=18.0.0"
+      },
+      "peerDependencies": {
+        "jest": "^27.0.0 || ^28.0.0 || ^29.0.0"
+      }
+    },
+    "node_modules/jest-watch-typeahead/node_modules/ansi-escapes": {
+      "version": "6.2.1",
+      "resolved": "https://registry.npmjs.org/ansi-escapes/-/ansi-escapes-6.2.1.tgz",
+      "integrity": "sha512-4nJ3yixlEthEJ9Rk4vPcdBRkZvQZlYyu8j4/Mqz5sgIkddmEnH2Yj2ZrnP9S3tQOvSNRUIgVNF/1yPpRAGNRig==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=14.16"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/jest-watch-typeahead/node_modules/ansi-regex": {
+      "version": "6.2.2",
+      "resolved": "https://registry.npmjs.org/ansi-regex/-/ansi-regex-6.2.2.tgz",
+      "integrity": "sha512-Bq3SmSpyFHaWjPk8If9yc6svM8c56dB5BAtW4Qbw5jHTwwXXcTLoRMkpDJp6VL0XzlWaCHTXrkFURMYmD0sLqg==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=12"
+      },
+      "funding": {
+        "url": "https://github.com/chalk/ansi-regex?sponsor=1"
+      }
+    },
+    "node_modules/jest-watch-typeahead/node_modules/char-regex": {
+      "version": "2.0.2",
+      "resolved": "https://registry.npmjs.org/char-regex/-/char-regex-2.0.2.tgz",
+      "integrity": "sha512-cbGOjAptfM2LVmWhwRFHEKTPkLwNddVmuqYZQt895yXwAsWsXObCG+YN4DGQ/JBtT4GP1a1lPPdio2z413LmTg==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=12.20"
+      }
+    },
+    "node_modules/jest-watch-typeahead/node_modules/slash": {
+      "version": "5.1.0",
+      "resolved": "https://registry.npmjs.org/slash/-/slash-5.1.0.tgz",
+      "integrity": "sha512-ZA6oR3T/pEyuqwMgAKT0/hAv8oAXckzbkmR0UkUosQ+Mc4RxGoJkRmwHgHufaenlyAgE1Mxgpdcrf75y6XcnDg==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=14.16"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/jest-watch-typeahead/node_modules/string-length": {
+      "version": "5.0.1",
+      "resolved": "https://registry.npmjs.org/string-length/-/string-length-5.0.1.tgz",
+      "integrity": "sha512-9Ep08KAMUn0OadnVaBuRdE2l615CQ508kr0XMadjClfYpdCyvrbFp6Taebo8yyxokQ4viUd/xPPUA4FGgUa0ow==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "char-regex": "^2.0.0",
+        "strip-ansi": "^7.0.1"
+      },
+      "engines": {
+        "node": ">=12.20"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/jest-watch-typeahead/node_modules/strip-ansi": {
+      "version": "7.2.0",
+      "resolved": "https://registry.npmjs.org/strip-ansi/-/strip-ansi-7.2.0.tgz",
+      "integrity": "sha512-yDPMNjp4WyfYBkHnjIRLfca1i6KMyGCtsVgoKe/z1+6vukgaENdgGBZt+ZmKPc4gavvEZ5OgHfHdrazhgNyG7w==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "ansi-regex": "^6.2.2"
+      },
+      "engines": {
+        "node": ">=12"
+      },
+      "funding": {
+        "url": "https://github.com/chalk/strip-ansi?sponsor=1"
+      }
+    },
+    "node_modules/jest-watcher": {
+      "version": "29.7.0",
+      "resolved": "https://registry.npmjs.org/jest-watcher/-/jest-watcher-29.7.0.tgz",
+      "integrity": "sha512-49Fg7WXkU3Vl2h6LbLtMQ/HyB6rXSIX7SqvBLQmssRBGN9I0PNvPmAmCWSOY6SOvrjhI/F7/bGAv9RtnsPA03g==",
+      "devOptional": true,
+      "license": "MIT",
+      "dependencies": {
+        "@jest/test-result": "^29.7.0",
+        "@jest/types": "^29.6.3",
+        "@types/node": "*",
+        "ansi-escapes": "^4.2.1",
+        "chalk": "^4.0.0",
+        "emittery": "^0.13.1",
+        "jest-util": "^29.7.0",
+        "string-length": "^4.0.1"
+      },
+      "engines": {
+        "node": "^14.15.0 || ^16.10.0 || >=18.0.0"
+      }
+    },
     "node_modules/jest-worker": {
       "version": "29.7.0",
       "resolved": "https://registry.npmjs.org/jest-worker/-/jest-worker-29.7.0.tgz",
@@ -5662,6 +7925,138 @@
       "integrity": "sha512-0wM3YBWtYePOjfyXQH5MWQ8H7sdk5EXSwZvmSLKk2RboVQ2Bu239jycHDz5J/8Blf3K0Qnoy2b6xD+z10MFB+Q==",
       "license": "0BSD"
     },
+    "node_modules/jsdom": {
+      "version": "20.0.3",
+      "resolved": "https://registry.npmjs.org/jsdom/-/jsdom-20.0.3.tgz",
+      "integrity": "sha512-SYhBvTh89tTfCD/CRdSOm13mOBa42iTaTyfyEWBdKcGdPxPtLFBXuHR8XHb33YNYaP+lLbmSvBTsnoesCNJEsQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "abab": "^2.0.6",
+        "acorn": "^8.8.1",
+        "acorn-globals": "^7.0.0",
+        "cssom": "^0.5.0",
+        "cssstyle": "^2.3.0",
+        "data-urls": "^3.0.2",
+        "decimal.js": "^10.4.2",
+        "domexception": "^4.0.0",
+        "escodegen": "^2.0.0",
+        "form-data": "^4.0.0",
+        "html-encoding-sniffer": "^3.0.0",
+        "http-proxy-agent": "^5.0.0",
+        "https-proxy-agent": "^5.0.1",
+        "is-potential-custom-element-name": "^1.0.1",
+        "nwsapi": "^2.2.2",
+        "parse5": "^7.1.1",
+        "saxes": "^6.0.0",
+        "symbol-tree": "^3.2.4",
+        "tough-cookie": "^4.1.2",
+        "w3c-xmlserializer": "^4.0.0",
+        "webidl-conversions": "^7.0.0",
+        "whatwg-encoding": "^2.0.0",
+        "whatwg-mimetype": "^3.0.0",
+        "whatwg-url": "^11.0.0",
+        "ws": "^8.11.0",
+        "xml-name-validator": "^4.0.0"
+      },
+      "engines": {
+        "node": ">=14"
+      },
+      "peerDependencies": {
+        "canvas": "^2.5.0"
+      },
+      "peerDependenciesMeta": {
+        "canvas": {
+          "optional": true
+        }
+      }
+    },
+    "node_modules/jsdom/node_modules/agent-base": {
+      "version": "6.0.2",
+      "resolved": "https://registry.npmjs.org/agent-base/-/agent-base-6.0.2.tgz",
+      "integrity": "sha512-RZNwNclF7+MS/8bDg70amg32dyeZGZxiDuQmZxKLAlQjr3jGyLx+4Kkk58UO7D2QdgFIQCovuSuZESne6RG6XQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "debug": "4"
+      },
+      "engines": {
+        "node": ">= 6.0.0"
+      }
+    },
+    "node_modules/jsdom/node_modules/https-proxy-agent": {
+      "version": "5.0.1",
+      "resolved": "https://registry.npmjs.org/https-proxy-agent/-/https-proxy-agent-5.0.1.tgz",
+      "integrity": "sha512-dFcAjpTQFgoLMzC2VwU+C/CbS7uRL0lWmxDITmqm7C+7F0Odmj6s9l6alZc6AELXhrnggM2CeWSXHGOdX2YtwA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "agent-base": "6",
+        "debug": "4"
+      },
+      "engines": {
+        "node": ">= 6"
+      }
+    },
+    "node_modules/jsdom/node_modules/tr46": {
+      "version": "3.0.0",
+      "resolved": "https://registry.npmjs.org/tr46/-/tr46-3.0.0.tgz",
+      "integrity": "sha512-l7FvfAHlcmulp8kr+flpQZmVwtu7nfRV7NZujtN0OqES8EL4O4e0qqzL0DC5gAvx/ZC/9lk6rhcUwYvkBnBnYA==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "punycode": "^2.1.1"
+      },
+      "engines": {
+        "node": ">=12"
+      }
+    },
+    "node_modules/jsdom/node_modules/webidl-conversions": {
+      "version": "7.0.0",
+      "resolved": "https://registry.npmjs.org/webidl-conversions/-/webidl-conversions-7.0.0.tgz",
+      "integrity": "sha512-VwddBukDzu71offAQR975unBIGqfKZpM+8ZX6ySk8nYhVoo5CYaZyzt3YBvYtRtO+aoGlqxPg/B87NGVZ/fu6g==",
+      "dev": true,
+      "license": "BSD-2-Clause",
+      "engines": {
+        "node": ">=12"
+      }
+    },
+    "node_modules/jsdom/node_modules/whatwg-url": {
+      "version": "11.0.0",
+      "resolved": "https://registry.npmjs.org/whatwg-url/-/whatwg-url-11.0.0.tgz",
+      "integrity": "sha512-RKT8HExMpoYx4igMiVMY83lN6UeITKJlBQ+vR/8ZJ8OCdSiN3RwCq+9gH0+Xzj0+5IrM6i4j/6LuvzbZIQgEcQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "tr46": "^3.0.0",
+        "webidl-conversions": "^7.0.0"
+      },
+      "engines": {
+        "node": ">=12"
+      }
+    },
+    "node_modules/jsdom/node_modules/ws": {
+      "version": "8.21.0",
+      "resolved": "https://registry.npmjs.org/ws/-/ws-8.21.0.tgz",
+      "integrity": "sha512-Vsp28b7DRcimFQvrqu2Wek3z1iYxDCWqHYB8Qsnk/S4RfaCQzPGPyBNuVjJV3cd6UiKtUtp6sNM77gWvzcCH+g==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=10.0.0"
+      },
+      "peerDependencies": {
+        "bufferutil": "^4.0.1",
+        "utf-8-validate": ">=5.0.2"
+      },
+      "peerDependenciesMeta": {
+        "bufferutil": {
+          "optional": true
+        },
+        "utf-8-validate": {
+          "optional": true
+        }
+      }
+    },
     "node_modules/jsesc": {
       "version": "3.1.0",
       "resolved": "https://registry.npmjs.org/jsesc/-/jsesc-3.1.0.tgz",
@@ -5674,6 +8069,14 @@
         "node": ">=6"
       }
     },
+    "node_modules/json-parse-even-better-errors": {
+      "version": "2.3.1",
+      "resolved": "https://registry.npmjs.org/json-parse-even-better-errors/-/json-parse-even-better-errors-2.3.1.tgz",
+      "integrity": "sha512-xyFwyhro/JEof6Ghe2iz2NcXoj2sloNsWr/XsERDK/oiPCfaNhl5ONfp+jQdAZRQQ0IJWNzH9zIZF7li91kh2w==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true
+    },
     "node_modules/json5": {
       "version": "2.2.3",
       "resolved": "https://registry.npmjs.org/json5/-/json5-2.2.3.tgz",
@@ -6017,6 +8420,13 @@
         "node": ">=8"
       }
     },
+    "node_modules/lodash": {
+      "version": "4.18.1",
+      "resolved": "https://registry.npmjs.org/lodash/-/lodash-4.18.1.tgz",
+      "integrity": "sha512-dMInicTPVE8d1e5otfwmmjlxkZoUpiVLwyeTdUsi/Caj/gfzzblBcCE5sRHV/AsjuCmxWrte2TNGSYuCeCq+0Q==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/lodash.debounce": {
       "version": "4.0.8",
       "resolved": "https://registry.npmjs.org/lodash.debounce/-/lodash.debounce-4.0.8.tgz",
@@ -6133,6 +8543,37 @@
         "yallist": "^3.0.2"
       }
     },
+    "node_modules/make-dir": {
+      "version": "4.0.0",
+      "resolved": "https://registry.npmjs.org/make-dir/-/make-dir-4.0.0.tgz",
+      "integrity": "sha512-hXdUTZYIVOt1Ex//jAQi+wTZZpUpwBj/0QsOzqegb3rGMMeJiSEu5xLHnYfBrRV4RH2+OCSOO95Is/7x1WJ4bw==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "semver": "^7.5.3"
+      },
+      "engines": {
+        "node": ">=10"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
+    "node_modules/make-dir/node_modules/semver": {
+      "version": "7.8.5",
+      "resolved": "https://registry.npmjs.org/semver/-/semver-7.8.5.tgz",
+      "integrity": "sha512-Y7/KDsb8LjooZpwaqGyulO6DQlksgCncchHGk+sZIY4SBvUocMBEFH5Ur1fI4dV+Jvl0w6cjvucaIi40puRioA==",
+      "devOptional": true,
+      "license": "ISC",
+      "peer": true,
+      "bin": {
+        "semver": "bin/semver.js"
+      },
+      "engines": {
+        "node": ">=10"
+      }
+    },
     "node_modules/makeerror": {
       "version": "1.0.12",
       "resolved": "https://registry.npmjs.org/makeerror/-/makeerror-1.0.12.tgz",
@@ -6148,6 +8589,16 @@
       "integrity": "sha512-ocnPZQLNpvbedwTy9kNrQEsknEfgvcLMvOtz3sFeWApDq1MXH1TqkCIx58xlpESsfwQOnuBO9beyQuNGzVvuhQ==",
       "license": "Apache-2.0"
     },
+    "node_modules/math-intrinsics": {
+      "version": "1.1.0",
+      "resolved": "https://registry.npmjs.org/math-intrinsics/-/math-intrinsics-1.1.0.tgz",
+      "integrity": "sha512-/IXtbwEk5HTPyEwyKX6hGkYXxM9nbj64B+ilVJnC/R6B0pH5G4V3b0pVbL7DBj4tkhBAppbQUlf6F6Xl9LHu1g==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">= 0.4"
+      }
+    },
     "node_modules/memoize-one": {
       "version": "5.2.1",
       "resolved": "https://registry.npmjs.org/memoize-one/-/memoize-one-5.2.1.tgz",
@@ -6496,6 +8947,16 @@
         "node": ">=4"
       }
     },
+    "node_modules/min-indent": {
+      "version": "1.0.1",
+      "resolved": "https://registry.npmjs.org/min-indent/-/min-indent-1.0.1.tgz",
+      "integrity": "sha512-I9jwMn07Sy/IwOj3zVkVik2JTvgpaykDZEigL6Rx6N9LbMywwUSMtxET+7lVoDLLd3O3IXwJwvuuns8UB/HeAg==",
+      "devOptional": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=4"
+      }
+    },
     "node_modules/minimatch": {
       "version": "10.2.5",
       "resolved": "https://registry.npmjs.org/minimatch/-/minimatch-10.2.5.tgz",
@@ -6588,6 +9049,13 @@
         "node": "^10 || ^12 || ^13.7 || ^14 || >=15.0.1"
       }
     },
+    "node_modules/natural-compare": {
+      "version": "1.4.0",
+      "resolved": "https://registry.npmjs.org/natural-compare/-/natural-compare-1.4.0.tgz",
+      "integrity": "sha512-OWND8ei3VtNC9h7V60qff3SVobHr996CTwgxubgyQYEpg290h9J0buyECNNJexkFm5sOajh5G116RYA1c8ZMSw==",
+      "devOptional": true,
+      "license": "MIT"
+    },
     "node_modules/negotiator": {
       "version": "0.6.3",
       "resolved": "https://registry.npmjs.org/negotiator/-/negotiator-0.6.3.tgz",
@@ -6683,12 +9151,33 @@
         "node": ">=10"
       }
     },
+    "node_modules/npm-run-path": {
+      "version": "4.0.1",
+      "resolved": "https://registry.npmjs.org/npm-run-path/-/npm-run-path-4.0.1.tgz",
+      "integrity": "sha512-S48WzZW777zhNIrn7gxOlISNAqi9ZC/uQFnRdbeIHhZhCA6UqpkOT8T1G7BvfdgP4Er8gF4sUbaS0i7QvIfCWw==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "path-key": "^3.0.0"
+      },
+      "engines": {
+        "node": ">=8"
+      }
+    },
     "node_modules/nullthrows": {
       "version": "1.1.1",
       "resolved": "https://registry.npmjs.org/nullthrows/-/nullthrows-1.1.1.tgz",
       "integrity": "sha512-2vPPEi+Z7WqML2jZYddDIfy5Dqb0r2fze2zTxNNknZaFpVHU3mFB3R+DWeJWGVx0ecvttSGlJTI+WG+8Z4cDWw==",
       "license": "MIT"
     },
+    "node_modules/nwsapi": {
+      "version": "2.2.24",
+      "resolved": "https://registry.npmjs.org/nwsapi/-/nwsapi-2.2.24.tgz",
+      "integrity": "sha512-7YRhZ3jS45LwmSCT4b2sVFHt/WuovaktDU07QrtOBY2PXskss5a9jfmR9jptyumwXST+rFjrmppMY1KT/yn35A==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/ob1": {
       "version": "0.83.3",
       "resolved": "https://registry.npmjs.org/ob1/-/ob1-0.83.3.tgz",
@@ -6928,6 +9417,26 @@
         "node": ">=6"
       }
     },
+    "node_modules/parse-json": {
+      "version": "5.2.0",
+      "resolved": "https://registry.npmjs.org/parse-json/-/parse-json-5.2.0.tgz",
+      "integrity": "sha512-ayCKvm/phCGxOkYRSCM82iDwct8/EonSEgCSxWxD7ve6jHggsFl4fZVQBPRNgQoKiuV/odhFrGzQXZwbifC8Rg==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "@babel/code-frame": "^7.0.0",
+        "error-ex": "^1.3.1",
+        "json-parse-even-better-errors": "^2.3.0",
+        "lines-and-columns": "^1.1.6"
+      },
+      "engines": {
+        "node": ">=8"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/sindresorhus"
+      }
+    },
     "node_modules/parse-png": {
       "version": "2.1.0",
       "resolved": "https://registry.npmjs.org/parse-png/-/parse-png-2.1.0.tgz",
@@ -6940,6 +9449,19 @@
         "node": ">=10"
       }
     },
+    "node_modules/parse5": {
+      "version": "7.3.0",
+      "resolved": "https://registry.npmjs.org/parse5/-/parse5-7.3.0.tgz",
+      "integrity": "sha512-IInvU7fabl34qmi9gY8XOVxhYyMyuH2xUNpb2q8/Y+7552KlejkRvqvD19nMoUW/uQGGbqNpA6Tufu5FL5BZgw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "entities": "^6.0.0"
+      },
+      "funding": {
+        "url": "https://github.com/inikulin/parse5?sponsor=1"
+      }
+    },
     "node_modules/parseurl": {
       "version": "1.3.3",
       "resolved": "https://registry.npmjs.org/parseurl/-/parseurl-1.3.3.tgz",
@@ -7034,6 +9556,20 @@
         "node": ">= 6"
       }
     },
+    "node_modules/pkg-dir": {
+      "version": "4.2.0",
+      "resolved": "https://registry.npmjs.org/pkg-dir/-/pkg-dir-4.2.0.tgz",
+      "integrity": "sha512-HRDzbaKjC+AOWVXxAU/x54COGeIv9eb+6CkDSQoNTt4XyWoIJvuPsXizxu/Fr23EiekbtZwmh1IcIG/l/a10GQ==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "find-up": "^4.0.0"
+      },
+      "engines": {
+        "node": ">=8"
+      }
+    },
     "node_modules/plist": {
       "version": "3.1.1",
       "resolved": "https://registry.npmjs.org/plist/-/plist-3.1.1.tgz",
@@ -7184,6 +9720,19 @@
         "node": ">= 6"
       }
     },
+    "node_modules/psl": {
+      "version": "1.15.0",
+      "resolved": "https://registry.npmjs.org/psl/-/psl-1.15.0.tgz",
+      "integrity": "sha512-JZd3gMVBAVQkSs6HdNZo9Sdo0LNcQeMNP3CozBJb3JYC/QUYZTnKxP+f8oWRX4rHP5EurWxqAHTSwUCjlNKa1w==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "punycode": "^2.3.1"
+      },
+      "funding": {
+        "url": "https://github.com/sponsors/lupomontero"
+      }
+    },
     "node_modules/punycode": {
       "version": "2.3.1",
       "resolved": "https://registry.npmjs.org/punycode/-/punycode-2.3.1.tgz",
@@ -7193,6 +9742,24 @@
         "node": ">=6"
       }
     },
+    "node_modules/pure-rand": {
+      "version": "6.1.0",
+      "resolved": "https://registry.npmjs.org/pure-rand/-/pure-rand-6.1.0.tgz",
+      "integrity": "sha512-bVWawvoZoBYpp6yIoQtQXHZjmz35RSVHnUOTefl8Vcjr8snTPY1wnpSPMWekcFwbxI6gtmT7rSYPFvz71ldiOA==",
+      "devOptional": true,
+      "funding": [
+        {
+          "type": "individual",
+          "url": "https://github.com/sponsors/dubzzz"
+        },
+        {
+          "type": "opencollective",
+          "url": "https://opencollective.com/fast-check"
+        }
+      ],
+      "license": "MIT",
+      "peer": true
+    },
     "node_modules/qrcode-terminal": {
       "version": "0.11.0",
       "resolved": "https://registry.npmjs.org/qrcode-terminal/-/qrcode-terminal-0.11.0.tgz",
@@ -7219,6 +9786,13 @@
         "url": "https://github.com/sponsors/sindresorhus"
       }
     },
+    "node_modules/querystringify": {
+      "version": "2.2.0",
+      "resolved": "https://registry.npmjs.org/querystringify/-/querystringify-2.2.0.tgz",
+      "integrity": "sha512-FIqgj2EUvTa7R50u0rGsyTftzjYmv/a3hO345bZNrqabNqjtgiDMgmo4mkUjd+nzU5oF3dClKqFIPUKybUyqoQ==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/queue": {
       "version": "6.0.2",
       "resolved": "https://registry.npmjs.org/queue/-/queue-6.0.2.tgz",
@@ -7307,6 +9881,22 @@
       "integrity": "sha512-XjBR15BhXuylgWGuslhDKqlSayuqvqBX91BP8pauG8kd1zY8kotkNWbXksTCNRarse4kuGbe2kIY05ARtwNIvw==",
       "license": "MIT"
     },
+    "node_modules/react-is-18": {
+      "name": "react-is",
+      "version": "18.3.1",
+      "resolved": "https://registry.npmjs.org/react-is/-/react-is-18.3.1.tgz",
+      "integrity": "sha512-/LLMVyas0ljjAtoYiPqYiL8VWXzUUdThrmU5+n20DZv+a+ClRoevUzw5JxU+Ieh5/c87ytoTBV9G1FiKfNJdmg==",
+      "devOptional": true,
+      "license": "MIT"
+    },
+    "node_modules/react-is-19": {
+      "name": "react-is",
+      "version": "19.2.7",
+      "resolved": "https://registry.npmjs.org/react-is/-/react-is-19.2.7.tgz",
+      "integrity": "sha512-kZFnouyVv7eP/Phmrlo9FK+zcAdriZJvzxXHF1Sl1P377WSGe2G/JxVolhTrB/jeV47lKImhNUsijjHAAbcl/A==",
+      "devOptional": true,
+      "license": "MIT"
+    },
     "node_modules/react-native": {
       "version": "0.81.5",
       "resolved": "https://registry.npmjs.org/react-native/-/react-native-0.81.5.tgz",
@@ -7690,7 +10280,7 @@
       "version": "19.1.0",
       "resolved": "https://registry.npmjs.org/react-test-renderer/-/react-test-renderer-19.1.0.tgz",
       "integrity": "sha512-jXkSl3CpvPYEF+p/eGDLB4sPoDX8pKkYvRl9+rR8HxLY0X04vW7hCm1/0zHoUSjPZ3bDa+wXWNTDVIw/R8aDVw==",
-      "dev": true,
+      "devOptional": true,
       "license": "MIT",
       "dependencies": {
         "react-is": "^19.1.0",
@@ -7700,6 +10290,20 @@
         "react": "^19.1.0"
       }
     },
+    "node_modules/redent": {
+      "version": "3.0.0",
+      "resolved": "https://registry.npmjs.org/redent/-/redent-3.0.0.tgz",
+      "integrity": "sha512-6tDA8g98We0zd0GvVeMT9arEOnTw9qM03L9cJXaCjrip1OO764RDBLBfrB4cwzNGDj5OA5ioymC9GkizgWJDUg==",
+      "devOptional": true,
+      "license": "MIT",
+      "dependencies": {
+        "indent-string": "^4.0.0",
+        "strip-indent": "^3.0.0"
+      },
+      "engines": {
+        "node": ">=8"
+      }
+    },
     "node_modules/regenerate": {
       "version": "1.4.2",
       "resolved": "https://registry.npmjs.org/regenerate/-/regenerate-1.4.2.tgz",
@@ -7799,6 +10403,13 @@
         "path-parse": "^1.0.5"
       }
     },
+    "node_modules/requires-port": {
+      "version": "1.0.0",
+      "resolved": "https://registry.npmjs.org/requires-port/-/requires-port-1.0.0.tgz",
+      "integrity": "sha512-KigOCHcocU3XODJxsu8i/j8T9tzT4adHiecwORRQ0ZZFcp7ahwXuRU1m+yuO90C5ZUyGeGfocHDI14M3L3yDAQ==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/resolve": {
       "version": "1.22.12",
       "resolved": "https://registry.npmjs.org/resolve/-/resolve-1.22.12.tgz",
@@ -7820,6 +10431,20 @@
         "url": "https://github.com/sponsors/ljharb"
       }
     },
+    "node_modules/resolve-cwd": {
+      "version": "3.0.0",
+      "resolved": "https://registry.npmjs.org/resolve-cwd/-/resolve-cwd-3.0.0.tgz",
+      "integrity": "sha512-OrZaX2Mb+rJCpH/6CpSqt9xFVpN++x01XnN2ie9g6P5/3xelLAkXWVADpdz1IHD/KFfEXyE6V0U01OQ3UO2rEg==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "dependencies": {
+        "resolve-from": "^5.0.0"
+      },
+      "engines": {
+        "node": ">=8"
+      }
+    },
     "node_modules/resolve-from": {
       "version": "5.0.0",
       "resolved": "https://registry.npmjs.org/resolve-from/-/resolve-from-5.0.0.tgz",
@@ -7942,6 +10567,13 @@
       ],
       "license": "MIT"
     },
+    "node_modules/safer-buffer": {
+      "version": "2.1.2",
+      "resolved": "https://registry.npmjs.org/safer-buffer/-/safer-buffer-2.1.2.tgz",
+      "integrity": "sha512-YZo3K82SD7Riyi0E1EQPojLz7kpepnSQI9IyPbHHg1XXXevb5dJI7tpyN2ADxGcQbHG7vcyRHk0cbwqcQriUtg==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/sax": {
       "version": "1.6.0",
       "resolved": "https://registry.npmjs.org/sax/-/sax-1.6.0.tgz",
@@ -7951,6 +10583,19 @@
         "node": ">=11.0.0"
       }
     },
+    "node_modules/saxes": {
+      "version": "6.0.0",
+      "resolved": "https://registry.npmjs.org/saxes/-/saxes-6.0.0.tgz",
+      "integrity": "sha512-xAg7SOnEhrm5zI3puOOKyy1OMcMlIJZYNJY7xLBwSze0UjhPLnWfj2GF2EpT0jmzaJKIWKHLsaSSajf35bcYnA==",
+      "dev": true,
+      "license": "ISC",
+      "dependencies": {
+        "xmlchars": "^2.2.0"
+      },
+      "engines": {
+        "node": ">=v12.22.7"
+      }
+    },
     "node_modules/scheduler": {
       "version": "0.26.0",
       "resolved": "https://registry.npmjs.org/scheduler/-/scheduler-0.26.0.tgz",
@@ -8236,6 +10881,16 @@
       "integrity": "sha512-D9cPgkvLlV3t3IzL0D0YLvGA9Ahk4PcvVwUbN0dSGr1aP0Nrt4AEnTUbuGvquEC0mA64Gqt1fzirlRs5ibXx8g==",
       "license": "BSD-3-Clause"
     },
+    "node_modules/stack-generator": {
+      "version": "2.0.10",
+      "resolved": "https://registry.npmjs.org/stack-generator/-/stack-generator-2.0.10.tgz",
+      "integrity": "sha512-mwnua/hkqM6pF4k8SnmZ2zfETsRUpWXREfA/goT8SLCV4iOFa4bzOX2nDipWAZFPTjLvQB82f5yaodMVhK0yJQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "stackframe": "^1.3.4"
+      }
+    },
     "node_modules/stack-utils": {
       "version": "2.0.6",
       "resolved": "https://registry.npmjs.org/stack-utils/-/stack-utils-2.0.6.tgz",
@@ -8263,6 +10918,39 @@
       "integrity": "sha512-oeVtt7eWQS+Na6F//S4kJ2K2VbRlS9D43mAlMyVpVWovy9o+jfgH8O9agzANzaiLjclA0oYzUXEM4PurhSUChw==",
       "license": "MIT"
     },
+    "node_modules/stacktrace-gps": {
+      "version": "3.1.2",
+      "resolved": "https://registry.npmjs.org/stacktrace-gps/-/stacktrace-gps-3.1.2.tgz",
+      "integrity": "sha512-GcUgbO4Jsqqg6RxfyTHFiPxdPqF+3LFmQhm7MgCuYQOYuWyqxo5pwRPz5d/u6/WYJdEnWfK4r+jGbyD8TSggXQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "source-map": "0.5.6",
+        "stackframe": "^1.3.4"
+      }
+    },
+    "node_modules/stacktrace-gps/node_modules/source-map": {
+      "version": "0.5.6",
+      "resolved": "https://registry.npmjs.org/source-map/-/source-map-0.5.6.tgz",
+      "integrity": "sha512-MjZkVp0NHr5+TPihLcadqnlVoGIoWo4IBHptutGh9wI3ttUYvCG26HkSuDi+K6lsZ25syXJXcctwgyVCt//xqA==",
+      "dev": true,
+      "license": "BSD-3-Clause",
+      "engines": {
+        "node": ">=0.10.0"
+      }
+    },
+    "node_modules/stacktrace-js": {
+      "version": "2.0.2",
+      "resolved": "https://registry.npmjs.org/stacktrace-js/-/stacktrace-js-2.0.2.tgz",
+      "integrity": "sha512-Je5vBeY4S1r/RnLydLl0TBTi3F2qdfWmYsGvtfZgEI+SCprPppaIhQf5nGcal4gI4cGpCV/duLcAzT1np6sQqg==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "error-stack-parser": "^2.0.6",
+        "stack-generator": "^2.0.5",
+        "stacktrace-gps": "^3.0.4"
+      }
+    },
     "node_modules/stacktrace-parser": {
       "version": "0.1.11",
       "resolved": "https://registry.npmjs.org/stacktrace-parser/-/stacktrace-parser-0.1.11.tgz",
@@ -8302,6 +10990,20 @@
         "node": ">=4"
       }
     },
+    "node_modules/string-length": {
+      "version": "4.0.2",
+      "resolved": "https://registry.npmjs.org/string-length/-/string-length-4.0.2.tgz",
+      "integrity": "sha512-+l6rNN5fYHNhZZy41RXsYptCjA2Igmq4EG7kZAYFQI1E1VTXarr6ZPXBg6eq7Y6eK4FEhY6AJlyuFIb/v/S0VQ==",
+      "devOptional": true,
+      "license": "MIT",
+      "dependencies": {
+        "char-regex": "^1.0.2",
+        "strip-ansi": "^6.0.0"
+      },
+      "engines": {
+        "node": ">=10"
+      }
+    },
     "node_modules/string-width": {
       "version": "4.2.3",
       "resolved": "https://registry.npmjs.org/string-width/-/string-width-4.2.3.tgz",
@@ -8328,6 +11030,41 @@
         "node": ">=8"
       }
     },
+    "node_modules/strip-bom": {
+      "version": "4.0.0",
+      "resolved": "https://registry.npmjs.org/strip-bom/-/strip-bom-4.0.0.tgz",
+      "integrity": "sha512-3xurFv5tEgii33Zi8Jtp55wEIILR9eh34FAW00PZf+JnSsTmV/ioewSgQl97JHvgjoRGwPShsWm+IdrxB35d0w==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "engines": {
+        "node": ">=8"
+      }
+    },
+    "node_modules/strip-final-newline": {
+      "version": "2.0.0",
+      "resolved": "https://registry.npmjs.org/strip-final-newline/-/strip-final-newline-2.0.0.tgz",
+      "integrity": "sha512-BrpvfNAE3dcvq7ll3xVumzjKjZQ5tI1sEUIKr3Uoks0XUl45St3FlatVqef9prk4jRDzhW6WZg+3bk93y6pLjA==",
+      "devOptional": true,
+      "license": "MIT",
+      "peer": true,
+      "engines": {
+        "node": ">=6"
+      }
+    },
+    "node_modules/strip-indent": {
+      "version": "3.0.0",
+      "resolved": "https://registry.npmjs.org/strip-indent/-/strip-indent-3.0.0.tgz",
+      "integrity": "sha512-laJTa3Jb+VQpaC6DseHhF7dXVqHTfJPCRDaEbid/drOhgitgYku/letMUqOXFoWV0zIIUbjpdH2t+tYj4bQMRQ==",
+      "devOptional": true,
+      "license": "MIT",
+      "dependencies": {
+        "min-indent": "^1.0.0"
+      },
+      "engines": {
+        "node": ">=8"
+      }
+    },
     "node_modules/strip-json-comments": {
       "version": "2.0.1",
       "resolved": "https://registry.npmjs.org/strip-json-comments/-/strip-json-comments-2.0.1.tgz",
@@ -8417,6 +11154,13 @@
         "url": "https://github.com/sponsors/ljharb"
       }
     },
+    "node_modules/symbol-tree": {
+      "version": "3.2.4",
+      "resolved": "https://registry.npmjs.org/symbol-tree/-/symbol-tree-3.2.4.tgz",
+      "integrity": "sha512-9QNk5KwDF+Bvz+PyObkmSYjI5ksVUYtjW7AU22r2NKcfLJcXp96hkDWU3+XndOsUb+AQ9QhfzfCT2O+CNWT5Tw==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/tar": {
       "version": "7.5.15",
       "resolved": "https://registry.npmjs.org/tar/-/tar-7.5.15.tgz",
@@ -8644,6 +11388,22 @@
         "node": ">=0.6"
       }
     },
+    "node_modules/tough-cookie": {
+      "version": "4.1.4",
+      "resolved": "https://registry.npmjs.org/tough-cookie/-/tough-cookie-4.1.4.tgz",
+      "integrity": "sha512-Loo5UUvLD9ScZ6jh8beX1T6sO1w2/MpCRpEP7V280GKMVUQ0Jzar2U3UJPsrdbziLEMMhu3Ujnq//rhiFuIeag==",
+      "dev": true,
+      "license": "BSD-3-Clause",
+      "dependencies": {
+        "psl": "^1.1.33",
+        "punycode": "^2.1.1",
+        "universalify": "^0.2.0",
+        "url-parse": "^1.5.3"
+      },
+      "engines": {
+        "node": ">=6"
+      }
+    },
     "node_modules/tr46": {
       "version": "0.0.3",
       "resolved": "https://registry.npmjs.org/tr46/-/tr46-0.0.3.tgz",
@@ -8775,6 +11535,16 @@
         "node": ">=4"
       }
     },
+    "node_modules/universalify": {
+      "version": "0.2.0",
+      "resolved": "https://registry.npmjs.org/universalify/-/universalify-0.2.0.tgz",
+      "integrity": "sha512-CJ1QgKmNg3CwvAv/kOFmtnEN05f0D/cn9QntgNOQlQF9dgvVTHj3t+8JPdjqawCHk7V/KA+fbUqzZ9XWhcqPUg==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">= 4.0.0"
+      }
+    },
     "node_modules/unpipe": {
       "version": "1.0.0",
       "resolved": "https://registry.npmjs.org/unpipe/-/unpipe-1.0.0.tgz",
@@ -8814,6 +11584,17 @@
         "browserslist": ">= 4.21.0"
       }
     },
+    "node_modules/url-parse": {
+      "version": "1.5.10",
+      "resolved": "https://registry.npmjs.org/url-parse/-/url-parse-1.5.10.tgz",
+      "integrity": "sha512-WypcfiRhfeUP9vvF0j6rw0J3hrWrw6iZv3+22h6iRMJ/8z1Tj6XfLP4DsUix5MhMPnXpiHDoKyoZ/bdCkwBCiQ==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "querystringify": "^2.1.1",
+        "requires-port": "^1.0.0"
+      }
+    },
     "node_modules/use-callback-ref": {
       "version": "1.3.3",
       "resolved": "https://registry.npmjs.org/use-callback-ref/-/use-callback-ref-1.3.3.tgz",
@@ -8894,6 +11675,22 @@
         "uuid": "dist/bin/uuid"
       }
     },
+    "node_modules/v8-to-istanbul": {
+      "version": "9.3.0",
+      "resolved": "https://registry.npmjs.org/v8-to-istanbul/-/v8-to-istanbul-9.3.0.tgz",
+      "integrity": "sha512-kiGUalWN+rgBJ/1OHZsBtU4rXZOfj/7rKQxULKlIzwzQSvMJUUNgPwJEEh7gU6xEVxC0ahoOBvN2YI8GH6FNgA==",
+      "devOptional": true,
+      "license": "ISC",
+      "peer": true,
+      "dependencies": {
+        "@jridgewell/trace-mapping": "^0.3.12",
+        "@types/istanbul-lib-coverage": "^2.0.1",
+        "convert-source-map": "^2.0.0"
+      },
+      "engines": {
+        "node": ">=10.12.0"
+      }
+    },
     "node_modules/validate-npm-package-name": {
       "version": "5.0.1",
       "resolved": "https://registry.npmjs.org/validate-npm-package-name/-/validate-npm-package-name-5.0.1.tgz",
@@ -9108,6 +11905,19 @@
       "integrity": "sha512-gQpnTgkubC6hQgdIcRdYGDSDc+SaujOdyesZQMv6JlfQee/9Mp0Qhnys6WxDWvQnL5WZdT7o2Ul187aSt0Rq+w==",
       "license": "MIT"
     },
+    "node_modules/w3c-xmlserializer": {
+      "version": "4.0.0",
+      "resolved": "https://registry.npmjs.org/w3c-xmlserializer/-/w3c-xmlserializer-4.0.0.tgz",
+      "integrity": "sha512-d+BFHzbiCx6zGfz0HyQ6Rg69w9k19nviJspaj4yNscGjrHu94sVP+aRm75yEbCh+r2/yR+7q6hux9LVtbuTGBw==",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "xml-name-validator": "^4.0.0"
+      },
+      "engines": {
+        "node": ">=14"
+      }
+    },
     "node_modules/walker": {
       "version": "1.0.8",
       "resolved": "https://registry.npmjs.org/walker/-/walker-1.0.8.tgz",
@@ -9138,12 +11948,36 @@
       "integrity": "sha512-2JAn3z8AR6rjK8Sm8orRC0h/bcl/DqL7tRPdGZ4I1CjdF+EaMLmYxBHyXuKL849eucPFhvBoxMsflfOb8kxaeQ==",
       "license": "BSD-2-Clause"
     },
+    "node_modules/whatwg-encoding": {
+      "version": "2.0.0",
+      "resolved": "https://registry.npmjs.org/whatwg-encoding/-/whatwg-encoding-2.0.0.tgz",
+      "integrity": "sha512-p41ogyeMUrw3jWclHWTQg1k05DSVXPLcVxRTYsXUk+ZooOCZLcoYgPZ/HL/D/N+uQPOtcp1me1WhBEaX02mhWg==",
+      "deprecated": "Use @exodus/bytes instead for a more spec-conformant and faster implementation",
+      "dev": true,
+      "license": "MIT",
+      "dependencies": {
+        "iconv-lite": "0.6.3"
+      },
+      "engines": {
+        "node": ">=12"
+      }
+    },
     "node_modules/whatwg-fetch": {
       "version": "3.6.20",
       "resolved": "https://registry.npmjs.org/whatwg-fetch/-/whatwg-fetch-3.6.20.tgz",
       "integrity": "sha512-EqhiFU6daOA8kpjOWTL0olhVOF3i7OrFzSYiGsEMB8GcXS+RrzauAERX65xMeNWVqxA6HXH2m69Z9LaKKdisfg==",
       "license": "MIT"
     },
+    "node_modules/whatwg-mimetype": {
+      "version": "3.0.0",
+      "resolved": "https://registry.npmjs.org/whatwg-mimetype/-/whatwg-mimetype-3.0.0.tgz",
+      "integrity": "sha512-nt+N2dzIutVRxARx1nghPKGv1xHikU7HKdfafKkLNLindmPU/ch3U31NOCGGA/dmPcmb1VlofO0vnKAcsm0o/Q==",
+      "dev": true,
+      "license": "MIT",
+      "engines": {
+        "node": ">=12"
+      }
+    },
     "node_modules/whatwg-url": {
       "version": "5.0.0",
       "resolved": "https://registry.npmjs.org/whatwg-url/-/whatwg-url-5.0.0.tgz",
@@ -9268,6 +12102,16 @@
         "node": ">=10.0.0"
       }
     },
+    "node_modules/xml-name-validator": {
+      "version": "4.0.0",
+      "resolved": "https://registry.npmjs.org/xml-name-validator/-/xml-name-validator-4.0.0.tgz",
+      "integrity": "sha512-ICP2e+jsHvAj2E2lIHxa5tjXRlKDJo4IdvPvCXbXQGdzSfmSpNVyIKMvoZHjDY9DP0zV17iI85o90vRFXNccRw==",
+      "dev": true,
+      "license": "Apache-2.0",
+      "engines": {
+        "node": ">=12"
+      }
+    },
     "node_modules/xml2js": {
       "version": "0.6.0",
       "resolved": "https://registry.npmjs.org/xml2js/-/xml2js-0.6.0.tgz",
@@ -9299,6 +12143,13 @@
         "node": ">=8.0"
       }
     },
+    "node_modules/xmlchars": {
+      "version": "2.2.0",
+      "resolved": "https://registry.npmjs.org/xmlchars/-/xmlchars-2.2.0.tgz",
+      "integrity": "sha512-JZnDKK8B0RCDw84FNdDAIpZK+JuJw+s7Lz8nksI7SIuU3UXJJslUthsi+uWBUYOwPFwW7W7PRLRfUKpxjtjFCw==",
+      "dev": true,
+      "license": "MIT"
+    },
     "node_modules/y18n": {
       "version": "5.0.8",
       "resolved": "https://registry.npmjs.org/y18n/-/y18n-5.0.8.tgz",
diff --git a/package.json b/package.json
index 8bd4a80..0d2be40 100644
--- a/package.json
+++ b/package.json
@@ -6,7 +6,11 @@
     "start": "expo start",
     "android": "expo start --android",
     "ios": "expo start --ios",
-    "web": "expo start --web"
+    "web": "expo start --web",
+    "test": "jest"
+  },
+  "jest": {
+    "preset": "jest-expo"
   },
   "dependencies": {
     "@expo/vector-icons": "^15.0.3",
@@ -32,7 +36,9 @@
     "react-native-worklets": "0.5.1"
   },
   "devDependencies": {
+    "@testing-library/react-native": "^13.3.3",
     "@types/react": "~19.1.0",
+    "jest-expo": "~54.0.17",
     "react-test-renderer": "19.1.0",
     "typescript": "~5.9.2"
   },
tsconfig.json

exec
/bin/zsh -lc 'npm install --save-dev eslint eslint-config-expo prettier eslint-config-prettier' in /Users/uros/Documents/Private/Projects/PerunApp
 exited 1 in 1861ms:
npm error code EPERM
npm error syscall open
npm error path /Users/uros/.npm/_cacache/tmp/***
npm error errno EPERM
npm error
npm error Your cache folder contains root-owned files, due to a bug in previous versions of npm which has since been addressed.
npm error
npm error To permanently fix this problem, please run:
npm error   sudo chown -R 501:20 "/Users/uros/.npm"
npm error Log files were not written due to an error writing to the directory: /Users/uros/.npm/_logs
npm error You can rerun the command with `--loglevel=verbose` to see the logs in your terminal

codex
The first install hit a pre-existing ownership problem in the user-level npm cache. I’m rerunning the same install with a temporary writable cache; this avoids changing global filesystem ownership or project behavior.
exec
/bin/zsh -lc 'npm install --save-dev eslint eslint-config-expo prettier eslint-config-prettier --cache /tmp/perun-npm-cache' in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 29574ms:

added 215 packages, and audited 1131 packages in 29s

189 packages are looking for funding
  run `npm fund` for details

39 vulnerabilities (38 moderate, 1 high)

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
npm notice
npm notice New minor version of npm available! 11.12.1 -> 11.17.0
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.17.0
npm notice To update run: npm install -g npm@11.17.0
npm notice

exec
/bin/zsh -lc "node -e \"const p=require('./package.json'); console.log(JSON.stringify(p.devDependencies,null,2))\" && node -e \"console.log(require('eslint/package.json').version, require('eslint-config-expo/package.json').version, require('prettier/package.json').version, require('eslint-config-prettier/package.json').version)\" && rg -n \"flat|eslint.config\" node_modules/eslint-config-prettier/README.md | head -30 && sed -n '1,120p' node_modules/eslint-config-prettier/README.md" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
{
  "@testing-library/react-native": "^13.3.3",
  "@types/react": "~19.1.0",
  "eslint": "^9.39.4",
  "eslint-config-expo": "^56.0.4",
  "eslint-config-prettier": "^10.1.8",
  "jest-expo": "~54.0.17",
  "prettier": "^3.8.5",
  "react-test-renderer": "19.1.0",
  "typescript": "~5.9.2"
}
9.39.4 56.0.4 3.8.5 10.1.8
1:# eslint-config-prettier
13:1. Install eslint-config-prettier:
16:   npm i -D eslint-config-prettier
20:   yarn add -D eslint-config-prettier
24:   pnpm add -D eslint-config-prettier
28:   bun add -D eslint-config-prettier
31:2. Add eslint-config-prettier to your ESLint configuration – either to [eslintrc] or to [eslint.config.js (flat config)].
45:   - eslint.config.js (flat config): Import eslint-config-prettier, and put it in the configuration array – **after** other configs that you want to override.
50:     // Note the `/flat` suffix here, the difference from default entry is that
51:     // `/flat` added `name` property to the exported object to improve
52:     // [config-inspector](https://eslint.org/blog/2024/04/eslint-config-inspector/) experience.
53:     import eslintConfigPrettier from "eslint-config-prettier/flat";
67:eslint-config-prettier not only turns off _core_ rules, but also some from these plugins automatically:
79:> ℹ️ Note: You might find guides on the Internet saying you should also extend stuff like `"prettier/react"`. Since version 8.0.0 of eslint-config-prettier, all you need to extend is `"prettier"`! That includes all plugins.
81:#### eslint.config.js (flat config) plugin caveat
83:With flat config, _you_ get to decide the plugin name! For example:
87:import eslintConfigPrettier from "eslint-config-prettier/flat";
102:      // But in eslint.config.js (flat config), the name chosen above in `plugins` is used.
110:You might expect eslint-config-prettier to turn off `ts/indent`, but it won’t! Because eslint-config-prettier only turns off `@typescript-eslint/indent`. It cannot know what you chose to call the plugin. Same thing for the CLI helper tool.
118:Some of the rules that eslint-config-prettier turns off may be deprecated, or even removed from ESLint. **This is perfectly fine,** but if you really need to omit the deprecated and removed rules, you can do so by setting the `ESLINT_CONFIG_PRETTIER_NO_DEPRECATED` environment variable to a non-empty value. For example:
126:eslint-config-prettier also ships with a little CLI tool to help you check if your configuration contains any rules that are unnecessary or conflict with Prettier. Here’s how to run it:
129:npx eslint-config-prettier path/to/main.js
155:🚨 This eslint.config.js (flat config) example also has a **conflicting rule** `"indent"` enabled:
159:import eslintConfigPrettier from "eslint-config-prettier/flat";
172:With the new ESLint “flat config” format, you can control what things override what yourself. One way of solving the above conflict is to reorder the config objects so that eslint-config-prettier is last:
176:import eslintConfigPrettier from "eslint-config-prettier/flat";
185:  eslintConfigPrettier, // eslint-config-prettier last
189:However, looking at the above config might feel confusing. It looks like we enable the `indent` rule, but in reality it’s disabled thanks to the `eslintConfigPrettier` line below it. Instead you might want to actually have your own rules _after_ eslint-config-prettier and run the CLI helper tool to find out about problems, so you can remove conflicting rules from the config file altogether (simplifying your config).
196:npx eslint-config-prettier index.js test/index.js legacy/main.js
207:Just like ESLint itself, you can control the eslint-config-prettier CLI helper tool using the `ESLINT_USE_FLAT_CONFIG` environment variable:
# eslint-config-prettier

Turns off all rules that are unnecessary or might conflict with [Prettier].

This lets you use your favorite shareable config without letting its stylistic choices get in the way when using Prettier.

Note that this config _only_ turns rules _off,_ so it only makes sense using it together with some other config.

[prettier]: https://github.com/prettier/prettier

## Installation

1. Install eslint-config-prettier:

   ```shell
   npm i -D eslint-config-prettier
   ```

   ```shell
   yarn add -D eslint-config-prettier
   ```

   ```shell
   pnpm add -D eslint-config-prettier
   ```

   ```shell
   bun add -D eslint-config-prettier
   ```

2. Add eslint-config-prettier to your ESLint configuration – either to [eslintrc] or to [eslint.config.js (flat config)].

   - eslintrc: Add `"prettier"` to the "extends" array in your `.eslintrc.*` file. Make sure to put it **last,** so it gets the chance to override other configs.

     <!-- prettier-ignore -->
     ```json
     {
       "extends": [
         "some-other-config-you-use",
         "prettier"
       ]
     }
     ```

   - eslint.config.js (flat config): Import eslint-config-prettier, and put it in the configuration array – **after** other configs that you want to override.

     <!-- prettier-ignore -->
     ```js
     import someConfig from "some-other-config-you-use";
     // Note the `/flat` suffix here, the difference from default entry is that
     // `/flat` added `name` property to the exported object to improve
     // [config-inspector](https://eslint.org/blog/2024/04/eslint-config-inspector/) experience.
     import eslintConfigPrettier from "eslint-config-prettier/flat";

     export default [
       someConfig,
       eslintConfigPrettier,
     ];
     ```

3. Finally, run the [CLI helper tool](#cli-helper-tool) to find problems in the `"rules"` sections of your config.

> 👉 Using [eslint-plugin-prettier]? Check out [eslint-plugin-prettier’s recommended config][eslint-plugin-prettier-recommended].

### Plugins

eslint-config-prettier not only turns off _core_ rules, but also some from these plugins automatically:

- [@babel/eslint-plugin]
- [@stylistic/eslint-plugin]
- [@typescript-eslint/eslint-plugin]
- [eslint-plugin-babel]
- [eslint-plugin-flowtype]
- [eslint-plugin-react]
- [eslint-plugin-standard]
- [eslint-plugin-unicorn]
- [eslint-plugin-vue]

> ℹ️ Note: You might find guides on the Internet saying you should also extend stuff like `"prettier/react"`. Since version 8.0.0 of eslint-config-prettier, all you need to extend is `"prettier"`! That includes all plugins.

#### eslint.config.js (flat config) plugin caveat

With flat config, _you_ get to decide the plugin name! For example:

```js
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default [
  {
    plugins: {
      // You’d typically use one of the following two:
      // typescriptEslint: typescriptEslint,
      // typescriptEslint,
      // But in this example we give it another name.
      // It might be tempting to use something shorter like “ts”:
      ts: typescriptEslint, // 🚨 Don’t do this!
    },
    rules: {
      // With eslintrc, this is _always_ called:
      // @typescript-eslint/indent
      // But in eslint.config.js (flat config), the name chosen above in `plugins` is used.
      "ts/indent": "error", // 🚨 Don’t do this!
    },
  },
  eslintConfigPrettier,
];
```

You might expect eslint-config-prettier to turn off `ts/indent`, but it won’t! Because eslint-config-prettier only turns off `@typescript-eslint/indent`. It cannot know what you chose to call the plugin. Same thing for the CLI helper tool.

Simply stick to the official plugin names and you’ll be all good.

If you encounter a shared _config_ that uses a non-standard plugin name, please ask them to use the standard name instead.

### Excluding deprecated rules

Some of the rules that eslint-config-prettier turns off may be deprecated, or even removed from ESLint. **This is perfectly fine,** but if you really need to omit the deprecated and removed rules, you can do so by setting the `ESLINT_CONFIG_PRETTIER_NO_DEPRECATED` environment variable to a non-empty value. For example:

```

exec
/bin/zsh -lc "node -e \"for (const n of ['eslint','eslint-config-expo','eslint-config-prettier','prettier']) { const p=require('./node_modules/'+n+'/package.json'); console.log(n, p.version, p.peerDependencies || {}, p.engines || {}) }\" && node -e \"const m=require('./node_modules/expo/bundledNativeModules.json'); console.log(m['eslint-config-expo'] || 'not bundled')\" && npx expo install --check --json 2>/dev/null || true" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 1205ms:
env: load .env
env: export EXPO_PUBLIC_SUPABASE_URL EXPO_PUBLIC_SUPABASE_ANON_KEY

codex
The unconstrained install selected `eslint-config-expo` 56, while Expo SDK 54 explicitly maps that package to `~10.0.0`. I’m correcting it to the SDK-compatible line before creating the config; ESLint 9 itself remains compatible.
exec
/bin/zsh -lc 'npm install --save-dev eslint-config-expo@~10.0.0 --cache /tmp/perun-npm-cache' in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 1567ms:

removed 4 packages, changed 2 packages, and audited 1127 packages in 1s

188 packages are looking for funding
  run `npm fund` for details

39 vulnerabilities (38 moderate, 1 high)

To address issues that do not require attention, run:
  npm audit fix

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.

exec
/bin/zsh -lc "node - <<'NODE'
const config = require('eslint-config-expo/flat');
console.log(Array.isArray(config), config.map(item => ({ name: item.name, ignores: item.ignores })));
NODE
sed -n '1,100p' package.json
find .github -maxdepth 3 -type f -print 2>/dev/null || true" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 579ms:
true [
  { name: 'import/recommended', ignores: undefined },
  { name: 'import/errors', ignores: undefined },
  { name: undefined, ignores: undefined },
  { name: undefined, ignores: undefined },
  { name: undefined, ignores: undefined },
  { name: 'import/typescript', ignores: undefined },
  { name: undefined, ignores: undefined },
  { name: undefined, ignores: undefined },
  { name: undefined, ignores: undefined },
  { name: undefined, ignores: [ 'android/app/build' ] },
  { name: undefined, ignores: undefined },
  { name: undefined, ignores: undefined },
  { name: undefined, ignores: undefined }
]
{
  "name": "peruntreningcentar",
  "main": "expo-router/entry",
  "version": "1.0.0",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "jest"
  },
  "jest": {
    "preset": "jest-expo"
  },
  "dependencies": {
    "@expo/vector-icons": "^15.0.3",
    "@react-native-async-storage/async-storage": "2.2.0",
    "@react-navigation/native": "^7.1.8",
    "@supabase/supabase-js": "^2.106.2",
    "expo": "~54.0.33",
    "expo-constants": "~18.0.13",
    "expo-font": "~14.0.11",
    "expo-linking": "~8.0.11",
    "expo-router": "~6.0.23",
    "expo-splash-screen": "~31.0.13",
    "expo-status-bar": "~3.0.9",
    "expo-web-browser": "~15.0.10",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-native": "0.81.5",
    "react-native-reanimated": "~4.1.1",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
    "react-native-url-polyfill": "^3.0.0",
    "react-native-web": "~0.21.0",
    "react-native-worklets": "0.5.1"
  },
  "devDependencies": {
    "@testing-library/react-native": "^13.3.3",
    "@types/react": "~19.1.0",
    "eslint": "^9.39.4",
    "eslint-config-expo": "~10.0.0",
    "eslint-config-prettier": "^10.1.8",
    "jest-expo": "~54.0.17",
    "prettier": "^3.8.5",
    "react-test-renderer": "19.1.0",
    "typescript": "~5.9.2"
  },
  "private": true
}

apply patch
patch: completed
/Users/uros/Documents/Private/Projects/PerunApp/.github/workflows/ci.yml
/Users/uros/Documents/Private/Projects/PerunApp/.prettierrc
/Users/uros/Documents/Private/Projects/PerunApp/eslint.config.js
/Users/uros/Documents/Private/Projects/PerunApp/package.json
diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml
new file mode 100644
index 0000000000000000000000000000000000000000..31a1bba7e49ca0292d8e35dd9d9b599cadb13b98
--- /dev/null
+++ b/.github/workflows/ci.yml
@@ -0,0 +1,19 @@
+name: CI
+
+on:
+  push:
+  pull_request:
+
+jobs:
+  ci:
+    runs-on: ubuntu-latest
+    steps:
+      - uses: actions/checkout@v4
+      - uses: actions/setup-node@v4
+        with:
+          node-version: 20
+          cache: npm
+      - run: npm ci
+      - run: npx tsc --noEmit
+      - run: npm test
+      - run: npm run lint
diff --git a/.prettierrc b/.prettierrc
new file mode 100644
index 0000000000000000000000000000000000000000..0967ef424bce6791893e9a57bb952f80fd536e93
--- /dev/null
+++ b/.prettierrc
@@ -0,0 +1 @@
+{}
diff --git a/eslint.config.js b/eslint.config.js
new file mode 100644
index 0000000000000000000000000000000000000000..b800191e69699c9fa9b86b4995c95bbde7ef90aa
--- /dev/null
+++ b/eslint.config.js
@@ -0,0 +1,11 @@
+const { defineConfig } = require('eslint/config');
+const expoConfig = require('eslint-config-expo/flat');
+const prettierConfig = require('eslint-config-prettier/flat');
+
+module.exports = defineConfig([
+  expoConfig,
+  prettierConfig,
+  {
+    ignores: ['dist/*'],
+  },
+]);
diff --git a/package.json b/package.json
index ca256804d2d1520452cc38835d35a58809d44bb4..dfc50966e76fb9224d41fcd3b5f8707f787989f0
--- a/package.json
+++ b/package.json
@@ -7,7 +7,9 @@
     "android": "expo start --android",
     "ios": "expo start --ios",
     "web": "expo start --web",
-    "test": "jest"
+    "test": "jest",
+    "lint": "eslint .",
+    "format": "prettier --write ."
   },
   "jest": {
     "preset": "jest-expo"

diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml
new file mode 100644
index 0000000000000000000000000000000000000000..31a1bba7e49ca0292d8e35dd9d9b599cadb13b98
--- /dev/null
+++ b/.github/workflows/ci.yml
@@ -0,0 +1,19 @@
+name: CI
+
+on:
+  push:
+  pull_request:
+
+jobs:
+  ci:
+    runs-on: ubuntu-latest
+    steps:
+      - uses: actions/checkout@v4
+      - uses: actions/setup-node@v4
+        with:
+          node-version: 20
+          cache: npm
+      - run: npm ci
+      - run: npx tsc --noEmit
+      - run: npm test
+      - run: npm run lint
diff --git a/.prettierrc b/.prettierrc
new file mode 100644
index 0000000000000000000000000000000000000000..0967ef424bce6791893e9a57bb952f80fd536e93
--- /dev/null
+++ b/.prettierrc
@@ -0,0 +1 @@
+{}
diff --git a/eslint.config.js b/eslint.config.js
new file mode 100644
index 0000000000000000000000000000000000000000..b800191e69699c9fa9b86b4995c95bbde7ef90aa
--- /dev/null
+++ b/eslint.config.js
@@ -0,0 +1,11 @@
+const { defineConfig } = require('eslint/config');
+const expoConfig = require('eslint-config-expo/flat');
+const prettierConfig = require('eslint-config-prettier/flat');
+
+module.exports = defineConfig([
+  expoConfig,
+  prettierConfig,
+  {
+    ignores: ['dist/*'],
+  },
+]);
diff --git a/package.json b/package.json
index ca256804d2d1520452cc38835d35a58809d44bb4..dfc50966e76fb9224d41fcd3b5f8707f787989f0
--- a/package.json
+++ b/package.json
@@ -7,7 +7,9 @@
     "android": "expo start --android",
     "ios": "expo start --ios",
     "web": "expo start --web",
-    "test": "jest"
+    "test": "jest",
+    "lint": "eslint .",
+    "format": "prettier --write ."
   },
   "jest": {
     "preset": "jest-expo"

exec
/bin/zsh -lc "sed -n '1,110p' package.json && sed -n '1,160p' eslint.config.js && sed -n '1,160p' .github/workflows/ci.yml && xxd -g 1 .prettierrc && git status --short" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
{
  "name": "peruntreningcentar",
  "main": "expo-router/entry",
  "version": "1.0.0",
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "jest",
    "lint": "eslint .",
    "format": "prettier --write ."
  },
  "jest": {
    "preset": "jest-expo"
  },
  "dependencies": {
    "@expo/vector-icons": "^15.0.3",
    "@react-native-async-storage/async-storage": "2.2.0",
    "@react-navigation/native": "^7.1.8",
    "@supabase/supabase-js": "^2.106.2",
    "expo": "~54.0.33",
    "expo-constants": "~18.0.13",
    "expo-font": "~14.0.11",
    "expo-linking": "~8.0.11",
    "expo-router": "~6.0.23",
    "expo-splash-screen": "~31.0.13",
    "expo-status-bar": "~3.0.9",
    "expo-web-browser": "~15.0.10",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-native": "0.81.5",
    "react-native-reanimated": "~4.1.1",
    "react-native-safe-area-context": "~5.6.0",
    "react-native-screens": "~4.16.0",
    "react-native-url-polyfill": "^3.0.0",
    "react-native-web": "~0.21.0",
    "react-native-worklets": "0.5.1"
  },
  "devDependencies": {
    "@testing-library/react-native": "^13.3.3",
    "@types/react": "~19.1.0",
    "eslint": "^9.39.4",
    "eslint-config-expo": "~10.0.0",
    "eslint-config-prettier": "^10.1.8",
    "jest-expo": "~54.0.17",
    "prettier": "^3.8.5",
    "react-test-renderer": "19.1.0",
    "typescript": "~5.9.2"
  },
  "private": true
}
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*'],
  },
]);
name: CI

on:
  push:
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npm test
      - run: npm run lint
00000000: 7b 7d 0a                                         {}.
 M .claude/agents/memory/raphael-memory.md
 M package-lock.json
 M package.json
 D src/components/__tests__/StyledText-test.js
 M src/contexts/TrainingContext.tsx
?? .claude/agents/tmnt/session-logs/2026-06-27-S1-raphael.md
?? .github/
?? .prettierrc
?? .tmnt/runs/T15-donny.md
?? .tmnt/runs/T17-raph.md
?? .tmnt/runs/T18-donny.md
?? eslint.config.js
?? src/constants/__tests__/

diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml
new file mode 100644
index 0000000000000000000000000000000000000000..31a1bba7e49ca0292d8e35dd9d9b599cadb13b98
--- /dev/null
+++ b/.github/workflows/ci.yml
@@ -0,0 +1,19 @@
+name: CI
+
+on:
+  push:
+  pull_request:
+
+jobs:
+  ci:
+    runs-on: ubuntu-latest
+    steps:
+      - uses: actions/checkout@v4
+      - uses: actions/setup-node@v4
+        with:
+          node-version: 20
+          cache: npm
+      - run: npm ci
+      - run: npx tsc --noEmit
+      - run: npm test
+      - run: npm run lint
diff --git a/.prettierrc b/.prettierrc
new file mode 100644
index 0000000000000000000000000000000000000000..0967ef424bce6791893e9a57bb952f80fd536e93
--- /dev/null
+++ b/.prettierrc
@@ -0,0 +1 @@
+{}
diff --git a/eslint.config.js b/eslint.config.js
new file mode 100644
index 0000000000000000000000000000000000000000..b800191e69699c9fa9b86b4995c95bbde7ef90aa
--- /dev/null
+++ b/eslint.config.js
@@ -0,0 +1,11 @@
+const { defineConfig } = require('eslint/config');
+const expoConfig = require('eslint-config-expo/flat');
+const prettierConfig = require('eslint-config-prettier/flat');
+
+module.exports = defineConfig([
+  expoConfig,
+  prettierConfig,
+  {
+    ignores: ['dist/*'],
+  },
+]);
diff --git a/package.json b/package.json
index ca256804d2d1520452cc38835d35a58809d44bb4..dfc50966e76fb9224d41fcd3b5f8707f787989f0
--- a/package.json
+++ b/package.json
@@ -7,7 +7,9 @@
     "android": "expo start --android",
     "ios": "expo start --ios",
     "web": "expo start --web",
-    "test": "jest"
+    "test": "jest",
+    "lint": "eslint .",
+    "format": "prettier --write ."
   },
   "jest": {
     "preset": "jest-expo"

codex
The requested files are in place. I’m now running the exact ESLint verification; after that I’ll validate the workflow/package syntax and inspect the scoped diff without altering unrelated worktree changes.
exec
/bin/zsh -lc 'npx eslint .' in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml
new file mode 100644
index 0000000000000000000000000000000000000000..31a1bba7e49ca0292d8e35dd9d9b599cadb13b98
--- /dev/null
+++ b/.github/workflows/ci.yml
@@ -0,0 +1,19 @@
+name: CI
+
+on:
+  push:
+  pull_request:
+
+jobs:
+  ci:
+    runs-on: ubuntu-latest
+    steps:
+      - uses: actions/checkout@v4
+      - uses: actions/setup-node@v4
+        with:
+          node-version: 20
+          cache: npm
+      - run: npm ci
+      - run: npx tsc --noEmit
+      - run: npm test
+      - run: npm run lint
diff --git a/.prettierrc b/.prettierrc
new file mode 100644
index 0000000000000000000000000000000000000000..0967ef424bce6791893e9a57bb952f80fd536e93
--- /dev/null
+++ b/.prettierrc
@@ -0,0 +1 @@
+{}
diff --git a/eslint.config.js b/eslint.config.js
new file mode 100644
index 0000000000000000000000000000000000000000..b800191e69699c9fa9b86b4995c95bbde7ef90aa
--- /dev/null
+++ b/eslint.config.js
@@ -0,0 +1,11 @@
+const { defineConfig } = require('eslint/config');
+const expoConfig = require('eslint-config-expo/flat');
+const prettierConfig = require('eslint-config-prettier/flat');
+
+module.exports = defineConfig([
+  expoConfig,
+  prettierConfig,
+  {
+    ignores: ['dist/*'],
+  },
+]);
diff --git a/package.json b/package.json
index ca256804d2d1520452cc38835d35a58809d44bb4..dfc50966e76fb9224d41fcd3b5f8707f787989f0
--- a/package.json
+++ b/package.json
@@ -7,7 +7,9 @@
     "android": "expo start --android",
     "ios": "expo start --ios",
     "web": "expo start --web",
-    "test": "jest"
+    "test": "jest",
+    "lint": "eslint .",
+    "format": "prettier --write ."
   },
   "jest": {
     "preset": "jest-expo"

 succeeded in 2301ms:

/Users/uros/Documents/Private/Projects/PerunApp/app/_layout.tsx
  28:6  warning  React Hook useEffect has a missing dependency: 'router'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

/Users/uros/Documents/Private/Projects/PerunApp/src/contexts/TrainingContext.tsx
  167:5  warning  React Hook useMemo has missing dependencies: 'canJoinSession', 'getTrainingsByDay', 'joinSession', and 'leaveSession'. Either include them or remove the dependency array  react-hooks/exhaustive-deps

✖ 2 problems (0 errors, 2 warnings)


exec
/bin/zsh -lc 'npx prettier --check package.json eslint.config.js .prettierrc .github/workflows/ci.yml' in /Users/uros/Documents/Private/Projects/PerunApp
exec
/bin/zsh -lc 'npm test -- --runInBand' in /Users/uros/Documents/Private/Projects/PerunApp
exec
/bin/zsh -lc 'npx tsc --noEmit' in /Users/uros/Documents/Private/Projects/PerunApp
 exited 1 in 460ms:
Checking formatting...
[warn] eslint.config.js
[warn] Code style issues found in the above file. Run Prettier with --write to fix.

 exited 2 in 1020ms:
src/constants/__tests__/days.test.ts(3,1): error TS2582: Cannot find name 'test'. Do you need to install type definitions for a test runner? Try `npm i --save-dev @types/jest` or `npm i --save-dev @types/mocha`.
src/constants/__tests__/days.test.ts(4,3): error TS2304: Cannot find name 'expect'.
src/constants/__tests__/days.test.ts(13,3): error TS2304: Cannot find name 'expect'.
src/constants/__tests__/days.test.ts(21,3): error TS2304: Cannot find name 'expect'.

diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml
new file mode 100644
index 0000000000000000000000000000000000000000..31a1bba7e49ca0292d8e35dd9d9b599cadb13b98
--- /dev/null
+++ b/.github/workflows/ci.yml
@@ -0,0 +1,19 @@
+name: CI
+
+on:
+  push:
+  pull_request:
+
+jobs:
+  ci:
+    runs-on: ubuntu-latest
+    steps:
+      - uses: actions/checkout@v4
+      - uses: actions/setup-node@v4
+        with:
+          node-version: 20
+          cache: npm
+      - run: npm ci
+      - run: npx tsc --noEmit
+      - run: npm test
+      - run: npm run lint
diff --git a/.prettierrc b/.prettierrc
new file mode 100644
index 0000000000000000000000000000000000000000..0967ef424bce6791893e9a57bb952f80fd536e93
--- /dev/null
+++ b/.prettierrc
@@ -0,0 +1 @@
+{}
diff --git a/eslint.config.js b/eslint.config.js
new file mode 100644
index 0000000000000000000000000000000000000000..b800191e69699c9fa9b86b4995c95bbde7ef90aa
--- /dev/null
+++ b/eslint.config.js
@@ -0,0 +1,11 @@
+const { defineConfig } = require('eslint/config');
+const expoConfig = require('eslint-config-expo/flat');
+const prettierConfig = require('eslint-config-prettier/flat');
+
+module.exports = defineConfig([
+  expoConfig,
+  prettierConfig,
+  {
+    ignores: ['dist/*'],
+  },
+]);
diff --git a/package.json b/package.json
index ca256804d2d1520452cc38835d35a58809d44bb4..dfc50966e76fb9224d41fcd3b5f8707f787989f0
--- a/package.json
+++ b/package.json
@@ -7,7 +7,9 @@
     "android": "expo start --android",
     "ios": "expo start --ios",
     "web": "expo start --web",
-    "test": "jest"
+    "test": "jest",
+    "lint": "eslint .",
+    "format": "prettier --write ."
   },
   "jest": {
     "preset": "jest-expo"

 succeeded in 1546ms:
PASS src/constants/__tests__/days.test.ts
  ✓ defines a consistent Sunday-start training week (1 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
Snapshots:   0 total
Time:        0.351 s, estimated 1 s
Ran all test suites.

codex
ESLint passes with two allowed warnings, and Jest passes. TypeScript currently fails only in an unrelated untracked test because Jest globals lack type declarations; the constraints prohibit adding that extra dependency or editing its test/TypeScript config. I’m formatting the new ESLint config and checking lockfile/install consistency now.
exec
/bin/zsh -lc 'npx prettier --write eslint.config.js' in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml
new file mode 100644
index 0000000000000000000000000000000000000000..31a1bba7e49ca0292d8e35dd9d9b599cadb13b98
--- /dev/null
+++ b/.github/workflows/ci.yml
@@ -0,0 +1,19 @@
+name: CI
+
+on:
+  push:
+  pull_request:
+
+jobs:
+  ci:
+    runs-on: ubuntu-latest
+    steps:
+      - uses: actions/checkout@v4
+      - uses: actions/setup-node@v4
+        with:
+          node-version: 20
+          cache: npm
+      - run: npm ci
+      - run: npx tsc --noEmit
+      - run: npm test
+      - run: npm run lint
diff --git a/.prettierrc b/.prettierrc
new file mode 100644
index 0000000000000000000000000000000000000000..0967ef424bce6791893e9a57bb952f80fd536e93
--- /dev/null
+++ b/.prettierrc
@@ -0,0 +1 @@
+{}
diff --git a/eslint.config.js b/eslint.config.js
new file mode 100644
index 0000000000000000000000000000000000000000..b800191e69699c9fa9b86b4995c95bbde7ef90aa
--- /dev/null
+++ b/eslint.config.js
@@ -0,0 +1,11 @@
+const { defineConfig } = require('eslint/config');
+const expoConfig = require('eslint-config-expo/flat');
+const prettierConfig = require('eslint-config-prettier/flat');
+
+module.exports = defineConfig([
+  expoConfig,
+  prettierConfig,
+  {
+    ignores: ['dist/*'],
+  },
+]);
diff --git a/package.json b/package.json
index ca256804d2d1520452cc38835d35a58809d44bb4..dfc50966e76fb9224d41fcd3b5f8707f787989f0
--- a/package.json
+++ b/package.json
@@ -7,7 +7,9 @@
     "android": "expo start --android",
     "ios": "expo start --ios",
     "web": "expo start --web",
-    "test": "jest"
+    "test": "jest",
+    "lint": "eslint .",
+    "format": "prettier --write ."
   },
   "jest": {
     "preset": "jest-expo"

 succeeded in 245ms:
eslint.config.js 13ms

exec
/bin/zsh -lc 'npx eslint .' in /Users/uros/Documents/Private/Projects/PerunApp
exec
/bin/zsh -lc 'npx prettier --check package.json eslint.config.js .prettierrc .github/workflows/ci.yml' in /Users/uros/Documents/Private/Projects/PerunApp
exec
/bin/zsh -lc 'npm ci --dry-run --cache /tmp/perun-npm-cache' in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 326ms:
Checking formatting...
All matched files use Prettier code style!

 succeeded in 767ms:

up to date in 724ms

188 packages are looking for funding
  run `npm fund` for details

diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml
new file mode 100644
index 0000000000000000000000000000000000000000..31a1bba7e49ca0292d8e35dd9d9b599cadb13b98
--- /dev/null
+++ b/.github/workflows/ci.yml
@@ -0,0 +1,19 @@
+name: CI
+
+on:
+  push:
+  pull_request:
+
+jobs:
+  ci:
+    runs-on: ubuntu-latest
+    steps:
+      - uses: actions/checkout@v4
+      - uses: actions/setup-node@v4
+        with:
+          node-version: 20
+          cache: npm
+      - run: npm ci
+      - run: npx tsc --noEmit
+      - run: npm test
+      - run: npm run lint
diff --git a/.prettierrc b/.prettierrc
new file mode 100644
index 0000000000000000000000000000000000000000..0967ef424bce6791893e9a57bb952f80fd536e93
--- /dev/null
+++ b/.prettierrc
@@ -0,0 +1 @@
+{}
diff --git a/eslint.config.js b/eslint.config.js
new file mode 100644
index 0000000000000000000000000000000000000000..b800191e69699c9fa9b86b4995c95bbde7ef90aa
--- /dev/null
+++ b/eslint.config.js
@@ -0,0 +1,11 @@
+const { defineConfig } = require('eslint/config');
+const expoConfig = require('eslint-config-expo/flat');
+const prettierConfig = require('eslint-config-prettier/flat');
+
+module.exports = defineConfig([
+  expoConfig,
+  prettierConfig,
+  {
+    ignores: ['dist/*'],
+  },
+]);
diff --git a/package.json b/package.json
index ca256804d2d1520452cc38835d35a58809d44bb4..dfc50966e76fb9224d41fcd3b5f8707f787989f0
--- a/package.json
+++ b/package.json
@@ -7,7 +7,9 @@
     "android": "expo start --android",
     "ios": "expo start --ios",
     "web": "expo start --web",
-    "test": "jest"
+    "test": "jest",
+    "lint": "eslint .",
+    "format": "prettier --write ."
   },
   "jest": {
     "preset": "jest-expo"

 succeeded in 1535ms:

/Users/uros/Documents/Private/Projects/PerunApp/app/_layout.tsx
  28:6  warning  React Hook useEffect has a missing dependency: 'router'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

/Users/uros/Documents/Private/Projects/PerunApp/src/contexts/TrainingContext.tsx
  167:5  warning  React Hook useMemo has missing dependencies: 'canJoinSession', 'getTrainingsByDay', 'joinSession', and 'leaveSession'. Either include them or remove the dependency array  react-hooks/exhaustive-deps

✖ 2 problems (0 errors, 2 warnings)


exec
/bin/zsh -lc 'git diff -- package.json package-lock.json && git diff --no-index /dev/null eslint.config.js || true && git diff --no-index /dev/null .prettierrc || true && git diff --no-index /dev/null .github/workflows/ci.yml || true' in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml
new file mode 100644
index 0000000000000000000000000000000000000000..31a1bba7e49ca0292d8e35dd9d9b599cadb13b98
--- /dev/null
+++ b/.github/workflows/ci.yml
@@ -0,0 +1,19 @@
+name: CI
+
+on:
+  push:
+  pull_request:
+
+jobs:
+  ci:
+    runs-on: ubuntu-latest
+    steps:
+      - uses: actions/checkout@v4
+      - uses: actions/setup-node@v4
+        with:
+          node-version: 20
+          cache: npm
+      - run: npm ci
+      - run: npx tsc --noEmit
+      - run: npm test
+      - run: npm run lint
diff --git a/.prettierrc b/.prettierrc
new file mode 100644
index 0000000000000000000000000000000000000000..0967ef424bce6791893e9a57bb952f80fd536e93
--- /dev/null
+++ b/.prettierrc
@@ -0,0 +1 @@
+{}
diff --git a/eslint.config.js b/eslint.config.js
new file mode 100644
index 0000000000000000000000000000000000000000..b800191e69699c9fa9b86b4995c95bbde7ef90aa
--- /dev/null
+++ b/eslint.config.js
@@ -0,0 +1,11 @@
+const { defineConfig } = require('eslint/config');
+const expoConfig = require('eslint-config-expo/flat');
+const prettierConfig = require('eslint-config-prettier/flat');
+
+module.exports = defineConfig([
+  expoConfig,
+  prettierConfig,
+  {
+    ignores: ['dist/*'],
+  },
+]);
diff --git a/package.json b/package.json
index ca256804d2d1520452cc38835d35a58809d44bb4..dfc50966e76fb9224d41fcd3b5f8707f787989f0
--- a/package.json
+++ b/package.json
@@ -7,7 +7,9 @@
     "android": "expo start --android",
     "ios": "expo start --ios",
     "web": "expo start --web",
-    "test": "jest"
+    "test": "jest",
+    "lint": "eslint .",
+    "format": "prettier --write ."
   },
   "jest": {
     "preset": "jest-expo"

 succeeded in 111ms:
diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml
new file mode 100644
index 0000000..31a1bba
--- /dev/null
+++ b/.github/workflows/ci.yml
@@ -0,0 +1,19 @@
+name: CI
+
+on:
+  push:
+  pull_request:
+
+jobs:
+  ci:
+    runs-on: ubuntu-latest
+    steps:
+      - uses: actions/checkout@v4
+      - uses: actions/setup-node@v4
+        with:
+          node-version: 20
+          cache: npm
+      - run: npm ci
+      - run: npx tsc --noEmit
+      - run: npm test
+      - run: npm run lint

codex
Implemented lint, Prettier, and CI configuration. ESLint passes with two warnings; Jest passes. Lockfile is consistent.

Note: TypeScript currently fails in an unrelated untracked Jest test due to missing Jest global types.

DONE
diff --git a/.github/workflows/ci.yml b/.github/workflows/ci.yml
new file mode 100644
index 0000000000000000000000000000000000000000..31a1bba7e49ca0292d8e35dd9d9b599cadb13b98
--- /dev/null
+++ b/.github/workflows/ci.yml
@@ -0,0 +1,19 @@
+name: CI
+
+on:
+  push:
+  pull_request:
+
+jobs:
+  ci:
+    runs-on: ubuntu-latest
+    steps:
+      - uses: actions/checkout@v4
+      - uses: actions/setup-node@v4
+        with:
+          node-version: 20
+          cache: npm
+      - run: npm ci
+      - run: npx tsc --noEmit
+      - run: npm test
+      - run: npm run lint
diff --git a/.prettierrc b/.prettierrc
new file mode 100644
index 0000000000000000000000000000000000000000..0967ef424bce6791893e9a57bb952f80fd536e93
--- /dev/null
+++ b/.prettierrc
@@ -0,0 +1 @@
+{}
diff --git a/eslint.config.js b/eslint.config.js
new file mode 100644
index 0000000000000000000000000000000000000000..b800191e69699c9fa9b86b4995c95bbde7ef90aa
--- /dev/null
+++ b/eslint.config.js
@@ -0,0 +1,11 @@
+const { defineConfig } = require('eslint/config');
+const expoConfig = require('eslint-config-expo/flat');
+const prettierConfig = require('eslint-config-prettier/flat');
+
+module.exports = defineConfig([
+  expoConfig,
+  prettierConfig,
+  {
+    ignores: ['dist/*'],
+  },
+]);
diff --git a/package.json b/package.json
index ca256804d2d1520452cc38835d35a58809d44bb4..dfc50966e76fb9224d41fcd3b5f8707f787989f0
--- a/package.json
+++ b/package.json
@@ -7,7 +7,9 @@
     "android": "expo start --android",
     "ios": "expo start --ios",
     "web": "expo start --web",
-    "test": "jest"
+    "test": "jest",
+    "lint": "eslint .",
+    "format": "prettier --write ."
   },
   "jest": {
     "preset": "jest-expo"

tokens used
66,653
Implemented lint, Prettier, and CI configuration. ESLint passes with two warnings; Jest passes. Lockfile is consistent.

Note: TypeScript currently fails in an unrelated untracked Jest test due to missing Jest global types.

DONE
