"use client";

import {
  ACCESS_TOKEN_KEY,
  AUTH_COOKIE_NAME,
  REFRESH_TOKEN_KEY,
} from "./auth-constants";
import { API_BASE_URL } from "./env";

export { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from "./auth-constants";

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7; // 7 ngày

export function getStoredAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function syncAccessTokenToCookie(accessToken: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${AUTH_COOKIE_NAME}=${encodeURIComponent(accessToken)}; path=/; max-age=${COOKIE_MAX_AGE_SEC}; SameSite=Lax`;
}

export function setAuthTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  syncAccessTokenToCookie(accessToken);
}

export function clearAuth(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    /* ignore */
  }
  document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`;
}

export async function postLogin(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false as const, status: res.status, body };
  return {
    ok: true as const,
    data: body as { accessToken: string; refreshToken: string; jti: string },
  };
}
