# DiamondIQ

## Run on Replit

- This is an imported static HTML/CSS baseball education prototype served by Node.js.
- Keep the existing plain HTML/CSS and Node.js structure.
- Use the **Start application** workflow (or the Run button) to execute `npm start`.
- The server listens on `0.0.0.0:5000` by default; `PORT` can override the port.
- No package installation, build step, database, external services, or secrets are required for this preview.
- Open the Replit Preview to view the home page and navigate to the other HTML pages.

## Current limitations

This setup runs the existing prototype; it does not implement the planned application features. Login, registration, personalized playbooks, dynamic statistics, and other placeholder content are not functional backend features.

## Quick checks

- `node --check server.js` checks server syntax.
- Check that `/`, `/scenarios.html`, `/detail.html`, `/compare.html`, `/playbook.html`, `/login.html`, `/register.html`, and `/styles.css` return HTTP 200.
- An unknown page should return HTTP 404.
