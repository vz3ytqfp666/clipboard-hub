# Clipboard Hub API Reference

> 简体中文 & English description combined.

---

## 总览 · Overview

所有 API 都挂在统一前缀：

- Base URL: `/api/clips`

统一返回格式（JSON）：

- 成功 / Success:

```json
{
  "status": "success",
  "data": ...
}
```

- 失败 / Error:

```json
{
  "status": "error",
  "message": "human readable error message"
}
```

> 所有写操作请求必须携带 `Content-Type: application/json` 以及  
> `X-Requested-With: XMLHttpRequest` 请求头，否则会被拒绝（403）。

---

## 公共约定 · Common Conventions

### 请求头 · Request headers

- `Content-Type: application/json`  
- `Accept: application/json`  
- `X-Requested-With: XMLHttpRequest` (required)

### 编码 · Encoding

- UTF-8 JSON

### 时间格式 · Time format

- 所有时间字段采用 ISO-8601 字符串（UTC）：
  - Example: `"2025-12-05T05:30:12.345678+00:00"`

---

## 数据模型 · Data Model

### Clip 对象 · Clip object

```json
{
  "id": 1,
  "content": "some text",
  "created_at": "2025-12-05T05:30:12.345678+00:00",
  "updated_at": "2025-12-05T05:30:12.345678+00:00"
}
```

- `id`  
  整型，自增主键 / Integer, auto-increment primary key
- `content`  
  剪贴内容 / Clip text content
- `created_at`  
  创建时间（UTC ISO 字符串） / Created time (UTC ISO)
- `updated_at`  
  最近修改时间（UTC ISO 字符串） / Last updated time (UTC ISO)

---

## GET /api/clips

**用途 / Purpose**

- 获取所有剪贴记录（按时间排序，服务端当前实现按 `created_at` 排序）。

**请求 / Request**

```http
GET /api/clips HTTP/1.1
Accept: application/json
X-Requested-With: XMLHttpRequest
```

**响应 / Response**

- 状态码 / Status code: `200 OK`

```json
{
  "status": "success",
  "data": [
    {
      "id": 1,
      "content": "hello",
      "created_at": "...",
      "updated_at": "..."
    },
    ...
  ]
}
```

若当前无数据：

```json
{
  "status": "success",
  "data": []
}
```

---

## POST /api/clips

**用途 / Purpose**

- 创建新的剪贴记录。

**请求 / Request**

```http
POST /api/clips HTTP/1.1
Content-Type: application/json
Accept: application/json
X-Requested-With: XMLHttpRequest
```

请求体 / JSON body:

```json
{
  "content": "your text here"
}
```

字段约束 / Constraints:

- `content`：
  - 必填 / required
  - 去除前后空白后不能为空
  - 长度需小于等于 `MAX_CLIP_LENGTH`（默认 8000）

**成功响应 / Success response**

- 状态码：`201 Created`（如配置为 200 也可按实际实现调整陈述，这里假设使用 201 或 200）

示例：

```json
{
  "status": "success",
  "data": {
    "id": 2,
    "content": "your text here",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

**失败响应 / Error responses**

1. 内容为空或仅空白：

```json
{
  "status": "error",
  "message": "Content is empty. / 内容不能为空。"
}
```

HTTP 状态码：`400 Bad Request`

2. 内容过长（超出 `MAX_CLIP_LENGTH`）：

```json
{
  "status": "error",
  "message": "Content too long. / 内容超出最大长度限制。"
}
```

HTTP 状态码：`400 Bad Request`

3. 缺少 JSON 或格式非法：

```json
{
  "status": "error",
  "message": "Invalid JSON payload."
}
```

HTTP 状态码：`400 Bad Request`

---

## PUT /api/clips/<id>

**用途 / Purpose**

- 更新指定 ID 的剪贴内容。

**请求 / Request**

```http
PUT /api/clips/123 HTTP/1.1
Content-Type: application/json
Accept: application/json
X-Requested-With: XMLHttpRequest
```

请求体 / JSON body:

```json
{
  "content": "new content"
}
```

**成功响应 / Success response**

- 状态码：`200 OK`

```json
{
  "status": "success",
  "data": {
    "id": 123,
    "content": "new content",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

**失败响应 / Error responses**

1. 记录不存在 / Clip not found：

```json
{
  "status": "error",
  "message": "Clip not found. / 未找到对应剪贴。"
}
```

HTTP 状态码：`404 Not Found`

2. 校验失败（为空、过长等）同 POST。

---

## DELETE /api/clips/<id>

**用途 / Purpose**

- 删除指定 ID 的剪贴。

**请求 / Request**

```http
DELETE /api/clips/123 HTTP/1.1
Accept: application/json
X-Requested-With: XMLHttpRequest
```

**成功响应 / Success response**

- 状态码：`204 No Content`（实现中可能仍返回 JSON，视代码为准）

示例：

```json
{
  "status": "success"
}
```

**失败响应 / Error response**

记录不存在：

```json
{
  "status": "error",
  "message": "Clip not found. / 未找到对应剪贴。"
}
```

HTTP 状态码：`404 Not Found`

---

## 错误处理总结 · Error Handling Summary

- 所有错误响应结构统一为：

```json
{
  "status": "error",
  "message": "some message"
}
```

- 常见状态码：
  - `400 Bad Request`：参数无效 / 验证失败 / JSON 格式错误
  - `403 Forbidden`：缺少 `X-Requested-With: XMLHttpRequest`
  - `404 Not Found`：访问不存在的剪贴
  - `500 Internal Server Error`：未捕获异常（生产建议增加统一错误处理）
