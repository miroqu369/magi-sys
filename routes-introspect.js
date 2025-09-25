'use strict';
if (!global.app) { throw new Error('global.app is not initialized'); }

// ルート一覧(JSON) - server.js 読み込み“前”に登録される想定
['/__routes','/routes.json'].forEach((p) => {
  global.app.get(p, (_req, res) => {
    const list = [];
    const stack = (global.app && global.app._router && global.app._router.stack) || [];
    stack.forEach((m) => {
      if (m && m.route && m.route.path) {
        const methods = Object.keys(m.route.methods || {});
        list.push({ path: m.route.path, methods });
      }
    });
    res.set('content-type','application/json');
    res.json({ routes: list });
  });
});
