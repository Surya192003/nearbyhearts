import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { grantBonusPhotos, MIN_DONATION_CENTS } from '@/lib/photoQuota'
import { donationService } from '@/services/donationService'

const schema = z.object({
  donorName: z.string().min(2, 'Tell us your name'),
  amountCents: z
    .number({ invalid_type_error: 'Enter an amount' })
    .int('Whole cents only')
    .min(100, 'Minimum is €1.00')
    .max(50000, 'Maximum is €500.00'),
  message: z.string().max(200, 'Keep it under 200 characters').default(''),
  code: z.string().default(''),
})

type FormValues = z.input<typeof schema>

export function DonatePage() {
  const navigate = useNavigate()
  const { code = '' } = useParams<{ code?: string }>()
  const isPhotobooth = code === 'photobooth'

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { donorName: '', amountCents: 2500, message: '', code },
  })

  const amount = Number(watch('amountCents') || 0)

  const onSubmit = async (values: FormValues) => {
    const amountCents = Number(values.amountCents)

    if (isPhotobooth && amountCents < MIN_DONATION_CENTS) {
      setError('amountCents', {
        message: `Minimum €${(MIN_DONATION_CENTS / 100).toFixed(2)} to unlock photobooth photos`,
      })
      return
    }

    const receipt = await donationService.submit({
      code: values.code || 'general',
      amountCents,
      donorName: values.donorName,
      message: values.message ?? '',
    })

    if (isPhotobooth) {
      grantBonusPhotos(10)
      navigate('/photobooth?unlocked=1')
      return
    }

    navigate('/thank-you', { state: { receipt } })
  }

  return (
    <Card className="space-y-5">
      <div>
        <p className="label text-accent">Send a gift</p>
        <h1 className="mt-1 text-2xl font-semibold">
          {isPhotobooth
            ? 'Unlock more photobooth photos 💛'
            : 'Fund a moment for someone far away 💛'}
        </h1>
        <p className="mt-1 text-sm text-muted">
          {isPhotobooth
            ? 'Donate €10 or more to add 10 photos to your allowance.'
            : code
              ? `Gift code: ${code}`
              : 'No code needed — pick an amount below.'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
        <input type="hidden" {...register('code')} />

        <label className="block">
          <span className="label">Your name</span>
          <input
            {...register('donorName')}
            className="mt-1 w-full rounded-field border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          {errors.donorName && (
            <p className="mt-1 text-xs text-rose-strong">{errors.donorName.message}</p>
          )}
        </label>

        <label className="block">
          <span className="label">Amount (cents)</span>
          <input
            type="number"
            step="50"
            {...register('amountCents', { valueAsNumber: true })}
            className="mt-1 w-full rounded-field border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          <p className="mt-1 text-xs text-muted">
            {(amount / 100 || 0).toFixed(2)} EUR
            {isPhotobooth ? ' · minimum 10.00 EUR' : ''}
          </p>
          {errors.amountCents && (
            <p className="mt-1 text-xs text-rose-strong">
              {errors.amountCents.message}
            </p>
          )}
        </label>

        <label className="block">
          <span className="label">Message (optional)</span>
          <textarea
            rows={3}
            {...register('message')}
            className="mt-1 w-full resize-none rounded-field border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          {errors.message && (
            <p className="mt-1 text-xs text-rose-strong">{errors.message.message}</p>
          )}
        </label>

        <Button type="submit" className="w-full" loading={isSubmitting}>
          {isPhotobooth ? 'Donate & unlock 10 photos' : 'Send gift'}
        </Button>
      </form>
    </Card>
  )
}