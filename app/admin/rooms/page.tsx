import Link from "next/link"

import { createRoomAction } from "@/app/admin/rooms/actions"
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
import { listAdminRooms } from "@/lib/admin-rooms"

type SearchParams = Promise<{
  page?: string | string[]
  limit?: string | string[]
  resortId?: string | string[]
  status?: string | string[]
  floor?: string | string[]
}>

const roomStatuses = ["all", "available", "occupied", "in_maintenance"] as const

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

function formatCurrency(value: number | null) {
  if (value === null) {
    return "Not set"
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value / 100)
}

function createPageHref(args: {
  page: number
  limit: number
  resortId: string
  status: string
  floor: string
}) {
  const query = new URLSearchParams({
    page: String(args.page),
    limit: String(args.limit),
  })

  if (args.resortId.trim()) {
    query.set("resortId", args.resortId.trim())
  }

  if (args.status !== "all") {
    query.set("status", args.status)
  }

  if (args.floor.trim()) {
    query.set("floor", args.floor.trim())
  }

  return `/admin/rooms?${query.toString()}`
}

export default async function RoomsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const resolvedSearchParams = await searchParams
  const page = parsePositiveInt(readSearchParam(resolvedSearchParams.page, "1"), 1)
  const limit = parsePositiveInt(readSearchParam(resolvedSearchParams.limit, "20"), 20)
  const resortId = readSearchParam(resolvedSearchParams.resortId)
  const requestedStatus = readSearchParam(resolvedSearchParams.status, "all")
  const status = roomStatuses.includes(requestedStatus as (typeof roomStatuses)[number])
    ? requestedStatus
    : "all"
  const floor = readSearchParam(resolvedSearchParams.floor)

  let errorMessage: string | null = null
  let roomsPage = null as Awaited<ReturnType<typeof listAdminRooms>> | null

  try {
    roomsPage = await listAdminRooms({
      page,
      limit,
      resortId,
      status,
      floor: floor.trim() ? parsePositiveInt(floor, 1) : undefined,
    })
  } catch (error) {
    errorMessage =
      error instanceof ApiError
        ? error.message
        : "We couldn't load rooms right now."
  }

  return (
    <main className="px-4 py-4 lg:px-6">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Create Room</CardTitle>
            <CardDescription>
              Add a new room to an existing resort inventory.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form action={createRoomAction} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Input name="resortId" placeholder="Resort ID" required />
              <Input name="roomNumber" placeholder="Room number" required />
              <Input name="type" placeholder="Type (deluxe)" required />
              <Input name="floor" type="number" placeholder="Floor" required />
              <Input name="sizeSqm" placeholder="Size sqm (45.5)" required />
              <Input name="maxGuests" type="number" placeholder="Max guests" required />
              <Input
                name="bedConfiguration"
                placeholder="Bed configuration"
                required
              />
              <Input
                name="basePriceCents"
                type="number"
                placeholder="Base price cents"
                required
              />
              <select
                name="accessible"
                defaultValue="false"
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="false">Not accessible</option>
                <option value="true">Accessible</option>
              </select>
              <Input name="notes" placeholder="Notes" required />
              <Input
                name="amenities"
                placeholder="Amenity IDs comma separated"
              />
              <div className="md:col-span-2 xl:col-span-3 flex justify-end">
                <Button type="submit">Create room</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b">
            <CardTitle>Room Inventory</CardTitle>
            <CardDescription>
              Filter and manage resort rooms with operational details.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_180px_140px_120px_auto]">
              <Input
                name="resortId"
                defaultValue={resortId}
                placeholder="Filter by resort ID"
              />
              <select
                name="status"
                defaultValue={status}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {roomStatuses.map((roomStatus) => (
                  <option key={roomStatus} value={roomStatus}>
                    {roomStatus === "all"
                      ? "All statuses"
                      : roomStatus.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <Input name="floor" defaultValue={floor} placeholder="Floor" />
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
              <CardTitle>Couldn&apos;t Load Rooms</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {roomsPage ? (
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Room List</CardTitle>
              <CardDescription>
                Showing {roomsPage.items.length} of {roomsPage.total} total rooms.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              {roomsPage.items.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Room</TableHead>
                      <TableHead>Resort</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Rate</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roomsPage.items.map((room) => (
                      <TableRow key={room.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {room.roomNumber ?? room.id}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {room.type ?? "Unknown type"} · floor {room.floor ?? "N/A"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{room.resortName ?? room.resortId ?? "Unknown resort"}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{room.maxGuests ?? "N/A"} guests</span>
                            <span className="text-xs text-muted-foreground">
                              {room.bedConfiguration ?? "No bed configuration"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{room.status ?? "Unknown"}</TableCell>
                        <TableCell>{formatCurrency(room.basePriceCents)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            nativeButton={false}
                            render={<Link href={`/admin/rooms/${room.id}`} />}
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
                  No rooms matched the current filters.
                </div>
              )}

              <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Page {roomsPage.page} of {roomsPage.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={!roomsPage.hasPreviousPage}
                    disabled={!roomsPage.hasPreviousPage}
                    render={
                      roomsPage.hasPreviousPage ? (
                        <Link
                          href={createPageHref({
                            page: roomsPage.page - 1,
                            limit: roomsPage.limit,
                            resortId,
                            status,
                            floor,
                          })}
                        />
                      ) : undefined
                    }
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    nativeButton={!roomsPage.hasNextPage}
                    disabled={!roomsPage.hasNextPage}
                    render={
                      roomsPage.hasNextPage ? (
                        <Link
                          href={createPageHref({
                            page: roomsPage.page + 1,
                            limit: roomsPage.limit,
                            resortId,
                            status,
                            floor,
                          })}
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
