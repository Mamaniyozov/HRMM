const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

const indexHtmlPath = path.join(__dirname, 'index.html');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const apiBase = process.env.HRMM_API_BASE || '';

app.use(express.static(__dirname));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path === '/api') {
    // If the frontend is served by this app, don't mistakenly intercept API paths.
    res.status(404).send('Not found');
    return;
  }

  const injectedHtml = apiBase
    ? indexHtml.replace('<!-- API_BASE_INJECTION -->', `<script>window.__HRMM_API_BASE__ = ${JSON.stringify(apiBase)};</script>`)
    : indexHtml.replace('<!-- API_BASE_INJECTION -->', '');

  res.send(injectedHtml);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
