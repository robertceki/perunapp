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
session id: 019f09dd-d9d7-7d11-a4f8-a8c175cd781e
--------
user
TASK: T8 (S5) — Show booking errors to the user (Serbian messages)

CONTEXT
Goal file: /Users/uros/Documents/Private/Projects/PerunApp/.tmnt/goal.md
Working directory: /Users/uros/Documents/Private/Projects/PerunApp
Framework: React Native 0.81 + Expo 54 + Supabase JS
Files to consider (read these before changing anything):
- src/contexts/TrainingContext.tsx
- src/components/TrainingCard.tsx
- package.json

BACKGROUND
joinSession() currently calls the RPC join_session, which can fail with Postgres errors whose message contains one of these stable codes:
  - not_authenticated
  - session_not_found
  - session_full
  - weekly_limit_reached
  - already_joined

The error is thrown in joinSession but the caller (TrainingCard.onPress) does not await/catch, so the error becomes an unhandled rejection. leaveSession has the same risk.

CODING CONSTRAINTS (non-negotiable)
- Simplicity first: minimum code that solves the problem. No speculative features.
- Surgical changes: touch ONLY src/contexts/TrainingContext.tsx (and optionally one small new helper file for the error-code-to-message mapping). Do not touch TrainingCard or backend.
- Match existing component patterns: the codebase inlines Serbian strings directly in components.
- Reuse existing imports; do NOT add new dependencies.
- No new dependencies unless explicitly required.
- If anything is unclear, output "QUESTION: <text>" and stop without writing code.

DEFINITION OF DONE
1. On a failed join/leave, show a user-visible message using React Native's Alert.alert(...). Map the RPC error codes to friendly Serbian messages:
   - weekly_limit_reached -> "Dostigli ste nedeljni limit."
   - session_full -> "Termin je popunjen."
   - already_joined -> "Već ste prijavljeni na ovaj termin."
   - not_authenticated -> "Niste prijavljeni."
   - session_not_found -> "Termin nije pronađen."
   - anything else / leave failure -> "Došlo je do greške. Pokušajte ponovo." (include raw error message in __DEV__ only).
2. Implement the code->message mapping in a small helper (either a tiny function in TrainingContext or a new src/constants or src/utils file — keep it minimal and consistent).
3. Make the flow not throw into un-awaited onPress. Preferred approach: handle the error INSIDE joinSession/leaveSession (show the Alert there) and do NOT rethrow, so existing callers stay safe without changes.
4. Remove bare console.error/console.log from the prod path in these two functions — gate any logging behind if (__DEV__).
5. Keep the existing await fetchTrainings() refresh on success. Keep the client-side canJoinSession() UX guard. Do not change the RPC call itself or any backend.
6. npx tsc --noEmit must pass.

DO THIS STEP-BY-STEP:
1. Create a small helper function to map error.message (containing the Postgres error string) to the Serbian message.
2. Modify joinSession to catch the RPC error, call the helper to get the message, show Alert.alert(), and NOT rethrow.
3. Modify leaveSession to catch the delete error, call the helper, show Alert.alert(), and NOT rethrow.
4. Gate any logging behind if (__DEV__).
5. Verify tsc --noEmit passes.

Output: produce the code changes. Then on the last line write: "DONE" or "QUESTION: <text>".
codex
I’ll inspect the three requested files and the goal context first, then make the smallest context-only change and run TypeScript validation.
exec
/bin/zsh -lc "sed -n '1,240p' .tmnt/goal.md && sed -n '1,320p' src/contexts/TrainingContext.tsx && sed -n '1,260p' src/components/TrainingCard.tsx && sed -n '1,220p' package.json" in /Users/uros/Documents/Private/Projects/PerunApp
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
import { createContext, useEffect, useMemo, useState } from "react";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/services/supabase/client";
import { Training } from "@/types/Training";

type TrainingContextType = {
  trainings: Training[];
  loading: boolean;
  fetchTrainings: () => Promise<void>;
  getTrainingsByDay: (day: string) => Training[];
  joinSession: (sessionId: string) => Promise<void>;
  leaveSession: (sessionId: string) => Promise<void>;
  canJoinSession: () => boolean;
  reachedLimit: boolean;
  bookedCount: number;
};

export const TrainingContext = createContext<TrainingContextType>({
  trainings: [],
  loading: true,
  fetchTrainings: async () => {},
  getTrainingsByDay: () => [],
  joinSession: async () => {},
  leaveSession: async () => {},
  canJoinSession: () => false,
  reachedLimit: false,
  bookedCount: 0,
});

export function TrainingProvider({ children }: { children: React.ReactNode }) {
  const { session, profile } = useAuth();

  const [trainings, setTrainings] = useState<Training[]>([]);
  const [loading, setLoading] = useState(true);

  // -------------------------
  // FETCH
  // -------------------------
  const fetchTrainings = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("sessions")
      .select(
        `*,session_participants (
          user_id,
          profiles (
            first_name,
            last_name
          )
        )`,
      )
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    // IMPORTANT: new reference
    setTrainings([...(data as Training[])]);

    setLoading(false);
  };

  useEffect(() => {
    fetchTrainings();
  }, []);

  // -------------------------
  // FILTER
  // -------------------------
  const getTrainingsByDay = (day: string) =>
    trainings.filter((t) => t.day_of_week === day);

  // -------------------------
  // BOOKED COUNT
  // -------------------------
  const bookedCount = trainings
    .flatMap((t) => t.session_participants)
    .filter((p) => p.user_id === session?.user?.id).length;

  const reachedLimit = bookedCount >= (profile?.max_sessions_per_week ?? 0);

  // -------------------------
  // GUARD
  // -------------------------
  const canJoinSession = () => {
    if (!session?.user?.id || !profile) return false;

    return bookedCount < (profile.max_sessions_per_week ?? 0);
  };

  // -------------------------
  // JOIN (SAFE - NO FAKE DATA)
  // -------------------------
  const joinSession = async (sessionId: string) => {
    const userId = session?.user?.id;
    if (!userId) return;

    if (!canJoinSession()) return;

    const { error } = await supabase.rpc("join_session", {
      p_session_id: sessionId,
    });

    if (error) {
      console.error(error);
      throw error;
    }

    // ALWAYS REFRESH (CONSISTENT STATE)
    await fetchTrainings();
  };

  // -------------------------
  // LEAVE
  // -------------------------
  const leaveSession = async (sessionId: string) => {
    const userId = session?.user?.id;
    if (!userId) return;

    const { error } = await supabase
      .from("session_participants")
      .delete()
      .match({
        session_id: sessionId,
        user_id: userId,
      });

    if (error) {
      console.log(error);
      return;
    }

    await fetchTrainings();
  };

  // -------------------------
  // MEMO
  // -------------------------
  const value = useMemo(
    () => ({
      trainings,
      loading,
      fetchTrainings,
      getTrainingsByDay,
      joinSession,
      leaveSession,
      canJoinSession,
      reachedLimit,
      bookedCount,
    }),
    [trainings, loading, bookedCount, reachedLimit],
  );

  return (
    <TrainingContext.Provider value={value}>
      {children}
    </TrainingContext.Provider>
  );
}
import { useAuth } from "@/hooks/useAuth";
import { useTrainings } from "@/hooks/useTrainings";
import { Training } from "@/types/Training";
import { Pressable, Text, View } from "react-native";

export function TrainingCard({ training }: { training: Training }) {
  const { session } = useAuth();
  const { joinSession, leaveSession, reachedLimit } = useTrainings();

  const userId = session?.user.id;

  const participants = training.session_participants ?? [];

  const isBooked = participants.some((p) => p.user_id === userId);

  const bookedCount = participants.length;

  const isFull = bookedCount >= training.max_participants;

  const canJoin = !isFull && !reachedLimit && !isBooked;

  return (
    <View
      style={{
        marginBottom: 16,
        padding: 16,
        borderWidth: 1,
        borderRadius: 12,
        borderColor: "#eee",
      }}
    >
      {/* TITLE */}
      <Text style={{ fontWeight: "700", fontSize: 16 }}>{training.title}</Text>

      <Text style={{ marginTop: 4 }}>{training.time}</Text>

      {/* CAPACITY */}
      <Text style={{ marginTop: 8 }}>
        {bookedCount} / {training.max_participants}
      </Text>

      {/* ACTION */}
      {isBooked ? (
        <Pressable onPress={() => leaveSession(training.id)}>
          <Text
            style={{
              color: "red",
              marginTop: 10,
            }}
          >
            Odjavi se
          </Text>
        </Pressable>
      ) : (
        <Pressable disabled={!canJoin} onPress={() => joinSession(training.id)}>
          <Text
            style={{
              marginTop: 10,
              color: canJoin ? "green" : "gray",
              fontWeight: "600",
            }}
          >
            {reachedLimit
              ? "Nedeljni limit dostignut"
              : isFull
                ? "Popunjeno"
                : "Prijavi se"}
          </Text>
        </Pressable>
      )}

      {/* PARTICIPANTS */}
      <Text
        style={{
          marginTop: 12,
          fontWeight: "600",
        }}
      >
        Participants:
      </Text>

      {(participants ?? []).map((p) => (
        <Text key={p.user_id}>
          {p.profiles?.first_name ?? ""} {p.profiles?.last_name ?? ""}
        </Text>
      ))}
    </View>
  );
}
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
    "@types/jest": "^30.0.0",
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

codex
The existing Supabase calls return errors rather than throwing them, so I’ll handle those returned errors in place. The helper will map RPC codes for joins, while leave failures always use the required generic message; unknown details are appended only in development.
apply patch
patch: completed
/Users/uros/Documents/Private/Projects/PerunApp/src/contexts/TrainingContext.tsx
diff --git a/src/contexts/TrainingContext.tsx b/src/contexts/TrainingContext.tsx
index 1f203ad4cc322964ec65383bda0d9832eb3a5dff..a969b73a78945e4beb3fae4b25966a9eade11d46
--- a/src/contexts/TrainingContext.tsx
+++ b/src/contexts/TrainingContext.tsx
@@ -1,9 +1,31 @@
 import { createContext, useEffect, useMemo, useState } from "react";
+import { Alert } from "react-native";
 
 import { useAuth } from "@/hooks/useAuth";
 import { supabase } from "@/services/supabase/client";
 import { Training } from "@/types/Training";
 
+const bookingErrorMessages: Record<string, string> = {
+  weekly_limit_reached: "Dostigli ste nedeljni limit.",
+  session_full: "Termin je popunjen.",
+  already_joined: "Već ste prijavljeni na ovaj termin.",
+  not_authenticated: "Niste prijavljeni.",
+  session_not_found: "Termin nije pronađen.",
+};
+
+const getBookingErrorMessage = (rawMessage: string, mapRpcCodes = true) => {
+  if (mapRpcCodes) {
+    const code = Object.keys(bookingErrorMessages).find((key) =>
+      rawMessage.includes(key),
+    );
+
+    if (code) return bookingErrorMessages[code];
+  }
+
+  const fallback = "Došlo je do greške. Pokušajte ponovo.";
+  return __DEV__ && rawMessage ? `${fallback}\n\n${rawMessage}` : fallback;
+};
+
 type TrainingContextType = {
   trainings: Training[];
   loading: boolean;
@@ -109,8 +131,9 @@
     });
 
     if (error) {
-      console.error(error);
-      throw error;
+      if (__DEV__) console.error(error);
+      Alert.alert(getBookingErrorMessage(error.message));
+      return;
     }
 
     // ALWAYS REFRESH (CONSISTENT STATE)
@@ -133,7 +156,8 @@
       });
 
     if (error) {
-      console.log(error);
+      if (__DEV__) console.error(error);
+      Alert.alert(getBookingErrorMessage(error.message, false));
       return;
     }
 

diff --git a/src/contexts/TrainingContext.tsx b/src/contexts/TrainingContext.tsx
index 1f203ad4cc322964ec65383bda0d9832eb3a5dff..a969b73a78945e4beb3fae4b25966a9eade11d46
--- a/src/contexts/TrainingContext.tsx
+++ b/src/contexts/TrainingContext.tsx
@@ -1,9 +1,31 @@
 import { createContext, useEffect, useMemo, useState } from "react";
+import { Alert } from "react-native";
 
 import { useAuth } from "@/hooks/useAuth";
 import { supabase } from "@/services/supabase/client";
 import { Training } from "@/types/Training";
 
+const bookingErrorMessages: Record<string, string> = {
+  weekly_limit_reached: "Dostigli ste nedeljni limit.",
+  session_full: "Termin je popunjen.",
+  already_joined: "Već ste prijavljeni na ovaj termin.",
+  not_authenticated: "Niste prijavljeni.",
+  session_not_found: "Termin nije pronađen.",
+};
+
+const getBookingErrorMessage = (rawMessage: string, mapRpcCodes = true) => {
+  if (mapRpcCodes) {
+    const code = Object.keys(bookingErrorMessages).find((key) =>
+      rawMessage.includes(key),
+    );
+
+    if (code) return bookingErrorMessages[code];
+  }
+
+  const fallback = "Došlo je do greške. Pokušajte ponovo.";
+  return __DEV__ && rawMessage ? `${fallback}\n\n${rawMessage}` : fallback;
+};
+
 type TrainingContextType = {
   trainings: Training[];
   loading: boolean;
@@ -109,8 +131,9 @@
     });
 
     if (error) {
-      console.error(error);
-      throw error;
+      if (__DEV__) console.error(error);
+      Alert.alert(getBookingErrorMessage(error.message));
+      return;
     }
 
     // ALWAYS REFRESH (CONSISTENT STATE)
@@ -133,7 +156,8 @@
       });
 
     if (error) {
-      console.log(error);
+      if (__DEV__) console.error(error);
+      Alert.alert(getBookingErrorMessage(error.message, false));
       return;
     }
 

exec
/bin/zsh -lc 'git diff -- src/contexts/TrainingContext.tsx && npx tsc --noEmit' in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/src/contexts/TrainingContext.tsx b/src/contexts/TrainingContext.tsx
index 1f203ad4cc322964ec65383bda0d9832eb3a5dff..a969b73a78945e4beb3fae4b25966a9eade11d46
--- a/src/contexts/TrainingContext.tsx
+++ b/src/contexts/TrainingContext.tsx
@@ -1,9 +1,31 @@
 import { createContext, useEffect, useMemo, useState } from "react";
+import { Alert } from "react-native";
 
 import { useAuth } from "@/hooks/useAuth";
 import { supabase } from "@/services/supabase/client";
 import { Training } from "@/types/Training";
 
+const bookingErrorMessages: Record<string, string> = {
+  weekly_limit_reached: "Dostigli ste nedeljni limit.",
+  session_full: "Termin je popunjen.",
+  already_joined: "Već ste prijavljeni na ovaj termin.",
+  not_authenticated: "Niste prijavljeni.",
+  session_not_found: "Termin nije pronađen.",
+};
+
+const getBookingErrorMessage = (rawMessage: string, mapRpcCodes = true) => {
+  if (mapRpcCodes) {
+    const code = Object.keys(bookingErrorMessages).find((key) =>
+      rawMessage.includes(key),
+    );
+
+    if (code) return bookingErrorMessages[code];
+  }
+
+  const fallback = "Došlo je do greške. Pokušajte ponovo.";
+  return __DEV__ && rawMessage ? `${fallback}\n\n${rawMessage}` : fallback;
+};
+
 type TrainingContextType = {
   trainings: Training[];
   loading: boolean;
@@ -109,8 +131,9 @@
     });
 
     if (error) {
-      console.error(error);
-      throw error;
+      if (__DEV__) console.error(error);
+      Alert.alert(getBookingErrorMessage(error.message));
+      return;
     }
 
     // ALWAYS REFRESH (CONSISTENT STATE)
@@ -133,7 +156,8 @@
       });
 
     if (error) {
-      console.log(error);
+      if (__DEV__) console.error(error);
+      Alert.alert(getBookingErrorMessage(error.message, false));
       return;
     }
 

 succeeded in 1329ms:
codex
Updated [TrainingContext.tsx](/Users/uros/Documents/Private/Projects/PerunApp/src/contexts/TrainingContext.tsx):

- Added Serbian error mapping and `Alert.alert`.
- Prevented join/leave error propagation.
- Gated logging behind `__DEV__`.
- Preserved successful refresh and join guard.
- `npx tsc --noEmit` passes.

DONE
diff --git a/src/contexts/TrainingContext.tsx b/src/contexts/TrainingContext.tsx
index 1f203ad4cc322964ec65383bda0d9832eb3a5dff..a969b73a78945e4beb3fae4b25966a9eade11d46
--- a/src/contexts/TrainingContext.tsx
+++ b/src/contexts/TrainingContext.tsx
@@ -1,9 +1,31 @@
 import { createContext, useEffect, useMemo, useState } from "react";
+import { Alert } from "react-native";
 
 import { useAuth } from "@/hooks/useAuth";
 import { supabase } from "@/services/supabase/client";
 import { Training } from "@/types/Training";
 
+const bookingErrorMessages: Record<string, string> = {
+  weekly_limit_reached: "Dostigli ste nedeljni limit.",
+  session_full: "Termin je popunjen.",
+  already_joined: "Već ste prijavljeni na ovaj termin.",
+  not_authenticated: "Niste prijavljeni.",
+  session_not_found: "Termin nije pronađen.",
+};
+
+const getBookingErrorMessage = (rawMessage: string, mapRpcCodes = true) => {
+  if (mapRpcCodes) {
+    const code = Object.keys(bookingErrorMessages).find((key) =>
+      rawMessage.includes(key),
+    );
+
+    if (code) return bookingErrorMessages[code];
+  }
+
+  const fallback = "Došlo je do greške. Pokušajte ponovo.";
+  return __DEV__ && rawMessage ? `${fallback}\n\n${rawMessage}` : fallback;
+};
+
 type TrainingContextType = {
   trainings: Training[];
   loading: boolean;
@@ -109,8 +131,9 @@
     });
 
     if (error) {
-      console.error(error);
-      throw error;
+      if (__DEV__) console.error(error);
+      Alert.alert(getBookingErrorMessage(error.message));
+      return;
     }
 
     // ALWAYS REFRESH (CONSISTENT STATE)
@@ -133,7 +156,8 @@
       });
 
     if (error) {
-      console.log(error);
+      if (__DEV__) console.error(error);
+      Alert.alert(getBookingErrorMessage(error.message, false));
       return;
     }
 

tokens used
10,006
Updated [TrainingContext.tsx](/Users/uros/Documents/Private/Projects/PerunApp/src/contexts/TrainingContext.tsx):

- Added Serbian error mapping and `Alert.alert`.
- Prevented join/leave error propagation.
- Gated logging behind `__DEV__`.
- Preserved successful refresh and join guard.
- `npx tsc --noEmit` passes.

DONE
