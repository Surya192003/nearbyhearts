import type { Capture } from '@/lib/photoDb'

export type CompositeSource = HTMLVideoElement | HTMLImageElement | HTMLCanvasElement

function sourceDims(src: CompositeSource): { w: number; h: number } {
  if (src instanceof HTMLVideoElement) return { w: src.videoWidth, h: src.videoHeight }
  if (src instanceof HTMLImageElement) return { w: src.naturalWidth, h: src.naturalHeight }
  return { w: src.width, h: src.height }
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  src: CompositeSource,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  mirror: boolean,
): void {
  const { w: sw, h: sh } = sourceDims(src)
  if (!sw || !sh) throw new Error('Source not ready')

  const srcAspect = sw / sh
  const dstAspect = dw / dh
  let sx = 0
  let sy = 0
  let sW = sw
  let sH = sh

  if (srcAspect > dstAspect) {
    sW = sh * dstAspect
    sx = (sw - sW) / 2
  } else {
    sH = sw / dstAspect
    sy = (sh - sH) / 2
  }

  ctx.save()
  if (mirror) {
    ctx.translate(dx + dw, dy)
    ctx.scale(-1, 1)
    ctx.drawImage(src, sx, sy, sW, sH, 0, 0, dw, dh)
  } else {
    ctx.drawImage(src, sx, sy, sW, sH, dx, dy, dw, dh)
  }
  ctx.restore()
}

/**
 * Produce a square composite: left = "you" (mirrored), right = "partner".
 * Gold divider down the middle. Returned as a JPEG blob + object URL.
 */
export function makeComposite(
  left: CompositeSource,
  right: CompositeSource,
  outSize = 720,
): Promise<Capture> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    canvas.width = outSize
    canvas.height = outSize
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Canvas context unavailable'))
      return
    }

    ctx.fillStyle = '#fbfaf7'
    ctx.fillRect(0, 0, outSize, outSize)

    const halfW = outSize / 2
    try {
      drawCover(ctx, left, 0, 0, halfW, outSize, true)
      drawCover(ctx, right, halfW, 0, halfW, outSize, false)
    } catch (err) {
      reject(err instanceof Error ? err : new Error('Composite failed'))
      return
    }

    ctx.strokeStyle = '#c8a563'
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(halfW, 0)
    ctx.lineTo(halfW, outSize)
    ctx.stroke()

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Composite encode failed'))
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