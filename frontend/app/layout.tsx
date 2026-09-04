import "./globals.css"
import type { Metadata } from "next"
import { Nav } from "@/components/Nav"

export const metadata: Metadata = {
  title: "CampusOS",
  description: "Intelligent campus platform for AUST"
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Nav />
        <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      </body>
    </html>
  )
}
