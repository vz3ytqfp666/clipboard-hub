"""
API routes for clip operations.

剪贴板相关的 API 路由：
- GET /api/clips
- POST /api/clips
- PUT /api/clips/<id>
- DELETE /api/clips/<id>
"""

from __future__ import annotations
from functools import wraps
from flask import Blueprint, jsonify, request, abort

from ..services.clips_service import (
    list_clips,
    create_clip,
    update_clip,
    delete_clip,
    get_clip,
)
from ..security.validators import ValidationError

api_bp = Blueprint("api_clips", __name__)

def require_ajax(view_func):
  """
  Only allow XHR / fetch requests with X-Requested-With header.

  要求请求头包含 X-Requested-With: XMLHttpRequest。
  主要是防止最普通的跨站表单直接 POST 进来。
  """
  @wraps(view_func)
  def wrapper(*args, **kwargs):
      if request.headers.get("X-Requested-With") != "XMLHttpRequest":
          abort(403)
      return view_func(*args, **kwargs)
  return wrapper

def success(data: dict | list | None = None, status: int = 200):
    """
    Standard success response wrapper.

    标准成功响应封装。
    """
    payload = {"status": "success"}
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status


def error(message: str, status: int = 400):
    """
    Standard error response wrapper.

    标准错误响应封装。
    """
    return jsonify({"status": "error", "message": message}), status


@api_bp.get("/clips")
def api_list_clips():
    """List all clips / 获取所有剪贴"""
    clips = list_clips()
    return success([c.to_dict() for c in clips])


@api_bp.post("/clips")
def api_create_clip():
    """Create new clip / 创建新剪贴"""
    data = request.get_json(silent=True) or {}
    content = data.get("content", "")

    try:
        clip = create_clip(content)
    except ValidationError as exc:
        return error(str(exc), 400)

    return success(clip.to_dict(), status=201)


@api_bp.put("/clips/<int:clip_id>")
def api_update_clip(clip_id: int):
    """Update existing clip / 更新剪贴"""
    if not get_clip(clip_id):
        return error("Clip not found. / 未找到对应剪贴。", 404)

    data = request.get_json(silent=True) or {}
    content = data.get("content", "")

    try:
        clip = update_clip(clip_id, content)
    except ValidationError as exc:
        return error(str(exc), 400)

    return success(clip.to_dict())


@api_bp.delete("/clips/<int:clip_id>")
def api_delete_clip(clip_id: int):
    """Delete clip / 删除剪贴"""
    ok = delete_clip(clip_id)
    if not ok:
        return error("Clip not found. / 未找到对应剪贴。", 404)
    return success(status=204)
