"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    appendBookingSearchToHref,
    mergeBookingSearchState,
    readPartialBookingSearchState,
    readStoredBookingSearchState,
} from "@/lib/booking-search";

type SearchAwareLinkProps = Omit<React.ComponentProps<typeof Link>, "href"> & {
    href: string;
};

export const SearchAwareLink = React.forwardRef<HTMLAnchorElement, SearchAwareLinkProps>(
    function SearchAwareLink({ href, ...props }, ref) {
        const searchParams = useSearchParams();
        const searchParamsString = searchParams.toString();

        const serverSafeHref = React.useMemo(() => {
            const currentState = readPartialBookingSearchState(new URLSearchParams(searchParamsString));

            return appendBookingSearchToHref(href, currentState);
        }, [href, searchParamsString]);

        const [resolvedHref, setResolvedHref] = React.useState(serverSafeHref);

        React.useEffect(() => {
            const currentState = readPartialBookingSearchState(new URLSearchParams(searchParamsString));
            const storedState = readStoredBookingSearchState();

            setResolvedHref(appendBookingSearchToHref(
                href,
                mergeBookingSearchState(currentState, storedState)
            ));
        }, [href, searchParamsString]);

        return <Link ref={ref} href={resolvedHref} {...props} />;
    }
);

SearchAwareLink.displayName = "SearchAwareLink";
