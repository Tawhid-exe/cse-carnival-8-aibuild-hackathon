"use client"

import { useRef, useState } from "react"
import { ArrowRight, Bot, Code, User as UserIcon } from "lucide-react"
import { Container } from "@/components/layout/PageLayout"
import { PageHeader } from "@/components/common/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"

type MessageRole = "user" | "assistant"
interface Message {
  role: MessageRole
  content: string
  type?: "text" | "tool_call"
}

const INITIAL_MESSAGES: Message[] = [
  {
    role: "assistant",
    content: "Hello! I can help you manage your campus schedule, book rooms, check announcements and more. What do you need?",
    type: "text",
  },
]

export default function AgentPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const userMsg: Message = { role: "user", content: input, type: "text" }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput("")
    setLoading(true)

    try {
      const payload = next.map((m) => ({ role: m.role, content: m.content }))
      const res = await api.chat(payload)

      const newMsgs: Message[] = []
      if (res.tool_calls?.length) {
        for (const tc of res.tool_calls) {
          newMsgs.push({
            role: "assistant",
            content: `${tc.name}(${JSON.stringify(tc.arguments ?? {})})`,
            type: "tool_call",
          })
        }
      }
      if (res.content) {
        newMsgs.push({ role: "assistant", content: res.content, type: "text" })
      }
      setMessages([...next, ...newMsgs])
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: "Sorry, I ran into an error. Please try again.", type: "text" },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Agent"
        title="Campus Assistant"
        description="Chat with the agent. It can read your schedule, find free rooms, and register you for events."
      />
      <Container className="py-10">
        <div className="panel mx-auto flex h-[600px] max-w-3xl flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {messages.map((msg, i) => (
              <div key={i} className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="flex max-w-[80%] flex-col gap-1">
                  {msg.type === "tool_call" ? (
                    <div className="flex items-center gap-2 rounded-lg bg-accent/40 border border-mint/25 px-3 py-2 text-xs font-mono text-muted-foreground self-start">
                      <Code className="size-3 text-mint" />
                      {msg.content}
                    </div>
                  ) : (
                    <div className={`rounded-2xl p-4 text-sm ${msg.role === "user" ? "bg-secondary/70 rounded-br-sm" : "border border-mint/25 bg-accent/40 rounded-bl-sm"}`}>
                      {msg.content}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-mint/25 bg-accent/40 px-4 py-3 text-sm text-muted-foreground">
                  <span className="animate-pulse">Thinking…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-border p-4">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something about your schedule, rooms or events…"
                className="flex-1 bg-background"
                disabled={loading}
              />
              <Button type="submit" variant="mint" size="icon" disabled={loading || !input.trim()}>
                <ArrowRight className="size-4" />
              </Button>
            </form>
          </div>
        </div>
      </Container>
    </>
  )
}
