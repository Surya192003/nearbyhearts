import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
})

type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn, status, error } = useAuthStore()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'alex@nearbyhearts.app', password: 'secret123' },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await signIn(values)
      navigate('/app/whats-new', { replace: true })
    } catch {
      // error message is shown from the store
    }
  }

  return (
    <Card className="space-y-5">
      <div className="text-center">
        <p className="font-script text-2xl text-rose">NearbyHearts</p>
        <p className="mt-1 text-sm text-muted">Welcome back — sign in to continue.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
        <label className="block">
          <span className="label">Email</span>
          <input
            type="email"
            autoComplete="email"
            {...register('email')}
            className="mt-1 w-full rounded-field border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          {errors.email && (
            <p className="mt-1 text-xs text-rose-strong">{errors.email.message}</p>
          )}
        </label>

        <label className="block">
          <span className="label">Password</span>
          <input
            type="password"
            autoComplete="current-password"
            {...register('password')}
            className="mt-1 w-full rounded-field border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-rose-strong">
              {errors.password.message}
            </p>
          )}
        </label>

        {error && <p className="text-xs text-rose-strong">{error}</p>}

        <Button type="submit" className="w-full" loading={status === 'loading'}>
          Sign in
        </Button>
      </form>

      <div className="text-center text-xs text-muted">
        <Link to="/" className="font-semibold text-accent hover:underline">
          ← Back home
        </Link>
        <div className="text-center text-xs text-muted">
  No account yet?{' '}
  <Link to="/signup" className="font-semibold text-accent hover:underline">
    Create one
  </Link>
</div>
      </div>
    </Card>
  )
}