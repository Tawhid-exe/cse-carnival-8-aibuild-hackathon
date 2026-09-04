"use client"

import { useEffect, useMemo, useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Container } from "@/components/layout/PageLayout"
import { PageHeader } from "@/components/common/PageHeader"
import { EntityDialog, Field } from "@/components/common/EntityDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

function ClassForm({ value }: { value?: any }) {
  return (
    <>
      <Field label="Course">
        <Input name="course" defaultValue={value?.course} required placeholder="CSE 331 — Algorithms" />
      </Field>
      <Field label="Day">
        <select
          name="day"
          defaultValue={value?.day ?? DAYS[0]}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
        >
          {DAYS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Starts">
          <Input name="start" type="time" defaultValue={value?.start ?? "09:00"} required />
        </Field>
        <Field label="Ends">
          <Input name="end" type="time" defaultValue={value?.end ?? "10:30"} required />
        </Field>
      </div>
      <Field label="Room">
        <Input name="room" defaultValue={value?.room} required placeholder="A-201" />
      </Field>
      <Field label="Instructor">
        <Input name="instructor" defaultValue={value?.instructor} required placeholder="Dr. Rahman" />
      </Field>
    </>
  )
}

function read(f: FormData) {
  return {
    course: String(f.get("course")),
    day: String(f.get("day")),
    start: String(f.get("start")),
    end: String(f.get("end")),
    room: String(f.get("room")),
    instructor: String(f.get("instructor")),
  }
}

export default function SchedulePage() {
  const [classes, setClasses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [day, setDay] = useState("all")

  async function fetchData() {
    try {
      const data = await api.listSchedules()
      setClasses(data)
    } catch {
      toast.error("Failed to load schedules")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = useMemo(
    () =>
      classes
        .filter((c) => (day === "all" ? true : c.day === day))
        .filter((c) =>
          `${c.course} ${c.instructor} ${c.room}`.toLowerCase().includes(query.toLowerCase())
        )
        .sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.start.localeCompare(b.start)),
    [classes, query, day]
  )

  return (
    <>
      <PageHeader
        eyebrow="Schedule"
        title="Class schedule"
        description="Every class with its course, day, time, room and instructor. Changes appear instantly."
        actions={
          <EntityDialog
            trigger={<Button variant="mint"><Plus className="size-4" /> Add class</Button>}
            title="Add class"
            submitLabel="Add class"
            onSubmit={async (f) => {
              await api.createSchedule(read(f))
              toast.success("Class added")
              fetchData()
            }}
          >
            <ClassForm />
          </EntityDialog>
        }
      />

      <Container className="py-10">
        <div className="flex flex-wrap gap-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search course, instructor or room"
            className="max-w-sm"
          />
          <Select value={day} onValueChange={setDay}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All days" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All days</SelectItem>
              {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6 grid gap-3">
          {loading && <p className="panel p-8 text-center text-sm text-muted-foreground">Loading…</p>}
          {filtered.map((c) => (
            <div key={c._id} className="panel flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-semibold">{c.course}</h2>
                  <Badge variant="secondary">{c.day}</Badge>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {c.start}–{c.end} · Room {c.room} · {c.instructor}
                </p>
              </div>
              <div className="flex gap-2">
                <EntityDialog
                  trigger={<Button variant="soft" size="icon" aria-label="Edit class"><Pencil className="size-4" /></Button>}
                  title="Edit class"
                  onSubmit={async (f) => {
                    await api.updateSchedule(c._id, read(f))
                    toast.success("Class updated")
                    fetchData()
                  }}
                >
                  <ClassForm value={c} />
                </EntityDialog>
                <Button
                  variant="soft"
                  size="icon"
                  aria-label="Delete class"
                  onClick={async () => {
                    await api.deleteSchedule(c._id)
                    toast.success("Class deleted")
                    fetchData()
                  }}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <p className="panel p-8 text-center text-sm text-muted-foreground">
              No classes match that filter.
            </p>
          )}
        </div>
      </Container>
    </>
  )
}
