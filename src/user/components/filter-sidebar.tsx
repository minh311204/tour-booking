"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

type LocationOption = { id: number; name: string };
type ProvinceOption = { id: number; name: string };

export type FilterSidebarProps = {
  provinceId: number;
  provinces: ProvinceOption[];
  departureLocations: LocationOption[];
  initial: {
    budget: string;
    departureLocationId: string;
    departureDate: string;
    tourLine: string;
    transportType: string;
  };
};

const BUDGET_OPTIONS = [
  { value: "under_5m", label: "Dưới 5 triệu" },
  { value: "5_10m", label: "Từ 5 - 10 triệu" },
  { value: "10_20m", label: "Từ 10 - 20 triệu" },
  { value: "over_20m", label: "Trên 20 triệu" },
] as const;

const TOUR_LINE_OPTIONS = [
  { value: "PREMIUM", label: "Cao cấp" },
  { value: "STANDARD", label: "Tiêu chuẩn" },
  { value: "ECONOMY", label: "Tiết kiệm" },
  { value: "GOOD_VALUE", label: "Giá Tốt" },
  { value: "ESG_LEI", label: "ESG & LEI" },
] as const;

const TRANSPORT_OPTIONS = [
  { value: "BUS", label: "Xe" },
  { value: "FLIGHT", label: "Máy bay" },
] as const;

const WEEKDAYS = ["Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7", "CN"] as const;

/* ─── Helpers ───────────────────────────────────────────────── */
function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function todayYmd(): string {
  return toYmd(new Date());
}

function formatVnDate(ymd: string): string {
  if (!ymd) return "";
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd);
  if (!m) return ymd;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const dn = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"][d.getDay()];
  const mn = ["thg 1","thg 2","thg 3","thg 4","thg 5","thg 6","thg 7","thg 8","thg 9","thg 10","thg 11","thg 12"][d.getMonth()];
  return `${dn}, ${d.getDate()} ${mn}, ${d.getFullYear()}`;
}

function mondayIndex(d: Date) {
  return (d.getDay() + 6) % 7;
}

function daysInMonth(y: number, m: number) {
  return new Date(y, m + 1, 0).getDate();
}

/* ─── SearchSelect ───────────────────────────────────────────── */
type SearchSelectOption = { value: string; label: string };

function SearchSelect({
  options,
  value,
  onChange,
  placeholder = "Tìm kiếm...",
  allLabel = "Tất cả",
}: {
  options: SearchSelectOption[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  allLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!q.trim()) return options;
    const lq = q.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
    return options.filter((o) => {
      const lv = o.label.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
      return lv.includes(lq);
    });
  }, [options, q]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const selectedLabel = value === "" ? allLabel : (options.find((o) => o.value === value)?.label ?? allLabel);

  return (
    <div ref={wrapRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setQ(""); }}
        className="flex w-full items-center justify-between rounded-md border border-stone-300 bg-white px-3 py-2.5 text-left text-sm text-stone-800 transition hover:border-[#0b5ea8]"
        aria-expanded={open}
      >
        <span className="truncate">{selectedLabel}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-stone-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Panel */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-stone-200 bg-white shadow-lg">
          {/* Search input */}
          <div className="flex items-center gap-2 border-b border-stone-100 px-3 py-2">
            <input
              autoFocus
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-stone-400"
            />
            <ChevronDown className="h-4 w-4 shrink-0 text-stone-400" />
          </div>

          {/* List */}
          <ul className="max-h-52 overflow-y-auto">
            <li>
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-sky-50 ${value === "" ? "bg-sky-50 font-semibold text-[#0b5ea8]" : "text-stone-700"}`}
              >
                {allLabel}
              </button>
            </li>
            {filtered.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => { onChange(opt.value); setOpen(false); }}
                  className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-sky-50 ${
                    value === opt.value
                      ? "bg-sky-50 font-semibold text-[#0b5ea8]"
                      : "text-stone-700"
                  }`}
                >
                  {opt.label}
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-stone-400">Không tìm thấy</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─── MiniCalendar ───────────────────────────────────────────── */
function MiniCalendar({
  value,
  onChange,
}: {
  value: string;
  onChange: (ymd: string) => void;
}) {
  const today = todayYmd();

  const baseYear = value ? Number(value.slice(0, 4)) : new Date().getFullYear();
  const baseMonth = value ? Number(value.slice(5, 7)) - 1 : new Date().getMonth();

  const [viewYear, setViewYear] = useState(baseYear);
  const [viewMonth, setViewMonth] = useState(baseMonth);

  useEffect(() => {
    if (value) {
      setViewYear(Number(value.slice(0, 4)));
      setViewMonth(Number(value.slice(5, 7)) - 1);
    }
  }, [value]);

  const cells = useMemo(() => {
    const first = new Date(viewYear, viewMonth, 1);
    const pad = mondayIndex(first);
    const dim = daysInMonth(viewYear, viewMonth);
    const out: (Date | null)[] = [];
    for (let i = 0; i < pad; i++) out.push(null);
    for (let d = 1; d <= dim; d++) out.push(new Date(viewYear, viewMonth, d));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [viewYear, viewMonth]);

  function prevMonth() {
    setViewMonth((m) => { if (m === 0) { setViewYear((y) => y - 1); return 11; } return m - 1; });
  }
  function nextMonth() {
    setViewMonth((m) => { if (m === 11) { setViewYear((y) => y + 1); return 0; } return m + 1; });
  }

  return (
    <div className="mt-2 rounded-md border border-stone-200 bg-white p-2">
      {/* Header */}
      <div className="mb-1.5 flex items-center justify-between">
        <button type="button" onClick={prevMonth} className="rounded p-1 hover:bg-stone-100" aria-label="Tháng trước">
          <ChevronLeft className="h-4 w-4 text-stone-500" />
        </button>
        <span className="text-xs font-semibold text-stone-800">
          Tháng {viewMonth + 1} - {viewYear}
        </span>
        <button type="button" onClick={nextMonth} className="rounded p-1 hover:bg-stone-100" aria-label="Tháng sau">
          <ChevronRight className="h-4 w-4 text-stone-500" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center text-[10px] font-medium">
        {WEEKDAYS.map((wd) => (
          <span key={wd} className={`py-0.5 ${wd === "CN" ? "text-red-500" : "text-stone-500"}`}>
            {wd}
          </span>
        ))}
      </div>

      {/* Days */}
      <div className="mt-0.5 grid grid-cols-7 gap-y-0.5 text-center">
        {cells.map((date, i) => {
          if (!date) return <span key={`e${i}`} />;
          const ymd = toYmd(date);
          const isPast = ymd < today;
          const isSelected = ymd === value;
          const isToday = ymd === today;
          const isSunday = date.getDay() === 0;

          return (
            <button
              key={ymd}
              type="button"
              disabled={isPast}
              onClick={() => onChange(ymd === value ? "" : ymd)}
              className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-[11px] transition-colors
                ${isPast ? "cursor-not-allowed text-stone-300" : ""}
                ${isSelected ? "bg-[#0b5ea8] font-bold text-white" : ""}
                ${!isSelected && isToday ? "font-bold text-[#0b5ea8] ring-1 ring-[#0b5ea8]" : ""}
                ${!isSelected && !isPast && isSunday ? "text-red-500 hover:bg-stone-100" : ""}
                ${!isSelected && !isPast && !isSunday ? "text-stone-700 hover:bg-stone-100" : ""}
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── DateField ─────────────────────────────────────────────── */
function DateField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function handleSelect(ymd: string) {
    onChange(ymd);
    if (ymd) setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative border-b border-[#e8e8e8] py-3">
      <p className="mb-2 text-[13px] font-bold text-stone-900">Ngày đi</p>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-md border border-stone-300 bg-white px-3 py-2.5 text-left text-sm transition hover:border-[#0b5ea8]"
        aria-expanded={open}
      >
        <span className={value ? "text-stone-800" : "text-stone-400"}>
          {value ? formatVnDate(value) : "Chọn ngày..."}
        </span>
        <div className="flex items-center gap-1">
          {value && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onChange(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onChange(""); } }}
              className="text-xs text-stone-400 hover:text-red-500"
              aria-label="Xóa ngày"
            >
              ✕
            </span>
          )}
          <ChevronDown className={`h-4 w-4 text-stone-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Calendar dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border border-stone-200 bg-white shadow-lg">
          <MiniCalendar value={value} onChange={handleSelect} />
        </div>
      )}
    </div>
  );
}

/* ─── FilterSidebar ──────────────────────────────────────────── */
export function FilterSidebar({
  provinceId,
  provinces,
  departureLocations,
  initial,
}: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [budget, setBudget] = useState(initial.budget);
  const [departureLocationId, setDepartureLocationId] = useState(initial.departureLocationId);
  const [selectedProvinceId, setSelectedProvinceId] = useState(String(provinceId));
  const [departureDate, setDepartureDate] = useState(initial.departureDate);
  const [tourLine, setTourLine] = useState(initial.tourLine);
  const [transportType, setTransportType] = useState(initial.transportType);

  useEffect(() => {
    setBudget(initial.budget);
    setDepartureLocationId(initial.departureLocationId);
    setSelectedProvinceId(String(provinceId));
    setDepartureDate(initial.departureDate);
    setTourLine(initial.tourLine);
    setTransportType(initial.transportType);
  }, [provinceId, initial.budget, initial.departureLocationId, initial.departureDate, initial.tourLine, initial.transportType]);

  const handleApply = useCallback(() => {
    const targetId = selectedProvinceId || String(provinceId);
    const qs = new URLSearchParams();
    if (budget) qs.set("budget", budget);
    if (departureLocationId) qs.set("departureLocationId", departureLocationId);
    if (departureDate) qs.set("departureDate", departureDate);
    if (tourLine) qs.set("tourLine", tourLine);
    if (transportType) qs.set("transportType", transportType);
    const sort = searchParams.get("sortBy");
    if (sort) qs.set("sortBy", sort);
    const q = searchParams.get("q");
    if (q) qs.set("q", q);
    const query = qs.toString();
    router.push(`/favorites/${targetId}${query ? `?${query}` : ""}`);
  }, [budget, departureLocationId, departureDate, tourLine, transportType, provinceId, selectedProvinceId, router, searchParams]);

  const pill = (active: boolean) =>
    `rounded border px-2 py-2 text-center text-xs font-semibold transition-colors ${
      active
        ? "border-[#0b5ea8] bg-[#0b5ea8] text-white"
        : "border-[#d7d7d7] bg-white text-stone-700 hover:border-[#0b5ea8] hover:bg-sky-50 hover:text-[#0b5ea8]"
    }`;

  const departureOptions: SearchSelectOption[] = departureLocations.map((l) => ({
    value: String(l.id),
    label: l.name,
  }));

  const provinceOptions: SearchSelectOption[] = provinces.map((p) => ({
    value: String(p.id),
    label: p.name,
  }));

  return (
    <aside className="rounded-md border border-[#d6d6d6] bg-[#f5f5f5] p-4">
      {/* Ngân sách */}
      <div className="border-b border-[#e8e8e8] pb-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[13px] font-bold text-stone-900">Ngân sách</p>
          {budget ? (
            <button type="button" onClick={() => setBudget("")} className="text-xs font-medium text-[#0b5ea8] hover:underline">
              Xóa
            </button>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {BUDGET_OPTIONS.map((b) => (
            <button
              key={b.value}
              type="button"
              onClick={() => setBudget((prev) => (prev === b.value ? "" : b.value))}
              className={pill(budget === b.value)}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Điểm khởi hành */}
      <div className="border-b border-[#e8e8e8] py-3">
        <p className="mb-2 text-[13px] font-bold text-stone-900">Điểm khởi hành</p>
        <SearchSelect
          options={departureOptions}
          value={departureLocationId}
          onChange={setDepartureLocationId}
          allLabel="Tất cả"
        />
      </div>

      {/* Điểm đến */}
      <div className="border-b border-[#e8e8e8] py-3">
        <p className="mb-2 text-[13px] font-bold text-stone-900">Điểm đến</p>
        <SearchSelect
          options={provinceOptions}
          value={selectedProvinceId}
          onChange={setSelectedProvinceId}
          allLabel="Tất cả"
        />
      </div>

      {/* Ngày đi */}
      <DateField value={departureDate} onChange={setDepartureDate} />

      {/* Dòng tour */}
      <div className="border-b border-[#e8e8e8] py-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[13px] font-bold text-stone-900">Dòng tour</p>
          {tourLine ? (
            <button type="button" onClick={() => setTourLine("")} className="text-xs font-medium text-[#0b5ea8] hover:underline">
              Xóa
            </button>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {TOUR_LINE_OPTIONS.map((tl) => (
            <button
              key={tl.value}
              type="button"
              onClick={() => setTourLine((prev) => (prev === tl.value ? "" : tl.value))}
              className={pill(tourLine === tl.value)}
            >
              {tl.label}
            </button>
          ))}
        </div>
      </div>

      {/* Phương tiện */}
      <div className="py-3">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[13px] font-bold text-stone-900">Phương tiện</p>
          {transportType ? (
            <button type="button" onClick={() => setTransportType("")} className="text-xs font-medium text-[#0b5ea8] hover:underline">
              Xóa
            </button>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {TRANSPORT_OPTIONS.map((tr) => (
            <button
              key={tr.value}
              type="button"
              onClick={() => setTransportType((prev) => (prev === tr.value ? "" : tr.value))}
              className={pill(transportType === tr.value)}
            >
              {tr.label}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={handleApply}
        className="mt-2 w-full rounded bg-[#0b5ea8] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#084f8f]"
      >
        Áp dụng
      </button>
    </aside>
  );
}
