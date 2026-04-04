import Link from "next/link"
import type { ReactNode } from "react"

import {
  ArrowLeftIcon,
  CalendarDaysIcon,
  MessageSquareQuoteIcon,
  QrCodeIcon,
  UserRoundIcon,
} from "lucide-react"

import { AuditLog } from "@/components/admin/audit-log"
import { BookingActions } from "@/components/admin/booking-actions"
import { Button } from "@/components/ui/button"
import {
  getAdminBooking,
  getAdminBookingAuditLogs,
} from "@/lib/admin-bookings"
import { ApiError } from "@/lib/api/shared"
import { cn } from "@/lib/utils"

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

function formatStatusLabel(status: string) {
  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function getStatusClasses(status: string) {
  switch (status.trim().toLowerCase().replace(/-/g, "_")) {
    case "pending":
      return "bg-[#d3e4fe] text-[#435368]"
    case "confirmed":
    case "checked_in":
    case "check_in":
    case "checked_out":
    case "check_out":
      return "bg-[#d9ede4] text-[#24543e]"
    case "cancelled":
    case "canceled":
    case "no_show":
      return "bg-[#ffe0dc] text-[#7a2624]"
    default:
      return "bg-[#eaeff1] text-[#586064]"
  }
}

function getStatusSupportCopy(status: string) {
  switch (status.trim().toLowerCase().replace(/-/g, "_")) {
    case "pending":
      return {
        title: "Digital check-in available",
        description: "Waiting for staff confirmation",
      }
    case "confirmed":
      return {
        title: "Guest is ready for arrival",
        description: "The reservation is confirmed and ready for check-in",
      }
    case "checked_in":
    case "check_in":
      return {
        title: "Stay is currently active",
        description: "Use admin actions when the guest is ready to check out",
      }
    case "checked_out":
    case "check_out":
      return {
        title: "Stay completed",
        description: "This booking has already been checked out",
      }
    case "no_show":
      return {
        title: "Guest did not arrive",
        description: "This booking was marked as a no-show by the team",
      }
    case "cancelled":
    case "canceled":
      return {
        title: "Reservation cancelled",
        description: "The booking lifecycle has been closed from the admin side",
      }
    default:
      return {
        title: "Booking status updated",
        description: "Review the current booking state before taking action",
      }
  }
}

function formatGuestCount(adults: number | null, children: number | null) {
  return `${adults ?? 0} adults, ${children ?? 0} children`
}

function SectionCard({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <section
      className={cn(
        "rounded-[1.5rem] border border-[#dbe4e7]/80 bg-[#fdfefe] p-6 shadow-[0px_12px_32px_-16px_rgba(43,52,55,0.22)]",
        className
      )}
    >
      {children}
    </section>
  )
}

function SectionHeading({
  icon,
  title,
}: {
  icon: ReactNode
  title: string
}) {
  return (
    <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-[#1a1a1a]">
      <span className="text-[#737c7f]">{icon}</span>
      {title}
    </h2>
  )
}

function DetailRow({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="grid gap-1">
      <p className="text-[10px] font-bold uppercase tracking-[0.08rem] text-[#737c7f]">
        {label}
      </p>
      <p className="text-sm font-semibold text-[#243033]">{value}</p>
    </div>
  )
}

export default async function BookingDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let booking = null as Awaited<ReturnType<typeof getAdminBooking>> | null
  let auditLogs =
    null as Awaited<ReturnType<typeof getAdminBookingAuditLogs>> | null
  let errorMessage: string | null = null
  let auditLogErrorMessage: string | null = null

  const [bookingResult, auditLogResult] = await Promise.allSettled([
    getAdminBooking(id),
    getAdminBookingAuditLogs(id),
  ])

  if (bookingResult.status === "fulfilled") {
    booking = bookingResult.value

    if (!booking) {
      errorMessage = "We couldn't find that booking."
    }
  } else {
    errorMessage =
      bookingResult.reason instanceof ApiError
        ? bookingResult.reason.message
        : "We couldn't load this booking right now."
  }

  if (auditLogResult.status === "fulfilled") {
    auditLogs = auditLogResult.value
  } else {
    auditLogErrorMessage =
      auditLogResult.reason instanceof ApiError
        ? auditLogResult.reason.message
        : "We couldn't load the audit log right now."
  }

  const statusCopy = booking ? getStatusSupportCopy(booking.status) : null

  return (
    <main className="min-h-full bg-[#f8f9fa] px-4 py-6 lg:px-6">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="size-11 rounded-full bg-[#eef3f5] text-[#5f5e5e] hover:bg-[#e3e9ec]"
            nativeButton={false}
            render={<Link href="/admin/bookings" />}
          >
            <ArrowLeftIcon className="size-4" />
          </Button>
          <div className="grid gap-1">
            <p className="font-heading text-xl font-bold tracking-tight text-[#1a1a1a]">
              Booking Details
            </p>
            <p className="text-sm text-[#586064]">
              Review the reservation, manage the stay, and keep the booking
              lifecycle moving.
            </p>
          </div>
        </div>

        {errorMessage ? (
          <SectionCard className="border-[#fe8983]/40 bg-[#fff2f0]">
            <div className="grid gap-1">
              <p className="font-heading text-lg font-bold text-[#752121]">
                Couldn&apos;t Load Booking
              </p>
              <p className="text-sm text-[#8c3d3a]">{errorMessage}</p>
            </div>
          </SectionCard>
        ) : null}

        {booking ? (
          <SectionCard className="bg-white">
            <div className="flex items-start justify-between gap-4">
              <div className="grid gap-2">
                <div className="grid gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.08rem] text-[#737c7f]">
                    Reference ID
                  </span>
                  <p className="font-heading text-lg font-bold break-all text-[#243033]">
                    {booking.id}
                  </p>
                </div>
                <p className="text-sm text-[#586064]">
                  {booking.resortName ?? "Unknown resort"}
                  {booking.roomLabel ? ` · ${booking.roomLabel}` : ""}
                </p>
              </div>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08rem]",
                  getStatusClasses(booking.status)
                )}
              >
                {formatStatusLabel(booking.status)}
              </span>
            </div>

            <div className="mt-6 flex items-center gap-3 border-t border-[#abb3b7]/15 pt-6">
              <div className="flex size-11 items-center justify-center rounded-full bg-[#eaeff1] text-[#5f5e5e]">
                <QrCodeIcon className="size-5" />
              </div>
              <div className="grid gap-1">
                <p className="text-sm font-medium text-[#243033]">
                  {statusCopy?.title}
                </p>
                <p className="text-xs text-[#586064]">
                  {statusCopy?.description}
                </p>
              </div>
            </div>
          </SectionCard>
        ) : null}

        {booking ? (
          <SectionCard className="bg-[#f1f4f6]">
            <div className="grid gap-5">
              <SectionHeading
                icon={<UserRoundIcon className="size-4" />}
                title="Guest Information"
              />
              <div className="grid gap-6 md:grid-cols-2">
                <DetailRow
                  label="Guest Name"
                  value={booking.guestName ?? "Unknown guest"}
                />
                <DetailRow
                  label="Guest Email"
                  value={booking.guestEmail ?? "No email"}
                />
              </div>
            </div>
          </SectionCard>
        ) : null}

        {booking ? (
          <SectionCard className="bg-[#f1f4f6]">
            <div className="grid gap-6">
              <SectionHeading
                icon={<CalendarDaysIcon className="size-4" />}
                title="Stay Details"
              />
              <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <DetailRow label="Check-In" value={formatDate(booking.checkInDate)} />
                <DetailRow
                  label="Check-Out"
                  value={formatDate(booking.checkOutDate)}
                />
                <DetailRow
                  label="Guests"
                  value={formatGuestCount(booking.adults, booking.children)}
                />
                <DetailRow label="Created" value={formatDate(booking.createdAt)} />
              </div>
            </div>
          </SectionCard>
        ) : null}

        {booking ? (
          <SectionCard className="border-l-4 border-l-[#486272] bg-[#f1f4f6]">
            <div className="grid gap-4">
              <SectionHeading
                icon={<MessageSquareQuoteIcon className="size-4 text-[#486272]" />}
                title="Special Requests"
              />
              <div className="rounded-xl bg-white/70 p-4">
                <p className="text-sm leading-6 text-[#243033]">
                  {booking.specialRequests ??
                    "No special requests were provided for this booking."}
                </p>
              </div>
            </div>
          </SectionCard>
        ) : null}

        {booking ? (
          <BookingActions bookingId={booking.id} status={booking.status} />
        ) : null}

        {booking ? (
          <AuditLog
            logs={auditLogs ?? []}
            errorMessage={auditLogErrorMessage}
          />
        ) : null}
      </div>
    </main>
  )
}
