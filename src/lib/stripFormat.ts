import type { Capture } from '@/lib/photoDb'

export const STRIP_VERSION = 1
export const STRIP_PADDING = 24
export const STRIP_GAP = 16
export const STRIP_PHOTO_SIZE = 400
export const STRIP_FOOTER_HEIGHT = 48
export const STRIP_WIDTH = STRIP_PHOTO_SIZE + STRIP_PADDING * 2

export const STRIP_ALLOWED_COUNTS = [3, 4] as const
export type StripCount = (typeof STRIP_ALLOWED_COUNTS)[number]

const FOOTER_RGB: [number, number, number] = [0xc8, 0xa5, 0x63]
const PIP_RGB: [number, number, number] = [0x76, 0x2f, 0x3b]

export function stripHeight(count: number): number {
  return (
    STRIP_PADDING * 2 +
    STRIP_PHOTO_SIZE * count +
    STRIP_GAP * (count - 1) +
    STRIP_FOOTER_HEIGHT
  )
}

function colorDistance(px: Uint8ClampedArray, target: [number, number, number]): number {
  const dr = px[0] - target[0]
  const dg = px[1] - target[1]
  const db = px[2] - target[2]
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  src: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
): void {
  const sw = src.naturalWidth
  const sh = src.naturalHeight
  if (!sw || !sh) throw new Error('Source image not ready')

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
  ctx.drawImage(src, sx, sy, sW, sH, dx, dy, dw, dh)
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image load failed'))
    img.src = url
  })
}

export async function encodeStrip(captures: Capture[]): Promise<Blob> {
  if (captures.length === 0) throw new Error('No captures to encode')
  if (!STRIP_ALLOWED_COUNTS.includes(captures.length as StripCount)) {
    throw new Error('Strip must contain 3 or 4 photos')
  }
  const count = captures.length
  const width = STRIP_WIDTH
  const height = stripHeight(count)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas context unavailable')

  ctx.fillStyle = '#fbfaf7'
  ctx.fillRect(0, 0, width, height)

  const images = await Promise.all(captures.map((c) => loadImage(c.url)))
  images.forEach((img, i) => {
    const y = STRIP_PADDING + i * (STRIP_PHOTO_SIZE + STRIP_GAP)
    drawCover(ctx, img, STRIP_PADDING, y, STRIP_PHOTO_SIZE, STRIP_PHOTO_SIZE)
  })

  const footerY = height - STRIP_FOOTER_HEIGHT
  ctx.fillStyle = '#c8a563'
  ctx.fillRect(0, footerY, width, STRIP_FOOTER_HEIGHT)

  ctx.fillStyle = '#fbfaf7'
  ctx.textBaseline = 'middle'
  try {
    ctx.font = 'bold 22px "Great Vibes", Georgia, serif'
  } catch {
    ctx.font = 'bold 20px Georgia, serif'
  }
  ctx.fillText('NearbyHearts', STRIP_PADDING, footerY + STRIP_FOOTER_HEIGHT / 2)

  const pipRadius = 8
  const pipGap = 8
  const pipTotalWidth = count * pipRadius * 2 + (count - 1) * pipGap
  const pipStartX = width - STRIP_PADDING - pipTotalWidth
  const pipCenterY = footerY + STRIP_FOOTER_HEIGHT / 2
  ctx.fillStyle = '#762f3b'
  for (let i = 0; i < count; i += 1) {
    const cx = pipStartX + pipRadius + i * (pipRadius * 2 + pipGap)
    ctx.beginPath()
    ctx.arc(cx, pipCenterY, pipRadius, 0, Math.PI * 2)
    ctx.fill()
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Strip encode failed'))),
      'image/png',
    )
  })
}

export type StripDetection =
  | { kind: 'strip'; count: StripCount }
  | { kind: 'not-strip'; reason: string }

/**
 * Footer check: sample at 5 x-positions that are always gold for both
 * count=3 and count=4 (avoid the wordmark text and the pips).
 */
function hasGoldFooter(
  ctx: CanvasRenderingContext2D,
  width: number,
  footerTop: number,
  footerBottom: number,
): boolean {
  const sampleY = Math.round((footerTop + footerBottom) / 2)
  const positions = [0.02, 0.55, 0.65, 0.7, 0.98]
  let hits = 0
  for (const frac of positions) {
    const x = Math.round(width * frac)
    const px = ctx.getImageData(x, sampleY, 1, 1).data
    if (colorDistance(px, FOOTER_RGB) < 80) hits += 1
  }
  return hits >= 3
}

/**
 * Pip counting: scan right half of footer. A column is "rose" if the
 * majority of its samples are rose. Consecutive rose columns form a
 * cluster; gap > 5px starts a new cluster.
 */
function countPips(
  ctx: CanvasRenderingContext2D,
  width: number,
  footerTop: number,
  footerBottom: number,
): number {
  const scanX0 = Math.round(width * 0.5)
  const scanX1 = Math.round(width * 0.98)
  const sampleYs: number[] = []
  for (let y = footerTop + 6; y < footerBottom - 6; y += 3) {
    sampleYs.push(y)
  }
  if (sampleYs.length === 0) return 0

  let clusters = 0
  let prevRoseX = -100
  for (let x = scanX0; x < scanX1; x += 1) {
    let roseCount = 0
    for (const y of sampleYs) {
      const px = ctx.getImageData(x, y, 1, 1).data
      if (colorDistance(px, PIP_RGB) < 80) roseCount += 1
    }
    const isRose = roseCount >= sampleYs.length * 0.5
    if (isRose) {
      if (x - prevRoseX > 5) clusters += 1
      prevRoseX = x
    }
  }
  return clusters
}

function inferCountFromAspect(image: HTMLImageElement): StripCount | null {
  const aspect = image.naturalHeight / image.naturalWidth
  const aspect3 = stripHeight(3) / STRIP_WIDTH
  const aspect4 = stripHeight(4) / STRIP_WIDTH
  const d3 = Math.abs(aspect - aspect3)
  const d4 = Math.abs(aspect - aspect4)
  if (d3 < 0.15 && d3 < d4) return 3
  if (d4 < 0.15) return 4
  return null
}

export function detectStrip(image: HTMLImageElement): StripDetection {
  if (!image.naturalWidth || !image.naturalHeight) {
    return { kind: 'not-strip', reason: 'Image not loaded' }
  }
  if (image.naturalWidth < 100 || image.naturalHeight < 200) {
    return { kind: 'not-strip', reason: 'Image too small to be a strip' }
  }

  const maxW = 800
  const scale = Math.min(1, maxW / image.naturalWidth)
  const w = Math.round(image.naturalWidth * scale)
  const h = Math.round(image.naturalHeight * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return { kind: 'not-strip', reason: 'Canvas unavailable' }
  ctx.drawImage(image, 0, 0, w, h)

  const aspectHint = inferCountFromAspect(image)
  const referenceCount = aspectHint ?? 3
  const expectedHeight = stripHeight(referenceCount)
  const footerRatio = STRIP_FOOTER_HEIGHT / expectedHeight
  const footerTop = Math.round(h * (1 - footerRatio))
  const footerBottom = h

  if (h - footerTop < 20) {
    return { kind: 'not-strip', reason: 'Image too short' }
  }

  const footerOk = hasGoldFooter(ctx, w, footerTop, footerBottom)
  if (!footerOk) {
    return {
      kind: 'not-strip',
      reason: 'No gold footer band detected — looks like a regular photo',
    }
  }

  const pipCount = countPips(ctx, w, footerTop, footerBottom)

  if (pipCount === 3 || pipCount === 4) {
    return { kind: 'strip', count: pipCount as StripCount }
  }
  if (aspectHint) {
    return { kind: 'strip', count: aspectHint }
  }
  return {
    kind: 'not-strip',
    reason: `Footer found but couldn't read count (${pipCount} marker${pipCount === 1 ? '' : 's'}, expected 3 or 4)`,
  }
}

export async function decodeStrip(
  image: HTMLImageElement,
  count: StripCount,
): Promise<Capture[]> {
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.drawImage(image, 0, 0)

  // Derive scale from actual image width vs the format's reference width.
  const scale = canvas.width / STRIP_WIDTH
  const photoSize = Math.max(1, Math.round(STRIP_PHOTO_SIZE * scale))
  const padding = Math.round(STRIP_PADDING * scale)
  const gap = Math.round(STRIP_GAP * scale)

  const results: Capture[] = []
  for (let i = 0; i < count; i += 1) {
    const y = padding + i * (photoSize + gap)
    if (y + photoSize > canvas.height) {
      throw new Error(
        `Image height doesn't fit a ${count}-photo strip (photo ${i + 1} out of bounds)`,
      )
    }
    const photoCanvas = document.createElement('canvas')
    photoCanvas.width = photoSize
    photoCanvas.height = photoSize
    const pctx = photoCanvas.getContext('2d')
    if (!pctx) throw new Error('Photo canvas unavailable')
    pctx.drawImage(
      canvas,
      padding,
      y,
      photoSize,
      photoSize,
      0,
      0,
      photoSize,
      photoSize,
    )
    const blob = await new Promise<Blob | null>((resolve) =>
      photoCanvas.toBlob((b) => resolve(b), 'image/jpeg', 0.92),
    )
    if (!blob) throw new Error(`Could not extract photo ${i + 1}`)
    results.push({
      blob,
      url: URL.createObjectURL(blob),
      width: photoSize,
      height: photoSize,
    })
  }
  return results
}

export function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const img = new Image()
    img.onload = () => {
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read image'))
    }
    img.src = url
  })
}