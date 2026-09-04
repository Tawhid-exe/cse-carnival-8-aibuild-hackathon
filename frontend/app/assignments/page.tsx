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

type AssignmentStatus = "pending" | "submitted" | "graded"
const statuses: AssignmentStatus[] = ["pending", "submitted", "graded"]

function AssignmentForm({ value }: { value?: any }) {
  return (
    <>
      <Field label="Course">
        <Input name="course" defaultValue={value?.course} required placeholder="CSE 331" />
      </Field>
      <Field label="Title">
        <Input name="title" defaultValue={value?.title} required placeholder="Greedy algorithms problem set" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Deadline">
          <Input name="deadline" type="date" defaultValue={value?.deadline ?? new Date().toISOString().slice(0, 10)} required />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={value?.status ?? "pending"}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
            {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>
    </>
  )
}

function readItem(f: FormData) {
  return {
    course: String(f.get("course")),
    title: String(f.get("title")),
    deadline: String(f.get("deadline")),
    status: String(f.get("status")) as AssignmentStatus,
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

  async function fetchData() {
    try { setAssignments(await api.listAssignments()) }
    catch { toast.error("Failed to load assignments") }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const list = useMemo(
    () => assignments
      .filter((a) => filter === "all" ? true : isDueThisWeek(a.deadline))
      .filter((a) => statusFilter === "all" ? true : a.status === statusFilter)
      .sort((a, b) => a.deadline.localeCompare(b.deadline)),
    [assignments, filter, statusFilter]
  )

  return (
    <>
      <PageHeader eyebrow="Assignments" title="Assignments & Deadlines"
        description="Never miss a deadline. Track what's due this week and manage your submissions."
        actions={
          <EntityDialog trigger={<Button variant="mint"><Plus className="size-4" /> Add assignment</Button>}
            title="Add assignment" submitLabel="Save assignment"
            onSubmit={async (f) => { await api.createAssignment(readItem(f)); toast.success("Assignment added"); fetchData() }}>
            <AssignmentForm />
          </EntityDialog>
        }
      />
      <Container className="py-10">
        <div className="flex flex-wrap gap-3">
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
              {statuses.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-6 grid gap-3">
          {loading && <p className="panel p-8 text-center text-sm text-muted-foreground">Loading…</p>}
          {list.map((a) => (
            <article key={a._id} className="panel p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={a.status === "pending" ? "default" : "secondary"} className="capitalize">{a.status}</Badge>
                    <span className="text-xs font-medium text-muted-foreground">{a.course}</span>
                    {isDueThisWeek(a.deadline) && a.status === "pending" && (
                      <Badge variant="destructive" className="text-xs">Due soon</Badge>
                    )}
                  </div>
                  <h2 className="mt-2 font-display text-lg font-semibold">{a.title}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Due: {formatDate(a.deadline)}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <EntityDialog
                    trigger={<Button variant="soft" size="icon" aria-label="Edit assignment"><Pencil className="size-4" /></Button>}
                    title="Edit assignment"
                    onSubmit={async (f) => { await api.updateAssignment(a._id, readItem(f)); toast.success("Updated"); fetchData() }}>
                    <AssignmentForm value={a} />
                  </EntityDialog>
                  <Button variant="soft" size="icon" aria-label="Delete assignment"
                    onClick={async () => { await api.deleteAssignment(a._id); toast.success("Deleted"); fetchData() }}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
          {!loading && list.length === 0 && <p className="panel p-8 text-center text-sm text-muted-foreground">No assignments match your filters.</p>}
        </div>
      </Container>
    </>
  )
}
