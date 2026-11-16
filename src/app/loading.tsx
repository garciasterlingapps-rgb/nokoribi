export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-line border-t-accent" />
          <span className="absolute inset-0 flex items-center justify-center text-2xl">
            🍕
          </span>
        </div>
        <p className="text-sm font-medium text-muted">Cargando…</p>
      </div>
    </div>
  );
}
