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
    contact: {},
    steps: []
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
    var block = c.ui.contact;

    var steps = block.steps.map(function (s, i) {
      return { n: pad2(i + 1), t: s.t, d: s.d };
    });

    this._lang = lang;
    this.setData({
      lang: lang,
      ui: ui,
      meta: c.meta,
      contact: block,
      steps: steps
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
      this.getTabBar().setData({ selected: 3, labels: i18n.ui(lang).tabLabels });
    }
  },

  copyWechat: function () {
    var that = this;
    wx.setClipboardData({
      data: that.data.meta.wechat,
      success: function () {
        // setClipboardData 自带一个系统提示，先收掉再显示当前语言的提示
        wx.hideToast();
        wx.showToast({ title: that.data.ui.copied, icon: 'none', duration: 1600 });
      }
    });
  },

  onShareAppMessage: function () {
    return {
      title: this.data.meta.brand + ' · ' + this.data.contact.title,
      path: '/pages/contact/contact'
    };
  }
});
