"""
Business logic for clips.

剪贴板业务逻辑模块：
- 负责增删改查的核心逻辑
- 路由只负责接收 HTTP 和返回 JSON
"""

from __future__ import annotations

from typing import Iterable, List, Optional

from flask import current_app

from ..db import get_db, utc_now_iso
from ..models import Clip
from ..security.validators import validate_clip_content, ValidationError


def list_clips() -> list[Clip]:
    """
    Return all clips ordered by created_at DESC.

    返回按创建时间倒序排列的所有剪贴。
    """
    db = get_db()
    rows = db.execute(
        """
        SELECT id, content, created_at, updated_at
        FROM clips
        ORDER BY created_at DESC
        """
    ).fetchall()
    return [Clip.from_row(row) for row in rows]


def get_clip(clip_id: int) -> Optional[Clip]:
    """
    Get single clip by id.

    根据 ID 获取单条剪贴。
    """
    db = get_db()
    row = db.execute(
        """
        SELECT id, content, created_at, updated_at
        FROM clips
        WHERE id = ?
        """,
        (clip_id,),
    ).fetchone()
    return Clip.from_row(row) if row else None


def create_clip(raw_content: str) -> Clip:
    """
    Create a new clip from raw content.

    根据原始文本创建新的剪贴。
    """
    db = get_db()
    content = validate_clip_content(raw_content)
    now = utc_now_iso()

    cursor = db.execute(
        """
        INSERT INTO clips (content, created_at, updated_at)
        VALUES (?, ?, ?)
        """,
        (content, now, now),
    )
    db.commit()
    new_id = cursor.lastrowid
    return Clip(
        id=new_id,
        content=content,
        created_at=now,
        updated_at=now,
    )


def update_clip(clip_id: int, raw_content: str) -> Optional[Clip]:
    """
    Update existing clip content.

    更新指定剪贴的内容。
    """
    db = get_db()
    content = validate_clip_content(raw_content)
    now = utc_now_iso()

    db.execute(
        """
        UPDATE clips
        SET content = ?, updated_at = ?
        WHERE id = ?
        """,
        (content, now, clip_id),
    )
    db.commit()

    return get_clip(clip_id)


def delete_clip(clip_id: int) -> bool:
    """
    Delete clip by id.

    根据 ID 删除剪贴。
    """
    db = get_db()
    cursor = db.execute("DELETE FROM clips WHERE id = ?", (clip_id,))
    db.commit()
    return cursor.rowcount > 0
