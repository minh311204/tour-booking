"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  if (d > 0) {
    return `${d} Ngày ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Đếm ngược tới deadline (VD: ngày khởi hành gần nhất). */
export function DealCountdown({ deadlineMs }: { deadlineMs: number | null }) {
  /** Tránh hydration mismatch: không dùng Date trên render đầu (SSR = client). */
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    if (deadlineMs == null) return;
    setNow(Date.now());
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [deadlineMs]);

  if (deadlineMs == null) {
    return <span className="tabular-nums">--:--:--</span>;
  }

  if (now === null) {
    return (
      <span className="invisible tabular-nums font-bold" aria-hidden>
        00 Ngày 00:00:00
      </span>
    );
  }

  const remaining = deadlineMs - now;
  return <span className="tabular-nums font-bold">{formatRemaining(remaining)}</span>;
}
