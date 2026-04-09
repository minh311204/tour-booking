"use client";

import { API_BASE_URL } from "./env";
import { AUTH_KEYS } from "./auth-storage";
import type { Notification, UnreadCount } from "./api-types";

type ApiErr = { ok: false; status: number; body: unknown };

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_KEYS.accessToken);
}

async function readJsonSafe(res: Response): Promise<unknown> {
  return res.json().catch(() => ({}));
}

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

export async function fetchNotifications(opts?: {
  unreadOnly?: boolean;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (opts?.unreadOnly) params.set("unreadOnly", "true");
  if (opts?.limit) params.set("limit", String(opts.limit));
  const qs = params.toString() ? `?${params.toString()}` : "";

  try {
    const res = await fetch(`${API_BASE_URL}/notifications${qs}`, {
      headers: authHeaders(),
    });
    const body = await readJsonSafe(res);
    if (!res.ok) return { ok: false as const, status: res.status, body };
    return { ok: true as const, data: body as Notification[] };
  } catch {
    return {
      ok: false as const,
      status: 0,
      body: { message: "Không kết nối được API" },
    } satisfies ApiErr;
  }
}

export async function fetchUnreadCount() {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
      headers: authHeaders(),
    });
    const body = await readJsonSafe(res);
    if (!res.ok) return { ok: false as const, status: res.status, body };
    return { ok: true as const, data: body as UnreadCount };
  } catch {
    return {
      ok: false as const,
      status: 0,
      body: { message: "Không kết nối được API" },
    } satisfies ApiErr;
  }
}

export async function markNotificationRead(id: number) {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/${id}/read`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({}),
    });
    const body = await readJsonSafe(res);
    if (!res.ok) return { ok: false as const, status: res.status, body };
    return { ok: true as const, data: body as Notification };
  } catch {
    return {
      ok: false as const,
      status: 0,
      body: { message: "Không kết nối được API" },
    } satisfies ApiErr;
  }
}

export async function markAllNotificationsRead() {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/read-all`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({}),
    });
    const body = await readJsonSafe(res);
    if (!res.ok) return { ok: false as const, status: res.status, body };
    return { ok: true as const, data: body as { count: number } };
  } catch {
    return {
      ok: false as const,
      status: 0,
      body: { message: "Không kết nối được API" },
    } satisfies ApiErr;
  }
}

export async function deleteNotification(id: number) {
  try {
    const res = await fetch(`${API_BASE_URL}/notifications/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    const body = await readJsonSafe(res);
    if (!res.ok) return { ok: false as const, status: res.status, body };
    return { ok: true as const, data: body as { message: string } };
  } catch {
    return {
      ok: false as const,
      status: 0,
      body: { message: "Không kết nối được API" },
    } satisfies ApiErr;
  }
}
