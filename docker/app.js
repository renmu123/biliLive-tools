const express = require("express");
const path = require("path");
const app = express();

// 设置 public 目录为静态文件目录
app.use(express.static(path.join(__dirname, "public")));

// 处理首页请求
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 启动服务器
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
