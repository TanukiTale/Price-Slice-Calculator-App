# Price Slice

Price Slice is a mobile-first React web app for quickly calculating discount totals while shopping.

## Features

- Live discount math with a discount percentage slider
- Optional tax calculations
- Additional discount controls with two separate sliders:
  - Additional percent off
  - Coupon dollar amount off
- Numeric parser tolerates values like `25%`, `$5`, and `7,25` (comma decimal)
- Clear results card with always-visible total and savings
- Expandable calculation breakdown dropdown under Results
- Light/Dark theme toggle with persisted preference
- Local persistence for tax preferences and advanced panel state

## Run Locally

```bash
npm install
npm run dev
```

Vite will print a local URL (usually `http://localhost:5173`).

## Run Unit Tests

```bash
npm run test
```

## Project Layout

- `src/App.jsx`: main UI and state
- `src/lib/calc.js`: pure calculation and sanitization helpers
- `src/lib/format.js`: USD/percent/timestamp formatting and copy text builder
- `src/index.css`: global styles, CSS variables, light/dark themes

## Persistence

The app stores these values in `localStorage`:

- `priceSlice.theme`
- `priceSlice.includeTax`
- `priceSlice.taxRate`
- `priceSlice.advancedOpen`

Notes:

- If no saved theme exists, the app uses the device preference (`prefers-color-scheme`) and then allows manual override.
- Numeric fields initialize to real `0` values (not placeholder hints).
- Quantity is fixed at `1` in the current UI.
- Discount and additional-discount sliders use whole-number percentages.
- Reset sets numeric fields back to `0`, `includeTax` to off, and collapses Advanced.

## Manual Test Cases

1. `price=100`, `discount=20`, `tax=7.25`, `coupon=0` (quantity is fixed to `1`)
   - Extended price: `$100.00`
   - Discount: `$20.00`
   - Subtotal after discount: `$80.00`
   - Tax: `$5.80`
   - Total after tax: `$85.80`
   - Savings: `$20.00 (20.00%)`

2. `price=49.99`, `discount=25`, `additional %=10`, `coupon=$5`, `tax=7.25`
   - Extended price: `$49.99`
   - Discount: `$12.50` (rounded display)
   - Subtotal after discount: `$37.49`
   - Additional discount: `$3.75`
   - Subtotal after additional discount: `$33.74`
   - Coupon: `$5.00`
   - Tax: `$2.08`
   - Total after tax: `$30.82`
   - Savings: `$21.25 (42.50%)`

3. Negative clamping behavior
   - Negative price, discount, additional discount, tax, and coupon values are clamped to `0`
   - Quantity values below `1` are clamped to `1`
