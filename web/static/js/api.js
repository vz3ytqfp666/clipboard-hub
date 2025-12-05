// web/static/js/api.js
/**
 * Simple API client for Clipboard Hub.
 *
 * 仅负责和后端 /api/clips 通信，不做任何 DOM 操作。
 */

const BASE_URL = "/api/clips";

/**
 * Internal helper to call API and handle JSON envelope.
 *
 * 内部工具函数：发送请求并处理统一 JSON 格式：
 * { status: "success"|"error", data?: any, message?: string }
 */
async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest", // 给后端判断是不是正常 AJAX
    },
    credentials: "same-origin", // 同源 cookie，将来要加登录可以复用
    ...options,
  });

  let payload;
  try {
    payload = await res.json();
  } catch {
    throw new Error("Invalid JSON from server / 服务器返回的 JSON 非法。");
  }

  if (!payload || payload.status !== "success") {
    const msg =
      (payload && payload.message) ||
      "Unknown API error. / 未知 API 错误。";
    throw new Error(msg);
  }

  // data 可能是列表 / 对象 / null，都原样返回
  return payload.data ?? null;
}

/**
 * Fetch all clips.
 *
 * 获取所有剪贴。
 */
export async function fetchClips() {
  return await request("");
}

/**
 * Create a new clip.
 *
 * 创建新剪贴。
 */
export async function createClip(content) {
  return await request("", {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}

/**
 * Update a clip.
 *
 * 更新现有剪贴。
 */
export async function updateClip(id, content) {
  return await request(`/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
}

/**
 * Delete a clip by id.
 *
 * 根据 ID 删除剪贴。
 */
export async function deleteClip(id) {
  // 删除不关心返回 data，只要不抛异常即可
  await request(`/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
