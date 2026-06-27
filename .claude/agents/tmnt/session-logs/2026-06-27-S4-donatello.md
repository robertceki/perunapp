---
session: 4
date: 2026-06-27
---

## Tasks this session
- B-D4 (goal: admin stats RPCs): done. Authored migration with `admin_member_series()` and `admin_occupancy_summary()`, both security-definer role-guarded, return columns named exactly per spec.

## Notes for future Donny
- `admin_member_series`: Uses auth.users.created_at (never deleted), generate_series for month buckets, timezone-aware (Europe/Belgrade), stable SQL function.
- `admin_occupancy_summary`: Occupancy is snapshot-only (session_participants wiped weekly Sunday 00:00). Member growth metrics use persistent auth.users. p_period param accepted for signature stability (chart period control) but not used in math. Both functions properly role-guarded.
- All functions follow B-D3 pattern: SECURITY DEFINER, `set search_path`, `is_admin()` guard with errcode 42501, revoke public/anon, grant authenticated.
