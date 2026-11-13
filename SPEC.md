# DiamondIQ — Complete As-Built Specification (v8.0)

**Project Title:** DiamondIQ — Multi-Perspective Baseball Educational Hub  
**Stack:** HTML5, CSS3, Vanilla JavaScript, Node.js, Express, PostgreSQL (`pg`)  
**Methodology:** Spec-Driven Development (SDD)  
**Status:** Phases 1–5 Complete & Verified

---

## 1. Purpose, Target Audience & Problem Statement

- **Target Audience:** Beginner baseball players, youth fans (ages 10+), and high school web development students.
- **Core Purpose:** An interactive multi-view baseball education hub that explains rules, plays, and Statcast analytics from five distinct expert perspectives.
- **Problem Statement:** Traditional baseball rulebooks and advanced analytics guides are dry and overly technical for beginners. DiamondIQ solves this with tactical SVG diamond diagrams, plain-English 5-expert breakdowns, side-by-side play comparisons, trivia checks, and a persistent personal playbook.

---

## 2. The 5-Expert Panel Matrix

Every one of the 8 seeded scenarios includes tailored analysis from all five experts:

| # | Expert Persona | Domain Role | Focus |
|---|---|---|---|
| 1 | Youth Baseball Coach | Baseball Fundamentals | Real rules, situational footwork, beginner cues |
| 2 | Sabermetrics Analyst | Advanced Analytics | Statcast metrics (launch angle, exit velocity, xwOBA, pop time) & 3-tier gauges |
| 3 | Web Dev Mentor | Technical Architecture | How baseball rules map cleanly to structured data, SQL, and UI |
| 4 | UI/UX Designer | Design & Accessibility | Visual hierarchy, diagram clarity, WCAG AA contrast, responsive parity |
| 5 | Rookie Player | Beginner Usability | Plain-language "aha!" takeaways without jargon |

---

## 3. Architecture & File Map

```text
/
├── server.js          # Express server, cookie auth, static hosting, REST API endpoints
├── db.js              # PostgreSQL schema init, 8-scenario seeder, scrypt auth, in-memory fallback
├── data.js            # Shared seed data (8 scenarios, 5 experts, fun facts, Opening Day ISO)
├── app.js             # Client-side controller (theme, nav, SVG diagrams, filters, CRUD, auth)
├── styles.css         # Grey + powder-blue light theme, navy-grey dark mode, 3-breakpoint grids
├── index.html         # View 1: Home / Dashboard
├── scenarios.html     # View 2: Scenario Library (search, filter, sort, pagination)
├── detail.html        # View 3: Scenario Deep-Dive (5 experts, meters, SVG diagram, rating, trivia)
├── compare.html       # View 4: Play & Stat Comparison Tool
├── playbook.html      # View 5: Custom Playbook Builder (Protected CRUD + Favorites)
├── login.html         # Auth: Log In
├── register.html      # Auth: Create Account
├── package.json       # Scripts: dev (port 3000), start (port 5000), build, lint
├── .env.example       # PORT=5000, DATABASE_URL=
├── .replit            # Replit run config (npm start on port 5000)
├── replit.md          # Replit setup & Postgres instructions
└── src/assets/images/baseball_diamond_twilight_1794597327254.jpg
```

---

## 4. Database Schema (`db.js`)

When `process.env.DATABASE_URL` is set (Replit PostgreSQL), `db.js` initializes these 7 tables automatically using parameterized SQL (`$1, $2, ...`):

1. **`users`**: `id SERIAL PRIMARY KEY`, `username TEXT UNIQUE`, `email TEXT UNIQUE`, `password_hash TEXT` (`scrypt` salt:hash), `created_at TIMESTAMPTZ`
2. **`sessions`**: `token TEXT PRIMARY KEY`, `user_id INTEGER REFERENCES users(id)`, `expires_at TIMESTAMPTZ`, `created_at TIMESTAMPTZ`
3. **`scenarios`**: `id TEXT PRIMARY KEY`, `title`, `category`, `category_label`, `difficulty`, `popularity`, `short_summary`, `quick_takeaway`, `key_rule`, `meters_json JSONB`, `diagram_json JSONB`, `experts_json JSONB`, `trivia_json JSONB`
4. **`playbook_entries`**: `id SERIAL PRIMARY KEY`, `user_id INTEGER REFERENCES users(id)`, `title TEXT`, `body TEXT`, `rating INTEGER (1..5)`, `created_at TIMESTAMPTZ`, `updated_at TIMESTAMPTZ`
5. **`favorites`**: `(user_id, scenario_id) PRIMARY KEY`, `created_at TIMESTAMPTZ`
6. **`trivia_mastered`**: `(user_id, scenario_id) PRIMARY KEY`, `created_at TIMESTAMPTZ`
7. **`scenario_ratings`**: `(user_id, scenario_id) PRIMARY KEY`, `stars INTEGER (1..5)`, `updated_at TIMESTAMPTZ`

*(If `DATABASE_URL` is unset during local preview, `db.js` automatically runs an in-memory store with identical API behavior.)*

---

## 5. REST API Contract (`server.js`)

| Method & Path | Auth | Purpose |
|---|---|---|
| `GET /api/health` | Public | Server & active storage (`postgres` or `memory`) status |
| `GET /api/stats` | Public / User | Opening Day countdown + user mastered/favorites/playbook counts |
| `GET /api/auth/me` | Public | Returns `{ user }` from `diamondiq_sid` `httpOnly` cookie or `null` |
| `POST /api/auth/register` | Public | Validates username/email/password (8+ chars), hashes with `scrypt`, sets cookie |
| `POST /api/auth/login` | Public | Verifies username or email + password via `scrypt` & `timingSafeEqual` |
| `POST /api/auth/logout` | Public | Deletes session row & clears cookie |
| `GET /api/scenarios` | Public | Returns 8 seeded scenarios (supports `q`, `category`, `sort`) |
| `GET /api/scenarios/:id` | Public | Returns single scenario detail |
| `POST /api/scenarios/:id/trivia` | Public / User | Checks trivia answer; records `trivia_mastered` if logged in |
| `GET /api/scenarios/:id/rating` | Public | Returns `{ average, count, userStars }` |
| `POST /api/scenarios/:id/rating` | **Protected (401)** | Upserts 1–5 star rating for the current user |
| `GET /api/favorites` | Public / User | Returns user's saved scenario IDs (empty when logged out) |
| `POST /api/favorites/:scenarioId` | **Protected (401)** | Adds scenario to user's favorites |
| `DELETE /api/favorites/:scenarioId` | **Protected (401)** | Removes scenario from user's favorites |
| `GET /api/playbook` | **Protected (401)** | Lists only the signed-in user's playbook entries |
| `POST /api/playbook` | **Protected (401)** | Validates & creates a new playbook entry |
| `PUT /api/playbook/:id` | **Protected (401/403)** | Updates entry only if owned by `req.user.id` |
| `DELETE /api/playbook/:id` | **Protected (401/403)** | Deletes entry only if owned by `req.user.id` |

---

## 6. 8 Seeded Scenarios

1. `force-vs-tag` — **Force Out vs. Tag Out** (`Fundamental`)
2. `infield-fly` — **Infield Fly Rule Basics** (`Fundamental`)
3. `stealing-second` — **Stealing Second Base Timing** (`Fundamental`)
4. `launch-angle-exit-velo` — **Reading Launch Angle & Exit Velocity** (`Analytics`)
5. `catcher-framing` — **Catcher Framing Fundamentals** (`Fundamental`)
6. `relay-throw` — **Executing a Relay Throw** (`Fundamental`)
7. `xwoba-metrics` — **Understanding xwOBA Metrics** (`Analytics`)
8. `tagging-up` — **Tagging Up on Fly Balls** (`Fundamental`)

---

## 7. Theme, Accessibility & Responsive Design (`styles.css`)

- **Light Theme:** Grey canvas (`#f4f6f8`), white surfaces (`#ffffff`), powder blue accents (`#a9c6e3` / `#e8f1fa`), WCAG AA primary accent ink (`#2c649c`), text (`#14202e` / `#475569`).
- **Dark Theme (`[data-theme="dark"]`):** Deep navy-grey canvas (`#0d1520`), slate-navy surfaces (`#162232`), softened powder-blue accents (`#7cb6f2` / `#93c5fd`), persisted in `localStorage`.
- **Breakpoints:**
  - Desktop (`>= 1024px`): 3×2 expert card grid (5 experts + Key Rule card), 2-column hero split, 4-card stats strip, side-by-side comparison.
  - Tablet (`768px–1023px`): 2-column flexbox/grid layout.
  - Mobile (`< 768px`): Single-column layout, hamburger navigation toggle, auto-collapsed expert accordions.
- **Accessibility:** Skip-to-content link on every page, semantic landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`), visible `:focus-visible` outlines, `role="status"` / `role="alert"` feedback banners, explicit text labels alongside color states, and `prefers-reduced-motion` support.

---

## 8. 12 MVP Requirements Verification

1. **Clear purpose & target audience:** Youth/beginner baseball fans (10+) learning plays & stats in plain English.
2. **Database & persistent data:** PostgreSQL (`pg` + `DATABASE_URL`) with 7 relational tables + 8 seeded scenarios.
3. **User accounts & authentication:** `register.html`, `login.html`, nav `Log Out`, `scrypt` password hashing, `httpOnly` session cookies, protected routes.
4. **5 unique domain views:** `index.html`, `scenarios.html`, `detail.html`, `compare.html`, `playbook.html` (excluding `login.html` & `register.html`).
5. **Navigation:** Global nav bar on all 7 pages with active-page highlight (`aria-current="page"`) and mobile hamburger menu.
6. **Full CRUD:** Create, Read, Update, Delete on `playbook_entries` with server-side ownership enforcement (`403` cross-user guard).
7. **8+ rich seed entries:** 8 complete baseball scenarios with 5-expert breakdowns, 3-tier meters, SVG diagram specs, and trivia questions.
8. **Search & filtering:** Real-time keyword search, category tabs (`All`, `Fundamentals`, `Analytics`, `Saved`), sorting (`A–Z`, `Difficulty`, `Popularity`), and pagination (`6`, `4`, `All`).
9. **Fan-specific interactive features:** 5-Expert Analyzer with SVG Diamond Diagrams, Trivia Quiz with server scoring, Side-by-Side Comparison Tool, and 5-Star Ratings.
10. **Responsive design:** Verified across desktop (`>=1024px`), tablet (`768–1023px`), and mobile (`<768px`).
11. **Validation & feedback:** Client + server validation (`400`/`401`/`403`/`409`), toast notifications, inline error/success banners, and empty states.
12. **Deployment:** Ready for Replit Deployments (`npm install && npm start` on `0.0.0.0:${PORT || 5000}` with Replit PostgreSQL).
