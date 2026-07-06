export type EntityId = number

export interface Timestamps {
  created_at: string
  updated_at?: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface ApiError {
  detail?: string
  [field: string]: string | string[] | undefined
}
