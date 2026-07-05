import type { MonthlyArtistAudit } from '../../types/admin'
import type { Role } from '../constants/roles'
import { ROLES } from '../constants/roles'
import { createNotification } from './notificationService'
import { storage } from './storage'

const ARTIST_AUDITS_KEY = 'artist_audits'

function nowIso(): string {
  return new Date().toISOString()
}

function readAudits(): MonthlyArtistAudit[] {
  return storage.get<MonthlyArtistAudit[]>(ARTIST_AUDITS_KEY) ?? []
}

function writeAudits(audits: MonthlyArtistAudit[]): void {
  storage.set(ARTIST_AUDITS_KEY, audits)
}

export function listMonthlyAudits(year: number, month: number): MonthlyArtistAudit[] {
  return readAudits()
    .filter((a) => a.period_year === year && a.period_month === month)
    .sort((a, b) => a.artist_name.localeCompare(b.artist_name))
}

export function confirmSettlement(
  auditId: number,
  actorRole: Role,
): MonthlyArtistAudit {
  if (actorRole !== ROLES.ADMIN) {
    throw new Error('Only system admins can confirm settlement.')
  }

  const audits = readAudits()
  const auditIndex = audits.findIndex((a) => a.id === auditId)

  if (auditIndex === -1) {
    throw new Error('Audit record not found.')
  }

  const audit = audits[auditIndex]
  if (audit.payment_status === 'settled') {
    throw new Error('This payment is already settled.')
  }

  const updatedAt = nowIso()
  const updatedAudit: MonthlyArtistAudit = {
    ...audit,
    payment_status: 'settled',
    updated_at: updatedAt,
  }

  const updatedAudits = [...audits]
  updatedAudits[auditIndex] = updatedAudit
  writeAudits(updatedAudits)

  createNotification({
    recipient_id: audit.artist_id,
    category: 'monthly_payout',
    title: 'Monthly payout settled',
    message: `Your payout of $${audit.payout_amount?.toFixed(2) ?? '0.00'} for ${audit.period_month}/${audit.period_year} has been settled.`,
  })

  return updatedAudit
}

export function getCurrentPeriod(): { year: number; month: number } {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}
