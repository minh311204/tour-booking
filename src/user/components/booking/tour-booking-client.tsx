"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Bus,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Info,
  MapPin,
  Plane,
  Shield,
  Star,
  Train,
  Utensils,
  Users,
  XCircle,
} from "lucide-react";
import type {
  TourDetail,
  TourTransport,
  TourItinerary,
  TourAccommodation,
  TourMeal,
} from "@/lib/api-types";
import { formatVnd, errorMessage } from "@/lib/format";
import { getStoredUserEmail, hasAccessToken } from "@/lib/auth-storage";
import { createBooking, type CreateBookingInput } from "@/lib/client-booking";

/* ══════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════ */
type PassengerForm = { fullName: string; dateOfBirth: string };

type FullSchedule = {
  id: number;
  tourId: number;
  startDate: string;
  endDate: string;
  availableSeats?: number | null;
  bookedSeats?: number | null;
  remainingSeats?: number | null;
  priceOverride?: number | null;
  status?: string | null;
};

function pad2(n: number) { return String(n).padStart(2, "0"); }
function utcYmd(d: Date) { return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth()+1)}-${pad2(d.getUTCDate())}`; }
function utcMonthKey(d: Date) { return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth()+1)}`; }
function formatVnDate(d: Date) { return `${pad2(d.getUTCDate())}/${pad2(d.getUTCMonth()+1)}/${d.getUTCFullYear()}`; }
function formatVnTime(d: Date) { return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`; }
function monthLabel(ym: string) { const [y,m]=ym.split("-"); return `Tháng ${Number(m)}/${y}`; }

function vehicleLabel(v: string) {
  const map: Record<string, string> = {
    CAR_4: "Xe 4 chỗ", CAR_7: "Xe 7 chỗ",
    BUS_16: "Xe 16 chỗ", BUS_29: "Xe 29 chỗ", BUS_45: "Xe 45 chỗ",
    FLIGHT: "Máy bay", TRAIN: "Tàu hỏa", BOAT: "Tàu/Thuyền", CABLE_CAR: "Cáp treo",
  };
  return map[v] ?? v;
}

function mealLabel(m: string) {
  const map: Record<string, string> = {
    BREAKFAST: "Bữa sáng", LUNCH: "Bữa trưa", DINNER: "Bữa tối", SNACK: "Bữa nhẹ",
  };
  return map[m] ?? m;
}

function transportLabel(v?: string | null) {
  if (!v) return "Xe du lịch";
  if (v === "FLIGHT") return "Máy bay";
  if (v === "MIXED") return "Máy bay + Xe";
  if (v === "BUS") return "Xe du lịch";
  return v;
}

function VehicleIcon({ type }: { type: string }) {
  if (type === "FLIGHT") return <Plane className="h-3.5 w-3.5" />;
  if (type === "TRAIN") return <Train className="h-3.5 w-3.5" />;
  return <Bus className="h-3.5 w-3.5" />;
}

/* ══════════════════════════════════════════════
   STEP INDICATOR
══════════════════════════════════════════════ */
const STEP_LABELS = ["Lịch trình & Hành khách", "Thông tin liên hệ", "Xác nhận đặt chỗ"];

function Stepper({ step }: { step: 1 | 2 | 3 }) {
  return (
    <nav className="mb-8">
      <ol className="flex items-start">
        {STEP_LABELS.map((label, i) => {
          const idx = i + 1;
          const done = step > idx;
          const active = step === idx;
          const isLast = idx === STEP_LABELS.length;
          return (
            <li key={label} className="flex flex-1 items-center">
              <div className="flex flex-col items-center">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ring-2 transition-all ${
                  done
                    ? "bg-teal-600 text-white ring-teal-600"
                    : active
                      ? "bg-white text-teal-700 ring-teal-600 shadow-md shadow-teal-100"
                      : "bg-stone-100 text-stone-400 ring-stone-200"
                }`}>
                  {done ? <CheckCircle2 className="h-5 w-5" /> : idx}
                </div>
                <span className={`mt-1.5 hidden text-center text-[11px] font-semibold leading-tight sm:block ${
                  active ? "text-teal-700" : done ? "text-teal-500" : "text-stone-400"
                }`}>
                  {label}
                </span>
              </div>
              {!isLast && (
                <div className={`mx-1 mb-5 h-0.5 flex-1 sm:mx-2 ${step > idx ? "bg-teal-500" : "bg-stone-200"}`} />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ══════════════════════════════════════════════
   TRANSPORT SECTION
══════════════════════════════════════════════ */
function TransportSection({ transports }: { transports: TourTransport[] }) {
  if (!transports.length) return null;
  const sorted = [...transports].sort((a, b) => a.legOrder - b.legOrder);
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
          <Plane className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-stone-900">Phương tiện di chuyển</h3>
          <p className="text-xs text-stone-400">Chi tiết các chặng di chuyển của tour</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {sorted.map((t) => (
          <div key={t.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-sky-100 text-sky-600">
                <VehicleIcon type={t.vehicleType} />
              </div>
              {sorted.indexOf(t) < sorted.length - 1 && (
                <div className="my-1 w-0.5 flex-1 bg-stone-200" />
              )}
            </div>
            <div className="min-w-0 flex-1 pb-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700">
                  {vehicleLabel(t.vehicleType)}
                </span>
                {t.seatClass ? (
                  <span className="rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                    {t.seatClass}
                  </span>
                ) : null}
                {t.estimatedHours ? (
                  <span className="flex items-center gap-1 text-[11px] text-stone-400">
                    <Clock className="h-3 w-3" />
                    ~{t.estimatedHours}h
                  </span>
                ) : null}
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-sm">
                <span className="font-medium text-stone-800">{t.departurePoint}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-stone-400" />
                <span className="font-medium text-stone-800">{t.arrivalPoint}</span>
              </div>
              {t.vehicleDetail ? (
                <p className="mt-0.5 text-xs text-stone-500">{t.vehicleDetail}</p>
              ) : null}
              {t.supplier ? (
                <p className="mt-0.5 text-[11px] text-stone-400">
                  Đơn vị: <span className="font-medium text-stone-600">{t.supplier.name}</span>
                  {t.supplier.phone ? ` · ${t.supplier.phone}` : ""}
                </p>
              ) : null}
              {t.notes ? (
                <p className="mt-1 text-xs italic text-stone-400">{t.notes}</p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   ITINERARY SECTION (with meals & accommodation)
══════════════════════════════════════════════ */
function AccommodationRow({ acc }: { acc: TourAccommodation }) {
  const stars = acc.starRating ? "★".repeat(acc.starRating) : null;
  return (
    <div className="rounded-lg border border-indigo-100 bg-indigo-50/50 p-3">
      <div className="flex items-start gap-2">
        <BedDouble className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-sm text-stone-800">{acc.hotelName}</span>
            {stars ? <span className="text-xs text-amber-500">{stars}</span> : null}
          </div>
          {acc.roomType ? (
            <p className="mt-0.5 text-xs text-stone-500">Phòng: {acc.roomType}</p>
          ) : null}
          {acc.address ? (
            <p className="mt-0.5 text-xs text-stone-400">{acc.address}</p>
          ) : null}
          {(acc.checkInNote || acc.checkOutNote) ? (
            <p className="mt-0.5 text-xs text-stone-400">
              {acc.checkInNote ? `Check-in: ${acc.checkInNote}` : ""}
              {acc.checkInNote && acc.checkOutNote ? " · " : ""}
              {acc.checkOutNote ? `Check-out: ${acc.checkOutNote}` : ""}
            </p>
          ) : null}
          {acc.supplier ? (
            <p className="mt-0.5 text-[11px] text-stone-400">
              Đối tác: <span className="font-medium">{acc.supplier.name}</span>
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function MealRow({ meal }: { meal: TourMeal }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50/50 p-2.5">
      <Utensils className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
      <div className="min-w-0">
        <span className="text-xs font-bold text-amber-800">{mealLabel(meal.mealType)}</span>
        {meal.restaurantName ? (
          <span className="ml-1.5 text-xs text-stone-600">· {meal.restaurantName}</span>
        ) : null}
        {meal.menuStyle ? (
          <p className="mt-0.5 text-[11px] text-stone-500">{meal.menuStyle}</p>
        ) : null}
        {meal.dietaryNotes ? (
          <p className="mt-0.5 text-[11px] italic text-stone-400">{meal.dietaryNotes}</p>
        ) : null}
      </div>
    </div>
  );
}

function ItinerarySection({ itineraries }: { itineraries: TourItinerary[] }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set([1]));
  const sorted = [...itineraries].sort((a, b) => a.dayNumber - b.dayNumber);

  if (!sorted.length) return null;

  function toggle(day: number) {
    setExpanded((prev) => {
      const n = new Set(prev);
      n.has(day) ? n.delete(day) : n.add(day);
      return n;
    });
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
          <Calendar className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-stone-900">Chương trình tour chi tiết</h3>
          <p className="text-xs text-stone-400">Bao gồm nơi lưu trú và bữa ăn từng ngày</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {sorted.map((day) => {
          const open = expanded.has(day.dayNumber);
          const hasMeals = (day.meals?.length ?? 0) > 0;
          const hasAcc = (day.accommodations?.length ?? 0) > 0;

          return (
            <div key={day.id} className="overflow-hidden rounded-xl border border-stone-200">
              <button
                type="button"
                onClick={() => toggle(day.dayNumber)}
                className="flex w-full items-start justify-between gap-3 px-4 py-3 text-left transition hover:bg-stone-50"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
                    {day.dayNumber}
                  </span>
                  <div>
                    <p className="font-semibold text-stone-900 text-sm">
                      Ngày {day.dayNumber}
                      {day.title ? ` — ${day.title}` : ""}
                    </p>
                    {!open ? (
                      <div className="mt-0.5 flex items-center gap-2">
                        {hasMeals ? (
                          <span className="flex items-center gap-1 text-[11px] text-amber-600">
                            <Utensils className="h-3 w-3" />
                            {day.meals!.length} bữa
                          </span>
                        ) : null}
                        {hasAcc ? (
                          <span className="flex items-center gap-1 text-[11px] text-indigo-600">
                            <BedDouble className="h-3 w-3" />
                            {day.accommodations!.length} khách sạn
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
                <ChevronRight className={`h-4 w-4 shrink-0 text-stone-400 transition-transform ${open ? "rotate-90" : ""}`} />
              </button>

              {open ? (
                <div className="border-t border-stone-100 px-4 pb-4 pt-3 space-y-3">
                  {day.description ? (
                    <p className="text-xs leading-relaxed text-stone-600 whitespace-pre-wrap">
                      {day.description}
                    </p>
                  ) : null}

                  {hasAcc ? (
                    <div>
                      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-indigo-600">
                        Lưu trú
                      </p>
                      <div className="space-y-2">
                        {day.accommodations!.map((a) => (
                          <AccommodationRow key={a.id} acc={a} />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {hasMeals ? (
                    <div>
                      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-600">
                        Bữa ăn
                      </p>
                      <div className="space-y-1.5">
                        {day.meals!.map((m) => (
                          <MealRow key={m.id} meal={m} />
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {!day.description && !hasMeals && !hasAcc ? (
                    <p className="text-xs text-stone-400">Chưa có thông tin chi tiết ngày này.</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   PASSENGER ROW
══════════════════════════════════════════════ */
function PassengerRow({
  label, colorClass, index, value, onChange,
}: {
  label: string; colorClass: string; index: number;
  value: PassengerForm; onChange: (v: PassengerForm) => void;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3">
      <div className="flex items-center gap-2 mb-2">
        <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold ${colorClass}`}>
          {label} #{index + 1}
        </span>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600">Họ và tên *</label>
          <input
            type="text"
            value={value.fullName}
            onChange={(e) => onChange({ ...value, fullName: e.target.value })}
            placeholder="Như trên CCCD / hộ chiếu"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-stone-600">Ngày sinh *</label>
          <input
            type="date"
            value={value.dateOfBirth}
            onChange={(e) => onChange({ ...value, dateOfBirth: e.target.value })}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   ORDER SUMMARY SIDEBAR (always visible)
══════════════════════════════════════════════ */
function OrderSummary({
  tour,
  selectedSchedule,
  adults, children, infants,
  unitPrice,
  totalAmount,
}: {
  tour: TourDetail;
  selectedSchedule: FullSchedule | null;
  adults: number; children: number; infants: number;
  unitPrice: number | null;
  totalAmount: number | null;
}) {
  const heroUrl = tour.thumbnailUrl ?? tour.images.find((i) => i.isThumbnail)?.imageUrl ?? tour.images[0]?.imageUrl ?? null;
  const selStart = selectedSchedule ? new Date(selectedSchedule.startDate) : null;
  const selEnd = selectedSchedule ? new Date(selectedSchedule.endDate) : null;
  const remainingSeats = selectedSchedule?.availableSeats != null
    ? Math.max(selectedSchedule.availableSeats - (selectedSchedule.bookedSeats ?? 0), 0) : null;
  const priceChild = unitPrice != null ? unitPrice * 0.5 : null;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      {heroUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={heroUrl} alt="" className="h-32 w-full object-cover" />
      ) : (
        <div className="h-20 bg-gradient-to-br from-teal-600 to-cyan-900" />
      )}

      <div className="p-4">
        <p className="font-bold text-stone-900 line-clamp-2 text-sm leading-snug">{tour.name}</p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-stone-500">
          {tour.durationDays ? (
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-teal-600" />
              {tour.durationDays} ngày {tour.durationDays - 1} đêm
            </span>
          ) : null}
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3 text-teal-600" />
            {tour.destinationLocation?.name ?? "—"}
          </span>
          {tour.ratingAvg ? (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              {tour.ratingAvg.toFixed(1)}
            </span>
          ) : null}
        </div>

        <div className="mt-3 border-t border-stone-100 pt-3">
          {selectedSchedule && selStart && selEnd ? (
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-stone-700">
                <Calendar className="h-3.5 w-3.5 shrink-0 text-teal-600" />
                <span>
                  <strong>{formatVnDate(selStart)}</strong>
                  <span className="text-stone-400"> → </span>
                  <strong>{formatVnDate(selEnd)}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2 text-stone-600">
                <Clock className="h-3.5 w-3.5 shrink-0 text-teal-600" />
                Khởi hành lúc {formatVnTime(selStart)}
              </div>
              {remainingSeats != null && remainingSeats <= 10 ? (
                <div className={`flex items-center gap-1.5 font-semibold ${remainingSeats <= 3 ? "text-red-600" : "text-amber-600"}`}>
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {remainingSeats <= 3 ? `Chỉ còn ${remainingSeats} chỗ!` : `Còn ${remainingSeats} chỗ`}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-stone-300 px-3 py-2 text-center text-xs text-stone-400">
              Chưa chọn lịch khởi hành
            </div>
          )}
        </div>

        {unitPrice != null ? (
          <div className="mt-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-stone-400 mb-2">
              Chi tiết giá
            </p>
            <div className="space-y-1 text-xs">
              {adults > 0 && (
                <div className="flex justify-between gap-2 text-stone-600">
                  <span>{adults} người lớn × {formatVnd(unitPrice)}</span>
                  <span className="font-semibold text-stone-800">{formatVnd(unitPrice * adults)}</span>
                </div>
              )}
              {children > 0 && priceChild != null && (
                <div className="flex justify-between gap-2 text-stone-600">
                  <span>{children} trẻ em × {formatVnd(priceChild)}</span>
                  <span className="font-semibold text-stone-800">{formatVnd(priceChild * children)}</span>
                </div>
              )}
              {infants > 0 && (
                <div className="flex justify-between gap-2 text-stone-600">
                  <span>{infants} em bé × 0đ</span>
                  <span className="font-semibold text-stone-800">0đ</span>
                </div>
              )}
            </div>
            <div className="mt-2 border-t border-stone-200 pt-2 flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700">Tổng cộng</span>
              <span className="text-lg font-extrabold text-teal-700">
                {totalAmount != null ? formatVnd(totalAmount) : "—"}
              </span>
            </div>
            <p className="mt-0.5 text-[10px] text-stone-400">Đã bao gồm thuế và phí dịch vụ</p>
          </div>
        ) : null}

        <div className="mt-3 space-y-1.5">
          {[
            "Xác nhận qua email ngay sau khi đặt",
            "Thanh toán an toàn qua VNPay",
            "Hỗ trợ 24/7 qua hotline",
          ].map((t) => (
            <div key={t} className="flex items-center gap-2 text-[11px] text-stone-500">
              <CheckCircle2 className="h-3 w-3 shrink-0 text-teal-500" />
              {t}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   STEP 1 — Lịch trình & Hành khách
══════════════════════════════════════════════ */
function Step1({
  tour,
  schedules,
  monthKeys,
  activeMonthKey,
  setActiveMonthKey,
  activeDateGroups,
  selectedScheduleId,
  setSelectedScheduleId,
  adults, setAdults,
  children, setChildren,
  infants, setInfants,
  adultP, setAdultP,
  childP, setChildP,
  infantP, setInfantP,
  onNext,
  stepErr,
}: {
  tour: TourDetail;
  schedules: FullSchedule[];
  monthKeys: string[];
  activeMonthKey: string;
  setActiveMonthKey: (k: string) => void;
  activeDateGroups: { ymd: string; dateLabel: string; departures: FullSchedule[] }[];
  selectedScheduleId: number | null;
  setSelectedScheduleId: (id: number) => void;
  adults: number; setAdults: (n: number) => void;
  children: number; setChildren: (n: number) => void;
  infants: number; setInfants: (n: number) => void;
  adultP: PassengerForm[]; setAdultP: React.Dispatch<React.SetStateAction<PassengerForm[]>>;
  childP: PassengerForm[]; setChildP: React.Dispatch<React.SetStateAction<PassengerForm[]>>;
  infantP: PassengerForm[]; setInfantP: React.Dispatch<React.SetStateAction<PassengerForm[]>>;
  onNext: () => void;
  stepErr: string | null;
}) {
  const { transports = [], itineraries = [] } = tour;

  return (
    <div className="space-y-5">
      {/* Transport + Itinerary */}
      {transports.length > 0 && <TransportSection transports={transports} />}
      {itineraries.length > 0 && <ItinerarySection itineraries={itineraries} />}

      {/* Inclusions / Exclusions */}
      {(tour.inclusions || tour.exclusions) ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {tour.inclusions ? (
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-800">Dịch vụ bao gồm</span>
              </div>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-stone-700">{tour.inclusions}</p>
            </div>
          ) : null}
          {tour.exclusions ? (
            <div className="rounded-2xl border border-red-100 bg-red-50/60 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-xs font-bold text-red-800">Không bao gồm</span>
              </div>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-stone-700">{tour.exclusions}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Schedule picker */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
            <Calendar className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">Chọn ngày khởi hành</h3>
            <p className="text-xs text-stone-400">Chọn tháng, sau đó chọn chuyến phù hợp</p>
          </div>
        </div>

        {/* Month tabs */}
        <div className="flex flex-wrap gap-2">
          {monthKeys.map((k) => (
            <button key={k} type="button" onClick={() => setActiveMonthKey(k)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                k === activeMonthKey
                  ? "border-teal-600 bg-teal-600 text-white shadow-sm"
                  : "border-stone-200 bg-white text-stone-600 hover:border-teal-300 hover:bg-teal-50"
              }`}>
              {monthLabel(k)}
            </button>
          ))}
        </div>

        {/* Date groups */}
        <div className="mt-4 space-y-4">
          {activeDateGroups.length === 0 ? (
            <p className="text-sm text-stone-400">Không có lịch trong tháng này.</p>
          ) : (
            activeDateGroups.map((g) => (
              <div key={g.ymd} className="rounded-xl border border-stone-200 bg-stone-50">
                <div className="flex items-center gap-2 border-b border-stone-200 px-4 py-2.5">
                  <Calendar className="h-4 w-4 text-teal-600" />
                  <span className="text-sm font-semibold text-stone-800">Ngày {g.dateLabel}</span>
                </div>
                <div className="flex flex-wrap gap-2 p-3">
                  {g.departures.map((dep) => {
                    const depStart = new Date(dep.startDate);
                    const depEnd = new Date(dep.endDate);
                    const rem = dep.availableSeats != null
                      ? Math.max(dep.availableSeats - (dep.bookedSeats ?? 0), 0) : null;
                    const unitP = dep.priceOverride ?? tour.basePrice ?? null;
                    const isSelected = dep.id === selectedScheduleId;
                    const isSoldOut = rem != null && rem <= 0;

                    return (
                      <button key={dep.id} type="button"
                        disabled={isSoldOut}
                        onClick={() => setSelectedScheduleId(dep.id)}
                        className={`min-w-[170px] flex-1 rounded-xl border p-3 text-left transition ${
                          isSelected
                            ? "border-teal-600 bg-teal-50 ring-1 ring-teal-500 shadow-sm"
                            : isSoldOut
                              ? "cursor-not-allowed border-stone-200 bg-stone-100 opacity-50"
                              : "border-stone-200 bg-white hover:border-teal-300 hover:bg-teal-50"
                        }`}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-teal-600" />
                            <span className="text-sm font-bold text-stone-900">{formatVnTime(depStart)}</span>
                          </div>
                          {isSelected ? (
                            <span className="rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-bold text-white">✓ Chọn</span>
                          ) : null}
                        </div>
                        <div className="mt-2 space-y-0.5">
                          <div className="flex justify-between text-xs text-stone-500">
                            <span>Kết thúc:</span>
                            <span className="font-medium text-stone-700">{formatVnDate(depEnd)}</span>
                          </div>
                          <div className="flex justify-between text-xs text-stone-500">
                            <span>Số chỗ còn:</span>
                            <span className={`font-semibold ${
                              rem == null ? "text-stone-600"
                              : rem === 0 ? "text-red-600"
                              : rem <= 5 ? "text-amber-600"
                              : "text-emerald-600"
                            }`}>
                              {rem == null ? "Liên hệ" : isSoldOut ? "Hết chỗ" : rem}
                            </span>
                          </div>
                          <div className="flex justify-between text-xs text-stone-500">
                            <span>Giá/người:</span>
                            <span className="font-bold text-teal-700">
                              {unitP == null ? "Liên hệ" : formatVnd(unitP)}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Passengers */}
      <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">Số lượng & thông tin hành khách</h3>
            <p className="text-xs text-stone-400">Trẻ em 5–11 tuổi: 50% giá. Em bé dưới 5 tuổi: miễn phí</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: "Người lớn", sub: "≥ 12 tuổi", val: adults, min: 1, set: setAdults, color: "border-blue-200 bg-blue-50 text-blue-800" },
            { label: "Trẻ em", sub: "5–11 tuổi", val: children, min: 0, set: setChildren, color: "border-green-200 bg-green-50 text-green-800" },
            { label: "Em bé", sub: "< 5 tuổi", val: infants, min: 0, set: setInfants, color: "border-orange-200 bg-orange-50 text-orange-800" },
          ].map((item) => (
            <div key={item.label} className={`rounded-xl border p-3 ${item.color}`}>
              <p className="text-xs font-bold">{item.label}</p>
              <p className="text-[11px] opacity-70">{item.sub}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <button type="button"
                  onClick={() => item.set(Math.max(item.min, item.val - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-xl font-bold hover:bg-white shadow-sm">
                  −
                </button>
                <span className="text-2xl font-extrabold">{item.val}</span>
                <button type="button"
                  onClick={() => item.set(Math.min(20, item.val + 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-xl font-bold hover:bg-white shadow-sm">
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          {adultP.map((p, i) => (
            <PassengerRow key={`a-${i}`} label="Người lớn" colorClass="bg-blue-50 text-blue-700"
              index={i} value={p} onChange={(v) => setAdultP((arr) => arr.map((x, j) => j===i?v:x))} />
          ))}
          {childP.map((p, i) => (
            <PassengerRow key={`c-${i}`} label="Trẻ em" colorClass="bg-green-50 text-green-700"
              index={i} value={p} onChange={(v) => setChildP((arr) => arr.map((x, j) => j===i?v:x))} />
          ))}
          {infantP.map((p, i) => (
            <PassengerRow key={`i-${i}`} label="Em bé" colorClass="bg-orange-50 text-orange-700"
              index={i} value={p} onChange={(v) => setInfantP((arr) => arr.map((x, j) => j===i?v:x))} />
          ))}
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs text-blue-800">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Họ tên hành khách phải trùng khớp với CCCD / hộ chiếu khi sử dụng dịch vụ.
        </div>
      </div>

      {stepErr ? (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          {stepErr}
        </div>
      ) : null}

      <div className="flex justify-end">
        <button type="button" onClick={onNext}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-bold text-white shadow-md shadow-teal-200 hover:bg-teal-700 transition">
          Tiếp theo — Thông tin liên hệ
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   STEP 2 — Thông tin liên hệ
══════════════════════════════════════════════ */
function Step2({
  contact, setContact,
  notes, setNotes,
  onBack, onNext,
  stepErr,
}: {
  contact: { fullName: string; email: string; phone: string; address: string };
  setContact: React.Dispatch<React.SetStateAction<{ fullName: string; email: string; phone: string; address: string }>>;
  notes: string; setNotes: (s: string) => void;
  onBack: () => void; onNext: () => void;
  stepErr: string | null;
}) {
  const fields = [
    { key: "fullName", label: "Họ và tên *", type: "text", placeholder: "Như trên CCCD / hộ chiếu" },
    { key: "email", label: "Email nhận xác nhận *", type: "email", placeholder: "email@example.com" },
    { key: "phone", label: "Số điện thoại *", type: "tel", placeholder: "0901 234 567" },
    { key: "address", label: "Địa chỉ (tuỳ chọn)", type: "text", placeholder: "Phường/Xã, Quận/Huyện, Tỉnh/TP" },
  ] as const;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-4 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
            <Users className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">Người đặt tour</h3>
            <p className="text-xs text-stone-400">Thông tin người đại diện nhận xác nhận và liên lạc</p>
          </div>
        </div>

        <div className="space-y-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="mb-1.5 block text-sm font-semibold text-stone-700">{f.label}</label>
              <input
                type={f.type}
                value={contact[f.key]}
                onChange={(e) => setContact((c) => ({ ...c, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm text-stone-900 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 border-b border-stone-100 pb-4 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Info className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-stone-900">Ghi chú / Yêu cầu thêm</h3>
            <p className="text-xs text-stone-400">Dị ứng thức ăn, hỗ trợ xe lăn, phòng đặc biệt...</p>
          </div>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Nhập yêu cầu đặc biệt của bạn nếu có..."
          className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm text-stone-900 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
        />
      </div>

      {/* Cancellation policy */}
      {/* Will show from tour data in parent */}

      {stepErr ? (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          {stepErr}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition">
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </button>
        <button type="button" onClick={onNext}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-bold text-white shadow-md shadow-teal-200 hover:bg-teal-700 transition">
          Xem tóm tắt & Xác nhận
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   STEP 3 — Xác nhận đặt chỗ
══════════════════════════════════════════════ */
function Step3({
  tour,
  selectedSchedule,
  adults, children, infants,
  adultP, childP, infantP,
  contact, notes,
  unitPrice, totalAmount,
  onBack, onSubmit, submitting, submitErr,
  cancellationPolicy,
}: {
  tour: TourDetail;
  selectedSchedule: FullSchedule | null;
  adults: number; children: number; infants: number;
  adultP: PassengerForm[]; childP: PassengerForm[]; infantP: PassengerForm[];
  contact: { fullName: string; email: string; phone: string; address: string };
  notes: string;
  unitPrice: number | null; totalAmount: number | null;
  onBack: () => void; onSubmit: () => void; submitting: boolean;
  submitErr: string | null;
  cancellationPolicy?: string | null;
}) {
  const selStart = selectedSchedule ? new Date(selectedSchedule.startDate) : null;
  const selEnd = selectedSchedule ? new Date(selectedSchedule.endDate) : null;
  const allPassengers = [...adultP, ...childP, ...infantP];
  const priceChild = unitPrice != null ? unitPrice * 0.5 : null;

  return (
    <div className="space-y-5">
      {/* Booking snapshot */}
      <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-teal-100 pb-3 mb-4">
          <CheckCircle2 className="h-5 w-5 text-teal-600" />
          <h3 className="text-sm font-bold text-teal-900">Tóm tắt đặt chỗ — Vui lòng kiểm tra trước khi thanh toán</h3>
        </div>

        <div className="space-y-4 text-sm">
          {/* Tour & schedule */}
          <div className="rounded-xl border border-teal-100 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-teal-600 mb-2">Tour & lịch khởi hành</p>
            <p className="font-bold text-stone-900">{tour.name}</p>
            {selStart && selEnd ? (
              <div className="mt-2 space-y-1 text-stone-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-teal-600" />
                  <span>
                    {formatVnDate(selStart)} <span className="text-stone-400">→</span> {formatVnDate(selEnd)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-teal-600" />
                  <span>Giờ khởi hành: <strong>{formatVnTime(selStart)}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-3.5 w-3.5 text-teal-600" />
                  <span>
                    {tour.departureLocation?.name ?? "—"} <ArrowRight className="inline h-3 w-3 text-stone-400" /> {tour.destinationLocation?.name ?? "—"}
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {/* Passengers */}
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500 mb-2">
              Hành khách ({allPassengers.length} người)
            </p>
            <div className="space-y-1.5">
              {adultP.map((p, i) => (
                <div key={`a-${i}`} className="flex items-center gap-2">
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-700">Người lớn</span>
                  <span className="text-stone-800">{p.fullName}</span>
                  <span className="text-xs text-stone-400">{p.dateOfBirth}</span>
                </div>
              ))}
              {childP.map((p, i) => (
                <div key={`c-${i}`} className="flex items-center gap-2">
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-green-50 text-green-700">Trẻ em</span>
                  <span className="text-stone-800">{p.fullName}</span>
                  <span className="text-xs text-stone-400">{p.dateOfBirth}</span>
                </div>
              ))}
              {infantP.map((p, i) => (
                <div key={`i-${i}`} className="flex items-center gap-2">
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-bold bg-orange-50 text-orange-700">Em bé</span>
                  <span className="text-stone-800">{p.fullName}</span>
                  <span className="text-xs text-stone-400">{p.dateOfBirth}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="rounded-xl border border-stone-200 bg-white p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500 mb-2">Thông tin liên hệ</p>
            <div className="space-y-0.5 text-stone-700">
              <p><strong>{contact.fullName}</strong></p>
              <p className="text-xs">{contact.email}</p>
              <p className="text-xs">{contact.phone}</p>
              {contact.address ? <p className="text-xs text-stone-500">{contact.address}</p> : null}
              {notes ? <p className="mt-1 text-xs italic text-stone-400">Ghi chú: {notes}</p> : null}
            </div>
          </div>

          {/* Price */}
          {unitPrice != null && (
            <div className="rounded-xl border-2 border-teal-300 bg-teal-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-teal-600 mb-2">Chi tiết giá</p>
              <div className="space-y-1 text-sm">
                {adults > 0 && (
                  <div className="flex justify-between text-stone-700">
                    <span>{adults} người lớn × {formatVnd(unitPrice)}</span>
                    <span className="font-semibold">{formatVnd(unitPrice * adults)}</span>
                  </div>
                )}
                {children > 0 && priceChild != null && (
                  <div className="flex justify-between text-stone-700">
                    <span>{children} trẻ em × {formatVnd(priceChild)}</span>
                    <span className="font-semibold">{formatVnd(priceChild * children)}</span>
                  </div>
                )}
                {infants > 0 && (
                  <div className="flex justify-between text-stone-700">
                    <span>{infants} em bé × 0đ</span>
                    <span className="font-semibold">0đ</span>
                  </div>
                )}
                <div className="border-t border-teal-200 mt-2 pt-2 flex items-center justify-between">
                  <span className="font-bold text-stone-900">Tổng cộng</span>
                  <span className="text-2xl font-extrabold text-teal-700">
                    {totalAmount != null ? formatVnd(totalAmount) : "Liên hệ"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancellation policy */}
      {cancellationPolicy ? (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
          <Shield className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-bold text-amber-800">Chính sách hủy tour</p>
            <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-stone-700">{cancellationPolicy}</p>
          </div>
        </div>
      ) : null}

      {submitErr ? (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
          {submitErr}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-3">
        <button type="button" onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition">
          <ArrowLeft className="h-4 w-4" />
          Sửa thông tin
        </button>
        <button type="button" onClick={onSubmit} disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-teal-200 hover:bg-teal-700 disabled:opacity-60 transition">
          <CreditCard className="h-4 w-4" />
          {submitting ? "Đang xử lý…" : "Xác nhận & Thanh toán ngay"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════ */
export default function TourBookingClient({
  tour,
  preselectedScheduleId,
}: {
  tour: TourDetail;
  preselectedScheduleId?: number;
}) {
  const router = useRouter();

  const schedules = useMemo<FullSchedule[]>(() =>
    [...(tour.schedules ?? [])].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) as FullSchedule[],
  [tour.schedules]);

  /* ── auth ── */
  const [mounted, setMounted] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => { setMounted(true); setLoggedIn(hasAccessToken()); }, []);

  /* ── step ── */
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [stepErr, setStepErr] = useState<string | null>(null);

  /* ── schedule ── */
  const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(() => {
    if (preselectedScheduleId) {
      const m = schedules.find((s) => s.id === preselectedScheduleId);
      if (m) return m.id;
    }
    return schedules[0]?.id ?? null;
  });
  useEffect(() => {
    if (!selectedScheduleId && schedules[0]?.id) setSelectedScheduleId(schedules[0].id);
  }, [selectedScheduleId, schedules]);

  const monthKeys = useMemo(() => {
    const k = new Set<string>();
    schedules.forEach((s) => k.add(utcMonthKey(new Date(s.startDate))));
    return [...k].sort();
  }, [schedules]);

  const [activeMonthKey, setActiveMonthKey] = useState(() => {
    const first = schedules[0];
    return first ? utcMonthKey(new Date(first.startDate)) : "";
  });
  useEffect(() => {
    if (!selectedScheduleId) return;
    const s = schedules.find((x) => x.id === selectedScheduleId);
    if (s) setActiveMonthKey(utcMonthKey(new Date(s.startDate)));
  }, [selectedScheduleId, schedules]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, { ymd: string; dateLabel: string; departures: FullSchedule[] }>();
    for (const s of schedules) {
      const d = new Date(s.startDate);
      const ymd = utcYmd(d);
      if (!map.has(ymd)) map.set(ymd, { ymd, dateLabel: formatVnDate(d), departures: [] as FullSchedule[] });
      map.get(ymd)!.departures.push(s);
    }
    return [...map.values()].sort((a,b)=>new Date(a.departures[0].startDate).getTime()-new Date(b.departures[0].startDate).getTime());
  }, [schedules]);

  const activeDateGroups = useMemo(() =>
    groupedByDate.filter((g) => utcMonthKey(new Date(g.departures[0].startDate)) === activeMonthKey),
  [groupedByDate, activeMonthKey]);

  const selectedSchedule = useMemo<FullSchedule | null>(() =>
    selectedScheduleId ? schedules.find((s) => s.id === selectedScheduleId) ?? null : null,
  [selectedScheduleId, schedules]);

  /* ── passengers ── */
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [adultP, setAdultP] = useState<PassengerForm[]>([{ fullName: "", dateOfBirth: "" }]);
  const [childP, setChildP] = useState<PassengerForm[]>([]);
  const [infantP, setInfantP] = useState<PassengerForm[]>([]);

  useEffect(() => { setAdultP((p) => Array.from({ length: adults }, (_, i) => p[i] ?? { fullName: "", dateOfBirth: "" })); }, [adults]);
  useEffect(() => { setChildP((p) => Array.from({ length: children }, (_, i) => p[i] ?? { fullName: "", dateOfBirth: "" })); }, [children]);
  useEffect(() => { setInfantP((p) => Array.from({ length: infants }, (_, i) => p[i] ?? { fullName: "", dateOfBirth: "" })); }, [infants]);

  /* ── contact ── */
  const storedEmail = useMemo(() => getStoredUserEmail(), []);
  const [contact, setContact] = useState({ fullName: "", email: storedEmail ?? "", phone: "", address: "" });
  const [notes, setNotes] = useState("");

  /* ── price ── */
  const unitPrice = selectedSchedule?.priceOverride ?? tour.basePrice ?? null;
  const totalAmount = unitPrice != null
    ? unitPrice * adults + (unitPrice * 0.5) * children
    : null;

  /* ── submit ── */
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);

  /* ── step nav ── */
  function goToStep2() {
    setStepErr(null);
    if (!selectedScheduleId) { setStepErr("Vui lòng chọn lịch khởi hành."); return; }
    const allP = [...adultP, ...childP, ...infantP];
    if (allP.some((p) => !p.fullName.trim() || !p.dateOfBirth)) {
      setStepErr("Vui lòng điền đầy đủ họ tên và ngày sinh cho tất cả hành khách."); return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToStep3() {
    setStepErr(null);
    if (!contact.fullName.trim() || !contact.email.trim() || !contact.phone.trim()) {
      setStepErr("Vui lòng điền đầy đủ họ tên, email và số điện thoại."); return;
    }
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goBack() {
    setStepErr(null);
    setStep((s) => (s > 1 ? (s - 1 as 1 | 2 | 3) : 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function onSubmit() {
    setSubmitErr(null);
    setSubmitting(true);
    try {
      const payload: CreateBookingInput = {
        tourScheduleId: selectedScheduleId!,
        contact: {
          fullName: contact.fullName.trim(),
          email: contact.email.trim(),
          phone: contact.phone.trim(),
          address: contact.address.trim() || undefined,
        },
        passengerCounts: { adults, children, infants },
        passengers: [
          ...adultP.map((p) => ({ fullName: p.fullName.trim(), dateOfBirth: p.dateOfBirth, ageCategory: "ADULT" as const })),
          ...childP.map((p) => ({ fullName: p.fullName.trim(), dateOfBirth: p.dateOfBirth, ageCategory: "CHILD" as const })),
          ...infantP.map((p) => ({ fullName: p.fullName.trim(), dateOfBirth: p.dateOfBirth, ageCategory: "INFANT" as const })),
        ],
        notes: notes.trim() || undefined,
      };
      const res = await createBooking(payload);
      if (!res.ok) { setSubmitErr(errorMessage(res.body)); return; }
      const totalParam = res.data.totalAmount == null ? "" : encodeURIComponent(String(res.data.totalAmount));
      const emailParam = encodeURIComponent(payload.contact.email);
      router.push(`/checkout?bookingId=${res.data.id}&total=${totalParam}&email=${emailParam}`);
    } finally {
      setSubmitting(false);
    }
  }

  /* ── no schedules ── */
  if (!schedules.length) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <AlertCircle className="mx-auto h-12 w-12 text-amber-400" />
        <h1 className="mt-4 text-xl font-bold text-stone-900">Chưa có lịch khởi hành</h1>
        <p className="mt-2 text-sm text-stone-500">Tour này hiện chưa có lịch khởi hành. Vui lòng quay lại sau.</p>
        <Link href={`/tours/${tour.id}`}
          className="mt-6 inline-block rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">
          ← Quay lại tour
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ── Page header ── */}
      <div className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4 sm:px-6">
          <Link href={`/tours/${tour.id}`}
            className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-teal-700 transition">
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </Link>
          <ChevronRight className="h-4 w-4 text-stone-300" />
          <span className="line-clamp-1 text-sm font-medium text-stone-700">{tour.name}</span>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Stepper step={step} />

        <div className="grid gap-6 lg:grid-cols-3">
          {/* ── MAIN CONTENT ── */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <Step1
                tour={tour}
                schedules={schedules}
                monthKeys={monthKeys}
                activeMonthKey={activeMonthKey}
                setActiveMonthKey={setActiveMonthKey}
                activeDateGroups={activeDateGroups}
                selectedScheduleId={selectedScheduleId}
                setSelectedScheduleId={setSelectedScheduleId}
                adults={adults} setAdults={setAdults}
                children={children} setChildren={setChildren}
                infants={infants} setInfants={setInfants}
                adultP={adultP} setAdultP={setAdultP}
                childP={childP} setChildP={setChildP}
                infantP={infantP} setInfantP={setInfantP}
                onNext={goToStep2}
                stepErr={stepErr}
              />
            )}
            {step === 2 && (
              <>
                {tour.cancellationPolicy ? (
                  <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 shadow-sm">
                    <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-xs font-bold text-amber-800">Chính sách hủy tour</p>
                      <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-stone-700">{tour.cancellationPolicy}</p>
                    </div>
                  </div>
                ) : null}
                <Step2
                  contact={contact} setContact={setContact}
                  notes={notes} setNotes={setNotes}
                  onBack={goBack} onNext={goToStep3}
                  stepErr={stepErr}
                />
              </>
            )}
            {step === 3 && (
              <Step3
                tour={tour}
                selectedSchedule={selectedSchedule}
                adults={adults} children={children} infants={infants}
                adultP={adultP} childP={childP} infantP={infantP}
                contact={contact} notes={notes}
                unitPrice={unitPrice} totalAmount={totalAmount}
                onBack={goBack} onSubmit={onSubmit}
                submitting={submitting} submitErr={submitErr}
                cancellationPolicy={tour.cancellationPolicy}
              />
            )}

            {mounted && !loggedIn && step === 2 ? (
              <p className="mt-3 text-center text-xs text-stone-500">
                Bạn đặt không cần đăng nhập.{" "}
                <Link href="/login" className="font-semibold text-teal-600 hover:underline">Đăng nhập</Link>
                {" "}để quản lý đặt chỗ dễ hơn.
              </p>
            ) : null}
          </div>

          {/* ── SIDEBAR ── */}
          <div className="lg:col-span-1">
            <div className="sticky top-20">
              <OrderSummary
                tour={tour}
                selectedSchedule={selectedSchedule}
                adults={adults} children={children} infants={infants}
                unitPrice={unitPrice} totalAmount={totalAmount}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
