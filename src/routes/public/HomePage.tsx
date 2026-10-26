import { Link } from 'react-router-dom'
import { ArrowRight, Camera, Heart, MapPin, Video } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export function HomePage() {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <p className="font-script text-3xl text-rose">NearbyHearts</p>
        <h1 className="mt-3 text-3xl font-semibold leading-tight">
          Long distance, <span className="text-rose">close hearts.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-muted">
          A shared space for the two of you — countdowns, notes, calls, and small gifts.
        </p>
      </div>

      <Card variant="forest" className="space-y-3 text-center">
        <p className="label text-accent">Your next visit</p>
        <p className="font-script text-4xl text-accent">Counts down to the second</p>
        <p className="text-xs italic text-cream/70">
          Sign in to see your live countdown
        </p>
      </Card>

      <div className="grid gap-3">
        <Link to="/login">
          <Button className="w-full" icon={<ArrowRight className="h-4 w-4" />}>
            Sign in
          </Button>
        </Link>
        <Link to="/signup">
          <Button variant="outline" className="w-full">
            Create an account
          </Button>
        </Link>
        <Link to="/photobooth">
          <Button variant="outline" className="w-full" icon={<Camera className="h-4 w-4" />}>
            Try the photobooth
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { icon: Heart, label: 'Shared feed' },
          { icon: Video, label: 'Video calls' },
          { icon: MapPin, label: 'Visit countdown' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="rounded-card border border-line bg-surface px-3 py-4">
            <Icon className="mx-auto h-5 w-5 text-accent" aria-hidden="true" />
            <p className="mt-2 text-[11px] font-semibold text-muted">{label}</p>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted">
        <Link to="/privacy" className="font-semibold text-accent hover:underline">
          Privacy &amp; Terms
        </Link>
      </p>
    </div>
  )
}