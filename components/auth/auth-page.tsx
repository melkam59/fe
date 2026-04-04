import Link from "next/link"

import { AuthForm } from "@/components/auth/auth-form"
import { authPageContent, type AuthMode } from "@/components/auth/auth-content"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function AuthPage({
  mode,
}: {
  mode: AuthMode
}) {
  const copy = authPageContent[mode]

  return (
    <main className="relative min-h-svh overflow-hidden bg-[#0F0F0F] text-[#F5EFE6]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(200,169,106,0.14),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(107,79,58,0.2),transparent_34%),linear-gradient(135deg,#0F0F0F_12%,#16120f_48%,#0F0F0F_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(245,239,230,0.04),transparent)]" />

      <div className="relative mx-auto flex min-h-svh w-full max-w-6xl items-center justify-center px-4 py-6 sm:px-6 lg:px-8">
        <Card className="relative w-full max-w-xl rounded-[2rem] border border-[#D6C2A3]/20 bg-[linear-gradient(180deg,rgba(245,239,230,0.98),rgba(239,230,218,0.96))] py-0 text-[#1F1712] shadow-[0_28px_90px_rgba(0,0,0,0.34)] ring-0">
          <div className="absolute inset-x-10 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(200,169,106,0.8),transparent)]" />
          <CardHeader className="border-b border-[#6B4F3A]/10 px-6 py-7 sm:px-8 sm:py-8">
            <div className="flex items-center justify-between gap-3">
              <CardTitle
                className="text-3xl leading-tight tracking-[-0.03em] text-[#1F1712] sm:text-[2.15rem]"
                style={{
                  fontFamily:
                    "Iowan Old Style, Palatino Linotype, Book Antiqua, Georgia, serif",
                }}
              >
                {copy.formTitle}
              </CardTitle>
              <Link
                href={mode === "sign-in" ? "/register" : "/login"}
                className="text-sm font-medium text-[#6B4F3A] transition hover:text-[#2C1F14]"
              >
                {mode === "sign-in" ? "Create account" : "Sign in"}
              </Link>
            </div>
          </CardHeader>
          <CardContent className="px-6 py-6 sm:px-8 sm:py-8">
            <AuthForm mode={mode} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
