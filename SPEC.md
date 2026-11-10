# DiamondIQ — Official Build Specification (v7.1)

Project Title: DiamondIQ — Multi-Perspective Baseball Educational Hub
Target Level: High School Web Development (HTML5, CSS3, JavaScript, Node/Express, PostgreSQL)
Methodology: Spec-Driven Development (SDD)
Document Version: v7.1 (v7.0 structure preserved; decisions locked — see change list at bottom)

## 1. Purpose, Audience & Problem Statement

Fandom & Target Audience: Beginner baseball players, youth fans (ages 10+), and high school web development students.
Core Purpose: An interactive, multi-view fan application that breaks down baseball plays and statistics across 5 expert AI perspectives.
Problem Statement: Traditional baseball rulebooks and statistical guides are dry, overly technical, and difficult for beginners to digest. DiamondIQ solves this by providing visual scenario breakdowns, plain-English expert analysis, side-by-side play comparisons, and a persistent personal playbook.

## 2. Panel of Experts (5-Expert Panel Matrix)

| Expert Persona | Domain Role | Evaluation Focus |
|---|---|---|
| Youth Baseball Coach | Baseball Fundamentals | Rule accuracy, execution mechanics, simplifying concepts for beginners. |
| Sabermetrics Analyst | Advanced Analytics | Statcast metrics (launch angle, exit velocity, xwOBA) and 3-tier visual gauges. |
| Web Dev Mentor | Technical Lead & Architecture | HTML/CSS/JS standards, database schema, auth safety, CRUD. |
| UI/UX Designer | Design & Accessibility | Responsive parity, global navigation, WCAG contrast, dark/light themes. |
| Rookie Player | Target Audience & Usability | Plain-language clarity, engaging navigation, intuitive features. |

## 3. Database & User Authentication Architecture (LOCKED)

- Stack: Node.js + Express serving static front-end + JSON API. PostgreSQL (Replit Postgres) via parameterized SQL. scrypt password hashing, session cookies. NO new platforms to learn.
- Auth views (excluded from the 5-domain-view count): /register, /login, logout + profile bar.
- Protected actions: only authenticated users create/edit/delete playbook entries and save favorites.

## 4. 5 Unique Domain Views & Global Navigation

Global nav on every page: Home · Scenarios · Compare · My Playbook · Log In (hamburger menu on mobile).

- View 1: Home / Dashboard (index.html) — featured play of the day, daily fun fact banner, Opening Day countdown (date = config constant), site statistics card.
- View 2: Scenario Library (scenarios.html) — real-time search, category filter (Fundamentals/Analytics), sort options, list + empty state.
- View 3: Scenario Deep-Dive & 5-Expert Analyzer (detail.html) — summary banner, 5 expert cards with <details>/<summary> accordions, 3-tier stat meters (Low/Med/High), trivia quiz widget with instant scoring.
- View 4: Play & Stat Comparison Tool (compare.html) — side-by-side selectors comparing two plays on execution difficulty, tactical risk, statistical impact.
- View 5: Custom Playbook Builder (playbook.html) — PROTECTED full CRUD: create strategy notes, read, update, delete; favorites.

## 5. Seed Content (8 rich entries, fundamentals-first)

1. Force Out vs. Tag Out (Fundamental) 2. Infield Fly Rule Basics (Fundamental) 3. Stealing Second Base Timing (Fundamental) 4. Reading Launch Angle & Exit Velocity (Analytics) 5. Catcher Framing Fundamentals (Fundamental) 6. Executing a Relay Throw (Fundamental) 7. Understanding xwOBA Metrics (Analytics) 8. Tagging Up on Fly Balls (Fundamental).

## 6. Custom Features — TIERED

MVP-required (build in order): search bar, category filter, favorites button, comparison tool, trivia quiz, expandable accordions, dark/light mode.
Stretch (only after MVP passes): sorting options, pagination, 5-star ratings, embedded YouTube tutorials, Opening Day countdown timer, user statistics card.

## 7. Validation, Feedback & Responsive Rules

- Client/server validation on all forms; success toasts; error banners for auth failures; empty states for zero results.
- Desktop (>= 1024px): 3x2 grid for expert cards, side-by-side comparison, full dashboard. Tablet (768-1023px): 2-column flexbox, adaptive nav. Mobile (< 768px): single column, accordions, hamburger nav.
- Theme (Abner): LIGHT = grey + powder blue. DARK = deep navy-grey surfaces with softened powder blue accents. All pairs WCAG-contrast-tested in Phase 2.

## 8. Deployment & Acceptance

Deploy via Replit Deployments (public URL). Checklist: purpose defined; 5-expert panel; persistent DB; auth; 5 domain views + global nav; CRUD playbook; 8+ seed items; search/filter/sort + MVP features; validation/toasts/empty states; responsive parity; live URL.

## 9. 5-Phase Implementation Roadmap

[Phase 1: Multi-View HTML & Nav] -> [Phase 2: CSS Layout & Themes] -> [Phase 3: DB & Auth Integration] -> [Phase 4: CRUD & Interactivity] -> [Phase 5: Polish & Public Deployment]

- Phase 1: semantic HTML for all 7 pages (5 domain views + login + register), shared nav/footer, placeholder content, mockData.js as data stand-in.
- Phase 2: style.css — grey + powder blue light theme, navy dark theme, WCAG contrast tested, CSS variables, breakpoints, hamburger nav.
- Phase 3: Express server, Postgres schema (users, sessions, scenarios, playbook_entries), scrypt auth, protected routes, seed 8 scenarios.
- Phase 4: playbook CRUD API + UI, favorites, search/filter wiring, trivia scoring, view toggles.
- Phase 5: a11y audit, responsive QA, Replit deployment.

## Change list v7.0 -> v7.1
1. Database locked: Node.js + Express + PostgreSQL (Abner's proven quiz-app stack) — replaces "Supabase/Firebase/SQLite".
2. Custom features tiered: 7 MVP-required, 6 stretch (MVP needs only ONE fan feature; tiering prevents scope creep).
3. Dark mode defined: navy-grey variant of the grey + powder blue light theme.
4. Countdown date = config constant (set when MLB announces the 2027 schedule).
5. mockData.js stays as the stand-in data source until Phase 3 wires the real database.
6. Auth pages (login.html, register.html) added to the file map; excluded from the 5-view count.
