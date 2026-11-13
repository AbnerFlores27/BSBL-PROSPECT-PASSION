/* DiamondIQ — Phase 1 Static Web Server
   Serves our 7 HTML pages, CSS, and images using Express.
   (Database & API routes will be added in Phase 3!) */
const express = require('express');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Serve all HTML, CSS, and image files from the project folder
app.use(express.static(__dirname));

// Clean 404 page if someone visits a page that doesn't exist
app.use((_req, res) => {
  res
    .status(404)
    .send(
      '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>404 — DiamondIQ</title>' +
      '<link rel="stylesheet" href="/styles.css"></head><body>' +
      '<main class="container"><h1>404 — Page not found</h1>' +
      '<p>That base is empty! <a href="/index.html">Go back to DiamondIQ Home</a>.</p></main></body></html>'
    );
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`DiamondIQ Phase 1 running on http://0.0.0.0:${PORT}`);
});
