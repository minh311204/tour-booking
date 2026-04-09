"use client";

import { API_BASE_URL } from "./env";
import { AUTH_KEYS } from "./auth-storage";
import type { UserPreference, UserBehavior, TourListItem } from "./api-types";

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

export async function fetchMyPreference() {
  try {
    const res = await fetch(`${API_BASE_URL}/preferences/me`, {
      headers: authHeaders(),
    });
    const body = await readJsonSafe(res);
    if (!res.ok) return { ok: false as const, status: res.status, body };
    return { ok: true as const, data: body as UserPreference | null };
  } catch {
    return {
      ok: false as const,
      status: 0,
      body: { message: "Không kết nối được API" },
    } satisfies ApiErr;
  }
}

export async function upsertMyPreference(data: {
  preferredLocations?: string | null;
  budgetRange?: string | null;
  travelStyle?: string | null;
}) {
  try {
    const res = await fetch(`${API_BASE_URL}/preferences/me`, {
      method: "PUT",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    const body = await readJsonSafe(res);
    if (!res.ok) return { ok: false as const, status: res.status, body };
    return { ok: true as const, data: body as UserPreference };
  } catch {
    return {
      ok: false as const,
      status: 0,
      body: { message: "Không kết nối được API" },
    } satisfies ApiErr;
  }
}

export async function trackBehavior(
  tourId: number,
  action: "view" | "wishlist" | "book" | "review" | "search",
) {
  const token = getAccessToken();
  if (!token) return;
  try {
    await fetch(`${API_BASE_URL}/preferences/behaviors`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ tourId, action }),
    });
  } catch {
    // fire-and-forget — không throw
  }
}

export async function fetchMyBehaviors(opts?: {
  action?: string;
  limit?: number;
}) {
  const params = new URLSearchParams();
  if (opts?.action) params.set("action", opts.action);
  if (opts?.limit) params.set("limit", String(opts.limit));
  const qs = params.toString() ? `?${params}` : "";

  try {
    const res = await fetch(`${API_BASE_URL}/preferences/behaviors${qs}`, {
      headers: authHeaders(),
    });
    const body = await readJsonSafe(res);
    if (!res.ok) return { ok: false as const, status: res.status, body };
    return { ok: true as const, data: body as UserBehavior[] };
  } catch {
    return {
      ok: false as const,
      status: 0,
      body: { message: "Không kết nối được API" },
    } satisfies ApiErr;
  }
}

export async function fetchRecommendations(limit = 10) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/preferences/recommendations?limit=${limit}`,
      { headers: authHeaders() },
    );
    const body = await readJsonSafe(res);
    if (!res.ok) return { ok: false as const, status: res.status, body };
    return { ok: true as const, data: body as TourListItem[] };
  } catch {
    return {
      ok: false as const,
      status: 0,
      body: { message: "Không kết nối được API" },
    } satisfies ApiErr;
  }
}
