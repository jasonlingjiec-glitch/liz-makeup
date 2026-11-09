/* LIZ MAKE UP · 后台 */
(function () {
  'use strict';

  var state = { content: null, dirty: false, target: null, lang: 'zh' };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- 路径读写 ---------- */
  function getPath(obj, path) {
    return path.split('.').reduce(function (o, k) {
      return o == null ? undefined : o[k];
    }, obj);
  }
  function setPath(obj, path, val) {
    var keys = path.split('.');
    var last = keys.pop();
    var cur = keys.reduce(function (o, k) {
      if (o[k] == null) o[k] = {};
      return o[k];
    }, obj);
    cur[last] = val;
  }

  /* ---------- 字段路径：本地化字段带语言前缀 ---------- */
  function fieldPath(el) {
    if (el.hasAttribute('data-lp')) return state.lang + '.' + el.getAttribute('data-lp');
    return el.getAttribute('data-path');
  }

  /* ---------- 状态 ---------- */
  function markDirty(v) {
    state.dirty = v !== false;
    $('#dirty').classList.toggle('dirty', state.dirty);
    $('#statusText').textContent = state.dirty ? '有改动未保存' : '已保存';
  }

  var toastTimer;
  function toast(msg, bad) {
    var el = document.createElement('div');
    el.className = 'toast on';
    el.textContent = msg;
    if (bad) el.style.background = '#9C3B2B';
    document.body.appendChild(el);
    setTimeout(function () { el.classList.remove('on'); }, 1800);
    setTimeout(function () { el.remove(); }, 2200);
  }

  /* ---------- 加载 ---------- */
  function load() {
    return fetch('/api/content').then(function (r) { return r.json(); }).then(function (c) {
      state.content = c;
      renderAll();
      markDirty(false);
    });
  }

  function renderAll() {
    renderFields();
    renderAlbums();
    renderDims();
    renderSteps();
    refreshMetaPreviews();
  }

  /* ---------- 标量字段 ---------- */
  function renderFields() {
    $$('[data-path],[data-lp]').forEach(function (el) {
      var p = fieldPath(el);
      if (!p) return;
      var v = getPath(state.content, p);
      if (el.hasAttribute('data-lines')) {
        el.value = Array.isArray(v) ? v.join('\n') : (v || '');
      } else {
        el.value = v == null ? '' : v;
      }
    });
  }

  function bindFields() {
    document.addEventListener('input', function (e) {
      var el = e.target;
      if (!el.hasAttribute) return;
      if (!el.hasAttribute('data-path') && !el.hasAttribute('data-lp')) return;
      var p = fieldPath(el);
      var val = el.value;
      if (el.hasAttribute('data-lines')) {
        val = val.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      }
      setPath(state.content, p, val);
      if (p === 'meta.heroImage' || p === 'meta.qrImage') refreshMetaPreviews();
      markDirty();
    });
  }

  function refreshMetaPreviews() {
    var hero = state.content.meta.heroImage;
    var qr = state.content.meta.qrImage;
    $('#previewHero').src = hero ? '/' + hero : '';
    $('#previewQr').src = qr ? '/' + qr : '';
  }

  /* ---------- 相册 ---------- */
  function renderAlbums() {
    var box = $('#albumList');
    var albums = state.content.albums;
    var L = state.lang;
    box.innerHTML = '';

    albums.forEach(function (a, i) {
      var wrap = document.createElement('div');
      wrap.className = 'album';
      wrap.setAttribute('data-i', i);

      var head = document.createElement('div');
      head.className = 'album-head';
      var t = a[L] || {};
      head.innerHTML =
        '<span class="idx">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="name">' + esc(t.title || '未命名') + '</span>' +
        '<span class="ops">' +
          '<button class="btn sm" data-act="up">↑</button>' +
          '<button class="btn sm" data-act="down">↓</button>' +
          '<button class="btn sm danger" data-act="del">删除</button>' +
        '</span>';

      var body = document.createElement('div');
      body.className = 'album-body';
      body.innerHTML =
        '<div class="grid2">' +
          '<label class="f"><span>相册名（当前语言）</span><input data-f="title" value="' + esc(t.title) + '"></label>' +
          '<label class="f"><span>副名 / 英文名</span><input data-f="en" value="' + esc(t.en) + '"></label>' +
        '</div>' +
        '<label class="f"><span>品牌（用 · 分隔）</span><input data-f="brands" value="' + esc(t.brands) + '"></label>' +
        '<div class="grid2">' +
          '<label class="f"><span>标签（用逗号分隔）</span><input data-f="tags" value="' + esc((t.tags || []).join('，')) + '"></label>' +
          '<label class="f"><span>相册 ID（不建议改）</span><input data-f="id" value="' + esc(a.id) + '"></label>' +
        '</div>' +
        '<label class="f"><span>描述</span><textarea rows="3" data-f="desc">' + esc(t.desc) + '</textarea></label>' +
        '<div class="album-imgs">' + imgCells(a) + '</div>';

      wrap.appendChild(head);
      wrap.appendChild(body);
      box.appendChild(wrap);
    });
  }

  function imgCells(a) {
    var html = a.images.map(function (src, j) {
      return '' +
        '<div class="img-cell' + (j === 0 ? ' cover' : '') + '" data-j="' + j + '">' +
          '<img src="/' + src + '" loading="lazy" alt="">' +
          '<div class="ops">' +
            '<button data-img="left" title="前移">‹</button>' +
            '<button data-img="right" title="后移">›</button>' +
            '<button data-img="del" title="删除">×</button>' +
          '</div>' +
        '</div>';
    }).join('');
    return html + '<div class="add-img" data-img="add">＋ 上传</div>';
  }

  function bindAlbumEvents() {
    $('#albumList').addEventListener('input', function (e) {
      var el = e.target;
      if (!el.hasAttribute('data-f')) return;
      var album = state.content.albums[+el.closest('.album').getAttribute('data-i')];
      var f = el.getAttribute('data-f');
      if (f === 'id') { album.id = el.value; markDirty(); return; }
      if (!album[state.lang]) album[state.lang] = {};
      album[state.lang][f] = el.value;
      if (f === 'tags') album[state.lang].tags = el.value.split(/[，,]/).map(function (s) { return s.trim(); }).filter(Boolean);
      if (f === 'title') el.closest('.album').querySelector('.name').textContent = el.value || '未命名';
      markDirty();
    });

    $('#albumList').addEventListener('click', function (e) {
      var btn = e.target.closest('button, [data-img]');
      if (!btn) return;
      var albumEl = btn.closest('.album');
      var i = +albumEl.getAttribute('data-i');
      var albums = state.content.albums;

      var act = btn.getAttribute('data-act');
      if (act === 'up' && i > 0) {
        albums.splice(i - 1, 0, albums.splice(i, 1)[0]);
        renderAlbums(); markDirty(); return;
      }
      if (act === 'down' && i < albums.length - 1) {
        albums.splice(i + 1, 0, albums.splice(i, 1)[0]);
        renderAlbums(); markDirty(); return;
      }
      if (act === 'del') {
        var nm = (albums[i][state.lang] || {}).title || '';
        if (!confirm('删除相册「' + nm + '」？图片文件不会被删除。')) return;
        albums.splice(i, 1); renderAlbums(); markDirty(); return;
      }

      var imgAct = btn.getAttribute('data-img');
      if (!imgAct) return;
      var cell = btn.closest('.img-cell');
      var j = cell ? +cell.getAttribute('data-j') : -1;
      var imgs = albums[i].images;

      if (imgAct === 'add') {
        pickFiles(function (paths) {
          paths.forEach(function (p) { imgs.push(p); });
          renderAlbums(); markDirty();
        });
        return;
      }
      if (imgAct === 'del' && j >= 0) { imgs.splice(j, 1); renderAlbums(); markDirty(); }
      if (imgAct === 'left' && j > 0) { imgs.splice(j - 1, 0, imgs.splice(j, 1)[0]); renderAlbums(); markDirty(); }
      if (imgAct === 'right' && j >= 0 && j < imgs.length - 1) { imgs.splice(j + 1, 0, imgs.splice(j, 1)[0]); renderAlbums(); markDirty(); }
    });

    $('#btnAddAlbum').addEventListener('click', function () {
      var n = state.content.albums.length + 1;
      var id = 'album' + Date.now().toString(36);
      state.content.albums.push({
        id: id, images: [],
        zh: { title: '新相册 ' + n, en: 'New Album', brands: '', tags: [], desc: '' },
        en: { title: 'New Album ' + n, en: '', brands: '', tags: [], desc: '' }
      });
      renderAlbums(); markDirty();
    });
  }

  /* ---------- 三个计价维度 ---------- */
  function renderDims() {
    var box = $('#dims');
    var dims = (state.content[state.lang] || {}).service || {};
    box.innerHTML = (dims.dims || []).map(function (d, i) {
      return '' +
        '<div class="card">' +
          '<label class="f"><span>标题</span><input data-lp="service.dims.' + i + '.k"></label>' +
          '<label class="f"><span>第一行</span><input data-lp="service.dims.' + i + '.v.0"></label>' +
          '<label class="f"><span>第二行</span><input data-lp="service.dims.' + i + '.v.1"></label>' +
        '</div>';
    }).join('');
    renderFields();
  }

  /* ---------- 三步流程 ---------- */
  function renderSteps() {
    var box = $('#steps');
    var contact = (state.content[state.lang] || {}).contact || {};
    box.innerHTML = (contact.steps || []).map(function (s, i) {
      return '' +
        '<div class="card">' +
          '<label class="f"><span>标题</span><input data-lp="contact.steps.' + i + '.t"></label>' +
          '<label class="f"><span>说明</span><textarea rows="2" data-lp="contact.steps.' + i + '.d"></textarea></label>' +
        '</div>';
    }).join('');
    renderFields();
  }

  /* ---------- 上传 ---------- */
  var uploadCb = null;
  function pickFiles(cb) {
    uploadCb = cb;
    var input = $('#filePicker');
    input.value = '';
    input.click();
  }

  function bindUpload() {
    $('#filePicker').addEventListener('change', function (e) {
      var files = Array.prototype.slice.call(e.target.files || []);
      if (!files.length) return;
      toast('上传中…');
      Promise.all(files.map(function (f) {
        return fetch('/api/upload?name=' + encodeURIComponent(f.name), {
          method: 'POST',
          headers: { 'Content-Type': 'application/octet-stream' },
          body: f
        }).then(function (r) { return r.json(); });
      })).then(function (rs) {
        var paths = rs.filter(function (r) { return r.ok; }).map(function (r) { return r.path; });
        if (uploadCb) uploadCb(paths);
        uploadCb = null;
        toast('已上传 ' + paths.length + ' 张');
      }).catch(function () { toast('上传失败', true); });
    });

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-upload]');
      if (!btn) return;
      var p = btn.getAttribute('data-upload');
      pickFiles(function (paths) {
        if (!paths.length) return;
        setPath(state.content, p, paths[0]);
        renderFields();
        refreshMetaPreviews();
        markDirty();
        toast('已替换');
      });
    });
  }

  /* ---------- 保存 / 生成 ---------- */
  function save() {
    return fetch('/api/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(state.content)
    }).then(function (r) {
      if (!r.ok) return r.json().then(function (j) { throw new Error(j.error || '保存失败'); });
      markDirty(false);
      return true;
    });
  }

  function doBuild() {
    return fetch('/api/build', { method: 'POST' }).then(function (r) { return r.json(); }).then(function (rep) {
      var el = $('#report');
      el.textContent = JSON.stringify(rep, null, 2);
      el.className = 'report ' + (rep.ok ? 'ok' : 'bad');
      return rep;
    });
  }

  function bindActions() {
    $('#btnSave').addEventListener('click', function () {
      var btn = this;
      btn.disabled = true;
      save().then(function () {
        return doBuild();
      }).then(function (rep) {
        toast('已保存并生成 · 小程序 ' + rep.miniPackageMB + 'MB');
        if (!rep.ok) toast('注意：有图片缺失或小程序包超限', true);
      }).catch(function (err) {
        toast(err.message || '出错了', true);
      }).then(function () { btn.disabled = false; });
    });

    $('#btnBuild').addEventListener('click', function () {
      doBuild().then(function (rep) {
        toast(rep.ok ? '生成完成' : '生成完成，但有警告', !rep.ok);
      }).catch(function () { toast('生成失败', true); });
    });

    $('#btnReload').addEventListener('click', function () {
      if (state.dirty && !confirm('有未保存的改动，确定重新读取？')) return;
      load().then(function () { toast('已重新读取'); });
    });

    $('#langSw').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-lang]');
      if (!b) return;
      state.lang = b.getAttribute('data-lang');
      $$('#langSw button').forEach(function (x) { x.classList.toggle('on', x === b); });
      renderAll();
    });

    $$('.nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        $$('.nav a').forEach(function (x) { x.classList.remove('on'); });
        a.classList.add('on');
      });
    });
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ---------- 启动 ---------- */
  bindFields();
  bindAlbumEvents();
  bindUpload();
  bindActions();
  load().catch(function () { toast('读取失败，检查服务是否在跑', true); });
})();
