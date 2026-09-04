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

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]

function ClassForm({ value }: { value?: any }) {
  return (
    <>
      <Field label="Course Code">
        <Input name="course" defaultValue={value?.course} required placeholder="e.g. CSE 4113" />
      </Field>
      <Field label="Course Title">
        <Input name="title" defaultValue={value?.title} required placeholder="e.g. Pattern Recognition and Machine Learning" />
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
          <Input name="start_time" type="time" defaultValue={value?.start_time || value?.start || "09:00"} required />
        </Field>
        <Field label="Ends">
          <Input name="end_time" type="time" defaultValue={value?.end_time || value?.end || "10:30"} required />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Room">
          <Input name="room" defaultValue={value?.room} required placeholder="7A07" />
        </Field>
        <Field label="Section">
          <Input name="section" defaultValue={value?.section} placeholder="A or B" />
        </Field>
      </div>
      <Field label="Instructor">
        <Input name="instructor" defaultValue={value?.instructor} placeholder="Prof. Dr. Md. Shahriar Mahbub" />
      </Field>
    </>
  )
}

function read(f: FormData) {
  return {
    course: String(f.get("course") || "").trim(),
    title: String(f.get("title") || "").trim() || String(f.get("course") || "").trim(),
    day: String(f.get("day")),
    start_time: String(f.get("start_time")),
    end_time: String(f.get("end_time")),
    room: String(f.get("room") || "").trim(),
    instructor: String(f.get("instructor") || "TBA").trim(),
    section: String(f.get("section") || "").trim(),
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
      setClasses(Array.isArray(data) ? data : data?.data || [])
    } catch (err: any) {
      toast.error(err?.message || "Failed to load schedules")
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
          `${c.course} ${c.title || ""} ${c.instructor || ""} ${c.room}`.toLowerCase().includes(query.toLowerCase())
        )
        .sort((a, b) => {
          const dayDiff = DAYS.indexOf(a.day) - DAYS.indexOf(b.day)
          if (dayDiff !== 0) return dayDiff
          const aStart = a.start_time || a.start || ""
          const bStart = b.start_time || b.start || ""
          return aStart.localeCompare(bStart)
        }),
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
              try {
                await api.createSchedule(read(f))
                toast.success("Class added successfully")
                fetchData()
              } catch (err: any) {
                toast.error(err?.message || "Failed to add class")
                return false
              }
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
            placeholder="Search course, title, instructor or room"
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
          {filtered.map((c) => {
            const classId = c.id || c._id
            return (
              <div key={classId} className="panel flex flex-wrap items-center justify-between gap-4 p-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display font-semibold">{c.course}</h2>
                    {c.section && <Badge variant="outline">Sec {c.section}</Badge>}
                    <Badge variant="secondary">{c.day}</Badge>
                  </div>
                  {c.title && <p className="text-sm font-medium text-foreground/80 mt-0.5">{c.title}</p>}
                  <p className="mt-1 text-sm text-muted-foreground">
                    {c.start_time || c.start}–{c.end_time || c.end} · Room {c.room} · {c.instructor}
                  </p>
                </div>
                <div className="flex gap-2">
                  <EntityDialog
                    trigger={<Button variant="soft" size="icon" aria-label="Edit class"><Pencil className="size-4" /></Button>}
                    title="Edit class"
                    onSubmit={async (f) => {
                      try {
                        await api.updateSchedule(classId, read(f))
                        toast.success("Class updated")
                        fetchData()
                      } catch (err: any) {
                        toast.error(err?.message || "Failed to update class")
                        return false
                      }
                    }}
                  >
                    <ClassForm value={c} />
                  </EntityDialog>
                  <Button
                    variant="soft"
                    size="icon"
                    aria-label="Delete class"
                    onClick={async () => {
                      try {
                        await api.deleteSchedule(classId)
                        toast.success("Class deleted")
                        fetchData()
                      } catch (err: any) {
                        toast.error(err?.message || "Failed to delete class")
                      }
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            )
          })}
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
