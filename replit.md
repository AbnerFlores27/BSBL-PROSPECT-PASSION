# DiamondIQ

## Run on Replit

- Stack: Node.js + Express (`express`, `pg`) serving the 7 HTML/CSS/JS pages and JSON REST API.
- Use the **Start application** workflow (`npm start`) to execute `node server.js` on `0.0.0.0:${PORT || 5000}`.
- Provision **Replit PostgreSQL** (sets `DATABASE_URL`) so `db.js` creates all tables (`users`, `sessions`, `scenarios`, `playbook_entries`, `favorites`, `trivia_mastered`, `scenario_ratings`) and seeds the 8 baseball scenarios automatically on boot.
- When `DATABASE_URL` is omitted (for example, local quick preview), `db.js` automatically runs an in-memory store with identical API behavior.

## Implemented Phases (Phases 1–5)

1. **Phase 1**: 7 semantic HTML5 pages (`index.html`, `scenarios.html`, `detail.html`, `compare.html`, `playbook.html`, `login.html`, `register.html`) with shared global nav and footer.
2. **Phase 2**: `styles.css` with `#f4f6f8` grey + `#a9c6e3` powder-blue light theme, deep navy-grey dark mode, WCAG AA contrast pairs, and desktop (`>=1024px`) / tablet (`768–1023px`) / mobile (`<768px`) responsive grids + hamburger nav.
3. **Phase 3**: Express server, PostgreSQL schema + auto-seeding of 8 scenarios, `scrypt` password hashing, `httpOnly` session cookies, register/login/logout endpoints, and protected route enforcement.
4. **Phase 4**: Protected Playbook CRUD, Favorites, 5-star scenario ratings, search/category/sort/pagination on Scenario Library, server-scored Trivia Quiz, side-by-side Comparison tool, and expandable 5-Expert accordions.
5. **Phase 5**: Skip links, ARIA live status feedback, empty states, error banners, success toasts, and Replit deployment readiness.
