/* ============================================================
   AITOOLCOR MONEYWISE - TOAST NOTIFICATION SYSTEM
   File: js/toast.js
   ============================================================ */

const Toast = {
    container: null,
    duration: 4000,

    init() {
        this.container = document.getElementById('toastContainer');
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            this.container.id = 'toastContainer';
            document.body.appendChild(this.container);
        }
    },

    show(message, type = 'info', title = null, duration = null) {
        if (!this.container) this.init();

        const icons = {
            success: 'fa-circle-check',
            error:   'fa-circle-xmark',
            warning: 'fa-triangle-exclamation',
            info:    'fa-circle-info'
        };

        const titles = {
            success: title || 'Success',
            error:   title || 'Error',
            warning: title || 'Warning',
            info:    title || 'Info'
        };

        const ms = duration || this.duration;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${icons[type]} toast-icon"></i>
            <div class="toast-content">
                <div class="toast-title">${titles[type]}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" onclick="Toast.remove(this.closest('.toast'))">
                <i class="fas fa-times"></i>
            </button>
            <div class="toast-progress" style="animation-duration: ${ms}ms; color: var(--${type === 'error' ? 'danger' : type === 'info' ? 'primary' : type});"></div>
        `;

        this.container.appendChild(toast);

        // Auto remove
        const timer = setTimeout(() => this.remove(toast), ms);
        toast.dataset.timer = timer;

        return toast;
    },

    remove(toast) {
        if (!toast || !toast.parentElement) return;
        clearTimeout(parseInt(toast.dataset.timer));
        toast.classList.add('removing');
        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, 300);
    },

    success(message, title) { return this.show(message, 'success', title); },
    error(message, title)   { return this.show(message, 'error', title); },
    warning(message, title) { return this.show(message, 'warning', title); },
    info(message, title)    { return this.show(message, 'info', title); }
};

// Init on DOM ready
document.addEventListener('DOMContentLoaded', () => Toast.init());