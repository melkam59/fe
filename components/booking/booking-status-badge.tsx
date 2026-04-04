import { Badge } from "@/components/ui/badge"

function getStatusVariant(status: string) {
  switch (status.trim().toLowerCase()) {
    case "confirmed":
    case "check_in":
    case "check-in":
    case "checked_in":
    case "checked-in":
      return "default" as const
    case "pending":
      return "secondary" as const
    case "cancelled":
    case "canceled":
    case "no_show":
    case "no-show":
      return "destructive" as const
    default:
      return "outline" as const
  }
}

function formatStatus(status: string) {
  if (!status.trim()) {
    return "Unknown"
  }

  return status
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function BookingStatusBadge({ status }: { status: string }) {
  return <Badge variant={getStatusVariant(status)}>{formatStatus(status)}</Badge>
}
