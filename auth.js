const axios = require('axios');

const OAUTH_CONFIG = {
  clientId: process.env.GOOGLE_OAUTH_CLIENT_ID || '428098568743-9v2ukl1jkv34h5r6j7k8l9m0n1o2p3q4.apps.googleusercontent.com',
  clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:8080/callback'
};

// トークン検証
async function verifyToken(token) {
  try {
    const response = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    return null;
  }
}

// トークン生成用URL
function getAuthUrl() {
  const params = new URLSearchParams({
    client_id: OAUTH_CONFIG.clientId,
    redirect_uri: OAUTH_CONFIG.redirectUri,
    response_type: 'code',
    scope: 'openid email profile'
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

module.exports = { verifyToken, getAuthUrl, OAUTH_CONFIG };
