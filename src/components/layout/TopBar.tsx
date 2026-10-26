import { useEffect, useRef, useState } from 'react'
import { LogOut, Settings, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/ui/Avatar'
import { useAuthStore } from '@/store/authStore'

export function TopBar() {
  const user = useAuthStore((s) => s.user)
  const signOut = useAuthStore((s) => s.signOut)
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'there'

  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onDocClick)
      document.removeEventListener('keydown', onEsc)
    }
  }, [open])

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3 nav:px-8">
        <h1 className="text-lg font-medium italic">
          Hi {user?.firstName ?? 'there'} <span className="not-italic">👋</span>
        </h1>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Open account menu"
            aria-expanded={open}
            aria-haspopup="menu"
            className="rounded-full transition hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            <Avatar name={fullName} src={user?.avatarUrl} size="sm" />
          </button>

          {open && (
            <div
              role="menu"
              className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-card border border-line bg-surface shadow-lift"
            >
              <Link
                to="/app/settings"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-4 py-3 text-sm text-ink transition hover:bg-cream"
              >
                <Settings className="h-4 w-4 text-muted" aria-hidden="true" />
                Settings
              </Link>
              <Link
                to="/privacy"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 border-t border-line px-4 py-3 text-sm text-ink transition hover:bg-cream"
              >
                <Shield className="h-4 w-4 text-muted" aria-hidden="true" />
                Privacy &amp; Terms
              </Link>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false)
                  void signOut()
                }}
                className="flex w-full items-center gap-2 border-t border-line px-4 py-3 text-left text-sm text-rose-strong transition hover:bg-rose-soft"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}