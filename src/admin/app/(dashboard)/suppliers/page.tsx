"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin-header";
import type { Supplier } from "@/lib/api-types";
import { fetchSuppliers, unwrapSupplierList } from "@/lib/admin-api";
import { AdminPagination } from "@/components/admin-pagination";
import { errorMessage } from "@/lib/format";

const PAGE_SIZE = 9;

export default function AdminSuppliersPage() {
  const [rows, setRows] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    const res = await fetchSuppliers({
      page: String(page),
      pageSize: String(PAGE_SIZE),
    });
    if (res.ok) {
      const { items, total: t } = unwrapSupplierList(res.data);
      setRows(items);
      setTotal(t);
    } else setErr(errorMessage(res.body, res.status));
    setLoading(false);
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <AdminHeader title="Nhà cung cấp" />
      <main className="flex-1 space-y-4 overflow-auto p-5 sm:p-6">
        <p className="text-sm text-slate-600">
          Danh sách nhà cung cấp — thêm/sửa chi tiết trong form chỉnh sửa tour.
        </p>
        {err ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {err}
          </div>
        ) : null}
        {loading ? (
          <p className="py-12 text-center text-slate-500">Đang tải…</p>
        ) : rows.length === 0 && !err ? (
          <p className="py-12 text-center text-slate-500">Chưa có nhà cung cấp.</p>
        ) : (
          <>
            <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm ring-1 ring-slate-900/[0.04]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-600">
                    <th className="px-4 py-3 font-medium">Tên</th>
                    <th className="px-4 py-3 font-medium">Loại</th>
                    <th className="px-4 py-3 font-medium">Điện thoại</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {s.name}
                      </td>
                      <td className="px-4 py-3 text-slate-700">{s.type}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {s.phone ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {s.email ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={
                            s.isActive ? "text-emerald-700" : "text-slate-500"
                          }
                        >
                          {s.isActive ? "Hoạt động" : "Tắt"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
