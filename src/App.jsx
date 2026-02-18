import { useEffect, useMemo, useState } from 'react';
import { calculatePriceSlice, sanitizeInputs } from './lib/calc';
import { formatPercent, formatUSD } from './lib/format';

const STORAGE_KEYS = {
  theme: 'priceSlice.theme',
  includeTax: 'priceSlice.includeTax',
  taxRate: 'priceSlice.taxRate',
  advancedOpen: 'priceSlice.advancedOpen'
};

const COMMON_PERCENT_STOPS = [0, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 100];
const COMMON_DOLLAR_STOPS = [0, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 125, 150, 200, 250, 300, 400, 500, 750, 1000];
const DISCOUNT_PRESETS = [0, 10, 15, 20, 25, 40, 50];
const TAX_PRESETS = [0, 5, 6, 7.25, 8, 9, 10];

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

function clampWhole(value, min, max) {
  const numeric = Math.round(Number(normalizeDecimalInput(String(value))) || 0);
  return Math.min(max, Math.max(min, numeric));
}

function snapToCommon(value, stops, threshold) {
  let snapped = value;
  let nearestDistance = Infinity;

  for (const stop of stops) {
    const distance = Math.abs(value - stop);
    if (distance <= threshold && distance < nearestDistance) {
      snapped = stop;
      nearestDistance = distance;
    }
  }

  return snapped;
}

function formatPresetPercent(value) {
  const fixed = Number.isInteger(value) ? String(value) : value.toFixed(2);
  return `${fixed.replace(/\.?0+$/, '')}%`;
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [priceInput, setPriceInput] = useState('0');
  const [discountInput, setDiscountInput] = useState('0');
  const [showCustomDiscount, setShowCustomDiscount] = useState(false);
  const [includeTax, setIncludeTax] = useState(() => getStoredBoolean(STORAGE_KEYS.includeTax, false));
  const [taxRateInput, setTaxRateInput] = useState(() => {
    const saved = getStoredString(STORAGE_KEYS.taxRate, '0');
    return saved === '' ? '0' : saved;
  });
  const [additionalDiscountInput, setAdditionalDiscountInput] = useState('0');
  const [couponAmountInput, setCouponAmountInput] = useState('0');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(() => getStoredBoolean(STORAGE_KEYS.advancedOpen, false));

  const normalizedInputs = useMemo(
    () =>
      sanitizeInputs({
        price: priceInput,
        discountPercent: discountInput,
        quantity: 1,
        includeTax,
        taxRate: taxRateInput,
        additionalDiscountPercent: additionalDiscountInput,
        couponAmount: couponAmountInput,
      }),
    [priceInput, discountInput, includeTax, taxRateInput, additionalDiscountInput, couponAmountInput]
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

  function handleReset() {
    setPriceInput('0');
    setDiscountInput('0');
    setShowCustomDiscount(false);
    setAdditionalDiscountInput('0');
    setCouponAmountInput('0');
    setTaxRateInput('0');
    setIncludeTax(false);
    setIsAdvancedOpen(false);
  }

  const syncInputValue = (setter) => (event) => setter(normalizeDecimalInput(event.target.value));

  const selectDefaultOnFocus = (defaultValue) => (event) => {
    if (event.target.value === defaultValue) {
      event.target.select();
    }
  };
  const selectAllOnFocus = (event) => {
    const target = event.target;
    window.setTimeout(() => target.select(), 0);
  };

  const handlePriceInput = syncInputValue(setPriceInput);
  const handleDiscountSlider = (event) => {
    const raw = clampWhole(event.target.value, 0, 100);
    const next = snapToCommon(raw, COMMON_PERCENT_STOPS, 2);
    setShowCustomDiscount(true);
    setDiscountInput(String(next));
  };
  const handleDiscountValueInput = (event) => {
    const next = clampWhole(event.target.value, 0, 100);
    setShowCustomDiscount(true);
    setDiscountInput(String(next));
  };
  const handleAdditionalDiscountSlider = (event) => {
    const raw = clampWhole(event.target.value, 0, 100);
    const next = snapToCommon(raw, COMMON_PERCENT_STOPS, 2);
    setAdditionalDiscountInput(String(next));
  };
  const handleAdditionalDiscountValueInput = (event) => {
    const next = clampWhole(event.target.value, 0, 100);
    setAdditionalDiscountInput(String(next));
  };
  const handleTaxRateInput = syncInputValue(setTaxRateInput);
  const handleCouponSlider = (event) => {
    const raw = clampWhole(event.target.value, 0, couponSliderMax);
    const dynamicStops = COMMON_DOLLAR_STOPS.filter((amount) => amount <= couponSliderMax);
    if (!dynamicStops.includes(couponSliderMax)) {
      dynamicStops.push(couponSliderMax);
    }

    const threshold = couponSliderMax <= 100 ? 1 : couponSliderMax <= 300 ? 2 : 5;
    const next = snapToCommon(raw, dynamicStops, threshold);
    setCouponAmountInput(String(next));
  };
  const handleCouponValueInput = (event) => {
    const next = clampWhole(event.target.value, 0, couponSliderMax);
    setCouponAmountInput(String(next));
  };
  const selectZeroOnFocus = selectDefaultOnFocus('0');
  const displayedTaxRate = includeTax ? normalizedInputs.taxRate : 0;
  const discountPercent = Math.round(normalizedInputs.discountPercent);
  const additionalDiscountPercent = Math.round(normalizedInputs.additionalDiscountPercent);
  const couponSliderMax = Math.max(0, Math.ceil(results.afterAdditionalDiscount));
  const couponSliderValue = Math.round(normalizedInputs.couponAmount);
  const isDiscountPresetSelected = DISCOUNT_PRESETS.includes(discountPercent);

  const handleDiscountPreset = (preset) => {
    setShowCustomDiscount(false);
    setDiscountInput(String(preset));
  };

  const handleTaxPreset = (preset) => {
    setTaxRateInput(String(preset));
    setIncludeTax(preset > 0);
  };

  useEffect(() => {
    if (Number(couponAmountInput) > couponSliderMax) {
      setCouponAmountInput(String(couponSliderMax));
    }
  }, [couponAmountInput, couponSliderMax]);

  return (
    <div className="app-shell">
      <main className="calculator" aria-label="Price Slice discount calculator">
        <header className="app-header panel">
          <div className="brand-block">
            <div className="logo-mark" aria-hidden="true" />
            <div>
              <p className="kicker">Mobile savings helper</p>
              <h1 className="brand-title">Price Slice</h1>
            </div>
          </div>

          <div className="theme-control">
            <div className="theme-toggle" role="group" aria-label="Theme">
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
            <label htmlFor={showCustomDiscount ? 'discount' : undefined}>Discount (%)</label>
            <div className="preset-row" aria-label="Discount presets">
              {DISCOUNT_PRESETS.map((preset) => (
                <button
                  key={`discount-${preset}`}
                  type="button"
                  className={`preset-chip ${!showCustomDiscount && discountPercent === preset ? 'active' : ''}`}
                  onClick={() => handleDiscountPreset(preset)}
                  aria-pressed={!showCustomDiscount && discountPercent === preset}
                >
                  {preset}%
                </button>
              ))}
              <button
                type="button"
                className={`preset-chip ${showCustomDiscount || !isDiscountPresetSelected ? 'active' : ''}`}
                onClick={() => setShowCustomDiscount((current) => !current)}
                aria-pressed={showCustomDiscount || !isDiscountPresetSelected}
              >
                Custom
              </button>
            </div>

            {showCustomDiscount ? (
              <>
                <div className="slider-field">
                  <input
                    id="discount"
                    type="range"
                    inputMode="decimal"
                    min="0"
                    max="100"
                    step="1"
                    value={discountPercent}
                    onChange={handleDiscountSlider}
                    onInput={handleDiscountSlider}
                  />
                  <div className="slider-value">
                    <input
                      className="slider-value-input"
                      aria-label="Discount percent value"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={discountPercent}
                      onChange={handleDiscountValueInput}
                      onInput={handleDiscountValueInput}
                      onFocus={selectAllOnFocus}
                    />
                  </div>
                </div>
                <div className="slider-scale" aria-hidden="true">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </>
            ) : null}
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
            Advanced discounts
            <span className={`chevron ${isAdvancedOpen ? 'open' : ''}`} aria-hidden="true">
              ▾
            </span>
          </button>

          <div id="advanced-settings" className={`advanced-panel ${isAdvancedOpen ? 'open' : ''}`}>
            <div className="advanced-panel-inner">
              <div className="field-group">
                <label htmlFor="additional-discount-slider">Additional percent off (%)</label>
                <div className="slider-field">
                  <input
                    id="additional-discount-slider"
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={additionalDiscountPercent}
                    onChange={handleAdditionalDiscountSlider}
                    onInput={handleAdditionalDiscountSlider}
                  />
                  <div className="slider-value">
                    <input
                      className="slider-value-input"
                      aria-label="Additional percent off value"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      value={additionalDiscountPercent}
                      onChange={handleAdditionalDiscountValueInput}
                      onInput={handleAdditionalDiscountValueInput}
                      onFocus={selectAllOnFocus}
                    />
                  </div>
                </div>
                <div className="slider-scale" aria-hidden="true">
                  <span>0%</span>
                  <span>100%</span>
                </div>
              </div>

              <div className="field-group">
                <label htmlFor="coupon-amount-slider">Coupon amount off ($)</label>
                <div className="slider-field">
                  <input
                    id="coupon-amount-slider"
                    type="range"
                    min="0"
                    max={couponSliderMax}
                    step="1"
                    value={couponSliderValue}
                    onChange={handleCouponSlider}
                    onInput={handleCouponSlider}
                  />
                  <div className="slider-value">
                    <input
                      className="slider-value-input"
                      aria-label="Coupon amount off value"
                      type="number"
                      min="0"
                      max={couponSliderMax}
                      step="1"
                      value={couponSliderValue}
                      onChange={handleCouponValueInput}
                      onInput={handleCouponValueInput}
                      onFocus={selectAllOnFocus}
                    />
                  </div>
                </div>
                <div className="slider-scale" aria-hidden="true">
                  <span>$0</span>
                  <span>{formatUSD(couponSliderMax)}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="panel">
          <h2>Sales tax</h2>
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
            <div className="preset-row" aria-label="Tax presets">
              {TAX_PRESETS.map((preset) => {
                const isActive = includeTax && Math.abs(normalizedInputs.taxRate - preset) < 0.001;
                return (
                  <button
                    key={`tax-${preset}`}
                    type="button"
                    className={`preset-chip ${isActive ? 'active' : ''}`}
                    onClick={() => handleTaxPreset(preset)}
                    aria-pressed={isActive}
                  >
                    {formatPresetPercent(preset)}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="panel results-card" aria-live="polite">
          <h2>Results</h2>
          <div className="headline-total">
            <p>Total after tax</p>
            <strong>{formatUSD(results.total)}</strong>
          </div>
          <p className="savings-summary">
            You save {formatUSD(results.savings)} ({formatPercent(results.savingsPercent)})
          </p>

          <details className="breakdown-dropdown">
            <summary>Calculation breakdown</summary>
            <dl className="results-list">
              <div>
                <dt>Unit price</dt>
                <dd>{formatUSD(normalizedInputs.price)}</dd>
              </div>
              <div>
                <dt>Extended price</dt>
                <dd>{formatUSD(results.subtotal)}</dd>
              </div>
              <div>
                <dt>Discount percentage</dt>
                <dd>{formatPercent(discountPercent, 0)}</dd>
              </div>
              <div>
                <dt>Discounted amount</dt>
                <dd>-{formatUSD(results.discountAmount)}</dd>
              </div>
              <div>
                <dt>Subtotal after discount</dt>
                <dd>{formatUSD(results.afterDiscount)}</dd>
              </div>
              <div>
                <dt>Additional percent off</dt>
                <dd>{formatPercent(additionalDiscountPercent, 0)}</dd>
              </div>
              <div>
                <dt>Additional discount amount</dt>
                <dd>-{formatUSD(results.additionalDiscountAmount)}</dd>
              </div>
              <div>
                <dt>Subtotal after additional discount</dt>
                <dd>{formatUSD(results.afterAdditionalDiscount)}</dd>
              </div>
              <div>
                <dt>Coupon total amount</dt>
                <dd>-{formatUSD(results.couponApplied)}</dd>
              </div>
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
            </dl>
          </details>
        </section>

        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={handleReset}>
            Reset
          </button>
        </div>
      </main>
    </div>
  );
}

export default App;
