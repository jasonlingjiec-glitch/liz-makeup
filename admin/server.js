#!/usr/bin/env node
/**
 * LIZ MAKE UP · 本地后台
 *   node admin/server.js  →  http://127.0.0.1:4400
 * 只用 Node 内置模块，不装任何依赖。
 */
'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const build = require('../tools/build.js');

const ROOT = path.resolve(__dirname, '..');
const CONTENT = path.join(ROOT, 'content/content.json');
const PORT = Number(process.env.PORT || 4400);
const HOST = '127.0.0.1';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function send(res, code, body, type) {
  res.writeHead(code, {
    'Content-Type': type || 'application/json; charset=utf-8',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function sendJSON(res, code, obj) {
  send(res, code, JSON.stringify(obj), 'application/json; charset=utf-8');
}

function readBody(req, limitBytes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > limitBytes) { reject(new Error('body too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

/* ---------------- 静态文件 ---------------- */
function serveStatic(res, urlPath) {
  const clean = decodeURIComponent(urlPath.split('?')[0]);
  const rel = clean.replace(/^\/+/, '');
  const abs = path.join(ROOT, rel);
  if (!abs.startsWith(ROOT + path.sep)) return send(res, 403, 'forbidden', 'text/plain');
  fs.stat(abs, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'not found', 'text/plain');
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(abs).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    fs.createReadStream(abs).pipe(res);
  });
}

/* ---------------- 上传 ---------------- */
function slugify(name) {
  const base = (name || 'image').replace(/\.[^.]+$/, '');
  return base.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fa5-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'image';
}

function saveUpload(buf, originalName) {
  const dir = path.join(ROOT, 'assets/uploads');
  fs.mkdirSync(dir, { recursive: true });
  const stamp = Date.now().toString(36);
  const base = `${stamp}-${slugify(originalName)}`;
  const tmp = path.join(dir, base + '.tmp');
  const out = path.join(dir, base + '.jpg');
  fs.writeFileSync(tmp, buf);
  try {
    // 统一压成 jpg，长边 1600，质量 86（网站原图）
    execFileSync('/usr/bin/sips', [
      '-Z', '1600', '-s', 'format', 'jpeg', '-s', 'formatOptions', '86', tmp, '--out', out
    ], { stdio: 'ignore' });
  } catch (e) {
    fs.copyFileSync(tmp, out);
  }
  fs.unlinkSync(tmp);
  return 'assets/uploads/' + path.basename(out);
}

/* ---------------- 路由 ---------------- */
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const p = url.pathname;

  try {
    if (p === '/') {
      return serveStatic(res, '/admin/index.html');
    }

    if (p === '/api/content' && req.method === 'GET') {
      return sendJSON(res, 200, JSON.parse(fs.readFileSync(CONTENT, 'utf8')));
    }

    if (p === '/api/content' && req.method === 'PUT') {
      const body = await readBody(req, 4 * 1024 * 1024);
      let json;
      try { json = JSON.parse(body.toString('utf8')); }
      catch (e) { return sendJSON(res, 400, { error: 'JSON 格式不对：' + e.message }); }
      if (!json || !Array.isArray(json.albums)) {
        return sendJSON(res, 400, { error: '缺少 albums 数组' });
      }
      fs.writeFileSync(CONTENT, JSON.stringify(json, null, 2) + '\n');
      return sendJSON(res, 200, { ok: true, at: new Date().toISOString() });
    }

    if (p === '/api/upload' && req.method === 'POST') {
      const body = await readBody(req, 40 * 1024 * 1024);
      if (!body.length) return sendJSON(res, 400, { error: '空文件' });
      const name = url.searchParams.get('name') || 'image.jpg';
      const rel = saveUpload(body, name);
      return sendJSON(res, 200, { ok: true, path: rel });
    }

    if (p === '/api/build' && req.method === 'POST') {
      const report = build.build();
      return sendJSON(res, 200, report);
    }

    if (p === '/api/status' && req.method === 'GET') {
      let content = null;
      try { content = JSON.parse(fs.readFileSync(CONTENT, 'utf8')); } catch (e) {}
      const stat = fs.existsSync(CONTENT) ? fs.statSync(CONTENT) : null;
      return sendJSON(res, 200, {
        ok: true,
        updatedAt: stat ? stat.mtime.toISOString() : null,
        albums: content ? content.albums.length : 0,
        photos: content ? content.albums.reduce((n, a) => n + a.images.length, 0) : 0
      });
    }

    if (!p.startsWith('/api/')) {
      return serveStatic(res, p);
    }

    return send(res, 404, 'not found', 'text/plain');
  } catch (err) {
    console.error(err);
    return sendJSON(res, 500, { error: String(err && err.message || err) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`\n  LIZ MAKE UP 后台\n  http://${HOST}:${PORT}\n`);
});
