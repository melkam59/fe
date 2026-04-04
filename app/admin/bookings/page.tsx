import Link from "next/link"

import { BookingStatusBadge } from "@/components/booking/booking-status-badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { listAdminBookings } from "@/lib/admin-bookings"
import { ApiError } from "@/lib/api/shared"

type SearchParams = Promise<{
  page?: string | string[]
  limit?: string | string[]
  status?: string | string[]
}>

const bookingStatuses = [
  "all",
  "pending",
  "confirmed",
  "checked_in",
  "checked_out",
  "cancelled",
  "no_show",
] as const

function readSearchParam(
  value: string | string[] | undefined,
  fallback: string
) {
  return typeof value === "string" && value.trim()
    ? value
    : Array.isArray(value) && value[0]
      ? value[0]
      : fallback
}

function parsePositiveInt(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function formatDate(value: string | null) {
  if (!value) {
    return "Not set"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function createPageHref(page: number, limit: number, status: string) {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })

  if (status !== "all") {
    query.set("status", status)
  }

  return `/admin/bookings?${query.toString()}`
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const resolvedSearchParams = await searchParams
  const page = parsePositiveInt(readSearchParam(resolvedSearchParams.page, "1"), 1)
  const limit = parsePositiveInt(
    readSearchParam(resolvedSearchParams.limit, "20"),
    20
  )
  const requestedStatus = readSearchParam(resolvedSearchParams.status, "all")
  const status = bookingStatuses.includes(
    requestedStatus as (typeof bookingStatuses)[number]
  )
    ? requestedStatus
    : "all"

  let errorMessage: string | null = null
  let bookingsPage = null as Awaited<ReturnType<typeof listAdminBookings>> | null

  try {
    bookingsPage = await listAdminBookings({
      page,
      limit,
      status,
    })
  } catch (error) {
    errorMessage =
      error instanceof ApiError
        ? error.message
        : "We couldn't load bookings right now."
  }

  return (
    <main className="px-4 py-4 lg:px-6">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Admin Bookings</CardTitle>
            <CardDescription>
              Review and filter booking records before we wire detail actions
              like confirm, check-in, and cancel.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form className="grid gap-3 md:grid-cols-[1fr_180px_120px_auto]">
              <div className="grid gap-1">
                <label
                  htmlFor="status"
                  className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground"
                >
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  defaultValue={status}
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {bookingStatuses.map((bookingStatus) => (
                    <option key={bookingStatus} value={bookingStatus}>
                      {bookingStatus === "all"
                        ? "All statuses"
                        : bookingStatus.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-1">
                <label
                  htmlFor="limit"
                  className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground"
                >
                  Per Page
                </label>
                <select
                  id="limit"
                  name="limit"
                  defaultValue={String(limit)}
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  {[10, 20, 50].map((value) => (
                    <option key={value} value={value}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <input type="hidden" name="page" value="1" />

              <div className="flex items-end">
                <Button type="submit" className="w-full">
                  Apply filters
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {errorMessage ? (
          <Card>
            <CardHeader>
              <CardTitle>Couldn&apos;t Load Bookings</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {bookingsPage ? (
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Booking List</CardTitle>
              <CardDescription>
                Showing {bookingsPage.items.length} of {bookingsPage.total} total
                bookings.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {bookingsPage.items.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Booking</TableHead>
                      <TableHead>Guest</TableHead>
                      <TableHead>Stay</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookingsPage.items.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{booking.id}</span>
                            <span className="text-xs text-muted-foreground">
                              {booking.resortName ?? "Unknown resort"}
                              {booking.roomLabel
                                ? ` · ${booking.roomLabel}`
                                : ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{booking.guestName ?? "Unknown guest"}</span>
                            <span className="text-xs text-muted-foreground">
                              {booking.guestEmail ?? "No email"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>
                              {formatDate(booking.checkInDate)} to{" "}
                              {formatDate(booking.checkOutDate)}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {booking.adults ?? 0} adults
                              {typeof booking.children === "number"
                                ? ` · ${booking.children} children`
                                : ""}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <BookingStatusBadge status={booking.status} />
                        </TableCell>
                        <TableCell>{formatDate(booking.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            nativeButton={false}
                            render={<Link href={`/admin/bookings/${booking.id}`} />}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No bookings matched the current filters.
                </div>
              )}

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Page {bookingsPage.page} of {bookingsPage.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={!bookingsPage.hasPreviousPage}
                    disabled={!bookingsPage.hasPreviousPage}
                    render={
                      bookingsPage.hasPreviousPage ? (
                        <Link
                          href={createPageHref(
                            bookingsPage.page - 1,
                            bookingsPage.limit,
                            status
                          )}
                        />
                      ) : undefined
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={!bookingsPage.hasNextPage}
                    disabled={!bookingsPage.hasNextPage}
                    render={
                      bookingsPage.hasNextPage ? (
                        <Link
                          href={createPageHref(
                            bookingsPage.page + 1,
                            bookingsPage.limit,
                            status
                          )}
                        />
                      ) : undefined
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  )
}
