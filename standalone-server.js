#!/usr/bin/env node
const path = require('path');

const args = process.argv.slice(2);
let logDir = null;
let enableQuickLogin = false;
let port = 3000;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '-d' || args[i] === '--directory') {
    logDir = args[i + 1];
    if (!logDir) {
      console.error('Error: -d 参数需要指定目录路径');
      process.exit(1);
    }
  } else if (args[i] === '--debug') {
    enableQuickLogin = true;
  } else if (args[i] === '-p' || args[i] === '--port') {
    port = parseInt(args[i + 1]);
  }
}

const rootDir = process.cwd();

if (logDir) {
  process.env.LOGS_DIRECTORY = path.resolve(logDir);
  console.log(`📁 日志目录设置为: ${process.env.LOGS_DIRECTORY}`);
} else {
  process.env.LOGS_DIRECTORY = path.join(rootDir, 'logs');
  console.log(`📁 使用默认日志目录: ${process.env.LOGS_DIRECTORY}`);
}

if (enableQuickLogin) {
  process.env.ENABLE_QUICK_LOGIN = 'true';
  process.env.NEXT_PUBLIC_ENABLE_QUICK_LOGIN = 'true';
  console.log('🔑 已启用快捷免密登录功能');
} else {
  process.env.ENABLE_QUICK_LOGIN = 'false';
  process.env.NEXT_PUBLIC_ENABLE_QUICK_LOGIN = 'false';
}

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.LISTEN_HOST || '0.0.0.0';

const next = require('next');
const createServer = typeof next === 'function' ? next : next.createServer;

const app = createServer({
  dev,
  hostname,
  port,
  dir: rootDir
});

app.prepare().then(() => {
  app.listen(port, hostname, (err) => {
    if (err) {
      console.error(err);
      process.exit(1);
    }
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});