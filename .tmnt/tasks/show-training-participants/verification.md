# Full training participant names

User requested full names for ordinary users and then explicitly removed the own-user TI/(ti) marker. TrainingCard displays all participants using trimmed first/last names, a fallback for unavailable names, and wrapping chips. Booking handlers, limits and counts are unchanged. No database/query/permission changes.

Verification: user supplied passing TypeScript/Vite build and lint; the final bounded worker also ran build and lint with exit 0 (build reported a chunk-size warning). Main diff check passed. Before/after comparison of the final amendment confirmed only removal of the (ti) suffix.

Chrome rendered the actual component and CSS with controlled data: 16 checks passed across 296px and 456px card widths, covering names, Serbian letters, missing/partial fields, long-name wrapping, counts and booking-button states. Those browser checks preceded the final suffix removal; the old own-marker assertion is superseded by the user's amendment and exact source comparison. No live authenticated data check is claimed.

Implementation task T1: one attempt, retry 0. User amendment T2: one attempt, retry 0. Raw worker logs and orchestration requests remain local and are not part of this feature commit. Package-lock metadata updated by the user's installation is outside this feature commit and remains local.