/* 中英文切换：语言状态 + 数据 + 界面固定文案。
 *
 * 语言只存 'zh' | 'en'，落盘在 storage 的 liz-lang 里，默认 'zh'。
 * content(lang) -> { meta, albums, ui }
 *   meta   全局品牌信息 + 当前语言的 name / role / location
 *   albums 每本相册拍平成本语言的数据（title / en / desc / brands / tags）
 *   ui     当前语言的整块文案（data/content.js 里的 zh 或 en）
 * ui(lang) -> 界面固定文案表（按钮、单位、小标题……），不散落在页面里。
 */
const contentData = require('../data/content.js');

const STORAGE_KEY = 'liz-lang';
const DEFAULT_LANG = 'zh';

const UI = {
  zh: {
    // 切换键显示的是「可以切换到的语言」
    langSwitch: 'EN',
    tabLabels: ['首页', '作品', '服务', '联系'],
    selected: 'Selected',
    picksTitle: '风格精选',
    more: '全部 →',
    viewWorks: '查看作品',
    book: '预约咨询',
    nameRoleSep: ' ',
    clientsEyebrow: 'Clients',
    clientsTitle: '合作品牌',
    enquire: '加微信咨询',
    photoUnit: '张',
    albumUpdating: '相册持续更新',
    albumMetaSep: '　·　',
    footSep: '　·　',
    albumBrandK: '品牌',
    albumCountK: '张数',
    style: 'Style',
    enquireStyle: '按这个风格咨询',
    wechatLabel: 'WeChat',
    copyWechat: '复制微信号',
    copied: '已复制',
    qrHint: '长按二维码可以直接识别添加。'
  },
  en: {
    langSwitch: '中',
    tabLabels: ['Home', 'Work', 'Service', 'Contact'],
    selected: 'Selected',
    picksTitle: 'Selected Work',
    more: 'All →',
    viewWorks: 'View work',
    book: 'Enquire',
    nameRoleSep: ', ',
    clientsEyebrow: 'Clients',
    clientsTitle: 'Clients & Brands',
    enquire: 'Enquire on WeChat',
    photoUnit: 'photos',
    albumUpdating: 'Album updated regularly',
    albumMetaSep: ' · ',
    footSep: ' · ',
    albumBrandK: 'Brand',
    albumCountK: 'Photos',
    style: 'Style',
    enquireStyle: 'Enquire about this style',
    wechatLabel: 'WeChat',
    copyWechat: 'Copy WeChat ID',
    copied: 'Copied',
    qrHint: 'Long-press the QR code to add me.'
  }
};

function normalize(lang) {
  return lang === 'en' ? 'en' : DEFAULT_LANG;
}

function getLang() {
  var stored = '';
  try {
    if (typeof wx !== 'undefined' && wx.getStorageSync) {
      stored = wx.getStorageSync(STORAGE_KEY);
    }
  } catch (e) {
    stored = '';
  }
  return normalize(stored);
}

function setLang(lang) {
  var next = normalize(lang);
  try {
    if (typeof wx !== 'undefined' && wx.setStorageSync) {
      wx.setStorageSync(STORAGE_KEY, next);
    }
  } catch (e) {
    // storage 写失败不影响本次切换
  }
  return next;
}

function toggleLang() {
  return setLang(getLang() === 'zh' ? 'en' : 'zh');
}

function langBlock(lang) {
  return contentData[normalize(lang)];
}

function mergedMeta(block) {
  return {
    brand: contentData.meta.brand,
    wechat: contentData.meta.wechat,
    heroImage: contentData.meta.heroImage,
    qrImage: contentData.meta.qrImage,
    name: block.meta.name,
    role: block.meta.role,
    location: block.meta.location
  };
}

function content(lang) {
  var L = normalize(lang);
  var block = langBlock(L);
  return {
    meta: mergedMeta(block),
    albums: (contentData.albums || []).map(function (a) {
      var loc = a[L] || a.zh;
      return {
        id: a.id,
        images: a.images,
        title: loc.title,
        en: loc.en,
        desc: loc.desc,
        brands: loc.brands,
        tags: loc.tags
      };
    }),
    ui: block
  };
}

function ui(lang) {
  return UI[normalize(lang)];
}

module.exports = {
  getLang: getLang,
  setLang: setLang,
  toggleLang: toggleLang,
  content: content,
  ui: ui
};
