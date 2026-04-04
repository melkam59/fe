"use server"

import { revalidatePath } from "next/cache"

import {
  cancelAdminBooking,
  checkInAdminBooking,
  checkOutAdminBooking,
  confirmAdminBooking,
  markAdminBookingNoShow,
} from "@/lib/admin-bookings"
import { requirePortalAccess } from "@/lib/auth-server"
import { ApiError } from "@/lib/api/shared"

type BookingActionState = {
  message: string
  type: "idle" | "success" | "error"
}

function readBookingId(formData: FormData) {
  const bookingId = formData.get("bookingId")

  return typeof bookingId === "string" && bookingId.trim()
    ? bookingId.trim()
    : null
}

function revalidateBookingPaths(bookingId: string) {
  revalidatePath("/admin/bookings")
  revalidatePath(`/admin/bookings/${bookingId}`)
}

async function runBookingAction(
  formData: FormData,
  action: (bookingId: string) => Promise<void>,
  successMessage: string
): Promise<BookingActionState> {
  const bookingId = readBookingId(formData)

  if (!bookingId) {
    return {
      message: "Missing booking id.",
      type: "error",
    }
  }

  await requirePortalAccess("admin", `/admin/bookings/${bookingId}`)

  try {
    await action(bookingId)
    revalidateBookingPaths(bookingId)

    return {
      message: successMessage,
      type: "success",
    }
  } catch (error) {
    return {
      message:
        error instanceof ApiError
          ? error.message
          : "We couldn't update this booking right now.",
      type: "error",
    }
  }
}

export async function confirmBookingAction(
  _prevState: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
  return runBookingAction(
    formData,
    confirmAdminBooking,
    "Booking confirmed successfully."
  )
}

export async function checkInBookingAction(
  _prevState: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
  return runBookingAction(
    formData,
    checkInAdminBooking,
    "Booking checked in successfully."
  )
}

export async function checkOutBookingAction(
  _prevState: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
  return runBookingAction(
    formData,
    checkOutAdminBooking,
    "Booking checked out successfully."
  )
}

export async function markBookingNoShowAction(
  _prevState: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
  return runBookingAction(
    formData,
    markAdminBookingNoShow,
    "Booking marked as no-show."
  )
}

export async function cancelBookingAction(
  _prevState: BookingActionState,
  formData: FormData
): Promise<BookingActionState> {
  const bookingId = readBookingId(formData)

  if (!bookingId) {
    return {
      message: "Missing booking id.",
      type: "error",
    }
  }

  const cancellationReason = formData.get("cancellationReason")
  const reason =
    typeof cancellationReason === "string" ? cancellationReason.trim() : ""

  if (!reason) {
    return {
      message: "Please provide a cancellation reason.",
      type: "error",
    }
  }

  await requirePortalAccess("admin", `/admin/bookings/${bookingId}`)

  try {
    await cancelAdminBooking(bookingId, reason)
    revalidateBookingPaths(bookingId)

    return {
      message: "Booking cancelled successfully.",
      type: "success",
    }
  } catch (error) {
    return {
      message:
        error instanceof ApiError
          ? error.message
          : "We couldn't cancel this booking right now.",
      type: "error",
    }
  }
}
