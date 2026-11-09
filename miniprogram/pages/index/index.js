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
    hero: {},
    about: {},
    contact: {},
    selectedLabel: '',
    footLine: '',
    picks: []
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

  // 按语言重建整页数据
  render: function (lang) {
    var c = i18n.content(lang);
    var ui = i18n.ui(lang);
    var block = c.ui;

    // 风格精选：取相册前 4 本，封面用第一张图；英文下 title 本身就是英文，不再出第二行
    var picks = c.albums.slice(0, 4).map(function (a) {
      return {
        id: a.id,
        title: a.title,
        en: a.en,
        showEn: lang !== 'en',
        cover: '/' + a.images[0]
      };
    });

    this._lang = lang;
    this.setData({
      lang: lang,
      ui: ui,
      meta: c.meta,
      hero: block.hero,
      about: block.about,
      contact: block.contact,
      picks: picks,
      selectedLabel: ui.selected + ' · 01—' + pad2(c.albums.length),
      footLine: c.meta.name + ' · ' + c.meta.role + ui.footSep + c.meta.location
    });
  },

  switchLang: function () {
    var lang = i18n.toggleLang();
    this.render(lang);
    this.syncTabBar(lang);
  },

  syncTabBar: function (lang) {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({ selected: 0, labels: i18n.ui(lang).tabLabels });
    }
  },

  goWorks: function () {
    wx.switchTab({ url: '/pages/works/works' });
  },

  goContact: function () {
    wx.switchTab({ url: '/pages/contact/contact' });
  },

  openAlbum: function (e) {
    wx.navigateTo({ url: '/pages/album/album?id=' + e.currentTarget.dataset.id });
  },

  onShareAppMessage: function () {
    return {
      title: this.data.meta.brand + ' · ' + this.data.meta.name + this.data.ui.nameRoleSep + this.data.meta.role,
      path: '/pages/index/index'
    };
  }
});
