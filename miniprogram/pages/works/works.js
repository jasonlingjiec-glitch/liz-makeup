const i18n = require('../../utils/i18n.js');

// 序号补零：1 -> 01
function pad2(n) {
  return n < 10 ? '0' + n : '' + n;
}

Page({
  data: {
    lang: 'zh',
    ui: {},
    meta: {},
    works: {},
    albums: []
  },

  onLoad: function () {
    this.render(i18n.getLang());
  },

  onShow: function () {
    var lang = i18n.getLang();
    if (lang !== this._lang) {
      this.render(lang);
    }
    this.syncTabBar(lang);
  },

  render: function (lang) {
    var c = i18n.content(lang);
    var ui = i18n.ui(lang);
    var block = c.ui.works;

    var albums = c.albums.map(function (a, i) {
      return {
        id: a.id,
        num: pad2(i + 1),
        title: a.title,
        en: a.en,
        showEn: lang !== 'en',
        brands: a.brands,
        count: a.images.length,
        cover: '/' + a.images[0]
      };
    });

    this._lang = lang;
    this.setData({
      lang: lang,
      ui: ui,
      meta: c.meta,
      works: block,
      albums: albums
    });
    wx.setNavigationBarTitle({ title: block.title });
  },

  switchLang: function () {
    var lang = i18n.toggleLang();
    this.render(lang);
    this.syncTabBar(lang);
  },

  syncTabBar: function (lang) {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 1, labels: i18n.ui(lang).tabLabels });
    }
  },

  openAlbum: function (e) {
    wx.navigateTo({ url: '/pages/album/album?id=' + e.currentTarget.dataset.id });
  },

  onShareAppMessage: function () {
    return {
      title: this.data.meta.brand + ' · ' + this.data.works.title,
      path: '/pages/works/works'
    };
  }
});
