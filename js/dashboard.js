/* ============================================================
   AITOOLCOR MONEYWISE - DASHBOARD
   File: js/dashboard.js
   Description: Dashboard page render logic
   ============================================================ */

const Dashboard = {

    period: 'monthly',
    chartPeriod: 'weekly',

    /* ════════════════════════
       MAIN RENDER
    ════════════════════════ */
    render() {
        this.renderOverviewCards();
        this.renderBarChart();
        this.renderDonutChart();
        this.renderRecentTransactions();
        this.renderBudgetSummary();
        this.renderGoalsSummary();
        this.renderUpcomingBills();
        this.renderHealthScore();
        this.setupPeriodTabs();
        this.setupChartTabs();
    },

    /* ════════════════════════
       OVERVIEW CARDS
    ════════════════════════ */
    renderOverviewCards() {
        const stats  = this.getStats();
        const prev   = this.getPrevStats();
        const container = document.getElementById('overviewCards');
        if (!container) return;

        const incChange  = percentChange(stats.income,  prev.income);
        const expChange  = percentChange(stats.expense, prev.expense);
        const savChange  = percentChange(
            Math.max(stats.savings, 0),
            Math.max(prev.savings, 0)
        );

        const cards = [
            {
                cls:    'glass glass-success glass-hover hover-lift hover-shine',
                icon:   'fa-arrow-down',
                iconBg: 'var(--success-bg)',
                iconClr:'var(--success)',
                label:  'Total Income',
                id:     'cardIncome',
                amount: stats.income,
                change: incChange,
                up:     incChange >= 0,
                bar:    stats.income > 0
                    ? Math.min(Math.round((stats.income / Math.max(stats.income, prev.income)) * 100), 100)
                    : 50,
                barClr: 'var(--success)'
            },
            {
                cls:    'glass glass-danger glass-hover hover-lift hover-shine',
                icon:   'fa-arrow-up',
                iconBg: 'var(--danger-bg)',
                iconClr:'var(--danger)',
                label:  'Total Expenses',
                id:     'cardExpense',
                amount: stats.expense,
                change: expChange,
                up:     expChange <= 0,
                bar:    stats.income > 0
                    ? Math.min(Math.round((stats.expense / stats.income) * 100), 100)
                    : 0,
                barClr: 'var(--danger)'
            },
            {
                cls:    'glass glass-primary glass-hover hover-lift hover-shine',
                icon:   'fa-wallet',
                iconBg: 'var(--info-bg)',
                iconClr:'var(--info)',
                label:  'Net Balance',
                id:     'cardBalance',
                amount: stats.balance,
                change: null,
                bar:    75,
                barClr: 'var(--info)'
            },
            {
                cls:    'glass glass-warning glass-hover hover-lift hover-shine',
                icon:   'fa-piggy-bank',
                iconBg: 'var(--warning-bg)',
                iconClr:'var(--warning)',
                label:  'Monthly Savings',
                id:     'cardSavings',
                amount: stats.savings,
                change: savChange,
                up:     savChange >= 0,
                bar:    stats.income > 0
                    ? Math.max(0, Math.min(stats.savingsRate, 100))
                    : 0,
                barClr: 'var(--warning)'
            }
        ];

        container.innerHTML = cards.map(c => `
            <div class="stat-card ${c.cls} glass-inner-light">
                <div class="stat-card-top">
                    <div class="stat-card-icon"
                         style="background:${c.iconBg};color:${c.iconClr};">
                        <i class="fas ${c.icon}"></i>
                    </div>
                    ${c.change !== null ? `
                    <div class="stat-card-change ${c.up ? 'up' : 'down'}">
                        <i class="fas fa-arrow-${c.up ? 'up' : 'down'}"
                           style="font-size:0.6rem;"></i>
                        ${Math.abs(c.change)}%
                    </div>` : `
                    <div class="stat-card-change up">All Accounts</div>`}
                </div>
                <div class="stat-card-label">${c.label}</div>
                <div class="stat-card-amount"
                     id="${c.id}"
                     style="color:${
                         c.id==='cardIncome'  ? 'var(--success)' :
                         c.id==='cardExpense' ? 'var(--danger)'  :
                         c.id==='cardBalance' ? 'var(--text-primary)' :
                         c.savings < 0 ? 'var(--danger)' : 'var(--warning)'
                     };">
                    ${fmt(Math.abs(c.amount))}
                </div>
                <div class="stat-card-bar">
                    <div class="stat-card-bar-fill"
                         style="width:0%;background:${c.barClr};"
                         data-target="${c.bar}">
                    </div>
                </div>
            </div>
        `).join('');

        // Animate amounts + bars
        requestAnimationFrame(() => {
            cards.forEach(c => {
                const el = document.getElementById(c.id);
                if (el) {
                    Animations.countUp(
                        el,
                        Math.abs(c.amount),
                        900,
                        getCurrencySymbol()
                    );
                }
            });

            container.querySelectorAll('.stat-card-bar-fill').forEach(bar => {
                setTimeout(() => {
                    bar.style.transition = 'width 1s cubic-bezier(0.4,0,0.2,1)';
                    bar.style.width = (parseFloat(bar.dataset.target) || 0) + '%';
                }, 200);
            });
        });
    },

    /* Get stats based on period */
    getStats() {
        switch(this.period) {
            case 'yearly':  return Store.getYearStats();
            case 'all':     return Store.getAllTimeStats();
            default:        return Store.getMonthStats();
        }
    },

    getPrevStats() {
        const now   = new Date();
        const prevM = now.getMonth() - 1;
        const prevY = prevM < 0 ? now.getFullYear() - 1 : now.getFullYear();
        return Store.getMonthStats(
            prevM < 0 ? 11 : prevM,
            prevY
        );
    },

    /* ════════════════════════
       BAR CHART
    ════════════════════════ */
    renderBarChart() {
        let data;
        switch(this.chartPeriod) {
            case 'monthly': data = Store.getMonthlyData(7); break;
            case 'yearly':  data = Store.getYearlyData(5);  break;
            default:        data = Store.getWeeklyData();   break;
        }
        Charts.renderBarChart('mainBarChart', data);
    },

    /* ════════════════════════
       DONUT CHART
    ════════════════════════ */
    renderDonutChart() {
        const breakdown = Store.getCategoryBreakdown('expense');
        Charts.renderDonutChart('donutChart', breakdown);
    },

    /* ════════════════════════
       RECENT TRANSACTIONS
    ════════════════════════ */
    renderRecentTransactions() {
        const container = document.getElementById('recentTxList');
        if (!container) return;

        const recent = Store.filterTransactions({ sort: 'newest' }).slice(0, 6);

        if (!recent.length) {
            container.innerHTML = emptyStateHTML(
                '💳', 'No transactions yet',
                'Start tracking your income and expenses',
                'Add Transaction', 'openTxModal()'
            );
            return;
        }

        container.innerHTML = recent.map(tx => txItemHTML(tx, false)).join('');
    },

    /* ════════════════════════
       BUDGET SUMMARY
    ════════════════════════ */
    renderBudgetSummary() {
        const container = document.getElementById('dashBudgetList');
        if (!container) return;

        const budgets = Store.getBudgetStatus();

        if (!budgets.length) {
            container.innerHTML = emptyStateHTML(
                '📊', 'No budgets set',
                'Create budgets to track spending',
                'Add Budget', 'openBudgetModal()'
            );
            return;
        }

        container.innerHTML = budgets.slice(0, 4).map(b => `
            <div class="dash-budget-item">
                <div class="dash-budget-top">
                    <div class="dash-budget-info">
                        <span style="font-size:1.2rem;">${b.info.emoji}</span>
                        <span class="dash-budget-name">${b.info.name}</span>
                    </div>
                    <div class="dash-budget-amounts">
                        <span class="dash-budget-spent
                              ${b.status === 'danger'  ? 'text-danger'  :
                                b.status === 'warning' ? 'text-warning' :
                                'text-success'}">
                            ${fmt(b.spent)}
                        </span>
                        <span class="dash-budget-limit">
                            / ${fmt(b.limit)}
                        </span>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill ${b.status} progress-shimmer"
                         style="width:0%;"
                         data-pct="${Math.min(b.percentage, 100)}">
                    </div>
                </div>
                <div class="dash-budget-footer">
                    <span style="font-size:var(--text-xs);color:var(--text-muted);">
                        ${b.percentage}% used
                    </span>
                    <span style="font-size:var(--text-xs);color:var(--text-muted);">
                        ${fmt(b.remaining)} left
                    </span>
                </div>
            </div>
        `).join('');

        // Animate bars
        setTimeout(() => {
            container.querySelectorAll('.progress-fill[data-pct]').forEach((bar, i) => {
                setTimeout(() => {
                    bar.style.transition = 'width 1s cubic-bezier(0.4,0,0.2,1)';
                    bar.style.width = bar.dataset.pct + '%';
                }, i * 100);
            });
        }, 200);
    },

    /* ════════════════════════
       GOALS SUMMARY
    ════════════════════════ */
    renderGoalsSummary() {
        const container = document.getElementById('dashGoalsList');
        if (!container) return;

        const goals = Store.getGoals().slice(0, 3);

        if (!goals.length) {
            container.innerHTML = emptyStateHTML(
                '🎯', 'No goals yet',
                'Set savings goals to stay motivated',
                'Add Goal', "openGoalModal()"
            );
            return;
        }

        container.innerHTML = goals.map(g => {
            const pct = Math.min(Math.round((g.saved / g.target) * 100), 100);
            return `
                <div class="dash-goal-item" onclick="navigateTo('goals')"
                     style="cursor:pointer;">
                    <div class="dash-goal-top">
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span style="font-size:1.3rem;">${g.emoji}</span>
                            <span style="font-size:var(--text-sm);
                                         font-weight:var(--weight-semibold);">
                                ${truncate(g.name, 20)}
                            </span>
                        </div>
                        <span style="font-size:var(--text-xs);
                                     font-weight:var(--weight-bold);
                                     color:var(--primary);">
                            ${pct}%
                        </span>
                    </div>
                    <div class="progress-bar" style="margin-top:8px;">
                        <div class="progress-fill primary progress-shimmer"
                             style="width:0%;
                                    background:linear-gradient(90deg,var(--primary),var(--secondary));"
                             data-pct="${pct}">
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;
                                margin-top:6px;font-size:var(--text-xs);
                                color:var(--text-muted);">
                        <span>${fmt(g.saved)} saved</span>
                        <span>${fmt(g.target)} target</span>
                    </div>
                </div>
            `;
        }).join('');

        // Animate bars
        setTimeout(() => {
            container.querySelectorAll('.progress-fill[data-pct]').forEach((bar, i) => {
                setTimeout(() => {
                    bar.style.transition = 'width 1s cubic-bezier(0.4,0,0.2,1)';
                    bar.style.width = bar.dataset.pct + '%';
                }, i * 120);
            });
        }, 200);
    },

    /* ════════════════════════
       UPCOMING BILLS
    ════════════════════════ */
    renderUpcomingBills() {
        const container = document.getElementById('dashBillsList');
        if (!container) return;

        const stats    = Store.getBillStats();
        const upcoming = [...stats.overdue, ...stats.upcoming].slice(0, 4);

        if (!upcoming.length) {
            container.innerHTML = `
                <div style="text-align:center;padding:var(--space-6);
                            color:var(--text-muted);">
                    <div style="font-size:1.5rem;margin-bottom:8px;">✅</div>
                    <p style="font-size:var(--text-sm);">No upcoming bills</p>
                </div>`;
            return;
        }

        container.innerHTML = upcoming.map(b => {
            const bs  = getBillStatus(b.dueDay);
            const clr = bs.status === 'overdue' ? 'var(--danger)'  :
                        bs.status === 'today'   ? 'var(--warning)' :
                        bs.status === 'urgent'  ? 'var(--warning)' :
                        'var(--text-muted)';
            return `
                <div class="dash-bill-item" onclick="navigateTo('bills')"
                     style="cursor:pointer;">
                    <div style="display:flex;align-items:center;gap:10px;flex:1;">
                        <span style="font-size:1.3rem;">${b.emoji}</span>
                        <div>
                            <div style="font-size:var(--text-sm);
                                        font-weight:var(--weight-semibold);">
                                ${b.name}
                            </div>
                            <div style="font-size:var(--text-xs);color:${clr};">
                                ${bs.label}
                            </div>
                        </div>
                    </div>
                    <span style="font-weight:var(--weight-bold);
                                 font-size:var(--text-sm);color:var(--danger);">
                        ${fmt(b.amount)}
                    </span>
                </div>
            `;
        }).join('');
    },

    /* ════════════════════════
       HEALTH SCORE
    ════════════════════════ */
    renderHealthScore() {
        const container = document.getElementById('dashHealthScore');
        if (!container) return;

        const score = Store.getHealthScore();
        Charts.renderHealthGauge('dashHealthScore', score);

        // Add factors below gauge
        const stats   = Store.getMonthStats();
        const budgets = Store.getBudgetStatus();

        const factors = [
            {
                icon:  '💰',
                label: 'Savings Rate',
                value: stats.savingsRate + '%',
                good:  stats.savingsRate >= 20
            },
            {
                icon:  '📊',
                label: 'Budgets on Track',
                value: `${budgets.filter(b => b.status === 'safe').length}/${budgets.length}`,
                good:  budgets.every(b => b.status !== 'danger')
            },
            {
                icon:  '💳',
                label: 'Transactions',
                value: stats.txCount,
                good:  stats.txCount > 0
            },
            {
                icon:  '🎯',
                label: 'Active Goals',
                value: Store.getGoals().length,
                good:  Store.getGoals().length > 0
            }
        ];

        const factorsEl = document.createElement('div');
        factorsEl.className = 'health-factors';
        factorsEl.style.marginTop = 'var(--space-4)';
        factorsEl.innerHTML = factors.map(f => `
            <div class="health-factor">
                <div class="health-factor-left">
                    <span class="health-factor-icon">${f.icon}</span>
                    <span>${f.label}</span>
                </div>
                <span class="health-factor-score"
                      style="color:${f.good ? 'var(--success)' : 'var(--warning)'};">
                    ${f.value}
                    <i class="fas fa-${f.good ? 'check-circle' : 'exclamation-circle'}"
                       style="font-size:0.7rem;margin-left:4px;"></i>
                </span>
            </div>
        `).join('');

        container.appendChild(factorsEl);
    },

    /* ════════════════════════
       PERIOD TABS
    ════════════════════════ */
    setupPeriodTabs() {
        document.querySelectorAll('#dashPeriodTabs .period-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('#dashPeriodTabs .period-tab')
                    .forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.period = tab.dataset.period;
                this.renderOverviewCards();
            });
        });
    },

    /* ════════════════════════
       CHART TABS
    ════════════════════════ */
    setupChartTabs() {
        document.querySelectorAll('#barChartTabs .chart-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('#barChartTabs .chart-tab')
                    .forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.chartPeriod = tab.dataset.period;
                this.renderBarChart();
            });
        });
    }
};

/* ════════════════════════════════════
   SHARED TX ITEM HTML
════════════════════════════════════ */
function txItemHTML(tx, showActions = true) {
    const cat       = getCategoryInfo(tx.category);
    const isIncome  = tx.type === 'income';
    const acc       = Store.getAccountById(tx.account);
    const dateLabel = formatDateRelative(tx.date);

    return `
        <div class="tx-item item-hover-bg hover-shine"
             data-id="${tx.id}"
             style="
                display:flex;
                align-items:center;
                gap:var(--space-4);
                padding:var(--space-4) var(--space-5);
                border-bottom:1px solid var(--border-color);
                transition:background var(--duration-fast) var(--ease-default);
                cursor:default;
             ">

            <!-- Icon -->
            <div style="
                width:42px;height:42px;
                border-radius:var(--radius-md);
                background:${cat.color}18;
                color:${cat.color};
                display:flex;align-items:center;justify-content:center;
                font-size:var(--text-base);
                flex-shrink:0;
            ">
                <i class="fas ${cat.icon}"></i>
            </div>

            <!-- Info -->
            <div style="flex:1;min-width:0;">
                <div style="
                    font-size:var(--text-sm);
                    font-weight:var(--weight-semibold);
                    color:var(--text-primary);
                    white-space:nowrap;
                    overflow:hidden;
                    text-overflow:ellipsis;
                ">
                    ${tx.description}
                </div>
                <div style="
                    display:flex;align-items:center;
                    gap:var(--space-2);margin-top:3px;
                ">
                    <span style="
                        font-size:var(--text-xs);
                        color:var(--text-muted);
                        background:rgba(0,0,0,0.04);
                        padding:2px 8px;
                        border-radius:var(--radius-full);
                    ">
                        ${cat.emoji} ${cat.name}
                    </span>
                    <span style="font-size:var(--text-xs);color:var(--text-muted);">
                        ${dateLabel}
                    </span>
                    ${acc ? `
                    <span style="font-size:var(--text-xs);color:var(--text-muted);">
                        · ${acc.emoji || ''} ${acc.name}
                    </span>` : ''}
                </div>
            </div>

            <!-- Amount -->
            <div style="text-align:right;flex-shrink:0;">
                <div style="
                    font-weight:var(--weight-bold);
                    font-size:var(--text-sm);
                    color:${isIncome ? 'var(--success)' : 'var(--danger)'};
                ">
                    ${isIncome ? '+' : '-'}${fmt(tx.amount)}
                </div>
            </div>

            <!-- Actions -->
            ${showActions ? `
            <div style="
                display:flex;gap:4px;flex-shrink:0;
                opacity:0;transition:opacity 0.2s ease;
            " class="tx-actions">
                <button onclick="editTx('${tx.id}')"
                        class="btn-icon btn-icon"
                        style="width:32px;height:32px;border-radius:8px;"
                        title="Edit">
                    <i class="fas fa-pen" style="font-size:0.75rem;"></i>
                </button>
                <button onclick="deleteTx('${tx.id}')"
                        class="btn-icon"
                        style="width:32px;height:32px;border-radius:8px;"
                        title="Delete">
                    <i class="fas fa-trash"
                       style="font-size:0.75rem;color:var(--danger);"></i>
                </button>
            </div>` : ''}
        </div>
    `;
}

/* Show actions on row hover */
document.addEventListener('mouseover', (e) => {
    const row = e.target.closest('.tx-item');
    if (!row) return;
    const actions = row.querySelector('.tx-actions');
    if (actions) actions.style.opacity = '1';
});

document.addEventListener('mouseout', (e) => {
    const row = e.target.closest('.tx-item');
    if (!row) return;
    if (!row.contains(e.relatedTarget)) {
        const actions = row.querySelector('.tx-actions');
        if (actions) actions.style.opacity = '0';
    }
});

/* Edit / Delete helpers */
function editTx(id) {
    openTxModal(id);
}

function deleteTx(id) {
    const tx = Store.getTransactionById(id);
    if (!tx) return;
    openConfirmModal(
        'Delete Transaction?',
        `"${tx.description}" — ${fmt(tx.amount)} will be removed.`,
        () => {
            const row = document.querySelector(`.tx-item[data-id="${id}"]`);
            if (row) {
                Animations.animateItemRemove(row, () => {
                    Store.deleteTransaction(id);
                    refreshAll();
                    Toast.success('Transaction deleted.');
                });
            } else {
                Store.deleteTransaction(id);
                refreshAll();
                Toast.success('Transaction deleted.');
            }
        }
    );
}