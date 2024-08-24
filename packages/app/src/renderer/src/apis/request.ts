import axios from "axios";

const api = axios.create({
  headers: {
    "Content-Type": "application/json",
  },
});

export async function init() {
  const appConfig = await window.api.config.getAll();
  api.defaults.baseURL = `http://${appConfig.host}:${appConfig.port}`;
}

api.interceptors.request.use(
  (config) => {
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
    return Promise.reject(error.response.data);
  },
);

export default api;
