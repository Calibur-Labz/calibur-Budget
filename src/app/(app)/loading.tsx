export default function Loading() {
  return (
    <div className="animate-pulse space-y-4 pt-2" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-40 rounded-full bg-surface-2" />
      <div className="h-40 rounded-3xl bg-surface-2" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 rounded-2xl bg-surface-2" />
        <div className="h-20 rounded-2xl bg-surface-2" />
      </div>
      <div className="h-56 rounded-3xl bg-surface-2" />
    </div>
  );
}
