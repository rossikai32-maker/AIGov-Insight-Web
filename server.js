#!/usr/bin/env node
const { spawn } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
let logDir = null;
let enableQuickLogin = false;
let command = 'dev'; // 默认使用dev命令

// 解析命令行参数
for (let i = 0; i < args.length; i++) {
  if (args[i] === '-d' || args[i] === '--directory') {
    logDir = args[i + 1];
    if (!logDir) {
      console.error('Error: -d 参数需要指定目录路径');
      process.exit(1);
    }
  } else if (args[i] === '--debug') {
    enableQuickLogin = true;
  } else if (args[i] === 'start') {
    // 支持直接传入start命令，用于生产环境启动
    command = 'start';
  }
}

// 设置日志目录环境变量
if (logDir) {
  process.env.LOGS_DIRECTORY = path.resolve(logDir);
  console.log(`📁 日志目录设置为: ${process.env.LOGS_DIRECTORY}`);
} else {
  process.env.LOGS_DIRECTORY = path.join(process.cwd(), 'logs');
  console.log(`📁 使用默认日志目录: ${process.env.LOGS_DIRECTORY}`);
}

// 设置快捷登录环境变量
if (enableQuickLogin) {
  process.env.ENABLE_QUICK_LOGIN = 'true';
  process.env.NEXT_PUBLIC_ENABLE_QUICK_LOGIN = 'true';
  console.log('🔑 已启用快捷免密登录功能');
} else {
  process.env.ENABLE_QUICK_LOGIN = 'false';
  process.env.NEXT_PUBLIC_ENABLE_QUICK_LOGIN = 'false';
}

// 启动Next.js
const nextBinary = path.join(process.cwd(), 'node_modules', '.bin', 'next');
const nextProcess = spawn(nextBinary, [command], {
  stdio: 'inherit',
  cwd: process.cwd()
});

nextProcess.on('error', (error) => {
  console.error('Failed to start Next.js:', error);
  process.exit(1);
});
