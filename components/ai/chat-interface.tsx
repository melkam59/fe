"use client"

import Link from "next/link"
import {
  startTransition,
  useEffect,
  useRef,
  useState,
} from "react"
import {
  BedDoubleIcon,
  BotMessageSquareIcon,
  CalendarDaysIcon,
  CircleAlertIcon,
  MessageSquareQuoteIcon,
  SendIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react"

import type {
  ChatUiCard,
  FrontendChatMessageResponse,
} from "@/lib/chat"
import { clientApiRequest } from "@/lib/api/client"
import { getBranchLabel } from "@/lib/branches"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

type ChatEntry = {
  id: string
  role: "assistant" | "guest"
  content: string
  ui?: FrontendChatMessageResponse["ui"]
}

type BookingContextState = FrontendChatMessageResponse["bookingContext"]

const starterPrompts = [
  "What branches do you currently have?",
  "Show me the best rooms for a weekend escape",
  "Please send extra towels",
] as const

const STORAGE_THREAD_KEY = "better-experience.chat.thread-id"
const STORAGE_MESSAGES_KEY = "better-experience.chat.messages"
const STORAGE_BOOKING_CONTEXT_KEY = "better-experience.chat.booking-context"

const initialMessages: ChatEntry[] = [
  {
    id: "intro",
    role: "assistant",
    content:
      "Welcome to Better Experience. I can help with new reservations, booking lookup, check-in readiness, and in-stay service requests.",
  },
]

function createEmptyBookingContext(): BookingContextState {
  return {
    bookingId: null,
    roomId: null,
    resortId: null,
    status: null,
  }
}

type ChatErrorState = {
  message: string
  prompt: string
} | null

function readStoredJson<T>(key: string): T | null {
  if (typeof window === "undefined") {
    return null
  }

  const value = window.localStorage.getItem(key)

  if (!value) {
    return null
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function UiCard({
  card,
  onSuggestion,
}: {
  card: ChatUiCard
  onSuggestion: (value: string) => void
}) {
  if (card.kind === "branch_options") {
    return (
      <div className="grid gap-3">
        {card.items.map((item) => (
          <div
            key={item.resortId}
            className="grid gap-3 rounded-3xl border border-stone-200 bg-white/90 p-4"
          >
            <div className="grid gap-1">
              <p className="font-heading text-base font-semibold text-stone-950">
                {item.name}
              </p>
              <p className="text-sm text-stone-600">{item.location}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-stone-300 bg-white"
              onClick={() => onSuggestion(item.selectionLabel)}
            >
              Select this branch
            </Button>
          </div>
        ))}
      </div>
    )
  }

  if (card.kind === "room_options") {
    return (
      <div className="grid gap-3">
        {card.items.map((item) => (
          <div
            key={`${item.roomId ?? item.roomNumber}-${item.roomType}`}
            className="grid gap-3 rounded-3xl border border-stone-200 bg-white/90 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="grid gap-1">
                <p className="font-heading text-base font-semibold text-stone-950">
                  Room {item.roomNumber}
                </p>
                <p className="text-sm text-stone-600">{item.roomType}</p>
              </div>
              <div className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                {item.nightlyPriceText} / night
              </div>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-stone-600">
              {item.maxGuests ? (
                <span className="rounded-full bg-stone-100 px-2.5 py-1">
                  Up to {item.maxGuests} guests
                </span>
              ) : null}
              {item.notes ? (
                <span className="rounded-full bg-stone-100 px-2.5 py-1">
                  {item.notes}
                </span>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-stone-300 bg-white"
              onClick={() => onSuggestion(`room ${item.roomNumber}`)}
            >
              Select room {item.roomNumber}
            </Button>
          </div>
        ))}
      </div>
    )
  }

  if (card.kind === "booking_confirmation") {
    return (
      <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
        <p className="font-heading text-base font-semibold">Booking updated</p>
        <p className="mt-1">
          Status: {card.status ?? "pending"}
          {card.totalPriceText ? ` · ${card.totalPriceText}` : ""}
        </p>
        {card.serviceMessage ? <p className="mt-2">{card.serviceMessage}</p> : null}
      </div>
    )
  }

  if (card.kind === "service_catalog") {
    return (
      <div className="grid gap-3">
        {card.items.map((item) => (
          <div
            key={item.serviceId}
            className="grid gap-2 rounded-3xl border border-stone-200 bg-white/90 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-heading text-base font-semibold text-stone-950">
                  {item.name}
                </p>
                <p className="text-sm text-stone-600">
                  {item.category ?? "service"}
                </p>
              </div>
              {item.priceText ? (
                <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                  {item.priceText}
                </span>
              ) : null}
            </div>
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-stone-300 bg-white"
              onClick={() => onSuggestion(`add ${item.name}`)}
            >
              Add {item.name}
            </Button>
          </div>
        ))}
      </div>
    )
  }

  if (card.kind === "service_request_confirmation") {
    return (
      <div className="rounded-3xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
        <p className="font-heading text-base font-semibold">
          {card.requestType} request submitted
        </p>
        <p className="mt-1">Status: {card.status}</p>
        <p className="mt-2">{card.description}</p>
      </div>
    )
  }

  return null
}

function BookingContextSummary({
  bookingContext,
}: {
  bookingContext: BookingContextState
}) {
  if (
    !bookingContext.bookingId &&
    !bookingContext.roomId &&
    !bookingContext.resortId &&
    !bookingContext.status
  ) {
    return null
  }

  return (
    <div className="flex flex-wrap gap-2 border-b border-stone-200 px-4 py-3 text-xs text-stone-600">
      {bookingContext.resortId ? (
        <span className="rounded-full bg-stone-100 px-2.5 py-1">
          Resort: {getBranchLabel(bookingContext.resortId) ?? bookingContext.resortId}
        </span>
      ) : null}
      {bookingContext.bookingId ? (
        <span className="rounded-full bg-stone-100 px-2.5 py-1">
          Booking: {bookingContext.bookingId}
        </span>
      ) : null}
      {bookingContext.roomId ? (
        <span className="rounded-full bg-stone-100 px-2.5 py-1">
          Room: {bookingContext.roomId}
        </span>
      ) : null}
      {bookingContext.status ? (
        <span className="rounded-full bg-stone-100 px-2.5 py-1 capitalize">
          Status: {bookingContext.status.replace(/_/g, " ")}
        </span>
      ) : null}
    </div>
  )
}

function ChatPanel({
  variant,
  onRequestClose,
}: {
  variant: "sheet" | "page"
  onRequestClose?: () => void
}) {
  const [messages, setMessages] = useState<ChatEntry[]>(initialMessages)
  const [draft, setDraft] = useState("")
  const [threadId, setThreadId] = useState<string | null>(null)
  const [bookingContext, setBookingContext] = useState<BookingContextState>(
    createEmptyBookingContext()
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [chatError, setChatError] = useState<ChatErrorState>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const storedThreadId =
      window.localStorage.getItem(STORAGE_THREAD_KEY) ??
      `thread_${crypto.randomUUID()}`
    const storedMessages = readStoredJson<ChatEntry[]>(STORAGE_MESSAGES_KEY)
    const storedBookingContext =
      readStoredJson<BookingContextState>(STORAGE_BOOKING_CONTEXT_KEY)

    setThreadId(storedThreadId)
    setMessages(storedMessages?.length ? storedMessages : initialMessages)
    setBookingContext(storedBookingContext ?? createEmptyBookingContext())

    window.localStorage.setItem(STORAGE_THREAD_KEY, storedThreadId)
  }, [])

  useEffect(() => {
    if (!threadId) {
      return
    }

    window.localStorage.setItem(STORAGE_THREAD_KEY, threadId)
  }, [threadId])

  useEffect(() => {
    window.localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_BOOKING_CONTEXT_KEY,
      JSON.stringify(bookingContext)
    )
  }, [bookingContext])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    })
  }, [messages, isSubmitting])

  function resetConversation() {
    const nextThreadId = `thread_${crypto.randomUUID()}`

    setThreadId(nextThreadId)
    setMessages(initialMessages)
    setBookingContext(createEmptyBookingContext())
    setDraft("")
    setFormError(null)
    setChatError(null)

    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_THREAD_KEY, nextThreadId)
      window.localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(initialMessages))
      window.localStorage.setItem(
        STORAGE_BOOKING_CONTEXT_KEY,
        JSON.stringify(createEmptyBookingContext())
      )
    }
  }

  async function submitPrompt(prompt: string) {
    const trimmed = prompt.trim()

    if (!trimmed || isSubmitting) {
      return
    }

    const activeThreadId = threadId ?? `thread_${crypto.randomUUID()}`
    const guestMessage: ChatEntry = {
      id: `guest_${crypto.randomUUID()}`,
      role: "guest",
      content: trimmed,
    }

    setFormError(null)
    setChatError(null)
    setIsSubmitting(true)
    setThreadId(activeThreadId)
    setMessages((current) => [...current, guestMessage])
    setDraft("")

    try {
      const response = await clientApiRequest<FrontendChatMessageResponse>(
        "/api/chat/messages",
        {
          method: "POST",
          body: JSON.stringify({
            threadId: activeThreadId,
            message: {
              id: guestMessage.id,
              content: trimmed,
            },
            bookingContext,
          }),
        }
      )

      setBookingContext(response.bookingContext)
      setMessages((current) => [
        ...current,
        {
          id: response.message.id,
          role: "assistant",
          content: response.message.content,
          ui: response.ui,
        },
      ])
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "We couldn't reach the concierge right now."

      setFormError(errorMessage)
      setChatError({
        message: errorMessage,
        prompt: trimmed,
      })
      setDraft(trimmed)
    } finally {
      setIsSubmitting(false)
    }
  }

  function runSuggestion(prompt: string) {
    startTransition(() => {
      void submitPrompt(prompt)
    })
  }

  const containerClassName =
    variant === "page"
      ? "mx-auto flex h-[calc(100dvh-8rem)] min-h-0 w-full max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-stone-200 bg-[linear-gradient(180deg,#fcfaf6_0%,#f6efe2_100%)] shadow-[0px_30px_90px_-45px_rgba(28,25,23,0.5)]"
      : "flex h-full min-h-0 flex-col overflow-hidden"

  return (
    <div className={containerClassName}>
      <div className="border-b border-stone-200 px-4 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 grid gap-1">
            <div className="flex items-center gap-2 text-stone-950">
              <SparklesIcon className="size-4 shrink-0 text-amber-700" />
              <p className="font-heading text-lg leading-tight font-semibold">
                Better Experience Concierge
              </p>
            </div>
            <p className="text-sm text-stone-600">
              Ask about rooms, booking support, check-in readiness, or in-stay
              requests.
            </p>
          </div>
          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
            <span className="rounded-full border border-stone-200 bg-white/70 px-3 py-1 text-[11px] font-medium text-stone-600">
              Backend connected
            </span>
            <Button
              type="button"
              variant="outline"
              className="rounded-full border-stone-300 bg-white"
              onClick={resetConversation}
              disabled={isSubmitting}
            >
              New chat
            </Button>
            {variant === "sheet" ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="rounded-full text-stone-600 hover:bg-white/70"
                onClick={onRequestClose}
                aria-label="Close chat"
              >
                <XIcon className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <BookingContextSummary bookingContext={bookingContext} />

      <div className="flex min-h-0 flex-1 flex-col gap-5 px-4 py-4">
        <div className="shrink-0 flex flex-wrap gap-2">
          {starterPrompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => runSuggestion(prompt)}
              className="rounded-full border border-stone-300 bg-white px-3 py-1.5 text-left text-xs text-stone-700 transition hover:border-stone-400 hover:bg-stone-50"
            >
              {prompt}
            </button>
          ))}
        </div>

        <div
          className={cn(
            "min-h-0 flex-1 space-y-4 overflow-y-auto pr-1"
          )}
        >
          {messages.map((message) => (
            <div key={message.id} className="space-y-3">
              <div
                className={cn(
                  "flex gap-3",
                  message.role === "guest" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" ? (
                  <Avatar size="sm" className="mt-1">
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                ) : null}
                <div
                  className={cn(
                    "max-w-[88%] rounded-3xl px-4 py-3 text-sm leading-6 shadow-sm",
                    message.role === "assistant"
                      ? "bg-white text-stone-700"
                      : "bg-stone-950 text-white"
                  )}
                >
                  {message.content}
                </div>
              </div>

              {message.role === "assistant" && message.ui?.cards.length ? (
                <div className="ml-11 grid gap-3">
                  {message.ui.cards.map((card, index) => (
                    <UiCard
                      key={`${message.id}-${card.kind}-${index}`}
                      card={card}
                      onSuggestion={runSuggestion}
                    />
                  ))}
                </div>
              ) : null}

              {message.role === "assistant" && message.ui?.kind === "handover" ? (
                <div className="ml-11 rounded-3xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                  <div className="flex items-center gap-2 font-medium">
                    <CircleAlertIcon className="size-4" />
                    Human handover recommended
                  </div>
                  <p className="mt-2">
                    {message.ui?.handover?.summary ??
                      "The concierge thinks this request should be routed to a team member for follow-up."}
                  </p>
                  {message.ui?.handover?.reason ? (
                    <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-amber-800/80">
                      Reason: {message.ui?.handover?.reason.replace(/_/g, " ")}
                    </p>
                  ) : null}
                  {message.ui?.errors?.[0]?.message ? (
                    <p className="mt-2 text-xs text-amber-900/85">
                      Backend detail: {message.ui?.errors?.[0]?.message}
                    </p>
                  ) : null}
                  {message.ui?.debug.requestId || message.ui?.debug.traceId ? (
                    <p className="mt-3 font-mono text-[11px] text-amber-900/70">
                      {message.ui?.debug.requestId
                        ? `request ${message.ui?.debug.requestId}`
                        : ""}
                      {message.ui?.debug.requestId && message.ui?.debug.traceId
                        ? " | "
                        : ""}
                      {message.ui?.debug.traceId
                        ? `trace ${message.ui?.debug.traceId}`
                        : ""}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}

          {isSubmitting ? (
            <div className="flex gap-3">
              <Avatar size="sm" className="mt-1">
                <AvatarFallback>AI</AvatarFallback>
              </Avatar>
              <div className="rounded-3xl bg-white px-4 py-3 text-sm text-stone-500 shadow-sm">
                Thinking through your request...
              </div>
            </div>
          ) : null}

          {chatError ? (
            <div className="ml-11 rounded-3xl border border-destructive/20 bg-destructive/8 p-4 text-sm text-destructive">
              <div className="flex items-start gap-2">
                <CircleAlertIcon className="mt-0.5 size-4 shrink-0" />
                <div className="grid gap-3">
                  <div className="grid gap-1">
                    <p className="font-heading text-sm font-semibold">
                      The concierge hit a problem
                    </p>
                    <p>{chatError.message}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-destructive/20 bg-white text-destructive hover:bg-destructive/5"
                      onClick={() => {
                        void submitPrompt(chatError.prompt)
                      }}
                      disabled={isSubmitting}
                    >
                      Try again
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="rounded-full text-destructive hover:bg-destructive/5"
                      onClick={() => {
                        setChatError(null)
                        setFormError(null)
                      }}
                      disabled={isSubmitting}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="shrink-0 border-t border-stone-200 px-4 py-4">
        {formError ? (
          <div className="mb-3 rounded-2xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            {formError}
          </div>
        ) : null}

        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault()
            void submitPrompt(draft)
          }}
        >
          <Input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ask about rooms, check-in, or guest services"
            className="h-11 rounded-2xl border-stone-300 bg-white"
            disabled={isSubmitting}
          />
          <div className="flex items-center justify-between gap-3">
            {variant === "sheet" ? (
              <Link
                href="/ai/chat"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "rounded-full border-stone-300 bg-white"
                )}
              >
                Open full AI chat
              </Link>
            ) : (
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <BedDoubleIcon className="size-3.5" />
                <CalendarDaysIcon className="size-3.5" />
                <MessageSquareQuoteIcon className="size-3.5" />
                Concierge session stays on the backend route
              </div>
            )}
            <Button
              type="submit"
              className="rounded-full bg-stone-950 text-white hover:bg-stone-800"
              disabled={isSubmitting || !draft.trim()}
            >
              Send
              <SendIcon className="size-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ChatInterface() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-6 left-6 z-50 md:left-auto md:right-6">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button
              size="lg"
              className="rounded-full bg-stone-950 px-5 text-white shadow-2xl shadow-stone-900/25 hover:bg-stone-800"
            />
          }
        >
          <BotMessageSquareIcon className="size-5" />
          Concierge Chat
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-full max-w-none border-l border-stone-200 bg-[linear-gradient(180deg,#fcfaf6_0%,#f6efe2_100%)] data-[side=right]:top-[88px] data-[side=right]:bottom-0 data-[side=right]:h-auto sm:max-w-[460px] sm:data-[side=right]:top-[96px]"
          showCloseButton={false}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Better Experience Concierge</SheetTitle>
            <SheetDescription>
              Chat with the Better Experience concierge.
            </SheetDescription>
          </SheetHeader>
          <ChatPanel variant="sheet" onRequestClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </div>
  )
}

export function ConciergeChatPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,#f4ebdd_0%,#f7f2e9_30%,#fcfaf6_100%)] px-4 py-8 md:px-8">
      <ChatPanel variant="page" />
    </main>
  )
}
