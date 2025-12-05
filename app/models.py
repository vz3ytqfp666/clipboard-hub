"""
Data models.

数据模型模块：定义应用内部使用的基础结构。
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping, Any


@dataclass
class Clip:
    """
    Clip model.

    剪贴模型：代表一条文本记录。
    """

    id: int
    content: str
    created_at: str
    updated_at: str

    @classmethod
    def from_row(cls, row: Mapping[str, Any]) -> "Clip":
        """
        Build Clip from a DB row.

        从数据库行构建 Clip 实例。
        """
        return cls(
            id=row["id"],
            content=row["content"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )

    def to_dict(self) -> dict[str, Any]:
        """
        Convert Clip to dict for JSON responses.

        转换为字典，方便序列化为 JSON。
        """
        return {
            "id": self.id,
            "content": self.content,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }
