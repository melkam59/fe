import { z } from "zod"

import { getErrorMessage, parseResponse } from "@/lib/api/shared"

export const AGENT_SERVICE_BASE_URL =
  process.env.AGENT_SERVICE_BASE_URL?.trim() ||
  "https://agentic-intelligence-systems-production.up.railway.app"

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

function normalizeAgentError(value: unknown) {
  if (typeof value === "string" && value.trim()) {
    return value
  }

  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return "Unknown agent error."
  }

  const candidate = value as {
    message?: unknown
    code?: unknown
    path?: unknown
    expected?: unknown
    received?: unknown
  }

  if (typeof candidate.message === "string" && candidate.message.trim()) {
    return candidate.message
  }

  const parts = [
    typeof candidate.code === "string" ? candidate.code : null,
    Array.isArray(candidate.path) && candidate.path.length
      ? `at ${candidate.path.join(".")}`
      : null,
    typeof candidate.expected === "string"
      ? `expected ${candidate.expected}`
      : null,
    typeof candidate.received === "string"
      ? `received ${candidate.received}`
      : null,
  ].filter(Boolean)

  return parts.length ? parts.join(" - ") : JSON.stringify(value)
}

const agentHandoverSchema = z
  .object({
    reason: z.string().optional(),
    queue: z.string().optional(),
    suggested_action: z.string().optional(),
  })
  .nullable()
  .optional()

export const agentRespondResponseSchema = z.object({
  request_id: z.string(),
  response_type: z.string(),
  intent: agentIntentSchema.optional(),
  assistant_message: agentAssistantMessageSchema,
  proposals: z.array(agentProposalSchema).default([]),
  handover: agentHandoverSchema,
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
  const response = await fetch(`${AGENT_SERVICE_BASE_URL}${path}`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  const parsedPayload = await parseResponse(response)

  if (!response.ok) {
    throw new Error(
      getErrorMessage(parsedPayload, "Agent service request failed.")
    )
  }

  return schema.parse(parsedPayload)
}

export async function getAgentHealth() {
  const response = await fetch(`${AGENT_SERVICE_BASE_URL}/health`, {
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
