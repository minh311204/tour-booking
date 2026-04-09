import { notFound } from "next/navigation";
import { fetchTourById } from "@/lib/server-api";
import TourDetailClient from "@/components/tour-detail-client";

type Props = { params: Promise<{ id: string }> };

export default async function TourDetailPage({ params }: Props) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) notFound();

  const res = await fetchTourById(numId, { next: { revalidate: 60 } });
  if (!res.ok) notFound();

  return <TourDetailClient tour={res.data} />;
}
