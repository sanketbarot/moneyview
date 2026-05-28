/* ============================================================
   AITOOLCOR MONEYWISE - CATEGORIES
   File: js/categories.js
   Description: All category definitions with icons, colors
   ============================================================ */

const CATEGORIES = {
    income: [
        { id:'salary',       name:'Salary',        icon:'fa-briefcase',       emoji:'💼', color:'#10B981' },
        { id:'freelance',    name:'Freelance',      icon:'fa-laptop-code',     emoji:'💻', color:'#06B6D4' },
        { id:'investment',   name:'Investment',     icon:'fa-chart-line',      emoji:'📈', color:'#8B5CF6' },
        { id:'business',     name:'Business',       icon:'fa-store',           emoji:'🏪', color:'#F59E0B' },
        { id:'rental',       name:'Rental Income',  icon:'fa-home',            emoji:'🏠', color:'#3B82F6' },
        { id:'gift_income',  name:'Gift/Bonus',     icon:'fa-gift',            emoji:'🎁', color:'#EC4899' },
        { id:'refund',       name:'Refund',         icon:'fa-undo',            emoji:'🔄', color:'#14B8A6' },
        { id:'other_income', name:'Other Income',   icon:'fa-coins',           emoji:'💰', color:'#6B7280' }
    ],
    expense: [
        { id:'food',           name:'Food & Dining',    icon:'fa-utensils',         emoji:'🍕', color:'#F97316' },
        { id:'transport',      name:'Transport',        icon:'fa-car',              emoji:'🚗', color:'#3B82F6' },
        { id:'shopping',       name:'Shopping',         icon:'fa-shopping-bag',     emoji:'🛍️', color:'#A855F7' },
        { id:'bills',          name:'Bills & Utilities',icon:'fa-file-invoice',     emoji:'📄', color:'#EAB308' },
        { id:'entertainment',  name:'Entertainment',    icon:'fa-film',             emoji:'🎬', color:'#EC4899' },
        { id:'health',         name:'Health & Medical', icon:'fa-heartbeat',        emoji:'❤️', color:'#EF4444' },
        { id:'education',      name:'Education',        icon:'fa-graduation-cap',   emoji:'📚', color:'#6366F1' },
        { id:'housing',        name:'Rent/Housing',     icon:'fa-house',            emoji:'🏠', color:'#0EA5E9' },
        { id:'insurance',      name:'Insurance',        icon:'fa-shield-alt',       emoji:'🛡️', color:'#14B8A6' },
        { id:'personal',       name:'Personal Care',    icon:'fa-spa',              emoji:'💅', color:'#F472B6' },
        { id:'gifts',          name:'Gifts',            icon:'fa-gift',             emoji:'🎁', color:'#A78BFA' },
        { id:'travel',         name:'Travel',           icon:'fa-plane',            emoji:'✈️', color:'#38BDF8' },
        { id:'pets',           name:'Pets',             icon:'fa-paw',              emoji:'🐾', color:'#FB923C' },
        { id:'subscriptions',  name:'Subscriptions',    icon:'fa-repeat',           emoji:'🔁', color:'#818CF8' },
        { id:'other_expense',  name:'Other',            icon:'fa-ellipsis-h',       emoji:'📦', color:'#6B7280' }
    ]
};

/* ── ALL CATEGORIES FLAT ── */
const ALL_CATEGORIES = [...CATEGORIES.income, ...CATEGORIES.expense];

/* ── GET CATEGORY INFO ── */
function getCategoryInfo(id) {
    return ALL_CATEGORIES.find(c => c.id === id) || {
        id, name: id, icon: 'fa-circle', emoji: '📦', color: '#94A3B8'
    };
}

/* ── GET ICON HTML ── */
function getCategoryIconHtml(id, size = '') {
    const cat = getCategoryInfo(id);
    return `
        <div class="cat-icon ${size}"
             style="background:${cat.color}18; color:${cat.color};">
            <i class="fas ${cat.icon}"></i>
        </div>
    `;
}

/* ── POPULATE CATEGORY SELECT ── */
function populateCategorySelect(selectId, type = 'all') {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '';

    if (type === 'all' || type === 'income') {
        const group = document.createElement('optgroup');
        group.label = '💰 Income';
        CATEGORIES.income.forEach(c => {
            const opt    = document.createElement('option');
            opt.value    = c.id;
            opt.textContent = `${c.emoji} ${c.name}`;
            group.appendChild(opt);
        });
        select.appendChild(group);
    }

    if (type === 'all' || type === 'expense') {
        const group = document.createElement('optgroup');
        group.label = '💸 Expenses';
        CATEGORIES.expense.forEach(c => {
            const opt    = document.createElement('option');
            opt.value    = c.id;
            opt.textContent = `${c.emoji} ${c.name}`;
            group.appendChild(opt);
        });
        select.appendChild(group);
    }
}

/* ── POPULATE FILTER SELECT (with "All" option) ── */
function populateCategoryFilter(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return;

    select.innerHTML = '<option value="all">All Categories</option>';

    const incGroup = document.createElement('optgroup');
    incGroup.label = '💰 Income';
    CATEGORIES.income.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.emoji} ${c.name}`;
        incGroup.appendChild(opt);
    });
    select.appendChild(incGroup);

    const expGroup = document.createElement('optgroup');
    expGroup.label = '💸 Expenses';
    CATEGORIES.expense.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = `${c.emoji} ${c.name}`;
        expGroup.appendChild(opt);
    });
    select.appendChild(expGroup);
}