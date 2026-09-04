"use client"

import { useEffect, useMemo, useState } from "react"
import { Pencil, Plus, Trash2 } from "lucide-react"
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

type Priority = "high" | "normal" | "low"
const priorities: Priority[] = ["high", "normal", "low"]
const rank: Record<Priority, number> = { high: 0, normal: 1, low: 2 }

function AnnouncementForm({ value }: { value?: any }) {
  return (
    <>
      <Field label="Title">
        <Input name="title" defaultValue={value?.title} required placeholder="Midterm schedule published" />
      </Field>
      <Field label="Body">
        <Textarea name="body" defaultValue={value?.body} required rows={4} placeholder="Details students should know…" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Date">
          <Input name="date" type="date" defaultValue={value?.date ?? new Date().toISOString().slice(0, 10)} required />
        </Field>
        <Field label="Priority">
          <select name="priority" defaultValue={value?.priority ?? "normal"}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground">
            {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
      </div>
    </>
  )
}

function readItem(f: FormData) {
  return {
    title: String(f.get("title")),
    body: String(f.get("body")),
    date: String(f.get("date")),
    priority: String(f.get("priority")) as Priority,
  }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<"date" | "priority">("date")
  const [filter, setFilter] = useState<"all" | Priority>("all")

  async function fetchData() {
    try { setAnnouncements(await api.listAnnouncements()) }
    catch { toast.error("Failed to load announcements") }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const list = useMemo(
    () => announcements
      .filter((a) => filter === "all" ? true : a.priority === filter)
      .sort((a, b) => sort === "date" ? b.date.localeCompare(a.date) : rank[a.priority as Priority] - rank[b.priority as Priority]),
    [announcements, sort, filter]
  )

  return (
    <>
      <PageHeader eyebrow="Announcements" title="Campus notices"
        description="Post, edit and prioritise the notices your campus needs to see."
        actions={
          <EntityDialog trigger={<Button variant="mint"><Plus className="size-4" /> New notice</Button>}
            title="New announcement" submitLabel="Publish"
            onSubmit={async (f) => { await api.createAnnouncement(readItem(f)); toast.success("Announcement published"); fetchData() }}>
            <AnnouncementForm />
          </EntityDialog>
        }
      />
      <Container className="py-10">
        <div className="flex flex-wrap gap-3">
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {priorities.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Newest first</SelectItem>
              <SelectItem value="priority">By priority</SelectItem>
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
                    <Badge variant={a.priority === "high" ? "default" : "secondary"} className="capitalize">{a.priority}</Badge>
                    <span className="text-xs text-muted-foreground">{formatDate(a.date)}</span>
                  </div>
                  <h2 className="mt-2 font-display font-semibold">{a.title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{a.body}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <EntityDialog
                    trigger={<Button variant="soft" size="icon" aria-label="Edit notice"><Pencil className="size-4" /></Button>}
                    title="Edit announcement"
                    onSubmit={async (f) => { await api.updateAnnouncement(a._id, readItem(f)); toast.success("Updated"); fetchData() }}>
                    <AnnouncementForm value={a} />
                  </EntityDialog>
                  <Button variant="soft" size="icon" aria-label="Delete notice"
                    onClick={async () => { await api.deleteAnnouncement(a._id); toast.success("Deleted"); fetchData() }}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </article>
          ))}
          {!loading && list.length === 0 && <p className="panel p-8 text-center text-sm text-muted-foreground">No notices to show.</p>}
        </div>
      </Container>
    </>
  )
}
