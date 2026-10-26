import { useEffect, useState } from 'react'
import { Calendar, Check, Pencil, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pill } from '@/components/ui/Pill'
import { formatDistance } from '@/lib/format'
import { useAuthStore } from '@/store/authStore'
import { useCountdownStore } from '@/store/countdownStore'
import { useVisitStore } from '@/store/visitStore'
import type { Visit } from '@/services/visitService'

function toDateInputValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function statusTone(s: Visit['status']): 'gold' | 'rose' | 'forest' | 'neutral' {
  if (s === 'scheduled') return 'forest'
  if (s === 'cancel_pending') return 'gold'
  if (s === 'cancelled') return 'rose'
  return 'neutral'
}

export function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const {
    nextVisitIso, distanceKm, togetherSince, saving: savingCouple,
    load: loadCouple, save: saveCouple,
  } = useCountdownStore()
  const {
    visits, loading: loadingVisits, saving: savingVisit, error: visitError,
    load: loadVisits, create, requestCancel, approveCancel, rejectCancel, withdrawCancel,
  } = useVisitStore()

  const [editing, setEditing] = useState(false)
  const [dateInput, setDateInput] = useState('')
  const [distanceInput, setDistanceInput] = useState('')
  const [togetherInput, setTogetherInput] = useState('')
  const [coupleError, setCoupleError] = useState<string | null>(null)
  const [newVisitDate, setNewVisitDate] = useState('')
  const [newVisitTitle, setNewVisitTitle] = useState('')
  const [showNewVisit, setShowNewVisit] = useState(false)

  useEffect(() => {
    void loadCouple()
    void loadVisits()
  }, [loadCouple, loadVisits])

  useEffect(() => {
    setDateInput(toDateInputValue(nextVisitIso))
    setDistanceInput(distanceKm != null ? String(distanceKm) : '')
    setTogetherInput(togetherSince ? togetherSince.slice(0, 10) : '')
  }, [nextVisitIso, distanceKm, togetherSince])

  const onSaveCouple = async () => {
    setCoupleError(null)
    const nextVisitAt = dateInput ? `${dateInput}T12:00:00.000Z` : null
    const km = distanceInput.trim() === '' ? null : Number(distanceInput)
    if (km != null && (!Number.isFinite(km) || km < 0)) {
      setCoupleError('Distance must be a number ≥ 0')
      return
    }
    try {
      await saveCouple({ nextVisitAt, distanceKm: km, togetherSince: togetherInput || null })
      setEditing(false)
    } catch (err) {
      setCoupleError(err instanceof Error ? err.message : 'Save failed')
    }
  }

  const onCreateVisit = async () => {
    if (!newVisitDate) return
    await create({ scheduledAt: `${newVisitDate}T12:00:00.000Z`, title: newVisitTitle.trim() || 'Visit' })
    setNewVisitDate('')
    setNewVisitTitle('')
    setShowNewVisit(false)
  }

  const partnerName = user?.partner?.firstName ?? 'Partner'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-muted">Manage your countdown, distance, and visits.</p>
      </div>

      <Card variant="forest" className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="label text-accent">Couple details</p>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-full p-1.5 text-accent transition hover:bg-white/10"
              aria-label="Edit couple details"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <label className="block">
              <span className="label text-accent">Next visit</span>
              <input
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                className="mt-1 w-full rounded-field border border-accent/40 bg-primary-strong/40 px-3 py-2 text-sm text-cream outline-none focus:border-accent"
              />
            </label>
            <label className="block">
              <span className="label text-accent">Distance (km)</span>
              <input
                type="number"
                min={0}
                value={distanceInput}
                onChange={(e) => setDistanceInput(e.target.value)}
                className="mt-1 w-full rounded-field border border-accent/40 bg-primary-strong/40 px-3 py-2 text-sm text-cream outline-none focus:border-accent"
              />
            </label>
            <label className="block">
              <span className="label text-accent">Together since</span>
              <input
                type="date"
                value={togetherInput}
                onChange={(e) => setTogetherInput(e.target.value)}
                className="mt-1 w-full rounded-field border border-accent/40 bg-primary-strong/40 px-3 py-2 text-sm text-cream outline-none focus:border-accent"
              />
            </label>
            {coupleError && <p className="text-xs text-rose-strong">{coupleError}</p>}
            <div className="flex gap-2">
              <Button onClick={() => void onSaveCouple()} loading={savingCouple} className="flex-1">
                Save
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)} disabled={savingCouple}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <dl className="space-y-2 text-cream">
            <div className="flex justify-between text-sm">
              <dt className="text-cream/70">Next visit</dt>
              <dd>{nextVisitIso ? formatDate(nextVisitIso) : 'Not set'}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-cream/70">Distance</dt>
              <dd>{distanceKm != null ? formatDistance(distanceKm) : 'Not set'}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-cream/70">Together since</dt>
              <dd>{togetherSince ? formatDate(togetherSince) : 'Not set'}</dd>
            </div>
          </dl>
        )}
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="label">Visits</p>
            <p className="text-sm text-muted">Plan and manage trips between you and {partnerName}.</p>
          </div>
          {!showNewVisit && (
            <Button variant="outline" icon={<Plus className="h-4 w-4" />} onClick={() => setShowNewVisit(true)}>
              New
            </Button>
          )}
        </div>

        {showNewVisit && (
          <div className="space-y-2 rounded-field border border-accent/40 bg-cream p-3">
            <input
              value={newVisitTitle}
              onChange={(e) => setNewVisitTitle(e.target.value)}
              placeholder="Title (e.g. Weekend in Lisbon)"
              className="w-full rounded-field border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <input
              type="date"
              value={newVisitDate}
              onChange={(e) => setNewVisitDate(e.target.value)}
              className="w-full rounded-field border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <div className="flex gap-2">
              <Button onClick={() => void onCreateVisit()} loading={savingVisit} className="flex-1">
                Schedule visit
              </Button>
              <Button variant="ghost" onClick={() => setShowNewVisit(false)} disabled={savingVisit}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {visitError && (
          <p className="rounded-field border border-rose/40 bg-rose-soft px-3 py-2 text-xs text-rose-strong">
            {visitError}
          </p>
        )}
        {loadingVisits && visits.length === 0 && <EmptyState emoji="⏳" title="Loading visits…" />}
        {!loadingVisits && visits.length === 0 && (
          <EmptyState title="No visits yet" hint="Tap New to schedule your first one." />
        )}

        <ul className="space-y-2">
          {visits.map((v) => {
            const mine = v.cancelRequestedBy === user?.id
            const partnerRequested = v.status === 'cancel_pending' && !mine
            return (
              <li key={v.id}>
                <div className="rounded-field border border-line bg-surface p-3">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold">{v.title}</p>
                    <Pill tone={statusTone(v.status)}>
                      {v.status === 'cancel_pending' ? 'Cancel pending' : v.status}
                    </Pill>
                  </div>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                    <Calendar className="h-3 w-3" aria-hidden="true" /> {formatDate(v.scheduledAt)}
                  </p>
                  {v.cancelReason && v.status === 'cancel_pending' && (
                    <p className="mt-1 text-xs italic text-muted">
                      "{v.cancelReason}" — {mine ? 'you' : partnerName}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {v.status === 'scheduled' && (
                      <Button
                        variant="ghost"
                        className="!min-h-0 !px-2 !py-1 text-xs"
                        onClick={() => {
                          const r = window.prompt('Reason (optional)') ?? ''
                          void requestCancel(v.id, r)
                        }}
                      >
                        Request cancel
                      </Button>
                    )}
                    {v.status === 'cancel_pending' && mine && (
                      <Button
                        variant="ghost"
                        className="!min-h-0 !px-2 !py-1 text-xs"
                        onClick={() => void withdrawCancel(v.id)}
                      >
                        Withdraw
                      </Button>
                    )}
                    {partnerRequested && (
                      <>
                        <Button
                          variant="outline"
                          className="!min-h-0 !px-2 !py-1 text-xs"
                          icon={<Check className="h-3 w-3" />}
                          onClick={() => void approveCancel(v.id)}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          className="!min-h-0 !px-2 !py-1 text-xs"
                          icon={<X className="h-3 w-3" />}
                          onClick={() => void rejectCancel(v.id)}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </Card>
    </div>
  )
}