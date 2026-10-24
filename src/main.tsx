import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { pingBackend } from '@/lib/api'
import { useAuthStore } from '@/store/authStore'
import '@/index.css'

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('Root element #root not found')

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)

// Hydrate auth session (reads /auth/me cookie)
void useAuthStore.getState().hydrate()

if (import.meta.env.DEV) {
  void pingBackend().then((health) => {
    if (health) {
      // eslint-disable-next-line no-console
      console.info(
        `[api] backend reachable · db ${health.db ? 'ok' : 'down'} · ${health.time}`,
      )
    } else {
      // eslint-disable-next-line no-console
      console.warn('[api] backend unreachable — data fetches will fail')
    }
  })
}