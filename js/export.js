/* ============================================================
   AITOOLCOR MONEYWISE - EXPORT / IMPORT
   File: js/export.js
   ============================================================ */

const Export = {

    /* ── Export full backup ── */
    exportAll() {
        const json     = Store.exportAll();
        const filename = `moneywise_backup_${today()}.json`;
        downloadFile(json, filename, 'application/json');
        Toast.success('Full backup exported!');
    },

    /* ── Export transactions CSV ── */
    exportCSV() {
        const csv      = Store.exportCSV();
        const filename = `moneywise_transactions_${today()}.csv`;
        downloadFile(csv, filename, 'text/csv;charset=utf-8;');
        Toast.success('Transactions exported as CSV!');
    },

    /* ── Import data ── */
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader  = new FileReader();
        reader.onload = (e) => {
            const success = Store.importData(e.target.result);
            if (success) {
                Toast.success('Data imported successfully!');
                setTimeout(() => refreshAll(), 300);
            } else {
                Toast.error('Invalid file format. Please use a MoneyWise backup.');
            }
        };

        reader.onerror = () => {
            Toast.error('Failed to read the file. Please try again.');
        };

        reader.readAsText(file);
        event.target.value = '';
    }
};

function exportAllData() {
    Export.exportAll();
}