"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Menu, X, LogOut, User as UserIcon } from "lucide-react"
import { toast } from "sonner"
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

function getInitials(name?: string, email?: string) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return parts[0].slice(0, 2).toUpperCase()
  }
  if (email) {
    return email.slice(0, 2).toUpperCase()
  }
  return "U"
}

export function SiteHeader() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => {
    try {
      await authClient.signOut()
      toast.success("Logged out successfully")
      router.push("/auth/login")
      router.refresh()
    } catch {
      router.push("/auth/login")
    }
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
              <div className="flex items-center gap-2.5 rounded-full border border-border/80 bg-secondary/50 py-1 pl-1.5 pr-3 shadow-xs">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "Profile"}
                    className="size-7 rounded-full object-cover ring-1 ring-mint/40"
                  />
                ) : (
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-mint/20 to-teal-500/20 text-xs font-semibold text-mint ring-1 ring-mint/30 shadow-xs">
                    <span>{getInitials(session.user.name, session.user.email)}</span>
                  </div>
                )}
                <span
                  className="max-w-[130px] truncate text-sm font-medium text-foreground"
                  title={session.user.name || session.user.email}
                >
                  {session.user.name || session.user.email}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="gap-1.5 border-border/80 text-xs text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive transition-colors"
                title="Log out"
              >
                <LogOut className="size-3.5" />
                <span>Log out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login">Log in</Link>
              </Button>
              <Button variant="outline" size="sm" className="border-border/80 text-xs" asChild>
                <Link href="/auth/signup">Sign up</Link>
              </Button>
            </div>
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
              <div className="mt-3 border-t border-border pt-3">
                <div className="flex items-center gap-3 px-2 py-2">
                  {session.user.image ? (
                    <img
                      src={session.user.image}
                      alt={session.user.name || "Profile"}
                      className="size-9 rounded-full object-cover ring-2 ring-mint/40"
                    />
                  ) : (
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-mint/20 to-teal-500/20 text-xs font-semibold text-mint ring-1 ring-mint/30">
                      <span>{getInitials(session.user.name, session.user.email)}</span>
                    </div>
                  )}
                  <div className="flex flex-col min-w-0">
                    <span className="truncate text-sm font-medium text-foreground">
                      {session.user.name || "User"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {session.user.email}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="mt-2 w-full justify-center gap-2 border-border/80 text-xs hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    setMobileOpen(false)
                    handleSignOut()
                  }}
                >
                  <LogOut className="size-4" />
                  Log out
                </Button>
              </div>
            ) : (
              <div className="mt-2 flex flex-col gap-2 border-t border-border/60 pt-3">
                <Button variant="ghost" className="justify-start" asChild>
                  <Link href="/auth/login" onClick={() => setMobileOpen(false)}>Log in</Link>
                </Button>
                <Button variant="outline" className="justify-start border-border/80 text-xs" asChild>
                  <Link href="/auth/signup" onClick={() => setMobileOpen(false)}>Sign up</Link>
                </Button>
              </div>
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
