// Prices in the data files are display strings like "₱500" (or a range
// "₱200 – ₱400"). This pulls a usable number back out of the first
// one, and formats numbers back the same way.
export function parsePesoToNumber(priceString) {
  if (!priceString) return 0;
  const match = priceString.replace(/,/g, '').match(/[\d.]+/);
  return match ? Number(match[0]) : 0;
}

export function formatPeso(amount) {
  return `₱${Math.round(amount).toLocaleString('en-PH')}`;
}
