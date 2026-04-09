"use client";

import { useEffect, useMemo, useState } from "react";
import { Star } from "lucide-react";
import Link from "next/link";
import { upsertTourReview, fetchTourReviews, deleteMyTourReview } from "@/lib/client-tour-reviews";
import type { TourReview } from "@/lib/api-types";
import { AUTH_KEYS } from "@/lib/auth-storage";
import { errorMessage } from "@/lib/format";
import { Trash2 } from "lucide-react";

export default function TourReviews({
  tourId,
  initialRatingAvg,
  initialTotalReviews,
}: {
  tourId: number;
  initialRatingAvg?: number | null;
  initialTotalReviews?: number | null;
}) {
  const [reviews, setReviews] = useState<TourReview[]>([]);
  const [ratingAvg, setRatingAvg] = useState<number | null>(
    initialRatingAvg ?? null,
  );
  const [totalReviews, setTotalReviews] = useState<number | null>(
    initialTotalReviews ?? null,
  );

  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const stars = useMemo(() => [1, 2, 3, 4, 5], []);

  useEffect(() => {
    const token = localStorage.getItem(AUTH_KEYS.accessToken);
    setIsAuthed(token != null);
    // Decode userId from JWT payload
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentUserId(payload.sub ?? payload.id ?? null);
      } catch {
        setCurrentUserId(null);
      }
    }
    void (async () => {
      const res = await fetchTourReviews(tourId);
      if (res.ok) setReviews(res.data);
    })();
  }, [tourId]);

  async function reload() {
    const res = await fetchTourReviews(tourId);
    if (res.ok) setReviews(res.data);
  }

  async function onDeleteReview() {
    if (!confirm("Xoá đánh giá của bạn?")) return;
    setDeleting(true);
    try {
      const res = await deleteMyTourReview(tourId);
      if (!res.ok) {
        setErr(errorMessage(res.body));
        return;
      }
      setRatingAvg(res.data.tour.ratingAvg);
      setTotalReviews(res.data.tour.totalReviews);
      await reload();
    } finally {
      setDeleting(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const trimmed = comment.trim();
      const res = await upsertTourReview(
        tourId,
        rating,
        trimmed.length ? trimmed : null,
      );
      if (!res.ok) {
        setErr(errorMessage(res.body));
        return;
      }

      setRatingAvg(res.data.tour.ratingAvg);
      setTotalReviews(res.data.tour.totalReviews);
      await reload();
      setComment("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-stone-900">Đánh giá tour</h2>
          <p className="mt-1 text-sm text-stone-600">
            {ratingAvg != null ? ratingAvg.toFixed(1) : "—"} ★
            {totalReviews != null ? ` (${totalReviews} đánh giá)` : ""}
          </p>
        </div>
        {!isAuthed ? (
          <div className="text-sm text-stone-600">
            Bạn cần <Link href="/login" className="font-semibold text-teal-700 hover:underline">đăng nhập</Link> để đánh giá.
          </div>
        ) : null}
      </div>

      {reviews.length === 0 ? (
        <p className="text-sm text-stone-500">Chưa có đánh giá cho tour này.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      {stars.map((n) => (
                        <Star
                          key={n}
                          className={
                            n <= r.rating
                              ? "h-4 w-4 fill-yellow-500 text-yellow-500"
                              : "h-4 w-4 text-stone-300"
                          }
                        />
                      ))}
                    </div>
                    <span className="text-sm font-semibold text-stone-900">
                      {r.rating}/5
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-stone-800">
                    {(r.user.firstName || r.user.lastName)
                      ? `${r.user.firstName ?? ""} ${r.user.lastName ?? ""}`.trim()
                      : "Khách"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-stone-500">
                    {r.createdAtUtc ? new Date(r.createdAtUtc).toLocaleDateString() : ""}
                  </div>
                  {currentUserId != null && r.userId === currentUserId ? (
                    <button
                      type="button"
                      onClick={onDeleteReview}
                      disabled={deleting}
                      title="Xoá đánh giá"
                      className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>
              {r.comment ? (
                <p className="mt-2 whitespace-pre-wrap text-sm text-stone-700">
                  {r.comment}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {isAuthed ? (
        <form
          onSubmit={onSubmit}
          className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
        >
          {err ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
              {err}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-stone-900">
                Chấm điểm:
              </span>
              <div className="flex items-center gap-1">
                {stars.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className="rounded-full p-1 hover:bg-stone-50"
                  >
                    <Star
                      className={
                        n <= rating
                          ? "h-6 w-6 fill-yellow-500 text-yellow-500"
                          : "h-6 w-6 text-stone-300"
                      }
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="text-sm text-stone-600">
              {loading ? "Đang gửi..." : " "}
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-1 block text-sm font-medium text-stone-700">
              Nội dung (tuỳ chọn)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={1000}
              className="w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              placeholder="Chia sẻ trải nghiệm của bạn..."
            />
            <p className="mt-1 text-xs text-stone-500">
              {comment.trim().length}/1000
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            Gửi đánh giá
          </button>
        </form>
      ) : null}
    </section>
  );
}

