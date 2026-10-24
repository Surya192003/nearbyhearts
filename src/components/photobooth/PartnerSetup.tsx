import { useEffect, useRef, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { photoboothService } from '@/services/photoboothService'

type Props = {
  onReady: (photoUrl: string) => void
}

export function PartnerSetup({ onReady }: Props) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    photoboothService
      .getPartnerPhoto()
      .then((blob) => {
        if (cancelled || !blob) return
        const url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        onReady(url)
      })
      .catch(() => setError('Could not load saved partner photo.'))
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [onReady])

  const handleFile = async (file: File) => {
    setError(null)
    try {
      // Downscale so the stored blob stays small.
      const bitmap = await createImageBitmap(file)
      const maxDim = 1024
      const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(bitmap.width * scale)
      canvas.height = Math.round(bitmap.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas unavailable')
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.9),
      )
      if (!blob) throw new Error('Encode failed')

      await photoboothService.savePartnerPhoto(blob)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      const url = URL.createObjectURL(blob)
      setPreviewUrl(url)
      onReady(url)
    } catch {
      setError('Could not save that photo. Try another one.')
    }
  }

  const clear = async () => {
    await photoboothService.clearPartnerPhoto()
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl('')
  }

  if (loading) {
    return <p className="text-sm text-muted">Loading partner photo…</p>
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="label">Partner photo</p>
        <p className="text-sm text-muted">
          Upload a photo of your person. It stays on this device.
        </p>
      </div>

      {error && (
        <p className="text-xs text-rose-strong">{error}</p>
      )}

      {previewUrl ? (
        <div className="space-y-2">
          <img
            src={previewUrl}
            alt="Your partner"
            className="mx-auto max-h-56 rounded-field object-cover"
          />
          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              Change
            </Button>
            <Button variant="ghost" icon={<X className="h-4 w-4" />} onClick={() => void clear()}>
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="rounded-card border border-dashed border-accent/50 bg-cream p-6 text-center">
          <Button
            icon={<Upload className="h-4 w-4" />}
            onClick={() => fileRef.current?.click()}
          >
            Choose photo
          </Button>
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
          e.target.value = ''
        }}
      />
    </div>
  )
}