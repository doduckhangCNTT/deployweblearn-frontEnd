import axios from "axios";
// import queryString from "query-string";
import apiConfig from "./apiConfig";

const axiosClient = axios.create({
  baseURL: apiConfig.baseUrl,
  headers: {
    "Content-Type": "application/json",
  },

  // paramsSerializer: (params) =>
  // queryString.stringify({ ...params, api_key: apiConfig.apiKey }),
});

axiosClient.interceptors.request.use(async (config) => {
  // khi thực thi trong axiosClient thì nó sẽ chuyển toàn bộ dữ liệu bên trong trực tiếp vào config
  console.log(config);
  return config;
}); // dùng để làm điều gì đó trc khi yêu cầu đc gửi đi
axiosClient.interceptors.request.use(
  (response) => {
    if (response && response.data) {
      return response.data;
    }
    return response;
  },
  (error) => {
    throw error;
  }
);

export default axiosClient;
