import { useEffect, useRef, useState } from 'react'
import type { Capture } from '@/lib/photoDb'
import { Button } from '@/components/ui/Button'

type Props = {
  targetCount: number
  onComplete: (captures: Capture[]) => void
  onCancel: () => void
}

export function CameraStage({ targetCount, onComplete, onCancel }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [flash, setFlash] = useState(false)
  const [shots, setShots] = useState<Capture[]>([])
  const [running, setRunning] = useState(false)

  useEffect(() => {
    let cancelled = false
    let local: MediaStream | null = null

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: 'user' }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop())
          return
        }
        local = s
        if (videoRef.current) {
          videoRef.current.srcObject = s
          void videoRef.current.play().catch(() => {})
        }
        setStream(s)
      })
      .catch(() => {
        if (!cancelled) setError('Camera unavailable or permission denied.')
      })

    return () => {
      cancelled = true
      local?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const captureOne = (): Promise<Capture> => {
    return new Promise((resolve, reject) => {
      const video = videoRef.current
      if (!video || !video.videoWidth) {
        reject(new Error('Camera not ready'))
        return
      }
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas context unavailable'))
        return
      }
      // Mirror horizontally so the shot matches the preview
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(video, 0, 0)
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Capture failed'))
            return
          }
          resolve({
            blob,
            url: URL.createObjectURL(blob),
            width: canvas.width,
            height: canvas.height,
          })
        },
        'image/jpeg',
        0.92,
      )
    })
  }

  const runSession = async () => {
    if (running) return
    setRunning(true)
    const results: Capture[] = []
    try {
      for (let i = 0; i < targetCount; i += 1) {
        for (let c = 3; c >= 1; c -= 1) {
          setCountdown(c)
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 800))
        }
        setCountdown(null)
        setFlash(true)
        // eslint-disable-next-line no-await-in-loop
        const cap = await captureOne()
        results.push(cap)
        setShots((prev) => [...prev, cap])
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 260))
        setFlash(false)
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 520))
      }
      onComplete(results)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Capture failed')
      results.forEach((r) => URL.revokeObjectURL(r.url))
    } finally {
      setRunning(false)
      setCountdown(null)
      setFlash(false)
      stream?.getTracks().forEach((t) => t.stop())
    }
  }

  const handleFile = async (file: File) => {
    try {
      const bitmap = await createImageBitmap(file)
      const maxDim = 1024
      const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(bitmap.width * scale)
      canvas.height = Math.round(bitmap.height * scale)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context unavailable')
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      canvas.toBlob(
        (blob) => {
          if (!blob) return
          onComplete([
            {
              blob,
              url: URL.createObjectURL(blob),
              width: canvas.width,
              height: canvas.height,
            },
          ])
        },
        'image/jpeg',
        0.92,
      )
    } catch {
      setError('Could not read that image.')
    }
  }

  if (error) {
    return (
      <div className="space-y-3 rounded-card border border-line bg-cream p-4 text-center">
        <p className="text-sm text-ink">{error}</p>
        <p className="text-xs text-muted">
          You can pick a photo from your device instead — it stays local.
        </p>
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
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={() => fileRef.current?.click()}>
            Choose a photo
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-card border border-line bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          className="block h-auto w-full scale-x-[-1]"
        />
        {countdown !== null && (
          <div className="absolute inset-0 grid place-items-center bg-black/40">
            <span className="font-sans text-8xl font-bold text-white">{countdown}</span>
          </div>
        )}
        {flash && <div className="animate-flash absolute inset-0 bg-white" />}
      </div>

      {shots.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {shots.map((s) => (
            <img
              key={s.url}
              src={s.url}
              alt=""
              className="h-16 w-16 shrink-0 rounded-field object-cover ring-1 ring-line"
            />
          ))}
        </div>
      )}

      <div className="flex justify-center gap-2">
        {!running ? (
          <Button onClick={() => void runSession()}>
            Start ({targetCount} shot{targetCount === 1 ? '' : 's'})
          </Button>
        ) : (
          <span className="grid h-11 place-items-center font-sans text-xs uppercase tracking-[0.16em] text-muted">
            Capturing…
          </span>
        )}
        <Button variant="ghost" onClick={onCancel} disabled={running}>
          Cancel
        </Button>
      </div>
    </div>
  )
}