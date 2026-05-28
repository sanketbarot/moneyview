/* ============================================================
   AITOOLCOR MONEYWISE - MAIN APP CONTROLLER
   File: js/app.js
   Description: App init, navigation, sidebar, topbar, 
                global events, keyboard shortcuts
   ============================================================ */

const App = {

    currentPage: 'dashboard',
    notifCount:  0,

    /* ════════════════════════
       INIT
    ════════════════════════ */
    init() {
        // Auth check first
        if (!DataStore.isLoggedIn()) {
            window.location.href = 'index.html';
            return;
        }

        this.loadUserProfile();
        this.setupNavigation();
        this.setupSidebar();
        this.setupTopbar();
        this.setupSearch();
        this.setupNotifications();
        this.setupScrollTop();
        this.setupKeyboardShortcuts();
        this.updateCurrencyDisplay();
        this.checkBillAlerts();
        this.setGreeting();
        this.setCurrentMonth();
        Animations.init();
        Animations.hideLoader(900);

        // Load dashboard by default
        this.navigateTo('dashboard', false);

        console.log(
            '%c💰 AitoolCor MoneyWise v2.0',
            'color:#6366F1;font-size:16px;font-weight:bold;'
        );
        console.log(
            '%chttps://moneywise.aitoolcor.com',
            'color:#94A3B8;font-size:11px;'
        );
    },

    /* ════════════════════════
       USER PROFILE
    ════════════════════════ */
    loadUserProfile() {
        const user     = DataStore.getAuthUser();
        const settings = Store.getSettings();
        const name     = user?.name || settings.name || 'User';

        // Update sidebar
        const avatarEl = document.getElementById('sidebarAvatar');
        const nameEl   = document.getElementById('sidebarUserName');
        const roleEl   = document.getElementById('sidebarUserRole');

        if (avatarEl) {
            if (user?.photo) {
                avatarEl.innerHTML = `<img src="${user.photo}" alt="${name}">`;
            } else {
                avatarEl.textContent = getInitials(name);
            }
        }

        if (nameEl) nameEl.textContent = name;
        if (roleEl) {
            roleEl.textContent = user?.isGuest
                ? '👻 Guest Mode'
                : user?.provider === 'google'
                    ? '🔵 Google Account'
                    : '✉️ Free Account';
        }

        // Update dashboard welcome
        setText('dashUserName', name.split(' ')[0]);

        // Sync name to settings
        if (name !== settings.name) {
            Store.updateSettings({ name });
        }

        // Update tx badge
        this.updateTxBadge();
    },

    /* ════════════════════════
       NAVIGATION
    ════════════════════════ */
    setupNavigation() {
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.addEventListener('click', () => {
                const page = item.dataset.page;
                if (page) this.navigateTo(page);
            });
        });

        // Logout
        document.getElementById('logoutNavItem')
            ?.addEventListener('click', () => this.handleLogout());
    },

    navigateTo(page, animate = true) {
        if (this.currentPage === page && animate) return;

        // Hide all pages
        document.querySelectorAll('.page').forEach(p => {
            p.classList.remove('active');
            p.style.display = 'none';
        });

        // Show target page
        const pageEl = document.getElementById(`page-${page}`);
        if (!pageEl) return;

        pageEl.style.display = 'block';
        pageEl.classList.add('active');

        // Update nav items
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Update topbar title
        this.updateTopbarTitle(page);

        // Close mobile sidebar
        this.closeMobileSidebar();

        // Animate page in
        if (animate) Animations.pageEnter(pageEl);

        // Render page content
        this.currentPage = page;
        this.renderPage(page);
    },

    renderPage(page) {
        switch(page) {
            case 'dashboard':    Dashboard.render();    break;
            case 'transactions': Transactions.render(); break;
            case 'accounts':     Accounts.render();     break;
            case 'budgets':      Budgets.render();      break;
            case 'goals':        Goals.render();        break;
            case 'bills':        Bills.render();        break;
            case 'reports':      Reports.render();      break;
            case 'analytics':    Analytics.render();    break;
            case 'settings':     Settings.render();     break;
        }
    },

    updateTopbarTitle(page) {
        const titles = {
            dashboard:    { title: 'Dashboard',        sub: 'Your financial overview' },
            transactions: { title: 'Transactions',     sub: 'All income and expenses' },
            accounts:     { title: 'Accounts',         sub: 'Manage your accounts' },
            budgets:      { title: 'Budgets',          sub: 'Track spending limits' },
            goals:        { title: 'Savings Goals',    sub: 'Track your goals' },
            bills:        { title: 'Bills',            sub: 'Recurring payments' },
            reports:      { title: 'Reports',          sub: 'Financial summaries' },
            analytics:    { title: 'Analytics',        sub: 'AI-powered insights' },
            settings:     { title: 'Settings',         sub: 'Customize your app' }
        };

        const info = titles[page] || { title: 'MoneyWise', sub: '' };
        setText('topbarTitle', info.title);
        setText('topbarSub',   info.sub);
        document.title = `${info.title} — AitoolCor MoneyWise`;
    },

    /* ════════════════════════
       SIDEBAR
    ════════════════════════ */
    setupSidebar() {
        const menuToggle    = document.getElementById('menuToggle');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        menuToggle?.addEventListener('click', () => this.toggleMobileSidebar());
        sidebarOverlay?.addEventListener('click', () => this.closeMobileSidebar());
    },

    toggleMobileSidebar() {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('sidebarOverlay');
        sidebar?.classList.toggle('mobile-open');
        overlay?.classList.toggle('active');
    },

    closeMobileSidebar() {
        document.getElementById('sidebar')?.classList.remove('mobile-open');
        document.getElementById('sidebarOverlay')?.classList.remove('active');
    },

    /* ════════════════════════
       TOPBAR
    ════════════════════════ */
    setupTopbar() {
        // Quick Add
        document.getElementById('quickAddBtn')
            ?.addEventListener('click', () => openTxModal());

        // Export
        document.getElementById('exportBtn')
            ?.addEventListener('click', () => Export.exportAll());

        // Currency
        document.getElementById('topbarCurrency')
            ?.addEventListener('click', () => {
                populateCurrencyList();
                openModal('currencyModal');
            });

        // Notification Bell
        document.getElementById('notifBtn')
            ?.addEventListener('click', () => this.toggleNotifPanel());

        // Close notif panel on outside click
        document.addEventListener('click', (e) => {
            const panel = document.getElementById('notifPanel');
            const btn   = document.getElementById('notifBtn');
            if (panel && btn &&
                !panel.contains(e.target) &&
                !btn.contains(e.target)) {
                panel.classList.remove('open');
            }
        });
    },

    /* ════════════════════════
       SEARCH
    ════════════════════════ */
    setupSearch() {
        const searchInput = document.getElementById('globalSearch');
        if (!searchInput) return;

        const debouncedSearch = debounce((query) => {
            if (query.trim().length > 0) {
                this.navigateTo('transactions');
                setTimeout(() => {
                    Transactions.searchQuery = query;
                    Transactions.render();
                }, 100);
            } else {
                if (this.currentPage === 'transactions') {
                    Transactions.searchQuery = '';
                    Transactions.render();
                }
            }
        }, 300);

        searchInput.addEventListener('input', (e) => {
            debouncedSearch(e.target.value);
        });

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                searchInput.value = '';
                searchInput.blur();
                Transactions.searchQuery = '';
                if (this.currentPage === 'transactions') Transactions.render();
            }
        });
    },

    /* ════════════════════════
       NOTIFICATIONS
    ════════════════════════ */
    setupNotifications() {
        this.generateNotifications();
    },

    generateNotifications() {
        const notifs    = [];
        const budgets   = Store.getBudgetStatus();
        const billStats = Store.getBillStats();

        // Budget alerts
        budgets.forEach(b => {
            if (b.status === 'danger') {
                notifs.push({
                    type:  'danger',
                    icon:  '⚠️',
                    bg:    'var(--danger-bg)',
                    title: `Budget Exceeded`,
                    desc:  `${b.info.name}: ${b.percentage}% used (${fmt(b.spent)} of ${fmt(b.limit)})`,
                    time:  'Now'
                });
            } else if (b.status === 'warning') {
                notifs.push({
                    type:  'warning',
                    icon:  '💡',
                    bg:    'var(--warning-bg)',
                    title: `Budget Warning`,
                    desc:  `${b.info.name}: ${b.percentage}% used — ${fmt(b.remaining)} left`,
                    time:  'Now'
                });
            }
        });

        // Bill alerts
        if (billStats.overdueCount > 0) {
            notifs.push({
                type:  'danger',
                icon:  '📄',
                bg:    'var(--danger-bg)',
                title: `${billStats.overdueCount} Overdue Bill${billStats.overdueCount > 1 ? 's' : ''}`,
                desc:  `You have overdue payments totaling ${fmt(billStats.overdue.reduce((s,b)=>s+b.amount,0))}`,
                time:  'Today'
            });
        }

        if (billStats.upcomingCount > 0) {
            notifs.push({
                type:  'info',
                icon:  '📅',
                bg:    'var(--info-bg)',
                title: `${billStats.upcomingCount} Bill${billStats.upcomingCount > 1 ? 's' : ''} Due Soon`,
                desc:  `Upcoming payments in the next 7 days`,
                time:  'This week'
            });
        }

        // Goals near completion
        Store.getGoals().forEach(g => {
            const pct = Math.round((g.saved / g.target) * 100);
            if (pct >= 90 && pct < 100) {
                notifs.push({
                    type:  'success',
                    icon:  g.emoji,
                    bg:    'var(--success-bg)',
                    title: `Goal Almost Complete!`,
                    desc:  `${g.name} is ${pct}% complete. Just ${fmt(g.target - g.saved)} to go!`,
                    time:  'Goal update'
                });
            }
        });

        // Update badge
        this.notifCount = notifs.length;
        const badge = document.getElementById('notifCount');
        if (badge) {
            badge.textContent = notifs.length;
            badge.style.display = notifs.length > 0 ? 'flex' : 'none';
        }

        // Render notifications
        const list = document.getElementById('notifList');
        if (list) {
            if (notifs.length === 0) {
                list.innerHTML = `
                    <div style="text-align:center;padding:var(--space-8);color:var(--text-muted);">
                        <div style="font-size:2rem;margin-bottom:8px;">🎉</div>
                        <p style="font-size:var(--text-sm);">All caught up! No alerts.</p>
                    </div>`;
            } else {
                list.innerHTML = notifs.map(n => `
                    <div class="notif-item">
                        <div class="notif-item-icon"
                             style="background:${n.bg};font-size:1.2rem;">
                            ${n.icon}
                        </div>
                        <div class="notif-item-content">
                            <div class="notif-item-title">${n.title}</div>
                            <div class="notif-item-desc">${n.desc}</div>
                        </div>
                        <div class="notif-item-time">${n.time}</div>
                    </div>
                `).join('');
            }
        }
    },

    toggleNotifPanel() {
        const panel = document.getElementById('notifPanel');
        if (!panel) return;
        panel.classList.toggle('open');
        if (panel.classList.contains('open')) {
            this.generateNotifications();
        }
    },

    checkBillAlerts() {
        const stats = Store.getBillStats();
        if (stats.overdueCount > 0) {
            setTimeout(() => {
                Toast.warning(
                    `You have ${stats.overdueCount} overdue bill(s).
                     Check your Bills page.`,
                    'Bill Reminder'
                );
            }, 2000);
        }
    },

    /* ════════════════════════
       GREETING + DATE
    ════════════════════════ */
    setGreeting() {
        setText('timeGreeting', getGreeting());
    },

    setCurrentMonth() {
        setText('currentMonthYear', getCurrentMonthYear());
    },

    /* ════════════════════════
       TX BADGE
    ════════════════════════ */
    updateTxBadge() {
        const count = Store.getTransactions().length;
        const badge = document.getElementById('txNavBadge');
        if (badge) badge.textContent = count;

        // Bills badge
        const billStats  = Store.getBillStats();
        const billBadge  = document.getElementById('billsNavBadge');
        if (billBadge) {
            if (billStats.overdueCount > 0) {
                billBadge.textContent      = billStats.overdueCount;
                billBadge.style.display    = 'flex';
                billBadge.style.background = 'var(--danger)';
            } else if (billStats.upcomingCount > 0) {
                billBadge.textContent      = billStats.upcomingCount;
                billBadge.style.display    = 'flex';
                billBadge.style.background = 'var(--warning)';
            } else {
                billBadge.style.display = 'none';
            }
        }
    },

    /* ════════════════════════
       SCROLL TO TOP
    ════════════════════════ */
    setupScrollTop() {
        const btn      = document.getElementById('scrollTopBtn');
        const pageArea = document.querySelector('.page-area');
        if (!btn || !pageArea) return;

        pageArea.addEventListener('scroll', () => {
            btn.classList.toggle('visible', pageArea.scrollTop > 400);
        });

        window.addEventListener('scroll', () => {
            btn.classList.toggle('visible', window.scrollY > 400);
        });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            pageArea.scrollTo({ top: 0, behavior: 'smooth' });
        });
    },

    /* ════════════════════════
       KEYBOARD SHORTCUTS
    ════════════════════════ */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in input
            if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;

            const ctrl = e.ctrlKey || e.metaKey;

            // Ctrl+K = Focus search
            if (ctrl && e.key === 'k') {
                e.preventDefault();
                document.getElementById('globalSearch')?.focus();
            }

            // Ctrl+N = New transaction
            if (ctrl && e.key === 'n') {
                e.preventDefault();
                openTxModal();
            }

            // Ctrl+D = Dashboard
            if (ctrl && e.key === 'd') {
                e.preventDefault();
                this.navigateTo('dashboard');
            }

            // Ctrl+T = Transactions
            if (ctrl && e.key === 't') {
                e.preventDefault();
                this.navigateTo('transactions');
            }

            // Ctrl+B = Budgets
            if (ctrl && e.key === 'b') {
                e.preventDefault();
                this.navigateTo('budgets');
            }

            // Ctrl+G = Goals
            if (ctrl && e.key === 'g') {
                e.preventDefault();
                this.navigateTo('goals');
            }

            // Ctrl+, = Settings
            if (ctrl && e.key === ',') {
                e.preventDefault();
                this.navigateTo('settings');
            }

            // Escape = Close modals
            if (e.key === 'Escape') closeAllModals();
        });
    },

    /* ════════════════════════
       CURRENCY DISPLAY
    ════════════════════════ */
    updateCurrencyDisplay() {
        updateCurrencyDisplay();
    },

    /* ════════════════════════
       LOGOUT
    ════════════════════════ */
    handleLogout() {
        openConfirmModal(
            'Sign Out?',
            'Your data is saved locally. You can sign in again anytime.',
            () => {
                Toast.info('Signing out...');
                setTimeout(() => DataStore.logout(), 800);
            },
            false
        );
    }
};

/* ── Global refresh helpers ── */
function refreshAll() {
    App.updateTxBadge();
    App.generateNotifications();
    App.renderPage(App.currentPage);
}

function refreshCurrentPage() {
    App.renderPage(App.currentPage);
}

function navigateTo(page) {
    App.navigateTo(page);
}

function clearNotifications() {
    App.notifCount = 0;
    const badge = document.getElementById('notifCount');
    if (badge) badge.style.display = 'none';
    const list = document.getElementById('notifList');
    if (list) list.innerHTML = `
        <div style="text-align:center;padding:var(--space-8);color:var(--text-muted);">
            <div style="font-size:2rem;margin-bottom:8px;">✅</div>
            <p style="font-size:var(--text-sm);">All notifications cleared.</p>
        </div>`;
}

function closeNotifPanel() {
    document.getElementById('notifPanel')?.classList.remove('open');
}

/* ── DOM Ready ── */
document.addEventListener('DOMContentLoaded', () => App.init());