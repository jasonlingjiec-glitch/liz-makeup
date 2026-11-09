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
    album: {},
    left: [],
    right: [],
    totalNum: ''
  },

  onLoad: function (options) {
    var albums = i18n.content(i18n.getLang()).albums;
    this._id = options && options.id ? options.id : albums[0].id;
    this.render(i18n.getLang());
  },

  onShow: function () {
    var lang = i18n.getLang();
    if (lang !== this._lang) {
      this.render(lang);
    }
  },

  render: function (lang) {
    var c = i18n.content(lang);
    var ui = i18n.ui(lang);
    var albums = c.albums;
    var index = 0;
    for (var i = 0; i < albums.length; i++) {
      if (albums[i].id === this._id) {
        index = i;
      }
    }
    var a = albums[index];
    var count = a.images.length;
    var left = [];
    var right = [];
    for (var j = 0; j < count; j++) {
      var src = '/' + a.images[j];
      if (j % 2 === 0) left.push(src);
      else right.push(src);
    }

    this._lang = lang;
    this.setData({
      lang: lang,
      ui: ui,
      meta: c.meta,
      album: {
        id: a.id,
        num: pad2(index + 1),
        title: a.title,
        en: a.en,
        showEn: lang !== 'en',
        desc: a.desc,
        brands: a.brands,
        tags: a.tags,
        count: count,
        countText: count + ' ' + ui.photoUnit + ui.albumMetaSep + ui.albumUpdating
      },
      left: left,
      right: right,
      totalNum: pad2(albums.length)
    });
    wx.setNavigationBarTitle({ title: a.title });
  },

  switchLang: function () {
    this.render(i18n.toggleLang());
  },

  goContact: function () {
    wx.switchTab({ url: '/pages/contact/contact' });
  },

  onShareAppMessage: function () {
    return {
      title: this.data.meta.brand + ' · ' + this.data.album.title,
      path: '/pages/album/album?id=' + this.data.album.id
    };
  }
});
