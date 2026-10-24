# 对话管家 · Conversation Manager

一个 DeepSeek Harness 插件（bundle）：把「对话管理」做成独立的侧边栏应用页，用于归档、锁定、删除已保存的对话，并清理无引用的附件。包标识沿用 `dsh-conversation-cleaner`。

> DeepSeek Harness plugin for managing stored conversations: archive, pin-lock, delete logs, and clean orphan attachments.

## 功能

| 功能 | 说明 |
|---|---|
| 独立应用页 | 侧边栏「对话管家」图标打开全屏页面，也在设置里保留入口 |
| 对话列表 | 标题、工作目录、时间、事件数、磁盘占用；搜索与筛选（全部 / 未归档 / 已归档 / 已置顶） |
| 归档 / 取消归档 | 归档后从侧边栏隐藏；可随时恢复；归档状态与侧边栏一致 |
| 置顶即锁定 | 置顶的对话不能删除、不能归档；它引用的附件也不会被清理 |
| 删除对话 | 删除会话日志目录与投影缓存；运行中的会话会先被停止；还有子对话的会话拒绝删除 |
| 附件清理 | 扫描所有已存对话的引用，只清理「无任何对话引用且写入超过 24 小时」的附件对象；扫描不完整时拒绝删除 |

## 安装

要求：已安装并运行 DeepSeek Harness（桌面版或 Web 版），Node.js ≥ 20。

```bash
git clone https://github.com/Mark-bob/dsh-conversation-manager.git
```

然后在 Harness 里安装这个本地 bundle（绝对路径）：

```text
plugin_manager install_bundle target=D:\path\to\<仓库目录>
```

也可以直接让 Harness 里的助手代装。安装后：

1. 重启一次 Harness（Host 端注册了新的 `connection.fetch` 路由）；
2. 刷新页面，侧边栏会出现「对话管家」图标；
3. 设置 → 对话管家 里也有入口说明。

## 使用

打开侧边栏「对话管家」：

- 顶部：统计（对话数 / 磁盘占用 / 已置顶 / 已归档）、搜索、刷新；
- 中间：筛选 + 对话列表，每行右侧按状态提供 **置顶 / 取消置顶**、**归档 / 取消归档**、**删除**；
- 右侧：附件清理卡片（扫描 → 统计 → 二次确认清理）与规则说明。

规则：

- **置顶是锁**：置顶后不能删除、不能归档；取消置顶才恢复操作；
- **归档与置顶互斥**：已归档的对话要先取消归档才能置顶；
- **有子对话不能删除**：子会话的日志前缀依赖父日志，需先删子会话；
- **删除不可恢复**：直接删除日志文件，不进回收站；
- **附件按内容共享存储**：只清理没有任何对话引用的对象，且要求写入超过 24 小时。

## 实现结构

```text
index.js              Host 半：4 条鉴权路由
client.js             Client 半：应用页、侧边栏图标、行内删除、确认弹层
cordis.patch.yml      Loader 插入行
package.json          bundle 清单（dsh.bundle / dsh.client）
locale/*.json         插件管理页的标题与描述
icon.svg              插件图标
test/                 不依赖浏览器的 Host / Client 结构测试
```

Host 路由（`connection.fetch`，均要求已登录）：

| 路径 | 方法 | 作用 |
|---|---|---|
| `/api/conversation-cleaner` | GET / POST | 列出对话；删除对话 |
| `/api/conversation-cleaner-archive` | POST | 归档 / 取消归档 |
| `/api/conversation-cleaner-pin` | POST | 置顶 / 取消置顶 |
| `/api/conversation-cleaner-attachments` | GET / POST | 扫描附件；清理未引用附件 |

## 开发与测试

```bash
npm run check   # 语法检查
npm test        # 两个测试文件
npm run verify  # 两者
```

测试全部只依赖 Node 内置模块，不需要浏览器或 Harness 运行时。

## 发布

仓库内的 [PUBLISH.md](PUBLISH.md) 是完整的 GitHub 发布流程（建仓库、提交、认证、推送、打标签、从 GitHub 安装），并提供一键脚本 `scripts/publish.ps1`。

## 已知限制

- 侧边栏列表由 Host 侧驱动，删除/归档后侧边栏可能要到刷新才更新；
- Harness 自带的侧边栏「归档」按钮仍按应用语义解除置顶，本插件只在自身入口拦截；
- 附件目录中的 `request-images/`、`tmp/` 属于应用管理的派生缓存，本插件不清理。

## License

[MIT](LICENSE)

---

### English

A DeepSeek Harness bundle that adds a Conversation Manager app page: browse stored conversations, archive/unarchive, pin (pin = lock: no delete, no archive), delete logs, and clean unreferenced attachments older than 24 hours.

Install: clone the repo, then install the folder as a bundle from its absolute path (`plugin_manager install_bundle`), restart Harness once, and open the sidebar entry. Tests: `npm test`.
