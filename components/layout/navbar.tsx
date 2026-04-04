"use client"

import Link from "next/link"
import { MenuIcon, SparklesIcon } from "lucide-react"

import { Button, buttonVariants } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Stay", href: "/rooms" },
  { label: "Services", href: "/services" },
  { label: "Amenities", href: "/amenities" },
  { label: "AI Concierge", href: "/ai/chat" },
] as const

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-8 lg:px-10">
        <div className="flex items-center justify-between rounded-full border border-white/15 bg-stone-950/70 px-4 py-3 text-white shadow-lg shadow-black/10 backdrop-blur-xl sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-[#d9b36c] text-stone-950">
              <SparklesIcon className="size-4" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-stone-300">
                Resort Collection
              </p>
              <p className="font-heading text-lg font-semibold">
                BetterExperience
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-stone-200 transition hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 lg:flex">
            <Link
              href="/login?portal=guest"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "rounded-full text-white hover:bg-white/10 hover:text-white"
              )}
            >
              Sign In
            </Link>
            <Link
              href="/bookings/new"
              className={cn(
                buttonVariants(),
                "rounded-full bg-[#d9b36c] text-stone-950 hover:bg-[#e0bf83]"
              )}
            >
              Book Now
            </Link>
          </div>

          <div className="lg:hidden">
            <Sheet>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-white hover:bg-white/10 hover:text-white"
                  />
                }
              >
                <MenuIcon className="size-5" />
                <span className="sr-only">Open navigation menu</span>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="border-l border-stone-200 bg-[#f8f2e8]"
              >
                <SheetHeader className="space-y-2">
                  <SheetTitle className="text-stone-950">
                    BetterExperience
                  </SheetTitle>
                  <SheetDescription>
                    Explore the resort, discover curated experiences, and plan
                    your next stay.
                  </SheetDescription>
                </SheetHeader>
                <div className="flex flex-1 flex-col gap-3 px-4 pb-6">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-900"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <Link
                    href="/login?portal=guest"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "mt-4 rounded-full"
                    )}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/bookings/new"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "rounded-full bg-stone-950 text-white hover:bg-stone-800"
                    )}
                  >
                    Book Your Stay
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  )
}
