import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Send } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { clockTime } from '@/lib/format'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'

export function ChatPage() {
  const user = useAuthStore((s) => s.user)
  const { messages, loading, sending, load, send } = useChatStore()
  const [draft, setDraft] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  const isPaired = Boolean(user?.couple && user.partner)

  useEffect(() => {
    if (!isPaired) return
    void load()
    const t = setInterval(() => void load(), 5000)
    return () => clearInterval(t)
  }, [isPaired, load])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text || !user) return
    setDraft('')
    await send(user.id, text)
  }

  if (!isPaired) {
    return (
      <div className="space-y-6">
        <h2 className="text-lg font-semibold">Chat</h2>
        <EmptyState
          emoji="💌"
          title="Pair first to chat"
          hint="Find your partner's code and send a request in /app/pair."
        />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-190px)] flex-col gap-3 nav:h-[calc(100vh-140px)]">
      <h2 className="text-lg font-semibold">Chat with {user?.partner?.firstName}</h2>

      <Card className="flex-1 space-y-3 overflow-y-auto">
        {loading && messages.length === 0 && (
          <EmptyState emoji="⏳" title="Loading messages…" />
        )}
        {!loading && messages.length === 0 && <EmptyState title="Say hi 👋" />}

        {messages.map((m) => {
          const mine = m.senderId === user?.id
          const senderName = mine
            ? user?.firstName ?? 'You'
            : user?.partner?.firstName ?? 'Them'
          return (
            <div
              key={m.id}
              className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}
            >
              <Avatar name={senderName} size="sm" />
              <div
                className={`max-w-[75%] rounded-card px-3.5 py-2 text-sm ${
                  mine ? 'bg-primary text-cream' : 'bg-cream text-ink'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>
                <p className={`mt-1 text-[10px] ${mine ? 'text-cream/60' : 'text-muted'}`}>
                  {clockTime(m.createdAt)}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </Card>

      <form onSubmit={onSubmit} className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Write something sweet…"
          className="flex-1 rounded-field border border-line bg-surface px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
        <button
          type="submit"
          disabled={!draft.trim() || sending}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-accent transition disabled:opacity-50"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  )
}