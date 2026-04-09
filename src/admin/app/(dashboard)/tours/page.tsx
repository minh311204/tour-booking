"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin-header";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { TourListItem } from "@/lib/api-types";
import { deleteTour, fetchTours, unwrapTourList } from "@/lib/admin-api";
import { AdminPagination } from "@/components/admin-pagination";
import {
  errorMessage,
  formatDateTimeVi,
  formatVnd,
  labelTourLine,
  labelTransport,
} from "@/lib/format";
import { TourImage } from "@/components/tour-image";

const PAGE_SIZE = 9;

function AdminToursPageInner() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.trim() || undefined;

  const [rows, setRows] = useState<TourListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    setPage(1);
  }, [q]);

  const loadTours = useCallback(async () => {
    setErr(null);
    setLoading(true);
    const res = await fetchTours({
      isActive: "true",
      page: String(page),
      pageSize: String(PAGE_SIZE),
      ...(q ? { q } : {}),
    });
    if (res.ok) {
      const { items, total: t } = unwrapTourList(res.data);
      setRows(items);
      setTotal(t);
    } else setErr(errorMessage(res.body, res.status));
    setLoading(false);
  }, [page, q]);

  useEffect(() => {
    void loadTours();
  }, [loadTours]);

  async function handleDelete(id: number, name: string) {
    if (
      !window.confirm(
        `Xóa tour "${name}"? Hành động này không thể hoàn tác.`,
      )
    ) {
      return;
    }
    setDeletingId(id);
    setErr(null);
    const res = await deleteTour(id);
    setDeletingId(null);
    if (!res.ok) {
      setErr(errorMessage(res.body, res.status));
      return;
    }
    await loadTours();
  }

  return (
    <>
      <AdminHeader title="Danh mục tour" />
      <main className="flex-1 space-y-4 overflow-auto p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600">
            {q ? (
              <>
                Kết quả cho &quot;{q}&quot; —{" "}
                <Link href="/tours" className="font-medium text-sky-600 hover:underline">
                  Xóa lọc
                </Link>
              </>
            ) : (
              ""
            )}
          </p>
          <Link
            href="/tours/new"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-sky-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-md transition hover:from-sky-500 hover:to-indigo-500"
          >
            <Plus className="h-4 w-4" />
            Thêm tour
          </Link>
        </div>

        {err ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {err}
          </div>
        ) : null}

        {loading ? (
          <p className="py-12 text-center text-slate-500">Đang tải…</p>
        ) : rows.length === 0 && !err ? (
          <p className="py-12 text-center text-slate-500">
            {q ? "Không có tour khớp từ khóa." : "Chưa có tour."}
          </p>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {rows.map((row) => (
                <article
                  key={row.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.04] transition hover:shadow-md"
                >
                  <div className="p-3 pb-0">
                    <TourImage url={row.thumbnailUrl} name={row.name} />
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <h2 className="line-clamp-2 font-semibold leading-snug text-slate-900">
                      {row.name}
                    </h2>
                    {row.description ? (
                      <p className="line-clamp-2 text-xs text-slate-500">
                        {row.description}
                      </p>
                    ) : null}
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                      <dt className="text-slate-500">Giá từ</dt>
                      <dd className="text-right font-medium text-sky-600">
                        {formatVnd(row.basePrice ?? null)}
                      </dd>
                      <dt className="text-slate-500">Thời lượng</dt>
                      <dd className="text-right text-slate-700">
                        {row.durationDays != null
                          ? `${row.durationDays} ngày`
                          : "—"}
                      </dd>
                      <dt className="text-slate-500">Điểm đi</dt>
                      <dd className="text-right text-slate-700">
                        {row.departureLocation?.name ?? "—"}
                      </dd>
                      <dt className="text-slate-500">Điểm đến</dt>
                      <dd className="text-right text-slate-700">
                        {row.destinationLocation?.name ?? "—"}
                      </dd>
                      <dt className="text-slate-500">Dòng / PT</dt>
                      <dd className="text-right text-slate-700">
                        {labelTourLine(row.tourLine)} ·{" "}
                        {labelTransport(row.transportType)}
                      </dd>
                      <dt className="text-slate-500">Đánh giá</dt>
                      <dd className="text-right text-slate-700">
                        {row.ratingAvg != null
                          ? `${row.ratingAvg.toFixed(1)} ★ (${row.totalReviews ?? 0})`
                          : "—"}
                      </dd>
                      <dt className="text-slate-500">Tạo lúc</dt>
                      <dd className="text-right text-slate-500">
                        {formatDateTimeVi(row.createdAtUtc)}
                      </dd>
                    </dl>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          row.isActive
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {row.isActive ? "Đang mở" : "Tạm dừng"}
                      </span>
                      <div className="flex gap-1">
                        <Link
                          href={`/tours/${row.id}/edit`}
                          className="inline-flex rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-sky-600"
                          aria-label="Sửa"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          disabled={deletingId === row.id}
                          onClick={() => handleDelete(row.id, row.name)}
                          className="inline-flex rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-red-600 disabled:opacity-50"
                          aria-label="Xóa"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <AdminPagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onPageChange={setPage}
            />
          </>
        )}
      </main>
    </>
  );
}

export default function AdminToursPage() {
  return (
    <Suspense
      fallback={
        <>
          <AdminHeader title="Danh mục tour" />
          <main className="flex-1 p-6">
            <p className="text-center text-slate-500">Đang tải…</p>
          </main>
        </>
      }
    >
      <AdminToursPageInner />
    </Suspense>
  );
}
