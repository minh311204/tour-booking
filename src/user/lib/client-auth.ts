"use client";

import { API_BASE_URL } from "./env";

async function postJson<T>(path: string, payload: unknown) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false as const, status: res.status, body };
  return { ok: true as const, data: body as T };
}

export async function postLogin(email: string, password: string) {
  return postJson<{ accessToken: string; refreshToken: string; jti: string }>(
    "/auth/login",
    { email, password },
  );
}

export async function postRegister(
  email: string,
  password: string,
  name: string,
) {
  return postJson<{
    id: number;
    email: string;
    firstName: string | null;
    lastName: string | null;
    status: string;
    role: string;
    hasPassword: boolean;
  }>("/auth/register", { email, password, name });
}

export async function postOAuthGoogle(idToken: string) {
  return postJson<{ accessToken: string; refreshToken: string; jti: string }>(
    "/auth/oauth/google",
    { idToken },
  );
}

export async function postOAuthFacebook(accessToken: string) {
  return postJson<{ accessToken: string; refreshToken: string; jti: string }>(
    "/auth/oauth/facebook",
    { accessToken },
  );
}

export async function getMe(accessToken: string) {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false as const, status: res.status, body };
  return {
    ok: true as const,
    data: body as {
      id: number;
      email: string;
      firstName: string | null;
      lastName: string | null;
      status: string;
      role: string;
      hasPassword: boolean;
    },
  };
}

export async function postChangePassword(
  accessToken: string,
  payload: { currentPassword?: string; newPassword: string },
) {
  const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false as const, status: res.status, body };
  return { ok: true as const, data: body as { message: string } };
}
