#!/bin/bash

set -e

VERSION="1.0.0"
SCRIPT_NAME="$(basename "$0")"

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# 默认配置
DEFAULT_PORT=3000
DEFAULT_LOGS_DIR="/var/log/ai-sec-agent/data"
DEFAULT_LISTEN_HOST="0.0.0.0"
DEFAULT_QUICK_LOGIN=false

# 当前配置
PORT="$DEFAULT_PORT"
LOGS_DIRECTORY="$DEFAULT_LOGS_DIR"
LISTEN_HOST="$DEFAULT_LISTEN_HOST"
ENABLE_QUICK_LOGIN="$DEFAULT_QUICK_LOGIN"
SHOW_HELP=false
SHOW_VERSION=false

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1" >&2
}

print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  AI-Sec-Web 启动脚本 v${VERSION}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

show_usage() {
    cat << EOF
用法: $SCRIPT_NAME [选项]

选项:
    -p, --port PORT          指定服务端口 (默认: ${DEFAULT_PORT})
    -d, --logs-dir DIR       指定日志目录 (默认: ${DEFAULT_LOGS_DIR})
    -l, --listen-host HOST   指定监听地址 (默认: ${DEFAULT_LISTEN_HOST})
    --debug                  启用快捷登录模式 (开发调试用)
    -h, --help               显示此帮助信息
    -v, --version            显示版本信息

示例:
    # 使用默认配置启动
    $SCRIPT_NAME

    # 指定端口和日志目录
    $SCRIPT_NAME -p 8080 -d /custom/logs/path

    # 启用快捷登录模式
    $SCRIPT_NAME --debug

    # 完整配置
    $SCRIPT_NAME -p 3000 -d /var/log/ai-sec-agent/data -l 0.0.0.0 --debug

环境变量:
    NODE_ENV               运行环境 (默认: production)
    NEXTAUTH_URL           NextAuth URL
    NEXTAUTH_SECRET        NextAuth 密钥
    USERS_JSON_PATH        用户数据文件路径

更多信息请参考: https://github.com/your-org/ai-sec-web
EOF
}

show_version() {
    echo "AI-Sec-Web 启动脚本 v${VERSION}"
    echo "Copyright (c) 2024 AI-Sec-Web Team"
}

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -p|--port)
                PORT="$2"
                shift 2
                ;;
            -d|--logs-dir)
                LOGS_DIRECTORY="$2"
                shift 2
                ;;
            -l|--listen-host)
                LISTEN_HOST="$2"
                shift 2
                ;;
            --debug)
                ENABLE_QUICK_LOGIN=true
                shift
                ;;
            -h|--help)
                SHOW_HELP=true
                shift
                ;;
            -v|--version)
                SHOW_VERSION=true
                shift
                ;;
            *)
                print_error "未知选项: $1"
                echo ""
                show_usage
                exit 1
                ;;
        esac
    done
}

validate_configuration() {
    local has_error=false

    # 验证端口
    if ! [[ "$PORT" =~ ^[0-9]+$ ]] || [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
        print_error "无效的端口号: $PORT (必须是 1-65535 之间的数字)"
        has_error=true
    fi

    # 验证日志目录
    if [ ! -d "$LOGS_DIRECTORY" ]; then
        print_warning "日志目录不存在: $LOGS_DIRECTORY"
        print_info "尝试创建日志目录..."
        if ! mkdir -p "$LOGS_DIRECTORY" 2>/dev/null; then
            print_error "无法创建日志目录: $LOGS_DIRECTORY"
            print_info "请检查权限或使用 sudo 运行"
            has_error=true
        fi
    fi

    # 检查端口占用
    if command -v lsof &> /dev/null; then
        if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
            print_warning "端口 $PORT 已被占用"
            print_info "正在运行的进程:"
            lsof -Pi :$PORT -sTCP:LISTEN
        fi
    fi

    if [ "$has_error" = true ]; then
        exit 1
    fi
}

print_configuration() {
    echo "📋 配置信息:"
    echo "   └─ 端口: ${PORT}"
    echo "   └─ 监听地址: ${LISTEN_HOST}"
    echo "   └─ 日志目录: ${LOGS_DIRECTORY}"
    echo "   └─ 快捷登录: ${ENABLE_QUICK_LOGIN}"
    echo "   └─ 运行环境: ${NODE_ENV:-production}"
    echo ""
}

start_application() {
    # 优先使用打包的 Node.js 运行时
    PACKAGED_NODE="$SCRIPT_DIR/node-runtime/bin/node"
    NODE_CMD=""

    if [ -f "$PACKAGED_NODE" ]; then
        NODE_CMD="$PACKAGED_NODE"
        print_info "使用打包的 Node.js 运行时"
    else
        NODE_CMD="node"
        print_info "使用系统 Node.js"
    fi

    # 设置环境变量
    export NODE_ENV="${NODE_ENV:-production}"
    export LOGS_DIRECTORY="$LOGS_DIRECTORY"
    export ENABLE_QUICK_LOGIN="$ENABLE_QUICK_LOGIN"
    export NEXT_PUBLIC_ENABLE_QUICK_LOGIN="$ENABLE_QUICK_LOGIN"
    export PORT="$PORT"
    export LISTEN_HOST="$LISTEN_HOST"
    export HOSTNAME="$LISTEN_HOST"
    export NEXTAUTH_URL="${NEXTAUTH_URL:-http://$LISTEN_HOST:$PORT}"
    export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-$(openssl rand -base64 32)}"
    export USERS_JSON_PATH="${USERS_JSON_PATH:-$SCRIPT_DIR/lib/users.json}"

    # 创建日志目录
    mkdir -p "$LOGS_DIRECTORY"

    print_header
    print_configuration
    print_info "正在启动 AI-Sec-Web 应用..."
    echo ""

    # 启动应用
    exec $NODE_CMD server.js
}

main() {
    parse_arguments "$@"

    if [ "$SHOW_HELP" = true ]; then
        show_usage
        exit 0
    fi

    if [ "$SHOW_VERSION" = true ]; then
        show_version
        exit 0
    fi

    validate_configuration
    start_application
}

main "$@"
