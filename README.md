# Price Slice

Price Slice is a mobile-first React web app for quickly calculating discount totals while shopping.

## Features

- Live discount math with quantity support
- Optional tax calculations
- Optional `$ off` and `% off` coupon calculations
- Numeric parser tolerates values like `25%`, `$5`, and `7,25` (comma decimal)
- Clear results card with subtotal, discount, tax, total, and savings
- One-tap copy breakdown for Notes/messages with local timestamp
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
- Numeric fields initialize to real `0` values (not placeholder hints), with quantity starting at `1`.
- Reset sets numeric fields back to `0`, quantity to `1`, `includeTax` to off, and collapses Advanced.

## Manual Test Cases

1. `price=100`, `discount=20`, `qty=2`, `tax=7.25`, `coupon=0`
   - Subtotal: `$200.00`
   - Discount: `$40.00`
   - After discount: `$160.00`
   - Tax: `$11.60`
   - Total: `$171.60`
   - Savings: `$40.00 (20.00%)`

2. `price=49.99`, `discount=25`, `qty=2`, `coupon=5`, `tax=7.25`
   - Subtotal: `$99.98`
   - Discount: `$25.00` (rounded display)
   - After discount: `$74.99`
   - Coupon: `$5.00`
   - Tax: `$5.07`
   - Total: `$75.06`
   - Savings: `$30.00 (30.00%)`

3. Negative clamping behavior
   - Negative price, discount, tax, and coupon values are clamped to `0`
   - Quantity values below `1` are clamped to `1`
