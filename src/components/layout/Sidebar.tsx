import { LogOut } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { NAV_ITEMS } from '@/config/nav'
import { useAuthStore } from '@/store/authStore'

export function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] flex-col border-r border-line bg-surface px-4 py-6 nav:flex">
      <div className="px-2 text-center">
        <p className="font-script text-2xl text-rose">NearbyHearts</p>
      </div>

      {user?.partner ? (
  <div className="mt-6 flex items-center gap-3 rounded-card border border-accent/30 bg-cream/60 p-3">
    <Avatar
      name={`${user.partner.firstName} ${user.partner.lastName}`}
      src={user.partner.avatarUrl}
    />
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold">{user.partner.firstName}</p>
      <p className="label truncate">Your person 💕</p>
    </div>
  </div>
) : (
  <NavLink
    to="/app/pair"
    className="mt-6 flex items-center gap-3 rounded-card border border-dashed border-accent/50 bg-cream/40 p-3 text-left transition hover:bg-accent-soft"
  >
    <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-accent">
      +
    </span>
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold">Pair with your partner</p>
      <p className="text-[10px] text-muted">Share your code</p>
    </div>
  </NavLink>
)}

      <nav className="mt-6 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-field border px-3 py-2.5 text-sm transition',
                isActive
                  ? 'border-accent/40 bg-accent-soft text-ink'
                  : 'border-transparent text-muted hover:bg-cream hover:text-ink',
              ].join(' ')
            }
          >
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
            {label}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => void signOut()}
        className="flex items-center gap-3 rounded-field border border-transparent px-3 py-2.5 text-sm text-muted transition hover:bg-cream hover:text-ink"
      >
        <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
        Sign out
      </button>
    </aside>
  )
}