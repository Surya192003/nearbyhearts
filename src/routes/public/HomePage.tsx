import { Link } from 'react-router-dom'
import { ArrowRight, Camera, Heart, MapPin, UserPlus, Video } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatCountdown, formatDistance } from '@/lib/format'
import { DISTANCE_KM, NEXT_VISIT_ISO } from '@/data/partner'

export function HomePage() {
  const c = formatCountdown(NEXT_VISIT_ISO)

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

      <Card variant="forest" className="space-y-4 text-center">
        <p className="label text-accent">Next visit</p>
        <p className="font-script text-4xl text-accent">{c.days} days</p>
        <div className="flex justify-center gap-5 font-sans text-xs font-bold uppercase tracking-[0.16em] text-cream/80 tabular-nums">
          <span>{String(c.hours).padStart(2, '0')}h</span>
          <span>{String(c.minutes).padStart(2, '0')}m</span>
          <span>{String(c.seconds).padStart(2, '0')}s</span>
        </div>
        <p className="text-xs italic text-cream/70">
          You are {formatDistance(DISTANCE_KM)} apart 💕
        </p>
      </Card>

      <div className="grid gap-3">
        <Link to="/login">
          <Button className="w-full" icon={<ArrowRight className="h-4 w-4" />}>
            Open the app
          </Button>
        </Link>
        <Link to="/photobooth">
          <Button variant="outline" className="w-full" icon={<Camera className="h-4 w-4" />}>
            Try the photobooth
          </Button>
        </Link>
        <Link to="/donate">
          <Button variant="outline" className="w-full" icon={<Heart className="h-4 w-4" />}>
            Surprise them with a gift
          </Button>
        </Link>
        <Link to="/signup">
          <Button variant="outline" className="w-full" icon={<UserPlus className="h-4 w-4" />}>
            Create an account
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
          Privacy & Terms
        </Link>
      </p>
    </div>
  )
}