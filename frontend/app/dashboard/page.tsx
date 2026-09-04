"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Bell,
  CalendarDays,
  ClipboardList,
  DoorOpen,
  PartyPopper,
  Sparkles,
} from "lucide-react"
import { Container } from "@/components/layout/PageLayout"
import { PageHeader } from "@/components/common/PageHeader"
import { StatCard } from "@/components/common/StatCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"
import { authClient } from "@/lib/auth-client"

const sections = [
  { href: "/schedule", label: "Schedule", icon: CalendarDays, blurb: "Courses, days, times, rooms and instructors." },
  { href: "/rooms", label: "Rooms", icon: DoorOpen, blurb: "Capacity, equipment, availability and bookings." },
  { href: "/events", label: "Events", icon: PartyPopper, blurb: "Campus events with live registration counts." },
  { href: "/announcements", label: "Announcements", icon: Bell, blurb: "Notices sorted by priority and date." },
  { href: "/assignments", label: "Assignments", icon: ClipboardList, blurb: "Deadlines, status and what's due this week." },
] as const

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function DashboardPage() {
  const { data: session } = authClient.useSession()
  const [schedules, setSchedules] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [s, r, ev, an, asgn] = await Promise.all([
          api.listSchedules().catch(() => []),
          api.listRooms().catch(() => []),
          api.listEvents().catch(() => []),
          api.listAnnouncements().catch(() => []),
          api.listAssignments().catch(() => []),
        ])
        setSchedules(s)
        setRooms(r)
        setEvents(ev)
        setAnnouncements(an)
        setAssignments(asgn)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const today = new Date().toISOString().slice(0, 10)
  const thisWeekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const dueThisWeek = assignments.filter(
    (a) => a.status === "pending" && a.deadline >= today && a.deadline <= thisWeekEnd
  )
  const latestAnnouncement = announcements[0]
  const userName = session?.user?.name

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={userName ? `Welcome back, ${userName}` : "Your campus at a glance"}
        description="Everything below updates instantly as you add, edit or remove records."
        actions={
          <Button variant="mint" asChild>
            <Link href="/agent">
              <Sparkles className="size-4" /> Ask the agent
            </Link>
          </Button>
        }
      />

      <Container className="py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={CalendarDays}
            label="Classes"
            value={loading ? "…" : String(schedules.length)}
            hint="This week"
          />
          <StatCard
            icon={DoorOpen}
            label="Rooms"
            value={loading ? "…" : String(rooms.length)}
            hint="Across campus"
          />
          <StatCard
            icon={PartyPopper}
            label="Events"
            value={loading ? "…" : String(events.length)}
            hint="Coming up"
          />
          <StatCard
            icon={ClipboardList}
            label="Due this week"
            value={loading ? "…" : String(dueThisWeek.length)}
            hint="Pending only"
          />
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sections.map(({ href, label, icon: Icon, blurb }) => (
            <Link key={href} href={href} className="panel group p-6 transition-colors hover:border-mint/40">
              <span className="flex size-10 items-center justify-center rounded-xl bg-secondary/70 text-mint">
                <Icon className="size-5" />
              </span>
              <h2 className="mt-4 font-display text-lg font-semibold">{label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
              <span className="mt-4 inline-block text-sm text-mint opacity-0 transition-opacity group-hover:opacity-100">
                Open →
              </span>
            </Link>
          ))}

          {/* Latest notice card */}
          <div className="panel p-6">
            <h2 className="font-display text-lg font-semibold">Latest notice</h2>
            {latestAnnouncement ? (
              <>
                <div className="mt-3 flex items-center gap-2">
                  <Badge
                    variant={latestAnnouncement.priority === "high" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {latestAnnouncement.priority}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(latestAnnouncement.date)}
                  </span>
                </div>
                <p className="mt-2 font-medium">{latestAnnouncement.title}</p>
                <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                  {latestAnnouncement.body}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">No announcements yet.</p>
            )}
          </div>
        </div>
      </Container>
    </>
  )
}
