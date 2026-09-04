"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  Bell,
  CalendarDays,
  ClipboardList,
  Clock,
  DoorOpen,
  PartyPopper,
  Search,
  Sparkles,
} from "lucide-react"
import { Container } from "@/components/layout/PageLayout"
import { PageHeader } from "@/components/common/PageHeader"
import { StatCard } from "@/components/common/StatCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [schedules, setSchedules] = useState<any[]>([])
  const [rooms, setRooms] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [askQuery, setAskQuery] = useState("")

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
        setSchedules(Array.isArray(s) ? s : [])
        setRooms(Array.isArray(r) ? r : [])
        setEvents(Array.isArray(ev) ? ev : [])
        setAnnouncements(Array.isArray(an) ? an : [])
        setAssignments(Array.isArray(asgn) ? asgn : [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const todayStr = new Date().toISOString().slice(0, 10)
  const thisWeekEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const dueThisWeek = assignments.filter(
    (a) => a.status === "pending" && a.deadline >= todayStr && a.deadline <= thisWeekEnd
  )
  const latestAnnouncement = announcements[0]
  const userName = session?.user?.name

  // Determine current/next class
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
  const currentDay = dayNames[new Date().getDay()]
  const nowTime = new Date().toTimeString().slice(0, 5) // "HH:MM"
  const todaysClasses = schedules
    .filter((c) => c.day === currentDay)
    .sort((a, b) => (a.start_time || a.start || "").localeCompare(b.start_time || b.start || ""))
  const nextClass = todaysClasses.find((c) => (c.end_time || c.end || "") > nowTime) || todaysClasses[0]

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault()
    if (!askQuery.trim()) return
    router.push(`/agent?q=${encodeURIComponent(askQuery.trim())}`)
  }

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={userName ? `Welcome back, ${userName}` : "Your campus at a glance"}
        description="Live data across schedules, rooms, events, notices, and assignments."
        actions={
          <Button variant="mint" asChild>
            <Link href="/agent">
              <Sparkles className="size-4" /> Ask the agent
            </Link>
          </Button>
        }
      />

      <Container className="py-10">
        {/* Ask CampusOS Assistant bar */}
        <form onSubmit={handleAsk} className="panel p-3 mb-8 flex items-center gap-3">
          <Search className="size-5 text-mint ml-2" />
          <Input
            value={askQuery}
            onChange={(e) => setAskQuery(e.target.value)}
            placeholder="Ask CampusOS Assistant anything (e.g. Where is my next class? Book a room tomorrow...)"
            className="border-0 bg-transparent focus-visible:ring-0 text-base placeholder:text-muted-foreground"
          />
          <Button type="submit" variant="mint" size="sm">
            Ask Agent <ArrowRight className="size-4 ml-1" />
          </Button>
        </form>

        {/* Top metric stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={CalendarDays}
            label="Classes"
            value={loading ? "…" : String(schedules.length)}
            hint="Scheduled classes"
          />
          <StatCard
            icon={DoorOpen}
            label="Rooms"
            value={loading ? "…" : String(rooms.length)}
            hint="Classrooms & labs"
          />
          <StatCard
            icon={PartyPopper}
            label="Events"
            value={loading ? "…" : String(events.length)}
            hint="Campus events"
          />
          <StatCard
            icon={ClipboardList}
            label="Due this week"
            value={loading ? "…" : String(dueThisWeek.length)}
            hint="Pending assignments"
          />
        </div>

        {/* Spotlight row: Next Class & Latest Notice */}
        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {/* Next Class Widget */}
          <div className="panel p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-[0.18em] text-mint flex items-center gap-1.5">
                  <Clock className="size-3.5" /> Next Class Today ({currentDay})
                </span>
                {nextClass?.section && <Badge variant="outline">Sec {nextClass.section}</Badge>}
              </div>
              {nextClass ? (
                <div className="mt-3">
                  <h3 className="text-xl font-bold font-display">{nextClass.course}</h3>
                  {nextClass.title && (
                    <p className="text-sm font-medium text-foreground/80 mt-0.5">{nextClass.title}</p>
                  )}
                  <p className="mt-2 text-sm text-muted-foreground">
                    Time: <strong className="text-foreground">{nextClass.start_time || nextClass.start} – {nextClass.end_time || nextClass.end}</strong>
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Room: <strong className="text-foreground">{nextClass.room}</strong> · Instructor: {nextClass.instructor}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">
                  No more classes scheduled for today ({currentDay}). Enjoy your day!
                </p>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-border flex justify-end">
              <Link href="/schedule" className="text-xs text-mint hover:underline flex items-center gap-1">
                View complete timetable →
              </Link>
            </div>
          </div>

          {/* Latest notice card */}
          <div className="panel p-6 flex flex-col justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint flex items-center gap-1.5">
                <Bell className="size-3.5" /> Latest Campus Notice
              </p>
              {latestAnnouncement ? (
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={latestAnnouncement.priority === "high" ? "default" : "secondary"}
                      className="capitalize text-xs"
                    >
                      {latestAnnouncement.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(latestAnnouncement.date)}
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-lg font-bold">{latestAnnouncement.title}</h3>
                  <p className="mt-1 line-clamp-3 text-sm text-muted-foreground leading-relaxed">
                    {latestAnnouncement.body}
                  </p>
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No notices published yet.</p>
              )}
            </div>
            <div className="mt-4 pt-4 border-t border-border flex justify-end">
              <Link href="/announcements" className="text-xs text-mint hover:underline flex items-center gap-1">
                View all announcements →
              </Link>
            </div>
          </div>
        </div>

        {/* Feature systems grid */}
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sections.map(({ href, label, icon: Icon, blurb }) => (
            <Link key={href} href={href} className="panel group p-6 transition-all hover:border-mint/40 hover:-translate-y-0.5">
              <span className="flex size-10 items-center justify-center rounded-xl bg-secondary/70 text-mint">
                <Icon className="size-5" />
              </span>
              <h2 className="mt-4 font-display text-lg font-semibold">{label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
              <span className="mt-4 inline-block text-sm text-mint opacity-0 transition-opacity group-hover:opacity-100">
                Open {label} →
              </span>
            </Link>
          ))}
        </div>
      </Container>
    </>
  )
}
