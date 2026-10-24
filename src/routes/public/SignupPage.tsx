import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { useAuthStore } from '@/store/authStore'

const schema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'At least 6 characters'),
  city: z.string().optional().default(''),
})

type FormValues = z.infer<typeof schema>

export function SignupPage() {
  const navigate = useNavigate()
  const { signUp, status, error } = useAuthStore()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { firstName: '', lastName: '', email: '', password: '', city: '' },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await signUp(values)
      navigate('/app/pair', { replace: true })
    } catch {
      /* shown from store */
    }
  }

  return (
    <Card className="space-y-5">
      <div className="text-center">
        <p className="font-script text-2xl text-rose">NearbyHearts</p>
        <p className="mt-1 text-sm text-muted">Create your account.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <span className="label">First name</span>
            <input
              {...register('firstName')}
              className="mt-1 w-full rounded-field border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            {errors.firstName && (
              <p className="mt-1 text-xs text-rose-strong">{errors.firstName.message}</p>
            )}
          </label>
          <label className="block">
            <span className="label">Last name</span>
            <input
              {...register('lastName')}
              className="mt-1 w-full rounded-field border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
            {errors.lastName && (
              <p className="mt-1 text-xs text-rose-strong">{errors.lastName.message}</p>
            )}
          </label>
        </div>

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
            autoComplete="new-password"
            {...register('password')}
            className="mt-1 w-full rounded-field border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          {errors.password && (
            <p className="mt-1 text-xs text-rose-strong">{errors.password.message}</p>
          )}
        </label>

        <label className="block">
          <span className="label">City (optional)</span>
          <input
            {...register('city')}
            className="mt-1 w-full rounded-field border border-line bg-canvas px-3 py-2.5 text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </label>

        {error && <p className="text-xs text-rose-strong">{error}</p>}

        <Button type="submit" className="w-full" loading={status === 'loading'}>
          Create account
        </Button>
      </form>

      <p className="text-center text-xs text-muted">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-accent hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  )
}