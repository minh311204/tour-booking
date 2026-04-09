"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createVnpayPayment } from "@/lib/client-booking";
import { errorMessage, formatVnd } from "@/lib/format";

type Props = {
  bookingId?: string;
  total?: string;
  email?: string;
};

export default function CheckoutClient({ bookingId, total, email }: Props) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const idNum = bookingId ? Number(bookingId) : NaN;
  const totalNum = total != null && total !== "" ? Number(total) : null;

  async function onPayVnpay() {
    setErr(null);
    if (!Number.isFinite(idNum)) {
      setErr("Thiếu mã booking đơn hàng.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await createVnpayPayment(idNum, email);
      if (!res.ok) {
        setErr(errorMessage(res.body));
        return;
      }
      window.location.href = res.data.paymentUrl;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <h1 className="text-2xl font-bold text-stone-900">Thanh toán</h1>
      <p className="mt-1 text-sm text-stone-600">
        {bookingId ? `Booking #${bookingId} — ` : null}
        Thanh toán qua VNPay (thẻ nội địa, QR, ví).
      </p>

      {err ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {err}
        </div>
      ) : null}

      <div className="mt-8 space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-stone-800">Phương thức</p>
        <div className="flex cursor-default items-center gap-3 rounded-xl border-2 border-teal-600 bg-teal-50/50 p-4">
          <div>
            <p className="font-semibold text-stone-900">VNPay</p>
            <p className="text-xs text-stone-500">Chuyển sang cổng thanh toán VNPay</p>
          </div>
        </div>
        <div className="border-t border-stone-200 pt-4">
          <div className="flex justify-between text-sm">
            <span className="text-stone-600">Tạm tính</span>
            <span className="font-semibold text-stone-900">
              {totalNum != null && Number.isFinite(totalNum) ? formatVnd(totalNum) : "—"}
            </span>
          </div>
        </div>
        <button
          type="button"
          disabled={submitting || !Number.isFinite(idNum)}
          onClick={onPayVnpay}
          className="inline-flex w-full items-center justify-center rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
        >
          {submitting ? "Đang chuyển hướng…" : "Thanh toán VNPay"}
        </button>
      </div>

      <p className="mt-6 text-center text-sm text-stone-500">
        <Link href="/bookings" className="text-teal-700 hover:underline">
          Xem lịch sử đặt vé
        </Link>
      </p>
    </div>
  );
}
