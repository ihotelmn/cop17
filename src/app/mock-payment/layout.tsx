import { notFound } from "next/navigation";

/**
 * The mock payment route simulates Golomt Bank's hosted checkout without
 * performing a real charge. It must never be reachable in production — a
 * misconfigured `GOLOMT_MODE` combined with this page would let anyone
 * confirm a booking without paying.
 */
export default function MockPaymentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    if (process.env.NODE_ENV === "production" || process.env.GOLOMT_MODE === "live") {
        notFound();
    }

    return <>{children}</>;
}
