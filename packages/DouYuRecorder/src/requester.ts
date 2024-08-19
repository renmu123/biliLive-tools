import axios from "axios";

export const requester = axios.create({
  timeout: 10e3,
  // axios 会自动读取环境变量中的 http_proxy 和 https_proxy 并应用，
  // 但会导致请求报错 "Client network socket disconnected before secure TLS connection was established"。
  proxy: false,
});
