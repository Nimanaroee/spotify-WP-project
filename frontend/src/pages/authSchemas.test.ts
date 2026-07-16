import { describe, expect, it } from 'vitest'
import {
  artistRegistrationSchema,
  listenerRegistrationSchema,
  parsePortfolioLinks,
} from './authSchemas'

describe('authSchemas', () => {
  it('requires matching passwords for listener registration', () => {
    const result = listenerRegistrationSchema.safeParse({
      display_name: 'Listener',
      email: 'listener@example.com',
      password: 'password123',
      password_confirmation: 'password456',
      birth_date: '2000-01-01',
      gender: 'male',
      privacy_policy_accepted: true,
    })

    expect(result.success).toBe(false)
  })

  it('requires privacy policy acceptance for listener registration', () => {
    const result = listenerRegistrationSchema.safeParse({
      display_name: 'Listener',
      email: 'listener@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      birth_date: '2000-01-01',
      gender: 'male',
      privacy_policy_accepted: false,
    })

    expect(result.success).toBe(false)
  })

  it('accepts artist registration data with non-empty portfolio links', () => {
    const result = artistRegistrationSchema.safeParse({
      email: 'artist@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      stage_name: 'The Artist',
      portfolio_links: 'my portfolio handle',
    })

    expect(result.success).toBe(true)
  })

  it('parses comma and newline separated portfolio links', () => {
    expect(parsePortfolioLinks('https://one.test, https://two.test\nhttps://three.test')).toEqual([
      'https://one.test',
      'https://two.test',
      'https://three.test',
    ])
  })
})
