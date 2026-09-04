import Link from "next/link"
import { Logo } from "@/components/layout/Logo"

const columns = [
  { title: "Campus", links: ["Class schedule", "Rooms", "Events", "Announcements"] },
  { title: "Academics", links: ["Assignments", "Deadlines", "Instructors", "Courses"] },
  { title: "Help", links: ["Ask the agent", "Guide", "Support", "Contact"] },
]

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="space-y-4">
          <Logo />
          <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
            Every class, room, event, notice and deadline in one place — with an assistant that reads
            the live data and gets things done.
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.title} className="space-y-3">
            <h4 className="text-sm font-semibold">{column.title}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {column.links.map((link) => (
                <li key={link} className="transition-colors hover:text-foreground cursor-pointer">
                  {link}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} CampusOS.
      </div>
    </footer>
  )
}
