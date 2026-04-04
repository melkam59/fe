import { BACKEND_BASE_URL } from "@/lib/auth"
import { readStoredAuthState } from "@/lib/backend-auth-state"
import { ApiError, createRequestHeaders, getErrorMessage, parseResponse } from "@/lib/api/shared"

type BackendFetchOptions = {
  includeAuth?: boolean
}

export async function fetchBackend(
  path: string,
  init: RequestInit = {},
  options: BackendFetchOptions = {}
) {
  const headers = createRequestHeaders(init.headers, init.body != null)

  if (options.includeAuth !== false) {
    const { backendCookieHeader, accessToken } = await readStoredAuthState()

    if (backendCookieHeader && !headers.has("cookie")) {
      headers.set("cookie", backendCookieHeader)
    }

    if (accessToken && !headers.has("authorization")) {
      headers.set("authorization", `Bearer ${accessToken}`)
    }
  }

  return fetch(`${BACKEND_BASE_URL}${path}`, {
    ...init,
    cache: init.cache ?? "no-store",
    headers,
  })
}

export async function serverApiRequest<T = unknown>(
  path: string,
  init: RequestInit = {},
  options: BackendFetchOptions = {}
): Promise<T> {
  const response = await fetchBackend(path, init, options)
  const payload = await parseResponse(response)

  if (!response.ok) {
    throw new ApiError(
      response.status,
      getErrorMessage(payload, "Request failed."),
      payload
    )
  }

  return payload as T
}
