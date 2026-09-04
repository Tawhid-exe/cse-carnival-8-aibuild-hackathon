"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarPlus, Pencil, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Container } from "@/components/layout/PageLayout"
import { PageHeader } from "@/components/common/PageHeader"
import { EntityDialog, Field } from "@/components/common/EntityDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { authClient } from "@/lib/auth-client"

function RoomForm({ value }: { value?: any }) {
  return (
    <>
      <Field label="Room number">
        <Input name="number" defaultValue={value?.number} required placeholder="A-201" />
      </Field>
      <Field label="Capacity">
        <Input name="capacity" type="number" min={1} defaultValue={value?.capacity ?? 30} required />
      </Field>
      <Field label="Equipment" hint="Comma separated, e.g. Projector, Whiteboard, AC">
        <Input
          name="equipment"
          defaultValue={Array.isArray(value?.equipment) ? value.equipment.join(", ") : ""}
          placeholder="Projector, Whiteboard"
        />
      </Field>
    </>
  )
}

function readRoom(f: FormData) {
  return {
    number: String(f.get("number")),
    capacity: Number(f.get("capacity")),
    equipment: String(f.get("equipment") ?? "").split(",").map((s) => s.trim()).filter(Boolean),
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
  const [date, setDate] = useState("")
  const [start, setStart] = useState("")
  const [end, setEnd] = useState("")
  const [minCap, setMinCap] = useState("")
  const [equip, setEquip] = useState("")

  async function fetchData() {
    try {
      const data = await api.listRooms()
      setRooms(data)
    } catch {
      toast.error("Failed to load rooms")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = useMemo(
    () =>
      rooms.filter((r) => {
        if (minCap && r.capacity < Number(minCap)) return false
        if (equip.trim() && !r.equipment?.some((e: string) => e.toLowerCase().includes(equip.trim().toLowerCase()))) return false
        return true
      }),
    [rooms, minCap, equip]
  )

  return (
    <>
      <PageHeader
        eyebrow="Rooms"
        title="Rooms & bookings"
        description="Filter by capacity and equipment. Add rooms and manage bookings."
        actions={
          <EntityDialog
            trigger={<Button variant="mint"><Plus className="size-4" /> Add room</Button>}
            title="Add room"
            submitLabel="Add room"
            onSubmit={async (f) => {
              await api.createRoom(readRoom(f))
              toast.success("Room added")
              fetchData()
            }}
          >
            <RoomForm />
          </EntityDialog>
        }
      />

      <Container className="py-10">
        {/* Filters */}
        <div className="panel grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Date">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="From">
            <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
          </Field>
          <Field label="To">
            <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
          </Field>
          <Field label="Min capacity">
            <Input type="number" min={1} value={minCap} onChange={(e) => setMinCap(e.target.value)} placeholder="Any" />
          </Field>
          <Field label="Equipment">
            <Input value={equip} onChange={(e) => setEquip(e.target.value)} placeholder="Projector" />
          </Field>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {loading && <p className="panel p-8 text-center text-sm text-muted-foreground lg:col-span-2">Loading…</p>}
          {filtered.map((r) => {
            const roomBookings = (r.bookings ?? []).sort((a: any, b: any) =>
              `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`)
            )
            return (
              <div key={r._id} className="panel p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-lg font-semibold">Room {r.number}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">Seats {r.capacity}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(r.equipment ?? []).map((e: string) => (
                        <Badge key={e} variant="secondary">{e}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <EntityDialog
                      trigger={<Button variant="soft" size="icon" aria-label="Edit room"><Pencil className="size-4" /></Button>}
                      title={`Edit room ${r.number}`}
                      onSubmit={async (f) => {
                        await api.updateRoom(r._id, readRoom(f))
                        toast.success("Room updated")
                        fetchData()
                      }}
                    >
                      <RoomForm value={r} />
                    </EntityDialog>
                    <Button
                      variant="soft"
                      size="icon"
                      aria-label="Delete room"
                      onClick={async () => {
                        await api.deleteRoom(r._id)
                        toast.success("Room deleted")
                        fetchData()
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 border-t border-border pt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bookings</p>
                  <ul className="mt-2 grid gap-2">
                    {roomBookings.map((b: any) => (
                      <li key={b._id} className="flex items-center justify-between gap-3 rounded-lg bg-secondary/50 px-3 py-2 text-sm">
                        <span>
                          {formatDate(b.date)} · {b.start}–{b.end}
                          <span className="text-muted-foreground"> · {b.userName}</span>
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Cancel booking"
                          onClick={async () => {
                            await api.cancelBooking(r._id, b._id)
                            toast.success("Booking cancelled")
                            fetchData()
                          }}
                        >
                          <X className="size-4" />
                        </Button>
                      </li>
                    ))}
                    {roomBookings.length === 0 && (
                      <li className="text-sm text-muted-foreground">No bookings yet.</li>
                    )}
                  </ul>

                  <EntityDialog
                    trigger={
                      <Button variant="soft" className="mt-3 w-full">
                        <CalendarPlus className="size-4" /> Book this room
                      </Button>
                    }
                    title={`Book room ${r.number}`}
                    description="Overlapping times are rejected."
                    submitLabel="Confirm booking"
                    onSubmit={async (f) => {
                      const d = String(f.get("date"))
                      const st = String(f.get("start"))
                      const en = String(f.get("end"))
                      if (en <= st) {
                        toast.error("End time must be after the start time")
                        return false
                      }
                      try {
                        await api.bookRoom(r._id, {
                          date: d, start: st, end: en,
                          userId: session?.user?.id ?? "guest",
                          userName: session?.user?.name ?? "Guest",
                          purpose: String(f.get("purpose") ?? ""),
                        })
                        toast.success("Room booked")
                        fetchData()
                      } catch (err: any) {
                        toast.error(err.message || "Booking conflict — slot is already taken")
                        return false
                      }
                    }}
                  >
                    <Field label="Date">
                      <Input name="date" type="date" defaultValue={date || today()} required />
                    </Field>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="From">
                        <Input name="start" type="time" defaultValue={start || "10:00"} required />
                      </Field>
                      <Field label="To">
                        <Input name="end" type="time" defaultValue={end || "11:00"} required />
                      </Field>
                    </div>
                    <Field label="Purpose" hint={session?.user ? `Booked as ${session.user.name}` : "Sign in to track bookings."}>
                      <Input name="purpose" placeholder="Group study" />
                    </Field>
                  </EntityDialog>
                </div>
              </div>
            )
          })}
          {!loading && filtered.length === 0 && (
            <p className="panel p-8 text-center text-sm text-muted-foreground lg:col-span-2">
              No rooms match those filters.
            </p>
          )}
        </div>
      </Container>
    </>
  )
}
