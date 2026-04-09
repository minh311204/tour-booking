"use client";

import type { TourListItem } from "./api-types";
import { API_BASE_URL } from "./env";
import { AUTH_KEYS } from "./auth-storage";

export type AiChatResponse = {
  sessionId: number;
  sessionKey?: string;
  reply: string;
  tours?: TourListItem[];
};

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_KEYS.accessToken);
}

export async function postAiMessage(payload: {
  sessionId?: number;
  sessionKey?: string;
  message: string;
}) {
  const token = getAccessToken();
  const res = await fetch(`${API_BASE_URL}/ai/chat/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  const body = (await res.json().catch(() => null)) as unknown;
  if (!res.ok) return { ok: false as const, status: res.status, body };
  return { ok: true as const, data: body as AiChatResponse };
}

