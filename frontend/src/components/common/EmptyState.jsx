import React from 'react'

/**
 * EmptyState — generic empty state component
 */
export default function EmptyState({ title = 'Nothing here' }) {
  return <div className="p-6 text-gray-500">{title}</div>
}
