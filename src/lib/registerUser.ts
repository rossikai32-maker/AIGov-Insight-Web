#!/usr/bin/env node

import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

const usersFilePath = path.join(process.cwd(), 'src/lib/users.json');

const readUsers = (): { users: User[] } => {
  if (!fs.existsSync(usersFilePath)) {
    return { users: [] };
  }
  const data = fs.readFileSync(usersFilePath, 'utf8');
  return JSON.parse(data);
};

const writeUsers = (users: User[]) => {
  fs.writeFileSync(usersFilePath, JSON.stringify({ users }, null, 2));
};

const generateUserId = (users: User[]): string => {
  const maxId = users.reduce((max, user) => Math.max(max, parseInt(user.id) || 0), 0);
  return (maxId + 1).toString();
};

const registerUser = async (username: string, password: string, email: string = `${username}@example.com`) => {
  const { users } = readUsers();

  // 检查用户名是否已存在
  if (users.some(user => user.name === username)) {
    console.error('❌ 用户名已存在');
    process.exit(1);
  }

  // 生成 bcrypt 哈希密码
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // 创建新用户
  const newUser: User = {
    id: generateUserId(users),
    name: username,
    email: email,
    password: hashedPassword
  };

  // 添加到用户列表
  const updatedUsers = [...users, newUser];
  writeUsers(updatedUsers);

  console.log('✅ 用户注册成功！');
  console.log('\n用户信息：');
  console.log(`  用户名：${username}`);
  console.log(`  邮箱：${email}`);
  console.log(`  密码：${password}（已加密存储）`);
  console.log('\n可以使用以上信息登录系统。');
};

const main = async () => {
  const args = process.argv.slice(2);

  if (args.length === 2) {
    // 通过命令行参数获取用户名和密码
    const [username, password] = args;
    await registerUser(username, password);
  } else if (args.length === 3) {
    // 通过命令行参数获取用户名、密码和邮箱
    const [username, password, email] = args;
    await registerUser(username, password, email);
  } else {
    // 交互式输入
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('🚀 AI-SEC 系统用户注册工具');
    console.log('---------------------------\n');

    rl.question('请输入用户名： ', (username) => {
      rl.question('请输入密码： ', (password) => {
        rl.question('请输入邮箱（可选，默认：username@example.com）： ', (email) => {
          rl.close();
          registerUser(username, password, email || `${username}@example.com`);
        });
      });
    });
  }
};

main().catch(err => {
  console.error('❌ 注册失败：', err.message);
  process.exit(1);
});