"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";

export type ItineraryDay = {
  id: number;
  dayNumber: number;
  title: string | null;
  description: string | null;
};

function splitTitleLines(title: string | null): { headline: string; subline: string | null } {
  if (!title?.trim()) return { headline: "", subline: null };
  const lines = title
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  if (lines.length <= 1) return { headline: lines[0] ?? "", subline: null };
  return { headline: lines[0]!, subline: lines.slice(1).join(" ") };
}

export function TourItineraryAccordion({ items }: { items: ItineraryDay[] }) {
  const sorted = [...items].sort((a, b) => a.dayNumber - b.dayNumber);
  const [openId, setOpenId] = useState<number | null>(sorted[0]?.id ?? null);

  const toggle = (id: number) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="mt-10">
      <h2 className="text-center text-xl font-bold tracking-wide text-stone-900 sm:text-2xl">
        LỊCH TRÌNH
      </h2>
      <div className="mt-6 space-y-3">
        {sorted.map((day) => {
          const isOpen = openId === day.id;
          const { headline, subline } = splitTitleLines(day.title);
          const mainLine = (() => {
            const h = headline.trim();
            if (!h) return `Ngày ${day.dayNumber}`;
            if (/^Ngày\s+\d+/i.test(h)) return h;
            return `Ngày ${day.dayNumber}: ${h}`;
          })();

          return (
            <div
              key={day.id}
              className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
            >
              <button
                type="button"
                onClick={() => toggle(day.id)}
                className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left transition hover:bg-stone-50"
                aria-expanded={isOpen}
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-stone-900">{mainLine}</p>
                  {subline ? (
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-500">
                      <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      {subline}
                    </p>
                  ) : null}
                </div>
                {isOpen ? (
                  <ChevronUp className="mt-0.5 h-5 w-5 shrink-0 text-stone-500" aria-hidden />
                ) : (
                  <ChevronDown className="mt-0.5 h-5 w-5 shrink-0 text-stone-500" aria-hidden />
                )}
              </button>
              {isOpen && day.description ? (
                <div className="border-t border-stone-100 px-4 pb-5 pt-3">
                  <div className="relative pl-6">
                    <span
                      className="absolute left-[5px] top-1.5 h-2 w-2 rounded-full bg-blue-600"
                      aria-hidden
                    />
                    <span
                      className="absolute bottom-1 left-[5px] h-2 w-2 rounded-full bg-blue-600"
                      aria-hidden
                    />
                    <div
                      className="absolute left-[9px] top-3 bottom-3 w-0 border-l-2 border-dotted border-blue-500"
                      aria-hidden
                    />
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-stone-700">
                      {day.description}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
