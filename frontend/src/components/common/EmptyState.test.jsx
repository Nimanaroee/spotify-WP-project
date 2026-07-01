import { render, screen } from '@testing-library/react'
import EmptyState from './EmptyState'

test('renders empty state', () => {
  render(<EmptyState title="No items" />)
  expect(screen.getByText('No items')).toBeTruthy()
})
