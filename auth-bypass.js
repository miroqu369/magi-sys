// 開発環境用の認証バイパスミドルウェア
function authBypass(req, res, next) {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔓 Development mode: Authentication bypassed');
    return next();
  }
  
  // 本番環境では通常の認証チェック
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

module.exports = authBypass;
