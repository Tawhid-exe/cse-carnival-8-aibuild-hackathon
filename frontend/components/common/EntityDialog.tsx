"use client"

import type { ReactNode } from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface EntityDialogProps {
  trigger: ReactNode
  title: string
  description?: string
  submitLabel?: string
  children: ReactNode
  /** Return false to keep the dialog open (e.g. validation failed). */
  onSubmit: (form: FormData) => boolean | void | Promise<boolean | void>
}

export function EntityDialog({
  trigger,
  title,
  description,
  submitLabel = "Save",
  children,
  onSubmit,
}: EntityDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <form
          className="grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault()
            setLoading(true)
            const data = new FormData(e.currentTarget)
            const result = await onSubmit(data)
            setLoading(false)
            if (result !== false) setOpen(false)
          }}
        >
          {children}
          <DialogFooter className="mt-2">
            <Button type="button" variant="soft" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" variant="mint" disabled={loading}>
              {loading ? "Saving…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span className="font-medium text-foreground">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  )
}
