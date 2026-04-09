"use client";

import { useEffect } from "react";

/** Áp class `dark` trước paint để giảm nháy (đọc localStorage / prefers-color-scheme). */
export function ThemeInit() {
  useEffect(() => {
    try {
      const s = localStorage.getItem("admin-theme");
      if (
        s === "dark" ||
        (s !== "light" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches)
      ) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}
