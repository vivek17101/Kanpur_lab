import { request } from "./apiClient";

export function loginAdmin(credentials) {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials),
    token: "",
  });
}

export function getCurrentAdmin() {
  return request("/auth/me");
}
