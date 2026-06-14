import axios from "axios";
import { getLocalAccessToken, getRefreshToken } from "./getTokens";

export const axiosApiInstance = axios.create();

axiosApiInstance.interceptors.request.use(
  (config) => {
    const token = getLocalAccessToken();
    if (token) {
      config.headers["Authorization"] = "Bearer " + token;
    }
    return Promise.resolve(config);
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosApiInstance.interceptors.response.use(
  (res) => {
    return res;
  },
  async (err) => {
    const originalConfig = err.config;
    if (err.response) {
      // Access Token was expired
      if (err.response.status === 401 && !originalConfig._retry) {
        originalConfig._retry = true;

        try {
          const rs = await getRefreshToken();
          const token = rs?.data?.token;
          localStorage.setItem("Token", token);
          axiosApiInstance.defaults.headers.common["Authorization"] =
            "Bearer " + token;

          return axiosApiInstance(originalConfig);
        } catch (_error: any) {
          if (_error?.response && _error?.response?.data) {
            return Promise.reject(_error.response?.data);
          }

          return Promise.reject(_error);
        }
      }

      if (err.response.status === 420 && !originalConfig._retry) {
        localStorage.clear();
        // eslint-disable-next-line no-restricted-globals
        location.href = "/login";
      }

      if (err.response.status === 403 && err.response.data) {
        return Promise.reject(err.response.data);
      }
    }

    return Promise.reject(err);
  }
);
