"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown } from "lucide-react";

export type ToolbarSortKey = "all" | "nearest" | "price_asc" | "price_desc" | "newest";

const SORT_OPTIONS: { value: ToolbarSortKey; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "price_desc", label: "Giá từ cao đến thấp" },
  { value: "price_asc", label: "Giá từ thấp đến cao" },
  { value: "nearest", label: "Ngày khởi hành gần nhất" },
];

type FavoritesToolbarProps = {
  provinceId: number;
  tourCount: number;
  sortBy: ToolbarSortKey;
};

export function FavoritesToolbar({ provinceId, tourCount, sortBy }: FavoritesToolbarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const currentLabel =
    SORT_OPTIONS.find((o) => o.value === sortBy)?.label ??
    (sortBy === "newest" ? "Mới nhất" : SORT_OPTIONS[0].label);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function navigateSort(next: ToolbarSortKey) {
    const qs = new URLSearchParams(searchParams.toString());
    if (next === "all") qs.delete("sortBy");
    else qs.set("sortBy", next);
    const q = qs.toString();
    router.push(`/favorites/${provinceId}${q ? `?${q}` : ""}`);
    setOpen(false);
  }

  return (
    <div className="lg:col-span-2 flex min-h-[2.75rem] flex-wrap items-center gap-x-4 gap-y-2 border-b border-[#ddd] pb-3">
      <h2 className="text-base font-bold uppercase tracking-wide text-stone-900">
        Bộ lọc tìm kiếm
      </h2>

      <div className="hidden min-w-[1rem] flex-1 lg:block" aria-hidden />

      <p className="text-sm text-stone-700 lg:text-[15px]">
        Chúng tôi tìm thấy{" "}
        <span className="text-lg font-bold text-[#1e40af]">{tourCount}</span> chương trình tour cho quý khách
      </p>

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <span className="text-sm text-stone-600">Sắp xếp theo:</span>
        <div ref={wrapRef} className="relative">
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="flex min-w-[12rem] items-center justify-between gap-2 rounded border border-stone-300 bg-white px-3 py-2 text-left text-sm font-semibold text-stone-800 shadow-sm transition hover:border-[#0b5ea8] hover:bg-sky-50/80"
            aria-expanded={open}
            aria-haspopup="listbox"
          >
            <span className="truncate">{currentLabel}</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-stone-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </button>
          {open ? (
            <ul
              role="listbox"
              className="absolute right-0 z-50 mt-1 min-w-full overflow-hidden rounded-md border border-stone-200 bg-white py-1 shadow-lg"
            >
              {SORT_OPTIONS.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={sortBy === opt.value}
                    onClick={() => navigateSort(opt.value)}
                    className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                      sortBy === opt.value
                        ? "font-semibold text-[#0b5ea8]"
                        : "text-stone-800"
                    } hover:bg-sky-100 hover:text-[#0b5ea8]`}
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
