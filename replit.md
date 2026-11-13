# DiamondIQ

## Run on Replit

- Stack: Node.js + Express (`express`, `pg`) serving the 7 HTML/CSS/JS pages and JSON REST API.
- Use the **Start application** workflow (`npm start`) to execute `node server.js` on `0.0.0.0:${PORT || 5000}`.
- Replit PostgreSQL is connected and provides `DATABASE_URL` to the app; do not commit the connection string.
- Apply `database-schema.sql` to the development database before starting the app. Replit Publish manages the corresponding production database schema.
- Account passwords are stored as scrypt hashes. Session tokens are stored as SHA-256 hashes in PostgreSQL; the browser receives an HTTP-only, SameSite=Lax cookie with a 14-day expiry.
- The app fails to start if `DATABASE_URL` is unavailable; it does not switch to temporary in-memory account storage.

## Implemented Features

- Seven semantic HTML pages with shared navigation, responsive styles, and light/dark themes.
- Account registration, username/email login, logout, password hashing, and persistent PostgreSQL-backed sessions.
- Additional user-generated features such as saved favorites and playbook entries are not yet connected to account storage.
