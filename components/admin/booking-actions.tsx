"use client"

import type { ReactNode } from "react"

import { useActionState, useState } from "react"
import {
  BanIcon,
  CheckCircle2Icon,
  CircleOffIcon,
  DoorClosedIcon,
  DoorOpenIcon,
} from "lucide-react"

import {
  cancelBookingAction,
  checkInBookingAction,
  checkOutBookingAction,
  confirmBookingAction,
  markBookingNoShowAction,
} from "@/app/admin/bookings/[id]/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type BookingActionState = {
  message: string
  type: "idle" | "success" | "error"
}

const initialBookingActionState: BookingActionState = {
  message: "",
  type: "idle",
}

function normalizeStatus(status: string) {
  return status.trim().toLowerCase().replace(/-/g, "_")
}

function ActionMessage({ state }: { state: BookingActionState }) {
  if (state.type === "idle" || !state.message) {
    return null
  }

  return (
    <p
      className={cn(
        "text-center text-xs",
        state.type === "error" ? "text-[#9f403d]" : "text-[#24543e]"
      )}
      aria-live="polite"
    >
      {state.message}
    </p>
  )
}

function PrimaryActionForm({
  bookingId,
  action,
  icon,
  pendingLabel,
  submitLabel,
  pending,
  state,
}: {
  bookingId: string
  action: (payload: FormData) => void
  icon: ReactNode
  pendingLabel: string
  submitLabel: string
  pending: boolean
  state: BookingActionState
}) {
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="bookingId" value={bookingId} />
      <Button
        type="submit"
        className="h-14 w-full rounded-[1.35rem] border border-[#6b6a6a]/10 bg-[linear-gradient(135deg,#5f5e5e_0%,#535252_100%)] text-sm font-bold text-[#faf7f6] shadow-[0px_18px_28px_-18px_rgba(95,94,94,0.75)] hover:brightness-[1.04]"
        disabled={pending}
      >
        {icon}
        {pending ? pendingLabel : submitLabel}
      </Button>
      <ActionMessage state={state} />
    </form>
  )
}

function SecondaryActionForm({
  bookingId,
  action,
  icon,
  pendingLabel,
  submitLabel,
  pending,
  state,
  tone = "neutral",
}: {
  bookingId: string
  action: (payload: FormData) => void
  icon: ReactNode
  pendingLabel: string
  submitLabel: string
  pending: boolean
  state: BookingActionState
  tone?: "neutral" | "danger"
}) {
  return (
    <form action={action} className="grid gap-2">
      <input type="hidden" name="bookingId" value={bookingId} />
      <Button
        type="submit"
        variant="ghost"
        className={cn(
          "h-auto min-h-28 flex-col gap-2 rounded-[1.25rem] px-4 py-5 text-center font-heading text-sm font-bold shadow-none",
          tone === "danger"
            ? "bg-[#f1f4f6] text-[#9f403d] hover:border-[#9f403d]/15 hover:bg-[#feefee]"
            : "bg-[#f1f4f6] text-[#586064] hover:bg-[#e3e9ec]"
        )}
        disabled={pending}
      >
        {icon}
        <span>{pending ? pendingLabel : submitLabel}</span>
      </Button>
      <ActionMessage state={state} />
    </form>
  )
}

export function BookingActions({
  bookingId,
  status,
}: {
  bookingId: string
  status: string
}) {
  const normalizedStatus = normalizeStatus(status)
  const [cancelReason, setCancelReason] = useState("")

  const [confirmState, confirmFormAction, confirmPending] = useActionState<
    BookingActionState,
    FormData
  >(confirmBookingAction, initialBookingActionState)
  const [checkInState, checkInFormAction, checkInPending] = useActionState<
    BookingActionState,
    FormData
  >(checkInBookingAction, initialBookingActionState)
  const [checkOutState, checkOutFormAction, checkOutPending] = useActionState<
    BookingActionState,
    FormData
  >(checkOutBookingAction, initialBookingActionState)
  const [noShowState, noShowFormAction, noShowPending] = useActionState<
    BookingActionState,
    FormData
  >(markBookingNoShowAction, initialBookingActionState)
  const [cancelState, cancelFormAction, cancelPending] = useActionState<
    BookingActionState,
    FormData
  >(cancelBookingAction, initialBookingActionState)

  const canConfirm = normalizedStatus === "pending"
  const canCheckIn = normalizedStatus === "confirmed"
  const canCheckOut =
    normalizedStatus === "checked_in" || normalizedStatus === "check_in"
  const canMarkNoShow =
    normalizedStatus === "pending" || normalizedStatus === "confirmed"
  const canCancel =
    normalizedStatus === "pending" || normalizedStatus === "confirmed"

  const hasAvailableActions =
    canConfirm || canCheckIn || canCheckOut || canMarkNoShow || canCancel

  return (
    <section className="rounded-[1.5rem] bg-transparent pt-2">
      <div className="grid gap-4">
        <span className="text-center text-[10px] font-bold uppercase tracking-[0.12rem] text-[#737c7f]">
          Management Actions
        </span>

        {canConfirm ? (
          <PrimaryActionForm
            bookingId={bookingId}
            action={confirmFormAction}
            icon={<CheckCircle2Icon className="size-4" />}
            pendingLabel="Confirming..."
            submitLabel="Confirm booking"
            pending={confirmPending}
            state={confirmState}
          />
        ) : null}

        {canCheckIn ? (
          <PrimaryActionForm
            bookingId={bookingId}
            action={checkInFormAction}
            icon={<DoorOpenIcon className="size-4" />}
            pendingLabel="Checking in..."
            submitLabel="Check in guest"
            pending={checkInPending}
            state={checkInState}
          />
        ) : null}

        {canCheckOut ? (
          <PrimaryActionForm
            bookingId={bookingId}
            action={checkOutFormAction}
            icon={<DoorClosedIcon className="size-4" />}
            pendingLabel="Checking out..."
            submitLabel="Check out guest"
            pending={checkOutPending}
            state={checkOutState}
          />
        ) : null}

        {canMarkNoShow || canCancel ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {canMarkNoShow ? (
              <SecondaryActionForm
                bookingId={bookingId}
                action={noShowFormAction}
                icon={<BanIcon className="size-5" />}
                pendingLabel="Updating..."
                submitLabel="Mark as no-show"
                pending={noShowPending}
                state={noShowState}
                tone="danger"
              />
            ) : null}

            {canCancel ? (
              <form action={cancelFormAction} className="grid gap-2">
                <input type="hidden" name="bookingId" value={bookingId} />
                <Button
                  type="submit"
                  variant="ghost"
                  className="h-auto min-h-28 flex-col gap-2 rounded-[1.25rem] bg-[#f1f4f6] px-4 py-5 text-center font-heading text-sm font-bold text-[#586064] shadow-none hover:bg-[#e3e9ec]"
                  disabled={cancelPending || !cancelReason.trim()}
                >
                  <CircleOffIcon className="size-5" />
                  <span>{cancelPending ? "Cancelling..." : "Force cancel"}</span>
                </Button>
                <div className="grid gap-2 rounded-[1.25rem] bg-white/70 p-4 ring-1 ring-[#dbe4e7]/70">
                  <Label
                    htmlFor="cancellationReason"
                    className="text-[10px] font-bold uppercase tracking-[0.08rem] text-[#737c7f]"
                  >
                    Cancellation reason
                  </Label>
                  <Input
                    id="cancellationReason"
                    name="cancellationReason"
                    value={cancelReason}
                    onChange={(event) => setCancelReason(event.target.value)}
                    placeholder="Customer requested cancellation via phone"
                    disabled={cancelPending}
                    className="h-11 rounded-xl border-[#dbe4e7] bg-white px-3 text-sm text-[#243033]"
                  />
                  <ActionMessage state={cancelState} />
                </div>
              </form>
            ) : null}
          </div>
        ) : null}

        {!hasAvailableActions ? (
          <div className="rounded-[1.25rem] border border-dashed border-[#abb3b7]/70 bg-white/55 p-5 text-center text-sm text-[#586064]">
            No admin actions are available for the current booking status.
          </div>
        ) : null}
      </div>
    </section>
  )
}
