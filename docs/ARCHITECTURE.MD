# Clipboard Hub Architecture

> 本文档解释项目的整体设计与分层结构。  
> This document explains the overall project design and layering.

---

## 高层架构 · High-level Architecture

**中文：**  
Clipboard Hub 采用典型的「前后端一体」Flask 应用架构，但内部仍做了清晰分层：

1. **入口层 / App entry**
2. **配置层 / Configuration**
3. **存储层 / Storage (SQLite)**
4. **业务服务层 / Service layer**
5. **路由层 / Routing (API + Web views)**
6. **安全层 / Security (headers + validators)**
7. **前端层 / Frontend (templates + static)**

**English:**  
Clipboard Hub is a monolithic Flask app with a clear internal layering:

1. App entry
2. Configuration
3. Storage (SQLite)
4. Service layer
5. Routing (API + Web views)
6. Security (headers + validators)
7. Frontend (templates + static assets)

---

## 应用入口 · Application Entry

- 文件 / File: `run.py`
- 作用 / Role:
  - 创建 Flask 应用实例：`app = create_app()`
  - 在开发模式下运行内置服务器：`app.run(debug=True)`

`create_app` 定义在：

- `app/__init__.py`

该工厂函数负责：

1. 确定项目根目录、模板目录、静态资源目录
2. 加载配置（`Config`）
3. 初始化数据库（`init_db`）
4. 注册蓝图：
   - `api_bp` → `/api`
   - `web_bp` → `/`
5. 注册安全 HTTP 头（`register_security_headers`）

---

## 配置层 · Configuration

- 文件 / File: `app/config.py`
- 核心类 / Core class: `Config`

主要职责 / Responsibilities：

- 从环境变量读取配置：
  - `SECRET_KEY`
  - `FLASK_ENV`
  - `CLIPS_DB_PATH`
- 提供统一的：
  - `BASE_DIR`：项目根目录
  - `INSTANCE_DIR`：运行时目录（数据库等）
  - `DB_PATH`：SQLite 文件路径
  - `MAX_CLIP_LENGTH`：剪贴最大长度限制

> **设计思路：**  
> 使用单独配置类，方便未来根据环境扩展多个配置（DevConfig / ProdConfig），而不污染业务逻辑代码。

---

## 存储层 · Storage Layer (SQLite)

- 文件 / File: `app/db.py`

主要组件 / Main components：

- `get_db()`  
  - 从 Flask `g` 中获取或创建一个 SQLite 链接  
  - `row_factory` 通常设置为 `sqlite3.Row`，方便字典化访问

- `init_app(app)`  
  - 注册 `teardown_appcontext` 回调以关闭数据库连接  
  - 初始化数据库 schema（在 app 上下文中调用 `init_schema`）

- `init_schema(conn)`  
  - 若表不存在，则创建基础表结构，例如：

    ```sql
    CREATE TABLE IF NOT EXISTS clips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
    ```

- `utc_now_iso()`  
  - 返回当前 UTC 时间的 ISO-8601 字符串，用于 `created_at` / `updated_at` 字段

---

## 数据模型层 · Data Model

- 文件 / File: `app/models.py`
- 模型 / Model: `Clip`（基于 `dataclass`）

职责 / Responsibilities：

- 封装一条剪贴记录的数据结构：
  - `id: int`
  - `content: str`
  - `created_at: str`
  - `updated_at: str`
- 提供：
  - `from_row(row)`：从 SQLite Row 构建 `Clip` 实例
  - `to_dict()`：转换为 dict，用于 JSON 序列化

> **设计原则：**  
> 使用轻量 dataclass 而非 ORM，保持简单可控，避免引入额外复杂度。

---

## 业务服务层 · Service Layer

- 文件 / File: `app/services/clips_service.py`

核心函数 / Core functions：

- `list_clips() -> List[Clip]`  
  查询所有剪贴记录

- `create_clip(raw_content: str) -> Clip`  
  校验并创建新剪贴：
  - 调用 `validate_clip_content`
  - 插入数据库
  - 返回 `Clip` 实例

- `update_clip(clip_id: int, raw_content: str) -> Clip | None`  
  更新指定 ID 的剪贴内容

- `get_clip(clip_id: int) -> Clip | None`  
  获取单条剪贴

- `delete_clip(clip_id: int) -> bool`  
  删除指定 ID 的剪贴，返回是否删除成功

> **设计理念 / Design idea**：  
> 路由层不直接与数据库交互，而是调用 Service 层函数。  
> 这样有利于：
> - 单元测试（可以只测试服务层）  
> - 未来扩展（如增加缓存、审计日志等）  
> - 保持 API 路由代码简洁

---

## 路由层 · Routing Layer

### API 路由 · API routes

- 文件 / File: `app/routes/api_clips.py`
- 蓝图 / Blueprint: `api_bp`，注册在 `/api`

关键点 / Key points：

1. **装饰器 `require_ajax`**  
   - 只允许带 `X-Requested-With: XMLHttpRequest` 的请求
   - 否则直接 `abort(403)`

2. **统一响应封装 / Unified response helpers**
   - `success(data=None, status=200)`
   - `error(message, status=400)`

3. **具体路由 / Concrete routes**
   - `GET /api/clips` → `api_list_clips`
   - `POST /api/clips` → `api_create_clip`
   - `PUT /api/clips/<int:clip_id>` → `api_update_clip`
   - `DELETE /api/clips/<int:clip_id>` → `api_delete_clip`

### Web 视图路由 · Web view routes

- 文件 / File: `app/routes/web_views.py`
- 蓝图 / Blueprint: `web_bp`，注册在 `/`

主要：

- `@web_bp.get("/")`  
  - 渲染 `web/templates/index.html`
  - 不直接返回数据，而是让前端 JS 自行通过 API 拉数据

---

## 安全层 · Security Layer

### HTTP 安全头 · Security headers

- 文件 / File: `app/security/headers.py`
- 函数 / Function: `register_security_headers(app)`

在 `create_app` 中调用后，对所有响应自动附加：

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: no-referrer`
- `Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=()`
- `Content-Security-Policy: ...`（限制外部脚本、iframe 等）

### 内容校验 · Content validation

- 文件 / File: `app/security/validators.py`

核心函数：

- `normalize_content(raw: str) -> str`  
  去除前后空白等简单规范化。

- `validate_clip_content(raw: str) -> str`  
  - 检查为空
  - 检查长度是否超过 `MAX_CLIP_LENGTH`
  - 不合法时抛出 `ValidationError`

service 层在写入数据库前统一调用该函数。

---

## 前端层 · Frontend Layer

### 模板 · Templates

- `web/templates/base.html`
  - 提供基础 HTML 结构、全局 CSS & JS 引入
  - 使用 `<script type="module" src=".../js/main.js"></script>`

- `web/templates/index.html`
  - 具体 UI 布局：
    - 顶部导航（品牌区、多设备同步提示、主题切换按钮）
    - 左侧输入 Panel
    - 右侧列表 Panel

### 静态资源 · Static assets

**CSS：**

- `web/static/css/main.css`
  - 使用 CSS 变量定义主题色：
    - `:root { ... }` 暗色主题为默认
    - `:root[data-theme="light"] { ... }` 覆盖为浅色主题
  - 定义：
    - 布局（双列网格）
    - 卡片、按钮、Chip、搜索框等组件
    - 动画（淡入、列表 item 动画、ripple 波纹等）
  - 字体采用系统字体栈（System UI）

**JavaScript：**

- `web/static/js/api.js`
  - 负责与后端 API 通信：
    - `fetchClips`
    - `createClip`
    - `updateClip`
    - `deleteClip`
  - 统一封装 API 请求 / 响应处理（success / error）

- `web/static/js/ui.js`
  - 只处理「展示层」：
    - 主题切换（读写 `data-theme`）
    - 按钮 ripple 效果
    - 输入框字符/行数统计
    - 列表渲染 / 内联编辑
    - Toast 提示
    - 轻度 3D 视差效果

- `web/static/js/main.js`
  - 前端入口：
    - 初始化：
      - `ui.initTheme()`
      - 事件绑定（按钮、搜索、排序、自动同步）
      - 首次加载列表 `loadClips`
    - 管理前端状态：
      - 本地 `allClips` 数组
      - 搜索词、排序方式
      - 自动同步定时器
    - 将 `api.js` 与 `ui.js` 串联起来

---

## 扩展点 · Extension Points

未来常见扩展方向 / Possible future extensions：

- **用户体系 / User accounts**
  - 为每个用户维护独立的剪贴空间
  - 可在数据库中增加 `user_id` 字段，并在 API 层做认证

- **标签 / Tagging**
  - 为剪贴添加标签字段，支持按标签过滤

- **分组 / Namespaces**
  - 为不同项目 / 设备设定不同分组 key

- **更复杂的权限控制 / Permissions**
  - 区分可读 / 可写 / 只读分享链接

- **全局搜索 / Full-text search**
  - 使用 SQLite FTS 或接入搜索引擎（如 Meilisearch 等）

> 当前代码结构的重点在于「分层清晰」和「足够简单」，  
> 方便你在此基础上继续演化为更复杂的个人工具或小型团队服务。
