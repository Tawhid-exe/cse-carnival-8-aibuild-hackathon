"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { ArrowRight, Bot, Code2, Sparkles, Terminal } from "lucide-react"
import { Container } from "@/components/layout/PageLayout"
import { PageHeader } from "@/components/common/PageHeader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { api } from "@/lib/api"
import { authClient } from "@/lib/auth-client"

interface ToolCallItem {
  tool: string
  args: any
  result?: any
}

interface Message {
  role: "user" | "assistant"
  content: string
  toolCalls?: ToolCallItem[]
}

const STARTER_PROMPTS = [
  "What classes do I have on Sunday?",
  "Find an available room with a projector",
  "What assignments are due this week?",
  "What upcoming events can I register for?",
]

const INITIAL_MESSAGES: Message[] = [
  {
    role: "assistant",
    content:
      "Hello! I'm CampusOS AI Assistant. I have live access to your class schedules, room bookings, campus events, announcements, and assignments. How can I help you today?",
  },
]

function AgentChatContent() {
  const { data: session } = authClient.useSession()
  const searchParams = useSearchParams()
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const initializedFromParams = useRef(false)

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    const userMsg: Message = { role: "user", content: text }
    const next = [...messages, userMsg]
    setMessages(next)
    setInput("")
    setLoading(true)

    try {
      const payload = next.map((m) => ({ role: m.role, content: m.content }))

      const studentId = session?.user?.email?.split("@")[0] || session?.user?.id || "student"
      const context = session?.user
        ? {
            student_id: studentId,
            name: session.user.name,
            user_id: session.user.id,
          }
        : undefined

      const res = await api.chat(payload, context)

      const assistantContent = res.message?.content || res.content || "I have processed your request."
      const toolCalls: ToolCallItem[] = res.tool_calls || []

      setMessages([
        ...next,
        {
          role: "assistant",
          content: assistantContent,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        },
      ])
    } catch (err: any) {
      setMessages([
        ...next,
        {
          role: "assistant",
          content: `Sorry, I encountered an error: ${err?.message || "Failed to reach agent"}. Please make sure the backend is running.`,
        },
      ])
    } finally {
      setLoading(false)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    }
  }

  // Handle URL search param ?q=... from dashboard search bar
  useEffect(() => {
    if (initializedFromParams.current) return
    const q = searchParams.get("q")
    if (q) {
      initializedFromParams.current = true
      sendMessage(q)
    }
  }, [searchParams])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <>
      <PageHeader
        eyebrow="AI Assistant"
        title="Agentic Campus Chat"
        description="Ask questions in natural language. Powered by Gemini with live function tool-calling against your campus database."
      />

      <Container className="py-8">
        <div className="panel mx-auto flex h-[650px] max-w-3xl flex-col shadow-xl">
          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {messages.map((msg, i) => {
              const isUser = msg.role === "user"

              return (
                <div key={i} className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`flex max-w-[85%] flex-col gap-2 ${isUser ? "items-end" : "items-start"}`}>
                    {/* Tool call chips */}
                    {msg.toolCalls && msg.toolCalls.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-1">
                        {msg.toolCalls.map((tc, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 rounded-md bg-secondary/80 border border-mint/30 px-2.5 py-1 text-xs font-mono text-mint"
                          >
                            <Terminal className="size-3" />
                            <span>
                              {tc.tool}(
                              {tc.args ? Object.keys(tc.args).slice(0, 2).map((k) => `${k}="${tc.args[k]}"`).join(", ") : ""}
                              )
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div
                      className={`rounded-2xl p-4 text-sm leading-relaxed whitespace-pre-line ${
                        isUser
                          ? "bg-mint text-zinc-950 font-medium rounded-br-sm shadow-sm"
                          : "border border-border bg-secondary/40 text-foreground rounded-bl-sm"
                      }`}
                    >
                      {!isUser && (
                        <div className="flex items-center gap-1.5 text-xs text-mint font-semibold mb-1.5">
                          <Bot className="size-3.5" />
                          <span>CampusOS Assistant</span>
                        </div>
                      )}
                      {msg.content}
                    </div>
                  </div>
                </div>
              )
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm border border-mint/25 bg-secondary/40 px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
                  <Sparkles className="size-4 text-mint animate-spin" />
                  <span>Connecting to database and reasoning…</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick starter chips */}
          <div className="px-4 py-2 border-t border-border/50 bg-secondary/20 flex flex-wrap gap-1.5">
            {STARTER_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                disabled={loading}
                onClick={() => sendMessage(prompt)}
                className="text-xs px-2.5 py-1 rounded-full border border-border/80 hover:border-mint/50 bg-background/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all text-left"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Input form */}
          <div className="border-t border-border p-4 bg-background/80">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about schedule, book a room, find events, check assignments…"
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

export default function AgentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Loading chat…</div>}>
      <AgentChatContent />
    </Suspense>
  )
}
