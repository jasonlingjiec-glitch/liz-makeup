const i18n = require('../utils/i18n.js');

// 顺序必须和 app.json tabBar.list 一致
const TAB_PATHS = [
  '/pages/index/index',
  '/pages/works/works',
  '/pages/service/service',
  '/pages/contact/contact'
];

Component({
  data: {
    selected: 0,
    labels: i18n.ui(i18n.getLang()).tabLabels
  },

  attached: function () {
    // 冷启动时按已保存的语言出标签
    this.setData({ labels: i18n.ui(i18n.getLang()).tabLabels });
  },

  methods: {
    switchTab: function (e) {
      var index = Number(e.currentTarget.dataset.index);
      var url = TAB_PATHS[index];
      if (!url) return;
      if (index !== this.data.selected) {
        this.setData({ selected: index });
      }
      wx.switchTab({ url: url });
    }
  }
});
