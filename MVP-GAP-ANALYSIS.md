# MVP Requirements — Gap Analysis vs. Spec v4.3

Checked: Nov 2026. Verdict: the current spec builds a beautiful FRONT-END, but it does NOT meet the MVP requirements yet. It needs a v5.0 upgrade (docs only — no website changes made).

| # | MVP Requirement | Status in v4.3 | What's needed |
|---|---|---|---|
| 1 | Clear purpose & target audience | PARTIAL | Purpose + audience exist (baseball beginners); add one explicit "problem it solves" statement. |
| 2 | Database & persistent data | FAIL | Spec locks to local mockData.js, no backend. Need a real database (e.g., PostgreSQL via Supabase/Neon or Replit DB) and persistence for user-created data. |
| 3 | User accounts & authentication | FAIL | No accounts in spec. Need register / login / logout + protected actions. |
| 4 | At least 5 unique domain views | FAIL | Spec is essentially ONE page (scenario analyzer). Need 5 distinct views (auth/admin excluded). |
| 5 | Navigation | PARTIAL | Nav exists but must connect all 5+ views with a consistent layout. |
| 6 | Full CRUD | FAIL | Static site = no create/update/delete. Need a user-owned entity (e.g., "My Playbook" saved scenarios/notes). |
| 7 | Meaningful seed content (8+ rich entries) | FAIL | Only 3 scenarios planned. Need 8+ rich baseball scenarios/entries seeded into the database. |
| 8 | Search & filtering | FAIL | Not in spec. Add search + filters on the scenario library (by tier, type, keyword). |
| 9 | Fan-specific interactive feature | PARTIAL | The 5-expert analyzer + gauges can qualify once dynamic; strengthen with a "Make the Call" predict-then-reveal tool. |
| 10 | Responsive design | PASS | 3 breakpoints fully specified. |
| 11 | Validation & feedback | FAIL | Add input validation, success/error messages, empty states. |
| 12 | Deployment (public URL) | PARTIAL | Replit Deployments give a public URL — confirm the teacher accepts it, or deploy to Render/Railway. |

## Proposed v5.0 direction (pending Abner + panel approval)

- Stack upgrade: Node.js + Express + PostgreSQL (same proven stack as Abner's California Sports Quiz) serving static front-end + API.
- 5 domain views: 1) Home/Dashboard, 2) Scenario Library (search/filter), 3) Scenario Detail (5-expert breakdown + gauges — the DiamondIQ core), 4) My Playbook (user CRUD), 5) Make the Call (predict-then-reveal, scored).
- Database: users, sessions, scenarios (8+ seeded), playbook_entries, predictions/attempts.
- Auth: register/login/logout; Playbook + Make the Call require login.
- Keep: grey + powder blue theme, 3x2 expert card grid, mobile accordions, grey/powder-blue WCAG testing in the styling phase.
