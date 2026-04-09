"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Bus,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  MapPin,
  Tag,
  Users,
  Utensils,
} from "lucide-react";
import type { TourDetail } from "@/lib/api-types";
import { formatVnd } from "@/lib/format";
import { WishlistButton } from "./wishlist-button";
import { trackBehavior } from "@/lib/client-preference";
import TourReviews from "./tour-reviews";

/* ────────────────── helpers ────────────────── */

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function utcYmd(d: Date) {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function formatVnDate(d: Date) {
  return `${pad2(d.getUTCDate())}/${pad2(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

function formatDmDate(d: Date) {
  return `${pad2(d.getUTCDate())}-${pad2(d.getUTCMonth() + 1)}-${d.getUTCFullYear()}`;
}

function formatPriceK(price: number): string {
  const k = Math.round(price / 1000);
  return `${k.toLocaleString("vi-VN")}K`;
}

function transportLabel(v?: string | null): string {
  if (!v) return "Đang cập nhật";
  if (v === "FLIGHT" || v === "PLANE") return "Máy bay";
  if (v === "BUS" || v === "CAR") return "Xe";
  if (v === "MIXED") return "Máy bay, Xe";
  if (v === "TRAIN") return "Tàu hỏa";
  if (v === "BOAT") return "Tàu/Thuyền";
  return v;
}

function durationLabel(days?: number | null): string {
  if (!days) return "Đang cập nhật";
  return `${days}N${Math.max(days - 1, 0)}Đ`;
}

type Schedule = TourDetail["schedules"][number];

/* ────────────────── calendar ────────────────── */

type CalendarCell = { day: number; currentMonth: boolean; ymd: string };

const WEEKDAYS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;

function buildCalendarGrid(year: number, month: number): CalendarCell[] {
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0));
  const mondayOffset = (firstDay.getUTCDay() + 6) % 7;

  const cells: CalendarCell[] = [];

  const prevEnd = new Date(Date.UTC(year, month - 1, 0)).getUTCDate();
  for (let i = mondayOffset - 1; i >= 0; i--) {
    const d = prevEnd - i;
    const m = month === 1 ? 12 : month - 1;
    const y = month === 1 ? year - 1 : year;
    cells.push({ day: d, currentMonth: false, ymd: `${y}-${pad2(m)}-${pad2(d)}` });
  }

  for (let d = 1; d <= lastDay.getUTCDate(); d++) {
    cells.push({ day: d, currentMonth: true, ymd: `${year}-${pad2(month)}-${pad2(d)}` });
  }

  const rows = Math.ceil(cells.length / 7);
  const total = rows * 7;
  const nm = month === 12 ? 1 : month + 1;
  const ny = month === 12 ? year + 1 : year;
  for (let d = 1; cells.length < total; d++) {
    cells.push({ day: d, currentMonth: false, ymd: `${ny}-${pad2(nm)}-${pad2(d)}` });
  }

  return cells;
}

/* ────────────────── types ────────────────── */

type TabKey = "overview" | "schedule" | "itinerary" | "notes" | "others" | "reviews";

const TABS: { key: TabKey; label: string }[] = [
  { key: "overview", label: "Tổng quan" },
  { key: "schedule", label: "Lịch khởi hành" },
  { key: "itinerary", label: "Lịch trình" },
  { key: "notes", label: "Lưu ý" },
  { key: "others", label: "Chương trình khác" },
  { key: "reviews", label: "Đánh giá" },
];

/* ════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════ */

export default function TourDetailClient({ tour }: { tour: TourDetail }) {
  /* ── images ── */
  const allImages = useMemo(() => {
    const imgs = tour.images.map((i) => i.imageUrl);
    if (tour.thumbnailUrl && !imgs.includes(tour.thumbnailUrl)) imgs.unshift(tour.thumbnailUrl);
    return imgs;
  }, [tour.images, tour.thumbnailUrl]);

  const [mainImgIdx, setMainImgIdx] = useState(0);

  /* ── schedules ── */
  const schedules = useMemo(
    () => [...(tour.schedules ?? [])].sort((a, b) => +new Date(a.startDate) - +new Date(b.startDate)),
    [tour.schedules],
  );

  const scheduleDateMap = useMemo(() => {
    const map = new Map<string, { minPrice: number; schedules: Schedule[] }>();
    for (const s of schedules) {
      const ymd = utcYmd(new Date(s.startDate));
      const price = s.priceOverride ?? (tour.basePrice as number | null) ?? 0;
      if (!map.has(ymd)) map.set(ymd, { minPrice: price, schedules: [] });
      const e = map.get(ymd)!;
      e.schedules.push(s);
      if (price < e.minPrice) e.minPrice = price;
    }
    return map;
  }, [schedules, tour.basePrice]);

  const availableMonths = useMemo(() => {
    const s = new Set<string>();
    for (const sc of schedules) {
      const d = new Date(sc.startDate);
      s.add(`${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`);
    }
    return [...s].sort();
  }, [schedules]);

  /* ── calendar state ── */
  const [calMonth, setCalMonth] = useState(() => {
    if (schedules[0]) {
      const d = new Date(schedules[0].startDate);
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
    }
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() + 1 };
  });

  const calCells = useMemo(() => buildCalendarGrid(calMonth.year, calMonth.month), [calMonth]);

  const goPrev = useCallback(() => {
    setCalMonth((c) => (c.month === 1 ? { year: c.year - 1, month: 12 } : { ...c, month: c.month - 1 }));
  }, []);
  const goNext = useCallback(() => {
    setCalMonth((c) => (c.month === 12 ? { year: c.year + 1, month: 1 } : { ...c, month: c.month + 1 }));
  }, []);

  /* ── selected date / schedule ── */
  const [selDate, setSelDate] = useState<string | null>(null);
  const [selSchedId, setSelSchedId] = useState<number | null>(null);

  const selDateScheds = useMemo(
    () => (selDate ? scheduleDateMap.get(selDate)?.schedules ?? [] : []),
    [selDate, scheduleDateMap],
  );

  const selSchedule = useMemo(
    () => (selSchedId != null ? schedules.find((s) => s.id === selSchedId) ?? null : null),
    [selSchedId, schedules],
  );

  function pickDate(ymd: string) {
    const e = scheduleDateMap.get(ymd);
    if (!e || !e.schedules.length) return;
    setSelDate(ymd);
    setSelSchedId(e.schedules[0].id);
    scheduleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function clearDate() {
    setSelDate(null);
    setSelSchedId(null);
  }

  /* ── itineraries ── */
  const itineraries = useMemo(
    () => [...tour.itineraries].sort((a, b) => a.dayNumber - b.dayNumber),
    [tour.itineraries],
  );
  /** Mặc định tất cả ngày đều đóng; chỉ mở khi người dùng bấm */
  const [openItinId, setOpenItinId] = useState<number | null>(null);

  /* ── notes accordion ── */
  const [openNoteIdx, setOpenNoteIdx] = useState<number | null>(null);
  const isFlight = tour.transportType === "FLIGHT";
  const defaultInclusions = isFlight
    ? "- Xe tham quan (15, 25, 35, 45 chỗ tùy theo số lượng khách) theo chương trình\n- Vé máy bay khứ hồi\n- Khách sạn tiêu chuẩn 2 khách/phòng hoặc 3 khách/phòng\n- Các bữa ăn theo chương trình\n- Vé tham quan theo chương trình\n- Hướng dẫn viên tiếng Việt nối tuyến\n- Bảo hiểm du lịch với mức bồi thường cao nhất 120.000.000đ/vụ\n- Nón Vietravel + Nước suối + Khăn lạnh\n- Thuế VAT"
    : "- Xe tham quan (16, 29, 35, 45 chỗ tùy theo số lượng khách) theo chương trình\n- Khách sạn tiêu chuẩn 2 khách/phòng hoặc 3 khách/phòng\n- Vé tham quan theo chương trình\n- Ăn theo chương trình tiêu chuẩn từ 100.000 ~ 130.000 vnđ/bữa\n- Hướng dẫn viên tiếng Việt nối tuyến\n- Bảo hiểm du lịch với mức bồi thường cao nhất 120.000.000đ/vụ\n- Nón Vietravel + Nước suối + Khăn lạnh\n- Thuế VAT";

  const NOTE_ITEMS = [
    {
      label: "Giá tour bao gồm",
      content: tour.inclusions?.trim() || defaultInclusions,
    },
    {
      label: "Lưu ý về chuyển hoặc hủy tour",
      content: "- Sau khi đóng tiền, nếu Quý khách muốn chuyển/hủy tour xin vui lòng mang Vé Du Lịch đến văn phòng đăng ký tour để làm thủ tục chuyển/hủy tour và chịu mất phí theo quy định của Vietravel. Không giải quyết các trường hợp liên hệ chuyển/hủy tour qua điện thoại.\n- Thời gian hủy chuyến du lịch được tính cho ngày làm việc, không tính thứ 7, Chủ Nhật và các ngày Lễ, Tết.",
    },
    {
      label: "Giá tour không bao gồm",
      content: tour.exclusions?.trim() || (isFlight
        ? "- Chi phí cá nhân: ăn uống ngoài chương trình, giặt ủi, chi phí hủy đổi hành trình và nâng hạng chuyến bay, hành lý quá cước, phụ thu phòng đơn,…\n- Tham quan ngoài chương trình"
        : "- Chi phí cá nhân: ăn uống ngoài chương trình, giặt ủi, hành lý quá cước, phụ thu phòng đơn,…\n- Tham quan ngoài chương trình"),
    },
    {
      label: "Các điều kiện hủy tour đối với ngày thường",
      content: "- Được chuyển sang các tuyến du lịch khác trước ngày khởi hành 20 ngày: Không mất chi phí.\n- Nếu hủy hoặc chuyển sang các chuyến du lịch khác ngay sau khi đăng ký từ 15–19 ngày trước ngày khởi hành: Chi phí hủy tour: 50% tiền cọc tour.\n- Nếu hủy hoặc chuyển sang các chuyến du lịch khác từ 12–14 ngày trước ngày khởi hành: Chi phí hủy tour: 100% tiền cọc tour.\n- Nếu hủy chuyến du lịch trong vòng từ 08–11 ngày trước ngày khởi hành: Chi phí hủy tour: 50% trên giá tour du lịch.\n- Nếu hủy chuyến du lịch trong vòng từ 05–07 ngày trước ngày khởi hành: Chi phí hủy tour: 70% trên giá tour du lịch.\n- Nếu hủy chuyến du lịch trong vòng từ 02–04 ngày trước ngày khởi hành: Chi phí hủy tour: 90% trên giá tour du lịch.\n- Nếu hủy chuyến du lịch trong vòng 1 ngày trước ngày khởi hành: Chi phí hủy tour: 100% trên giá tour du lịch.",
    },
    {
      label: "Lưu ý giá trẻ em",
      content: "- Trẻ em dưới 5 tuổi: không thu phí dịch vụ, bố mẹ tự lo cho bé và thanh toán các chi phí phát sinh (đối với các dịch vụ tính phí theo chiều cao…). Hai người lớn chỉ được kèm 1 trẻ em dưới 5 tuổi, trẻ em thứ 2 sẽ đóng phí theo quy định dành cho độ tuổi từ 5 đến dưới 12 tuổi và phụ thu phòng đơn. Vé máy bay, tàu hỏa, phương tiện vận chuyển công cộng mua vé theo quy định của các đơn vị vận chuyển.\n- Trẻ em từ 5 tuổi đến dưới 12 tuổi: 75% giá tour người lớn (không có chế độ giường riêng). Hai người lớn chỉ được kèm 1 trẻ em từ 5 – dưới 12 tuổi, em thứ hai trở lên phải mua 1 suất giường đơn.\n- Trẻ em từ 12 tuổi trở lên: mua một vé như người lớn.\n- Vé máy bay phải mua theo quy định của từng hãng hàng không.",
    },
    {
      label: "Các điều kiện hủy tour đối với ngày lễ, Tết",
      content: "- Được chuyển sang các tuyến du lịch khác trước ngày khởi hành 30 ngày: Không mất chi phí.\n- Nếu hủy hoặc chuyển sang các chuyến du lịch khác ngay sau khi đăng ký từ 25–29 ngày trước ngày khởi hành: Chi phí hủy tour: 50% tiền cọc tour.\n- Nếu hủy hoặc chuyển sang các chuyến du lịch khác từ 20–24 ngày trước ngày khởi hành: Chi phí hủy tour: 100% tiền cọc tour.\n- Nếu hủy chuyến du lịch trong vòng từ 17–19 ngày trước ngày khởi hành: Chi phí hủy tour: 50% trên giá tour du lịch.\n- Nếu hủy chuyến du lịch trong vòng từ 08–16 ngày trước ngày khởi hành: Chi phí hủy tour: 70% trên giá tour du lịch.\n- Nếu hủy chuyến du lịch trong vòng từ 02–07 ngày trước ngày khởi hành: Chi phí hủy tour: 90% trên giá tour du lịch.\n- Nếu hủy chuyến du lịch trong vòng 1 ngày trước ngày khởi hành: Chi phí hủy tour: 100% trên giá tour du lịch.",
    },
    {
      label: "Điều kiện thanh toán",
      content: "- Khi đăng ký đặt cọc 50% số tiền tour.\n- Số tiền còn lại thanh toán hết trước ngày khởi hành 7–10 ngày (áp dụng tour ngày thường), trước ngày khởi hành 20–25 ngày (áp dụng tour lễ tết).",
    },
    {
      label: "Trường hợp bất khả kháng",
      content: "- Nếu chương trình du lịch bị hủy bỏ hoặc thay đổi bởi một trong hai bên vì lý do bất khả kháng (hỏa hoạn, thời tiết, tai nạn, thiên tai, chiến tranh, dịch bệnh, hoãn, dời và hủy chuyến hoặc thay đổi khác của các phương tiện vận chuyển công cộng hoặc các sự kiện bất khả kháng khác theo quy định pháp luật…), thì hai bên sẽ không chịu bất kỳ nghĩa vụ bồi hoàn các tổn thất đã xảy ra và không chịu bất kỳ trách nhiệm pháp lý nào. Tuy nhiên mỗi bên có trách nhiệm cố gắng tối đa để giúp đỡ bên bị thiệt hại nhằm giảm thiểu các tổn thất gây ra vì lý do bất khả kháng.",
    },
    {
      label: "Điều kiện đăng ký",
      content: "- Khi đăng ký vui lòng cung cấp giấy tờ tùy thân tất cả người đi: Căn cước công dân/Hộ chiếu (Passport)/Giấy khai sinh (trẻ em dưới 14 tuổi). Trong trường hợp đăng ký trực tuyến vui lòng nhập tên chính xác theo thứ tự: Họ/tên lót/tên xuất vé máy bay.\n- Quy định giấy tờ tùy thân khi đi tour:\n  • Khách quốc tịch Việt Nam: Trẻ em dưới 14 tuổi cần đem theo Giấy khai sinh bản chính/Hộ chiếu bản chính còn giá trị sử dụng. Trẻ em từ 14 tuổi trở lên và Người lớn cần đem theo căn cước công dân/Hộ chiếu bản chính còn giá trị sử dụng.\n  • Khách quốc tịch nước ngoài hoặc là Việt kiều: Vui lòng mang theo hộ chiếu bản chính (Passport) hoặc thẻ xanh kèm thị thực nhập cảnh còn giá trị sử dụng.\n- Giờ nhận phòng khách sạn: sau 14:00 giờ và trả phòng trước 12:00 giờ.\n- Khách nữ từ 55 tuổi trở lên và khách nam từ 60 trở lên: nên có người thân dưới 55 tuổi đi cùng. Riêng khách từ 70 tuổi trở lên: Bắt buộc phải có người thân dưới 55 tuổi đi cùng và nộp kèm giấy khám sức khỏe có xác nhận đủ sức khỏe của bác sĩ.\n- Quý khách đang mang thai vui lòng báo cho nhân viên bán tour ngay tại thời điểm đăng ký và phải có ý kiến của bác sĩ trước khi đi tour.\n- Thông tin hành lý: Xách tay dưới 7kg/khách. Ký gửi: 20kg/khách.\n- Thông tin tập trung: Tại sân bay Tân Sơn Nhất, Ga đi trong nước, trước giờ bay 2 tiếng (ngày thường), trước 2 tiếng 30 phút (Lễ Tết).",
    },
    {
      label: "Liên hệ",
      content: "Tổng đài Vietravel: 1800-646-888 (08:00 – 23:00)\n\nTrụ sở Vietravel: 190 Pasteur, Phường Xuân Hoà, Tp. Hồ Chí Minh",
    },
  ];

  /* ── tabs ── */
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const overviewRef = useRef<HTMLDivElement>(null);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const itineraryRef = useRef<HTMLDivElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);
  const othersRef = useRef<HTMLDivElement>(null);
  const reviewsRef = useRef<HTMLDivElement>(null);

  const tabRefs: Record<TabKey, React.RefObject<HTMLDivElement | null>> = {
    overview: overviewRef,
    schedule: scheduleRef,
    itinerary: itineraryRef,
    notes: notesRef,
    others: othersRef,
    reviews: reviewsRef,
  };

  function scrollTab(t: TabKey) {
    setActiveTab(t);
    tabRefs[t].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ── fixed tab bar (replaces site header when scrolled past gallery) ── */
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [showFixedTabs, setShowFixedTabs] = useState(false);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowFixedTabs(!entry.isIntersecting),
      { threshold: 0, rootMargin: "-1px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    document.body.classList.toggle("tour-detail-tabs-visible", showFixedTabs);
    return () => document.body.classList.remove("tour-detail-tabs-visible");
  }, [showFixedTabs]);

  // Track lượt xem tour
  useEffect(() => {
    void trackBehavior(tour.id, "view");
  }, [tour.id]);

  /* ── price helpers ── */
  const basePrice = tour.basePrice ?? null;
  const displayPrice = selSchedule?.priceOverride ?? basePrice;
  const remaining =
    selSchedule && selSchedule.availableSeats != null
      ? Math.max(selSchedule.availableSeats - (selSchedule.bookedSeats ?? 0), 0)
      : null;
  const tourCode = `NNSGN${tour.id}`;

  /* ════════════════════ RENDER ════════════════════ */

  return (
    <main className="min-h-screen bg-[#f0f0f0] pb-20">
      {/* ── Fixed full-width tab bar (replaces site header when scrolled) ── */}
      <div
        className={[
          "fixed left-0 right-0 top-0 z-[60] transition-transform duration-200",
          showFixedTabs ? "translate-y-0" : "-translate-y-full pointer-events-none",
        ].join(" ")}
      >
        <div className="bg-white shadow-sm">
          <nav className="mx-auto flex w-full max-w-[1100px] border-b border-stone-300 px-4 sm:px-6">
            {TABS.map((t, i) => (
              <button
                key={`${t.key}-${i}`}
                type="button"
                onClick={() => scrollTab(t.key)}
                className={[
                  "whitespace-nowrap px-5 py-3.5 text-sm font-semibold transition",
                  activeTab === t.key
                    ? "border-b-[3px] border-[#0b5ea8] text-[#0b5ea8]"
                    : "text-stone-600 hover:text-stone-900",
                ].join(" ")}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-4 pt-6 sm:px-6">
        {/* ── Tour title ── */}
        <h1 className="text-[22px] font-bold leading-snug text-stone-900 sm:text-2xl">{tour.name}</h1>

        {/* ── Main grid: content + sidebar ── */}
        <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* ═══════ LEFT COLUMN ═══════ */}
          <div>
            {/* ── Image gallery ── */}
            <div className="grid grid-cols-[80px_minmax(0,1fr)] gap-2">
              <div className="flex flex-col gap-2">
                {allImages.slice(0, 4).map((url, idx) => {
                  const isOverflow = idx === 3 && allImages.length > 4;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setMainImgIdx(idx)}
                      className={[
                        "relative h-[88px] w-full overflow-hidden rounded bg-stone-200",
                        idx === mainImgIdx ? "ring-2 ring-blue-500" : "ring-1 ring-stone-200",
                      ].join(" ")}
                    >
                      {url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full bg-gradient-to-br from-teal-600 to-cyan-800" />
                      )}
                      {isOverflow && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-bold text-white">
                          +{allImages.length - 4}
                        </div>
                      )}
                    </button>
                  );
                })}
                {allImages.length === 0 && (
                  <div className="h-[88px] w-full rounded bg-stone-200" />
                )}
              </div>

              <div className="relative h-[370px] overflow-hidden rounded-lg bg-stone-200">
                {allImages[mainImgIdx] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={allImages[mainImgIdx]} alt={tour.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-teal-600 to-cyan-800" />
                )}
              </div>
            </div>

            {/* Sentinel: when this scrolls out of view, fixed tab bar appears */}
            <div ref={sentinelRef} className="mt-6" />

            {/* ═══ Section: Tổng quan ═══ */}
            <section ref={overviewRef} className="mt-6 scroll-mt-16">
              <div className="rounded border-l-4 border-[#0b5ea8] bg-blue-50/80 p-5">
                <p className="text-sm font-bold text-stone-800">Điểm nhấn của chương trình</p>
                {tour.description ? (
                  <div className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
                    {tour.description}
                  </div>
                ) : (
                  <p className="mt-3 text-sm italic text-stone-500">Chưa có mô tả cho tour này.</p>
                )}
              </div>

              <h3 className="mt-10 text-center text-[22px] font-bold uppercase tracking-wide text-stone-900">
                Thông tin thêm về chuyến đi
              </h3>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                {(
                  [
                    { icon: Eye, label: "Điểm tham quan", value: tour.destinationLocation?.name ?? "Đang cập nhật" },
                    { icon: Utensils, label: "Ẩm thực", value: "Theo thực đơn" },
                    { icon: Users, label: "Đối tượng thích hợp", value: "Cặp đôi, Gia đình, Thanh niên, Trẻ em" },
                    { icon: Calendar, label: "Thời gian lý tưởng", value: "Quanh năm" },
                    { icon: Bus, label: "Phương tiện", value: transportLabel(tour.transportType) },
                    { icon: Tag, label: "Khuyến mãi", value: "Đã bao gồm ưu đãi trong giá tour" },
                  ] as const
                ).map((item) => (
                  <div key={item.label} className="flex items-start gap-3 p-3">
                    <item.icon className="mt-0.5 h-5 w-5 shrink-0 text-[#0b5ea8]" />
                    <div>
                      <p className="text-sm font-bold text-stone-800">{item.label}</p>
                      <p className="mt-1 text-xs leading-relaxed text-stone-600">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ═══ Section: Lịch khởi hành ═══ */}
            <section ref={scheduleRef} className="mt-10 scroll-mt-16">
              <h2 className="text-center text-[22px] font-bold uppercase tracking-wide text-stone-900">
                Lịch khởi hành
              </h2>

              {selDate ? (
                /* ── Date selected view ── */
                <div className="mt-5 rounded border border-stone-200 bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={clearDate}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-stone-700 hover:text-stone-900"
                    >
                      <ChevronLeft className="h-4 w-4" /> Quay lại
                    </button>
                    <span className="text-3xl font-bold text-[#d92d20]">
                      {selDate.split("-").reverse().join("/")}
                    </span>
                  </div>

                  {/* Schedule code chips */}
                  <div className="mt-5 flex flex-wrap gap-2">
                    {selDateScheds.map((s) => {
                      const d = new Date(s.startDate);
                      const code = `${tourCode}-${String(s.id).padStart(3, "0")}-${pad2(d.getUTCDate())}${pad2(d.getUTCMonth() + 1)}${String(d.getUTCFullYear()).slice(2)}`;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelSchedId(s.id)}
                          className={[
                            "rounded border px-3 py-2 text-left text-xs transition",
                            s.id === selSchedId
                              ? "border-[#0b5ea8] bg-blue-50 text-[#0b5ea8] font-bold"
                              : "border-stone-300 text-stone-600 hover:bg-stone-50",
                          ].join(" ")}
                        >
                          {code}
                        </button>
                      );
                    })}
                  </div>

                  {/* Transport info */}
                  {selSchedule && (
                    <div className="mt-6">
                      <h4 className="text-center text-base font-bold text-stone-800">Phương tiện di chuyển</h4>
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        <div className="rounded border border-stone-200 p-3">
                          <p className="text-xs text-stone-500">
                            Ngày đi -{formatVnDate(new Date(selSchedule.startDate))}
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-sm">
                            <div className="text-center">
                              <p className="font-bold text-stone-900">
                                {pad2(new Date(selSchedule.startDate).getUTCHours())}:
                                {pad2(new Date(selSchedule.startDate).getUTCMinutes())}
                              </p>
                              <p className="text-xs text-stone-500">
                                {tour.departureLocation?.name ?? "—"}
                              </p>
                            </div>
                            <div className="flex-1 border-t border-dashed border-stone-300" />
                            <div className="text-center">
                              <p className="font-bold text-stone-900">
                                {tour.destinationLocation?.name ?? "—"}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="rounded border border-stone-200 p-3">
                          <p className="text-xs text-stone-500">
                            Ngày về -{formatVnDate(new Date(selSchedule.endDate))}
                          </p>
                          <div className="mt-2 flex items-center gap-4 text-sm">
                            <div className="text-center">
                              <p className="font-bold text-stone-900">
                                {tour.destinationLocation?.name ?? "—"}
                              </p>
                            </div>
                            <div className="flex-1 border-t border-dashed border-stone-300" />
                            <div className="text-center">
                              <p className="font-bold text-stone-900">
                                {tour.departureLocation?.name ?? "—"}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Price breakdown */}
                  <div className="mt-6">
                    <h4 className="text-center text-base font-bold text-[#d92d20]">Giá</h4>
                    <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3">
                      <div>
                        <p className="text-sm font-semibold text-stone-900">Người lớn</p>
                        <p className="text-xs text-stone-500">(Từ 12 tuổi trở lên)</p>
                        <p className="mt-1 font-bold text-[#d92d20]">{formatVnd(displayPrice)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-900">Em bé</p>
                        <p className="text-xs text-stone-500">(Dưới 2 tuổi)</p>
                        <p className="mt-1 font-bold text-[#d92d20]">
                          {displayPrice != null ? formatVnd(Math.round(displayPrice * 0.5)) : "Liên hệ"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-900">Trẻ em</p>
                        <p className="text-xs text-stone-500">(Từ 2 đến 11 tuổi)</p>
                        <p className="mt-1 font-bold text-[#d92d20]">
                          {displayPrice != null ? formatVnd(Math.round(displayPrice * 0.9)) : "Liên hệ"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-stone-900">Phụ thu phòng đơn</p>
                        <p className="text-xs text-stone-500">&nbsp;</p>
                        <p className="mt-1 font-bold text-[#d92d20]">
                          {displayPrice != null ? formatVnd(Math.round(displayPrice * 0.32)) : "Liên hệ"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="mt-4 text-xs leading-relaxed text-stone-500">
                    Tiền bồi dưỡng cho hướng dẫn viên và tài xế địa phương khoảng 133.000 vnd/ngày/khách.
                  </p>
                </div>
              ) : (
                /* ── Calendar view ── */
                <div className="mt-5 grid gap-4 lg:grid-cols-[140px_minmax(0,1fr)]">
                  {/* Month picker */}
                  <div>
                    <p className="text-sm font-semibold text-stone-700">Chọn tháng</p>
                    <div className="mt-2 flex flex-col gap-2">
                      {availableMonths.map((ym) => {
                        const [y, m] = ym.split("-");
                        const isActive = calMonth.year === Number(y) && calMonth.month === Number(m);
                        return (
                          <button
                            key={ym}
                            type="button"
                            onClick={() => setCalMonth({ year: Number(y!), month: Number(m!) })}
                            className={[
                              "rounded-lg px-3 py-2 text-sm font-semibold transition",
                              isActive
                                ? "bg-[#0b5ea8] text-white"
                                : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50",
                            ].join(" ")}
                          >
                            {Number(m)}/{y}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Calendar grid */}
                  <div className="rounded border border-stone-200 bg-white p-5">
                    <div className="flex items-center justify-center gap-6">
                      <button type="button" onClick={goPrev} className="p-1 text-stone-500 hover:text-stone-800">
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <h3 className="text-lg font-bold uppercase tracking-wide text-stone-900">
                        Tháng {calMonth.month}/{calMonth.year}
                      </h3>
                      <button type="button" onClick={goNext} className="p-1 text-stone-500 hover:text-stone-800">
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Weekday headers */}
                    <div className="mt-4 grid grid-cols-7 text-center text-sm font-bold">
                      {WEEKDAYS.map((d, i) => (
                        <div
                          key={d}
                          className={[
                            "py-2",
                            i === 5 ? "text-[#0b5ea8]" : i === 6 ? "text-[#d92d20]" : "text-stone-700",
                          ].join(" ")}
                        >
                          {d}
                        </div>
                      ))}
                    </div>

                    {/* Date cells */}
                    <div className="grid grid-cols-7 text-center text-sm">
                      {calCells.map((cell, idx) => {
                        const entry = cell.currentMonth ? scheduleDateMap.get(cell.ymd) : undefined;
                        const has = !!entry;
                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={!has}
                            onClick={() => has && pickDate(cell.ymd)}
                            className={[
                              "flex h-[68px] flex-col items-center justify-center transition",
                              !cell.currentMonth && "text-stone-300",
                              has && "cursor-pointer rounded border border-[#ff9999] hover:bg-red-50",
                              !has && cell.currentMonth && "text-stone-600",
                            ]
                              .filter(Boolean)
                              .join(" ")}
                          >
                            <span>{cell.day}</span>
                            {has && (
                              <>
                                <span className="text-[10px]">🚌</span>
                                <span className="text-[10px] font-bold leading-none text-[#d92d20]">
                                  {formatPriceK(entry!.minPrice)}
                                </span>
                              </>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <p className="mt-3 text-xs italic text-[#d92d20]">
                      Quý khách vui lòng chọn ngày phù hợp
                    </p>
                  </div>
                </div>
              )}
            </section>

            {/* ═══ Section: Lịch trình ═══ */}
            <section ref={itineraryRef} className="mt-10 scroll-mt-16">
              <h2 className="text-center text-[22px] font-bold uppercase tracking-wide text-stone-900">
                Lịch Trình
              </h2>

              {itineraries.length === 0 ? (
                <p className="mt-4 text-center text-sm text-stone-500">Chưa có lịch trình cho tour này.</p>
              ) : (
                <div className="mt-5 space-y-2">
                  {itineraries.map((day) => {
                    const isOpen = openItinId === day.id;
                    const raw = day.title?.trim() || "";
                    const routePart = raw && !/^Ngày\s+\d+/i.test(raw) ? raw : raw.replace(/^Ngày\s+\d+[:\s]*/i, "").trim();
                    const MEAL_LABELS: Record<string, string> = {
                      BREAKFAST: "sáng",
                      LUNCH: "trưa",
                      DINNER: "chiều",
                      SNACK: "snack",
                    };
                    const meals = day.meals ?? [];
                    const mealCount = meals.length;
                    const mealNames = meals
                      .map((m) => MEAL_LABELS[m.mealType] ?? m.mealType.toLowerCase())
                      .join(", ");
                    const mealSuffix = mealCount > 0
                      ? ` | Số bữa ăn: ${String(mealCount).padStart(2, "0")} (${mealNames})`
                      : "";
                    const rowTitle = `Ngày ${day.dayNumber}${routePart ? `: ${routePart}` : ""}${mealSuffix}`;
                    const hasAccom = (day.accommodations?.length ?? 0) > 0;
                    return (
                      <div key={day.id} className="rounded border border-stone-200 overflow-hidden bg-white">
                        <button
                          type="button"
                          onClick={() => setOpenItinId(isOpen ? null : day.id)}
                          className={[
                            "group flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left text-sm font-medium transition-colors",
                            isOpen ? "bg-blue-100 text-stone-800" : "text-stone-700 hover:bg-blue-100",
                          ].join(" ")}
                        >
                          <span>{rowTitle}</span>
                          <ChevronDown
                            className={[
                              "h-4 w-4 shrink-0 text-stone-400 transition-transform duration-200",
                              isOpen ? "rotate-180" : "",
                            ].join(" ")}
                          />
                        </button>
                        {isOpen && (
                          <div className="border-t border-stone-100 bg-white px-5 py-4 space-y-4">
                            {day.description && (
                              <p className="text-sm leading-relaxed text-stone-700 whitespace-pre-wrap">
                                {day.description}
                              </p>
                            )}
                            {hasAccom && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">Lưu trú</p>
                                <div className="space-y-2">
                                  {day.accommodations!.map((a) => (
                                    <div key={a.id} className="flex items-start gap-3 rounded-lg bg-blue-50 p-3">
                                      <span className="text-base">🏨</span>
                                      <div className="text-sm">
                                        <p className="font-semibold text-stone-800">
                                          {a.hotelName}
                                          {a.starRating ? <span className="ml-1 text-amber-500">{"★".repeat(a.starRating)}</span> : null}
                                        </p>
                                        {a.roomType && <p className="text-xs text-stone-500">Phòng: {a.roomType}</p>}
                                        {a.address && <p className="text-xs text-stone-500">{a.address}</p>}
                                        {a.supplier && <p className="text-xs text-stone-400">Đơn vị: {a.supplier.name}</p>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {mealCount > 0 && (
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500 mb-2">Bữa ăn</p>
                                <div className="space-y-2">
                                  {meals.map((m) => (
                                    <div key={m.id} className="flex items-start gap-3 rounded-lg bg-green-50 p-3">
                                      <span className="text-base">🍽</span>
                                      <div className="text-sm">
                                        <p className="font-semibold text-stone-800">
                                          {MEAL_LABELS[m.mealType] ?? m.mealType}
                                          {m.restaurantName ? ` — ${m.restaurantName}` : ""}
                                        </p>
                                        {m.menuStyle && <p className="text-xs text-stone-500">{m.menuStyle}</p>}
                                        {m.dietaryNotes && <p className="text-xs text-stone-400">{m.dietaryNotes}</p>}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {!day.description && !hasAccom && mealCount === 0 && (
                              <p className="text-sm text-stone-400 italic">Chưa có thông tin chi tiết cho ngày này.</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ═══ Section: Vận chuyển ═══ */}
            {(tour.transports?.length ?? 0) > 0 && (
              <section className="mt-10">
                <h2 className="text-center text-[22px] font-bold uppercase tracking-wide text-stone-900">
                  Chi tiết vận chuyển
                </h2>
                <div className="mt-5 space-y-3">
                  {(tour.transports ?? []).map((tr) => {
                    const VEHICLE_LABELS: Record<string, string> = {
                      CAR_4: "Xe 4 chỗ", CAR_7: "Xe 7 chỗ", BUS_16: "Xe 16 chỗ",
                      BUS_29: "Xe 29 chỗ", BUS_45: "Xe 45 chỗ", FLIGHT: "Máy bay",
                      TRAIN: "Tàu hỏa", BOAT: "Tàu/Thuyền", CABLE_CAR: "Cáp treo",
                    };
                    return (
                      <div key={tr.id} className="flex items-center gap-4 rounded-lg border border-stone-200 bg-white p-4">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-50 text-lg">
                          {tr.vehicleType === "FLIGHT" ? "✈️" : tr.vehicleType === "BOAT" ? "🚢" : tr.vehicleType === "TRAIN" ? "🚆" : "🚌"}
                        </div>
                        <div className="flex-1 text-sm">
                          <p className="font-semibold text-stone-800">
                            Chặng {tr.legOrder}: {VEHICLE_LABELS[tr.vehicleType] ?? tr.vehicleType}
                            {tr.vehicleDetail ? ` — ${tr.vehicleDetail}` : ""}
                          </p>
                          <p className="text-stone-600">
                            {tr.departurePoint} → {tr.arrivalPoint}
                            {tr.estimatedHours ? ` · ${tr.estimatedHours}h` : ""}
                          </p>
                          {tr.seatClass && <p className="text-xs text-stone-400">Hạng: {tr.seatClass}</p>}
                          {tr.supplier && <p className="text-xs text-stone-400">Đơn vị: {tr.supplier.name}{tr.supplier.phone ? ` · ${tr.supplier.phone}` : ""}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* ═══ Section: Bao gồm / Không bao gồm ═══ */}
            {(tour.inclusions || tour.exclusions) && (
              <section className="mt-10">
                <h2 className="text-center text-[22px] font-bold uppercase tracking-wide text-stone-900">
                  Giá tour bao gồm
                </h2>
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {tour.inclusions && (
                    <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                      <p className="mb-2 text-sm font-semibold text-green-800">✅ Bao gồm</p>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-green-700">
                        {tour.inclusions}
                      </p>
                    </div>
                  )}
                  {tour.exclusions && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <p className="mb-2 text-sm font-semibold text-red-800">❌ Không bao gồm</p>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-red-700">
                        {tour.exclusions}
                      </p>
                    </div>
                  )}
                </div>
                {tour.cancellationPolicy && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <p className="mb-2 text-sm font-semibold text-amber-800">⚠️ Chính sách hủy tour</p>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-amber-700">
                      {tour.cancellationPolicy}
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* ═══ Section: Lưu ý ═══ */}
            <section ref={notesRef} className="mt-10 scroll-mt-16">
              <h2 className="text-center text-[22px] font-bold uppercase tracking-wide text-stone-900">
                Những thông tin cần lưu ý
              </h2>
              <div className="mt-5 grid gap-2 sm:grid-cols-2 sm:items-start">
                {NOTE_ITEMS.map((item, idx) => (
                  <div key={idx} className="rounded border border-stone-200 overflow-hidden bg-white">
                    <button
                      type="button"
                      onClick={() => setOpenNoteIdx(openNoteIdx === idx ? null : idx)}
                      className={[
                        "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-medium transition-colors",
                        openNoteIdx === idx ? "bg-blue-100 text-stone-800" : "text-stone-800 hover:bg-blue-100",
                      ].join(" ")}
                    >
                      {item.label}
                      <ChevronDown
                        className={[
                          "h-4 w-4 shrink-0 text-stone-400 transition-transform duration-200",
                          openNoteIdx === idx ? "rotate-180" : "",
                        ].join(" ")}
                      />
                    </button>
                    {openNoteIdx === idx && (
                      <div className="border-t border-stone-100 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-stone-600">
                        {item.content}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* ═══ Section: Chương trình khác ═══ */}
            <section ref={othersRef} className="mt-10 scroll-mt-16">
              <h2 className="text-center text-[22px] font-bold uppercase tracking-wide text-stone-900">
                Chương trình khác
              </h2>
              <p className="mt-4 text-center text-sm text-stone-500">
                Các chương trình tour tương tự sẽ được cập nhật tại đây.
              </p>
            </section>

            {/* ═══ Section: Đánh giá ═══ */}
            <section ref={reviewsRef} id="reviews" className="mt-10 scroll-mt-16">
              <h2 className="text-center text-[22px] font-bold uppercase tracking-wide text-stone-900">
                Đánh giá từ khách hàng
              </h2>
              <div className="mt-4">
                <TourReviews
                  tourId={tour.id}
                  initialRatingAvg={tour.ratingAvg}
                  initialTotalReviews={tour.totalReviews}
                />
              </div>
            </section>
          </div>

          {/* ═══════ RIGHT SIDEBAR (sticky, desktop only) ═══════ */}
          <aside className="hidden lg:block">
            <div className={["sticky space-y-4", showFixedTabs ? "top-16" : "top-24"].join(" ")}>
              <div className="rounded border border-stone-200 bg-white p-5">
                {selSchedule ? (
                  /* ── State 2: date selected ── */
                  <>
                    <p className="text-sm text-stone-600">Giá:</p>
                    {basePrice != null && displayPrice != null && displayPrice < basePrice && (
                      <p className="text-sm text-stone-400 line-through">{formatVnd(basePrice)}</p>
                    )}
                    <p className="text-[28px] font-extrabold leading-tight text-[#d92d20]">
                      {formatVnd(displayPrice)}
                      <span className="text-sm font-normal text-stone-600"> / Khách</span>
                    </p>

                    <div className="mt-4 space-y-2.5 text-sm text-stone-700">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 text-stone-400">⚙️</span>
                        <span>
                          Mã tour:{" "}
                          <strong>
                            {tourCode}-{String(selSchedule.id).padStart(3, "0")}-
                            {pad2(new Date(selSchedule.startDate).getUTCDate())}
                            {pad2(new Date(selSchedule.startDate).getUTCMonth() + 1)}
                          </strong>
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                        <span>
                          Khởi hành:{" "}
                          <strong className="text-[#0b5ea8]">
                            {tour.departureLocation?.name ?? "Đang cập nhật"}
                          </strong>
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                        <span>
                          Ngày khởi hành:{" "}
                          <strong>{formatDmDate(new Date(selSchedule.startDate))}</strong>
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Clock className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                        <span>
                          Thời gian: <strong>{durationLabel(tour.durationDays)}</strong>
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Users className="mt-0.5 h-4 w-4 shrink-0 text-stone-400" />
                        <span>
                          Số chỗ còn: <strong>{remaining ?? "Liên hệ"}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="mt-5 flex gap-2">
                      <button
                        type="button"
                        onClick={clearDate}
                        className="flex-1 rounded border border-stone-300 px-3 py-2.5 text-sm font-semibold text-stone-700 hover:bg-stone-50"
                      >
                        Ngày khác
                      </button>
                      <Link
                        href={`/book/${tour.id}?scheduleId=${selSchedule.id}`}
                        className="flex-1 rounded bg-[#d92d20] px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-[#b91c1c]"
                      >
                        Đặt ngay
                      </Link>
                    </div>
                    <div className="mt-2">
                      <WishlistButton tourId={tour.id} tourName={tour.name} variant="button" className="w-full justify-center" />
                    </div>
                  </>
                ) : (
                  /* ── State 1: no date selected ── */
                  <>
                    <p className="text-sm text-stone-600">Giá từ:</p>
                    <p className="text-[28px] font-extrabold leading-tight text-[#d92d20]">
                      {formatVnd(basePrice)}
                      <span className="text-sm font-normal text-stone-600"> / Khách</span>
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-sm text-stone-600">
                      <span>⚙️</span>
                      <span>
                        Mã chương trình: <strong>{tourCode}</strong>
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => scrollTab("schedule")}
                      className="mt-5 w-full rounded bg-[#0b5ea8] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#084f8f]"
                    >
                      🗓️ Chọn ngày khởi hành
                    </button>
                    <div className="mt-2">
                      <WishlistButton tourId={tour.id} tourName={tour.name} variant="button" className="w-full justify-center" />
                    </div>
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* ── Mobile bottom bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between gap-4 border-t border-stone-200 bg-white px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.08)] lg:hidden">
        <div className="flex items-center gap-3">
          <WishlistButton tourId={tour.id} tourName={tour.name} variant="icon" />
          <div>
            <p className="text-xs text-stone-500">{selSchedule ? "Giá" : "Giá từ"}</p>
            <p className="text-xl font-extrabold text-[#d92d20]">{formatVnd(displayPrice ?? basePrice)}</p>
          </div>
        </div>
        {selSchedule ? (
          <Link
            href={`/book/${tour.id}?scheduleId=${selSchedule.id}`}
            className="rounded bg-[#d92d20] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Đặt ngay
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => scrollTab("schedule")}
            className="rounded bg-[#0b5ea8] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Chọn ngày
          </button>
        )}
      </div>
    </main>
  );
}
