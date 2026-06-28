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
session id: 019f0ccc-3020-7ff3-be9b-3fac4369ef69
--------
user
TASK: B5 — Add enabled parameter to admin_update_user + inactive booking block

CONTEXT
Goal file: /Users/uros/Documents/Private/Projects/PerunApp/.tmnt/goal-phase-c.md
Working directory: /Users/uros/Documents/Private/Projects/PerunApp
Files to consider (read these before changing anything):
- supabase/migrations/20260627170100_join_session_closed.sql (source for join_session logic)
- src/services/admin/types.ts (UpdateUserPatch interface)
- src/services/admin/users.ts (updateUser function)
- src/contexts/TrainingContext.tsx (bookingErrorMessages)

CODING CONSTRAINTS (non-negotiable)
- Simplicity first: minimum code that solves the problem. No speculative features.
- Surgical changes: touch only files listed above, plus the TWO new migration files. Do not refactor adjacent code.
- Match existing style and conventions in this codebase (SQL: plpgsql style from existing migrations; TS: existing imports and types).
- No new dependencies.
- If anything is unclear, output a line starting "QUESTION:" and stop without writing code.

DEFINITION OF DONE
Create two migration files:

1. supabase/migrations/20260628110000_admin_update_user_enabled.sql
   - Drop the old admin_update_user(uuid, text, text, text, integer) signature
   - Create new overload with p_enabled boolean parameter
   - Apply coalesce logic to enabled field (same pattern as first_name, role, etc.)
   - Revoke all from public/anon; grant execute to authenticated
   - Wrap in begin/commit

2. supabase/migrations/20260628110100_join_session_inactive.sql
   - Copy full body of join_session from 20260627170100_join_session_closed.sql
   - After the not_authenticated check, add an inline check:
     if exists (select 1 from public.profiles where id = v_uid and enabled = false) then
       raise exception 'account_inactive';
     end if;
   - Keep all existing logic: advisory locks, session_closed, capacity, weekly limit, insert/unique constraint check
   - Revoke all from public/anon; grant execute to authenticated
   - Wrap in begin/commit

3. Update src/services/admin/types.ts:
   - Add enabled?: boolean | null; to UpdateUserPatch interface

4. Update src/services/admin/users.ts:
   - In updateUser function, pass p_enabled: patch.enabled ?? null to the rpc params

5. Update src/contexts/TrainingContext.tsx:
   - Add account_inactive entry to bookingErrorMessages map:
     account_inactive: "Vaš nalog je deaktiviran. Obratite se administratoru."

After all edits complete, run:
  npx tsc --noEmit
and confirm exit code 0.

Output: produce the code changes. Then on the last line write: "DONE" or "QUESTION: <text>".
codex
I’ll inspect the four specified files and existing migration conventions, then make only the requested edits and run the TypeScript check.
exec
/bin/zsh -lc "sed -n '1,260p' supabase/migrations/20260627170100_join_session_closed.sql && sed -n '1,220p' src/services/admin/types.ts && sed -n '1,260p' src/services/admin/users.ts && rg -n -C 8 \"bookingErrorMessages\" src/contexts/TrainingContext.tsx && rg -n \"admin_update_user\" supabase/migrations" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
begin;

create or replace function public.join_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid;
  v_max_participants integer;
  v_is_open boolean;
  v_weekly_limit integer;
  v_booking_count bigint;
  v_constraint_name text;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_session_id::text));
  perform pg_advisory_xact_lock(hashtext('join_session_user'), hashtext(v_uid::text));

  select max_participants, is_open
    into v_max_participants, v_is_open
    from public.sessions
   where id = p_session_id;

  if not found then
    raise exception 'session_not_found';
  end if;

  if v_is_open = false then
    raise exception 'session_closed';
  end if;

  select count(*)
    into v_booking_count
    from public.session_participants
   where session_id = p_session_id;

  if v_booking_count >= v_max_participants then
    raise exception 'session_full';
  end if;

  select coalesce(
           (select max_sessions_per_week
              from public.profiles
             where id = v_uid),
           0
         )
    into v_weekly_limit;

  select count(*)
    into v_booking_count
    from public.session_participants
   where user_id = v_uid;

  if v_booking_count >= v_weekly_limit then
    raise exception 'weekly_limit_reached';
  end if;

  begin
    insert into public.session_participants (session_id, user_id)
    values (p_session_id, v_uid);
  exception
    when unique_violation then
      get stacked diagnostics v_constraint_name = constraint_name;

      if v_constraint_name = 'unique_session_user' then
        raise exception 'already_joined';
      end if;

      raise;
  end;
end;
$$;

revoke all on function public.join_session(uuid) from public, anon;
grant execute on function public.join_session(uuid) to authenticated;

commit;
export interface AdminUser {
  id: string;
  first_name: string;
  last_name: string | null;
  email: string;
  role: "user" | "admin";
  max_sessions_per_week: number;
  enabled: boolean | null;
}

export interface MemberSeriesPoint {
  month: string;
  total_members: number;
  new_members: number;
}

export interface OccupancySummary {
  avg_pct: number;
  top_day: string;
  new_this_month: number;
  prev_new: number;
}

export interface UpsertSessionInput {
  id: string | null;
  title: string;
  day_of_week: string;
  time: string;
  room: string | null;
  duration_min: number | null;
  max_participants: number;
  is_open: boolean;
}

export interface UpdateUserPatch {
  first_name?: string | null;
  last_name?: string | null;
  role?: "user" | "admin" | null;
  max_sessions_per_week?: number | null;
}
import { supabase } from "../supabase/client";
import { AdminUser, UpdateUserPatch } from "./types";

export async function listUsers(): Promise<AdminUser[]> {
  const { data, error } = await supabase.rpc("admin_list_users");

  if (error) throw error;
  return (data ?? []) as AdminUser[];
}

export async function updateUser(
  target: string,
  patch: UpdateUserPatch,
): Promise<void> {
  const { error } = await supabase.rpc("admin_update_user", {
    p_target: target,
    p_first_name: patch.first_name ?? null,
    p_last_name: patch.last_name ?? null,
    p_role: patch.role ?? null,
    p_max_sessions_per_week: patch.max_sessions_per_week ?? null,
  });

  if (error) throw error;
}

export async function deleteUser(target: string): Promise<void> {
  const { error } = await supabase.rpc("admin_delete_user", {
    p_target: target,
  });

  if (error) throw error;
}
1-import { createContext, useEffect, useState } from "react";
2-import { Alert } from "react-native";
3-
4-import { useAuth } from "@/hooks/useAuth";
5-import { supabase } from "@/services/supabase/client";
6-import { Training } from "@/types/Training";
7-
8:const bookingErrorMessages: Record<string, string> = {
9-  weekly_limit_reached: "Dostigli ste nedeljni limit.",
10-  session_full: "Termin je popunjen.",
11-  session_closed: "Termin je trenutno zatvoren za prijave.",
12-  already_joined: "Već ste prijavljeni na ovaj termin.",
13-  not_authenticated: "Niste prijavljeni.",
14-  session_not_found: "Termin nije pronađen.",
15-};
16-
17-const getBookingErrorMessage = (rawMessage: string, mapRpcCodes = true) => {
18-  if (mapRpcCodes) {
19:    const code = Object.keys(bookingErrorMessages).find((key) =>
20-      rawMessage.includes(key),
21-    );
22-
23:    if (code) return bookingErrorMessages[code];
24-  }
25-
26-  const fallback = "Došlo je do greške. Pokušajte ponovo.";
27-  return __DEV__ && rawMessage ? `${fallback}\n\n${rawMessage}` : fallback;
28-};
29-
30-type TrainingContextType = {
31-  trainings: Training[];
supabase/migrations/20260627170200_admin_rpcs.sql:114:create or replace function public.admin_update_user(
supabase/migrations/20260627170200_admin_rpcs.sql:151:revoke all on function public.admin_update_user(uuid, text, text, text, integer) from public, anon;
supabase/migrations/20260627170200_admin_rpcs.sql:152:grant execute on function public.admin_update_user(uuid, text, text, text, integer) to authenticated;

codex
The requested insertion points and signatures are unambiguous. I’m checking the existing `admin_update_user` body now so the replacement preserves its authorization and validation behavior exactly.
exec
/bin/zsh -lc "sed -n '90,165p' supabase/migrations/20260627170200_admin_rpcs.sql && git status --short -- supabase/migrations/20260627170100_join_session_closed.sql src/services/admin/types.ts src/services/admin/users.ts src/contexts/TrainingContext.tsx supabase/migrations/20260628110000_admin_update_user_enabled.sql supabase/migrations/20260628110100_join_session_inactive.sql" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
  end if;

  update public.sessions
     set title = p_title,
         day_of_week = p_day_of_week,
         time = p_time,
         room = p_room,
         duration_min = p_duration_min,
         max_participants = p_max_participants,
         is_open = p_is_open
   where id = p_id;

  if not found then
    raise exception 'session_not_found';
  end if;

  return p_id;
end;
$$;

revoke all on function public.admin_upsert_session(uuid, text, public.day_of_week, text, text, integer, integer, boolean) from public, anon;
grant execute on function public.admin_upsert_session(uuid, text, public.day_of_week, text, text, integer, integer, boolean) to authenticated;

-- Applies a partial profile patch while preserving fields passed as null.
create or replace function public.admin_update_user(
  p_target uuid,
  p_first_name text,
  p_last_name text,
  p_role text,
  p_max_sessions_per_week integer
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  if p_role is not null and p_role not in ('user', 'admin') then
    raise exception 'invalid_role';
  end if;

  update public.profiles
     set first_name = coalesce(p_first_name, first_name),
         last_name = coalesce(p_last_name, last_name),
         role = coalesce(p_role, role),
         max_sessions_per_week = coalesce(
           p_max_sessions_per_week,
           max_sessions_per_week
         )
   where id = p_target;

  if not found then
    raise exception 'user_not_found';
  end if;
end;
$$;

revoke all on function public.admin_update_user(uuid, text, text, text, integer) from public, anon;
grant execute on function public.admin_update_user(uuid, text, text, text, integer) to authenticated;

-- Removes both the application profile and its login. The profile is deleted
-- first so its session_participants rows cascade before the auth account goes.
create or replace function public.admin_delete_user(p_target uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not_admin' using errcode = '42501';
  end if;

apply patch
patch: completed
/Users/uros/Documents/Private/Projects/PerunApp/src/contexts/TrainingContext.tsx
/Users/uros/Documents/Private/Projects/PerunApp/src/services/admin/types.ts
/Users/uros/Documents/Private/Projects/PerunApp/src/services/admin/users.ts
/Users/uros/Documents/Private/Projects/PerunApp/supabase/migrations/20260628110000_admin_update_user_enabled.sql
/Users/uros/Documents/Private/Projects/PerunApp/supabase/migrations/20260628110100_join_session_inactive.sql
diff --git a/src/contexts/TrainingContext.tsx b/src/contexts/TrainingContext.tsx
index 07664d25828c7c5309a0e543ef040962a54fa313..26e0865c1f52c3973a2e6122994d8aa6e8ec77c1
--- a/src/contexts/TrainingContext.tsx
+++ b/src/contexts/TrainingContext.tsx
@@ -11,6 +11,7 @@
   session_closed: "Termin je trenutno zatvoren za prijave.",
   already_joined: "Već ste prijavljeni na ovaj termin.",
   not_authenticated: "Niste prijavljeni.",
+  account_inactive: "Vaš nalog je deaktiviran. Obratite se administratoru.",
   session_not_found: "Termin nije pronađen.",
 };
 
diff --git a/src/services/admin/types.ts b/src/services/admin/types.ts
index b7fa07b1e84eb8d6b44791808157739e9a873d41..e0ac0e53f5568bda4454477cd1f01358f284586f
--- a/src/services/admin/types.ts
+++ b/src/services/admin/types.ts
@@ -37,4 +37,5 @@
   last_name?: string | null;
   role?: "user" | "admin" | null;
   max_sessions_per_week?: number | null;
+  enabled?: boolean | null;
 }
diff --git a/src/services/admin/users.ts b/src/services/admin/users.ts
index 4a5dadff20840b710e9d7b129fb75bf8f7fc3cf5..c344ce33b9c1437ee032478e2c1d63754be4ec12
--- a/src/services/admin/users.ts
+++ b/src/services/admin/users.ts
@@ -18,6 +18,7 @@
     p_last_name: patch.last_name ?? null,
     p_role: patch.role ?? null,
     p_max_sessions_per_week: patch.max_sessions_per_week ?? null,
+    p_enabled: patch.enabled ?? null,
   });
 
   if (error) throw error;
diff --git a/supabase/migrations/20260628110000_admin_update_user_enabled.sql b/supabase/migrations/20260628110000_admin_update_user_enabled.sql
new file mode 100644
index 0000000000000000000000000000000000000000..a62e183ab07545bd509509128642f0d5bc9b9e0b
--- /dev/null
+++ b/supabase/migrations/20260628110000_admin_update_user_enabled.sql
@@ -0,0 +1,47 @@
+begin;
+
+drop function public.admin_update_user(uuid, text, text, text, integer);
+
+create or replace function public.admin_update_user(
+  p_target uuid,
+  p_first_name text,
+  p_last_name text,
+  p_role text,
+  p_max_sessions_per_week integer,
+  p_enabled boolean
+)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  if p_role is not null and p_role not in ('user', 'admin') then
+    raise exception 'invalid_role';
+  end if;
+
+  update public.profiles
+     set first_name = coalesce(p_first_name, first_name),
+         last_name = coalesce(p_last_name, last_name),
+         role = coalesce(p_role, role),
+         max_sessions_per_week = coalesce(
+           p_max_sessions_per_week,
+           max_sessions_per_week
+         ),
+         enabled = coalesce(p_enabled, enabled)
+   where id = p_target;
+
+  if not found then
+    raise exception 'user_not_found';
+  end if;
+end;
+$$;
+
+revoke all on function public.admin_update_user(uuid, text, text, text, integer, boolean) from public, anon;
+grant execute on function public.admin_update_user(uuid, text, text, text, integer, boolean) to authenticated;
+
+commit;
diff --git a/supabase/migrations/20260628110100_join_session_inactive.sql b/supabase/migrations/20260628110100_join_session_inactive.sql
new file mode 100644
index 0000000000000000000000000000000000000000..4c6b79ad811fffa9f3204c9347d484a6d50b4770
--- /dev/null
+++ b/supabase/migrations/20260628110100_join_session_inactive.sql
@@ -0,0 +1,93 @@
+begin;
+
+create or replace function public.join_session(p_session_id uuid)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+declare
+  v_uid uuid;
+  v_max_participants integer;
+  v_is_open boolean;
+  v_weekly_limit integer;
+  v_booking_count bigint;
+  v_constraint_name text;
+begin
+  v_uid := auth.uid();
+
+  if v_uid is null then
+    raise exception 'not_authenticated' using errcode = '28000';
+  end if;
+
+  if exists (
+    select 1
+      from public.profiles
+     where id = v_uid
+       and enabled = false
+  ) then
+    raise exception 'account_inactive';
+  end if;
+
+  perform pg_advisory_xact_lock(hashtext(p_session_id::text));
+  perform pg_advisory_xact_lock(hashtext('join_session_user'), hashtext(v_uid::text));
+
+  select max_participants, is_open
+    into v_max_participants, v_is_open
+    from public.sessions
+   where id = p_session_id;
+
+  if not found then
+    raise exception 'session_not_found';
+  end if;
+
+  if v_is_open = false then
+    raise exception 'session_closed';
+  end if;
+
+  select count(*)
+    into v_booking_count
+    from public.session_participants
+   where session_id = p_session_id;
+
+  if v_booking_count >= v_max_participants then
+    raise exception 'session_full';
+  end if;
+
+  select coalesce(
+           (select max_sessions_per_week
+              from public.profiles
+             where id = v_uid),
+           0
+         )
+    into v_weekly_limit;
+
+  select count(*)
+    into v_booking_count
+    from public.session_participants
+   where user_id = v_uid;
+
+  if v_booking_count >= v_weekly_limit then
+    raise exception 'weekly_limit_reached';
+  end if;
+
+  begin
+    insert into public.session_participants (session_id, user_id)
+    values (p_session_id, v_uid);
+  exception
+    when unique_violation then
+      get stacked diagnostics v_constraint_name = constraint_name;
+
+      if v_constraint_name = 'unique_session_user' then
+        raise exception 'already_joined';
+      end if;
+
+      raise;
+  end;
+end;
+$$;
+
+revoke all on function public.join_session(uuid) from public, anon;
+grant execute on function public.join_session(uuid) to authenticated;
+
+commit;

diff --git a/src/contexts/TrainingContext.tsx b/src/contexts/TrainingContext.tsx
index 07664d25828c7c5309a0e543ef040962a54fa313..26e0865c1f52c3973a2e6122994d8aa6e8ec77c1
--- a/src/contexts/TrainingContext.tsx
+++ b/src/contexts/TrainingContext.tsx
@@ -11,6 +11,7 @@
   session_closed: "Termin je trenutno zatvoren za prijave.",
   already_joined: "Već ste prijavljeni na ovaj termin.",
   not_authenticated: "Niste prijavljeni.",
+  account_inactive: "Vaš nalog je deaktiviran. Obratite se administratoru.",
   session_not_found: "Termin nije pronađen.",
 };
 
diff --git a/src/services/admin/types.ts b/src/services/admin/types.ts
index b7fa07b1e84eb8d6b44791808157739e9a873d41..e0ac0e53f5568bda4454477cd1f01358f284586f
--- a/src/services/admin/types.ts
+++ b/src/services/admin/types.ts
@@ -37,4 +37,5 @@
   last_name?: string | null;
   role?: "user" | "admin" | null;
   max_sessions_per_week?: number | null;
+  enabled?: boolean | null;
 }
diff --git a/src/services/admin/users.ts b/src/services/admin/users.ts
index 4a5dadff20840b710e9d7b129fb75bf8f7fc3cf5..c344ce33b9c1437ee032478e2c1d63754be4ec12
--- a/src/services/admin/users.ts
+++ b/src/services/admin/users.ts
@@ -18,6 +18,7 @@
     p_last_name: patch.last_name ?? null,
     p_role: patch.role ?? null,
     p_max_sessions_per_week: patch.max_sessions_per_week ?? null,
+    p_enabled: patch.enabled ?? null,
   });
 
   if (error) throw error;
diff --git a/supabase/migrations/20260628110000_admin_update_user_enabled.sql b/supabase/migrations/20260628110000_admin_update_user_enabled.sql
new file mode 100644
index 0000000000000000000000000000000000000000..a62e183ab07545bd509509128642f0d5bc9b9e0b
--- /dev/null
+++ b/supabase/migrations/20260628110000_admin_update_user_enabled.sql
@@ -0,0 +1,47 @@
+begin;
+
+drop function public.admin_update_user(uuid, text, text, text, integer);
+
+create or replace function public.admin_update_user(
+  p_target uuid,
+  p_first_name text,
+  p_last_name text,
+  p_role text,
+  p_max_sessions_per_week integer,
+  p_enabled boolean
+)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  if p_role is not null and p_role not in ('user', 'admin') then
+    raise exception 'invalid_role';
+  end if;
+
+  update public.profiles
+     set first_name = coalesce(p_first_name, first_name),
+         last_name = coalesce(p_last_name, last_name),
+         role = coalesce(p_role, role),
+         max_sessions_per_week = coalesce(
+           p_max_sessions_per_week,
+           max_sessions_per_week
+         ),
+         enabled = coalesce(p_enabled, enabled)
+   where id = p_target;
+
+  if not found then
+    raise exception 'user_not_found';
+  end if;
+end;
+$$;
+
+revoke all on function public.admin_update_user(uuid, text, text, text, integer, boolean) from public, anon;
+grant execute on function public.admin_update_user(uuid, text, text, text, integer, boolean) to authenticated;
+
+commit;
diff --git a/supabase/migrations/20260628110100_join_session_inactive.sql b/supabase/migrations/20260628110100_join_session_inactive.sql
new file mode 100644
index 0000000000000000000000000000000000000000..4c6b79ad811fffa9f3204c9347d484a6d50b4770
--- /dev/null
+++ b/supabase/migrations/20260628110100_join_session_inactive.sql
@@ -0,0 +1,93 @@
+begin;
+
+create or replace function public.join_session(p_session_id uuid)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+declare
+  v_uid uuid;
+  v_max_participants integer;
+  v_is_open boolean;
+  v_weekly_limit integer;
+  v_booking_count bigint;
+  v_constraint_name text;
+begin
+  v_uid := auth.uid();
+
+  if v_uid is null then
+    raise exception 'not_authenticated' using errcode = '28000';
+  end if;
+
+  if exists (
+    select 1
+      from public.profiles
+     where id = v_uid
+       and enabled = false
+  ) then
+    raise exception 'account_inactive';
+  end if;
+
+  perform pg_advisory_xact_lock(hashtext(p_session_id::text));
+  perform pg_advisory_xact_lock(hashtext('join_session_user'), hashtext(v_uid::text));
+
+  select max_participants, is_open
+    into v_max_participants, v_is_open
+    from public.sessions
+   where id = p_session_id;
+
+  if not found then
+    raise exception 'session_not_found';
+  end if;
+
+  if v_is_open = false then
+    raise exception 'session_closed';
+  end if;
+
+  select count(*)
+    into v_booking_count
+    from public.session_participants
+   where session_id = p_session_id;
+
+  if v_booking_count >= v_max_participants then
+    raise exception 'session_full';
+  end if;
+
+  select coalesce(
+           (select max_sessions_per_week
+              from public.profiles
+             where id = v_uid),
+           0
+         )
+    into v_weekly_limit;
+
+  select count(*)
+    into v_booking_count
+    from public.session_participants
+   where user_id = v_uid;
+
+  if v_booking_count >= v_weekly_limit then
+    raise exception 'weekly_limit_reached';
+  end if;
+
+  begin
+    insert into public.session_participants (session_id, user_id)
+    values (p_session_id, v_uid);
+  exception
+    when unique_violation then
+      get stacked diagnostics v_constraint_name = constraint_name;
+
+      if v_constraint_name = 'unique_session_user' then
+        raise exception 'already_joined';
+      end if;
+
+      raise;
+  end;
+end;
+$$;
+
+revoke all on function public.join_session(uuid) from public, anon;
+grant execute on function public.join_session(uuid) to authenticated;
+
+commit;

codex
The two migrations and three TypeScript changes are in place. I’m verifying that the copied booking function differs only by the inactive-account check, then I’ll run the required compiler check.
exec
/bin/zsh -lc 'git diff --check && git diff -- supabase/migrations/20260628110000_admin_update_user_enabled.sql supabase/migrations/20260628110100_join_session_inactive.sql src/services/admin/types.ts src/services/admin/users.ts src/contexts/TrainingContext.tsx && diff -u supabase/migrations/20260627170100_join_session_closed.sql supabase/migrations/20260628110100_join_session_inactive.sql || true' in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
diff --git a/src/contexts/TrainingContext.tsx b/src/contexts/TrainingContext.tsx
index 07664d2..26e0865 100644
--- a/src/contexts/TrainingContext.tsx
+++ b/src/contexts/TrainingContext.tsx
@@ -11,6 +11,7 @@ const bookingErrorMessages: Record<string, string> = {
   session_closed: "Termin je trenutno zatvoren za prijave.",
   already_joined: "Već ste prijavljeni na ovaj termin.",
   not_authenticated: "Niste prijavljeni.",
+  account_inactive: "Vaš nalog je deaktiviran. Obratite se administratoru.",
   session_not_found: "Termin nije pronađen.",
 };
 
diff --git a/src/services/admin/types.ts b/src/services/admin/types.ts
index b7fa07b..e0ac0e5 100644
--- a/src/services/admin/types.ts
+++ b/src/services/admin/types.ts
@@ -37,4 +37,5 @@ export interface UpdateUserPatch {
   last_name?: string | null;
   role?: "user" | "admin" | null;
   max_sessions_per_week?: number | null;
+  enabled?: boolean | null;
 }
diff --git a/src/services/admin/users.ts b/src/services/admin/users.ts
index 4a5dadf..c344ce3 100644
--- a/src/services/admin/users.ts
+++ b/src/services/admin/users.ts
@@ -18,6 +18,7 @@ export async function updateUser(
     p_last_name: patch.last_name ?? null,
     p_role: patch.role ?? null,
     p_max_sessions_per_week: patch.max_sessions_per_week ?? null,
+    p_enabled: patch.enabled ?? null,
   });
 
   if (error) throw error;
--- supabase/migrations/20260627170100_join_session_closed.sql	2026-06-27 22:37:29
+++ supabase/migrations/20260628110100_join_session_inactive.sql	2026-06-28 07:56:15
@@ -20,6 +20,15 @@
     raise exception 'not_authenticated' using errcode = '28000';
   end if;
 
+  if exists (
+    select 1
+      from public.profiles
+     where id = v_uid
+       and enabled = false
+  ) then
+    raise exception 'account_inactive';
+  end if;
+
   perform pg_advisory_xact_lock(hashtext(p_session_id::text));
   perform pg_advisory_xact_lock(hashtext('join_session_user'), hashtext(v_uid::text));
 

diff --git a/src/contexts/TrainingContext.tsx b/src/contexts/TrainingContext.tsx
index 07664d25828c7c5309a0e543ef040962a54fa313..26e0865c1f52c3973a2e6122994d8aa6e8ec77c1
--- a/src/contexts/TrainingContext.tsx
+++ b/src/contexts/TrainingContext.tsx
@@ -11,6 +11,7 @@
   session_closed: "Termin je trenutno zatvoren za prijave.",
   already_joined: "Već ste prijavljeni na ovaj termin.",
   not_authenticated: "Niste prijavljeni.",
+  account_inactive: "Vaš nalog je deaktiviran. Obratite se administratoru.",
   session_not_found: "Termin nije pronađen.",
 };
 
diff --git a/src/services/admin/types.ts b/src/services/admin/types.ts
index b7fa07b1e84eb8d6b44791808157739e9a873d41..e0ac0e53f5568bda4454477cd1f01358f284586f
--- a/src/services/admin/types.ts
+++ b/src/services/admin/types.ts
@@ -37,4 +37,5 @@
   last_name?: string | null;
   role?: "user" | "admin" | null;
   max_sessions_per_week?: number | null;
+  enabled?: boolean | null;
 }
diff --git a/src/services/admin/users.ts b/src/services/admin/users.ts
index 4a5dadff20840b710e9d7b129fb75bf8f7fc3cf5..c344ce33b9c1437ee032478e2c1d63754be4ec12
--- a/src/services/admin/users.ts
+++ b/src/services/admin/users.ts
@@ -18,6 +18,7 @@
     p_last_name: patch.last_name ?? null,
     p_role: patch.role ?? null,
     p_max_sessions_per_week: patch.max_sessions_per_week ?? null,
+    p_enabled: patch.enabled ?? null,
   });
 
   if (error) throw error;
diff --git a/supabase/migrations/20260628110000_admin_update_user_enabled.sql b/supabase/migrations/20260628110000_admin_update_user_enabled.sql
new file mode 100644
index 0000000000000000000000000000000000000000..a62e183ab07545bd509509128642f0d5bc9b9e0b
--- /dev/null
+++ b/supabase/migrations/20260628110000_admin_update_user_enabled.sql
@@ -0,0 +1,47 @@
+begin;
+
+drop function public.admin_update_user(uuid, text, text, text, integer);
+
+create or replace function public.admin_update_user(
+  p_target uuid,
+  p_first_name text,
+  p_last_name text,
+  p_role text,
+  p_max_sessions_per_week integer,
+  p_enabled boolean
+)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  if p_role is not null and p_role not in ('user', 'admin') then
+    raise exception 'invalid_role';
+  end if;
+
+  update public.profiles
+     set first_name = coalesce(p_first_name, first_name),
+         last_name = coalesce(p_last_name, last_name),
+         role = coalesce(p_role, role),
+         max_sessions_per_week = coalesce(
+           p_max_sessions_per_week,
+           max_sessions_per_week
+         ),
+         enabled = coalesce(p_enabled, enabled)
+   where id = p_target;
+
+  if not found then
+    raise exception 'user_not_found';
+  end if;
+end;
+$$;
+
+revoke all on function public.admin_update_user(uuid, text, text, text, integer, boolean) from public, anon;
+grant execute on function public.admin_update_user(uuid, text, text, text, integer, boolean) to authenticated;
+
+commit;
diff --git a/supabase/migrations/20260628110100_join_session_inactive.sql b/supabase/migrations/20260628110100_join_session_inactive.sql
new file mode 100644
index 0000000000000000000000000000000000000000..4c6b79ad811fffa9f3204c9347d484a6d50b4770
--- /dev/null
+++ b/supabase/migrations/20260628110100_join_session_inactive.sql
@@ -0,0 +1,93 @@
+begin;
+
+create or replace function public.join_session(p_session_id uuid)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+declare
+  v_uid uuid;
+  v_max_participants integer;
+  v_is_open boolean;
+  v_weekly_limit integer;
+  v_booking_count bigint;
+  v_constraint_name text;
+begin
+  v_uid := auth.uid();
+
+  if v_uid is null then
+    raise exception 'not_authenticated' using errcode = '28000';
+  end if;
+
+  if exists (
+    select 1
+      from public.profiles
+     where id = v_uid
+       and enabled = false
+  ) then
+    raise exception 'account_inactive';
+  end if;
+
+  perform pg_advisory_xact_lock(hashtext(p_session_id::text));
+  perform pg_advisory_xact_lock(hashtext('join_session_user'), hashtext(v_uid::text));
+
+  select max_participants, is_open
+    into v_max_participants, v_is_open
+    from public.sessions
+   where id = p_session_id;
+
+  if not found then
+    raise exception 'session_not_found';
+  end if;
+
+  if v_is_open = false then
+    raise exception 'session_closed';
+  end if;
+
+  select count(*)
+    into v_booking_count
+    from public.session_participants
+   where session_id = p_session_id;
+
+  if v_booking_count >= v_max_participants then
+    raise exception 'session_full';
+  end if;
+
+  select coalesce(
+           (select max_sessions_per_week
+              from public.profiles
+             where id = v_uid),
+           0
+         )
+    into v_weekly_limit;
+
+  select count(*)
+    into v_booking_count
+    from public.session_participants
+   where user_id = v_uid;
+
+  if v_booking_count >= v_weekly_limit then
+    raise exception 'weekly_limit_reached';
+  end if;
+
+  begin
+    insert into public.session_participants (session_id, user_id)
+    values (p_session_id, v_uid);
+  exception
+    when unique_violation then
+      get stacked diagnostics v_constraint_name = constraint_name;
+
+      if v_constraint_name = 'unique_session_user' then
+        raise exception 'already_joined';
+      end if;
+
+      raise;
+  end;
+end;
+$$;
+
+revoke all on function public.join_session(uuid) from public, anon;
+grant execute on function public.join_session(uuid) to authenticated;
+
+commit;

exec
/bin/zsh -lc 'npx tsc --noEmit' in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/src/contexts/TrainingContext.tsx b/src/contexts/TrainingContext.tsx
index 07664d25828c7c5309a0e543ef040962a54fa313..26e0865c1f52c3973a2e6122994d8aa6e8ec77c1
--- a/src/contexts/TrainingContext.tsx
+++ b/src/contexts/TrainingContext.tsx
@@ -11,6 +11,7 @@
   session_closed: "Termin je trenutno zatvoren za prijave.",
   already_joined: "Već ste prijavljeni na ovaj termin.",
   not_authenticated: "Niste prijavljeni.",
+  account_inactive: "Vaš nalog je deaktiviran. Obratite se administratoru.",
   session_not_found: "Termin nije pronađen.",
 };
 
diff --git a/src/services/admin/types.ts b/src/services/admin/types.ts
index b7fa07b1e84eb8d6b44791808157739e9a873d41..e0ac0e53f5568bda4454477cd1f01358f284586f
--- a/src/services/admin/types.ts
+++ b/src/services/admin/types.ts
@@ -37,4 +37,5 @@
   last_name?: string | null;
   role?: "user" | "admin" | null;
   max_sessions_per_week?: number | null;
+  enabled?: boolean | null;
 }
diff --git a/src/services/admin/users.ts b/src/services/admin/users.ts
index 4a5dadff20840b710e9d7b129fb75bf8f7fc3cf5..c344ce33b9c1437ee032478e2c1d63754be4ec12
--- a/src/services/admin/users.ts
+++ b/src/services/admin/users.ts
@@ -18,6 +18,7 @@
     p_last_name: patch.last_name ?? null,
     p_role: patch.role ?? null,
     p_max_sessions_per_week: patch.max_sessions_per_week ?? null,
+    p_enabled: patch.enabled ?? null,
   });
 
   if (error) throw error;
diff --git a/supabase/migrations/20260628110000_admin_update_user_enabled.sql b/supabase/migrations/20260628110000_admin_update_user_enabled.sql
new file mode 100644
index 0000000000000000000000000000000000000000..a62e183ab07545bd509509128642f0d5bc9b9e0b
--- /dev/null
+++ b/supabase/migrations/20260628110000_admin_update_user_enabled.sql
@@ -0,0 +1,47 @@
+begin;
+
+drop function public.admin_update_user(uuid, text, text, text, integer);
+
+create or replace function public.admin_update_user(
+  p_target uuid,
+  p_first_name text,
+  p_last_name text,
+  p_role text,
+  p_max_sessions_per_week integer,
+  p_enabled boolean
+)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  if p_role is not null and p_role not in ('user', 'admin') then
+    raise exception 'invalid_role';
+  end if;
+
+  update public.profiles
+     set first_name = coalesce(p_first_name, first_name),
+         last_name = coalesce(p_last_name, last_name),
+         role = coalesce(p_role, role),
+         max_sessions_per_week = coalesce(
+           p_max_sessions_per_week,
+           max_sessions_per_week
+         ),
+         enabled = coalesce(p_enabled, enabled)
+   where id = p_target;
+
+  if not found then
+    raise exception 'user_not_found';
+  end if;
+end;
+$$;
+
+revoke all on function public.admin_update_user(uuid, text, text, text, integer, boolean) from public, anon;
+grant execute on function public.admin_update_user(uuid, text, text, text, integer, boolean) to authenticated;
+
+commit;
diff --git a/supabase/migrations/20260628110100_join_session_inactive.sql b/supabase/migrations/20260628110100_join_session_inactive.sql
new file mode 100644
index 0000000000000000000000000000000000000000..4c6b79ad811fffa9f3204c9347d484a6d50b4770
--- /dev/null
+++ b/supabase/migrations/20260628110100_join_session_inactive.sql
@@ -0,0 +1,93 @@
+begin;
+
+create or replace function public.join_session(p_session_id uuid)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+declare
+  v_uid uuid;
+  v_max_participants integer;
+  v_is_open boolean;
+  v_weekly_limit integer;
+  v_booking_count bigint;
+  v_constraint_name text;
+begin
+  v_uid := auth.uid();
+
+  if v_uid is null then
+    raise exception 'not_authenticated' using errcode = '28000';
+  end if;
+
+  if exists (
+    select 1
+      from public.profiles
+     where id = v_uid
+       and enabled = false
+  ) then
+    raise exception 'account_inactive';
+  end if;
+
+  perform pg_advisory_xact_lock(hashtext(p_session_id::text));
+  perform pg_advisory_xact_lock(hashtext('join_session_user'), hashtext(v_uid::text));
+
+  select max_participants, is_open
+    into v_max_participants, v_is_open
+    from public.sessions
+   where id = p_session_id;
+
+  if not found then
+    raise exception 'session_not_found';
+  end if;
+
+  if v_is_open = false then
+    raise exception 'session_closed';
+  end if;
+
+  select count(*)
+    into v_booking_count
+    from public.session_participants
+   where session_id = p_session_id;
+
+  if v_booking_count >= v_max_participants then
+    raise exception 'session_full';
+  end if;
+
+  select coalesce(
+           (select max_sessions_per_week
+              from public.profiles
+             where id = v_uid),
+           0
+         )
+    into v_weekly_limit;
+
+  select count(*)
+    into v_booking_count
+    from public.session_participants
+   where user_id = v_uid;
+
+  if v_booking_count >= v_weekly_limit then
+    raise exception 'weekly_limit_reached';
+  end if;
+
+  begin
+    insert into public.session_participants (session_id, user_id)
+    values (p_session_id, v_uid);
+  exception
+    when unique_violation then
+      get stacked diagnostics v_constraint_name = constraint_name;
+
+      if v_constraint_name = 'unique_session_user' then
+        raise exception 'already_joined';
+      end if;
+
+      raise;
+  end;
+end;
+$$;
+
+revoke all on function public.join_session(uuid) from public, anon;
+grant execute on function public.join_session(uuid) to authenticated;
+
+commit;

 succeeded in 2114ms:
codex
`npx tsc --noEmit` completed successfully with exit code 0. I’m doing a final scoped status check to confirm only the authorized files were changed.
exec
/bin/zsh -lc "git status --short && sed -n '1,220p' supabase/migrations/20260628110000_admin_update_user_enabled.sql && sed -n '1,220p' supabase/migrations/20260628110100_join_session_inactive.sql" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
 M src/contexts/TrainingContext.tsx
 M src/services/admin/types.ts
 M src/services/admin/users.ts
?? .tmnt/runs/b5-donny.md
?? supabase/migrations/20260628110000_admin_update_user_enabled.sql
?? supabase/migrations/20260628110100_join_session_inactive.sql
begin;

drop function public.admin_update_user(uuid, text, text, text, integer);

create or replace function public.admin_update_user(
  p_target uuid,
  p_first_name text,
  p_last_name text,
  p_role text,
  p_max_sessions_per_week integer,
  p_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not_admin' using errcode = '42501';
  end if;

  if p_role is not null and p_role not in ('user', 'admin') then
    raise exception 'invalid_role';
  end if;

  update public.profiles
     set first_name = coalesce(p_first_name, first_name),
         last_name = coalesce(p_last_name, last_name),
         role = coalesce(p_role, role),
         max_sessions_per_week = coalesce(
           p_max_sessions_per_week,
           max_sessions_per_week
         ),
         enabled = coalesce(p_enabled, enabled)
   where id = p_target;

  if not found then
    raise exception 'user_not_found';
  end if;
end;
$$;

revoke all on function public.admin_update_user(uuid, text, text, text, integer, boolean) from public, anon;
grant execute on function public.admin_update_user(uuid, text, text, text, integer, boolean) to authenticated;

commit;
begin;

create or replace function public.join_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid;
  v_max_participants integer;
  v_is_open boolean;
  v_weekly_limit integer;
  v_booking_count bigint;
  v_constraint_name text;
begin
  v_uid := auth.uid();

  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  if exists (
    select 1
      from public.profiles
     where id = v_uid
       and enabled = false
  ) then
    raise exception 'account_inactive';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_session_id::text));
  perform pg_advisory_xact_lock(hashtext('join_session_user'), hashtext(v_uid::text));

  select max_participants, is_open
    into v_max_participants, v_is_open
    from public.sessions
   where id = p_session_id;

  if not found then
    raise exception 'session_not_found';
  end if;

  if v_is_open = false then
    raise exception 'session_closed';
  end if;

  select count(*)
    into v_booking_count
    from public.session_participants
   where session_id = p_session_id;

  if v_booking_count >= v_max_participants then
    raise exception 'session_full';
  end if;

  select coalesce(
           (select max_sessions_per_week
              from public.profiles
             where id = v_uid),
           0
         )
    into v_weekly_limit;

  select count(*)
    into v_booking_count
    from public.session_participants
   where user_id = v_uid;

  if v_booking_count >= v_weekly_limit then
    raise exception 'weekly_limit_reached';
  end if;

  begin
    insert into public.session_participants (session_id, user_id)
    values (p_session_id, v_uid);
  exception
    when unique_violation then
      get stacked diagnostics v_constraint_name = constraint_name;

      if v_constraint_name = 'unique_session_user' then
        raise exception 'already_joined';
      end if;

      raise;
  end;
end;
$$;

revoke all on function public.join_session(uuid) from public, anon;
grant execute on function public.join_session(uuid) to authenticated;

commit;

diff --git a/src/contexts/TrainingContext.tsx b/src/contexts/TrainingContext.tsx
index 07664d25828c7c5309a0e543ef040962a54fa313..26e0865c1f52c3973a2e6122994d8aa6e8ec77c1
--- a/src/contexts/TrainingContext.tsx
+++ b/src/contexts/TrainingContext.tsx
@@ -11,6 +11,7 @@
   session_closed: "Termin je trenutno zatvoren za prijave.",
   already_joined: "Već ste prijavljeni na ovaj termin.",
   not_authenticated: "Niste prijavljeni.",
+  account_inactive: "Vaš nalog je deaktiviran. Obratite se administratoru.",
   session_not_found: "Termin nije pronađen.",
 };
 
diff --git a/src/services/admin/types.ts b/src/services/admin/types.ts
index b7fa07b1e84eb8d6b44791808157739e9a873d41..e0ac0e53f5568bda4454477cd1f01358f284586f
--- a/src/services/admin/types.ts
+++ b/src/services/admin/types.ts
@@ -37,4 +37,5 @@
   last_name?: string | null;
   role?: "user" | "admin" | null;
   max_sessions_per_week?: number | null;
+  enabled?: boolean | null;
 }
diff --git a/src/services/admin/users.ts b/src/services/admin/users.ts
index 4a5dadff20840b710e9d7b129fb75bf8f7fc3cf5..c344ce33b9c1437ee032478e2c1d63754be4ec12
--- a/src/services/admin/users.ts
+++ b/src/services/admin/users.ts
@@ -18,6 +18,7 @@
     p_last_name: patch.last_name ?? null,
     p_role: patch.role ?? null,
     p_max_sessions_per_week: patch.max_sessions_per_week ?? null,
+    p_enabled: patch.enabled ?? null,
   });
 
   if (error) throw error;
diff --git a/supabase/migrations/20260628110000_admin_update_user_enabled.sql b/supabase/migrations/20260628110000_admin_update_user_enabled.sql
new file mode 100644
index 0000000000000000000000000000000000000000..a62e183ab07545bd509509128642f0d5bc9b9e0b
--- /dev/null
+++ b/supabase/migrations/20260628110000_admin_update_user_enabled.sql
@@ -0,0 +1,47 @@
+begin;
+
+drop function public.admin_update_user(uuid, text, text, text, integer);
+
+create or replace function public.admin_update_user(
+  p_target uuid,
+  p_first_name text,
+  p_last_name text,
+  p_role text,
+  p_max_sessions_per_week integer,
+  p_enabled boolean
+)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  if p_role is not null and p_role not in ('user', 'admin') then
+    raise exception 'invalid_role';
+  end if;
+
+  update public.profiles
+     set first_name = coalesce(p_first_name, first_name),
+         last_name = coalesce(p_last_name, last_name),
+         role = coalesce(p_role, role),
+         max_sessions_per_week = coalesce(
+           p_max_sessions_per_week,
+           max_sessions_per_week
+         ),
+         enabled = coalesce(p_enabled, enabled)
+   where id = p_target;
+
+  if not found then
+    raise exception 'user_not_found';
+  end if;
+end;
+$$;
+
+revoke all on function public.admin_update_user(uuid, text, text, text, integer, boolean) from public, anon;
+grant execute on function public.admin_update_user(uuid, text, text, text, integer, boolean) to authenticated;
+
+commit;
diff --git a/supabase/migrations/20260628110100_join_session_inactive.sql b/supabase/migrations/20260628110100_join_session_inactive.sql
new file mode 100644
index 0000000000000000000000000000000000000000..4c6b79ad811fffa9f3204c9347d484a6d50b4770
--- /dev/null
+++ b/supabase/migrations/20260628110100_join_session_inactive.sql
@@ -0,0 +1,93 @@
+begin;
+
+create or replace function public.join_session(p_session_id uuid)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+declare
+  v_uid uuid;
+  v_max_participants integer;
+  v_is_open boolean;
+  v_weekly_limit integer;
+  v_booking_count bigint;
+  v_constraint_name text;
+begin
+  v_uid := auth.uid();
+
+  if v_uid is null then
+    raise exception 'not_authenticated' using errcode = '28000';
+  end if;
+
+  if exists (
+    select 1
+      from public.profiles
+     where id = v_uid
+       and enabled = false
+  ) then
+    raise exception 'account_inactive';
+  end if;
+
+  perform pg_advisory_xact_lock(hashtext(p_session_id::text));
+  perform pg_advisory_xact_lock(hashtext('join_session_user'), hashtext(v_uid::text));
+
+  select max_participants, is_open
+    into v_max_participants, v_is_open
+    from public.sessions
+   where id = p_session_id;
+
+  if not found then
+    raise exception 'session_not_found';
+  end if;
+
+  if v_is_open = false then
+    raise exception 'session_closed';
+  end if;
+
+  select count(*)
+    into v_booking_count
+    from public.session_participants
+   where session_id = p_session_id;
+
+  if v_booking_count >= v_max_participants then
+    raise exception 'session_full';
+  end if;
+
+  select coalesce(
+           (select max_sessions_per_week
+              from public.profiles
+             where id = v_uid),
+           0
+         )
+    into v_weekly_limit;
+
+  select count(*)
+    into v_booking_count
+    from public.session_participants
+   where user_id = v_uid;
+
+  if v_booking_count >= v_weekly_limit then
+    raise exception 'weekly_limit_reached';
+  end if;
+
+  begin
+    insert into public.session_participants (session_id, user_id)
+    values (p_session_id, v_uid);
+  exception
+    when unique_violation then
+      get stacked diagnostics v_constraint_name = constraint_name;
+
+      if v_constraint_name = 'unique_session_user' then
+        raise exception 'already_joined';
+      end if;
+
+      raise;
+  end;
+end;
+$$;
+
+revoke all on function public.join_session(uuid) from public, anon;
+grant execute on function public.join_session(uuid) to authenticated;
+
+commit;

codex
Implemented both migrations and all three TypeScript updates.

`npx tsc --noEmit` passed with exit code 0.

DONE
diff --git a/src/contexts/TrainingContext.tsx b/src/contexts/TrainingContext.tsx
index 07664d25828c7c5309a0e543ef040962a54fa313..26e0865c1f52c3973a2e6122994d8aa6e8ec77c1
--- a/src/contexts/TrainingContext.tsx
+++ b/src/contexts/TrainingContext.tsx
@@ -11,6 +11,7 @@
   session_closed: "Termin je trenutno zatvoren za prijave.",
   already_joined: "Već ste prijavljeni na ovaj termin.",
   not_authenticated: "Niste prijavljeni.",
+  account_inactive: "Vaš nalog je deaktiviran. Obratite se administratoru.",
   session_not_found: "Termin nije pronađen.",
 };
 
diff --git a/src/services/admin/types.ts b/src/services/admin/types.ts
index b7fa07b1e84eb8d6b44791808157739e9a873d41..e0ac0e53f5568bda4454477cd1f01358f284586f
--- a/src/services/admin/types.ts
+++ b/src/services/admin/types.ts
@@ -37,4 +37,5 @@
   last_name?: string | null;
   role?: "user" | "admin" | null;
   max_sessions_per_week?: number | null;
+  enabled?: boolean | null;
 }
diff --git a/src/services/admin/users.ts b/src/services/admin/users.ts
index 4a5dadff20840b710e9d7b129fb75bf8f7fc3cf5..c344ce33b9c1437ee032478e2c1d63754be4ec12
--- a/src/services/admin/users.ts
+++ b/src/services/admin/users.ts
@@ -18,6 +18,7 @@
     p_last_name: patch.last_name ?? null,
     p_role: patch.role ?? null,
     p_max_sessions_per_week: patch.max_sessions_per_week ?? null,
+    p_enabled: patch.enabled ?? null,
   });
 
   if (error) throw error;
diff --git a/supabase/migrations/20260628110000_admin_update_user_enabled.sql b/supabase/migrations/20260628110000_admin_update_user_enabled.sql
new file mode 100644
index 0000000000000000000000000000000000000000..a62e183ab07545bd509509128642f0d5bc9b9e0b
--- /dev/null
+++ b/supabase/migrations/20260628110000_admin_update_user_enabled.sql
@@ -0,0 +1,47 @@
+begin;
+
+drop function public.admin_update_user(uuid, text, text, text, integer);
+
+create or replace function public.admin_update_user(
+  p_target uuid,
+  p_first_name text,
+  p_last_name text,
+  p_role text,
+  p_max_sessions_per_week integer,
+  p_enabled boolean
+)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+begin
+  if not public.is_admin(auth.uid()) then
+    raise exception 'not_admin' using errcode = '42501';
+  end if;
+
+  if p_role is not null and p_role not in ('user', 'admin') then
+    raise exception 'invalid_role';
+  end if;
+
+  update public.profiles
+     set first_name = coalesce(p_first_name, first_name),
+         last_name = coalesce(p_last_name, last_name),
+         role = coalesce(p_role, role),
+         max_sessions_per_week = coalesce(
+           p_max_sessions_per_week,
+           max_sessions_per_week
+         ),
+         enabled = coalesce(p_enabled, enabled)
+   where id = p_target;
+
+  if not found then
+    raise exception 'user_not_found';
+  end if;
+end;
+$$;
+
+revoke all on function public.admin_update_user(uuid, text, text, text, integer, boolean) from public, anon;
+grant execute on function public.admin_update_user(uuid, text, text, text, integer, boolean) to authenticated;
+
+commit;
diff --git a/supabase/migrations/20260628110100_join_session_inactive.sql b/supabase/migrations/20260628110100_join_session_inactive.sql
new file mode 100644
index 0000000000000000000000000000000000000000..4c6b79ad811fffa9f3204c9347d484a6d50b4770
--- /dev/null
+++ b/supabase/migrations/20260628110100_join_session_inactive.sql
@@ -0,0 +1,93 @@
+begin;
+
+create or replace function public.join_session(p_session_id uuid)
+returns void
+language plpgsql
+security definer
+set search_path = public, pg_temp
+as $$
+declare
+  v_uid uuid;
+  v_max_participants integer;
+  v_is_open boolean;
+  v_weekly_limit integer;
+  v_booking_count bigint;
+  v_constraint_name text;
+begin
+  v_uid := auth.uid();
+
+  if v_uid is null then
+    raise exception 'not_authenticated' using errcode = '28000';
+  end if;
+
+  if exists (
+    select 1
+      from public.profiles
+     where id = v_uid
+       and enabled = false
+  ) then
+    raise exception 'account_inactive';
+  end if;
+
+  perform pg_advisory_xact_lock(hashtext(p_session_id::text));
+  perform pg_advisory_xact_lock(hashtext('join_session_user'), hashtext(v_uid::text));
+
+  select max_participants, is_open
+    into v_max_participants, v_is_open
+    from public.sessions
+   where id = p_session_id;
+
+  if not found then
+    raise exception 'session_not_found';
+  end if;
+
+  if v_is_open = false then
+    raise exception 'session_closed';
+  end if;
+
+  select count(*)
+    into v_booking_count
+    from public.session_participants
+   where session_id = p_session_id;
+
+  if v_booking_count >= v_max_participants then
+    raise exception 'session_full';
+  end if;
+
+  select coalesce(
+           (select max_sessions_per_week
+              from public.profiles
+             where id = v_uid),
+           0
+         )
+    into v_weekly_limit;
+
+  select count(*)
+    into v_booking_count
+    from public.session_participants
+   where user_id = v_uid;
+
+  if v_booking_count >= v_weekly_limit then
+    raise exception 'weekly_limit_reached';
+  end if;
+
+  begin
+    insert into public.session_participants (session_id, user_id)
+    values (p_session_id, v_uid);
+  exception
+    when unique_violation then
+      get stacked diagnostics v_constraint_name = constraint_name;
+
+      if v_constraint_name = 'unique_session_user' then
+        raise exception 'already_joined';
+      end if;
+
+      raise;
+  end;
+end;
+$$;
+
+revoke all on function public.join_session(uuid) from public, anon;
+grant execute on function public.join_session(uuid) to authenticated;
+
+commit;

tokens used
13,949
Implemented both migrations and all three TypeScript updates.

`npx tsc --noEmit` passed with exit code 0.

DONE
