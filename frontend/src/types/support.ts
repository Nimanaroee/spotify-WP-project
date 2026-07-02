import type { EntityId, Timestamps } from './common'

export type TicketStatus = 'open' | 'answered' | 'closed'

export interface TicketMessage extends Timestamps {
  id: EntityId
  ticket_id: EntityId
  sender_id: EntityId
  sender_name: string
  message: string
}

export interface SupportTicket extends Timestamps {
  id: EntityId
  user_id: EntityId
  user_name: string
  subject: string
  status: TicketStatus
  messages?: TicketMessage[]
}

export interface CreateTicketPayload {
  subject: string
  message: string
}

export interface ReplyTicketPayload {
  message: string
}
