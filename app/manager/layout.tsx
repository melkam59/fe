import type { ReactNode } from "react"

import { PortalLayout } from "@/components/portal-layout"
import { requirePortalAccess } from "@/lib/auth-server"

export default async function ManagerLayout({
  children,
}: {
  children: ReactNode
}) {
  await requirePortalAccess("manager", "/manager")

  return <PortalLayout title="Manager Portal">{children}</PortalLayout>
}
