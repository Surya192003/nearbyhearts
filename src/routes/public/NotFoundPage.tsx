import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export function NotFoundPage() {
  return (
    <Card className="space-y-4 text-center">
      <div className="text-4xl">💔</div>
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm text-muted">Even our hearts couldn't find this one.</p>
      <Link to="/">
        <Button className="w-full">Back home</Button>
      </Link>
    </Card>
  )
}