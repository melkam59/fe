import { isJsonObject } from "@/lib/auth"
import { serverApiRequest } from "@/lib/api/server"

export type AdminResortListFilters = {
  page: number
  limit: number
  search?: string
}

export type AdminResort = {
  id: string
  name: string
  location: string | null
  currency: string | null
  checkInTime: string | null
  checkOutTime: string | null
  maxNights: number | null
  createdAt: string | null
}

export type AdminResortsPage = {
  items: AdminResort[]
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}

export type AdminResortInput = {
  name: string
  location: string
  currency: string
  checkInTime: string
  checkOutTime: string
  maxNights: number
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

function parseResort(source: unknown): AdminResort | null {
  if (!isJsonObject(source)) {
    return null
  }

  const id =
    readString(source.id) ??
    readString(source.resortId) ??
    readString(source._id)

  if (!id) {
    return null
  }

  return {
    id,
    name: readString(source.name) ?? "Unnamed resort",
    location: readString(source.location),
    currency: readString(source.currency),
    checkInTime:
      readString(source.checkInTime) ?? readString(source.check_in_time),
    checkOutTime:
      readString(source.checkOutTime) ?? readString(source.check_out_time),
    maxNights: readNumber(source.maxNights),
    createdAt: readString(source.createdAt),
  }
}

function parseResortDetail(payload: unknown) {
  const directResort = parseResort(payload)

  if (directResort) {
    return directResort
  }

  if (!isJsonObject(payload)) {
    return null
  }

  return (
    parseResort(payload.resort) ??
    parseResort(payload.item) ??
    parseResort(payload.data) ??
    parseResort(payload.result)
  )
}

function parseResortsPage(
  payload: unknown,
  filters: AdminResortListFilters
): AdminResortsPage {
  const items = readObjectArray(payload, ["resorts", "items", "results", "data"])
    .map(parseResort)
    .filter((resort): resort is AdminResort => resort !== null)

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

export async function listAdminResorts(
  filters: AdminResortListFilters
): Promise<AdminResortsPage> {
  const query = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
  })

  if (filters.search?.trim()) {
    query.set("search", filters.search.trim())
  }

  const payload = await serverApiRequest<unknown>(
    `/api/admin/resorts?${query.toString()}`,
    { method: "GET" }
  )

  return parseResortsPage(payload, filters)
}

export async function getAdminResort(resortId: string) {
  const payload = await serverApiRequest<unknown>(
    `/api/admin/resorts/${resortId}`,
    { method: "GET" }
  )

  return parseResortDetail(payload)
}

export async function createAdminResort(payload: AdminResortInput) {
  await serverApiRequest("/api/admin/resorts", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export async function updateAdminResort(
  resortId: string,
  payload: Partial<AdminResortInput>
) {
  await serverApiRequest(`/api/admin/resorts/${resortId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  })
}

export async function deleteAdminResort(resortId: string) {
  await serverApiRequest(`/api/admin/resorts/${resortId}`, {
    method: "DELETE",
  })
}
