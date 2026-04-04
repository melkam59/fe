import Link from "next/link"

import {
  deleteRoomAction,
  updateRoomAction,
} from "@/app/admin/rooms/actions"
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
import { getAdminRoom } from "@/lib/admin-rooms"

function formatCurrency(value: number | null) {
  if (value === null) {
    return "Not set"
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value / 100)
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

export default async function RoomDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let room = null as Awaited<ReturnType<typeof getAdminRoom>> | null
  let errorMessage: string | null = null

  try {
    room = await getAdminRoom(id)

    if (!room) {
      errorMessage = "We couldn't find that room."
    }
  } catch (error) {
    errorMessage =
      error instanceof ApiError
        ? error.message
        : "We couldn't load this room right now."
  }

  return (
    <main className="px-4 py-4 lg:px-6">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>Room Detail</CardTitle>
            <CardDescription>
              Update room configuration, pricing, and accessibility settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/admin/rooms" />}
            >
              Back to rooms
            </Button>
          </CardContent>
        </Card>

        {errorMessage ? (
          <Card>
            <CardHeader>
              <CardTitle>Couldn&apos;t Load Room</CardTitle>
              <CardDescription>{errorMessage}</CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {room ? (
          <>
            <Card>
              <CardHeader className="border-b">
                <CardTitle>
                  Room {room.roomNumber ?? room.id}
                </CardTitle>
                <CardDescription>
                  {room.resortName ?? room.resortId ?? "Unknown resort"} ·{" "}
                  {room.type ?? "Unknown type"} · Created {formatDate(room.createdAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 pt-4">
                <div className="grid gap-3 rounded-lg border p-4 text-sm">
                  <div className="grid gap-1 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                        Rate
                      </p>
                      <p>{formatCurrency(room.basePriceCents)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                        Status
                      </p>
                      <p>{room.status ?? "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                        Size
                      </p>
                      <p>{room.sizeSqm ?? "N/A"} sqm</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">
                        Accessible
                      </p>
                      <p>{room.accessible ? "Yes" : "No"}</p>
                    </div>
                  </div>
                </div>

                <form action={updateRoomAction} className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <input type="hidden" name="roomId" value={room.id} />
                  <Input
                    name="resortId"
                    defaultValue={room.resortId ?? ""}
                    required
                  />
                  <Input
                    name="roomNumber"
                    defaultValue={room.roomNumber ?? ""}
                    required
                  />
                  <Input name="type" defaultValue={room.type ?? ""} required />
                  <Input
                    name="floor"
                    type="number"
                    defaultValue={String(room.floor ?? 1)}
                    required
                  />
                  <Input
                    name="sizeSqm"
                    defaultValue={room.sizeSqm ?? ""}
                    required
                  />
                  <Input
                    name="maxGuests"
                    type="number"
                    defaultValue={String(room.maxGuests ?? 1)}
                    required
                  />
                  <Input
                    name="bedConfiguration"
                    defaultValue={room.bedConfiguration ?? ""}
                    required
                  />
                  <Input
                    name="basePriceCents"
                    type="number"
                    defaultValue={String(room.basePriceCents ?? 0)}
                    required
                  />
                  <select
                    name="accessible"
                    defaultValue={String(room.accessible ?? false)}
                    className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <option value="false">Not accessible</option>
                    <option value="true">Accessible</option>
                  </select>
                  <Input
                    name="notes"
                    defaultValue={room.notes ?? ""}
                    required
                  />
                  <Input
                    name="amenities"
                    defaultValue={room.amenities.join(", ")}
                    placeholder="Amenity IDs comma separated"
                  />
                  <div className="md:col-span-2 xl:col-span-3 flex justify-end">
                    <Button type="submit">Update room</Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="border-b">
                <CardTitle>Danger Zone</CardTitle>
                <CardDescription>
                  Delete this room if it should be removed from the inventory.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <form action={deleteRoomAction}>
                  <input type="hidden" name="roomId" value={room.id} />
                  <Button type="submit" variant="destructive">
                    Delete room
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
