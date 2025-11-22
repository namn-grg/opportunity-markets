export function formatPenalty(penaltyBps: number) {
  return `${penaltyBps / 100}% NO penalty`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export function windowCopy(opportunityWindowEnd: string) {
  const date = new Date(opportunityWindowEnd);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  if (diff <= 0) return 'Opportunity window closed';
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  if (days > 0) return `${days}d ${hours % 24}h left`;
  return `${hours}h left`;
}
