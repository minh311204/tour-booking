"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("admin-theme", next ? "dark" : "light");
    setDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/90 bg-slate-50/80 text-slate-500 shadow-sm transition hover:border-sky-200 hover:bg-sky-50/80 hover:text-sky-700 dark:border-slate-600 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-sky-500/50 dark:hover:bg-slate-700"
      aria-label={dark ? "Chế độ sáng" : "Chế độ tối"}
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
