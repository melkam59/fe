import { isJsonObject } from "@/lib/auth"
import { serverApiRequest } from "@/lib/api/server"

export type AdminRoomListFilters = {
  page: number
  limit: number
  resortId?: string
  status?: string
  floor?: number
}

export type AdminRoom = {
  id: string
  resortId: string | null
  resortName: string | null
  roomNumber: string | null
  type: string | null
  floor: number | null
  sizeSqm: string | null
  maxGuests: number | null
  bedConfiguration: string | null
  basePriceCents: number | null
  status: string | null
  accessible: boolean | null
  notes: string | null
  amenities: string[]
  createdAt: string | null
}

export type AdminRoomsPage = {
  items: AdminRoom[]
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type AdminRoomInput = {
  resortId: string
  roomNumber: string
  type: string
  floor: number
  sizeSqm: string
  maxGuests: number
  bedConfiguration: string
  basePriceCents: number
  accessible: boolean
  notes: string
  amenities: string[]
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null
}

function readNestedString(source: unknown, path: string[]) {
  let current = source

  for (const key of path) {
    if (!isJsonObject(current)) {
      return null
    }

    current = current[key]
  }

  return readString(current)
}

function readObjectArray(source: unknown, keys: string[]) {
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

function readStringArray(source: unknown, keys: string[]) {
  const items = readObjectArray(source, keys)

  return items
    .map((item) => {
      if (typeof item === "string" && item.trim()) {
        return item
      }

      if (isJsonObject(item)) {
        return (
          readString(item.name) ??
          readString(item.id) ??
          readString(item.amenityId) ??
          null
        )
      }

      return null
    })
    .filter((item): item is string => item !== null)
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
    let current = payload

    for (const key of path) {
      if (!isJsonObject(current)) {
        current = null
        break
      }

      current = current[key]
    }

    const value = readNumber(current)

    if (value !== null) {
      return value
    }
  }

  return null
}

function parseRoom(source: unknown): AdminRoom | null {
  if (!isJsonObject(source)) {
    return null
  }

  const id =
    readString(source.id) ??
    readString(source.roomId) ??
    readString(source._id)

  if (!id) {
    return null
  }

  return {
    id,
    resortId:
      readNestedString(source, ["resort", "id"]) ?? readString(source.resortId),
    resortName:
      readNestedString(source, ["resort", "name"]) ?? readString(source.resortName),
    roomNumber: readString(source.roomNumber),
    type: readString(source.type),
    floor: readNumber(source.floor),
    sizeSqm: readString(source.sizeSqm),
    maxGuests: readNumber(source.maxGuests),
    bedConfiguration: readString(source.bedConfiguration),
    basePriceCents: readNumber(source.basePriceCents),
    status: readString(source.status),
    accessible: readBoolean(source.accessible),
    notes: readString(source.notes),
    amenities: readStringArray(source, ["amenities"]),
    createdAt: readString(source.createdAt),
  }
}

function parseRoomDetail(payload: unknown) {
  const directRoom = parseRoom(payload)

  if (directRoom) {
    return directRoom
  }

  if (!isJsonObject(payload)) {
    return null
  }

  return (
    parseRoom(payload.room) ??
    parseRoom(payload.item) ??
    parseRoom(payload.data) ??
    parseRoom(payload.result)
  )
}

function parseRoomsPage(
  payload: unknown,
  filters: AdminRoomListFilters
): AdminRoomsPage {
  const items = readObjectArray(payload, ["rooms", "items", "results", "data"])
    .map(parseRoom)
    .filter((room): room is AdminRoom => room !== null)

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

export async function listAdminRooms(
  filters: AdminRoomListFilters
): Promise<AdminRoomsPage> {
  const query = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
  })

  if (filters.resortId?.trim()) {
    query.set("resortId", filters.resortId.trim())
  }

  if (filters.status?.trim() && filters.status !== "all") {
    query.set("status", filters.status)
  }

  if (typeof filters.floor === "number" && Number.isFinite(filters.floor)) {
    query.set("floor", String(filters.floor))
  }

  const payload = await serverApiRequest<unknown>(
    `/api/admin/rooms?${query.toString()}`,
    { method: "GET" }
  )

  return parseRoomsPage(payload, filters)
}

export async function getAdminRoom(roomId: string) {
  const payload = await serverApiRequest<unknown>(
    `/api/admin/rooms/${roomId}`,
    { method: "GET" }
  )

  return parseRoomDetail(payload)
}

export async function createAdminRoom(payload: AdminRoomInput) {
  await serverApiRequest("/api/admin/rooms", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateAdminRoom(
  roomId: string,
  payload: Partial<AdminRoomInput>
) {
  await serverApiRequest(`/api/admin/rooms/${roomId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export async function deleteAdminRoom(roomId: string) {
  await serverApiRequest(`/api/admin/rooms/${roomId}`, {
    method: "DELETE",
  })
}
