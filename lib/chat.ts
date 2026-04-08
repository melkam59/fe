import { z } from "zod"

import type {
  AgentProposal,
  AgentRespondResponse,
} from "@/lib/agent-service"

export const frontendChatMessageRequestSchema = z.object({
  threadId: z.string().trim().min(1).optional().nullable(),
  message: z.object({
    id: z.string().trim().min(1).optional(),
    content: z.string().trim().min(1),
  }),
  bookingContext: z
    .object({
      bookingId: z.string().trim().min(1).nullable().optional(),
      roomId: z.string().trim().min(1).nullable().optional(),
      resortId: z.string().trim().min(1).nullable().optional(),
      status: z.string().trim().min(1).nullable().optional(),
    })
    .optional(),
})

export type FrontendChatMessageRequest = z.infer<
  typeof frontendChatMessageRequestSchema
>

export type ChatUiKind =
  | "text"
  | "clarification"
  | "branch_options"
  | "room_options"
  | "booking_confirmation"
  | "service_catalog"
  | "service_request_confirmation"
  | "handover"

export type BranchOptionsCard = {
  kind: "branch_options"
  items: Array<{
    resortId: string
    name: string
    location: string
    selectionLabel: string
  }>
}

export type RoomOptionsCard = {
  kind: "room_options"
  items: Array<{
    roomId: string | null
    roomNumber: string
    roomType: string
    nightlyPriceCents: number | null
    nightlyPriceText: string
    maxGuests: number | null
    bedConfiguration: string | null
    notes: string | null
  }>
}

export type BookingConfirmationCard = {
  kind: "booking_confirmation"
  bookingId: string | null
  status: string | null
  totalPriceCents: number | null
  totalPriceText: string | null
  serviceMessage: string | null
}

export type ServiceCatalogCard = {
  kind: "service_catalog"
  items: Array<{
    serviceId: string
    name: string
    category: string | null
    priceCents: number | null
    priceText: string | null
    durationMins: number | null
    available: boolean | null
  }>
}

export type ServiceRequestConfirmationCard = {
  kind: "service_request_confirmation"
  requestType: string
  status: string
  description: string
}

export type ChatUiCard =
  | BranchOptionsCard
  | RoomOptionsCard
  | BookingConfirmationCard
  | ServiceCatalogCard
  | ServiceRequestConfirmationCard

export type FrontendChatUi = {
  kind: ChatUiKind
  cards: ChatUiCard[]
  handover: AgentRespondResponse["handover"] | null
  errors: AgentRespondResponse["errors"]
  debug: {
    requestId: string | null
    traceId: string | null
  }
}

export type FrontendChatMessageResponse = {
  threadId: string
  message: {
    id: string
    role: "assistant"
    content: string
  }
  ui: FrontendChatUi
  bookingContext: {
    bookingId: string | null
    roomId: string | null
    resortId: string | null
    status: string | null
  }
  agent: {
    intent: {
      primary: string | null
      secondary: string[]
      confidence: number | null
    }
    routing: {
      primaryAgent: string | null
      confidence: number | null
    }
    requestId: string | null
    traceId: string | null
    responseType: string
    handover: AgentRespondResponse["handover"] | null
    errors: AgentRespondResponse["errors"]
  }
  execution: {
    executed: boolean
    proposal: {
      toolName: string
      actionSummary: string
      riskLevel: string | null
    } | null
    result: null
  }
}

const roomOptionPattern =
  /room\s+([A-Za-z0-9_-]+)\s*-\s*([A-Za-z ]+?)\s*-\s*([A-Z]{3})\s*([\d,.]+)\s+per night\s*-\s*up to\s*(\d+)\s+guests?/gi
const numericDatePattern = /\b(\d{1,4})[/-](\d{1,2})[/-](\d{1,4})\b/g

type ParsedDateParts = {
  year: number
  month: number
  day: number
}

function isValidDateParts(parts: ParsedDateParts) {
  const { year, month, day } = parts

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return false
  }

  const candidate = new Date(Date.UTC(year, month - 1, day))

  return (
    candidate.getUTCFullYear() === year &&
    candidate.getUTCMonth() === month - 1 &&
    candidate.getUTCDate() === day
  )
}

function toIsoDate(parts: ParsedDateParts) {
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(
    2,
    "0"
  )}-${String(parts.day).padStart(2, "0")}`
}

function parseNumericDateToken(token: string): ParsedDateParts | null {
  const segments = token.split(/[/-]/)

  if (segments.length !== 3) {
    return null
  }

  const [first, second, third] = segments.map((value) =>
    Number.parseInt(value, 10)
  )

  if ([first, second, third].some((value) => !Number.isFinite(value))) {
    return null
  }

  if (segments[0].length === 4) {
    const candidate = {
      year: first,
      month: second,
      day: third,
    }

    return isValidDateParts(candidate) ? candidate : null
  }

  if (segments[2].length === 4) {
    const monthFirstCandidate = {
      year: third,
      month: first,
      day: second,
    }
    const dayFirstCandidate = {
      year: third,
      month: second,
      day: first,
    }

    if (first > 12 && second <= 12) {
      return isValidDateParts(dayFirstCandidate) ? dayFirstCandidate : null
    }

    if (second > 12 && first <= 12) {
      return isValidDateParts(monthFirstCandidate)
        ? monthFirstCandidate
        : null
    }

    return isValidDateParts(monthFirstCandidate)
      ? monthFirstCandidate
      : isValidDateParts(dayFirstCandidate)
        ? dayFirstCandidate
        : null
  }

  return null
}

export function normalizeDatesInMessage(content: string) {
  const invalidDates = new Set<string>()

  const normalizedContent = content.replace(numericDatePattern, (token) => {
    const parsedDate = parseNumericDateToken(token)

    if (!parsedDate) {
      invalidDates.add(token)
      return token
    }

    return toIsoDate(parsedDate)
  })

  return {
    normalizedContent,
    invalidDates: [...invalidDates],
  }
}

function toPriceCents(value: string) {
  const normalized = Number.parseFloat(value.replace(/,/g, ""))

  if (!Number.isFinite(normalized)) {
    return null
  }

  return Math.round(normalized * 100)
}

function buildProposalSummary(proposal?: AgentProposal) {
  if (!proposal) {
    return null
  }

  return {
    toolName: proposal.tool_name,
    actionSummary: proposal.action_summary,
    riskLevel: proposal.risk_level ?? null,
  }
}

function findMatchingProposalRoomId(
  proposals: AgentProposal[],
  roomNumber: string
) {
  const matchingProposal = proposals.find((proposal) => {
    const roomId = proposal.arguments.room_id

    return typeof roomId === "string" && roomId.includes(roomNumber)
  })

  const roomId = matchingProposal?.arguments.room_id
  return typeof roomId === "string" ? roomId : null
}

export function extractRoomOptionsCard(
  content: string,
  proposals: AgentProposal[]
): RoomOptionsCard | null {
  const matches = [...content.matchAll(roomOptionPattern)]

  if (!matches.length) {
    return null
  }

  return {
    kind: "room_options",
    items: matches.map((match) => ({
      roomId: findMatchingProposalRoomId(proposals, match[1]),
      roomNumber: match[1],
      roomType: match[2].trim(),
      nightlyPriceCents: toPriceCents(match[4]),
      nightlyPriceText: `${match[3]} ${match[4]}`,
      maxGuests: Number.parseInt(match[5], 10) || null,
      bedConfiguration: null,
      notes: null,
    })),
  }
}

export function inferUiKind(response: AgentRespondResponse): ChatUiKind {
  if (response.response_type === "handover_required" || response.handover) {
    return "handover"
  }

  if (response.response_type === "clarification_required") {
    return "clarification"
  }

  const roomOptionsCard = extractRoomOptionsCard(
    response.assistant_message?.content ?? "",
    response.proposals
  )

  if (roomOptionsCard) {
    return "room_options"
  }

  return "text"
}

export function buildUiCards(response: AgentRespondResponse): ChatUiCard[] {
  const roomOptionsCard = extractRoomOptionsCard(
    response.assistant_message?.content ?? "",
    response.proposals
  )

  return roomOptionsCard ? [roomOptionsCard] : []
}

export function buildFrontendChatResponse(args: {
  threadId: string
  bookingContext: FrontendChatMessageRequest["bookingContext"]
  agentResponse: AgentRespondResponse
  requestId?: string | null
  traceId?: string | null
}): FrontendChatMessageResponse {
  const {
    threadId,
    bookingContext,
    agentResponse,
    requestId = null,
    traceId = null,
  } = args
  const firstProposal = agentResponse.proposals[0]
  const content =
    agentResponse.assistant_message?.content?.trim() ||
    fallbackAgentMessage(agentResponse.response_type)

  return {
    threadId,
    message: {
      id: `${threadId}-${crypto.randomUUID()}`,
      role: "assistant",
      content,
    },
    ui: {
      kind: inferUiKind(agentResponse),
      cards: buildUiCards(agentResponse),
      handover: agentResponse.handover ?? null,
      errors: agentResponse.errors,
      debug: {
        requestId: agentResponse.request_id ?? requestId,
        traceId,
      },
    },
    bookingContext: {
      bookingId: bookingContext?.bookingId ?? null,
      roomId:
        bookingContext?.roomId ??
        (typeof firstProposal?.arguments.room_id === "string"
          ? firstProposal.arguments.room_id
          : null),
      resortId:
        bookingContext?.resortId ??
        (typeof firstProposal?.arguments.resort_id === "string"
          ? firstProposal.arguments.resort_id
          : null),
      status:
        bookingContext?.status ??
        (firstProposal?.tool_name === "create_booking" ? "pending" : null),
    },
    agent: {
      intent: {
        primary: agentResponse.intent?.primary ?? null,
        secondary: agentResponse.intent?.secondary ?? [],
        confidence: agentResponse.intent?.confidence ?? null,
      },
      routing: {
        primaryAgent: agentResponse.routing?.primary_agent ?? null,
        confidence: agentResponse.routing?.confidence ?? null,
      },
      requestId: agentResponse.request_id ?? requestId,
      traceId,
      responseType: agentResponse.response_type,
      handover: agentResponse.handover ?? null,
      errors: agentResponse.errors,
    },
    execution: {
      executed: false,
      proposal: buildProposalSummary(firstProposal),
      result: null,
    },
  }
}

export function buildClarificationResponse(args: {
  threadId: string
  bookingContext: FrontendChatMessageRequest["bookingContext"]
  content: string
  cards?: ChatUiCard[]
  uiKind?: Extract<ChatUiKind, "clarification" | "branch_options">
  requestId?: string | null
  traceId?: string | null
}): FrontendChatMessageResponse {
  const {
    threadId,
    bookingContext,
    content,
    cards = [],
    uiKind = "clarification",
    requestId = null,
    traceId = null,
  } = args

  return {
    threadId,
    message: {
      id: `${threadId}-${crypto.randomUUID()}`,
      role: "assistant",
      content,
    },
    ui: {
      kind: uiKind,
      cards,
      handover: null,
      errors: [],
      debug: {
        requestId,
        traceId,
      },
    },
    bookingContext: {
      bookingId: bookingContext?.bookingId ?? null,
      roomId: bookingContext?.roomId ?? null,
      resortId: bookingContext?.resortId ?? null,
      status: bookingContext?.status ?? null,
    },
    agent: {
      intent: {
        primary: null,
        secondary: [],
        confidence: null,
      },
      routing: {
        primaryAgent: null,
        confidence: null,
      },
      requestId,
      traceId,
      responseType: "clarification_required",
      handover: null,
      errors: [],
    },
    execution: {
      executed: false,
      proposal: null,
      result: null,
    },
  }
}

function fallbackAgentMessage(responseType: string) {
  if (responseType === "handover_required") {
    return "A staff member should continue this request."
  }

  if (responseType === "clarification_required") {
    return "I need one more detail to continue."
  }

  return "I'm ready to help with the next step."
}
