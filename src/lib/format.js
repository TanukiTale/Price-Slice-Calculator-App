export function formatUSD(value) {
  const safe = Number.isFinite(value) ? value : 0;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(safe);
}

export function formatPercent(value, digits = 2) {
  const safe = Number.isFinite(value) ? value : 0;
  return `${safe.toFixed(digits)}%`;
}

export function formatTimestampLocal(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const rawHours = date.getHours();
  const period = rawHours >= 12 ? 'PM' : 'AM';
  const hours = rawHours % 12 || 12;

  return `${year}-${month}-${day} ${hours}:${minutes} ${period}`;
}

function formatRate(value) {
  const safe = Number.isFinite(value) ? value : 0;
  return Number.isInteger(safe) ? `${safe}%` : `${safe.toFixed(2)}%`;
}

export function buildBreakdownText({ inputs, results }) {
  const lines = [
    `Price Slice — ${formatTimestampLocal()}`,
    `Original price: ${formatUSD(inputs.price)}`,
    `Quantity: ${inputs.quantity}`,
    `Subtotal: ${formatUSD(results.subtotal)}`,
    `Discount: ${formatRate(inputs.discountPercent)} (-${formatUSD(results.discountAmount)})`,
    `After discount: ${formatUSD(results.afterDiscount)}`
  ];

  if (inputs.couponType === '$off') {
    lines.push(`Coupon: -${formatUSD(results.couponApplied)}`);
  } else if (inputs.couponType === '%off') {
    lines.push(`Coupon: ${formatRate(inputs.couponPercent)} (-${formatUSD(results.couponApplied)})`);
  }

  if (inputs.includeTax) {
    lines.push(`Tax: ${formatRate(inputs.taxRate)} (+${formatUSD(results.taxAmount)})`);
  }

  lines.push(`Total: ${formatUSD(results.total)}`);
  lines.push(`You save: ${formatUSD(results.savings)} (${formatPercent(results.savingsPercent)})`);

  return lines.join('\n');
}
