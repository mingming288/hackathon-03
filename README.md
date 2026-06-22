# Poster Director Agent

AI 驱动的中文报纸风格海报生成器。输入项目 PRD + 0-3 张照片 + 6 种风格之一，自动生成一张中文报纸头版图片。

## 功能特性

- 🎨 **6 种报纸风格**：经典日报、未来赛博、娱乐头条、3D人物、漫画分镜、魔法学院
- 📝 **智能文案生成**：基于 DeepSeek 自动生成新闻风格文案
- 🖼️ **AI 生图**：使用 gpt-image-2 生成高质量报纸海报
- 📱 **双模式支持**：选手模式（基于PRD）和观众模式（基于现场体验）
- 💾 **云端存储**：Supabase 数据库 + Storage 持久化

## 技术栈

- **前端**：React 19 + TypeScript + Vite
- **后端**：Python FastAPI + Supabase
- **AI 服务**：DeepSeek（文本）+ llmgateway（图像）
- **部署**：Render / Vercel

## 快速开始

### 前置条件

- Node.js 18+
- Python 3.10+
- Supabase 项目（免费套餐即可）

### 1. 克隆项目

```bash
git clone <repository-url>
cd 抖音黑客松
```

### 2. 配置环境变量

**后端配置**（`server/.env`）：

```bash
# 复制示例文件
cp .env.example server/.env

# 编辑 server/.env，填写以下变量：
# - DEEPSEEK_API_KEY: DeepSeek API 密钥
# - IMAGE_API_KEY: 图像生成 API 密钥
# - SUPABASE_URL: Supabase 项目 URL
# - SUPABASE_SERVICE_KEY: Supabase service_role 密钥
# - SUPABASE_ANON_KEY: Supabase anon 密钥
```

### 3. 配置 Supabase

1. 访问 [supabase.com](https://supabase.com) 创建项目
2. 在 SQL Editor 执行 `server/supabase/migrations/0001_posters_table.sql`
3. 将项目 URL 和 API Keys 填入 `server/.env`

### 4. 启动开发服务器

**启动后端**：
```bash
cd server
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8766
```

**启动前端**：
```bash
npm install
npm run dev
```

访问 http://localhost:5173

### 5. 验证安装

```bash
# 检查后端健康状态
curl http://localhost:8766/api/health

# 检查 Supabase 连接
cd server
python scripts/check_supabase.py
```

## 项目结构

```
抖音黑客松/
├── src/                    # 前端 React 代码
│   ├── api/               # API 客户端
│   ├── components/        # React 组件
│   └── routes/            # 页面路由
├── server/                 # 后端 Python 代码
│   ├── app/               # FastAPI 应用
│   │   ├── main.py        # 入口点
│   │   ├── orchestrator.py # 工作流编排
│   │   ├── steps/         # 6步骤实现
│   │   └── styles/        # 6种风格定义
│   ├── prompts/           # 提示词模板
│   └── supabase/          # 数据库迁移
├── package.json            # 前端依赖
└── render.yaml             # 部署配置
```

## 工作流程

```
用户输入 (PRD + 图片 + 风格)
    ↓
Step1: 解析 PRD → ProjectBrief
    ↓
Step2: 生成文案 → PosterCopy
    ↓
Step2.5: 文案校验
    ↓
Step3: 组装提示词 → ImagePlan
    ↓
Step4: 生成图片 → ImageResult
    ↓
Step5: 校验图片
    ↓
Step5.5: 后处理 (二维码贴图)
    ↓
Step6: 持久化到 Supabase
    ↓
返回海报 URL
```

## API 接口

### POST /api/generate-poster

生成海报（multipart/form-data）

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| prd | text | 是 | 项目描述 |
| style | text | 是 | 风格：daily/cyber/entertainment/character3d/comic/magic |
| images | file[] | 否 | 0-3 张照片 |
| mode | text | 否 | participant(默认) / audience |

### GET /api/styles

获取所有风格列表

### GET /api/posters

获取历史海报列表

## 部署

### Render（推荐）

项目已配置 `render.yaml`，直接导入 GitHub 仓库即可：

1. Fork 本项目到你的 GitHub
2. 在 Render 创建新 Static Site
3. 选择 Fork 的仓库
4. 配置环境变量（参考 `server/.env.example`）
5. 部署

### Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 部署
vercel
```

注意：Vercel 有 60 秒超时限制，图像生成可能超时。

## 常见问题

### Q: 图像生成失败？

A: 检查 `IMAGE_API_KEY` 是否正确配置，以及 llmgateway 服务是否可用。

### Q: 数据库连接失败？

A: 运行 `python scripts/check_supabase.py` 检查 Supabase 配置。

### Q: 如何添加新的报纸风格？

A: 编辑 `server/app/styles/definitions.py`，参考现有风格定义添加新风格。

## 许可证

MIT License
