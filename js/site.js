/* LIZ MAKE UP — site behaviour */
(function () {
  'use strict';

  /* ---------------------------------------------------------------- data */
  var ALBUMS = {};
  function rebuildAlbums() {
    var list = (window.lizAlbums ? window.lizAlbums() : []) || [];
    ALBUMS = {};
    list.forEach(function (a, i) {
      ALBUMS[a.id] = {
        num: (i + 1 < 10 ? '0' : '') + (i + 1),
        title: a.title,
        en: a.en,
        desc: a.desc,
        brands: a.brands,
        images: a.images || []
      };
    });
  }
  rebuildAlbums();

  var $  = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------- nav */
  var nav = $('#nav');
  var onScroll = function () {
    if (window.scrollY > 8) nav.classList.add('scrolled');
    else nav.classList.remove('scrolled');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  var menuBtn = $('#menuBtn');
  var links = $('#links');
  menuBtn.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  $$('#links a').forEach(function (a) {
    a.addEventListener('click', function () {
      links.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    });
  });
  window.addEventListener('resize', function () {
    if (window.innerWidth > 980) {
      links.classList.remove('open');
      menuBtn.setAttribute('aria-expanded', 'false');
    }
  });

  /* smooth anchor scroll with sticky-nav offset */
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href');
      if (!id || id.length < 2 || id.indexOf('#album-') === 0) return;
      if (a.closest && a.closest('.album')) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var top = target.getBoundingClientRect().top + window.scrollY - (parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 76) + 1;
      window.scrollTo({ top: top, behavior: 'smooth' });
      history.replaceState(null, '', id);
    });
  });

  /* ------------------------------------------------------------- scrollspy */
  var spyIds = ['works', 'service', 'about', 'contact'];
  var spySecs = spyIds.map(function (id) { return document.getElementById(id); }).filter(Boolean);
  var spyLinks = {};
  $$('#links a').forEach(function (a) {
    var id = (a.getAttribute('href') || '').replace('#', '');
    if (spyIds.indexOf(id) > -1) spyLinks[id] = a;
  });
  var navH = function () {
    return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 76;
  };
  function spy() {
    var line = window.scrollY + navH() + 80;
    var current = null;
    spySecs.forEach(function (sec) {
      if (sec.offsetTop <= line && sec.offsetTop + sec.offsetHeight > line) current = sec.id;
    });
    spyIds.forEach(function (id) {
      if (spyLinks[id]) spyLinks[id].classList.toggle('active', id === current);
    });
  }
  window.addEventListener('scroll', spy, { passive: true });
  spy();

  /* ---------------------------------------------------------------- reveal */
  var revealables = $$('.sec-head, .work, .works-note, .split-main > *, .split-side');
  if ('IntersectionObserver' in window) {
    revealables.forEach(function (el) { el.classList.add('reveal'); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var i = $$('.work').indexOf(el);
        if (i > -1) el.style.transitionDelay = (i % 3) * 90 + 'ms';
        el.classList.add('in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ---------------------------------------------------------------- album */
  var album   = $('#album');
  var scroller = $('#albumScroll');
  var grid    = $('#albumGrid');
  var closeBtn = $('#albumClose');
  var current = null;
  var lastFocus = null;
  var built = {};

  function build(id) {
    if (built[id]) return;
    var a = ALBUMS[id];
    var frag = document.createDocumentFragment();
    (a.images || []).forEach(function (src, i) {
      var img = document.createElement('img');
      img.src = src;
      img.alt = a.title + ' 作品 ' + (i + 1);
      img.loading = 'lazy';
      frag.appendChild(img);
    });
    // cache per album so switching back is instant
    var box = document.createElement('div');
    box.className = 'album-imgs';
    box.appendChild(frag);
    grid.appendChild(box);
    built[id] = box;
  }

  function openAlbum(id, push) {
    var a = ALBUMS[id];
    if (!a) return;
    build(id);
    $$('.album-imgs').forEach(function (b) { b.style.display = 'none'; });
    built[id].style.display = '';
    $('#albumNum').textContent = a.num;
    $('#albumTitle').textContent = a.title;
    $('#albumEn').textContent = a.en;
    $('#albumDesc').textContent = a.desc;
    $('#albumBrands').textContent = a.brands;
    album.classList.add('open');
    album.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lock');
    scroller.scrollTop = 0;
    current = id;
    if (push) history.pushState({ album: id }, '', '#album-' + id);
    closeBtn.focus({ preventScroll: true });
  }

  function closeAlbum(viaHistory) {
    if (!current) return;
    album.classList.remove('open');
    album.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lock');
    current = null;
    if (lastFocus) lastFocus.focus({ preventScroll: true });
    if (!viaHistory) {
      if (history.state && history.state.album) history.back();
      else history.replaceState(null, '', location.pathname + location.search + '#works');
    }
  }

  document.addEventListener('click', function (e) {
    var card = e.target.closest && e.target.closest('.work');
    if (!card) return;
    e.preventDefault();
    lastFocus = card;
    openAlbum(card.getAttribute('data-album'), true);
  });

  /* 语言切换：重建缓存并刷新相册 */
  document.addEventListener('liz:lang', function () {
    if (current) {
      album.classList.remove('open');
      album.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lock');
      current = null;
    }
    built = {};
    grid.innerHTML = '';
    rebuildAlbums();
  });
  closeBtn.addEventListener('click', function () { closeAlbum(false); });
  $('#albumCta').addEventListener('click', function () {
    closeAlbum(false);
    setTimeout(function () {
      var c = document.querySelector('#contact');
      if (!c) return;
      var h = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 76;
      window.scrollTo({ top: c.getBoundingClientRect().top + window.scrollY - h + 1, behavior: 'smooth' });
    }, 60);
  });

  window.addEventListener('popstate', function () {
    var h = location.hash;
    if (h.indexOf('#album-') === 0) openAlbum(h.slice(7), false);
    else closeAlbum(true);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && current) closeAlbum(false);
  });

  if (location.hash.indexOf('#album-') === 0) openAlbum(location.hash.slice(7), false);

  /* ---------------------------------------------------------------- copy */
  var copyBtn = $('#copyBtn');
  if (copyBtn) {
    copyBtn.addEventListener('click', function () {
      var text = copyBtn.getAttribute('data-copy');
      var done = function () {
        var U = window.lizUI ? window.lizUI() : { copy: '复制微信号', copied: '已复制' };
        copyBtn.textContent = U.copied;
        copyBtn.classList.add('done');
        setTimeout(function () {
          copyBtn.textContent = U.copy;
          copyBtn.classList.remove('done');
        }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done);
      } else {
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); done(); } catch (err) {}
        document.body.removeChild(ta);
      }
    });
  }

  /* ---------------------------------------------------------------- year */
  var y = $('#year');
  if (y) y.textContent = String(new Date().getFullYear());
})();
