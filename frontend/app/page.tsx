export default function HomePage() {
  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold">CampusOS</h1>
        <p className="text-slate-600">Your campus data + an AI agent in one place.</p>
      </header>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {[
          { label: "Schedules", href: "/schedule" },
          { label: "Rooms", href: "/rooms" },
          { label: "Events", href: "/events" },
          { label: "Announcements", href: "/announcements" },
          { label: "Assignments", href: "/assignments" }
        ].map((c) => (
          <a
            key={c.href}
            href={c.href}
            className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm hover:shadow transition"
          >
            <div className="text-sm text-slate-500">{c.label}</div>
            <div className="mt-2 text-2xl font-semibold">—</div>
          </a>
        ))}
      </div>
    </section>
  )
}
