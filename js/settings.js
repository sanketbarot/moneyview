/* ============================================================
   AITOOLCOR MONEYWISE - SETTINGS
   File: js/settings.js
   ============================================================ */

const Settings = {

    render() {
        this.renderProfileHeader();
        this.loadProfileValues();
        this.renderNotifications();
        this.renderDataManagement();
        this.renderAbout();
    },

    /* ════════════════════════
       PROFILE HEADER
    ════════════════════════ */
    renderProfileHeader() {
        const container = document.getElementById('settingsProfileHeader');
        if (!container) return;

        const user = DataStore.getAuthUser();
        const name = user?.name || Store.getUserName();

        container.innerHTML = `
            <div style="display:flex;align-items:center;gap:var(--space-4);
                        padding:var(--space-4) 0;
                        border-bottom:1px solid var(--border-color);
                        margin-bottom:var(--space-4);">
                <div style="width:60px;height:60px;border-radius:var(--radius-lg);
                            background:linear-gradient(135deg,var(--primary),var(--secondary));
                            display:flex;align-items:center;justify-content:center;
                            font-size:1.5rem;font-weight:var(--weight-bold);color:white;
                            overflow:hidden;">
                    ${user?.photo
                        ? `<img src="${user.photo}" style="width:100%;height:100%;
                                object-fit:cover;" alt="${name}">`
                        : getInitials(name)}
                </div>
                <div>
                    <div style="font-size:var(--text-lg);
                                font-weight:var(--weight-extrabold);
                                color:var(--text-primary);">
                        ${name}
                    </div>
                    <div style="font-size:var(--text-sm);
                                color:var(--text-muted);">
                        ${user?.email || 'Local Account'}
                    </div>
                    <div style="margin-top:var(--space-2);">
                        ${user?.isGuest
                            ? '<span class="badge badge-secondary">👻 Guest Mode</span>'
                            : user?.provider === 'google'
                                ? '<span class="badge badge-info">🔵 Google Account</span>'
                                : '<span class="badge badge-primary">✉️ Email Account</span>'}
                    </div>
                </div>
            </div>
        `;
    },

    /* ════════════════════════
       LOAD VALUES
    ════════════════════════ */
    loadProfileValues() {
        const s = Store.getSettings();
        const nameEl = document.getElementById('settingName');
        const currEl = document.getElementById('settingCurrency');

        if (nameEl) nameEl.value = s.name || '';
        if (currEl) currEl.value = s.currency || 'USD';
    },

    /* ════════════════════════
       NOTIFICATIONS
    ════════════════════════ */
    renderNotifications() {
        const container = document.getElementById('notifSettings');
        if (!container) return;

        const n = Store.getSettings().notifications || {};

        const items = [
            {
                key:   'budgetAlerts',
                icon:  'fa-chart-pie',
                name:  'Budget Alerts',
                desc:  'Notify when spending exceeds 80% of budget',
                value: n.budgetAlerts !== false
            },
            {
                key:   'billReminders',
                icon:  'fa-calendar-alt',
                name:  'Bill Reminders',
                desc:  'Remind before bills are due',
                value: n.billReminders !== false
            },
            {
                key:   'goalUpdates',
                icon:  'fa-bullseye',
                name:  'Goal Updates',
                desc:  'Notify on goal milestones',
                value: n.goalUpdates !== false
            },
            {
                key:   'weeklySummary',
                icon:  'fa-chart-bar',
                name:  'Weekly Summary',
                desc:  'Get a weekly financial summary',
                value: n.weeklySummary === true
            }
        ];

        container.innerHTML = items.map(item => `
            <div class="setting-row">
                <div class="setting-row-left">
                    <div class="setting-icon-wrap">
                        <i class="fas ${item.icon}"></i>
                    </div>
                    <div>
                        <div class="setting-name">${item.name}</div>
                        <div class="setting-desc">${item.desc}</div>
                    </div>
                </div>
                <label class="toggle">
                    <input type="checkbox"
                           ${item.value ? 'checked' : ''}
                           onchange="Settings.updateNotif('${item.key}', this.checked)">
                    <div class="toggle-track"></div>
                </label>
            </div>
        `).join('');
    },

    updateNotif(key, value) {
        Store.updateNotifications({ [key]: value });
        Toast.success('Notification settings saved!');
    },

    /* ════════════════════════
       DATA MANAGEMENT
    ════════════════════════ */
    renderDataManagement() {
        const container = document.getElementById('dataManagement');
        if (!container) return;

        const txCount  = Store.getTransactions().length;
        const lastUpd  = Store.data?.lastUpdated
            ? formatDate(Store.data.lastUpdated)
            : 'Never';

        container.innerHTML = `
            <div style="font-size:var(--text-xs);color:var(--text-muted);
                        margin-bottom:var(--space-5);
                        padding:var(--space-3);
                        background:rgba(0,0,0,0.03);
                        border-radius:var(--radius-md);">
                📊 ${txCount} transactions stored locally
                <br>🕐 Last updated: ${lastUpd}
            </div>

            <div style="display:flex;flex-direction:column;gap:var(--space-3);">
                <div class="setting-row">
                    <div class="setting-row-left">
                        <div class="setting-icon-wrap">
                            <i class="fas fa-download"></i>
                        </div>
                        <div>
                            <div class="setting-name">Export All Data</div>
                            <div class="setting-desc">Download full backup as JSON</div>
                        </div>
                    </div>
                    <button class="btn btn-secondary btn-sm hover-lift"
                            onclick="Export.exportAll()">
                        Export
                    </button>
                </div>

                <div class="setting-row">
                    <div class="setting-row-left">
                        <div class="setting-icon-wrap">
                            <i class="fas fa-file-csv"></i>
                        </div>
                        <div>
                            <div class="setting-name">Export Transactions (CSV)</div>
                            <div class="setting-desc">Download transactions as CSV file</div>
                        </div>
                    </div>
                    <button class="btn btn-secondary btn-sm hover-lift"
                            onclick="exportCSV()">
                        CSV
                    </button>
                </div>

                <div class="setting-row">
                    <div class="setting-row-left">
                        <div class="setting-icon-wrap">
                            <i class="fas fa-upload"></i>
                        </div>
                        <div>
                            <div class="setting-name">Import Data</div>
                            <div class="setting-desc">Restore from a backup JSON file</div>
                        </div>
                    </div>
                    <button class="btn btn-secondary btn-sm hover-lift"
                            onclick="document.getElementById('importFileInput').click()">
                        Import
                    </button>
                    <input type="file" id="importFileInput"
                           accept=".json" style="display:none;"
                           onchange="Export.importData(event)">
                </div>

                <div class="setting-row">
                    <div class="setting-row-left">
                        <div class="setting-icon-wrap"
                             style="color:var(--danger);">
                            <i class="fas fa-trash-alt"></i>
                        </div>
                        <div>
                            <div class="setting-name"
                                 style="color:var(--danger);">
                                Clear All Data
                            </div>
                            <div class="setting-desc">
                                Permanently delete all transactions & settings
                            </div>
                        </div>
                    </div>
                    <button class="btn btn-danger btn-sm"
                            onclick="clearAllData()">
                        Clear
                    </button>
                </div>
            </div>
        `;
    },

    /* ════════════════════════
       ABOUT
    ════════════════════════ */
    renderAbout() {
        const container = document.getElementById('aboutSection');
        if (!container) return;

        container.innerHTML = `
            <div style="text-align:center;margin-bottom:var(--space-5);">
                <div style="width:64px;height:64px;
                            background:linear-gradient(135deg,var(--primary),var(--secondary));
                            border-radius:var(--radius-lg);
                            display:flex;align-items:center;justify-content:center;
                            font-size:1.8rem;margin:0 auto var(--space-3);">
                    💰
                </div>
                <div style="font-size:var(--text-lg);font-weight:var(--weight-extrabold);
                            background:linear-gradient(135deg,var(--primary),var(--secondary));
                            -webkit-background-clip:text;-webkit-text-fill-color:transparent;">
                    AitoolCor MoneyWise
                </div>
                <div style="font-size:var(--text-xs);color:var(--text-muted);
                            margin-top:4px;">
                    Version 2.0.0 · Light Glass UI
                </div>
            </div>

            <div style="display:flex;flex-direction:column;gap:var(--space-2);">
                <a href="https://moneywise.aitoolcor.com" target="_blank"
                   class="setting-row" style="text-decoration:none;">
                    <div class="setting-row-left">
                        <div class="setting-icon-wrap">
                            <i class="fas fa-globe"></i>
                        </div>
                        <div>
                            <div class="setting-name">Website</div>
                            <div class="setting-desc">
                                moneywise.aitoolcor.com
                            </div>
                        </div>
                    </div>
                    <i class="fas fa-external-link-alt"
                       style="color:var(--text-muted);font-size:var(--text-sm);"></i>
                </a>

                <div class="setting-row" style="cursor:pointer;"
                     onclick="shareApp()">
                    <div class="setting-row-left">
                        <div class="setting-icon-wrap">
                            <i class="fas fa-share-alt"></i>
                        </div>
                        <div>
                            <div class="setting-name">Share App</div>
                            <div class="setting-desc">
                                Share MoneyWise with friends
                            </div>
                        </div>
                    </div>
                    <i class="fas fa-chevron-right"
                       style="color:var(--text-muted);
                              font-size:var(--text-sm);"></i>
                </div>

                <div class="setting-row" style="cursor:pointer;"
                     onclick="App.handleLogout()">
                    <div class="setting-row-left">
                        <div class="setting-icon-wrap"
                             style="color:var(--danger);">
                            <i class="fas fa-sign-out-alt"></i>
                        </div>
                        <div>
                            <div class="setting-name"
                                 style="color:var(--danger);">
                                Sign Out
                            </div>
                            <div class="setting-desc">
                                Return to login screen
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
};

/* ── Global helpers ── */
function saveSettings() {
    const name = document.getElementById('settingName')?.value?.trim();
    const curr = document.getElementById('settingCurrency')?.value;

    if (!name) {
        Toast.error('Please enter your name.');
        return;
    }

    Store.updateSettings({ name, currency: curr });

    // Update auth user name
    const auth = DataStore.getAuthUser();
    if (auth) {
        auth.name = name;
        localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
    }

    App.loadUserProfile();
    updateCurrencyDisplay();
    Toast.success('Settings saved!');
    Animations.pulseGlow(
        document.querySelector('[onclick="saveSettings()"]')
    );
}

function clearAllData() {
    openConfirmModal(
        '⚠️ Clear All Data?',
        'This will permanently delete ALL transactions, budgets, goals and bills. This cannot be undone!',
        () => {
            Store.clearAll();
            Toast.warning('All data cleared. Starting fresh!');
            setTimeout(() => refreshAll(), 300);
        },
        true
    );
}

function shareApp() {
    const url = 'https://moneywise.aitoolcor.com';
    if (navigator.share) {
        navigator.share({
            title: 'AitoolCor MoneyWise',
            text:  'Smart free money manager — track expenses, budgets & goals!',
            url
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(url);
        Toast.success('Link copied to clipboard!');
    }
}