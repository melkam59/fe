import { isJsonObject } from "@/lib/auth"

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly payload: unknown
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export function getErrorMessage(
  payload: unknown,
  fallback: string
): string {
  if (typeof payload === "string" && payload.trim()) {
    return payload
  }

  if (!isJsonObject(payload)) {
    return fallback
  }

  const directMessage = payload.message
  if (typeof directMessage === "string" && directMessage.trim()) {
    return directMessage
  }

  const directError = payload.error
  if (typeof directError === "string" && directError.trim()) {
    return directError
  }

  if (isJsonObject(directError)) {
    const nestedMessage = directError.message
    if (typeof nestedMessage === "string" && nestedMessage.trim()) {
      return nestedMessage
    }
  }

  return fallback
}

export async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    return response.json()
  }

  const text = await response.text()
  return text || null
}

export function createRequestHeaders(
  headers: HeadersInit | undefined,
  hasBody: boolean
) {
  const requestHeaders = new Headers(headers)

  if (hasBody && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json")
  }

  return requestHeaders
}
