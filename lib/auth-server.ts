import { redirect } from "next/navigation"

import {
  getPortalDestination,
  getPortalFromAuthPayload,
  getPortalFromToken,
  type AuthResponse,
  type PortalKey,
} from "@/lib/auth"
import { readStoredAuthState } from "@/lib/backend-auth-state"
import { serverApiRequest } from "@/lib/api/server"
import { ApiError } from "@/lib/api/shared"

function buildLoginUrl(nextPath?: string) {
  if (!nextPath) {
    return "/login"
  }

  return `/login?next=${encodeURIComponent(nextPath)}`
}

export async function getServerSession(): Promise<AuthResponse> {
  try {
    return await serverApiRequest<AuthResponse>("/api/auth/get-session", {
      method: "GET",
    })
  } catch (error) {
    // Route protection should fail closed. If the backend auth service
    // rejects or is temporarily unavailable, redirect to login instead
    // of crashing layout rendering with an unhandled runtime error.
    if (error instanceof ApiError) {
      return null
    }

    return null
  }
}

export async function getServerPortal() {
  const { accessToken, portal } = await readStoredAuthState()

  if (
    portal === "admin" ||
    portal === "staff" ||
    portal === "manager" ||
    portal === "guest"
  ) {
    return portal
  }

  const portalFromToken = getPortalFromToken(accessToken)

  if (portalFromToken) {
    return portalFromToken
  }

  const session = await getServerSession()
  return getPortalFromAuthPayload(session)
}

export async function redirectAuthenticatedUser() {
  const portal = await getServerPortal()

  if (portal) {
    redirect(getPortalDestination(portal))
  }
}

export async function requireAuthenticatedUser(nextPath?: string) {
  const portal = await getServerPortal()

  if (!portal) {
    redirect(buildLoginUrl(nextPath))
  }

  return portal
}

export async function requirePortalAccess(
  allowedPortal: PortalKey | PortalKey[],
  nextPath?: string
) {
  const portal = await requireAuthenticatedUser(nextPath)
  const allowedPortals = Array.isArray(allowedPortal)
    ? allowedPortal
    : [allowedPortal]

  if (!allowedPortals.includes(portal)) {
    redirect(getPortalDestination(portal))
  }

  return portal
}
