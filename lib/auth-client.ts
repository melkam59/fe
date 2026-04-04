import { createAuthClient } from "better-auth/react"
import type {
  AuthResponse,
  SignInInput,
  SignUpInput,
} from "@/lib/auth"

export {
  getPortalDestination,
  getPortalFromAuthPayload,
  portalOptions,
  resolvePostLoginDestination,
  signInSchema,
  signUpSchema,
  type AuthResponse,
  type AuthSession,
  type JsonObject,
  type JsonValue,
  type PortalKey,
  type SignInInput,
  type SignUpInput,
} from "@/lib/auth"

function getAppOrigin() {
  if (typeof window !== "undefined") {
    return window.location.origin
  }

  const serverOrigin =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.BETTER_AUTH_URL ??
    "http://localhost:3000"

  return serverOrigin.trim()
}

const authClientBaseURL = new URL("/api/auth", getAppOrigin()).toString()

export const authClient = createAuthClient({
  baseURL: authClientBaseURL,
})

function getAuthErrorMessage(
  result: {
    error: {
      message?: string
      status: number
      statusText: string
    } | null
  },
  fallback: string
) {
  return result.error?.message || fallback
}

export async function signUpEmail(payload: SignUpInput) {
  const result = await authClient.signUp.email(payload)

  if (result.error) {
    throw new Error(
      getAuthErrorMessage(result, "Sign-up request failed.")
    )
  }

  return result.data as unknown as AuthResponse
}

export async function signInEmail(payload: SignInInput) {
  const result = await authClient.signIn.email(payload)

  if (result.error) {
    throw new Error(
      getAuthErrorMessage(result, "Authentication request failed.")
    )
  }

  return result.data as unknown as AuthResponse
}

export async function signOut() {
  const result = await authClient.signOut()

  if (result.error) {
    throw new Error(getAuthErrorMessage(result, "Sign-out request failed."))
  }

  return result.data as unknown as AuthResponse
}

export async function getSession() {
  const result = await authClient.getSession()

  if (result.error) {
    if (result.error.status === 401 || result.error.status === 403) {
      return null
    }

    throw new Error(getAuthErrorMessage(result, "Session request failed."))
  }

  return result.data as AuthResponse
}
