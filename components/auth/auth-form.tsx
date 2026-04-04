"use client"

import Link from "next/link"
import { startTransition, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

import { ArrowRightIcon } from "lucide-react"

import {
  getPortalFromAuthPayload,
  getSession,
  resolvePostLoginDestination,
  type PortalKey,
  signInEmail,
  signInSchema,
  signUpEmail,
  signUpSchema,
} from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type AuthFormProps = {
  mode: "sign-in" | "sign-up"
}

type FieldErrors = {
  name?: string[]
  email?: string[]
  password?: string[]
}

const modeCopy = {
  "sign-in": {
    submitLabel: "Enter workspace",
    alternateLabel: "New to Better Experience?",
    alternateHref: "/register",
    alternateCta: "Create your account",
    nameLabel: "",
    emailLabel: "Work email",
    emailPlaceholder: "name@resort.com",
    passwordLabel: "Password",
    passwordPlaceholder: "Enter your password",
  },
  "sign-up": {
    submitLabel: "Create account",
    alternateLabel: "Already have access?",
    alternateHref: "/login",
    alternateCta: "Sign in instead",
    nameLabel: "Full name",
    emailLabel: "Email address",
    emailPlaceholder: "name@resort.com",
    passwordLabel: "Create password",
    passwordPlaceholder: "At least 8 characters",
  },
} as const

const GUEST_PORTAL: PortalKey = "guest"

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isHydrated, setIsHydrated] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [formMessage, setFormMessage] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const copy = modeCopy[mode]
  const requestedPath = searchParams.get("next")

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  async function resolvePortalFromSession(): Promise<PortalKey> {
    const session = await getSession()
    return getPortalFromAuthPayload(session) ?? GUEST_PORTAL
  }

  async function submitAuthForm() {
    setFieldErrors({})
    setFormError(null)
    setFormMessage(null)

    setIsSubmitting(true)

    try {
      if (mode === "sign-up") {
        const signUpResult = signUpSchema.safeParse({ name, email, password })

        if (!signUpResult.success) {
          setFieldErrors(signUpResult.error.flatten().fieldErrors)
          return
        }

        setFormMessage("Creating your account and starting your session...")
        const authPayload = await signUpEmail(signUpResult.data)

        const resolvedPortal =
          getPortalFromAuthPayload(authPayload) ??
          (await resolvePortalFromSession())
        const destination = resolvePostLoginDestination(
          resolvedPortal,
          requestedPath
        )

        startTransition(() => {
          router.replace(destination)
          router.refresh()
        })

        return
      } else {
        const signInResult = signInSchema.safeParse({ email, password })

        if (!signInResult.success) {
          setFieldErrors(signInResult.error.flatten().fieldErrors)
          return
        }

        setFormMessage("Signing you in...")
        const authPayload = await signInEmail(signInResult.data)
        const resolvedPortal =
          getPortalFromAuthPayload(authPayload) ??
          (await resolvePortalFromSession())
        const destination = resolvePostLoginDestination(
          resolvedPortal,
          requestedPath
        )

        startTransition(() => {
          router.replace(destination)
          router.refresh()
        })

        return
      }
    } catch (error) {
      setFormMessage(null)
      setFormError(
        error instanceof Error
          ? error.message
          : "Something went wrong while contacting the auth service."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div
        className="space-y-5"
        role="form"
        onKeyDown={(event) => {
          if (event.key === "Enter" && isHydrated && !isSubmitting) {
            event.preventDefault()
            void submitAuthForm()
          }
        }}
      >
        {mode === "sign-up" ? (
          <div className="space-y-2.5">
            <Label
              htmlFor="name"
              className="text-xs font-medium tracking-[0.18em] text-[#6B4F3A] uppercase"
            >
              {copy.nameLabel}
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="Your full name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              aria-invalid={Boolean(fieldErrors.name?.length)}
              className="h-[52px] rounded-[1.15rem] border-[#6B4F3A]/14 bg-white/70 px-4 text-[15px] text-[#1F1712] placeholder:text-[#A1A1AA] focus-visible:border-[#C8A96A] focus-visible:ring-[#C8A96A]/30"
              required
            />
            {fieldErrors.name?.length ? (
              <p className="text-sm text-destructive">{fieldErrors.name[0]}</p>
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2.5">
          <Label
            htmlFor="email"
            className="text-xs font-medium tracking-[0.18em] text-[#6B4F3A] uppercase"
          >
            {copy.emailLabel}
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder={copy.emailPlaceholder}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(fieldErrors.email?.length)}
            className="h-[52px] rounded-[1.15rem] border-[#6B4F3A]/14 bg-white/70 px-4 text-[15px] text-[#1F1712] placeholder:text-[#A1A1AA] focus-visible:border-[#C8A96A] focus-visible:ring-[#C8A96A]/30"
            required
          />
          {fieldErrors.email?.length ? (
            <p className="text-sm text-destructive">{fieldErrors.email[0]}</p>
          ) : null}
        </div>

        <div className="space-y-2.5">
          <Label
            htmlFor="password"
            className="text-xs font-medium tracking-[0.18em] text-[#6B4F3A] uppercase"
          >
            {copy.passwordLabel}
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder={copy.passwordPlaceholder}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={Boolean(fieldErrors.password?.length)}
            className="h-[52px] rounded-[1.15rem] border-[#6B4F3A]/14 bg-white/70 px-4 text-[15px] text-[#1F1712] placeholder:text-[#A1A1AA] focus-visible:border-[#C8A96A] focus-visible:ring-[#C8A96A]/30"
            required
          />
          {fieldErrors.password?.length ? (
            <p className="text-sm text-destructive">
              {fieldErrors.password[0]}
            </p>
          ) : (
            <p className="text-xs leading-5 text-[#6B4F3A]">
              Use at least 8 characters
            </p>
          )}
        </div>

        {formError ? (
          <div className="rounded-[1.2rem] border border-destructive/25 bg-destructive/8 px-4 py-3 text-sm text-destructive">
            {formError}
          </div>
        ) : null}

        {formMessage ? (
          <div className="rounded-[1.2rem] border border-[#6B4F3A]/12 bg-white/55 px-4 py-3 text-sm text-[#6B4F3A]">
            {formMessage}
          </div>
        ) : null}

        <Button
          type="button"
          size="lg"
          className="h-[52px] w-full rounded-[1.2rem] border border-[#C8A96A]/50 bg-[linear-gradient(135deg,#2C1F14_0%,#6B4F3A_45%,#C8A96A_100%)] px-5 text-[15px] font-medium text-[#F5EFE6] shadow-[0_18px_36px_rgba(107,79,58,0.22)] hover:brightness-[1.03]"
          disabled={!isHydrated || isSubmitting}
          onClick={() => {
            void submitAuthForm()
          }}
        >
          {!isHydrated
            ? "Preparing form..."
            : isSubmitting
              ? "Preparing your portal..."
              : copy.submitLabel}
          <ArrowRightIcon className="size-4" />
        </Button>
      </div>

      <div className="space-y-2 text-sm text-[#6B4F3A]">
        <p>
          {copy.alternateLabel}{" "}
          <Link
            href={copy.alternateHref}
            className="font-medium text-[#2C1F14] underline decoration-[#C8A96A] underline-offset-4 transition hover:text-[#6B4F3A]"
          >
            {copy.alternateCta}
          </Link>
        </p>
      </div>
    </div>
  )
}
