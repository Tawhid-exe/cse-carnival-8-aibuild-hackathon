"use client"

import { useEffect, useState } from "react"
import { Pencil, Plus, Trash2, UserMinus, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { Container } from "@/components/layout/PageLayout"
import { PageHeader } from "@/components/common/PageHeader"
import { EntityDialog, Field } from "@/components/common/EntityDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { api } from "@/lib/api"
import { authClient } from "@/lib/auth-client"

function EventForm({ value }: { value?: any }) {
  return (
    <>
      <Field label="Event name">
        <Input name="name" defaultValue={value?.name} required placeholder="Hackathon Kickoff" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Date"><Input name="date" type="date" defaultValue={value?.date} required /></Field>
        <Field label="Time"><Input name="time" type="time" defaultValue={value?.time ?? "10:00"} required /></Field>
      </div>
      <Field label="Location">
        <Input name="location" defaultValue={value?.location} required placeholder="Main Hall" />
      </Field>
      <Field label="Capacity">
        <Input name="capacity" type="number" min={1} defaultValue={value?.capacity ?? 50} required />
      </Field>
    </>
  )
}

function readEvent(f: FormData) {
  return {
    name: String(f.get("name")),
    date: String(f.get("date")),
    time: String(f.get("time")),
    location: String(f.get("location")),
    capacity: Number(f.get("capacity")),
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export default function EventsPage() {
  const { data: session } = authClient.useSession()
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  async function fetchData() {
    try { setEvents(await api.listEvents()) }
    catch { toast.error("Failed to load events") }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const meId = session?.user?.id ?? "guest"
  const sorted = [...events].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))

  return (
    <>
      <PageHeader
        eyebrow="Events" title="Campus events"
        description="Register in a tap. Capacity is enforced and counts update live."
        actions={
          <EntityDialog trigger={<Button variant="mint"><Plus className="size-4" /> Add event</Button>}
            title="Add event" submitLabel="Add event"
            onSubmit={async (f) => { await api.createEvent(readEvent(f)); toast.success("Event created"); fetchData() }}>
            <EventForm />
          </EntityDialog>
        }
      />
      <Container className="py-10">
        <div className="grid gap-4 lg:grid-cols-2">
          {loading && <p className="panel p-8 text-center text-sm text-muted-foreground lg:col-span-2">Loading…</p>}
          {sorted.map((ev) => {
            const registered = ev.registered ?? 0
            const full = registered >= ev.capacity
            const mine = (ev.registrations ?? []).some((r: any) => r.student_id === meId || r.userId === meId)
            return (
              <div key={ev._id} className="panel p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-display text-lg font-semibold">{ev.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{formatDate(ev.date)} · {ev.time} · {ev.location}</p>
                  </div>
                  <div className="flex gap-2">
                    <EntityDialog
                      trigger={<Button variant="soft" size="icon" aria-label="Edit event"><Pencil className="size-4" /></Button>}
                      title="Edit event"
                      onSubmit={async (f) => { await api.updateEvent(ev._id, readEvent(f)); toast.success("Event updated"); fetchData() }}>
                      <EventForm value={ev} />
                    </EntityDialog>
                    <Button variant="soft" size="icon" aria-label="Delete event"
                      onClick={async () => { await api.deleteEvent(ev._id); toast.success("Event deleted"); fetchData() }}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{registered} / {ev.capacity} registered</span>
                    {full && <Badge variant="secondary">Full</Badge>}
                  </div>
                  <Progress value={(registered / ev.capacity) * 100} className="mt-2" />
                </div>
                {mine ? (
                  <Button variant="soft" className="mt-4 w-full"
                    onClick={async () => {
                      try {
                        await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/events/${ev._id}/register/${meId}`, { method: "DELETE" })
                        toast.success("Registration cancelled"); fetchData()
                      } catch { toast.error("Failed to cancel") }
                    }}>
                    <UserMinus className="size-4" /> Cancel my registration
                  </Button>
                ) : (
                  <Button variant="mint" className="mt-4 w-full" disabled={full || !session?.user}
                    onClick={async () => {
                      if (full) return
                      try { await api.registerEvent(ev._id, { student_id: meId, name: session?.user?.name ?? "Guest" }); toast.success(`Registered for ${ev.name}`); fetchData() }
                      catch { toast.error("Registration failed") }
                    }}>
                    <UserPlus className="size-4" />
                    {full ? "Event is full" : session?.user ? "Register" : "Log in to register"}
                  </Button>
                )}
              </div>
            )
          })}
          {!loading && sorted.length === 0 && <p className="panel p-8 text-center text-sm text-muted-foreground lg:col-span-2">No events yet.</p>}
        </div>
      </Container>
    </>
  )
}
