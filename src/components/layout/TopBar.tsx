import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/store/authStore'

export function TopBar() {
  const user = useAuthStore((s) => s.user)
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'there'

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 nav:px-8">
        <h1 className="text-lg font-medium italic">
          Hi {user?.firstName ?? 'there'}{' '}
          <span className="not-italic">👋</span>
        </h1>
        <Avatar name={fullName} src={user?.avatarUrl} size="sm" />
      </div>
    </header>
  )
}