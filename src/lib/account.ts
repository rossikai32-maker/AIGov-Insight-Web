#!/usr/bin/env node

import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import { select, input, password, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import ora from 'ora';

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

const getUsersFile = () => process.env.USERS_JSON_PATH || path.join(process.cwd(), 'src/lib/users.json');

const readUsers = (): User[] => {
  try {
    if (!fs.existsSync(getUsersFile())) return [];
    return JSON.parse(fs.readFileSync(getUsersFile(), 'utf8')).users || [];
  } catch { return []; }
};

const saveUsers = (users: User[]) => fs.writeFileSync(getUsersFile(), JSON.stringify({ users }, null, 2));

const nextId = (users: User[]) => String(Math.max(0, ...users.map(u => +u.id || 0)) + 1);

const hashPwd = (pwd: string) => bcrypt.hash(pwd, 10);

const logo = () => {
  console.log();
  console.log(chalk.cyan('  ╭─────────────────────────────────────────────────────╮'));
  console.log(chalk.cyan('  │') + chalk.white.bold('          AI-SEC 账户管理中心                        ') + chalk.cyan('│'));
  console.log(chalk.cyan('  │') + chalk.gray('          Account Management Center                  ') + chalk.cyan('│'));
  console.log(chalk.cyan('  ╰─────────────────────────────────────────────────────╯'));
  console.log();
};

const printUsers = (users: User[]) => {
  if (!users.length) {
    console.log(chalk.yellow('  暂无账户数据\n'));
    return;
  }
  console.log(chalk.white.bold('  账户列表 ') + chalk.gray(`(${users.length} 个账户)\n`));
  console.log(chalk.gray('  ┌──────┬────────────────────┬─────────────────────────────┐'));
  console.log(chalk.gray('  │ ') + chalk.bold('ID   ') + chalk.gray('│ ') + chalk.bold('用户名            ') + chalk.gray('│ ') + chalk.bold('邮箱                        ') + chalk.gray('│'));
  console.log(chalk.gray('  ├──────┼────────────────────┼─────────────────────────────┤'));
  users.forEach(u => {
    console.log(chalk.gray('  │ ') + chalk.green(u.id.padEnd(4)) + chalk.gray(' │ ') + chalk.cyan(u.name.padEnd(16)) + chalk.gray(' │ ') + chalk.white(u.email.padEnd(25)) + chalk.gray(' │'));
  });
  console.log(chalk.gray('  └──────┴────────────────────┴─────────────────────────────┘\n'));
};

const actionList = () => {
  console.log(chalk.cyan.bold('\n  账户列表\n'));
  printUsers(readUsers());
};

const actionAdd = async () => {
  console.log(chalk.cyan.bold('\n  创建新账户\n'));
  
  const name = await input({ message: '用户名:', validate: (v) => v.trim() ? true : '请输入用户名' });
  const pwd = await password({ message: '密码:', mask: '●', validate: (v) => v.length >= 4 ? true : '密码至少4位' });
  const pwd2 = await password({ message: '确认密码:', mask: '●' });
  
  if (pwd !== pwd2) {
    console.log(chalk.red('\n  两次密码不一致\n'));
    return;
  }
  
  const email = await input({ message: '邮箱:', default: `${name}@example.com` });

  const users = readUsers();
  if (users.some(u => u.name === name)) {
    console.log(chalk.red('\n  用户名已存在\n'));
    return;
  }

  const spinner = ora({ text: '创建中...', spinner: 'dots' }).start();
  const user: User = { id: nextId(users), name, email, password: await hashPwd(pwd) };
  saveUsers([...users, user]);
  spinner.succeed(chalk.green('创建成功'));
  
  console.log();
  console.log(chalk.gray('  ┌────────────────────────────────────────┐'));
  console.log(chalk.gray('  │') + chalk.white.bold('  账户信息                               ') + chalk.gray('│'));
  console.log(chalk.gray('  ├────────────────────────────────────────┤'));
  console.log(chalk.gray('  │') + '  用户名: ' + chalk.cyan(user.name.padEnd(28)) + chalk.gray('│'));
  console.log(chalk.gray('  │') + '  邮箱:   ' + chalk.blue(user.email.padEnd(28)) + chalk.gray('│'));
  console.log(chalk.gray('  │') + '  ID:     ' + chalk.green(user.id.padEnd(28)) + chalk.gray('│'));
  console.log(chalk.gray('  └────────────────────────────────────────┘\n'));
};

const actionPwd = async () => {
  const users = readUsers();
  if (!users.length) {
    console.log(chalk.yellow('\n  暂无账户，请先创建\n'));
    return;
  }

  console.log(chalk.cyan.bold('\n  修改密码\n'));
  
  const name = await select({
    message: '选择账户:',
    choices: users.map(u => ({ name: `${u.name} (${u.email})`, value: u.name }))
  });

  const pwd = await password({ message: '新密码:', mask: '●', validate: (v) => v.length >= 4 ? true : '密码至少4位' });
  const pwd2 = await password({ message: '确认密码:', mask: '●' });

  if (pwd !== pwd2) {
    console.log(chalk.red('\n  两次密码不一致\n'));
    return;
  }

  const spinner = ora({ text: '更新中...', spinner: 'dots' }).start();
  const user = users.find(u => u.name === name);
  if (user) { user.password = await hashPwd(pwd); saveUsers(users); }
  spinner.succeed(chalk.green('密码已更新\n'));
};

const actionDelete = async () => {
  const users = readUsers();
  if (!users.length) {
    console.log(chalk.yellow('\n  暂无账户\n'));
    return;
  }

  console.log(chalk.cyan.bold('\n  删除账户\n'));
  
  const name = await select({
    message: '选择账户:',
    choices: users.map(u => ({ name: `${u.name} (${u.email})`, value: u.name }))
  });

  const confirmed = await confirm({ message: '确认删除?', default: false });
  if (!confirmed) { console.log(chalk.yellow('\n  已取消\n')); return; }

  const spinner = ora({ text: '删除中...', spinner: 'dots' }).start();
  saveUsers(users.filter(u => u.name !== name));
  spinner.succeed(chalk.green(`已删除 "${name}"\n`));
};

const actionQuickAdd = async () => {
  console.log(chalk.cyan.bold('\n  快速创建\n'));
  
  const name = await input({ message: '用户名:', validate: (v) => v.trim() ? true : '请输入用户名' });
  const pwd = await input({ message: '密码:', validate: (v) => v ? true : '请输入密码' });

  const users = readUsers();
  if (users.some(u => u.name === name)) {
    console.log(chalk.red('\n  用户名已存在\n'));
    return;
  }

  const spinner = ora({ text: '创建中...', spinner: 'dots' }).start();
  const user: User = { id: nextId(users), name, email: `${name}@example.com`, password: await hashPwd(pwd) };
  saveUsers([...users, user]);
  spinner.succeed(chalk.green(`账户 "${name}" 创建成功\n`));
};

const mainMenu = async () => {
  logo();
  
  while (true) {
    const action = await select({
      message: '请选择操作',
      choices: [
        { name: '查看账户列表', value: 'list' },
        { name: '创建新账户', value: 'add' },
        { name: '快速创建 (仅需用户名密码)', value: 'quick' },
        { name: '修改密码', value: 'pwd' },
        { name: '删除账户', value: 'delete' },
        { name: '退出', value: 'exit' }
      ]
    });

    switch (action) {
      case 'list': await actionList(); break;
      case 'add': await actionAdd(); break;
      case 'quick': await actionQuickAdd(); break;
      case 'pwd': await actionPwd(); break;
      case 'delete': await actionDelete(); break;
      case 'exit':
        console.log(chalk.cyan('\n  再见!\n'));
        process.exit(0);
    }
  }
};

const directCmd = async (cmd: string, args: string[]) => {
  const users = readUsers();
  
  switch (cmd) {
    case 'ls': case 'list':
      logo();
      printUsers(users);
      break;
      
    case 'add': case 'create':
      if (args.length >= 2) {
        if (users.some(u => u.name === args[0])) { console.log(chalk.red('\n  用户名已存在\n')); break; }
        const spinner = ora({ text: '创建中...', spinner: 'dots' }).start();
        const user: User = { id: nextId(users), name: args[0], email: args[2] || `${args[0]}@example.com`, password: await hashPwd(args[1]) };
        saveUsers([...users, user]);
        spinner.succeed(chalk.green(`账户 "${args[0]}" 创建成功\n`));
      } else {
        await actionAdd();
      }
      break;
      
    case 'pwd': case 'passwd':
      if (args.length >= 2) {
        const user = users.find(u => u.name === args[0]);
        if (!user) { console.log(chalk.red('\n  用户不存在\n')); break; }
        const spinner = ora({ text: '更新中...', spinner: 'dots' }).start();
        user.password = await hashPwd(args[1]);
        saveUsers(users);
        spinner.succeed(chalk.green('密码已更新\n'));
      } else {
        await actionPwd();
      }
      break;
      
    case 'rm': case 'delete':
      if (args[0]) {
        if (!users.some(u => u.name === args[0])) { console.log(chalk.red('\n  用户不存在\n')); break; }
        const spinner = ora({ text: '删除中...', spinner: 'dots' }).start();
        saveUsers(users.filter(u => u.name !== args[0]));
        spinner.succeed(chalk.green(`已删除 "${args[0]}"\n`));
      } else {
        await actionDelete();
      }
      break;
      
    default:
      await mainMenu();
  }
};

const main = async () => {
  const args = process.argv.slice(2);
  if (args[0] && !args[0].startsWith('-')) {
    await directCmd(args[0], args.slice(1));
  } else {
    await mainMenu();
  }
};

main().catch(e => { console.error(chalk.red('\n错误:'), e.message); process.exit(1); });
