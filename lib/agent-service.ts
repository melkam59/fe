import { z } from "zod"

import {
  ApiError,
  createRequestHeaders,
  getErrorMessage,
  parseResponse,
} from "@/lib/api/shared"

function readAgentBaseUrl() {
  const configuredBaseUrl = (
    process.env.AGENT_BASE_URL?.trim() ||
    process.env.INTERNAL_AGENT_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_AGENT_BASE_URL?.trim() ||
    process.env.AGENT_SERVICE_BASE_URL?.trim()
  )?.replace(/\/+$/, "")

  if (configuredBaseUrl) {
    return configuredBaseUrl
  }

  return process.env.NODE_ENV === "production"
    ? null
    : "http://localhost:8000"
}

export const AGENT_SERVICE_BASE_URL = readAgentBaseUrl()

function requireAgentBaseUrl() {
  if (AGENT_SERVICE_BASE_URL) {
    return AGENT_SERVICE_BASE_URL
  }

  throw new Error(
    "Missing frontend agent configuration. Set AGENT_BASE_URL, INTERNAL_AGENT_BASE_URL, NEXT_PUBLIC_AGENT_BASE_URL, or AGENT_SERVICE_BASE_URL to your deployed AIS URL."
  )
}

const actorSchema = z.object({
  actor_type: z.string(),
  user_id: z.string(),
  internal_staff_id: z.string().nullable().optional(),
})

const conversationSchema = z.object({
  conversation_id: z.string(),
  channel: z.string(),
  language: z.string(),
})

const bookingContextSchema = z.object({
  booking_id: z.string().optional(),
  room_id: z.string().optional(),
  resort_id: z.string().optional(),
  status: z.string().optional(),
})

const messageSchema = z.object({
  message_id: z.string(),
  content: z.string(),
  role: z.string(),
})

const policyContextSchema = z.object({
  proposal_required_for_writes: z.boolean(),
  allowed_tool_names: z.array(z.string()),
})

export const agentRespondRequestSchema = z.object({
  request_id: z.string(),
  trace_id: z.string(),
  actor: actorSchema,
  conversation: conversationSchema,
  booking_context: bookingContextSchema,
  message: messageSchema,
  policy_context: policyContextSchema,
})

const agentProposalSchema = z.object({
  tool_name: z.string(),
  action_summary: z.string(),
  risk_level: z.string().optional(),
  arguments: z.record(z.string(), z.unknown()).default({}),
  idempotency_key: z.string().optional(),
})

const agentIntentSchema = z.object({
  primary: z.string(),
  secondary: z.array(z.string()).default([]),
  confidence: z.number().nullable().optional(),
})

const agentAssistantMessageSchema = z.object({
  role: z.string(),
  content: z.string(),
})

const agentRoutingSchema = z.object({
  primary_agent: z.string().optional(),
  confidence: z.number().nullable().optional(),
})

export type AgentError = {
  code: string | null
  message: string
  details: Record<string, unknown> | null
}

export type AgentHandover = {
  required: boolean
  reason: string | null
  summary: string | null
  recommended_queue: string | null
  suggested_action: string | null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeAgentError(value: unknown): AgentError {
  if (typeof value === "string" && value.trim()) {
    return {
      code: null,
      message: value.trim(),
      details: null,
    }
  }

  if (!isRecord(value)) {
    return {
      code: null,
      message: "Unknown agent error.",
      details: null,
    }
  }

  const code =
    typeof value.code === "string" && value.code.trim() ? value.code : null

  if (typeof value.message === "string" && value.message.trim()) {
    return {
      code,
      message: value.message,
      details: value,
    }
  }

  const parts = [
    code,
    Array.isArray(value.path) && value.path.length
      ? `at ${value.path.join(".")}`
      : null,
    typeof value.expected === "string"
      ? `expected ${value.expected}`
      : null,
    typeof value.received === "string"
      ? `received ${value.received}`
      : null,
  ].filter(Boolean)

  return {
    code,
    message: parts.length ? parts.join(" - ") : JSON.stringify(value),
    details: value,
  }
}

function normalizeAgentHandover(value: unknown): AgentHandover | null {
  if (!isRecord(value)) {
    return null
  }

  const summary =
    typeof value.summary === "string" && value.summary.trim()
      ? value.summary
      : typeof value.suggested_action === "string" && value.suggested_action.trim()
        ? value.suggested_action
        : null

  return {
    required: value.required !== false,
    reason:
      typeof value.reason === "string" && value.reason.trim()
        ? value.reason
        : null,
    summary,
    recommended_queue:
      typeof value.recommended_queue === "string" &&
      value.recommended_queue.trim()
        ? value.recommended_queue
        : typeof value.queue === "string" && value.queue.trim()
          ? value.queue
          : null,
    suggested_action:
      typeof value.suggested_action === "string" && value.suggested_action.trim()
        ? value.suggested_action
        : null,
  }
}

export const agentRespondResponseSchema = z.object({
  request_id: z.string(),
  response_type: z.string(),
  intent: agentIntentSchema.optional(),
  assistant_message: agentAssistantMessageSchema.nullable().optional(),
  proposals: z.array(agentProposalSchema).default([]),
  handover: z
    .unknown()
    .optional()
    .transform((value) => normalizeAgentHandover(value)),
  routing: agentRoutingSchema.optional(),
  errors: z.array(z.unknown()).default([]).transform((errors) => {
    return errors.map(normalizeAgentError)
  }),
})

export type AgentRespondRequest = z.infer<typeof agentRespondRequestSchema>
export type AgentRespondResponse = z.infer<typeof agentRespondResponseSchema>
export type AgentProposal = z.infer<typeof agentProposalSchema>

async function agentRequest<T>(
  path: string,
  payload: unknown,
  schema: z.ZodType<T>
): Promise<T> {
  const response = await fetch(`${requireAgentBaseUrl()}${path}`, {
    method: "POST",
    cache: "no-store",
    headers: createRequestHeaders(undefined, true),
    body: JSON.stringify(payload),
  })

  const parsedPayload = await parseResponse(response)

  if (!response.ok) {
    throw new ApiError(
      response.status,
      getErrorMessage(parsedPayload, "The concierge service is unavailable."),
      parsedPayload
    )
  }

  return schema.parse(parsedPayload)
}

export async function getAgentHealth() {
  const response = await fetch(`${requireAgentBaseUrl()}/health`, {
    method: "GET",
    cache: "no-store",
  })

  const payload = await parseResponse(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Agent healthcheck failed."))
  }

  return payload
}

export async function respondWithAgent(payload: AgentRespondRequest) {
  const request = agentRespondRequestSchema.parse(payload)

  return agentRequest(
    "/internal/agent/respond",
    request,
    agentRespondResponseSchema
  )
}

export async function recommendWithAgent(payload: unknown) {
  return agentRequest(
    "/internal/agent/recommend",
    payload,
    z.unknown()
  )
}

export async function scoreAgentSentiment(payload: unknown) {
  return agentRequest(
    "/internal/agent/sentiment/score",
    payload,
    z.unknown()
  )
}

export async function summarizeAgentMemory(payload: unknown) {
  return agentRequest(
    "/internal/agent/memory/summarize",
    payload,
    z.unknown()
  )
}
