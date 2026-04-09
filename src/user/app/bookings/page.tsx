"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ExternalLink,
  MapPin,
  Star,
  Users,
} from "lucide-react";
import {
  createVnpayPayment,
  getMyBookings,
  type BookingListItem,
} from "@/lib/client-booking";
import { hasAccessToken } from "@/lib/auth-storage";
import { errorMessage, formatVnd } from "@/lib/format";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatVnDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${pad2(d.getUTCDate())}/${pad2(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

function isScheduleEnded(endDate?: string | null): boolean {
  if (!endDate) return false;
  return new Date(endDate) < new Date();
}

const STATUS_CONFIG: Record<
  BookingListItem["status"],
  { label: string; badge: string; dot: string }
> = {
  PENDING: {
    label: "Chờ xác nhận",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    dot: "bg-amber-400",
  },
  CONFIRMED: {
    label: "Đã xác nhận",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500",
  },
  CANCELLED: {
    label: "Đã hủy",
    badge: "bg-red-50 text-red-700 border-red-200",
    dot: "bg-red-400",
  },
  COMPLETED: {
    label: "Hoàn tất",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500",
  },
};

function BookingCard({
  row,
  onRepay,
  paying,
}: {
  row: BookingListItem;
  onRepay: (id: number) => void;
  paying: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = STATUS_CONFIG[row.status];
  const tourId = row.schedule?.tour?.id;
  const tourName = row.schedule?.tour?.name ?? "Tour";
  const startDate = row.schedule?.startDate;
  const endDate = row.schedule?.endDate;
  const canReview =
    row.status === "COMPLETED" && isScheduleEnded(endDate);
  const canReviewSoon =
    row.status === "CONFIRMED" && isScheduleEnded(endDate);

  return (
    <li className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3 border-b border-stone-100 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className={`inline-block h-2 w-2 rounded-full ${cfg.dot}`} />
          <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cfg.badge}`}>
            {cfg.label}
          </span>
          <span className="font-mono text-xs text-stone-400">BK-{row.id}</span>
        </div>
        <span className="text-sm font-bold text-stone-900">
          {formatVnd(row.totalAmount ?? null)}
        </span>
      </div>

      {/* Main info */}
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {/* Tour name with link */}
            <div className="flex items-start gap-2">
              <h3 className="line-clamp-2 font-semibold text-stone-900">{tourName}</h3>
              {tourId ? (
                <Link
                  href={`/tours/${tourId}`}
                  target="_blank"
                  title="Xem trang tour"
                  className="mt-0.5 shrink-0 text-teal-600 hover:text-teal-700"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              ) : null}
            </div>

            {/* Dates */}
            <div className="mt-2 flex flex-wrap gap-3 text-sm text-stone-500">
              {startDate ? (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 shrink-0 text-teal-600" />
                  Khởi hành: <strong className="text-stone-700">{formatVnDate(startDate)}</strong>
                </span>
              ) : null}
              {endDate ? (
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 shrink-0 text-teal-600" />
                  Kết thúc: <strong className="text-stone-700">{formatVnDate(endDate)}</strong>
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 shrink-0 text-teal-600" />
                {row.numberOfPeople} khách
              </span>
            </div>

            {/* Review prompt */}
            {canReview ? (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
                <span className="text-xs text-amber-800">
                  Tour đã hoàn tất — hãy chia sẻ trải nghiệm của bạn!
                </span>
                {tourId ? (
                  <Link
                    href={`/tours/${tourId}#reviews`}
                    className="ml-auto shrink-0 rounded-lg bg-amber-400 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-500"
                  >
                    Viết đánh giá
                  </Link>
                ) : null}
              </div>
            ) : canReviewSoon ? (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
                <Star className="h-4 w-4 shrink-0 text-blue-400" />
                <span className="text-xs text-blue-700">
                  Tour đã kết thúc — bạn có thể viết đánh giá ngay.
                </span>
                {tourId ? (
                  <Link
                    href={`/tours/${tourId}#reviews`}
                    className="ml-auto shrink-0 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-600"
                  >
                    Đánh giá
                  </Link>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {tourId ? (
            <Link
              href={`/tours/${tourId}`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700 hover:bg-teal-100"
            >
              <MapPin className="h-3.5 w-3.5" />
              Xem tour
            </Link>
          ) : null}

          {row.status === "PENDING" ? (
            <button
              type="button"
              onClick={() => onRepay(row.id)}
              disabled={paying}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
            >
              <CreditCard className="h-3.5 w-3.5" />
              {paying ? "Đang tạo link…" : "Thanh toán"}
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="ml-auto inline-flex items-center gap-1 text-xs text-stone-500 hover:text-stone-700"
          >
            {expanded ? (
              <>
                Thu gọn <ChevronUp className="h-3.5 w-3.5" />
              </>
            ) : (
              <>
                Chi tiết <ChevronDown className="h-3.5 w-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Expanded detail */}
        {expanded ? (
          <div className="mt-4 space-y-3 border-t border-stone-100 pt-4 text-sm text-stone-700">
            {/* Contact */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                Thông tin liên hệ
              </p>
              <p className="mt-1">
                {row.contact?.fullName ?? "—"} ·{" "}
                <span className="text-stone-500">{row.contact?.email ?? "—"}</span> ·{" "}
                <span className="text-stone-500">{row.contact?.phone ?? "—"}</span>
              </p>
              {row.contact?.address ? (
                <p className="mt-0.5 text-stone-500">{row.contact.address}</p>
              ) : null}
            </div>

            {/* Passengers */}
            {row.passengers && row.passengers.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  Hành khách ({row.passengers.length})
                </p>
                <ul className="mt-1 space-y-1">
                  {row.passengers.map((p) => (
                    <li key={p.id} className="flex items-center gap-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                          p.ageCategory === "ADULT"
                            ? "bg-blue-50 text-blue-600"
                            : p.ageCategory === "CHILD"
                              ? "bg-green-50 text-green-600"
                              : "bg-orange-50 text-orange-600"
                        }`}
                      >
                        {p.ageCategory === "ADULT"
                          ? "Người lớn"
                          : p.ageCategory === "CHILD"
                            ? "Trẻ em"
                            : "Em bé"}
                      </span>
                      <span className="text-stone-800">{p.fullName}</span>
                      {p.dateOfBirth ? (
                        <span className="text-xs text-stone-400">
                          ({p.dateOfBirth})
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Notes */}
            {row.notes ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                  Ghi chú
                </p>
                <p className="mt-1 text-stone-600">{row.notes}</p>
              </div>
            ) : null}

            {/* Booking date */}
            {row.bookingDateUtc ? (
              <p className="text-xs text-stone-400">
                Đặt lúc:{" "}
                {new Date(row.bookingDateUtc).toLocaleString("vi-VN")}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </li>
  );
}

export default function BookingsHistoryPage() {
  const [loading, setLoading] = useState(true);
  const [authMissing, setAuthMissing] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<BookingListItem[]>([]);
  const [payingBookingId, setPayingBookingId] = useState<number | null>(null);
  const [paymentNotice, setPaymentNotice] = useState<"success" | "failed" | null>(null);

  const hasToken = useMemo(() => hasAccessToken(), []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search).get("payment");
    if (p === "success") setPaymentNotice("success");
    else if (p === "failed") setPaymentNotice("failed");
  }, []);

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!hasToken) {
        if (!alive) return;
        setAuthMissing(true);
        setLoading(false);
        return;
      }
      const res = await getMyBookings();
      if (!alive) return;
      if (!res.ok) {
        if (res.status === 401) setAuthMissing(true);
        else setErr(errorMessage(res.body));
        setLoading(false);
        return;
      }
      setRows(res.data);
      setLoading(false);
    }
    load();
    return () => { alive = false; };
  }, [hasToken]);

  async function onRepay(bookingId: number) {
    setErr(null);
    setPayingBookingId(bookingId);
    const res = await createVnpayPayment(bookingId);
    setPayingBookingId(null);
    if (!res.ok) { setErr(errorMessage(res.body)); return; }
    window.location.href = res.data.paymentUrl;
  }

  const stats = useMemo(() => {
    const total = rows.length;
    const pending = rows.filter((r) => r.status === "PENDING").length;
    const completed = rows.filter((r) => r.status === "COMPLETED").length;
    return { total, pending, completed };
  }, [rows]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-stone-900">Đặt chỗ của tôi</h1>
        <p className="mt-1 text-stone-500">Lịch sử và quản lý các đặt tour</p>
      </div>

      {/* Payment notices */}
      {paymentNotice === "success" ? (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          ✅ Thanh toán thành công! Đơn đã được xác nhận — kiểm tra email xác nhận.
        </div>
      ) : null}
      {paymentNotice === "failed" ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          ⚠️ Thanh toán chưa hoàn tất hoặc bị từ chối. Bạn có thể thử lại.
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-2xl bg-stone-100" />
          ))}
        </div>
      ) : authMissing ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <p className="text-stone-600">Bạn cần đăng nhập để xem lịch sử đặt chỗ.</p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Đăng nhập
          </Link>
        </div>
      ) : err ? (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">{err}</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <CalendarDays className="mx-auto h-12 w-12 text-stone-300" />
          <p className="mt-4 text-stone-600">Bạn chưa có đặt chỗ nào.</p>
          <Link
            href="/tours"
            className="mt-4 inline-block rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Khám phá tour ngay
          </Link>
        </div>
      ) : (
        <>
          {/* Stats summary */}
          <div className="mb-5 grid grid-cols-3 gap-3">
            {[
              { label: "Tổng đặt", value: stats.total, color: "text-stone-800" },
              { label: "Chờ xử lý", value: stats.pending, color: "text-amber-600" },
              { label: "Hoàn tất", value: stats.completed, color: "text-emerald-600" },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-stone-200 bg-white p-3 text-center shadow-sm"
              >
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="mt-0.5 text-xs text-stone-500">{s.label}</p>
              </div>
            ))}
          </div>

          <ul className="space-y-4">
            {rows.map((row) => (
              <BookingCard
                key={row.id}
                row={row}
                onRepay={onRepay}
                paying={payingBookingId === row.id}
              />
            ))}
          </ul>
        </>
      )}

      <div className="mt-8 text-center">
        <Link href="/tours" className="text-sm font-medium text-teal-700 hover:underline">
          Đặt thêm tour →
        </Link>
      </div>
    </div>
  );
}
