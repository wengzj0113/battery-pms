# 桌面图标一键打开网站：实施计划

## 目标
在 Windows 桌面上生成一个“图标”，用户双击即可直接打开本项目的网站（可选：以“应用窗口”方式打开，像独立软件一样）。

## 推荐结论
**优先推荐：方案 B（PWA 可安装应用）**  
原因：可控的图标/名称、可“安装”为桌面应用（Edge/Chrome 自带）、用户体验最好、维护成本低。

同时提供 **方案 A（零开发，直接创建快捷方式）** 作为立刻可用的临时方案。

---

## 方案 A：零开发（立刻可用）
适用：只要“桌面有图标能打开网址”，不要求像 App 一样独立窗口、也不强制自定义图标。

### A1. Edge（推荐）
1. 用 Edge 打开系统网址（线上部署地址）。
2. 右上角“…” → **应用** → **将此站点作为应用安装**。
3. 安装后会自动出现在开始菜单，也可以固定到任务栏/桌面快捷方式。

### A2. Chrome
1. 打开系统网址。
2. 右上角“…” → **更多工具** → **创建快捷方式…**
3. 勾选“在窗口中打开”（可选）→ 创建。

> 说明：没有 PWA 的情况下，仍可以创建快捷方式，但图标/名称可能不够统一。

---

## 方案 B：PWA（推荐，需一次性开发）
适用：希望桌面图标使用“徐力电子项目管理系统”的品牌图标/名称，并支持浏览器“安装应用”。

### B0. 现状检查（只读）
- 当前前端为 Vite + Vue3（无 PWA 配置），见 frontend/package.json。
- 需要新增 PWA 配置与图标资源（建议 PNG 192/512，含 maskable）。

### B1. 增加 PWA 依赖与 Vite 配置
1. 在前端添加 `vite-plugin-pwa`（devDependency）。
2. 修改 frontend/vite.config.js：
   - 引入并注册 `VitePWA`
   - 配置 `manifest`：
     - `name`: 徐力电子项目管理系统
     - `short_name`: 徐力电子
     - `start_url`: /
     - `scope`: /
     - `display`: standalone
     - `theme_color` / `background_color`: 依据现有主题色（如 #1a1a2e）
     - `icons`: 192/512 PNG + maskable（建议）
   - `registerType: 'autoUpdate'`

### B2. 补齐 PWA 图标资源
1. 在 frontend/public 增加：
   - pwa-192.png
   - pwa-512.png
   - pwa-192-maskable.png（可选但推荐）
   - pwa-512-maskable.png（可选但推荐）
2. 图标来源：
   - 以现有 logo.svg 为源文件导出 PNG（保持清晰、边距适中）。

### B3. 验证（本地 + 部署后）
1. 本地：
   - `npm install`
   - `npm run dev`：检查页面正常
   - `npm run build` + `npm run preview`：检查 manifest/service worker 生成
   - 说明：浏览器安装 PWA 通常要求 HTTPS；localhost 可视为安全环境用于测试。
2. 部署后（HTTPS 域名）：
   - Edge/Chrome 地址栏出现“安装”按钮或菜单项
   - 安装后桌面图标、名称、启动页面正确

### B4. 用户侧操作（安装到桌面）
1. 打开部署网址（HTTPS）。
2. Edge：… → 应用 → 安装此站点作为应用。
3. Chrome：地址栏安装按钮 / … → 投放、保存和分享 → 安装（不同版本菜单略有差异）。

---

## 验收标准
- 在 Windows 桌面上能看到“徐力电子项目管理系统”图标。
- 双击图标可打开网站（PWA 情况下以独立窗口打开）。
- 图标与名称统一、清晰可辨。

