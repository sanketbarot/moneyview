/* ============================================================
   AITOOLCOR MONEYWISE - BILLS
   File: js/bills.js
   ============================================================ */

const Bills = {

    render() {
        this.renderSummaryCards();
        this.renderBillsList();
    },

    /* ════════════════════════
       SUMMARY CARDS
    ════════════════════════ */
    renderSummaryCards() {
        const container = document.getElementById('billsSummaryCards');
        if (!container) return;

        const stats = Store.getBillStats();

        const cards = [
            {
                icon:  'fa-file-invoice-dollar',
                clr:   'var(--primary)',
                bg:    'var(--primary-bg)',
                label: 'Total Monthly',
                value: fmt(stats.total),
                sub:   `${stats.totalCount} bills`
            },
            {
                icon:  'fa-check-circle',
                clr:   'var(--success)',
                bg:    'var(--success-bg)',
                label: 'Paid',
                value: fmt(stats.paidAmount),
                sub:   `${stats.paidCount} paid`
            },
            {
                icon:  'fa-clock',
                clr:   'var(--warning)',
                bg:    'var(--warning-bg)',
                label: 'Unpaid',
                value: fmt(stats.unpaidAmount),
                sub:   `${stats.unpaidCount} pending`
            },
            {
                icon:  'fa-exclamation-triangle',
                clr:   stats.overdueCount > 0 ? 'var(--danger)' : 'var(--success)',
                bg:    stats.overdueCount > 0 ? 'var(--danger-bg)' : 'var(--success-bg)',
                label: 'Overdue',
                value: stats.overdueCount,
                sub:   stats.overdueCount > 0
                    ? 'Needs attention!'
                    : 'All on time ✅'
            }
        ];

        container.innerHTML = cards.map(c => `
            <div class="card glass-hover hover-lift">
                <div class="card-body">
                    <div style="display:flex;align-items:center;
                                gap:var(--space-3);margin-bottom:var(--space-4);">
                        <div style="width:44px;height:44px;
                                    border-radius:var(--radius-md);
                                    background:${c.bg};color:${c.clr};
                                    display:flex;align-items:center;
                                    justify-content:center;
                                    font-size:var(--text-lg);">
                            <i class="fas ${c.icon}"></i>
                        </div>
                    </div>
                    <div style="font-size:var(--text-sm);
                                color:var(--text-muted);margin-bottom:4px;">
                        ${c.label}
                    </div>
                    <div style="font-size:var(--text-2xl);
                                font-weight:var(--weight-extrabold);
                                color:${c.clr};">
                        ${c.value}
                    </div>
                    <div style="font-size:var(--text-xs);
                                color:var(--text-muted);margin-top:4px;">
                        ${c.sub}
                    </div>
                </div>
            </div>
        `).join('');
    },

    /* ════════════════════════
       BILLS LIST
    ════════════════════════ */
    renderBillsList() {
        const container = document.getElementById('billsList');
        if (!container) return;

        const bills = Store.getBills();

        if (!bills.length) {
            container.innerHTML = emptyStateHTML(
                '📄',
                'No bills added',
                'Track your recurring bills and subscriptions',
                'Add Bill',
                'openBillModal()'
            );
            return;
        }

        // Sort: overdue → upcoming → paid
        const today = new Date().getDate();
        const sorted = [...bills].sort((a, b) => {
            if (a.paid && !b.paid) return 1;
            if (!a.paid && b.paid) return -1;
            if (!a.paid && !b.paid) {
                const aOver = today > a.dueDay;
                const bOver = today > b.dueDay;
                if (aOver && !bOver) return -1;
                if (!aOver && bOver) return 1;
                return a.dueDay - b.dueDay;
            }
            return 0;
        });

        container.innerHTML = sorted.map(b => this.billItemHTML(b)).join('');
    },

    billItemHTML(bill) {
        const bs      = getBillStatus(bill.dueDay);
        const statClr = bill.paid     ? 'var(--success)' :
                        bs.status === 'overdue' ? 'var(--danger)'  :
                        bs.status === 'today'   ? 'var(--warning)' :
                        bs.status === 'urgent'  ? 'var(--warning)' :
                        'var(--text-muted)';

        const badgeCls = bill.paid          ? 'badge-success' :
                         bs.status === 'overdue' ? 'badge-danger'  :
                         bs.status === 'today'   ? 'badge-warning' :
                         bs.status === 'urgent'  ? 'badge-warning' :
                         'badge-secondary';

        const badgeText = bill.paid ? 'Paid' : bs.label;

        return `
            <div class="bill-item item-hover-bg
                        ${bill.paid ? 'bill-paid' : ''}">
                <div class="bill-item-left">
                    <div class="bill-emoji-wrap"
                         style="background:${bill.paid
                             ? 'var(--success-bg)'
                             : 'rgba(0,0,0,0.04)'};">
                        ${bill.emoji}
                    </div>
                    <div class="bill-info">
                        <div class="bill-name
                             ${bill.paid ? 'bill-name-paid' : ''}">
                            ${bill.name}
                        </div>
                        <div class="bill-meta">
                            <span style="color:${statClr};
                                         font-size:var(--text-xs);
                                         font-weight:var(--weight-semibold);">
                                ${bill.paid ? '✅ Paid' : `Due on ${bill.dueDay}th`}
                            </span>
                            <span class="bill-cat-tag">
                                ${getCategoryInfo(bill.category)?.emoji || '📄'}
                                ${getCategoryInfo(bill.category)?.name || bill.category}
                            </span>
                        </div>
                    </div>
                </div>

                <div class="bill-item-right">
                    <div class="bill-amount"
                         style="color:${bill.paid
                             ? 'var(--success)'
                             : 'var(--danger)'};">
                        ${fmt(bill.amount)}
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="badge ${badgeCls}">${badgeText}</span>
                        ${!bill.paid ? `
                        <button class="btn btn-success btn-xs hover-lift"
                                onclick="payBillItem('${bill.id}')"
                                title="Mark as Paid">
                            <i class="fas fa-check"></i> Pay
                        </button>` : `
                        <button class="btn btn-secondary btn-xs"
                                onclick="unpayBillItem('${bill.id}')"
                                title="Mark as Unpaid"
                                style="font-size:0.7rem;">
                            Undo
                        </button>`}
                        <button class="btn-icon"
                                onclick="deleteBillItem('${bill.id}')"
                                title="Delete"
                                style="width:30px;height:30px;
                                       border-radius:8px;">
                            <i class="fas fa-trash"
                               style="font-size:0.7rem;
                                      color:var(--danger);"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
};

/* ── Global bill helpers ── */
function payBillItem(id) {
    const bill = Store.getBillById(id);
    if (!bill) return;
    Store.payBill(id);
    Toast.success(`${bill.emoji} ${bill.name} marked as paid!`);
    Bills.render();
    App.generateNotifications();
}

function unpayBillItem(id) {
    Store.unpayBill(id);
    Toast.info('Bill marked as unpaid.');
    Bills.render();
}

function deleteBillItem(id) {
    const bill = Store.getBillById(id);
    if (!bill) return;
    openConfirmModal(
        'Delete Bill?',
        `"${bill.emoji} ${bill.name}" will be removed.`,
        () => {
            Store.deleteBill(id);
            Toast.success('Bill removed.');
            Bills.render();
        }
    );
}

function resetAllBills() {
    openConfirmModal(
        'New Month Reset?',
        'All bills will be marked as unpaid for the new month.',
        () => {
            Store.resetBills();
            Toast.success('Bills reset for new month!');
            Bills.render();
        },
        false
    );
}