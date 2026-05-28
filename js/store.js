/* ============================================================
   AITOOLCOR MONEYWISE - DATA STORE (UPDATED)
   File: js/store.js
   
   ✅ Per-user data isolation (uid-based storage key)
   ✅ Guest → loads dummy sample data
   ✅ New Google/Email user → blank data with INR default
   ✅ Returning user → loads their saved data
   ============================================================ */

const APP_VERSION  = '2.1.0';
const DATA_PREFIX  = 'aitoolcor_mw_data_';
const AUTH_KEY     = 'aitoolcor_mw_auth';
const SESSION_KEY  = 'aitoolcor_mw_session';
const UNDO_KEY     = 'aitoolcor_mw_undo';

class DataStore {

    constructor() {
        this.storageKey = this._getUserKey();
        this.data       = this._load();
        this.undoStack  = [];
    }

    /* ── Get user-specific storage key ── */
    _getUserKey() {
        try {
            const auth = JSON.parse(localStorage.getItem(AUTH_KEY));
            if (auth && auth.uid) {
                return DATA_PREFIX + auth.uid;
            }
        } catch(e) {}
        return DATA_PREFIX + 'default';
    }

    /* ── Check auth flags ── */
    _getAuth() {
        try {
            return JSON.parse(localStorage.getItem(AUTH_KEY));
        } catch(e) { return null; }
    }

    _isGuest() {
        const auth = this._getAuth();
        return auth?.isGuest === true;
    }

    _isNewUser() {
        const auth = this._getAuth();
        return auth?.isNewUser === true;
    }

    /* ── DEFAULT BLANK DATA (for new Google/Email users) ── */
    _getBlankData() {
        const auth = this._getAuth();
        return {
            version:      APP_VERSION,
            settings: {
                name:     auth?.name || 'User',
                currency: 'INR',  // ✅ Default INR
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
                    name:      'Bank Account',
                    type:      'bank',
                    balance:   0,
                    emoji:     '🏦',
                    createdAt: new Date().toISOString()
                },
                {
                    id:        this._id(),
                    name:      'Cash',
                    type:      'cash',
                    balance:   0,
                    emoji:     '💵',
                    createdAt: new Date().toISOString()
                }
            ],
            budgets:     [],
            goals:       [],
            bills:       [],
            templates:   [], // ✅ Recurring templates
            lastBackup:  null,
            streak:      { count: 0, lastDate: null },
            createdAt:   new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };
    }

    /* ── DEFAULT DUMMY DATA (for Guest users) ── */
    _getDummyData() {
        const data = {
            ...this._getBlankData(),
            settings: {
                ...this._getBlankData().settings,
                name: 'Guest User'
            },
            accounts: [
                { id: this._id(), name: 'SBI Bank',    type: 'bank',   balance: 85000,  emoji: '🏦', createdAt: new Date().toISOString() },
                { id: this._id(), name: 'Cash Wallet', type: 'cash',   balance: 3500,   emoji: '💵', createdAt: new Date().toISOString() },
                { id: this._id(), name: 'Credit Card', type: 'credit', balance: -12000, emoji: '💳', createdAt: new Date().toISOString() },
                { id: this._id(), name: 'PPF Savings', type: 'savings',balance: 150000, emoji: '🏛️', createdAt: new Date().toISOString() }
            ],
            budgets: [
                { id: this._id(), category: 'food',          limit: 8000  },
                { id: this._id(), category: 'transport',     limit: 3000  },
                { id: this._id(), category: 'shopping',      limit: 5000  },
                { id: this._id(), category: 'entertainment', limit: 2000  },
                { id: this._id(), category: 'bills',         limit: 5000  },
                { id: this._id(), category: 'health',        limit: 3000  }
            ],
            goals: [
                { id: this._id(), name: 'Emergency Fund',    target: 200000, saved: 85000,  emoji: '🏦', deadline: '2025-12-31', createdAt: new Date().toISOString() },
                { id: this._id(), name: 'New iPhone',        target: 80000,  saved: 35000,  emoji: '📱', deadline: '2025-08-15', createdAt: new Date().toISOString() },
                { id: this._id(), name: 'Goa Trip',          target: 50000,  saved: 22000,  emoji: '🏖️', deadline: '2025-06-30', createdAt: new Date().toISOString() },
                { id: this._id(), name: 'Laptop Upgrade',    target: 70000,  saved: 45000,  emoji: '💻', deadline: '2025-09-01', createdAt: new Date().toISOString() }
            ],
            bills: [
                { id: this._id(), name: 'Netflix',          amount: 649,   dueDay: 15, emoji: '📺', category: 'subscriptions', paid: false },
                { id: this._id(), name: 'Electricity Bill',  amount: 2500,  dueDay: 20, emoji: '⚡', category: 'bills',          paid: false },
                { id: this._id(), name: 'WiFi (Jio Fiber)',  amount: 999,   dueDay: 5,  emoji: '🌐', category: 'bills',          paid: true  },
                { id: this._id(), name: 'Mobile Recharge',   amount: 599,   dueDay: 10, emoji: '📱', category: 'bills',          paid: false },
                { id: this._id(), name: 'Spotify',           amount: 119,   dueDay: 22, emoji: '🎵', category: 'subscriptions', paid: false },
                { id: this._id(), name: 'Gym Membership',    amount: 1500,  dueDay: 1,  emoji: '💪', category: 'health',         paid: true  },
                { id: this._id(), name: 'Rent',              amount: 15000, dueDay: 1,  emoji: '🏠', category: 'housing',        paid: true  },
                { id: this._id(), name: 'Amazon Prime',      amount: 1499,  dueDay: 25, emoji: '📦', category: 'subscriptions', paid: false }
            ],
            templates: [
                { name: 'Monthly Salary',  type: 'income',  amount: 45000, category: 'salary',    description: 'Monthly Salary' },
                { name: 'Rent Payment',    type: 'expense', amount: 15000, category: 'housing',   description: 'Monthly Rent' },
                { name: 'Grocery',         type: 'expense', amount: 3000,  category: 'food',      description: 'Monthly Grocery' },
                { name: 'Petrol',          type: 'expense', amount: 2000,  category: 'transport', description: 'Petrol Fill-up' }
            ]
        };

        // Generate realistic INR sample transactions
        const acc0 = data.accounts[0].id;
        const acc1 = data.accounts[1].id;
        const acc2 = data.accounts[2].id;

        const samples = [
            // Income
            { type:'income',  amount:45000,  category:'salary',       description:'Monthly Salary',             daysAgo:1,  acc:acc0 },
            { type:'income',  amount:12000,  category:'freelance',    description:'Web Development Project',    daysAgo:5,  acc:acc0 },
            { type:'income',  amount:5000,   category:'freelance',    description:'Logo Design Work',           daysAgo:10, acc:acc0 },
            { type:'income',  amount:2500,   category:'investment',   description:'Mutual Fund Dividend',       daysAgo:15, acc:acc0 },
            { type:'income',  amount:8000,   category:'freelance',    description:'App UI Design',              daysAgo:18, acc:acc0 },
            { type:'income',  amount:42000,  category:'salary',       description:'Monthly Salary',             daysAgo:32, acc:acc0 },
            { type:'income',  amount:3000,   category:'gift_income',  description:'Birthday Gift from Uncle',   daysAgo:22, acc:acc1 },
            // Expenses
            { type:'expense', amount:850,    category:'food',         description:'Grocery - Big Bazaar',       daysAgo:1,  acc:acc0 },
            { type:'expense', amount:250,    category:'food',         description:'Swiggy Order - Pizza',       daysAgo:2,  acc:acc1 },
            { type:'expense', amount:1500,   category:'transport',    description:'Petrol Fill-up',             daysAgo:3,  acc:acc0 },
            { type:'expense', amount:3500,   category:'shopping',     description:'Amazon - Headphones',        daysAgo:4,  acc:acc2 },
            { type:'expense', amount:2500,   category:'bills',        description:'Electricity Bill',           daysAgo:5,  acc:acc0 },
            { type:'expense', amount:450,    category:'entertainment',description:'Movie - PVR Cinemas',       daysAgo:6,  acc:acc1 },
            { type:'expense', amount:1200,   category:'health',       description:'Doctor Consultation',        daysAgo:7,  acc:acc0 },
            { type:'expense', amount:2000,   category:'education',    description:'Udemy Course - React',       daysAgo:8,  acc:acc2 },
            { type:'expense', amount:150,    category:'food',         description:'Chai & Samosa',              daysAgo:2,  acc:acc1 },
            { type:'expense', amount:649,    category:'subscriptions',description:'Netflix Subscription',       daysAgo:10, acc:acc0 },
            { type:'expense', amount:119,    category:'subscriptions',description:'Spotify Premium',            daysAgo:10, acc:acc0 },
            { type:'expense', amount:800,    category:'transport',    description:'Ola Rides',                  daysAgo:11, acc:acc1 },
            { type:'expense', amount:2200,   category:'food',         description:'Restaurant - Family Dinner', daysAgo:12, acc:acc2 },
            { type:'expense', amount:500,    category:'personal',     description:'Haircut',                    daysAgo:14, acc:acc1 },
            { type:'expense', amount:4500,   category:'shopping',     description:'Myntra - Shoes',             daysAgo:16, acc:acc2 },
            { type:'expense', amount:1000,   category:'gifts',        description:'Friend Birthday Gift',       daysAgo:19, acc:acc0 },
            { type:'expense', amount:3200,   category:'food',         description:'Weekly Groceries',           daysAgo:21, acc:acc0 },
            { type:'expense', amount:600,    category:'transport',    description:'Metro Card Recharge',        daysAgo:25, acc:acc1 },
            { type:'expense', amount:5000,   category:'bills',        description:'Water & Gas Bill',           daysAgo:23, acc:acc0 },
            { type:'expense', amount:15000,  category:'housing',      description:'Monthly Rent',               daysAgo:30, acc:acc0 },
            { type:'expense', amount:350,    category:'food',         description:'Zomato - Biryani',           daysAgo:3,  acc:acc1 },
            { type:'expense', amount:1800,   category:'health',       description:'Pharmacy - Medicines',       daysAgo:20, acc:acc0 },
            { type:'expense', amount:4000,   category:'shopping',     description:'Croma - Power Bank',         daysAgo:28, acc:acc2 },
        ];

        data.transactions = samples.map(s => ({
            id:          this._id(),
            type:        s.type,
            amount:      s.amount,
            category:    s.category,
            description: s.description,
            date:        this._dateOffset(-s.daysAgo),
            account:     s.acc,
            notes:       '',
            tags:        [],
            createdAt:   new Date().toISOString()
        }));

        return data;
    }

    /* ── LOAD DATA ── */
    _load() {
        // Try to load user-specific data
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed && Array.isArray(parsed.transactions)) {
                    console.log('✅ Loaded saved data for user');
                    return this._migrate(parsed);
                }
            }
        } catch(e) {
            console.warn('Store: load error', e);
        }

        // No existing data — decide blank vs dummy
        const auth = this._getAuth();

        if (auth?.isGuest) {
            // Guest → dummy data
            console.log('👻 Guest mode — loading sample data');
            const data = this._getDummyData();
            this._save(data);
            return data;
        }

        if (auth?.isNewUser) {
            // New Google/Email user → blank data
            console.log('🆕 New user — creating blank data');
            const data = this._getBlankData();
            this._save(data);

            // Mark as no longer new
            if (typeof markUserAsReturning === 'function') {
                markUserAsReturning();
            }
            return data;
        }

        // Fallback — blank data
        console.log('📦 Fallback — blank data');
        const data = this._getBlankData();
        this._save(data);
        return data;
    }

    /* ── DATA MIGRATION ── */
    _migrate(data) {
        if (!data.settings)       data.settings      = this._getBlankData().settings;
        if (!data.accounts)       data.accounts      = [];
        if (!data.budgets)        data.budgets       = [];
        if (!data.goals)          data.goals         = [];
        if (!data.bills)          data.bills         = [];
        if (!data.templates)      data.templates     = [];
        if (!data.streak)         data.streak        = { count: 0, lastDate: null };
        if (!data.settings.notifications)
            data.settings.notifications = this._getBlankData().settings.notifications;

        // Default INR if not set
        if (!data.settings.currency) data.settings.currency = 'INR';

        data.transactions = data.transactions.map(t => ({
            notes: '',
            tags:  [],
            ...t
        }));

        data.version = APP_VERSION;
        return data;
    }

    /* ── GENERATE ID ── */
    _id() {
        return Date.now().toString(36) +
               Math.random().toString(36).substr(2, 7);
    }

    /* ── DATE OFFSET ── */
    _dateOffset(days) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toISOString().split('T')[0];
    }

    /* ── SAVE DATA ── */
    _save(data) {
        data = data || this.data;
        data.lastUpdated = new Date().toISOString();
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        } catch(e) {
            console.error('Store: save error', e);
            // Storage full?
            if (e.name === 'QuotaExceededError') {
                Toast?.error('Storage full! Export and clear old data.');
            }
        }
    }

    save() { this._save(this.data); }

    /* ════════════════════════
       UNDO SYSTEM
    ════════════════════════ */
    pushUndo(action, data) {
        this.undoStack.push({ action, data, time: Date.now() });
        // Keep only last 10
        if (this.undoStack.length > 10) this.undoStack.shift();
    }

    undo() {
        const last = this.undoStack.pop();
        if (!last) return null;

        switch(last.action) {
            case 'delete_tx':
                this.data.transactions.push(last.data);
                // Restore account balance
                const acc = this.data.accounts.find(a => a.id === last.data.account);
                if (acc) {
                    acc.balance += last.data.type === 'income'
                        ? last.data.amount
                        : -last.data.amount;
                }
                this.save();
                return last;

            case 'delete_budget':
                this.data.budgets.push(last.data);
                this.save();
                return last;

            case 'delete_goal':
                this.data.goals.push(last.data);
                this.save();
                return last;

            case 'delete_bill':
                this.data.bills.push(last.data);
                this.save();
                return last;
        }
        return null;
    }

    /* ════════════════════════
       SETTINGS
    ════════════════════════ */
    getSettings()  { return this.data.settings; }
    getCurrency()  { return this.data.settings.currency || 'INR'; }
    getUserName()  { return this.data.settings.name || 'User'; }

    updateSettings(updates) {
        Object.assign(this.data.settings, updates);
        this.save();
    }

    updateNotifications(updates) {
        Object.assign(this.data.settings.notifications, updates);
        this.save();
    }

    /* ════════════════════════
       TRANSACTIONS (enhanced)
    ════════════════════════ */
    getTransactions()      { return this.data.transactions || []; }
    getTransactionById(id) { return this.data.transactions.find(t => t.id === id); }

    addTransaction(tx) {
        tx.id        = this._id();
        tx.createdAt = new Date().toISOString();
        this.data.transactions.push(tx);

        const acc = this.data.accounts.find(a => a.id === tx.account);
        if (acc) acc.balance += tx.type === 'income' ? tx.amount : -tx.amount;

        this.updateStreak();
        this.save();
        return tx;
    }

    updateTransaction(id, updates) {
        const idx = this.data.transactions.findIndex(t => t.id === id);
        if (idx === -1) return null;
        const old = this.data.transactions[idx];

        // Reverse old
        const oldAcc = this.data.accounts.find(a => a.id === old.account);
        if (oldAcc) oldAcc.balance += old.type === 'income' ? -old.amount : old.amount;

        this.data.transactions[idx] = { ...old, ...updates };
        const updated = this.data.transactions[idx];

        // Apply new
        const newAcc = this.data.accounts.find(a => a.id === updated.account);
        if (newAcc) newAcc.balance += updated.type === 'income' ? updated.amount : -updated.amount;

        this.save();
        return updated;
    }

    deleteTransaction(id) {
        const tx = this.data.transactions.find(t => t.id === id);
        if (!tx) return false;

        // Undo support
        this.pushUndo('delete_tx', { ...tx });

        const acc = this.data.accounts.find(a => a.id === tx.account);
        if (acc) acc.balance += tx.type === 'income' ? -tx.amount : tx.amount;

        this.data.transactions = this.data.transactions.filter(t => t.id !== id);
        this.save();
        return true;
    }

    /* ── Duplicate transaction ── */
    duplicateTransaction(id) {
        const tx = this.getTransactionById(id);
        if (!tx) return null;

        const dup = {
            ...tx,
            id:          this._id(),
            date:        new Date().toISOString().split('T')[0],
            description: tx.description + ' (copy)',
            createdAt:   new Date().toISOString()
        };

        this.data.transactions.push(dup);

        const acc = this.data.accounts.find(a => a.id === dup.account);
        if (acc) acc.balance += dup.type === 'income' ? dup.amount : -dup.amount;

        this.save();
        return dup;
    }

    /* ── Batch delete ── */
    deleteTransactions(ids) {
        ids.forEach(id => {
            const tx = this.data.transactions.find(t => t.id === id);
            if (tx) {
                this.pushUndo('delete_tx', { ...tx });
                const acc = this.data.accounts.find(a => a.id === tx.account);
                if (acc) acc.balance += tx.type === 'income' ? -tx.amount : tx.amount;
            }
        });
        this.data.transactions = this.data.transactions.filter(t => !ids.includes(t.id));
        this.save();
        return true;
    }

    /* ── Recently used categories ── */
    getRecentCategories(type = 'expense', limit = 5) {
        const recent = this.data.transactions
            .filter(t => t.type === type)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, 20);

        const catMap = {};
        recent.forEach(t => {
            if (!catMap[t.category]) catMap[t.category] = 0;
            catMap[t.category]++;
        });

        return Object.entries(catMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([cat]) => cat);
    }

    /* ── Today's spending ── */
    getTodayStats() {
        const today = new Date().toISOString().split('T')[0];
        const txs   = this.data.transactions.filter(t => t.date === today);
        return {
            income:  txs.filter(t => t.type === 'income') .reduce((s,t) => s+t.amount, 0),
            expense: txs.filter(t => t.type === 'expense').reduce((s,t) => s+t.amount, 0),
            count:   txs.length,
            txs
        };
    }

    /* ── Streak tracking ── */
    updateStreak() {
        const today  = new Date().toISOString().split('T')[0];
        const streak = this.data.streak || { count: 0, lastDate: null };

        if (streak.lastDate === today) return; // already counted today

        const yesterday = this._dateOffset(-1);
        if (streak.lastDate === yesterday) {
            streak.count++;
        } else if (streak.lastDate !== today) {
            streak.count = 1;
        }

        streak.lastDate = today;
        this.data.streak = streak;
    }

    getStreak() {
        return this.data.streak || { count: 0, lastDate: null };
    }

    /* ── Templates ── */
    getTemplates()    { return this.data.templates || []; }

    addTemplate(template) {
        template.id = this._id();
        this.data.templates.push(template);
        this.save();
        return template;
    }

    deleteTemplate(id) {
        this.data.templates = this.data.templates.filter(t => t.id !== id);
        this.save();
    }

    useTemplate(templateId) {
        const tmpl = this.data.templates.find(t => t.id === templateId);
        if (!tmpl) return null;
        return {
            type:        tmpl.type,
            amount:      tmpl.amount,
            category:    tmpl.category,
            description: tmpl.description,
            date:        new Date().toISOString().split('T')[0],
            account:     this.data.accounts[0]?.id,
            notes:       'From template: ' + tmpl.name,
            tags:        ['template']
        };
    }

    /* ── Data size ── */
    getDataSize() {
        const json = JSON.stringify(this.data);
        const bytes = new Blob([json]).size;
        if (bytes < 1024)        return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    /* ── Auto backup check ── */
    needsBackup() {
        if (!this.data.lastBackup) return true;
        const daysSince = Math.floor(
            (Date.now() - new Date(this.data.lastBackup).getTime()) / 86400000
        );
        return daysSince >= 7;
    }

    markBackupDone() {
        this.data.lastBackup = new Date().toISOString();
        this.save();
    }

    // ══════════════════════════════════════
    // REST OF METHODS (same as before)
    // filterTransactions, getMonthStats, 
    // accounts, budgets, goals, bills,
    // export/import, etc.
    // → All remain unchanged from Step 5
    // ══════════════════════════════════════

    /* KEEPING ALL EXISTING METHODS FROM STEP 5 */
    /* Copy all methods from the Step 5 store.js */
    /* Only the constructor, _load, _getBlankData, */
    /* _getDummyData, deleteTransaction are changed */

    // ... (all other methods from Step 5 remain same)

    /* ── AUTH STATIC METHODS ── */
    static getAuthUser() {
        try { return JSON.parse(localStorage.getItem(AUTH_KEY)); }
        catch(e) { return null; }
    }

    static isLoggedIn() {
        try {
            const auth    = JSON.parse(localStorage.getItem(AUTH_KEY));
            const session = JSON.parse(localStorage.getItem(SESSION_KEY));
            if (!auth || !session) return false;
            return Date.now() <= session.expires;
        } catch(e) { return false; }
    }

    static logout() {
        // Keep data — just clear session
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem(SESSION_KEY);

        // Firebase logout
        try {
            if (typeof firebase !== 'undefined' && firebase.auth) {
                firebase.auth().signOut();
            }
        } catch(e) {}

        window.location.href = 'index.html';
    }
}

/* ── Initialize global store ── */
const Store = new DataStore();