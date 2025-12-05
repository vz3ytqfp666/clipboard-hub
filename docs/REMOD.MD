# Clipboard Hub

> 简体中文 / English in one file.  
> 本文档面向：想快速部署 / 二次开发 / 读代码的人。

---

## 项目简介 · Project Overview

**中文：**  
Clipboard Hub 是一个轻量级的「云剪贴板」Web 应用：  
打开同一个 URL，你的多台设备共享同一份文本空间。适合存放代码片段、命令行模板、备忘、账号备注等一切「不想每次都重新打一遍」的内容。

**English:**  
Clipboard Hub is a lightweight “cloud clipboard” web app.  
All devices accessing the same URL share the same text space. It is designed for code snippets, shell commands, notes, credentials hints, or any text you don’t want to re-type every time.

---

## 功能概览 · Features

- 🌐 **云剪贴板 / Cloud clipboard**  
  所有访问同一服务地址的设备共享一份文本列表。  
  All devices hitting the same URL share one clipboard list.

- 🎯 **极简 UI，支持深浅色主题 / Minimal UI with dark & light themes**  
  圆角卡片布局、键盘提示、搜索、排序、自动同步。  
  Rounded cards, keyboard hints, search, sorting, auto sync.

- 💾 **本地 SQLite 存储 / Local SQLite storage**  
  默认使用 `instance/clips.db`，方便自托管、备份、迁移。  
  Uses SQLite (`instance/clips.db`) by default for easy self-hosting & backup.

- 🧠 **服务层抽象 / Service-layer abstraction**  
  路由只负责 HTTP 和 JSON，业务逻辑集中在 `app/services`。  
  Routes only handle HTTP & JSON; business logic lives in `app/services`.

- 🛡️ **基础安全保障 / Basic security hardening**  
  - 内容合法性校验 & 长度限制  
  - 统一 JSON 响应包，错误信息可预期  
  - 安全 HTTP 头（CSP、X-Frame-Options、Permissions-Policy 等）  
  - 限制仅接受带 `X-Requested-With: XMLHttpRequest` 的 API 请求  
  Content validation, length limits, security headers, and simple CSRF/form-post mitigation.

- 🧩 **前后端清晰分层 / Clear separation of concerns**  
  - Flask + SQLite 负责 API & 持久化  
  - 现代前端（ES Modules + 单文件 CSS）负责交互和动画  
  Flask + SQLite power the API & persistence; a modern front-end (ES modules + single CSS entry) handles UI & animations.

---

## 技术栈 · Tech Stack

- **后端 / Backend**
  - Python 3.x
  - Flask 3.x
  - SQLite（内置于 Python，零额外依赖）

- **前端 / Frontend**
  - 纯 HTML / CSS / 原生 JavaScript
  - ES Modules：`web/static/js/main.js`, `ui.js`, `api.js`
  - 单 CSS 文件：`web/static/css/main.css`（包含深浅色主题 + 动效）

- **配置 / Config**
  - 环境变量（可通过系统环境变量或 `.env` 提供）
  - 统一配置类：`app/config.py`

---

## 目录结构 · Directory Layout

**简化目录说明（只列核心）：**

```text
clipboard-hub/
├─ app/                     # Flask 应用核心
│  ├─ __init__.py           # create_app 工厂
│  ├─ config.py             # 配置（Config）
│  ├─ db.py                 # SQLite 连接 & schema 初始化
│  ├─ models.py             # 数据模型（Clip）
│  ├─ routes/               # 路由（API + Web）
│  │  ├─ api_clips.py       # /api/clips* JSON API
│  │  └─ web_views.py       # HTML 页面路由
│  ├─ services/             # 业务逻辑
│  │  └─ clips_service.py   # Clip 增删改查逻辑
│  └─ security/             # 安全相关
│     ├─ headers.py         # 安全 HTTP 头
│     └─ validators.py      # 内容校验
│
├─ web/
│  ├─ templates/
│  │  ├─ base.html          # 基础布局
│  │  └─ index.html         # 首页 UI
│  └─ static/
│     ├─ css/
│     │  └─ main.css        # 全局样式 & 主题 & 动画
│     └─ js/
│        ├─ main.js         # 前端入口（事件绑定 + 状态管理）
│        ├─ ui.js           # 纯 UI / 动效逻辑
│        └─ api.js          # 调用后端 API
│
├─ instance/
│  └─ clips.db              # 默认 SQLite 数据库（运行时自动创建）
│
├─ docs/
│  ├─ REMOD.MD              # 本文档（项目 README）
│  ├─ API.MD                # API 说明
│  └─ ARCHITECTURE.MD       # 架构说明
│
├─ .env.example             # 环境变量示例
├─ requirements.txt         # Python 依赖
└─ run.py                   # 启动入口（开发环境）
```

---

## 环境要求 · Requirements

**中文：**

- Python 3.10 或更高版本
- `pip` 可用
- 推荐使用虚拟环境（`venv`）

**English:**

- Python 3.10+
- Working `pip`
- Virtualenv (or `python -m venv`) recommended

---

## 快速开始 · Quick Start

### 1. 克隆仓库 · Clone repository

```bash
git clone <your-repo-url> clipboard-hub
cd clipboard-hub
```

### 2. 创建虚拟环境 · Create virtualenv

```bash
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
# 或 Windows cmd
.venv\Scriptsctivate.bat
# 或 Linux/macOS
source .venv/bin/activate
```

### 3. 安装依赖 · Install dependencies

```bash
pip install -r requirements.txt
```

### 4. 配置环境变量（可选）· Configure environment variables (optional)

你可以：

- **方式 A（推荐生产环境）**：在系统环境中设置变量  
- **方式 B（开发方便）**：复制 `.env.example` 为 `.env`，配合 `flask run` 使用

可配置项：

- `FLASK_ENV`  
  - `development` / `production`  
- `SECRET_KEY`  
  - 会话和安全相关密钥，生产环境务必修改  
- `CLIPS_DB_PATH`  
  - SQLite 路径，默认 `instance/clips.db`

示例：

```bash
# Windows Powershell
$env:FLASK_ENV="development"
$env:SECRET_KEY="change-me"
$env:CLIPS_DB_PATH="instance/clips.db"
```

```bash
# Linux/macOS
export FLASK_ENV=development
export SECRET_KEY="change-me"
export CLIPS_DB_PATH="instance/clips.db"
```

### 5. 启动开发服务器 · Run development server

**方式 A：直接用 `run.py`（当前默认）**

```bash
python run.py
```

默认监听：

- `http://127.0.0.1:5000/`

**方式 B：使用 Flask CLI（自动加载 .env）**

```bash
flask --app app:create_app --debug run
```

---

## 使用说明 · How to Use

### 首页布局 · Home UI

**左侧：新建剪贴 / Left: create new clip**

- 文本框支持多行，适合粘贴代码、日志、指令
- 底部显示：
  - 字符数 / 行数统计
- 支持快捷键：
  - `Ctrl + Enter`：提交并保存为新的剪贴
- 右下角按钮：
  - 「保存」：创建新的剪贴记录
  - 「清空输入」：清空当前文本框内容

**右侧：剪贴列表 / Right: clip list**

- 显示所有已保存的剪贴（按时间排序）
- 支持：
  - 搜索（前端过滤）
  - 升序 / 降序切换
  - 单条操作：
    - 「复制」：将内容复制到系统剪贴板
    - 「编辑」：行内编辑当前项并保存
    - 「删除」：从数据库中删除该条目
- 底部状态栏显示：
  - 当前展示条目数
  - 是否启用自动同步等

### 同步行为 · Sync behavior

- **手动刷新 / Manual refresh**
  - 点击「刷新」按钮，从后端重新获取列表
- **自动同步 / Auto sync**
  - 可切换自动轮询模式（每隔几秒拉取最新数据）
  - 适合多设备同时打开网页的场景

### 多设备共享 · Multi-device usage

- 将服务部署在一个你能访问的地址（比如内网 IP 或公网域名）
- 所有设备使用相同地址访问
  - 如：`http://192.168.1.100:5000/`
- 所有剪贴都存储在同一个 SQLite 数据库中，实现共享

---

## 配置说明 · Configuration Details

配置集中在 `app/config.py` 的 `Config` 类：

- `SECRET_KEY`  
  - 来源：环境变量 `SECRET_KEY`，否则使用默认开发密钥  
  - 用于 session / 安全功能，生产环境必须覆盖

- `DEBUG`  
  - `FLASK_ENV == "development"` 时为 `True`  
  - 控制 Flask 的 debug 模式

- `DB_PATH`  
  - 来源：环境变量 `CLIPS_DB_PATH`，否则为 `instance/clips.db`  
  - SQLite 数据库路径

- `MAX_CLIP_LENGTH`  
  - 限制单条剪贴最大长度（字符数），默认 `8000`

---

## 安全说明 · Security Notes

- **内容验证 / Content validation**
  - `validators.validate_clip_content` 会：
    - 去除两端空白
    - 校验非空
    - 校验长度不超过 `MAX_CLIP_LENGTH`
  - 不满足条件时返回 400 错误

- **统一响应格式 / Unified JSON envelope**
  - 所有 API 统一返回：
    - 成功：`{ "status": "success", "data": ... }`
    - 失败：`{ "status": "error", "message": "..." }`

- **安全 HTTP 头 / Security headers**
  - 通过 `register_security_headers` 在每个响应上附加：
    - `X-Content-Type-Options: nosniff`
    - `X-Frame-Options: DENY`
    - `Referrer-Policy: no-referrer`
    - `Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=()`
    - `Content-Security-Policy: default-src 'self'; script-src 'self'; ...`

- **限制 API 请求来源 / Restrict API calls**
  - API 使用 `require_ajax` 装饰器：
    - 仅接受带 `X-Requested-With: XMLHttpRequest` 的请求
    - 防止最普通的跨站表单「裸 POST」攻击

---

## 测试 · Tests

目前包含基础测试骨架：

- `tests/test_api_clips.py`

运行测试（后续补充测试用例后）：

```bash
pytest
```

---

## 部署建议 · Deployment Notes

**开发环境**  
`python run.py` 或 `flask --app app:create_app --debug run`

**生产环境建议：**

- 使用 WSGI 服务器（如 gunicorn / uWSGI 等）托管 Flask app
- 关闭 debug（确保 `FLASK_ENV=production`，或配置类中设置）
- 放在反向代理（如 Nginx）后面，配置 HTTPS
- 将数据库文件放在仅服务器可访问的位置，并定期备份

示例（gunicorn）：

```bash
pip install gunicorn
gunicorn "app:create_app()"
```

> 注意：生产环境请务必修改 `SECRET_KEY`，并考虑单独的用户认证 / 权限控制逻辑。
