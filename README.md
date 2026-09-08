# 简历投递系统

面向招聘方的简历投递收集工具:求职者在公开页面填写信息并上传简历,招聘方在后台查看、下载简历并更新处理状态。

## 快速开始

需要一个 PostgreSQL 数据库(本地开发可以用 `docker run -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres` 起一个)。

```bash
npm install
DATABASE_URL=postgres://user:pass@localhost:5432/resumedb \
ADMIN_USER=admin ADMIN_PASS=your-password \
npm start
```

默认监听 `http://localhost:3000`。

- 求职者投递页面:`/`
- 招聘方管理后台(需要 Basic Auth 登录):`/admin.html`

服务启动时会自动创建所需的数据表(`CREATE TABLE IF NOT EXISTS`),无需手动执行迁移。

## 环境变量

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `PORT` | 服务监听端口 | `3000` |
| `DATABASE_URL` | PostgreSQL 连接串,如 `postgres://user:pass@host:5432/dbname` | 必填 |
| `ADMIN_USER` | 后台登录用户名 | `admin` |
| `ADMIN_PASS` | 后台登录密码 | `changeme123` |
| `S3_BUCKET` | 简历文件存储桶名。**不设置时回退为本地磁盘存储**(仅适合本地开发/演示,不适合生产部署) | 无 |
| `S3_REGION` | 存储区域 | `auto` |
| `S3_ENDPOINT` | S3 兼容服务的接口地址(AWS S3 官方可不填;Cloudflare R2 / MinIO / 其他 S3 兼容服务需填写) | 无 |
| `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | 存储访问密钥 | 无 |

**部署到生产环境前请务必:**
1. 设置 `ADMIN_USER` / `ADMIN_PASS`,不要使用默认密码。
2. 配置 `S3_BUCKET` 等变量,否则简历文件会存在容器本地磁盘,大多数云平台(如 Render、Railway、Fly.io 的默认方案)重新部署或重启后磁盘内容会丢失。

常见免费/低成本可选项:
- 数据库:Render、Railway、Supabase 均提供免费 PostgreSQL 额度
- 对象存储:Cloudflare R2(免费额度较大且无出口流量费)、AWS S3、Supabase Storage 等任意 S3 兼容服务

## 部署

仓库内附带 `Dockerfile`,可直接用于 Render / Railway / Fly.io 等支持 Docker 部署的平台:

```bash
docker build -t resume-submission .
docker run -p 3000:3000 \
  -e DATABASE_URL=... -e S3_BUCKET=... -e S3_ACCESS_KEY_ID=... -e S3_SECRET_ACCESS_KEY=... \
  -e ADMIN_USER=admin -e ADMIN_PASS=your-password \
  resume-submission
```

## 简历文件限制

- 允许格式:PDF、DOC、DOCX
- 最大大小:5MB
