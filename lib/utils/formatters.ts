export function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) return "N/A";
  return score.toFixed(0);
}

export function getScoreBadgeColor(score: number | null | undefined): string {
  if (score === null || score === undefined) return "bg-gray-100 text-gray-700";
  if (score >= 80) return "bg-emerald-100 text-emerald-800 font-bold border border-emerald-300";
  if (score >= 60) return "bg-blue-100 text-blue-800 font-semibold border border-blue-300";
  if (score >= 40) return "bg-amber-100 text-amber-800 border border-amber-300";
  return "bg-rose-100 text-rose-800 border border-rose-300";
}

export function formatCountry(countryCode: string | null | undefined): string {
  if (!countryCode) return "Global";
  return countryCode.toUpperCase();
}

export function formatCurrency(amount: number | null | undefined, currency: string = "USD"): string {
  if (!amount) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
