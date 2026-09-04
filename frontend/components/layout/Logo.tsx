import Link from "next/link"
import { GraduationCap } from "lucide-react"

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex size-9 items-center justify-center rounded-xl bg-mint text-mint-foreground">
        <GraduationCap className="size-5" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight">CampusOS</span>
    </Link>
  )
}
