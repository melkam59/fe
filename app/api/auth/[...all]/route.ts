import { NextResponse } from "next/server"

import {
  BACKEND_BASE_URL,
  isJsonObject,
  type AuthResponse,
} from "@/lib/auth"
import {
  clearStoredAuthState,
  collectSetCookieHeaders,
  persistAuthState,
} from "@/lib/backend-auth-state"
import { fetchBackend } from "@/lib/api/server"
import { parseResponse } from "@/lib/api/shared"

const AUTH_PREFIX = "/api/auth/"

function getAppOrigin(request: Request) {
  const requestOrigin = request.headers.get("origin")

  if (requestOrigin) {
    return requestOrigin
  }

  const forwardedProto = request.headers.get("x-forwarded-proto")
  const forwardedHost = request.headers.get("x-forwarded-host")

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }

  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.BETTER_AUTH_URL?.trim() ??
    "http://localhost:3000"
  )
}

function getForwardedHost(origin: string) {
  try {
    return new URL(origin).host
  } catch {
    return "localhost:3000"
  }
}

function getForwardedProto(origin: string) {
  try {
    return new URL(origin).protocol.replace(":", "")
  } catch {
    return "http"
  }
}

function createProxyResponse(payload: unknown, status: number) {
  if (payload === null) {
    return new NextResponse(null, { status })
  }

  if (typeof payload === "string") {
    return new NextResponse(payload, {
      status,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    })
  }

  return NextResponse.json(payload, { status })
}

async function proxyAuthRequest(request: Request) {
  const url = new URL(request.url)
  const authPath = url.pathname.startsWith(AUTH_PREFIX)
    ? url.pathname.slice(AUTH_PREFIX.length)
    : ""
  const appOrigin = getAppOrigin(request)
  const forwardedHost = getForwardedHost(appOrigin)
  const forwardedProto = getForwardedProto(appOrigin)
  const shouldForwardStoredAuth =
    authPath !== "sign-out" &&
    !authPath.startsWith("sign-in/") &&
    !authPath.startsWith("sign-up/")
  const backendUrl = `${BACKEND_BASE_URL}/api/auth/${authPath}${url.search}`
  const method = request.method.toUpperCase()
  const body =
    method === "GET" || method === "HEAD" ? undefined : await request.text()

  const response = await fetchBackend(
    backendUrl.replace(BACKEND_BASE_URL, ""),
    {
      method,
      body,
      headers: {
        "Content-Type":
          request.headers.get("content-type") ?? "application/json",
        origin: appOrigin,
        referer: request.headers.get("referer") ?? `${appOrigin}/`,
        "x-forwarded-host":
          request.headers.get("x-forwarded-host") ?? forwardedHost,
        "x-forwarded-proto":
          request.headers.get("x-forwarded-proto") ?? forwardedProto,
      },
    },
    { includeAuth: shouldForwardStoredAuth }
  )

  const payload = await parseResponse(response)
  const nextResponse = createProxyResponse(payload, response.status)
  const setCookieHeaders = collectSetCookieHeaders(response.headers)

  if (
    response.ok &&
    (setCookieHeaders.length ||
      (isJsonObject(payload) && payload !== null))
  ) {
    persistAuthState(
      nextResponse,
      isJsonObject(payload) ? (payload as AuthResponse) : null,
      setCookieHeaders
    )
  }

  if (
    authPath === "sign-out" ||
    response.status === 401 ||
    response.status === 403
  ) {
    clearStoredAuthState(nextResponse)
  }

  return nextResponse
}

export async function GET(request: Request) {
  return proxyAuthRequest(request)
}

export async function POST(request: Request) {
  return proxyAuthRequest(request)
}

export async function PUT(request: Request) {
  return proxyAuthRequest(request)
}

export async function PATCH(request: Request) {
  return proxyAuthRequest(request)
}

export async function DELETE(request: Request) {
  return proxyAuthRequest(request)
}

export async function OPTIONS(request: Request) {
  return proxyAuthRequest(request)
}
