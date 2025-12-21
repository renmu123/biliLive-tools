# 0.1.4

初始化支持其他参数，来跳过默认的初始化查询

```
{
  roomid: string;
  uid?: number;
  subChannelId?: number;
  channelId?: number;
}
```

# 0.1.3

- 优化重试函数

# 0.1.2

- 为初始化请求添加重试

# 0.1.1

- 增加错误连接重试，默认为10次
