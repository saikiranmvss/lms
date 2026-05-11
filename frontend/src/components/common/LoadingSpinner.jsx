import clsx from 'clsx';

export function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={clsx('animate-spin rounded-full border-2 border-slate-200 border-t-primary-600', sizes[size], className)} />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <LoadingSpinner size="lg" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card overflow-hidden animate-pulse">
      <div className="aspect-video skeleton" />
      <div className="p-4 space-y-3">
        <div className="skeleton h-3 w-1/4 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-3 w-1/2 rounded" />
        <div className="skeleton h-5 w-1/3 rounded mt-2" />
      </div>
    </div>
  );
}

export function StatSkeleton() {
  return (
    <div className="card p-6 animate-pulse">
      <div className="skeleton h-4 w-1/2 rounded mb-3" />
      <div className="skeleton h-8 w-1/3 rounded" />
    </div>
  );
}
