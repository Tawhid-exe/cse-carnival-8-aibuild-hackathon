"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/layout/Logo"
import { authClient } from "@/lib/auth-client"

const nav = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Schedule", href: "/schedule" },
  { label: "Rooms", href: "/rooms" },
  { label: "Events", href: "/events" },
  { label: "Notices", href: "/announcements" },
  { label: "Assignments", href: "/assignments" },
]

export function SiteHeader() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/auth/login")
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Logo />

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth */}
        <div className="hidden items-center gap-2 md:flex">
          {session?.user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{session.user.name}</span>
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                Sign out
              </Button>
            </div>
          ) : (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/auth/login">Log in</Link>
            </Button>
          )}
          <Button variant="mint" size="sm" asChild>
            <Link href="/agent">Ask the agent</Link>
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="rounded-lg border border-border bg-secondary/60 p-2 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="border-t border-border bg-card px-5 py-4 md:hidden">
          <div className="flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-lg px-3 py-3 text-sm text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            {session?.user ? (
              <Button
                variant="ghost"
                className="mt-2 justify-start"
                onClick={handleSignOut}
              >
                Sign out ({session.user.name})
              </Button>
            ) : (
              <Button variant="ghost" className="mt-2 justify-start" asChild>
                <Link href="/auth/login" onClick={() => setMobileOpen(false)}>Log in</Link>
              </Button>
            )}
            <Button variant="mint" className="mt-4" asChild>
              <Link href="/agent" onClick={() => setMobileOpen(false)}>Ask the agent</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
