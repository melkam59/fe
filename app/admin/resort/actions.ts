"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import {
  createAdminResort,
  deleteAdminResort,
  updateAdminResort,
} from "@/lib/admin-resorts"
import { requirePortalAccess } from "@/lib/auth-server"

function readRequiredString(formData: FormData, key: string) {
  const value = formData.get(key)

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Missing ${key}.`)
  }

  return value.trim()
}

function readPositiveInt(formData: FormData, key: string) {
  const value = readRequiredString(formData, key)
  const parsed = Number.parseInt(value, 10)

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${key} must be a positive number.`)
  }

  return parsed
}

export async function createResortAction(formData: FormData) {
  await requirePortalAccess("admin", "/admin/resort")

  await createAdminResort({
    name: readRequiredString(formData, "name"),
    location: readRequiredString(formData, "location"),
    currency: readRequiredString(formData, "currency").toUpperCase(),
    checkInTime: readRequiredString(formData, "checkInTime"),
    checkOutTime: readRequiredString(formData, "checkOutTime"),
    maxNights: readPositiveInt(formData, "maxNights"),
  })

  revalidatePath("/admin/resort")
  redirect("/admin/resort")
}

export async function updateResortAction(formData: FormData) {
  const resortId = readRequiredString(formData, "resortId")

  await requirePortalAccess("admin", `/admin/resort/${resortId}`)

  await updateAdminResort(resortId, {
    name: readRequiredString(formData, "name"),
    location: readRequiredString(formData, "location"),
    currency: readRequiredString(formData, "currency").toUpperCase(),
    checkInTime: readRequiredString(formData, "checkInTime"),
    checkOutTime: readRequiredString(formData, "checkOutTime"),
    maxNights: readPositiveInt(formData, "maxNights"),
  })

  revalidatePath("/admin/resort")
  revalidatePath(`/admin/resort/${resortId}`)
  redirect(`/admin/resort/${resortId}`)
}

export async function deleteResortAction(formData: FormData) {
  const resortId = readRequiredString(formData, "resortId")

  await requirePortalAccess("admin", `/admin/resort/${resortId}`)
  await deleteAdminResort(resortId)

  revalidatePath("/admin/resort")
  redirect("/admin/resort")
}
