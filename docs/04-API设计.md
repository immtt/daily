# 04 — API 设计

Base URL: `/api`

所有需鉴权接口携带 Header: `Authorization: Bearer <token>`

## 1. 认证

### POST /auth/register

注册新用户（状态 pending）

**请求体**

```json
{
  "username": "zhangsan",
  "password": "secret123"
}
```

**响应 201**

```json
{
  "message": "注册成功，请等待管理员审核"
}
```

**错误**

| 状态码 | 说明 |
|--------|------|
| 409 | 用户名已存在 |
| 400 | 参数校验失败 |

---

### POST /auth/login

**请求体**

```json
{
  "username": "zhangsan",
  "password": "secret123"
}
```

**响应 200**

```json
{
  "token": "eyJhbG...",
  "user": {
    "id": "uuid",
    "username": "zhangsan",
    "role": "user"
  }
}
```

**错误**

| 状态码 | 说明 |
|--------|------|
| 401 | 用户名或密码错误 |
| 403 | 账号待审核 / 已拒绝 |

---

### GET /auth/me

获取当前登录用户

**响应 200**

```json
{
  "id": "uuid",
  "username": "zhangsan",
  "role": "user",
  "status": "active"
}
```

## 2. 日记

### GET /entries

列表查询（当前用户）

**Query 参数**

| 参数 | 类型 | 说明 |
|------|------|------|
| from | date | 起始日期 YYYY-MM-DD |
| to | date | 结束日期 YYYY-MM-DD |
| stockCode | string | 股票代码，匹配数组内任一项 |
| page | number | 页码，默认 1 |
| pageSize | number | 每页条数，默认 20 |

**响应 200**

```json
{
  "items": [
    {
      "id": "uuid",
      "title": "半导体板块强势",
      "entryDate": "2026-07-23",
      "stocks": [
        { "code": "600519", "name": "贵州茅台" },
        { "code": "688981", "name": "中芯国际" }
      ],
      "pnlDay": 1200,
      "pnlTotal": 8600,
      "mood": "calm",
      "createdAt": "2026-07-23T10:00:00Z",
      "updatedAt": "2026-07-23T10:00:00Z"
    }
  ],
  "total": 42,
  "page": 1,
  "pageSize": 20
}
```

---

### POST /entries

创建日记

**请求体**

```json
{
  "title": "半导体板块强势",
  "entryDate": "2026-07-23",
  "stocks": [
    { "code": "600519", "name": "贵州茅台" }
  ],
  "pnlDay": 1200,
  "pnlTotal": 8600,
  "mood": "calm",
  "content": { "type": "doc", "content": [] }
}
```

**响应 201**：完整 entry 对象

---

### GET /entries/:id

**响应 200**：完整 entry（含 content）

---

### PATCH /entries/:id

部分更新，字段同 POST

---

### DELETE /entries/:id

**响应 204**

## 3. 大盘指数

### GET /market/indices?date=2026-07-23

按复盘日期返回四大指数。服务端根据日期与当前时间决定取**盘中快照**或**收盘数据**。

**取数逻辑**

| 条件 | 行为 |
|------|------|
| `date` = 今天 且 当前时间 < 15:00（A 股收盘） | 返回实时盘中数据，`snapshotType: "intraday"` |
| `date` = 今天 且 已收盘 | 返回当日收盘，`snapshotType: "close"` |
| `date` = 历史日期 | 返回该日收盘，`snapshotType: "close"` |

**响应 200**

```json
{
  "date": "2026-07-23",
  "snapshotType": "intraday",
  "snapshotAt": "2026-07-23T14:35:00+08:00",
  "indices": [
    {
      "id": "sh000001",
      "name": "上证指数",
      "point": 3448.12,
      "changeAmt": 18.79,
      "changePct": 0.55
    }
  ],
  "breadth": {
    "rise": 2489,
    "fall": 2780
  },
  "turnover": 22094,
  "capitalInflow": -233.01
}
```

- 非交易日：返回最近一个交易日数据或空数组（实现时二选一，文档约定返回最近交易日并标注 `tradeDate`）
- 服务端代理第三方数据源，客户端不直连

## 4. 股票代码库

用于正文自动标签化与名称补全（**不是**手动选股下拉主流程）。

### GET /stocks/lookup?codes=600519,688981

批量解析代码 → 名称（保存日记时服务端校验/补全也可用）。

### GET /stocks/search?q=

可选：辅助调试或筛选页联想；录入主路径为正文自动识别。
## 5. 图片上传

### POST /uploads

`Content-Type: multipart/form-data`，字段名 `file`

**响应 201**

```json
{
  "url": "/uploads/{userId}/{uuid}.jpg"
}
```

**限制**

- 类型：image/jpeg, image/png, image/webp
- 大小：≤ 5MB

## 6. 管理员

### GET /admin/users

**Query**: `status=pending|active|rejected`（可选）

**响应 200**

```json
{
  "items": [
    {
      "id": "uuid",
      "username": "zhangsan",
      "status": "pending",
      "createdAt": "2026-07-23T10:00:00Z"
    }
  ]
}
```

---

### POST /admin/users/:id/approve

**响应 200** `{ "status": "active" }`

---

### POST /admin/users/:id/reject

**响应 200** `{ "status": "rejected" }`

## 7. 错误格式

```json
{
  "error": "错误描述",
  "code": "ERROR_CODE"
}
```

常见 code: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`
