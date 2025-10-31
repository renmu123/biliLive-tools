# User API

用户管理相关接口文档,用于管理 B 站账号信息。

## 获取用户列表

获取所有已添加的 B 站账号列表。

**接口地址:** `GET /user/list`

**请求参数:** 无

**响应示例:**

```json
[
  {
    "uid": 123456789,
    "name": "用户昵称",
    "face": "https://i0.hdslb.com/bfs/face/xxx.jpg",
    "expires": 1730419200
  }
]
```

**响应字段:**

| 字段名  | 类型   | 说明                            |
| ------- | ------ | ------------------------------- |
| uid     | number | 用户 UID                        |
| name    | string | 用户昵称                        |
| face    | string | 用户头像 URL                    |
| expires | number | Cookie 过期时间(Unix 时间戳,秒) |

## 删除用户

删除指定的 B 站账号。

**接口地址:** `POST /user/delete`

**请求参数:**

| 参数名 | 类型   | 必填 | 说明     |
| ------ | ------ | ---- | -------- |
| uid    | number | 是   | 用户 UID |

**请求示例:**

```json
{
  "uid": 123456789
}
```

**响应:** HTTP 200 表示删除成功

## 更新用户信息

更新指定用户的基本信息(昵称、头像等)。

**接口地址:** `POST /user/update`

**请求参数:**

| 参数名 | 类型   | 必填 | 说明     |
| ------ | ------ | ---- | -------- |
| uid    | number | 是   | 用户 UID |

**请求示例:**

```json
{
  "uid": 123456789
}
```

**响应:** HTTP 200 表示更新成功

## 更新用户授权

刷新指定用户的授权信息。

**接口地址:** `POST /user/update_auth`

**请求参数:**

| 参数名 | 类型   | 必填 | 说明     |
| ------ | ------ | ---- | -------- |
| uid    | number | 是   | 用户 UID |

**请求示例:**

```json
{
  "uid": 123456789
}
```

**响应:** HTTP 200 表示更新成功

<!-- ## 获取用户 Cookie

获取指定用户的完整 Cookie 字符串,需要签名验证。

**接口地址:** `POST /user/get_cookie`

**请求参数:**

| 参数名    | 类型   | 必填 | 说明                                        |
| --------- | ------ | ---- | ------------------------------------------- |
| uid       | number | 是   | 用户 UID                                    |
| timestamp | number | 是   | 当前时间戳(秒),与服务器时间差不能超过 10 秒 |
| signature | string | 是   | 签名,使用 HMAC-SHA256 算法                  |

**签名算法:**

```javascript
const crypto = require("crypto");

const uid = 123456789;
const timestamp = Math.floor(Date.now() / 1000);
const secret = "r96gkr8ahc34fsrewr34";

const signature = crypto.createHmac("sha256", secret).update(`${uid}${timestamp}`).digest("hex");
```

**请求示例:**

```json
{
  "uid": 123456789,
  "timestamp": 1730419200,
  "signature": "abc123..."
}
```

**响应示例:**

```
SESSDATA=xxx; bili_jct=xxx; DedeUserID=xxx; buvid3=xxx
```

**错误响应:**

- `400 请求超时`: 时间戳与服务器时间差超过 10 秒
- `400 签名无效`: 签名验证失败
- `500 获取失败,请重试`: 获取 Cookie 失败

::: warning 安全提示
此接口涉及用户敏感信息,请妥善保管 Cookie 数据,不要泄露给他人。
::: -->
