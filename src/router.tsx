import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { ChatPage } from '@/routes/app/ChatPage'
import { GiftsPage } from '@/routes/app/GiftsPage'
import { PhotoboothPage as AppPhotoboothPage } from '@/routes/app/PhotoboothPage'
import { VideoCallPage } from '@/routes/app/VideoCallPage'
import { WhatsNewPage } from '@/routes/app/WhatsNewPage'
import { DonatePage } from '@/routes/public/DonatePage'
import { HomePage } from '@/routes/public/HomePage'
import { LoginPage } from '@/routes/public/LoginPage'
import { NotFoundPage } from '@/routes/public/NotFoundPage'
import { PhotoboothPage as PublicPhotoboothPage } from '@/routes/public/PhotoboothPage'
import { PrivacyPage } from '@/routes/public/PrivacyPage'
import { ThankYouPage } from '@/routes/public/ThankYouPage'

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/donate/:code?', element: <DonatePage /> },
      { path: '/thank-you', element: <ThankYouPage /> },
      { path: '/photobooth', element: <PublicPhotoboothPage /> },
      { path: '/privacy', element: <PrivacyPage /> },   // ← moved here
    ],
  },
  {
    path: '/app',
    element: <AppShell />,
    children: [
      { index: true, element: <Navigate to="/app/whats-new" replace /> },
      { path: 'whats-new', element: <WhatsNewPage /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'video', element: <VideoCallPage /> },
      { path: 'gifts', element: <GiftsPage /> },
      { path: 'photobooth', element: <AppPhotoboothPage /> },
      { path: '*', element: <Navigate to="/app/whats-new" replace /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])