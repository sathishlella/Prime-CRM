export function matchesFilters(
  title: string,
  filters: { positive: string[]; negative: string[] }
): boolean {
  const lower = title.toLowerCase();

  // Must match at least one positive keyword
  const hasPositive =
    filters.positive.length === 0 ||
    filters.positive.some((kw) => lower.includes(kw.toLowerCase()));

  // Must NOT match any negative keyword
  const hasNegative = filters.negative.some((kw) =>
    lower.includes(kw.toLowerCase())
  );

  return hasPositive && !hasNegative;
}
