import { z } from "zod"

function readEnvValue(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key]?.trim()

    if (value) {
      return value.replace(/\/+$/, "")
    }
  }

  return null
}

export const BACKEND_BASE_URL =
  readEnvValue(
    "BACKEND_BASE_URL",
    "NEXT_PUBLIC_BACKEND_BASE_URL",
    "NEXT_PUBLIC_API_BASE_URL",
    "NEXT_PUBLIC_AUTH_BASE_URL"
  ) ??
  "https://better-expriance-production.up.railway.app"

export const portalOptions = [
  {
    key: "admin",
    label: "Admin",
    description: "Bookings, rooms, resort operations, and dashboards.",
    destination: "/admin/dashboard",
  },
  {
    key: "staff",
    label: "Staff",
    description: "Daily assignments, service flow, and operational work.",
    destination: "/staff",
  },
  {
    key: "manager",
    label: "Manager",
    description: "Oversight, approvals, reporting, and leadership views.",
    destination: "/manager",
  },
  {
    key: "guest",
    label: "Guest",
    description: "Bookings, room browsing, services, and amenities.",
    destination: "/services",
  },
] as const

export type PortalKey = (typeof portalOptions)[number]["key"]

export const signInSchema = z.object({
  email: z.email("Enter a valid email address.").trim(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .trim(),
})

export const signUpSchema = signInSchema.extend({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .trim(),
})

export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonObject
  | JsonValue[]

export type JsonObject = {
  [key: string]: JsonValue
}

export type AuthSession = JsonObject
export type AuthResponse = JsonObject | null

export function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function getPortalOption(value?: string | null) {
  return (
    portalOptions.find((option) => option.key === value) ??
    portalOptions[0]
  )
}

export function getPortalDestination(value?: string | null) {
  return getPortalOption(value).destination
}

function readNestedJsonString(
  value: JsonObject,
  path: string[]
): string | null {
  let current: JsonValue | undefined = value

  for (const key of path) {
    if (!isJsonObject(current)) {
      return null
    }

    current = current[key]
  }

  return typeof current === "string" && current.trim() ? current : null
}

function decodeBase64String(value: string) {
  if (typeof atob === "function") {
    return atob(value)
  }

  return Buffer.from(value, "base64").toString("utf8")
}

export function parseJwtPayload(token: string): JsonObject | null {
  const [, payload] = token.split(".")

  if (!payload) {
    return null
  }

  try {
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    const padded = normalized.padEnd(
      normalized.length + ((4 - (normalized.length % 4)) % 4),
      "="
    )
    const decoded = decodeBase64String(padded)
    const parsed = JSON.parse(decoded) as unknown

    return isJsonObject(parsed) ? parsed : null
  } catch {
    return null
  }
}

function normalizeRole(value?: string | null): PortalKey | null {
  switch (value?.trim().toLowerCase()) {
    case "admin":
      return "admin"
    case "staff":
      return "staff"
    case "manager":
      return "manager"
    case "guest":
      return "guest"
    default:
      return null
  }
}

export function getAccessTokenFromAuthPayload(
  payload: AuthResponse
): string | null {
  if (!payload) {
    return null
  }

  return (
    readNestedJsonString(payload, ["token"]) ??
    readNestedJsonString(payload, ["accessToken"]) ??
    readNestedJsonString(payload, ["bearerToken"]) ??
    readNestedJsonString(payload, ["session", "token"]) ??
    readNestedJsonString(payload, ["data", "token"]) ??
    readNestedJsonString(payload, ["data", "accessToken"])
  )
}

export function getPortalFromToken(token?: string | null): PortalKey | null {
  if (!token) {
    return null
  }

  const jwtPayload = parseJwtPayload(token)

  if (!jwtPayload) {
    return null
  }

  return normalizeRole(
    readNestedJsonString(jwtPayload, ["role"]) ??
      readNestedJsonString(jwtPayload, ["user", "role"])
  )
}

export function getPortalFromAuthPayload(
  payload: AuthResponse
): PortalKey | null {
  if (!payload) {
    return null
  }

  const directRole =
    readNestedJsonString(payload, ["role"]) ??
    readNestedJsonString(payload, ["user", "role"]) ??
    readNestedJsonString(payload, ["data", "role"]) ??
    readNestedJsonString(payload, ["data", "user", "role"]) ??
    readNestedJsonString(payload, ["session", "role"]) ??
    readNestedJsonString(payload, ["session", "user", "role"])

  const normalizedDirectRole = normalizeRole(directRole)

  if (normalizedDirectRole) {
    return normalizedDirectRole
  }

  return getPortalFromToken(getAccessTokenFromAuthPayload(payload))
}

export function resolvePostLoginDestination(
  portal: PortalKey,
  requestedPath?: string | null
) {
  if (!requestedPath || !requestedPath.startsWith("/")) {
    return getPortalDestination(portal)
  }

  switch (portal) {
    case "admin":
      return requestedPath.startsWith("/admin")
        ? requestedPath
        : getPortalDestination(portal)
    case "staff":
      return requestedPath.startsWith("/staff")
        ? requestedPath
        : getPortalDestination(portal)
    case "manager":
      return requestedPath.startsWith("/manager")
        ? requestedPath
        : getPortalDestination(portal)
    case "guest":
      return requestedPath.startsWith("/admin") ||
        requestedPath.startsWith("/staff") ||
        requestedPath.startsWith("/manager")
        ? getPortalDestination(portal)
        : requestedPath
  }
}
