import { Link, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import type { DonationReceipt } from '@/types'

export function ThankYouPage() {
  const { state } = useLocation() as { state?: { receipt?: DonationReceipt } }
  const receipt = state?.receipt

  return (
    <Card className="space-y-4 text-center">
      <div className="text-4xl">💞</div>
      <h1 className="text-2xl font-semibold">
        Thank you{receipt ? `, ${receipt.donorName}` : ''}!
      </h1>
      {receipt ? (
        <p className="text-sm text-muted">
          We sent {(receipt.amountCents / 100).toFixed(2)} EUR of warmth. Receipt #{receipt.id}.
        </p>
      ) : (
        <p className="text-sm text-muted">Your gift is on its way.</p>
      )}
      {receipt?.message && (
        <blockquote className="rounded-card bg-cream px-4 py-3 text-sm italic text-ink">
          "{receipt.message}"
        </blockquote>
      )}
      <Link to="/">
        <Button className="w-full">Back home</Button>
      </Link>
    </Card>
  )
}