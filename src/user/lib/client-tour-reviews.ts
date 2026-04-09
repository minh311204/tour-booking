"use client";

import { API_BASE_URL } from "./env";
import { AUTH_KEYS } from "./auth-storage";
import type { TourReview, UpsertTourReviewResponse, DeleteReviewResponse } from "./api-types";

type ApiErr = { ok: false; status: number; body: unknown };

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_KEYS.accessToken);
}

async function readJsonSafe(res: Response): Promise<unknown> {
  return res.json().catch(() => ({}));
}

export async function fetchTourReviews(tourId: number) {
  try {
    const res = await fetch(`${API_BASE_URL}/tours/${tourId}/reviews`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const body = await readJsonSafe(res);
    if (!res.ok) return { ok: false as const, status: res.status, body };
    return { ok: true as const, data: body as TourReview[] };
  } catch {
    return {
      ok: false as const,
      status: 0,
      body: { message: "Không kết nối được API (kiểm tra backend đang chạy)." },
    } satisfies ApiErr;
  }
}

export async function deleteMyTourReview(tourId: number) {
  const token = getAccessToken();
  if (!token) {
    return {
      ok: false as const,
      status: 401,
      body: { message: "Chưa đăng nhập" },
    } satisfies ApiErr;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/tours/${tourId}/reviews/mine`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const body = await readJsonSafe(res);
    if (!res.ok) return { ok: false as const, status: res.status, body };
    return { ok: true as const, data: body as DeleteReviewResponse };
  } catch {
    return {
      ok: false as const,
      status: 0,
      body: { message: "Không kết nối được API" },
    } satisfies ApiErr;
  }
}

export async function upsertTourReview(
  tourId: number,
  rating: number,
  comment: string | null,
) {
  const token = getAccessToken();
  if (!token) {
    return {
      ok: false as const,
      status: 401,
      body: { message: "Chưa đăng nhập" },
    } satisfies ApiErr;
  }

  try {
    const res = await fetch(`${API_BASE_URL}/tours/${tourId}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rating, comment }),
    });
    const body = await readJsonSafe(res);
    if (!res.ok) return { ok: false as const, status: res.status, body };
    return { ok: true as const, data: body as UpsertTourReviewResponse };
  } catch {
    return {
      ok: false as const,
      status: 0,
      body: { message: "Không kết nối được API (kiểm tra backend đang chạy)." },
    } satisfies ApiErr;
  }
}

