import { describe, expect, it } from 'vitest';
import { calculatePriceSlice, sanitizeInputs, toNumberOrZero } from './calc';

describe('calculatePriceSlice', () => {
  it('computes case 1: 100 price, 20% discount, qty 2, 7.25% tax, no coupon', () => {
    const inputs = sanitizeInputs({
      price: 100,
      discountPercent: 20,
      quantity: 2,
      includeTax: true,
      taxRate: 7.25,
      additionalDiscountPercent: 0,
      couponAmount: 0
    });

    const result = calculatePriceSlice(inputs);

    expect(result.subtotal).toBe(200);
    expect(result.discountAmount).toBe(40);
    expect(result.afterDiscount).toBe(160);
    expect(result.couponApplied).toBe(0);
    expect(result.taxAmount).toBe(11.6);
    expect(result.total).toBe(171.6);
    expect(result.savings).toBe(40);
    expect(result.savingsPercent).toBe(20);
  });

  it('computes case 2: 49.99 price, 25% discount, qty 2, $5 coupon, 7.25% tax', () => {
    const inputs = sanitizeInputs({
      price: 49.99,
      discountPercent: 25,
      quantity: 2,
      includeTax: true,
      taxRate: 7.25,
      additionalDiscountPercent: 0,
      couponAmount: 5
    });

    const result = calculatePriceSlice(inputs);

    expect(result.subtotal).toBe(99.98);
    expect(result.discountAmount).toBe(24.995);
    expect(result.afterDiscount).toBe(74.985);
    expect(result.couponApplied).toBe(5);
    expect(result.afterCoupon).toBe(69.985);
    expect(result.taxAmount).toBe(5.0739125);
    expect(result.total).toBe(75.0589125);
    expect(result.savings).toBe(29.995000000000005);
    expect(result.savingsPercent).toBe(30.00100020004001);
  });

  it('clamps negatives and enforces minimum quantity of 1', () => {
    const inputs = sanitizeInputs({
      price: -10,
      discountPercent: -15,
      quantity: 0,
      includeTax: true,
      taxRate: -8,
      additionalDiscountPercent: -5,
      couponAmount: -7
    });

    expect(inputs.price).toBe(0);
    expect(inputs.discountPercent).toBe(0);
    expect(inputs.quantity).toBe(1);
    expect(inputs.taxRate).toBe(0);
    expect(inputs.additionalDiscountPercent).toBe(0);
    expect(inputs.couponAmount).toBe(0);

    const result = calculatePriceSlice(inputs);
    expect(result.subtotal).toBe(0);
    expect(result.total).toBe(0);
    expect(result.savingsPercent).toBe(0);
  });

  it('applies additional percent discount and coupon amount together', () => {
    const inputs = sanitizeInputs({
      price: 1500,
      discountPercent: 40,
      quantity: 1,
      includeTax: true,
      taxRate: 8,
      additionalDiscountPercent: 10,
      couponAmount: 25
    });

    const result = calculatePriceSlice(inputs);

    expect(result.subtotal).toBe(1500);
    expect(result.discountAmount).toBe(600);
    expect(result.afterDiscount).toBe(900);
    expect(result.additionalDiscountAmount).toBe(90);
    expect(result.afterAdditionalDiscount).toBe(810);
    expect(result.couponApplied).toBe(25);
    expect(result.afterCoupon).toBe(785);
    expect(result.taxAmount).toBeCloseTo(62.8, 10);
    expect(result.total).toBeCloseTo(847.8, 10);
  });

  it('applies additional percent off after the base discount (not on original subtotal)', () => {
    const inputs = sanitizeInputs({
      price: 200,
      discountPercent: 25,
      quantity: 1,
      includeTax: false,
      taxRate: 0,
      additionalDiscountPercent: 10,
      couponAmount: 0
    });

    const result = calculatePriceSlice(inputs);

    // If applied correctly: afterDiscount = 150, additional = 15
    expect(result.afterDiscount).toBe(150);
    expect(result.additionalDiscountAmount).toBe(15);
    expect(result.afterAdditionalDiscount).toBe(135);
  });

  it('floors at zero before tax when coupon exceeds remaining amount', () => {
    const inputs = sanitizeInputs({
      price: 50,
      discountPercent: 0,
      quantity: 1,
      includeTax: true,
      taxRate: 8,
      additionalDiscountPercent: 20,
      couponAmount: 100
    });

    const result = calculatePriceSlice(inputs);

    // afterAdditionalDiscount = 40, coupon should not create negative taxable base
    expect(result.afterAdditionalDiscount).toBe(40);
    expect(result.afterCoupon).toBe(0);
    expect(result.taxAmount).toBe(0);
    expect(result.total).toBe(0);
  });

  it('parses common mobile-friendly numeric text formats', () => {
    expect(toNumberOrZero('$49.99')).toBe(49.99);
    expect(toNumberOrZero('25%')).toBe(25);
    expect(toNumberOrZero('7,25')).toBe(7.25);
    expect(toNumberOrZero('1,234.50')).toBe(1234.5);
  });
});
