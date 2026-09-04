import Link from "next/link"

const links = [
  { href: "/", label: "Home" },
  { href: "/schedule", label: "Schedule" },
  { href: "/rooms", label: "Rooms" },
  { href: "/events", label: "Events" },
  { href: "/announcements", label: "Announcements" },
  { href: "/assignments", label: "Assignments" },
  { href: "/agent", label: "Agent" }
]

export function Nav() {
  return (
    <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-6 py-3">
        <Link href="/" className="font-bold text-lg">
          CampusOS
        </Link>
        <div className="flex flex-1 gap-4 text-sm">
          {links.slice(1).map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-slate-600 hover:text-slate-900"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
