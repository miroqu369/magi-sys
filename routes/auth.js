const express = require('express');
const { google } = require('googleapis');
const { getRedirectUri } = require('../utils/oauthUtil');
const router = express.Router();

function getOAuth2Client(req) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    getRedirectUri(req)
  );
}

router.get('/login', (req, res) => {
  const oauth2Client = getOAuth2Client(req);
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    prompt: 'consent',
  });
  res.redirect(url);
});

router.get('/callback', async (req, res) => {
  const oauth2Client = getOAuth2Client(req);
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    req.session.tokens = tokens;
    res.redirect('/');
  } catch (err) {
    console.error('OAuth2 callback error', {
      error: err.message,
      url: req.originalUrl,
      redirect_uri: getRedirectUri(req),
    });
    res.status(500).send(`
      <h1>Googleログイン失敗</h1>
      <p>${err.message}</p>
      <pre>${JSON.stringify({
        url: req.originalUrl,
        redirect_uri: getRedirectUri(req),
      }, null, 2)}</pre>
    `);
  }
});

module.exports = router;
