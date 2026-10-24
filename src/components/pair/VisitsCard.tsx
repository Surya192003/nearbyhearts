import { useEffect, useMemo, useState } from 'react'
import { CalendarPlus, Check, Clock, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pill } from '@/components/ui/Pill'
import { formatCountdown } from '@/lib/format'
import { useAuthStore } from '@/store/authStore'
import { useVisitStore } from '@/store/visitStore'

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export function VisitsCard() {
  const user = useAuthStore((s) => s.user)
  const {
    visits,
    loading,
    error,
    load,
    create,
    requestCancel,
    approveCancel,
    rejectCancel,
    withdrawCancel,
  } = useVisitStore()

  const [adding, setAdding] = useState(false)
  const [title, setTitle] = useState('Visit')
  const [scheduledAt, setScheduledAt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [pendingCancelId, setPendingCancelId] = useState<string | null>(null)

  useEffect(() => {
    void load()
  }, [load])

  const nextVisit = useMemo(() => {
    const now = Date.now()
    return visits
      .filter(
        (v) => v.status === 'scheduled' && new Date(v.scheduledAt).getTime() > now,
      )
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))[0]
  }, [visits])

  if (!user) return null

  const submit = async () => {
    if (!scheduledAt) {
      setActionError('Pick a date and time.')
      return
    }
    setSubmitting(true)
    setActionError(null)
    try {
      await create({ title: title.trim() || 'Visit', scheduledAt })
      setAdding(false)
      setTitle('Visit')
      setScheduledAt('')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not add visit.')
    } finally {
      setSubmitting(false)
    }
  }

  const doRequestCancel = async (id: string) => {
    setSubmitting(true)
    setActionError(null)
    try {
      await requestCancel(id, undefined)
      setPendingCancelId(null)
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Could not request cancel.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  const doApprove = async (id: string) => {
    setSubmitting(true)
    try {
      await approveCancel(id)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not approve.')
    } finally {
      setSubmitting(false)
    }
  }

  const doReject = async (id: string) => {
    setSubmitting(true)
    try {
      await rejectCancel(id)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not reject.')
    } finally {
      setSubmitting(false)
    }
  }

  const doWithdraw = async (id: string) => {
    setSubmitting(true)
    try {
      await withdrawCancel(id)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Could not withdraw.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="label">Visits</p>
        {!adding && (
          <button
            type="button"
            onClick={() => {
              setAdding(true)
              setActionError(null)
            }}
            className="inline-flex items-center gap-1 rounded-pill border border-line px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-muted hover:border-accent hover:text-accent-strong"
          >
            <CalendarPlus className="h-3 w-3" />
            Add visit
          </button>
        )}
      </div>

      {nextVisit && (
        <div className="rounded-card bg-primary p-4 text-center text-cream">
          <p className="text-[10px] uppercase tracking-[0.16em] text-accent">
            Next visit · {nextVisit.title}
          </p>
          {(() => {
            const c = formatCountdown(nextVisit.scheduledAt)
            return c.done ? (
              <p className="mt-2 font-script text-4xl text-accent">Today!</p>
            ) : (
              <>
                <p className="mt-2 font-script text-4xl text-accent">
                  {c.days} days
                </p>
                <div className="mt-2 flex justify-center gap-4 font-sans text-xs font-bold uppercase tracking-[0.16em] text-cream/80 tabular-nums">
                  <span>{String(c.hours).padStart(2, '0')}h</span>
                  <span>{String(c.minutes).padStart(2, '0')}m</span>
                  <span>{String(c.seconds).padStart(2, '0')}s</span>
                </div>
              </>
            )
          })()}
          <p className="mt-2 text-xs italic text-cream/70">
            {formatDateTime(nextVisit.scheduledAt)}
          </p>
        </div>
      )}

      {(actionError || error) && (
        <p className="text-xs text-rose-strong">{actionError ?? error}</p>
      )}

      {adding && (
        <div className="space-y-2 rounded-field border border-line bg-cream/40 p-3">
          <label className="block">
            <span className="label">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Weekend together"
              className="mt-1 w-full rounded-field border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block">
            <span className="label">Date & time</span>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="mt-1 w-full rounded-field border border-line bg-canvas px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          <div className="flex gap-2">
            <Button onClick={() => void submit()} loading={submitting}>
              Add
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setAdding(false)
                setActionError(null)
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {loading && visits.length === 0 && (
        <p className="text-xs text-muted">Loading visits…</p>
      )}

      {!loading && visits.length === 0 && !adding && (
        <EmptyState
          title="No visits scheduled"
          hint="Add your next meeting to start a countdown."
        />
      )}

      {visits.length > 0 && (
        <ul className="space-y-2">
          {visits.map((v) => {
            const isPast =
              v.status === 'scheduled' &&
              new Date(v.scheduledAt).getTime() < Date.now()
            const iCanApprove =
              v.status === 'cancel_pending' && v.cancelRequestedBy !== user.id
            const iCanWithdraw =
              v.status === 'cancel_pending' && v.cancelRequestedBy === user.id

            return (
              <li
                key={v.id}
                className="rounded-field border border-line bg-surface p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{v.title}</p>
                    <p className="text-xs text-muted">
                      {formatDateTime(v.scheduledAt)}
                    </p>
                    {v.status === 'cancel_pending' && v.cancelReason && (
                      <p className="mt-1 text-[11px] italic text-muted">
                        "{v.cancelReason}"
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {v.status === 'scheduled' && !isPast && (
                      <Pill tone="forest">
                        <Clock className="h-3 w-3" />
                        Upcoming
                      </Pill>
                    )}
                    {v.status === 'scheduled' && isPast && (
                      <Pill tone="neutral">Past</Pill>
                    )}
                    {v.status === 'cancel_pending' && (
                      <Pill tone="gold">Cancel pending</Pill>
                    )}
                    {v.status === 'cancelled' && <Pill tone="rose">Cancelled</Pill>}
                    {v.status === 'completed' && <Pill tone="neutral">Done</Pill>}
                  </div>
                </div>

                {pendingCancelId === v.id && (
                  <div className="mt-2 rounded-field border border-rose/30 bg-rose-soft p-2 text-xs text-rose-strong">
                    <p className="font-semibold">
                      Requesting cancellation requires {user.partner?.firstName}'s
                      approval. You cannot undo this alone.
                    </p>
                    <div className="mt-2 flex gap-2">
                      <Button
                        onClick={() => void doRequestCancel(v.id)}
                        loading={submitting}
                        className="!min-h-[34px] !px-3 !py-1.5 !text-[10px]"
                      >
                        Yes, request
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setPendingCancelId(null)}
                        className="!min-h-[34px] !px-3 !py-1.5 !text-[10px]"
                      >
                        Nevermind
                      </Button>
                    </div>
                  </div>
                )}

                {v.status === 'scheduled' && !isPast && pendingCancelId !== v.id && (
                  <button
                    type="button"
                    onClick={() => setPendingCancelId(v.id)}
                    className="mt-2 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-muted hover:text-rose-strong"
                  >
                    Request cancel
                  </button>
                )}

                {iCanApprove && (
                  <div className="mt-2 flex gap-2">
                    <Button
                      onClick={() => void doApprove(v.id)}
                      loading={submitting}
                      className="!min-h-[34px] !px-3 !py-1.5 !text-[10px]"
                      icon={<Check className="h-3 w-3" />}
                    >
                      Approve cancel
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => void doReject(v.id)}
                      className="!min-h-[34px] !px-3 !py-1.5 !text-[10px]"
                      icon={<X className="h-3 w-3" />}
                    >
                      Reject
                    </Button>
                  </div>
                )}

                {iCanWithdraw && (
                  <button
                    type="button"
                    onClick={() => void doWithdraw(v.id)}
                    disabled={submitting}
                    className="mt-2 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-muted hover:text-ink"
                  >
                    Withdraw my request
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}