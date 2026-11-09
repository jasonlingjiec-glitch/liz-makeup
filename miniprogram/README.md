# LIZ MAKE UP · 微信小程序版

跟根目录那个网站同一套内容和设计语言，做成原生小程序（不是 web-view 套壳）。

## 已经在微信开发者工具里打开了

- 项目目录：`/Users/ling/Desktop/Miniapp/lizzy/miniprogram`
- 打开方式（下次自己开）：
  1. 打开「微信开发者工具」→ 项目 → 导入项目 / 或直接从最近项目里点 `liz-makeup`
  2. 目录选 `miniprogram`（就是本文件夹，里面有 project.config.json）
  3. 工具会自动编译，模拟器里直接能跑

## 上传

AppID：`wx3afe18c109f5f4d5`

```bash
/Applications/wechatwebdevtools.app/Contents/MacOS/cli upload \
  --project "/Users/ling/Desktop/Miniapp/lizzy/miniprogram" \
  -v "1.0.1" -d "改了什么"
```

上传后到 <https://mp.weixin.qq.com> → 管理 → 版本管理 → 开发版本，可以「选为体验版」或「提交审核」。
上传 ≠ 发布，发布要在审核通过后手动点。

## 关于 AppID

现在用的是正式 AppID：`wx3afe18c109f5f4d5`，已上传过 1.0.0。

- 换 AppID：改 `project.config.json` 的 `appid`，关掉项目重新打开；
- DevTools 在**登录状态**下不接受「游客 AppID」（`touristappid`），
  想用沙箱就在导入项目对话框里点 AppID 右边的「测试号」；
- 上传 = 传到微信后台的「开发版本」，不等于发布；发布要在公众平台审核通过后手动点。

## 改内容

不要直接改页面里的文案——那是显示层。内容都在 `content/content.json`，
用根目录的网页后台改（双击 `启动后台.command` → `http://127.0.0.1:4400`），
点「保存并生成」后会重新生成本目录下的 `data/content.js` 和 `assets/` 压缩图。
生成完在开发者工具里按 ⌘B 重编即可。

## 结构

```
app.js / app.json / app.wxss     全局配置、tabBar、通用样式
project.config.json              项目配置（appid 在这里）
sitemap.json
data/content.js                  全站文案与 6 个相册数据（由 tools/build.js 生成，勿手改）
pages/index/                     首页：头图 + 标题 + 风格精选 + 合作品牌 + 预约入口
pages/works/                     作品集：6 个相册列表
pages/album/                     相册详情：两列图片 + 品牌 + 咨询按钮
pages/service/                   服务与报价：个人/品牌 + 三个计价维度
pages/contact/                   预约咨询：三步流程 + 二维码（可长按识别）+ 复制微信号
assets/                          37 张图，已压缩到 1.35 MB
```

## 包体积

小程序主包上限 **2 MB**。现在整个目录 ≈ **1.4 MB**（图片 1.35 MB + 代码）。

将来加片要注意：每多 1000 张左右就会超，超了就要拆分包（`subPackages`）或者把图放 CDN。
现在这套图的规格是：相册图 660px 长边 / 质量 72，头图 820px，二维码 300px。

## 中英文

- 每页右上角有切换键（中文界面显示 `EN`，英文界面显示 `中`），语言存在本地存储 `liz-lang`。
- 因为原生 tabBar 的文字写死在 app.json 里，这里改成了**自定义 tabBar**（`custom-tab-bar/`），标签跟着语言变：首页/作品/服务/联系 ↔ Home/Work/Service/Contact。
- 文案在 `data/content.js` 的 `zh` / `en` 两块里，由后台生成。
- 新增页面时记得：`onShow` 里同步 `this.getTabBar().setData({selected:N, labels})`。

## 交互

- 底部 4 个 tab：首页 / 作品 / 服务 / 联系
- 首页「查看作品」→ 切到作品 tab；作品点相册 → 进相册页；相册底部「按这个风格咨询」→ 切到联系 tab
- 联系页：二维码支持**长按识别**（`show-menu-by-longpress`），另有「复制微信号」按钮
- 每个页面都配了转发（onShareAppMessage）

## 还没做的

- 没有后端：表单/预约是引导加微信，不是在线下单。要做在线预约需要云开发或自己的接口。
- 文案、价格仍然按之前定的：不写价格，走咨询。
