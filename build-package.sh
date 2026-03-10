#!/bin/bash

set -e

VERSION=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -h|--help)
            echo "用法: $0 -v <版本号>"
            echo "示例: $0 -v 0.2.19"
            echo ""
            echo "选项:"
            echo "  -v, --version  指定版本号"
            echo "  -h, --help     显示帮助信息"
            exit 0
            ;;
        *)
            echo "未知参数: $1"
            echo "使用 -h 或 --help 查看帮助"
            exit 1
            ;;
    esac
done

if [ -z "$VERSION" ]; then
    echo "❌ 错误: 未指定版本号"
    echo "用法: $0 -v <版本号>"
    echo "示例: $0 -v 0.2.19"
    exit 1
fi

echo "🚀 开始打包 AI-Sec-Web 应用 (版本: $VERSION)..."

# 清理旧的构建
echo "🧹 清理旧的构建文件..."
rm -rf .next/standalone
rm -rf dist/

# 构建 Next.js 应用
echo "📦 构建 Next.js 应用..."
npm run build

# 创建打包目录
echo "📁 创建打包目录..."
rm -rf dist/
mkdir -p dist

# 复制 standalone 构建产物
echo "📋 复制 standalone 构建产物..."
cp -r .next/standalone/.next dist/
cp .next/standalone/server.js dist/
cp .next/standalone/package.json dist/

# 复制 node_modules（Next.js 依赖）
echo "📋 复制 node_modules..."
cp -r .next/standalone/node_modules dist/

# 复制静态资源
echo "📋 复制静态资源..."
cp -r .next/static dist/.next/
cp -r public dist/

# 复制用户数据文件
echo "📋 复制用户数据文件..."
mkdir -p dist/lib
cp src/lib/users.json dist/lib/users.json

# 复制启动脚本
echo "📄 复制启动脚本..."
cp start.sh dist/start.sh
chmod +x dist/start.sh

# 复制服务管理脚本
# echo "📄 复制服务管理脚本..."
# cp ai-sec-web-ctl dist/ai-sec-web-ctl
# chmod +x dist/ai-sec-web-ctl

# 打包 Node.js 运行时
echo "📦 打包 Node.js 运行时..."
NODE_PATH=$(which node)
if [ -z "$NODE_PATH" ]; then
    echo "❌ 错误: 未找到 node 命令"
    exit 1
fi

NODE_VERSION=$($NODE_PATH --version)
echo "   Node.js 版本: $NODE_VERSION"
echo "   Node.js 路径: $NODE_PATH"

# 创建 Node.js 运行时目录
mkdir -p dist/node-runtime/bin
mkdir -p dist/node-runtime/lib

# 复制 Node.js 二进制文件
if [ -f "$NODE_PATH" ]; then
    cp "$NODE_PATH" dist/node-runtime/bin/node
    chmod +x dist/node-runtime/bin/node
    echo "   ✓ 复制 node 二进制文件"
else
    echo "❌ 错误: Node.js 二进制文件不存在"
    exit 1
fi

# 复制 Node.js lib 目录
NODE_LIB_DIR=$(dirname "$NODE_PATH")/../lib
if [ -d "$NODE_LIB_DIR" ]; then
    # cp -r "$NODE_LIB_DIR"/* dist/node-runtime/lib/
    echo "   ✓ 跳过复制 node lib 目录"
else
    echo "❌ 错误: Node.js lib 目录不存在"
    exit 1
fi

# 删除 dist 中的 package-lock.json（避免 Next.js 警告）
echo "🗑️ 清理多余文件..."
rm -f dist/package-lock.json

# 创建部署说明
echo "📝 创建部署说明..."
cat > dist/DEPLOY.md << 'EOF'
# AI-Sec-Web 部署说明

## 快速启动

### 使用启动脚本（推荐）

```bash
cd dist

# 使用默认配置启动
./start.sh

# 指定端口
./start.sh -p 8080

# 指定日志目录
./start.sh -d /custom/logs/path

# 启用快捷登录（开发调试用）
./start.sh --debug

# 完整配置
./start.sh -p 3000 -d /var/log/ai-sec-agent/data -l 0.0.0.0 --debug
```

### 使用服务管理脚本（生产环境推荐）

```bash
cd dist

# 安装系统服务
sudo ./ai-sec-web-ctl install

# 启动服务
sudo ./ai-sec-web-ctl start

# 查看服务状态
./ai-sec-web-ctl status

# 查看服务日志
./ai-sec-web-ctl logs

# 停止服务
sudo ./ai-sec-web-ctl stop

# 重启服务
sudo ./ai-sec-web-ctl restart
```

### Windows

```bash
cd dist
node server.js
```

## 启动脚本参数

### start.sh 选项

- `-p, --port PORT`: 指定服务端口（默认：3000）
- `-d, --logs-dir DIR`: 指定日志目录（默认：/var/log/ai-sec-agent/data）
- `-l, --listen-host HOST`: 指定监听地址（默认：0.0.0.0）
- `--debug`: 启用快捷登录模式（开发调试用）
- `-h, --help`: 显示帮助信息
- `-v, --version`: 显示版本信息

### 示例

```bash
# 指定端口和日志目录
./start.sh -p 8080 -d /custom/logs/path

# 启用快捷登录
./start.sh --debug

# 完整配置
./start.sh -p 3000 -d /var/log/ai-sec-agent/data -l 0.0.0.0 --debug
```

## 服务管理脚本命令

### ai-sec-web-ctl 命令

- `install`: 安装 systemd 服务
- `uninstall`: 卸载 systemd 服务
- `start`: 启动服务
- `stop`: 停止服务
- `restart`: 重启服务
- `status`: 查看服务状态
- `enable`: 开机自启
- `disable`: 关闭开机自启
- `logs`: 查看服务日志
- `reload`: 重新加载服务配置
- `update`: 更新服务配置

### ai-sec-web-ctl 选项

- `-p, --port PORT`: 服务端口（默认：3000）
- `-d, --logs-dir DIR`: 日志目录（默认：/var/log/ai-sec-agent/data）
- `-l, --listen-host HOST`: 监听地址（默认：0.0.0.0）
- `-i, --install-dir DIR`: 安装目录（默认：脚本所在目录，自动检测）
- `--debug`: 启用快捷登录模式
- `-h, --help`: 显示帮助信息
- `-v, --version`: 显示版本信息

### 示例

```bash
# 安装服务（使用默认配置，自动检测脚本所在目录）
sudo ./ai-sec-web-ctl install

# 安装服务（自定义配置）
sudo ./ai-sec-web-ctl install -p 8080 -d /custom/logs -i /opt/my-app

# 启动服务
sudo ./ai-sec-web-ctl start

# 查看服务状态
./ai-sec-web-ctl status

# 查看服务日志
./ai-sec-web-ctl logs

# 重启服务
sudo ./ai-sec-web-ctl restart

# 卸载服务
sudo ./ai-sec-web-ctl uninstall
```

## 环境变量

- `LOGS_DIRECTORY`: 日志文件存储目录（默认：/var/log/ai-sec-agent/data）
- `ENABLE_QUICK_LOGIN`: 启用快捷免密登录（默认：false）
- `NODE_ENV`: 运行环境（默认：production）
- `PORT`: 服务端口（默认：3000）
- `LISTEN_HOST`: 监听地址（默认：0.0.0.0）
- `NEXTAUTH_URL`: NextAuth URL（默认：http://0.0.0.0:3000）
- `NEXTAUTH_SECRET`: NextAuth 密钥（自动生成）
- `USERS_JSON_PATH`: 用户数据文件路径（默认：./lib/users.json）

## 监听地址说明

- `0.0.0.0`: 监听所有网络接口（推荐用于生产环境）
- `127.0.0.1`: 仅监听本地回环接口（仅限本机访问）
- `192.168.x.x`: 监听指定网络接口

## 端口

默认端口：3000

## 日志

应用日志存储在指定的日志目录中。

## 故障排查

### 检查端口是否被占用

```bash
lsof -i :3000
# 或
ss -tlnp | grep :3000
```

### 查看应用日志

```bash
tail -f logs/*.txt
```

### 查看系统服务日志

```bash
sudo journalctl -u ai-sec-web -f
```

### 检查监听地址

```bash
netstat -tlnp | grep :3000
# 或
ss -tlnp | grep :3000
```

### 检查服务状态

```bash
./ai-sec-web-ctl status
# 或
sudo systemctl status ai-sec-web
```

### 查看帮助

```bash
./start.sh --help
./ai-sec-web-ctl --help
```
EOF

echo "✅ 打包完成！"
echo "📦 部署包位置: dist/"
echo "🚀 启动命令: cd dist && ./start.sh"
echo "📋 详细说明: dist/DEPLOY.md"

TAR_NAME="ai-sec-web-${VERSION}.tar.gz"
echo ""
echo "📦 创建发布包: $TAR_NAME..."

cd dist
tar -czvf "../$TAR_NAME" .
cd ..

echo ""
echo "✅ 发布包创建完成！"
echo "📦 文件位置: $TAR_NAME"
echo "📊 文件大小: $(du -h "$TAR_NAME" | cut -f1)"
