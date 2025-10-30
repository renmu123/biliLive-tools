# Sync API

文件同步相关接口文档。

## 百度网盘登录

使用 Cookie 登录百度网盘。

**接口地址:** `POST /sync/baiduPCSLogin`

**请求参数:**

| 参数名   | 类型   | 必填 | 说明                     |
| -------- | ------ | ---- | ------------------------ |
| cookie   | string | 是   | 百度网盘 Cookie          |
| execPath | string | 否   | BaiduPCS-Go 执行文件路径 |

## 123 网盘登录

使用 ClientID 和 ClientSecret 登录 123 网盘。

**接口地址:** `POST /sync/pan123Login`

**请求参数:**

| 参数名       | 类型   | 必填 | 说明               |
| ------------ | ------ | ---- | ------------------ |
| clientId     | string | 是   | 123 网盘客户端 ID  |
| clientSecret | string | 是   | 123 网盘客户端密钥 |

## 阿里云盘登录

获取阿里云盘登录信息或执行登录操作。

**接口地址:** `GET /sync/aliyunpanLogin`

**请求参数:**

| 参数名   | 类型   | 必填 | 说明                                                              |
| -------- | ------ | ---- | ----------------------------------------------------------------- |
| execPath | string | 是   | 阿里云盘执行文件路径                                              |
| type     | string | 是   | 操作类型：`getUrl`(获取登录地址)、`cancel`(取消)、`confirm`(确认) |

::: tip 登录流程

1. 调用 `type=getUrl` 获取登录二维码或链接
2. 用户扫码或访问链接完成授权
3. 调用 `type=confirm` 确认登录
   :::

## 检查登录状态

检查指定同步类型的登录状态。

**接口地址:** `GET /sync/isLogin`

**请求参数:**

| 参数名       | 类型   | 必填 | 说明                         |
| ------------ | ------ | ---- | ---------------------------- |
| type         | string | 是   | 同步类型                     |
| execPath     | string | 否   | 执行文件路径（部分类型需要） |
| apiUrl       | string | 否   | API 地址（部分类型需要）     |
| username     | string | 否   | 用户名（部分类型需要）       |
| password     | string | 否   | 密码（部分类型需要）         |
| clientId     | string | 否   | 客户端 ID（部分类型需要）    |
| clientSecret | string | 否   | 客户端密钥（部分类型需要）   |

## 同步文件

创建一个文件同步任务。

**接口地址:** `POST /sync/sync`

**请求参数:**

| 参数名               | 类型    | 必填 | 说明                     |
| -------------------- | ------- | ---- | ------------------------ |
| file                 | string  | 是   | 本地文件路径             |
| type                 | string  | 是   | 同步类型                 |
| targetPath           | string  | 是   | 目标路径（远程路径）     |
| options              | object  | 否   | 同步选项                 |
| options.removeOrigin | boolean | 否   | 上传成功后是否删除原文件 |

::: tip
返回值为任务 ID，可用于后续查询任务状态。
:::
