# NAILONG — Reimagined Classics

Live site: https://icmmme.github.io/nailong-portfolio/

GitHub repository: https://github.com/icmmme/nailong-portfolio

## GitHub Pages

推送至 `main` 后，`.github/workflows/pages.yml` 会安装依赖、运行测试与内容检查、构建并自动部署。Pages 发布来源为 GitHub Actions。仓库路径由工作流传给 Vite；`src/assets.ts` 保证图片、视频与预览使用同一资源前缀，本地开发仍可使用 `/`。

本地校验部署构建：`npm run build -- --base=/nailong-portfolio/`。QA 截图、录屏、临时脚本、依赖和本地环境文件不提交至仓库。

使用 React、Vite、TypeScript、Three.js 和 GSAP 制作的交互式图集，展示 20 张奶龙 / 奶蛙改编名画及英文简介。

## 参考与素材来源

主要设计参考：[Jesper Landberg — Portfolio](https://jesperlandberg.com/)。本项目以其作品集为视觉与交互复刻目标，围绕黑色背景、四角导航、弯曲作品画廊、Featured / Full 切换、鼠标流动效果和折射圆环进行实现。

在此基础上，当前版本使用 NAILONG 图集内容，增加图片详情预览，并将 Contact 圆环内的文字改为抽象的图集介绍。实现采用 React 管理页面状态、Three.js 渲染画廊与后处理、GSAP 编排转场；文字和按钮保留为可访问的 HTML。

图像素材来源：[Naiwa Art Universe](https://nailong-studio.github.io/NaiLong-Universe/)。每件作品的预览保留来源链接，原始素材记录与校验值见 `docs/nailong/`。

## 当前图集

20 张作品按交付编号 01–20 排序，全部加入 Featured 和 Full。高清 JPEG 原图保存在 `public/assets/nailong/01.jpg` 至 `20.jpg`，均为 1920×1080；复制时核对 SHA256，未缩放或重新压缩。点击卡片可查看完整原图和对应简介。

标题、简介及图片路径仍集中在 `src/content.ts`，`collection` 控制 Full 索引说明。预览中的 `source` 链接保留素材库出处；详细来源记录位于 `docs/nailong/`。个人姓名、个人简介和联系方式继续由 `profile` 配置。

网站现已统一为英文：左上角为 NAILONG，作品使用对应原作的正式英文名称，不显示原作者。英文标题和简介的导入映射在 `docs/nailong/content-en.json`；原始中文来源记录作为存档保留。Contact 保留流动圆环，圈内由 `collection.contactTitle / contactIntro` 配置抽象图集介绍。

可重复导入同一交付目录（会使用英文映射更新作品列表，保留 `profile` 和 `collection`）：

```powershell
node scripts/import-nailong.mjs "D:/demo/nailong-art-20/交付_20张"
node scripts/verify-nailong.mjs http://127.0.0.1:5173/
```

第二条命令使用 Node.js 24 核对 20 张图的标题、简介、文件校验值和本地服务响应，需要预览服务已启动。

## 本地运行

推荐 Node.js 24（包括直接运行 TypeScript 运动测试）；本次开发与验证使用 Node.js 24。

```powershell
cd D:\demo\portfolio-replica
npm install
npm run dev
```

打开终端打印的本地地址。检查及生产构建：

```powershell
npm run typecheck
npm test
npm run build
npm run preview
```

生产产物位于 `dist/`，已通过 GitHub Pages 发布。无需数据库、账号或后端。

## 换成你的内容

所有内容集中在 `src/content.ts`：

- `profile.name`：左上角姓名和网页标题。
- `profile.title / intro / note`：资料面板标题、英文简介和补充说明。
- `profile.email`：填写真实邮箱后显示可用的邮件链接；空字符串时隐藏。
- `profile.socials`：例如 `{ label: 'GitHub', href: 'https://github.com/yourname' }`。
- `projects`：配置 `id`、`title`、`category`、`description`、`cover` 和 `featured`。可选 `images`（多张预览图）、`client`、`year`、`video`、`href` 与 `source`（素材来源名称及链接）。

将素材放在 `public/assets/`，路径写为 `/assets/your-cover.webp`。推荐封面比例 3:2、宽度 1200–1600px。换上正式作品后，从 `category` 中移除“示例作品”。

```ts
{
  id: 'my-project',
  title: '我的项目',
  category: '交互设计 / 2026',
  description: '项目背景、设计思路与我负责的工作。\n\n支持分段介绍。',
  cover: '/assets/my-project.webp',
  images: ['/assets/my-project.webp', '/assets/my-project-detail.webp'], // 可选，不填写则预览封面
  client: '项目名称 / 客户名称', // 可选
  year: '2026', // 可选
  video: '/assets/my-project.mp4', // 可选，静音、循环、可见时播放
  href: 'https://your-project.example', // 可选，作品预览内的访问网站入口
  featured: true,
}
```

卡片始终打开本地作品预览，只有预览内的网站入口打开外链。预览图片保留原始比例，可以向下滚动查看多图。视频建议使用较短的 H.264 MP4 或 WebM；先呈现封面，播放被阻止或文件失败时保留封面。优先使用同站素材，跨域视频服务器需要允许 CORS。

## 交互与降级

桌面滚轮或拖拽横向浏览；聚焦画廊后按左右方向键浏览。画廊与标题位于统一的世界坐标曲面，卡片比例 1.7，高度约为视口的 43.5%。拖拽、松手滑行与滚轮缓冲独立处理，反向输入立即响应，重新抓取清除旧惯性。Featured / Full 切换保留当前位置。

点击卡片或聚焦后按 Enter / Space，卡片曲面在约 1.25 秒内展开为白色详情面板，原图落位后交给 HTML 显示；关闭时用约 1 秒反向收回。详情左侧为英文简介与来源，右侧为原始比例大图。Full 索引、手机、图片未加载或减少动态效果模式使用简化预览。打开途中按 Esc 会在展开完成后立即关闭。窗口缩放及滚动会更新转场目标；背景运动和相机在曲面转场中冻结。

拖动卡片不会误触预览。按 Esc、右上角 × 或点击面板外侧关闭，焦点返回原入口。Profile / Contact 同样支持 Esc 与焦点约束。

鼠标快速移动会在两张交替更新的轨迹纹理中留下高度场，用其梯度产生局部透镜拖尾；停止后衰减。保留轻微相机浮动。Profile/Contact 圆环通过实时背景的径向扭曲、旋转和 RGB 色散生成，中央文案为清晰 HTML。Contact 打开时仍可用滚轮浏览背景作品，Profile 阻止背景滚动。整个页面共用一个 WebGLRenderer；没有额外的文字或详情图片渲染器。

桌面像素比上限 1.5，手机窄屏上限 1.25，轨迹纹理宽度 256；支持时使用半浮点纹理，否则使用普通纹理。背景纹理生成 mipmap，减轻折射边缘闪烁。后处理失败时保留基础画廊并采用简化 CSS 圆环；`?effects=off` 可验证此路径。减少动态效果模式关闭拖尾、惯性及连续形变。

手机与电脑共用 WebGL 曲面画廊、作品连续展开和实时折射圆环。手机支持横向或纵向滑动浏览，在拖动阈值后锁定方向；Contact 面板内也可拖动画廊背景。小于 768px 时卡片宽度限制为视口的约 90%，圆环按屏幕短边缩放。手机画廊的 GPU 封面纹理缩至最多 1024px 宽，详情仍使用原始高清图片。

圆环使用更宽的折射边缘、缓慢旋转与高光，与场景共用一个渲染器。圈内只显示 HTML 介绍文字，电脑和手机端均不显示水滴装饰。

WebGL 初始化失败或上下文丢失时自动进入 HTML 列表；`?render=html` 可手动验证该模式，作品预览仍然可用。系统“减少动态效果”开启时取消鼠标浮动、惯性、形变、面板动画和视频自动播放；也可用 `?motion=reduce` 主动启用这个模式。精选作品少于 3 个时使用 HTML 列表。

`src/gallery/Scene.ts` 负责曲面、纹理、转场和资源释放，`GalleryMotion.ts` 管理输入及惯性，`PostEffects.ts` 管理透镜和圆环。`src/App.tsx` 管理视图、焦点和转场阶段，动画进度存于 ref。页面隐藏或窗口失焦时取消旧输入；隐藏时暂停渲染，恢复时重新初始化时间步长。

## 验证说明

测试覆盖循环、拖动阈值、坐标边界、60/144Hz 跟手与滑行、反向输入、旧惯性、速度上限、曲面边缘和展开缓动。浏览器验证记录见 `VALIDATION.md`，截图与动画记录在 `screenshots/`。

Prompt 写法和继续调校的示例见 `PROMPT_GUIDE.md`。图像、简介及联系方式可以通过内容配置继续替换。
