"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import {
  createAdminRoom,
  deleteAdminRoom,
  updateAdminRoom,
} from "@/lib/admin-rooms"
import { requirePortalAccess } from "@/lib/auth-server"

function readRequiredString(formData: FormData, key: string) {
  const value = formData.get(key)

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing ${key}.`)
  }

  return value.trim()
}

function readNumber(formData: FormData, key: string) {
  const value = readRequiredString(formData, key)
  const parsed = Number.parseFloat(value)

  if (!Number.isFinite(parsed)) {
    throw new Error(`${key} must be a valid number.`)
  }

  return parsed
}

function readBoolean(formData: FormData, key: string) {
  return readRequiredString(formData, key) === "true"
}

function readAmenities(formData: FormData) {
  const raw = formData.get("amenities")

  if (typeof raw !== "string" || !raw.trim()) {
    return [] as string[]
  }

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
}

export async function createRoomAction(formData: FormData) {
  await requirePortalAccess("admin", "/admin/rooms")

  await createAdminRoom({
    resortId: readRequiredString(formData, "resortId"),
    roomNumber: readRequiredString(formData, "roomNumber"),
    type: readRequiredString(formData, "type"),
    floor: Math.trunc(readNumber(formData, "floor")),
    sizeSqm: readRequiredString(formData, "sizeSqm"),
    maxGuests: Math.trunc(readNumber(formData, "maxGuests")),
    bedConfiguration: readRequiredString(formData, "bedConfiguration"),
    basePriceCents: Math.trunc(readNumber(formData, "basePriceCents")),
    accessible: readBoolean(formData, "accessible"),
    notes: readRequiredString(formData, "notes"),
    amenities: readAmenities(formData),
  })

  revalidatePath("/admin/rooms")
  redirect("/admin/rooms")
}

export async function updateRoomAction(formData: FormData) {
  const roomId = readRequiredString(formData, "roomId")

  await requirePortalAccess("admin", `/admin/rooms/${roomId}`)

  await updateAdminRoom(roomId, {
    resortId: readRequiredString(formData, "resortId"),
    roomNumber: readRequiredString(formData, "roomNumber"),
    type: readRequiredString(formData, "type"),
    floor: Math.trunc(readNumber(formData, "floor")),
    sizeSqm: readRequiredString(formData, "sizeSqm"),
    maxGuests: Math.trunc(readNumber(formData, "maxGuests")),
    bedConfiguration: readRequiredString(formData, "bedConfiguration"),
    basePriceCents: Math.trunc(readNumber(formData, "basePriceCents")),
    accessible: readBoolean(formData, "accessible"),
    notes: readRequiredString(formData, "notes"),
    amenities: readAmenities(formData),
  })

  revalidatePath("/admin/rooms")
  revalidatePath(`/admin/rooms/${roomId}`)
  redirect(`/admin/rooms/${roomId}`)
}

export async function deleteRoomAction(formData: FormData) {
  const roomId = readRequiredString(formData, "roomId")

  await requirePortalAccess("admin", `/admin/rooms/${roomId}`)
  await deleteAdminRoom(roomId)

  revalidatePath("/admin/rooms")
  redirect("/admin/rooms")
}
