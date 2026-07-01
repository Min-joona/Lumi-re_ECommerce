export default function Loader({ label = 'Loading…' }) {
  return (
    <div className="grid place-items-center py-24">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-ink/15 border-t-gold" />
      <p className="mt-4 text-sm text-ink/50">{label}</p>
    </div>
  );
}
