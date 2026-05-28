/* ============================================================
   AITOOLCOR MONEYWISE - ACCOUNTS
   File: js/accounts.js
   ============================================================ */

const Accounts = {

    render() {
        this.renderNetWorth();
        this.renderAccountsGrid();
    },

    /* ════════════════════════
       NET WORTH CARD
    ════════════════════════ */
    renderNetWorth() {
        const container = document.getElementById('netWorthCard');
        if (!container) return;

        const netWorth  = Store.getNetWorth();
        const accounts  = Store.getAccounts();
        const positive  = accounts.filter(a => a.balance > 0)
                                   .reduce((s, a) => s + a.balance, 0);
        const negative  = accounts.filter(a => a.balance < 0)
                                   .reduce((s, a) => s + a.balance, 0);

        container.innerHTML = `
            <div class="card glass glass-primary glass-hover mb-3"
                 style="margin-bottom:var(--space-5);">
                <div class="card-body">
                    <div style="display:flex;align-items:center;
                                justify-content:space-between;
                                flex-wrap:wrap;gap:var(--space-4);">
                        <div>
                            <div style="font-size:var(--text-sm);
                                        color:var(--text-muted);
                                        margin-bottom:var(--space-2);">
                                💎 Total Net Worth
                            </div>
                            <div style="font-size:var(--text-4xl);
                                        font-weight:var(--weight-black);
                                        color:${netWorth >= 0
                                            ? 'var(--primary)'
                                            : 'var(--danger)'};
                                        letter-spacing:var(--tracking-tight);"
                                 id="netWorthValue">
                                ${fmt(Math.abs(netWorth))}
                            </div>
                            <div style="font-size:var(--text-sm);
                                        color:var(--text-muted);
                                        margin-top:var(--space-1);">
                                Across ${accounts.length} account${accounts.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                        <div style="display:flex;gap:var(--space-6);">
                            <div style="text-align:center;">
                                <div style="font-size:var(--text-xs);
                                            color:var(--text-muted);
                                            margin-bottom:4px;">Assets</div>
                                <div style="font-size:var(--text-xl);
                                            font-weight:var(--weight-extrabold);
                                            color:var(--success);">
                                    ${fmt(positive)}
                                </div>
                            </div>
                            <div style="text-align:center;">
                                <div style="font-size:var(--text-xs);
                                            color:var(--text-muted);
                                            margin-bottom:4px;">Liabilities</div>
                                <div style="font-size:var(--text-xl);
                                            font-weight:var(--weight-extrabold);
                                            color:${negative < 0
                                                ? 'var(--danger)'
                                                : 'var(--text-muted)'};">
                                    ${fmt(Math.abs(negative))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Animate net worth
        setTimeout(() => {
            const el = document.getElementById('netWorthValue');
            if (el) Animations.countUp(el, Math.abs(netWorth), 1000,
                getCurrencySymbol());
        }, 100);
    },

    /* ════════════════════════
       ACCOUNTS GRID
    ════════════════════════ */
    renderAccountsGrid() {
        const container = document.getElementById('accountsGrid');
        if (!container) return;

        const accounts = Store.getAccounts();

        if (!accounts.length) {
            container.innerHTML = `<div class="col-span-full">
                ${emptyStateHTML(
                    '🏦', 'No accounts yet',
                    'Add your bank accounts and wallets',
                    'Add Account', 'openAccountModal()'
                )}
            </div>`;
            return;
        }

        container.innerHTML = accounts.map(acc => {
            const stats = Store.getAccountStats(acc.id);
            return this.accountCardHTML(acc, stats);
        }).join('');

        // Add button
        container.innerHTML += `
            <button class="goal-add-card glass hover-lift"
                    onclick="openAccountModal()">
                <i class="fas fa-plus"></i>
                <span>Add Account</span>
            </button>
        `;

        // Animate balances
        setTimeout(() => {
            accounts.forEach(acc => {
                const el = document.getElementById(`accBal_${acc.id}`);
                if (el) Animations.countUp(el, Math.abs(acc.balance), 900,
                    getCurrencySymbol());
            });
        }, 150);
    },

    accountCardHTML(acc, stats) {
        const typeConfig = {
            bank:       { icon: 'fa-university',  label: 'Bank Account',    clr: 'var(--primary)'  },
            cash:       { icon: 'fa-money-bill',   label: 'Cash Wallet',     clr: 'var(--success)'  },
            credit:     { icon: 'fa-credit-card',  label: 'Credit Card',     clr: 'var(--secondary)'},
            savings:    { icon: 'fa-piggy-bank',   label: 'Savings Account', clr: 'var(--warning)'  },
            investment: { icon: 'fa-chart-line',   label: 'Investment',      clr: 'var(--info)'     }
        };

        const cfg = typeConfig[acc.type] || typeConfig.bank;

        return `
            <div class="account-card-item glass glass-hover hover-lift hover-shine">
                <!-- Header -->
                <div class="acc-card-header">
                    <div class="acc-icon-wrap"
                         style="background:${cfg.clr}18;color:${cfg.clr};">
                        ${acc.emoji || '<i class="fas ' + cfg.icon + '"></i>'}
                    </div>
                    <div class="acc-header-right">
                        <span class="acc-type-badge"
                              style="background:${cfg.clr}15;color:${cfg.clr};">
                            ${cfg.label}
                        </span>
                        <div class="acc-actions">
                            <button class="btn-icon"
                                    onclick="deleteAccountItem('${acc.id}')"
                                    title="Delete account"
                                    style="width:28px;height:28px;border-radius:6px;
                                           opacity:0;transition:opacity 0.2s ease;"
                                    class="acc-delete-btn">
                                <i class="fas fa-trash"
                                   style="font-size:0.65rem;
                                          color:var(--danger);"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Account Name -->
                <div class="acc-name">${acc.name}</div>

                <!-- Balance -->
                <div class="acc-balance-label">Current Balance</div>
                <div class="acc-balance"
                     id="accBal_${acc.id}"
                     style="color:${acc.balance >= 0
                         ? cfg.clr
                         : 'var(--danger)'};">
                    ${acc.balance < 0 ? '-' : ''}${fmt(Math.abs(acc.balance))}
                </div>

                <!-- Divider -->
                <div class="acc-divider"></div>

                <!-- Stats -->
                <div class="acc-stats">
                    <div class="acc-stat">
                        <span class="acc-stat-label">Income</span>
                        <span class="acc-stat-value text-success">
                            ${fmt(stats.income)}
                        </span>
                    </div>
                    <div class="acc-stat">
                        <span class="acc-stat-label">Expenses</span>
                        <span class="acc-stat-value text-danger">
                            ${fmt(stats.expense)}
                        </span>
                    </div>
                    <div class="acc-stat">
                        <span class="acc-stat-label">Transactions</span>
                        <span class="acc-stat-value"
                              style="color:var(--text-secondary);">
                            ${stats.count}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }
};

/* ── Hover to show delete button ── */
document.addEventListener('mouseover', e => {
    const card = e.target.closest('.account-card-item');
    if (!card) return;
    const btn = card.querySelector('.acc-delete-btn');
    if (btn) btn.style.opacity = '1';
});

document.addEventListener('mouseout', e => {
    const card = e.target.closest('.account-card-item');
    if (!card) return;
    if (!card.contains(e.relatedTarget)) {
        const btn = card.querySelector('.acc-delete-btn');
        if (btn) btn.style.opacity = '0';
    }
});

function deleteAccountItem(id) {
    const acc = Store.getAccountById(id);
    if (!acc) return;

    if (Store.getAccounts().length <= 1) {
        Toast.error('You need at least one account.');
        return;
    }

    openConfirmModal(
        'Delete Account?',
        `"${acc.emoji || ''} ${acc.name}" and all its associations will be removed.`,
        () => {
            Store.deleteAccount(id);
            Toast.success('Account removed.');
            Accounts.render();
        }
    );
}