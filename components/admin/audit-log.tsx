import { ActivityIcon } from "lucide-react"

import { BookingStatusBadge } from "@/components/booking/booking-status-badge"
import { type AdminBookingAuditLog } from "@/lib/admin-bookings"

function formatDateTime(value: string | null) {
  if (!value) {
    return "Unknown time"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date)
}

function formatLabel(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function AuditLog({
  logs,
  errorMessage,
}: {
  logs: AdminBookingAuditLog[]
  errorMessage?: string | null
}) {
  return (
    <section className="rounded-[1.5rem] border border-[#dbe4e7]/80 bg-[#fdfefe] p-6 shadow-[0px_12px_32px_-16px_rgba(43,52,55,0.22)]">
      <div className="grid gap-5">
        <div className="grid gap-1">
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-[#1a1a1a]">
            <ActivityIcon className="size-4 text-[#737c7f]" />
            Audit Log
          </h2>
          <p className="text-sm text-[#586064]">
            Track the admin-side history for this booking.
          </p>
        </div>

        {errorMessage ? (
          <div className="rounded-[1.25rem] border border-dashed border-[#abb3b7]/70 bg-[#f8f9fa] p-4 text-sm text-[#586064]">
            {errorMessage}
          </div>
        ) : logs.length ? (
          <div className="grid gap-4">
            {logs.map((log) => (
              <div
                key={log.id}
                className="grid gap-3 rounded-[1.25rem] bg-[#f1f4f6] p-4 ring-1 ring-[#dbe4e7]/70"
              >
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div className="grid gap-1">
                    <p className="font-heading text-base font-bold text-[#243033]">
                      {formatLabel(log.action)}
                    </p>
                    <p className="text-sm text-[#586064]">
                      {log.actorName ?? "Unknown actor"}
                      {log.actorEmail ? ` · ${log.actorEmail}` : ""}
                    </p>
                  </div>
                  <p className="text-sm text-[#586064]">
                    {formatDateTime(log.createdAt)}
                  </p>
                </div>

                {log.fromStatus || log.toStatus ? (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {log.fromStatus ? (
                      <BookingStatusBadge status={log.fromStatus} />
                    ) : null}
                    {log.fromStatus && log.toStatus ? (
                      <span className="text-[#586064]">to</span>
                    ) : null}
                    {log.toStatus ? (
                      <BookingStatusBadge status={log.toStatus} />
                    ) : null}
                  </div>
                ) : null}

                {log.reason ? (
                  <div className="grid gap-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.08rem] text-[#737c7f]">
                      Reason
                    </p>
                    <p className="text-sm text-[#243033]">{log.reason}</p>
                  </div>
                ) : null}

                {log.notes ? (
                  <div className="grid gap-1">
                    <p className="text-[10px] font-bold uppercase tracking-[0.08rem] text-[#737c7f]">
                      Notes
                    </p>
                    <p className="text-sm text-[#243033]">{log.notes}</p>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.25rem] border border-dashed border-[#abb3b7]/70 bg-[#f8f9fa] p-4 text-sm text-[#586064]">
            No audit log entries are available for this booking yet.
          </div>
        )}
      </div>
    </section>
  )
}
