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
session id: 019f0ccf-bc9a-76b2-a77e-350d4e919a7e
--------
user
TASK: Phase C Group B — UI tasks (B1, B3, D5, B4, B5, B2 profile)

CONTEXT
Goal file: /Users/uros/Documents/Private/Projects/PerunApp/.tmnt/goal-phase-c.md
Working directory: /Users/uros/Documents/Private/Projects/PerunApp
Framework: React Native + Expo + Tauri 2
Files to consider (read these before changing anything):
- /Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/training/[id].tsx
- /Users/uros/Documents/Private/Projects/PerunApp/src/components/TrainingCard.tsx
- /Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/(tabs)/index.tsx (Pregled)
- /Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/(tabs)/stats.tsx (Statistika)
- /Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/(tabs)/users.tsx
- /Users/uros/Documents/Private/Projects/PerunApp/app/profile.tsx
- /Users/uros/Documents/Private/Projects/PerunApp/src/components/admin/StatTile.tsx

CODING CONSTRAINTS (non-negotiable)
- Simplicity first: minimum code that solves the problem. No speculative features.
- Surgical changes: touch only files listed above. Do not refactor adjacent components.
- Match existing component patterns and styling conventions (Tauri + RN + Tailwind NOT used; use RN StyleSheet).
- Reuse existing components and design tokens. Do not create new tokens, colors, spacing values.
- No new dependencies.
- TS strict mode: no `any`.
- If anything is unclear, output "QUESTION: <text>" and stop without writing code.

DEFINITION OF DONE
Task B1: Form has no Sala/Trajanje fields; when saving, pass room: null and duration_min: null to upsertSession.
Task B3: VREME field is a masked time input (keyboardType="number-pad", auto-insert ":" after 2 digits → HH:MM). Validate on save: HH 00–23, MM 00–59; if invalid, show Alert and disable save.
Task D5: TrainingCard removes the "60 min" duration text line entirely. Changes category from "Grupni · Sala A" to just "Grupni". Keep time, title, capacity, actions intact.
Task B4: StatTile grid rows (both in Pregled and Statistika) use alignItems: "stretch" and flex layout so tiles match the tallest in the row (e.g., wrap-to-2-line label doesn't break row height).
Task B5: Edit-user modal has an "Aktivan" row with Toggle. State init from user.enabled ?? true. On save, include enabled in updateUser patch. Show inactive users muted in list (optional).
Task B2 (profile.tsx): Role-aware profile. Logout button calls useAuth().logout(). For MEMBERS: weekly-limit is READ-ONLY display "{bookedCount} / {max} ove nedelje"; do NOT call updateProfile for limit. For ADMINS: show minimal profile (name + ADMIN badge) + logout; hide weekly-limit/booking section.

Output: produce the code changes. Then on the last line write: "DONE" or "QUESTION: <text>".
codex
I’ll inspect the goal, all seven listed files, and the current worktree before making surgical edits. Then I’ll run targeted type/lint checks if the repository exposes them.
exec
/bin/zsh -lc "git status --short && sed -n '1,240p' .tmnt/goal-phase-c.md && for f in 'app/(admin)/training/[id].tsx' 'src/components/TrainingCard.tsx' 'app/(admin)/(tabs)/index.tsx' 'app/(admin)/(tabs)/stats.tsx' 'app/(admin)/(tabs)/users.tsx' 'app/profile.tsx' 'src/components/admin/StatTile.tsx'; do echo \"FILE:"'$f"; sed -n '"'1,320p' \""'$f"; done' in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
 M .claude/agents/memory/donatello-memory.md
 M src/contexts/TrainingContext.tsx
 M src/services/admin/types.ts
 M src/services/admin/users.ts
?? .claude/agents/tmnt/session-logs/2026-06-28-S6-donatello.md
?? .tmnt/runs/b5-donny.md
?? .tmnt/runs/phase-c-b-groupb-mikey.md
?? supabase/migrations/20260628110000_admin_update_user_enabled.sql
?? supabase/migrations/20260628110100_join_session_inactive.sql
# Goal: Perun — PHASE C (post-test bug fixes & gaps)

**Date:** 2026-06-28
**Target project:** /Users/uros/Documents/Private/Projects/PerunApp
**Branch:** design_update (continue) — or a new `phase-c` branch off it (decision)
**Status:** PLAN — awaiting Uros approval before execution.
**Source:** Uros's hands-on test of the Phase B build (admin + login). 11 findings.

## What we're fixing
Eleven issues found while testing. They cluster into: (A) login/auth blockers,
(B) admin UX fixes, (C) cross-platform layout, (D) one new stat feature.
Testing was partly blocked by the login issues, so Group A is highest priority.

---

## Group A — Login & Auth (BLOCKERS — do first)
**A1 (#8) — Can't type password.** login.tsx has no ScrollView/KeyboardAvoidingView;
the 200px emblem hero pushes the password field under the keyboard, so taps hit
the email field. Fix: wrap login in KeyboardAvoidingView + ScrollView (or shrink
the hero when the keyboard is open) so both fields stay tappable. Verify on
Android + iOS.

**A2 (#9) — "Pridruži se" goes nowhere.** It's plain text today. Build a
registration screen (`app/register.tsx`): fields ime/prezime, email, lozinka →
`supabase.auth.signUp`. The `handle_new_user` trigger already creates the profile
(role=user, weekly limit 0). Make the login footer link navigate there; add a
"back to login" path. → depends on **Decision D4** (email confirmation).

**A3 (#11) — "Zaboravljena lozinka" does nothing.** Empty onPress. Implement
`supabase.auth.resetPasswordForEmail(email)` → Supabase emails a reset link/OTP
(NOT a literal "temporary password" — that's not how Supabase works). Needs a
small "enter your email" step + a reset-password screen (or rely on Supabase's
hosted reset page). → depends on **Decision D3** (mechanism + email/SMTP).

**A4 (#10) — Remove tagline under logo.** Delete the "Rezerviši svoj termin…"
text on login. Trivial.

## Group B — Admin UX
**B1 (#1) — Drop SALA + TRAJANJE from the create/edit form.** Remove the room and
duration_min fields from `app/(admin)/training/[id].tsx`; `admin_upsert_session`
keeps accepting them but the form passes null. (The member card's "Grupni · Sala A"
/ "60 min" are hardcoded placeholders, not data — see **Decision D5** for whether
to also remove those.) Columns stay in the DB (harmless), no migration needed.

**B2 (#7) — Admin logout + stop the avatar bounce.** Two parts:
  - Fix the role-routing guard in `app/_layout.tsx` so it does NOT redirect an
    admin away from shared modal routes (e.g. `/profile`). Whitelist non-group
    routes instead of bouncing anything that isn't `(admin)`/`(tabs)`.
  - Give admins a logout. Simplest: make `profile.tsx` role-aware (admins see a
    minimal profile + "Odjavi se"), reachable from the admin avatar; or a small
    dropdown sheet from the avatar with "Odjavi se". Recommend role-aware profile.

**B3 (#4) — Time input mask.** `VREME` becomes a numeric, masked input: type 4
digits, auto-insert ":" after the first two → "HH:MM"; validate 00–23 / 00–59.
Apply in the training form (and reuse in any other time entry).

**B4 (#3) — Equal-height stat cards.** StatTile cards in the 2×2 grids render
unequal when a label wraps to two lines. Fix: tiles `flex: 1` + row
`alignItems: "stretch"` (and/or a minHeight) so a row's tiles match the tallest.

**B5 (#5) — Active/inactive toggle in edit-user.** `profiles.enabled` exists but
isn't editable. Add an "Aktivan" toggle to the edit-user modal; extend
`admin_update_user` with a `p_enabled boolean` param + the service `UpdateUserPatch`.
→ depends on **Decision D1** (what "inactive" actually enforces).

## Group C — Cross-platform
**C1 (#2) — Android status-bar overlap.** The top bar collides with the system
clock/status bar on Android. Apply safe-area top insets
(`react-native-safe-area-context`, already installed) to AdminHeader + member
Header (and any screen top chrome). Verify on Android.

## Group D — New feature
**D1feat (#6) — Time-slot popularity in Statistika.** Show which time slots /
sessions are most booked so the admin can adjust scheduling. → depends on
**Decision D2** (snapshot vs. historical), because bookings are wiped every
Sunday, so "popularity over time" needs a new persistent attendance-history
table; current-week popularity is cheap.

---

## DECISIONS LOCKED (2026-06-28, from Uros)
- **D1 → block booking only.** Inactive users can still log in but `join_session`
  rejects with `account_inactive`; admin list shows them muted.
- **D2 → persistent history.** Add `attendance_log` (written on each join before
  the weekly wipe) + `admin_slot_popularity` RPC for real trends.
- **D5 → remove** the hardcoded "Grupni · Sala A" / "60 min" from the member card.
- **D6 → continue on `design_update`.**
- **D3/D4 → auto-confirm sign-ups** (disable email confirmation so new accounts
  log in immediately, no email needed). Build the in-app "forgot password" flow
  (`resetPasswordForEmail`), but real delivery is deferred to a later SMTP setup
  (separate infra task). App stays fully testable now.
- **APPROVED to execute (2026-06-28).**

## Decisions to lock before execution
- **D1 — What does "inactive user" enforce?** (B5)
  Recommend: inactive users **cannot book** (add an `enabled` check in
  `join_session` → `account_inactive`), and the admin list shows them muted.
  Also block login for inactive users? (Harder — needs a post-login check +
  sign-out.) Recommend: booking-block now, login-block later.
- **D2 — Slot popularity: snapshot or historical?** (D1feat)
  (a) Current-week only — cheap, no schema change, but resets weekly.
  (b) Persistent — add an `attendance_log` table written on each join (before the
  weekly wipe) + an `admin_slot_popularity` RPC → real trends. More work.
  Recommend (b) if you want this to actually inform scheduling over time.
- **D3 — Password reset mechanism + email.** (A3)
  Supabase sends a reset **link/OTP** email (no "temporary password"). Confirm we
  use `resetPasswordForEmail` + a reset screen. NOTE: reliable auth emails need
  SMTP configured in the Supabase project (the built-in sender is rate-limited);
  is SMTP set up, or should email delivery be treated as a separate infra task?
- **D4 — Sign-up email confirmation.** (A2)
  Require email verification before first login (Supabase default), or
  auto-confirm? Confirmation also needs working email (see D3). Recommend:
  decide alongside D3.
- **D5 — Member card placeholders.** (B1)
  The member TrainingCard shows hardcoded "Grupni · Sala A" / "60 min". Now that
  room/duration are dropped from admin: remove those lines from the card too, or
  leave the static text? Recommend: remove (don't show data we don't collect).
- **D6 — Branch.** Continue on `design_update`, or cut a `phase-c` branch off it?

## Out of scope
- Multi-gym, push/email notifications beyond auth, store builds, localisation
  beyond Serbian.
- Any change to the verified Phase B security model (admin RPCs stay role-checked).

## Definition of done (per group, verifiable)
- A1: on a phone/emulator, you can focus and type into the password field; login
  succeeds. A2: "Pridruži se" → register screen → new account created → lands on
  member home. A3: "Zaboravljena lozinka" → reset email triggered (or hosted flow).
  A4: tagline gone.
- B1: form has no Sala/Trajanje. B2: admin avatar → profile with working
  "Odjavi se"; no bounce. B3: time field auto-formats HH:MM + validates. B4:
  stat-grid tiles equal height. B5: admin can toggle active; enforced per D1.
- C1: no status-bar overlap on Android.
- D1feat: Statistika shows slot popularity per D2.
- Gates: `npx tsc --noEmit` 0, `npm run lint` no new errors, `npm test` green,
  app bundles. Admin RPC security test still passes.

## Suggested order
1. Group A (unblock login/testing) → 2. Group C (Android safe-area, quick) →
3. Group B → 4. Group D. Backend bits (B5 RPC param, D2 table/RPC) before their UI.
FILE:app/(admin)/training/[id].tsx
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FilterChips, Toggle } from "@/components/admin";
import { Colors } from "@/constants/Colors";
import { TRAINING_DAYS } from "@/constants/days";
import type { Day } from "@/constants/days";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";
import { useTrainings } from "@/hooks/useTrainings";
import { upsertSession } from "@/services/admin";
import type { UpsertSessionInput } from "@/services/admin";

const DAY_OPTIONS: { key: Day; label: string }[] = TRAINING_DAYS.map((day) => ({
  key: day,
  label: {
    monday: "PON",
    tuesday: "UTO",
    wednesday: "SRE",
    thursday: "ČET",
    friday: "PET",
    saturday: "SUB",
    sunday: "NED",
  }[day],
}));

export default function TrainingDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";
  const { trainings, loading, fetchTrainings } = useTrainings();
  const training = trainings.find((item) => item.id === id);
  const [title, setTitle] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
  const [time, setTime] = useState("");
  const [room, setRoom] = useState("");
  const [durationMin, setDurationMin] = useState<number | null>(null);
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [isOpen, setIsOpen] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [initializedId, setInitializedId] = useState<string | null>(null);

  useEffect(() => {
    if (!training || initializedId === training.id) return;

    setTitle(training.title);
    setDayOfWeek(
      TRAINING_DAYS.includes(training.day_of_week as Day)
        ? (training.day_of_week as Day)
        : "monday",
    );
    setTime(training.time);
    setRoom(training.room ?? "");
    setDurationMin(training.duration_min);
    setMaxParticipants(Math.min(50, Math.max(1, training.max_participants)));
    setIsOpen(training.is_open);
    setInitializedId(training.id);
  }, [initializedId, training]);

  const submit = async () => {
    const normalizedTitle = title.trim();
    const normalizedTime = time.trim();

    if (!normalizedTitle || !normalizedTime || maxParticipants < 1) {
      Alert.alert(
        "Proverite podatke",
        "Naziv, vreme i najmanje jedan učesnik su obavezni.",
      );
      return;
    }

    const input: UpsertSessionInput = {
      id: isNew ? null : id,
      title: normalizedTitle,
      day_of_week: dayOfWeek,
      time: normalizedTime,
      room: room.trim() || null,
      duration_min: durationMin,
      max_participants: maxParticipants,
      is_open: isOpen,
    };

    setSubmitting(true);
    try {
      await upsertSession(input);
      await fetchTrainings();
      router.back();
    } catch (error: unknown) {
      console.error(error);
      Alert.alert("Greška", "Trening nije sačuvan.");
      await fetchTrainings();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isNew && loading && !training) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator color={Colors.burgundy} />
      </View>
    );
  }

  if (!isNew && !training) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.notFoundText}>Termin nije pronađen</Text>
        <Pressable onPress={() => router.back()} style={styles.notFoundButton}>
          <Text style={styles.notFoundButtonText}>Nazad</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.navBar, { paddingTop: insets.top + 16 }]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.navTitle}>
          {isNew ? "Novi trening" : "Izmena treninga"}
        </Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>NAZIV TRENINGA</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            editable={!submitting}
            style={styles.input}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>DAN</Text>
          <FilterChips
            options={DAY_OPTIONS}
            value={dayOfWeek}
            onChange={setDayOfWeek}
          />
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.columnField}>
            <Text style={styles.fieldLabel}>VREME</Text>
            <TextInput
              value={time}
              onChangeText={setTime}
              placeholder="18:00"
              placeholderTextColor={Colors.inkFaint}
              editable={!submitting}
              style={styles.input}
            />
          </View>
          <View style={styles.columnField}>
            <Text style={styles.fieldLabel}>TRAJANJE (MIN)</Text>
            <TextInput
              value={durationMin?.toString() ?? ""}
              onChangeText={(value) =>
                setDurationMin(
                  value === "" ? null : Number(value.replace(/\D/g, "")),
                )
              }
              keyboardType="number-pad"
              editable={!submitting}
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.columnField}>
            <Text style={styles.fieldLabel}>SALA</Text>
            <TextInput
              value={room}
              onChangeText={setRoom}
              editable={!submitting}
              style={styles.input}
            />
          </View>
          <View style={styles.columnField}>
            <Text style={styles.fieldLabel}>MAKS. UČESNIKA</Text>
            <View style={styles.stepper}>
              <Pressable
                disabled={submitting || maxParticipants === 1}
                onPress={() =>
                  setMaxParticipants((value) => Math.max(1, value - 1))
                }
                style={styles.stepButton}
              >
                <Text style={styles.stepButtonText}>−</Text>
              </Pressable>
              <Text style={styles.stepValue}>{maxParticipants}</Text>
              <Pressable
                disabled={submitting || maxParticipants === 50}
                onPress={() =>
                  setMaxParticipants((value) => Math.min(50, value + 1))
                }
                style={styles.stepButton}
              >
                <Text style={styles.stepButtonText}>＋</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusTextBlock}>
            <Text style={styles.statusTitle}>Status slota</Text>
            <Text style={styles.statusDescription}>
              Otvoren za prijave članova
            </Text>
          </View>
          <Toggle
            value={isOpen}
            onValueChange={setIsOpen}
            disabled={submitting}
          />
        </View>

        <View style={styles.footer}>
          <Pressable
            onPress={() => router.back()}
            disabled={submitting}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Otkaži</Text>
          </Pressable>
          <Pressable
            onPress={() => void submit()}
            disabled={submitting}
            style={[styles.saveButton, submitting && styles.buttonDisabled]}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.saveButtonText}>Sačuvaj trening</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    backgroundColor: Colors.paper,
  },
  notFoundText: {
    ...Typography.body,
    color: Colors.inkMuted,
  },
  notFoundButton: {
    borderColor: Colors.burgundy,
    borderWidth: 1,
    borderRadius: Radii.tile[12],
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  notFoundButtonText: {
    ...Typography.primaryButtonCompact,
    color: Colors.burgundy,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderColor: Colors.fieldBorder,
    borderWidth: 1,
    borderRadius: Radii.tile[12],
    backgroundColor: Colors.surface,
  },
  backChevron: {
    fontFamily: FontFamilies.hanken[500],
FILE:src/components/TrainingCard.tsx
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { useTrainings } from "@/hooks/useTrainings";
import { Training } from "@/types/Training";

const AVATAR_COLORS = [
  { backgroundColor: Colors.sageTint, color: Colors.sage },
  { backgroundColor: Colors.goldTint, color: Colors.goldDeep },
  { backgroundColor: "#F4E6EE", color: Colors.burgundy },
] as const;

export function TrainingCard({ training }: { training: Training }) {
  const { session } = useAuth();
  const { joinSession, leaveSession, reachedLimit } = useTrainings();

  const userId = session?.user.id;
  const participants = training.session_participants ?? [];
  const isBooked = participants.some((participant) => participant.user_id === userId);
  const bookedCount = participants.length;
  const isFull = bookedCount >= training.max_participants;
  const canJoin = !isFull && !reachedLimit && !isBooked;
  const fullAndNotBooked = isFull && !isBooked;
  const spotsLeft = Math.max(training.max_participants - bookedCount, 0);
  const otherParticipants = isBooked
    ? participants.filter((participant) => participant.user_id !== userId)
    : participants;
  const hasOverflow = bookedCount > 3;
  const visibleParticipantSlots = hasOverflow ? 2 : 3;
  const visibleOthers = otherParticipants.slice(
    0,
    Math.max(visibleParticipantSlots - (isBooked ? 1 : 0), 0),
  );
  const shownCount = visibleOthers.length + (isBooked ? 1 : 0);
  const overflowCount = Math.max(bookedCount - shownCount, 0);
  const cardBackground = fullAndNotBooked
    ? Colors.surfaceMuted
    : isBooked
      ? Colors.surfaceWarm
      : Colors.surface;

  return (
    <View
      style={[
        styles.shadowContainer,
        { backgroundColor: cardBackground },
        fullAndNotBooked && styles.noShadow,
      ]}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: cardBackground },
          isBooked && styles.bookedCard,
          fullAndNotBooked && styles.fullCard,
        ]}
      >
        {isBooked && (
          <View style={styles.goldAccent}>
            <View style={styles.goldAccentHighlight} />
          </View>
        )}

        <View style={styles.headerRow}>
          <View style={styles.timeBlock}>
            <Text style={[styles.time, fullAndNotBooked && styles.fullTime]}>
              {training.time.slice(0, 5)}
            </Text>
            <Text style={[styles.duration, fullAndNotBooked && styles.fullMeta]}>
              60 min
            </Text>
          </View>

          <View
            style={[
              styles.divider,
              isBooked && styles.bookedDivider,
              fullAndNotBooked && styles.fullDivider,
            ]}
          />

          <View style={styles.titleBlock}>
            <Text
              numberOfLines={2}
              style={[styles.title, fullAndNotBooked && styles.fullTitle]}
            >
              {training.title}
            </Text>
            <Text style={[styles.category, fullAndNotBooked && styles.fullTime]}>
              Grupni · Sala A
            </Text>
          </View>

          {isBooked ? (
            <View style={styles.bookedChip}>
              <View style={styles.checkBadge}>
                <Text style={styles.check}>✓</Text>
              </View>
              <Text style={styles.bookedChipText}>Prijavljen</Text>
            </View>
          ) : fullAndNotBooked ? (
            <View style={styles.fullChip}>
              <Text style={styles.fullChipText}>Popunjeno</Text>
            </View>
          ) : (
            <View style={styles.spotsChip}>
              <Text style={styles.spotsChipText}>još {spotsLeft} mesta</Text>
            </View>
          )}
        </View>

        <View style={styles.capacityRow}>
          <View style={styles.capacityDetails}>
            <View style={styles.avatarStack}>
              {isBooked && (
                <View
                  style={[
                    styles.participantAvatar,
                    styles.youAvatar,
                    { borderColor: cardBackground },
                  ]}
                >
                  <Text style={styles.youAvatarText}>TI</Text>
                </View>
              )}

              {visibleOthers.map((participant, index) => {
                const palette = AVATAR_COLORS[index % AVATAR_COLORS.length];
                const initials = [
                  participant.profiles?.first_name,
                  participant.profiles?.last_name,
                ]
                  .filter(Boolean)
                  .map((name) => name?.trim().charAt(0))
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <View
                    key={participant.user_id}
                    style={[
                      styles.participantAvatar,
                      shownCount > visibleOthers.length - index && styles.overlap,
                      {
                        backgroundColor: palette.backgroundColor,
                        borderColor: cardBackground,
                      },
                    ]}
                  >
                    <Text style={[styles.avatarText, { color: palette.color }]}>
                      {initials || "—"}
                    </Text>
                  </View>
                );
              })}

              {overflowCount > 0 && (
                <View
                  style={[
                    styles.participantAvatar,
                    styles.overflowAvatar,
                    styles.overlap,
                    { borderColor: cardBackground },
                  ]}
                >
                  <Text style={styles.overflowText}>+{overflowCount}</Text>
                </View>
              )}
            </View>

            <Text
              style={[styles.capacityText, fullAndNotBooked && styles.fullCapacityText]}
            >
              {bookedCount} / {training.max_participants} mesta
            </Text>
          </View>

          {isBooked && (
            <Pressable
              accessibilityRole="button"
              onPress={() => leaveSession(training.id)}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={styles.leaveLink}>Odjavi se</Text>
            </Pressable>
          )}
        </View>

        {!isBooked &&
          (fullAndNotBooked ? (
            <View style={[styles.action, styles.fullAction]}>
              <Text style={styles.fullActionText}>Popunjeno</Text>
            </View>
          ) : reachedLimit ? (
            <View style={[styles.action, styles.limitAction]}>
              <Text style={styles.limitActionText}>Nedeljni limit dostignut</Text>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              disabled={!canJoin}
              onPress={() => joinSession(training.id)}
              style={({ pressed }) => [
                styles.action,
                styles.joinAction,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.joinActionText}>Prijavi se</Text>
            </Pressable>
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    ...Shadows.card,
    borderRadius: Radii.card,
    marginBottom: Spacing.cardGap,
  },
  noShadow: {
    elevation: 0,
    shadowOpacity: 0,
  },
  card: {
    borderColor: Colors.border,
    borderRadius: Radii.card,
    borderWidth: 1,
    overflow: "hidden",
    padding: Spacing.cardPadding,
  },
  bookedCard: {
    borderColor: Colors.goldBorder,
  },
  fullCard: {
    borderColor: "#ECE3D6",
  },
  goldAccent: {
    backgroundColor: Colors.gold,
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
    width: 4,
  },
  goldAccentHighlight: {
    backgroundColor: "#DCC388",
    bottom: 0,
    height: "50%",
    left: 0,
    position: "absolute",
    right: 0,
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 13,
  },
  timeBlock: {
    alignItems: "center",
    width: 58,
  },
  time: {
    ...Typography.time,
    color: Colors.ink,
    lineHeight: 21,
  },
  duration: {
    color: Colors.inkFaint,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 10.5,
    fontWeight: "600",
    marginTop: 4,
  },
  divider: {
    alignSelf: "stretch",
    backgroundColor: Colors.border,
    width: 1,
  },
  bookedDivider: {
    backgroundColor: "#EEE3CC",
  },
  fullDivider: {
    backgroundColor: "#ECE3D6",
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...Typography.cardTitle,
    color: Colors.ink,
  },
  category: {
    ...Typography.secondary,
    color: Colors.sage,
    marginTop: 4,
  },
  fullTime: {
    color: "#9A9098",
  },
  fullMeta: {
    color: "#ADA3AC",
  },
  fullTitle: {
    color: "#6E6670",
  },
  spotsChip: {
    backgroundColor: Colors.goldTint,
    borderRadius: Radii.chip,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  spotsChipText: {
FILE:app/(admin)/(tabs)/index.tsx
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import BarChart from "@/components/admin/BarChart";
import StatTile from "@/components/admin/StatTile";
import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { Typography } from "@/constants/typography";
import { useTrainings } from "@/hooks/useTrainings";
import { memberSeries, occupancySummary } from "@/services/admin/stats";
import type {
  MemberSeriesPoint,
  OccupancySummary,
} from "@/services/admin/types";
import type { Day } from "@/constants/days";

const MONTHS_LC = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAJ",
  "JUN",
  "JUL",
  "AVG",
  "SEP",
  "OKT",
  "NOV",
  "DEC",
] as const;

const DAYS_BY_INDEX: readonly Day[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function monthAbbrevFrom(isoMonth: string) {
  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
  return MONTHS_LC[monthIndex] ?? "—";
}

function getTodayEnum() {
  return DAYS_BY_INDEX[new Date().getDay()];
}

function trendPercent(series: MemberSeriesPoint[]) {
  const first = series[0]?.total_members;
  const last = series.at(-1)?.total_members;

  if (first === undefined || last === undefined || first === 0) return null;
  return Math.round(((last - first) / Math.max(first, 1)) * 100);
}

export default function PregledScreen() {
  const router = useRouter();
  const { trainings, loading: trainingsLoading } = useTrainings();
  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([memberSeries(6), occupancySummary("6")])
      .then(([memberData, occupancyData]) => {
        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
        if (!active) return;
        setSeries(memberData);
        setOccupancy(occupancyData);
      })
      .catch((error: unknown) => {
        console.error(error);
        if (active) setHasError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading || trainingsLoading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator color={Colors.burgundy} />
      </View>
    );
  }

  if (hasError || !occupancy) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.errorText}>Greška pri učitavanju</Text>
      </View>
    );
  }

  const now = new Date();
  const latestMembers = series.at(-1)?.total_members;
  const pct = trendPercent(series);
  const today = getTodayEnum();
  const openToday = trainings.filter(
    (training) => training.is_open && training.day_of_week === today,
  ).length;
  const chartData = series.map((point) => ({
    label: monthAbbrevFrom(point.month),
    value: point.total_members,
  }));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text style={styles.greeting}>Zdravo, Admin</Text>
        <Text style={styles.subtitle}>
          Pregled centra · {MONTHS_LC[now.getMonth()].toLowerCase()}{" "}
          {now.getFullYear()}
        </Text>
      </View>

      <View style={styles.tileGrid}>
        <View style={styles.tileRow}>
          <View style={styles.tileCell}>
            <StatTile
              figure={latestMembers?.toString() ?? "—"}
              label="aktivnih članova"
              figureColor={Colors.burgundy}
              delta={
                occupancy.new_this_month === 0
                  ? undefined
                  : `▲ +${occupancy.new_this_month} ovog meseca`
              }
              deltaColor="#4E7A5C"
            />
          </View>
          <View style={styles.tileCell}>
            <StatTile
              figure={`${occupancy.avg_pct}%`}
              label="popunjenost"
              figureColor={Colors.goldDeep}
            />
          </View>
        </View>
        <View style={styles.tileRow}>
          <View style={styles.tileCell}>
            <StatTile
              figure={trainings.length.toString()}
              label="treninga ove nedelje"
              figureColor={Colors.ink}
            />
          </View>
          <View style={styles.tileCell}>
            <StatTile
              figure={openToday.toString()}
              label="otvorenih slotova danas"
              figureColor={Colors.sage}
            />
          </View>
        </View>
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.microLabel}>ČLANOVI PO MESECU</Text>
          <View style={styles.trendBadge}>
            <Text style={styles.trendText}>
              {pct === null ? "—" : `▲ ${pct}% / 6m`}
            </Text>
          </View>
        </View>
        <BarChart
          data={chartData}
          currentIndex={chartData.length - 1}
          showValueLabelOnCurrent
        />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/(admin)/training/new")}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.primaryButtonPressed,
        ]}
      >
        <Text style={styles.primaryButtonText}>＋ Novi trening</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  content: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 18,
  },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.paper,
  },
  errorText: {
    ...Typography.body,
    color: Colors.inkMuted,
  },
  greeting: {
    ...Typography.greeting,
    color: Colors.ink,
  },
  subtitle: {
    ...Typography.meta,
    color: Colors.inkMuted,
    marginTop: 3,
  },
  tileGrid: {
    gap: 11,
  },
  tileRow: {
    flexDirection: "row",
    gap: 11,
  },
  tileCell: {
    flex: 1,
  },
  chartCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radii.tile[18],
    padding: Spacing.cardPadding,
    ...Shadows.card,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  microLabel: {
    ...Typography.microLabel,
    color: Colors.inkFaint,
  },
  trendBadge: {
    borderRadius: Radii.chip,
    backgroundColor: "#E9F1EB",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  trendText: {
    ...Typography.chip,
    color: "#4E7A5C",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: Colors.burgundy,
    borderRadius: Radii.tile[16],
    padding: 16,
    ...Shadows.primaryButton,
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonText: {
    ...Typography.primaryButton,
    color: Colors.surface,
  },
});
FILE:app/(admin)/(tabs)/stats.tsx
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import BarChart from "@/components/admin/BarChart";
import FilterChips from "@/components/admin/FilterChips";
import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";
import { memberSeries, occupancySummary } from "@/services/admin/stats";
import type {
  MemberSeriesPoint,
  OccupancySummary,
} from "@/services/admin/types";

type Period = "12" | "6" | "all";

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: "12", label: "12 meseci" },
  { key: "6", label: "6 meseci" },
  { key: "all", label: "Sve" },
];

const MONTHS_LC = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAJ",
  "JUN",
  "JUL",
  "AVG",
  "SEP",
  "OKT",
  "NOV",
  "DEC",
] as const;

const DAY_ABBR: Record<string, string> = {
  monday: "PON",
  tuesday: "UTO",
  wednesday: "SRE",
  thursday: "ČET",
  friday: "PET",
  saturday: "SUB",
  sunday: "NED",
};

function monthAbbrevFrom(isoMonth: string) {
  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
  return MONTHS_LC[monthIndex] ?? "—";
}

function trendPercent(series: MemberSeriesPoint[]) {
  const first = series[0]?.total_members;
  const last = series.at(-1)?.total_members;

  if (first === undefined || last === undefined || first === 0) return null;
  return Math.round(((last - first) / Math.max(first, 1)) * 100);
}

export default function StatsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const months: 12 | 6 | 24 =
    selectedPeriod === "all" ? 24 : selectedPeriod === "12" ? 12 : 6;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setHasError(false);

    Promise.all([memberSeries(months), occupancySummary(selectedPeriod)])
      .then(([memberData, occupancyData]) => {
        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
        if (!active) return;
        setSeries(memberData);
        setOccupancy(occupancyData);
      })
      .catch((error: unknown) => {
        console.error(error);
        if (active) setHasError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [months, selectedPeriod]);

  if (loading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator color={Colors.burgundy} />
      </View>
    );
  }

  if (hasError || !occupancy) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.errorText}>Greška pri učitavanju</Text>
      </View>
    );
  }

  const chartData = series.map((point) => ({
    label: monthAbbrevFrom(point.month),
    value: point.total_members,
  }));
  const latestMembers = series.at(-1)?.total_members;
  const pct = trendPercent(series);
  const gainedMembers = occupancy.new_this_month > occupancy.prev_new;
  const topDay =
    DAY_ABBR[occupancy.top_day] ??
    (occupancy.top_day ? occupancy.top_day.toUpperCase() : "—");

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text style={styles.title}>Statistika</Text>
        <Text style={styles.subtitle}>Trendovi članstva i posećenosti</Text>
      </View>

      <FilterChips
        options={PERIOD_OPTIONS}
        value={selectedPeriod}
        onChange={setSelectedPeriod}
      />

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.microLabel}>ČLANOVA UKUPNO</Text>
            <Text style={styles.memberFigure}>
              {latestMembers?.toString() ?? "—"}
            </Text>
          </View>
          <View style={styles.trendBadge}>
            <Text style={styles.trendText}>
              {pct === null ? "—" : `▲ ${pct}% / ${months}m`}
            </Text>
          </View>
        </View>
        <BarChart data={chartData} currentIndex={chartData.length - 1} />
      </View>

      <View style={styles.secondaryRow}>
        <View style={styles.secondaryTile}>
          <Text style={styles.microLabel}>NOVIH / MES.</Text>
          <Text style={[styles.secondaryFigure, { color: Colors.goldDeep }]}>
            +{occupancy.new_this_month}
          </Text>
          <Text
            style={[
              styles.secondaryDelta,
              { color: gainedMembers ? "#4E7A5C" : Colors.inkMuted },
            ]}
          >
            {gainedMembers ? "▲ " : ""}vs +{occupancy.prev_new} (prošli mesec)
          </Text>
        </View>
        <View style={styles.secondaryTile}>
          <Text style={styles.microLabel}>PROS. POPUNJ.</Text>
          <Text style={[styles.secondaryFigure, { color: Colors.burgundy }]}>
            {occupancy.avg_pct}%
          </Text>
          <Text style={[styles.secondaryDelta, { color: Colors.inkMuted }]}>
            najjači dan: {topDay}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  content: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 18,
  },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.paper,
  },
  errorText: {
    ...Typography.body,
    color: Colors.inkMuted,
  },
  title: {
    ...Typography.screenTitle,
    fontSize: 23,
    color: Colors.ink,
  },
  subtitle: {
    ...Typography.meta,
    color: Colors.inkMuted,
    marginTop: 3,
  },
  chartCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radii.tile[18],
    padding: Spacing.cardPadding,
    ...Shadows.card,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  microLabel: {
    ...Typography.microLabel,
    color: Colors.inkFaint,
  },
  memberFigure: {
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 28,
    fontWeight: "800",
    color: Colors.ink,
    marginTop: 3,
  },
  trendBadge: {
    borderRadius: Radii.chip,
    backgroundColor: "#E9F1EB",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  trendText: {
    ...Typography.chip,
    color: "#4E7A5C",
  },
  secondaryRow: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryTile: {
    flex: 1,
    minWidth: 0,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radii.tile[18],
    padding: Spacing.cardPadding,
    gap: 4,
    ...Shadows.card,
  },
  secondaryFigure: {
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 26,
    fontWeight: "800",
  },
  secondaryDelta: {
    fontFamily: FontFamilies.hanken[700],
    fontSize: 11,
    fontWeight: "700",
  },
});
FILE:app/(admin)/(tabs)/users.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { FilterChips, UserRow } from "@/components/admin";
import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";
import { deleteUser, listUsers, updateUser } from "@/services/admin";
import type { AdminUser, UpdateUserPatch } from "@/services/admin";

type UserFilter = "svi" | "aktivni" | "admini";
type UserRole = AdminUser["role"];

const FILTER_OPTIONS: { key: UserFilter; label: string }[] = [
  { key: "svi", label: "Svi" },
  { key: "aktivni", label: "Aktivni" },
  { key: "admini", label: "Admini" },
];

const ROLE_OPTIONS: { key: UserRole; label: string }[] = [
  { key: "user", label: "Član" },
  { key: "admin", label: "Admin" },
];

export default function KorisniciScreen() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<UserFilter>("svi");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [maxSessions, setMaxSessions] = useState(0);
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setHasError(false);

    try {
      setUsers(await listUsers());
    } catch (error: unknown) {
      console.error(error);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return users.filter((user) => {
      const matchesFilter =
        filter === "svi" ||
        (filter === "aktivni" && user.enabled !== false) ||
        (filter === "admini" && user.role === "admin");
      const searchable =
        `${user.first_name} ${user.last_name ?? ""} ${user.email}`.toLocaleLowerCase();

      return matchesFilter && searchable.includes(query);
    });
  }, [filter, search, users]);

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setFirstName(user.first_name);
    setLastName(user.last_name ?? "");
    setRole(user.role);
    setMaxSessions(user.max_sessions_per_week);
  };

  const closeEditModal = () => {
    if (!saving) setEditingUser(null);
  };

  const saveUser = async () => {
    if (!editingUser) return;

    const patch: UpdateUserPatch = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      role,
      max_sessions_per_week: maxSessions,
    };

    setSaving(true);
    try {
      await updateUser(editingUser.id, patch);
      setEditingUser(null);
      await fetchUsers();
    } catch (error: unknown) {
      console.error(error);
      Alert.alert("Greška", "Izmena korisnika nije sačuvana.");
      await fetchUsers();
    } finally {
      setSaving(false);
    }
  };

  const removeUser = async (user: AdminUser) => {
    try {
      await deleteUser(user.id);
      setExpandedId(null);
      await fetchUsers();
    } catch (error: unknown) {
      console.error(error);
      Alert.alert("Greška", "Korisnik nije uklonjen.");
      await fetchUsers();
    }
  };

  const confirmRemove = (user: AdminUser) => {
    const fullName = `${user.first_name} ${user.last_name ?? ""}`.trim();

    Alert.alert(
      "Ukloni korisnika",
      `${fullName} i sve njegove rezervacije će biti uklonjeni.`,
      [
        { text: "Otkaži", style: "cancel" },
        {
          text: "Ukloni",
          style: "destructive",
          onPress: () => void removeUser(user),
        },
      ],
    );
  };

  if (loading && users.length === 0) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator color={Colors.burgundy} />
      </View>
    );
  }

  if (hasError && users.length === 0) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.errorText}>Greška pri učitavanju</Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.content}
        data={filteredUsers}
        keyExtractor={(user) => user.id}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.listGap} />}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.title}>Korisnici</Text>
              <Text style={styles.subtitle}>{users.length} članova</Text>
            </View>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Pretraži članove…"
              placeholderTextColor={Colors.inkFaint}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <FilterChips
              options={FILTER_OPTIONS}
              value={filter}
              onChange={setFilter}
            />
          </View>
        }
        renderItem={({ item, index }) => (
          <UserRow
            user={item}
            expanded={expandedId === item.id}
            onToggleExpand={() =>
              setExpandedId((current) => (current === item.id ? null : item.id))
            }
            onEdit={() => openEditModal(item)}
            onRemove={() => confirmRemove(item)}
            tintIndex={index % 3}
          />
        )}
      />

      <Modal
        animationType="slide"
        transparent
        visible={editingUser !== null}
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Izmena korisnika</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>IME</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                style={styles.fieldInput}
                editable={!saving}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PREZIME</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                style={styles.fieldInput}
                editable={!saving}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>ULOGA</Text>
              <FilterChips
                options={ROLE_OPTIONS}
                value={role}
                onChange={setRole}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>TRENINGA NEDELJNO</Text>
              <View style={styles.stepper}>
                <Pressable
                  accessibilityRole="button"
                  disabled={saving || maxSessions === 0}
                  onPress={() =>
                    setMaxSessions((value) => Math.max(0, value - 1))
                  }
                  style={styles.stepButton}
                >
                  <Text style={styles.stepButtonText}>−</Text>
                </Pressable>
                <Text style={styles.stepValue}>{maxSessions}</Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={saving || maxSessions === 14}
                  onPress={() =>
                    setMaxSessions((value) => Math.min(14, value + 1))
                  }
                  style={styles.stepButton}
                >
                  <Text style={styles.stepButtonText}>＋</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <Pressable
                onPress={closeEditModal}
                disabled={saving}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Otkaži</Text>
              </Pressable>
              <Pressable
                onPress={() => void saveUser()}
                disabled={saving}
                style={[styles.saveButton, saving && styles.buttonDisabled]}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.surface} />
                ) : (
                  <Text style={styles.saveButtonText}>Sačuvaj</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  content: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: 20,
    paddingBottom: 24,
  },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.paper,
  },
  errorText: {
    ...Typography.body,
    color: Colors.inkMuted,
  },
FILE:app/profile.tsx
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/Colors";
import { Day, TRAINING_DAYS } from "@/constants/days";
import { Radii, Shadows } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { useTrainings } from "@/hooks/useTrainings";
import { clampWeeklyLimit } from "@/utils/limits";
import { getCurrentWeekDates } from "@/utils/week";

const DAY_LABELS: Record<Day, string> = {
  sunday: "NED",
  monday: "PON",
  tuesday: "UTO",
  wednesday: "SRE",
  thursday: "ČET",
  friday: "PET",
  saturday: "SUB",
};

const isTrainingDay = (day: string): day is Day =>
  TRAINING_DAYS.includes(day as Day);

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, profile, session, updateProfile } = useAuth();
  const { bookedCount, trainings } = useTrainings();
  const weekDates = getCurrentWeekDates();
  const max = profile?.max_sessions_per_week ?? 0;
  const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;
  const initials = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .map((name) => name?.trim().charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const fullName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ");
  const bookedSessions = trainings
    .filter(
      (training) =>
        isTrainingDay(training.day_of_week) &&
        training.session_participants.some(
          (participant) => participant.user_id === session?.user.id,
        ),
    )
    .sort((a, b) => {
      const dayDifference =
        weekDates[a.day_of_week as Day].getTime() -
        weekDates[b.day_of_week as Day].getTime();

      return dayDifference || a.time.localeCompare(b.time);
    });

  const changeLimit = (delta: number) => {
    const newValue = clampWeeklyLimit(max, delta, bookedCount);

    if (newValue !== max) {
      void updateProfile({ max_sessions_per_week: newValue });
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <View style={styles.navBar}>
        <Pressable
          accessibilityLabel="Nazad"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.navTitle}>Profil</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.identity}>
          <View style={styles.avatarOutline}>
            <View style={styles.avatar}>
              <Text style={styles.initials}>{initials || "P"}</Text>
            </View>
          </View>
          <Text style={styles.name}>{fullName || "Perun član"}</Text>
          {/* Inferred placeholder: Profile has no created_at field. */}
          <View style={styles.membershipChip}>
            <Text style={styles.membershipText}>ČLAN OD MAR 2024.</Text>
          </View>
        </View>

        {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
        <View style={styles.statsRow}>
          <View style={styles.statTile}>
            <Text style={styles.placeholderMarker}>PRIMER</Text>
            <Text style={[styles.statFigure, styles.burgundyStat]}>48</Text>
            <Text style={styles.statLabel}>treninga ukupno</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.placeholderMarker}>PRIMER</Text>
            <Text style={[styles.statFigure, styles.sageStat]}>5</Text>
            <Text style={styles.statLabel}>nedelja u nizu</Text>
          </View>
        </View>

        <View style={styles.limitCard}>
          <View style={styles.limitHeader}>
            <View style={styles.limitHeaderCopy}>
              <Text style={styles.limitTitle}>Nedeljni limit</Text>
              <Text style={styles.limitSubtitle}>
                Maksimalno treninga po nedelji
              </Text>
            </View>
            <View style={styles.stepper}>
              <Pressable
                accessibilityLabel="Smanji nedeljni limit"
                accessibilityRole="button"
                disabled={max <= bookedCount}
                onPress={() => changeLimit(-1)}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text
                  style={[
                    styles.stepperButton,
                    max <= bookedCount && styles.disabledStepperButton,
                  ]}
                >
                  −
                </Text>
              </Pressable>
              <Text style={styles.stepperValue}>{max}</Text>
              <Pressable
                accessibilityLabel="Povećaj nedeljni limit"
                accessibilityRole="button"
                disabled={max >= 7}
                onPress={() => changeLimit(1)}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text
                  style={[
                    styles.stepperButton,
                    max >= 7 && styles.disabledStepperButton,
                  ]}
                >
                  +
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.usageRow}>
            <Text style={styles.usageLabel}>ISKORIŠĆENO OVE NEDELJE</Text>
            <Text style={styles.usageValue}>
              {bookedCount} / {max}
            </Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress}%` }]}>
              <View style={styles.fillHighlight} />
            </View>
          </View>
        </View>

        <Text style={styles.sessionsSectionTitle}>
          MOJI TERMINI OVE NEDELJE
        </Text>
        <View style={styles.sessionsList}>
          {bookedSessions.map((training) => {
            const day = training.day_of_week as Day;
            const dateNumber = String(weekDates[day].getUTCDate()).padStart(
              2,
              "0",
            );

            return (
              <View key={training.id} style={styles.sessionCard}>
                <View style={styles.dateBlock}>
                  <Text style={styles.dayLabel}>{DAY_LABELS[day]}</Text>
                  <Text style={styles.dateNumber}>{dateNumber}</Text>
                </View>
                <View style={styles.sessionDivider} />
                <View style={styles.sessionCopy}>
                  <Text numberOfLines={1} style={styles.sessionTitle}>
                    {training.title}
                  </Text>
                  <Text style={styles.sessionMeta}>
                    {training.time.slice(0, 5)} · SALA A
                  </Text>
                </View>
                <View style={styles.checkBadge}>
                  <Text style={styles.check}>✓</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.logoutContainer}>
          <Pressable
            accessibilityRole="button"
            onPress={logout}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.logoutText}>Odjavi se</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.paper,
    flex: 1,
  },
  navBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radii.tile[12],
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  backChevron: {
    color: Colors.burgundy,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 26,
  },
  navTitle: {
    color: Colors.ink,
    fontFamily: FontFamilies.bricolage[700],
    fontSize: 16,
    fontWeight: "700",
  },
  navSpacer: {
    width: 38,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  identity: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  avatarOutline: {
    ...Shadows.avatar,
    alignItems: "center",
    borderColor: Colors.border,
    borderRadius: Radii.avatar,
    borderWidth: 1,
    height: 86,
    justifyContent: "center",
    width: 86,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: Colors.burgundy,
    borderColor: Colors.surface,
    borderRadius: Radii.avatar,
    borderWidth: 3,
    height: 84,
    justifyContent: "center",
    width: 84,
  },
  initials: {
    color: Colors.surface,
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 32,
    fontWeight: "800",
  },
  name: {
    color: Colors.ink,
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 21,
    fontWeight: "800",
    marginTop: 14,
  },
  membershipChip: {
    backgroundColor: Colors.goldTint,
    borderRadius: Radii.chip,
    marginTop: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  membershipText: {
    color: Colors.goldDeep,
    fontFamily: FontFamilies.hanken[800],
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
FILE:src/components/admin/StatTile.tsx
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies } from "@/constants/typography";

interface StatTileProps {
  figure: string;
  label: string;
  figureColor?: string;
  delta?: string;
  deltaColor?: string;
}

export default function StatTile({ figure, label, figureColor = Colors.ink, delta, deltaColor }: StatTileProps) {
  return (
    <View style={styles.tile}>
      <Text style={[styles.figure, { color: figureColor }]}>{figure}</Text>
      <Text style={styles.label}>{label}</Text>
      {delta && <Text style={[styles.delta, { color: deltaColor }]}>{delta}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radii.tile[18],
    padding: Spacing.cardPadding,
    gap: 4,
    ...Shadows.card,
  },
  figure: { fontFamily: FontFamilies.bricolage[800], fontSize: 26, fontWeight: "800" },
  label: { fontFamily: FontFamilies.hanken[600], fontSize: 11.5, fontWeight: "600", color: Colors.inkMuted },
  delta: { fontFamily: FontFamilies.hanken[700], fontSize: 11, fontWeight: "700" },
});

exec
/bin/zsh -lc "sed -n '241,520p' 'app/(admin)/training/[id].tsx'; sed -n '1,360p' src/components/TrainingCard.tsx; sed -n '1,420p' 'app/(admin)/(tabs)/index.tsx'; sed -n '1,460p' 'app/(admin)/(tabs)/stats.tsx'" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
            value={isOpen}
            onValueChange={setIsOpen}
            disabled={submitting}
          />
        </View>

        <View style={styles.footer}>
          <Pressable
            onPress={() => router.back()}
            disabled={submitting}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Otkaži</Text>
          </Pressable>
          <Pressable
            onPress={() => void submit()}
            disabled={submitting}
            style={[styles.saveButton, submitting && styles.buttonDisabled]}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.saveButtonText}>Sačuvaj trening</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    backgroundColor: Colors.paper,
  },
  notFoundText: {
    ...Typography.body,
    color: Colors.inkMuted,
  },
  notFoundButton: {
    borderColor: Colors.burgundy,
    borderWidth: 1,
    borderRadius: Radii.tile[12],
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  notFoundButtonText: {
    ...Typography.primaryButtonCompact,
    color: Colors.burgundy,
  },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomColor: Colors.border,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderColor: Colors.fieldBorder,
    borderWidth: 1,
    borderRadius: Radii.tile[12],
    backgroundColor: Colors.surface,
  },
  backChevron: {
    fontFamily: FontFamilies.hanken[500],
    fontSize: 31,
    fontWeight: "500",
    lineHeight: 32,
    color: Colors.burgundy,
  },
  navTitle: {
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 19,
    fontWeight: "800",
    color: Colors.ink,
  },
  navSpacer: {
    width: 38,
    height: 38,
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: 22,
    paddingBottom: 28,
    gap: 20,
  },
  fieldGroup: {
    gap: 7,
  },
  fieldRow: {
    flexDirection: "row",
    gap: 12,
  },
  columnField: {
    flex: 1,
    gap: 7,
  },
  fieldLabel: {
    fontFamily: FontFamilies.hanken[700],
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: Colors.inkMuted,
  },
  input: {
    minHeight: 46,
    backgroundColor: Colors.surface,
    borderColor: Colors.fieldBorder,
    borderWidth: 1,
    borderRadius: Radii.tile[14],
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 14,
    fontWeight: "600",
    color: Colors.ink,
  },
  stepper: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    borderColor: Colors.fieldBorder,
    borderWidth: 1,
    borderRadius: Radii.tile[14],
    backgroundColor: Colors.surface,
  },
  stepButton: {
    width: 38,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  stepButtonText: {
    fontFamily: FontFamilies.hanken[700],
    fontSize: 19,
    fontWeight: "700",
    color: Colors.burgundy,
  },
  stepValue: {
    fontFamily: FontFamilies.hanken[700],
    fontSize: 15,
    fontWeight: "700",
    color: Colors.ink,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    borderColor: Colors.goldBorder,
    borderWidth: 1,
    borderRadius: Radii.tile[16],
    backgroundColor: Colors.surfaceWarm,
    padding: Spacing.cardPadding,
  },
  statusTextBlock: {
    flex: 1,
    gap: 3,
  },
  statusTitle: {
    fontFamily: FontFamilies.bricolage[700],
    fontSize: 15,
    fontWeight: "700",
    color: Colors.ink,
  },
  statusDescription: {
    fontFamily: FontFamilies.hanken[600],
    fontSize: 12,
    fontWeight: "600",
    color: Colors.inkMuted,
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderColor: Colors.burgundy,
    borderWidth: 1,
    borderRadius: Radii.tile[14],
  },
  cancelButtonText: {
    ...Typography.primaryButton,
    color: Colors.burgundy,
  },
  saveButton: {
    flex: 2,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radii.tile[14],
    backgroundColor: Colors.burgundy,
    ...Shadows.primaryButton,
  },
  saveButtonText: {
    ...Typography.primaryButton,
    color: Colors.surface,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { useTrainings } from "@/hooks/useTrainings";
import { Training } from "@/types/Training";

const AVATAR_COLORS = [
  { backgroundColor: Colors.sageTint, color: Colors.sage },
  { backgroundColor: Colors.goldTint, color: Colors.goldDeep },
  { backgroundColor: "#F4E6EE", color: Colors.burgundy },
] as const;

export function TrainingCard({ training }: { training: Training }) {
  const { session } = useAuth();
  const { joinSession, leaveSession, reachedLimit } = useTrainings();

  const userId = session?.user.id;
  const participants = training.session_participants ?? [];
  const isBooked = participants.some((participant) => participant.user_id === userId);
  const bookedCount = participants.length;
  const isFull = bookedCount >= training.max_participants;
  const canJoin = !isFull && !reachedLimit && !isBooked;
  const fullAndNotBooked = isFull && !isBooked;
  const spotsLeft = Math.max(training.max_participants - bookedCount, 0);
  const otherParticipants = isBooked
    ? participants.filter((participant) => participant.user_id !== userId)
    : participants;
  const hasOverflow = bookedCount > 3;
  const visibleParticipantSlots = hasOverflow ? 2 : 3;
  const visibleOthers = otherParticipants.slice(
    0,
    Math.max(visibleParticipantSlots - (isBooked ? 1 : 0), 0),
  );
  const shownCount = visibleOthers.length + (isBooked ? 1 : 0);
  const overflowCount = Math.max(bookedCount - shownCount, 0);
  const cardBackground = fullAndNotBooked
    ? Colors.surfaceMuted
    : isBooked
      ? Colors.surfaceWarm
      : Colors.surface;

  return (
    <View
      style={[
        styles.shadowContainer,
        { backgroundColor: cardBackground },
        fullAndNotBooked && styles.noShadow,
      ]}
    >
      <View
        style={[
          styles.card,
          { backgroundColor: cardBackground },
          isBooked && styles.bookedCard,
          fullAndNotBooked && styles.fullCard,
        ]}
      >
        {isBooked && (
          <View style={styles.goldAccent}>
            <View style={styles.goldAccentHighlight} />
          </View>
        )}

        <View style={styles.headerRow}>
          <View style={styles.timeBlock}>
            <Text style={[styles.time, fullAndNotBooked && styles.fullTime]}>
              {training.time.slice(0, 5)}
            </Text>
            <Text style={[styles.duration, fullAndNotBooked && styles.fullMeta]}>
              60 min
            </Text>
          </View>

          <View
            style={[
              styles.divider,
              isBooked && styles.bookedDivider,
              fullAndNotBooked && styles.fullDivider,
            ]}
          />

          <View style={styles.titleBlock}>
            <Text
              numberOfLines={2}
              style={[styles.title, fullAndNotBooked && styles.fullTitle]}
            >
              {training.title}
            </Text>
            <Text style={[styles.category, fullAndNotBooked && styles.fullTime]}>
              Grupni · Sala A
            </Text>
          </View>

          {isBooked ? (
            <View style={styles.bookedChip}>
              <View style={styles.checkBadge}>
                <Text style={styles.check}>✓</Text>
              </View>
              <Text style={styles.bookedChipText}>Prijavljen</Text>
            </View>
          ) : fullAndNotBooked ? (
            <View style={styles.fullChip}>
              <Text style={styles.fullChipText}>Popunjeno</Text>
            </View>
          ) : (
            <View style={styles.spotsChip}>
              <Text style={styles.spotsChipText}>još {spotsLeft} mesta</Text>
            </View>
          )}
        </View>

        <View style={styles.capacityRow}>
          <View style={styles.capacityDetails}>
            <View style={styles.avatarStack}>
              {isBooked && (
                <View
                  style={[
                    styles.participantAvatar,
                    styles.youAvatar,
                    { borderColor: cardBackground },
                  ]}
                >
                  <Text style={styles.youAvatarText}>TI</Text>
                </View>
              )}

              {visibleOthers.map((participant, index) => {
                const palette = AVATAR_COLORS[index % AVATAR_COLORS.length];
                const initials = [
                  participant.profiles?.first_name,
                  participant.profiles?.last_name,
                ]
                  .filter(Boolean)
                  .map((name) => name?.trim().charAt(0))
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <View
                    key={participant.user_id}
                    style={[
                      styles.participantAvatar,
                      shownCount > visibleOthers.length - index && styles.overlap,
                      {
                        backgroundColor: palette.backgroundColor,
                        borderColor: cardBackground,
                      },
                    ]}
                  >
                    <Text style={[styles.avatarText, { color: palette.color }]}>
                      {initials || "—"}
                    </Text>
                  </View>
                );
              })}

              {overflowCount > 0 && (
                <View
                  style={[
                    styles.participantAvatar,
                    styles.overflowAvatar,
                    styles.overlap,
                    { borderColor: cardBackground },
                  ]}
                >
                  <Text style={styles.overflowText}>+{overflowCount}</Text>
                </View>
              )}
            </View>

            <Text
              style={[styles.capacityText, fullAndNotBooked && styles.fullCapacityText]}
            >
              {bookedCount} / {training.max_participants} mesta
            </Text>
          </View>

          {isBooked && (
            <Pressable
              accessibilityRole="button"
              onPress={() => leaveSession(training.id)}
              style={({ pressed }) => pressed && styles.pressed}
            >
              <Text style={styles.leaveLink}>Odjavi se</Text>
            </Pressable>
          )}
        </View>

        {!isBooked &&
          (fullAndNotBooked ? (
            <View style={[styles.action, styles.fullAction]}>
              <Text style={styles.fullActionText}>Popunjeno</Text>
            </View>
          ) : reachedLimit ? (
            <View style={[styles.action, styles.limitAction]}>
              <Text style={styles.limitActionText}>Nedeljni limit dostignut</Text>
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              disabled={!canJoin}
              onPress={() => joinSession(training.id)}
              style={({ pressed }) => [
                styles.action,
                styles.joinAction,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.joinActionText}>Prijavi se</Text>
            </Pressable>
          ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    ...Shadows.card,
    borderRadius: Radii.card,
    marginBottom: Spacing.cardGap,
  },
  noShadow: {
    elevation: 0,
    shadowOpacity: 0,
  },
  card: {
    borderColor: Colors.border,
    borderRadius: Radii.card,
    borderWidth: 1,
    overflow: "hidden",
    padding: Spacing.cardPadding,
  },
  bookedCard: {
    borderColor: Colors.goldBorder,
  },
  fullCard: {
    borderColor: "#ECE3D6",
  },
  goldAccent: {
    backgroundColor: Colors.gold,
    bottom: 0,
    left: 0,
    position: "absolute",
    top: 0,
    width: 4,
  },
  goldAccentHighlight: {
    backgroundColor: "#DCC388",
    bottom: 0,
    height: "50%",
    left: 0,
    position: "absolute",
    right: 0,
  },
  headerRow: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 13,
  },
  timeBlock: {
    alignItems: "center",
    width: 58,
  },
  time: {
    ...Typography.time,
    color: Colors.ink,
    lineHeight: 21,
  },
  duration: {
    color: Colors.inkFaint,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 10.5,
    fontWeight: "600",
    marginTop: 4,
  },
  divider: {
    alignSelf: "stretch",
    backgroundColor: Colors.border,
    width: 1,
  },
  bookedDivider: {
    backgroundColor: "#EEE3CC",
  },
  fullDivider: {
    backgroundColor: "#ECE3D6",
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...Typography.cardTitle,
    color: Colors.ink,
  },
  category: {
    ...Typography.secondary,
    color: Colors.sage,
    marginTop: 4,
  },
  fullTime: {
    color: "#9A9098",
  },
  fullMeta: {
    color: "#ADA3AC",
  },
  fullTitle: {
    color: "#6E6670",
  },
  spotsChip: {
    backgroundColor: Colors.goldTint,
    borderRadius: Radii.chip,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  spotsChipText: {
    ...Typography.chip,
    color: Colors.goldDeep,
  },
  bookedChip: {
    alignItems: "center",
    backgroundColor: Colors.burgundy,
    borderRadius: Radii.chip,
    flexDirection: "row",
    gap: 5,
    paddingBottom: 5,
    paddingLeft: 7,
    paddingRight: 10,
    paddingTop: 5,
  },
  checkBadge: {
    alignItems: "center",
    backgroundColor: Colors.gold,
    borderRadius: Radii.avatar,
    height: 15,
    justifyContent: "center",
    width: 15,
  },
  check: {
    color: Colors.surface,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 10,
    fontWeight: "700",
  },
  bookedChipText: {
    ...Typography.chip,
    color: Colors.surface,
  },
  fullChip: {
    backgroundColor: "#F1E4EC",
    borderRadius: Radii.chip,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  fullChipText: {
    ...Typography.chip,
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import BarChart from "@/components/admin/BarChart";
import StatTile from "@/components/admin/StatTile";
import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { Typography } from "@/constants/typography";
import { useTrainings } from "@/hooks/useTrainings";
import { memberSeries, occupancySummary } from "@/services/admin/stats";
import type {
  MemberSeriesPoint,
  OccupancySummary,
} from "@/services/admin/types";
import type { Day } from "@/constants/days";

const MONTHS_LC = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAJ",
  "JUN",
  "JUL",
  "AVG",
  "SEP",
  "OKT",
  "NOV",
  "DEC",
] as const;

const DAYS_BY_INDEX: readonly Day[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function monthAbbrevFrom(isoMonth: string) {
  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
  return MONTHS_LC[monthIndex] ?? "—";
}

function getTodayEnum() {
  return DAYS_BY_INDEX[new Date().getDay()];
}

function trendPercent(series: MemberSeriesPoint[]) {
  const first = series[0]?.total_members;
  const last = series.at(-1)?.total_members;

  if (first === undefined || last === undefined || first === 0) return null;
  return Math.round(((last - first) / Math.max(first, 1)) * 100);
}

export default function PregledScreen() {
  const router = useRouter();
  const { trainings, loading: trainingsLoading } = useTrainings();
  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let active = true;

    Promise.all([memberSeries(6), occupancySummary("6")])
      .then(([memberData, occupancyData]) => {
        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
        if (!active) return;
        setSeries(memberData);
        setOccupancy(occupancyData);
      })
      .catch((error: unknown) => {
        console.error(error);
        if (active) setHasError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading || trainingsLoading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator color={Colors.burgundy} />
      </View>
    );
  }

  if (hasError || !occupancy) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.errorText}>Greška pri učitavanju</Text>
      </View>
    );
  }

  const now = new Date();
  const latestMembers = series.at(-1)?.total_members;
  const pct = trendPercent(series);
  const today = getTodayEnum();
  const openToday = trainings.filter(
    (training) => training.is_open && training.day_of_week === today,
  ).length;
  const chartData = series.map((point) => ({
    label: monthAbbrevFrom(point.month),
    value: point.total_members,
  }));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text style={styles.greeting}>Zdravo, Admin</Text>
        <Text style={styles.subtitle}>
          Pregled centra · {MONTHS_LC[now.getMonth()].toLowerCase()}{" "}
          {now.getFullYear()}
        </Text>
      </View>

      <View style={styles.tileGrid}>
        <View style={styles.tileRow}>
          <View style={styles.tileCell}>
            <StatTile
              figure={latestMembers?.toString() ?? "—"}
              label="aktivnih članova"
              figureColor={Colors.burgundy}
              delta={
                occupancy.new_this_month === 0
                  ? undefined
                  : `▲ +${occupancy.new_this_month} ovog meseca`
              }
              deltaColor="#4E7A5C"
            />
          </View>
          <View style={styles.tileCell}>
            <StatTile
              figure={`${occupancy.avg_pct}%`}
              label="popunjenost"
              figureColor={Colors.goldDeep}
            />
          </View>
        </View>
        <View style={styles.tileRow}>
          <View style={styles.tileCell}>
            <StatTile
              figure={trainings.length.toString()}
              label="treninga ove nedelje"
              figureColor={Colors.ink}
            />
          </View>
          <View style={styles.tileCell}>
            <StatTile
              figure={openToday.toString()}
              label="otvorenih slotova danas"
              figureColor={Colors.sage}
            />
          </View>
        </View>
      </View>

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <Text style={styles.microLabel}>ČLANOVI PO MESECU</Text>
          <View style={styles.trendBadge}>
            <Text style={styles.trendText}>
              {pct === null ? "—" : `▲ ${pct}% / 6m`}
            </Text>
          </View>
        </View>
        <BarChart
          data={chartData}
          currentIndex={chartData.length - 1}
          showValueLabelOnCurrent
        />
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push("/(admin)/training/new")}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && styles.primaryButtonPressed,
        ]}
      >
        <Text style={styles.primaryButtonText}>＋ Novi trening</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  content: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 18,
  },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.paper,
  },
  errorText: {
    ...Typography.body,
    color: Colors.inkMuted,
  },
  greeting: {
    ...Typography.greeting,
    color: Colors.ink,
  },
  subtitle: {
    ...Typography.meta,
    color: Colors.inkMuted,
    marginTop: 3,
  },
  tileGrid: {
    gap: 11,
  },
  tileRow: {
    flexDirection: "row",
    gap: 11,
  },
  tileCell: {
    flex: 1,
  },
  chartCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radii.tile[18],
    padding: Spacing.cardPadding,
    ...Shadows.card,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  microLabel: {
    ...Typography.microLabel,
    color: Colors.inkFaint,
  },
  trendBadge: {
    borderRadius: Radii.chip,
    backgroundColor: "#E9F1EB",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  trendText: {
    ...Typography.chip,
    color: "#4E7A5C",
  },
  primaryButton: {
    alignItems: "center",
    backgroundColor: Colors.burgundy,
    borderRadius: Radii.tile[16],
    padding: 16,
    ...Shadows.primaryButton,
  },
  primaryButtonPressed: {
    opacity: 0.9,
  },
  primaryButtonText: {
    ...Typography.primaryButton,
    color: Colors.surface,
  },
});
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import BarChart from "@/components/admin/BarChart";
import FilterChips from "@/components/admin/FilterChips";
import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";
import { memberSeries, occupancySummary } from "@/services/admin/stats";
import type {
  MemberSeriesPoint,
  OccupancySummary,
} from "@/services/admin/types";

type Period = "12" | "6" | "all";

const PERIOD_OPTIONS: { key: Period; label: string }[] = [
  { key: "12", label: "12 meseci" },
  { key: "6", label: "6 meseci" },
  { key: "all", label: "Sve" },
];

const MONTHS_LC = [
  "JAN",
  "FEB",
  "MAR",
  "APR",
  "MAJ",
  "JUN",
  "JUL",
  "AVG",
  "SEP",
  "OKT",
  "NOV",
  "DEC",
] as const;

const DAY_ABBR: Record<string, string> = {
  monday: "PON",
  tuesday: "UTO",
  wednesday: "SRE",
  thursday: "ČET",
  friday: "PET",
  saturday: "SUB",
  sunday: "NED",
};

function monthAbbrevFrom(isoMonth: string) {
  const monthIndex = Number(isoMonth.split("-")[1]) - 1;
  return MONTHS_LC[monthIndex] ?? "—";
}

function trendPercent(series: MemberSeriesPoint[]) {
  const first = series[0]?.total_members;
  const last = series.at(-1)?.total_members;

  if (first === undefined || last === undefined || first === 0) return null;
  return Math.round(((last - first) / Math.max(first, 1)) * 100);
}

export default function StatsScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("12");
  const [series, setSeries] = useState<MemberSeriesPoint[]>([]);
  const [occupancy, setOccupancy] = useState<OccupancySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const months: 12 | 6 | 24 =
    selectedPeriod === "all" ? 24 : selectedPeriod === "12" ? 12 : 6;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setHasError(false);

    Promise.all([memberSeries(months), occupancySummary(selectedPeriod)])
      .then(([memberData, occupancyData]) => {
        if (!occupancyData) throw new Error("Occupancy summary is unavailable");
        if (!active) return;
        setSeries(memberData);
        setOccupancy(occupancyData);
      })
      .catch((error: unknown) => {
        console.error(error);
        if (active) setHasError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [months, selectedPeriod]);

  if (loading) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator color={Colors.burgundy} />
      </View>
    );
  }

  if (hasError || !occupancy) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.errorText}>Greška pri učitavanju</Text>
      </View>
    );
  }

  const chartData = series.map((point) => ({
    label: monthAbbrevFrom(point.month),
    value: point.total_members,
  }));
  const latestMembers = series.at(-1)?.total_members;
  const pct = trendPercent(series);
  const gainedMembers = occupancy.new_this_month > occupancy.prev_new;
  const topDay =
    DAY_ABBR[occupancy.top_day] ??
    (occupancy.top_day ? occupancy.top_day.toUpperCase() : "—");

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View>
        <Text style={styles.title}>Statistika</Text>
        <Text style={styles.subtitle}>Trendovi članstva i posećenosti</Text>
      </View>

      <FilterChips
        options={PERIOD_OPTIONS}
        value={selectedPeriod}
        onChange={setSelectedPeriod}
      />

      <View style={styles.chartCard}>
        <View style={styles.chartHeader}>
          <View>
            <Text style={styles.microLabel}>ČLANOVA UKUPNO</Text>
            <Text style={styles.memberFigure}>
              {latestMembers?.toString() ?? "—"}
            </Text>
          </View>
          <View style={styles.trendBadge}>
            <Text style={styles.trendText}>
              {pct === null ? "—" : `▲ ${pct}% / ${months}m`}
            </Text>
          </View>
        </View>
        <BarChart data={chartData} currentIndex={chartData.length - 1} />
      </View>

      <View style={styles.secondaryRow}>
        <View style={styles.secondaryTile}>
          <Text style={styles.microLabel}>NOVIH / MES.</Text>
          <Text style={[styles.secondaryFigure, { color: Colors.goldDeep }]}>
            +{occupancy.new_this_month}
          </Text>
          <Text
            style={[
              styles.secondaryDelta,
              { color: gainedMembers ? "#4E7A5C" : Colors.inkMuted },
            ]}
          >
            {gainedMembers ? "▲ " : ""}vs +{occupancy.prev_new} (prošli mesec)
          </Text>
        </View>
        <View style={styles.secondaryTile}>
          <Text style={styles.microLabel}>PROS. POPUNJ.</Text>
          <Text style={[styles.secondaryFigure, { color: Colors.burgundy }]}>
            {occupancy.avg_pct}%
          </Text>
          <Text style={[styles.secondaryDelta, { color: Colors.inkMuted }]}>
            najjači dan: {topDay}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  content: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 18,
  },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.paper,
  },
  errorText: {
    ...Typography.body,
    color: Colors.inkMuted,
  },
  title: {
    ...Typography.screenTitle,
    fontSize: 23,
    color: Colors.ink,
  },
  subtitle: {
    ...Typography.meta,
    color: Colors.inkMuted,
    marginTop: 3,
  },
  chartCard: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radii.tile[18],
    padding: Spacing.cardPadding,
    ...Shadows.card,
  },
  chartHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  microLabel: {
    ...Typography.microLabel,
    color: Colors.inkFaint,
  },
  memberFigure: {
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 28,
    fontWeight: "800",
    color: Colors.ink,
    marginTop: 3,
  },
  trendBadge: {
    borderRadius: Radii.chip,
    backgroundColor: "#E9F1EB",
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  trendText: {
    ...Typography.chip,
    color: "#4E7A5C",
  },
  secondaryRow: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryTile: {
    flex: 1,
    minWidth: 0,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radii.tile[18],
    padding: Spacing.cardPadding,
    gap: 4,
    ...Shadows.card,
  },
  secondaryFigure: {
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 26,
    fontWeight: "800",
  },
  secondaryDelta: {
    fontFamily: FontFamilies.hanken[700],
    fontSize: 11,
    fontWeight: "700",
  },
});

exec
/bin/zsh -lc "sed -n '280,620p' src/components/TrainingCard.tsx; sed -n '1,620p' 'app/(admin)/(tabs)/users.tsx'; sed -n '300,700p' app/profile.tsx; cat package.json; sed -n '1,240p' src/hooks/useAuth.ts; sed -n '1,280p' src/contexts/AuthContext.tsx; sed -n '1,260p' src/hooks/useTrainings.ts; sed -n '1,280p' src/contexts/TrainingContext.tsx; sed -n '1,240p' src/services/admin/types.ts; sed -n '1,220p' src/services/admin/users.ts" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
  },
  divider: {
    alignSelf: "stretch",
    backgroundColor: Colors.border,
    width: 1,
  },
  bookedDivider: {
    backgroundColor: "#EEE3CC",
  },
  fullDivider: {
    backgroundColor: "#ECE3D6",
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    ...Typography.cardTitle,
    color: Colors.ink,
  },
  category: {
    ...Typography.secondary,
    color: Colors.sage,
    marginTop: 4,
  },
  fullTime: {
    color: "#9A9098",
  },
  fullMeta: {
    color: "#ADA3AC",
  },
  fullTitle: {
    color: "#6E6670",
  },
  spotsChip: {
    backgroundColor: Colors.goldTint,
    borderRadius: Radii.chip,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  spotsChipText: {
    ...Typography.chip,
    color: Colors.goldDeep,
  },
  bookedChip: {
    alignItems: "center",
    backgroundColor: Colors.burgundy,
    borderRadius: Radii.chip,
    flexDirection: "row",
    gap: 5,
    paddingBottom: 5,
    paddingLeft: 7,
    paddingRight: 10,
    paddingTop: 5,
  },
  checkBadge: {
    alignItems: "center",
    backgroundColor: Colors.gold,
    borderRadius: Radii.avatar,
    height: 15,
    justifyContent: "center",
    width: 15,
  },
  check: {
    color: Colors.surface,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 10,
    fontWeight: "700",
  },
  bookedChipText: {
    ...Typography.chip,
    color: Colors.surface,
  },
  fullChip: {
    backgroundColor: "#F1E4EC",
    borderRadius: Radii.chip,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  fullChipText: {
    ...Typography.chip,
    color: Colors.burgundyText2,
  },
  capacityRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  capacityDetails: {
    alignItems: "center",
    flexDirection: "row",
    minWidth: 0,
  },
  avatarStack: {
    alignItems: "center",
    flexDirection: "row",
  },
  participantAvatar: {
    alignItems: "center",
    borderRadius: Radii.avatar,
    borderWidth: 2,
    height: 29,
    justifyContent: "center",
    width: 29,
  },
  overlap: {
    marginLeft: -9,
  },
  youAvatar: {
    backgroundColor: Colors.burgundy,
  },
  youAvatarText: {
    color: Colors.surface,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 10,
    fontWeight: "700",
  },
  avatarText: {
    fontFamily: FontFamilies.hanken[700],
    fontSize: 10.5,
    fontWeight: "700",
  },
  overflowAvatar: {
    backgroundColor: Colors.track,
  },
  overflowText: {
    color: Colors.goldDeep,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 10.5,
    fontWeight: "700",
  },
  capacityText: {
    color: Colors.inkMuted,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 12.5,
    fontWeight: "600",
    marginLeft: 11,
  },
  fullCapacityText: {
    color: "#9A9098",
  },
  leaveLink: {
    color: Colors.sage,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 12,
    fontWeight: "700",
  },
  action: {
    alignItems: "center",
    borderRadius: Radii.tile[14],
    justifyContent: "center",
    marginTop: 14,
    paddingVertical: 13,
  },
  joinAction: {
    ...Shadows.primaryButton,
    backgroundColor: Colors.burgundy,
  },
  joinActionText: {
    ...Typography.primaryButtonCompact,
    color: Colors.surface,
  },
  fullAction: {
    backgroundColor: "#F0E9DF",
  },
  fullActionText: {
    ...Typography.primaryButtonCompact,
    color: "#A99FB0",
  },
  limitAction: {
    backgroundColor: Colors.paper,
    borderColor: "#E2D7C7",
    borderStyle: "dashed",
    borderWidth: 1,
  },
  limitActionText: {
    color: "#A99FB0",
    fontFamily: FontFamilies.hanken[700],
    fontSize: 13.5,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.92,
  },
});
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { FilterChips, UserRow } from "@/components/admin";
import { Colors } from "@/constants/Colors";
import { Radii, Shadows, Spacing } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";
import { deleteUser, listUsers, updateUser } from "@/services/admin";
import type { AdminUser, UpdateUserPatch } from "@/services/admin";

type UserFilter = "svi" | "aktivni" | "admini";
type UserRole = AdminUser["role"];

const FILTER_OPTIONS: { key: UserFilter; label: string }[] = [
  { key: "svi", label: "Svi" },
  { key: "aktivni", label: "Aktivni" },
  { key: "admini", label: "Admini" },
];

const ROLE_OPTIONS: { key: UserRole; label: string }[] = [
  { key: "user", label: "Član" },
  { key: "admin", label: "Admin" },
];

export default function KorisniciScreen() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<UserFilter>("svi");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<UserRole>("user");
  const [maxSessions, setMaxSessions] = useState(0);
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setHasError(false);

    try {
      setUsers(await listUsers());
    } catch (error: unknown) {
      console.error(error);
      setHasError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();

    return users.filter((user) => {
      const matchesFilter =
        filter === "svi" ||
        (filter === "aktivni" && user.enabled !== false) ||
        (filter === "admini" && user.role === "admin");
      const searchable =
        `${user.first_name} ${user.last_name ?? ""} ${user.email}`.toLocaleLowerCase();

      return matchesFilter && searchable.includes(query);
    });
  }, [filter, search, users]);

  const openEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setFirstName(user.first_name);
    setLastName(user.last_name ?? "");
    setRole(user.role);
    setMaxSessions(user.max_sessions_per_week);
  };

  const closeEditModal = () => {
    if (!saving) setEditingUser(null);
  };

  const saveUser = async () => {
    if (!editingUser) return;

    const patch: UpdateUserPatch = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      role,
      max_sessions_per_week: maxSessions,
    };

    setSaving(true);
    try {
      await updateUser(editingUser.id, patch);
      setEditingUser(null);
      await fetchUsers();
    } catch (error: unknown) {
      console.error(error);
      Alert.alert("Greška", "Izmena korisnika nije sačuvana.");
      await fetchUsers();
    } finally {
      setSaving(false);
    }
  };

  const removeUser = async (user: AdminUser) => {
    try {
      await deleteUser(user.id);
      setExpandedId(null);
      await fetchUsers();
    } catch (error: unknown) {
      console.error(error);
      Alert.alert("Greška", "Korisnik nije uklonjen.");
      await fetchUsers();
    }
  };

  const confirmRemove = (user: AdminUser) => {
    const fullName = `${user.first_name} ${user.last_name ?? ""}`.trim();

    Alert.alert(
      "Ukloni korisnika",
      `${fullName} i sve njegove rezervacije će biti uklonjeni.`,
      [
        { text: "Otkaži", style: "cancel" },
        {
          text: "Ukloni",
          style: "destructive",
          onPress: () => void removeUser(user),
        },
      ],
    );
  };

  if (loading && users.length === 0) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator color={Colors.burgundy} />
      </View>
    );
  }

  if (hasError && users.length === 0) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.errorText}>Greška pri učitavanju</Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        style={styles.screen}
        contentContainerStyle={styles.content}
        data={filteredUsers}
        keyExtractor={(user) => user.id}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.listGap} />}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.title}>Korisnici</Text>
              <Text style={styles.subtitle}>{users.length} članova</Text>
            </View>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Pretraži članove…"
              placeholderTextColor={Colors.inkFaint}
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <FilterChips
              options={FILTER_OPTIONS}
              value={filter}
              onChange={setFilter}
            />
          </View>
        }
        renderItem={({ item, index }) => (
          <UserRow
            user={item}
            expanded={expandedId === item.id}
            onToggleExpand={() =>
              setExpandedId((current) => (current === item.id ? null : item.id))
            }
            onEdit={() => openEditModal(item)}
            onRemove={() => confirmRemove(item)}
            tintIndex={index % 3}
          />
        )}
      />

      <Modal
        animationType="slide"
        transparent
        visible={editingUser !== null}
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Izmena korisnika</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>IME</Text>
              <TextInput
                value={firstName}
                onChangeText={setFirstName}
                style={styles.fieldInput}
                editable={!saving}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PREZIME</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                style={styles.fieldInput}
                editable={!saving}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>ULOGA</Text>
              <FilterChips
                options={ROLE_OPTIONS}
                value={role}
                onChange={setRole}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>TRENINGA NEDELJNO</Text>
              <View style={styles.stepper}>
                <Pressable
                  accessibilityRole="button"
                  disabled={saving || maxSessions === 0}
                  onPress={() =>
                    setMaxSessions((value) => Math.max(0, value - 1))
                  }
                  style={styles.stepButton}
                >
                  <Text style={styles.stepButtonText}>−</Text>
                </Pressable>
                <Text style={styles.stepValue}>{maxSessions}</Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={saving || maxSessions === 14}
                  onPress={() =>
                    setMaxSessions((value) => Math.min(14, value + 1))
                  }
                  style={styles.stepButton}
                >
                  <Text style={styles.stepButtonText}>＋</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.modalFooter}>
              <Pressable
                onPress={closeEditModal}
                disabled={saving}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Otkaži</Text>
              </Pressable>
              <Pressable
                onPress={() => void saveUser()}
                disabled={saving}
                style={[styles.saveButton, saving && styles.buttonDisabled]}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.surface} />
                ) : (
                  <Text style={styles.saveButtonText}>Sačuvaj</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  content: {
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: 20,
    paddingBottom: 24,
  },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.paper,
  },
  errorText: {
    ...Typography.body,
    color: Colors.inkMuted,
  },
  headerContent: {
    gap: 16,
    marginBottom: 16,
  },
  title: {
    ...Typography.screenTitle,
    fontSize: 23,
    color: Colors.ink,
  },
  subtitle: {
    fontFamily: FontFamilies.hanken[600],
    fontSize: 13,
    fontWeight: "600",
    color: Colors.inkMuted,
    marginTop: 3,
  },
  searchInput: {
    backgroundColor: Colors.surface,
    borderColor: Colors.fieldBorder,
    borderWidth: 1,
    borderRadius: Radii.tile[14],
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 14,
    fontWeight: "600",
    color: Colors.ink,
  },
  listGap: {
    height: 10,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(34, 31, 43, 0.35)",
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.card,
    borderTopRightRadius: Radii.card,
    paddingHorizontal: Spacing.screenHorizontal,
    paddingTop: 24,
    paddingBottom: 28,
    gap: 16,
    ...Shadows.card,
  },
  modalTitle: {
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 21,
    fontWeight: "800",
    color: Colors.ink,
  },
  fieldGroup: {
    gap: 7,
  },
  fieldLabel: {
    fontFamily: FontFamilies.hanken[700],
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
    color: Colors.inkMuted,
  },
  fieldInput: {
    backgroundColor: Colors.surface,
    borderColor: Colors.fieldBorder,
    borderWidth: 1,
    borderRadius: Radii.tile[14],
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 14,
    fontWeight: "600",
    color: Colors.ink,
  },
  stepper: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    borderColor: Colors.fieldBorder,
    borderWidth: 1,
    borderRadius: Radii.tile[14],
    backgroundColor: Colors.surface,
  },
  stepButton: {
    width: 44,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  stepButtonText: {
    fontFamily: FontFamilies.hanken[700],
    fontSize: 20,
    fontWeight: "700",
    color: Colors.burgundy,
  },
  stepValue: {
    minWidth: 44,
    textAlign: "center",
    fontFamily: FontFamilies.hanken[700],
    fontSize: 15,
    fontWeight: "700",
    color: Colors.ink,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderColor: Colors.burgundy,
    borderWidth: 1,
    borderRadius: Radii.tile[14],
  },
  cancelButtonText: {
    ...Typography.primaryButtonCompact,
    color: Colors.burgundy,
  },
  saveButton: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
    borderRadius: Radii.tile[14],
    backgroundColor: Colors.burgundy,
  },
  saveButtonText: {
    ...Typography.primaryButtonCompact,
    color: Colors.surface,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
    fontSize: 21,
    fontWeight: "800",
    marginTop: 14,
  },
  membershipChip: {
    backgroundColor: Colors.goldTint,
    borderRadius: Radii.chip,
    marginTop: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  membershipText: {
    color: Colors.goldDeep,
    fontFamily: FontFamilies.hanken[800],
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statTile: {
    ...Shadows.card,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radii.tile[18],
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  placeholderMarker: {
    color: Colors.inkFaint,
    fontFamily: FontFamilies.hanken[800],
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
    opacity: 0.65,
    position: "absolute",
    right: 12,
    top: 10,
  },
  statFigure: {
    ...Typography.statFigure,
    lineHeight: 29,
    opacity: 0.68,
  },
  burgundyStat: {
    color: Colors.burgundy,
  },
  sageStat: {
    color: Colors.sage,
  },
  statLabel: {
    color: Colors.inkMuted,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 11.5,
    fontWeight: "600",
    marginTop: 5,
  },
  limitCard: {
    ...Shadows.card,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
  },
  limitHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  limitHeaderCopy: {
    flex: 1,
    paddingRight: 10,
  },
  limitTitle: {
    color: Colors.ink,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 14.5,
    fontWeight: "700",
  },
  limitSubtitle: {
    color: Colors.inkMuted,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  stepper: {
    alignItems: "center",
    backgroundColor: Colors.surfaceMuted,
    borderColor: "#EFE3D2",
    borderRadius: Radii.tile[14],
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  stepperButton: {
    color: Colors.burgundy,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 18,
    fontWeight: "700",
  },
  disabledStepperButton: {
    opacity: 0.3,
  },
  stepperValue: {
    color: Colors.ink,
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 18,
    fontWeight: "800",
    minWidth: 14,
    textAlign: "center",
  },
  usageRow: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  usageLabel: {
    ...Typography.microLabelWide,
    color: Colors.inkFaint,
  },
  usageValue: {
    color: Colors.inkMuted,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 12,
    fontWeight: "600",
  },
  track: {
    backgroundColor: Colors.track,
    borderRadius: 6,
    height: 8,
    marginTop: 9,
    overflow: "hidden",
  },
  fill: {
    backgroundColor: Colors.gold,
    borderRadius: 6,
    height: "100%",
    overflow: "hidden",
  },
  fillHighlight: {
    alignSelf: "flex-end",
    backgroundColor: "#DCC388",
    height: "100%",
    width: "50%",
  },
  sessionsSectionTitle: {
    ...Typography.sectionLabel,
    color: Colors.sage,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sessionsList: {
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sessionCard: {
    ...Shadows.card,
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radii.tile[16],
    borderWidth: 1,
    flexDirection: "row",
    gap: 13,
    padding: 16,
  },
  dateBlock: {
    alignItems: "center",
    width: 42,
  },
  dayLabel: {
    color: Colors.sage,
    fontFamily: FontFamilies.hanken[800],
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  dateNumber: {
    color: Colors.ink,
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 18,
    fontWeight: "800",
  },
  sessionDivider: {
    alignSelf: "stretch",
    backgroundColor: Colors.border,
    width: 1,
  },
  sessionCopy: {
    flex: 1,
    minWidth: 0,
  },
  sessionTitle: {
    color: Colors.ink,
    fontFamily: FontFamilies.bricolage[700],
    fontSize: 15,
    fontWeight: "700",
  },
  sessionMeta: {
    color: Colors.sage,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  checkBadge: {
    alignItems: "center",
    backgroundColor: Colors.gold,
    borderRadius: Radii.avatar,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  check: {
    color: Colors.surface,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 10,
    fontWeight: "700",
  },
  logoutContainer: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  logoutButton: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderColor: Colors.burgundyBorder,
    borderRadius: Radii.tile[14],
    borderWidth: 1,
    paddingVertical: 14,
  },
  logoutText: {
    color: Colors.burgundy,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 14,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.85,
  },
});
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
    "@expo-google-fonts/bricolage-grotesque": "^0.4.1",
    "@expo-google-fonts/hanken-grotesk": "^0.4.3",
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
import { useContext } from "react";

import { AuthContext } from "@/contexts/AuthContext";

export function useAuth() {
  return useContext(AuthContext);
}
import { Session } from "@supabase/supabase-js";
import { createContext, useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/services/supabase/client";
import { Profile } from "@/types/Profile";

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  profile: Profile | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (patch: Partial<Profile>) => Promise<void>;
};

export const AuthContext = createContext<AuthContextType>({
  session: null,
  loading: true,
  profile: null,
  login: async () => {},
  register: async () => {},
  resetPassword: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    setProfile(data || null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        fetchProfile(data.session.user.id);
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
      },
    );

    return () => listener.subscription.unsubscribe();
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  }, []);

  const register = useCallback(
    async (
      email: string,
      password: string,
      firstName: string,
      lastName: string,
    ) => {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        throw error;
      }
    },
    [],
  );

  const resetPassword = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    setSession(null);
  }, []);

  const updateProfile = useCallback(
    async (patch: Partial<Profile>) => {
      if (!session) {
        throw new Error("No active session");
      }

      const { error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", session.user.id);

      if (error) {
        throw error;
      }

      await fetchProfile(session.user.id);
    },
    [fetchProfile, session],
  );

  const value = useMemo(
    () => ({
      session,
      loading,
      profile,
      login,
      register,
      resetPassword,
      logout,
      updateProfile,
    }),
    [
      session,
      loading,
      profile,
      login,
      register,
      resetPassword,
      logout,
      updateProfile,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
import { useContext } from "react";

import { TrainingContext } from "@/contexts/TrainingContext";

export function useTrainings() {
  return useContext(TrainingContext);
}
import { createContext, useEffect, useState } from "react";
import { Alert } from "react-native";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/services/supabase/client";
import { Training } from "@/types/Training";

const bookingErrorMessages: Record<string, string> = {
  weekly_limit_reached: "Dostigli ste nedeljni limit.",
  session_full: "Termin je popunjen.",
  session_closed: "Termin je trenutno zatvoren za prijave.",
  already_joined: "Već ste prijavljeni na ovaj termin.",
  not_authenticated: "Niste prijavljeni.",
  account_inactive: "Vaš nalog je deaktiviran. Obratite se administratoru.",
  session_not_found: "Termin nije pronađen.",
};

const getBookingErrorMessage = (rawMessage: string, mapRpcCodes = true) => {
  if (mapRpcCodes) {
    const code = Object.keys(bookingErrorMessages).find((key) =>
      rawMessage.includes(key),
    );

    if (code) return bookingErrorMessages[code];
  }

  const fallback = "Došlo je do greške. Pokušajte ponovo.";
  return __DEV__ && rawMessage ? `${fallback}\n\n${rawMessage}` : fallback;
};

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

  const maxSessions = profile?.max_sessions_per_week ?? 0;
  // No `> 0` guard here: a user with a 0 allowance HAS reached their limit, so
  // TrainingCard correctly disables the join button. AlertBar applies its own
  // `max > 0` guard for the red "limit" warning display.
  const reachedLimit = bookedCount >= maxSessions;

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
      if (__DEV__) console.error(error);
      Alert.alert(getBookingErrorMessage(error.message));
      return;
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
      if (__DEV__) console.error(error);
      Alert.alert(getBookingErrorMessage(error.message, false));
      return;
    }

    await fetchTrainings();
  };

  const value = {
    trainings,
    loading,
    fetchTrainings,
    getTrainingsByDay,
    joinSession,
    leaveSession,
    canJoinSession,
    reachedLimit,
    bookedCount,
  };

  return (
    <TrainingContext.Provider value={value}>
      {children}
    </TrainingContext.Provider>
  );
}
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
  enabled?: boolean | null;
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
    p_enabled: patch.enabled ?? null,
  });

  if (error) throw error;
}

export async function deleteUser(target: string): Promise<void> {
  const { error } = await supabase.rpc("admin_delete_user", {
    p_target: target,
  });

  if (error) throw error;
}

codex
The supporting admin service already carries `enabled`, so the UI can pass it without touching backend files. I’ll keep the profile change role-gated in one screen: admins get identity, ADMIN badge, and logout; members retain bookings with a read-only weekly count.
exec
/bin/zsh -lc "sed -n '1,700p' app/profile.tsx; sed -n '1,160p' src/types/Profile.ts; sed -n '1,200p' src/components/admin/Toggle.tsx; sed -n '1,180p' src/components/admin/index.ts; rg -n \"<StatTile|secondaryRow|tileRow|updateProfile|clampWeeklyLimit|SALA A|60 min|duration|room\" 'app/(admin)/(tabs)/index.tsx' 'app/(admin)/(tabs)/stats.tsx' 'app/(admin)/training/[id].tsx' src/components/TrainingCard.tsx app/profile.tsx" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
import { useRouter } from "expo-router";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors } from "@/constants/Colors";
import { Day, TRAINING_DAYS } from "@/constants/days";
import { Radii, Shadows } from "@/constants/spacing";
import { FontFamilies, Typography } from "@/constants/typography";
import { useAuth } from "@/hooks/useAuth";
import { useTrainings } from "@/hooks/useTrainings";
import { clampWeeklyLimit } from "@/utils/limits";
import { getCurrentWeekDates } from "@/utils/week";

const DAY_LABELS: Record<Day, string> = {
  sunday: "NED",
  monday: "PON",
  tuesday: "UTO",
  wednesday: "SRE",
  thursday: "ČET",
  friday: "PET",
  saturday: "SUB",
};

const isTrainingDay = (day: string): day is Day =>
  TRAINING_DAYS.includes(day as Day);

export default function ProfileScreen() {
  const router = useRouter();
  const { logout, profile, session, updateProfile } = useAuth();
  const { bookedCount, trainings } = useTrainings();
  const weekDates = getCurrentWeekDates();
  const max = profile?.max_sessions_per_week ?? 0;
  const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;
  const initials = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .map((name) => name?.trim().charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const fullName = [profile?.first_name, profile?.last_name]
    .filter(Boolean)
    .join(" ");
  const bookedSessions = trainings
    .filter(
      (training) =>
        isTrainingDay(training.day_of_week) &&
        training.session_participants.some(
          (participant) => participant.user_id === session?.user.id,
        ),
    )
    .sort((a, b) => {
      const dayDifference =
        weekDates[a.day_of_week as Day].getTime() -
        weekDates[b.day_of_week as Day].getTime();

      return dayDifference || a.time.localeCompare(b.time);
    });

  const changeLimit = (delta: number) => {
    const newValue = clampWeeklyLimit(max, delta, bookedCount);

    if (newValue !== max) {
      void updateProfile({ max_sessions_per_week: newValue });
    }
  };

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
      <View style={styles.navBar}>
        <Pressable
          accessibilityLabel="Nazad"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.navTitle}>Profil</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.identity}>
          <View style={styles.avatarOutline}>
            <View style={styles.avatar}>
              <Text style={styles.initials}>{initials || "P"}</Text>
            </View>
          </View>
          <Text style={styles.name}>{fullName || "Perun član"}</Text>
          {/* Inferred placeholder: Profile has no created_at field. */}
          <View style={styles.membershipChip}>
            <Text style={styles.membershipText}>ČLAN OD MAR 2024.</Text>
          </View>
        </View>

        {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
        <View style={styles.statsRow}>
          <View style={styles.statTile}>
            <Text style={styles.placeholderMarker}>PRIMER</Text>
            <Text style={[styles.statFigure, styles.burgundyStat]}>48</Text>
            <Text style={styles.statLabel}>treninga ukupno</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.placeholderMarker}>PRIMER</Text>
            <Text style={[styles.statFigure, styles.sageStat]}>5</Text>
            <Text style={styles.statLabel}>nedelja u nizu</Text>
          </View>
        </View>

        <View style={styles.limitCard}>
          <View style={styles.limitHeader}>
            <View style={styles.limitHeaderCopy}>
              <Text style={styles.limitTitle}>Nedeljni limit</Text>
              <Text style={styles.limitSubtitle}>
                Maksimalno treninga po nedelji
              </Text>
            </View>
            <View style={styles.stepper}>
              <Pressable
                accessibilityLabel="Smanji nedeljni limit"
                accessibilityRole="button"
                disabled={max <= bookedCount}
                onPress={() => changeLimit(-1)}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text
                  style={[
                    styles.stepperButton,
                    max <= bookedCount && styles.disabledStepperButton,
                  ]}
                >
                  −
                </Text>
              </Pressable>
              <Text style={styles.stepperValue}>{max}</Text>
              <Pressable
                accessibilityLabel="Povećaj nedeljni limit"
                accessibilityRole="button"
                disabled={max >= 7}
                onPress={() => changeLimit(1)}
                style={({ pressed }) => pressed && styles.pressed}
              >
                <Text
                  style={[
                    styles.stepperButton,
                    max >= 7 && styles.disabledStepperButton,
                  ]}
                >
                  +
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.usageRow}>
            <Text style={styles.usageLabel}>ISKORIŠĆENO OVE NEDELJE</Text>
            <Text style={styles.usageValue}>
              {bookedCount} / {max}
            </Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${progress}%` }]}>
              <View style={styles.fillHighlight} />
            </View>
          </View>
        </View>

        <Text style={styles.sessionsSectionTitle}>
          MOJI TERMINI OVE NEDELJE
        </Text>
        <View style={styles.sessionsList}>
          {bookedSessions.map((training) => {
            const day = training.day_of_week as Day;
            const dateNumber = String(weekDates[day].getUTCDate()).padStart(
              2,
              "0",
            );

            return (
              <View key={training.id} style={styles.sessionCard}>
                <View style={styles.dateBlock}>
                  <Text style={styles.dayLabel}>{DAY_LABELS[day]}</Text>
                  <Text style={styles.dateNumber}>{dateNumber}</Text>
                </View>
                <View style={styles.sessionDivider} />
                <View style={styles.sessionCopy}>
                  <Text numberOfLines={1} style={styles.sessionTitle}>
                    {training.title}
                  </Text>
                  <Text style={styles.sessionMeta}>
                    {training.time.slice(0, 5)} · SALA A
                  </Text>
                </View>
                <View style={styles.checkBadge}>
                  <Text style={styles.check}>✓</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.logoutContainer}>
          <Pressable
            accessibilityRole="button"
            onPress={logout}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.logoutText}>Odjavi se</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.paper,
    flex: 1,
  },
  navBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  backButton: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radii.tile[12],
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38,
  },
  backChevron: {
    color: Colors.burgundy,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 26,
  },
  navTitle: {
    color: Colors.ink,
    fontFamily: FontFamilies.bricolage[700],
    fontSize: 16,
    fontWeight: "700",
  },
  navSpacer: {
    width: 38,
  },
  scrollContent: {
    paddingBottom: 28,
  },
  identity: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  avatarOutline: {
    ...Shadows.avatar,
    alignItems: "center",
    borderColor: Colors.border,
    borderRadius: Radii.avatar,
    borderWidth: 1,
    height: 86,
    justifyContent: "center",
    width: 86,
  },
  avatar: {
    alignItems: "center",
    backgroundColor: Colors.burgundy,
    borderColor: Colors.surface,
    borderRadius: Radii.avatar,
    borderWidth: 3,
    height: 84,
    justifyContent: "center",
    width: 84,
  },
  initials: {
    color: Colors.surface,
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 32,
    fontWeight: "800",
  },
  name: {
    color: Colors.ink,
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 21,
    fontWeight: "800",
    marginTop: 14,
  },
  membershipChip: {
    backgroundColor: Colors.goldTint,
    borderRadius: Radii.chip,
    marginTop: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  membershipText: {
    color: Colors.goldDeep,
    fontFamily: FontFamilies.hanken[800],
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statTile: {
    ...Shadows.card,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radii.tile[18],
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  placeholderMarker: {
    color: Colors.inkFaint,
    fontFamily: FontFamilies.hanken[800],
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.8,
    opacity: 0.65,
    position: "absolute",
    right: 12,
    top: 10,
  },
  statFigure: {
    ...Typography.statFigure,
    lineHeight: 29,
    opacity: 0.68,
  },
  burgundyStat: {
    color: Colors.burgundy,
  },
  sageStat: {
    color: Colors.sage,
  },
  statLabel: {
    color: Colors.inkMuted,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 11.5,
    fontWeight: "600",
    marginTop: 5,
  },
  limitCard: {
    ...Shadows.card,
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
  },
  limitHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  limitHeaderCopy: {
    flex: 1,
    paddingRight: 10,
  },
  limitTitle: {
    color: Colors.ink,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 14.5,
    fontWeight: "700",
  },
  limitSubtitle: {
    color: Colors.inkMuted,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  stepper: {
    alignItems: "center",
    backgroundColor: Colors.surfaceMuted,
    borderColor: "#EFE3D2",
    borderRadius: Radii.tile[14],
    borderWidth: 1,
    flexDirection: "row",
    gap: 14,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  stepperButton: {
    color: Colors.burgundy,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 18,
    fontWeight: "700",
  },
  disabledStepperButton: {
    opacity: 0.3,
  },
  stepperValue: {
    color: Colors.ink,
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 18,
    fontWeight: "800",
    minWidth: 14,
    textAlign: "center",
  },
  usageRow: {
    alignItems: "baseline",
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  usageLabel: {
    ...Typography.microLabelWide,
    color: Colors.inkFaint,
  },
  usageValue: {
    color: Colors.inkMuted,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 12,
    fontWeight: "600",
  },
  track: {
    backgroundColor: Colors.track,
    borderRadius: 6,
    height: 8,
    marginTop: 9,
    overflow: "hidden",
  },
  fill: {
    backgroundColor: Colors.gold,
    borderRadius: 6,
    height: "100%",
    overflow: "hidden",
  },
  fillHighlight: {
    alignSelf: "flex-end",
    backgroundColor: "#DCC388",
    height: "100%",
    width: "50%",
  },
  sessionsSectionTitle: {
    ...Typography.sectionLabel,
    color: Colors.sage,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sessionsList: {
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sessionCard: {
    ...Shadows.card,
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: Radii.tile[16],
    borderWidth: 1,
    flexDirection: "row",
    gap: 13,
    padding: 16,
  },
  dateBlock: {
    alignItems: "center",
    width: 42,
  },
  dayLabel: {
    color: Colors.sage,
    fontFamily: FontFamilies.hanken[800],
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  dateNumber: {
    color: Colors.ink,
    fontFamily: FontFamilies.bricolage[800],
    fontSize: 18,
    fontWeight: "800",
  },
  sessionDivider: {
    alignSelf: "stretch",
    backgroundColor: Colors.border,
    width: 1,
  },
  sessionCopy: {
    flex: 1,
    minWidth: 0,
  },
  sessionTitle: {
    color: Colors.ink,
    fontFamily: FontFamilies.bricolage[700],
    fontSize: 15,
    fontWeight: "700",
  },
  sessionMeta: {
    color: Colors.sage,
    fontFamily: FontFamilies.hanken[600],
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },
  checkBadge: {
    alignItems: "center",
    backgroundColor: Colors.gold,
    borderRadius: Radii.avatar,
    height: 22,
    justifyContent: "center",
    width: 22,
  },
  check: {
    color: Colors.surface,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 10,
    fontWeight: "700",
  },
  logoutContainer: {
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  logoutButton: {
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderColor: Colors.burgundyBorder,
    borderRadius: Radii.tile[14],
    borderWidth: 1,
    paddingVertical: 14,
  },
  logoutText: {
    color: Colors.burgundy,
    fontFamily: FontFamilies.hanken[700],
    fontSize: 14,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.85,
  },
});
export type Profile = {
  id: string;
  first_name: string;
  last_name: string;
  max_sessions_per_week: number;
  role: "user" | "admin";
};
import { Pressable, StyleSheet, View } from "react-native";
import { Colors } from "@/constants/Colors";

interface ToggleProps {
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}

export default function Toggle({ value, onValueChange, disabled = false }: ToggleProps) {
  return (
    <Pressable
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      style={[styles.container, { opacity: disabled ? 0.5 : 1 }]}
    >
      <View style={[styles.track, { backgroundColor: value ? Colors.burgundy : "#DDD3C7" }]}>
        <View style={[styles.knob, { left: value ? 22 : 3 }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { width: 46, height: 27, justifyContent: "center" },
  track: { width: "100%", height: "100%", borderRadius: 20, position: "relative" },
  knob: { width: 21, height: 21, borderRadius: 9999, backgroundColor: Colors.surface, position: "absolute", top: 3 },
});
export { default as AdminHeader } from "./AdminHeader";
export { default as StatTile } from "./StatTile";
export { default as BarChart } from "./BarChart";
export { default as Toggle } from "./Toggle";
export { default as FilterChips } from "./FilterChips";
export { default as UserRow } from "./UserRow";
export { default as SessionRow } from "./SessionRow";
app/(admin)/training/[id].tsx:48:  const [room, setRoom] = useState("");
app/(admin)/training/[id].tsx:49:  const [durationMin, setDurationMin] = useState<number | null>(null);
app/(admin)/training/[id].tsx:65:    setRoom(training.room ?? "");
app/(admin)/training/[id].tsx:66:    setDurationMin(training.duration_min);
app/(admin)/training/[id].tsx:89:      room: room.trim() || null,
app/(admin)/training/[id].tsx:90:      duration_min: durationMin,
app/(admin)/training/[id].tsx:184:              value={durationMin?.toString() ?? ""}
app/(admin)/training/[id].tsx:201:              value={room}
app/(admin)/(tabs)/stats.tsx:162:      <View style={styles.secondaryRow}>
app/(admin)/(tabs)/stats.tsx:257:  secondaryRow: {
app/profile.tsx:11:import { clampWeeklyLimit } from "@/utils/limits";
app/profile.tsx:29:  const { logout, profile, session, updateProfile } = useAuth();
app/profile.tsx:60:    const newValue = clampWeeklyLimit(max, delta, bookedCount);
app/profile.tsx:63:      void updateProfile({ max_sessions_per_week: newValue });
app/profile.tsx:197:                    {training.time.slice(0, 5)} · SALA A
src/components/TrainingCard.tsx:72:            <Text style={[styles.duration, fullAndNotBooked && styles.fullMeta]}>
src/components/TrainingCard.tsx:73:              60 min
src/components/TrainingCard.tsx:274:  duration: {
app/(admin)/(tabs)/index.tsx:141:        <View style={styles.tileRow}>
app/(admin)/(tabs)/index.tsx:143:            <StatTile
app/(admin)/(tabs)/index.tsx:156:            <StatTile
app/(admin)/(tabs)/index.tsx:163:        <View style={styles.tileRow}>
app/(admin)/(tabs)/index.tsx:165:            <StatTile
app/(admin)/(tabs)/index.tsx:172:            <StatTile
app/(admin)/(tabs)/index.tsx:244:  tileRow: {

apply patch
patch: completed
/Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/(tabs)/index.tsx
/Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/(tabs)/stats.tsx
/Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/(tabs)/users.tsx
/Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/training/[id].tsx
/Users/uros/Documents/Private/Projects/PerunApp/app/profile.tsx
/Users/uros/Documents/Private/Projects/PerunApp/src/components/TrainingCard.tsx
/Users/uros/Documents/Private/Projects/PerunApp/src/components/admin/StatTile.tsx
diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 9bbdc139ee145ef44f2e9213834d3fa01e054538..d1e54156c394b7d46c02642411b2fd9a93e44cdd
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -242,6 +242,7 @@
     gap: 11,
   },
   tileRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 11,
   },
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index 23542459a42a8a534685faae85a0dfe5a6e77157..f268a63f9095c10157b70956ea2820eb803bc7a8
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -255,6 +255,7 @@
     color: "#4E7A5C",
   },
   secondaryRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 12,
   },
diff --git a/app/(admin)/(tabs)/users.tsx b/app/(admin)/(tabs)/users.tsx
index 474ea6041ae5182a684fddd9dc2ed3516a9972e3..2720d5d075f5a7d65d2316aeb2477fe8f0766157
--- a/app/(admin)/(tabs)/users.tsx
+++ b/app/(admin)/(tabs)/users.tsx
@@ -11,7 +11,7 @@
   View,
 } from "react-native";
 
-import { FilterChips, UserRow } from "@/components/admin";
+import { FilterChips, Toggle, UserRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
@@ -44,6 +44,7 @@
   const [lastName, setLastName] = useState("");
   const [role, setRole] = useState<UserRole>("user");
   const [maxSessions, setMaxSessions] = useState(0);
+  const [enabled, setEnabled] = useState(true);
   const [saving, setSaving] = useState(false);
 
   const fetchUsers = useCallback(async () => {
@@ -85,6 +86,7 @@
     setLastName(user.last_name ?? "");
     setRole(user.role);
     setMaxSessions(user.max_sessions_per_week);
+    setEnabled(user.enabled ?? true);
   };
 
   const closeEditModal = () => {
@@ -99,6 +101,7 @@
       last_name: lastName.trim(),
       role,
       max_sessions_per_week: maxSessions,
+      enabled,
     };
 
     setSaving(true);
@@ -271,6 +274,15 @@
               </View>
             </View>
 
+            <View style={styles.toggleRow}>
+              <Text style={styles.fieldLabel}>AKTIVAN</Text>
+              <Toggle
+                value={enabled}
+                onValueChange={setEnabled}
+                disabled={saving}
+              />
+            </View>
+
             <View style={styles.modalFooter}>
               <Pressable
                 onPress={closeEditModal}
@@ -422,6 +434,15 @@
     fontWeight: "700",
     color: Colors.ink,
   },
+  toggleRow: {
+    alignItems: "center",
+    borderColor: Colors.fieldBorder,
+    borderRadius: Radii.tile[14],
+    borderWidth: 1,
+    flexDirection: "row",
+    justifyContent: "space-between",
+    padding: Spacing.cardPadding,
+  },
   modalFooter: {
     flexDirection: "row",
     gap: 10,
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 63f74934074ec361d3383d1bebe96ac5e5d71acb..f8d42db151ec4cb50ed5446eb2cf4917bb5ee502
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -35,6 +35,16 @@
   }[day],
 }));
 
+const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
+
+const formatTime = (value: string) => {
+  const digits = value.replace(/\D/g, "").slice(0, 4);
+
+  return digits.length > 2
+    ? `${digits.slice(0, 2)}:${digits.slice(2)}`
+    : digits;
+};
+
 export default function TrainingDetailScreen() {
   const router = useRouter();
   const insets = useSafeAreaInsets();
@@ -45,8 +55,6 @@
   const [title, setTitle] = useState("");
   const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
   const [time, setTime] = useState("");
-  const [room, setRoom] = useState("");
-  const [durationMin, setDurationMin] = useState<number | null>(null);
   const [maxParticipants, setMaxParticipants] = useState(10);
   const [isOpen, setIsOpen] = useState(true);
   const [submitting, setSubmitting] = useState(false);
@@ -61,9 +69,7 @@
         ? (training.day_of_week as Day)
         : "monday",
     );
-    setTime(training.time);
-    setRoom(training.room ?? "");
-    setDurationMin(training.duration_min);
+    setTime(formatTime(training.time));
     setMaxParticipants(Math.min(50, Math.max(1, training.max_participants)));
     setIsOpen(training.is_open);
     setInitializedId(training.id);
@@ -73,7 +79,7 @@
     const normalizedTitle = title.trim();
     const normalizedTime = time.trim();
 
-    if (!normalizedTitle || !normalizedTime || maxParticipants < 1) {
+    if (!normalizedTitle || maxParticipants < 1) {
       Alert.alert(
         "Proverite podatke",
         "Naziv, vreme i najmanje jedan učesnik su obavezni.",
@@ -81,13 +87,18 @@
       return;
     }
 
+    if (!TIME_PATTERN.test(normalizedTime)) {
+      Alert.alert("Proverite vreme", "Vreme mora biti u formatu HH:MM (00:00–23:59).”);
+      return;
+    }
+
     const input: UpsertSessionInput = {
       id: isNew ? null : id,
       title: normalizedTitle,
       day_of_week: dayOfWeek,
       time: normalizedTime,
-      room: room.trim() || null,
-      duration_min: durationMin,
+      room: null,
+      duration_min: null,
       max_participants: maxParticipants,
       is_open: isOpen,
     };
@@ -171,35 +182,11 @@
             <Text style={styles.fieldLabel}>VREME</Text>
             <TextInput
               value={time}
-              onChangeText={setTime}
+              onChangeText={(value) => setTime(formatTime(value))}
               placeholder="18:00"
               placeholderTextColor={Colors.inkFaint}
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>TRAJANJE (MIN)</Text>
-            <TextInput
-              value={durationMin?.toString() ?? ""}
-              onChangeText={(value) =>
-                setDurationMin(
-                  value === "" ? null : Number(value.replace(/\D/g, "")),
-                )
-              }
               keyboardType="number-pad"
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-        </View>
-
-        <View style={styles.fieldRow}>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>SALA</Text>
-            <TextInput
-              value={room}
-              onChangeText={setRoom}
+              maxLength={5}
               editable={!submitting}
               style={styles.input}
             />
@@ -254,8 +241,12 @@
           </Pressable>
           <Pressable
             onPress={() => void submit()}
-            disabled={submitting}
-            style={[styles.saveButton, submitting && styles.buttonDisabled]}
+            disabled={submitting || !TIME_PATTERN.test(time.trim())}
+            style={[
+              styles.saveButton,
+              (submitting || !TIME_PATTERN.test(time.trim())) &&
+                styles.buttonDisabled,
+            ]}
           >
             {submitting ? (
               <ActivityIndicator color={Colors.surface} />
diff --git a/app/profile.tsx b/app/profile.tsx
index 799b71f8e307cbf3a41a1bf6b20ec8ef2690ad6f..401dcb83e0bed180f8121fc06cdf87ed95944646
--- a/app/profile.tsx
+++ b/app/profile.tsx
@@ -8,7 +8,6 @@
 import { FontFamilies, Typography } from "@/constants/typography";
 import { useAuth } from "@/hooks/useAuth";
 import { useTrainings } from "@/hooks/useTrainings";
-import { clampWeeklyLimit } from "@/utils/limits";
 import { getCurrentWeekDates } from "@/utils/week";
 
 const DAY_LABELS: Record<Day, string> = {
@@ -26,8 +25,9 @@
 
 export default function ProfileScreen() {
   const router = useRouter();
-  const { logout, profile, session, updateProfile } = useAuth();
+  const { logout, profile, session } = useAuth();
   const { bookedCount, trainings } = useTrainings();
+  const isAdmin = profile?.role === "admin";
   const weekDates = getCurrentWeekDates();
   const max = profile?.max_sessions_per_week ?? 0;
   const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;
@@ -55,15 +55,7 @@
 
       return dayDifference || a.time.localeCompare(b.time);
     });
-
-  const changeLimit = (delta: number) => {
-    const newValue = clampWeeklyLimit(max, delta, bookedCount);
 
-    if (newValue !== max) {
-      void updateProfile({ max_sessions_per_week: newValue });
-    }
-  };
-
   return (
     <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
       <View style={styles.navBar}>
@@ -92,15 +84,19 @@
               <Text style={styles.initials}>{initials || "P"}</Text>
             </View>
           </View>
-          <Text style={styles.name}>{fullName || "Perun član"}</Text>
-          {/* Inferred placeholder: Profile has no created_at field. */}
+          <Text style={styles.name}>
+            {fullName || (isAdmin ? "Perun admin" : "Perun član")}
+          </Text>
           <View style={styles.membershipChip}>
-            <Text style={styles.membershipText}>ČLAN OD MAR 2024.</Text>
+            <Text style={styles.membershipText}>
+              {isAdmin ? "ADMIN" : "ČLAN OD MAR 2024."}
+            </Text>
           </View>
         </View>
 
-        {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
-        <View style={styles.statsRow}>
+        {!isAdmin && <>
+          {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
+          <View style={styles.statsRow}>
           <View style={styles.statTile}>
             <Text style={styles.placeholderMarker}>PRIMER</Text>
             <Text style={[styles.statFigure, styles.burgundyStat]}>48</Text>
@@ -111,70 +107,26 @@
             <Text style={[styles.statFigure, styles.sageStat]}>5</Text>
             <Text style={styles.statLabel}>nedelja u nizu</Text>
           </View>
-        </View>
+          </View>
 
-        <View style={styles.limitCard}>
-          <View style={styles.limitHeader}>
-            <View style={styles.limitHeaderCopy}>
+          <View style={styles.limitCard}>
+            <View style={styles.limitHeader}>
               <Text style={styles.limitTitle}>Nedeljni limit</Text>
-              <Text style={styles.limitSubtitle}>
-                Maksimalno treninga po nedelji
+              <Text style={styles.usageValue}>
+                {bookedCount} / {max} ove nedelje
               </Text>
             </View>
-            <View style={styles.stepper}>
-              <Pressable
-                accessibilityLabel="Smanji nedeljni limit"
-                accessibilityRole="button"
-                disabled={max <= bookedCount}
-                onPress={() => changeLimit(-1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max <= bookedCount && styles.disabledStepperButton,
-                  ]}
-                >
-                  −
-                </Text>
-              </Pressable>
-              <Text style={styles.stepperValue}>{max}</Text>
-              <Pressable
-                accessibilityLabel="Povećaj nedeljni limit"
-                accessibilityRole="button"
-                disabled={max >= 7}
-                onPress={() => changeLimit(1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max >= 7 && styles.disabledStepperButton,
-                  ]}
-                >
-                  +
-                </Text>
-              </Pressable>
+            <View style={styles.track}>
+              <View style={[styles.fill, { width: `${progress}%` }]}> 
+                <View style={styles.fillHighlight} />
+              </View>
             </View>
           </View>
 
-          <View style={styles.usageRow}>
-            <Text style={styles.usageLabel}>ISKORIŠĆENO OVE NEDELJE</Text>
-            <Text style={styles.usageValue}>
-              {bookedCount} / {max}
-            </Text>
-          </View>
-          <View style={styles.track}>
-            <View style={[styles.fill, { width: `${progress}%` }]}>
-              <View style={styles.fillHighlight} />
-            </View>
-          </View>
-        </View>
-
-        <Text style={styles.sessionsSectionTitle}>
-          MOJI TERMINI OVE NEDELJE
-        </Text>
-        <View style={styles.sessionsList}>
+          <Text style={styles.sessionsSectionTitle}>
+            MOJI TERMINI OVE NEDELJE
+          </Text>
+          <View style={styles.sessionsList}>
           {bookedSessions.map((training) => {
             const day = training.day_of_week as Day;
             const dateNumber = String(weekDates[day].getUTCDate()).padStart(
@@ -203,7 +155,8 @@
               </View>
             );
           })}
-        </View>
+          </View>
+        </>}
 
         <View style={styles.logoutContainer}>
           <Pressable
@@ -374,61 +327,12 @@
     alignItems: "center",
     flexDirection: "row",
     justifyContent: "space-between",
-  },
-  limitHeaderCopy: {
-    flex: 1,
-    paddingRight: 10,
   },
   limitTitle: {
     color: Colors.ink,
     fontFamily: FontFamilies.hanken[700],
     fontSize: 14.5,
-    fontWeight: "700",
-  },
-  limitSubtitle: {
-    color: Colors.inkMuted,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 12,
-    fontWeight: "600",
-    marginTop: 2,
-  },
-  stepper: {
-    alignItems: "center",
-    backgroundColor: Colors.surfaceMuted,
-    borderColor: "#EFE3D2",
-    borderRadius: Radii.tile[14],
-    borderWidth: 1,
-    flexDirection: "row",
-    gap: 14,
-    paddingHorizontal: 12,
-    paddingVertical: 7,
-  },
-  stepperButton: {
-    color: Colors.burgundy,
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 18,
     fontWeight: "700",
-  },
-  disabledStepperButton: {
-    opacity: 0.3,
-  },
-  stepperValue: {
-    color: Colors.ink,
-    fontFamily: FontFamilies.bricolage[800],
-    fontSize: 18,
-    fontWeight: "800",
-    minWidth: 14,
-    textAlign: "center",
-  },
-  usageRow: {
-    alignItems: "baseline",
-    flexDirection: "row",
-    justifyContent: "space-between",
-    marginTop: 16,
-  },
-  usageLabel: {
-    ...Typography.microLabelWide,
-    color: Colors.inkFaint,
   },
   usageValue: {
     color: Colors.inkMuted,
diff --git a/src/components/TrainingCard.tsx b/src/components/TrainingCard.tsx
index 0266c0c6c9ac88cf3019e5e52465866469aa195f..9a2cb1ab0e3adb63f004951e4881ce1dfbbe2631
--- a/src/components/TrainingCard.tsx
+++ b/src/components/TrainingCard.tsx
@@ -69,9 +69,6 @@
             <Text style={[styles.time, fullAndNotBooked && styles.fullTime]}>
               {training.time.slice(0, 5)}
             </Text>
-            <Text style={[styles.duration, fullAndNotBooked && styles.fullMeta]}>
-              60 min
-            </Text>
           </View>
 
           <View
@@ -90,7 +87,7 @@
               {training.title}
             </Text>
             <Text style={[styles.category, fullAndNotBooked && styles.fullTime]}>
-              Grupni · Sala A
+              Grupni
             </Text>
           </View>
 
@@ -271,13 +268,6 @@
     color: Colors.ink,
     lineHeight: 21,
   },
-  duration: {
-    color: Colors.inkFaint,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 10.5,
-    fontWeight: "600",
-    marginTop: 4,
-  },
   divider: {
     alignSelf: "stretch",
     backgroundColor: Colors.border,
@@ -304,9 +294,6 @@
   },
   fullTime: {
     color: "#9A9098",
-  },
-  fullMeta: {
-    color: "#ADA3AC",
   },
   fullTitle: {
     color: "#6E6670",
diff --git a/src/components/admin/StatTile.tsx b/src/components/admin/StatTile.tsx
index f89911629950685fc1017589872392a2abfdcc70..a1ebd8dd9c9c273fe7f42cb483fca30ca57a0aac
--- a/src/components/admin/StatTile.tsx
+++ b/src/components/admin/StatTile.tsx
@@ -23,6 +23,7 @@
 
 const styles = StyleSheet.create({
   tile: {
+    flex: 1,
     backgroundColor: Colors.surface,
     borderColor: Colors.border,
     borderWidth: 1,

diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 9bbdc139ee145ef44f2e9213834d3fa01e054538..d1e54156c394b7d46c02642411b2fd9a93e44cdd
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -242,6 +242,7 @@
     gap: 11,
   },
   tileRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 11,
   },
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index 23542459a42a8a534685faae85a0dfe5a6e77157..f268a63f9095c10157b70956ea2820eb803bc7a8
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -255,6 +255,7 @@
     color: "#4E7A5C",
   },
   secondaryRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 12,
   },
diff --git a/app/(admin)/(tabs)/users.tsx b/app/(admin)/(tabs)/users.tsx
index 474ea6041ae5182a684fddd9dc2ed3516a9972e3..2720d5d075f5a7d65d2316aeb2477fe8f0766157
--- a/app/(admin)/(tabs)/users.tsx
+++ b/app/(admin)/(tabs)/users.tsx
@@ -11,7 +11,7 @@
   View,
 } from "react-native";
 
-import { FilterChips, UserRow } from "@/components/admin";
+import { FilterChips, Toggle, UserRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
@@ -44,6 +44,7 @@
   const [lastName, setLastName] = useState("");
   const [role, setRole] = useState<UserRole>("user");
   const [maxSessions, setMaxSessions] = useState(0);
+  const [enabled, setEnabled] = useState(true);
   const [saving, setSaving] = useState(false);
 
   const fetchUsers = useCallback(async () => {
@@ -85,6 +86,7 @@
     setLastName(user.last_name ?? "");
     setRole(user.role);
     setMaxSessions(user.max_sessions_per_week);
+    setEnabled(user.enabled ?? true);
   };
 
   const closeEditModal = () => {
@@ -99,6 +101,7 @@
       last_name: lastName.trim(),
       role,
       max_sessions_per_week: maxSessions,
+      enabled,
     };
 
     setSaving(true);
@@ -271,6 +274,15 @@
               </View>
             </View>
 
+            <View style={styles.toggleRow}>
+              <Text style={styles.fieldLabel}>AKTIVAN</Text>
+              <Toggle
+                value={enabled}
+                onValueChange={setEnabled}
+                disabled={saving}
+              />
+            </View>
+
             <View style={styles.modalFooter}>
               <Pressable
                 onPress={closeEditModal}
@@ -422,6 +434,15 @@
     fontWeight: "700",
     color: Colors.ink,
   },
+  toggleRow: {
+    alignItems: "center",
+    borderColor: Colors.fieldBorder,
+    borderRadius: Radii.tile[14],
+    borderWidth: 1,
+    flexDirection: "row",
+    justifyContent: "space-between",
+    padding: Spacing.cardPadding,
+  },
   modalFooter: {
     flexDirection: "row",
     gap: 10,
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 63f74934074ec361d3383d1bebe96ac5e5d71acb..f8d42db151ec4cb50ed5446eb2cf4917bb5ee502
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -35,6 +35,16 @@
   }[day],
 }));
 
+const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
+
+const formatTime = (value: string) => {
+  const digits = value.replace(/\D/g, "").slice(0, 4);
+
+  return digits.length > 2
+    ? `${digits.slice(0, 2)}:${digits.slice(2)}`
+    : digits;
+};
+
 export default function TrainingDetailScreen() {
   const router = useRouter();
   const insets = useSafeAreaInsets();
@@ -45,8 +55,6 @@
   const [title, setTitle] = useState("");
   const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
   const [time, setTime] = useState("");
-  const [room, setRoom] = useState("");
-  const [durationMin, setDurationMin] = useState<number | null>(null);
   const [maxParticipants, setMaxParticipants] = useState(10);
   const [isOpen, setIsOpen] = useState(true);
   const [submitting, setSubmitting] = useState(false);
@@ -61,9 +69,7 @@
         ? (training.day_of_week as Day)
         : "monday",
     );
-    setTime(training.time);
-    setRoom(training.room ?? "");
-    setDurationMin(training.duration_min);
+    setTime(formatTime(training.time));
     setMaxParticipants(Math.min(50, Math.max(1, training.max_participants)));
     setIsOpen(training.is_open);
     setInitializedId(training.id);
@@ -73,7 +79,7 @@
     const normalizedTitle = title.trim();
     const normalizedTime = time.trim();
 
-    if (!normalizedTitle || !normalizedTime || maxParticipants < 1) {
+    if (!normalizedTitle || maxParticipants < 1) {
       Alert.alert(
         "Proverite podatke",
         "Naziv, vreme i najmanje jedan učesnik su obavezni.",
@@ -81,13 +87,18 @@
       return;
     }
 
+    if (!TIME_PATTERN.test(normalizedTime)) {
+      Alert.alert("Proverite vreme", "Vreme mora biti u formatu HH:MM (00:00–23:59).”);
+      return;
+    }
+
     const input: UpsertSessionInput = {
       id: isNew ? null : id,
       title: normalizedTitle,
       day_of_week: dayOfWeek,
       time: normalizedTime,
-      room: room.trim() || null,
-      duration_min: durationMin,
+      room: null,
+      duration_min: null,
       max_participants: maxParticipants,
       is_open: isOpen,
     };
@@ -171,35 +182,11 @@
             <Text style={styles.fieldLabel}>VREME</Text>
             <TextInput
               value={time}
-              onChangeText={setTime}
+              onChangeText={(value) => setTime(formatTime(value))}
               placeholder="18:00"
               placeholderTextColor={Colors.inkFaint}
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>TRAJANJE (MIN)</Text>
-            <TextInput
-              value={durationMin?.toString() ?? ""}
-              onChangeText={(value) =>
-                setDurationMin(
-                  value === "" ? null : Number(value.replace(/\D/g, "")),
-                )
-              }
               keyboardType="number-pad"
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-        </View>
-
-        <View style={styles.fieldRow}>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>SALA</Text>
-            <TextInput
-              value={room}
-              onChangeText={setRoom}
+              maxLength={5}
               editable={!submitting}
               style={styles.input}
             />
@@ -254,8 +241,12 @@
           </Pressable>
           <Pressable
             onPress={() => void submit()}
-            disabled={submitting}
-            style={[styles.saveButton, submitting && styles.buttonDisabled]}
+            disabled={submitting || !TIME_PATTERN.test(time.trim())}
+            style={[
+              styles.saveButton,
+              (submitting || !TIME_PATTERN.test(time.trim())) &&
+                styles.buttonDisabled,
+            ]}
           >
             {submitting ? (
               <ActivityIndicator color={Colors.surface} />
diff --git a/app/profile.tsx b/app/profile.tsx
index 799b71f8e307cbf3a41a1bf6b20ec8ef2690ad6f..401dcb83e0bed180f8121fc06cdf87ed95944646
--- a/app/profile.tsx
+++ b/app/profile.tsx
@@ -8,7 +8,6 @@
 import { FontFamilies, Typography } from "@/constants/typography";
 import { useAuth } from "@/hooks/useAuth";
 import { useTrainings } from "@/hooks/useTrainings";
-import { clampWeeklyLimit } from "@/utils/limits";
 import { getCurrentWeekDates } from "@/utils/week";
 
 const DAY_LABELS: Record<Day, string> = {
@@ -26,8 +25,9 @@
 
 export default function ProfileScreen() {
   const router = useRouter();
-  const { logout, profile, session, updateProfile } = useAuth();
+  const { logout, profile, session } = useAuth();
   const { bookedCount, trainings } = useTrainings();
+  const isAdmin = profile?.role === "admin";
   const weekDates = getCurrentWeekDates();
   const max = profile?.max_sessions_per_week ?? 0;
   const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;
@@ -55,15 +55,7 @@
 
       return dayDifference || a.time.localeCompare(b.time);
     });
-
-  const changeLimit = (delta: number) => {
-    const newValue = clampWeeklyLimit(max, delta, bookedCount);
 
-    if (newValue !== max) {
-      void updateProfile({ max_sessions_per_week: newValue });
-    }
-  };
-
   return (
     <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
       <View style={styles.navBar}>
@@ -92,15 +84,19 @@
               <Text style={styles.initials}>{initials || "P"}</Text>
             </View>
           </View>
-          <Text style={styles.name}>{fullName || "Perun član"}</Text>
-          {/* Inferred placeholder: Profile has no created_at field. */}
+          <Text style={styles.name}>
+            {fullName || (isAdmin ? "Perun admin" : "Perun član")}
+          </Text>
           <View style={styles.membershipChip}>
-            <Text style={styles.membershipText}>ČLAN OD MAR 2024.</Text>
+            <Text style={styles.membershipText}>
+              {isAdmin ? "ADMIN" : "ČLAN OD MAR 2024."}
+            </Text>
           </View>
         </View>
 
-        {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
-        <View style={styles.statsRow}>
+        {!isAdmin && <>
+          {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
+          <View style={styles.statsRow}>
           <View style={styles.statTile}>
             <Text style={styles.placeholderMarker}>PRIMER</Text>
             <Text style={[styles.statFigure, styles.burgundyStat]}>48</Text>
@@ -111,70 +107,26 @@
             <Text style={[styles.statFigure, styles.sageStat]}>5</Text>
             <Text style={styles.statLabel}>nedelja u nizu</Text>
           </View>
-        </View>
+          </View>
 
-        <View style={styles.limitCard}>
-          <View style={styles.limitHeader}>
-            <View style={styles.limitHeaderCopy}>
+          <View style={styles.limitCard}>
+            <View style={styles.limitHeader}>
               <Text style={styles.limitTitle}>Nedeljni limit</Text>
-              <Text style={styles.limitSubtitle}>
-                Maksimalno treninga po nedelji
+              <Text style={styles.usageValue}>
+                {bookedCount} / {max} ove nedelje
               </Text>
             </View>
-            <View style={styles.stepper}>
-              <Pressable
-                accessibilityLabel="Smanji nedeljni limit"
-                accessibilityRole="button"
-                disabled={max <= bookedCount}
-                onPress={() => changeLimit(-1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max <= bookedCount && styles.disabledStepperButton,
-                  ]}
-                >
-                  −
-                </Text>
-              </Pressable>
-              <Text style={styles.stepperValue}>{max}</Text>
-              <Pressable
-                accessibilityLabel="Povećaj nedeljni limit"
-                accessibilityRole="button"
-                disabled={max >= 7}
-                onPress={() => changeLimit(1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max >= 7 && styles.disabledStepperButton,
-                  ]}
-                >
-                  +
-                </Text>
-              </Pressable>
+            <View style={styles.track}>
+              <View style={[styles.fill, { width: `${progress}%` }]}> 
+                <View style={styles.fillHighlight} />
+              </View>
             </View>
           </View>
 
-          <View style={styles.usageRow}>
-            <Text style={styles.usageLabel}>ISKORIŠĆENO OVE NEDELJE</Text>
-            <Text style={styles.usageValue}>
-              {bookedCount} / {max}
-            </Text>
-          </View>
-          <View style={styles.track}>
-            <View style={[styles.fill, { width: `${progress}%` }]}>
-              <View style={styles.fillHighlight} />
-            </View>
-          </View>
-        </View>
-
-        <Text style={styles.sessionsSectionTitle}>
-          MOJI TERMINI OVE NEDELJE
-        </Text>
-        <View style={styles.sessionsList}>
+          <Text style={styles.sessionsSectionTitle}>
+            MOJI TERMINI OVE NEDELJE
+          </Text>
+          <View style={styles.sessionsList}>
           {bookedSessions.map((training) => {
             const day = training.day_of_week as Day;
             const dateNumber = String(weekDates[day].getUTCDate()).padStart(
@@ -203,7 +155,8 @@
               </View>
             );
           })}
-        </View>
+          </View>
+        </>}
 
         <View style={styles.logoutContainer}>
           <Pressable
@@ -374,61 +327,12 @@
     alignItems: "center",
     flexDirection: "row",
     justifyContent: "space-between",
-  },
-  limitHeaderCopy: {
-    flex: 1,
-    paddingRight: 10,
   },
   limitTitle: {
     color: Colors.ink,
     fontFamily: FontFamilies.hanken[700],
     fontSize: 14.5,
-    fontWeight: "700",
-  },
-  limitSubtitle: {
-    color: Colors.inkMuted,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 12,
-    fontWeight: "600",
-    marginTop: 2,
-  },
-  stepper: {
-    alignItems: "center",
-    backgroundColor: Colors.surfaceMuted,
-    borderColor: "#EFE3D2",
-    borderRadius: Radii.tile[14],
-    borderWidth: 1,
-    flexDirection: "row",
-    gap: 14,
-    paddingHorizontal: 12,
-    paddingVertical: 7,
-  },
-  stepperButton: {
-    color: Colors.burgundy,
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 18,
     fontWeight: "700",
-  },
-  disabledStepperButton: {
-    opacity: 0.3,
-  },
-  stepperValue: {
-    color: Colors.ink,
-    fontFamily: FontFamilies.bricolage[800],
-    fontSize: 18,
-    fontWeight: "800",
-    minWidth: 14,
-    textAlign: "center",
-  },
-  usageRow: {
-    alignItems: "baseline",
-    flexDirection: "row",
-    justifyContent: "space-between",
-    marginTop: 16,
-  },
-  usageLabel: {
-    ...Typography.microLabelWide,
-    color: Colors.inkFaint,
   },
   usageValue: {
     color: Colors.inkMuted,
diff --git a/src/components/TrainingCard.tsx b/src/components/TrainingCard.tsx
index 0266c0c6c9ac88cf3019e5e52465866469aa195f..9a2cb1ab0e3adb63f004951e4881ce1dfbbe2631
--- a/src/components/TrainingCard.tsx
+++ b/src/components/TrainingCard.tsx
@@ -69,9 +69,6 @@
             <Text style={[styles.time, fullAndNotBooked && styles.fullTime]}>
               {training.time.slice(0, 5)}
             </Text>
-            <Text style={[styles.duration, fullAndNotBooked && styles.fullMeta]}>
-              60 min
-            </Text>
           </View>
 
           <View
@@ -90,7 +87,7 @@
               {training.title}
             </Text>
             <Text style={[styles.category, fullAndNotBooked && styles.fullTime]}>
-              Grupni · Sala A
+              Grupni
             </Text>
           </View>
 
@@ -271,13 +268,6 @@
     color: Colors.ink,
     lineHeight: 21,
   },
-  duration: {
-    color: Colors.inkFaint,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 10.5,
-    fontWeight: "600",
-    marginTop: 4,
-  },
   divider: {
     alignSelf: "stretch",
     backgroundColor: Colors.border,
@@ -304,9 +294,6 @@
   },
   fullTime: {
     color: "#9A9098",
-  },
-  fullMeta: {
-    color: "#ADA3AC",
   },
   fullTitle: {
     color: "#6E6670",
diff --git a/src/components/admin/StatTile.tsx b/src/components/admin/StatTile.tsx
index f89911629950685fc1017589872392a2abfdcc70..a1ebd8dd9c9c273fe7f42cb483fca30ca57a0aac
--- a/src/components/admin/StatTile.tsx
+++ b/src/components/admin/StatTile.tsx
@@ -23,6 +23,7 @@
 
 const styles = StyleSheet.create({
   tile: {
+    flex: 1,
     backgroundColor: Colors.surface,
     borderColor: Colors.border,
     borderWidth: 1,

codex
The requested UI changes are applied. I’m checking the exact diff now, then I’ll run TypeScript and lint to catch JSX/layout or strict-mode issues before finalizing.
exec
/bin/zsh -lc "git diff --check -- 'app/(admin)/training/[id].tsx' src/components/TrainingCard.tsx 'app/(admin)/(tabs)/index.tsx' 'app/(admin)/(tabs)/stats.tsx' 'app/(admin)/(tabs)/users.tsx' app/profile.tsx src/components/admin/StatTile.tsx && git diff -- 'app/(admin)/training/[id].tsx' src/components/TrainingCard.tsx 'app/(admin)/(tabs)/index.tsx' 'app/(admin)/(tabs)/stats.tsx' 'app/(admin)/(tabs)/users.tsx' app/profile.tsx src/components/admin/StatTile.tsx" in /Users/uros/Documents/Private/Projects/PerunApp
 exited 2 in 0ms:
app/profile.tsx:120: trailing whitespace.
+              <View style={[styles.fill, { width: `${progress}%` }]}> 

diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 9bbdc139ee145ef44f2e9213834d3fa01e054538..d1e54156c394b7d46c02642411b2fd9a93e44cdd
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -242,6 +242,7 @@
     gap: 11,
   },
   tileRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 11,
   },
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index 23542459a42a8a534685faae85a0dfe5a6e77157..f268a63f9095c10157b70956ea2820eb803bc7a8
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -255,6 +255,7 @@
     color: "#4E7A5C",
   },
   secondaryRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 12,
   },
diff --git a/app/(admin)/(tabs)/users.tsx b/app/(admin)/(tabs)/users.tsx
index 474ea6041ae5182a684fddd9dc2ed3516a9972e3..2720d5d075f5a7d65d2316aeb2477fe8f0766157
--- a/app/(admin)/(tabs)/users.tsx
+++ b/app/(admin)/(tabs)/users.tsx
@@ -11,7 +11,7 @@
   View,
 } from "react-native";
 
-import { FilterChips, UserRow } from "@/components/admin";
+import { FilterChips, Toggle, UserRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
@@ -44,6 +44,7 @@
   const [lastName, setLastName] = useState("");
   const [role, setRole] = useState<UserRole>("user");
   const [maxSessions, setMaxSessions] = useState(0);
+  const [enabled, setEnabled] = useState(true);
   const [saving, setSaving] = useState(false);
 
   const fetchUsers = useCallback(async () => {
@@ -85,6 +86,7 @@
     setLastName(user.last_name ?? "");
     setRole(user.role);
     setMaxSessions(user.max_sessions_per_week);
+    setEnabled(user.enabled ?? true);
   };
 
   const closeEditModal = () => {
@@ -99,6 +101,7 @@
       last_name: lastName.trim(),
       role,
       max_sessions_per_week: maxSessions,
+      enabled,
     };
 
     setSaving(true);
@@ -271,6 +274,15 @@
               </View>
             </View>
 
+            <View style={styles.toggleRow}>
+              <Text style={styles.fieldLabel}>AKTIVAN</Text>
+              <Toggle
+                value={enabled}
+                onValueChange={setEnabled}
+                disabled={saving}
+              />
+            </View>
+
             <View style={styles.modalFooter}>
               <Pressable
                 onPress={closeEditModal}
@@ -422,6 +434,15 @@
     fontWeight: "700",
     color: Colors.ink,
   },
+  toggleRow: {
+    alignItems: "center",
+    borderColor: Colors.fieldBorder,
+    borderRadius: Radii.tile[14],
+    borderWidth: 1,
+    flexDirection: "row",
+    justifyContent: "space-between",
+    padding: Spacing.cardPadding,
+  },
   modalFooter: {
     flexDirection: "row",
     gap: 10,
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 63f74934074ec361d3383d1bebe96ac5e5d71acb..f8d42db151ec4cb50ed5446eb2cf4917bb5ee502
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -35,6 +35,16 @@
   }[day],
 }));
 
+const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
+
+const formatTime = (value: string) => {
+  const digits = value.replace(/\D/g, "").slice(0, 4);
+
+  return digits.length > 2
+    ? `${digits.slice(0, 2)}:${digits.slice(2)}`
+    : digits;
+};
+
 export default function TrainingDetailScreen() {
   const router = useRouter();
   const insets = useSafeAreaInsets();
@@ -45,8 +55,6 @@
   const [title, setTitle] = useState("");
   const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
   const [time, setTime] = useState("");
-  const [room, setRoom] = useState("");
-  const [durationMin, setDurationMin] = useState<number | null>(null);
   const [maxParticipants, setMaxParticipants] = useState(10);
   const [isOpen, setIsOpen] = useState(true);
   const [submitting, setSubmitting] = useState(false);
@@ -61,9 +69,7 @@
         ? (training.day_of_week as Day)
         : "monday",
     );
-    setTime(training.time);
-    setRoom(training.room ?? "");
-    setDurationMin(training.duration_min);
+    setTime(formatTime(training.time));
     setMaxParticipants(Math.min(50, Math.max(1, training.max_participants)));
     setIsOpen(training.is_open);
     setInitializedId(training.id);
@@ -73,7 +79,7 @@
     const normalizedTitle = title.trim();
     const normalizedTime = time.trim();
 
-    if (!normalizedTitle || !normalizedTime || maxParticipants < 1) {
+    if (!normalizedTitle || maxParticipants < 1) {
       Alert.alert(
         "Proverite podatke",
         "Naziv, vreme i najmanje jedan učesnik su obavezni.",
@@ -81,13 +87,18 @@
       return;
     }
 
+    if (!TIME_PATTERN.test(normalizedTime)) {
+      Alert.alert("Proverite vreme", "Vreme mora biti u formatu HH:MM (00:00–23:59).”);
+      return;
+    }
+
     const input: UpsertSessionInput = {
       id: isNew ? null : id,
       title: normalizedTitle,
       day_of_week: dayOfWeek,
       time: normalizedTime,
-      room: room.trim() || null,
-      duration_min: durationMin,
+      room: null,
+      duration_min: null,
       max_participants: maxParticipants,
       is_open: isOpen,
     };
@@ -171,35 +182,11 @@
             <Text style={styles.fieldLabel}>VREME</Text>
             <TextInput
               value={time}
-              onChangeText={setTime}
+              onChangeText={(value) => setTime(formatTime(value))}
               placeholder="18:00"
               placeholderTextColor={Colors.inkFaint}
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>TRAJANJE (MIN)</Text>
-            <TextInput
-              value={durationMin?.toString() ?? ""}
-              onChangeText={(value) =>
-                setDurationMin(
-                  value === "" ? null : Number(value.replace(/\D/g, "")),
-                )
-              }
               keyboardType="number-pad"
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-        </View>
-
-        <View style={styles.fieldRow}>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>SALA</Text>
-            <TextInput
-              value={room}
-              onChangeText={setRoom}
+              maxLength={5}
               editable={!submitting}
               style={styles.input}
             />
@@ -254,8 +241,12 @@
           </Pressable>
           <Pressable
             onPress={() => void submit()}
-            disabled={submitting}
-            style={[styles.saveButton, submitting && styles.buttonDisabled]}
+            disabled={submitting || !TIME_PATTERN.test(time.trim())}
+            style={[
+              styles.saveButton,
+              (submitting || !TIME_PATTERN.test(time.trim())) &&
+                styles.buttonDisabled,
+            ]}
           >
             {submitting ? (
               <ActivityIndicator color={Colors.surface} />
diff --git a/app/profile.tsx b/app/profile.tsx
index 799b71f8e307cbf3a41a1bf6b20ec8ef2690ad6f..401dcb83e0bed180f8121fc06cdf87ed95944646
--- a/app/profile.tsx
+++ b/app/profile.tsx
@@ -8,7 +8,6 @@
 import { FontFamilies, Typography } from "@/constants/typography";
 import { useAuth } from "@/hooks/useAuth";
 import { useTrainings } from "@/hooks/useTrainings";
-import { clampWeeklyLimit } from "@/utils/limits";
 import { getCurrentWeekDates } from "@/utils/week";
 
 const DAY_LABELS: Record<Day, string> = {
@@ -26,8 +25,9 @@
 
 export default function ProfileScreen() {
   const router = useRouter();
-  const { logout, profile, session, updateProfile } = useAuth();
+  const { logout, profile, session } = useAuth();
   const { bookedCount, trainings } = useTrainings();
+  const isAdmin = profile?.role === "admin";
   const weekDates = getCurrentWeekDates();
   const max = profile?.max_sessions_per_week ?? 0;
   const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;
@@ -55,15 +55,7 @@
 
       return dayDifference || a.time.localeCompare(b.time);
     });
-
-  const changeLimit = (delta: number) => {
-    const newValue = clampWeeklyLimit(max, delta, bookedCount);
 
-    if (newValue !== max) {
-      void updateProfile({ max_sessions_per_week: newValue });
-    }
-  };
-
   return (
     <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
       <View style={styles.navBar}>
@@ -92,15 +84,19 @@
               <Text style={styles.initials}>{initials || "P"}</Text>
             </View>
           </View>
-          <Text style={styles.name}>{fullName || "Perun član"}</Text>
-          {/* Inferred placeholder: Profile has no created_at field. */}
+          <Text style={styles.name}>
+            {fullName || (isAdmin ? "Perun admin" : "Perun član")}
+          </Text>
           <View style={styles.membershipChip}>
-            <Text style={styles.membershipText}>ČLAN OD MAR 2024.</Text>
+            <Text style={styles.membershipText}>
+              {isAdmin ? "ADMIN" : "ČLAN OD MAR 2024."}
+            </Text>
           </View>
         </View>
 
-        {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
-        <View style={styles.statsRow}>
+        {!isAdmin && <>
+          {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
+          <View style={styles.statsRow}>
           <View style={styles.statTile}>
             <Text style={styles.placeholderMarker}>PRIMER</Text>
             <Text style={[styles.statFigure, styles.burgundyStat]}>48</Text>
@@ -111,70 +107,26 @@
             <Text style={[styles.statFigure, styles.sageStat]}>5</Text>
             <Text style={styles.statLabel}>nedelja u nizu</Text>
           </View>
-        </View>
+          </View>
 
-        <View style={styles.limitCard}>
-          <View style={styles.limitHeader}>
-            <View style={styles.limitHeaderCopy}>
+          <View style={styles.limitCard}>
+            <View style={styles.limitHeader}>
               <Text style={styles.limitTitle}>Nedeljni limit</Text>
-              <Text style={styles.limitSubtitle}>
-                Maksimalno treninga po nedelji
+              <Text style={styles.usageValue}>
+                {bookedCount} / {max} ove nedelje
               </Text>
             </View>
-            <View style={styles.stepper}>
-              <Pressable
-                accessibilityLabel="Smanji nedeljni limit"
-                accessibilityRole="button"
-                disabled={max <= bookedCount}
-                onPress={() => changeLimit(-1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max <= bookedCount && styles.disabledStepperButton,
-                  ]}
-                >
-                  −
-                </Text>
-              </Pressable>
-              <Text style={styles.stepperValue}>{max}</Text>
-              <Pressable
-                accessibilityLabel="Povećaj nedeljni limit"
-                accessibilityRole="button"
-                disabled={max >= 7}
-                onPress={() => changeLimit(1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max >= 7 && styles.disabledStepperButton,
-                  ]}
-                >
-                  +
-                </Text>
-              </Pressable>
+            <View style={styles.track}>
+              <View style={[styles.fill, { width: `${progress}%` }]}> 
+                <View style={styles.fillHighlight} />
+              </View>
             </View>
           </View>
 
-          <View style={styles.usageRow}>
-            <Text style={styles.usageLabel}>ISKORIŠĆENO OVE NEDELJE</Text>
-            <Text style={styles.usageValue}>
-              {bookedCount} / {max}
-            </Text>
-          </View>
-          <View style={styles.track}>
-            <View style={[styles.fill, { width: `${progress}%` }]}>
-              <View style={styles.fillHighlight} />
-            </View>
-          </View>
-        </View>
-
-        <Text style={styles.sessionsSectionTitle}>
-          MOJI TERMINI OVE NEDELJE
-        </Text>
-        <View style={styles.sessionsList}>
+          <Text style={styles.sessionsSectionTitle}>
+            MOJI TERMINI OVE NEDELJE
+          </Text>
+          <View style={styles.sessionsList}>
           {bookedSessions.map((training) => {
             const day = training.day_of_week as Day;
             const dateNumber = String(weekDates[day].getUTCDate()).padStart(
@@ -203,7 +155,8 @@
               </View>
             );
           })}
-        </View>
+          </View>
+        </>}
 
         <View style={styles.logoutContainer}>
           <Pressable
@@ -374,61 +327,12 @@
     alignItems: "center",
     flexDirection: "row",
     justifyContent: "space-between",
-  },
-  limitHeaderCopy: {
-    flex: 1,
-    paddingRight: 10,
   },
   limitTitle: {
     color: Colors.ink,
     fontFamily: FontFamilies.hanken[700],
     fontSize: 14.5,
-    fontWeight: "700",
-  },
-  limitSubtitle: {
-    color: Colors.inkMuted,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 12,
-    fontWeight: "600",
-    marginTop: 2,
-  },
-  stepper: {
-    alignItems: "center",
-    backgroundColor: Colors.surfaceMuted,
-    borderColor: "#EFE3D2",
-    borderRadius: Radii.tile[14],
-    borderWidth: 1,
-    flexDirection: "row",
-    gap: 14,
-    paddingHorizontal: 12,
-    paddingVertical: 7,
-  },
-  stepperButton: {
-    color: Colors.burgundy,
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 18,
     fontWeight: "700",
-  },
-  disabledStepperButton: {
-    opacity: 0.3,
-  },
-  stepperValue: {
-    color: Colors.ink,
-    fontFamily: FontFamilies.bricolage[800],
-    fontSize: 18,
-    fontWeight: "800",
-    minWidth: 14,
-    textAlign: "center",
-  },
-  usageRow: {
-    alignItems: "baseline",
-    flexDirection: "row",
-    justifyContent: "space-between",
-    marginTop: 16,
-  },
-  usageLabel: {
-    ...Typography.microLabelWide,
-    color: Colors.inkFaint,
   },
   usageValue: {
     color: Colors.inkMuted,
diff --git a/src/components/TrainingCard.tsx b/src/components/TrainingCard.tsx
index 0266c0c6c9ac88cf3019e5e52465866469aa195f..9a2cb1ab0e3adb63f004951e4881ce1dfbbe2631
--- a/src/components/TrainingCard.tsx
+++ b/src/components/TrainingCard.tsx
@@ -69,9 +69,6 @@
             <Text style={[styles.time, fullAndNotBooked && styles.fullTime]}>
               {training.time.slice(0, 5)}
             </Text>
-            <Text style={[styles.duration, fullAndNotBooked && styles.fullMeta]}>
-              60 min
-            </Text>
           </View>
 
           <View
@@ -90,7 +87,7 @@
               {training.title}
             </Text>
             <Text style={[styles.category, fullAndNotBooked && styles.fullTime]}>
-              Grupni · Sala A
+              Grupni
             </Text>
           </View>
 
@@ -271,13 +268,6 @@
     color: Colors.ink,
     lineHeight: 21,
   },
-  duration: {
-    color: Colors.inkFaint,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 10.5,
-    fontWeight: "600",
-    marginTop: 4,
-  },
   divider: {
     alignSelf: "stretch",
     backgroundColor: Colors.border,
@@ -304,9 +294,6 @@
   },
   fullTime: {
     color: "#9A9098",
-  },
-  fullMeta: {
-    color: "#ADA3AC",
   },
   fullTitle: {
     color: "#6E6670",
diff --git a/src/components/admin/StatTile.tsx b/src/components/admin/StatTile.tsx
index f89911629950685fc1017589872392a2abfdcc70..a1ebd8dd9c9c273fe7f42cb483fca30ca57a0aac
--- a/src/components/admin/StatTile.tsx
+++ b/src/components/admin/StatTile.tsx
@@ -23,6 +23,7 @@
 
 const styles = StyleSheet.create({
   tile: {
+    flex: 1,
     backgroundColor: Colors.surface,
     borderColor: Colors.border,
     borderWidth: 1,

apply patch
patch: completed
/Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/training/[id].tsx
/Users/uros/Documents/Private/Projects/PerunApp/app/profile.tsx
diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 9bbdc139ee145ef44f2e9213834d3fa01e054538..d1e54156c394b7d46c02642411b2fd9a93e44cdd
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -242,6 +242,7 @@
     gap: 11,
   },
   tileRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 11,
   },
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index 23542459a42a8a534685faae85a0dfe5a6e77157..f268a63f9095c10157b70956ea2820eb803bc7a8
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -255,6 +255,7 @@
     color: "#4E7A5C",
   },
   secondaryRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 12,
   },
diff --git a/app/(admin)/(tabs)/users.tsx b/app/(admin)/(tabs)/users.tsx
index 474ea6041ae5182a684fddd9dc2ed3516a9972e3..2720d5d075f5a7d65d2316aeb2477fe8f0766157
--- a/app/(admin)/(tabs)/users.tsx
+++ b/app/(admin)/(tabs)/users.tsx
@@ -11,7 +11,7 @@
   View,
 } from "react-native";
 
-import { FilterChips, UserRow } from "@/components/admin";
+import { FilterChips, Toggle, UserRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
@@ -44,6 +44,7 @@
   const [lastName, setLastName] = useState("");
   const [role, setRole] = useState<UserRole>("user");
   const [maxSessions, setMaxSessions] = useState(0);
+  const [enabled, setEnabled] = useState(true);
   const [saving, setSaving] = useState(false);
 
   const fetchUsers = useCallback(async () => {
@@ -85,6 +86,7 @@
     setLastName(user.last_name ?? "");
     setRole(user.role);
     setMaxSessions(user.max_sessions_per_week);
+    setEnabled(user.enabled ?? true);
   };
 
   const closeEditModal = () => {
@@ -99,6 +101,7 @@
       last_name: lastName.trim(),
       role,
       max_sessions_per_week: maxSessions,
+      enabled,
     };
 
     setSaving(true);
@@ -271,6 +274,15 @@
               </View>
             </View>
 
+            <View style={styles.toggleRow}>
+              <Text style={styles.fieldLabel}>AKTIVAN</Text>
+              <Toggle
+                value={enabled}
+                onValueChange={setEnabled}
+                disabled={saving}
+              />
+            </View>
+
             <View style={styles.modalFooter}>
               <Pressable
                 onPress={closeEditModal}
@@ -422,6 +434,15 @@
     fontWeight: "700",
     color: Colors.ink,
   },
+  toggleRow: {
+    alignItems: "center",
+    borderColor: Colors.fieldBorder,
+    borderRadius: Radii.tile[14],
+    borderWidth: 1,
+    flexDirection: "row",
+    justifyContent: "space-between",
+    padding: Spacing.cardPadding,
+  },
   modalFooter: {
     flexDirection: "row",
     gap: 10,
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 63f74934074ec361d3383d1bebe96ac5e5d71acb..de3d7bf172771f30084be8131eb8bbc1da719101
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -35,6 +35,16 @@
   }[day],
 }));
 
+const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
+
+const formatTime = (value: string) => {
+  const digits = value.replace(/\D/g, "").slice(0, 4);
+
+  return digits.length > 2
+    ? `${digits.slice(0, 2)}:${digits.slice(2)}`
+    : digits;
+};
+
 export default function TrainingDetailScreen() {
   const router = useRouter();
   const insets = useSafeAreaInsets();
@@ -45,8 +55,6 @@
   const [title, setTitle] = useState("");
   const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
   const [time, setTime] = useState("");
-  const [room, setRoom] = useState("");
-  const [durationMin, setDurationMin] = useState<number | null>(null);
   const [maxParticipants, setMaxParticipants] = useState(10);
   const [isOpen, setIsOpen] = useState(true);
   const [submitting, setSubmitting] = useState(false);
@@ -61,9 +69,7 @@
         ? (training.day_of_week as Day)
         : "monday",
     );
-    setTime(training.time);
-    setRoom(training.room ?? "");
-    setDurationMin(training.duration_min);
+    setTime(formatTime(training.time));
     setMaxParticipants(Math.min(50, Math.max(1, training.max_participants)));
     setIsOpen(training.is_open);
     setInitializedId(training.id);
@@ -73,7 +79,7 @@
     const normalizedTitle = title.trim();
     const normalizedTime = time.trim();
 
-    if (!normalizedTitle || !normalizedTime || maxParticipants < 1) {
+    if (!normalizedTitle || maxParticipants < 1) {
       Alert.alert(
         "Proverite podatke",
         "Naziv, vreme i najmanje jedan učesnik su obavezni.",
@@ -81,13 +87,21 @@
       return;
     }
 
+    if (!TIME_PATTERN.test(normalizedTime)) {
+      Alert.alert(
+        "Proverite vreme",
+        "Vreme mora biti u formatu HH:MM (00:00–23:59).",
+      );
+      return;
+    }
+
     const input: UpsertSessionInput = {
       id: isNew ? null : id,
       title: normalizedTitle,
       day_of_week: dayOfWeek,
       time: normalizedTime,
-      room: room.trim() || null,
-      duration_min: durationMin,
+      room: null,
+      duration_min: null,
       max_participants: maxParticipants,
       is_open: isOpen,
     };
@@ -171,35 +185,11 @@
             <Text style={styles.fieldLabel}>VREME</Text>
             <TextInput
               value={time}
-              onChangeText={setTime}
+              onChangeText={(value) => setTime(formatTime(value))}
               placeholder="18:00"
               placeholderTextColor={Colors.inkFaint}
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>TRAJANJE (MIN)</Text>
-            <TextInput
-              value={durationMin?.toString() ?? ""}
-              onChangeText={(value) =>
-                setDurationMin(
-                  value === "" ? null : Number(value.replace(/\D/g, "")),
-                )
-              }
               keyboardType="number-pad"
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-        </View>
-
-        <View style={styles.fieldRow}>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>SALA</Text>
-            <TextInput
-              value={room}
-              onChangeText={setRoom}
+              maxLength={5}
               editable={!submitting}
               style={styles.input}
             />
@@ -254,8 +244,12 @@
           </Pressable>
           <Pressable
             onPress={() => void submit()}
-            disabled={submitting}
-            style={[styles.saveButton, submitting && styles.buttonDisabled]}
+            disabled={submitting || !TIME_PATTERN.test(time.trim())}
+            style={[
+              styles.saveButton,
+              (submitting || !TIME_PATTERN.test(time.trim())) &&
+                styles.buttonDisabled,
+            ]}
           >
             {submitting ? (
               <ActivityIndicator color={Colors.surface} />
diff --git a/app/profile.tsx b/app/profile.tsx
index 799b71f8e307cbf3a41a1bf6b20ec8ef2690ad6f..790b7d86082f4b0eaca59eb77c0739f7fb1b4e27
--- a/app/profile.tsx
+++ b/app/profile.tsx
@@ -8,7 +8,6 @@
 import { FontFamilies, Typography } from "@/constants/typography";
 import { useAuth } from "@/hooks/useAuth";
 import { useTrainings } from "@/hooks/useTrainings";
-import { clampWeeklyLimit } from "@/utils/limits";
 import { getCurrentWeekDates } from "@/utils/week";
 
 const DAY_LABELS: Record<Day, string> = {
@@ -26,8 +25,9 @@
 
 export default function ProfileScreen() {
   const router = useRouter();
-  const { logout, profile, session, updateProfile } = useAuth();
+  const { logout, profile, session } = useAuth();
   const { bookedCount, trainings } = useTrainings();
+  const isAdmin = profile?.role === "admin";
   const weekDates = getCurrentWeekDates();
   const max = profile?.max_sessions_per_week ?? 0;
   const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;
@@ -55,15 +55,7 @@
 
       return dayDifference || a.time.localeCompare(b.time);
     });
-
-  const changeLimit = (delta: number) => {
-    const newValue = clampWeeklyLimit(max, delta, bookedCount);
 
-    if (newValue !== max) {
-      void updateProfile({ max_sessions_per_week: newValue });
-    }
-  };
-
   return (
     <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
       <View style={styles.navBar}>
@@ -92,15 +84,19 @@
               <Text style={styles.initials}>{initials || "P"}</Text>
             </View>
           </View>
-          <Text style={styles.name}>{fullName || "Perun član"}</Text>
-          {/* Inferred placeholder: Profile has no created_at field. */}
+          <Text style={styles.name}>
+            {fullName || (isAdmin ? "Perun admin" : "Perun član")}
+          </Text>
           <View style={styles.membershipChip}>
-            <Text style={styles.membershipText}>ČLAN OD MAR 2024.</Text>
+            <Text style={styles.membershipText}>
+              {isAdmin ? "ADMIN" : "ČLAN OD MAR 2024."}
+            </Text>
           </View>
         </View>
 
-        {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
-        <View style={styles.statsRow}>
+        {!isAdmin && <>
+          {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
+          <View style={styles.statsRow}>
           <View style={styles.statTile}>
             <Text style={styles.placeholderMarker}>PRIMER</Text>
             <Text style={[styles.statFigure, styles.burgundyStat]}>48</Text>
@@ -111,70 +107,26 @@
             <Text style={[styles.statFigure, styles.sageStat]}>5</Text>
             <Text style={styles.statLabel}>nedelja u nizu</Text>
           </View>
-        </View>
+          </View>
 
-        <View style={styles.limitCard}>
-          <View style={styles.limitHeader}>
-            <View style={styles.limitHeaderCopy}>
+          <View style={styles.limitCard}>
+            <View style={styles.limitHeader}>
               <Text style={styles.limitTitle}>Nedeljni limit</Text>
-              <Text style={styles.limitSubtitle}>
-                Maksimalno treninga po nedelji
+              <Text style={styles.usageValue}>
+                {bookedCount} / {max} ove nedelje
               </Text>
             </View>
-            <View style={styles.stepper}>
-              <Pressable
-                accessibilityLabel="Smanji nedeljni limit"
-                accessibilityRole="button"
-                disabled={max <= bookedCount}
-                onPress={() => changeLimit(-1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max <= bookedCount && styles.disabledStepperButton,
-                  ]}
-                >
-                  −
-                </Text>
-              </Pressable>
-              <Text style={styles.stepperValue}>{max}</Text>
-              <Pressable
-                accessibilityLabel="Povećaj nedeljni limit"
-                accessibilityRole="button"
-                disabled={max >= 7}
-                onPress={() => changeLimit(1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max >= 7 && styles.disabledStepperButton,
-                  ]}
-                >
-                  +
-                </Text>
-              </Pressable>
+            <View style={styles.track}>
+              <View style={[styles.fill, { width: `${progress}%` }]}>
+                <View style={styles.fillHighlight} />
+              </View>
             </View>
           </View>
 
-          <View style={styles.usageRow}>
-            <Text style={styles.usageLabel}>ISKORIŠĆENO OVE NEDELJE</Text>
-            <Text style={styles.usageValue}>
-              {bookedCount} / {max}
-            </Text>
-          </View>
-          <View style={styles.track}>
-            <View style={[styles.fill, { width: `${progress}%` }]}>
-              <View style={styles.fillHighlight} />
-            </View>
-          </View>
-        </View>
-
-        <Text style={styles.sessionsSectionTitle}>
-          MOJI TERMINI OVE NEDELJE
-        </Text>
-        <View style={styles.sessionsList}>
+          <Text style={styles.sessionsSectionTitle}>
+            MOJI TERMINI OVE NEDELJE
+          </Text>
+          <View style={styles.sessionsList}>
           {bookedSessions.map((training) => {
             const day = training.day_of_week as Day;
             const dateNumber = String(weekDates[day].getUTCDate()).padStart(
@@ -203,7 +155,8 @@
               </View>
             );
           })}
-        </View>
+          </View>
+        </>}
 
         <View style={styles.logoutContainer}>
           <Pressable
@@ -374,61 +327,12 @@
     alignItems: "center",
     flexDirection: "row",
     justifyContent: "space-between",
-  },
-  limitHeaderCopy: {
-    flex: 1,
-    paddingRight: 10,
   },
   limitTitle: {
     color: Colors.ink,
     fontFamily: FontFamilies.hanken[700],
     fontSize: 14.5,
-    fontWeight: "700",
-  },
-  limitSubtitle: {
-    color: Colors.inkMuted,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 12,
-    fontWeight: "600",
-    marginTop: 2,
-  },
-  stepper: {
-    alignItems: "center",
-    backgroundColor: Colors.surfaceMuted,
-    borderColor: "#EFE3D2",
-    borderRadius: Radii.tile[14],
-    borderWidth: 1,
-    flexDirection: "row",
-    gap: 14,
-    paddingHorizontal: 12,
-    paddingVertical: 7,
-  },
-  stepperButton: {
-    color: Colors.burgundy,
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 18,
     fontWeight: "700",
-  },
-  disabledStepperButton: {
-    opacity: 0.3,
-  },
-  stepperValue: {
-    color: Colors.ink,
-    fontFamily: FontFamilies.bricolage[800],
-    fontSize: 18,
-    fontWeight: "800",
-    minWidth: 14,
-    textAlign: "center",
-  },
-  usageRow: {
-    alignItems: "baseline",
-    flexDirection: "row",
-    justifyContent: "space-between",
-    marginTop: 16,
-  },
-  usageLabel: {
-    ...Typography.microLabelWide,
-    color: Colors.inkFaint,
   },
   usageValue: {
     color: Colors.inkMuted,
diff --git a/src/components/TrainingCard.tsx b/src/components/TrainingCard.tsx
index 0266c0c6c9ac88cf3019e5e52465866469aa195f..9a2cb1ab0e3adb63f004951e4881ce1dfbbe2631
--- a/src/components/TrainingCard.tsx
+++ b/src/components/TrainingCard.tsx
@@ -69,9 +69,6 @@
             <Text style={[styles.time, fullAndNotBooked && styles.fullTime]}>
               {training.time.slice(0, 5)}
             </Text>
-            <Text style={[styles.duration, fullAndNotBooked && styles.fullMeta]}>
-              60 min
-            </Text>
           </View>
 
           <View
@@ -90,7 +87,7 @@
               {training.title}
             </Text>
             <Text style={[styles.category, fullAndNotBooked && styles.fullTime]}>
-              Grupni · Sala A
+              Grupni
             </Text>
           </View>
 
@@ -271,13 +268,6 @@
     color: Colors.ink,
     lineHeight: 21,
   },
-  duration: {
-    color: Colors.inkFaint,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 10.5,
-    fontWeight: "600",
-    marginTop: 4,
-  },
   divider: {
     alignSelf: "stretch",
     backgroundColor: Colors.border,
@@ -304,9 +294,6 @@
   },
   fullTime: {
     color: "#9A9098",
-  },
-  fullMeta: {
-    color: "#ADA3AC",
   },
   fullTitle: {
     color: "#6E6670",
diff --git a/src/components/admin/StatTile.tsx b/src/components/admin/StatTile.tsx
index f89911629950685fc1017589872392a2abfdcc70..a1ebd8dd9c9c273fe7f42cb483fca30ca57a0aac
--- a/src/components/admin/StatTile.tsx
+++ b/src/components/admin/StatTile.tsx
@@ -23,6 +23,7 @@
 
 const styles = StyleSheet.create({
   tile: {
+    flex: 1,
     backgroundColor: Colors.surface,
     borderColor: Colors.border,
     borderWidth: 1,

diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 9bbdc139ee145ef44f2e9213834d3fa01e054538..d1e54156c394b7d46c02642411b2fd9a93e44cdd
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -242,6 +242,7 @@
     gap: 11,
   },
   tileRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 11,
   },
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index 23542459a42a8a534685faae85a0dfe5a6e77157..f268a63f9095c10157b70956ea2820eb803bc7a8
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -255,6 +255,7 @@
     color: "#4E7A5C",
   },
   secondaryRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 12,
   },
diff --git a/app/(admin)/(tabs)/users.tsx b/app/(admin)/(tabs)/users.tsx
index 474ea6041ae5182a684fddd9dc2ed3516a9972e3..2720d5d075f5a7d65d2316aeb2477fe8f0766157
--- a/app/(admin)/(tabs)/users.tsx
+++ b/app/(admin)/(tabs)/users.tsx
@@ -11,7 +11,7 @@
   View,
 } from "react-native";
 
-import { FilterChips, UserRow } from "@/components/admin";
+import { FilterChips, Toggle, UserRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
@@ -44,6 +44,7 @@
   const [lastName, setLastName] = useState("");
   const [role, setRole] = useState<UserRole>("user");
   const [maxSessions, setMaxSessions] = useState(0);
+  const [enabled, setEnabled] = useState(true);
   const [saving, setSaving] = useState(false);
 
   const fetchUsers = useCallback(async () => {
@@ -85,6 +86,7 @@
     setLastName(user.last_name ?? "");
     setRole(user.role);
     setMaxSessions(user.max_sessions_per_week);
+    setEnabled(user.enabled ?? true);
   };
 
   const closeEditModal = () => {
@@ -99,6 +101,7 @@
       last_name: lastName.trim(),
       role,
       max_sessions_per_week: maxSessions,
+      enabled,
     };
 
     setSaving(true);
@@ -271,6 +274,15 @@
               </View>
             </View>
 
+            <View style={styles.toggleRow}>
+              <Text style={styles.fieldLabel}>AKTIVAN</Text>
+              <Toggle
+                value={enabled}
+                onValueChange={setEnabled}
+                disabled={saving}
+              />
+            </View>
+
             <View style={styles.modalFooter}>
               <Pressable
                 onPress={closeEditModal}
@@ -422,6 +434,15 @@
     fontWeight: "700",
     color: Colors.ink,
   },
+  toggleRow: {
+    alignItems: "center",
+    borderColor: Colors.fieldBorder,
+    borderRadius: Radii.tile[14],
+    borderWidth: 1,
+    flexDirection: "row",
+    justifyContent: "space-between",
+    padding: Spacing.cardPadding,
+  },
   modalFooter: {
     flexDirection: "row",
     gap: 10,
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 63f74934074ec361d3383d1bebe96ac5e5d71acb..de3d7bf172771f30084be8131eb8bbc1da719101
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -35,6 +35,16 @@
   }[day],
 }));
 
+const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
+
+const formatTime = (value: string) => {
+  const digits = value.replace(/\D/g, "").slice(0, 4);
+
+  return digits.length > 2
+    ? `${digits.slice(0, 2)}:${digits.slice(2)}`
+    : digits;
+};
+
 export default function TrainingDetailScreen() {
   const router = useRouter();
   const insets = useSafeAreaInsets();
@@ -45,8 +55,6 @@
   const [title, setTitle] = useState("");
   const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
   const [time, setTime] = useState("");
-  const [room, setRoom] = useState("");
-  const [durationMin, setDurationMin] = useState<number | null>(null);
   const [maxParticipants, setMaxParticipants] = useState(10);
   const [isOpen, setIsOpen] = useState(true);
   const [submitting, setSubmitting] = useState(false);
@@ -61,9 +69,7 @@
         ? (training.day_of_week as Day)
         : "monday",
     );
-    setTime(training.time);
-    setRoom(training.room ?? "");
-    setDurationMin(training.duration_min);
+    setTime(formatTime(training.time));
     setMaxParticipants(Math.min(50, Math.max(1, training.max_participants)));
     setIsOpen(training.is_open);
     setInitializedId(training.id);
@@ -73,7 +79,7 @@
     const normalizedTitle = title.trim();
     const normalizedTime = time.trim();
 
-    if (!normalizedTitle || !normalizedTime || maxParticipants < 1) {
+    if (!normalizedTitle || maxParticipants < 1) {
       Alert.alert(
         "Proverite podatke",
         "Naziv, vreme i najmanje jedan učesnik su obavezni.",
@@ -81,13 +87,21 @@
       return;
     }
 
+    if (!TIME_PATTERN.test(normalizedTime)) {
+      Alert.alert(
+        "Proverite vreme",
+        "Vreme mora biti u formatu HH:MM (00:00–23:59).",
+      );
+      return;
+    }
+
     const input: UpsertSessionInput = {
       id: isNew ? null : id,
       title: normalizedTitle,
       day_of_week: dayOfWeek,
       time: normalizedTime,
-      room: room.trim() || null,
-      duration_min: durationMin,
+      room: null,
+      duration_min: null,
       max_participants: maxParticipants,
       is_open: isOpen,
     };
@@ -171,35 +185,11 @@
             <Text style={styles.fieldLabel}>VREME</Text>
             <TextInput
               value={time}
-              onChangeText={setTime}
+              onChangeText={(value) => setTime(formatTime(value))}
               placeholder="18:00"
               placeholderTextColor={Colors.inkFaint}
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>TRAJANJE (MIN)</Text>
-            <TextInput
-              value={durationMin?.toString() ?? ""}
-              onChangeText={(value) =>
-                setDurationMin(
-                  value === "" ? null : Number(value.replace(/\D/g, "")),
-                )
-              }
               keyboardType="number-pad"
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-        </View>
-
-        <View style={styles.fieldRow}>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>SALA</Text>
-            <TextInput
-              value={room}
-              onChangeText={setRoom}
+              maxLength={5}
               editable={!submitting}
               style={styles.input}
             />
@@ -254,8 +244,12 @@
           </Pressable>
           <Pressable
             onPress={() => void submit()}
-            disabled={submitting}
-            style={[styles.saveButton, submitting && styles.buttonDisabled]}
+            disabled={submitting || !TIME_PATTERN.test(time.trim())}
+            style={[
+              styles.saveButton,
+              (submitting || !TIME_PATTERN.test(time.trim())) &&
+                styles.buttonDisabled,
+            ]}
           >
             {submitting ? (
               <ActivityIndicator color={Colors.surface} />
diff --git a/app/profile.tsx b/app/profile.tsx
index 799b71f8e307cbf3a41a1bf6b20ec8ef2690ad6f..790b7d86082f4b0eaca59eb77c0739f7fb1b4e27
--- a/app/profile.tsx
+++ b/app/profile.tsx
@@ -8,7 +8,6 @@
 import { FontFamilies, Typography } from "@/constants/typography";
 import { useAuth } from "@/hooks/useAuth";
 import { useTrainings } from "@/hooks/useTrainings";
-import { clampWeeklyLimit } from "@/utils/limits";
 import { getCurrentWeekDates } from "@/utils/week";
 
 const DAY_LABELS: Record<Day, string> = {
@@ -26,8 +25,9 @@
 
 export default function ProfileScreen() {
   const router = useRouter();
-  const { logout, profile, session, updateProfile } = useAuth();
+  const { logout, profile, session } = useAuth();
   const { bookedCount, trainings } = useTrainings();
+  const isAdmin = profile?.role === "admin";
   const weekDates = getCurrentWeekDates();
   const max = profile?.max_sessions_per_week ?? 0;
   const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;
@@ -55,15 +55,7 @@
 
       return dayDifference || a.time.localeCompare(b.time);
     });
-
-  const changeLimit = (delta: number) => {
-    const newValue = clampWeeklyLimit(max, delta, bookedCount);
 
-    if (newValue !== max) {
-      void updateProfile({ max_sessions_per_week: newValue });
-    }
-  };
-
   return (
     <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
       <View style={styles.navBar}>
@@ -92,15 +84,19 @@
               <Text style={styles.initials}>{initials || "P"}</Text>
             </View>
           </View>
-          <Text style={styles.name}>{fullName || "Perun član"}</Text>
-          {/* Inferred placeholder: Profile has no created_at field. */}
+          <Text style={styles.name}>
+            {fullName || (isAdmin ? "Perun admin" : "Perun član")}
+          </Text>
           <View style={styles.membershipChip}>
-            <Text style={styles.membershipText}>ČLAN OD MAR 2024.</Text>
+            <Text style={styles.membershipText}>
+              {isAdmin ? "ADMIN" : "ČLAN OD MAR 2024."}
+            </Text>
           </View>
         </View>
 
-        {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
-        <View style={styles.statsRow}>
+        {!isAdmin && <>
+          {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
+          <View style={styles.statsRow}>
           <View style={styles.statTile}>
             <Text style={styles.placeholderMarker}>PRIMER</Text>
             <Text style={[styles.statFigure, styles.burgundyStat]}>48</Text>
@@ -111,70 +107,26 @@
             <Text style={[styles.statFigure, styles.sageStat]}>5</Text>
             <Text style={styles.statLabel}>nedelja u nizu</Text>
           </View>
-        </View>
+          </View>
 
-        <View style={styles.limitCard}>
-          <View style={styles.limitHeader}>
-            <View style={styles.limitHeaderCopy}>
+          <View style={styles.limitCard}>
+            <View style={styles.limitHeader}>
               <Text style={styles.limitTitle}>Nedeljni limit</Text>
-              <Text style={styles.limitSubtitle}>
-                Maksimalno treninga po nedelji
+              <Text style={styles.usageValue}>
+                {bookedCount} / {max} ove nedelje
               </Text>
             </View>
-            <View style={styles.stepper}>
-              <Pressable
-                accessibilityLabel="Smanji nedeljni limit"
-                accessibilityRole="button"
-                disabled={max <= bookedCount}
-                onPress={() => changeLimit(-1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max <= bookedCount && styles.disabledStepperButton,
-                  ]}
-                >
-                  −
-                </Text>
-              </Pressable>
-              <Text style={styles.stepperValue}>{max}</Text>
-              <Pressable
-                accessibilityLabel="Povećaj nedeljni limit"
-                accessibilityRole="button"
-                disabled={max >= 7}
-                onPress={() => changeLimit(1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max >= 7 && styles.disabledStepperButton,
-                  ]}
-                >
-                  +
-                </Text>
-              </Pressable>
+            <View style={styles.track}>
+              <View style={[styles.fill, { width: `${progress}%` }]}>
+                <View style={styles.fillHighlight} />
+              </View>
             </View>
           </View>
 
-          <View style={styles.usageRow}>
-            <Text style={styles.usageLabel}>ISKORIŠĆENO OVE NEDELJE</Text>
-            <Text style={styles.usageValue}>
-              {bookedCount} / {max}
-            </Text>
-          </View>
-          <View style={styles.track}>
-            <View style={[styles.fill, { width: `${progress}%` }]}>
-              <View style={styles.fillHighlight} />
-            </View>
-          </View>
-        </View>
-
-        <Text style={styles.sessionsSectionTitle}>
-          MOJI TERMINI OVE NEDELJE
-        </Text>
-        <View style={styles.sessionsList}>
+          <Text style={styles.sessionsSectionTitle}>
+            MOJI TERMINI OVE NEDELJE
+          </Text>
+          <View style={styles.sessionsList}>
           {bookedSessions.map((training) => {
             const day = training.day_of_week as Day;
             const dateNumber = String(weekDates[day].getUTCDate()).padStart(
@@ -203,7 +155,8 @@
               </View>
             );
           })}
-        </View>
+          </View>
+        </>}
 
         <View style={styles.logoutContainer}>
           <Pressable
@@ -374,61 +327,12 @@
     alignItems: "center",
     flexDirection: "row",
     justifyContent: "space-between",
-  },
-  limitHeaderCopy: {
-    flex: 1,
-    paddingRight: 10,
   },
   limitTitle: {
     color: Colors.ink,
     fontFamily: FontFamilies.hanken[700],
     fontSize: 14.5,
-    fontWeight: "700",
-  },
-  limitSubtitle: {
-    color: Colors.inkMuted,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 12,
-    fontWeight: "600",
-    marginTop: 2,
-  },
-  stepper: {
-    alignItems: "center",
-    backgroundColor: Colors.surfaceMuted,
-    borderColor: "#EFE3D2",
-    borderRadius: Radii.tile[14],
-    borderWidth: 1,
-    flexDirection: "row",
-    gap: 14,
-    paddingHorizontal: 12,
-    paddingVertical: 7,
-  },
-  stepperButton: {
-    color: Colors.burgundy,
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 18,
     fontWeight: "700",
-  },
-  disabledStepperButton: {
-    opacity: 0.3,
-  },
-  stepperValue: {
-    color: Colors.ink,
-    fontFamily: FontFamilies.bricolage[800],
-    fontSize: 18,
-    fontWeight: "800",
-    minWidth: 14,
-    textAlign: "center",
-  },
-  usageRow: {
-    alignItems: "baseline",
-    flexDirection: "row",
-    justifyContent: "space-between",
-    marginTop: 16,
-  },
-  usageLabel: {
-    ...Typography.microLabelWide,
-    color: Colors.inkFaint,
   },
   usageValue: {
     color: Colors.inkMuted,
diff --git a/src/components/TrainingCard.tsx b/src/components/TrainingCard.tsx
index 0266c0c6c9ac88cf3019e5e52465866469aa195f..9a2cb1ab0e3adb63f004951e4881ce1dfbbe2631
--- a/src/components/TrainingCard.tsx
+++ b/src/components/TrainingCard.tsx
@@ -69,9 +69,6 @@
             <Text style={[styles.time, fullAndNotBooked && styles.fullTime]}>
               {training.time.slice(0, 5)}
             </Text>
-            <Text style={[styles.duration, fullAndNotBooked && styles.fullMeta]}>
-              60 min
-            </Text>
           </View>
 
           <View
@@ -90,7 +87,7 @@
               {training.title}
             </Text>
             <Text style={[styles.category, fullAndNotBooked && styles.fullTime]}>
-              Grupni · Sala A
+              Grupni
             </Text>
           </View>
 
@@ -271,13 +268,6 @@
     color: Colors.ink,
     lineHeight: 21,
   },
-  duration: {
-    color: Colors.inkFaint,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 10.5,
-    fontWeight: "600",
-    marginTop: 4,
-  },
   divider: {
     alignSelf: "stretch",
     backgroundColor: Colors.border,
@@ -304,9 +294,6 @@
   },
   fullTime: {
     color: "#9A9098",
-  },
-  fullMeta: {
-    color: "#ADA3AC",
   },
   fullTitle: {
     color: "#6E6670",
diff --git a/src/components/admin/StatTile.tsx b/src/components/admin/StatTile.tsx
index f89911629950685fc1017589872392a2abfdcc70..a1ebd8dd9c9c273fe7f42cb483fca30ca57a0aac
--- a/src/components/admin/StatTile.tsx
+++ b/src/components/admin/StatTile.tsx
@@ -23,6 +23,7 @@
 
 const styles = StyleSheet.create({
   tile: {
+    flex: 1,
     backgroundColor: Colors.surface,
     borderColor: Colors.border,
     borderWidth: 1,

exec
/bin/zsh -lc "git diff --check -- 'app/(admin)/training/[id].tsx' src/components/TrainingCard.tsx 'app/(admin)/(tabs)/index.tsx' 'app/(admin)/(tabs)/stats.tsx' 'app/(admin)/(tabs)/users.tsx' app/profile.tsx src/components/admin/StatTile.tsx; git diff --stat -- 'app/(admin)/training/[id].tsx' src/components/TrainingCard.tsx 'app/(admin)/(tabs)/index.tsx' 'app/(admin)/(tabs)/stats.tsx' 'app/(admin)/(tabs)/users.tsx' app/profile.tsx src/components/admin/StatTile.tsx; git diff -- 'app/(admin)/training/[id].tsx' src/components/TrainingCard.tsx 'app/(admin)/(tabs)/index.tsx' 'app/(admin)/(tabs)/stats.tsx' 'app/(admin)/(tabs)/users.tsx' app/profile.tsx src/components/admin/StatTile.tsx" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
 app/(admin)/(tabs)/index.tsx      |   1 +
 app/(admin)/(tabs)/stats.tsx      |   1 +
 app/(admin)/(tabs)/users.tsx      |  23 +++++-
 app/(admin)/training/[id].tsx     |  66 ++++++++---------
 app/profile.tsx                   | 148 +++++++-------------------------------
 src/components/TrainingCard.tsx   |  15 +---
 src/components/admin/StatTile.tsx |   1 +
 7 files changed, 82 insertions(+), 173 deletions(-)
diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 9bbdc13..d1e5415 100644
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -242,6 +242,7 @@ const styles = StyleSheet.create({
     gap: 11,
   },
   tileRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 11,
   },
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index 2354245..f268a63 100644
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -255,6 +255,7 @@ const styles = StyleSheet.create({
     color: "#4E7A5C",
   },
   secondaryRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 12,
   },
diff --git a/app/(admin)/(tabs)/users.tsx b/app/(admin)/(tabs)/users.tsx
index 474ea60..2720d5d 100644
--- a/app/(admin)/(tabs)/users.tsx
+++ b/app/(admin)/(tabs)/users.tsx
@@ -11,7 +11,7 @@ import {
   View,
 } from "react-native";
 
-import { FilterChips, UserRow } from "@/components/admin";
+import { FilterChips, Toggle, UserRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
@@ -44,6 +44,7 @@ export default function KorisniciScreen() {
   const [lastName, setLastName] = useState("");
   const [role, setRole] = useState<UserRole>("user");
   const [maxSessions, setMaxSessions] = useState(0);
+  const [enabled, setEnabled] = useState(true);
   const [saving, setSaving] = useState(false);
 
   const fetchUsers = useCallback(async () => {
@@ -85,6 +86,7 @@ export default function KorisniciScreen() {
     setLastName(user.last_name ?? "");
     setRole(user.role);
     setMaxSessions(user.max_sessions_per_week);
+    setEnabled(user.enabled ?? true);
   };
 
   const closeEditModal = () => {
@@ -99,6 +101,7 @@ export default function KorisniciScreen() {
       last_name: lastName.trim(),
       role,
       max_sessions_per_week: maxSessions,
+      enabled,
     };
 
     setSaving(true);
@@ -271,6 +274,15 @@ export default function KorisniciScreen() {
               </View>
             </View>
 
+            <View style={styles.toggleRow}>
+              <Text style={styles.fieldLabel}>AKTIVAN</Text>
+              <Toggle
+                value={enabled}
+                onValueChange={setEnabled}
+                disabled={saving}
+              />
+            </View>
+
             <View style={styles.modalFooter}>
               <Pressable
                 onPress={closeEditModal}
@@ -422,6 +434,15 @@ const styles = StyleSheet.create({
     fontWeight: "700",
     color: Colors.ink,
   },
+  toggleRow: {
+    alignItems: "center",
+    borderColor: Colors.fieldBorder,
+    borderRadius: Radii.tile[14],
+    borderWidth: 1,
+    flexDirection: "row",
+    justifyContent: "space-between",
+    padding: Spacing.cardPadding,
+  },
   modalFooter: {
     flexDirection: "row",
     gap: 10,
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 63f7493..de3d7bf 100644
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -35,6 +35,16 @@ const DAY_OPTIONS: { key: Day; label: string }[] = TRAINING_DAYS.map((day) => ({
   }[day],
 }));
 
+const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
+
+const formatTime = (value: string) => {
+  const digits = value.replace(/\D/g, "").slice(0, 4);
+
+  return digits.length > 2
+    ? `${digits.slice(0, 2)}:${digits.slice(2)}`
+    : digits;
+};
+
 export default function TrainingDetailScreen() {
   const router = useRouter();
   const insets = useSafeAreaInsets();
@@ -45,8 +55,6 @@ export default function TrainingDetailScreen() {
   const [title, setTitle] = useState("");
   const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
   const [time, setTime] = useState("");
-  const [room, setRoom] = useState("");
-  const [durationMin, setDurationMin] = useState<number | null>(null);
   const [maxParticipants, setMaxParticipants] = useState(10);
   const [isOpen, setIsOpen] = useState(true);
   const [submitting, setSubmitting] = useState(false);
@@ -61,9 +69,7 @@ export default function TrainingDetailScreen() {
         ? (training.day_of_week as Day)
         : "monday",
     );
-    setTime(training.time);
-    setRoom(training.room ?? "");
-    setDurationMin(training.duration_min);
+    setTime(formatTime(training.time));
     setMaxParticipants(Math.min(50, Math.max(1, training.max_participants)));
     setIsOpen(training.is_open);
     setInitializedId(training.id);
@@ -73,7 +79,7 @@ export default function TrainingDetailScreen() {
     const normalizedTitle = title.trim();
     const normalizedTime = time.trim();
 
-    if (!normalizedTitle || !normalizedTime || maxParticipants < 1) {
+    if (!normalizedTitle || maxParticipants < 1) {
       Alert.alert(
         "Proverite podatke",
         "Naziv, vreme i najmanje jedan učesnik su obavezni.",
@@ -81,13 +87,21 @@ export default function TrainingDetailScreen() {
       return;
     }
 
+    if (!TIME_PATTERN.test(normalizedTime)) {
+      Alert.alert(
+        "Proverite vreme",
+        "Vreme mora biti u formatu HH:MM (00:00–23:59).",
+      );
+      return;
+    }
+
     const input: UpsertSessionInput = {
       id: isNew ? null : id,
       title: normalizedTitle,
       day_of_week: dayOfWeek,
       time: normalizedTime,
-      room: room.trim() || null,
-      duration_min: durationMin,
+      room: null,
+      duration_min: null,
       max_participants: maxParticipants,
       is_open: isOpen,
     };
@@ -171,35 +185,11 @@ export default function TrainingDetailScreen() {
             <Text style={styles.fieldLabel}>VREME</Text>
             <TextInput
               value={time}
-              onChangeText={setTime}
+              onChangeText={(value) => setTime(formatTime(value))}
               placeholder="18:00"
               placeholderTextColor={Colors.inkFaint}
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>TRAJANJE (MIN)</Text>
-            <TextInput
-              value={durationMin?.toString() ?? ""}
-              onChangeText={(value) =>
-                setDurationMin(
-                  value === "" ? null : Number(value.replace(/\D/g, "")),
-                )
-              }
               keyboardType="number-pad"
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-        </View>
-
-        <View style={styles.fieldRow}>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>SALA</Text>
-            <TextInput
-              value={room}
-              onChangeText={setRoom}
+              maxLength={5}
               editable={!submitting}
               style={styles.input}
             />
@@ -254,8 +244,12 @@ export default function TrainingDetailScreen() {
           </Pressable>
           <Pressable
             onPress={() => void submit()}
-            disabled={submitting}
-            style={[styles.saveButton, submitting && styles.buttonDisabled]}
+            disabled={submitting || !TIME_PATTERN.test(time.trim())}
+            style={[
+              styles.saveButton,
+              (submitting || !TIME_PATTERN.test(time.trim())) &&
+                styles.buttonDisabled,
+            ]}
           >
             {submitting ? (
               <ActivityIndicator color={Colors.surface} />
diff --git a/app/profile.tsx b/app/profile.tsx
index 799b71f..790b7d8 100644
--- a/app/profile.tsx
+++ b/app/profile.tsx
@@ -8,7 +8,6 @@ import { Radii, Shadows } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
 import { useAuth } from "@/hooks/useAuth";
 import { useTrainings } from "@/hooks/useTrainings";
-import { clampWeeklyLimit } from "@/utils/limits";
 import { getCurrentWeekDates } from "@/utils/week";
 
 const DAY_LABELS: Record<Day, string> = {
@@ -26,8 +25,9 @@ const isTrainingDay = (day: string): day is Day =>
 
 export default function ProfileScreen() {
   const router = useRouter();
-  const { logout, profile, session, updateProfile } = useAuth();
+  const { logout, profile, session } = useAuth();
   const { bookedCount, trainings } = useTrainings();
+  const isAdmin = profile?.role === "admin";
   const weekDates = getCurrentWeekDates();
   const max = profile?.max_sessions_per_week ?? 0;
   const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;
@@ -56,14 +56,6 @@ export default function ProfileScreen() {
       return dayDifference || a.time.localeCompare(b.time);
     });
 
-  const changeLimit = (delta: number) => {
-    const newValue = clampWeeklyLimit(max, delta, bookedCount);
-
-    if (newValue !== max) {
-      void updateProfile({ max_sessions_per_week: newValue });
-    }
-  };
-
   return (
     <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
       <View style={styles.navBar}>
@@ -92,15 +84,19 @@ export default function ProfileScreen() {
               <Text style={styles.initials}>{initials || "P"}</Text>
             </View>
           </View>
-          <Text style={styles.name}>{fullName || "Perun član"}</Text>
-          {/* Inferred placeholder: Profile has no created_at field. */}
+          <Text style={styles.name}>
+            {fullName || (isAdmin ? "Perun admin" : "Perun član")}
+          </Text>
           <View style={styles.membershipChip}>
-            <Text style={styles.membershipText}>ČLAN OD MAR 2024.</Text>
+            <Text style={styles.membershipText}>
+              {isAdmin ? "ADMIN" : "ČLAN OD MAR 2024."}
+            </Text>
           </View>
         </View>
 
-        {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
-        <View style={styles.statsRow}>
+        {!isAdmin && <>
+          {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
+          <View style={styles.statsRow}>
           <View style={styles.statTile}>
             <Text style={styles.placeholderMarker}>PRIMER</Text>
             <Text style={[styles.statFigure, styles.burgundyStat]}>48</Text>
@@ -111,70 +107,26 @@ export default function ProfileScreen() {
             <Text style={[styles.statFigure, styles.sageStat]}>5</Text>
             <Text style={styles.statLabel}>nedelja u nizu</Text>
           </View>
-        </View>
+          </View>
 
-        <View style={styles.limitCard}>
-          <View style={styles.limitHeader}>
-            <View style={styles.limitHeaderCopy}>
+          <View style={styles.limitCard}>
+            <View style={styles.limitHeader}>
               <Text style={styles.limitTitle}>Nedeljni limit</Text>
-              <Text style={styles.limitSubtitle}>
-                Maksimalno treninga po nedelji
+              <Text style={styles.usageValue}>
+                {bookedCount} / {max} ove nedelje
               </Text>
             </View>
-            <View style={styles.stepper}>
-              <Pressable
-                accessibilityLabel="Smanji nedeljni limit"
-                accessibilityRole="button"
-                disabled={max <= bookedCount}
-                onPress={() => changeLimit(-1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max <= bookedCount && styles.disabledStepperButton,
-                  ]}
-                >
-                  −
-                </Text>
-              </Pressable>
-              <Text style={styles.stepperValue}>{max}</Text>
-              <Pressable
-                accessibilityLabel="Povećaj nedeljni limit"
-                accessibilityRole="button"
-                disabled={max >= 7}
-                onPress={() => changeLimit(1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max >= 7 && styles.disabledStepperButton,
-                  ]}
-                >
-                  +
-                </Text>
-              </Pressable>
-            </View>
-          </View>
-
-          <View style={styles.usageRow}>
-            <Text style={styles.usageLabel}>ISKORIŠĆENO OVE NEDELJE</Text>
-            <Text style={styles.usageValue}>
-              {bookedCount} / {max}
-            </Text>
-          </View>
-          <View style={styles.track}>
-            <View style={[styles.fill, { width: `${progress}%` }]}>
-              <View style={styles.fillHighlight} />
+            <View style={styles.track}>
+              <View style={[styles.fill, { width: `${progress}%` }]}>
+                <View style={styles.fillHighlight} />
+              </View>
             </View>
           </View>
-        </View>
 
-        <Text style={styles.sessionsSectionTitle}>
-          MOJI TERMINI OVE NEDELJE
-        </Text>
-        <View style={styles.sessionsList}>
+          <Text style={styles.sessionsSectionTitle}>
+            MOJI TERMINI OVE NEDELJE
+          </Text>
+          <View style={styles.sessionsList}>
           {bookedSessions.map((training) => {
             const day = training.day_of_week as Day;
             const dateNumber = String(weekDates[day].getUTCDate()).padStart(
@@ -203,7 +155,8 @@ export default function ProfileScreen() {
               </View>
             );
           })}
-        </View>
+          </View>
+        </>}
 
         <View style={styles.logoutContainer}>
           <Pressable
@@ -375,61 +328,12 @@ const styles = StyleSheet.create({
     flexDirection: "row",
     justifyContent: "space-between",
   },
-  limitHeaderCopy: {
-    flex: 1,
-    paddingRight: 10,
-  },
   limitTitle: {
     color: Colors.ink,
     fontFamily: FontFamilies.hanken[700],
     fontSize: 14.5,
     fontWeight: "700",
   },
-  limitSubtitle: {
-    color: Colors.inkMuted,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 12,
-    fontWeight: "600",
-    marginTop: 2,
-  },
-  stepper: {
-    alignItems: "center",
-    backgroundColor: Colors.surfaceMuted,
-    borderColor: "#EFE3D2",
-    borderRadius: Radii.tile[14],
-    borderWidth: 1,
-    flexDirection: "row",
-    gap: 14,
-    paddingHorizontal: 12,
-    paddingVertical: 7,
-  },
-  stepperButton: {
-    color: Colors.burgundy,
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 18,
-    fontWeight: "700",
-  },
-  disabledStepperButton: {
-    opacity: 0.3,
-  },
-  stepperValue: {
-    color: Colors.ink,
-    fontFamily: FontFamilies.bricolage[800],
-    fontSize: 18,
-    fontWeight: "800",
-    minWidth: 14,
-    textAlign: "center",
-  },
-  usageRow: {
-    alignItems: "baseline",
-    flexDirection: "row",
-    justifyContent: "space-between",
-    marginTop: 16,
-  },
-  usageLabel: {
-    ...Typography.microLabelWide,
-    color: Colors.inkFaint,
-  },
   usageValue: {
     color: Colors.inkMuted,
     fontFamily: FontFamilies.hanken[600],
diff --git a/src/components/TrainingCard.tsx b/src/components/TrainingCard.tsx
index 0266c0c..9a2cb1a 100644
--- a/src/components/TrainingCard.tsx
+++ b/src/components/TrainingCard.tsx
@@ -69,9 +69,6 @@ export function TrainingCard({ training }: { training: Training }) {
             <Text style={[styles.time, fullAndNotBooked && styles.fullTime]}>
               {training.time.slice(0, 5)}
             </Text>
-            <Text style={[styles.duration, fullAndNotBooked && styles.fullMeta]}>
-              60 min
-            </Text>
           </View>
 
           <View
@@ -90,7 +87,7 @@ export function TrainingCard({ training }: { training: Training }) {
               {training.title}
             </Text>
             <Text style={[styles.category, fullAndNotBooked && styles.fullTime]}>
-              Grupni · Sala A
+              Grupni
             </Text>
           </View>
 
@@ -271,13 +268,6 @@ const styles = StyleSheet.create({
     color: Colors.ink,
     lineHeight: 21,
   },
-  duration: {
-    color: Colors.inkFaint,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 10.5,
-    fontWeight: "600",
-    marginTop: 4,
-  },
   divider: {
     alignSelf: "stretch",
     backgroundColor: Colors.border,
@@ -305,9 +295,6 @@ const styles = StyleSheet.create({
   fullTime: {
     color: "#9A9098",
   },
-  fullMeta: {
-    color: "#ADA3AC",
-  },
   fullTitle: {
     color: "#6E6670",
   },
diff --git a/src/components/admin/StatTile.tsx b/src/components/admin/StatTile.tsx
index f899116..a1ebd8d 100644
--- a/src/components/admin/StatTile.tsx
+++ b/src/components/admin/StatTile.tsx
@@ -23,6 +23,7 @@ export default function StatTile({ figure, label, figureColor = Colors.ink, delt
 
 const styles = StyleSheet.create({
   tile: {
+    flex: 1,
     backgroundColor: Colors.surface,
     borderColor: Colors.border,
     borderWidth: 1,

diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 9bbdc139ee145ef44f2e9213834d3fa01e054538..d1e54156c394b7d46c02642411b2fd9a93e44cdd
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -242,6 +242,7 @@
     gap: 11,
   },
   tileRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 11,
   },
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index 23542459a42a8a534685faae85a0dfe5a6e77157..f268a63f9095c10157b70956ea2820eb803bc7a8
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -255,6 +255,7 @@
     color: "#4E7A5C",
   },
   secondaryRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 12,
   },
diff --git a/app/(admin)/(tabs)/users.tsx b/app/(admin)/(tabs)/users.tsx
index 474ea6041ae5182a684fddd9dc2ed3516a9972e3..2720d5d075f5a7d65d2316aeb2477fe8f0766157
--- a/app/(admin)/(tabs)/users.tsx
+++ b/app/(admin)/(tabs)/users.tsx
@@ -11,7 +11,7 @@
   View,
 } from "react-native";
 
-import { FilterChips, UserRow } from "@/components/admin";
+import { FilterChips, Toggle, UserRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
@@ -44,6 +44,7 @@
   const [lastName, setLastName] = useState("");
   const [role, setRole] = useState<UserRole>("user");
   const [maxSessions, setMaxSessions] = useState(0);
+  const [enabled, setEnabled] = useState(true);
   const [saving, setSaving] = useState(false);
 
   const fetchUsers = useCallback(async () => {
@@ -85,6 +86,7 @@
     setLastName(user.last_name ?? "");
     setRole(user.role);
     setMaxSessions(user.max_sessions_per_week);
+    setEnabled(user.enabled ?? true);
   };
 
   const closeEditModal = () => {
@@ -99,6 +101,7 @@
       last_name: lastName.trim(),
       role,
       max_sessions_per_week: maxSessions,
+      enabled,
     };
 
     setSaving(true);
@@ -271,6 +274,15 @@
               </View>
             </View>
 
+            <View style={styles.toggleRow}>
+              <Text style={styles.fieldLabel}>AKTIVAN</Text>
+              <Toggle
+                value={enabled}
+                onValueChange={setEnabled}
+                disabled={saving}
+              />
+            </View>
+
             <View style={styles.modalFooter}>
               <Pressable
                 onPress={closeEditModal}
@@ -422,6 +434,15 @@
     fontWeight: "700",
     color: Colors.ink,
   },
+  toggleRow: {
+    alignItems: "center",
+    borderColor: Colors.fieldBorder,
+    borderRadius: Radii.tile[14],
+    borderWidth: 1,
+    flexDirection: "row",
+    justifyContent: "space-between",
+    padding: Spacing.cardPadding,
+  },
   modalFooter: {
     flexDirection: "row",
     gap: 10,
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 63f74934074ec361d3383d1bebe96ac5e5d71acb..de3d7bf172771f30084be8131eb8bbc1da719101
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -35,6 +35,16 @@
   }[day],
 }));
 
+const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
+
+const formatTime = (value: string) => {
+  const digits = value.replace(/\D/g, "").slice(0, 4);
+
+  return digits.length > 2
+    ? `${digits.slice(0, 2)}:${digits.slice(2)}`
+    : digits;
+};
+
 export default function TrainingDetailScreen() {
   const router = useRouter();
   const insets = useSafeAreaInsets();
@@ -45,8 +55,6 @@
   const [title, setTitle] = useState("");
   const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
   const [time, setTime] = useState("");
-  const [room, setRoom] = useState("");
-  const [durationMin, setDurationMin] = useState<number | null>(null);
   const [maxParticipants, setMaxParticipants] = useState(10);
   const [isOpen, setIsOpen] = useState(true);
   const [submitting, setSubmitting] = useState(false);
@@ -61,9 +69,7 @@
         ? (training.day_of_week as Day)
         : "monday",
     );
-    setTime(training.time);
-    setRoom(training.room ?? "");
-    setDurationMin(training.duration_min);
+    setTime(formatTime(training.time));
     setMaxParticipants(Math.min(50, Math.max(1, training.max_participants)));
     setIsOpen(training.is_open);
     setInitializedId(training.id);
@@ -73,7 +79,7 @@
     const normalizedTitle = title.trim();
     const normalizedTime = time.trim();
 
-    if (!normalizedTitle || !normalizedTime || maxParticipants < 1) {
+    if (!normalizedTitle || maxParticipants < 1) {
       Alert.alert(
         "Proverite podatke",
         "Naziv, vreme i najmanje jedan učesnik su obavezni.",
@@ -81,13 +87,21 @@
       return;
     }
 
+    if (!TIME_PATTERN.test(normalizedTime)) {
+      Alert.alert(
+        "Proverite vreme",
+        "Vreme mora biti u formatu HH:MM (00:00–23:59).",
+      );
+      return;
+    }
+
     const input: UpsertSessionInput = {
       id: isNew ? null : id,
       title: normalizedTitle,
       day_of_week: dayOfWeek,
       time: normalizedTime,
-      room: room.trim() || null,
-      duration_min: durationMin,
+      room: null,
+      duration_min: null,
       max_participants: maxParticipants,
       is_open: isOpen,
     };
@@ -171,35 +185,11 @@
             <Text style={styles.fieldLabel}>VREME</Text>
             <TextInput
               value={time}
-              onChangeText={setTime}
+              onChangeText={(value) => setTime(formatTime(value))}
               placeholder="18:00"
               placeholderTextColor={Colors.inkFaint}
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>TRAJANJE (MIN)</Text>
-            <TextInput
-              value={durationMin?.toString() ?? ""}
-              onChangeText={(value) =>
-                setDurationMin(
-                  value === "" ? null : Number(value.replace(/\D/g, "")),
-                )
-              }
               keyboardType="number-pad"
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-        </View>
-
-        <View style={styles.fieldRow}>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>SALA</Text>
-            <TextInput
-              value={room}
-              onChangeText={setRoom}
+              maxLength={5}
               editable={!submitting}
               style={styles.input}
             />
@@ -254,8 +244,12 @@
           </Pressable>
           <Pressable
             onPress={() => void submit()}
-            disabled={submitting}
-            style={[styles.saveButton, submitting && styles.buttonDisabled]}
+            disabled={submitting || !TIME_PATTERN.test(time.trim())}
+            style={[
+              styles.saveButton,
+              (submitting || !TIME_PATTERN.test(time.trim())) &&
+                styles.buttonDisabled,
+            ]}
           >
             {submitting ? (
               <ActivityIndicator color={Colors.surface} />
diff --git a/app/profile.tsx b/app/profile.tsx
index 799b71f8e307cbf3a41a1bf6b20ec8ef2690ad6f..790b7d86082f4b0eaca59eb77c0739f7fb1b4e27
--- a/app/profile.tsx
+++ b/app/profile.tsx
@@ -8,7 +8,6 @@
 import { FontFamilies, Typography } from "@/constants/typography";
 import { useAuth } from "@/hooks/useAuth";
 import { useTrainings } from "@/hooks/useTrainings";
-import { clampWeeklyLimit } from "@/utils/limits";
 import { getCurrentWeekDates } from "@/utils/week";
 
 const DAY_LABELS: Record<Day, string> = {
@@ -26,8 +25,9 @@
 
 export default function ProfileScreen() {
   const router = useRouter();
-  const { logout, profile, session, updateProfile } = useAuth();
+  const { logout, profile, session } = useAuth();
   const { bookedCount, trainings } = useTrainings();
+  const isAdmin = profile?.role === "admin";
   const weekDates = getCurrentWeekDates();
   const max = profile?.max_sessions_per_week ?? 0;
   const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;
@@ -55,15 +55,7 @@
 
       return dayDifference || a.time.localeCompare(b.time);
     });
-
-  const changeLimit = (delta: number) => {
-    const newValue = clampWeeklyLimit(max, delta, bookedCount);
 
-    if (newValue !== max) {
-      void updateProfile({ max_sessions_per_week: newValue });
-    }
-  };
-
   return (
     <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
       <View style={styles.navBar}>
@@ -92,15 +84,19 @@
               <Text style={styles.initials}>{initials || "P"}</Text>
             </View>
           </View>
-          <Text style={styles.name}>{fullName || "Perun član"}</Text>
-          {/* Inferred placeholder: Profile has no created_at field. */}
+          <Text style={styles.name}>
+            {fullName || (isAdmin ? "Perun admin" : "Perun član")}
+          </Text>
           <View style={styles.membershipChip}>
-            <Text style={styles.membershipText}>ČLAN OD MAR 2024.</Text>
+            <Text style={styles.membershipText}>
+              {isAdmin ? "ADMIN" : "ČLAN OD MAR 2024."}
+            </Text>
           </View>
         </View>
 
-        {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
-        <View style={styles.statsRow}>
+        {!isAdmin && <>
+          {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
+          <View style={styles.statsRow}>
           <View style={styles.statTile}>
             <Text style={styles.placeholderMarker}>PRIMER</Text>
             <Text style={[styles.statFigure, styles.burgundyStat]}>48</Text>
@@ -111,70 +107,26 @@
             <Text style={[styles.statFigure, styles.sageStat]}>5</Text>
             <Text style={styles.statLabel}>nedelja u nizu</Text>
           </View>
-        </View>
+          </View>
 
-        <View style={styles.limitCard}>
-          <View style={styles.limitHeader}>
-            <View style={styles.limitHeaderCopy}>
+          <View style={styles.limitCard}>
+            <View style={styles.limitHeader}>
               <Text style={styles.limitTitle}>Nedeljni limit</Text>
-              <Text style={styles.limitSubtitle}>
-                Maksimalno treninga po nedelji
+              <Text style={styles.usageValue}>
+                {bookedCount} / {max} ove nedelje
               </Text>
             </View>
-            <View style={styles.stepper}>
-              <Pressable
-                accessibilityLabel="Smanji nedeljni limit"
-                accessibilityRole="button"
-                disabled={max <= bookedCount}
-                onPress={() => changeLimit(-1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max <= bookedCount && styles.disabledStepperButton,
-                  ]}
-                >
-                  −
-                </Text>
-              </Pressable>
-              <Text style={styles.stepperValue}>{max}</Text>
-              <Pressable
-                accessibilityLabel="Povećaj nedeljni limit"
-                accessibilityRole="button"
-                disabled={max >= 7}
-                onPress={() => changeLimit(1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max >= 7 && styles.disabledStepperButton,
-                  ]}
-                >
-                  +
-                </Text>
-              </Pressable>
+            <View style={styles.track}>
+              <View style={[styles.fill, { width: `${progress}%` }]}>
+                <View style={styles.fillHighlight} />
+              </View>
             </View>
           </View>
 
-          <View style={styles.usageRow}>
-            <Text style={styles.usageLabel}>ISKORIŠĆENO OVE NEDELJE</Text>
-            <Text style={styles.usageValue}>
-              {bookedCount} / {max}
-            </Text>
-          </View>
-          <View style={styles.track}>
-            <View style={[styles.fill, { width: `${progress}%` }]}>
-              <View style={styles.fillHighlight} />
-            </View>
-          </View>
-        </View>
-
-        <Text style={styles.sessionsSectionTitle}>
-          MOJI TERMINI OVE NEDELJE
-        </Text>
-        <View style={styles.sessionsList}>
+          <Text style={styles.sessionsSectionTitle}>
+            MOJI TERMINI OVE NEDELJE
+          </Text>
+          <View style={styles.sessionsList}>
           {bookedSessions.map((training) => {
             const day = training.day_of_week as Day;
             const dateNumber = String(weekDates[day].getUTCDate()).padStart(
@@ -203,7 +155,8 @@
               </View>
             );
           })}
-        </View>
+          </View>
+        </>}
 
         <View style={styles.logoutContainer}>
           <Pressable
@@ -374,61 +327,12 @@
     alignItems: "center",
     flexDirection: "row",
     justifyContent: "space-between",
-  },
-  limitHeaderCopy: {
-    flex: 1,
-    paddingRight: 10,
   },
   limitTitle: {
     color: Colors.ink,
     fontFamily: FontFamilies.hanken[700],
     fontSize: 14.5,
-    fontWeight: "700",
-  },
-  limitSubtitle: {
-    color: Colors.inkMuted,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 12,
-    fontWeight: "600",
-    marginTop: 2,
-  },
-  stepper: {
-    alignItems: "center",
-    backgroundColor: Colors.surfaceMuted,
-    borderColor: "#EFE3D2",
-    borderRadius: Radii.tile[14],
-    borderWidth: 1,
-    flexDirection: "row",
-    gap: 14,
-    paddingHorizontal: 12,
-    paddingVertical: 7,
-  },
-  stepperButton: {
-    color: Colors.burgundy,
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 18,
     fontWeight: "700",
-  },
-  disabledStepperButton: {
-    opacity: 0.3,
-  },
-  stepperValue: {
-    color: Colors.ink,
-    fontFamily: FontFamilies.bricolage[800],
-    fontSize: 18,
-    fontWeight: "800",
-    minWidth: 14,
-    textAlign: "center",
-  },
-  usageRow: {
-    alignItems: "baseline",
-    flexDirection: "row",
-    justifyContent: "space-between",
-    marginTop: 16,
-  },
-  usageLabel: {
-    ...Typography.microLabelWide,
-    color: Colors.inkFaint,
   },
   usageValue: {
     color: Colors.inkMuted,
diff --git a/src/components/TrainingCard.tsx b/src/components/TrainingCard.tsx
index 0266c0c6c9ac88cf3019e5e52465866469aa195f..9a2cb1ab0e3adb63f004951e4881ce1dfbbe2631
--- a/src/components/TrainingCard.tsx
+++ b/src/components/TrainingCard.tsx
@@ -69,9 +69,6 @@
             <Text style={[styles.time, fullAndNotBooked && styles.fullTime]}>
               {training.time.slice(0, 5)}
             </Text>
-            <Text style={[styles.duration, fullAndNotBooked && styles.fullMeta]}>
-              60 min
-            </Text>
           </View>
 
           <View
@@ -90,7 +87,7 @@
               {training.title}
             </Text>
             <Text style={[styles.category, fullAndNotBooked && styles.fullTime]}>
-              Grupni · Sala A
+              Grupni
             </Text>
           </View>
 
@@ -271,13 +268,6 @@
     color: Colors.ink,
     lineHeight: 21,
   },
-  duration: {
-    color: Colors.inkFaint,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 10.5,
-    fontWeight: "600",
-    marginTop: 4,
-  },
   divider: {
     alignSelf: "stretch",
     backgroundColor: Colors.border,
@@ -304,9 +294,6 @@
   },
   fullTime: {
     color: "#9A9098",
-  },
-  fullMeta: {
-    color: "#ADA3AC",
   },
   fullTitle: {
     color: "#6E6670",
diff --git a/src/components/admin/StatTile.tsx b/src/components/admin/StatTile.tsx
index f89911629950685fc1017589872392a2abfdcc70..a1ebd8dd9c9c273fe7f42cb483fca30ca57a0aac
--- a/src/components/admin/StatTile.tsx
+++ b/src/components/admin/StatTile.tsx
@@ -23,6 +23,7 @@
 
 const styles = StyleSheet.create({
   tile: {
+    flex: 1,
     backgroundColor: Colors.surface,
     borderColor: Colors.border,
     borderWidth: 1,

exec
/bin/zsh -lc "npx prettier --write 'app/(admin)/training/[id].tsx' src/components/TrainingCard.tsx 'app/(admin)/(tabs)/index.tsx' 'app/(admin)/(tabs)/stats.tsx' 'app/(admin)/(tabs)/users.tsx' app/profile.tsx src/components/admin/StatTile.tsx && npx tsc --noEmit" in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 9bbdc139ee145ef44f2e9213834d3fa01e054538..d1e54156c394b7d46c02642411b2fd9a93e44cdd
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -242,6 +242,7 @@
     gap: 11,
   },
   tileRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 11,
   },
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index 23542459a42a8a534685faae85a0dfe5a6e77157..f268a63f9095c10157b70956ea2820eb803bc7a8
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -255,6 +255,7 @@
     color: "#4E7A5C",
   },
   secondaryRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 12,
   },
diff --git a/app/(admin)/(tabs)/users.tsx b/app/(admin)/(tabs)/users.tsx
index 474ea6041ae5182a684fddd9dc2ed3516a9972e3..2720d5d075f5a7d65d2316aeb2477fe8f0766157
--- a/app/(admin)/(tabs)/users.tsx
+++ b/app/(admin)/(tabs)/users.tsx
@@ -11,7 +11,7 @@
   View,
 } from "react-native";
 
-import { FilterChips, UserRow } from "@/components/admin";
+import { FilterChips, Toggle, UserRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
@@ -44,6 +44,7 @@
   const [lastName, setLastName] = useState("");
   const [role, setRole] = useState<UserRole>("user");
   const [maxSessions, setMaxSessions] = useState(0);
+  const [enabled, setEnabled] = useState(true);
   const [saving, setSaving] = useState(false);
 
   const fetchUsers = useCallback(async () => {
@@ -85,6 +86,7 @@
     setLastName(user.last_name ?? "");
     setRole(user.role);
     setMaxSessions(user.max_sessions_per_week);
+    setEnabled(user.enabled ?? true);
   };
 
   const closeEditModal = () => {
@@ -99,6 +101,7 @@
       last_name: lastName.trim(),
       role,
       max_sessions_per_week: maxSessions,
+      enabled,
     };
 
     setSaving(true);
@@ -271,6 +274,15 @@
               </View>
             </View>
 
+            <View style={styles.toggleRow}>
+              <Text style={styles.fieldLabel}>AKTIVAN</Text>
+              <Toggle
+                value={enabled}
+                onValueChange={setEnabled}
+                disabled={saving}
+              />
+            </View>
+
             <View style={styles.modalFooter}>
               <Pressable
                 onPress={closeEditModal}
@@ -422,6 +434,15 @@
     fontWeight: "700",
     color: Colors.ink,
   },
+  toggleRow: {
+    alignItems: "center",
+    borderColor: Colors.fieldBorder,
+    borderRadius: Radii.tile[14],
+    borderWidth: 1,
+    flexDirection: "row",
+    justifyContent: "space-between",
+    padding: Spacing.cardPadding,
+  },
   modalFooter: {
     flexDirection: "row",
     gap: 10,
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 63f74934074ec361d3383d1bebe96ac5e5d71acb..de3d7bf172771f30084be8131eb8bbc1da719101
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -35,6 +35,16 @@
   }[day],
 }));
 
+const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
+
+const formatTime = (value: string) => {
+  const digits = value.replace(/\D/g, "").slice(0, 4);
+
+  return digits.length > 2
+    ? `${digits.slice(0, 2)}:${digits.slice(2)}`
+    : digits;
+};
+
 export default function TrainingDetailScreen() {
   const router = useRouter();
   const insets = useSafeAreaInsets();
@@ -45,8 +55,6 @@
   const [title, setTitle] = useState("");
   const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
   const [time, setTime] = useState("");
-  const [room, setRoom] = useState("");
-  const [durationMin, setDurationMin] = useState<number | null>(null);
   const [maxParticipants, setMaxParticipants] = useState(10);
   const [isOpen, setIsOpen] = useState(true);
   const [submitting, setSubmitting] = useState(false);
@@ -61,9 +69,7 @@
         ? (training.day_of_week as Day)
         : "monday",
     );
-    setTime(training.time);
-    setRoom(training.room ?? "");
-    setDurationMin(training.duration_min);
+    setTime(formatTime(training.time));
     setMaxParticipants(Math.min(50, Math.max(1, training.max_participants)));
     setIsOpen(training.is_open);
     setInitializedId(training.id);
@@ -73,7 +79,7 @@
     const normalizedTitle = title.trim();
     const normalizedTime = time.trim();
 
-    if (!normalizedTitle || !normalizedTime || maxParticipants < 1) {
+    if (!normalizedTitle || maxParticipants < 1) {
       Alert.alert(
         "Proverite podatke",
         "Naziv, vreme i najmanje jedan učesnik su obavezni.",
@@ -81,13 +87,21 @@
       return;
     }
 
+    if (!TIME_PATTERN.test(normalizedTime)) {
+      Alert.alert(
+        "Proverite vreme",
+        "Vreme mora biti u formatu HH:MM (00:00–23:59).",
+      );
+      return;
+    }
+
     const input: UpsertSessionInput = {
       id: isNew ? null : id,
       title: normalizedTitle,
       day_of_week: dayOfWeek,
       time: normalizedTime,
-      room: room.trim() || null,
-      duration_min: durationMin,
+      room: null,
+      duration_min: null,
       max_participants: maxParticipants,
       is_open: isOpen,
     };
@@ -171,35 +185,11 @@
             <Text style={styles.fieldLabel}>VREME</Text>
             <TextInput
               value={time}
-              onChangeText={setTime}
+              onChangeText={(value) => setTime(formatTime(value))}
               placeholder="18:00"
               placeholderTextColor={Colors.inkFaint}
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>TRAJANJE (MIN)</Text>
-            <TextInput
-              value={durationMin?.toString() ?? ""}
-              onChangeText={(value) =>
-                setDurationMin(
-                  value === "" ? null : Number(value.replace(/\D/g, "")),
-                )
-              }
               keyboardType="number-pad"
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-        </View>
-
-        <View style={styles.fieldRow}>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>SALA</Text>
-            <TextInput
-              value={room}
-              onChangeText={setRoom}
+              maxLength={5}
               editable={!submitting}
               style={styles.input}
             />
@@ -254,8 +244,12 @@
           </Pressable>
           <Pressable
             onPress={() => void submit()}
-            disabled={submitting}
-            style={[styles.saveButton, submitting && styles.buttonDisabled]}
+            disabled={submitting || !TIME_PATTERN.test(time.trim())}
+            style={[
+              styles.saveButton,
+              (submitting || !TIME_PATTERN.test(time.trim())) &&
+                styles.buttonDisabled,
+            ]}
           >
             {submitting ? (
               <ActivityIndicator color={Colors.surface} />
diff --git a/app/profile.tsx b/app/profile.tsx
index 799b71f8e307cbf3a41a1bf6b20ec8ef2690ad6f..790b7d86082f4b0eaca59eb77c0739f7fb1b4e27
--- a/app/profile.tsx
+++ b/app/profile.tsx
@@ -8,7 +8,6 @@
 import { FontFamilies, Typography } from "@/constants/typography";
 import { useAuth } from "@/hooks/useAuth";
 import { useTrainings } from "@/hooks/useTrainings";
-import { clampWeeklyLimit } from "@/utils/limits";
 import { getCurrentWeekDates } from "@/utils/week";
 
 const DAY_LABELS: Record<Day, string> = {
@@ -26,8 +25,9 @@
 
 export default function ProfileScreen() {
   const router = useRouter();
-  const { logout, profile, session, updateProfile } = useAuth();
+  const { logout, profile, session } = useAuth();
   const { bookedCount, trainings } = useTrainings();
+  const isAdmin = profile?.role === "admin";
   const weekDates = getCurrentWeekDates();
   const max = profile?.max_sessions_per_week ?? 0;
   const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;
@@ -55,15 +55,7 @@
 
       return dayDifference || a.time.localeCompare(b.time);
     });
-
-  const changeLimit = (delta: number) => {
-    const newValue = clampWeeklyLimit(max, delta, bookedCount);
 
-    if (newValue !== max) {
-      void updateProfile({ max_sessions_per_week: newValue });
-    }
-  };
-
   return (
     <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
       <View style={styles.navBar}>
@@ -92,15 +84,19 @@
               <Text style={styles.initials}>{initials || "P"}</Text>
             </View>
           </View>
-          <Text style={styles.name}>{fullName || "Perun član"}</Text>
-          {/* Inferred placeholder: Profile has no created_at field. */}
+          <Text style={styles.name}>
+            {fullName || (isAdmin ? "Perun admin" : "Perun član")}
+          </Text>
           <View style={styles.membershipChip}>
-            <Text style={styles.membershipText}>ČLAN OD MAR 2024.</Text>
+            <Text style={styles.membershipText}>
+              {isAdmin ? "ADMIN" : "ČLAN OD MAR 2024."}
+            </Text>
           </View>
         </View>
 
-        {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
-        <View style={styles.statsRow}>
+        {!isAdmin && <>
+          {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
+          <View style={styles.statsRow}>
           <View style={styles.statTile}>
             <Text style={styles.placeholderMarker}>PRIMER</Text>
             <Text style={[styles.statFigure, styles.burgundyStat]}>48</Text>
@@ -111,70 +107,26 @@
             <Text style={[styles.statFigure, styles.sageStat]}>5</Text>
             <Text style={styles.statLabel}>nedelja u nizu</Text>
           </View>
-        </View>
+          </View>
 
-        <View style={styles.limitCard}>
-          <View style={styles.limitHeader}>
-            <View style={styles.limitHeaderCopy}>
+          <View style={styles.limitCard}>
+            <View style={styles.limitHeader}>
               <Text style={styles.limitTitle}>Nedeljni limit</Text>
-              <Text style={styles.limitSubtitle}>
-                Maksimalno treninga po nedelji
+              <Text style={styles.usageValue}>
+                {bookedCount} / {max} ove nedelje
               </Text>
             </View>
-            <View style={styles.stepper}>
-              <Pressable
-                accessibilityLabel="Smanji nedeljni limit"
-                accessibilityRole="button"
-                disabled={max <= bookedCount}
-                onPress={() => changeLimit(-1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max <= bookedCount && styles.disabledStepperButton,
-                  ]}
-                >
-                  −
-                </Text>
-              </Pressable>
-              <Text style={styles.stepperValue}>{max}</Text>
-              <Pressable
-                accessibilityLabel="Povećaj nedeljni limit"
-                accessibilityRole="button"
-                disabled={max >= 7}
-                onPress={() => changeLimit(1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max >= 7 && styles.disabledStepperButton,
-                  ]}
-                >
-                  +
-                </Text>
-              </Pressable>
+            <View style={styles.track}>
+              <View style={[styles.fill, { width: `${progress}%` }]}>
+                <View style={styles.fillHighlight} />
+              </View>
             </View>
           </View>
 
-          <View style={styles.usageRow}>
-            <Text style={styles.usageLabel}>ISKORIŠĆENO OVE NEDELJE</Text>
-            <Text style={styles.usageValue}>
-              {bookedCount} / {max}
-            </Text>
-          </View>
-          <View style={styles.track}>
-            <View style={[styles.fill, { width: `${progress}%` }]}>
-              <View style={styles.fillHighlight} />
-            </View>
-          </View>
-        </View>
-
-        <Text style={styles.sessionsSectionTitle}>
-          MOJI TERMINI OVE NEDELJE
-        </Text>
-        <View style={styles.sessionsList}>
+          <Text style={styles.sessionsSectionTitle}>
+            MOJI TERMINI OVE NEDELJE
+          </Text>
+          <View style={styles.sessionsList}>
           {bookedSessions.map((training) => {
             const day = training.day_of_week as Day;
             const dateNumber = String(weekDates[day].getUTCDate()).padStart(
@@ -203,7 +155,8 @@
               </View>
             );
           })}
-        </View>
+          </View>
+        </>}
 
         <View style={styles.logoutContainer}>
           <Pressable
@@ -374,61 +327,12 @@
     alignItems: "center",
     flexDirection: "row",
     justifyContent: "space-between",
-  },
-  limitHeaderCopy: {
-    flex: 1,
-    paddingRight: 10,
   },
   limitTitle: {
     color: Colors.ink,
     fontFamily: FontFamilies.hanken[700],
     fontSize: 14.5,
-    fontWeight: "700",
-  },
-  limitSubtitle: {
-    color: Colors.inkMuted,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 12,
-    fontWeight: "600",
-    marginTop: 2,
-  },
-  stepper: {
-    alignItems: "center",
-    backgroundColor: Colors.surfaceMuted,
-    borderColor: "#EFE3D2",
-    borderRadius: Radii.tile[14],
-    borderWidth: 1,
-    flexDirection: "row",
-    gap: 14,
-    paddingHorizontal: 12,
-    paddingVertical: 7,
-  },
-  stepperButton: {
-    color: Colors.burgundy,
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 18,
     fontWeight: "700",
-  },
-  disabledStepperButton: {
-    opacity: 0.3,
-  },
-  stepperValue: {
-    color: Colors.ink,
-    fontFamily: FontFamilies.bricolage[800],
-    fontSize: 18,
-    fontWeight: "800",
-    minWidth: 14,
-    textAlign: "center",
-  },
-  usageRow: {
-    alignItems: "baseline",
-    flexDirection: "row",
-    justifyContent: "space-between",
-    marginTop: 16,
-  },
-  usageLabel: {
-    ...Typography.microLabelWide,
-    color: Colors.inkFaint,
   },
   usageValue: {
     color: Colors.inkMuted,
diff --git a/src/components/TrainingCard.tsx b/src/components/TrainingCard.tsx
index 0266c0c6c9ac88cf3019e5e52465866469aa195f..9a2cb1ab0e3adb63f004951e4881ce1dfbbe2631
--- a/src/components/TrainingCard.tsx
+++ b/src/components/TrainingCard.tsx
@@ -69,9 +69,6 @@
             <Text style={[styles.time, fullAndNotBooked && styles.fullTime]}>
               {training.time.slice(0, 5)}
             </Text>
-            <Text style={[styles.duration, fullAndNotBooked && styles.fullMeta]}>
-              60 min
-            </Text>
           </View>
 
           <View
@@ -90,7 +87,7 @@
               {training.title}
             </Text>
             <Text style={[styles.category, fullAndNotBooked && styles.fullTime]}>
-              Grupni · Sala A
+              Grupni
             </Text>
           </View>
 
@@ -271,13 +268,6 @@
     color: Colors.ink,
     lineHeight: 21,
   },
-  duration: {
-    color: Colors.inkFaint,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 10.5,
-    fontWeight: "600",
-    marginTop: 4,
-  },
   divider: {
     alignSelf: "stretch",
     backgroundColor: Colors.border,
@@ -304,9 +294,6 @@
   },
   fullTime: {
     color: "#9A9098",
-  },
-  fullMeta: {
-    color: "#ADA3AC",
   },
   fullTitle: {
     color: "#6E6670",
diff --git a/src/components/admin/StatTile.tsx b/src/components/admin/StatTile.tsx
index f89911629950685fc1017589872392a2abfdcc70..a1ebd8dd9c9c273fe7f42cb483fca30ca57a0aac
--- a/src/components/admin/StatTile.tsx
+++ b/src/components/admin/StatTile.tsx
@@ -23,6 +23,7 @@
 
 const styles = StyleSheet.create({
   tile: {
+    flex: 1,
     backgroundColor: Colors.surface,
     borderColor: Colors.border,
     borderWidth: 1,

 succeeded in 3017ms:
app/(admin)/training/[id].tsx 84ms (unchanged)
src/components/TrainingCard.tsx 29ms
app/(admin)/(tabs)/index.tsx 21ms (unchanged)
app/(admin)/(tabs)/stats.tsx 16ms (unchanged)
app/(admin)/(tabs)/users.tsx 26ms (unchanged)
app/profile.tsx 25ms
src/components/admin/StatTile.tsx 4ms

codex
TypeScript passes. I’m running the repository lint and test gates next; any pre-existing failures will be separated from failures caused by these seven files.
exec
/bin/zsh -lc 'npm run lint && npm test -- --runInBand' in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 9bbdc139ee145ef44f2e9213834d3fa01e054538..d1e54156c394b7d46c02642411b2fd9a93e44cdd
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -242,6 +242,7 @@
     gap: 11,
   },
   tileRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 11,
   },
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index 23542459a42a8a534685faae85a0dfe5a6e77157..f268a63f9095c10157b70956ea2820eb803bc7a8
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -255,6 +255,7 @@
     color: "#4E7A5C",
   },
   secondaryRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 12,
   },
diff --git a/app/(admin)/(tabs)/users.tsx b/app/(admin)/(tabs)/users.tsx
index 474ea6041ae5182a684fddd9dc2ed3516a9972e3..2720d5d075f5a7d65d2316aeb2477fe8f0766157
--- a/app/(admin)/(tabs)/users.tsx
+++ b/app/(admin)/(tabs)/users.tsx
@@ -11,7 +11,7 @@
   View,
 } from "react-native";
 
-import { FilterChips, UserRow } from "@/components/admin";
+import { FilterChips, Toggle, UserRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
@@ -44,6 +44,7 @@
   const [lastName, setLastName] = useState("");
   const [role, setRole] = useState<UserRole>("user");
   const [maxSessions, setMaxSessions] = useState(0);
+  const [enabled, setEnabled] = useState(true);
   const [saving, setSaving] = useState(false);
 
   const fetchUsers = useCallback(async () => {
@@ -85,6 +86,7 @@
     setLastName(user.last_name ?? "");
     setRole(user.role);
     setMaxSessions(user.max_sessions_per_week);
+    setEnabled(user.enabled ?? true);
   };
 
   const closeEditModal = () => {
@@ -99,6 +101,7 @@
       last_name: lastName.trim(),
       role,
       max_sessions_per_week: maxSessions,
+      enabled,
     };
 
     setSaving(true);
@@ -271,6 +274,15 @@
               </View>
             </View>
 
+            <View style={styles.toggleRow}>
+              <Text style={styles.fieldLabel}>AKTIVAN</Text>
+              <Toggle
+                value={enabled}
+                onValueChange={setEnabled}
+                disabled={saving}
+              />
+            </View>
+
             <View style={styles.modalFooter}>
               <Pressable
                 onPress={closeEditModal}
@@ -422,6 +434,15 @@
     fontWeight: "700",
     color: Colors.ink,
   },
+  toggleRow: {
+    alignItems: "center",
+    borderColor: Colors.fieldBorder,
+    borderRadius: Radii.tile[14],
+    borderWidth: 1,
+    flexDirection: "row",
+    justifyContent: "space-between",
+    padding: Spacing.cardPadding,
+  },
   modalFooter: {
     flexDirection: "row",
     gap: 10,
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 63f74934074ec361d3383d1bebe96ac5e5d71acb..de3d7bf172771f30084be8131eb8bbc1da719101
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -35,6 +35,16 @@
   }[day],
 }));
 
+const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
+
+const formatTime = (value: string) => {
+  const digits = value.replace(/\D/g, "").slice(0, 4);
+
+  return digits.length > 2
+    ? `${digits.slice(0, 2)}:${digits.slice(2)}`
+    : digits;
+};
+
 export default function TrainingDetailScreen() {
   const router = useRouter();
   const insets = useSafeAreaInsets();
@@ -45,8 +55,6 @@
   const [title, setTitle] = useState("");
   const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
   const [time, setTime] = useState("");
-  const [room, setRoom] = useState("");
-  const [durationMin, setDurationMin] = useState<number | null>(null);
   const [maxParticipants, setMaxParticipants] = useState(10);
   const [isOpen, setIsOpen] = useState(true);
   const [submitting, setSubmitting] = useState(false);
@@ -61,9 +69,7 @@
         ? (training.day_of_week as Day)
         : "monday",
     );
-    setTime(training.time);
-    setRoom(training.room ?? "");
-    setDurationMin(training.duration_min);
+    setTime(formatTime(training.time));
     setMaxParticipants(Math.min(50, Math.max(1, training.max_participants)));
     setIsOpen(training.is_open);
     setInitializedId(training.id);
@@ -73,7 +79,7 @@
     const normalizedTitle = title.trim();
     const normalizedTime = time.trim();
 
-    if (!normalizedTitle || !normalizedTime || maxParticipants < 1) {
+    if (!normalizedTitle || maxParticipants < 1) {
       Alert.alert(
         "Proverite podatke",
         "Naziv, vreme i najmanje jedan učesnik su obavezni.",
@@ -81,13 +87,21 @@
       return;
     }
 
+    if (!TIME_PATTERN.test(normalizedTime)) {
+      Alert.alert(
+        "Proverite vreme",
+        "Vreme mora biti u formatu HH:MM (00:00–23:59).",
+      );
+      return;
+    }
+
     const input: UpsertSessionInput = {
       id: isNew ? null : id,
       title: normalizedTitle,
       day_of_week: dayOfWeek,
       time: normalizedTime,
-      room: room.trim() || null,
-      duration_min: durationMin,
+      room: null,
+      duration_min: null,
       max_participants: maxParticipants,
       is_open: isOpen,
     };
@@ -171,35 +185,11 @@
             <Text style={styles.fieldLabel}>VREME</Text>
             <TextInput
               value={time}
-              onChangeText={setTime}
+              onChangeText={(value) => setTime(formatTime(value))}
               placeholder="18:00"
               placeholderTextColor={Colors.inkFaint}
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>TRAJANJE (MIN)</Text>
-            <TextInput
-              value={durationMin?.toString() ?? ""}
-              onChangeText={(value) =>
-                setDurationMin(
-                  value === "" ? null : Number(value.replace(/\D/g, "")),
-                )
-              }
               keyboardType="number-pad"
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-        </View>
-
-        <View style={styles.fieldRow}>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>SALA</Text>
-            <TextInput
-              value={room}
-              onChangeText={setRoom}
+              maxLength={5}
               editable={!submitting}
               style={styles.input}
             />
@@ -254,8 +244,12 @@
           </Pressable>
           <Pressable
             onPress={() => void submit()}
-            disabled={submitting}
-            style={[styles.saveButton, submitting && styles.buttonDisabled]}
+            disabled={submitting || !TIME_PATTERN.test(time.trim())}
+            style={[
+              styles.saveButton,
+              (submitting || !TIME_PATTERN.test(time.trim())) &&
+                styles.buttonDisabled,
+            ]}
           >
             {submitting ? (
               <ActivityIndicator color={Colors.surface} />
diff --git a/app/profile.tsx b/app/profile.tsx
index 799b71f8e307cbf3a41a1bf6b20ec8ef2690ad6f..790b7d86082f4b0eaca59eb77c0739f7fb1b4e27
--- a/app/profile.tsx
+++ b/app/profile.tsx
@@ -8,7 +8,6 @@
 import { FontFamilies, Typography } from "@/constants/typography";
 import { useAuth } from "@/hooks/useAuth";
 import { useTrainings } from "@/hooks/useTrainings";
-import { clampWeeklyLimit } from "@/utils/limits";
 import { getCurrentWeekDates } from "@/utils/week";
 
 const DAY_LABELS: Record<Day, string> = {
@@ -26,8 +25,9 @@
 
 export default function ProfileScreen() {
   const router = useRouter();
-  const { logout, profile, session, updateProfile } = useAuth();
+  const { logout, profile, session } = useAuth();
   const { bookedCount, trainings } = useTrainings();
+  const isAdmin = profile?.role === "admin";
   const weekDates = getCurrentWeekDates();
   const max = profile?.max_sessions_per_week ?? 0;
   const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;
@@ -55,15 +55,7 @@
 
       return dayDifference || a.time.localeCompare(b.time);
     });
-
-  const changeLimit = (delta: number) => {
-    const newValue = clampWeeklyLimit(max, delta, bookedCount);
 
-    if (newValue !== max) {
-      void updateProfile({ max_sessions_per_week: newValue });
-    }
-  };
-
   return (
     <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
       <View style={styles.navBar}>
@@ -92,15 +84,19 @@
               <Text style={styles.initials}>{initials || "P"}</Text>
             </View>
           </View>
-          <Text style={styles.name}>{fullName || "Perun član"}</Text>
-          {/* Inferred placeholder: Profile has no created_at field. */}
+          <Text style={styles.name}>
+            {fullName || (isAdmin ? "Perun admin" : "Perun član")}
+          </Text>
           <View style={styles.membershipChip}>
-            <Text style={styles.membershipText}>ČLAN OD MAR 2024.</Text>
+            <Text style={styles.membershipText}>
+              {isAdmin ? "ADMIN" : "ČLAN OD MAR 2024."}
+            </Text>
           </View>
         </View>
 
-        {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
-        <View style={styles.statsRow}>
+        {!isAdmin && <>
+          {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
+          <View style={styles.statsRow}>
           <View style={styles.statTile}>
             <Text style={styles.placeholderMarker}>PRIMER</Text>
             <Text style={[styles.statFigure, styles.burgundyStat]}>48</Text>
@@ -111,70 +107,26 @@
             <Text style={[styles.statFigure, styles.sageStat]}>5</Text>
             <Text style={styles.statLabel}>nedelja u nizu</Text>
           </View>
-        </View>
+          </View>
 
-        <View style={styles.limitCard}>
-          <View style={styles.limitHeader}>
-            <View style={styles.limitHeaderCopy}>
+          <View style={styles.limitCard}>
+            <View style={styles.limitHeader}>
               <Text style={styles.limitTitle}>Nedeljni limit</Text>
-              <Text style={styles.limitSubtitle}>
-                Maksimalno treninga po nedelji
+              <Text style={styles.usageValue}>
+                {bookedCount} / {max} ove nedelje
               </Text>
             </View>
-            <View style={styles.stepper}>
-              <Pressable
-                accessibilityLabel="Smanji nedeljni limit"
-                accessibilityRole="button"
-                disabled={max <= bookedCount}
-                onPress={() => changeLimit(-1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max <= bookedCount && styles.disabledStepperButton,
-                  ]}
-                >
-                  −
-                </Text>
-              </Pressable>
-              <Text style={styles.stepperValue}>{max}</Text>
-              <Pressable
-                accessibilityLabel="Povećaj nedeljni limit"
-                accessibilityRole="button"
-                disabled={max >= 7}
-                onPress={() => changeLimit(1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max >= 7 && styles.disabledStepperButton,
-                  ]}
-                >
-                  +
-                </Text>
-              </Pressable>
+            <View style={styles.track}>
+              <View style={[styles.fill, { width: `${progress}%` }]}>
+                <View style={styles.fillHighlight} />
+              </View>
             </View>
           </View>
 
-          <View style={styles.usageRow}>
-            <Text style={styles.usageLabel}>ISKORIŠĆENO OVE NEDELJE</Text>
-            <Text style={styles.usageValue}>
-              {bookedCount} / {max}
-            </Text>
-          </View>
-          <View style={styles.track}>
-            <View style={[styles.fill, { width: `${progress}%` }]}>
-              <View style={styles.fillHighlight} />
-            </View>
-          </View>
-        </View>
-
-        <Text style={styles.sessionsSectionTitle}>
-          MOJI TERMINI OVE NEDELJE
-        </Text>
-        <View style={styles.sessionsList}>
+          <Text style={styles.sessionsSectionTitle}>
+            MOJI TERMINI OVE NEDELJE
+          </Text>
+          <View style={styles.sessionsList}>
           {bookedSessions.map((training) => {
             const day = training.day_of_week as Day;
             const dateNumber = String(weekDates[day].getUTCDate()).padStart(
@@ -203,7 +155,8 @@
               </View>
             );
           })}
-        </View>
+          </View>
+        </>}
 
         <View style={styles.logoutContainer}>
           <Pressable
@@ -374,61 +327,12 @@
     alignItems: "center",
     flexDirection: "row",
     justifyContent: "space-between",
-  },
-  limitHeaderCopy: {
-    flex: 1,
-    paddingRight: 10,
   },
   limitTitle: {
     color: Colors.ink,
     fontFamily: FontFamilies.hanken[700],
     fontSize: 14.5,
-    fontWeight: "700",
-  },
-  limitSubtitle: {
-    color: Colors.inkMuted,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 12,
-    fontWeight: "600",
-    marginTop: 2,
-  },
-  stepper: {
-    alignItems: "center",
-    backgroundColor: Colors.surfaceMuted,
-    borderColor: "#EFE3D2",
-    borderRadius: Radii.tile[14],
-    borderWidth: 1,
-    flexDirection: "row",
-    gap: 14,
-    paddingHorizontal: 12,
-    paddingVertical: 7,
-  },
-  stepperButton: {
-    color: Colors.burgundy,
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 18,
     fontWeight: "700",
-  },
-  disabledStepperButton: {
-    opacity: 0.3,
-  },
-  stepperValue: {
-    color: Colors.ink,
-    fontFamily: FontFamilies.bricolage[800],
-    fontSize: 18,
-    fontWeight: "800",
-    minWidth: 14,
-    textAlign: "center",
-  },
-  usageRow: {
-    alignItems: "baseline",
-    flexDirection: "row",
-    justifyContent: "space-between",
-    marginTop: 16,
-  },
-  usageLabel: {
-    ...Typography.microLabelWide,
-    color: Colors.inkFaint,
   },
   usageValue: {
     color: Colors.inkMuted,
diff --git a/src/components/TrainingCard.tsx b/src/components/TrainingCard.tsx
index 0266c0c6c9ac88cf3019e5e52465866469aa195f..9a2cb1ab0e3adb63f004951e4881ce1dfbbe2631
--- a/src/components/TrainingCard.tsx
+++ b/src/components/TrainingCard.tsx
@@ -69,9 +69,6 @@
             <Text style={[styles.time, fullAndNotBooked && styles.fullTime]}>
               {training.time.slice(0, 5)}
             </Text>
-            <Text style={[styles.duration, fullAndNotBooked && styles.fullMeta]}>
-              60 min
-            </Text>
           </View>
 
           <View
@@ -90,7 +87,7 @@
               {training.title}
             </Text>
             <Text style={[styles.category, fullAndNotBooked && styles.fullTime]}>
-              Grupni · Sala A
+              Grupni
             </Text>
           </View>
 
@@ -271,13 +268,6 @@
     color: Colors.ink,
     lineHeight: 21,
   },
-  duration: {
-    color: Colors.inkFaint,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 10.5,
-    fontWeight: "600",
-    marginTop: 4,
-  },
   divider: {
     alignSelf: "stretch",
     backgroundColor: Colors.border,
@@ -304,9 +294,6 @@
   },
   fullTime: {
     color: "#9A9098",
-  },
-  fullMeta: {
-    color: "#ADA3AC",
   },
   fullTitle: {
     color: "#6E6670",
diff --git a/src/components/admin/StatTile.tsx b/src/components/admin/StatTile.tsx
index f89911629950685fc1017589872392a2abfdcc70..a1ebd8dd9c9c273fe7f42cb483fca30ca57a0aac
--- a/src/components/admin/StatTile.tsx
+++ b/src/components/admin/StatTile.tsx
@@ -23,6 +23,7 @@
 
 const styles = StyleSheet.create({
   tile: {
+    flex: 1,
     backgroundColor: Colors.surface,
     borderColor: Colors.border,
     borderWidth: 1,

 succeeded in 4998ms:

> peruntreningcentar@1.0.0 test
> jest --runInBand

PASS src/utils/__tests__/limits.test.ts
PASS src/utils/__tests__/week.test.ts
PASS src/constants/__tests__/tokens.test.ts
PASS src/constants/__tests__/days.test.ts

Test Suites: 4 passed, 4 total
Tests:       12 passed, 12 total
Snapshots:   0 total
Time:        0.642 s, estimated 1 s
Ran all test suites.

exec
/bin/zsh -lc "git diff --check -- 'app/(admin)/training/[id].tsx' src/components/TrainingCard.tsx 'app/(admin)/(tabs)/index.tsx' 'app/(admin)/(tabs)/stats.tsx' 'app/(admin)/(tabs)/users.tsx' app/profile.tsx src/components/admin/StatTile.tsx; sed -n '70,190p' app/profile.tsx; sed -n '35,275p' 'app/(admin)/training/[id].tsx'; sed -n '230,310p' 'app/(admin)/(tabs)/users.tsx'; rg -n \"room|durationMin|TRAJANJE|SALA|60 min|Grupni ·|updateProfile|clampWeeklyLimit|enabled|alignItems: \\\"stretch\\\"|flex: 1\" 'app/(admin)/training/[id].tsx' src/components/TrainingCard.tsx 'app/(admin)/(tabs)/index.tsx' 'app/(admin)/(tabs)/stats.tsx' 'app/(admin)/(tabs)/users.tsx' app/profile.tsx src/components/admin/StatTile.tsx; git status --short" in /Users/uros/Documents/Private/Projects/PerunApp
 succeeded in 0ms:
        >
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.navTitle}>Profil</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.identity}>
          <View style={styles.avatarOutline}>
            <View style={styles.avatar}>
              <Text style={styles.initials}>{initials || "P"}</Text>
            </View>
          </View>
          <Text style={styles.name}>
            {fullName || (isAdmin ? "Perun admin" : "Perun član")}
          </Text>
          <View style={styles.membershipChip}>
            <Text style={styles.membershipText}>
              {isAdmin ? "ADMIN" : "ČLAN OD MAR 2024."}
            </Text>
          </View>
        </View>

        {!isAdmin && (
          <>
            {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
            <View style={styles.statsRow}>
              <View style={styles.statTile}>
                <Text style={styles.placeholderMarker}>PRIMER</Text>
                <Text style={[styles.statFigure, styles.burgundyStat]}>48</Text>
                <Text style={styles.statLabel}>treninga ukupno</Text>
              </View>
              <View style={styles.statTile}>
                <Text style={styles.placeholderMarker}>PRIMER</Text>
                <Text style={[styles.statFigure, styles.sageStat]}>5</Text>
                <Text style={styles.statLabel}>nedelja u nizu</Text>
              </View>
            </View>

            <View style={styles.limitCard}>
              <View style={styles.limitHeader}>
                <Text style={styles.limitTitle}>Nedeljni limit</Text>
                <Text style={styles.usageValue}>
                  {bookedCount} / {max} ove nedelje
                </Text>
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${progress}%` }]}>
                  <View style={styles.fillHighlight} />
                </View>
              </View>
            </View>

            <Text style={styles.sessionsSectionTitle}>
              MOJI TERMINI OVE NEDELJE
            </Text>
            <View style={styles.sessionsList}>
              {bookedSessions.map((training) => {
                const day = training.day_of_week as Day;
                const dateNumber = String(weekDates[day].getUTCDate()).padStart(
                  2,
                  "0",
                );

                return (
                  <View key={training.id} style={styles.sessionCard}>
                    <View style={styles.dateBlock}>
                      <Text style={styles.dayLabel}>{DAY_LABELS[day]}</Text>
                      <Text style={styles.dateNumber}>{dateNumber}</Text>
                    </View>
                    <View style={styles.sessionDivider} />
                    <View style={styles.sessionCopy}>
                      <Text numberOfLines={1} style={styles.sessionTitle}>
                        {training.title}
                      </Text>
                      <Text style={styles.sessionMeta}>
                        {training.time.slice(0, 5)} · SALA A
                      </Text>
                    </View>
                    <View style={styles.checkBadge}>
                      <Text style={styles.check}>✓</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <View style={styles.logoutContainer}>
          <Pressable
            accessibilityRole="button"
            onPress={logout}
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.logoutText}>Odjavi se</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: Colors.paper,
    flex: 1,
  },
  navBar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
  }[day],
}));

const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const formatTime = (value: string) => {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  return digits.length > 2
    ? `${digits.slice(0, 2)}:${digits.slice(2)}`
    : digits;
};

export default function TrainingDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === "new";
  const { trainings, loading, fetchTrainings } = useTrainings();
  const training = trainings.find((item) => item.id === id);
  const [title, setTitle] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
  const [time, setTime] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [isOpen, setIsOpen] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [initializedId, setInitializedId] = useState<string | null>(null);

  useEffect(() => {
    if (!training || initializedId === training.id) return;

    setTitle(training.title);
    setDayOfWeek(
      TRAINING_DAYS.includes(training.day_of_week as Day)
        ? (training.day_of_week as Day)
        : "monday",
    );
    setTime(formatTime(training.time));
    setMaxParticipants(Math.min(50, Math.max(1, training.max_participants)));
    setIsOpen(training.is_open);
    setInitializedId(training.id);
  }, [initializedId, training]);

  const submit = async () => {
    const normalizedTitle = title.trim();
    const normalizedTime = time.trim();

    if (!normalizedTitle || maxParticipants < 1) {
      Alert.alert(
        "Proverite podatke",
        "Naziv, vreme i najmanje jedan učesnik su obavezni.",
      );
      return;
    }

    if (!TIME_PATTERN.test(normalizedTime)) {
      Alert.alert(
        "Proverite vreme",
        "Vreme mora biti u formatu HH:MM (00:00–23:59).",
      );
      return;
    }

    const input: UpsertSessionInput = {
      id: isNew ? null : id,
      title: normalizedTitle,
      day_of_week: dayOfWeek,
      time: normalizedTime,
      room: null,
      duration_min: null,
      max_participants: maxParticipants,
      is_open: isOpen,
    };

    setSubmitting(true);
    try {
      await upsertSession(input);
      await fetchTrainings();
      router.back();
    } catch (error: unknown) {
      console.error(error);
      Alert.alert("Greška", "Trening nije sačuvan.");
      await fetchTrainings();
    } finally {
      setSubmitting(false);
    }
  };

  if (!isNew && loading && !training) {
    return (
      <View style={styles.centeredState}>
        <ActivityIndicator color={Colors.burgundy} />
      </View>
    );
  }

  if (!isNew && !training) {
    return (
      <View style={styles.centeredState}>
        <Text style={styles.notFoundText}>Termin nije pronađen</Text>
        <Pressable onPress={() => router.back()} style={styles.notFoundButton}>
          <Text style={styles.notFoundButtonText}>Nazad</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={[styles.navBar, { paddingTop: insets.top + 16 }]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Text style={styles.navTitle}>
          {isNew ? "Novi trening" : "Izmena treninga"}
        </Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView
        style={styles.formScroll}
        contentContainerStyle={styles.formContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>NAZIV TRENINGA</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            editable={!submitting}
            style={styles.input}
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>DAN</Text>
          <FilterChips
            options={DAY_OPTIONS}
            value={dayOfWeek}
            onChange={setDayOfWeek}
          />
        </View>

        <View style={styles.fieldRow}>
          <View style={styles.columnField}>
            <Text style={styles.fieldLabel}>VREME</Text>
            <TextInput
              value={time}
              onChangeText={(value) => setTime(formatTime(value))}
              placeholder="18:00"
              placeholderTextColor={Colors.inkFaint}
              keyboardType="number-pad"
              maxLength={5}
              editable={!submitting}
              style={styles.input}
            />
          </View>
          <View style={styles.columnField}>
            <Text style={styles.fieldLabel}>MAKS. UČESNIKA</Text>
            <View style={styles.stepper}>
              <Pressable
                disabled={submitting || maxParticipants === 1}
                onPress={() =>
                  setMaxParticipants((value) => Math.max(1, value - 1))
                }
                style={styles.stepButton}
              >
                <Text style={styles.stepButtonText}>−</Text>
              </Pressable>
              <Text style={styles.stepValue}>{maxParticipants}</Text>
              <Pressable
                disabled={submitting || maxParticipants === 50}
                onPress={() =>
                  setMaxParticipants((value) => Math.min(50, value + 1))
                }
                style={styles.stepButton}
              >
                <Text style={styles.stepButtonText}>＋</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusTextBlock}>
            <Text style={styles.statusTitle}>Status slota</Text>
            <Text style={styles.statusDescription}>
              Otvoren za prijave članova
            </Text>
          </View>
          <Toggle
            value={isOpen}
            onValueChange={setIsOpen}
            disabled={submitting}
          />
        </View>

        <View style={styles.footer}>
          <Pressable
            onPress={() => router.back()}
            disabled={submitting}
            style={styles.cancelButton}
          >
            <Text style={styles.cancelButtonText}>Otkaži</Text>
          </Pressable>
          <Pressable
            onPress={() => void submit()}
            disabled={submitting || !TIME_PATTERN.test(time.trim())}
            style={[
              styles.saveButton,
              (submitting || !TIME_PATTERN.test(time.trim())) &&
                styles.buttonDisabled,
            ]}
          >
            {submitting ? (
              <ActivityIndicator color={Colors.surface} />
            ) : (
              <Text style={styles.saveButtonText}>Sačuvaj trening</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  centeredState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>PREZIME</Text>
              <TextInput
                value={lastName}
                onChangeText={setLastName}
                style={styles.fieldInput}
                editable={!saving}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>ULOGA</Text>
              <FilterChips
                options={ROLE_OPTIONS}
                value={role}
                onChange={setRole}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>TRENINGA NEDELJNO</Text>
              <View style={styles.stepper}>
                <Pressable
                  accessibilityRole="button"
                  disabled={saving || maxSessions === 0}
                  onPress={() =>
                    setMaxSessions((value) => Math.max(0, value - 1))
                  }
                  style={styles.stepButton}
                >
                  <Text style={styles.stepButtonText}>−</Text>
                </Pressable>
                <Text style={styles.stepValue}>{maxSessions}</Text>
                <Pressable
                  accessibilityRole="button"
                  disabled={saving || maxSessions === 14}
                  onPress={() =>
                    setMaxSessions((value) => Math.min(14, value + 1))
                  }
                  style={styles.stepButton}
                >
                  <Text style={styles.stepButtonText}>＋</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.toggleRow}>
              <Text style={styles.fieldLabel}>AKTIVAN</Text>
              <Toggle
                value={enabled}
                onValueChange={setEnabled}
                disabled={saving}
              />
            </View>

            <View style={styles.modalFooter}>
              <Pressable
                onPress={closeEditModal}
                disabled={saving}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Otkaži</Text>
              </Pressable>
              <Pressable
                onPress={() => void saveUser()}
                disabled={saving}
                style={[styles.saveButton, saving && styles.buttonDisabled]}
              >
                {saving ? (
                  <ActivityIndicator color={Colors.surface} />
                ) : (
                  <Text style={styles.saveButtonText}>Sačuvaj</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
app/(admin)/training/[id].tsx:103:      room: null,
app/(admin)/training/[id].tsx:268:    flex: 1,
app/(admin)/training/[id].tsx:272:    flex: 1,
app/(admin)/training/[id].tsx:331:    flex: 1,
app/(admin)/training/[id].tsx:347:    flex: 1,
app/(admin)/training/[id].tsx:411:    flex: 1,
app/(admin)/training/[id].tsx:432:    flex: 1,
src/components/admin/StatTile.tsx:34:    flex: 1,
src/components/TrainingCard.tsx:293:    flex: 1,
app/profile.tsx:150:                        {training.time.slice(0, 5)} · SALA A
app/profile.tsx:183:    flex: 1,
app/profile.tsx:285:    flex: 1,
app/profile.tsx:409:    flex: 1,
app/(admin)/(tabs)/index.tsx:213:    flex: 1,
app/(admin)/(tabs)/index.tsx:223:    flex: 1,
app/(admin)/(tabs)/index.tsx:245:    alignItems: "stretch",
app/(admin)/(tabs)/index.tsx:250:    flex: 1,
app/(admin)/(tabs)/stats.tsx:193:    flex: 1,
app/(admin)/(tabs)/stats.tsx:203:    flex: 1,
app/(admin)/(tabs)/stats.tsx:258:    alignItems: "stretch",
app/(admin)/(tabs)/stats.tsx:263:    flex: 1,
app/(admin)/(tabs)/users.tsx:47:  const [enabled, setEnabled] = useState(true);
app/(admin)/(tabs)/users.tsx:74:        (filter === "aktivni" && user.enabled !== false) ||
app/(admin)/(tabs)/users.tsx:89:    setEnabled(user.enabled ?? true);
app/(admin)/(tabs)/users.tsx:104:      enabled,
app/(admin)/(tabs)/users.tsx:280:                value={enabled}
app/(admin)/(tabs)/users.tsx:315:    flex: 1,
app/(admin)/(tabs)/users.tsx:324:    flex: 1,
app/(admin)/(tabs)/users.tsx:365:    flex: 1,
app/(admin)/(tabs)/users.tsx:452:    flex: 1,
 M .claude/agents/memory/donatello-memory.md
 M app/(admin)/(tabs)/index.tsx
 M app/(admin)/(tabs)/stats.tsx
 M app/(admin)/(tabs)/users.tsx
 M app/(admin)/training/[id].tsx
 M app/profile.tsx
 M src/components/TrainingCard.tsx
 M src/components/admin/StatTile.tsx
 M src/contexts/TrainingContext.tsx
 M src/services/admin/types.ts
 M src/services/admin/users.ts
?? .claude/agents/tmnt/session-logs/2026-06-28-S6-donatello.md
?? .tmnt/runs/b5-donny.md
?? .tmnt/runs/phase-c-b-groupb-mikey.md
?? supabase/migrations/20260628110000_admin_update_user_enabled.sql
?? supabase/migrations/20260628110100_join_session_inactive.sql

diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 9bbdc139ee145ef44f2e9213834d3fa01e054538..d1e54156c394b7d46c02642411b2fd9a93e44cdd
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -242,6 +242,7 @@
     gap: 11,
   },
   tileRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 11,
   },
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index 23542459a42a8a534685faae85a0dfe5a6e77157..f268a63f9095c10157b70956ea2820eb803bc7a8
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -255,6 +255,7 @@
     color: "#4E7A5C",
   },
   secondaryRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 12,
   },
diff --git a/app/(admin)/(tabs)/users.tsx b/app/(admin)/(tabs)/users.tsx
index 474ea6041ae5182a684fddd9dc2ed3516a9972e3..2720d5d075f5a7d65d2316aeb2477fe8f0766157
--- a/app/(admin)/(tabs)/users.tsx
+++ b/app/(admin)/(tabs)/users.tsx
@@ -11,7 +11,7 @@
   View,
 } from "react-native";
 
-import { FilterChips, UserRow } from "@/components/admin";
+import { FilterChips, Toggle, UserRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
@@ -44,6 +44,7 @@
   const [lastName, setLastName] = useState("");
   const [role, setRole] = useState<UserRole>("user");
   const [maxSessions, setMaxSessions] = useState(0);
+  const [enabled, setEnabled] = useState(true);
   const [saving, setSaving] = useState(false);
 
   const fetchUsers = useCallback(async () => {
@@ -85,6 +86,7 @@
     setLastName(user.last_name ?? "");
     setRole(user.role);
     setMaxSessions(user.max_sessions_per_week);
+    setEnabled(user.enabled ?? true);
   };
 
   const closeEditModal = () => {
@@ -99,6 +101,7 @@
       last_name: lastName.trim(),
       role,
       max_sessions_per_week: maxSessions,
+      enabled,
     };
 
     setSaving(true);
@@ -271,6 +274,15 @@
               </View>
             </View>
 
+            <View style={styles.toggleRow}>
+              <Text style={styles.fieldLabel}>AKTIVAN</Text>
+              <Toggle
+                value={enabled}
+                onValueChange={setEnabled}
+                disabled={saving}
+              />
+            </View>
+
             <View style={styles.modalFooter}>
               <Pressable
                 onPress={closeEditModal}
@@ -422,6 +434,15 @@
     fontWeight: "700",
     color: Colors.ink,
   },
+  toggleRow: {
+    alignItems: "center",
+    borderColor: Colors.fieldBorder,
+    borderRadius: Radii.tile[14],
+    borderWidth: 1,
+    flexDirection: "row",
+    justifyContent: "space-between",
+    padding: Spacing.cardPadding,
+  },
   modalFooter: {
     flexDirection: "row",
     gap: 10,
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 63f74934074ec361d3383d1bebe96ac5e5d71acb..de3d7bf172771f30084be8131eb8bbc1da719101
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -35,6 +35,16 @@
   }[day],
 }));
 
+const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
+
+const formatTime = (value: string) => {
+  const digits = value.replace(/\D/g, "").slice(0, 4);
+
+  return digits.length > 2
+    ? `${digits.slice(0, 2)}:${digits.slice(2)}`
+    : digits;
+};
+
 export default function TrainingDetailScreen() {
   const router = useRouter();
   const insets = useSafeAreaInsets();
@@ -45,8 +55,6 @@
   const [title, setTitle] = useState("");
   const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
   const [time, setTime] = useState("");
-  const [room, setRoom] = useState("");
-  const [durationMin, setDurationMin] = useState<number | null>(null);
   const [maxParticipants, setMaxParticipants] = useState(10);
   const [isOpen, setIsOpen] = useState(true);
   const [submitting, setSubmitting] = useState(false);
@@ -61,9 +69,7 @@
         ? (training.day_of_week as Day)
         : "monday",
     );
-    setTime(training.time);
-    setRoom(training.room ?? "");
-    setDurationMin(training.duration_min);
+    setTime(formatTime(training.time));
     setMaxParticipants(Math.min(50, Math.max(1, training.max_participants)));
     setIsOpen(training.is_open);
     setInitializedId(training.id);
@@ -73,7 +79,7 @@
     const normalizedTitle = title.trim();
     const normalizedTime = time.trim();
 
-    if (!normalizedTitle || !normalizedTime || maxParticipants < 1) {
+    if (!normalizedTitle || maxParticipants < 1) {
       Alert.alert(
         "Proverite podatke",
         "Naziv, vreme i najmanje jedan učesnik su obavezni.",
@@ -81,13 +87,21 @@
       return;
     }
 
+    if (!TIME_PATTERN.test(normalizedTime)) {
+      Alert.alert(
+        "Proverite vreme",
+        "Vreme mora biti u formatu HH:MM (00:00–23:59).",
+      );
+      return;
+    }
+
     const input: UpsertSessionInput = {
       id: isNew ? null : id,
       title: normalizedTitle,
       day_of_week: dayOfWeek,
       time: normalizedTime,
-      room: room.trim() || null,
-      duration_min: durationMin,
+      room: null,
+      duration_min: null,
       max_participants: maxParticipants,
       is_open: isOpen,
     };
@@ -171,35 +185,11 @@
             <Text style={styles.fieldLabel}>VREME</Text>
             <TextInput
               value={time}
-              onChangeText={setTime}
+              onChangeText={(value) => setTime(formatTime(value))}
               placeholder="18:00"
               placeholderTextColor={Colors.inkFaint}
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>TRAJANJE (MIN)</Text>
-            <TextInput
-              value={durationMin?.toString() ?? ""}
-              onChangeText={(value) =>
-                setDurationMin(
-                  value === "" ? null : Number(value.replace(/\D/g, "")),
-                )
-              }
               keyboardType="number-pad"
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-        </View>
-
-        <View style={styles.fieldRow}>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>SALA</Text>
-            <TextInput
-              value={room}
-              onChangeText={setRoom}
+              maxLength={5}
               editable={!submitting}
               style={styles.input}
             />
@@ -254,8 +244,12 @@
           </Pressable>
           <Pressable
             onPress={() => void submit()}
-            disabled={submitting}
-            style={[styles.saveButton, submitting && styles.buttonDisabled]}
+            disabled={submitting || !TIME_PATTERN.test(time.trim())}
+            style={[
+              styles.saveButton,
+              (submitting || !TIME_PATTERN.test(time.trim())) &&
+                styles.buttonDisabled,
+            ]}
           >
             {submitting ? (
               <ActivityIndicator color={Colors.surface} />
diff --git a/app/profile.tsx b/app/profile.tsx
index 799b71f8e307cbf3a41a1bf6b20ec8ef2690ad6f..790b7d86082f4b0eaca59eb77c0739f7fb1b4e27
--- a/app/profile.tsx
+++ b/app/profile.tsx
@@ -8,7 +8,6 @@
 import { FontFamilies, Typography } from "@/constants/typography";
 import { useAuth } from "@/hooks/useAuth";
 import { useTrainings } from "@/hooks/useTrainings";
-import { clampWeeklyLimit } from "@/utils/limits";
 import { getCurrentWeekDates } from "@/utils/week";
 
 const DAY_LABELS: Record<Day, string> = {
@@ -26,8 +25,9 @@
 
 export default function ProfileScreen() {
   const router = useRouter();
-  const { logout, profile, session, updateProfile } = useAuth();
+  const { logout, profile, session } = useAuth();
   const { bookedCount, trainings } = useTrainings();
+  const isAdmin = profile?.role === "admin";
   const weekDates = getCurrentWeekDates();
   const max = profile?.max_sessions_per_week ?? 0;
   const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;
@@ -55,15 +55,7 @@
 
       return dayDifference || a.time.localeCompare(b.time);
     });
-
-  const changeLimit = (delta: number) => {
-    const newValue = clampWeeklyLimit(max, delta, bookedCount);
 
-    if (newValue !== max) {
-      void updateProfile({ max_sessions_per_week: newValue });
-    }
-  };
-
   return (
     <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
       <View style={styles.navBar}>
@@ -92,15 +84,19 @@
               <Text style={styles.initials}>{initials || "P"}</Text>
             </View>
           </View>
-          <Text style={styles.name}>{fullName || "Perun član"}</Text>
-          {/* Inferred placeholder: Profile has no created_at field. */}
+          <Text style={styles.name}>
+            {fullName || (isAdmin ? "Perun admin" : "Perun član")}
+          </Text>
           <View style={styles.membershipChip}>
-            <Text style={styles.membershipText}>ČLAN OD MAR 2024.</Text>
+            <Text style={styles.membershipText}>
+              {isAdmin ? "ADMIN" : "ČLAN OD MAR 2024."}
+            </Text>
           </View>
         </View>
 
-        {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
-        <View style={styles.statsRow}>
+        {!isAdmin && <>
+          {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
+          <View style={styles.statsRow}>
           <View style={styles.statTile}>
             <Text style={styles.placeholderMarker}>PRIMER</Text>
             <Text style={[styles.statFigure, styles.burgundyStat]}>48</Text>
@@ -111,70 +107,26 @@
             <Text style={[styles.statFigure, styles.sageStat]}>5</Text>
             <Text style={styles.statLabel}>nedelja u nizu</Text>
           </View>
-        </View>
+          </View>
 
-        <View style={styles.limitCard}>
-          <View style={styles.limitHeader}>
-            <View style={styles.limitHeaderCopy}>
+          <View style={styles.limitCard}>
+            <View style={styles.limitHeader}>
               <Text style={styles.limitTitle}>Nedeljni limit</Text>
-              <Text style={styles.limitSubtitle}>
-                Maksimalno treninga po nedelji
+              <Text style={styles.usageValue}>
+                {bookedCount} / {max} ove nedelje
               </Text>
             </View>
-            <View style={styles.stepper}>
-              <Pressable
-                accessibilityLabel="Smanji nedeljni limit"
-                accessibilityRole="button"
-                disabled={max <= bookedCount}
-                onPress={() => changeLimit(-1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max <= bookedCount && styles.disabledStepperButton,
-                  ]}
-                >
-                  −
-                </Text>
-              </Pressable>
-              <Text style={styles.stepperValue}>{max}</Text>
-              <Pressable
-                accessibilityLabel="Povećaj nedeljni limit"
-                accessibilityRole="button"
-                disabled={max >= 7}
-                onPress={() => changeLimit(1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max >= 7 && styles.disabledStepperButton,
-                  ]}
-                >
-                  +
-                </Text>
-              </Pressable>
+            <View style={styles.track}>
+              <View style={[styles.fill, { width: `${progress}%` }]}>
+                <View style={styles.fillHighlight} />
+              </View>
             </View>
           </View>
 
-          <View style={styles.usageRow}>
-            <Text style={styles.usageLabel}>ISKORIŠĆENO OVE NEDELJE</Text>
-            <Text style={styles.usageValue}>
-              {bookedCount} / {max}
-            </Text>
-          </View>
-          <View style={styles.track}>
-            <View style={[styles.fill, { width: `${progress}%` }]}>
-              <View style={styles.fillHighlight} />
-            </View>
-          </View>
-        </View>
-
-        <Text style={styles.sessionsSectionTitle}>
-          MOJI TERMINI OVE NEDELJE
-        </Text>
-        <View style={styles.sessionsList}>
+          <Text style={styles.sessionsSectionTitle}>
+            MOJI TERMINI OVE NEDELJE
+          </Text>
+          <View style={styles.sessionsList}>
           {bookedSessions.map((training) => {
             const day = training.day_of_week as Day;
             const dateNumber = String(weekDates[day].getUTCDate()).padStart(
@@ -203,7 +155,8 @@
               </View>
             );
           })}
-        </View>
+          </View>
+        </>}
 
         <View style={styles.logoutContainer}>
           <Pressable
@@ -374,61 +327,12 @@
     alignItems: "center",
     flexDirection: "row",
     justifyContent: "space-between",
-  },
-  limitHeaderCopy: {
-    flex: 1,
-    paddingRight: 10,
   },
   limitTitle: {
     color: Colors.ink,
     fontFamily: FontFamilies.hanken[700],
     fontSize: 14.5,
-    fontWeight: "700",
-  },
-  limitSubtitle: {
-    color: Colors.inkMuted,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 12,
-    fontWeight: "600",
-    marginTop: 2,
-  },
-  stepper: {
-    alignItems: "center",
-    backgroundColor: Colors.surfaceMuted,
-    borderColor: "#EFE3D2",
-    borderRadius: Radii.tile[14],
-    borderWidth: 1,
-    flexDirection: "row",
-    gap: 14,
-    paddingHorizontal: 12,
-    paddingVertical: 7,
-  },
-  stepperButton: {
-    color: Colors.burgundy,
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 18,
     fontWeight: "700",
-  },
-  disabledStepperButton: {
-    opacity: 0.3,
-  },
-  stepperValue: {
-    color: Colors.ink,
-    fontFamily: FontFamilies.bricolage[800],
-    fontSize: 18,
-    fontWeight: "800",
-    minWidth: 14,
-    textAlign: "center",
-  },
-  usageRow: {
-    alignItems: "baseline",
-    flexDirection: "row",
-    justifyContent: "space-between",
-    marginTop: 16,
-  },
-  usageLabel: {
-    ...Typography.microLabelWide,
-    color: Colors.inkFaint,
   },
   usageValue: {
     color: Colors.inkMuted,
diff --git a/src/components/TrainingCard.tsx b/src/components/TrainingCard.tsx
index 0266c0c6c9ac88cf3019e5e52465866469aa195f..9a2cb1ab0e3adb63f004951e4881ce1dfbbe2631
--- a/src/components/TrainingCard.tsx
+++ b/src/components/TrainingCard.tsx
@@ -69,9 +69,6 @@
             <Text style={[styles.time, fullAndNotBooked && styles.fullTime]}>
               {training.time.slice(0, 5)}
             </Text>
-            <Text style={[styles.duration, fullAndNotBooked && styles.fullMeta]}>
-              60 min
-            </Text>
           </View>
 
           <View
@@ -90,7 +87,7 @@
               {training.title}
             </Text>
             <Text style={[styles.category, fullAndNotBooked && styles.fullTime]}>
-              Grupni · Sala A
+              Grupni
             </Text>
           </View>
 
@@ -271,13 +268,6 @@
     color: Colors.ink,
     lineHeight: 21,
   },
-  duration: {
-    color: Colors.inkFaint,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 10.5,
-    fontWeight: "600",
-    marginTop: 4,
-  },
   divider: {
     alignSelf: "stretch",
     backgroundColor: Colors.border,
@@ -304,9 +294,6 @@
   },
   fullTime: {
     color: "#9A9098",
-  },
-  fullMeta: {
-    color: "#ADA3AC",
   },
   fullTitle: {
     color: "#6E6670",
diff --git a/src/components/admin/StatTile.tsx b/src/components/admin/StatTile.tsx
index f89911629950685fc1017589872392a2abfdcc70..a1ebd8dd9c9c273fe7f42cb483fca30ca57a0aac
--- a/src/components/admin/StatTile.tsx
+++ b/src/components/admin/StatTile.tsx
@@ -23,6 +23,7 @@
 
 const styles = StyleSheet.create({
   tile: {
+    flex: 1,
     backgroundColor: Colors.surface,
     borderColor: Colors.border,
     borderWidth: 1,

codex
One behavior needed tightening: a permanently disabled invalid-time button could never display the required validation alert. I’m adjusting it so the first invalid save shows the alert and disables saving until the time becomes valid.
apply patch
patch: completed
/Users/uros/Documents/Private/Projects/PerunApp/app/(admin)/training/[id].tsx
diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 9bbdc139ee145ef44f2e9213834d3fa01e054538..d1e54156c394b7d46c02642411b2fd9a93e44cdd
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -242,6 +242,7 @@
     gap: 11,
   },
   tileRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 11,
   },
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index 23542459a42a8a534685faae85a0dfe5a6e77157..f268a63f9095c10157b70956ea2820eb803bc7a8
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -255,6 +255,7 @@
     color: "#4E7A5C",
   },
   secondaryRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 12,
   },
diff --git a/app/(admin)/(tabs)/users.tsx b/app/(admin)/(tabs)/users.tsx
index 474ea6041ae5182a684fddd9dc2ed3516a9972e3..2720d5d075f5a7d65d2316aeb2477fe8f0766157
--- a/app/(admin)/(tabs)/users.tsx
+++ b/app/(admin)/(tabs)/users.tsx
@@ -11,7 +11,7 @@
   View,
 } from "react-native";
 
-import { FilterChips, UserRow } from "@/components/admin";
+import { FilterChips, Toggle, UserRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
@@ -44,6 +44,7 @@
   const [lastName, setLastName] = useState("");
   const [role, setRole] = useState<UserRole>("user");
   const [maxSessions, setMaxSessions] = useState(0);
+  const [enabled, setEnabled] = useState(true);
   const [saving, setSaving] = useState(false);
 
   const fetchUsers = useCallback(async () => {
@@ -85,6 +86,7 @@
     setLastName(user.last_name ?? "");
     setRole(user.role);
     setMaxSessions(user.max_sessions_per_week);
+    setEnabled(user.enabled ?? true);
   };
 
   const closeEditModal = () => {
@@ -99,6 +101,7 @@
       last_name: lastName.trim(),
       role,
       max_sessions_per_week: maxSessions,
+      enabled,
     };
 
     setSaving(true);
@@ -271,6 +274,15 @@
               </View>
             </View>
 
+            <View style={styles.toggleRow}>
+              <Text style={styles.fieldLabel}>AKTIVAN</Text>
+              <Toggle
+                value={enabled}
+                onValueChange={setEnabled}
+                disabled={saving}
+              />
+            </View>
+
             <View style={styles.modalFooter}>
               <Pressable
                 onPress={closeEditModal}
@@ -422,6 +434,15 @@
     fontWeight: "700",
     color: Colors.ink,
   },
+  toggleRow: {
+    alignItems: "center",
+    borderColor: Colors.fieldBorder,
+    borderRadius: Radii.tile[14],
+    borderWidth: 1,
+    flexDirection: "row",
+    justifyContent: "space-between",
+    padding: Spacing.cardPadding,
+  },
   modalFooter: {
     flexDirection: "row",
     gap: 10,
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 63f74934074ec361d3383d1bebe96ac5e5d71acb..4801d628d5e217ef3697d2c810f8009472020128
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -35,6 +35,16 @@
   }[day],
 }));
 
+const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
+
+const formatTime = (value: string) => {
+  const digits = value.replace(/\D/g, "").slice(0, 4);
+
+  return digits.length > 2
+    ? `${digits.slice(0, 2)}:${digits.slice(2)}`
+    : digits;
+};
+
 export default function TrainingDetailScreen() {
   const router = useRouter();
   const insets = useSafeAreaInsets();
@@ -45,12 +55,12 @@
   const [title, setTitle] = useState("");
   const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
   const [time, setTime] = useState("");
-  const [room, setRoom] = useState("");
-  const [durationMin, setDurationMin] = useState<number | null>(null);
   const [maxParticipants, setMaxParticipants] = useState(10);
   const [isOpen, setIsOpen] = useState(true);
   const [submitting, setSubmitting] = useState(false);
+  const [saveAttempted, setSaveAttempted] = useState(false);
   const [initializedId, setInitializedId] = useState<string | null>(null);
+  const isTimeValid = TIME_PATTERN.test(time.trim());
 
   useEffect(() => {
     if (!training || initializedId === training.id) return;
@@ -61,9 +71,7 @@
         ? (training.day_of_week as Day)
         : "monday",
     );
-    setTime(training.time);
-    setRoom(training.room ?? "");
-    setDurationMin(training.duration_min);
+    setTime(formatTime(training.time));
     setMaxParticipants(Math.min(50, Math.max(1, training.max_participants)));
     setIsOpen(training.is_open);
     setInitializedId(training.id);
@@ -73,7 +81,7 @@
     const normalizedTitle = title.trim();
     const normalizedTime = time.trim();
 
-    if (!normalizedTitle || !normalizedTime || maxParticipants < 1) {
+    if (!normalizedTitle || maxParticipants < 1) {
       Alert.alert(
         "Proverite podatke",
         "Naziv, vreme i najmanje jedan učesnik su obavezni.",
@@ -81,13 +89,22 @@
       return;
     }
 
+    if (!TIME_PATTERN.test(normalizedTime)) {
+      setSaveAttempted(true);
+      Alert.alert(
+        "Proverite vreme",
+        "Vreme mora biti u formatu HH:MM (00:00–23:59).",
+      );
+      return;
+    }
+
     const input: UpsertSessionInput = {
       id: isNew ? null : id,
       title: normalizedTitle,
       day_of_week: dayOfWeek,
       time: normalizedTime,
-      room: room.trim() || null,
-      duration_min: durationMin,
+      room: null,
+      duration_min: null,
       max_participants: maxParticipants,
       is_open: isOpen,
     };
@@ -171,35 +188,11 @@
             <Text style={styles.fieldLabel}>VREME</Text>
             <TextInput
               value={time}
-              onChangeText={setTime}
+              onChangeText={(value) => setTime(formatTime(value))}
               placeholder="18:00"
               placeholderTextColor={Colors.inkFaint}
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>TRAJANJE (MIN)</Text>
-            <TextInput
-              value={durationMin?.toString() ?? ""}
-              onChangeText={(value) =>
-                setDurationMin(
-                  value === "" ? null : Number(value.replace(/\D/g, "")),
-                )
-              }
               keyboardType="number-pad"
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-        </View>
-
-        <View style={styles.fieldRow}>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>SALA</Text>
-            <TextInput
-              value={room}
-              onChangeText={setRoom}
+              maxLength={5}
               editable={!submitting}
               style={styles.input}
             />
@@ -254,8 +247,12 @@
           </Pressable>
           <Pressable
             onPress={() => void submit()}
-            disabled={submitting}
-            style={[styles.saveButton, submitting && styles.buttonDisabled]}
+            disabled={submitting || (saveAttempted && !isTimeValid)}
+            style={[
+              styles.saveButton,
+              (submitting || (saveAttempted && !isTimeValid)) &&
+                styles.buttonDisabled,
+            ]}
           >
             {submitting ? (
               <ActivityIndicator color={Colors.surface} />
diff --git a/app/profile.tsx b/app/profile.tsx
index 799b71f8e307cbf3a41a1bf6b20ec8ef2690ad6f..790b7d86082f4b0eaca59eb77c0739f7fb1b4e27
--- a/app/profile.tsx
+++ b/app/profile.tsx
@@ -8,7 +8,6 @@
 import { FontFamilies, Typography } from "@/constants/typography";
 import { useAuth } from "@/hooks/useAuth";
 import { useTrainings } from "@/hooks/useTrainings";
-import { clampWeeklyLimit } from "@/utils/limits";
 import { getCurrentWeekDates } from "@/utils/week";
 
 const DAY_LABELS: Record<Day, string> = {
@@ -26,8 +25,9 @@
 
 export default function ProfileScreen() {
   const router = useRouter();
-  const { logout, profile, session, updateProfile } = useAuth();
+  const { logout, profile, session } = useAuth();
   const { bookedCount, trainings } = useTrainings();
+  const isAdmin = profile?.role === "admin";
   const weekDates = getCurrentWeekDates();
   const max = profile?.max_sessions_per_week ?? 0;
   const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;
@@ -55,15 +55,7 @@
 
       return dayDifference || a.time.localeCompare(b.time);
     });
-
-  const changeLimit = (delta: number) => {
-    const newValue = clampWeeklyLimit(max, delta, bookedCount);
 
-    if (newValue !== max) {
-      void updateProfile({ max_sessions_per_week: newValue });
-    }
-  };
-
   return (
     <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
       <View style={styles.navBar}>
@@ -92,15 +84,19 @@
               <Text style={styles.initials}>{initials || "P"}</Text>
             </View>
           </View>
-          <Text style={styles.name}>{fullName || "Perun član"}</Text>
-          {/* Inferred placeholder: Profile has no created_at field. */}
+          <Text style={styles.name}>
+            {fullName || (isAdmin ? "Perun admin" : "Perun član")}
+          </Text>
           <View style={styles.membershipChip}>
-            <Text style={styles.membershipText}>ČLAN OD MAR 2024.</Text>
+            <Text style={styles.membershipText}>
+              {isAdmin ? "ADMIN" : "ČLAN OD MAR 2024."}
+            </Text>
           </View>
         </View>
 
-        {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
-        <View style={styles.statsRow}>
+        {!isAdmin && <>
+          {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
+          <View style={styles.statsRow}>
           <View style={styles.statTile}>
             <Text style={styles.placeholderMarker}>PRIMER</Text>
             <Text style={[styles.statFigure, styles.burgundyStat]}>48</Text>
@@ -111,70 +107,26 @@
             <Text style={[styles.statFigure, styles.sageStat]}>5</Text>
             <Text style={styles.statLabel}>nedelja u nizu</Text>
           </View>
-        </View>
+          </View>
 
-        <View style={styles.limitCard}>
-          <View style={styles.limitHeader}>
-            <View style={styles.limitHeaderCopy}>
+          <View style={styles.limitCard}>
+            <View style={styles.limitHeader}>
               <Text style={styles.limitTitle}>Nedeljni limit</Text>
-              <Text style={styles.limitSubtitle}>
-                Maksimalno treninga po nedelji
+              <Text style={styles.usageValue}>
+                {bookedCount} / {max} ove nedelje
               </Text>
             </View>
-            <View style={styles.stepper}>
-              <Pressable
-                accessibilityLabel="Smanji nedeljni limit"
-                accessibilityRole="button"
-                disabled={max <= bookedCount}
-                onPress={() => changeLimit(-1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max <= bookedCount && styles.disabledStepperButton,
-                  ]}
-                >
-                  −
-                </Text>
-              </Pressable>
-              <Text style={styles.stepperValue}>{max}</Text>
-              <Pressable
-                accessibilityLabel="Povećaj nedeljni limit"
-                accessibilityRole="button"
-                disabled={max >= 7}
-                onPress={() => changeLimit(1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max >= 7 && styles.disabledStepperButton,
-                  ]}
-                >
-                  +
-                </Text>
-              </Pressable>
+            <View style={styles.track}>
+              <View style={[styles.fill, { width: `${progress}%` }]}>
+                <View style={styles.fillHighlight} />
+              </View>
             </View>
           </View>
 
-          <View style={styles.usageRow}>
-            <Text style={styles.usageLabel}>ISKORIŠĆENO OVE NEDELJE</Text>
-            <Text style={styles.usageValue}>
-              {bookedCount} / {max}
-            </Text>
-          </View>
-          <View style={styles.track}>
-            <View style={[styles.fill, { width: `${progress}%` }]}>
-              <View style={styles.fillHighlight} />
-            </View>
-          </View>
-        </View>
-
-        <Text style={styles.sessionsSectionTitle}>
-          MOJI TERMINI OVE NEDELJE
-        </Text>
-        <View style={styles.sessionsList}>
+          <Text style={styles.sessionsSectionTitle}>
+            MOJI TERMINI OVE NEDELJE
+          </Text>
+          <View style={styles.sessionsList}>
           {bookedSessions.map((training) => {
             const day = training.day_of_week as Day;
             const dateNumber = String(weekDates[day].getUTCDate()).padStart(
@@ -203,7 +155,8 @@
               </View>
             );
           })}
-        </View>
+          </View>
+        </>}
 
         <View style={styles.logoutContainer}>
           <Pressable
@@ -374,61 +327,12 @@
     alignItems: "center",
     flexDirection: "row",
     justifyContent: "space-between",
-  },
-  limitHeaderCopy: {
-    flex: 1,
-    paddingRight: 10,
   },
   limitTitle: {
     color: Colors.ink,
     fontFamily: FontFamilies.hanken[700],
     fontSize: 14.5,
-    fontWeight: "700",
-  },
-  limitSubtitle: {
-    color: Colors.inkMuted,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 12,
-    fontWeight: "600",
-    marginTop: 2,
-  },
-  stepper: {
-    alignItems: "center",
-    backgroundColor: Colors.surfaceMuted,
-    borderColor: "#EFE3D2",
-    borderRadius: Radii.tile[14],
-    borderWidth: 1,
-    flexDirection: "row",
-    gap: 14,
-    paddingHorizontal: 12,
-    paddingVertical: 7,
-  },
-  stepperButton: {
-    color: Colors.burgundy,
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 18,
     fontWeight: "700",
-  },
-  disabledStepperButton: {
-    opacity: 0.3,
-  },
-  stepperValue: {
-    color: Colors.ink,
-    fontFamily: FontFamilies.bricolage[800],
-    fontSize: 18,
-    fontWeight: "800",
-    minWidth: 14,
-    textAlign: "center",
-  },
-  usageRow: {
-    alignItems: "baseline",
-    flexDirection: "row",
-    justifyContent: "space-between",
-    marginTop: 16,
-  },
-  usageLabel: {
-    ...Typography.microLabelWide,
-    color: Colors.inkFaint,
   },
   usageValue: {
     color: Colors.inkMuted,
diff --git a/src/components/TrainingCard.tsx b/src/components/TrainingCard.tsx
index 0266c0c6c9ac88cf3019e5e52465866469aa195f..9a2cb1ab0e3adb63f004951e4881ce1dfbbe2631
--- a/src/components/TrainingCard.tsx
+++ b/src/components/TrainingCard.tsx
@@ -69,9 +69,6 @@
             <Text style={[styles.time, fullAndNotBooked && styles.fullTime]}>
               {training.time.slice(0, 5)}
             </Text>
-            <Text style={[styles.duration, fullAndNotBooked && styles.fullMeta]}>
-              60 min
-            </Text>
           </View>
 
           <View
@@ -90,7 +87,7 @@
               {training.title}
             </Text>
             <Text style={[styles.category, fullAndNotBooked && styles.fullTime]}>
-              Grupni · Sala A
+              Grupni
             </Text>
           </View>
 
@@ -271,13 +268,6 @@
     color: Colors.ink,
     lineHeight: 21,
   },
-  duration: {
-    color: Colors.inkFaint,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 10.5,
-    fontWeight: "600",
-    marginTop: 4,
-  },
   divider: {
     alignSelf: "stretch",
     backgroundColor: Colors.border,
@@ -304,9 +294,6 @@
   },
   fullTime: {
     color: "#9A9098",
-  },
-  fullMeta: {
-    color: "#ADA3AC",
   },
   fullTitle: {
     color: "#6E6670",
diff --git a/src/components/admin/StatTile.tsx b/src/components/admin/StatTile.tsx
index f89911629950685fc1017589872392a2abfdcc70..a1ebd8dd9c9c273fe7f42cb483fca30ca57a0aac
--- a/src/components/admin/StatTile.tsx
+++ b/src/components/admin/StatTile.tsx
@@ -23,6 +23,7 @@
 
 const styles = StyleSheet.create({
   tile: {
+    flex: 1,
     backgroundColor: Colors.surface,
     borderColor: Colors.border,
     borderWidth: 1,

diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 9bbdc139ee145ef44f2e9213834d3fa01e054538..d1e54156c394b7d46c02642411b2fd9a93e44cdd
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -242,6 +242,7 @@
     gap: 11,
   },
   tileRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 11,
   },
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index 23542459a42a8a534685faae85a0dfe5a6e77157..f268a63f9095c10157b70956ea2820eb803bc7a8
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -255,6 +255,7 @@
     color: "#4E7A5C",
   },
   secondaryRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 12,
   },
diff --git a/app/(admin)/(tabs)/users.tsx b/app/(admin)/(tabs)/users.tsx
index 474ea6041ae5182a684fddd9dc2ed3516a9972e3..2720d5d075f5a7d65d2316aeb2477fe8f0766157
--- a/app/(admin)/(tabs)/users.tsx
+++ b/app/(admin)/(tabs)/users.tsx
@@ -11,7 +11,7 @@
   View,
 } from "react-native";
 
-import { FilterChips, UserRow } from "@/components/admin";
+import { FilterChips, Toggle, UserRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
@@ -44,6 +44,7 @@
   const [lastName, setLastName] = useState("");
   const [role, setRole] = useState<UserRole>("user");
   const [maxSessions, setMaxSessions] = useState(0);
+  const [enabled, setEnabled] = useState(true);
   const [saving, setSaving] = useState(false);
 
   const fetchUsers = useCallback(async () => {
@@ -85,6 +86,7 @@
     setLastName(user.last_name ?? "");
     setRole(user.role);
     setMaxSessions(user.max_sessions_per_week);
+    setEnabled(user.enabled ?? true);
   };
 
   const closeEditModal = () => {
@@ -99,6 +101,7 @@
       last_name: lastName.trim(),
       role,
       max_sessions_per_week: maxSessions,
+      enabled,
     };
 
     setSaving(true);
@@ -271,6 +274,15 @@
               </View>
             </View>
 
+            <View style={styles.toggleRow}>
+              <Text style={styles.fieldLabel}>AKTIVAN</Text>
+              <Toggle
+                value={enabled}
+                onValueChange={setEnabled}
+                disabled={saving}
+              />
+            </View>
+
             <View style={styles.modalFooter}>
               <Pressable
                 onPress={closeEditModal}
@@ -422,6 +434,15 @@
     fontWeight: "700",
     color: Colors.ink,
   },
+  toggleRow: {
+    alignItems: "center",
+    borderColor: Colors.fieldBorder,
+    borderRadius: Radii.tile[14],
+    borderWidth: 1,
+    flexDirection: "row",
+    justifyContent: "space-between",
+    padding: Spacing.cardPadding,
+  },
   modalFooter: {
     flexDirection: "row",
     gap: 10,
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 63f74934074ec361d3383d1bebe96ac5e5d71acb..4801d628d5e217ef3697d2c810f8009472020128
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -35,6 +35,16 @@
   }[day],
 }));
 
+const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
+
+const formatTime = (value: string) => {
+  const digits = value.replace(/\D/g, "").slice(0, 4);
+
+  return digits.length > 2
+    ? `${digits.slice(0, 2)}:${digits.slice(2)}`
+    : digits;
+};
+
 export default function TrainingDetailScreen() {
   const router = useRouter();
   const insets = useSafeAreaInsets();
@@ -45,12 +55,12 @@
   const [title, setTitle] = useState("");
   const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
   const [time, setTime] = useState("");
-  const [room, setRoom] = useState("");
-  const [durationMin, setDurationMin] = useState<number | null>(null);
   const [maxParticipants, setMaxParticipants] = useState(10);
   const [isOpen, setIsOpen] = useState(true);
   const [submitting, setSubmitting] = useState(false);
+  const [saveAttempted, setSaveAttempted] = useState(false);
   const [initializedId, setInitializedId] = useState<string | null>(null);
+  const isTimeValid = TIME_PATTERN.test(time.trim());
 
   useEffect(() => {
     if (!training || initializedId === training.id) return;
@@ -61,9 +71,7 @@
         ? (training.day_of_week as Day)
         : "monday",
     );
-    setTime(training.time);
-    setRoom(training.room ?? "");
-    setDurationMin(training.duration_min);
+    setTime(formatTime(training.time));
     setMaxParticipants(Math.min(50, Math.max(1, training.max_participants)));
     setIsOpen(training.is_open);
     setInitializedId(training.id);
@@ -73,7 +81,7 @@
     const normalizedTitle = title.trim();
     const normalizedTime = time.trim();
 
-    if (!normalizedTitle || !normalizedTime || maxParticipants < 1) {
+    if (!normalizedTitle || maxParticipants < 1) {
       Alert.alert(
         "Proverite podatke",
         "Naziv, vreme i najmanje jedan učesnik su obavezni.",
@@ -81,13 +89,22 @@
       return;
     }
 
+    if (!TIME_PATTERN.test(normalizedTime)) {
+      setSaveAttempted(true);
+      Alert.alert(
+        "Proverite vreme",
+        "Vreme mora biti u formatu HH:MM (00:00–23:59).",
+      );
+      return;
+    }
+
     const input: UpsertSessionInput = {
       id: isNew ? null : id,
       title: normalizedTitle,
       day_of_week: dayOfWeek,
       time: normalizedTime,
-      room: room.trim() || null,
-      duration_min: durationMin,
+      room: null,
+      duration_min: null,
       max_participants: maxParticipants,
       is_open: isOpen,
     };
@@ -171,35 +188,11 @@
             <Text style={styles.fieldLabel}>VREME</Text>
             <TextInput
               value={time}
-              onChangeText={setTime}
+              onChangeText={(value) => setTime(formatTime(value))}
               placeholder="18:00"
               placeholderTextColor={Colors.inkFaint}
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>TRAJANJE (MIN)</Text>
-            <TextInput
-              value={durationMin?.toString() ?? ""}
-              onChangeText={(value) =>
-                setDurationMin(
-                  value === "" ? null : Number(value.replace(/\D/g, "")),
-                )
-              }
               keyboardType="number-pad"
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-        </View>
-
-        <View style={styles.fieldRow}>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>SALA</Text>
-            <TextInput
-              value={room}
-              onChangeText={setRoom}
+              maxLength={5}
               editable={!submitting}
               style={styles.input}
             />
@@ -254,8 +247,12 @@
           </Pressable>
           <Pressable
             onPress={() => void submit()}
-            disabled={submitting}
-            style={[styles.saveButton, submitting && styles.buttonDisabled]}
+            disabled={submitting || (saveAttempted && !isTimeValid)}
+            style={[
+              styles.saveButton,
+              (submitting || (saveAttempted && !isTimeValid)) &&
+                styles.buttonDisabled,
+            ]}
           >
             {submitting ? (
               <ActivityIndicator color={Colors.surface} />
diff --git a/app/profile.tsx b/app/profile.tsx
index 799b71f8e307cbf3a41a1bf6b20ec8ef2690ad6f..790b7d86082f4b0eaca59eb77c0739f7fb1b4e27
--- a/app/profile.tsx
+++ b/app/profile.tsx
@@ -8,7 +8,6 @@
 import { FontFamilies, Typography } from "@/constants/typography";
 import { useAuth } from "@/hooks/useAuth";
 import { useTrainings } from "@/hooks/useTrainings";
-import { clampWeeklyLimit } from "@/utils/limits";
 import { getCurrentWeekDates } from "@/utils/week";
 
 const DAY_LABELS: Record<Day, string> = {
@@ -26,8 +25,9 @@
 
 export default function ProfileScreen() {
   const router = useRouter();
-  const { logout, profile, session, updateProfile } = useAuth();
+  const { logout, profile, session } = useAuth();
   const { bookedCount, trainings } = useTrainings();
+  const isAdmin = profile?.role === "admin";
   const weekDates = getCurrentWeekDates();
   const max = profile?.max_sessions_per_week ?? 0;
   const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;
@@ -55,15 +55,7 @@
 
       return dayDifference || a.time.localeCompare(b.time);
     });
-
-  const changeLimit = (delta: number) => {
-    const newValue = clampWeeklyLimit(max, delta, bookedCount);
 
-    if (newValue !== max) {
-      void updateProfile({ max_sessions_per_week: newValue });
-    }
-  };
-
   return (
     <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
       <View style={styles.navBar}>
@@ -92,15 +84,19 @@
               <Text style={styles.initials}>{initials || "P"}</Text>
             </View>
           </View>
-          <Text style={styles.name}>{fullName || "Perun član"}</Text>
-          {/* Inferred placeholder: Profile has no created_at field. */}
+          <Text style={styles.name}>
+            {fullName || (isAdmin ? "Perun admin" : "Perun član")}
+          </Text>
           <View style={styles.membershipChip}>
-            <Text style={styles.membershipText}>ČLAN OD MAR 2024.</Text>
+            <Text style={styles.membershipText}>
+              {isAdmin ? "ADMIN" : "ČLAN OD MAR 2024."}
+            </Text>
           </View>
         </View>
 
-        {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
-        <View style={styles.statsRow}>
+        {!isAdmin && <>
+          {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
+          <View style={styles.statsRow}>
           <View style={styles.statTile}>
             <Text style={styles.placeholderMarker}>PRIMER</Text>
             <Text style={[styles.statFigure, styles.burgundyStat]}>48</Text>
@@ -111,70 +107,26 @@
             <Text style={[styles.statFigure, styles.sageStat]}>5</Text>
             <Text style={styles.statLabel}>nedelja u nizu</Text>
           </View>
-        </View>
+          </View>
 
-        <View style={styles.limitCard}>
-          <View style={styles.limitHeader}>
-            <View style={styles.limitHeaderCopy}>
+          <View style={styles.limitCard}>
+            <View style={styles.limitHeader}>
               <Text style={styles.limitTitle}>Nedeljni limit</Text>
-              <Text style={styles.limitSubtitle}>
-                Maksimalno treninga po nedelji
+              <Text style={styles.usageValue}>
+                {bookedCount} / {max} ove nedelje
               </Text>
             </View>
-            <View style={styles.stepper}>
-              <Pressable
-                accessibilityLabel="Smanji nedeljni limit"
-                accessibilityRole="button"
-                disabled={max <= bookedCount}
-                onPress={() => changeLimit(-1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max <= bookedCount && styles.disabledStepperButton,
-                  ]}
-                >
-                  −
-                </Text>
-              </Pressable>
-              <Text style={styles.stepperValue}>{max}</Text>
-              <Pressable
-                accessibilityLabel="Povećaj nedeljni limit"
-                accessibilityRole="button"
-                disabled={max >= 7}
-                onPress={() => changeLimit(1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max >= 7 && styles.disabledStepperButton,
-                  ]}
-                >
-                  +
-                </Text>
-              </Pressable>
+            <View style={styles.track}>
+              <View style={[styles.fill, { width: `${progress}%` }]}>
+                <View style={styles.fillHighlight} />
+              </View>
             </View>
           </View>
 
-          <View style={styles.usageRow}>
-            <Text style={styles.usageLabel}>ISKORIŠĆENO OVE NEDELJE</Text>
-            <Text style={styles.usageValue}>
-              {bookedCount} / {max}
-            </Text>
-          </View>
-          <View style={styles.track}>
-            <View style={[styles.fill, { width: `${progress}%` }]}>
-              <View style={styles.fillHighlight} />
-            </View>
-          </View>
-        </View>
-
-        <Text style={styles.sessionsSectionTitle}>
-          MOJI TERMINI OVE NEDELJE
-        </Text>
-        <View style={styles.sessionsList}>
+          <Text style={styles.sessionsSectionTitle}>
+            MOJI TERMINI OVE NEDELJE
+          </Text>
+          <View style={styles.sessionsList}>
           {bookedSessions.map((training) => {
             const day = training.day_of_week as Day;
             const dateNumber = String(weekDates[day].getUTCDate()).padStart(
@@ -203,7 +155,8 @@
               </View>
             );
           })}
-        </View>
+          </View>
+        </>}
 
         <View style={styles.logoutContainer}>
           <Pressable
@@ -374,61 +327,12 @@
     alignItems: "center",
     flexDirection: "row",
     justifyContent: "space-between",
-  },
-  limitHeaderCopy: {
-    flex: 1,
-    paddingRight: 10,
   },
   limitTitle: {
     color: Colors.ink,
     fontFamily: FontFamilies.hanken[700],
     fontSize: 14.5,
-    fontWeight: "700",
-  },
-  limitSubtitle: {
-    color: Colors.inkMuted,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 12,
-    fontWeight: "600",
-    marginTop: 2,
-  },
-  stepper: {
-    alignItems: "center",
-    backgroundColor: Colors.surfaceMuted,
-    borderColor: "#EFE3D2",
-    borderRadius: Radii.tile[14],
-    borderWidth: 1,
-    flexDirection: "row",
-    gap: 14,
-    paddingHorizontal: 12,
-    paddingVertical: 7,
-  },
-  stepperButton: {
-    color: Colors.burgundy,
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 18,
     fontWeight: "700",
-  },
-  disabledStepperButton: {
-    opacity: 0.3,
-  },
-  stepperValue: {
-    color: Colors.ink,
-    fontFamily: FontFamilies.bricolage[800],
-    fontSize: 18,
-    fontWeight: "800",
-    minWidth: 14,
-    textAlign: "center",
-  },
-  usageRow: {
-    alignItems: "baseline",
-    flexDirection: "row",
-    justifyContent: "space-between",
-    marginTop: 16,
-  },
-  usageLabel: {
-    ...Typography.microLabelWide,
-    color: Colors.inkFaint,
   },
   usageValue: {
     color: Colors.inkMuted,
diff --git a/src/components/TrainingCard.tsx b/src/components/TrainingCard.tsx
index 0266c0c6c9ac88cf3019e5e52465866469aa195f..9a2cb1ab0e3adb63f004951e4881ce1dfbbe2631
--- a/src/components/TrainingCard.tsx
+++ b/src/components/TrainingCard.tsx
@@ -69,9 +69,6 @@
             <Text style={[styles.time, fullAndNotBooked && styles.fullTime]}>
               {training.time.slice(0, 5)}
             </Text>
-            <Text style={[styles.duration, fullAndNotBooked && styles.fullMeta]}>
-              60 min
-            </Text>
           </View>
 
           <View
@@ -90,7 +87,7 @@
               {training.title}
             </Text>
             <Text style={[styles.category, fullAndNotBooked && styles.fullTime]}>
-              Grupni · Sala A
+              Grupni
             </Text>
           </View>
 
@@ -271,13 +268,6 @@
     color: Colors.ink,
     lineHeight: 21,
   },
-  duration: {
-    color: Colors.inkFaint,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 10.5,
-    fontWeight: "600",
-    marginTop: 4,
-  },
   divider: {
     alignSelf: "stretch",
     backgroundColor: Colors.border,
@@ -304,9 +294,6 @@
   },
   fullTime: {
     color: "#9A9098",
-  },
-  fullMeta: {
-    color: "#ADA3AC",
   },
   fullTitle: {
     color: "#6E6670",
diff --git a/src/components/admin/StatTile.tsx b/src/components/admin/StatTile.tsx
index f89911629950685fc1017589872392a2abfdcc70..a1ebd8dd9c9c273fe7f42cb483fca30ca57a0aac
--- a/src/components/admin/StatTile.tsx
+++ b/src/components/admin/StatTile.tsx
@@ -23,6 +23,7 @@
 
 const styles = StyleSheet.create({
   tile: {
+    flex: 1,
     backgroundColor: Colors.surface,
     borderColor: Colors.border,
     borderWidth: 1,

exec
/bin/zsh -lc "npx prettier --write 'app/(admin)/training/[id].tsx' && npx tsc --noEmit && npm run lint && npm test -- --runInBand && git diff --check -- 'app/(admin)/training/[id].tsx' src/components/TrainingCard.tsx 'app/(admin)/(tabs)/index.tsx' 'app/(admin)/(tabs)/stats.tsx' 'app/(admin)/(tabs)/users.tsx' app/profile.tsx src/components/admin/StatTile.tsx" in /Users/uros/Documents/Private/Projects/PerunApp
diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 9bbdc139ee145ef44f2e9213834d3fa01e054538..d1e54156c394b7d46c02642411b2fd9a93e44cdd
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -242,6 +242,7 @@
     gap: 11,
   },
   tileRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 11,
   },
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index 23542459a42a8a534685faae85a0dfe5a6e77157..f268a63f9095c10157b70956ea2820eb803bc7a8
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -255,6 +255,7 @@
     color: "#4E7A5C",
   },
   secondaryRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 12,
   },
diff --git a/app/(admin)/(tabs)/users.tsx b/app/(admin)/(tabs)/users.tsx
index 474ea6041ae5182a684fddd9dc2ed3516a9972e3..2720d5d075f5a7d65d2316aeb2477fe8f0766157
--- a/app/(admin)/(tabs)/users.tsx
+++ b/app/(admin)/(tabs)/users.tsx
@@ -11,7 +11,7 @@
   View,
 } from "react-native";
 
-import { FilterChips, UserRow } from "@/components/admin";
+import { FilterChips, Toggle, UserRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
@@ -44,6 +44,7 @@
   const [lastName, setLastName] = useState("");
   const [role, setRole] = useState<UserRole>("user");
   const [maxSessions, setMaxSessions] = useState(0);
+  const [enabled, setEnabled] = useState(true);
   const [saving, setSaving] = useState(false);
 
   const fetchUsers = useCallback(async () => {
@@ -85,6 +86,7 @@
     setLastName(user.last_name ?? "");
     setRole(user.role);
     setMaxSessions(user.max_sessions_per_week);
+    setEnabled(user.enabled ?? true);
   };
 
   const closeEditModal = () => {
@@ -99,6 +101,7 @@
       last_name: lastName.trim(),
       role,
       max_sessions_per_week: maxSessions,
+      enabled,
     };
 
     setSaving(true);
@@ -271,6 +274,15 @@
               </View>
             </View>
 
+            <View style={styles.toggleRow}>
+              <Text style={styles.fieldLabel}>AKTIVAN</Text>
+              <Toggle
+                value={enabled}
+                onValueChange={setEnabled}
+                disabled={saving}
+              />
+            </View>
+
             <View style={styles.modalFooter}>
               <Pressable
                 onPress={closeEditModal}
@@ -422,6 +434,15 @@
     fontWeight: "700",
     color: Colors.ink,
   },
+  toggleRow: {
+    alignItems: "center",
+    borderColor: Colors.fieldBorder,
+    borderRadius: Radii.tile[14],
+    borderWidth: 1,
+    flexDirection: "row",
+    justifyContent: "space-between",
+    padding: Spacing.cardPadding,
+  },
   modalFooter: {
     flexDirection: "row",
     gap: 10,
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 63f74934074ec361d3383d1bebe96ac5e5d71acb..4801d628d5e217ef3697d2c810f8009472020128
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -35,6 +35,16 @@
   }[day],
 }));
 
+const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
+
+const formatTime = (value: string) => {
+  const digits = value.replace(/\D/g, "").slice(0, 4);
+
+  return digits.length > 2
+    ? `${digits.slice(0, 2)}:${digits.slice(2)}`
+    : digits;
+};
+
 export default function TrainingDetailScreen() {
   const router = useRouter();
   const insets = useSafeAreaInsets();
@@ -45,12 +55,12 @@
   const [title, setTitle] = useState("");
   const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
   const [time, setTime] = useState("");
-  const [room, setRoom] = useState("");
-  const [durationMin, setDurationMin] = useState<number | null>(null);
   const [maxParticipants, setMaxParticipants] = useState(10);
   const [isOpen, setIsOpen] = useState(true);
   const [submitting, setSubmitting] = useState(false);
+  const [saveAttempted, setSaveAttempted] = useState(false);
   const [initializedId, setInitializedId] = useState<string | null>(null);
+  const isTimeValid = TIME_PATTERN.test(time.trim());
 
   useEffect(() => {
     if (!training || initializedId === training.id) return;
@@ -61,9 +71,7 @@
         ? (training.day_of_week as Day)
         : "monday",
     );
-    setTime(training.time);
-    setRoom(training.room ?? "");
-    setDurationMin(training.duration_min);
+    setTime(formatTime(training.time));
     setMaxParticipants(Math.min(50, Math.max(1, training.max_participants)));
     setIsOpen(training.is_open);
     setInitializedId(training.id);
@@ -73,7 +81,7 @@
     const normalizedTitle = title.trim();
     const normalizedTime = time.trim();
 
-    if (!normalizedTitle || !normalizedTime || maxParticipants < 1) {
+    if (!normalizedTitle || maxParticipants < 1) {
       Alert.alert(
         "Proverite podatke",
         "Naziv, vreme i najmanje jedan učesnik su obavezni.",
@@ -81,13 +89,22 @@
       return;
     }
 
+    if (!TIME_PATTERN.test(normalizedTime)) {
+      setSaveAttempted(true);
+      Alert.alert(
+        "Proverite vreme",
+        "Vreme mora biti u formatu HH:MM (00:00–23:59).",
+      );
+      return;
+    }
+
     const input: UpsertSessionInput = {
       id: isNew ? null : id,
       title: normalizedTitle,
       day_of_week: dayOfWeek,
       time: normalizedTime,
-      room: room.trim() || null,
-      duration_min: durationMin,
+      room: null,
+      duration_min: null,
       max_participants: maxParticipants,
       is_open: isOpen,
     };
@@ -171,35 +188,11 @@
             <Text style={styles.fieldLabel}>VREME</Text>
             <TextInput
               value={time}
-              onChangeText={setTime}
+              onChangeText={(value) => setTime(formatTime(value))}
               placeholder="18:00"
               placeholderTextColor={Colors.inkFaint}
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>TRAJANJE (MIN)</Text>
-            <TextInput
-              value={durationMin?.toString() ?? ""}
-              onChangeText={(value) =>
-                setDurationMin(
-                  value === "" ? null : Number(value.replace(/\D/g, "")),
-                )
-              }
               keyboardType="number-pad"
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-        </View>
-
-        <View style={styles.fieldRow}>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>SALA</Text>
-            <TextInput
-              value={room}
-              onChangeText={setRoom}
+              maxLength={5}
               editable={!submitting}
               style={styles.input}
             />
@@ -254,8 +247,12 @@
           </Pressable>
           <Pressable
             onPress={() => void submit()}
-            disabled={submitting}
-            style={[styles.saveButton, submitting && styles.buttonDisabled]}
+            disabled={submitting || (saveAttempted && !isTimeValid)}
+            style={[
+              styles.saveButton,
+              (submitting || (saveAttempted && !isTimeValid)) &&
+                styles.buttonDisabled,
+            ]}
           >
             {submitting ? (
               <ActivityIndicator color={Colors.surface} />
diff --git a/app/profile.tsx b/app/profile.tsx
index 799b71f8e307cbf3a41a1bf6b20ec8ef2690ad6f..790b7d86082f4b0eaca59eb77c0739f7fb1b4e27
--- a/app/profile.tsx
+++ b/app/profile.tsx
@@ -8,7 +8,6 @@
 import { FontFamilies, Typography } from "@/constants/typography";
 import { useAuth } from "@/hooks/useAuth";
 import { useTrainings } from "@/hooks/useTrainings";
-import { clampWeeklyLimit } from "@/utils/limits";
 import { getCurrentWeekDates } from "@/utils/week";
 
 const DAY_LABELS: Record<Day, string> = {
@@ -26,8 +25,9 @@
 
 export default function ProfileScreen() {
   const router = useRouter();
-  const { logout, profile, session, updateProfile } = useAuth();
+  const { logout, profile, session } = useAuth();
   const { bookedCount, trainings } = useTrainings();
+  const isAdmin = profile?.role === "admin";
   const weekDates = getCurrentWeekDates();
   const max = profile?.max_sessions_per_week ?? 0;
   const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;
@@ -55,15 +55,7 @@
 
       return dayDifference || a.time.localeCompare(b.time);
     });
-
-  const changeLimit = (delta: number) => {
-    const newValue = clampWeeklyLimit(max, delta, bookedCount);
 
-    if (newValue !== max) {
-      void updateProfile({ max_sessions_per_week: newValue });
-    }
-  };
-
   return (
     <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
       <View style={styles.navBar}>
@@ -92,15 +84,19 @@
               <Text style={styles.initials}>{initials || "P"}</Text>
             </View>
           </View>
-          <Text style={styles.name}>{fullName || "Perun član"}</Text>
-          {/* Inferred placeholder: Profile has no created_at field. */}
+          <Text style={styles.name}>
+            {fullName || (isAdmin ? "Perun admin" : "Perun član")}
+          </Text>
           <View style={styles.membershipChip}>
-            <Text style={styles.membershipText}>ČLAN OD MAR 2024.</Text>
+            <Text style={styles.membershipText}>
+              {isAdmin ? "ADMIN" : "ČLAN OD MAR 2024."}
+            </Text>
           </View>
         </View>
 
-        {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
-        <View style={styles.statsRow}>
+        {!isAdmin && <>
+          {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
+          <View style={styles.statsRow}>
           <View style={styles.statTile}>
             <Text style={styles.placeholderMarker}>PRIMER</Text>
             <Text style={[styles.statFigure, styles.burgundyStat]}>48</Text>
@@ -111,70 +107,26 @@
             <Text style={[styles.statFigure, styles.sageStat]}>5</Text>
             <Text style={styles.statLabel}>nedelja u nizu</Text>
           </View>
-        </View>
+          </View>
 
-        <View style={styles.limitCard}>
-          <View style={styles.limitHeader}>
-            <View style={styles.limitHeaderCopy}>
+          <View style={styles.limitCard}>
+            <View style={styles.limitHeader}>
               <Text style={styles.limitTitle}>Nedeljni limit</Text>
-              <Text style={styles.limitSubtitle}>
-                Maksimalno treninga po nedelji
+              <Text style={styles.usageValue}>
+                {bookedCount} / {max} ove nedelje
               </Text>
             </View>
-            <View style={styles.stepper}>
-              <Pressable
-                accessibilityLabel="Smanji nedeljni limit"
-                accessibilityRole="button"
-                disabled={max <= bookedCount}
-                onPress={() => changeLimit(-1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max <= bookedCount && styles.disabledStepperButton,
-                  ]}
-                >
-                  −
-                </Text>
-              </Pressable>
-              <Text style={styles.stepperValue}>{max}</Text>
-              <Pressable
-                accessibilityLabel="Povećaj nedeljni limit"
-                accessibilityRole="button"
-                disabled={max >= 7}
-                onPress={() => changeLimit(1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max >= 7 && styles.disabledStepperButton,
-                  ]}
-                >
-                  +
-                </Text>
-              </Pressable>
+            <View style={styles.track}>
+              <View style={[styles.fill, { width: `${progress}%` }]}>
+                <View style={styles.fillHighlight} />
+              </View>
             </View>
           </View>
 
-          <View style={styles.usageRow}>
-            <Text style={styles.usageLabel}>ISKORIŠĆENO OVE NEDELJE</Text>
-            <Text style={styles.usageValue}>
-              {bookedCount} / {max}
-            </Text>
-          </View>
-          <View style={styles.track}>
-            <View style={[styles.fill, { width: `${progress}%` }]}>
-              <View style={styles.fillHighlight} />
-            </View>
-          </View>
-        </View>
-
-        <Text style={styles.sessionsSectionTitle}>
-          MOJI TERMINI OVE NEDELJE
-        </Text>
-        <View style={styles.sessionsList}>
+          <Text style={styles.sessionsSectionTitle}>
+            MOJI TERMINI OVE NEDELJE
+          </Text>
+          <View style={styles.sessionsList}>
           {bookedSessions.map((training) => {
             const day = training.day_of_week as Day;
             const dateNumber = String(weekDates[day].getUTCDate()).padStart(
@@ -203,7 +155,8 @@
               </View>
             );
           })}
-        </View>
+          </View>
+        </>}
 
         <View style={styles.logoutContainer}>
           <Pressable
@@ -374,61 +327,12 @@
     alignItems: "center",
     flexDirection: "row",
     justifyContent: "space-between",
-  },
-  limitHeaderCopy: {
-    flex: 1,
-    paddingRight: 10,
   },
   limitTitle: {
     color: Colors.ink,
     fontFamily: FontFamilies.hanken[700],
     fontSize: 14.5,
-    fontWeight: "700",
-  },
-  limitSubtitle: {
-    color: Colors.inkMuted,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 12,
-    fontWeight: "600",
-    marginTop: 2,
-  },
-  stepper: {
-    alignItems: "center",
-    backgroundColor: Colors.surfaceMuted,
-    borderColor: "#EFE3D2",
-    borderRadius: Radii.tile[14],
-    borderWidth: 1,
-    flexDirection: "row",
-    gap: 14,
-    paddingHorizontal: 12,
-    paddingVertical: 7,
-  },
-  stepperButton: {
-    color: Colors.burgundy,
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 18,
     fontWeight: "700",
-  },
-  disabledStepperButton: {
-    opacity: 0.3,
-  },
-  stepperValue: {
-    color: Colors.ink,
-    fontFamily: FontFamilies.bricolage[800],
-    fontSize: 18,
-    fontWeight: "800",
-    minWidth: 14,
-    textAlign: "center",
-  },
-  usageRow: {
-    alignItems: "baseline",
-    flexDirection: "row",
-    justifyContent: "space-between",
-    marginTop: 16,
-  },
-  usageLabel: {
-    ...Typography.microLabelWide,
-    color: Colors.inkFaint,
   },
   usageValue: {
     color: Colors.inkMuted,
diff --git a/src/components/TrainingCard.tsx b/src/components/TrainingCard.tsx
index 0266c0c6c9ac88cf3019e5e52465866469aa195f..9a2cb1ab0e3adb63f004951e4881ce1dfbbe2631
--- a/src/components/TrainingCard.tsx
+++ b/src/components/TrainingCard.tsx
@@ -69,9 +69,6 @@
             <Text style={[styles.time, fullAndNotBooked && styles.fullTime]}>
               {training.time.slice(0, 5)}
             </Text>
-            <Text style={[styles.duration, fullAndNotBooked && styles.fullMeta]}>
-              60 min
-            </Text>
           </View>
 
           <View
@@ -90,7 +87,7 @@
               {training.title}
             </Text>
             <Text style={[styles.category, fullAndNotBooked && styles.fullTime]}>
-              Grupni · Sala A
+              Grupni
             </Text>
           </View>
 
@@ -271,13 +268,6 @@
     color: Colors.ink,
     lineHeight: 21,
   },
-  duration: {
-    color: Colors.inkFaint,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 10.5,
-    fontWeight: "600",
-    marginTop: 4,
-  },
   divider: {
     alignSelf: "stretch",
     backgroundColor: Colors.border,
@@ -304,9 +294,6 @@
   },
   fullTime: {
     color: "#9A9098",
-  },
-  fullMeta: {
-    color: "#ADA3AC",
   },
   fullTitle: {
     color: "#6E6670",
diff --git a/src/components/admin/StatTile.tsx b/src/components/admin/StatTile.tsx
index f89911629950685fc1017589872392a2abfdcc70..a1ebd8dd9c9c273fe7f42cb483fca30ca57a0aac
--- a/src/components/admin/StatTile.tsx
+++ b/src/components/admin/StatTile.tsx
@@ -23,6 +23,7 @@
 
 const styles = StyleSheet.create({
   tile: {
+    flex: 1,
     backgroundColor: Colors.surface,
     borderColor: Colors.border,
     borderWidth: 1,

 succeeded in 7357ms:
app/(admin)/training/[id].tsx 127ms (unchanged)

> peruntreningcentar@1.0.0 lint
> eslint .


> peruntreningcentar@1.0.0 test
> jest --runInBand

PASS src/utils/__tests__/limits.test.ts
PASS src/utils/__tests__/week.test.ts
PASS src/constants/__tests__/tokens.test.ts
PASS src/constants/__tests__/days.test.ts

Test Suites: 4 passed, 4 total
Tests:       12 passed, 12 total
Snapshots:   0 total
Time:        0.593 s, estimated 1 s
Ran all test suites.

codex
Implemented B1, B2 profile, B3, B4, B5 UI, and D5 across the seven approved files.

Validation passed:

- TypeScript
- ESLint
- 12/12 tests
- Diff whitespace check

DONE
diff --git a/app/(admin)/(tabs)/index.tsx b/app/(admin)/(tabs)/index.tsx
index 9bbdc139ee145ef44f2e9213834d3fa01e054538..d1e54156c394b7d46c02642411b2fd9a93e44cdd
--- a/app/(admin)/(tabs)/index.tsx
+++ b/app/(admin)/(tabs)/index.tsx
@@ -242,6 +242,7 @@
     gap: 11,
   },
   tileRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 11,
   },
diff --git a/app/(admin)/(tabs)/stats.tsx b/app/(admin)/(tabs)/stats.tsx
index 23542459a42a8a534685faae85a0dfe5a6e77157..f268a63f9095c10157b70956ea2820eb803bc7a8
--- a/app/(admin)/(tabs)/stats.tsx
+++ b/app/(admin)/(tabs)/stats.tsx
@@ -255,6 +255,7 @@
     color: "#4E7A5C",
   },
   secondaryRow: {
+    alignItems: "stretch",
     flexDirection: "row",
     gap: 12,
   },
diff --git a/app/(admin)/(tabs)/users.tsx b/app/(admin)/(tabs)/users.tsx
index 474ea6041ae5182a684fddd9dc2ed3516a9972e3..2720d5d075f5a7d65d2316aeb2477fe8f0766157
--- a/app/(admin)/(tabs)/users.tsx
+++ b/app/(admin)/(tabs)/users.tsx
@@ -11,7 +11,7 @@
   View,
 } from "react-native";
 
-import { FilterChips, UserRow } from "@/components/admin";
+import { FilterChips, Toggle, UserRow } from "@/components/admin";
 import { Colors } from "@/constants/Colors";
 import { Radii, Shadows, Spacing } from "@/constants/spacing";
 import { FontFamilies, Typography } from "@/constants/typography";
@@ -44,6 +44,7 @@
   const [lastName, setLastName] = useState("");
   const [role, setRole] = useState<UserRole>("user");
   const [maxSessions, setMaxSessions] = useState(0);
+  const [enabled, setEnabled] = useState(true);
   const [saving, setSaving] = useState(false);
 
   const fetchUsers = useCallback(async () => {
@@ -85,6 +86,7 @@
     setLastName(user.last_name ?? "");
     setRole(user.role);
     setMaxSessions(user.max_sessions_per_week);
+    setEnabled(user.enabled ?? true);
   };
 
   const closeEditModal = () => {
@@ -99,6 +101,7 @@
       last_name: lastName.trim(),
       role,
       max_sessions_per_week: maxSessions,
+      enabled,
     };
 
     setSaving(true);
@@ -271,6 +274,15 @@
               </View>
             </View>
 
+            <View style={styles.toggleRow}>
+              <Text style={styles.fieldLabel}>AKTIVAN</Text>
+              <Toggle
+                value={enabled}
+                onValueChange={setEnabled}
+                disabled={saving}
+              />
+            </View>
+
             <View style={styles.modalFooter}>
               <Pressable
                 onPress={closeEditModal}
@@ -422,6 +434,15 @@
     fontWeight: "700",
     color: Colors.ink,
   },
+  toggleRow: {
+    alignItems: "center",
+    borderColor: Colors.fieldBorder,
+    borderRadius: Radii.tile[14],
+    borderWidth: 1,
+    flexDirection: "row",
+    justifyContent: "space-between",
+    padding: Spacing.cardPadding,
+  },
   modalFooter: {
     flexDirection: "row",
     gap: 10,
diff --git a/app/(admin)/training/[id].tsx b/app/(admin)/training/[id].tsx
index 63f74934074ec361d3383d1bebe96ac5e5d71acb..4801d628d5e217ef3697d2c810f8009472020128
--- a/app/(admin)/training/[id].tsx
+++ b/app/(admin)/training/[id].tsx
@@ -35,6 +35,16 @@
   }[day],
 }));
 
+const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
+
+const formatTime = (value: string) => {
+  const digits = value.replace(/\D/g, "").slice(0, 4);
+
+  return digits.length > 2
+    ? `${digits.slice(0, 2)}:${digits.slice(2)}`
+    : digits;
+};
+
 export default function TrainingDetailScreen() {
   const router = useRouter();
   const insets = useSafeAreaInsets();
@@ -45,12 +55,12 @@
   const [title, setTitle] = useState("");
   const [dayOfWeek, setDayOfWeek] = useState<Day>("monday");
   const [time, setTime] = useState("");
-  const [room, setRoom] = useState("");
-  const [durationMin, setDurationMin] = useState<number | null>(null);
   const [maxParticipants, setMaxParticipants] = useState(10);
   const [isOpen, setIsOpen] = useState(true);
   const [submitting, setSubmitting] = useState(false);
+  const [saveAttempted, setSaveAttempted] = useState(false);
   const [initializedId, setInitializedId] = useState<string | null>(null);
+  const isTimeValid = TIME_PATTERN.test(time.trim());
 
   useEffect(() => {
     if (!training || initializedId === training.id) return;
@@ -61,9 +71,7 @@
         ? (training.day_of_week as Day)
         : "monday",
     );
-    setTime(training.time);
-    setRoom(training.room ?? "");
-    setDurationMin(training.duration_min);
+    setTime(formatTime(training.time));
     setMaxParticipants(Math.min(50, Math.max(1, training.max_participants)));
     setIsOpen(training.is_open);
     setInitializedId(training.id);
@@ -73,7 +81,7 @@
     const normalizedTitle = title.trim();
     const normalizedTime = time.trim();
 
-    if (!normalizedTitle || !normalizedTime || maxParticipants < 1) {
+    if (!normalizedTitle || maxParticipants < 1) {
       Alert.alert(
         "Proverite podatke",
         "Naziv, vreme i najmanje jedan učesnik su obavezni.",
@@ -81,13 +89,22 @@
       return;
     }
 
+    if (!TIME_PATTERN.test(normalizedTime)) {
+      setSaveAttempted(true);
+      Alert.alert(
+        "Proverite vreme",
+        "Vreme mora biti u formatu HH:MM (00:00–23:59).",
+      );
+      return;
+    }
+
     const input: UpsertSessionInput = {
       id: isNew ? null : id,
       title: normalizedTitle,
       day_of_week: dayOfWeek,
       time: normalizedTime,
-      room: room.trim() || null,
-      duration_min: durationMin,
+      room: null,
+      duration_min: null,
       max_participants: maxParticipants,
       is_open: isOpen,
     };
@@ -171,35 +188,11 @@
             <Text style={styles.fieldLabel}>VREME</Text>
             <TextInput
               value={time}
-              onChangeText={setTime}
+              onChangeText={(value) => setTime(formatTime(value))}
               placeholder="18:00"
               placeholderTextColor={Colors.inkFaint}
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>TRAJANJE (MIN)</Text>
-            <TextInput
-              value={durationMin?.toString() ?? ""}
-              onChangeText={(value) =>
-                setDurationMin(
-                  value === "" ? null : Number(value.replace(/\D/g, "")),
-                )
-              }
               keyboardType="number-pad"
-              editable={!submitting}
-              style={styles.input}
-            />
-          </View>
-        </View>
-
-        <View style={styles.fieldRow}>
-          <View style={styles.columnField}>
-            <Text style={styles.fieldLabel}>SALA</Text>
-            <TextInput
-              value={room}
-              onChangeText={setRoom}
+              maxLength={5}
               editable={!submitting}
               style={styles.input}
             />
@@ -254,8 +247,12 @@
           </Pressable>
           <Pressable
             onPress={() => void submit()}
-            disabled={submitting}
-            style={[styles.saveButton, submitting && styles.buttonDisabled]}
+            disabled={submitting || (saveAttempted && !isTimeValid)}
+            style={[
+              styles.saveButton,
+              (submitting || (saveAttempted && !isTimeValid)) &&
+                styles.buttonDisabled,
+            ]}
           >
             {submitting ? (
               <ActivityIndicator color={Colors.surface} />
diff --git a/app/profile.tsx b/app/profile.tsx
index 799b71f8e307cbf3a41a1bf6b20ec8ef2690ad6f..790b7d86082f4b0eaca59eb77c0739f7fb1b4e27
--- a/app/profile.tsx
+++ b/app/profile.tsx
@@ -8,7 +8,6 @@
 import { FontFamilies, Typography } from "@/constants/typography";
 import { useAuth } from "@/hooks/useAuth";
 import { useTrainings } from "@/hooks/useTrainings";
-import { clampWeeklyLimit } from "@/utils/limits";
 import { getCurrentWeekDates } from "@/utils/week";
 
 const DAY_LABELS: Record<Day, string> = {
@@ -26,8 +25,9 @@
 
 export default function ProfileScreen() {
   const router = useRouter();
-  const { logout, profile, session, updateProfile } = useAuth();
+  const { logout, profile, session } = useAuth();
   const { bookedCount, trainings } = useTrainings();
+  const isAdmin = profile?.role === "admin";
   const weekDates = getCurrentWeekDates();
   const max = profile?.max_sessions_per_week ?? 0;
   const progress = max > 0 ? Math.min(100, (bookedCount / max) * 100) : 0;
@@ -55,15 +55,7 @@
 
       return dayDifference || a.time.localeCompare(b.time);
     });
-
-  const changeLimit = (delta: number) => {
-    const newValue = clampWeeklyLimit(max, delta, bookedCount);
 
-    if (newValue !== max) {
-      void updateProfile({ max_sessions_per_week: newValue });
-    }
-  };
-
   return (
     <SafeAreaView edges={["top", "bottom"]} style={styles.screen}>
       <View style={styles.navBar}>
@@ -92,15 +84,19 @@
               <Text style={styles.initials}>{initials || "P"}</Text>
             </View>
           </View>
-          <Text style={styles.name}>{fullName || "Perun član"}</Text>
-          {/* Inferred placeholder: Profile has no created_at field. */}
+          <Text style={styles.name}>
+            {fullName || (isAdmin ? "Perun admin" : "Perun član")}
+          </Text>
           <View style={styles.membershipChip}>
-            <Text style={styles.membershipText}>ČLAN OD MAR 2024.</Text>
+            <Text style={styles.membershipText}>
+              {isAdmin ? "ADMIN" : "ČLAN OD MAR 2024."}
+            </Text>
           </View>
         </View>
 
-        {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
-        <View style={styles.statsRow}>
+        {!isAdmin && <>
+          {/* Phase A examples, intentionally marked and dimmed until live stats land. */}
+          <View style={styles.statsRow}>
           <View style={styles.statTile}>
             <Text style={styles.placeholderMarker}>PRIMER</Text>
             <Text style={[styles.statFigure, styles.burgundyStat]}>48</Text>
@@ -111,70 +107,26 @@
             <Text style={[styles.statFigure, styles.sageStat]}>5</Text>
             <Text style={styles.statLabel}>nedelja u nizu</Text>
           </View>
-        </View>
+          </View>
 
-        <View style={styles.limitCard}>
-          <View style={styles.limitHeader}>
-            <View style={styles.limitHeaderCopy}>
+          <View style={styles.limitCard}>
+            <View style={styles.limitHeader}>
               <Text style={styles.limitTitle}>Nedeljni limit</Text>
-              <Text style={styles.limitSubtitle}>
-                Maksimalno treninga po nedelji
+              <Text style={styles.usageValue}>
+                {bookedCount} / {max} ove nedelje
               </Text>
             </View>
-            <View style={styles.stepper}>
-              <Pressable
-                accessibilityLabel="Smanji nedeljni limit"
-                accessibilityRole="button"
-                disabled={max <= bookedCount}
-                onPress={() => changeLimit(-1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max <= bookedCount && styles.disabledStepperButton,
-                  ]}
-                >
-                  −
-                </Text>
-              </Pressable>
-              <Text style={styles.stepperValue}>{max}</Text>
-              <Pressable
-                accessibilityLabel="Povećaj nedeljni limit"
-                accessibilityRole="button"
-                disabled={max >= 7}
-                onPress={() => changeLimit(1)}
-                style={({ pressed }) => pressed && styles.pressed}
-              >
-                <Text
-                  style={[
-                    styles.stepperButton,
-                    max >= 7 && styles.disabledStepperButton,
-                  ]}
-                >
-                  +
-                </Text>
-              </Pressable>
+            <View style={styles.track}>
+              <View style={[styles.fill, { width: `${progress}%` }]}>
+                <View style={styles.fillHighlight} />
+              </View>
             </View>
           </View>
 
-          <View style={styles.usageRow}>
-            <Text style={styles.usageLabel}>ISKORIŠĆENO OVE NEDELJE</Text>
-            <Text style={styles.usageValue}>
-              {bookedCount} / {max}
-            </Text>
-          </View>
-          <View style={styles.track}>
-            <View style={[styles.fill, { width: `${progress}%` }]}>
-              <View style={styles.fillHighlight} />
-            </View>
-          </View>
-        </View>
-
-        <Text style={styles.sessionsSectionTitle}>
-          MOJI TERMINI OVE NEDELJE
-        </Text>
-        <View style={styles.sessionsList}>
+          <Text style={styles.sessionsSectionTitle}>
+            MOJI TERMINI OVE NEDELJE
+          </Text>
+          <View style={styles.sessionsList}>
           {bookedSessions.map((training) => {
             const day = training.day_of_week as Day;
             const dateNumber = String(weekDates[day].getUTCDate()).padStart(
@@ -203,7 +155,8 @@
               </View>
             );
           })}
-        </View>
+          </View>
+        </>}
 
         <View style={styles.logoutContainer}>
           <Pressable
@@ -374,61 +327,12 @@
     alignItems: "center",
     flexDirection: "row",
     justifyContent: "space-between",
-  },
-  limitHeaderCopy: {
-    flex: 1,
-    paddingRight: 10,
   },
   limitTitle: {
     color: Colors.ink,
     fontFamily: FontFamilies.hanken[700],
     fontSize: 14.5,
-    fontWeight: "700",
-  },
-  limitSubtitle: {
-    color: Colors.inkMuted,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 12,
-    fontWeight: "600",
-    marginTop: 2,
-  },
-  stepper: {
-    alignItems: "center",
-    backgroundColor: Colors.surfaceMuted,
-    borderColor: "#EFE3D2",
-    borderRadius: Radii.tile[14],
-    borderWidth: 1,
-    flexDirection: "row",
-    gap: 14,
-    paddingHorizontal: 12,
-    paddingVertical: 7,
-  },
-  stepperButton: {
-    color: Colors.burgundy,
-    fontFamily: FontFamilies.hanken[700],
-    fontSize: 18,
     fontWeight: "700",
-  },
-  disabledStepperButton: {
-    opacity: 0.3,
-  },
-  stepperValue: {
-    color: Colors.ink,
-    fontFamily: FontFamilies.bricolage[800],
-    fontSize: 18,
-    fontWeight: "800",
-    minWidth: 14,
-    textAlign: "center",
-  },
-  usageRow: {
-    alignItems: "baseline",
-    flexDirection: "row",
-    justifyContent: "space-between",
-    marginTop: 16,
-  },
-  usageLabel: {
-    ...Typography.microLabelWide,
-    color: Colors.inkFaint,
   },
   usageValue: {
     color: Colors.inkMuted,
diff --git a/src/components/TrainingCard.tsx b/src/components/TrainingCard.tsx
index 0266c0c6c9ac88cf3019e5e52465866469aa195f..9a2cb1ab0e3adb63f004951e4881ce1dfbbe2631
--- a/src/components/TrainingCard.tsx
+++ b/src/components/TrainingCard.tsx
@@ -69,9 +69,6 @@
             <Text style={[styles.time, fullAndNotBooked && styles.fullTime]}>
               {training.time.slice(0, 5)}
             </Text>
-            <Text style={[styles.duration, fullAndNotBooked && styles.fullMeta]}>
-              60 min
-            </Text>
           </View>
 
           <View
@@ -90,7 +87,7 @@
               {training.title}
             </Text>
             <Text style={[styles.category, fullAndNotBooked && styles.fullTime]}>
-              Grupni · Sala A
+              Grupni
             </Text>
           </View>
 
@@ -271,13 +268,6 @@
     color: Colors.ink,
     lineHeight: 21,
   },
-  duration: {
-    color: Colors.inkFaint,
-    fontFamily: FontFamilies.hanken[600],
-    fontSize: 10.5,
-    fontWeight: "600",
-    marginTop: 4,
-  },
   divider: {
     alignSelf: "stretch",
     backgroundColor: Colors.border,
@@ -304,9 +294,6 @@
   },
   fullTime: {
     color: "#9A9098",
-  },
-  fullMeta: {
-    color: "#ADA3AC",
   },
   fullTitle: {
     color: "#6E6670",
diff --git a/src/components/admin/StatTile.tsx b/src/components/admin/StatTile.tsx
index f89911629950685fc1017589872392a2abfdcc70..a1ebd8dd9c9c273fe7f42cb483fca30ca57a0aac
--- a/src/components/admin/StatTile.tsx
+++ b/src/components/admin/StatTile.tsx
@@ -23,6 +23,7 @@
 
 const styles = StyleSheet.create({
   tile: {
+    flex: 1,
     backgroundColor: Colors.surface,
     borderColor: Colors.border,
     borderWidth: 1,

tokens used
70,026
Implemented B1, B2 profile, B3, B4, B5 UI, and D5 across the seven approved files.

Validation passed:

- TypeScript
- ESLint
- 12/12 tests
- Diff whitespace check

DONE
