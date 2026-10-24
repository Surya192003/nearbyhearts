import { useEffect, useState } from 'react'
import { Download, Trash2 } from 'lucide-react'
import type { Capture, StoredPhoto } from '@/lib/photoDb'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { timeAgo } from '@/lib/format'
import {
  encodeStrip,
  STRIP_ALLOWED_COUNTS,
  type StripCount,
} from '@/lib/stripFormat'

type Props = {
  sessions: StoredPhoto[][]
  onDelete: (sessionId: string) => Promise<void> | void
}

function sessionToCaptures(session: StoredPhoto[]): Capture[] {
  return session.map((p) => ({
    blob: p.blob,
    url: URL.createObjectURL(p.blob),
    width: p.width,
    height: p.height,
  }))
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function PhotoGallery({ sessions, onDelete }: Props) {
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [downloading, setDownloading] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  useEffect(() => {
    const next: Record<string, string> = {}
    for (const session of sessions) {
      for (const p of session) {
        next[p.id] = URL.createObjectURL(p.blob)
      }
    }
    setUrls(next)
    return () => {
      for (const url of Object.values(next)) URL.revokeObjectURL(url)
    }
  }, [sessions])

  const downloadSession = async (session: StoredPhoto[]) => {
    const first = session[0]
    if (!first) return
    setDownloadError(null)
    setDownloading(first.sessionId)

    const count = session.length
    const isStrip = STRIP_ALLOWED_COUNTS.includes(count as StripCount)

    try {
      if (isStrip) {
        const captures = sessionToCaptures(session)
        try {
          const blob = await encodeStrip(captures)
          triggerDownload(
            blob,
            `nearbyhearts-strip-${count}-${Date.now()}.png`,
          )
        } finally {
          captures.forEach((c) => URL.revokeObjectURL(c.url))
        }
      } else if (count === 1) {
        triggerDownload(first.blob, `nearbyhearts-photo-${Date.now()}.jpg`)
      } else {
        // Non-strip multi-photo session — download each photo individually
        for (let i = 0; i < session.length; i += 1) {
          const p = session[i]
          triggerDownload(p.blob, `nearbyhearts-photo-${Date.now()}-${i + 1}.jpg`)
        }
      }
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : 'Could not generate download',
      )
    } finally {
      setDownloading(null)
    }
  }

  const sessionLabel = (n: number): string =>
    n === 1 ? '1 photo' : `${n}-photo strip`

  if (sessions.length === 0) {
    return (
      <EmptyState
        title="No saved photos yet"
        hint="Take your first strip above — it will appear here."
      />
    )
  }

  return (
    <div className="space-y-2">
      {downloadError && (
        <div className="rounded-field border border-rose/40 bg-rose-soft px-3 py-2 text-xs text-rose-strong">
          {downloadError}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {sessions.map((session) => {
          const first = session[0]
          if (!first) return null
          const count = session.length
          const isDownloading = downloading === first.sessionId
          const isStrip = STRIP_ALLOWED_COUNTS.includes(count as StripCount)

          return (
            <Card key={first.sessionId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <span className="label block">{timeAgo(first.createdAt)}</span>
                  <span className="text-[10px] text-muted">
                    {sessionLabel(count)}
                  </span>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => void downloadSession(session)}
                    disabled={isDownloading}
                    className="rounded-full p-1.5 text-muted transition hover:bg-accent-soft hover:text-accent-strong disabled:opacity-40"
                    aria-label={
                      isStrip
                        ? `Download ${count}-photo strip`
                        : count === 1
                          ? 'Download photo'
                          : `Download ${count} photos`
                    }
                    title={isStrip ? 'Download strip' : 'Download'}
                  >
                    {isDownloading ? (
                      <span className="block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDelete(first.sessionId)}
                    className="rounded-full p-1.5 text-muted transition hover:bg-rose-soft hover:text-rose-strong"
                    aria-label="Delete this session"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                {session.map((p) => (
                  <img
                    key={p.id}
                    src={urls[p.id] ?? ''}
                    alt=""
                    className="w-full rounded-field object-cover"
                    draggable={false}
                  />
                ))}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}