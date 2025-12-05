"""
App entry point.

应用入口：用于启动 Flask 服务。
"""

from app import create_app

# 默认使用 Config 配置，你可以在 create_app 里切换不同配置类
# Default use Config; you can swap config class inside create_app if needed
app = create_app()

if __name__ == "__main__":
    # 实际是否开启 debug 由配置决定，这里不强写 True
    # Whether debug is enabled is controlled by config, not forced here
    app.run(debug=True)
