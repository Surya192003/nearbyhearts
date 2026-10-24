import { Link } from 'react-router-dom'
import { Photobooth } from '@/components/photobooth/Photobooth'

export function PhotoboothPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Link to="/" className="label text-accent hover:underline">
          ← Back home
        </Link>
      </div>
      <Photobooth variant="public" />
    </div>
  )
}