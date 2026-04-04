import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import {
  deleteResortAction,
  updateResortAction,
} from "@/app/admin/resort/actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ApiError } from "@/lib/api/shared"
import { getAdminResort } from "@/lib/admin-resorts"

function formatDate(value: string | null) {
  if (!value) {
    return "Not set"
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

export default async function ResortDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let resort = null as Awaited<ReturnType<typeof getAdminResort>> | null
  let errorMessage: string | null = null

  try {
    resort = await getAdminResort(id)

    if (!resort) {
      errorMessage = "We couldn't find that resort."
    }
  } catch (error) {
    errorMessage =
      error instanceof ApiError
        ? error.message
        : "We couldn't load this resort right now."
  }

  return (
    <main className="px-4 py-4 lg:px-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/admin/resort" />}
          >
            <ArrowLeftIcon className="size-4" />
            Back to resorts
          </Button>
        </div>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Resort Detail</CardTitle>
            <CardDescription>
              Review and update a single resort configuration.
            </CardDescription>
          </CardHeader>
        </Card>

        {errorMessage ? (
          <Card>
            <CardHeader>
              <CardTitle>Couldn&apos;t Load Resort</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {resort ? (
          <>
            <Card>
              <CardHeader className="border-b">
                <CardTitle>{resort.name}</CardTitle>
                <CardDescription>
                  {resort.location ?? "Unknown location"} · Created {formatDate(resort.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form action={updateResortAction} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <input type="hidden" name="resortId" value={resort.id} />
                  <Input name="name" defaultValue={resort.name} required />
                  <Input
                    name="location"
                    defaultValue={resort.location ?? ""}
                    required
                  />
                  <Input
                    name="currency"
                    defaultValue={resort.currency ?? ""}
                    required
                  />
                  <Input
                    name="checkInTime"
                    defaultValue={resort.checkInTime ?? ""}
                    required
                  />
                  <Input
                    name="checkOutTime"
                    defaultValue={resort.checkOutTime ?? ""}
                    required
                  />
                  <Input
                    name="maxNights"
                    type="number"
                    min="1"
                    defaultValue={String(resort.maxNights ?? 30)}
                    required
                  />
                  <div className="md:col-span-2 xl:col-span-3 flex justify-end">
                    <Button type="submit">Update resort</Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <CardTitle>Danger Zone</CardTitle>
                <CardDescription>
                  Delete this resort if it should no longer be managed.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form action={deleteResortAction}>
                  <input type="hidden" name="resortId" value={resort.id} />
                  <Button type="submit" variant="destructive">
                    Delete resort
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        ) : null}
      </div>
    </main>
  )
}
