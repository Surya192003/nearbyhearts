import { NavLink } from 'react-router-dom'
import { NAV_ITEMS } from '@/config/nav'

export function BottomNav() {
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-accent/25 bg-primary nav:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center gap-1 px-1 py-2.5 font-sans text-[10px] font-bold uppercase tracking-[0.12em] transition',
                  isActive ? 'text-accent' : 'text-cream/60',
                ].join(' ')
              }
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="truncate">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}