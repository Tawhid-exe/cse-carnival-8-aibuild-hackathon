import "./globals.css"
import type { Metadata } from "next"
import { PageLayout } from "@/components/layout/PageLayout"
import { Toaster } from "sonner"

export const metadata: Metadata = {
  title: "CampusOS — Campus data and AI agent",
  description: "One place for class schedules, rooms, events, announcements and deadlines, with an AI agent that reads and acts on the live data.",
  openGraph: {
    title: "CampusOS — Campus data and AI agent",
    description: "Schedules, rooms, events, notices and deadlines — plus an agent that acts on them.",
    type: "website",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap"
        />
      </head>
      <body className="min-h-screen">
        <PageLayout>{children}</PageLayout>
        <Toaster richColors theme="dark" position="bottom-right" />
      </body>
    </html>
  )
}
