"use client"

import { useEffect, useMemo, useState } from "react"
import { Calendar, CheckCircle2, Clock, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Container } from "@/components/layout/PageLayout"
import { PageHeader } from "@/components/common/PageHeader"
import { EntityDialog, Field } from "@/components/common/EntityDialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"

type AssignmentStatus = "pending" | "submitted" | "graded" | "late"
const statuses: AssignmentStatus[] = ["pending", "submitted", "graded", "late"]

function AssignmentForm({ value }: { value?: any }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Course Code">
          <Input name="course" defaultValue={value?.course} required placeholder="e.g. CSE 4113" />
        </Field>
        <Field label="Course Name">
          <Input name="course_title" defaultValue={value?.course_title} placeholder="e.g. Pattern Recognition" />
        </Field>
      </div>
      <Field label="Assignment Title">
        <Input name="title" defaultValue={value?.title} required placeholder="e.g. Lab Report 1 on Decision Trees" />
      </Field>
      <Field label="Description">
        <Textarea name="description" defaultValue={value?.description} placeholder="Instructions, requirements, or links…" rows={3} />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Deadline">
          <Input name="deadline" type="date" defaultValue={value?.deadline ?? new Date().toISOString().slice(0, 10)} required />
        </Field>
        <Field label="Status">
          <select
            name="status"
            defaultValue={value?.status ?? "pending"}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground capitalize"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Submission Platform">
        <Input name="submission_platform" defaultValue={value?.submission_platform} placeholder="e.g. Google Classroom or Moodle" />
      </Field>
    </>
  )
}

function readItem(f: FormData) {
  return {
    course: String(f.get("course") || "").trim(),
    course_title: String(f.get("course_title") || "").trim(),
    title: String(f.get("title") || "").trim(),
    description: String(f.get("description") || "").trim(),
    deadline: String(f.get("deadline")),
    status: String(f.get("status") || "pending") as AssignmentStatus,
    submission_platform: String(f.get("submission_platform") || "").trim(),
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

function isDueThisWeek(deadline: string) {
  const today = new Date().toISOString().slice(0, 10)
  const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  return deadline >= today && deadline <= end
}

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "this-week">("all")
  const [statusFilter, setStatusFilter] = useState<"all" | AssignmentStatus>("all")
  const [query, setQuery] = useState("")

  async function fetchData() {
    try {
      const data = await api.listAssignments()
      setAssignments(Array.isArray(data) ? data : data?.data || [])
    } catch (err: any) {
      toast.error(err?.message || "Failed to load assignments")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const list = useMemo(() => {
    return assignments
      .filter((a) => {
        if (filter === "this-week" && !isDueThisWeek(a.deadline)) return false
        if (statusFilter !== "all" && a.status !== statusFilter) return false
        if (query) {
          const match = `${a.course} ${a.course_title || ""} ${a.title}`.toLowerCase()
          if (!match.includes(query.toLowerCase())) return false
        }
        return true
      })
      .sort((a, b) => a.deadline.localeCompare(b.deadline))
  }, [assignments, filter, statusFilter, query])

  return (
    <>
      <PageHeader
        eyebrow="Assignments"
        title="Assignments & Deadlines"
        description="Never miss a deadline. Track pending course tasks, deadlines, and submissions."
        actions={
          <EntityDialog
            trigger={<Button variant="mint"><Plus className="size-4" /> Add assignment</Button>}
            title="Add assignment"
            submitLabel="Save assignment"
            onSubmit={async (f) => {
              try {
                await api.createAssignment(readItem(f))
                toast.success("Assignment added")
                fetchData()
              } catch (err: any) {
                toast.error(err?.message || "Failed to add assignment")
                return false
              }
            }}
          >
            <AssignmentForm />
          </EntityDialog>
        }
      />

      <Container className="py-10">
        <div className="flex flex-wrap gap-3">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by course or title"
            className="max-w-xs"
          />
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All dates</SelectItem>
              <SelectItem value="this-week">Due this week</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-6 grid gap-4">
          {loading && <p className="panel p-8 text-center text-sm text-muted-foreground">Loading assignments…</p>}
          {list.map((a) => {
            const asgId = a.id || a._id
            const dueSoon = isDueThisWeek(a.deadline) && a.status === "pending"

            let statusVariant: "default" | "secondary" | "outline" | "destructive" = "secondary"
            let statusColor = ""
            if (a.status === "pending") {
              statusColor = "bg-amber-500/20 text-amber-400 border-amber-500/30"
            } else if (a.status === "submitted") {
              statusColor = "bg-sky-500/20 text-sky-400 border-sky-500/30"
            } else if (a.status === "graded") {
              statusColor = "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
            } else if (a.status === "late") {
              statusColor = "bg-rose-500/20 text-rose-400 border-rose-500/30"
            }

            return (
              <article key={asgId} className="panel p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={statusColor}>
                        {a.status.toUpperCase()}
                      </Badge>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-secondary text-foreground">
                        {a.course}
                      </span>
                      {a.course_title && (
                        <span className="text-xs text-muted-foreground hidden sm:inline">
                          {a.course_title}
                        </span>
                      )}
                      {dueSoon && (
                        <Badge variant="destructive" className="text-xs flex items-center gap-1">
                          <Clock className="size-3" /> Due this week
                        </Badge>
                      )}
                    </div>
                    <h2 className="mt-2.5 font-display text-lg font-semibold">{a.title}</h2>
                    {a.description && (
                      <p className="mt-1 text-sm text-foreground/80 leading-relaxed">{a.description}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3.5" /> Due: <strong className="text-foreground">{formatDate(a.deadline)}</strong>
                      </span>
                      {a.submission_platform && (
                        <span>Platform: {a.submission_platform}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <EntityDialog
                      trigger={<Button variant="soft" size="icon" aria-label="Edit assignment"><Pencil className="size-4" /></Button>}
                      title="Edit assignment"
                      onSubmit={async (f) => {
                        try {
                          await api.updateAssignment(asgId, readItem(f))
                          toast.success("Assignment updated")
                          fetchData()
                        } catch (err: any) {
                          toast.error(err?.message || "Failed to update assignment")
                          return false
                        }
                      }}
                    >
                      <AssignmentForm value={a} />
                    </EntityDialog>
                    <Button
                      variant="soft"
                      size="icon"
                      aria-label="Delete assignment"
                      onClick={async () => {
                        try {
                          await api.deleteAssignment(asgId)
                          toast.success("Assignment deleted")
                          fetchData()
                        } catch (err: any) {
                          toast.error(err?.message || "Failed to delete assignment")
                        }
                      }}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </article>
            )
          })}
          {!loading && list.length === 0 && (
            <p className="panel p-8 text-center text-sm text-muted-foreground">
              No assignments match your filter.
            </p>
          )}
        </div>
      </Container>
    </>
  )
}
