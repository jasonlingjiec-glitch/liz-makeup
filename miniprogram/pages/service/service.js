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
    service: {},
    includes: []
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
    var block = c.ui.service;

    var includes = block.includes.map(function (t, i) {
      return { n: pad2(i + 1), t: t };
    });

    this._lang = lang;
    this.setData({
      lang: lang,
      ui: ui,
      meta: c.meta,
      service: block,
      includes: includes
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
      this.getTabBar().setData({ selected: 2, labels: i18n.ui(lang).tabLabels });
    }
  },

  goContact: function () {
    wx.switchTab({ url: '/pages/contact/contact' });
  },

  onShareAppMessage: function () {
    return {
      title: this.data.meta.brand + ' · ' + this.data.service.title,
      path: '/pages/service/service'
    };
  }
});
