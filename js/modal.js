/* ============================================================
   AITOOLCOR MONEYWISE - MODAL SYSTEM
   File: js/modal.js
   Description: Open/Close modals + transaction form logic
   ============================================================ */

/* ── OPEN MODAL ── */
function openModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Focus first input
    setTimeout(() => {
        const firstInput = overlay.querySelector('input:not([type="hidden"]), select, textarea');
        if (firstInput) firstInput.focus();
    }, 350);
}

/* ── CLOSE MODAL ── */
function closeModal(id) {
    const overlay = document.getElementById(id);
    if (!overlay) return;
    overlay.classList.remove('active');

    // Restore scroll only if no other modals open
    const openModals = document.querySelectorAll('.modal-overlay.active');
    if (openModals.length === 0) {
        document.body.style.overflow = '';
    }
}

/* ── CLOSE ALL MODALS ── */
function closeAllModals() {
    document.querySelectorAll('.modal-overlay.active').forEach(m => {
        m.classList.remove('active');
    });
    document.body.style.overflow = '';
}

/* ── ESCAPE KEY CLOSE ── */
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllModals();
});

/* ════════════════════════════════════════════════
   TRANSACTION MODAL
════════════════════════════════════════════════ */

let _txEditId   = null;
let _txType     = 'income';

function openTxModal(txId) {
    _txEditId = txId || null;
    const tx  = txId ? Store.getTransactionById(txId) : null;

    // Set title
    setText('txModalTitle', tx ? '✏️ Edit Transaction' : '➕ Add Transaction');
    setText('txSaveBtn', tx ? 'Update' : 'Save Transaction');

    // Set type
    setTxType(tx ? tx.type : 'income');

    // Populate selects
    populateCategorySelect('txCategory', _txType);
    populateAccountSelect('txAccount');

    // Set date default
    const dateEl = document.getElementById('txDate');
    if (dateEl) dateEl.value = today();

    // Fill form if editing
    if (tx) {
        setValue('txAmount',   tx.amount);
        setValue('txCategory', tx.category);
        setValue('txDate',     tx.date);
        setValue('txAccount',  tx.account);
        setValue('txDesc',     tx.description);
        setValue('txNotes',    tx.notes || '');
    } else {
        resetForm('txModal');
        if (dateEl) dateEl.value = today();
    }

    openModal('txModal');
}

function setTxType(type) {
    _txType = type;

    const incBtn = document.getElementById('typeIncome');
    const expBtn = document.getElementById('typeExpense');

    if (incBtn) incBtn.classList.toggle('active', type === 'income');
    if (expBtn) expBtn.classList.toggle('active', type === 'expense');

    // Re-populate categories for type
    populateCategorySelect('txCategory', type);
}

function saveTx() {
    const amount   = parseFloat(document.getElementById('txAmount')?.value);
    const category = document.getElementById('txCategory')?.value;
    const date     = document.getElementById('txDate')?.value;
    const account  = document.getElementById('txAccount')?.value;
    const desc     = document.getElementById('txDesc')?.value?.trim();
    const notes    = document.getElementById('txNotes')?.value?.trim() || '';

    // Validate
    if (!amount || amount <= 0) {
        Toast.error('Please enter a valid amount.');
        document.getElementById('txAmount')?.focus();
        return;
    }
    if (!date) {
        Toast.error('Please select a date.');
        return;
    }
    if (!desc) {
        Toast.error('Please enter a description.');
        document.getElementById('txDesc')?.focus();
        return;
    }

    const tx = {
        type:        _txType,
        amount:      amount,
        category:    category,
        date:        date,
        account:     account,
        description: desc,
        notes:       notes,
        tags:        []
    };

    if (_txEditId) {
        Store.updateTransaction(_txEditId, tx);
        Toast.success('Transaction updated!');
    } else {
        Store.addTransaction(tx);
        Toast.success(
            `${_txType === 'income' ? 'Income' : 'Expense'} of
             ${fmt(amount)} added!`
        );
    }

    closeModal('txModal');
    _txEditId = null;

    // Check budget alerts
    if (_txType === 'expense') checkBudgetAlert(category);

    // Refresh UI
    refreshAll();
}

/* ════════════════════════════════════════════════
   BUDGET MODAL
════════════════════════════════════════════════ */

function openBudgetModal(budgetId) {
    const budget = budgetId ? Store.getBudgetById(budgetId) : null;

    populateCategorySelect('budgetCategory', 'expense');

    if (budget) {
        setValue('budgetCategory', budget.category);
        setValue('budgetLimit',    budget.limit);
    } else {
        document.getElementById('budgetLimit').value = '';
    }

    openModal('budgetModal');
}

function saveBudget() {
    const category = document.getElementById('budgetCategory')?.value;
    const limit    = parseFloat(document.getElementById('budgetLimit')?.value);

    if (!limit || limit <= 0) {
        Toast.error('Please enter a valid budget limit.');
        return;
    }

    Store.addBudget({ category, limit });
    Toast.success('Budget saved!');
    closeModal('budgetModal');
    refreshCurrentPage();
}

/* ════════════════════════════════════════════════
   GOAL MODAL
════════════════════════════════════════════════ */

let _goalEditId = null;

function openGoalModal(goalId) {
    _goalEditId = goalId || null;
    const goal  = goalId ? Store.getGoalById(goalId) : null;

    setText('goalModalTitle', goal ? '✏️ Edit Goal' : '🎯 Add Goal');
    setText('goalSaveBtn',    goal ? 'Update Goal' : 'Save Goal');

    if (goal) {
        setValue('goalName',     goal.name);
        setValue('goalTarget',   goal.target);
        setValue('goalSaved',    goal.saved);
        setValue('goalEmoji',    goal.emoji || '🎯');
        setValue('goalDeadline', goal.deadline || '');
    } else {
        resetForm('goalModal');
        setValue('goalEmoji', '🎯');
        setValue('goalSaved', '0');
    }

    openModal('goalModal');
}

function saveGoal() {
    const name     = document.getElementById('goalName')?.value?.trim();
    const target   = parseFloat(document.getElementById('goalTarget')?.value);
    const saved    = parseFloat(document.getElementById('goalSaved')?.value) || 0;
    const emoji    = document.getElementById('goalEmoji')?.value || '🎯';
    const deadline = document.getElementById('goalDeadline')?.value || '';

    if (!name) {
        Toast.error('Please enter a goal name.');
        return;
    }
    if (!target || target <= 0) {
        Toast.error('Please enter a valid target amount.');
        return;
    }

    const goal = { name, target, saved, emoji, deadline };

    if (_goalEditId) {
        Store.updateGoal(_goalEditId, goal);
        Toast.success('Goal updated!');
    } else {
        Store.addGoal(goal);
        Toast.success(`Goal "${name}" created!`);
    }

    _goalEditId = null;
    closeModal('goalModal');
    refreshCurrentPage();
}

/* ── Add Funds to Goal ── */
let _addFundsGoalId = null;

function openAddFundsModal(goalId) {
    _addFundsGoalId = goalId;
    const goal = Store.getGoalById(goalId);
    if (!goal) return;

    setText('addFundsGoalName', `${goal.emoji} ${goal.name}`);
    setValue('addFundsAmount', '');

    openModal('addFundsModal');
}

function confirmAddFunds() {
    const amount = parseFloat(document.getElementById('addFundsAmount')?.value);

    if (!amount || amount <= 0) {
        Toast.error('Please enter a valid amount.');
        return;
    }

    const goal = Store.addToGoal(_addFundsGoalId, amount);
    if (!goal) return;

    closeModal('addFundsModal');

    if (goal.saved >= goal.target) {
        Toast.success(`🎉 Goal "${goal.name}" is complete!`);
    } else {
        const pct = Math.round((goal.saved / goal.target) * 100);
        Toast.success(`${fmt(amount)} added to ${goal.name} (${pct}% done)`);
    }

    refreshCurrentPage();
}

/* ════════════════════════════════════════════════
   BILL MODAL
════════════════════════════════════════════════ */

function openBillModal(billId) {
    const bill = billId ? Store.getBillById(billId) : null;

    if (bill) {
        setValue('billName',     bill.name);
        setValue('billAmount',   bill.amount);
        setValue('billDueDay',   bill.dueDay);
        setValue('billEmoji',    bill.emoji);
        setValue('billCategory', bill.category);
    } else {
        resetForm('billModal');
        setValue('billEmoji', '📄');
    }

    openModal('billModal');
}

function saveBill() {
    const name     = document.getElementById('billName')?.value?.trim();
    const amount   = parseFloat(document.getElementById('billAmount')?.value);
    const dueDay   = parseInt(document.getElementById('billDueDay')?.value);
    const emoji    = document.getElementById('billEmoji')?.value || '📄';
    const category = document.getElementById('billCategory')?.value || 'bills';

    if (!name) {
        Toast.error('Please enter a bill name.'); return;
    }
    if (!amount || amount <= 0) {
        Toast.error('Please enter a valid amount.'); return;
    }
    if (!dueDay || dueDay < 1 || dueDay > 31) {
        Toast.error('Due day must be between 1 and 31.'); return;
    }

    Store.addBill({ name, amount, dueDay, emoji, category });
    Toast.success(`Bill "${name}" added!`);
    closeModal('billModal');
    refreshCurrentPage();
}

/* ════════════════════════════════════════════════
   ACCOUNT MODAL
════════════════════════════════════════════════ */

function openAccountModal(accId) {
    const acc = accId ? Store.getAccountById(accId) : null;

    if (acc) {
        setValue('accountName',    acc.name);
        setValue('accountType',    acc.type);
        setValue('accountBalance', acc.balance);
        setValue('accountEmoji',   acc.emoji || '🏦');
    } else {
        resetForm('accountModal');
        setValue('accountEmoji', '🏦');
    }

    openModal('accountModal');
}

function saveAccount() {
    const name    = document.getElementById('accountName')?.value?.trim();
    const type    = document.getElementById('accountType')?.value;
    const balance = parseFloat(document.getElementById('accountBalance')?.value);
    const emoji   = document.getElementById('accountEmoji')?.value || '🏦';

    if (!name) {
        Toast.error('Please enter an account name.'); return;
    }
    if (isNaN(balance)) {
        Toast.error('Please enter a valid balance.'); return;
    }

    Store.addAccount({ name, type, balance, emoji });
    Toast.success(`Account "${name}" added!`);
    closeModal('accountModal');
    refreshCurrentPage();
}

/* ════════════════════════════════════════════════
   CONFIRM MODAL
════════════════════════════════════════════════ */

let _confirmCallback = null;

function openConfirmModal(title, desc, callback, danger = true) {
    _confirmCallback = callback;

    setText('confirmTitle', title);
    setText('confirmDesc',  desc);

    const btn = document.getElementById('confirmActionBtn');
    if (btn) {
        btn.className = `btn ${danger ? 'btn-danger' : 'btn-primary'}`;
    }

    openModal('confirmModal');
}

document.getElementById('confirmActionBtn')?.addEventListener('click', () => {
    if (_confirmCallback) {
        _confirmCallback();
        _confirmCallback = null;
    }
    closeModal('confirmModal');
});

/* ════════════════════════════════════════════════
   FORM HELPERS
════════════════════════════════════════════════ */

function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value;
}

function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
}

function resetForm(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.querySelectorAll('input, select, textarea').forEach(el => {
        if (el.type === 'checkbox') el.checked = false;
        else el.value = '';
    });
}

function populateAccountSelect(selectId) {
    const select   = document.getElementById(selectId);
    if (!select) return;
    const accounts = Store.getAccounts();
    select.innerHTML = accounts.map(a =>
        `<option value="${a.id}">${a.emoji || '🏦'} ${a.name}</option>`
    ).join('');
}

/* ── Budget alert check ── */
function checkBudgetAlert(category) {
    const budgets = Store.getBudgetStatus();
    const b = budgets.find(b => b.category === category);
    if (!b) return;

    if (b.status === 'danger') {
        Toast.warning(
            `⚠️ Budget exceeded for ${b.info.name}! (${b.percentage}% used)`
        );
    } else if (b.status === 'warning') {
        Toast.info(
            `💡 Budget at ${b.percentage}% for ${b.info.name}`
        );
    }
}