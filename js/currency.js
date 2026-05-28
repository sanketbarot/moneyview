/* ============================================================
   AITOOLCOR MONEYWISE - CURRENCY
   File: js/currency.js
   Description: Currency formatting, symbols, conversion
   ============================================================ */

const CURRENCIES = {
    USD: { symbol: '$',   flag: '🇺🇸', name: 'US Dollar',        decimal: 2 },
    EUR: { symbol: '€',   flag: '🇪🇺', name: 'Euro',             decimal: 2 },
    GBP: { symbol: '£',   flag: '🇬🇧', name: 'British Pound',    decimal: 2 },
    INR: { symbol: '₹',   flag: '🇮🇳', name: 'Indian Rupee',     decimal: 0 },
    JPY: { symbol: '¥',   flag: '🇯🇵', name: 'Japanese Yen',     decimal: 0 },
    CAD: { symbol: 'C$',  flag: '🇨🇦', name: 'Canadian Dollar',  decimal: 2 },
    AUD: { symbol: 'A$',  flag: '🇦🇺', name: 'Australian Dollar',decimal: 2 },
    CHF: { symbol: 'Fr',  flag: '🇨🇭', name: 'Swiss Franc',      decimal: 2 },
    CNY: { symbol: '¥',   flag: '🇨🇳', name: 'Chinese Yuan',     decimal: 2 },
    BRL: { symbol: 'R$',  flag: '🇧🇷', name: 'Brazilian Real',   decimal: 2 }
};

/* ── GET CURRENT CURRENCY CODE ── */
function getCurrencyCode() {
    return (typeof Store !== 'undefined')
        ? Store.getCurrency()
        : 'USD';
}

/* ── GET CURRENCY INFO ── */
function getCurrencyInfo(code) {
    return CURRENCIES[code] || CURRENCIES['USD'];
}

/* ── FORMAT AMOUNT ── */
function fmt(amount, currencyCode) {
    const code    = currencyCode || getCurrencyCode();
    const info    = getCurrencyInfo(code);
    const abs     = Math.abs(Number(amount));
    const decimal = info.decimal;

    const formatted = abs.toLocaleString('en-US', {
        minimumFractionDigits: decimal,
        maximumFractionDigits: decimal
    });

    return info.symbol + formatted;
}

/* ── FORMAT WITH SIGN ── */
function fmtSigned(amount, currencyCode) {
    const formatted = fmt(amount, currencyCode);
    return amount >= 0 ? '+' + formatted : '-' + formatted;
}

/* ── ABBREVIATED FORMAT ── */
function fmtAbbr(amount, currencyCode) {
    const code = currencyCode || getCurrencyCode();
    const info = getCurrencyInfo(code);
    const abs  = Math.abs(amount);

    let value;
    if (abs >= 1000000) value = (abs / 1000000).toFixed(1) + 'M';
    else if (abs >= 1000) value = (abs / 1000).toFixed(1) + 'K';
    else value = abs.toFixed(info.decimal);

    return (amount < 0 ? '-' : '') + info.symbol + value;
}

/* ── GET SYMBOL ── */
function getCurrencySymbol(code) {
    return getCurrencyInfo(code || getCurrencyCode()).symbol;
}

/* ── POPULATE CURRENCY MODAL LIST ── */
function populateCurrencyList() {
    const list = document.getElementById('currencyList');
    if (!list) return;

    const current = getCurrencyCode();
    list.innerHTML = Object.entries(CURRENCIES).map(([code, info]) => `
        <div class="currency-item ${code === current ? 'active' : ''}"
             onclick="selectCurrency('${code}')">
            <span class="currency-flag">${info.flag}</span>
            <div class="currency-info">
                <span class="currency-code">${code}</span>
                <span class="currency-name">${info.name}</span>
            </div>
            <span class="currency-symbol">${info.symbol}</span>
            ${code === current
                ? '<i class="fas fa-check" style="color:var(--primary);margin-left:auto;"></i>'
                : ''}
        </div>
    `).join('');
}

/* ── SELECT CURRENCY ── */
function selectCurrency(code) {
    Store.updateSettings({ currency: code });
    closeModal('currencyModal');
    updateCurrencyDisplay();
    refreshCurrentPage();
    Toast.success(`Currency changed to ${code}`);
}

/* ── UPDATE TOPBAR CURRENCY DISPLAY ── */
function updateCurrencyDisplay() {
    const code = getCurrencyCode();
    const info = getCurrencyInfo(code);

    const flagEl = document.getElementById('currencyFlag');
    const codeEl = document.getElementById('currencyCode');
    if (flagEl) flagEl.textContent = info.flag;
    if (codeEl) codeEl.textContent = code;
}

/* ── ADD CURRENCY ITEM STYLES ── */
(function injectCurrencyStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .currency-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 14px;
            border-radius: 10px;
            cursor: pointer;
            transition: background 0.2s;
            margin-bottom: 2px;
        }
        .currency-item:hover {
            background: var(--primary-bg);
        }
        .currency-item.active {
            background: var(--primary-bg);
        }
        .currency-flag { font-size: 1.4rem; }
        .currency-info {
            flex: 1;
            display: flex;
            flex-direction: column;
            gap: 1px;
        }
        .currency-code {
            font-weight: 700;
            font-size: 0.88rem;
            color: var(--text-primary);
        }
        .currency-name {
            font-size: 0.75rem;
            color: var(--text-muted);
        }
        .currency-symbol {
            font-weight: 700;
            color: var(--primary);
            font-size: 0.95rem;
        }
    `;
    document.head.appendChild(style);
})();