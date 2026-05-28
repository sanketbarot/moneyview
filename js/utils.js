/* ============================================================
   AITOOLCOR MONEYWISE - UTILITY FUNCTIONS
   File: js/utils.js
   Description: Date helpers, DOM utils, number formatting
   ============================================================ */

/* ════════════════════════
   DATE UTILITIES
════════════════════════ */

function today() {
    return new Date().toISOString().split('T')[0];
}

function dateOffset(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric'
    });
}

function formatDateShort(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDateRelative(dateStr) {
    if (!dateStr) return '';
    const d    = new Date(dateStr);
    const now  = new Date();
    const diff = Math.floor((now - d) / 86400000);

    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7)  return `${diff} days ago`;
    if (diff < 30) return `${Math.floor(diff / 7)}w ago`;
    return formatDateShort(dateStr);
}

function getMonthName(month) {
    const months = [
        'January','February','March','April','May','June',
        'July','August','September','October','November','December'
    ];
    return months[month];
}

function getMonthShort(month) {
    return getMonthName(month).substring(0, 3);
}

function getCurrentMonthYear() {
    const d = new Date();
    return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
}

function getDaysInMonth(month, year) {
    return new Date(year, month + 1, 0).getDate();
}

function getBillStatus(dueDay) {
    const today = new Date().getDate();
    const diff  = dueDay - today;
    if (diff < 0)  return { status: 'overdue',  label: 'Overdue' };
    if (diff === 0) return { status: 'today',   label: 'Due Today' };
    if (diff <= 3)  return { status: 'urgent',  label: `Due in ${diff}d` };
    if (diff <= 7)  return { status: 'upcoming',label: `Due in ${diff}d` };
    return { status: 'upcoming', label: `Day ${dueDay}` };
}

/* ════════════════════════
   NUMBER UTILITIES
════════════════════════ */

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function percentOf(value, total) {
    if (!total || total === 0) return 0;
    return Math.round((value / total) * 100);
}

function percentChange(current, previous) {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / Math.abs(previous)) * 100);
}

/* ── Animate counter ── */
function animateCounter(element, target, duration = 1000, prefix = '', suffix = '') {
    if (!element) return;
    const start    = performance.now();
    const startVal = 0;

    function update(currentTime) {
        const elapsed  = currentTime - start;
        const progress = Math.min(elapsed / duration, 1);
        const ease     = 1 - Math.pow(1 - progress, 3);
        const value    = Math.floor(ease * target);

        element.textContent = prefix + value.toLocaleString() + suffix;

        if (progress < 1) requestAnimationFrame(update);
        else element.textContent = prefix + target.toLocaleString() + suffix;
    }

    requestAnimationFrame(update);
}

/* ════════════════════════
   DOM UTILITIES
════════════════════════ */

function $(selector, parent = document) {
    return parent.querySelector(selector);
}

function $$(selector, parent = document) {
    return [...parent.querySelectorAll(selector)];
}

function el(tag, attrs = {}, ...children) {
    const element = document.createElement(tag);
    Object.entries(attrs).forEach(([key, val]) => {
        if (key === 'class')        element.className   = val;
        else if (key === 'style')   element.style.cssText = val;
        else if (key.startsWith('on')) {
            element.addEventListener(key.slice(2).toLowerCase(), val);
        } else element.setAttribute(key, val);
    });
    children.forEach(child => {
        if (typeof child === 'string') element.insertAdjacentHTML('beforeend', child);
        else if (child) element.appendChild(child);
    });
    return element;
}

function setHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function show(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = '';
}

function hide(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
}

function toggle(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = el.style.display === 'none' ? '' : 'none';
}

/* ── Empty State HTML ── */
function emptyStateHTML(icon, title, desc, btnText, btnAction) {
    return `
        <div class="empty-state">
            <div class="empty-icon">${icon}</div>
            <h3>${title}</h3>
            <p>${desc}</p>
            ${btnText
                ? `<button class="btn btn-primary btn-sm" onclick="${btnAction}">
                    <i class="fas fa-plus"></i> ${btnText}
                   </button>`
                : ''}
        </div>
    `;
}

/* ── User initials for avatar ── */
function getInitials(name) {
    if (!name) return 'U';
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

/* ── Debounce ── */
function debounce(fn, wait = 300) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), wait);
    };
}

/* ── Download file ── */
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}

/* ── Format percent with color class ── */
function pctColorClass(pct) {
    if (pct >= 100) return 'danger';
    if (pct >= 80)  return 'warning';
    return 'safe';
}

/* ── Truncate text ── */
function truncate(str, len = 30) {
    if (!str) return '';
    return str.length > len ? str.substring(0, len) + '...' : str;
}