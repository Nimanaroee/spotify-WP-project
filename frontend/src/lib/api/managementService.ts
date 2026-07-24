import { isAxiosError } from 'axios'

import type {
  ArtistVerificationRequest,
  VerificationStatus,
} from '../../types/artist'
import type { MonthlyArtistAudit, RevenueReport } from '../../types/admin'
import type {
  ReplyTicketPayload,
  SupportTicket,
  TicketMessage,
} from '../../types/support'
import type {
  SubscriptionPricing,
  UpdateSubscriptionPricingPayload,
} from '../../types/subscription'
import client from './client'

interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') {
      return detail
    }
    const data = error.response?.data
    if (data && typeof data === 'object') {
      const firstValue = Object.values(data)[0]
      if (Array.isArray(firstValue) && typeof firstValue[0] === 'string') {
        return firstValue[0]
      }
    }
  }
  return fallback
}

interface TicketMessageResponse {
  id: number
  ticket: number
  sender: number
  sender_name: string
  message: string
  created_at: string
}

interface TicketResponse {
  id: number
  user: number
  user_name: string
  subject: string
  status: SupportTicket['status']
  created_at: string
  updated_at: string
  messages?: TicketMessageResponse[]
}

function toTicketMessage(response: TicketMessageResponse): TicketMessage {
  return {
    id: response.id,
    ticket_id: response.ticket,
    sender_id: response.sender,
    sender_name: response.sender_name,
    message: response.message,
    created_at: response.created_at,
    updated_at: response.created_at,
  }
}

function toTicket(response: TicketResponse): SupportTicket {
  return {
    id: response.id,
    user_id: response.user,
    user_name: response.user_name,
    subject: response.subject,
    status: response.status,
    created_at: response.created_at,
    updated_at: response.updated_at,
    messages: response.messages?.map(toTicketMessage),
  }
}

export async function createTicket(subject: string, message: string): Promise<SupportTicket> {
  try {
    const response = await client.post<TicketResponse>('/tickets/', { subject, message })
    return toTicket(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to submit ticket.'))
  }
}

export async function listTickets(): Promise<SupportTicket[]> {
  try {
    const response = await client.get<PaginatedResponse<TicketResponse>>('/management/tickets/')
    return response.data.results.map(toTicket)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to load tickets.'))
  }
}

export async function getTicket(id: number): Promise<SupportTicket | null> {
  try {
    const response = await client.get<TicketResponse>(`/management/tickets/${id}/`)
    return toTicket(response.data)
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null
    }
    throw new Error(getApiErrorMessage(error, 'Unable to load ticket.'))
  }
}

export async function replyToTicket(
  ticketId: number,
  payload: ReplyTicketPayload,
): Promise<SupportTicket> {
  try {
    const response = await client.post<TicketResponse>(
      `/management/tickets/${ticketId}/reply/`,
      payload,
    )
    return toTicket(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to send reply.'))
  }
}

export async function closeTicket(ticketId: number): Promise<SupportTicket> {
  try {
    const response = await client.post<TicketResponse>(`/management/tickets/${ticketId}/close/`)
    return toTicket(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to close ticket.'))
  }
}

interface VerificationRequestResponse {
  user_id: number
  stage_name: string
  email: string
  portfolio_links: string[]
  verification_status: VerificationStatus
  rejection_reason: string
  created_at: string
  updated_at: string
}

function toVerificationRequest(response: VerificationRequestResponse): ArtistVerificationRequest {
  return {
    id: response.user_id,
    user_id: response.user_id,
    stage_name: response.stage_name,
    email: response.email,
    portfolio_links: response.portfolio_links,
    verification_status: response.verification_status,
    rejection_reason: response.rejection_reason || undefined,
    created_at: response.created_at,
    updated_at: response.updated_at,
  }
}

export async function listPendingRequests(): Promise<ArtistVerificationRequest[]> {
  try {
    const response = await client.get<PaginatedResponse<VerificationRequestResponse>>(
      '/management/verification-requests/',
      { params: { status: 'pending' } },
    )
    return response.data.results.map(toVerificationRequest)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to load verification requests.'))
  }
}

export async function listAllRequests(): Promise<ArtistVerificationRequest[]> {
  try {
    const response = await client.get<PaginatedResponse<VerificationRequestResponse>>(
      '/management/verification-requests/',
    )
    return response.data.results.map(toVerificationRequest)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to load verification requests.'))
  }
}

export async function getRequest(id: number): Promise<ArtistVerificationRequest | null> {
  try {
    const response = await client.get<VerificationRequestResponse>(
      `/management/verification-requests/${id}/`,
    )
    return toVerificationRequest(response.data)
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null
    }
    throw new Error(getApiErrorMessage(error, 'Unable to load verification request.'))
  }
}

export async function approveRequest(id: number): Promise<ArtistVerificationRequest> {
  try {
    const response = await client.post<VerificationRequestResponse>(
      `/management/verification-requests/${id}/approve/`,
    )
    return toVerificationRequest(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to approve request.'))
  }
}

export async function rejectRequest(
  id: number,
  reason: string,
): Promise<ArtistVerificationRequest> {
  try {
    const response = await client.post<VerificationRequestResponse>(
      `/management/verification-requests/${id}/reject/`,
      { reason },
    )
    return toVerificationRequest(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to reject request.'))
  }
}

interface MonthlyArtistAuditResponse {
  id: number
  artist_id: number
  artist_name: string
  period_year: number
  period_month: number
  unique_listeners_count: number
  total_streams_count: number
  payout_amount: string | null
  payment_status: MonthlyArtistAudit['payment_status']
  created_at: string
  updated_at: string
}

function toAudit(response: MonthlyArtistAuditResponse): MonthlyArtistAudit {
  return {
    id: response.id,
    artist_id: response.artist_id,
    artist_name: response.artist_name,
    period_year: response.period_year,
    period_month: response.period_month,
    unique_listeners_count: response.unique_listeners_count,
    total_streams_count: response.total_streams_count,
    payout_amount: response.payout_amount !== null ? Number(response.payout_amount) : null,
    payment_status: response.payment_status,
    created_at: response.created_at,
    updated_at: response.updated_at,
  }
}

export async function listMonthlyAudits(
  year: number,
  month: number,
): Promise<MonthlyArtistAudit[]> {
  try {
    const response = await client.get<PaginatedResponse<MonthlyArtistAuditResponse>>(
      '/management/audits/',
      { params: { year, month } },
    )
    return response.data.results.map(toAudit)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to load audits.'))
  }
}

export async function confirmSettlement(auditId: number): Promise<MonthlyArtistAudit> {
  try {
    const response = await client.post<MonthlyArtistAuditResponse>(
      `/management/audits/${auditId}/settle/`,
    )
    return toAudit(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to confirm settlement.'))
  }
}

export function getCurrentPeriod(): { year: number; month: number } {
  const now = new Date()
  return { year: now.getFullYear(), month: now.getMonth() + 1 }
}

interface SubscriptionPricingResponse {
  silver_price: string
  gold_price: string
  updated_at: string
}

function toPricing(response: SubscriptionPricingResponse): SubscriptionPricing {
  return {
    silver_price: Number(response.silver_price),
    gold_price: Number(response.gold_price),
    updated_at: response.updated_at,
  }
}

export async function getPricing(): Promise<SubscriptionPricing> {
  try {
    const response = await client.get<SubscriptionPricingResponse>(
      '/management/subscription-pricing/',
    )
    return toPricing(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to load pricing.'))
  }
}

export async function updatePricing(
  payload: UpdateSubscriptionPricingPayload,
): Promise<SubscriptionPricing> {
  try {
    const response = await client.put<SubscriptionPricingResponse>(
      '/management/subscription-pricing/',
      payload,
    )
    return toPricing(response.data)
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to update pricing.'))
  }
}

interface RevenueReportResponse {
  period_year: number
  period_month: number
  total_subscription_revenue: string
  subscription_distribution: RevenueReport['subscription_distribution']
}

export async function getRevenueReport(year: number, month: number): Promise<RevenueReport> {
  try {
    const response = await client.get<RevenueReportResponse>('/management/revenue-report/', {
      params: { year, month },
    })
    return {
      period_year: response.data.period_year,
      period_month: response.data.period_month,
      total_subscription_revenue: Number(response.data.total_subscription_revenue),
      subscription_distribution: response.data.subscription_distribution,
    }
  } catch (error) {
    throw new Error(getApiErrorMessage(error, 'Unable to load revenue report.'))
  }
}
