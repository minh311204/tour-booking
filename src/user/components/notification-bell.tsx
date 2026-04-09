"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "@/lib/client-notification";
import type { Notification } from "@/lib/api-types";
import { hasAccessToken } from "@/lib/auth-storage";

function cn(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export function NotificationBell({ isHome = false }: { isHome?: boolean }) {
  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const loadCount = useCallback(async () => {
    const res = await fetchUnreadCount();
    if (res.ok) setCount(res.data.count);
  }, []);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    const res = await fetchNotifications({ limit: 20 });
    if (res.ok) setNotifications(res.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    setMounted(true);
    const isAuthed = hasAccessToken();
    setAuthed(isAuthed);
    if (isAuthed) void loadCount();
  }, [loadCount]);

  // Poll unread count every 60s
  useEffect(() => {
    if (!authed) return;
    const id = setInterval(() => void loadCount(), 60_000);
    return () => clearInterval(id);
  }, [authed, loadCount]);

  // Close on outside click
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  async function togglePanel() {
    if (!open) {
      setOpen(true);
      await loadNotifications();
    } else {
      setOpen(false);
    }
  }

  async function onMarkRead(id: number) {
    const res = await markNotificationRead(id);
    if (res.ok) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setCount((c) => Math.max(0, c - 1));
    }
  }

  async function onMarkAll() {
    const res = await markAllNotificationsRead();
    if (res.ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setCount(0);
    }
  }

  async function onDelete(id: number) {
    const n = notifications.find((x) => x.id === id);
    const res = await deleteNotification(id);
    if (res.ok) {
      setNotifications((prev) => prev.filter((x) => x.id !== id));
      if (n && !n.isRead) setCount((c) => Math.max(0, c - 1));
    }
  }

  if (!mounted || !authed) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={togglePanel}
        aria-label="Thông báo"
        className={cn(
          "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2",
          isHome
            ? "bg-white/95 text-teal-800 shadow-md ring-1 ring-black/15 backdrop-blur-sm hover:bg-white hover:shadow-lg hover:ring-teal-300/50"
            : "text-stone-700 hover:bg-stone-100 focus-visible:ring-offset-white",
        )}
      >
        <Bell className="h-5 w-5" strokeWidth={2.25} />
        {count > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {count > 99 ? "99+" : count}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-[70] mt-2 w-80 rounded-xl border border-stone-200 bg-white shadow-2xl sm:w-96">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-stone-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-stone-900">Thông báo</h3>
            {notifications.some((n) => !n.isRead) ? (
              <button
                type="button"
                onClick={onMarkAll}
                className="flex items-center gap-1 text-xs text-teal-600 hover:text-teal-700"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Đọc tất cả
              </button>
            ) : null}
          </div>

          {/* Body */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
              </div>
            ) : notifications.length === 0 ? (
              <p className="py-8 text-center text-sm text-stone-400">
                Không có thông báo
              </p>
            ) : (
              <ul>
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={`group flex gap-3 border-b border-stone-50 px-4 py-3 last:border-0 ${
                      !n.isRead ? "bg-teal-50/60" : ""
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      {n.title ? (
                        <p className="text-xs font-semibold text-stone-800">
                          {n.title}
                        </p>
                      ) : null}
                      {n.content ? (
                        <p className="mt-0.5 text-xs text-stone-600 leading-relaxed">
                          {n.content}
                        </p>
                      ) : null}
                      {n.createdAtUtc ? (
                        <p className="mt-1 text-[10px] text-stone-400">
                          {new Date(n.createdAtUtc).toLocaleString("vi-VN")}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-start gap-1 pt-0.5 opacity-0 transition group-hover:opacity-100">
                      {!n.isRead ? (
                        <button
                          type="button"
                          onClick={() => void onMarkRead(n.id)}
                          title="Đánh dấu đã đọc"
                          className="rounded p-1 text-teal-600 hover:bg-teal-50"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void onDelete(n.id)}
                        title="Xoá"
                        className="rounded p-1 text-red-400 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
