# 简历投递系统

面向招聘方的简历投递收集工具:求职者在公开页面填写信息并上传简历,招聘方在后台查看、下载简历并更新处理状态。

## 快速开始

```bash
npm install
ADMIN_USER=admin ADMIN_PASS=your-password npm start
```

默认监听 `http://localhost:3000`。

- 求职者投递页面:`/`
- 招聘方管理后台(需要 Basic Auth 登录):`/admin.html`

## 环境变量

| 变量 | 说明 | 默认值 |
| --- | --- | --- |
| `PORT` | 服务监听端口 | `3000` |
| `ADMIN_USER` | 后台登录用户名 | `admin` |
| `ADMIN_PASS` | 后台登录密码 | `changeme123` |

**部署到生产环境前请务必设置 `ADMIN_USER` / `ADMIN_PASS`,不要使用默认密码。**

## 数据存储

- 简历文件保存在 `uploads/` 目录(文件名已随机化,原始文件名单独记录)。
- 投递记录保存在 `data/submissions.json`。

这两个目录/文件都已加入 `.gitignore`,不会被提交到仓库。生产环境建议定期备份这两部分数据。

## 简历文件限制

- 允许格式:PDF、DOC、DOCX
- 最大大小:5MB
