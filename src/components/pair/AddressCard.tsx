import { useMemo, useState } from 'react'
import { MapPin, Pencil } from 'lucide-react'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { supportedTimezones } from '@/lib/distance'
import { userService } from '@/services/userService'
import { useAuthStore } from '@/store/authStore'

export function AddressCard() {
  const user = useAuthStore((s) => s.user)
  const refresh = useAuthStore((s) => s.refresh)

  const [editing, setEditing] = useState(false)
  const [city, setCity] = useState(user?.city ?? '')
  const [state, setState] = useState(user?.state ?? '')
  const [country, setCountry] = useState(user?.country ?? '')
  const [timezone, setTimezone] = useState(
    user?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
  )
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const timezones = useMemo(() => supportedTimezones(), [])

  if (!user) return null

  const startEdit = () => {
    setCity(user.city ?? '')
    setState(user.state ?? '')
    setCountry(user.country ?? '')
    setTimezone(user.timezone)
    setMessage(null)
    setEditing(true)
  }

  const submit = async () => {
    if (!city.trim() || !country.trim()) {
      setMessage({ kind: 'err', text: 'City and country are required.' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      const res = await userService.updateMe({
        city: city.trim(),
        state: state.trim() || null,
        country: country.trim(),
        timezone,
      })
      await refresh()
      if (res.geocoded) {
        setMessage({ kind: 'ok', text: 'Address saved and located.' })
      } else if (res.geocodeError) {
        setMessage({ kind: 'err', text: res.geocodeError })
      } else {
        setMessage({ kind: 'ok', text: 'Address saved.' })
      }
      setEditing(false)
    } catch (err) {
      setMessage({
        kind: 'err',
        text: err instanceof Error ? err.message : 'Could not save.',
      })
    } finally {
      setSaving(false)
    }
  }

  const displayAddress = (
    u?: { city?: string | null; state?: string | null; country?: string | null } | null,
  ): string => {
    const parts = [u?.city, u?.state, u?.country].filter(Boolean)
    return parts.length ? parts.join(', ') : 'No address set'
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="label">Address</p>
        {!editing && (
          <button
            type="button"
            onClick={startEdit}
            className="inline-flex items-center gap-1 rounded-pill border border-line px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-muted hover:border-accent hover:text-accent-strong"
          >
            <Pencil className="h-3 w-3" />
            Edit
          </button>
        )}
      </div>

      {!editing && (
        <>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-accent" aria-hidden="true" />
            <p className="text-sm">{displayAddress(user)}</p>
          </div>
          <p className="text-xs text-muted">Timezone: {user.timezone}</p>
          {user.latitude === null && (
            <p className="rounded-field border border-dashed border-accent/40 bg-cream px-3 py-2 text-xs text-muted">
              Coordinates not set yet — click Edit to locate your address.
            </p>
          )}

          {user.partner && (
            <div className="mt-3 flex items-start gap-3 rounded-field bg-cream/60 p-3">
              <Avatar
                name={`${user.partner.firstName} ${user.partner.lastName}`}
                src={user.partner.avatarUrl}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold">{user.partner.firstName}</p>
                <p className="text-xs text-muted">{displayAddress(user?.partner)}</p>
                <p className="text-[10px] text-muted">
                  Timezone: {user.partner.timezone}
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {editing && (
        <div className="space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="label">City</span>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Dublin"
                className="mt-1 w-full rounded-field border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </label>
            <label className="block">
              <span className="label">State / region</span>
              <input
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="Leinster"
                className="mt-1 w-full rounded-field border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-accent"
              />
            </label>
          </div>

          <label className="block">
            <span className="label">Country</span>
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Ireland"
              className="mt-1 w-full rounded-field border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>

          <label className="block">
            <span className="label">Timezone</span>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="mt-1 w-full rounded-field border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-accent"
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[10px] text-muted">
              Defaults to your browser timezone.
            </p>
          </label>

          {message && (
            <p
              className={`text-xs ${
                message.kind === 'err' ? 'text-rose-strong' : 'text-primary'
              }`}
            >
              {message.text}
            </p>
          )}

          <div className="flex gap-2">
            <Button onClick={() => void submit()} loading={saving}>
              Save
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setEditing(false)
                setMessage(null)
              }}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {!editing && message && (
        <p
          className={`text-xs ${
            message.kind === 'err' ? 'text-rose-strong' : 'text-primary'
          }`}
        >
          {message.text}
        </p>
      )}
    </Card>
  )
}