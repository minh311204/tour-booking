"use client";

import { useState } from "react";
import Image from "next/image";
import { resolvePublicImageUrl } from "@/lib/media-url";

type Props = {
  url: string | null | undefined;
  name: string;
  className?: string;
};

/**
 * Ảnh tour: resolve URL tương đối → absolute, fallback khi lỗi tải.
 * Dùng next/image với remotePatterns trong next.config.ts.
 */
export function TourImage({ url, name, className = "" }: Props) {
  const [broken, setBroken] = useState(false);
  const resolved = resolvePublicImageUrl(url);

  if (!resolved || broken) {
    return (
      <div
        className={`flex aspect-[16/10] w-full items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-500 ${className}`}
      >
        {broken ? "Không tải được ảnh" : "Chưa có ảnh"}
      </div>
    );
  }

  return (
    <div
      className={`relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-slate-100 ${className}`}
    >
      <Image
        src={resolved}
        alt={name}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 400px"
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        unoptimized
      />
    </div>
  );
}
