import Link from "next/link"

import { ArrowRightIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

type RoomCardProps = {
  name: string
  summary: string
  price: string
  image: string
  href: string
  highlight?: string
}

export function RoomCard({
  name,
  summary,
  price,
  image,
  href,
  highlight,
}: RoomCardProps) {
  return (
    <Card className="overflow-hidden border-stone-200/80 bg-white py-0 shadow-lg shadow-stone-200/50">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={name}
          className="h-full w-full object-cover transition duration-500 hover:scale-105"
        />
        {highlight ? (
          <Badge className="absolute left-4 top-4 rounded-full bg-white/90 px-3 text-stone-900">
            {highlight}
          </Badge>
        ) : null}
      </div>
      <CardContent className="space-y-5 px-6 py-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-heading text-xl font-semibold text-stone-950">
              {name}
            </h3>
            <p className="text-sm font-medium text-amber-800">{price}</p>
          </div>
          <p className="text-sm leading-7 text-stone-600">{summary}</p>
        </div>
        <Link
          href={href}
          className="inline-flex h-8 w-fit items-center justify-center gap-1.5 rounded-full border border-stone-300 bg-white px-4 text-sm font-medium text-stone-900 transition hover:bg-stone-100"
        >
          View Room
          <ArrowRightIcon className="size-4" />
        </Link>
      </CardContent>
    </Card>
  )
}
