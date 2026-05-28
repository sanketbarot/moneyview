/* ============================================================
   AITOOLCOR MONEYWISE - BUDGETS
   File: js/budgets.js
   Description: Budget management — list, progress, alerts
   ============================================================ */

const Budgets = {

    /* ════════════════════════
       MAIN RENDER
    ════════════════════════ */
    render() {
        this.renderOverviewCards();
        this.renderBudgetList();
    },

    /* ════════════════════════
       OVERVIEW CARDS
    ════════════════════════ */
    renderOverviewCards() {
        const container = document.getElementById('budgetOverviewCards');
        if (!container) return;

        const budgets = Store.getBudgetStatus();
        const total   = budgets.reduce((s, b) => s + b.limit,  0);
        const spent   = budgets.reduce((s, b) => s + b.spent,  0);
        const remain  = budgets.reduce((s, b) => s + b.remaining, 0);

        const overCount  = budgets.filter(b => b.status === 'danger').length;
        const warnCount  = budgets.filter(b => b.status === 'warning').length;
        const safeCount  = budgets.filter(b => b.status === 'safe').length;
        const overallPct = total > 0
            ? Math.min(Math.round((spent / total) * 100), 100)
            : 0;

        const cards = [
            {
                icon:  'fa-chart-pie',
                clr:   'var(--primary)',
                bg:    'var(--primary-bg)',
                label: 'Total Budget',
                value: fmt(total),
                sub:   `${budgets.length} categories`
            },
            {
                icon:  'fa-shopping-cart',
                clr:   overallPct >= 100 ? 'var(--danger)'  :
                       overallPct >= 80  ? 'var(--warning)' :
                       'var(--success)',
                bg:    overallPct >= 100 ? 'var(--danger-bg)'  :
                       overallPct >= 80  ? 'var(--warning-bg)' :
                       'var(--success-bg)',
                label: 'Total Spent',
                value: fmt(spent),
                sub:   `${overallPct}% of budget`
            },
            {
                icon:  'fa-coins',
                clr:   remain > 0 ? 'var(--success)' : 'var(--danger)',
                bg:    remain > 0 ? 'var(--success-bg)' : 'var(--danger-bg)',
                label: 'Remaining',
                value: fmt(remain),
                sub:   `${Math.max(0, 100 - overallPct)}% left`
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
                    </div>
                    <div style="font-size:var(--text-sm);
                                color:var(--text-muted);
                                margin-bottom:4px;">
                        ${c.label}
                    </div>
                    <div style="font-size:var(--text-2xl);
                                font-weight:var(--weight-extrabold);
                                color:${c.clr};
                                margin-bottom:4px;">
                        ${c.value}
                    </div>
                    <div style="font-size:var(--text-xs);
                                color:var(--text-muted);">
                        ${c.sub}
                    </div>
                </div>
            </div>
        `).join('');

        // Budget status badges
        if (overCount > 0 || warnCount > 0) {
            const badge = document.createElement('div');
            badge.className = 'card glass-danger';
            badge.innerHTML = `
                <div class="card-body"
                     style="display:flex;align-items:center;gap:12px;">
                    <span style="font-size:1.5rem;">⚠️</span>
                    <div>
                        <div style="font-weight:700;color:var(--danger);">
                            Budget Alerts
                        </div>
                        <div style="font-size:var(--text-xs);color:var(--text-muted);">
                            ${overCount > 0 ? `${overCount} exceeded` : ''}
                            ${overCount > 0 && warnCount > 0 ? ' · ' : ''}
                            ${warnCount > 0 ? `${warnCount} near limit` : ''}
                        </div>
                    </div>
                </div>
            `;
            container.appendChild(badge);
        }
    },

    /* ════════════════════════
       BUDGET LIST
    ════════════════════════ */
    renderBudgetList() {
        const container = document.getElementById('budgetList');
        if (!container) return;

        const budgets = Store.getBudgetStatus();

        if (!budgets.length) {
            container.innerHTML = emptyStateHTML(
                '📊',
                'No budgets set',
                'Create budgets to track your spending limits',
                'Add Budget',
                'openBudgetModal()'
            );
            return;
        }

        // Sort: danger first, then warning, then safe
        const sorted = [...budgets].sort((a, b) => {
            const order = { danger: 0, warning: 1, safe: 2 };
            return order[a.status] - order[b.status];
        });

        container.innerHTML = sorted.map(b => this.budgetCardHTML(b)).join('');

        // Animate progress bars
        setTimeout(() => {
            container.querySelectorAll('.progress-fill[data-pct]').forEach((bar, i) => {
                setTimeout(() => {
                    bar.style.transition = 'width 1s cubic-bezier(0.4,0,0.2,1)';
                    bar.style.width = Math.min(b => parseFloat(bar.dataset.pct), 100) + '%';
                    bar.style.width = bar.dataset.pct + '%';
                }, i * 80);
            });
        }, 100);
    },

    budgetCardHTML(b) {
        const statusIcon = b.status === 'danger'  ? '🔴' :
                           b.status === 'warning' ? '🟡' : '🟢';
        const barPct = Math.min(b.percentage, 100);

        return `
            <div class="budget-card-item glass hover-lift">
                <div class="budget-card-header">
                    <div class="budget-card-left">
                        <div class="budget-cat-icon"
                             style="background:${b.info.color}18;
                                    color:${b.info.color};">
                            <i class="fas ${b.info.icon}"></i>
                        </div>
                        <div>
                            <div class="budget-cat-name">
                                ${b.info.emoji} ${b.info.name}
                            </div>
                            <div class="budget-period">Monthly Budget</div>
                        </div>
                    </div>
                    <div class="budget-card-right">
                        <div class="budget-amounts">
                            <span class="budget-spent
                                  ${b.status === 'danger'  ? 'text-danger'  :
                                    b.status === 'warning' ? 'text-warning' :
                                    'text-success'}">
                                ${fmt(b.spent)}
                            </span>
                            <span class="budget-limit-text">
                                of ${fmt(b.limit)}
                            </span>
                        </div>
                        <div class="budget-actions">
                            <span class="budget-status-icon">${statusIcon}</span>
                            <button class="btn-icon btn-icon"
                                    onclick="deleteBudgetItem('${b.id}')"
                                    title="Delete budget"
                                    style="width:30px;height:30px;border-radius:8px;">
                                <i class="fas fa-trash"
                                   style="font-size:0.7rem;
                                          color:var(--danger);"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div class="budget-progress-wrap">
                    <div class="progress-bar">
                        <div class="progress-fill ${b.status} progress-shimmer"
                             style="width:0%;"
                             data-pct="${barPct}">
                        </div>
                    </div>
                    <div class="budget-progress-labels">
                        <span class="budget-pct
                              ${b.status === 'danger'  ? 'text-danger'  :
                                b.status === 'warning' ? 'text-warning' :
                                'text-success'}">
                            ${b.percentage}% used
                        </span>
                        <span style="font-size:var(--text-xs);
                                     color:var(--text-muted);">
                            ${b.remaining > 0
                                ? `${fmt(b.remaining)} remaining`
                                : `${fmt(Math.abs(b.remaining))} over budget`}
                        </span>
                    </div>
                </div>

                ${b.status === 'danger' ? `
                <div class="budget-alert-banner">
                    <i class="fas fa-exclamation-triangle"></i>
                    Budget exceeded by ${fmt(b.spent - b.limit)}!
                    Consider reducing spending in this category.
                </div>` : b.status === 'warning' ? `
                <div class="budget-warning-banner">
                    <i class="fas fa-exclamation-circle"></i>
                    Approaching limit — only ${fmt(b.remaining)} remaining.
                </div>` : ''}
            </div>
        `;
    }
};

/* ── Global helpers ── */
function deleteBudgetItem(id) {
    openConfirmModal(
        'Delete Budget?',
        'This budget category will be removed.',
        () => {
            Store.deleteBudget(id);
            Toast.success('Budget removed.');
            Budgets.render();
        }
    );
}