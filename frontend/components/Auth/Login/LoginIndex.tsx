"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Field } from "@/components/common/EntityDialog"
import { authClient } from "@/lib/auth-client"

const LoginIndex = () => {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const f = new FormData(e.currentTarget)
    try {
      await authClient.signIn.email({
        email: String(f.get("email")),
        password: String(f.get("password")),
      })
      toast.success("Welcome back!")
      router.push("/dashboard")
    } catch (err: any) {
      toast.error(err?.message || "Invalid email or password")
    } finally {
      setLoading(false)
    }
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const f = new FormData(e.currentTarget)
    try {
      await authClient.signUp.email({
        email: String(f.get("email")),
        password: String(f.get("password")),
        name: String(f.get("name")),
      })
      toast.success("Account created! Welcome.")
      router.push("/dashboard")
    } catch (err: any) {
      toast.error(err?.message || "Failed to create account")
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="grid-glow flex min-h-[calc(100vh-4rem)] items-center py-16">
      <div className="mx-auto w-full max-w-md px-5">
        <div className="panel p-7">
          <h1 className="font-display text-2xl font-bold">Welcome to CampusOS</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            One account for your schedule, rooms, events and assignments.
          </p>

          <Tabs defaultValue="login" className="mt-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Log in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form className="grid gap-4 pt-5" onSubmit={handleLogin}>
                <Field label="Email">
                  <Input name="email" type="email" required placeholder="you@campus.edu" />
                </Field>
                <Field label="Password">
                  <Input name="password" type="password" required placeholder="••••••••" />
                </Field>
                <Button type="submit" variant="mint" size="lg" disabled={loading}>
                  {loading ? "Logging in…" : "Log in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form className="grid gap-4 pt-5" onSubmit={handleSignUp}>
                <Field label="Full name">
                  <Input name="name" required placeholder="Ayesha Karim" />
                </Field>
                <Field label="Email">
                  <Input name="email" type="email" required placeholder="you@campus.edu" />
                </Field>
                <Field label="Password" hint="At least 8 characters.">
                  <Input name="password" type="password" required minLength={8} />
                </Field>
                <Button type="submit" variant="mint" size="lg" disabled={loading}>
                  {loading ? "Creating account…" : "Create account"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-5 text-xs text-muted-foreground">
            Admin?{" "}
            <Link href="/auth/admin" className="text-mint hover:underline">
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}

export default LoginIndex