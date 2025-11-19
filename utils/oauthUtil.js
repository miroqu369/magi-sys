function getRedirectUri(req) {
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['host'];
  return `${proto}://${host}/auth/callback`;
}
module.exports = { getRedirectUri };
