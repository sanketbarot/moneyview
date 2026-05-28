/* ============================================================
   AITOOLCOR MONEYWISE - CHART ENGINE
   File: js/charts.js
   Description: Bar Chart, Donut Chart, Line Chart, Health Gauge
   All charts animated, interactive, responsive
   ============================================================ */

const Charts = {

    /* ════════════════════════════════════
       BAR CHART (Income vs Expense)
    ════════════════════════════════════ */
    renderBarChart(containerId, data, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!data || !data.labels || data.labels.length === 0) {
            container.innerHTML = `
                <div class="chart-empty">
                    <i class="fas fa-chart-bar"></i>
                    <p>No data available yet</p>
                </div>`;
            return;
        }

        const maxVal = Math.max(...data.income, ...data.expense, 1);
        const showExpense = options.showExpense !== false;

        container.innerHTML = data.labels.map((label, i) => {
            const incH   = ((data.income[i]  || 0) / maxVal) * 100;
            const expH   = ((data.expense[i] || 0) / maxVal) * 100;
            const incVal = fmt(data.income[i]  || 0);
            const expVal = fmt(data.expense[i] || 0);

            return `
                <div class="bar-group">
                    <div class="bar-pair">
                        <div class="bar income-bar"
                             style="height:0%"
                             data-target="${incH}"
                             data-value="${incVal}"
                             title="Income: ${incVal}">
                            <span class="bar-tooltip">📈 ${incVal}</span>
                        </div>
                        ${showExpense ? `
                        <div class="bar expense-bar"
                             style="height:0%"
                             data-target="${expH}"
                             data-value="${expVal}"
                             title="Expense: ${expVal}">
                            <span class="bar-tooltip">📉 ${expVal}</span>
                        </div>` : ''}
                    </div>
                    <div class="bar-label">${label}</div>
                </div>
            `;
        }).join('');

        // Animate bars with stagger
        requestAnimationFrame(() => {
            const bars = container.querySelectorAll('.bar');
            bars.forEach((bar, i) => {
                const target = parseFloat(bar.dataset.target) || 0;
                setTimeout(() => {
                    bar.style.transition =
                        'height 0.7s cubic-bezier(0.175,0.885,0.32,1.275)';
                    bar.style.height = Math.max(target, 1) + '%';
                    bar.classList.add('animated');
                }, i * 60);
            });
        });
    },

    /* ════════════════════════════════════
       DONUT CHART (Category Breakdown)
    ════════════════════════════════════ */
    renderDonutChart(containerId, categories, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const total = categories.reduce((s, c) => s + c.amount, 0);

        if (!categories.length || total === 0) {
            container.innerHTML = `
                <div class="chart-empty">
                    <i class="fas fa-chart-pie"></i>
                    <p>No expense data this month</p>
                </div>`;
            return;
        }

        const size       = 160;
        const cx         = size / 2;
        const cy         = size / 2;
        const radius     = 55;
        const circumference = 2 * Math.PI * radius;
        const strokeW    = 18;
        const gap        = 3;

        const colors = [
            '#6366F1','#EC4899','#10B981','#F59E0B',
            '#EF4444','#3B82F6','#8B5CF6','#06B6D4',
            '#F97316','#14B8A6','#A855F7','#84CC16'
        ];

        // Build segments
        let offset = 0;
        const segments = categories.map((cat, i) => {
            const pct   = cat.amount / total;
            const dash  = circumference * pct - gap;
            const color = cat.info?.color || colors[i % colors.length];
            const seg   = { ...cat, pct, dash, offset, color };
            offset += circumference * pct;
            return seg;
        });

        // Render
        container.innerHTML = `
            <div class="donut-wrap">
                <div class="donut-chart-container">
                    <svg viewBox="0 0 ${size} ${size}">
                        <!-- Background track -->
                        <circle
                            cx="${cx}" cy="${cy}" r="${radius}"
                            fill="none"
                            stroke="rgba(0,0,0,0.05)"
                            stroke-width="${strokeW}"
                        />
                        <!-- Segments -->
                        ${segments.map((seg, i) => `
                            <circle
                                cx="${cx}" cy="${cy}" r="${radius}"
                                fill="none"
                                stroke="${seg.color}"
                                stroke-width="${strokeW}"
                                stroke-dasharray="${seg.dash} ${circumference - seg.dash}"
                                stroke-dashoffset="${-seg.offset}"
                                stroke-linecap="butt"
                                class="donut-segment"
                                style="
                                    transition: stroke-dashoffset 0s,
                                                stroke-width 0.2s ease;
                                "
                                data-i="${i}"
                                title="${seg.info?.name || seg.category}: ${fmt(seg.amount)}"
                            />
                        `).join('')}
                    </svg>
                    <div class="donut-center">
                        <div class="donut-center-value">${fmt(total)}</div>
                        <div class="donut-center-label">Total</div>
                    </div>
                </div>

                <div class="donut-legend">
                    ${segments.slice(0, 6).map(seg => {
                        const pct  = Math.round(seg.pct * 100);
                        const name = seg.info?.name || seg.category;
                        return `
                            <div class="donut-legend-item">
                                <div class="donut-legend-left">
                                    <div class="donut-legend-dot"
                                         style="background:${seg.color}">
                                    </div>
                                    <span class="donut-legend-name">
                                        ${seg.info?.emoji || ''} ${name}
                                    </span>
                                </div>
                                <div class="donut-legend-right">
                                    <span class="donut-legend-amount">
                                        ${fmt(seg.amount)}
                                    </span>
                                    <span class="donut-legend-pct">${pct}%</span>
                                </div>
                            </div>
                        `;
                    }).join('')}
                    ${segments.length > 6
                        ? `<div class="donut-legend-item" style="color:var(--text-muted);font-size:var(--text-xs);">
                            +${segments.length - 6} more categories
                           </div>`
                        : ''}
                </div>
            </div>
        `;

        // Animate segments with draw effect
        requestAnimationFrame(() => {
            const segs = container.querySelectorAll('.donut-segment');
            segs.forEach((seg, i) => {
                const data       = segments[i];
                const startDash  = 0;
                seg.style.strokeDasharray  = `${startDash} ${circumference}`;

                setTimeout(() => {
                    seg.style.transition =
                        'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)';
                    seg.style.strokeDasharray =
                        `${data.dash} ${circumference - data.dash}`;
                }, i * 120);
            });
        });
    },

    /* ════════════════════════════════════
       HEALTH SCORE GAUGE
    ════════════════════════════════════ */
    renderHealthGauge(containerId, score) {
        const container = document.getElementById(containerId);
        if (!container) return;

        score = Math.max(0, Math.min(100, score));

        const getClass = (s) => {
            if (s >= 80) return 'excellent';
            if (s >= 60) return 'good';
            if (s >= 40) return 'fair';
            return 'poor';
        };

        const getLabel = (s) => {
            if (s >= 80) return 'Excellent 🌟';
            if (s >= 60) return 'Good 👍';
            if (s >= 40) return 'Fair 📊';
            return 'Needs Work 💪';
        };

        const cls       = getClass(score);
        const label     = getLabel(score);
        const cx        = 80;
        const cy        = 80;
        const r         = 60;
        const circ      = Math.PI * r; // half circle
        const dashOffset = circ - (score / 100) * circ;

        container.innerHTML = `
            <div class="health-gauge-wrap">
                <div class="health-gauge">
                    <svg viewBox="0 0 160 90">
                        <!-- Track -->
                        <path
                            d="M 10,80 A 70,70 0 0,1 150,80"
                            fill="none"
                            stroke="rgba(0,0,0,0.06)"
                            stroke-width="16"
                            stroke-linecap="round"
                        />
                        <!-- Fill -->
                        <path
                            id="gaugeFill_${containerId}"
                            d="M 10,80 A 70,70 0 0,1 150,80"
                            fill="none"
                            stroke="${this._gaugeColor(score)}"
                            stroke-width="16"
                            stroke-linecap="round"
                            stroke-dasharray="${Math.PI * 70}"
                            stroke-dashoffset="${Math.PI * 70}"
                            style="transition: stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1);"
                        />
                    </svg>
                    <div class="gauge-center">
                        <div class="gauge-score ${cls}" id="gaugeScore_${containerId}">0</div>
                        <div class="gauge-label">${label}</div>
                    </div>
                </div>
            </div>
        `;

        // Animate gauge
        setTimeout(() => {
            const fill = document.getElementById(`gaugeFill_${containerId}`);
            if (fill) {
                const total  = Math.PI * 70;
                const offset = total - (score / 100) * total;
                fill.style.strokeDashoffset = offset;
            }

            // Animate score number
            const scoreEl = document.getElementById(`gaugeScore_${containerId}`);
            if (scoreEl) {
                Animations.countUp(scoreEl, score, 1200);
            }
        }, 100);
    },

    _gaugeColor(score) {
        if (score >= 80) return 'var(--success)';
        if (score >= 60) return 'var(--info)';
        if (score >= 40) return 'var(--warning)';
        return 'var(--danger)';
    },

    /* ════════════════════════════════════
       DAILY SPENDING CHART
    ════════════════════════════════════ */
    renderDailyChart(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const now      = new Date();
        const days     = now.getDate();
        const month    = now.getMonth();
        const year     = now.getFullYear();

        const dailyData = [];
        let total = 0;

        for (let d = 1; d <= days; d++) {
            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            const amount  = Store.getTransactions()
                .filter(t => t.date === dateStr && t.type === 'expense')
                .reduce((s, t) => s + t.amount, 0);
            dailyData.push({ day: d, amount });
            total += amount;
        }

        const avg    = days > 0 ? total / days : 0;
        const maxVal = Math.max(...dailyData.map(d => d.amount), avg * 1.5, 1);

        container.innerHTML = `
            <div class="daily-chart-wrap" id="dailyBars_${containerId}">
                ${dailyData.map(d => {
                    const h         = (d.amount / maxVal) * 90;
                    const isAbove   = d.amount > avg;
                    const isToday   = d.day === days;
                    return `
                        <div class="daily-bar ${isAbove ? 'above-avg' : 'below-avg'}"
                             style="
                                height:${Math.max(h, 2)}px;
                                ${isToday ? 'box-shadow:0 0 8px var(--primary-glow);' : ''}
                             "
                             title="Day ${d.day}: ${fmt(d.amount)}">
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="daily-chart-info">
                <span>Day 1</span>
                <span>📊 Avg: <strong>${fmt(avg)}/day</strong></span>
                <span>Day ${days}</span>
            </div>
        `;
    },

    /* ════════════════════════════════════
       INCOME SOURCES
    ════════════════════════════════════ */
    renderIncomeSources(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const breakdown = Store.getCategoryBreakdown('income');
        const total     = breakdown.reduce((s, c) => s + c.amount, 0);

        if (!breakdown.length) {
            container.innerHTML = emptyStateHTML(
                '💰','No income recorded',
                'Add income transactions to see breakdown',
                'Add Income', 'openTxModal()'
            );
            return;
        }

        container.innerHTML = `
            <div class="income-sources-list">
                ${breakdown.map((cat, i) => {
                    const pct   = percentOf(cat.amount, total);
                    const color = cat.info?.color || '#6366F1';
                    return `
                        <div class="income-source-item">
                            <div class="income-source-top">
                                <div class="income-source-name">
                                    <span>${cat.info?.emoji || '💰'}</span>
                                    <span>${cat.info?.name || cat.category}</span>
                                </div>
                                <span class="income-source-amount">
                                    ${fmt(cat.amount)}
                                    <small style="color:var(--text-muted);font-weight:400;">
                                        (${pct}%)
                                    </small>
                                </span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill primary progress-shimmer"
                                     style="width:0%; background:${color};"
                                     data-pct="${pct}">
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        // Animate progress bars
        setTimeout(() => {
            container.querySelectorAll('.progress-fill[data-pct]').forEach((bar, i) => {
                const pct = parseFloat(bar.dataset.pct);
                setTimeout(() => {
                    bar.style.transition = 'width 1s cubic-bezier(0.4,0,0.2,1)';
                    bar.style.width      = pct + '%';
                }, i * 100);
            });
        }, 100);
    },

    /* ════════════════════════════════════
       SPENDING TREND (Line)
    ════════════════════════════════════ */
    renderSpendingTrend(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const data   = Store.getMonthlyData(6);
        const maxVal = Math.max(...data.expense, 1);
        const w      = 600;
        const h      = 120;
        const padX   = 30;
        const padY   = 15;

        const points = data.expense.map((val, i) => {
            const x = padX + (i / (data.labels.length - 1)) * (w - padX * 2);
            const y = h - padY - ((val / maxVal) * (h - padY * 2));
            return { x, y, val, label: data.labels[i] };
        });

        const pathD = points.map((p, i) =>
            (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)
        ).join(' ');

        const areaD = `${pathD} L ${points[points.length-1].x},${h} L ${points[0].x},${h} Z`;

        const totalLen = this._pathLength(points);

        container.innerHTML = `
            <div class="trend-chart-wrap">
                <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"
                     style="width:100%;height:140px;">
                    <defs>
                        <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.15"/>
                            <stop offset="100%" stop-color="var(--primary)" stop-opacity="0"/>
                        </linearGradient>
                    </defs>

                    <!-- Area fill -->
                    <path d="${areaD}" fill="url(#trendGrad)"/>

                    <!-- Line -->
                    <path
                        id="trendLine"
                        d="${pathD}"
                        fill="none"
                        stroke="var(--primary)"
                        stroke-width="2.5"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-dasharray="${totalLen}"
                        stroke-dashoffset="${totalLen}"
                        style="transition: stroke-dashoffset 1.5s cubic-bezier(0.4,0,0.2,1);"
                    />

                    <!-- Data Points -->
                    ${points.map((p, i) => `
                        <circle
                            cx="${p.x}" cy="${p.y}" r="4"
                            fill="var(--primary)"
                            stroke="white" stroke-width="2"
                            style="opacity:0; transition: opacity 0.3s ease ${0.5 + i*0.1}s;"
                            class="trend-dot"
                        >
                            <title>${p.label}: ${fmt(p.val)}</title>
                        </circle>
                    `).join('')}

                    <!-- Labels -->
                    ${points.map((p, i) => `
                        <text x="${p.x}" y="${h - 2}"
                              text-anchor="middle"
                              font-size="10"
                              fill="var(--text-muted)"
                              font-family="Inter, sans-serif">
                            ${p.label}
                        </text>
                    `).join('')}
                </svg>
            </div>
        `;

        // Animate line draw
        setTimeout(() => {
            const line = container.querySelector('#trendLine');
            if (line) line.style.strokeDashoffset = '0';

            container.querySelectorAll('.trend-dot').forEach(dot => {
                dot.style.opacity = '1';
            });
        }, 100);
    },

    /* Calculate approximate path length */
    _pathLength(points) {
        let length = 0;
        for (let i = 1; i < points.length; i++) {
            const dx = points[i].x - points[i-1].x;
            const dy = points[i].y - points[i-1].y;
            length += Math.sqrt(dx*dx + dy*dy);
        }
        return Math.ceil(length);
    },

    /* ════════════════════════════════════
       MINI SPARKLINE (for stat cards)
    ════════════════════════════════════ */
    renderSparkline(containerId, values, color = 'var(--primary)') {
        const container = document.getElementById(containerId);
        if (!container || !values.length) return;

        const w      = 80;
        const h      = 30;
        const maxVal = Math.max(...values, 1);
        const step   = w / (values.length - 1);

        const pts = values.map((v, i) => ({
            x: i * step,
            y: h - (v / maxVal) * h
        }));

        const pathD = pts.map((p, i) =>
            `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`
        ).join(' ');

        container.innerHTML = `
            <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
                <path d="${pathD}"
                      fill="none"
                      stroke="${color}"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      opacity="0.7"/>
            </svg>
        `;
    }
};