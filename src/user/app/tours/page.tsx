import Link from "next/link";
import type { LocationRow } from "@/lib/api-types";
import {
  fetchLocations,
  fetchTours,
  unwrapTourListResponse,
} from "@/lib/server-api";
import { parseTourListQuery } from "@/lib/tour-query";
import { errorMessage } from "@/lib/format";
import { TourDealCard } from "@/components/tour-deal-card";
import { ToursBackButton } from "@/components/tours-back-button";
import { ToursFilterForm } from "./tours-filter-form";
import { ToursPagination, TOURS_PAGE_SIZE } from "./tours-pagination";

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pickFeatured(sp: Record<string, string | string[] | undefined>) {
  const v = sp.featured;
  const raw = Array.isArray(v) ? v[0] : v;
  return raw === "true" || raw === "1";
}

function getListPage(sp: Record<string, string | string[] | undefined>): number {
  const v = sp.page;
  const raw = Array.isArray(v) ? v[0] : v;
  const n = parseInt(String(raw ?? "1"), 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

export default async function ToursSearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const featuredOnly = pickFeatured(sp);
  const listPage = getListPage(sp);
  const query = featuredOnly
    ? parseTourListQuery(sp)
    : {
        ...parseTourListQuery(sp),
        page: String(listPage),
        pageSize: String(TOURS_PAGE_SIZE),
      };

  const toursRes = await fetchTours(query, { next: { revalidate: 30 } });
  const locationsRes = featuredOnly
    ? null
    : await fetchLocations({ next: { revalidate: 300 } });

  const { tours, total } = toursRes.ok
    ? unwrapTourListResponse(toursRes.data)
    : { tours: [], total: 0 };
  const locations: LocationRow[] =
    locationsRes?.ok === true ? locationsRes.data : [];

  const listError = !toursRes.ok ? errorMessage(toursRes.body) : null;

  if (featuredOnly) {
    return (
      <div
        className="min-h-[calc(100svh-4rem)] border-b border-sky-200/60"
        style={{ backgroundColor: "#e0f2f7" }}
      >
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
          <ToursBackButton />

          {listError ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
              {listError}
            </div>
          ) : tours.length === 0 ? (
            <p className="mt-8 text-center text-stone-600">
              Chưa có tour nổi bật.
            </p>
          ) : (
            <div className="mt-6 grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {tours.map((t) => (
                <TourDealCard key={t.id} tour={t} />
              ))}
            </div>
          )}

          <div className="mt-10 flex justify-center">
            <Link
              href="/tours"
              className="inline-flex min-w-[220px] items-center justify-center rounded-lg border border-sky-500 bg-sky-100/80 px-8 py-2.5 text-sm font-semibold text-sky-800 shadow-sm transition hover:bg-sky-200/90"
            >
              Xem tất cả tour
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-[calc(100svh-4rem)] border-b border-sky-200/60"
      style={{ backgroundColor: "#e0f2f7" }}
    >
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="text-center sm:text-left">
          <h1 className="text-xl font-bold uppercase tracking-wide text-[#0056b3] sm:text-2xl">
            <span className="relative inline-block">
              Tất cả
              <span
                className="absolute -bottom-1 left-0 h-1 w-full min-w-[2.5rem] rounded-full bg-[#0056b3]"
                aria-hidden
              />
            </span>{" "}
            tour
          </h1>
        </div>
        <div className="mt-8 rounded-2xl border border-white/60 bg-white/90 p-4 shadow-sm backdrop-blur-sm sm:p-6">
          <ToursFilterForm
            locations={locations}
            initial={{
              departureLocationId: sp.departureLocationId as string | undefined,
              destinationLocationId: sp.destinationLocationId as string | undefined,
              budget: sp.budget as string | undefined,
              departureDate: sp.departureDate as string | undefined,
              q: sp.q as string | undefined,
            }}
          />
        </div>

        {listError ? (
          <div className="mt-8 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {listError}
          </div>
        ) : tours.length === 0 ? (
          <p className="mt-10 text-center text-stone-600">Không có tour phù hợp.</p>
        ) : (
          <>
            <section
              aria-label="Danh sách tour"
              className="mt-10 grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            >
              {tours.map((t) => (
                <TourDealCard key={t.id} tour={t} variant="catalog" />
              ))}
            </section>
            <ToursPagination
              page={listPage}
              total={total}
              searchParams={sp}
            />
          </>
        )}

        <div className="mt-10 flex justify-center">
          <Link
            href="/tours?featured=true"
            className="inline-flex min-w-[200px] items-center justify-center rounded-lg border border-sky-500 bg-sky-100/80 px-8 py-2.5 text-sm font-semibold text-sky-800 shadow-sm transition hover:bg-sky-200/90"
          >
            Tour nổi bật
          </Link>
        </div>
      </div>
    </div>
  );
}
