"use client";

import { API_BASE_URL } from "./env";
import { AUTH_KEYS } from "./auth-storage";
import type { WishlistItem, WishlistCheck } from "./api-types";

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

export async function fetchMyWishlist() {
  try {
    const res = await fetch(`${API_BASE_URL}/wishlist`, {
      headers: authHeaders(),
    });
    const body = await readJsonSafe(res);
    if (!res.ok) return { ok: false as const, status: res.status, body };
    return { ok: true as const, data: body as WishlistItem[] };
  } catch {
    return {
      ok: false as const,
      status: 0,
      body: { message: "Không kết nối được API" },
    } satisfies ApiErr;
  }
}

export async function addToWishlist(tourId: number) {
  try {
    const res = await fetch(`${API_BASE_URL}/wishlist`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ tourId }),
    });
    const body = await readJsonSafe(res);
    if (!res.ok) return { ok: false as const, status: res.status, body };
    return { ok: true as const, data: body as WishlistItem };
  } catch {
    return {
      ok: false as const,
      status: 0,
      body: { message: "Không kết nối được API" },
    } satisfies ApiErr;
  }
}

export async function removeFromWishlist(tourId: number) {
  try {
    const res = await fetch(`${API_BASE_URL}/wishlist/${tourId}`, {
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

export async function checkWishlist(tourId: number) {
  try {
    const res = await fetch(`${API_BASE_URL}/wishlist/${tourId}/check`, {
      headers: authHeaders(),
    });
    const body = await readJsonSafe(res);
    if (!res.ok) return { ok: false as const, status: res.status, body };
    return { ok: true as const, data: body as WishlistCheck };
  } catch {
    return {
      ok: false as const,
      status: 0,
      body: { message: "Không kết nối được API" },
    } satisfies ApiErr;
  }
}
