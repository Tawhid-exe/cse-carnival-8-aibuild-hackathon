"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Bell,
  CalendarDays,
  ClipboardList,
  DoorOpen,
  MessageSquare,
  PartyPopper,
  Sparkles,
} from "lucide-react"
import { Container } from "@/components/layout/PageLayout"
import { StatCard } from "@/components/common/StatCard"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

const systems = [
  {
    icon: CalendarDays,
    title: "Schedule",
    href: "/schedule",
    description: "Courses, times, rooms, days and instructors — add, edit or cancel a class.",
  },
  {
    icon: DoorOpen,
    title: "Rooms",
    href: "/rooms",
    description: "Capacity and equipment for every room, with booking and cancellation.",
  },
  {
    icon: Sparkles,
    title: "Events",
    href: "/events",
    description: "What's on today, how many spots are left, and one-tap registration.",
  },
  {
    icon: Bell,
    title: "Announcements",
    href: "/announcements",
    description: "Notices with priority, so the important ones never get buried.",
  },
  {
    icon: ClipboardList,
    title: "Assignments",
    href: "/assignments",
    description: "Every deadline and its status, tracked per course.",
  },
]

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export default function HomePage() {
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

  return (
    <>
      {/* Hero */}
      <section className="grid-glow border-b border-border">
        <Container className="grid gap-12 py-20 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:py-28">
          <div>
            <Badge variant="outline" className="border-mint/40 text-mint">
              Campus data, live
            </Badge>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] sm:text-6xl">
              Everything on campus,{" "}
              <span className="text-gradient-mint">in one place</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Class times, free rooms, what's on today, notices you actually need and the deadline
              you forgot. Change something here and the assistant knows it instantly.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="mint" size="xl" asChild>
                <Link href="/dashboard">
                  Open the dashboard <ArrowRight />
                </Link>
              </Button>
              <Button variant="soft" size="xl" asChild>
                <Link href="/agent">Ask the agent</Link>
              </Button>
            </div>
          </div>

          <div className="panel p-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="size-4 text-mint" /> Campus assistant
            </div>
            <div className="mt-5 space-y-4">
              <p className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-secondary/70 p-3 text-sm">
                Where is my CSE321 class today?
              </p>
              <p className="max-w-[85%] rounded-2xl rounded-bl-sm border border-mint/25 bg-accent/40 p-3 text-sm">
                CSE321 has been moved to Room 304 today at 2:00 PM.
              </p>
              <p className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-secondary/70 p-3 text-sm">
                Book Room 302 tomorrow, 3 to 5 PM.
              </p>
              <p className="max-w-[85%] rounded-2xl rounded-bl-sm border border-mint/25 bg-accent/40 p-3 text-sm">
                Room 302 is free then — booked and confirmed.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Stat cards */}
      <Container className="space-y-12 py-16">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={CalendarDays}
            label="Classes"
            value={loading ? "…" : String(schedules.length)}
            hint="In the schedule"
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

        {/* Latest announcement */}
        {latestAnnouncement && (
          <div className="panel p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-mint">
              Latest notice
            </p>
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
          </div>
        )}

        {/* Systems grid */}
        <div>
          <h2 className="text-2xl font-bold sm:text-3xl">Five systems, one source of truth</h2>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Add, edit and delete anything — it saves straight away, and the assistant reads the same
            live data you're looking at.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {systems.map((system) => (
              <Link
                key={system.title}
                href={system.href}
                className="panel group p-5 transition-transform duration-200 hover:-translate-y-1"
              >
                <span className="flex size-10 items-center justify-center rounded-xl bg-secondary/70 text-mint">
                  <system.icon className="size-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{system.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {system.description}
                </p>
                <span className="mt-4 inline-block text-sm text-mint opacity-0 transition-opacity group-hover:opacity-100">
                  Open →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </>
  )
}
