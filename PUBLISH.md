# 发布到 GitHub

这份文档是从当前目录（`dsh-conversation-cleaner`）出发的完整发布流程。仓库已经初始化（分支 `main`）、文件已暂存，但**还没有第一次提交**，因为本机没有配置 git 身份。

## 0. 前置检查

```powershell
cd <repo-dir>
git status --short          # 应全部是 A（已暂存）
git log --oneline -1        # 现在会报没有提交，正常
```

需要：

- 一个 GitHub 账号；
- Git（已装，`git --version` 可验证）；
- 能完成一次 GitHub 登录（浏览器 / PAT / SSH key 任选）。

## 1. 在 GitHub 创建空仓库

网页打开 <https://github.com/new>：

- Repository name：`dsh-conversation-manager`（显示名可用「对话管家」）
- 可见性：按需选 Public / Private
- **不要**勾选 Add a README / .gitignore / license（仓库里已经有了）

创建后记下仓库地址，例如：

- HTTPS：`https://github.com/Mark-bob/dsh-conversation-manager.git`
- SSH：`git@github.com:Mark-bob/dsh-conversation-manager.git`

## 2. 配置 git 身份（每台机器一次）

```powershell
git config --global user.name  "你的名字"
git config --global user.email "你的邮箱"
```

想只对当前仓库生效，就去掉 `--global` 并在仓库目录执行。

## 3. 第一次提交

```powershell
git add -A
git commit -m "release: v1.1.0 — conversation manager (no auto-continue)"
```

提交前可再确认一次没有把临时文件带进去：

```powershell
git ls-files
```

应只包含：`index.js`、`client.js`、`cordis.patch.yml`、`package.json`、`README.md`、`LICENSE`、`CHANGELOG.md`、`icon.svg`、`locale/*`、`test/*`、`.github/workflows/ci.yml` 等。

## 4. 关联远端并推送

```powershell
git remote add origin https://github.com/Mark-bob/dsh-conversation-manager.git
git branch -M main
git push -u origin main
```

首次推送会要求认证，二选一：

- **Git Credential Manager**（Windows 上默认）：弹出浏览器登录 GitHub，授权后自动保存；
- **Personal Access Token**：GitHub → Settings → Developer settings → Personal access tokens，勾选 `repo` 权限，推送时把 token 当密码粘贴。

改用 SSH 的话：

```powershell
git remote add origin git@github.com:Mark-bob/dsh-conversation-manager.git
ssh -T git@github.com      # 验证 key 是否已配置
git push -u origin main
```

### 网络：直连 GitHub 被重置时

本机实测直连 HTTPS 会超时/重置，但本地 7897 端口有可用代理：

`powershell
git config http.proxy http://127.0.0.1:7897
git config https.proxy http://127.0.0.1:7897
`

（仅对当前仓库生效；代理端口以你本机实际为准。）
## 5. 推送后检查

- 仓库首页 README 正常渲染；
- **Actions** 里 `ci` 工作流跑通（语法检查 + 两个测试文件）；
- 仓库 Settings 里补 Description 与 Topics，例如：
  - Description：`DeepSeek Harness plugin: conversation manager (archive, pin-lock, delete, attachment cleanup)`
  - Topics：`deepseek-harness` `dsh-plugin` `cordis`

## 6. 打版本标签 / Release

```powershell
git tag -a v1.1.0 -m "v1.1.0: remove auto-continue"
git push origin v1.1.0
```

然后在 GitHub 的 Releases 页面以这个标签创建 Release，正文可直接用 `CHANGELOG.md` 对应段落。

## 7. 从 GitHub 安装到 Harness

插件是 bundle，安装时指向**本地目录**，所以先克隆再安装：

```powershell
git clone https://github.com/Mark-bob/dsh-conversation-manager.git
```

在 Harness 里执行：

```text
plugin_manager install_bundle target=<克隆目录的绝对路径>
```

安装后需要重启一次 Harness（Host 端注册了新的 `connection.fetch` 路由），再刷新页面，侧边栏会出现「对话管家」图标。

## 8. 后续更新流程

```powershell
cd <repo-dir>
# 改代码、跑测试
npm.cmd test
# 更新 CHANGELOG 与 package.json 的 version
git add -A
git commit -m "feat: ..."
git push
```

Harness 里更新已安装的插件：`git pull` 后重启 Harness（Host 代码变更必须重启；只改客户端则刷新页面即可）。

## 9. 常见问题

| 现象 | 处理 |
|---|---|
| `Author identity unknown` | 没配 `user.name` / `user.email`，回到第 2 步 |
| `remote origin already exists` | `git remote set-url origin <地址>` |
| 推送 403 | 账号无权限或 token 权限不足；重新认证 |
| 连接被重置 / 超时 | 直连 GitHub 不可用，配置 http.proxy（见第 4 节） |
| CI 失败 | 看 Actions 日志；本地先跑 `npm.cmd run verify` |
| 行尾符警告 | 仓库已带 `.gitattributes`（`eol=lf`），无需处理 |
| 误提交 node_modules | 已在 `.gitignore` 排除；若已提交：`git rm -r --cached node_modules` 后重新提交 |

## 10. 一键脚本

仓库提供 `scripts/publish.ps1`，把「配置身份 → 提交 → 关联远端 → 推送」串起来：

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish.ps1 `
  -RepoUrl "https://github.com/Mark-bob/dsh-conversation-manager.git" `
  -Name "你的名字" -Email "你的邮箱"
```

脚本会做基本校验（是否 git 仓库、远端格式、是否有可疑文件），已存在提交时只补提交新改动。
