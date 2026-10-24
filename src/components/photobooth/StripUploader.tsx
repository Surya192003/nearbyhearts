import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { Capture } from '@/lib/photoDb'
import {
  decodeStrip,
  detectStrip,
  loadImageFromBlob,
  type StripCount,
} from '@/lib/stripFormat'
import { photoboothService } from '@/services/photoboothService'

type Props = {
  onImported: (sessionId: string) => void
}

function uid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

type Preview = { captures: Capture[]; count: StripCount }

const DEV = import.meta.env.DEV

export function StripUploader({ onImported }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [warning, setWarning] = useState<string | null>(null)
  const [pendingImage, setPendingImage] = useState<HTMLImageElement | null>(null)
  const [preview, setPreview] = useState<Preview | null>(null)

  const discardPreview = () => {
    if (preview) {
      preview.captures.forEach((c) => URL.revokeObjectURL(c.url))
    }
    setPreview(null)
  }

  const reset = () => {
    discardPreview()
    setWarning(null)
    setPendingImage(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  const persist = async (captures: Capture[]): Promise<void> => {
    const sessionId = uid()
    const now = new Date().toISOString()
    await photoboothService.save(
      captures.map((c) => ({
        id: uid(),
        sessionId,
        ownerId: 'imported',
        createdAt: now,
        blob: c.blob,
        width: c.width,
        height: c.height,
      })),
    )
    if (DEV) console.log('[StripUploader] saved', { sessionId, count: captures.length })
    onImported(sessionId)
  }

  const showPreview = (captures: Capture[], count: StripCount) => {
    discardPreview()
    setPreview({ captures, count })
    setWarning(null)
    setPendingImage(null)
  }

  const handleFile = async (file: File) => {
    setBusy(true)
    reset()
    try {
      const img = await loadImageFromBlob(file)
      const detection = detectStrip(img)
      if (DEV) console.log('[StripUploader] detection', detection)

      if (detection.kind === 'strip') {
        const captures = await decodeStrip(img, detection.count)
        if (captures.length !== detection.count) {
          throw new Error(`Only extracted ${captures.length} of ${detection.count}`)
        }
        showPreview(captures, detection.count)
        return
      }

      setPendingImage(img)
      setWarning(
        `This image doesn't look like a NearbyHearts strip (${detection.reason}). ` +
          `You can still try dividing it, or add it as a single photo.`,
      )
    } catch (err) {
      if (DEV) console.error('[StripUploader] error', err)
      setWarning(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  const tryDivide = async (count: StripCount) => {
    if (!pendingImage) return
    setBusy(true)
    try {
      const captures = await decodeStrip(pendingImage, count)
      if (!captures.length) throw new Error('Nothing extracted')
      showPreview(captures, count)
    } catch (err) {
      if (DEV) console.error('[StripUploader] forceDivide error', err)
      setWarning(err instanceof Error ? err.message : 'Divide failed')
    } finally {
      setBusy(false)
    }
  }

  const addAsSingle = async () => {
    if (!pendingImage) return
    setBusy(true)
    try {
      const maxDim = 1024
      const scale = Math.min(
        1,
        maxDim / Math.max(pendingImage.naturalWidth, pendingImage.naturalHeight),
      )
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(pendingImage.naturalWidth * scale)
      canvas.height = Math.round(pendingImage.naturalHeight * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas unavailable')
      ctx.drawImage(pendingImage, 0, 0, canvas.width, canvas.height)
      const blob = await new Promise<Blob | null>((r) =>
        canvas.toBlob((b) => r(b), 'image/jpeg', 0.92),
      )
      if (!blob) throw new Error('Encode failed')
      await persist([
        {
          blob,
          url: URL.createObjectURL(blob),
          width: canvas.width,
          height: canvas.height,
        },
      ])
      reset()
    } catch (err) {
      setWarning(err instanceof Error ? err.message : 'Could not add photo')
    } finally {
      setBusy(false)
    }
  }

  const confirmPreview = async () => {
    if (!preview) return
    setBusy(true)
    try {
      await persist(preview.captures)
      reset()
    } catch (err) {
      setWarning(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          variant="outline"
          icon={<Upload className="h-4 w-4" />}
          onClick={() => fileRef.current?.click()}
          loading={busy}
        >
          Upload a strip
        </Button>
        <span className="text-[11px] text-muted">
          Strips made by this app divide automatically
        </span>
      </div>

      {warning && (
        <div className="space-y-2 rounded-field border border-rose/40 bg-rose-soft p-3 text-xs text-rose-strong">
          <p>{warning}</p>
          {pendingImage && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => void addAsSingle()} loading={busy}>
                Add as single photo
              </Button>
              <Button variant="ghost" onClick={() => void tryDivide(3)} loading={busy}>
                Divide into 3
              </Button>
              <Button variant="ghost" onClick={() => void tryDivide(4)} loading={busy}>
                Divide into 4
              </Button>
              <Button variant="ghost" onClick={reset}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      )}

      {preview && (
        <div className="space-y-2 rounded-field border border-accent/40 bg-cream p-3">
          <p className="text-xs font-bold text-ink">
            Preview: {preview.count} photos extracted
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {preview.captures.map((c, i) => (
              <img
                key={c.url}
                src={c.url}
                alt={`Photo ${i + 1}`}
                className="h-20 w-20 shrink-0 rounded-field object-cover ring-1 ring-line"
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => void confirmPreview()} loading={busy}>
              Save to gallery
            </Button>
            <Button variant="ghost" onClick={reset} disabled={busy}>
              Discard
            </Button>
          </div>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void handleFile(f)
        }}
      />
    </div>
  )
}