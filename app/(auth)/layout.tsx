import type { ReactNode } from "react"

import { redirectAuthenticatedUser } from "@/lib/auth-server"

export default async function AuthLayout({
  children,
}: {
  children: ReactNode
}) {
  await redirectAuthenticatedUser()

  return children
}
