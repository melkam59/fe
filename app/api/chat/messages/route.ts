import { NextResponse } from "next/server"
import { ZodError } from "zod"

import { respondWithAgent } from "@/lib/agent-service"
import { ApiError } from "@/lib/api/shared"
import {
  isStandaloneBranchSelection,
  listAvailableBranches,
  looksLikeBookingRequestWithoutBranch,
  looksLikeBranchListRequest,
  matchBranchFromMessage,
} from "@/lib/branches"
import {
  buildClarificationResponse,
  buildFrontendChatResponse,
  frontendChatMessageRequestSchema,
  normalizeDatesInMessage,
} from "@/lib/chat"

const allowedToolNames = [
  "create_booking",
  "create_service_booking",
  "create_service_request",
  "validate_guest_check_in",
] as const

export async function POST(request: Request) {
  const requestId = `chat_req_${crypto.randomUUID()}`
  const traceId = `trace_${crypto.randomUUID()}`

  try {
    const payload = frontendChatMessageRequestSchema.parse(await request.json())
    const threadId = payload.threadId?.trim() || `thread_${crypto.randomUUID()}`
    const messageId = payload.message.id?.trim() || `msg_${crypto.randomUUID()}`

    const { normalizedContent, invalidDates } = normalizeDatesInMessage(
      payload.message.content
    )

    const selectedBranch =
      payload.bookingContext?.resortId ? null : matchBranchFromMessage(normalizedContent)

    const bookingContext = {
      bookingId: payload.bookingContext?.bookingId ?? null,
      roomId: payload.bookingContext?.roomId ?? null,
      resortId: payload.bookingContext?.resortId ?? selectedBranch?.resortId ?? null,
      status: payload.bookingContext?.status ?? null,
    }

    if (invalidDates.length) {
      return NextResponse.json(
        buildClarificationResponse({
          threadId,
          bookingContext,
          content: `I couldn't read ${
            invalidDates.length === 1 ? "this date" : "these dates"
          }: ${invalidDates.join(
            ", "
          )}. Please use a real calendar date like 2026-05-13 or 05/13/2026.`,
          requestId,
          traceId,
        })
      )
    }

    if (looksLikeBranchListRequest(normalizedContent)) {
      return NextResponse.json(
        buildClarificationResponse({
          threadId,
          bookingContext,
          content:
            "These are the branches I can help you book right now. Choose one, and I’ll continue with dates and guest count.",
          uiKind: "branch_options",
          cards: [
            {
              kind: "branch_options",
              items: listAvailableBranches().map((branch) => ({
                resortId: branch.resortId,
                name: branch.name,
                location: branch.location,
                selectionLabel: branch.selectionLabel,
              })),
            },
          ],
          requestId,
          traceId,
        })
      )
    }

    if (selectedBranch && isStandaloneBranchSelection(normalizedContent)) {
      return NextResponse.json(
        buildClarificationResponse({
          threadId,
          bookingContext,
          content: `Great, I’ve selected ${selectedBranch.name}. Please share your check-in date and how many nights you’d like to stay.`,
          requestId,
          traceId,
        })
      )
    }

    if (!bookingContext.resortId && looksLikeBookingRequestWithoutBranch(normalizedContent)) {
      return NextResponse.json(
        buildClarificationResponse({
          threadId,
          bookingContext,
          content:
            "Before I check availability, please choose a branch first. Once you pick one, I’ll continue with dates and guests.",
          uiKind: "branch_options",
          cards: [
            {
              kind: "branch_options",
              items: listAvailableBranches().map((branch) => ({
                resortId: branch.resortId,
                name: branch.name,
                location: branch.location,
                selectionLabel: branch.selectionLabel,
              })),
            },
          ],
          requestId,
          traceId,
        })
      )
    }

    const agentResponse = await respondWithAgent({
      request_id: requestId,
      trace_id: traceId,
      actor: {
        actor_type: "guest",
        user_id: `guest_${threadId}`,
        internal_staff_id: null,
      },
      conversation: {
        conversation_id: threadId,
        channel: "web_chat",
        language: "en",
      },
      booking_context: {
        booking_id: bookingContext.bookingId ?? undefined,
        room_id: bookingContext.roomId ?? undefined,
        resort_id: bookingContext.resortId ?? undefined,
        status: bookingContext.status ?? undefined,
      },
      message: {
        message_id: messageId,
        content: normalizedContent,
        role: "user",
      },
      policy_context: {
        proposal_required_for_writes: true,
        allowed_tool_names: [...allowedToolNames],
      },
    })

    return NextResponse.json(
      buildFrontendChatResponse({
        threadId,
        bookingContext,
        agentResponse,
        requestId,
        traceId,
      })
    )
  } catch (error) {
    const status =
      error instanceof ZodError
        ? 400
        : error instanceof ApiError
          ? error.status
          : 502

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "We couldn't process the chat message right now.",
        requestId,
        traceId,
        details: error instanceof ApiError ? error.payload : null,
      },
      { status }
    )
  }
}
