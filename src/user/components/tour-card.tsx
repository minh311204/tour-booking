import Link from "next/link";
import { Calendar, MapPin, Star } from "lucide-react";
import type { TourListItem } from "@/lib/api-types";
import { formatVnd } from "@/lib/format";
import { WishlistButton } from "./wishlist-button";

function cn(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

const gradients = [
  "from-cyan-600 to-blue-800",
  "from-emerald-700 to-teal-900",
  "from-amber-500 to-orange-700",
  "from-violet-600 to-fuchsia-800",
  "from-rose-600 to-red-900",
];

function pickGradient(id: number) {
  return gradients[Math.abs(id) % gradients.length];
}

type Props = { tour: TourListItem; className?: string };

export function TourCard({ tour, className }: Props) {
  const location =
    tour.destinationLocation?.name ??
    tour.departureLocation?.name ??
    "—";
  const duration =
    tour.durationDays != null ? `${tour.durationDays} ngày` : "—";
  const price = formatVnd(tour.basePrice ?? null);
  const rating = tour.ratingAvg ?? 0;
  const id = String(tour.id);
  const gradient = pickGradient(tour.id);

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition hover:shadow-md",
        className,
      )}
    >
      <Link href={`/tours/${id}`} className="flex min-h-0 flex-1 flex-col">
        <div className="relative h-44 shrink-0 overflow-hidden bg-stone-100">
          {tour.thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tour.thumbnailUrl}
              alt=""
              className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            />
          ) : (
            <div
              className={`h-full w-full bg-gradient-to-br ${gradient} opacity-95 transition group-hover:opacity-100`}
            />
          )}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.08\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-60" />
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-xs text-white backdrop-blur">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {rating.toFixed(1)}
          </div>
          <div className="absolute right-3 top-3">
            <WishlistButton tourId={tour.id} tourName={tour.name} />
          </div>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-semibold text-stone-900 group-hover:text-teal-800">
            {tour.name}
          </h3>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-stone-500">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-4 w-4 shrink-0 text-teal-600" />
              {location}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-4 w-4 shrink-0 text-teal-600" />
              {duration}
            </span>
          </div>
          <p className="mt-3 text-lg font-bold text-teal-700 sm:mt-auto">
            {price}
            <span className="text-sm font-normal text-stone-500"> / khách</span>
          </p>
        </div>
      </Link>
    </article>
  );
}
