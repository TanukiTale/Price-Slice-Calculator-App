import { useEffect, useMemo, useState } from 'react';
import { calculatePriceSlice, sanitizeInputs } from './lib/calc';
import { buildBreakdownText, formatPercent, formatUSD } from './lib/format';

const STORAGE_KEYS = {
  theme: 'priceSlice.theme',
  includeTax: 'priceSlice.includeTax',
  taxRate: 'priceSlice.taxRate',
  advancedOpen: 'priceSlice.advancedOpen'
};

function getStoredBoolean(key, fallback) {
  try {
    const saved = window.localStorage.getItem(key);
    if (saved === null) {
      return fallback;
    }

    return saved === 'true';
  } catch {
    return fallback;
  }
}

function getStoredString(key, fallback = '') {
  try {
    const saved = window.localStorage.getItem(key);
    return saved === null ? fallback : saved;
  } catch {
    return fallback;
  }
}

function getInitialTheme() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEYS.theme);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }

    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    return 'light';
  }

  return 'light';
}

function normalizeDecimalInput(value) {
  if (value.length > 1 && value.startsWith('0') && !value.startsWith('0.')) {
    const stripped = value.replace(/^0+/, '');
    return stripped === '' ? '0' : stripped;
  }

  return value;
}

function normalizeIntegerInput(value) {
  if (value.length > 1 && value.startsWith('0')) {
    const stripped = value.replace(/^0+/, '');
    return stripped === '' ? '0' : stripped;
  }

  return value;
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [priceInput, setPriceInput] = useState('0');
  const [discountInput, setDiscountInput] = useState('0');
  const [quantityInput, setQuantityInput] = useState('1');
  const [includeTax, setIncludeTax] = useState(() => getStoredBoolean(STORAGE_KEYS.includeTax, false));
  const [taxRateInput, setTaxRateInput] = useState(() => {
    const saved = getStoredString(STORAGE_KEYS.taxRate, '0');
    return saved === '' ? '0' : saved;
  });
  const [couponType, setCouponType] = useState('none');
  const [couponAmountInput, setCouponAmountInput] = useState('0');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(() => getStoredBoolean(STORAGE_KEYS.advancedOpen, false));
  const [copied, setCopied] = useState(false);

  const normalizedInputs = useMemo(
    () =>
      sanitizeInputs({
        price: priceInput,
        discountPercent: discountInput,
        quantity: quantityInput,
        includeTax,
        taxRate: taxRateInput,
        couponType,
        couponAmount: couponAmountInput,
        couponPercent: couponAmountInput
      }),
    [priceInput, discountInput, quantityInput, includeTax, taxRateInput, couponType, couponAmountInput]
  );

  const results = useMemo(() => calculatePriceSlice(normalizedInputs), [normalizedInputs]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    window.localStorage.setItem(STORAGE_KEYS.theme, theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.includeTax, String(includeTax));
  }, [includeTax]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.taxRate, taxRateInput);
  }, [taxRateInput]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEYS.advancedOpen, String(isAdvancedOpen));
  }, [isAdvancedOpen]);

  useEffect(() => {
    if (!copied) {
      return undefined;
    }

    const timer = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function handleCopyBreakdown() {
    const text = buildBreakdownText({ inputs: normalizedInputs, results });

    try {
      await window.navigator.clipboard.writeText(text);
      setCopied(true);
    } catch (error) {
      console.error('Clipboard copy failed:', error);
    }
  }

  function handleReset() {
    setPriceInput('0');
    setDiscountInput('0');
    setQuantityInput('1');
    setCouponType('none');
    setCouponAmountInput('0');
    setTaxRateInput('0');
    setIncludeTax(false);
    setIsAdvancedOpen(false);
    setCopied(false);
  }

  const couponEnabled = couponType !== 'none';
  const couponIsPercent = couponType === '%off';
  const syncInputValue =
    (setter, { integer = false } = {}) =>
    (event) => {
      const rawValue = event.target.value;
      const nextValue = integer ? normalizeIntegerInput(rawValue) : normalizeDecimalInput(rawValue);
      setter(nextValue);
    };

  const selectDefaultOnFocus = (defaultValue) => (event) => {
    if (event.target.value === defaultValue) {
      event.target.select();
    }
  };

  const handlePriceInput = syncInputValue(setPriceInput);
  const handleDiscountInput = syncInputValue(setDiscountInput);
  const handleQuantityInput = syncInputValue(setQuantityInput, { integer: true });
  const handleTaxRateInput = syncInputValue(setTaxRateInput);
  const handleCouponAmountInput = syncInputValue(setCouponAmountInput);
  const selectZeroOnFocus = selectDefaultOnFocus('0');
  const selectOneOnFocus = selectDefaultOnFocus('1');
  const displayedTaxRate = includeTax ? normalizedInputs.taxRate : 0;

  return (
    <div className="app-shell">
      <main className="calculator" aria-label="Price Slice discount calculator">
        <header className="app-header panel">
          <div>
            <p className="kicker">Mobile savings helper</p>
            <h1>Price Slice</h1>
          </div>

          <div className="theme-control">
            <span id="theme-toggle-label">Light / Dark</span>
            <div className="theme-toggle" role="group" aria-labelledby="theme-toggle-label">
              <button
                type="button"
                className={theme === 'light' ? 'active' : ''}
                onClick={() => setTheme('light')}
                aria-pressed={theme === 'light'}
              >
                Light
              </button>
              <button
                type="button"
                className={theme === 'dark' ? 'active' : ''}
                onClick={() => setTheme('dark')}
                aria-pressed={theme === 'dark'}
              >
                Dark
              </button>
            </div>
          </div>
        </header>

        <section className="panel">
          <h2>Inputs</h2>
          <div className="field-group">
            <label htmlFor="price">Original price ($)</label>
            <input
              id="price"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={priceInput}
              onChange={handlePriceInput}
              onInput={handlePriceInput}
              onFocus={selectZeroOnFocus}
            />
          </div>

          <div className="field-group">
            <label htmlFor="discount">Discount (%)</label>
            <input
              id="discount"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={discountInput}
              onChange={handleDiscountInput}
              onInput={handleDiscountInput}
              onFocus={selectZeroOnFocus}
            />
          </div>

          <div className="field-group">
            <label htmlFor="quantity">Quantity</label>
            <input
              id="quantity"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              value={quantityInput}
              onChange={handleQuantityInput}
              onInput={handleQuantityInput}
              onFocus={selectOneOnFocus}
            />
          </div>
        </section>

        <section className="panel">
          <button
            type="button"
            className="advanced-toggle"
            onClick={() => setIsAdvancedOpen((current) => !current)}
            aria-expanded={isAdvancedOpen}
            aria-controls="advanced-settings"
          >
            Advanced
            <span className={`chevron ${isAdvancedOpen ? 'open' : ''}`} aria-hidden="true">
              ▾
            </span>
          </button>

          <div id="advanced-settings" className={`advanced-panel ${isAdvancedOpen ? 'open' : ''}`}>
            <div className="advanced-panel-inner">
              <div className="toggle-row">
                <label htmlFor="include-tax">Include sales tax</label>
                <input
                  id="include-tax"
                  className="switch"
                  type="checkbox"
                  checked={includeTax}
                  onChange={(event) => setIncludeTax(event.target.checked)}
                />
              </div>

              <div className={`field-group ${!includeTax ? 'field-disabled' : ''}`}>
                <label htmlFor="tax-rate">Sales tax rate (%)</label>
                <input
                  id="tax-rate"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  value={taxRateInput}
                  disabled={!includeTax}
                  onChange={handleTaxRateInput}
                  onInput={handleTaxRateInput}
                  onFocus={selectZeroOnFocus}
                />
              </div>

              <div className="field-group">
                <label htmlFor="coupon-type">Coupon</label>
                <select id="coupon-type" value={couponType} onChange={(event) => setCouponType(event.target.value)}>
                  <option value="none">None</option>
                  <option value="$off">$ off</option>
                  <option value="%off">% off</option>
                </select>
              </div>

              {couponEnabled ? (
                <div className="field-group">
                  <label htmlFor="coupon-amount">
                    {couponIsPercent ? 'Coupon percentage amount (%)' : 'Coupon amount ($)'}
                  </label>
                  <input
                    id="coupon-amount"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    value={couponAmountInput}
                    onChange={handleCouponAmountInput}
                    onInput={handleCouponAmountInput}
                    onFocus={selectZeroOnFocus}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="panel results-card" aria-live="polite">
          <h2>Results</h2>
          <dl className="results-list">
            <div>
              <dt>Unit price</dt>
              <dd>{formatUSD(normalizedInputs.price)}</dd>
            </div>
            <div>
              <dt>Quantity</dt>
              <dd>{normalizedInputs.quantity}</dd>
            </div>
            <div>
              <dt>Extended price</dt>
              <dd>{formatUSD(results.subtotal)}</dd>
            </div>
            <div>
              <dt>Discount percentage</dt>
              <dd>{formatPercent(normalizedInputs.discountPercent)}</dd>
            </div>
            <div>
              <dt>Discounted amount</dt>
              <dd>-{formatUSD(results.discountAmount)}</dd>
            </div>
            <div>
              <dt>Subtotal after discount</dt>
              <dd>{formatUSD(results.afterDiscount)}</dd>
            </div>
            {couponIsPercent ? (
              <div>
                <dt>Coupon percentage</dt>
                <dd>{formatPercent(normalizedInputs.couponPercent)}</dd>
              </div>
            ) : null}
            {couponEnabled ? (
              <div>
                <dt>Coupon total amount</dt>
                <dd>-{formatUSD(results.couponApplied)}</dd>
              </div>
            ) : null}
            <div>
              <dt>Total after coupon</dt>
              <dd>{formatUSD(results.afterCoupon)}</dd>
            </div>
            <div>
              <dt>Tax percentage</dt>
              <dd>{formatPercent(displayedTaxRate)}</dd>
            </div>
            <div>
              <dt>Tax amount</dt>
              <dd>{formatUSD(results.taxAmount)}</dd>
            </div>
            <div className="total-row">
              <dt>Total after tax</dt>
              <dd>{formatUSD(results.total)}</dd>
            </div>
          </dl>

          <p className="savings-summary">
            You save {formatUSD(results.savings)} ({formatPercent(results.savingsPercent)})
          </p>
        </section>

        <div className="actions">
          <button type="button" className="btn btn-primary" onClick={handleCopyBreakdown}>
            Copy breakdown
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleReset}>
            Reset
          </button>
        </div>
      </main>

      <div className={`toast ${copied ? 'show' : ''}`} role="status" aria-live="polite">
        Copied!
      </div>
    </div>
  );
}

export default App;
