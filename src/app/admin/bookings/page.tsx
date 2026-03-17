import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getAllBookings } from "@/app/actions/booking-admin";
import { BookingStatusBadge } from "@/components/admin/booking-status-badge";
import { BookingActions } from "@/components/admin/booking-actions";
import { ExportButton } from "@/components/admin/export-button";
import { BookingsFilter } from "@/components/admin/bookings-filter";
import { Badge } from "@/components/ui/badge";

export default async function BookingsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const resolvedParams = await searchParams;
    const filters = {
        status: typeof resolvedParams?.status === 'string' ? resolvedParams.status : undefined,
        search: typeof resolvedParams?.search === 'string' ? resolvedParams.search : undefined,
    };

    const { data: bookings, success, error } = await getAllBookings(filters);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Bookings</h1>
                    <p className="text-muted-foreground mt-1">
                        Manage reservations and guest status.
                    </p>
                </div>
                <div className="flex gap-2">
                    <ExportButton data={bookings || []} filename="bookings" />
                    {/* <Button variant="premium">New Booking</Button> */}
                </div>
            </div>

            {/* Filters */}
            <BookingsFilter />

            {/* Table */}
            <div className="rounded-md border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Booking ID</TableHead>
                            <TableHead>Guest</TableHead>
                            <TableHead>Hotel & Room</TableHead>
                            <TableHead>Dates</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!success ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-red-500">
                                    Error loading bookings: {error}
                                </TableCell>
                            </TableRow>
                        ) : bookings?.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                                    No bookings found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            bookings?.map((booking) => (
                                <TableRow key={booking.id}>
                                    <TableCell className="font-mono text-xs">{booking.id.slice(0, 8)}...</TableCell>
                                    <TableCell>{booking.guestName}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{booking.hotelName}</span>
                                            <span className="text-xs text-muted-foreground">{booking.roomName}</span>
                                            {booking.status === "prebook_requested" && (
                                                <span className="mt-1 text-xs font-medium text-sky-600">
                                                    Pre-book request awaiting offline payment follow-up.
                                                </span>
                                            )}
                                            {booking.modificationRequestStatus === "pending" && (
                                                <span className="mt-1 text-xs font-medium text-amber-600">
                                                    Change requested: {booking.modificationRequestMessage || "Guest submitted a modification request."}
                                                </span>
                                            )}
                                            {booking.status === "cancelled" && booking.cancellationReason && (
                                                <span className="mt-1 text-xs font-medium text-red-600">
                                                    Cancel reason: {booking.cancellationReason}
                                                </span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>{booking.dates}</TableCell>
                                    <TableCell>
                                        <div className="flex flex-col items-start gap-2">
                                            <BookingStatusBadge status={booking.status} />
                                            {booking.modificationRequestStatus === "pending" && (
                                                <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                                                    Change Requested
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">${booking.amount}</TableCell>
                                    <TableCell>
                                        <BookingActions bookingId={booking.id} currentStatus={booking.status} />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
