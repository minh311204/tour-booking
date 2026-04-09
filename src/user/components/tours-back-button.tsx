"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export function ToursBackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex items-center gap-1.5 text-sm font-semibold text-sky-800 transition hover:text-sky-950"
    >
      <ChevronLeft className="h-4 w-4" aria-hidden />
      Quay lại
    </button>
  );
}
