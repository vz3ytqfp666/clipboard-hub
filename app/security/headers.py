# app/security/headers.py
"""
Security headers.

统一加上一些安全相关的 HTTP 响应头：
- CSP
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy
"""

from __future__ import annotations
from flask import Flask


def register_security_headers(app: Flask) -> None:
    """
    Attach security headers to every response.

    为所有响应附加安全相关 HTTP 头。
    """

    @app.after_request
    def add_headers(response):
        # 阻止 MIME 嗅探
        response.headers.setdefault("X-Content-Type-Options", "nosniff")

        # 禁止被嵌入 iframe，防 clickjacking
        response.headers.setdefault("X-Frame-Options", "DENY")

        # 不带 referrer
        response.headers.setdefault("Referrer-Policy", "no-referrer")

        # 限制权限（这里先简单关掉常见那些）
        response.headers.setdefault(
            "Permissions-Policy",
            "geolocation=(), microphone=(), camera=(), payment=(), usb=()",
        )

        # Content Security Policy
        csp = (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data:; "
            "connect-src 'self'; "
            "font-src 'self'; "
            "object-src 'none'; "
            "base-uri 'self'; "
            "frame-ancestors 'none'; "
            "form-action 'self'; "
        )
        # 不覆盖你之后可能自己加的 CSP
        response.headers.setdefault("Content-Security-Policy", csp)

        return response
