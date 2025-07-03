import axios from "axios";
import router from "../routers/index";

const api = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

export async function init() {
  if (window.isWeb) {
    const baseURL = window.localStorage.getItem("api");
    if (baseURL) {
      api.defaults.baseURL = baseURL;
    } else {
      api.defaults.baseURL = `http://127.0.0.1:18010`;
    }
  } else {
    const appConfig = await window.api.config.getAll();
    const protocol = appConfig.https ? "https" : "http";
    api.defaults.baseURL = `${protocol}://127.0.0.1:${appConfig.port}`;
    api.defaults.headers.Authorization = appConfig.passKey;
  }
}

api.interceptors.request.use(
  (config) => {
    // header authorization
    const keyStorage = window.localStorage.getItem("key");
    if (keyStorage) {
      config.headers.Authorization = keyStorage;
    }
    const baseURL = window.localStorage.getItem("api");
    if (baseURL) {
      config.baseURL = baseURL;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    return Promise.resolve(response);
  },
  (error) => {
    const route = router.currentRoute.value;
    if (error?.response?.status === 401 && route.name !== "Login") {
      window.localStorage.removeItem("key");
      router.push("/login");
    }
    return Promise.reject(error?.response?.data ?? error?.response?.status);
  },
);

export default api;
