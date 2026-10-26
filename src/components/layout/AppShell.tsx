import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from '@/components/layout/BottomNav'
import { Sidebar } from '@/components/layout/Sidebar'
import { TopBar } from '@/components/layout/TopBar'
import { useAuthStore } from '@/store/authStore'

const PAIR_PATH = '/app/pair'

export function AppShell() {
  const { pathname } = useLocation()
  const user = useAuthStore((s) => s.user)
  const status = useAuthStore((s) => s.status)
  const refresh = useAuthStore((s) => s.refresh)

  useEffect(() => {
    void refresh()
  }, [refresh])

  if (status === 'idle' || status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="mt-3 font-sans text-xs uppercase tracking-[0.16em] text-muted">
            Loading your space…
          </p>
        </div>
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  const onPair = pathname === PAIR_PATH
  if (!user.partner && !onPair) return <Navigate to={PAIR_PATH} replace />
  if (user.partner && onPair) {
    return <Navigate to="/app/whats-new" replace />
  }

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar />
      <div className="nav:pl-[264px]">
        <TopBar />
        <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-5 nav:px-8 nav:pb-12">
          <motion.div
            key={pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
      <BottomNav />
    </div>
  )
}