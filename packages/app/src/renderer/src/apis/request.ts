import axios from "axios";

const api = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

export async function init() {
  if (!window.isWeb) {
    const appConfig = await window.api.config.getAll();
    api.defaults.baseURL = `http://127.0.0.1:${appConfig.port}`;
  } else {
    const baseURL = window.localStorage.getItem("api");
    if (baseURL) {
      api.defaults.baseURL = baseURL;
    } else {
      api.defaults.baseURL = `http://127.0.0.1:18010`;
    }
  }
}

api.interceptors.request.use(
  (config) => {
    // header authorization
    const keyStorage = window.localStorage.getItem("key");
    if (keyStorage) {
      config.headers.Authorization = keyStorage;
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
    if (error.response.status === 401) {
      window.location.href = "/login";
    }
    return Promise.reject(error.response.data);
  },
);

export default api;
