import { ApiError, createRequestHeaders, getErrorMessage, parseResponse } from "@/lib/api/shared"

export async function clientApiRequest<T = unknown>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "include",
    cache: "no-store",
    headers: createRequestHeaders(init.headers, init.body != null),
  })

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
