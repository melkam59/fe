import Link from "next/link"

import { createResortAction } from "@/app/admin/resort/actions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ApiError } from "@/lib/api/shared"
import { listAdminResorts } from "@/lib/admin-resorts"

type SearchParams = Promise<{
  page?: string | string[]
  limit?: string | string[]
  search?: string | string[]
}>

function readSearchParam(
  value: string | string[] | undefined,
  fallback = ""
) {
  return typeof value === "string" && value.trim()
    ? value
    : Array.isArray(value) && value[0]
      ? value[0]
      : fallback
}

function parsePositiveInt(value: string, fallback: number) {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

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

function createPageHref(page: number, limit: number, search: string) {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })

  if (search.trim()) {
    query.set("search", search.trim())
  }

  return `/admin/resort?${query.toString()}`
}

export default async function ResortPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const resolvedSearchParams = await searchParams
  const page = parsePositiveInt(readSearchParam(resolvedSearchParams.page, "1"), 1)
  const limit = parsePositiveInt(readSearchParam(resolvedSearchParams.limit, "20"), 20)
  const search = readSearchParam(resolvedSearchParams.search)

  let errorMessage: string | null = null
  let resortsPage = null as Awaited<ReturnType<typeof listAdminResorts>> | null

  try {
    resortsPage = await listAdminResorts({ page, limit, search })
  } catch (error) {
    errorMessage =
      error instanceof ApiError
        ? error.message
        : "We couldn't load resorts right now."
  }

  return (
    <main className="px-4 py-4 lg:px-6">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Create Resort</CardTitle>
            <CardDescription>
              Add a new resort before assigning rooms and operational data.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form action={createResortAction} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Input name="name" placeholder="Resort name" required />
              <Input name="location" placeholder="Location" required />
              <Input name="currency" placeholder="Currency (USD)" required />
              <Input name="checkInTime" placeholder="Check-in time (15:00)" required />
              <Input name="checkOutTime" placeholder="Check-out time (11:00)" required />
              <Input
                name="maxNights"
                type="number"
                min="1"
                placeholder="Max nights"
                required
              />
              <div className="md:col-span-2 xl:col-span-3 flex justify-end">
                <Button type="submit">Create resort</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Resort Inventory</CardTitle>
            <CardDescription>
              Search and review resorts managed by the admin team.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form className="grid gap-3 md:grid-cols-[1fr_140px_auto]">
              <Input
                name="search"
                defaultValue={search}
                placeholder="Search resorts"
              />
              <select
                name="limit"
                defaultValue={String(limit)}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {[10, 20, 50].map((value) => (
                  <option key={value} value={value}>
                    {value} per page
                  </option>
                ))}
              </select>
              <input type="hidden" name="page" value="1" />
              <Button type="submit">Apply filters</Button>
            </form>
          </CardContent>
        </Card>

        {errorMessage ? (
          <Card>
            <CardHeader>
              <CardTitle>Couldn&apos;t Load Resorts</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {resortsPage ? (
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Resort List</CardTitle>
              <CardDescription>
                Showing {resortsPage.items.length} of {resortsPage.total} total resorts.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {resortsPage.items.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resort</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Operations</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resortsPage.items.map((resort) => (
                      <TableRow key={resort.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{resort.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {resort.id}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{resort.location ?? "Unknown location"}</TableCell>
                        <TableCell>
                          <div className="flex flex-col text-sm">
                            <span>{resort.currency ?? "N/A"}</span>
                            <span className="text-xs text-muted-foreground">
                              {resort.checkInTime ?? "--"} in · {resort.checkOutTime ?? "--"} out ·{" "}
                              {resort.maxNights ?? "N/A"} max nights
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(resort.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            nativeButton={false}
                            render={<Link href={`/admin/resort/${resort.id}`} />}
                          >
                            Manage
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                  No resorts matched the current filters.
                </div>
              )}

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Page {resortsPage.page} of {resortsPage.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={!resortsPage.hasPreviousPage}
                    disabled={!resortsPage.hasPreviousPage}
                    render={
                      resortsPage.hasPreviousPage ? (
                        <Link
                          href={createPageHref(resortsPage.page - 1, resortsPage.limit, search)}
                        />
                      ) : undefined
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={!resortsPage.hasNextPage}
                    disabled={!resortsPage.hasNextPage}
                    render={
                      resortsPage.hasNextPage ? (
                        <Link
                          href={createPageHref(resortsPage.page + 1, resortsPage.limit, search)}
                        />
                      ) : undefined
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  )
}
