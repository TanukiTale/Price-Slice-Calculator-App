export function toNumberOrZero(value) {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const trimmed = String(value).trim();
  if (trimmed === '') {
    return 0;
  }

  let normalized = trimmed.replace(/\s+/g, '').replace(/[$%]/g, '');

  const hasDot = normalized.includes('.');
  const hasComma = normalized.includes(',');

  if (hasComma && hasDot) {
    if (normalized.lastIndexOf(',') > normalized.lastIndexOf('.')) {
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = normalized.replace(/,/g, '');
    }
  } else if (hasComma && !hasDot) {
    const parts = normalized.split(',');
    if (parts.length === 2 && parts[1] !== '' && parts[1].length <= 2) {
      normalized = `${parts[0]}.${parts[1]}`;
    } else {
      normalized = normalized.replace(/,/g, '');
    }
  }

  normalized = normalized.replace(/[^0-9.+-]/g, '');
  if (normalized === '' || normalized === '+' || normalized === '-' || normalized === '.' || normalized === '-.') {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function clampNonNegative(value) {
  return Math.max(0, toNumberOrZero(value));
}

export function normalizeQuantity(value) {
  const parsed = Math.floor(clampNonNegative(value));
  return parsed >= 1 ? parsed : 1;
}

export function sanitizeInputs(raw = {}) {
  const couponType = raw.couponType === '$off' || raw.couponType === '%off' ? raw.couponType : 'none';

  return {
    price: clampNonNegative(raw.price),
    discountPercent: clampNonNegative(raw.discountPercent),
    quantity: normalizeQuantity(raw.quantity),
    includeTax: Boolean(raw.includeTax),
    taxRate: clampNonNegative(raw.taxRate),
    couponType,
    couponAmount: couponType === '$off' ? clampNonNegative(raw.couponAmount) : 0,
    couponPercent: couponType === '%off' ? clampNonNegative(raw.couponPercent) : 0
  };
}

export function calculatePriceSlice(input = {}) {
  const sanitized = sanitizeInputs(input);
  const subtotal = sanitized.price * sanitized.quantity;
  const discountAmount = subtotal * (sanitized.discountPercent / 100);
  const afterDiscount = subtotal - discountAmount;
  const couponApplied =
    sanitized.couponType === '$off'
      ? sanitized.couponAmount
      : sanitized.couponType === '%off'
        ? afterDiscount * (sanitized.couponPercent / 100)
        : 0;
  const afterCoupon = Math.max(0, afterDiscount - couponApplied);
  const taxAmount = sanitized.includeTax ? afterCoupon * (sanitized.taxRate / 100) : 0;
  const total = afterCoupon + taxAmount;
  const savings = subtotal - afterCoupon;
  const savingsPercent = subtotal > 0 ? (savings / subtotal) * 100 : 0;

  return {
    subtotal,
    discountAmount,
    afterDiscount,
    couponApplied,
    afterCoupon,
    taxAmount,
    total,
    savings,
    savingsPercent
  };
}
