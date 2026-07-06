export default function EmptyState({ title = 'Nothing here' }: { title?: string }) {
  return <div className="p-6 text-gray-500">{title}</div>
}
