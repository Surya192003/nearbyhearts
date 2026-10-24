import { Photobooth } from '@/components/photobooth/Photobooth'

export function PhotoboothPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Photobooth</h2>
      <Photobooth variant="app" />
    </div>
  )
}