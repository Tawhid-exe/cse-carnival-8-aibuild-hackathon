"use client"

import { useEffect, useState } from "react"
import { Calendar, MapPin, Pencil, Plus, Trash2, UserMinus, UserPlus, Users } from "lucide-react"
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
        <Input name="name" defaultValue={value?.name} required placeholder="e.g. CSE Carnival Hackathon" />
      </Field>
      <Field label="Description">
        <Input name="description" defaultValue={value?.description} placeholder="Short event description" />
      </Field>
      <Field label="Date">
        <Input name="date" type="date" defaultValue={value?.date} required />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Starts">
          <Input name="start_time" type="time" defaultValue={value?.start_time || value?.time || "10:00"} required />
        </Field>
        <Field label="Ends">
          <Input name="end_time" type="time" defaultValue={value?.end_time || "12:00"} required />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Venue">
          <Input name="venue" defaultValue={value?.venue || value?.location} required placeholder="Main Auditorium" />
        </Field>
        <Field label="Organizer">
          <Input name="organizer" defaultValue={value?.organizer} placeholder="CSE Society" />
        </Field>
      </div>
      <Field label="Capacity">
        <Input name="capacity" type="number" min={1} defaultValue={value?.capacity ?? 50} required />
      </Field>
    </>
  )
}

function readEvent(f: FormData) {
  return {
    name: String(f.get("name") || "").trim(),
    description: String(f.get("description") || "").trim(),
    date: String(f.get("date")),
    start_time: String(f.get("start_time") || "10:00"),
    end_time: String(f.get("end_time") || "12:00"),
    venue: String(f.get("venue") || "Campus"),
    organizer: String(f.get("organizer") || "Campus"),
    capacity: Number(f.get("capacity") || 50),
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
    try {
      const data = await api.listEvents()
      setEvents(Array.isArray(data) ? data : data?.data || [])
    } catch (err: any) {
      toast.error(err?.message || "Failed to load events")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const userId = session?.user?.id ?? ""
  const userName = session?.user?.name ?? "Student"
  const studentId = session?.user?.email?.split("@")[0] || userId || "student"

  const sorted = [...events].sort((a, b) => {
    const aDate = `${a.date} ${a.start_time || a.time || ""}`
    const bDate = `${b.date} ${b.start_time || b.time || ""}`
    return aDate.localeCompare(bDate)
  })

  return (
    <>
      <PageHeader
        eyebrow="Events"
        title="Campus events"
        description="Browse upcoming events, register with one click, and check live capacity."
        actions={
          <EntityDialog
            trigger={<Button variant="mint"><Plus className="size-4" /> Add event</Button>}
            title="Add event"
            submitLabel="Add event"
            onSubmit={async (f) => {
              try {
                await api.createEvent(readEvent(f))
                toast.success("Event created")
                fetchData()
              } catch (err: any) {
                toast.error(err?.message || "Failed to create event")
                return false
              }
            }}
          >
            <EventForm />
          </EntityDialog>
        }
      />

      <Container className="py-10">
        <div className="grid gap-6 lg:grid-cols-2">
          {loading && <p className="panel p-8 text-center text-sm text-muted-foreground lg:col-span-2">Loading events…</p>}
          {sorted.map((ev) => {
            const eventId = ev.id || ev._id
            const registrations = Array.isArray(ev.registrations) ? ev.registrations : []
            const registeredCount = ev.registered ?? registrations.length
            const full = registeredCount >= ev.capacity || ev.status === "full"

            const myReg = registrations.find(
              (r: any) =>
                (userId && r.user_id === userId) ||
                (studentId && r.student_id === studentId) ||
                r.name === userName
            )
            const isRegistered = Boolean(myReg)

            return (
              <div key={eventId} className="panel flex flex-col justify-between p-6">
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-xl font-bold">{ev.name}</h2>
                        {full && <Badge variant="secondary">Full</Badge>}
                        {ev.status && ev.status !== "upcoming" && ev.status !== "full" && (
                          <Badge variant="outline" className="capitalize">{ev.status}</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground flex items-center gap-2">
                        <Calendar className="size-3.5" />
                        {formatDate(ev.date)} · {ev.start_time || ev.time}
                        {ev.end_time ? `–${ev.end_time}` : ""}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground flex items-center gap-2">
                        <MapPin className="size-3.5" />
                        {ev.venue || ev.location}
                        {ev.organizer ? ` · Organized by ${ev.organizer}` : ""}
                      </p>
                      {ev.description && (
                        <p className="mt-2 text-sm text-foreground/80">{ev.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <EntityDialog
                        trigger={<Button variant="soft" size="icon" aria-label="Edit event"><Pencil className="size-4" /></Button>}
                        title="Edit event"
                        onSubmit={async (f) => {
                          try {
                            await api.updateEvent(eventId, readEvent(f))
                            toast.success("Event updated")
                            fetchData()
                          } catch (err: any) {
                            toast.error(err?.message || "Failed to update event")
                            return false
                          }
                        }}
                      >
                        <EventForm value={ev} />
                      </EntityDialog>
                      <Button
                        variant="soft"
                        size="icon"
                        aria-label="Delete event"
                        onClick={async () => {
                          try {
                            await api.deleteEvent(eventId)
                            toast.success("Event deleted")
                            fetchData()
                          } catch (err: any) {
                            toast.error(err?.message || "Failed to delete event")
                          }
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-border pt-4">
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Users className="size-4" />
                        <strong>{registeredCount}</strong> of {ev.capacity} spots filled
                      </span>
                      <span className="text-xs font-semibold">
                        {Math.round((registeredCount / ev.capacity) * 100)}%
                      </span>
                    </div>
                    <Progress value={Math.min(100, (registeredCount / ev.capacity) * 100)} className="h-2" />
                  </div>
                </div>

                <div className="mt-6">
                  {isRegistered ? (
                    <Button
                      variant="soft"
                      className="w-full text-rose-400 hover:text-rose-300 border-rose-500/20"
                      onClick={async () => {
                        try {
                          const regId = myReg.registration_id || myReg.student_id || studentId
                          await api.cancelEventRegistration(eventId, regId)
                          toast.success("Registration cancelled successfully")
                          fetchData()
                        } catch (err: any) {
                          toast.error(err?.message || "Failed to cancel registration")
                        }
                      }}
                    >
                      <UserMinus className="size-4 mr-1.5" /> Cancel my registration
                    </Button>
                  ) : (
                    <Button
                      variant="mint"
                      className="w-full"
                      disabled={full || !session?.user}
                      onClick={async () => {
                        if (full) {
                          toast.error("This event has reached full capacity")
                          return
                        }
                        if (!session?.user) {
                          toast.error("Please log in to register for events")
                          return
                        }
                        try {
                          await api.registerEvent(eventId, {
                            student_id: studentId,
                            name: userName,
                            user_id: userId,
                          })
                          toast.success(`Registered for ${ev.name}!`)
                          fetchData()
                        } catch (err: any) {
                          toast.error(err?.message || "Registration failed")
                        }
                      }}
                    >
                      <UserPlus className="size-4 mr-1.5" />
                      {full ? "Event is full" : session?.user ? "Register for this event" : "Log in to register"}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
          {!loading && sorted.length === 0 && (
            <p className="panel p-8 text-center text-sm text-muted-foreground lg:col-span-2">
              No campus events found.
            </p>
          )}
        </div>
      </Container>
    </>
  )
}
