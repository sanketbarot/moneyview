/* ============================================================
   AITOOLCOR MONEYWISE - TRANSACTIONS
   File: js/transactions.js
   Description: Full transaction management — list, filter,
                search, pagination, summary bar
   ============================================================ */

const Transactions = {

    page:        1,
    perPage:     12,
    searchQuery: '',

    /* ════════════════════════
       MAIN RENDER
    ════════════════════════ */
    render() {
        this.populateFilters();
        this.renderSummaryBar();
        this.renderList();
    },

    /* ════════════════════════
       POPULATE FILTERS
    ════════════════════════ */
    populateFilters() {
        // Category filter
        populateCategoryFilter('filterCategory');

        // Account filter
        const accSel = document.getElementById('filterAccount');
        if (accSel) {
            accSel.innerHTML = '<option value="all">All Accounts</option>' +
                Store.getAccounts().map(a =>
                    `<option value="${a.id}">${a.emoji || '🏦'} ${a.name}</option>`
                ).join('');
        }
    },

    /* ════════════════════════
       SUMMARY BAR
    ════════════════════════ */
    renderSummaryBar() {
        const container = document.getElementById('txSummaryBar');
        if (!container) return;

        const filtered = this.getFiltered();
        const income   = filtered.filter(t => t.type === 'income')
                                  .reduce((s, t) => s + t.amount, 0);
        const expense  = filtered.filter(t => t.type === 'expense')
                                  .reduce((s, t) => s + t.amount, 0);
        const net      = income - expense;

        container.innerHTML = `
            <div class="tx-summary-wrap glass">
                <div class="tx-summary-item">
                    <div class="tx-sum-icon"
                         style="background:var(--success-bg);color:var(--success);">
                        <i class="fas fa-arrow-down"></i>
                    </div>
                    <div>
                        <div class="tx-sum-label">Total Income</div>
                        <div class="tx-sum-value text-success">${fmt(income)}</div>
                    </div>
                </div>

                <div class="tx-summary-divider"></div>

                <div class="tx-summary-item">
                    <div class="tx-sum-icon"
                         style="background:var(--danger-bg);color:var(--danger);">
                        <i class="fas fa-arrow-up"></i>
                    </div>
                    <div>
                        <div class="tx-sum-label">Total Expenses</div>
                        <div class="tx-sum-value text-danger">${fmt(expense)}</div>
                    </div>
                </div>

                <div class="tx-summary-divider"></div>

                <div class="tx-summary-item">
                    <div class="tx-sum-icon"
                         style="background:${net >= 0 ? 'var(--primary-bg)' : 'var(--danger-bg)'};
                                color:${net >= 0 ? 'var(--primary)' : 'var(--danger)'};">
                        <i class="fas fa-wallet"></i>
                    </div>
                    <div>
                        <div class="tx-sum-label">Net Amount</div>
                        <div class="tx-sum-value"
                             style="color:${net >= 0
                                ? 'var(--primary)'
                                : 'var(--danger)'};">
                            ${net >= 0 ? '+' : '-'}${fmt(Math.abs(net))}
                        </div>
                    </div>
                </div>

                <div class="tx-summary-divider"></div>

                <div class="tx-summary-item">
                    <div class="tx-sum-icon"
                         style="background:var(--info-bg);color:var(--info);">
                        <i class="fas fa-list"></i>
                    </div>
                    <div>
                        <div class="tx-sum-label">Transactions</div>
                        <div class="tx-sum-value"
                             style="color:var(--info);">
                            ${filtered.length}
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    /* ════════════════════════
       GET FILTERED LIST
    ════════════════════════ */
    getFiltered() {
        return Store.filterTransactions({
            type:     document.getElementById('filterType')?.value     || 'all',
            category: document.getElementById('filterCategory')?.value || 'all',
            account:  document.getElementById('filterAccount')?.value  || 'all',
            from:     document.getElementById('filterFrom')?.value     || null,
            to:       document.getElementById('filterTo')?.value       || null,
            sort:     document.getElementById('filterSort')?.value     || 'newest',
            search:   this.searchQuery
        });
    },

    /* ════════════════════════
       RENDER LIST
    ════════════════════════ */
    renderList() {
        const container = document.getElementById('txList');
        if (!container) return;

        const filtered   = this.getFiltered();
        const totalPages = Math.ceil(filtered.length / this.perPage) || 1;

        // Clamp page
        if (this.page > totalPages) this.page = totalPages;
        if (this.page < 1)          this.page = 1;

        const start     = (this.page - 1) * this.perPage;
        const paginated = filtered.slice(start, start + this.perPage);

        if (!paginated.length) {
            container.innerHTML = emptyStateHTML(
                '🔍',
                'No transactions found',
                'Try adjusting your filters or add a new transaction',
                'Add Transaction',
                'openTxModal()'
            );
            this.renderPagination(0, 1);
            return;
        }

        // Group by date
        const grouped = this.groupByDate(paginated);
        let html = '';

        Object.entries(grouped).forEach(([dateLabel, txs]) => {
            const dayTotal = txs.reduce((s, t) =>
                t.type === 'income' ? s + t.amount : s - t.amount, 0
            );

            html += `
                <div class="tx-date-group">
                    <div class="tx-date-header">
                        <span class="tx-date-label">${dateLabel}</span>
                        <span class="tx-date-total"
                              style="color:${dayTotal >= 0
                                  ? 'var(--success)'
                                  : 'var(--danger)'};">
                            ${dayTotal >= 0 ? '+' : ''}${fmt(dayTotal)}
                        </span>
                    </div>
                    ${txs.map(tx => txItemHTML(tx, true)).join('')}
                </div>
            `;
        });

        container.innerHTML = html;

        // Animate items
        container.querySelectorAll('.tx-item').forEach((item, i) => {
            item.style.opacity   = '0';
            item.style.transform = 'translateY(8px)';
            item.style.transition = 'none';
            setTimeout(() => {
                item.style.transition =
                    'opacity 0.3s ease, transform 0.3s ease';
                item.style.opacity   = '1';
                item.style.transform = 'translateY(0)';
            }, i * 30);
        });

        this.renderPagination(filtered.length, totalPages);
    },

    /* Group transactions by date */
    groupByDate(txs) {
        const groups = {};
        txs.forEach(tx => {
            const label = formatDateRelative(tx.date) === 'Today' ||
                          formatDateRelative(tx.date) === 'Yesterday'
                ? formatDateRelative(tx.date)
                : formatDate(tx.date);

            if (!groups[label]) groups[label] = [];
            groups[label].push(tx);
        });
        return groups;
    },

    /* ════════════════════════
       PAGINATION
    ════════════════════════ */
    renderPagination(total, totalPages) {
        const container = document.getElementById('txPagination');
        if (!container) return;

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = '';

        // Prev
        html += `
            <button class="page-btn"
                    onclick="Transactions.goToPage(${this.page - 1})"
                    ${this.page === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>`;

        // Pages
        const range = this.getPageRange(this.page, totalPages);
        range.forEach(p => {
            if (p === '...') {
                html += `<button class="page-btn" disabled>…</button>`;
            } else {
                html += `
                    <button class="page-btn ${p === this.page ? 'active' : ''}"
                            onclick="Transactions.goToPage(${p})">
                        ${p}
                    </button>`;
            }
        });

        // Next
        html += `
            <button class="page-btn"
                    onclick="Transactions.goToPage(${this.page + 1})"
                    ${this.page === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>`;

        // Page info
        const start = (this.page - 1) * this.perPage + 1;
        const end   = Math.min(this.page * this.perPage, total);
        html += `
            <span style="
                font-size:var(--text-xs);
                color:var(--text-muted);
                margin-left:var(--space-3);
                align-self:center;
            ">
                ${start}–${end} of ${total}
            </span>`;

        container.innerHTML = html;
    },

    getPageRange(current, total) {
        if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

        const range = [];
        if (current <= 4) {
            range.push(1, 2, 3, 4, 5, '...', total);
        } else if (current >= total - 3) {
            range.push(1, '...', total-4, total-3, total-2, total-1, total);
        } else {
            range.push(1, '...', current-1, current, current+1, '...', total);
        }
        return range;
    },

    goToPage(page) {
        this.page = page;
        this.renderList();
        this.renderSummaryBar();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

/* ── Global filter triggers ── */
function renderTransactions() {
    Transactions.page = 1;
    Transactions.renderSummaryBar();
    Transactions.renderList();
}

function clearFilters() {
    ['filterType','filterCategory','filterAccount','filterSort'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = el.options[0].value;
    });
    ['filterFrom','filterTo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    const search = document.getElementById('globalSearch');
    if (search) search.value = '';
    Transactions.searchQuery = '';
    Transactions.page = 1;
    renderTransactions();
    Toast.info('Filters cleared');
}

/* ── Export functions ── */
function exportCSV() {
    const csv      = Store.exportCSV();
    const filename = `moneywise_transactions_${today()}.csv`;
    downloadFile(csv, filename, 'text/csv;charset=utf-8;');
    Toast.success('Transactions exported as CSV!');
}

function exportJSON() {
    const json     = Store.exportTransactionsJSON();
    const filename = `moneywise_transactions_${today()}.json`;
    downloadFile(json, filename, 'application/json');
    Toast.success('Transactions exported as JSON!');
}