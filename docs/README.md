# 股票复盘日记本 — 设计文档与原型

本目录包含开发前的**产品文档**与**可交互原型**，供评审确认后再进入编码阶段。

## 文档索引

| 文档 | 说明 |
|------|------|
| [01-需求说明.md](./01-需求说明.md) | 功能需求、用户角色、业务规则 |
| [02-产品原型说明.md](./02-产品原型说明.md) | 页面清单、交互说明、信息架构 |
| [03-技术架构.md](./03-技术架构.md) | 技术栈、系统架构、目录结构 |
| [04-API设计.md](./04-API设计.md) | REST API 接口定义 |
| [05-数据库设计.md](./05-数据库设计.md) | 数据表结构与索引 |
| [06-部署指南.md](./06-部署指南.md) | 腾讯云轻量服务器部署步骤 |

## 原型预览（高保真 · 手机优先）

在浏览器打开 [`prototype/index.html`](./prototype/index.html)。  
**请优先用手机或 Chrome 设备模式**预览；窄屏会自动全宽铺满。

| 原型页面 | 路径 | 说明 |
|----------|------|------|
| 日记列表（主） | [mobile-diary-list.html](./prototype/mobile-diary-list.html) | 手机主界面：Tab、筛选抽屉、PWA |
| 新建/编辑 | [diary-edit.html](./prototype/diary-edit.html) | 标题加粗 + 结构化 + 富文本 |
| 日记详情 | [diary-detail.html](./prototype/diary-detail.html) | 只读 + 编辑删除 |
| 登录 / 注册 | [login.html](./prototype/login.html) / [register.html](./prototype/register.html) | 品牌首屏 |
| 管理员审核 | [admin.html](./prototype/admin.html) | 通过/拒绝注册 |
| 桌面宽屏 | [diary-list-desktop.html](./prototype/diary-list-desktop.html) | 侧栏筛选自适应 |

## 默认管理员账号（部署后使用）

| 字段 | 值 |
|------|-----|
| 用户名 | `admin` |
| 初始密码 | `ChangeMe_Admin_2026` |

> 首次登录后请立即修改密码。管理员用于审核新用户注册申请。

## 下一步

确认文档与原型无误后，按以下顺序开发：

1. 脚手架与 Docker 环境
2. 登录注册 + 管理员审核
3. 日记 CRUD + 查询
4. 富文本编辑器与图片上传
5. PWA 与移动端适配
6. 腾讯云部署
