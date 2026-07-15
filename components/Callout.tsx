/**
 * Designed aside for a notable finding: an eyebrow naming the question the
 * reader is about to ask, a one-sentence headline, and the mechanism. Placed
 * adjacent to the chart it explains.
 */
export function Callout({
  eyebrow,
  headline,
  children,
}: {
  eyebrow: string
  headline: string
  children: React.ReactNode
}) {
  return (
    <aside className="rounded-r-lg border-l-4 border-primary-500 bg-teal-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">
        {eyebrow}
      </p>
      <p className="mt-1 font-semibold text-gray-900">{headline}</p>
      <div className="mt-1 text-sm text-gray-700">{children}</div>
    </aside>
  )
}
