/* ============================================================
   AITOOLCOR MONEYWISE - DATA STORE
   File: js/store.js
   Description: Complete LocalStorage Data Manager
   All CRUD operations for all entities
   ============================================================ */

const APP_VERSION  = '2.0.0';
const STORAGE_KEY  = 'aitoolcor_mw_data';
const AUTH_KEY     = 'aitoolcor_mw_auth';
const SESSION_KEY  = 'aitoolcor_mw_session';

/* ════════════════════════════════════════════════
   DATA STORE CLASS
════════════════════════════════════════════════ */
class DataStore {

    constructor() {
        this.data = this._load();
    }

    /* ── DEFAULT DATA TEMPLATE ── */
    _getDefault() {
        return {
            version:  APP_VERSION,
            settings: {
                name:         'User',
                currency:     'USD',
                notifications: {
                    budgetAlerts:  true,
                    billReminders: true,
                    weeklySummary: false,
                    goalUpdates:   true
                }
            },
            transactions: [],
            accounts: [
                {
                    id:        this._id(),
                    name:      'Main Bank',
                    type:      'bank',
                    balance:   5000,
                    emoji:     '🏦',
                    createdAt: new Date().toISOString()
                },
                {
                    id:        this._id(),
                    name:      'Cash Wallet',
                    type:      'cash',
                    balance:   500,
                    emoji:     '💵',
                    createdAt: new Date().toISOString()
                },
                {
                    id:        this._id(),
                    name:      'Credit Card',
                    type:      'credit',
                    balance:   -200,
                    emoji:     '💳',
                    createdAt: new Date().toISOString()
                }
            ],
            budgets: [
                { id: this._id(), category: 'food',          limit: 500 },
                { id: this._id(), category: 'transport',     limit: 200 },
                { id: this._id(), category: 'shopping',      limit: 400 },
                { id: this._id(), category: 'entertainment', limit: 150 },
                { id: this._id(), category: 'bills',         limit: 300 }
            ],
            goals: [
                {
                    id:        this._id(),
                    name:      'Emergency Fund',
                    target:    10000,
                    saved:     3500,
                    emoji:     '🏦',
                    deadline:  '2025-12-31',
                    createdAt: new Date().toISOString()
                },
                {
                    id:        this._id(),
                    name:      'New Laptop',
                    target:    1500,
                    saved:     800,
                    emoji:     '💻',
                    deadline:  '2025-06-30',
                    createdAt: new Date().toISOString()
                },
                {
                    id:        this._id(),
                    name:      'Vacation Trip',
                    target:    3000,
                    saved:     1200,
                    emoji:     '✈️',
                    deadline:  '2025-08-15',
                    createdAt: new Date().toISOString()
                }
            ],
            bills: [
                { id: this._id(), name: 'Netflix',        amount: 15.99, dueDay: 15, emoji: '📺', category: 'subscriptions', paid: false },
                { id: this._id(), name: 'Electricity',    amount: 120,   dueDay: 20, emoji: '⚡', category: 'bills',          paid: false },
                { id: this._id(), name: 'Internet',       amount: 59.99, dueDay: 5,  emoji: '🌐', category: 'bills',          paid: true  },
                { id: this._id(), name: 'Phone Bill',     amount: 45,    dueDay: 10, emoji: '📱', category: 'bills',          paid: false },
                { id: this._id(), name: 'Spotify',        amount: 9.99,  dueDay: 22, emoji: '🎵', category: 'subscriptions', paid: false },
                { id: this._id(), name: 'Gym Membership', amount: 30,    dueDay: 1,  emoji: '💪', category: 'health',         paid: true  }
            ],
            createdAt:   new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };
    }

    /* ── GENERATE UNIQUE ID ── */
    _id() {
        return Date.now().toString(36) +
               Math.random().toString(36).substr(2, 7);
    }

    /* ── DATE OFFSET HELPER ── */
    _dateOffset(days) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
    }

    /* ── LOAD DATA ── */
    _load() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.transactions)) {
                    return this._migrate(parsed);
                }
            }
        } catch (e) {
            console.warn('Store: Failed to load data', e);
        }
        return this._initWithSampleData();
    }

    /* ── DATA MIGRATION (version upgrades) ── */
    _migrate(data) {
        // Ensure all required keys exist
        if (!data.settings)      data.settings = this._getDefault().settings;
        if (!data.accounts)      data.accounts = this._getDefault().accounts;
        if (!data.budgets)       data.budgets  = this._getDefault().budgets;
        if (!data.goals)         data.goals    = this._getDefault().goals;
        if (!data.bills)         data.bills    = this._getDefault().bills;

        // Ensure settings sub-keys
        if (!data.settings.notifications) {
            data.settings.notifications = this._getDefault().settings.notifications;
        }

        // Ensure each transaction has required fields
        data.transactions = data.transactions.map(t => ({
            notes:     '',
            tags:      [],
            ...t
        }));

        data.version = APP_VERSION;
        return data;
    }

    /* ── INIT WITH SAMPLE DATA ── */
    _initWithSampleData() {
        const data = this._getDefault();
        const acc0 = data.accounts[0].id;
        const acc1 = data.accounts[1].id;
        const acc2 = data.accounts[2].id;

        const samples = [
            // Income
            { type:'income',  amount:4500,  category:'salary',        description:'Monthly Salary',         daysAgo:1,  account:acc0 },
            { type:'income',  amount:1200,  category:'freelance',     description:'Web Dev Project',        daysAgo:4,  account:acc0 },
            { type:'income',  amount:500,   category:'freelance',     description:'Logo Design',            daysAgo:8,  account:acc0 },
            { type:'income',  amount:200,   category:'investment',    description:'Dividend Income',        daysAgo:12, account:acc0 },
            { type:'income',  amount:800,   category:'freelance',     description:'Content Writing',        daysAgo:15, account:acc0 },
            { type:'income',  amount:3800,  category:'salary',        description:'Monthly Salary',         daysAgo:32, account:acc0 },
            { type:'income',  amount:650,   category:'freelance',     description:'App Development',        daysAgo:28, account:acc0 },
            { type:'income',  amount:100,   category:'gift_income',   description:'Birthday Gift',          daysAgo:20, account:acc1 },
            // Expenses
            { type:'expense', amount:65,    category:'food',          description:'Grocery Shopping',       daysAgo:1,  account:acc0 },
            { type:'expense', amount:35,    category:'transport',     description:'Uber Rides',             daysAgo:2,  account:acc1 },
            { type:'expense', amount:120,   category:'shopping',      description:'New Headphones',         daysAgo:3,  account:acc2 },
            { type:'expense', amount:89,    category:'bills',         description:'Electric Bill',          daysAgo:4,  account:acc0 },
            { type:'expense', amount:45,    category:'entertainment', description:'Movie & Dinner',         daysAgo:5,  account:acc1 },
            { type:'expense', amount:150,   category:'health',        description:'Doctor Visit',           daysAgo:6,  account:acc0 },
            { type:'expense', amount:200,   category:'education',     description:'React Course',           daysAgo:9,  account:acc2 },
            { type:'expense', amount:30,    category:'food',          description:'Pizza Order',            daysAgo:7,  account:acc1 },
            { type:'expense', amount:15.99, category:'subscriptions', description:'Netflix Subscription',   daysAgo:10, account:acc0 },
            { type:'expense', amount:9.99,  category:'subscriptions', description:'Spotify Premium',        daysAgo:10, account:acc0 },
            { type:'expense', amount:55,    category:'transport',     description:'Gas Station Fill-up',    daysAgo:11, account:acc0 },
            { type:'expense', amount:80,    category:'food',          description:'Restaurant Dinner',      daysAgo:13, account:acc2 },
            { type:'expense', amount:40,    category:'personal',      description:'Haircut & Grooming',     daysAgo:14, account:acc1 },
            { type:'expense', amount:250,   category:'shopping',      description:'New Running Shoes',      daysAgo:16, account:acc2 },
            { type:'expense', amount:100,   category:'gifts',         description:'Birthday Gift',          daysAgo:18, account:acc0 },
            { type:'expense', amount:95,    category:'food',          description:'Weekly Groceries',       daysAgo:20, account:acc0 },
            { type:'expense', amount:60,    category:'transport',     description:'Monthly Bus Pass',       daysAgo:25, account:acc1 },
            { type:'expense', amount:180,   category:'bills',         description:'Water & Gas Bill',       daysAgo:22, account:acc0 },
            { type:'expense', amount:350,   category:'housing',       description:'Utilities & Maintenance',daysAgo:30, account:acc0 },
            { type:'expense', amount:25,    category:'food',          description:'Coffee & Snacks',        daysAgo:2,  account:acc1 },
        ];

        data.transactions = samples.map(s => ({
            id:          this._id(),
            type:        s.type,
            amount:      s.amount,
            category:    s.category,
            description: s.description,
            date:        this._dateOffset(-s.daysAgo),
            account:     s.account,
            notes:       '',
            tags:        [],
            createdAt:   new Date().toISOString()
        }));

        this._save(data);
        return data;
    }

    /* ── SAVE DATA ── */
    _save(data) {
        data = data || this.data;
        data.lastUpdated = new Date().toISOString();
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch(e) {
            console.error('Store: Failed to save data', e);
        }
    }

    save() { this._save(this.data); }

    /* ════════════════════════
       SETTINGS
    ════════════════════════ */
    getSettings()           { return this.data.settings; }
    getCurrency()           { return this.data.settings.currency || 'USD'; }
    getUserName()           { return this.data.settings.name || 'User'; }

    updateSettings(updates) {
        Object.assign(this.data.settings, updates);
        this.save();
    }

    updateNotifications(updates) {
        Object.assign(this.data.settings.notifications, updates);
        this.save();
    }

    /* ════════════════════════
       TRANSACTIONS
    ════════════════════════ */
    getTransactions()         { return this.data.transactions || []; }
    getTransactionById(id)    { return this.data.transactions.find(t => t.id === id); }

    addTransaction(tx) {
        tx.id        = this._id();
        tx.createdAt = new Date().toISOString();

        this.data.transactions.push(tx);

        // Update account balance
        const acc = this.data.accounts.find(a => a.id === tx.account);
        if (acc) {
            acc.balance += tx.type === 'income' ? tx.amount : -tx.amount;
        }

        this.save();
        return tx;
    }

    updateTransaction(id, updates) {
        const idx = this.data.transactions.findIndex(t => t.id === id);
        if (idx === -1) return null;

        const old = this.data.transactions[idx];

        // Reverse old account effect
        const oldAcc = this.data.accounts.find(a => a.id === old.account);
        if (oldAcc) {
            oldAcc.balance += old.type === 'income' ? -old.amount : old.amount;
        }

        // Apply updates
        this.data.transactions[idx] = { ...old, ...updates };
        const updated = this.data.transactions[idx];

        // Apply new account effect
        const newAcc = this.data.accounts.find(a => a.id === updated.account);
        if (newAcc) {
            newAcc.balance += updated.type === 'income' ? updated.amount : -updated.amount;
        }

        this.save();
        return updated;
    }

    deleteTransaction(id) {
        const tx = this.data.transactions.find(t => t.id === id);
        if (!tx) return false;

        // Reverse account effect
        const acc = this.data.accounts.find(a => a.id === tx.account);
        if (acc) {
            acc.balance += tx.type === 'income' ? -tx.amount : tx.amount;
        }

        this.data.transactions = this.data.transactions.filter(t => t.id !== id);
        this.save();
        return true;
    }

    /* ── Transaction Filters ── */
    filterTransactions({
        type     = 'all',
        category = 'all',
        account  = 'all',
        from     = null,
        to       = null,
        sort     = 'newest',
        search   = '',
        month    = null,
        year     = null
    } = {}) {
        let list = [...this.data.transactions];

        if (type !== 'all')     list = list.filter(t => t.type === type);
        if (category !== 'all') list = list.filter(t => t.category === category);
        if (account !== 'all')  list = list.filter(t => t.account === account);
        if (from)               list = list.filter(t => t.date >= from);
        if (to)                 list = list.filter(t => t.date <= to);

        if (month !== null && year !== null) {
            list = list.filter(t => {
                const d = new Date(t.date);
                return d.getMonth() === month && d.getFullYear() === year;
            });
        }

        if (search) {
            const q = search.toLowerCase();
            list = list.filter(t =>
                t.description.toLowerCase().includes(q) ||
                t.category.toLowerCase().includes(q) ||
                (t.notes && t.notes.toLowerCase().includes(q))
            );
        }

        switch(sort) {
            case 'newest':  list.sort((a, b) => new Date(b.date) - new Date(a.date)); break;
            case 'oldest':  list.sort((a, b) => new Date(a.date) - new Date(b.date)); break;
            case 'highest': list.sort((a, b) => b.amount - a.amount); break;
            case 'lowest':  list.sort((a, b) => a.amount - b.amount); break;
        }

        return list;
    }

    /* ════════════════════════
       STATISTICS
    ════════════════════════ */
    getMonthStats(month, year) {
        const now   = new Date();
        const m     = month !== undefined ? month : now.getMonth();
        const y     = year  !== undefined ? year  : now.getFullYear();

        const monthTx = this.data.transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === m && d.getFullYear() === y;
        });

        const income  = monthTx.filter(t => t.type === 'income')
                                .reduce((s, t) => s + t.amount, 0);
        const expense = monthTx.filter(t => t.type === 'expense')
                                .reduce((s, t) => s + t.amount, 0);
        const balance = this.data.accounts.reduce((s, a) => s + a.balance, 0);
        const savings = income - expense;
        const rate    = income > 0 ? Math.round((savings / income) * 100) : 0;

        return {
            income, expense, balance, savings,
            savingsRate: rate,
            txCount: monthTx.length,
            monthTx
        };
    }

    getAllTimeStats() {
        const all     = this.data.transactions;
        const income  = all.filter(t => t.type === 'income') .reduce((s,t) => s+t.amount, 0);
        const expense = all.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0);
        const balance = this.data.accounts.reduce((s, a) => s + a.balance, 0);
        return { income, expense, balance, savings: income - expense, txCount: all.length };
    }

    getYearStats(year) {
        const y      = year || new Date().getFullYear();
        const yearTx = this.data.transactions.filter(t => new Date(t.date).getFullYear() === y);
        const income  = yearTx.filter(t => t.type === 'income') .reduce((s,t) => s+t.amount, 0);
        const expense = yearTx.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0);
        const balance = this.data.accounts.reduce((s, a) => s + a.balance, 0);
        return { income, expense, balance, savings: income - expense, txCount: yearTx.length };
    }

    getCategoryBreakdown(type = 'expense', month, year) {
        const { monthTx } = this.getMonthStats(month, year);
        const filtered    = monthTx.filter(t => t.type === type);
        const map         = {};

        filtered.forEach(t => {
            map[t.category] = (map[t.category] || 0) + t.amount;
        });

        return Object.entries(map)
            .sort((a, b) => b[1] - a[1])
            .map(([category, amount]) => ({
                category,
                amount,
                info: this.getCategoryInfo(category)
            }));
    }

    getCategoryInfo(id) {
        const all = [
            ...(typeof CATEGORIES !== 'undefined'
                ? [...CATEGORIES.income, ...CATEGORIES.expense]
                : [])
        ];
        return all.find(c => c.id === id) || {
            id, name: id, icon: 'fa-circle', emoji: '📦', color: '#94A3B8'
        };
    }

    getWeeklyData() {
        const now         = new Date();
        const startOfWeek = new Date(now);
        const day         = now.getDay();
        const diff        = day === 0 ? -6 : 1 - day; // Monday start
        startOfWeek.setDate(now.getDate() + diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const labels  = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
        const income  = Array(7).fill(0);
        const expense = Array(7).fill(0);

        this.data.transactions.forEach(t => {
            const d    = new Date(t.date);
            const diff = Math.floor((d - startOfWeek) / 86400000);
            if (diff >= 0 && diff < 7) {
                if (t.type === 'income')  income[diff]  += t.amount;
                else                       expense[diff] += t.amount;
            }
        });

        return { labels, income, expense };
    }

    getMonthlyData(count = 6) {
        const now     = new Date();
        const labels  = [];
        const income  = [];
        const expense = [];

        for (let i = count - 1; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            labels.push(d.toLocaleString('en', { month: 'short' }));

            const m   = d.getMonth();
            const y   = d.getFullYear();
            const txs = this.data.transactions.filter(t => {
                const td = new Date(t.date);
                return td.getMonth() === m && td.getFullYear() === y;
            });

            income.push(txs.filter(t => t.type === 'income') .reduce((s,t) => s+t.amount, 0));
            expense.push(txs.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0));
        }

        return { labels, income, expense };
    }

    getYearlyData(count = 5) {
        const now     = new Date();
        const labels  = [];
        const income  = [];
        const expense = [];

        for (let i = count - 1; i >= 0; i--) {
            const y   = now.getFullYear() - i;
            const txs = this.data.transactions.filter(t => new Date(t.date).getFullYear() === y);
            labels.push(y.toString());
            income.push(txs.filter(t => t.type === 'income') .reduce((s,t) => s+t.amount, 0));
            expense.push(txs.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0));
        }

        return { labels, income, expense };
    }

    /* Budget status */
    getBudgetStatus() {
        const { monthTx } = this.getMonthStats();
        return this.data.budgets.map(budget => {
            const spent = monthTx
                .filter(t => t.type === 'expense' && t.category === budget.category)
                .reduce((s, t) => s + t.amount, 0);
            const pct    = budget.limit > 0 ? Math.min(Math.round((spent / budget.limit) * 100), 999) : 0;
            const status = pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'safe';
            return {
                ...budget,
                spent,
                remaining:  Math.max(0, budget.limit - spent),
                percentage: pct,
                status,
                info:       this.getCategoryInfo(budget.category)
            };
        });
    }

    /* Financial health score (0-100) */
    getHealthScore() {
        const stats       = this.getMonthStats();
        const budgets     = this.getBudgetStatus();
        let   score       = 50;

        // Savings rate adds points
        if (stats.savingsRate >= 30) score += 25;
        else if (stats.savingsRate >= 20) score += 15;
        else if (stats.savingsRate >= 10) score += 5;
        else if (stats.savingsRate < 0)   score -= 20;

        // Budget compliance
        const overBudget  = budgets.filter(b => b.status === 'danger').length;
        const warnBudget  = budgets.filter(b => b.status === 'warning').length;
        score -= overBudget * 10;
        score -= warnBudget * 5;

        // Has transactions this month
        if (stats.txCount > 0) score += 10;

        // Has goals
        if (this.data.goals.length > 0) score += 10;

        // Has accounts set up
        if (this.data.accounts.length >= 2) score += 5;

        return Math.max(0, Math.min(100, score));
    }

    /* ════════════════════════
       ACCOUNTS
    ════════════════════════ */
    getAccounts()       { return this.data.accounts || []; }
    getAccountById(id)  { return this.data.accounts.find(a => a.id === id); }
    getNetWorth()       { return this.data.accounts.reduce((s, a) => s + a.balance, 0); }

    addAccount(account) {
        account.id        = this._id();
        account.createdAt = new Date().toISOString();
        this.data.accounts.push(account);
        this.save();
        return account;
    }

    updateAccount(id, updates) {
        const acc = this.data.accounts.find(a => a.id === id);
        if (acc) { Object.assign(acc, updates); this.save(); }
        return acc;
    }

    deleteAccount(id) {
        if (this.data.accounts.length <= 1) return false;
        // Move transactions to first account
        const first = this.data.accounts.find(a => a.id !== id);
        this.data.transactions.forEach(t => {
            if (t.account === id) t.account = first ? first.id : null;
        });
        this.data.accounts = this.data.accounts.filter(a => a.id !== id);
        this.save();
        return true;
    }

    getAccountStats(id) {
        const txs = this.data.transactions.filter(t => t.account === id);
        return {
            count:   txs.length,
            income:  txs.filter(t => t.type === 'income') .reduce((s,t) => s+t.amount, 0),
            expense: txs.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0)
        };
    }

    /* ════════════════════════
       BUDGETS
    ════════════════════════ */
    getBudgets()      { return this.data.budgets || []; }
    getBudgetById(id) { return this.data.budgets.find(b => b.id === id); }

    addBudget(budget) {
        const exists = this.data.budgets.find(b => b.category === budget.category);
        if (exists) {
            exists.limit = budget.limit;
            this.save();
            return exists;
        }
        budget.id = this._id();
        this.data.budgets.push(budget);
        this.save();
        return budget;
    }

    updateBudget(id, updates) {
        const b = this.data.budgets.find(b => b.id === id);
        if (b) { Object.assign(b, updates); this.save(); }
        return b;
    }

    deleteBudget(id) {
        this.data.budgets = this.data.budgets.filter(b => b.id !== id);
        this.save();
        return true;
    }

    /* ════════════════════════
       GOALS
    ════════════════════════ */
    getGoals()      { return this.data.goals || []; }
    getGoalById(id) { return this.data.goals.find(g => g.id === id); }

    addGoal(goal) {
        goal.id        = this._id();
        goal.createdAt = new Date().toISOString();
        this.data.goals.push(goal);
        this.save();
        return goal;
    }

    updateGoal(id, updates) {
        const g = this.data.goals.find(g => g.id === id);
        if (g) { Object.assign(g, updates); this.save(); }
        return g;
    }

    addToGoal(id, amount) {
        const g = this.data.goals.find(g => g.id === id);
        if (!g) return null;
        g.saved = Math.min(g.saved + Number(amount), g.target);
        this.save();
        return g;
    }

    deleteGoal(id) {
        this.data.goals = this.data.goals.filter(g => g.id !== id);
        this.save();
        return true;
    }

    /* ════════════════════════
       BILLS
    ════════════════════════ */
    getBills()      { return this.data.bills || []; }
    getBillById(id) { return this.data.bills.find(b => b.id === id); }

    addBill(bill) {
        bill.id   = this._id();
        bill.paid = false;
        this.data.bills.push(bill);
        this.save();
        return bill;
    }

    updateBill(id, updates) {
        const b = this.data.bills.find(b => b.id === id);
        if (b) { Object.assign(b, updates); this.save(); }
        return b;
    }

    payBill(id) {
        return this.updateBill(id, { paid: true });
    }

    unpayBill(id) {
        return this.updateBill(id, { paid: false });
    }

    deleteBill(id) {
        this.data.bills = this.data.bills.filter(b => b.id !== id);
        this.save();
        return true;
    }

    resetBills() {
        this.data.bills.forEach(b => b.paid = false);
        this.save();
    }

    getBillStats() {
        const today  = new Date().getDate();
        const bills  = this.data.bills;
        const total  = bills.reduce((s, b) => s + b.amount, 0);
        const paid   = bills.filter(b => b.paid);
        const unpaid = bills.filter(b => !b.paid);
        const overdue = unpaid.filter(b => today > b.dueDay);
        const upcoming = unpaid.filter(b => {
            const diff = b.dueDay - today;
            return diff >= 0 && diff <= 7;
        });

        return {
            total,
            totalCount:    bills.length,
            paidCount:     paid.length,
            unpaidCount:   unpaid.length,
            overdueCount:  overdue.length,
            upcomingCount: upcoming.length,
            paidAmount:    paid.reduce((s,b) => s+b.amount, 0),
            unpaidAmount:  unpaid.reduce((s,b) => s+b.amount, 0),
            overdue,
            upcoming
        };
    }

    /* ════════════════════════
       EXPORT / IMPORT
    ════════════════════════ */
    exportAll() {
        return JSON.stringify(this.data, null, 2);
    }

    exportCSV() {
        const headers = [
            'Date','Type','Category','Description',
            'Amount','Account','Notes'
        ].join(',');

        const rows = this.data.transactions.map(t => {
            const cat = this.getCategoryInfo(t.category);
            const acc = this.getAccountById(t.account);
            return [
                t.date,
                t.type,
                `"${cat.name}"`,
                `"${t.description}"`,
                t.amount,
                `"${acc ? acc.name : 'Unknown'}"`,
                `"${t.notes || ''}"`
            ].join(',');
        });

        return [headers, ...rows].join('\n');
    }

    exportTransactionsJSON() {
        return JSON.stringify(this.data.transactions, null, 2);
    }

    importData(jsonStr) {
        try {
            const d = JSON.parse(jsonStr);
            if (d && Array.isArray(d.transactions)) {
                this.data = this._migrate(d);
                this.save();
                return true;
            }
            return false;
        } catch(e) {
            return false;
        }
    }

    clearAll() {
        const fresh         = this._getDefault();
        fresh.transactions  = [];
        fresh.settings      = this.data.settings; // keep settings
        this.data           = fresh;
        this.save();
    }

    /* ════════════════════════
       AUTH HELPERS
    ════════════════════════ */
    static getAuthUser() {
        try {
            return JSON.parse(localStorage.getItem(AUTH_KEY));
        } catch(e) { return null; }
    }

    static isLoggedIn() {
        try {
            const auth    = JSON.parse(localStorage.getItem(AUTH_KEY));
            const session = JSON.parse(localStorage.getItem(SESSION_KEY));
            if (!auth || !session) return false;
            if (Date.now() > session.expires) return false;
            return true;
        } catch(e) { return false; }
    }

    static logout() {
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem(SESSION_KEY);
        window.location.href = 'index.html';
    }
}

/* ── GLOBAL STORE INSTANCE ── */
const Store = new DataStore();