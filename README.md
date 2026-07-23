# 股票复盘日记本

多端同步的股票复盘日记：结构化字段 + 富文本插图，按日期/股票代码查询，PWA 支持鸿蒙手机。

## 当前阶段：设计评审

开发尚未开始。请先查看设计文档与交互原型：

- **文档目录**：[`docs/README.md`](docs/README.md)
- **原型预览**：在浏览器打开 [`docs/prototype/index.html`](docs/prototype/index.html)

## 默认管理员账号

| 字段 | 值 |
|------|-----|
| 用户名 | `admin` |
| 初始密码 | `ChangeMe_Admin_2026` |

用于审核新用户注册，部署后请立即修改密码。

## 文档清单

| 文档 | 内容 |
|------|------|
| [需求说明](docs/01-需求说明.md) | 功能需求、角色、验收标准 |
| [产品原型说明](docs/02-产品原型说明.md) | 页面清单、交互、视觉规范 |
| [技术架构](docs/03-技术架构.md) | 技术栈、系统架构 |
| [API 设计](docs/04-API设计.md) | REST 接口 |
| [数据库设计](docs/05-数据库设计.md) | 表结构 |
| [部署指南](docs/06-部署指南.md) | 腾讯云轻量部署 |

## 原型页面（高保真 · 手机优先）

请用**手机浏览器**或 Chrome 设备模式打开；主场景是手机端。

| 页面 | 文件 |
|------|------|
| 导航入口 | [docs/prototype/index.html](docs/prototype/index.html) |
| 日记列表（主） | [docs/prototype/mobile-diary-list.html](docs/prototype/mobile-diary-list.html) |
| 新建/编辑 | [docs/prototype/diary-edit.html](docs/prototype/diary-edit.html) |
| 详情 | [docs/prototype/diary-detail.html](docs/prototype/diary-detail.html) |
| 登录 / 注册 | [login](docs/prototype/login.html) / [register](docs/prototype/register.html) |
| 管理员审核 | [docs/prototype/admin.html](docs/prototype/admin.html) |
| 桌面宽屏 | [docs/prototype/diary-list-desktop.html](docs/prototype/diary-list-desktop.html) |

确认设计无误后，回复「开始开发」即可进入编码阶段。
