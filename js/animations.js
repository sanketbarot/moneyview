/* ============================================================
   AITOOLCOR MONEYWISE - ANIMATIONS
   File: js/animations.js
   Description: Page transitions, hover effects, micro-interactions
   NO scroll animations — only hover + page + chart animations
   ============================================================ */

const Animations = {

    /* ════════════════════════
       PAGE TRANSITION
    ════════════════════════ */
    pageEnter(pageEl) {
        if (!pageEl) return;
        pageEl.style.opacity = '0';
        pageEl.style.transform = 'translateY(12px)';
        pageEl.style.transition = 'none';

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                pageEl.style.transition =
                    'opacity 0.4s cubic-bezier(0.4,0,0.2,1), ' +
                    'transform 0.4s cubic-bezier(0.4,0,0.2,1)';
                pageEl.style.opacity   = '1';
                pageEl.style.transform = 'translateY(0)';

                // Stagger children
                this.staggerChildren(pageEl);
            });
        });
    },

    /* Stagger children elements */
    staggerChildren(parent, selector = '.card, .stat-card, .goal-card, .account-card-item') {
        const children = parent.querySelectorAll(selector);
        children.forEach((child, i) => {
            child.style.opacity   = '0';
            child.style.transform = 'translateY(16px)';
            child.style.transition = 'none';

            setTimeout(() => {
                child.style.transition =
                    'opacity 0.45s cubic-bezier(0.4,0,0.2,1), ' +
                    'transform 0.45s cubic-bezier(0.4,0,0.2,1)';
                child.style.opacity   = '1';
                child.style.transform = 'translateY(0)';
            }, 50 + i * 60);
        });
    },

    /* ════════════════════════
       COUNTER ANIMATION
    ════════════════════════ */
    countUp(element, target, duration = 900, prefix = '', suffix = '') {
        if (!element) return;
        const startTime = performance.now();
        const decimals  = String(target).includes('.') ? 2 : 0;

        function tick(now) {
            const elapsed  = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const ease     = 1 - Math.pow(1 - progress, 3);
            const value    = ease * target;

            element.textContent = prefix +
                value.toLocaleString('en-US', {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals
                }) + suffix;

            if (progress < 1) requestAnimationFrame(tick);
            else {
                element.textContent = prefix +
                    target.toLocaleString('en-US', {
                        minimumFractionDigits: decimals,
                        maximumFractionDigits: decimals
                    }) + suffix;
            }
        }

        requestAnimationFrame(tick);
    },

    /* ════════════════════════
       PROGRESS BAR ANIMATION
    ════════════════════════ */
    animateProgress(fillEl, targetPct, delay = 0) {
        if (!fillEl) return;
        fillEl.style.width      = '0%';
        fillEl.style.transition = 'none';

        setTimeout(() => {
            fillEl.style.transition = 'width 1s cubic-bezier(0.4,0,0.2,1)';
            fillEl.style.width      = Math.min(targetPct, 100) + '%';
        }, delay + 50);
    },

    /* Animate all progress bars in container */
    animateAllProgress(container) {
        const bars = container.querySelectorAll('.progress-fill[data-pct]');
        bars.forEach((bar, i) => {
            const pct = parseFloat(bar.dataset.pct) || 0;
            this.animateProgress(bar, pct, i * 80);
        });
    },

    /* ════════════════════════
       HOVER: TILT EFFECT
    ════════════════════════ */
    addTilt(element, intensity = 8) {
        if (!element) return;

        element.addEventListener('mousemove', (e) => {
            const rect   = element.getBoundingClientRect();
            const x      = e.clientX - rect.left;
            const y      = e.clientY - rect.top;
            const centerX = rect.width  / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -intensity;
            const rotateY = ((x - centerX) / centerX) *  intensity;

            element.style.transform =
                `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(4px)`;
        });

        element.addEventListener('mouseleave', () => {
            element.style.transition = 'transform 0.5s cubic-bezier(0.4,0,0.2,1)';
            element.style.transform  = 'perspective(1000px) rotateX(0) rotateY(0) translateZ(0)';
            setTimeout(() => {
                element.style.transition = '';
            }, 500);
        });

        element.addEventListener('mouseenter', () => {
            element.style.transition = 'transform 0.15s ease';
        });
    },

    /* ════════════════════════
       HOVER: MAGNETIC BUTTON
    ════════════════════════ */
    addMagnetic(element, strength = 0.3) {
        if (!element) return;

        element.addEventListener('mousemove', (e) => {
            const rect    = element.getBoundingClientRect();
            const x       = e.clientX - rect.left - rect.width  / 2;
            const y       = e.clientY - rect.top  - rect.height / 2;
            element.style.transform =
                `translate(${x * strength}px, ${y * strength}px)`;
        });

        element.addEventListener('mouseleave', () => {
            element.style.transition = 'transform 0.5s cubic-bezier(0.4,0,0.2,1)';
            element.style.transform  = 'translate(0,0)';
            setTimeout(() => element.style.transition = '', 500);
        });

        element.addEventListener('mouseenter', () => {
            element.style.transition = 'transform 0.15s ease';
        });
    },

    /* ════════════════════════
       HOVER: RIPPLE EFFECT
    ════════════════════════ */
    addRipple(element) {
        if (!element) return;
        element.style.position = 'relative';
        element.style.overflow = 'hidden';

        element.addEventListener('click', (e) => {
            const rect   = element.getBoundingClientRect();
            const x      = e.clientX - rect.left;
            const y      = e.clientY - rect.top;
            const size   = Math.max(rect.width, rect.height) * 2;

            const ripple = document.createElement('span');
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x - size/2}px;
                top: ${y - size/2}px;
                background: rgba(255,255,255,0.25);
                border-radius: 50%;
                transform: scale(0);
                animation: rippleAnim 0.6s ease-out forwards;
                pointer-events: none;
                z-index: 999;
            `;

            // Inject keyframes once
            if (!document.getElementById('rippleStyle')) {
                const style = document.createElement('style');
                style.id    = 'rippleStyle';
                style.textContent = `
                    @keyframes rippleAnim {
                        to { transform: scale(1); opacity: 0; }
                    }
                `;
                document.head.appendChild(style);
            }

            element.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    },

    /* ════════════════════════
       NUMBER FLIP ANIMATION
    ════════════════════════ */
    flipNumber(element, newValue) {
        if (!element) return;

        element.style.transition = 'transform 0.2s ease, opacity 0.2s ease';
        element.style.transform  = 'translateY(-8px)';
        element.style.opacity    = '0';

        setTimeout(() => {
            element.textContent  = newValue;
            element.style.transition = 'none';
            element.style.transform  = 'translateY(8px)';
            element.style.opacity    = '0';

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    element.style.transition =
                        'transform 0.2s ease, opacity 0.2s ease';
                    element.style.transform  = 'translateY(0)';
                    element.style.opacity    = '1';
                });
            });
        }, 200);
    },

    /* ════════════════════════
       ITEM ADD / REMOVE
    ════════════════════════ */
    animateItemAdd(element) {
        if (!element) return;
        element.style.opacity   = '0';
        element.style.transform = 'translateY(-10px) scale(0.97)';
        element.style.transition = 'none';

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                element.style.transition =
                    'opacity 0.4s cubic-bezier(0.4,0,0.2,1), ' +
                    'transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275)';
                element.style.opacity   = '1';
                element.style.transform = 'translateY(0) scale(1)';
            });
        });
    },

    animateItemRemove(element, callback) {
        if (!element) return;
        element.style.transition =
            'opacity 0.3s ease, transform 0.3s ease, ' +
            'max-height 0.3s ease, padding 0.3s ease, margin 0.3s ease';
        element.style.opacity    = '0';
        element.style.transform  = 'translateX(30px)';
        element.style.maxHeight  = element.offsetHeight + 'px';
        element.style.overflow   = 'hidden';

        setTimeout(() => {
            element.style.maxHeight = '0';
            element.style.padding   = '0';
            element.style.margin    = '0';
        }, 50);

        setTimeout(() => {
            element.remove();
            if (callback) callback();
        }, 400);
    },

    /* ════════════════════════
       TOAST ANIMATION
    ════════════════════════ */
    toastEnter(el) {
        if (!el) return;
        el.style.transform  = 'translateX(120%) scale(0.9)';
        el.style.opacity    = '0';
        el.style.transition = 'none';

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                el.style.transition =
                    'transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275), ' +
                    'opacity 0.3s ease';
                el.style.transform = 'translateX(0) scale(1)';
                el.style.opacity   = '1';
            });
        });
    },

    toastExit(el, callback) {
        if (!el) return;
        el.style.transition =
            'transform 0.3s ease, opacity 0.3s ease';
        el.style.transform  = 'translateX(120%)';
        el.style.opacity    = '0';
        setTimeout(() => {
            el.remove();
            if (callback) callback();
        }, 300);
    },

    /* ════════════════════════
       MODAL ANIMATION
    ════════════════════════ */
    modalEnter(modal) {
        if (!modal) return;
        modal.style.transform  = 'scale(0.92) translateY(16px)';
        modal.style.opacity    = '0';
        modal.style.transition = 'none';

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                modal.style.transition =
                    'transform 0.35s cubic-bezier(0.4,0,0.2,1), ' +
                    'opacity 0.3s ease';
                modal.style.transform  = 'scale(1) translateY(0)';
                modal.style.opacity    = '1';
            });
        });
    },

    /* ════════════════════════
       PULSE GLOW (success action)
    ════════════════════════ */
    pulseGlow(element, color = 'var(--primary-glow)') {
        if (!element) return;
        const original = element.style.boxShadow;
        element.style.transition = 'box-shadow 0.3s ease';
        element.style.boxShadow  = `0 0 0 0 ${color}`;

        const frames = [
            { boxShadow: `0 0 0 6px ${color}` },
            { boxShadow: `0 0 0 12px transparent` }
        ];

        element.animate(frames, {
            duration: 600,
            easing:   'ease-out'
        }).onfinish = () => {
            element.style.boxShadow = original;
        };
    },

    /* ════════════════════════
       SHAKE (error feedback)
    ════════════════════════ */
    shake(element) {
        if (!element) return;
        element.animate([
            { transform: 'translateX(0)' },
            { transform: 'translateX(-6px)' },
            { transform: 'translateX(6px)' },
            { transform: 'translateX(-4px)' },
            { transform: 'translateX(4px)' },
            { transform: 'translateX(-2px)' },
            { transform: 'translateX(0)' }
        ], { duration: 400, easing: 'ease-in-out' });
    },

    /* ════════════════════════
       SETUP HOVER EFFECTS
    ════════════════════════ */
    setupHovers() {
        // Add ripple to all primary buttons
        document.querySelectorAll('.btn-primary, .btn-success, .btn-danger').forEach(btn => {
            this.addRipple(btn);
        });

        // Add magnetic to quick-add button
        const qaBtn = document.getElementById('quickAddBtn');
        if (qaBtn) this.addMagnetic(qaBtn);
    },

    /* ════════════════════════
       LOADER
    ════════════════════════ */
    hideLoader(delay = 1000) {
        setTimeout(() => {
            const loader = document.getElementById('loaderScreen');
            if (!loader) return;
            loader.style.transition = 'opacity 0.5s ease, visibility 0.5s ease';
            loader.style.opacity    = '0';
            loader.style.visibility = 'hidden';
            setTimeout(() => loader.remove(), 500);
        }, delay);
    },

    /* ════════════════════════
       INIT
    ════════════════════════ */
    init() {
        this.setupHovers();
    }
};