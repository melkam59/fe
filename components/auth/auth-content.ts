import type { LucideIcon } from "lucide-react"
import {
  BedDoubleIcon,
  LayoutDashboardIcon,
  ShieldUserIcon,
  UserCogIcon,
} from "lucide-react"

import { portalOptions, type PortalKey } from "@/lib/auth"

export type AuthMode = "sign-in" | "sign-up"

type PortalPresentation = {
  icon: LucideIcon
  eyebrow: string
  spotlight: string
}

const portalPresentation: Record<PortalKey, PortalPresentation> = {
  admin: {
    icon: LayoutDashboardIcon,
    eyebrow: "Control",
    spotlight: "Revenue, reservations, and property oversight in one view.",
  },
  staff: {
    icon: ShieldUserIcon,
    eyebrow: "Service",
    spotlight: "Shift-ready tools for teams handling daily guest operations.",
  },
  manager: {
    icon: UserCogIcon,
    eyebrow: "Leadership",
    spotlight: "Approvals, team coordination, and reporting without friction.",
  },
  guest: {
    icon: BedDoubleIcon,
    eyebrow: "Guest",
    spotlight: "A polished journey for stays, services, and curated amenities.",
  },
}

export const authPortals = portalOptions.map((portal) => ({
  ...portal,
  ...portalPresentation[portal.key],
}))

export const authPageContent: Record<
  AuthMode,
  {
    formTitle: string
  }
> = {
  "sign-in": {
    formTitle: "Welcome back",
  },
  "sign-up": {
    formTitle: "Create your account",
  },
}
