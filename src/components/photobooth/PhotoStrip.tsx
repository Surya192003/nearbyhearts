import { useState } from 'react'
import { Download, RotateCcw, Save } from 'lucide-react'
import type { Capture } from '@/lib/photoDb'
import { Button } from '@/components/ui/Button'
import { encodeStrip } from '@/lib/stripFormat'

type Props = {
  captures: Capture[]
  saving: boolean
  onSave: () => Promise<void>
  onRetake: () => void
}

export function PhotoStrip({ captures, saving, onSave, onRetake }: Props) {
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const handleDownload = async () => {
    setDownloading(true)
    setDownloadError(null)
    try {
      const blob = await encodeStrip(captures)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nearbyhearts-strip-${captures.length}-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-card border border-accent/40 bg-cream p-3">
        <div className="flex flex-col gap-2">
          {captures.map((c, i) => (
            <img
              key={c.url}
              src={c.url}
              alt={`Shot ${i + 1}`}
              className="w-full rounded-field object-cover"
            />
          ))}
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="font-script text-lg text-rose">NearbyHearts</p>
          <div className="flex gap-1" aria-label={`${captures.length} photo strip`}>
            {captures.map((_, i) => (
              <span key={i} className="h-2 w-2 rounded-full bg-rose" />
            ))}
          </div>
        </div>
      </div>

      {downloadError && (
        <p className="text-center text-xs text-rose-strong">{downloadError}</p>
      )}

      <div className="flex flex-wrap justify-center gap-2">
        <Button
          icon={<Download className="h-4 w-4" />}
          variant="outline"
          loading={downloading}
          onClick={() => void handleDownload()}
        >
          Download strip
        </Button>
        <Button
          icon={<Save className="h-4 w-4" />}
          loading={saving}
          onClick={() => void onSave()}
        >
          Save to gallery
        </Button>
        <Button
          icon={<RotateCcw className="h-4 w-4" />}
          variant="ghost"
          onClick={onRetake}
          disabled={saving}
        >
          Retake
        </Button>
      </div>

      <p className="text-center text-xs text-muted">
        Photos stay on this device. If you download the strip and upload it back
        later, it will divide into {captures.length} individual photos.
      </p>
    </div>
  )
}