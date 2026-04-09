"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin-header";
import { TourForm } from "@/components/tour-form";
import type { LocationRow, TourDetail } from "@/lib/api-types";
import { fetchLocations, fetchTourById } from "@/lib/admin-api";
import { errorMessage } from "@/lib/format";

export default function AdminEditTourPage() {
  const params = useParams();
  const idParam = params?.id;
  const tourId =
    typeof idParam === "string"
      ? Number(idParam)
      : Array.isArray(idParam)
        ? Number(idParam[0])
        : NaN;

  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [tour, setTour] = useState<TourDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!Number.isFinite(tourId) || tourId < 1) {
      setErr("Mã tour không hợp lệ.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setErr(null);
      setLoading(true);
      const [l, t] = await Promise.all([
        fetchLocations(),
        fetchTourById(tourId),
      ]);
      if (cancelled) return;
      if (!l.ok) setErr(errorMessage(l.body, l.status));
      else if (!t.ok) setErr(errorMessage(t.body, t.status));
      else {
        setLocations(l.data.filter((x) => x.isActive !== false));
        setTour(t.data);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [tourId]);

  return (
    <>
      <AdminHeader
        title="Sửa tour"
        subtitle={tour ? tour.name : "Đang tải…"}
      />
      <main className="flex-1 overflow-auto p-6">
        {loading ? (
          <p className="text-slate-500">Đang tải…</p>
        ) : err ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {err}
          </p>
        ) : tour ? (
          <TourForm
            mode="edit"
            tourId={tourId}
            initialDetail={tour}
            locations={locations}
          />
        ) : null}
      </main>
    </>
  );
}
