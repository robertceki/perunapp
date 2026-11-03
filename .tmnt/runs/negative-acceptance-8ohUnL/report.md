# Negative acceptance: PASS

Eight scoped checks passed: completed-request replay, forbidden output, uncertain launch, pending SPEC, rejected SPEC, altered result hash, missing runner, and failed QA with exhausted synthetic retry input. The last case was a decision replay, not a new worker or correction. Named-role decision checks are not universal executable enforcement.

Retained records: launcher-negative-results.json and independent-host-evidence.json. Their original fixture paths are historical provenance; temporary fixture files and verbose transcripts were removed at the user's request after acceptance.

Direct VS Code bundled-binary checks found five roles, invoked Splinter, discovered skills and blocked a hook canary. That did not establish actual IDE hook enforcement. Subsequent actual IDE startup passed with parent approval, while actual IDE hook enforcement remains unreliable. See ../migration-final-status.md for the accepted limitation.