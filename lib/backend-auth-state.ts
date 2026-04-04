import { NextResponse } from "next/server"
import { cookies } from "next/headers"

import {
  getAccessTokenFromAuthPayload,
  getPortalFromAuthPayload,
  type AuthResponse,
} from "@/lib/auth"

const BACKEND_SESSION_COOKIE_NAME = "__be_backend_session"
const BACKEND_ACCESS_TOKEN_COOKIE_NAME = "__be_backend_access_token"
const BACKEND_PORTAL_COOKIE_NAME = "__be_portal"

const authCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
}

function splitSetCookieHeader(value: string) {
  return value
    .split(/,(?=\s*[^;,=\s]+=[^;]+)/g)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function extractCookiePair(setCookieHeader: string) {
  const cookiePair = setCookieHeader.split(";")[0]?.trim()

  return cookiePair && cookiePair.includes("=") ? cookiePair : null
}

function decodeSessionCookie(value?: string | null) {
  if (!value) {
    return []
  }

  try {
    const parsed = JSON.parse(decodeURIComponent(value)) as unknown

    if (!Array.isArray(parsed)) {
      return []
    }

    return parsed.filter(
      (entry): entry is string =>
        typeof entry === "string" && entry.includes("=")
    )
  } catch {
    return []
  }
}

function encodeSessionCookie(value: string[]) {
  return encodeURIComponent(JSON.stringify(value))
}

export function collectSetCookieHeaders(headers: Headers) {
  const headerBag = headers as Headers & {
    getSetCookie?: () => string[]
  }

  if (typeof headerBag.getSetCookie === "function") {
    return headerBag.getSetCookie().filter(Boolean)
  }

  const combinedHeader = headers.get("set-cookie")
  return combinedHeader ? splitSetCookieHeader(combinedHeader) : []
}

export async function readStoredAuthState() {
  const cookieStore = await cookies()
  const backendSessionCookie = decodeSessionCookie(
    cookieStore.get(BACKEND_SESSION_COOKIE_NAME)?.value
  )

  return {
    backendCookieHeader: backendSessionCookie.length
      ? backendSessionCookie.join("; ")
      : null,
    accessToken:
      cookieStore.get(BACKEND_ACCESS_TOKEN_COOKIE_NAME)?.value ?? null,
    portal: cookieStore.get(BACKEND_PORTAL_COOKIE_NAME)?.value ?? null,
  }
}

export function persistAuthState(
  response: NextResponse,
  payload: AuthResponse,
  setCookieHeaders: string[]
) {
  const cookiePairs = setCookieHeaders
    .map(extractCookiePair)
    .filter((value): value is string => Boolean(value))

  if (cookiePairs.length) {
    response.cookies.set(
      BACKEND_SESSION_COOKIE_NAME,
      encodeSessionCookie(cookiePairs),
      authCookieOptions
    )
  }

  const accessToken = getAccessTokenFromAuthPayload(payload)

  if (accessToken) {
    response.cookies.set(
      BACKEND_ACCESS_TOKEN_COOKIE_NAME,
      accessToken,
      authCookieOptions
    )
  }

  const portal = getPortalFromAuthPayload(payload)

  if (portal) {
    response.cookies.set(BACKEND_PORTAL_COOKIE_NAME, portal, authCookieOptions)
  }
}

export function clearStoredAuthState(response: NextResponse) {
  response.cookies.delete(BACKEND_SESSION_COOKIE_NAME)
  response.cookies.delete(BACKEND_ACCESS_TOKEN_COOKIE_NAME)
  response.cookies.delete(BACKEND_PORTAL_COOKIE_NAME)
}
