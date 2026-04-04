import { redirect } from "next/navigation"

import { getPortalDestination } from "@/lib/auth"
import { requireAuthenticatedUser } from "@/lib/auth-server"

export default async function DashboardRedirectPage() {
  const portal = await requireAuthenticatedUser("/dashboard")

  redirect(getPortalDestination(portal))
}
