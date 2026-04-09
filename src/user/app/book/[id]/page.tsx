import { notFound } from "next/navigation";
import { fetchTourById } from "@/lib/server-api";
import TourBookingClient from "@/components/booking/tour-booking-client";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function BookTourPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const numId = Number(id);
  if (!Number.isFinite(numId)) notFound();

  const res = await fetchTourById(numId, { next: { revalidate: 60 } });
  if (!res.ok) notFound();

  const rawScheduleId = Array.isArray(sp.scheduleId) ? sp.scheduleId[0] : sp.scheduleId;
  const preselectedScheduleId = rawScheduleId ? Number(rawScheduleId) : undefined;

  return (
    <TourBookingClient
      tour={res.data}
      preselectedScheduleId={preselectedScheduleId}
    />
  );
}
