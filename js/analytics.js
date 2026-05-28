/* ============================================================
   AITOOLCOR MONEYWISE - ANALYTICS
   File: js/analytics.js
   ============================================================ */

const Analytics = {

    render() {
        this.renderQuickStats();
        this.renderSmartTips();
        this.renderHealthScore();
        this.renderDailyChart();
        this.renderIncomeSources();
        this.renderSpendingTrend();
    },

    /* ════════════════════════
       QUICK STATS
    ════════════════════════ */
    renderQuickStats() {
        const container = document.getElementById('analyticsStats');
        if (!container) return;

        const stats     = Store.getMonthStats();
        const allTime   = Store.getAllTimeStats();
        const avgDaily  = stats.expense /
                          Math.max(new Date().getDate(), 1);

        const breakdown = Store.getCategoryBreakdown('expense');
        const topCat    = breakdown[0];

        const bestMonth = (() => {
            let best = { rate: 0, label: 'N/A' };
            for (let i = 11; i >= 0; i--) {
                const now   = new Date();
                const month = now.getMonth() - i;
                const year  = month < 0
                    ? now.getFullYear() - 1
                    : now.getFullYear();
                const m     = month < 0 ? month + 12 : month;
                const s     = Store.getMonthStats(m, year);
                if (s.savingsRate > best.rate) {
                    best = {
                        rate:  s.savingsRate,
                        label: new Date(year, m, 1)
                            .toLocaleString('en', { month: 'short' })
                    };
                }
            }
            return best;
        })();

        const cards = [
            {
                icon:  '📊',
                label: 'Total Transactions',
                value: allTime.txCount,
                sub:   `${stats.txCount} this month`,
                clr:   'var(--primary)'
            },
            {
                icon:  '🔥',
                label: 'Top Spending Category',
                value: topCat ? topCat.info.name : 'N/A',
                sub:   topCat ? fmt(topCat.amount) + ' this month' : 'No data',
                clr:   'var(--danger)'
            },
            {
                icon:  '📅',
                label: 'Daily Avg Spending',
                value: fmt(avgDaily),
                sub:   `${new Date().getDate()} days tracked`,
                clr:   'var(--warning)'
            },
            {
                icon:  '🏆',
                label: 'Best Savings Month',
                value: bestMonth.label,
                sub:   `${bestMonth.rate}% savings rate`,
                clr:   'var(--success)'
            }
        ];

        container.innerHTML = cards.map(c => `
            <div class="card glass-hover hover-lift">
                <div class="card-body" style="text-align:center;">
                    <div style="font-size:2rem;margin-bottom:var(--space-3);">
                        ${c.icon}
                    </div>
                    <div style="font-size:var(--text-xs);color:var(--text-muted);
                                margin-bottom:var(--space-2);">
                        ${c.label}
                    </div>
                    <div style="font-size:var(--text-xl);
                                font-weight:var(--weight-extrabold);
                                color:${c.clr};
                                line-height:1;
                                margin-bottom:var(--space-1);">
                        ${c.value}
                    </div>
                    <div style="font-size:var(--text-xs);
                                color:var(--text-muted);">
                        ${c.sub}
                    </div>
                </div>
            </div>
        `).join('');
    },

    /* ════════════════════════
       SMART TIPS
    ════════════════════════ */
    renderSmartTips() {
        const container = document.getElementById('smartTips');
        if (!container) return;

        const tips = this.generateTips();

        container.innerHTML = `
            <div style="display:flex;flex-direction:column;gap:var(--space-3);">
                ${tips.map(tip => `
                    <div class="smart-tip-item ${tip.type}">
                        <div class="smart-tip-icon">${tip.icon}</div>
                        <div class="smart-tip-content">
                            <div class="smart-tip-title">${tip.title}</div>
                            <div class="smart-tip-desc">${tip.desc}</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    },

    generateTips() {
        const tips  = [];
        const stats = Store.getMonthStats();
        const budgets = Store.getBudgetStatus();
        const breakdown = Store.getCategoryBreakdown('expense');

        // Savings rate tip
        if (stats.savingsRate < 0) {
            tips.push({
                icon: '🚨', type: 'tip-danger',
                title: 'Spending More Than Earning',
                desc: `You're spending ${fmt(Math.abs(stats.savings))} more
                       than you earn. Review your biggest expense categories.`
            });
        } else if (stats.savingsRate < 10) {
            tips.push({
                icon: '💡', type: 'tip-warning',
                title: 'Low Savings Rate',
                desc: `Your savings rate is ${stats.savingsRate}%.
                       Try the 50/30/20 rule: 50% needs,
                       30% wants, 20% savings.`
            });
        } else if (stats.savingsRate >= 30) {
            tips.push({
                icon: '🌟', type: 'tip-success',
                title: 'Excellent Savings Rate!',
                desc: `You're saving ${stats.savingsRate}% of income —
                       better than 85% of people! Consider investing
                       the surplus.`
            });
        }

        // Budget tips
        const overBudget = budgets.filter(b => b.status === 'danger');
        if (overBudget.length) {
            overBudget.forEach(b => {
                tips.push({
                    icon: '⚠️', type: 'tip-warning',
                    title: `${b.info.name} Budget Exceeded`,
                    desc: `You've spent ${fmt(b.spent - b.limit)} over
                           your ${b.info.name} budget.
                           Consider reducing or adjusting the limit.`
                });
            });
        }

        // Top category tip
        if (breakdown.length && stats.expense > 0) {
            const top = breakdown[0];
            const pct = percentOf(top.amount, stats.expense);
            if (pct > 35) {
                tips.push({
                    icon: '🔍', type: 'tip-info',
                    title: `${top.info.name} is ${pct}% of Spending`,
                    desc: `${top.info.name} takes up ${pct}% of your
                           expenses (${fmt(top.amount)}). This seems high —
                           review if you can reduce it.`
                });
            }
        }

        // Daily spending tip
        const avgDaily = stats.expense / Math.max(new Date().getDate(), 1);
        if (avgDaily > 0) {
            const proj = avgDaily * 30;
            if (proj > stats.income) {
                tips.push({
                    icon: '📈', type: 'tip-danger',
                    title: 'Projected Monthly Overspend',
                    desc: `At your current pace, you'll spend ${fmt(proj)}
                           this month — ${fmt(proj - stats.income)}
                           more than your income!`
                });
            }
        }

        // Goals tip
        const goals = Store.getGoals();
        const nearComplete = goals.find(g => {
            const pct = Math.round((g.saved / g.target) * 100);
            return pct >= 80 && pct < 100;
        });

        if (nearComplete) {
            const pct = Math.round((nearComplete.saved / nearComplete.target) * 100);
            tips.push({
                icon: '🎯', type: 'tip-success',
                title: `${nearComplete.emoji} Goal Almost Done!`,
                desc: `"${nearComplete.name}" is ${pct}% complete.
                       Only ${fmt(nearComplete.target - nearComplete.saved)} left!`
            });
        }

        // No transactions tip
        if (stats.txCount === 0) {
            tips.push({
                icon: '📝', type: 'tip-info',
                title: 'Start Tracking!',
                desc: 'No transactions this month yet. Start logging your income and expenses for better insights.'
            });
        }

        // Default tip
        if (tips.length === 0) {
            tips.push({
                icon: '✅', type: 'tip-success',
                title: 'Great Financial Health!',
                desc: 'Your finances look well-managed. Keep tracking regularly to maintain this momentum!'
            });
        }

        return tips.slice(0, 5);
    },

    /* ════════════════════════
       HEALTH SCORE
    ════════════════════════ */
    renderHealthScore() {
        const score = Store.getHealthScore();
        Charts.renderHealthGauge('healthScoreCard', score);
    },

    /* ════════════════════════
       DAILY CHART
    ════════════════════════ */
    renderDailyChart() {
        Charts.renderDailyChart('dailySpendChart');
    },

    /* ════════════════════════
       INCOME SOURCES
    ════════════════════════ */
    renderIncomeSources() {
        Charts.renderIncomeSources('incomeSources');
    },

    /* ════════════════════════
       SPENDING TREND
    ════════════════════════ */
    renderSpendingTrend() {
        Charts.renderSpendingTrend('spendingTrend');
    }
};