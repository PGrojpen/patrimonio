import axios from "axios";

export const api = axios.create({
  baseURL: "/api/v1",
  headers: { "Content-Type": "application/json" },
  timeout: 60_000, // Monte Carlo can take a while
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error ??
      error.response?.data?.detail ??
      error.message ??
      "Erro inesperado";
    return Promise.reject(new Error(message));
  }
);
