import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-stone-200 bg-stone-100/50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-stone-600">
            © {new Date().getFullYear()} TourBooking
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-stone-500">
            <Link href="/tours" className="hover:text-teal-700">
              Khám phá tour
            </Link>
            <span className="text-stone-300">|</span>
            <span>Hotline: 1900 xxxx</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
