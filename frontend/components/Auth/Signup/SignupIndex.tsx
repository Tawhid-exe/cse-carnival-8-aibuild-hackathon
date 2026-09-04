"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { ArrowRight, User, Mail, Lock, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field } from "@/components/common/EntityDialog"
import { authClient } from "@/lib/auth-client"

const SignupIndex = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const f = new FormData(e.currentTarget)
    try {
      const { data, error } = await authClient.signUp.email({
        email: String(f.get("email")),
        password: String(f.get("password")),
        name: String(f.get("name")),
      })
      if (error) {
        toast.error(error.message || "Failed to create account")
        return
      }
      toast.success("Account created! Welcome to CampusOS.")
      router.push("/dashboard")
      router.refresh()
    } catch (err: any) {
      toast.error(err?.message || "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="grid-glow flex min-h-[calc(100vh-4rem)] items-center justify-center py-12 px-5">
      <div className="w-full max-w-md">
        <div className="panel p-8 shadow-xl">
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-mint/30 bg-mint/10 px-3 py-1 text-xs font-medium text-mint">
              <Sparkles className="size-3" />
              Join CampusOS
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold tracking-tight text-foreground">
              Create your account
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              One central account for your campus schedule, rooms, events and AI agent.
            </p>
          </div>

          <form className="grid gap-4" onSubmit={handleSignUp}>
            <Field label="Full name">
              <Input
                name="name"
                required
                placeholder="Ayesha Karim"
                autoComplete="name"
              />
            </Field>

            <Field label="Campus Email">
              <Input
                name="email"
                type="email"
                required
                placeholder="you@campus.edu"
                autoComplete="email"
              />
            </Field>

            <Field label="Password" hint="At least 8 characters.">
              <Input
                name="password"
                type="password"
                required
                minLength={8}
                placeholder="••••••••"
                autoComplete="new-password"
              />
            </Field>

            <Button
              type="submit"
              variant="mint"
              size="lg"
              className="mt-2 w-full font-medium"
              disabled={loading}
            >
              {loading ? (
                "Creating account…"
              ) : (
                <span className="inline-flex items-center gap-2">
                  Create account
                  <ArrowRight className="size-4" />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-6 flex flex-col gap-3 border-t border-border/80 pt-5 text-center text-xs text-muted-foreground">
            <p>
              Already have an account?{" "}
              <Link href="/auth/login" className="font-semibold text-mint hover:underline">
                Log in
              </Link>
            </p>
            <p>
              Campus Administrator?{" "}
              <Link href="/auth/admin" className="text-muted-foreground underline hover:text-foreground">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default SignupIndex