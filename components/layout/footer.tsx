import Link from "next/link"
import { CameraIcon, MapPinIcon, PhoneCallIcon } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-stone-950 text-stone-200">
      <div className="mx-auto grid max-w-7xl gap-12 px-6 py-14 sm:px-8 lg:grid-cols-[1.1fr_0.8fr_0.8fr_0.9fr] lg:px-10">
        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-stone-400">
              BetterExperience
            </p>
            <h3 className="mt-2 font-heading text-2xl font-semibold text-white">
              Luxury stays shaped by place, calm, and care.
            </h3>
          </div>
          <p className="max-w-sm text-sm leading-7 text-stone-400">
            A modern Ethiopian resort experience with thoughtful stays, curated
            dining, wellness rituals, and unforgettable celebration spaces.
          </p>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-white">Explore</h4>
          <div className="flex flex-col gap-3 text-sm text-stone-400">
            <Link href="/rooms">Rooms & Suites</Link>
            <Link href="/services">Services</Link>
            <Link href="/amenities">Amenities</Link>
            <Link href="/bookings/new">Book Your Stay</Link>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-white">Guest Services</h4>
          <div className="flex flex-col gap-3 text-sm text-stone-400">
            <Link href="/ai/chat">AI Concierge</Link>
            <Link href="/login?portal=guest">Guest Login</Link>
            <Link href="/register?portal=guest">Create Account</Link>
            <Link href="/bookings">Manage Booking</Link>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-white">Contact</h4>
          <div className="space-y-3 text-sm text-stone-400">
            <p className="flex items-start gap-3">
              <MapPinIcon className="mt-0.5 size-4 text-stone-300" />
              Lakeside destination, Ethiopia
            </p>
            <p className="flex items-center gap-3">
              <PhoneCallIcon className="size-4 text-stone-300" />
              +251 900 000 000
            </p>
            <p className="flex items-center gap-3">
              <CameraIcon className="size-4 text-stone-300" />
              @betterexperience.resort
            </p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 text-sm text-stone-500 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <p>© 2026 BetterExperience. All rights reserved.</p>
          <p>Crafted for calm stays, memorable celebrations, and elevated leisure.</p>
        </div>
      </div>
    </footer>
  )
}
