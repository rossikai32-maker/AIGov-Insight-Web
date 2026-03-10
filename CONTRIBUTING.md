# 贡献指南 / Contributing Guide

感谢您有兴趣为 AIGov-Insight Web 做出贡献！

Thank you for your interest in contributing to AIGov-Insight Web!

## 🌍 目录 / Table of Contents

- [行为准则 / Code of Conduct](#行为准则--code-of-conduct)
- [如何贡献 / How to Contribute](#如何贡献--how-to-contribute)
- [开发环境设置 / Development Setup](#开发环境设置--development-setup)
- [提交规范 / Commit Guidelines](#提交规范--commit-guidelines)
- [代码风格 / Code Style](#代码风格--code-style)
- [Pull Request 流程 / Pull Request Process](#pull-request-流程--pull-request-process)

---

## 行为准则 / Code of Conduct

本项目采用贡献者公约作为行为准则。参与此项目即表示您同意遵守其条款。请阅读 [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) 了解详情。

---

## 如何贡献 / How to Contribute

### 报告 Bug / Reporting Bugs

如果您发现了 bug，请通过 [GitHub Issues](https://github.com/eversec/AIGov-Insight-web/issues) 提交报告。提交前请：

1. 搜索现有 issues，确认该问题尚未被报告
2. 使用 Bug 报告模板填写详细信息
3. 提供复现步骤、预期行为和实际行为

### 建议新功能 / Suggesting Features

我们欢迎新功能建议！请：

1. 通过 Issues 提交功能请求
2. 详细描述功能及其使用场景
3. 说明该功能如何使项目受益

### 提交代码 / Submitting Code

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat: add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

## 开发环境设置 / Development Setup

### 前置要求 / Prerequisites

- Node.js 20+
- npm 或 yarn
- Git

### 安装步骤 / Installation Steps

```bash
# 克隆仓库
git clone https://github.com/eversec/AIGov-Insight-web.git
cd AIGov-Insight-web

# 安装依赖
npm install --legacy-peer-deps

# 启动开发服务器
npm run dev
```

### 项目结构 / Project Structure

```
src/
├── app/              # Next.js App Router 页面和 API
├── components/       # React 组件
├── lib/              # 工具函数和业务逻辑
├── hooks/            # 自定义 React Hooks
├── context/          # React Context 状态管理
└── types/            # TypeScript 类型定义
```

### 可用脚本 / Available Scripts

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm run start` | 启动生产服务器 |
| `npm run lint` | 运行 ESLint 检查 |

---

## 提交规范 / Commit Guidelines

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

### 提交消息格式 / Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### 类型 / Types

| 类型 | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 代码格式（不影响功能） |
| `refactor` | 代码重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具相关 |

### 示例 / Examples

```bash
feat(timeline): add zoom functionality to timeline view
fix(auth): resolve session timeout issue
docs(readme): update installation instructions
style(dashboard): improve responsive layout
```

---

## 代码风格 / Code Style

### TypeScript

- 使用 TypeScript 编写所有新代码
- 为函数和组件添加类型注解
- 避免使用 `any` 类型

### React

- 使用函数组件和 Hooks
- 组件命名使用 PascalCase
- 文件命名使用 PascalCase（组件）或 camelCase（工具函数）

### CSS

- 使用 Tailwind CSS 工具类
- 遵循移动优先的响应式设计原则

### 代码格式化

项目使用 ESLint 进行代码检查。提交前请确保：

```bash
npm run lint
```

---

## Pull Request 流程 / Pull Request Process

1. **确保通过所有检查**
   - 代码通过 ESLint 检查
   - 构建成功
   - 所有测试通过

2. **更新文档**
   - 如有必要，更新 README.md
   - 更新 CHANGELOG.md（如适用）

3. **PR 描述模板**
   - 清晰描述更改内容
   - 关联相关 Issue
   - 添加截图（如适用）

4. **代码审查**
   - 等待维护者审查
   - 及时响应审查意见
   - 保持讨论专业和友好

### PR 检查清单 / PR Checklist

- [ ] 代码遵循项目的代码风格
- [ ] 已进行自我审查
- [ ] 代码已添加注释，特别是难以理解的部分
- [ ] 文档已更新
- [ ] 没有引入新的警告
- [ ] 测试已通过

---

## 获取帮助 / Getting Help

如果您有任何问题，可以：

- 在 [Discussions](https://github.com/eversec/AIGov-Insight-web/discussions) 中提问
- 查看 [Wiki](https://github.com/eversec/AIGov-Insight-web/wiki)（如有）

---

再次感谢您的贡献！🎉

Thank you again for your contribution!🎉
