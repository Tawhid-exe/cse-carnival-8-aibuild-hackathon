"use client"

import { useEffect, useMemo, useState } from "react"
import { Bell, Calendar, Pencil, Plus, Trash2 } from "lucide-react"
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

type Priority = "high" | "medium" | "low"
const priorities: Priority[] = ["high", "medium", "low"]
const rank: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

function AnnouncementForm({ value }: { value?: any }) {
  const defaultPriority = value?.priority === "normal" ? "medium" : (value?.priority ?? "medium")

  return (
    <>
      <Field label="Title">
        <Input name="title" defaultValue={value?.title} required placeholder="e.g. Midterm Examination Schedule Published" />
      </Field>
      <Field label="Details / Body">
        <Textarea name="body" defaultValue={value?.body} required rows={4} placeholder="Detailed announcement for students…" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Date">
          <Input name="date" type="date" defaultValue={value?.date ?? new Date().toISOString().slice(0, 10)} required />
        </Field>
        <Field label="Priority">
          <select
            name="priority"
            defaultValue={defaultPriority}
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground capitalize"
          >
            {priorities.map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Posted By">
          <Input name="posted_by" defaultValue={value?.posted_by} placeholder="e.g. Dept. Head" />
        </Field>
        <Field label="Expires Date (Optional)">
          <Input name="expires" type="date" defaultValue={value?.expires} placeholder="YYYY-MM-DD" />
        </Field>
      </div>
    </>
  )
}

function readItem(f: FormData) {
  let priority = String(f.get("priority") || "medium").toLowerCase()
  if (priority === "normal") priority = "medium"

  return {
    title: String(f.get("title") || "").trim(),
    body: String(f.get("body") || "").trim(),
    date: String(f.get("date")),
    priority: priority as Priority,
    posted_by: String(f.get("posted_by") || "").trim(),
    expires: String(f.get("expires") || "").trim(),
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
  const [onlyActive, setOnlyActive] = useState(false)

  async function fetchData() {
    try {
      const data = await api.listAnnouncements()
      setAnnouncements(Array.isArray(data) ? data : data?.data || [])
    } catch (err: any) {
      toast.error(err?.message || "Failed to load announcements")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const list = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    return announcements
      .filter((a) => {
        const itemPriority = a.priority === "normal" ? "medium" : a.priority
        if (filter !== "all" && itemPriority !== filter) return false
        if (onlyActive && a.expires && a.expires < today) return false
        return true
      })
      .sort((a, b) => {
        if (sort === "date") return b.date.localeCompare(a.date)
        const aPri = (a.priority === "normal" ? "medium" : a.priority) as Priority
        const bPri = (b.priority === "normal" ? "medium" : b.priority) as Priority
        return (rank[aPri] ?? 1) - (rank[bPri] ?? 1)
      })
  }, [announcements, sort, filter, onlyActive])

  return (
    <>
      <PageHeader
        eyebrow="Announcements"
        title="Campus notices"
        description="Important notices sorted by priority and date. Keep informed on semester updates."
        actions={
          <EntityDialog
            trigger={<Button variant="mint"><Plus className="size-4" /> New notice</Button>}
            title="New announcement"
            submitLabel="Publish notice"
            onSubmit={async (f) => {
              try {
                await api.createAnnouncement(readItem(f))
                toast.success("Announcement published")
                fetchData()
              } catch (err: any) {
                toast.error(err?.message || "Failed to publish announcement")
                return false
              }
            }}
          >
            <AnnouncementForm />
          </EntityDialog>
        }
      />

      <Container className="py-10">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All priorities</SelectItem>
              {priorities.map((p) => (
                <SelectItem key={p} value={p} className="capitalize">
                  {p.charAt(0).toUpperCase() + p.slice(1)} priority
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Newest first</SelectItem>
              <SelectItem value="priority">By priority</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={onlyActive ? "mint" : "soft"}
            size="sm"
            onClick={() => setOnlyActive(!onlyActive)}
          >
            {onlyActive ? "Showing active notices" : "Filter active only"}
          </Button>
        </div>

        <div className="mt-6 grid gap-4">
          {loading && <p className="panel p-8 text-center text-sm text-muted-foreground">Loading notices…</p>}
          {list.map((a) => {
            const annId = a.id || a._id
            const itemPriority = a.priority === "normal" ? "medium" : a.priority
            const isHigh = itemPriority === "high"
            const isMed = itemPriority === "medium"

            return (
              <article key={annId} className="panel p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={isHigh ? "default" : isMed ? "secondary" : "outline"}
                        className={isHigh ? "bg-rose-500/20 text-rose-400 border-rose-500/30" : ""}
                      >
                        {itemPriority.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="size-3" />
                        {formatDate(a.date)}
                      </span>
                      {a.posted_by && (
                        <span className="text-xs text-muted-foreground">· By {a.posted_by}</span>
                      )}
                      {a.expires && (
                        <span className="text-xs text-muted-foreground">· Valid until {formatDate(a.expires)}</span>
                      )}
                    </div>
                    <h2 className="mt-2.5 font-display text-lg font-semibold">{a.title}</h2>
                    <p className="mt-1.5 text-sm leading-relaxed text-foreground/80 whitespace-pre-line">{a.body}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <EntityDialog
                      trigger={<Button variant="soft" size="icon" aria-label="Edit notice"><Pencil className="size-4" /></Button>}
                      title="Edit announcement"
                      onSubmit={async (f) => {
                        try {
                          await api.updateAnnouncement(annId, readItem(f))
                          toast.success("Notice updated")
                          fetchData()
                        } catch (err: any) {
                          toast.error(err?.message || "Failed to update notice")
                          return false
                        }
                      }}
                    >
                      <AnnouncementForm value={a} />
                    </EntityDialog>
                    <Button
                      variant="soft"
                      size="icon"
                      aria-label="Delete notice"
                      onClick={async () => {
                        try {
                          await api.deleteAnnouncement(annId)
                          toast.success("Notice deleted")
                          fetchData()
                        } catch (err: any) {
                          toast.error(err?.message || "Failed to delete notice")
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
            <p className="panel p-8 text-center text-sm text-muted-foreground">No notices found.</p>
          )}
        </div>
      </Container>
    </>
  )
}
