import type { ReactNode } from "react"

import { PortalLayout } from "@/components/portal-layout"
import { requirePortalAccess } from "@/lib/auth-server"

export default async function AdminLayout({
  children,
}: {
  children: ReactNode
}) {
  await requirePortalAccess("admin", "/admin/dashboard")

  return <PortalLayout title="Admin Portal">{children}</PortalLayout>
}
