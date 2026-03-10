import bcrypt from 'bcrypt';

// 生成 bcrypt 哈希密码的函数
async function generatePasswordHash(password: string): Promise<string> {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  return hash;
}

// 如果直接运行这个脚本，生成示例密码的哈希
if (require.main === module) {
  const password = process.argv[2] || 'password';
  generatePasswordHash(password)
    .then(hash => {
      console.log(`Password: ${password}`);
      console.log(`Hash: ${hash}`);
      console.log('\n将上述 Hash 值复制到 users.json 文件中的 password 字段即可');
    })
    .catch(err => {
      console.error('生成密码哈希时出错:', err);
    });
}

export default generatePasswordHash;