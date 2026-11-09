# LIZ MAKE UP · 李姿瑶 化妆造型

一个正经的静态网站：桌面优先，手机自适应。纯 HTML / CSS / JS，无构建、无依赖，放在任何静态托管上就能访问。

## 改内容：用后台

双击根目录的 **`启动后台.command`**，浏览器打开 `http://127.0.0.1:4400`，
改完点「保存并生成」——网站刷新即可，小程序在开发者工具里按 ⌘B 重编。
详见 `admin/README.md`。

> 不要直接改 `js/content-data.js` 和 `miniprogram/data/content.js`，它们是生成出来的。

## 中英文

网站右上角有 `EN / 中` 切换键，小程序在每页右上角。文案在 `content/content.json` 里分 `zh` / `en` 两套，后台可以直接编辑；语言选择记在浏览器 / 小程序的本地存储里。

## 打开看

- **直接双击 `index.html`** —— 浏览器就能打开，图片、相册、复制微信号都能用。
- 想用本地服务器（可选）：

  ```bash
  cd lizzy && python3 -m http.server 8080
  # 浏览器打开 http://127.0.0.1:8080
  ```

## 发布上线

整个文件夹就是站点，拖到任意静态托管即可（Vercel / Netlify / 阿里云 OSS / 腾讯云 COS / GitHub Pages）。不需要后端。

- 需要绑定的只有域名；
- 上传时把 `.tmp/`、`demo/`、`refs/` 排除掉即可（它们不是站点内容）。

## 结构

```
index.html          首页（内容由 js/content-data.js 渲染）
css/site.css        样式（颜色、字号、间距都在最上面的 :root 变量里）
js/render.js        把内容渲染到页面
js/site.js          交互：相册弹层、导航、滚动动效、复制微信号
js/content-data.js  ⚠ 自动生成，勿手改（由 content/content.json 生成）

content/content.json ← 所有文案和相册数据（唯一内容来源）
tools/build.js      生成脚本：content.json → 网站数据 + 小程序数据 + 压缩图
admin/              网页版后台（双击 启动后台.command）
assets/             图片（hero.jpg 头图 / qr.jpg 二维码 / 各相册图 / uploads/）
miniprogram/        微信小程序（数据同样来自 content.json）
screens/            已经渲染好的截图
refs/               原始作品集 PDF（存档）
demo/               早期手机原型，可以删掉
```

## 页面结构

| 区块 | 锚点 | 内容 |
|---|---|---|
| 头图 | `#top` | 大标题 + 个人/品牌妆造一句话 + 两个按钮 |
| 作品集 | `#works` | 六个风格相册，点开是全屏相册（可键盘 ESC 关闭，有独立链接 `#album-clean`） |
| 服务与报价 | `#service` | 个人 / 品牌（童装·成人）+ 计价三维度 + 不设价目表的说明 + 服务包含 |
| 关于 | `#about` | 简介 + 合作品牌 |
| 预约咨询 | `#contact` | 三步流程 + 微信二维码 + 一键复制微信号 |

## 改内容

- **文字**：直接改 `index.html` 里对应区块。
- **相册图片**：替换 `assets/` 里同名文件（`clean-1.jpg` … `clean-7.jpg`，编号连续）。
  - 新增/删减某册张数：改 `js/site.js` 顶部 `ALBUMS` 里的 `count`，以及首页作品卡的「X 张」。
  - 相册数量固定六册；要加第七册，需要在 `index.html` 里复制一张作品卡 + 在 `ALBUMS` 里加一段数据。
- **头图**：替换 `assets/hero.jpg`（竖构图 3:4 最好看，建议 ≥1200×1600）。
- **二维码 / 微信号**：替换 `assets/qr.jpg`；微信号在 `index.html` 里搜 `liziyao126` 全改，`js/site.js` 里没有。
- **颜色 / 圆角**：`css/site.css` 顶部 `:root` 的 `--ink / --wash / --line / --accent / --radius`（作品集图片圆角就是 `--radius`）。

## 现在还是占位的

- 服务与报价：**没有任何数字价格**，只说明按「套数 / 场地 / 时长」核算、咨询后报价——按她的意思，价格随时能调，不用改页面。
- 手机号、邮箱：没提供，没放。
- 「关于」那两段介绍是我按作品集写的初稿，需要她本人改。
- 二维码里的微信昵称是 `Lizyao`，页面上写的微信号是 `liziyao126`（已确认）。

## 兼容性

- Chrome / Safari / Edge 最新版；Safari 15+（用到了 `100svh`、`aspect-ratio`）。
- 断点：1180（作品 3→2 列）、980（导航折叠、区块单列）、720（细节收紧）。
- 已测 1440 / 1280 / 1024 / 900 / 768 / 600 / 390 无横向溢出。
