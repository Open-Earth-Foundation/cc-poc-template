import { apiRequest } from "@/core/lib/queryClient";
import { OAuthResponse, LoginResponse } from "@/core/types/auth";

export async function initiateOAuth(): Promise<OAuthResponse> {
  const res = await apiRequest("GET", "/api/auth/oauth/initiate");
  return await res.json();
}

export async function handleOAuthCallback(code: string, state: string): Promise<LoginResponse> {
  const res = await apiRequest("POST", "/api/auth/oauth/callback", { code, state });
  return await res.json();
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
}

export async function getUserProfile() {
  const res = await apiRequest("GET", "/api/user/profile");
  return await res.json();
}
