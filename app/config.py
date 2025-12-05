"""
Application configuration.

应用配置模块：负责统一管理配置，例如：
- 调试开关
- 数据库路径
- 安全相关参数
"""

import os


class Config:
    """Base configuration / 基础配置"""

    # Secret key for sessions & security / 会话和安全相关的密钥
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-key-change-in-prod")

    # Debug flag / 调试开关
    DEBUG = os.environ.get("FLASK_ENV") == "development"

    # Base directory / 项目根目录
    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), os.pardir))

    # Instance directory (for DB etc.) / 运行时目录（存数据库等）
    INSTANCE_DIR = os.path.join(BASE_DIR, "instance")

    # Ensure instance dir exists / 确保 instance 目录存在
    os.makedirs(INSTANCE_DIR, exist_ok=True)

    # SQLite DB path / SQLite 数据库路径
    DB_PATH = os.environ.get(
        "CLIPS_DB_PATH",
        os.path.join(INSTANCE_DIR, "clips.db"),
    )

    # 安全相关限制（比如最大内容长度）
    # Security-related limits (e.g. max content length)
    MAX_CLIP_LENGTH = 8000
