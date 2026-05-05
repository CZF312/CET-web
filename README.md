# CET-4 英语四级学习平台 - 部署指南

## 项目简介

CET-4 英语四级学习平台是一款面向英语四级备考的 Web 应用，支持教师管理学生、学生单词打卡和四级刷题。

### 核心功能
- **教师端**：学生管理、数据看板、学习进度追踪
- **学生端**：单词打卡（63个核心词汇）、四级刷题（10套题，覆盖全部5种题型）
- **题型覆盖**：词汇语法、听力、阅读、写作、翻译

### 技术栈
- Next.js 16 + React + TypeScript
- Tailwind CSS
- Prisma ORM + SQLite
- Vercel 部署

---

## 快速开始

### 1. 本地运行

```bash
# 安装依赖
npm install

# 初始化数据库（仅首次）
npx prisma migrate dev --name init
npx prisma db seed

# 启动开发服务器
npm run dev
```

访问 http://localhost:3000

### 2. 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 教师 | admin | admin123 |

> 教师登录后可在"学生管理"页面为学生创建账号

---

## 部署到 Vercel（推荐，免费）

### 前提条件
- 注册 [Vercel 账号](https://vercel.com)（支持 GitHub 登录）
- 将项目代码推送到 GitHub 仓库

### 部署步骤

#### 方案一：通过 Vercel 网站（最简单）

1. 访问 [vercel.com](https://vercel.com) 并登录
2. 点击 "Add New Project"
3. 导入你的 GitHub 仓库
4. Vercel 会自动检测 Next.js 项目
5. 点击 "Deploy" 等待部署完成
6. 部署成功后会获得一个网址（如 `xxx.vercel.app`）

#### 方案二：通过 Vercel CLI

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
cd cet4-learning
vercel
```

### 重要配置

由于本项目使用 SQLite 数据库，Vercel 的无服务器环境不支持持久化文件存储。需要使用外部数据库：

#### 推荐方案：使用 Turso（免费 SQLite 云数据库）

1. 注册 [Turso](https://turso.tech)
2. 创建数据库：`turso db create cet4-learning`
3. 获取连接 URL：`turso db show cet4-learning --url`
4. 创建认证 token：`turso db tokens create cet4-learning`
5. 在 Vercel 项目设置中添加环境变量：
   - `DATABASE_URL` = 你的 Turso 数据库 URL
   - `JWT_SECRET` = 自定义密钥（任意随机字符串）

#### 修改数据库配置

将 `prisma/schema.prisma` 中的 datasource 改为：

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

然后在 Vercel 中重新部署。

---

## 项目结构

```
cet4-learning/
├── prisma/
│   ├── schema.prisma          # 数据库模型定义
│   ├── seed.ts                # 种子数据（词汇+题目）
│   └── dev.db                 # SQLite 数据库文件
├── src/
│   ├── app/
│   │   ├── page.tsx           # 首页
│   │   ├── login/page.tsx     # 登录页
│   │   ├── teacher/           # 教师端页面
│   │   │   ├── page.tsx       # 教师工作台
│   │   │   ├── students/      # 学生管理
│   │   │   └── dashboard/     # 数据看板
│   │   ├── student/           # 学生端页面
│   │   │   ├── page.tsx       # 学生首页
│   │   │   ├── words/         # 单词打卡
│   │   │   └── quizzes/       # 四级刷题
│   │   └── api/               # API 接口
│   │       ├── auth/          # 认证相关
│   │       ├── students/      # 学生管理
│   │       ├── words/         # 单词学习
│   │       ├── quizzes/       # 刷题系统
│   │       └── dashboard/     # 数据看板
│   ├── components/            # 共享组件
│   │   ├── Navbar.tsx         # 导航栏
│   │   ├── AuthForm.tsx       # 登录表单
│   │   ├── ProtectedRoute.tsx # 路由守卫
│   │   └── LoadingSpinner.tsx # 加载动画
│   └── lib/
│       ├── prisma.ts          # 数据库连接
│       └── auth.ts            # JWT 认证
└── package.json
```

---

## 使用说明

### 教师操作流程
1. 使用 admin/admin123 登录
2. 在"学生管理"中添加学生（设置用户名、密码、姓名）
3. 将账号信息告知学生
4. 在"数据看板"查看学生的学习进度

### 学生操作流程
1. 使用教师分配的账号登录
2. 在"单词打卡"中学习每日单词（认识/模糊/不认识）
3. 在"四级刷题"中选择题型进行练习
4. 查看答题结果和正确答案

---

## 自定义扩展

### 添加更多词汇
编辑 `prisma/seed.ts` 中的 `words` 数组，然后运行：
```bash
npx prisma db seed
```

### 添加更多题目
编辑 `prisma/seed.ts` 中的 `quizzes` 数组，题目格式：
```json
{
  "questions": [
    {
      "id": 1,
      "question": "题目内容",
      "options": ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
      "answer": "A"
    }
  ]
}
```

### 修改教师密码
在数据库中直接修改，或重新运行 seed 脚本。
