"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarPlus, Check, Clock, DoorOpen, Pencil, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Container } from "@/components/layout/PageLayout"
import { PageHeader } from "@/components/common/PageHeader"
import { EntityDialog, Field } from "@/components/common/EntityDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { authClient } from "@/lib/auth-client"

const ROOM_TYPES = ["classroom", "lab", "seminar"]

function RoomForm({ value }: { value?: any }) {
  return (
    <>
      <Field label="Room number">
        <Input name="room_number" defaultValue={value?.room_number || value?.number} required placeholder="7A07 or Lab-3" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Type">
          <select
            name="type"
            defaultValue={value?.type || "classroom"}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
          >
            {ROOM_TYPES.map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
        </Field>
        <Field label="Floor">
          <Input name="floor" type="number" defaultValue={value?.floor ?? 7} required />
        </Field>
      </div>
      <Field label="Capacity">
        <Input name="capacity" type="number" min={1} defaultValue={value?.capacity ?? 40} required />
      </Field>
      <Field label="Equipment" hint="Comma separated, e.g. Projector, AC, Whiteboard, Computers">
        <Input
          name="equipment"
          defaultValue={Array.isArray(value?.equipment) ? value.equipment.join(", ") : ""}
          placeholder="Projector, AC, Whiteboard"
        />
      </Field>
    </>
  )
}

function readRoom(f: FormData) {
  return {
    room_number: String(f.get("room_number") || "").trim(),
    type: String(f.get("type") || "classroom"),
    floor: Number(f.get("floor") || 1),
    capacity: Number(f.get("capacity") || 30),
    equipment: String(f.get("equipment") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  }
}

const today = () => new Date().toISOString().slice(0, 10)

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
}

export default function RoomsPage() {
  const { data: session } = authClient.useSession()
  const [rooms, setRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Filter states
  const [query, setQuery] = useState("")
  const [availDate, setAvailDate] = useState("")
  const [availStart, setAvailStart] = useState("")
  const [availEnd, setAvailEnd] = useState("")
  const [minCap, setMinCap] = useState("")
  const [equip, setEquip] = useState("")

  async function fetchData() {
    try {
      const q: Record<string, string> = {}
      if (availDate && availStart && availEnd) {
        q.available_date = availDate
        q.available_start = availStart
        q.available_end = availEnd
      }
      const data = await api.listRooms(Object.keys(q).length ? q : undefined)
      setRooms(Array.isArray(data) ? data : data?.data || [])
    } catch (err: any) {
      toast.error(err?.message || "Failed to load rooms")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [availDate, availStart, availEnd])

  const filtered = useMemo(() => {
    return rooms.filter((r) => {
      const roomNum = r.room_number || r.number || ""
      if (query && !roomNum.toLowerCase().includes(query.toLowerCase())) return false
      if (minCap && r.capacity < Number(minCap)) return false
      if (equip.trim()) {
        const hasEq = r.equipment?.some((e: string) =>
          e.toLowerCase().includes(equip.trim().toLowerCase())
        )
        if (!hasEq) return false
      }
      return true
    })
  }, [rooms, query, minCap, equip])

  return (
    <>
      <PageHeader
        eyebrow="Rooms"
        title="Rooms & bookings"
        description="Check real-time room availability, filter by equipment and capacity, book rooms, and manage slots."
        actions={
          <EntityDialog
            trigger={<Button variant="mint"><Plus className="size-4" /> Add room</Button>}
            title="Add room"
            submitLabel="Add room"
            onSubmit={async (f) => {
              try {
                await api.createRoom(readRoom(f))
                toast.success("Room added successfully")
                fetchData()
              } catch (err: any) {
                toast.error(err?.message || "Failed to add room")
                return false
              }
            }}
          >
            <RoomForm />
          </EntityDialog>
        }
      />

      <Container className="py-10">
        {/* Availability & Filter Bar */}
        <div className="panel p-5 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="size-4 text-mint" />
            <span className="text-sm font-semibold">Availability Checker & Filters</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Search Room</label>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g. 7A03"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Date</label>
              <Input
                type="date"
                value={availDate}
                onChange={(e) => setAvailDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Start Time</label>
              <Input
                type="time"
                value={availStart}
                onChange={(e) => setAvailStart(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">End Time</label>
              <Input
                type="time"
                value={availEnd}
                onChange={(e) => setAvailEnd(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Min Capacity</label>
              <Input
                type="number"
                min={1}
                value={minCap}
                onChange={(e) => setMinCap(e.target.value)}
                placeholder="Min seats"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Required Equipment</label>
              <Input
                value={equip}
                onChange={(e) => setEquip(e.target.value)}
                placeholder="Projector, AC"
              />
            </div>
          </div>
          {(availDate || availStart || availEnd || minCap || equip || query) && (
            <div className="mt-3 flex justify-end">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQuery("")
                  setAvailDate("")
                  setAvailStart("")
                  setAvailEnd("")
                  setMinCap("")
                  setEquip("")
                }}
              >
                Clear all filters
              </Button>
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {loading && (
            <p className="panel p-8 text-center text-sm text-muted-foreground lg:col-span-2">
              Loading rooms…
            </p>
          )}
          {filtered.map((r) => {
            const roomId = r.id || r._id
            const roomNumber = r.room_number || r.number
            const roomBookings = Array.isArray(r.bookings) ? r.bookings : []

            return (
              <div key={roomId} className="panel flex flex-col justify-between p-6">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <DoorOpen className="size-5 text-mint" />
                        <h2 className="font-display text-xl font-bold">Room {roomNumber}</h2>
                        {r.type && <Badge variant="secondary" className="capitalize">{r.type}</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Floor {r.floor ?? 1} · Capacity: <strong className="text-foreground">{r.capacity}</strong> seats
                      </p>
                      {r.equipment?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {r.equipment.map((eq: string) => (
                            <Badge key={eq} variant="outline" className="text-xs">
                              {eq}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <EntityDialog
                        trigger={
                          <Button variant="soft" size="icon" aria-label="Edit room">
                            <Pencil className="size-4" />
                          </Button>
                        }
                        title={`Edit Room ${roomNumber}`}
                        onSubmit={async (f) => {
                          try {
                            await api.updateRoom(roomId, readRoom(f))
                            toast.success("Room updated")
                            fetchData()
                          } catch (err: any) {
                            toast.error(err?.message || "Failed to update room")
                            return false
                          }
                        }}
                      >
                        <RoomForm value={r} />
                      </EntityDialog>
                      <Button
                        variant="soft"
                        size="icon"
                        aria-label="Delete room"
                        onClick={async () => {
                          try {
                            await api.deleteRoom(roomId)
                            toast.success("Room deleted")
                            fetchData()
                          } catch (err: any) {
                            toast.error(err?.message || "Failed to delete room")
                          }
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Bookings Section */}
                  <div className="mt-6 border-t border-border pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Current Bookings ({roomBookings.length})
                      </p>
                    </div>
                    <ul className="grid gap-2">
                      {roomBookings.map((b: any) => {
                        const bookingId = b.booking_id || b._id
                        const isOwnerOrAdmin =
                          session?.user?.role === "admin" ||
                          (session?.user?.id && b.user_id && session.user.id === b.user_id) ||
                          !b.user_id

                        return (
                          <li
                            key={bookingId}
                            className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2 text-sm"
                          >
                            <div>
                              <span>
                                {formatDate(b.date)} · {b.start_time || b.start}–{b.end_time || b.end}
                              </span>
                              <span className="text-muted-foreground text-xs block">
                                Booked by: {b.booked_by || b.userName || "Student"} {b.purpose ? `(${b.purpose})` : ""}
                              </span>
                            </div>
                            {isOwnerOrAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                aria-label="Cancel booking"
                                className="text-rose-400 hover:text-rose-300 text-xs h-7 px-2"
                                onClick={async () => {
                                  try {
                                    await api.cancelBooking(roomId, bookingId)
                                    toast.success("Booking cancelled")
                                    fetchData()
                                  } catch (err: any) {
                                    toast.error(err?.message || "Failed to cancel booking")
                                  }
                                }}
                              >
                                <X className="size-3 mr-1" /> Cancel
                              </Button>
                            )}
                          </li>
                        )
                      })}
                      {roomBookings.length === 0 && (
                        <li className="text-xs text-muted-foreground py-1">No bookings scheduled yet.</li>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Book Room Action */}
                <div className="mt-4 pt-2">
                  <EntityDialog
                    trigger={
                      <Button variant="mint" className="w-full">
                        <CalendarPlus className="size-4 mr-1.5" /> Book this room
                      </Button>
                    }
                    title={`Book Room ${roomNumber}`}
                    description="Enter date and time slot. Conflicts are automatically detected and prevented."
                    submitLabel="Confirm Booking"
                    onSubmit={async (f) => {
                      const d = String(f.get("date"))
                      const st = String(f.get("start_time"))
                      const en = String(f.get("end_time"))
                      const purpose = String(f.get("purpose") || "")
                      if (en <= st) {
                        toast.error("End time must be later than start time")
                        return false
                      }
                      try {
                        await api.bookRoom(roomId, {
                          date: d,
                          start_time: st,
                          end_time: en,
                          booked_by: session?.user?.name || "Student",
                          user_id: session?.user?.id || "",
                          purpose,
                        })
                        toast.success("Room booked successfully!")
                        fetchData()
                      } catch (err: any) {
                        toast.error(err?.message || "Slot conflict: room is already booked for that time")
                        return false
                      }
                    }}
                  >
                    <Field label="Date">
                      <Input name="date" type="date" defaultValue={availDate || today()} required />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="From">
                        <Input name="start_time" type="time" defaultValue={availStart || "10:00"} required />
                      </Field>
                      <Field label="To">
                        <Input name="end_time" type="time" defaultValue={availEnd || "11:00"} required />
                      </Field>
                    </div>
                    <Field
                      label="Purpose"
                      hint={session?.user ? `Booking as: ${session.user.name}` : "Sign in to associate booking with your account"}
                    >
                      <Input name="purpose" placeholder="e.g. Group study or Lab test" />
                    </Field>
                  </EntityDialog>
                </div>
              </div>
            )
          })}
          {!loading && filtered.length === 0 && (
            <p className="panel p-8 text-center text-sm text-muted-foreground lg:col-span-2">
              No rooms match your filter criteria.
            </p>
          )}
        </div>
      </Container>
    </>
  )
}
