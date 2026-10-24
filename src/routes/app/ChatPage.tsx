import { useEffect, useRef, useState, type FormEvent } from 'react'
import { EyeOff, Send, Trash2 } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { clockTime } from '@/lib/format'
import { useAuthStore } from '@/store/authStore'
import { useChatStore } from '@/store/chatStore'
import type { Message } from '@/types'

function hoursUntil(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60)))
}

export function ChatPage() {
  const user = useAuthStore((s) => s.user)
  const {
    messages,
    loading,
    sending,
    clearing,
    incognito,
    error,
    load,
    send,
    deleteOne,
    clearAll,
    setIncognito,
  } = useChatStore()

  const [draft, setDraft] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  useEffect(() => {
    if (!confirmClear) return
    const t = setTimeout(() => setConfirmClear(false), 4000)
    return () => clearTimeout(t)
  }, [confirmClear])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text || !user) return
    setDraft('')
    try {
      await send(user.id, text)
    } catch {
      // error already set in store
    }
  }

  const onDelete = (m: Message) => {
    if (!window.confirm('Delete this message for both of you?')) return
    void deleteOne(m.id)
  }

  const onClear = () => {
    if (!confirmClear) {
      setConfirmClear(true)
      return
    }
    setConfirmClear(false)
    void clearAll()
  }

  return (
    <div className="flex h-[calc(100vh-190px)] flex-col gap-3 nav:h-[calc(100vh-140px)]">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Chat</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            disabled={clearing || messages.length === 0}
            className={`inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 font-sans text-[0.65rem] font-bold uppercase tracking-[0.14em] transition disabled:opacity-40 ${
              confirmClear
                ? 'border-rose bg-rose text-white'
                : 'border-line text-muted hover:border-rose/40 hover:text-rose'
            }`}
          >
            <Trash2 className="h-3 w-3" />
            {confirmClear ? 'Tap again to confirm' : 'Clear chat'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-field border border-rose/40 bg-rose-soft px-3 py-2 text-xs text-rose-strong">
          {error}
        </div>
      )}

      <Card className="flex-1 space-y-3 overflow-y-auto">
        {loading && messages.length === 0 && (
          <EmptyState emoji="⏳" title="Loading messages…" />
        )}
        {!loading && messages.length === 0 && (
          <EmptyState title="Say hi 👋" hint="Messages auto-delete after 60 days." />
        )}

        {messages.map((m) => {
          const mine = m.senderId === user?.id
          const senderName = mine
            ? user?.firstName ?? 'You'
            : user?.partner?.firstName ?? 'Them'
          const expiring = m.isIncognito ? hoursUntil(m.expiresAt) : null
          return (
            <div
              key={m.id}
              className={`group flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}
            >
              <Avatar name={senderName} size="sm" />
              <div
                className={`max-w-[75%] rounded-card px-3.5 py-2 text-sm ${
                  mine
                    ? m.isIncognito
                      ? 'bg-rose-strong text-white'
                      : 'bg-primary text-cream'
                    : 'bg-cream text-ink'
                }`}
              >
                {m.isIncognito && (
                  <div
                    className={`mb-1 flex items-center gap-1 font-sans text-[9px] font-bold uppercase tracking-[0.14em] ${
                      mine ? 'text-white/70' : 'text-rose-strong'
                    }`}
                  >
                    <EyeOff className="h-3 w-3" />
                    Incognito · {expiring}h left
                  </div>
                )}
                <p className="leading-relaxed">{m.text}</p>
                <p
                  className={`mt-1 text-[10px] ${
                    mine
                      ? m.isIncognito
                        ? 'text-white/60'
                        : 'text-cream/60'
                      : 'text-muted'
                  }`}
                >
                  {clockTime(m.createdAt)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onDelete(m)}
                className="rounded-full p-1 text-muted opacity-0 transition group-hover:opacity-100 focus:opacity-100 hover:bg-rose-soft hover:text-rose-strong"
                aria-label="Delete message"
                title="Delete for both"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )
        })}
        <div ref={endRef} />
      </Card>

      <form onSubmit={onSubmit} className="space-y-2">
        <div className="flex items-center justify-between rounded-field border border-line bg-cream/60 px-3 py-1.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              role="switch"
              aria-checked={incognito}
              onClick={() => setIncognito(!incognito)}
              className={`inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 font-sans text-[0.62rem] font-bold uppercase tracking-[0.14em] transition ${
                incognito
                  ? 'border-rose bg-rose text-white'
                  : 'border-line bg-surface text-muted hover:text-ink'
              }`}
            >
              <EyeOff className="h-3 w-3" />
              Incognito {incognito ? 'on' : 'off'}
            </button>
            <span className="text-[10px] text-muted">
              {incognito
                ? 'New messages vanish after 24 hours'
                : 'Messages kept 60 days'}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={incognito ? 'Incognito message…' : 'Write something sweet…'}
            className={`flex-1 rounded-field border bg-surface px-3 py-2.5 text-sm outline-none focus:ring-2 ${
              incognito
                ? 'border-rose/40 focus:border-rose focus:ring-rose/20'
                : 'border-line focus:border-accent focus:ring-accent/20'
            }`}
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-full text-cream transition disabled:opacity-50 ${
              incognito ? 'bg-rose-strong' : 'bg-primary text-accent'
            }`}
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  )
}