from __future__ import annotations
import os
from flask import Flask

from .config import Config
from .db import init_app as init_db
from .routes.api_clips import api_bp
from .routes.web_views import web_bp
from .security.headers import register_security_headers


def create_app(test_config: dict | None = None) -> Flask:
    # 项目根目录 clipboard-hub/
    BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

    # 明确告诉 Flask 模板与静态文件在哪
    app = Flask(
        __name__,
        template_folder=os.path.join(BASE_DIR, "web", "templates"),
        static_folder=os.path.join(BASE_DIR, "web", "static"),
    )

    # 配置
    app.config.from_object(Config)
    if test_config:
        app.config.update(test_config)

    # DB
    init_db(app)

    # 路由
    app.register_blueprint(api_bp, url_prefix="/api")
    app.register_blueprint(web_bp)

    # 安全头
    register_security_headers(app)

    return app
