import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/Card'

const SECTIONS: { title: string; rows: [string, string][] }[] = [
  {
    title: 'What we store',
    rows: [
      ['Account', 'Email, first name, last name, city, timezone. Password is stored only as a bcrypt hash — we cannot read it.'],
      ['Messages', 'Text, sender, timestamp, and whether it was sent in incognito mode.'],
      ['Shared feed', 'Posts, photos you attach by URL, and reactions (❤️).'],
      ['Gifts', 'Which gift you sent, to whom, the note, and the timestamp.'],
      ['Donations', 'Amount, donor name, message, and payment-provider reference. No card details — those stay with the payment provider.'],
    ],
  },
  {
    title: 'What we never store',
    rows: [
      ['Photobooth photos', 'All photos and strips live in your browser only (IndexedDB). They never touch our servers.'],
      ['Partner photos', 'Same — local only.'],
      ['Video calls', 'Peer-to-peer. Only tiny handshake messages pass through a signaling server; the video itself never does.'],
      ['Passwords in plain text', 'Never.'],
      ['IP-based analytics', 'We do not embed tracking scripts. No Google Analytics, no Facebook pixel, no ad networks.'],
    ],
  },
  {
    title: 'How long we keep things',
    rows: [
      ['Regular chat messages', '60 days from when they were sent, then auto-deleted by our cleanup job (runs every hour).'],
      ['Incognito messages', '24 hours from when they were sent, then auto-deleted.'],
      ['Shared feed posts & reactions', '60 days.'],
      ['Gifts sent', '60 days.'],
      ['Donations', 'Kept indefinitely for accounting and legal records. Amount, name, and note only — no payment details.'],
      ['Sessions (login cookies)', '7 days, or until you sign out.'],
    ],
  },
  {
    title: 'Your controls',
    rows: [
      ['Delete a message', 'Hover any message in Chat → tap the trash icon. Deletes for both of you immediately.'],
      ['Clear the whole chat', 'Tap "Clear chat" at the top of Chat. Deletes every message in the conversation for both of you.'],
      ['Incognito mode', 'Toggle it on before sending. Those messages disappear within 24 hours without any action.'],
      ['Sign out', 'Clears your session cookie. Messages remain for the retention window above, then delete themselves.'],
    ],
  },
  {
    title: 'Cookies & storage',
    rows: [
      ['Session cookie (nh_session)', 'httpOnly, SameSite=Lax. Identifies you to the server. No tracking. No third-party cookies.'],
      ['Browser storage (IndexedDB, localStorage)', 'Used for photobooth photos and quota. Never sent to us. Clear it any time from your browser settings.'],
    ],
  },
  {
    title: 'Third parties',
    rows: [
      ['PeerJS signaling', 'Used only in Live photobooth mode. Exchanges handshake messages so two browsers can find each other. Video is peer-to-peer and never passes through this service.'],
      ['Payment provider', 'If/when real donations are enabled, your card is entered directly with Stripe or PayPal. We see only a reference ID and the amount.'],
      ['Nothing else', 'No CDN logs tied to you, no fonts that track, no analytics, no advertising.'],
    ],
  },
]

export function PrivacyPage() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Link to="/" className="label text-accent hover:underline">
          ← Back home
        </Link>
      </div>

      <Card className="space-y-2">
        <p className="label text-accent">Privacy & Terms</p>
        <h1 className="font-script text-3xl text-rose">What we keep, what we don't</h1>
        <p className="text-sm text-muted">
          Plain language, no legal traps. If something below is unclear,
          tell us and we'll rewrite it.
        </p>
      </Card>

      <Card className="space-y-2 border-accent/40">
        <p className="label">Short version</p>
        <ul className="space-y-1.5 text-sm text-ink">
          <li>• Photos and videos stay on your device. We never see them.</li>
          <li>• Regular messages are deleted after 60 days, automatically.</li>
          <li>• Incognito messages delete themselves after 24 hours.</li>
          <li>• Either of you can delete any message, any time, for both of you.</li>
          <li>• No tracking. No analytics. No ads.</li>
        </ul>
      </Card>

      {SECTIONS.map((s) => (
        <Card key={s.title} className="space-y-3">
          <h2 className="text-lg font-semibold">{s.title}</h2>
          <dl className="space-y-2">
            {s.rows.map(([k, v]) => (
              <div
                key={k}
                className="grid gap-0.5 border-t border-line pt-2 first:border-t-0 first:pt-0 sm:grid-cols-[180px_1fr] sm:gap-3"
              >
                <dt className="label">{k}</dt>
                <dd className="text-sm text-ink">{v}</dd>
              </div>
            ))}
          </dl>
        </Card>
      ))}

      <Card className="space-y-2">
        <h2 className="text-lg font-semibold">Questions, corrections, requests</h2>
        <p className="text-sm text-muted">
          This is a two-person private app, not a company. If you want a
          data export or a full account deletion, we'll do it manually — ask
          the person who runs the server.
        </p>
      </Card>

      <p className="text-center text-xs text-muted">
        Last updated with the current build. Revisions will appear here.
      </p>
    </div>
  )
}