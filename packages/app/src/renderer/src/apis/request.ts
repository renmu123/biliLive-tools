import axios from "axios";

const api = axios.create({
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
});

async function init() {
  const appConfig = await window.api.config.getAll();
  api.defaults.baseURL = `http://${appConfig.host}:${appConfig.port}`;
}
init();

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
    return Promise.resolve(response.data);
  },
  (error) => {
    console.log("error", error);
    const msg = error.response.data || error.response.message;
    return Promise.reject(msg);
  },
);

export default api;
