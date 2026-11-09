/* LIZ MAKE UP · 按语言把内容渲染到页面 */
(function () {
  'use strict';

  var S = window.SITE;
  if (!S) return;

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------- 界面固定文案 ---------------- */
  var UI = {
    zh: {
      nav: { works: '作品', service: '服务与报价', about: '关于', contact: '联系' },
      cta: '预约咨询',
      hero: { view: '查看作品', enquire: '预约咨询' },
      side: { enquire: '预约咨询' },
      close: '关闭',
      clientsK: '合作品牌',
      albumCta: '按这个风格咨询',
      copy: '复制微信号',
      copied: '已复制',
      count: function (n) { return n + ' 张'; },
      altWork: ' 作品 ',
      toggle: 'EN',
      title: function (m) { return m.brand + ' · ' + m.name + ' ' + m.role; }
    },
    en: {
      nav: { works: 'Work', service: 'Service', about: 'About', contact: 'Contact' },
      cta: 'Enquire',
      hero: { view: 'View work', enquire: 'Enquire' },
      side: { enquire: 'Enquire' },
      close: 'Close',
      clientsK: 'Clients',
      albumCta: 'Enquire about this style',
      copy: 'Copy WeChat ID',
      copied: 'Copied',
      count: function (n) { return n + (n === 1 ? ' photo' : ' photos'); },
      altWork: ' — work ',
      toggle: '中',
      title: function (m) { return m.brand + ' · ' + m.name + ', ' + m.role; }
    }
  };

  /* ---------------- 语言状态 ---------------- */
  function initialLang() {
    var q = '';
    try { q = new URLSearchParams(location.search).get('lang') || ''; } catch (e) {}
    if (q === 'en' || q === 'zh') return q;
    try {
      var saved = localStorage.getItem('liz-lang');
      if (saved === 'en' || saved === 'zh') return saved;
    } catch (e) {}
    return 'zh';
  }

  var lang = initialLang();

  function getPath(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  /* 当前语言下的数据视图：meta 合并品牌信息与本地化信息 */
  function view() {
    var L = S[lang];
    var meta = {};
    ['brand', 'wechat', 'heroImage', 'qrImage'].forEach(function (k) { meta[k] = S.meta[k]; });
    ['name', 'role', 'location'].forEach(function (k) { meta[k] = L.meta[k]; });
    return {
      meta: meta, hero: L.hero, works: L.works, service: L.service,
      about: L.about, contact: L.contact
    };
  }

  function albumList() {
    return (S.albums || []).map(function (a) {
      var t = a[lang] || a.zh || {};
      return {
        id: a.id, images: a.images || [],
        title: t.title, en: t.en, desc: t.desc, brands: t.brands, tags: t.tags || []
      };
    });
  }

  /* ---------------- 渲染 ---------------- */
  function render() {
    var V = view();
    var U = UI[lang];

    document.documentElement.lang = lang === 'en' ? 'en' : 'zh-CN';
    document.body.classList.toggle('lang-en', lang === 'en');

    /* 文本字段 */
    $$('[data-s]').forEach(function (el) {
      var v = getPath(V, el.getAttribute('data-s'));
      if (v != null) el.textContent = v;
    });

    /* 界面文案 */
    $$('[data-ui]').forEach(function (el) {
      var v = getPath(U, el.getAttribute('data-ui'));
      if (typeof v === 'string') el.textContent = v;
    });

    /* 图片 */
    var hero = $('#heroImg');
    if (hero) {
      hero.src = S.meta.heroImage;
      hero.alt = V.hero.lines.join(' ') + U.altWork + V.meta.name;
    }
    var qr = $('#qrImg');
    if (qr) {
      qr.src = S.meta.qrImage;
      qr.alt = (lang === 'en' ? 'WeChat QR code: ' : '微信二维码：') + S.meta.wechat;
    }

    /* 作品卡片 */
    var grid = $('#worksGrid');
    if (grid) {
      grid.innerHTML = albumList().map(function (a, i) {
        return '' +
          '<a class="work" href="#album-' + esc(a.id) + '" data-album="' + esc(a.id) + '">' +
            '<figure class="work-media"><img src="' + esc(a.images[0] || '') + '" alt="' + esc(a.title) + '" loading="lazy"></figure>' +
            '<div class="work-meta">' +
              '<span class="num">' + pad(i + 1) + '</span>' +
              '<span class="names"><span class="cn">' + esc(a.title) + '</span><span class="en">' + esc(a.en) + '</span></span>' +
              '<span class="cnt">' + esc(U.count(a.images.length)) + '</span>' +
            '</div>' +
          '</a>';
      }).join('');
    }

    /* 首页合作品牌 */
    var brands = $('#brands');
    if (brands) {
      brands.innerHTML = (V.about.clients || []).map(function (b) { return '<div>' + esc(b) + '</div>'; }).join('');
    }

    /* 服务 */
    var cats = $('#svcCats');
    if (cats) {
      cats.innerHTML = (V.service.categories || []).map(function (c) {
        return '<div class="svc-cat">' +
          '<p class="cat-k">' + esc(c.k) + '</p>' +
          '<p class="cat-v">' + esc(c.v) + '</p>' +
          '<p class="cat-n">' + esc(c.n) + '</p>' +
        '</div>';
      }).join('');
    }

    var dims = $('#dims');
    if (dims) {
      dims.innerHTML = (V.service.dims || []).map(function (d) {
        return '<div class="dim">' +
          '<p class="dim-k">' + esc(d.k) + '</p>' +
          '<p class="dim-v">' + (d.v || []).map(esc).join('<br>') + '</p>' +
        '</div>';
      }).join('');
    }

    var includes = $('#includes');
    if (includes) {
      includes.innerHTML = (V.service.includes || []).map(function (t, i) {
        return '<li><span>' + pad(i + 1) + '</span>' + esc(t) + '</li>';
      }).join('');
    }

    /* 关于 */
    var paras = $('#aboutParas');
    if (paras) {
      paras.innerHTML = (V.about.paras || []).map(function (t) {
        return '<p class="about-text">' + esc(t) + '</p>';
      }).join('');
    }
    var clients = $('#clientsList');
    if (clients) {
      clients.innerHTML = (V.about.clients || []).map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('');
    }

    /* 联系 */
    var steps = $('#steps');
    if (steps) {
      steps.innerHTML = (V.contact.steps || []).map(function (s, i) {
        return '<li><span class="step-n">' + pad(i + 1) + '</span>' +
          '<div><p class="step-t">' + esc(s.t) + '</p><p class="step-d">' + esc(s.d) + '</p></div></li>';
      }).join('');
    }

    var wechatId = $('#wechatId');
    if (wechatId) wechatId.textContent = S.meta.wechat;

    var copyBtn = $('#copyBtn');
    if (copyBtn) {
      copyBtn.setAttribute('data-copy', S.meta.wechat);
      copyBtn.textContent = U.copy;
    }

    var footCn = $('#footCn');
    if (footCn) footCn.textContent = V.meta.name + ' · ' + V.meta.role;

    var footWechat = $('#footWechat');
    if (footWechat) footWechat.textContent = (lang === 'en' ? 'WeChat ' : '微信 ') + S.meta.wechat;

    var year = $('#year');
    if (year) year.textContent = String(new Date().getFullYear());

    var btn = $('#langBtn');
    if (btn) {
      btn.textContent = U.toggle;
      btn.setAttribute('aria-label', lang === 'en' ? '切换到中文' : 'Switch to English');
    }

    document.title = U.title(V.meta);

    document.dispatchEvent(new CustomEvent('liz:lang', { detail: { lang: lang } }));
  }

  /* ---------------- 切换 ---------------- */
  function setLang(next) {
    if (next !== 'zh' && next !== 'en') return;
    lang = next;
    try { localStorage.setItem('liz-lang', lang); } catch (e) {}
    try {
      var u = new URL(location.href);
      u.searchParams.set('lang', lang);
      history.replaceState(history.state, '', u);
    } catch (e) {}
    render();
  }

  window.lizGetLang = function () { return lang; };
  window.lizSetLang = setLang;
  window.lizAlbums = albumList;
  window.lizUI = function () { return UI[lang]; };

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('#langBtn');
    if (!b) return;
    setLang(lang === 'zh' ? 'en' : 'zh');
  });

  render();
})();
