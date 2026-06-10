export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-zinc-800/80 animate-pulse rounded-md ${className}`} />;
}
