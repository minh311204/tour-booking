import { HeroSearchBar } from "@/components/hero-search-bar";
import { FavoriteDestinations } from "@/components/favorite-destinations";
import { HomeExplorePromo } from "@/components/home-explore-promo";
import { FeaturedToursSection } from "@/components/featured-tours-section";
import { fetchTours, unwrapTourListResponse } from "@/lib/server-api";
import { errorMessage } from "@/lib/format";

/** Nền hero — ảnh cover, overlay đen nhẹ */
const HERO_BG =
  "/assets/images/header/video_bg_vietravel.ca0484d0.jpeg";

export default async function HomePage() {
  const res = await fetchTours(
    { isActive: "true", featured: "true" },
    { next: { revalidate: 60 } },
  );

  const featured = res.ok
    ? unwrapTourListResponse(res.data).tours.slice(0, 6)
    : [];
  const loadError = !res.ok;

  return (
    <>
      {/* Hero: ~nửa màn hình — ảnh cover khung; pt = chừa header fixed */}
      <section className="relative flex min-h-[50svh] flex-col overflow-hidden border-b border-white/10 bg-[#1a1d2e] pb-8 pt-24 text-white sm:pb-12 sm:pt-28">
        {/* Ảnh nền — cover theo chiều cao section (= ít nhất 1 màn hình) */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundColor: "#1a1d2e",
            backgroundImage: `url('${HERO_BG}')`,
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundAttachment: "scroll",
          }}
          aria-hidden
        />
        {/* Phủ tối dịu — gần ảnh mẫu (chữ trắng đọc rõ) */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/55"
          aria-hidden
        />
        <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 sm:px-6">
          <div className="mx-auto w-full max-w-[min(100%,56rem)] text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.85)] sm:text-base">
              Đặt tour trực tuyến
            </p>
            <p className="mx-auto mt-3 max-w-2xl text-pretty text-sm font-normal text-white/95 [text-shadow:0_1px_8px_rgba(0,0,0,0.45)] sm:mt-4 sm:text-base">
              Giá tốt – hỗ trợ 24/7 – khắp nơi
            </p>
          </div>
          <div className="mx-auto mt-6 w-full max-w-5xl sm:mt-8">
            <HeroSearchBar className="w-full" />
          </div>
        </div>
      </section>

      <HomeExplorePromo />

      <FeaturedToursSection
        tours={featured}
        loadError={
          loadError ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Không tải được danh sách tour. Chạy API (cổng 4000) và cấu hình{" "}
              <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_API_URL</code>{" "}
              trong <code className="rounded bg-amber-100 px-1">.env.local</code>.
              {!res.ok && (
                <span className="mt-1 block text-amber-800">
                  {errorMessage(res.body)}
                </span>
              )}
            </div>
          ) : null
        }
      />

      <FavoriteDestinations />
    </>
  );
}
