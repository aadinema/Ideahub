/**
 * Skeleton primitives mirroring the real `.state` / list layout, so pages
 * loading their data do not jump when the content arrives.
 * Decorative only — the surrounding region should carry the busy semantics.
 */
export function SkeletonText({ width = '100%', className = '' }) {
  return <div className={`skeleton skeleton-text ${className}`} style={{ width }} />
}

export function SkeletonTitle({ width = '40%', className = '' }) {
  return <div className={`skeleton skeleton-title ${className}`} style={{ width }} />
}

export function SkeletonCircle({ size = 40, className = '' }) {
  return <div className={`skeleton skeleton-circle ${className}`} style={{ width: size, height: size }} />
}

/** Stacked list of `count` generic card placeholders. */
export function SkeletonList({ count = 3, rows = 2, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} rows={rows} />
      ))}
    </div>
  )
}

/** Stacked row placeholders matching a table/list rhythm. */
export function SkeletonRows({ count = 5, heightClass = 'h-12', className = '' }) {
  return (
    <div className={`space-y-3 ${className}`} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`skeleton rounded-lg ${heightClass}`} />
      ))}
    </div>
  )
}

/** Generic card-shaped placeholder. `rows` controls how many text lines. */
export default function Skeleton({ rows = 3, className = '' }) {
  return (
    <div className={`glass rounded-xl p-4 space-y-3 ${className}`} aria-hidden="true">
      <SkeletonCircle size={32} />
      <SkeletonTitle />
      {Array.from({ length: rows }, (_, i) => (
        <SkeletonText key={i} width={i === rows - 1 ? '60%' : '100%'} />
      ))}
    </div>
  )
}
