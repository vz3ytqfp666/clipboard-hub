"""
Input validation & basic security helpers.

输入校验与基础安全辅助：
- 文本长度限制
- 去除首尾空白
- 基础合法性检查
"""

from __future__ import annotations

from flask import current_app


class ValidationError(Exception):
    """Raised when input validation fails. / 输入校验失败时抛出"""


def normalize_content(raw: str) -> str:
    """
    Normalize raw content.

    规范化原始文本内容：
    - 去除首尾空白
    - 替换 Windows 换行符为 \n
    """
    if raw is None:
        return ""
    text = str(raw).replace("\r\n", "\n").replace("\r", "\n").strip()
    return text


def validate_clip_content(raw: str) -> str:
    """
    Validate clip content and return normalized text.

    校验剪贴内容并返回规范化结果：
    - 非空
    - 未超过最大长度
    """
    text = normalize_content(raw)
    if not text:
        raise ValidationError("Content must not be empty. / 内容不能为空。")

    max_len = int(current_app.config.get("MAX_CLIP_LENGTH", 8000))
    if len(text) > max_len:
        raise ValidationError(
            f"Content too long (>{max_len} chars). / 内容长度超过限制（>{max_len} 字符）。"
        )

    return text
