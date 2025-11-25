const http = require('http');
const fs = require('fs');
const path = require('path');

const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MAGI System v4.0</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: sans-serif; background: linear-gradient(135deg, #667eea, #764ba2); min-height: 100vh; }
.header { background: rgba(0,0,0,0.8); color: white; padding: 15px 20px; display: flex; justify-content: space-between; position: sticky; top: 0; z-index: 100; }
.menu-toggle { background: none; border: none; color: white; font-size: 28px; cursor: pointer; }
.menu { position: fixed; left: -250px; top: 0; width: 250px; height: 100vh; background: rgba(0,0,0,0.95); padding-top: 60px; transition: left 0.3s; z-index: 99; }
.menu.active { left: 0; }
.menu a { display: block; color: white; padding: 15px 20px; text-decoration: none; border-bottom: 1px solid rgba(255,255,255,0.1); cursor: pointer; }
.menu a:hover { background: rgba(255,255,255,0.1); }
.overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: none; z-index: 98; }
.overlay.active { display: block; }
.container { max-width: 1200px; margin: 30px auto; padding: 0 20px; }
.card { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); }
.view { display: none; }
.view.active { display: block; }
input, textarea, select, button { width: 100%; padding: 12px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px; font-size: 14px; }
button { background: linear-gradient(135deg, #667eea, #764ba2); color: white; cursor: pointer; border: none; }
</style>
</head>
<body>
<div class="header">
<div style="font-size: 18px; font-weight: bold;">≡ MAGI System v4.0</div>
<button class="menu-toggle" id="menuToggle">≡</button>
</div>
<nav class="menu" id="menu">
<a href="#" data-view="consensus" class="menu-item">質問応答</a>
<a href="#" data-view="history" class="menu-item">履歴</a>
<a href="#" data-view="document" class="menu-item">文書解析</a>
<a href="#" data-view="comparison" class="menu-item">銘柄比較</a>
<a href="#" data-view="research" class="menu-item">株式調査</a>
<a href="#" data-view="settings" class="menu-item">⚙ 設定</a>
</nav>
<div class="overlay" id="overlay"></div>
<div class="container">
<div id="consensus" class="view active">
<div class="card">
<h2>質問応答（5 AI 合議）</h2>
<textarea id="prompt" placeholder="質問を入力..."></textarea>
<button onclick="alert('API接続予定')">分析を開始</button>
</div>
</div>
<div id="history" class="view"><div class="card"><h2>履歴</h2></div></div>
<div id="document" class="view"><div class="card"><h2>文書解析</h2></div></div>
<div id="comparison" class="view"><div class="card"><h2>銘柄比較</h2></div></div>
<div id="research" class="view"><div class="card"><h2>株式調査</h2></div></div>
<div id="settings" class="view"><div class="card"><h2>⚙ 設定</h2></div></div>
</div>
<script>
const menu = document.getElementById('menu');
const overlay = document.getElementById('overlay');
const menuToggle = document.getElementById('menuToggle');
menuToggle.addEventListener('click', () => {
  menu.classList.toggle('active');
  overlay.classList.toggle('active');
});
overlay.addEventListener('click', () => {
  menu.classList.remove('active');
  overlay.classList.remove('active');
});
document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const viewId = item.dataset.view;
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    menu.classList.remove('active');
    overlay.classList.remove('active');
  });
});
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});

server.listen(8080, () => {
  console.log('✅ MAGI System UI running on http://localhost:8080');
});
