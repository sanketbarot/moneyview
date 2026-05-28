/* ============================================================
   AITOOLCOR MONEYWISE - KEYBOARD SHORTCUTS
   File: js/shortcuts.js
   ============================================================ */

const Shortcuts = {

    init() {
        document.addEventListener('keydown', (e) => {
            // Skip if typing in input
            const tag = e.target.tagName;
            if (['INPUT','TEXTAREA','SELECT'].includes(tag)) return;

            const ctrl = e.ctrlKey || e.metaKey;
            const shift = e.shiftKey;

            /* ── Navigation Shortcuts ── */
            if (ctrl && !shift) {
                switch(e.key) {
                    case 'k': e.preventDefault();
                        document.getElementById('globalSearch')?.focus();
                        break;
                    case 'n': e.preventDefault();
                        openTxModal();
                        break;
                    case 'd': e.preventDefault();
                        navigateTo('dashboard');
                        break;
                    case 't': e.preventDefault();
                        navigateTo('transactions');
                        break;
                    case 'b': e.preventDefault();
                        navigateTo('budgets');
                        break;
                    case 'g': e.preventDefault();
                        navigateTo('goals');
                        break;
                    case 'l': e.preventDefault();
                        navigateTo('bills');
                        break;
                    case 'r': e.preventDefault();
                        navigateTo('reports');
                        break;
                    case 'a': e.preventDefault();
                        navigateTo('analytics');
                        break;
                    case ',': e.preventDefault();
                        navigateTo('settings');
                        break;
                    case 'e': e.preventDefault();
                        Export.exportAll();
                        break;
                }
            }

            /* ── Escape ── */
            if (e.key === 'Escape') {
                closeAllModals();
                document.getElementById('globalSearch')?.blur();
            }

            /* ── ? = Show shortcuts ── */
            if (e.key === '?' && !ctrl) {
                this.showShortcutsHelp();
            }
        });
    },

    showShortcutsHelp() {
        const shortcuts = [
            { key: 'Ctrl+K',  desc: 'Focus search' },
            { key: 'Ctrl+N',  desc: 'New transaction' },
            { key: 'Ctrl+D',  desc: 'Dashboard' },
            { key: 'Ctrl+T',  desc: 'Transactions' },
            { key: 'Ctrl+B',  desc: 'Budgets' },
            { key: 'Ctrl+G',  desc: 'Goals' },
            { key: 'Ctrl+L',  desc: 'Bills' },
            { key: 'Ctrl+R',  desc: 'Reports' },
            { key: 'Ctrl+A',  desc: 'Analytics' },
            { key: 'Ctrl+,',  desc: 'Settings' },
            { key: 'Ctrl+E',  desc: 'Export data' },
            { key: 'Escape',  desc: 'Close modal' },
            { key: '?',       desc: 'Show shortcuts' }
        ];

        Toast.info(
            `<strong>⌨️ Keyboard Shortcuts</strong><br>
             <small>${shortcuts.map(s =>
                 `<kbd style="background:rgba(0,0,0,0.06);
                              padding:1px 5px;border-radius:4px;
                              font-family:monospace;">${s.key}</kbd>
                  ${s.desc}`
             ).join('  ·  ')}</small>`,
            'Shortcuts'
        );
    }
};

document.addEventListener('DOMContentLoaded', () => Shortcuts.init());