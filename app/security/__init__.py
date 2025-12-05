# app/security/__init__.py
"""
Security package.

安全相关包：校验、认证、中间件等。
"""

from .headers import register_security_headers

__all__ = ["register_security_headers"]
