/* ============================================================
   AITOOLCOR MONEYWISE - GOALS
   File: js/goals.js
   ============================================================ */

const Goals = {

    render() {
        this.renderGoalsGrid();
    },

    renderGoalsGrid() {
        const container = document.getElementById('goalsGrid');
        if (!container) return;

        const goals = Store.getGoals();
        let html = '';

        if (!goals.length) {
            html = emptyStateHTML(
                '🎯', 'No goals yet',
                'Create savings goals to stay motivated',
                'Add Goal', 'openGoalModal()'
            );
            container.innerHTML = `<div class="col-span-full">${html}</div>`;
        } else {
            html = goals.map(g => this.goalCardHTML(g)).join('');
            html += `
                <button class="goal-add-card glass hover-lift"
                        onclick="openGoalModal()">
                    <i class="fas fa-plus"></i>
                    <span>Add New Goal</span>
                </button>
            `;
            container.innerHTML = html;
        }

        // Animate progress bars
        setTimeout(() => {
            container.querySelectorAll('.progress-fill[data-pct]').forEach((bar, i) => {
                setTimeout(() => {
                    bar.style.transition = 'width 1.2s cubic-bezier(0.4,0,0.2,1)';
                    bar.style.width = bar.dataset.pct + '%';
                }, i * 150);
            });
        }, 100);
    },

    goalCardHTML(g) {
        const pct       = Math.min(Math.round((g.saved / g.target) * 100), 100);
        const remaining = Math.max(g.target - g.saved, 0);
        const done      = pct >= 100;
        const daysLeft  = g.deadline
            ? Math.ceil((new Date(g.deadline) - new Date()) / 86400000)
            : null;

        return `
            <div class="goal-card glass glass-hover hover-lift hover-shine">
                <div class="goal-card-header">
                    <div class="goal-emoji-wrap">
                        <span class="goal-emoji">${g.emoji || '🎯'}</span>
                        ${done
                            ? '<span class="goal-badge done">✅ Complete</span>'
                            : '<span class="goal-badge active">🔥 Active</span>'}
                    </div>
                    <div class="goal-card-menu">
                        <button class="btn-icon"
                                onclick="openGoalModal('${g.id}')"
                                title="Edit"
                                style="width:30px;height:30px;border-radius:8px;">
                            <i class="fas fa-pen"
                               style="font-size:0.7rem;"></i>
                        </button>
                        <button class="btn-icon"
                                onclick="deleteGoalItem('${g.id}')"
                                title="Delete"
                                style="width:30px;height:30px;border-radius:8px;">
                            <i class="fas fa-trash"
                               style="font-size:0.7rem;color:var(--danger);"></i>
                        </button>
                    </div>
                </div>

                <div class="goal-card-body">
                    <h3 class="goal-name">${g.name}</h3>

                    <div class="goal-target-row">
                        <span class="goal-target-label">Target:</span>
                        <span class="goal-target-value">${fmt(g.target)}</span>
                        ${g.deadline ? `
                        <span class="goal-deadline
                              ${daysLeft !== null && daysLeft < 30
                                  ? 'text-warning'
                                  : 'text-muted'}">
                            ${daysLeft !== null
                                ? daysLeft > 0
                                    ? `${daysLeft}d left`
                                    : 'Overdue'
                                : ''}
                        </span>` : ''}
                    </div>

                    <!-- Progress Bar -->
                    <div class="goal-progress-wrap">
                        <div class="progress-bar goal-progress-bar">
                            <div class="progress-fill primary progress-shimmer"
                                 style="width:0%;
                                        background:linear-gradient(
                                            90deg,var(--primary),var(--secondary));"
                                 data-pct="${pct}">
                            </div>
                        </div>
                        <div class="goal-pct-label">${pct}%</div>
                    </div>

                    <!-- Saved / Remaining -->
                    <div class="goal-amounts">
                        <div class="goal-saved-wrap">
                            <span class="goal-saved-label">Saved</span>
                            <span class="goal-saved-value">${fmt(g.saved)}</span>
                        </div>
                        <div class="goal-remaining-wrap">
                            <span class="goal-remaining-label">
                                ${done ? 'Goal Met!' : 'Remaining'}
                            </span>
                            <span class="goal-remaining-value"
                                  style="color:${done
                                      ? 'var(--success)'
                                      : 'var(--text-muted)'};">
                                ${done ? '🎉' : fmt(remaining)}
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Add Funds Button -->
                ${!done ? `
                <div class="goal-card-footer">
                    <button class="btn btn-primary btn-sm w-full hover-lift"
                            onclick="openAddFundsModal('${g.id}')">
                        <i class="fas fa-plus"></i> Add Funds
                    </button>
                </div>` : `
                <div class="goal-card-footer">
                    <div style="text-align:center;color:var(--success);
                                font-weight:var(--weight-bold);
                                font-size:var(--text-sm);">
                        🎉 Goal Achieved!
                    </div>
                </div>`}
            </div>
        `;
    }
};

function deleteGoalItem(id) {
    const g = Store.getGoalById(id);
    if (!g) return;
    openConfirmModal(
        'Delete Goal?',
        `"${g.emoji} ${g.name}" will be permanently removed.`,
        () => {
            Store.deleteGoal(id);
            Toast.success('Goal removed.');
            Goals.render();
        }
    );
}