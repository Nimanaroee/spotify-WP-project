import { describe, expect, it } from 'vitest'
import { getMainNavForRole } from './navItems'
import { ROLES } from './roles'
import { ROUTES } from './routes'

describe('getMainNavForRole', () => {
  it('includes artist studio for artists only', () => {
    const artistNav = getMainNavForRole(ROLES.ARTIST, 'demo_artist', 'en')
    const listenerNav = getMainNavForRole(ROLES.LISTENER, 'demo_listener', 'en')

    expect(artistNav.some((item) => item.path === ROUTES.ARTIST_STUDIO)).toBe(true)
    expect(listenerNav.some((item) => item.path === ROUTES.ARTIST_STUDIO)).toBe(false)
  })

  it('includes admin panel for support staff', () => {
    const supportNav = getMainNavForRole(ROLES.SUPPORT, 'support_agent', 'en')

    expect(supportNav.some((item) => item.path === ROUTES.ADMIN_TICKETS)).toBe(true)
    expect(supportNav.some((item) => item.path === ROUTES.ARTIST_STUDIO)).toBe(false)
  })
})
