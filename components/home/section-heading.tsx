import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type SectionHeadingProps = {
  eyebrow: string
  title: string
  description: string
  align?: "left" | "center"
  className?: string
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "space-y-4",
        align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-2xl",
        className
      )}
    >
      <Badge
        variant="outline"
        className="rounded-full border-stone-300/80 bg-white/80 px-3 py-1 text-[0.7rem] uppercase tracking-[0.28em] text-stone-700"
      >
        {eyebrow}
      </Badge>
      <div className="space-y-3">
        <h2 className="font-heading text-3xl leading-tight font-semibold tracking-tight text-stone-950 md:text-4xl">
          {title}
        </h2>
        <p className="text-base leading-7 text-stone-600 md:text-lg">
          {description}
        </p>
      </div>
    </div>
  )
}
