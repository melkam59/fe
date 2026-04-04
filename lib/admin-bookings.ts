import { isJsonObject } from "@/lib/auth"
import { serverApiRequest } from "@/lib/api/server"

export type AdminBookingListFilters = {
  page: number
  limit: number
  status?: string
}

export type AdminBooking = {
  id: string
  status: string
  guestName: string | null
  guestEmail: string | null
  resortName: string | null
  roomLabel: string | null
  checkInDate: string | null
  checkOutDate: string | null
  createdAt: string | null
  adults: number | null
  children: number | null
  specialRequests: string | null
}

export type AdminBookingsPage = {
  items: AdminBooking[]
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type AdminBookingAuditLog = {
  id: string
  action: string
  actorName: string | null
  actorEmail: string | null
  createdAt: string | null
  reason: string | null
  notes: string | null
  fromStatus: string | null
  toStatus: string | null
}

function readObjectValue(source: unknown, keys: string[]) {
  if (!isJsonObject(source)) {
    return null
  }

  for (const key of keys) {
    const candidate = source[key]

    if (isJsonObject(candidate)) {
      return candidate
    }
  }

  return null
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function readNestedString(source: unknown, path: string[]): string | null {
  let current = source

  for (const key of path) {
    if (!isJsonObject(current)) {
      return null
    }

    current = current[key]
  }

  return readString(current)
}

function readNestedNumber(source: unknown, path: string[]): number | null {
  let current = source

  for (const key of path) {
    if (!isJsonObject(current)) {
      return null
    }

    current = current[key]
  }

  return readNumber(current)
}

function readObjectArray(source: unknown, keys: string[]): unknown[] {
  if (Array.isArray(source)) {
    return source
  }

  if (!isJsonObject(source)) {
    return []
  }

  for (const key of keys) {
    const candidate = source[key]

    if (Array.isArray(candidate)) {
      return candidate
    }
  }

  return []
}

function readNestedObjectArray(source: unknown, paths: string[][]): unknown[] {
  for (const path of paths) {
    let current = source

    for (const key of path) {
      if (!isJsonObject(current)) {
        current = null
        break
      }

      current = current[key]
    }

    if (Array.isArray(current)) {
      return current
    }
  }

  return []
}

function createRoomLabel(source: unknown) {
  const roomNumber =
    readNestedString(source, ["room", "roomNumber"]) ??
    readNestedString(source, ["roomNumber"])
  const roomType =
    readNestedString(source, ["room", "type"]) ??
    readNestedString(source, ["type"])

  if (roomNumber && roomType) {
    return `${roomNumber} · ${roomType}`
  }

  return roomNumber ?? roomType ?? null
}

function parseBooking(source: unknown): AdminBooking | null {
  if (!isJsonObject(source)) {
    return null
  }

  const id =
    readString(source.id) ??
    readString(source.bookingId) ??
    readString(source._id)

  if (!id) {
    return null
  }

  return {
    id,
    status: readString(source.status) ?? "unknown",
    guestName:
      readNestedString(source, ["user", "name"]) ??
      readNestedString(source, ["guest", "name"]) ??
      readNestedString(source, ["customer", "name"]) ??
      readString(source.guestName),
    guestEmail:
      readNestedString(source, ["user", "email"]) ??
      readNestedString(source, ["guest", "email"]) ??
      readNestedString(source, ["customer", "email"]) ??
      readString(source.guestEmail),
    resortName:
      readNestedString(source, ["resort", "name"]) ??
      readString(source.resortName),
    roomLabel: createRoomLabel(source),
    checkInDate:
      readString(source.checkInDate) ??
      readString(source.checkIn) ??
      readString(source.startDate),
    checkOutDate:
      readString(source.checkOutDate) ??
      readString(source.checkOut) ??
      readString(source.endDate),
    createdAt: readString(source.createdAt),
    adults: readNumber(source.adults),
    children: readNumber(source.children),
    specialRequests:
      readString(source.specialRequests) ??
      readString(source.notes),
  }
}

function readPaginationValue(
  payload: unknown,
  directKey: string,
  nestedPaths: string[][]
) {
  if (isJsonObject(payload)) {
    const directValue = readNumber(payload[directKey])

    if (directValue !== null) {
      return directValue
    }
  }

  for (const path of nestedPaths) {
    const value = readNestedNumber(payload, path)

    if (value !== null) {
      return value
    }
  }

  return null
}

function parseBookingsPage(
  payload: unknown,
  filters: AdminBookingListFilters
): AdminBookingsPage {
  const items = readObjectArray(payload, [
    "bookings",
    "items",
    "results",
    "data",
  ])
    .map(parseBooking)
    .filter((booking): booking is AdminBooking => booking !== null)

  const total =
    readPaginationValue(payload, "total", [
      ["meta", "total"],
      ["pagination", "total"],
      ["data", "total"],
    ]) ?? items.length

  const page =
    readPaginationValue(payload, "page", [
      ["meta", "page"],
      ["pagination", "page"],
      ["data", "page"],
    ]) ?? filters.page

  const limit =
    readPaginationValue(payload, "limit", [
      ["meta", "limit"],
      ["pagination", "limit"],
      ["data", "limit"],
    ]) ?? filters.limit

  const totalPages =
    readPaginationValue(payload, "totalPages", [
      ["meta", "totalPages"],
      ["pagination", "totalPages"],
      ["data", "totalPages"],
    ]) ?? Math.max(1, Math.ceil(total / Math.max(1, limit)))

  return {
    items,
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  }
}

function parseBookingDetail(payload: unknown): AdminBooking | null {
  const directBooking = parseBooking(payload)

  if (directBooking) {
    return directBooking
  }

  const nestedBooking = readObjectValue(payload, [
    "booking",
    "item",
    "data",
    "result",
  ])

  return parseBooking(nestedBooking)
}

function parseAuditLog(source: unknown): AdminBookingAuditLog | null {
  if (!isJsonObject(source)) {
    return null
  }

  const action =
    readString(source.action) ??
    readString(source.event) ??
    readString(source.type) ??
    readString(source.status) ??
    "updated"

  const createdAt =
    readString(source.createdAt) ??
    readString(source.timestamp) ??
    readString(source.loggedAt) ??
    readString(source.performedAt)

  const actorName =
    readNestedString(source, ["actor", "name"]) ??
    readNestedString(source, ["admin", "name"]) ??
    readNestedString(source, ["user", "name"]) ??
    readNestedString(source, ["performedBy", "name"]) ??
    readNestedString(source, ["createdBy", "name"])

  const actorEmail =
    readNestedString(source, ["actor", "email"]) ??
    readNestedString(source, ["admin", "email"]) ??
    readNestedString(source, ["user", "email"]) ??
    readNestedString(source, ["performedBy", "email"]) ??
    readNestedString(source, ["createdBy", "email"])

  const id =
    readString(source.id) ??
    readString(source.auditLogId) ??
    readString(source._id) ??
    [action, createdAt, actorEmail, actorName].filter(Boolean).join(":")

  if (!id) {
    return null
  }

  return {
    id,
    action,
    actorName,
    actorEmail,
    createdAt,
    reason:
      readString(source.reason) ?? readString(source.cancellationReason),
    notes:
      readString(source.message) ??
      readString(source.description) ??
      readString(source.notes) ??
      readString(source.details),
    fromStatus:
      readString(source.fromStatus) ??
      readString(source.previousStatus) ??
      readString(source.statusFrom),
    toStatus:
      readString(source.toStatus) ??
      readString(source.nextStatus) ??
      readString(source.statusTo) ??
      readString(source.status),
  }
}

function parseBookingAuditLogs(payload: unknown) {
  const items = [
    ...readObjectArray(payload, ["auditLogs", "logs", "items", "results"]),
    ...readNestedObjectArray(payload, [
      ["data", "auditLogs"],
      ["data", "logs"],
      ["data", "items"],
      ["result", "auditLogs"],
      ["result", "logs"],
    ]),
  ]

  return items
    .map(parseAuditLog)
    .filter((auditLog): auditLog is AdminBookingAuditLog => auditLog !== null)
}

async function mutateAdminBooking(path: string, body?: unknown) {
  await serverApiRequest<unknown>(path, {
    method: "POST",
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export async function listAdminBookings(
  filters: AdminBookingListFilters
): Promise<AdminBookingsPage> {
  const query = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
  })

  if (filters.status && filters.status !== "all") {
    query.set("status", filters.status)
  }

  const payload = await serverApiRequest<unknown>(
    `/api/admin/bookings?${query.toString()}`,
    {
      method: "GET",
    }
  )

  return parseBookingsPage(payload, filters)
}

export async function getAdminBooking(bookingId: string) {
  const payload = await serverApiRequest<unknown>(
    `/api/admin/bookings/${bookingId}`,
    {
      method: "GET",
    }
  )

  return parseBookingDetail(payload)
}

export async function getAdminBookingAuditLogs(bookingId: string) {
  const payload = await serverApiRequest<unknown>(
    `/api/admin/bookings/${bookingId}/audit-logs`,
    {
      method: "GET",
    }
  )

  return parseBookingAuditLogs(payload)
}

export async function confirmAdminBooking(bookingId: string) {
  await mutateAdminBooking(`/api/admin/bookings/${bookingId}/confirm`)
}

export async function checkInAdminBooking(bookingId: string) {
  await mutateAdminBooking(`/api/admin/bookings/${bookingId}/check-in`)
}

export async function checkOutAdminBooking(bookingId: string) {
  await mutateAdminBooking(`/api/admin/bookings/${bookingId}/check-out`)
}

export async function markAdminBookingNoShow(bookingId: string) {
  await mutateAdminBooking(`/api/admin/bookings/${bookingId}/no-show`)
}

export async function cancelAdminBooking(
  bookingId: string,
  cancellationReason: string
) {
  await mutateAdminBooking(`/api/admin/bookings/${bookingId}/cancel`, {
    cancellationReason,
  })
}
