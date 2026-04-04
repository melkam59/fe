import type { ReactNode } from "react"

import { PortalLayout } from "@/components/portal-layout"
import { requirePortalAccess } from "@/lib/auth-server"

export default async function StaffLayout({
  children,
}: {
  children: ReactNode
}) {
  await requirePortalAccess("staff", "/staff")

  return <PortalLayout title="Staff Portal">{children}</PortalLayout>
}
