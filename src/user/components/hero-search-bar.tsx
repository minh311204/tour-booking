"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import type { ProvinceRow } from "@/lib/server-api";
import { API_BASE_URL } from "@/lib/server-api";

const ACCENT = "#0060B1";
const SUNDAY_RED = "#dc2626";
/** Đồng bộ với header / CTA */

/** Theo mockup: nhãn đen, phụ / placeholder xám ~#999999 */
const LABEL_CLASS =
  "text-[0.8125rem] font-semibold leading-tight tracking-tight text-black";
const SUBTEXT_MUTED =
  "block w-full min-w-0 min-h-5 truncate whitespace-nowrap text-left text-[0.8125rem] font-normal leading-5 text-[#999999]";
const SUBTEXT_VALUE =
  "block w-full min-w-0 min-h-5 truncate whitespace-nowrap text-left text-[0.8125rem] font-normal leading-5 text-neutral-900";

const BUDGET_OPTIONS = [
  { value: "", label: "Chọn mức giá" },
  { value: "under_5m", label: "Dưới 5 triệu" },
  { value: "5_10m", label: "Từ 5 - 10 triệu" },
  { value: "10_20m", label: "Từ 10 - 20 triệu" },
  { value: "over_20m", label: "Trên 20 triệu" },
] as const;

const WEEKDAY_LABELS = ["Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "CN"] as const;

/** Hai dòng placeholder luân phiên (gõ từ trái sang phải). */
const DESTINATION_PLACEHOLDER_CYCLE = [
  "Khám phá cuộc phiêu lưu tiếp theo của bạn - tìm kiếm bất kỳ điểm đến nào bạn yêu thích!",
  "ví dụ: Đà Nẵng, Phú Quốc, Hà Nội, Hội An",
] as const;

const TYPE_MS = 32;
const DELETE_MS = 18;
const PAUSE_MS = 2600;

function useDestinationTypewriter(active: boolean) {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    if (!active) {
      setDisplay("");
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    let strIdx = 0;
    let pos = 0;
    let phase: "typing" | "pause" | "deleting" = "typing";

    const currentStr = () => DESTINATION_PLACEHOLDER_CYCLE[strIdx];

    const schedule = (ms: number, fn: () => void) => {
      timeoutId = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
    };

    const tick = () => {
      if (cancelled) return;
      const str = currentStr();

      if (phase === "typing") {
        if (pos < str.length) {
          pos += 1;
          setDisplay(str.slice(0, pos));
          schedule(TYPE_MS, tick);
        } else {
          phase = "pause";
          schedule(PAUSE_MS, () => {
            if (cancelled) return;
            phase = "deleting";
            tick();
          });
        }
      } else if (phase === "deleting") {
        if (pos > 0) {
          pos -= 1;
          setDisplay(str.slice(0, pos));
          schedule(DELETE_MS, tick);
        } else {
          strIdx = (strIdx + 1) % DESTINATION_PLACEHOLDER_CYCLE.length;
          phase = "typing";
          tick();
        }
      }
    };

    tick();

    return () => {
      cancelled = true;
      if (timeoutId !== undefined) clearTimeout(timeoutId);
    };
  }, [active]);

  return display;
}

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

/** yyyy-mm-dd (local) */
function toYmd(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function parseYmd(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const day = Number(m[3]);
  const d = new Date(y, mo, day);
  if (d.getFullYear() !== y || d.getMonth() !== mo || d.getDate() !== day) return null;
  return d;
}

/** Hiển thị: CN, 29 thg 3, 2026 */
function formatVnLongDate(ymd: string): string {
  const d = parseYmd(ymd);
  if (!d) return "";
  const w = d.getDay();
  const dayNames = ["CN", "Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7"];
  const dn = dayNames[w];
  const months = [
    "thg 1",
    "thg 2",
    "thg 3",
    "thg 4",
    "thg 5",
    "thg 6",
    "thg 7",
    "thg 8",
    "thg 9",
    "thg 10",
    "thg 11",
    "thg 12",
  ];
  return `${dn}, ${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
}

/** Tháng 3 - 2026 */
function formatMonthYear(year: number, monthIndex: number): string {
  return `Tháng ${monthIndex + 1} - ${year}`;
}

function daysInMonth(year: number, monthIndex: number) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Thứ 2 đầu tuần = 0 … Chủ nhật = 6 */
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}


function useFixedPopoverRect(
  open: boolean,
  anchorRef: RefObject<HTMLElement | null>,
) {
  const [rect, setRect] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const update = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const margin = 8;
    const maxW = 320;
    const w = Math.min(Math.max(r.width, 260), maxW);
    let left = r.left;
    left = Math.max(margin, Math.min(left, window.innerWidth - w - margin));
    setRect({
      top: r.bottom + margin,
      left,
      width: w,
    });
  }, [anchorRef]);

  useLayoutEffect(() => {
    if (!open) {
      setRect(null);
      return;
    }
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, update]);

  return rect;
}

type HeroSearchBarProps = {
  className?: string;
};

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof body?.message === "string" ? body.message : "Đã có lỗi xảy ra",
    );
  }
  return body as T;
}

function stripDiacritics(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function normalizeKey(s: string) {
  return stripDiacritics(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

const REGION_FOLDERS = [
  "Miền Bắc",
  "Miền Trung",
  "Miền Đông Nam Bộ",
  "Miền Tây Nam Bộ",
] as const;

function candidateProvinceThumbs(provinceName: string): string[] {
  const raw = provinceName.trim();
  if (!raw) return [];
  const base = raw.toUpperCase();
  const extCandidates = ["jpg", "webp", "png"] as const;

  const out: string[] = [];
  for (const folder of REGION_FOLDERS) {
    for (const ext of extCandidates) {
      out.push(
        `/assets/images/${encodeURIComponent(folder)}/${encodeURIComponent(base)}.${ext}`,
      );
    }
  }
  for (const ext of extCandidates) {
    out.push(`/assets/images/${encodeURIComponent(base)}.${ext}`);
  }

  return out;
}

function ProvinceImg({ name }: { name: string }) {
  const candidates = candidateProvinceThumbs(name);
  const [idx, setIdx] = useState(0);
  const failed = idx >= candidates.length;

  return (
    <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded bg-stone-100">
      {!failed && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          key={idx}
          src={candidates[idx]}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setIdx((i) => i + 1)}
        />
      )}
      <span
        className="absolute inset-0 flex items-center justify-center text-stone-500"
        style={{ visibility: failed ? "visible" : "hidden" }}
      >
        📍
      </span>
    </span>
  );
}

export function HeroSearchBar({ className }: HeroSearchBarProps) {
  const router = useRouter();
  const destId = useId();
  const [mounted, setMounted] = useState(false);
  const [destination, setDestination] = useState("");
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | null>(
    null,
  );
  const [destFocused, setDestFocused] = useState(false);
  const [budget, setBudget] = useState<string>("");
  const [selectedYmd, setSelectedYmd] = useState("");

  const [dateOpen, setDateOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const dateWrapRef = useRef<HTMLDivElement>(null);
  const datePopoverRef = useRef<HTMLDivElement>(null);
  const budgetWrapRef = useRef<HTMLDivElement>(null);
  const budgetPopoverRef = useRef<HTMLDivElement>(null);
  const destWrapRef = useRef<HTMLDivElement>(null);
  const destPopoverRef = useRef<HTMLDivElement>(null);

  const todayYmd = useMemo(() => toYmd(new Date()), []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const view = useMemo(() => {
    const base = selectedYmd ? parseYmd(selectedYmd) : new Date();
    return {
      year: base?.getFullYear() ?? new Date().getFullYear(),
      monthIndex: base?.getMonth() ?? new Date().getMonth(),
    };
  }, [selectedYmd]);

  const [viewYear, setViewYear] = useState(view.year);
  const [viewMonthIndex, setViewMonthIndex] = useState(view.monthIndex);

  useEffect(() => {
    setViewYear(view.year);
    setViewMonthIndex(view.monthIndex);
  }, [view.year, view.monthIndex]);

  const datePopoverRect = useFixedPopoverRect(dateOpen, dateWrapRef);
  const budgetPopoverRect = useFixedPopoverRect(budgetOpen, budgetWrapRef);
  const destPopoverRect = useFixedPopoverRect(destOpen, destWrapRef);

  useEffect(() => {
    if (!dateOpen) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (dateWrapRef.current?.contains(t)) return;
      if (datePopoverRef.current?.contains(t)) return;
      setDateOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [dateOpen]);

  useEffect(() => {
    if (!budgetOpen) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (budgetWrapRef.current?.contains(t)) return;
      if (budgetPopoverRef.current?.contains(t)) return;
      setBudgetOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [budgetOpen]);

  useEffect(() => {
    if (!destOpen) return;
    function onDoc(e: MouseEvent) {
      const t = e.target as Node;
      if (destWrapRef.current?.contains(t)) return;
      if (destPopoverRef.current?.contains(t)) return;
      setDestOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [destOpen]);

  // Suggestions: Provinces (Điểm đến)
  const [provinceSuggestions, setProvinceSuggestions] = useState<ProvinceRow[]>(
    [],
  );
  const [allProvinces, setAllProvinces] = useState<ProvinceRow[] | null>(null);
  const [destLoading, setDestLoading] = useState(false);
  const [destErr, setDestErr] = useState<string | null>(null);

  useEffect(() => {
    if (!destOpen) return;
    const q = destination.trim();
    if (!q) {
      setProvinceSuggestions([]);
      setDestErr(null);
      setDestLoading(false);
      return;
    }

    const ac = new AbortController();
    let cancelled = false;
    setDestLoading(true);
    setDestErr(null);

    void (async () => {
      try {
        const provinces =
          allProvinces ??
          (await fetchJson<ProvinceRow[]>(
            `${API_BASE_URL}/locations/provinces`,
            ac.signal,
          ));

        if (cancelled) return;
        if (!allProvinces) setAllProvinces(provinces);

        const base = provinces.filter((p) => (p.name ?? "").trim().length > 0);
        const needle = normalizeKey(q);
        const matches = base
          .map((p) => ({
            p,
            score: p.name ? normalizeKey(p.name).includes(needle) : false,
          }))
          .filter((x) => x.score)
          .map((x) => x.p)
          .slice(0, 6);

        setProvinceSuggestions(matches);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof Error && e.name === "AbortError") return;
        setDestErr(e instanceof Error ? e.message : "Đã có lỗi xảy ra");
        setProvinceSuggestions([]);
      } finally {
        if (cancelled) return;
        setDestLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, [destOpen, destination, allProvinces]);

  const calendarCells = useMemo(() => {
    const first = new Date(viewYear, viewMonthIndex, 1);
    const startPad = mondayIndex(first);
    const dim = daysInMonth(viewYear, viewMonthIndex);
    const cells: { key: string; date: Date | null; inMonth: boolean }[] = [];
    for (let i = 0; i < startPad; i++) {
      cells.push({ key: `pad-${i}`, date: null, inMonth: false });
    }
    for (let day = 1; day <= dim; day++) {
      cells.push({
        key: `d-${day}`,
        date: new Date(viewYear, viewMonthIndex, day),
        inMonth: true,
      });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ key: `trail-${cells.length}`, date: null, inMonth: false });
    }
    return cells;
  }, [viewYear, viewMonthIndex]);

  const goPrevMonth = useCallback(() => {
    setViewMonthIndex((m) => {
      if (m === 0) {
        setViewYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const goNextMonth = useCallback(() => {
    setViewMonthIndex((m) => {
      if (m === 11) {
        setViewYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const provinceId = selectedProvinceId;
    if (provinceId != null) {
      const qs = new URLSearchParams();
      if (budget) qs.set("budget", budget);
      if (selectedYmd) qs.set("departureDate", selectedYmd);
      const query = qs.toString();
      router.push(`/favorites/${provinceId}${query ? `?${query}` : ""}`);
      return;
    }
    // Nếu user chưa chọn điểm đến từ dropdown thì bỏ qua.
  }

  const budgetLabel =
    BUDGET_OPTIONS.find((b) => b.value === budget)?.label ?? "Chọn mức giá";

  const dateLabel = selectedYmd ? formatVnLongDate(selectedYmd) : "Chọn ngày";

  const showDestTypewriter =
    mounted && !destination.trim() && !destFocused;
  const destTypewriterText = useDestinationTypewriter(showDestTypewriter);

  return (
    <form
      onSubmit={onSearch}
      className={["relative overflow-visible", className].filter(Boolean).join(" ")}
      aria-label="Tìm kiếm tour"
    >
      <div className="flex min-h-[3.75rem] flex-col overflow-visible rounded-3xl border border-stone-200/90 bg-white shadow-[0_10px_40px_rgba(15,23,42,0.12)] sm:min-h-[4.25rem] sm:flex-row sm:items-stretch sm:rounded-[1.75rem]">
        {/* Điểm đến — cùng layout nhãn + 1 dòng giá trị với Ngày đi / Ngân sách */}
        <div
          ref={destWrapRef}
          className="flex min-w-0 flex-1 flex-col justify-center gap-1 border-b border-stone-200/90 px-5 py-3.5 sm:border-b-0 sm:px-6 sm:py-3.5"
        >
          <label
            htmlFor={destId}
            className={`block w-full shrink-0 ${LABEL_CLASS}`}
          >
            Bạn muốn đi đâu?{" "}
            <span className="font-semibold text-[#ff0000]" aria-hidden>
              *
            </span>
          </label>
          <div className="relative min-h-5 w-full overflow-hidden">
            {showDestTypewriter ? (
              <span
                className="pointer-events-none absolute inset-y-0 left-0 z-0 flex max-w-full items-center whitespace-nowrap text-[0.8125rem] leading-5 text-[#999999]"
                aria-hidden
              >
                {destTypewriterText}
                <span className="ml-px inline-block h-3.5 w-px shrink-0 animate-pulse bg-[#999999]" />
              </span>
            ) : null}
            <input
              id={destId}
              name="q"
              type="search"
              autoComplete="off"
              value={destination}
              onChange={(e) => {
                const v = e.target.value;
                setDestination(v);
                setSelectedProvinceId(null);
                setDestOpen(Boolean(v.trim()));
              }}
              onFocus={() => {
                setDestFocused(true);
                setDateOpen(false);
                setBudgetOpen(false);
                setDestOpen(Boolean(destination.trim()));
              }}
              onBlur={() => setDestFocused(false)}
              aria-label="Điểm đến hoặc từ khóa tìm kiếm"
              placeholder={showDestTypewriter ? undefined : "Tìm điểm đến…"}
              className={
                "relative z-10 h-5 min-w-0 w-full border-0 bg-transparent p-0 text-[0.8125rem] leading-5 caret-neutral-800 focus:outline-none focus:ring-0 whitespace-nowrap " +
                (showDestTypewriter
                  ? "text-transparent placeholder:text-transparent"
                  : "text-black placeholder:text-[#999999]")
              }
            />
          </div>
        </div>

        {mounted &&
          destOpen &&
          destination.trim() &&
          destPopoverRect &&
          createPortal(
            <div
              ref={destPopoverRef}
              className="fixed z-[210] max-h-[min(30rem,calc(100vh-2rem))] overflow-y-auto rounded-xl border border-stone-200/90 bg-white p-3 shadow-xl"
              style={{
                top: destPopoverRect.top,
                left: destPopoverRect.left,
                width: Math.min(destPopoverRect.width + 180, 520),
              }}
              role="dialog"
              aria-label="Gợi ý điểm đến"
            >
              {destErr ? (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
                  {destErr}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="px-1 text-xs font-semibold text-stone-700">
                      Điểm đến
                    </p>
                    <div className="mt-2 overflow-hidden rounded-lg border border-stone-200">
                      {destLoading && provinceSuggestions.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-stone-500">
                          Đang tải…
                        </div>
                      ) : provinceSuggestions.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-stone-500">
                          Không có gợi ý điểm đến.
                        </div>
                      ) : (
                        <ul className="divide-y divide-stone-100">
                          {provinceSuggestions.map((p) => (
                            <li key={p.id}>
                              <button
                                type="button"
                                className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-stone-50"
                                onClick={() => {
                                  setDestination(p.name ?? "");
                                  setSelectedProvinceId(p.id);
                                  setDestOpen(false);
                                }}
                              >
                                <ProvinceImg name={p.name ?? ""} />
                                <span className="font-semibold text-[#0b5ea8]">
                                  {p.name ?? `Tỉnh/TP #${p.id}`}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>,
            document.body,
          )}

        <div
          className="hidden shrink-0 self-center sm:block sm:h-[2.875rem] sm:w-px sm:bg-stone-200/95"
          aria-hidden
        />

        {/* Ngày đi — độ rộng cố định trên desktop; popover absolute, không đẩy layout */}
        <div
          ref={dateWrapRef}
          className="relative z-10 flex min-h-0 min-w-0 flex-col justify-center border-b border-stone-200/90 sm:w-[min(100%,15.5rem)] sm:shrink-0 sm:border-b-0 lg:w-[17rem]"
        >
          <button
            type="button"
            onClick={() => {
              setBudgetOpen(false);
              setDateOpen((o) => !o);
            }}
            className="flex w-full flex-1 items-center gap-2 px-5 py-3.5 text-left sm:px-6 sm:py-3.5"
            aria-expanded={dateOpen}
            aria-haspopup="dialog"
          >
            <span className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left">
              <span className={`block w-full shrink-0 ${LABEL_CLASS}`}>
                Ngày đi
              </span>
              <span
                className={
                  selectedYmd ? SUBTEXT_VALUE : SUBTEXT_MUTED
                }
              >
                {dateLabel}
              </span>
            </span>
            <ChevronDown
              className={`h-[1.125rem] w-[1.125rem] shrink-0 text-[#999999] transition-transform ${dateOpen ? "rotate-180" : ""}`}
              aria-hidden
              strokeWidth={2}
            />
          </button>

        </div>

        {mounted &&
          dateOpen &&
          datePopoverRect &&
          createPortal(
            <div
              ref={datePopoverRef}
              className="fixed z-[200] max-h-[min(28rem,calc(100vh-2rem))] overflow-y-auto rounded-xl border border-stone-200/90 bg-white p-3 shadow-xl"
              style={{
                top: datePopoverRect.top,
                left: datePopoverRect.left,
                width: datePopoverRect.width,
              }}
              role="dialog"
              aria-label="Chọn ngày đi"
            >
              <div className="mb-2 flex items-center justify-between gap-2 px-1">
                <button
                  type="button"
                  onClick={goPrevMonth}
                  className="rounded-full p-1.5 text-stone-600 hover:bg-stone-100"
                  aria-label="Tháng trước"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <p className="text-center text-sm font-semibold text-stone-900">
                  {formatMonthYear(viewYear, viewMonthIndex)}
                </p>
                <button
                  type="button"
                  onClick={goNextMonth}
                  className="rounded-full p-1.5 text-stone-600 hover:bg-stone-100"
                  aria-label="Tháng sau"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-0.5 text-center text-[11px] font-medium">
                {WEEKDAY_LABELS.map((wd, i) => (
                  <div
                    key={wd}
                    className="py-1"
                    style={{
                      color: i === 6 ? SUNDAY_RED : "#374151",
                      fontWeight: i === 6 ? 700 : 500,
                    }}
                  >
                    {wd}
                  </div>
                ))}
                {calendarCells.map((cell) => {
                  if (!cell.date) {
                    return (
                      <div key={cell.key} className="aspect-square p-0.5" />
                    );
                  }
                  const ymd = toYmd(cell.date);
                  const isSelected = selectedYmd === ymd;
                  const isToday = ymd === todayYmd;
                  const isSunday = cell.date.getDay() === 0;
                  return (
                    <div key={cell.key} className="aspect-square p-0.5">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedYmd(ymd);
                          setDateOpen(false);
                        }}
                        className="flex h-full w-full items-center justify-center rounded-md text-sm font-medium transition"
                        style={{
                          backgroundColor: isSelected ? ACCENT : "transparent",
                          color: isSelected
                            ? "#ffffff"
                            : isSunday
                              ? SUNDAY_RED
                              : "#1f2937",
                          textDecoration: isToday && !isSelected ? "underline" : undefined,
                          textUnderlineOffset: 2,
                        }}
                      >
                        {cell.date.getDate()}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>,
            document.body,
          )}

        <div
          className="hidden shrink-0 self-center sm:block sm:h-[2.875rem] sm:w-px sm:bg-stone-200/95"
          aria-hidden
        />

        {/* Ngân sách — độ rộng cố định trên desktop, dropdown portal */}
        <div
          ref={budgetWrapRef}
          className="relative z-10 flex min-h-0 min-w-0 flex-col justify-center border-b border-stone-200/90 sm:w-[min(100%,15.5rem)] sm:shrink-0 sm:border-b-0 lg:w-[17rem]"
        >
          <button
            type="button"
            onClick={() => {
              setDateOpen(false);
              setBudgetOpen((o) => !o);
            }}
            className="flex w-full flex-1 items-center gap-2 px-5 py-3.5 text-left sm:px-6 sm:py-3.5"
            aria-expanded={budgetOpen}
            aria-haspopup="listbox"
          >
            <span className="flex min-w-0 flex-1 flex-col items-start gap-1 text-left">
              <span className={`block w-full shrink-0 ${LABEL_CLASS}`}>
                Ngân sách
              </span>
              <span className={budget ? SUBTEXT_VALUE : SUBTEXT_MUTED}>
                {budgetLabel}
              </span>
            </span>
            <ChevronDown
              className={`h-[1.125rem] w-[1.125rem] shrink-0 text-[#999999] transition-transform ${budgetOpen ? "rotate-180" : ""}`}
              aria-hidden
              strokeWidth={2}
            />
          </button>
        </div>

        {mounted &&
          budgetOpen &&
          budgetPopoverRect &&
          createPortal(
            <div
              ref={budgetPopoverRef}
              className="fixed z-[200] max-h-[min(24rem,calc(100vh-2rem))] overflow-y-auto rounded-xl border border-stone-200/90 bg-white p-3 shadow-xl"
              style={{
                top: budgetPopoverRect.top,
                left: budgetPopoverRect.left,
                width: budgetPopoverRect.width,
              }}
              role="listbox"
              aria-label="Chọn ngân sách"
            >
              <ul className="space-y-2">
                {BUDGET_OPTIONS.filter((o) => o.value !== "").map((opt) => (
                  <li key={opt.value}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={budget === opt.value}
                      onClick={() => {
                        setBudget(opt.value);
                        setBudgetOpen(false);
                      }}
                      className={
                        "w-full rounded-lg border border-stone-200 px-3 py-2.5 text-left text-sm text-stone-900 transition " +
                        (budget === opt.value
                          ? "border-[#0060B1] bg-sky-50/80"
                          : "hover:border-stone-300 hover:bg-stone-50")
                      }
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>,
            document.body,
          )}

        {/* Tìm — cột phải bo khớp thanh, nút trắng nổi, hover brand */}
        <div className="flex shrink-0 self-stretch items-center justify-center border-t border-stone-200/90 bg-stone-100/90 px-3 py-3 sm:min-w-[4.25rem] sm:border-t-0 sm:border-l sm:border-stone-200/90 sm:px-3 sm:py-3 sm:rounded-r-[1.75rem]">
          <button
            type="submit"
            className="group inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ring-stone-200/90 transition hover:bg-sky-50/90 hover:shadow-md hover:ring-[#0194f3]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0194f3]/45 focus-visible:ring-offset-2 active:scale-[0.96] sm:h-12 sm:w-12"
            aria-label="Tìm kiếm"
          >
            <Search
              className="h-[1.125rem] w-[1.125rem] text-stone-500 transition group-hover:text-[#0194f3]"
              strokeWidth={2.25}
              aria-hidden
            />
          </button>
        </div>
      </div>
    </form>
  );
}
