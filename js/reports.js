/* ============================================================
   AITOOLCOR MONEYWISE - REPORTS
   File: js/reports.js
   ============================================================ */

const Reports = {

    render() {
        this.renderSummaryCards();
        this.renderBarChart();
        this.renderCategoryList();
        this.renderTable();
    },

    /* ════════════════════════
       SUMMARY CARDS
    ════════════════════════ */
    renderSummaryCards() {
        const container = document.getElementById('reportCards');
        if (!container) return;

        const curr = Store.getMonthStats();
        const prev = (() => {
            const now  = new Date();
            const prevM = now.getMonth() - 1;
            return Store.getMonthStats(
                prevM < 0 ? 11 : prevM,
                prevM < 0 ? now.getFullYear() - 1 : now.getFullYear()
            );
        })();

        const incChange = percentChange(curr.income,  prev.income);
        const expChange = percentChange(curr.expense, prev.expense);
        const rateChange = curr.savingsRate - prev.savingsRate;

        const cards = [
            {
                icon:   'fa-arrow-down',
                clr:    'var(--success)',
                bg:     'var(--success-bg)',
                label:  'Monthly Income',
                value:  fmt(curr.income),
                change: incChange,
                up:     incChange >= 0,
                sub:    'vs last month'
            },
            {
                icon:   'fa-arrow-up',
                clr:    'var(--danger)',
                bg:     'var(--danger-bg)',
                label:  'Monthly Expenses',
                value:  fmt(curr.expense),
                change: expChange,
                up:     expChange <= 0,
                sub:    'vs last month'
            },
            {
                icon:   'fa-percentage',
                clr:    curr.savingsRate >= 20
                    ? 'var(--success)' : 'var(--warning)',
                bg:     curr.savingsRate >= 20
                    ? 'var(--success-bg)' : 'var(--warning-bg)',
                label:  'Savings Rate',
                value:  curr.savingsRate + '%',
                change: Math.abs(rateChange),
                up:     rateChange >= 0,
                sub:    rateChange >= 0
                    ? `↑ ${rateChange}% improvement`
                    : `↓ ${Math.abs(rateChange)}% decrease`
            }
        ];

        container.innerHTML = cards.map(c => `
            <div class="card glass-hover hover-lift">
                <div class="card-body">
                    <div style="display:flex;align-items:center;
                                justify-content:space-between;
                                margin-bottom:var(--space-4);">
                        <div style="width:46px;height:46px;
                                    border-radius:var(--radius-md);
                                    background:${c.bg};color:${c.clr};
                                    display:flex;align-items:center;
                                    justify-content:center;
                                    font-size:var(--text-lg);">
                            <i class="fas ${c.icon}"></i>
                        </div>
                        <span class="stat-card-change ${c.up ? 'up' : 'down'}">
                            ${c.up ? '↑' : '↓'} ${Math.abs(c.change)}%
                        </span>
                    </div>
                    <div style="font-size:var(--text-sm);color:var(--text-muted);
                                margin-bottom:4px;">${c.label}</div>
                    <div style="font-size:var(--text-2xl);
                                font-weight:var(--weight-extrabold);
                                color:${c.clr};">${c.value}</div>
                    <div style="font-size:var(--text-xs);color:var(--text-muted);
                                margin-top:4px;">${c.sub}</div>
                </div>
            </div>
        `).join('');
    },

    /* ════════════════════════
       BAR CHART (6 months)
    ════════════════════════ */
    renderBarChart() {
        const data = Store.getMonthlyData(6);
        Charts.renderBarChart('reportBarChart', data);
    },

    /* ════════════════════════
       TOP CATEGORIES
    ════════════════════════ */
    renderCategoryList() {
        const container = document.getElementById('reportCategoryList');
        if (!container) return;

        const breakdown = Store.getCategoryBreakdown('expense');
        const total     = breakdown.reduce((s, c) => s + c.amount, 0);

        if (!breakdown.length) {
            container.innerHTML = emptyStateHTML(
                '📊', 'No expense data',
                'Add transactions to see category breakdown',
                '', ''
            );
            return;
        }

        container.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:var(--space-3);">
                ${breakdown.slice(0, 8).map((cat, i) => {
                    const pct = percentOf(cat.amount, total);
                    return `
                        <div>
                            <div style="display:flex;align-items:center;
                                        justify-content:space-between;
                                        margin-bottom:var(--space-2);">
                                <div style="display:flex;align-items:center;
                                            gap:var(--space-2);">
                                    <span style="font-size:1.1rem;">
                                        ${cat.info.emoji}
                                    </span>
                                    <span style="font-size:var(--text-sm);
                                                 font-weight:var(--weight-semibold);
                                                 color:var(--text-secondary);">
                                        ${cat.info.name}
                                    </span>
                                </div>
                                <div style="text-align:right;">
                                    <span style="font-size:var(--text-sm);
                                                 font-weight:var(--weight-bold);
                                                 color:var(--danger);">
                                        ${fmt(cat.amount)}
                                    </span>
                                    <span style="font-size:var(--text-xs);
                                                 color:var(--text-muted);
                                                 margin-left:4px;">
                                        ${pct}%
                                    </span>
                                </div>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill primary"
                                     style="width:0%;
                                            background:${cat.info.color};"
                                     data-pct="${pct}">
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Animate bars
        setTimeout(() => {
            container.querySelectorAll('.progress-fill[data-pct]').forEach((bar, i) => {
                setTimeout(() => {
                    bar.style.transition = 'width 1s cubic-bezier(0.4,0,0.2,1)';
                    bar.style.width = bar.dataset.pct + '%';
                }, i * 80);
            });
        }, 100);
    },

    /* ════════════════════════
       MONTHLY TABLE
    ════════════════════════ */
    renderTable() {
        const tbody = document.getElementById('reportTableBody');
        if (!tbody) return;

        const now  = new Date();
        let html   = '';

        for (let i = 5; i >= 0; i--) {
            const month = now.getMonth() - i;
            const year  = month < 0
                ? now.getFullYear() - 1
                : now.getFullYear();
            const m     = month < 0 ? month + 12 : month;

            const stats   = Store.getMonthStats(m, year);
            const monthLbl = new Date(year, m, 1)
                .toLocaleString('en', { month: 'long', year: 'numeric' });
            const isCurrentMonth = m === now.getMonth() &&
                                   year === now.getFullYear();

            html += `
                <tr style="${isCurrentMonth
                    ? 'background:rgba(99,102,241,0.04);'
                    : ''}">
                    <td>
                        <span style="font-weight:${isCurrentMonth
                            ? 'var(--weight-bold)'
                            : 'var(--weight-normal)'};">
                            ${monthLbl}
                        </span>
                        ${isCurrentMonth
                            ? '<span class="badge badge-primary" style="margin-left:6px;">Current</span>'
                            : ''}
                    </td>
                    <td class="amount-positive">${fmt(stats.income)}</td>
                    <td class="amount-negative">${fmt(stats.expense)}</td>
                    <td style="color:${stats.savings >= 0
                        ? 'var(--success)'
                        : 'var(--danger)'};
                               font-weight:var(--weight-bold);">
                        ${stats.savings >= 0 ? '+' : ''}${fmt(stats.savings)}
                    </td>
                    <td>
                        <span style="color:${stats.savingsRate >= 20
                            ? 'var(--success)'
                            : stats.savingsRate >= 10
                                ? 'var(--warning)'
                                : 'var(--danger)'};
                                     font-weight:var(--weight-bold);">
                            ${stats.savingsRate}%
                        </span>
                    </td>
                    <td style="color:var(--text-muted);">
                        ${stats.txCount}
                    </td>
                </tr>
            `;
        }

        tbody.innerHTML = html;
    }
};

function printReport() {
    window.print();
    Toast.info('Opening print dialog...');
}