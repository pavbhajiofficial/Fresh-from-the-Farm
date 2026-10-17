const MAP: Record<string, [string, string]> = {
  Placed: ['warn', '⏳'], Confirmed: ['ok', '✔'], Preparing: ['ok', '🌱'], Ready: ['ok', '📦'], Completed: ['ok', '✔'],
  Rejected: ['bad', '✖'], Active: ['ok', '✔'], 'Sold Out': ['bad', '✖'], Draft: ['warn', '✎'],
};
/** Status is always text plus an icon, never colour alone. */
export default function Badge({ status }: { status: string }) {
  const [cls, icon] = MAP[status] ?? ['', ''];
  return <span className={`badge ${cls}`}>{icon} {status}</span>;
}
