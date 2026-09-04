import type { ReactNode } from "react"
import { Container } from "@/components/layout/PageLayout"

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string
  title: string
  description: string
  actions?: ReactNode
}) {
  return (
    <section className="grid-glow border-b border-border py-12">
      <Container className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-mint">
            {eyebrow}
          </p>
          <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{description}</p>
        </div>
        {actions && <div className="flex gap-2">{actions}</div>}
      </Container>
    </section>
  )
}
