import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';

// 扩展 NextAuth 的 session 用户类型
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
    };
  }
  
  interface User {
    id: string;
    name: string;
    email: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    name: string;
    email: string;
  }
}

interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

const getUsersFilePath = (): string => {
  const customPath = process.env.USERS_JSON_PATH;
  if (customPath) {
    return customPath;
  }

  const possiblePaths = [
    path.join(process.cwd(), 'src/lib/users.json'),
    path.join(process.cwd(), 'lib/users.json'),
    path.join(__dirname, 'users.json'),
  ];

  for (const possiblePath of possiblePaths) {
    if (fs.existsSync(possiblePath)) {
      return possiblePath;
    }
  }

  return possiblePaths[0];
};

const usersFilePath = getUsersFilePath();

const readUsers = (): { users: User[] } => {
  const data = fs.readFileSync(usersFilePath, 'utf8');
  return JSON.parse(data);
};

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: {
          label: 'Username',
          type: 'text',
          placeholder: 'admin',
        },
        password: {
          label: 'Password',
          type: 'password',
          placeholder: 'password',
        },
      },
      async authorize(credentials) {
        if (!credentials?.username) {
          return null;
        }

        const { users } = readUsers();
        const user = users.find((user) => user.name === credentials.username);

        if (!user) {
          return null;
        }

        // 免密登录逻辑 - 仅当启用了快捷登录且密码为特定值时允许
        const isQuickLoginEnabled = process.env.ENABLE_QUICK_LOGIN === 'true';
        const isQuickLoginAttempt = credentials.password === 'quick-login';
        
        if (isQuickLoginEnabled && isQuickLoginAttempt) {
          return {
            id: user.id,
            name: user.name,
            email: user.email,
          };
        }

        // 正常密码验证
        const passwordMatch = await bcrypt.compare(credentials.password, user.password);

        if (!passwordMatch) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET || 'your-secret-key-change-in-production',
  session: {
    strategy: 'jwt',
    maxAge: 10, // 1min
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
};