# 本地 ↔ GitHub 自动同步说明

本项目已关联到你的 GitHub 仓库:
**https://github.com/liucheng77/MOMAH-DSO**（私有库,分支 `main`)。

本地目录就是这个仓库,推送鉴权已内置(remote 地址里带访问令牌),所以 `git push` 不会再要你输入账号密码。

## 三种「本地更新后自动上传」的方式

### ① 自动监听(推荐,真正的“改了就传”)
双击 **`watch-sync.command`**。会弹出一个终端窗口,持续监听本目录:你每次保存文件,它会自动 `commit` 并推送到 GitHub。
- 让这个窗口**保持开着**;要停止就按 `Ctrl+C` 或关掉窗口。
- 每次成功同步会打印一行 `✓ synced to GitHub`。

### ② 一键同步(手动,改完点一下)
双击 **`sync.command`**:把当前所有改动提交并推送,完成后窗口提示成功。适合不想常驻监听、改完手动传一次的场景。

### ③ 自动推送钩子(对“提交”这一步自动)
已安装 Git 钩子 `.git/hooks/post-commit`:**只要你用任何工具产生一次 commit,就会自动推送**到 GitHub,无需手动 `git push`。①② 也都依赖它。

> 首次使用如果 macOS 提示 `.command` 文件不可执行,在本目录终端执行一次:
> `chmod +x sync.command watch-sync.command`
> 或用「右键 → 打开」放行。

## 让监听开机自启(可选,免双击)
若希望开机就后台自动同步,可安装一个 LaunchAgent:把下面内容存为
`~/Library/LaunchAgents/com.momah.dso.sync.plist`,把 `PROJECT_PATH` 换成本目录的真实路径,然后执行
`launchctl load ~/Library/LaunchAgents/com.momah.dso.sync.plist`。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>com.momah.dso.sync</string>
  <key>ProgramArguments</key>
  <array><string>/bin/bash</string><string>PROJECT_PATH/watch-sync.command</string></array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
</dict></plist>
```

## 安全提示
- 推送令牌(token)以明文存在本机 `.git/config` 的 remote 地址中(**不会**被上传到 GitHub)。
- 你在对话里贴出过该 token,建议用完后到 GitHub → Settings → Developer settings → Personal access tokens **撤销并重新生成**。
- 若更换了 token,需要更新本地 remote 地址:
  `git remote set-url origin https://liucheng77:新TOKEN@github.com/liucheng77/MOMAH-DSO.git`
  （或改用 macOS 钥匙串凭据助手:`git config --global credential.helper osxkeychain`)。

## 把仓库设为公开 / 启用在线预览(可选)
仓库当前为**私有**。如需公开或用 GitHub Pages 在线打开 `standalone.html`:
GitHub 仓库页 → Settings → 改 Visibility 为 Public → Pages 选择 `main` 分支根目录。
（届时 `standalone.html` 的资源相对路径即可直接访问。）
