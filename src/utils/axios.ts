import axios, { AxiosInstance } from "axios";
import { ENVIRONMENT } from "./enviroment";

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: ENVIRONMENT.BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor to handle auth errors
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Clear user data and redirect to login
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);