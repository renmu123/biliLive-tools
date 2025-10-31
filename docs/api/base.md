# 基础 API

biliLive-tools 的基础接口文档，使用前必看。

## 接口授权

绝大多数 API 接口除设计面向外部的都需要进行身份验证。

### 授权方式

在请求头中添加 `Authorization` 字段：

```
Authorization: your_passkey_here
```

### 获取 PassKey

- **客户端模式**: 在设置中可以配置自定义 PassKey
- **命令行模式**: 通过环境变量 `BILILIVE_TOOLS_PASSKEY` 设置

### 调用示例

```javascript
// 使用 fetch
const response = await fetch("http://localhost:18010/common/version", {
  headers: {
    Authorization: "your_passkey_here",
  },
});
const data = await response.json();

// 使用 axios
import axios from "axios";

const client = axios.create({
  baseURL: "http://localhost:18010",
  headers: {
    Authorization: "your_passkey_here",
  },
});

const { data } = await client.get("/common/version");
```

**Python:**

```python
import requests

headers = {
    'Authorization': 'your_passkey_here'
}

response = requests.get('http://localhost:18010/common/version', headers=headers)
data = response.json()
```

**cURL:**

```bash
curl -H "Authorization: your_passkey_here" http://localhost:18010/common/version

```
