---
name: Account database compatibility
description: Why authentication updates must respect the existing database rather than replace its schema.
---

Keep authentication compatible with existing saved accounts and sessions when incorporating upstream changes.

**Why:** An imported update assumed a different account schema and caused signup to fail despite a healthy server. Changing or replacing the database to fit that assumption risks existing account access.

**How to apply:** Inspect the actual schema before modifying authentication queries. Preserve normalized account identifiers and support legacy session storage where needed; test signup, login, and logout together using transaction rollback so existing accounts are untouched.
