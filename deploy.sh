#!/bin/bash

# AI Security Web - 快速部署脚本

set -e

echo "🚀 AI Security Web 快速部署脚本"
echo "================================"

# 配置变量
APP_NAME="ai-sec-web"
DEPLOY_DIR="/opt/$APP_NAME"
SERVICE_NAME="ai-sec-web"
PORT=3000
LOG_DIR="/var/log/$APP_NAME"

# 检查是否为 root 用户
if [ "$EUID" -ne 0 ]; then
    echo "❌ 请使用 root 用户运行此脚本"
    exit 1
fi

# 检查压缩包是否存在
if [ ! -f "$APP_NAME.tar.gz" ]; then
    echo "❌ 未找到 $APP_NAME.tar.gz 压缩包"
    echo "请先在本地运行 'npm run package' 生成压缩包"
    exit 1
fi

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js"
    echo "请先安装 Node.js 18 或更高版本"
    exit 1
fi

echo "✅ 检测到 Node.js 版本: $(node --version)"

# 创建部署目录
echo "📁 创建部署目录: $DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# 停止现有服务
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "⏹️  停止现有服务..."
    systemctl stop "$SERVICE_NAME"
fi

# 备份现有版本
if [ -d "$DEPLOY_DIR/$APP_NAME" ]; then
    echo "💾 备份现有版本..."
    BACKUP_DIR="$DEPLOY_DIR/backup-$(date +%Y%m%d-%H%M%S)"
    mv "$DEPLOY_DIR/$APP_NAME" "$BACKUP_DIR"
fi

# 解压新版本
echo "📦 解压新版本..."
tar -xzf "$APP_NAME.tar.gz" -C "$DEPLOY_DIR/"

# 创建日志目录
echo "📁 创建日志目录: $LOG_DIR"
mkdir -p "$LOG_DIR"
chown -R $SUDO_USER:$SUDO_USER "$LOG_DIR"

# 设置权限
echo "🔐 设置权限..."
chown -R $SUDO_USER:$SUDO_USER "$DEPLOY_DIR"
chmod +x "$DEPLOY_DIR/$APP_NAME/start.sh"

# 创建 systemd 服务文件
echo "⚙️  创建 systemd 服务..."
cat > "/etc/systemd/system/$SERVICE_NAME.service" << EOF
[Unit]
Description=AI Security Web Application
After=network.target

[Service]
Type=simple
User=$SUDO_USER
WorkingDirectory=$DEPLOY_DIR/$APP_NAME
ExecStart=$DEPLOY_DIR/$APP_NAME/start.sh -d $LOG_DIR -p $PORT
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

# 重新加载 systemd
echo "🔄 重新加载 systemd..."
systemctl daemon-reload

# 启动服务
echo "▶️  启动服务..."
systemctl start "$SERVICE_NAME"

# 设置开机自启
echo "🔒 设置开机自启..."
systemctl enable "$SERVICE_NAME"

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 3

# 检查服务状态
if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo "✅ 服务启动成功！"
    echo ""
    echo "📊 服务状态:"
    systemctl status "$SERVICE_NAME" --no-pager
    echo ""
    echo "📝 查看日志: journalctl -u $SERVICE_NAME -f"
    echo "🌐 应用地址: http://localhost:$PORT"
    echo "📁 部署目录: $DEPLOY_DIR/$APP_NAME"
    echo "📋 日志目录: $LOG_DIR"
else
    echo "❌ 服务启动失败！"
    echo "查看日志: journalctl -u $SERVICE_NAME -n 50"
    exit 1
fi

echo ""
echo "================================"
echo "✅ 部署完成！"