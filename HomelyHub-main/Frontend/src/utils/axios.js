import axios from "axios";
import qs from "qs";

// Serialization means converting a JavaScript object or array into a URL query string that can be sent in an HTTP request.

export const axiosInstance = axios.create({
  baseURL: "/api",
  withCredentials: true,
  paramsSerializer: (params) => qs.stringify(params, { arrayFormat: "repeat" }),
});
