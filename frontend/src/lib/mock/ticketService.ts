import type { ReplyTicketPayload, SupportTicket, TicketMessage } from '../../types/support'
import { ROLES } from '../constants/roles'
import { adminTicketDetailPath } from '../constants/routes'
import { createNotification } from './notificationService'
import { storage } from './storage'

const TICKETS_KEY = 'tickets'
const USERS_KEY = 'users'

interface StoredUser {
  id: number
  display_name: string
  role: string
}

function nowIso(): string {
  return new Date().toISOString()
}

function getNextId(items: Array<{ id: number }>): number {
  return items.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1
}

function readTickets(): SupportTicket[] {
  return storage.get<SupportTicket[]>(TICKETS_KEY) ?? []
}

function writeTickets(tickets: SupportTicket[]): void {
  storage.set(TICKETS_KEY, tickets)
}

export function listTickets(): SupportTicket[] {
  return readTickets().sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function getTicket(id: number): SupportTicket | null {
  const ticket = readTickets().find((t) => t.id === id)
  if (!ticket) {
    return null
  }
  return { ...ticket, messages: ticket.messages ?? [] }
}

export function replyToTicket(
  ticketId: number,
  senderId: number,
  senderName: string,
  payload: ReplyTicketPayload,
): SupportTicket {
  const message = payload.message.trim()
  if (!message) {
    throw new Error('Reply message cannot be empty.')
  }

  const tickets = readTickets()
  const ticketIndex = tickets.findIndex((t) => t.id === ticketId)

  if (ticketIndex === -1) {
    throw new Error('Ticket not found.')
  }

  const ticket = tickets[ticketIndex]
  if (ticket.status === 'closed') {
    throw new Error('This ticket is closed.')
  }

  const updatedAt = nowIso()
  const existingMessages = ticket.messages ?? []
  const newMessage: TicketMessage = {
    id: getNextId(existingMessages),
    ticket_id: ticketId,
    sender_id: senderId,
    sender_name: senderName,
    message,
    created_at: updatedAt,
    updated_at: updatedAt,
  }

  const updatedTicket: SupportTicket = {
    ...ticket,
    status: 'answered',
    messages: [...existingMessages, newMessage],
    updated_at: updatedAt,
  }

  const updatedTickets = [...tickets]
  updatedTickets[ticketIndex] = updatedTicket
  writeTickets(updatedTickets)

  createNotification({
    recipient_id: ticket.user_id,
    category: 'subscription_expiring',
    title: 'Support replied to your ticket',
    message: `Your ticket "${ticket.subject}" has received a reply.`,
    link: adminTicketDetailPath(ticketId),
  })

  return updatedTicket
}

export function closeTicket(ticketId: number): SupportTicket {
  const tickets = readTickets()
  const ticketIndex = tickets.findIndex((t) => t.id === ticketId)

  if (ticketIndex === -1) {
    throw new Error('Ticket not found.')
  }

  const updatedAt = nowIso()
  const updatedTicket: SupportTicket = {
    ...tickets[ticketIndex],
    status: 'closed',
    updated_at: updatedAt,
  }

  const updatedTickets = [...tickets]
  updatedTickets[ticketIndex] = updatedTicket
  writeTickets(updatedTickets)

  return updatedTicket
}

export function notifyStaffOfNewTicket(ticket: SupportTicket): void {
  const users = storage.get<StoredUser[]>(USERS_KEY) ?? []
  const staffUsers = users.filter(
    (u) => u.role === ROLES.SUPPORT || u.role === ROLES.ADMIN,
  )

  for (const staff of staffUsers) {
    createNotification({
      recipient_id: staff.id,
      category: 'new_ticket',
      title: 'New support ticket',
      message: `${ticket.user_name} submitted: "${ticket.subject}"`,
      link: adminTicketDetailPath(ticket.id),
    })
  }
}
