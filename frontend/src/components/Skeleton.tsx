// Skeleton shimmer placeholder for loading states

export function SkeletonLine({ width = '100%', height = '16px' }: { width?: string; height?: string }) {
  return <div className="skeleton-line" style={{width, height}} />;
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <div className="skeleton-card">
      <SkeletonLine height="20px" width="60%" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <SkeletonLine key={i} width={i % 2 === 0 ? '90%' : '75%'} />
      ))}
    </div>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        // eslint-disable-next-line react/no-array-index-key
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
