import CheckoutClient from "./checkout-client";

type Props = {
  searchParams: Promise<{ bookingId?: string; total?: string; email?: string }>;
};

export default async function CheckoutPage({ searchParams }: Props) {
  const { bookingId, total, email } = await searchParams;
  return <CheckoutClient bookingId={bookingId} total={total} email={email} />;
}
