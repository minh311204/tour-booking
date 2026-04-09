"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import { AdminHeader } from "@/components/admin-header";
import type { AdminUser, UpdateUserInput } from "@/lib/api-types";
import { fetchUserById, updateUser } from "@/lib/admin-api";
import { errorMessage } from "@/lib/format";

function statusBadge(status: AdminUser["status"]) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "INACTIVE":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "BANNED":
      return "bg-red-50 text-red-700 border-red-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function roleBadge(role: AdminUser["role"]) {
  return role === "ADMIN"
    ? "bg-sky-50 text-sky-700 border-sky-200"
    : "bg-violet-50 text-violet-700 border-violet-200";
}

export default function AdminEditUserPage() {
  const router = useRouter();
  const params = useParams();
  const rawId = params?.id;

  const userId = useMemo(() => {
    if (typeof rawId === "string") return Number(rawId);
    if (Array.isArray(rawId)) return Number(rawId[0]);
    return NaN;
  }, [rawId]);

  const [user, setUser] = useState<AdminUser | null>(null);
  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isFinite(userId) || userId < 1) {
      setErr("Mã user không hợp lệ.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setErr(null);
      setLoading(true);
      const res = await fetchUserById(userId);
      if (cancelled) return;
      if (!res.ok) {
        setErr(errorMessage(res.body, res.status));
      } else {
        setUser(res.data);
        setFirstName(res.data.firstName ?? "");
        setLastName(res.data.lastName ?? "");
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setErr(null);
    try {
      const body: UpdateUserInput = {
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      };
      const res = await updateUser(user.id, body);
      if (!res.ok) {
        setErr(errorMessage(res.body, res.status));
        return;
      }
      router.push("/users");
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <AdminHeader
        title="Sửa user"
        subtitle={user ? user.email : "Đang tải…"}
      />
      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4">
            <Link
              href="/users"
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-sky-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Quay lại
            </Link>
          </div>

          {err ? (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {err}
            </div>
          ) : null}

          {loading ? (
            <p className="py-6 text-slate-500">Đang tải…</p>
          ) : user ? (
            <form onSubmit={onSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm text-slate-600">
                    Email
                  </label>
                  <input
                    value={user.email}
                    readOnly
                    className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-3 py-2.5 text-slate-600"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-slate-600">
                    Role
                  </label>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleBadge(
                        user.role,
                      )}`}
                    >
                      {user.role}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-slate-600">
                    Status
                  </label>
                  <span
                    className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadge(
                      user.status,
                    )}`}
                  >
                    {user.status}
                  </span>
                </div>
                <div />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm text-slate-600">
                    Họ
                  </label>
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm text-slate-600">
                    Tên
                  </label>
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-slate-900"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Đang lưu…" : "Lưu thay đổi"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFirstName(user.firstName ?? "");
                    setLastName(user.lastName ?? "");
                    setErr(null);
                  }}
                  disabled={saving}
                  className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Hủy
                </button>
              </div>
            </form>
          ) : (
            <p className="py-6 text-slate-500">Không tìm thấy user.</p>
          )}
        </div>
      </main>
    </>
  );
}

