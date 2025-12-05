"""
Database helpers.

数据库辅助模块：
- 统一管理 SQLite 连接
- 自动初始化数据表
"""

from __future__ import annotations

import sqlite3
from datetime import datetime, timezone
from typing import Any, Dict, Iterable

from flask import current_app, g, Flask


def get_db() -> sqlite3.Connection:
    """
    Get a SQLite connection bound to the current request context.

    获取绑定到当前请求上下文的 SQLite 连接。
    """
    if "db" not in g:
        db_path = current_app.config["DB_PATH"]
        conn = sqlite3.connect(db_path, detect_types=sqlite3.PARSE_DECLTYPES)
        conn.row_factory = sqlite3.Row  # 返回 dict-like 行 / row as dict-like
        g.db = conn
    return g.db


def close_db(e: Exception | None = None) -> None:
    """
    Close DB connection when app context is torn down.

    在请求上下文结束时关闭数据库连接。
    """
    db = g.pop("db", None)
    if db is not None:
        db.close()


def init_schema(conn: sqlite3.Connection) -> None:
    """
    Initialize DB schema (create tables if not exist).

    初始化数据库结构（如果表不存在则创建）。
    """
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS clips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
        """
    )
    conn.commit()


def init_app(app: Flask) -> None:
    """
    Register DB helpers with the Flask app.

    在 Flask 应用中注册数据库相关回调。
    """
    app.teardown_appcontext(close_db)

    # 初始化数据库表结构 / Initialize DB schema
    with app.app_context():
        conn = get_db()
        init_schema(conn)


def utc_now_iso() -> str:
    """
    Get current UTC time in ISO-8601 format.

    获取当前 UTC 时间（ISO-8601 字符串）。
    """
    return datetime.now(timezone.utc).isoformat()
