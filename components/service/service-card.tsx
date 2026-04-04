import Link from "next/link"

import { ArrowUpRightIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

type ServiceCardProps = {
  title: string
  description: string
  image: string
  href: string
  category?: string
  ctaLabel?: string
}

export function ServiceCard({
  title,
  description,
  image,
  href,
  category,
  ctaLabel = "Explore",
}: ServiceCardProps) {
  return (
    <Card className="overflow-hidden border-stone-200/80 bg-white py-0 shadow-lg shadow-stone-200/40">
      <div className="relative aspect-[4/4.2] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover transition duration-500 hover:scale-105"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(28,22,16,0.62))]" />
        {category ? (
          <Badge className="absolute left-4 top-4 rounded-full bg-white/85 px-3 text-stone-900">
            {category}
          </Badge>
        ) : null}
      </div>
      <CardContent className="space-y-4 px-6 py-6">
        <div className="space-y-2">
          <h3 className="font-heading text-xl font-semibold text-stone-950">
            {title}
          </h3>
          <p className="text-sm leading-7 text-stone-600">{description}</p>
        </div>
        <Link
          href={href}
          className="inline-flex h-8 w-fit items-center justify-center gap-1.5 rounded-full px-0 text-sm font-medium text-stone-950 transition hover:text-stone-700"
        >
          {ctaLabel}
          <ArrowUpRightIcon className="size-4" />
        </Link>
      </CardContent>
    </Card>
  )
}
