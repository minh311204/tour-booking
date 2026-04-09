"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin-header";
import { TourForm } from "@/components/tour-form";
import type { LocationRow } from "@/lib/api-types";
import { fetchLocations } from "@/lib/admin-api";
import { errorMessage } from "@/lib/format";

export default function AdminNewTourPage() {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setErr(null);
      const l = await fetchLocations();
      if (cancelled) return;
      if (!l.ok) setErr(errorMessage(l.body, l.status));
      else {
        setLocations(l.data.filter((x) => x.isActive !== false));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <AdminHeader
        title="Thêm tour"
        subtitle="Tạo tour mới (cần tài khoản ADMIN)"
      />
      <main className="flex-1 overflow-auto p-6">
        {loading ? (
          <p className="text-slate-500">Đang tải địa điểm…</p>
        ) : err ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {err}
          </p>
        ) : (
          <TourForm
            mode="create"
            initialDetail={null}
            locations={locations}
          />
        )}
      </main>
    </>
  );
}
