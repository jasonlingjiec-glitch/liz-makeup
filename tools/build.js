#!/usr/bin/env node
/**
 * 把 content/content.json 编译成两端要用的数据 + 图片
 *   1. js/content-data.js        —— 网站读（window.SITE）
 *   2. miniprogram/data/content.js —— 小程序读（module.exports）
 *   3. miniprogram/assets/**      —— 小程序用的压缩图（网站用原图）
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const CONTENT = path.join(ROOT, 'content/content.json');
const MINI = path.join(ROOT, 'miniprogram');

// 图片压缩规格：网站原图已压过；这里生成小程序用的
const SPEC = {
  hero: { max: 820, quality: 80 },
  qr: { max: 300, quality: 78 },
  photo: { max: 660, quality: 72 }
};

function readContent() {
  return JSON.parse(fs.readFileSync(CONTENT, 'utf8'));
}

/** 收集所有引用到的图片，附带压缩规格 */
function collectImages(c) {
  const set = new Map();
  const add = (p, spec) => {
    if (!p || typeof p !== 'string') return;
    if (!set.has(p)) set.set(p, spec);
  };
  add(c.meta.heroImage, SPEC.hero);
  add(c.meta.qrImage, SPEC.qr);
  (c.albums || []).forEach((a) => (a.images || []).forEach((p) => add(p, SPEC.photo)));
  return set;
}

const sips = (src, dst, max, quality) => {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  execFileSync('/usr/bin/sips', [
    '-Z', String(max),
    '-s', 'format', 'jpeg',
    '-s', 'formatOptions', String(quality),
    src, '--out', dst
  ], { stdio: 'ignore' });
};

function syncMiniImages(images) {
  const report = { copied: 0, skipped: 0, missing: [] };
  for (const [rel, spec] of images) {
    const src = path.join(ROOT, rel);
    const dst = path.join(MINI, rel);
    if (!fs.existsSync(src)) { report.missing.push(rel); continue; }
    if (fs.existsSync(dst) && fs.statSync(dst).mtimeMs >= fs.statSync(src).mtimeMs) {
      report.skipped++;
      continue;
    }
    sips(src, dst, spec.max, spec.quality);
    report.copied++;
  }
  return report;
}

function syncSiteImages(images) {
  // 上传的图已经是压缩过的原图，这里只检查存在性
  const missing = [];
  for (const [rel] of images) {
    if (!fs.existsSync(path.join(ROOT, rel))) missing.push(rel);
  }
  return missing;
}

function dirSize(dir) {
  let total = 0;
  const walk = (d) => {
    for (const f of fs.readdirSync(d, { withFileTypes: true })) {
      if (f.name.startsWith('.')) continue;
      const p = path.join(d, f.name);
      if (f.isDirectory()) walk(p);
      else total += fs.statSync(p).size;
    }
  };
  if (fs.existsSync(dir)) walk(dir);
  return total;
}

function build() {
  const content = readContent();
  const images = collectImages(content);

  // 1) 网站数据
  const siteJs = '/* 由 tools/build.js 生成，请勿手改。改内容请用 admin/ 后台 */\n' +
    'window.SITE = ' + JSON.stringify(content, null, 2) + ';\n';
  fs.writeFileSync(path.join(ROOT, 'js/content-data.js'), siteJs);

  // 2) 小程序数据
  const miniJs = '/* 由 tools/build.js 生成，请勿手改 */\n' +
    'module.exports = ' + JSON.stringify(content, null, 2) + ';\n';
  fs.mkdirSync(path.join(MINI, 'data'), { recursive: true });
  fs.writeFileSync(path.join(MINI, 'data/content.js'), miniJs);

  // 3) 小程序图片
  const miniReport = syncMiniImages(images);
  const siteMissing = syncSiteImages(images);

  const miniSize = dirSize(MINI);
  const assetsSize = dirSize(path.join(MINI, 'assets'));
  const report = {
    at: new Date().toISOString(),
    albums: content.albums.length,
    photos: content.albums.reduce((n, a) => n + a.images.length, 0),
    images: images.size,
    miniImages: miniReport,
    missingImages: siteMissing,
    miniPackageMB: +(miniSize / 1048576).toFixed(2),
    miniAssetsMB: +(assetsSize / 1048576).toFixed(2),
    miniLimitMB: 2,
    ok: miniSize <= 2 * 1048576 && siteMissing.length === 0
  };
  return report;
}

module.exports = { build, readContent };

if (require.main === module) {
  const r = build();
  console.log(JSON.stringify(r, null, 2));
}
