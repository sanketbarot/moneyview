/* ============================================================
   AITOOLCOR MONEYWISE - AUTH SYSTEM
   File: js/auth.js
   Description: Google + Email Login/Register + Guest Mode
   ============================================================ */

// ── FIREBASE CONFIG ──
// Replace with your Firebase project config from:
// console.firebase.google.com → Project Settings → Web App
const FIREBASE_CONFIG = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// ── INIT FIREBASE ──
let firebaseApp = null;
let firebaseAuth = null;
let useFirebase = false;

function initFirebase() {
    try {
        if (typeof firebase !== 'undefined' && FIREBASE_CONFIG.apiKey !== 'YOUR_API_KEY') {
            firebaseApp  = firebase.initializeApp(FIREBASE_CONFIG);
            firebaseAuth = firebase.auth();
            useFirebase  = true;

            // Watch auth state
            firebaseAuth.onAuthStateChanged((user) => {
                if (user) {
                    // User is logged in → redirect to app
                    saveAuthSession({
                        uid:      user.uid,
                        name:     user.displayName || 'User',
                        email:    user.email,
                        photo:    user.photoURL,
                        provider: user.providerData[0]?.providerId || 'email',
                        isGuest:  false
                    });
                    redirectToApp();
                }
            });

            console.log('✅ Firebase initialized');
        } else {
            console.warn('⚠️ Firebase not configured — using local mode');
        }
    } catch(e) {
        console.warn('⚠️ Firebase init failed — using local mode', e);
    }
}

// ── STORAGE KEYS ──
const AUTH_KEY    = 'aitoolcor_mw_auth';
const SESSION_KEY = 'aitoolcor_mw_session';

// ── SAVE / GET / CLEAR SESSION ──
function saveAuthSession(user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    localStorage.setItem(SESSION_KEY, JSON.stringify({
        timestamp: Date.now(),
        expires: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    }));
}

function getAuthSession() {
    try {
        const auth    = JSON.parse(localStorage.getItem(AUTH_KEY));
        const session = JSON.parse(localStorage.getItem(SESSION_KEY));
        if (!auth || !session) return null;
        if (Date.now() > session.expires) {
            clearAuthSession();
            return null;
        }
        return auth;
    } catch(e) { return null; }
}

function clearAuthSession() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(SESSION_KEY);
}

function redirectToApp() {
    window.location.href = 'app.html';
}

// ── CHECK IF ALREADY LOGGED IN ──
function checkExistingSession() {
    const session = getAuthSession();
    if (session) redirectToApp();
}

// ── FORM SWITCH ──
function switchForm(form) {
    const loginPanel    = document.getElementById('loginPanel');
    const registerPanel = document.getElementById('registerPanel');
    clearAllErrors();

    if (form === 'register') {
        loginPanel.classList.remove('active');
        loginPanel.style.display = 'none';
        setTimeout(() => {
            registerPanel.style.display = 'block';
            registerPanel.classList.add('active');
        }, 50);
    } else {
        registerPanel.classList.remove('active');
        registerPanel.style.display = 'none';
        setTimeout(() => {
            loginPanel.style.display = 'block';
            loginPanel.classList.add('active');
        }, 50);
    }
}

// ── TOGGLE PASSWORD VISIBILITY ──
function togglePw(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon  = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

// ── PASSWORD STRENGTH ──
function checkPasswordStrength(value) {
    const wrap  = document.getElementById('pwStrengthWrap');
    const label = document.getElementById('pwStrengthLabel');
    const bars  = [
        document.getElementById('pwBar1'),
        document.getElementById('pwBar2'),
        document.getElementById('pwBar3'),
        document.getElementById('pwBar4')
    ];

    if (!value) {
        wrap.style.display = 'none';
        bars.forEach(b => { b.className = 'pw-bar'; });
        return;
    }

    wrap.style.display = 'block';
    bars.forEach(b => { b.className = 'pw-bar'; });

    let score = 0;
    if (value.length >= 6)  score++;
    if (value.length >= 10) score++;
    if (/[A-Z]/.test(value) && /[0-9]/.test(value)) score++;
    if (/[^a-zA-Z0-9]/.test(value)) score++;

    if (score <= 1) {
        bars[0].classList.add('weak');
        label.textContent = 'Weak';
        label.className = 'pw-strength-label weak';
    } else if (score === 2) {
        bars[0].classList.add('medium');
        bars[1].classList.add('medium');
        label.textContent = 'Fair';
        label.className = 'pw-strength-label medium';
    } else if (score === 3) {
        bars[0].classList.add('strong');
        bars[1].classList.add('strong');
        bars[2].classList.add('strong');
        label.textContent = 'Good';
        label.className = 'pw-strength-label strong';
    } else {
        bars.forEach(b => b.classList.add('strong'));
        label.textContent = 'Strong 💪';
        label.className = 'pw-strength-label strong';
    }
}

// ── VALIDATION HELPERS ──
function showError(fieldId, message) {
    const errorEl = document.getElementById(fieldId);
    const inputId = fieldId.replace('Error', '');
    const input   = document.getElementById(inputId);

    if (errorEl) {
        errorEl.querySelector('span').textContent = message;
        errorEl.classList.add('show');
    }
    if (input) input.classList.add('error');
}

function clearError(fieldId) {
    const errorEl = document.getElementById(fieldId);
    const inputId = fieldId.replace('Error', '');
    const input   = document.getElementById(inputId);

    if (errorEl) errorEl.classList.remove('show');
    if (input)   input.classList.remove('error');
}

function clearAllErrors() {
    document.querySelectorAll('.auth-field-error').forEach(el => el.classList.remove('show'));
    document.querySelectorAll('.auth-input').forEach(el => el.classList.remove('error'));
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ── SET BUTTON LOADING ──
function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    if (loading) {
        btn.classList.add('loading');
        btn.disabled = true;
    } else {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// ── GOOGLE SIGN IN ──
async function handleGoogleSignIn() {
    if (!useFirebase) {
        // Local guest mode fallback
        Toast.warning('Firebase not configured. Continuing as Guest.');
        handleGuestLogin();
        return;
    }

    try {
        setLoading('googleSignInBtn', true);
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');
        await firebaseAuth.signInWithPopup(provider);
        // onAuthStateChanged handles the redirect
    } catch(e) {
        setLoading('googleSignInBtn', false);
        const msg = getFirebaseErrorMessage(e.code);
        Toast.error(msg);
        console.error('Google sign-in error:', e);
    }
}

// ── EMAIL LOGIN ──
async function handleEmailLogin() {
    clearAllErrors();

    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    // Validate
    let hasError = false;

    if (!email) {
        showError('loginEmailError', 'Email is required');
        hasError = true;
    } else if (!isValidEmail(email)) {
        showError('loginEmailError', 'Enter a valid email address');
        hasError = true;
    }

    if (!password) {
        showError('loginPasswordError', 'Password is required');
        hasError = true;
    } else if (password.length < 6) {
        showError('loginPasswordError', 'Password must be at least 6 characters');
        hasError = true;
    }

    if (hasError) return;

    if (!useFirebase) {
        // Local mode — check localStorage accounts
        handleLocalLogin(email, password);
        return;
    }

    try {
        setLoading('loginSubmitBtn', true);
        await firebaseAuth.signInWithEmailAndPassword(email, password);
        // onAuthStateChanged handles redirect
    } catch(e) {
        setLoading('loginSubmitBtn', false);
        const msg = getFirebaseErrorMessage(e.code);

        if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
            showError('loginEmailError', msg);
        } else if (e.code === 'auth/wrong-password') {
            showError('loginPasswordError', 'Incorrect password. Please try again.');
        } else {
            Toast.error(msg);
        }
        console.error('Login error:', e);
    }
}

// ── LOCAL LOGIN (no Firebase) ──
function handleLocalLogin(email, password) {
    setLoading('loginSubmitBtn', true);
    const accounts = JSON.parse(localStorage.getItem('aitoolcor_mw_accounts') || '[]');
    const account  = accounts.find(a => a.email === email && a.password === btoa(password));

    setTimeout(() => {
        if (account) {
            saveAuthSession({
                uid:      account.uid,
                name:     account.name,
                email:    account.email,
                photo:    null,
                provider: 'email',
                isGuest:  false
            });
            Toast.success('Welcome back, ' + account.name.split(' ')[0] + '!');
            setTimeout(redirectToApp, 500);
        } else {
            setLoading('loginSubmitBtn', false);
            showError('loginEmailError', 'No account found with this email.');
            showError('loginPasswordError', 'Or password is incorrect.');
        }
    }, 800);
}

// ── EMAIL REGISTER ──
async function handleEmailRegister() {
    clearAllErrors();

    const name     = document.getElementById('registerName').value.trim();
    const email    = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirm  = document.getElementById('registerConfirmPassword').value;
    const terms    = document.getElementById('termsCheckbox').checked;

    let hasError = false;

    if (!name || name.length < 2) {
        showError('registerNameError', 'Please enter your full name (min. 2 characters)');
        hasError = true;
    }

    if (!email) {
        showError('registerEmailError', 'Email is required');
        hasError = true;
    } else if (!isValidEmail(email)) {
        showError('registerEmailError', 'Enter a valid email address');
        hasError = true;
    }

    if (!password) {
        showError('registerPasswordError', 'Password is required');
        hasError = true;
    } else if (password.length < 6) {
        showError('registerPasswordError', 'Password must be at least 6 characters');
        hasError = true;
    }

    if (!confirm) {
        showError('registerConfirmError', 'Please confirm your password');
        hasError = true;
    } else if (password !== confirm) {
        showError('registerConfirmError', 'Passwords do not match');
        hasError = true;
    }

    if (!terms) {
        Toast.warning('Please agree to the Terms of Service to continue.');
        hasError = true;
    }

    if (hasError) return;

    if (!useFirebase) {
        handleLocalRegister(name, email, password);
        return;
    }

    try {
        setLoading('registerSubmitBtn', true);
        const result = await firebaseAuth.createUserWithEmailAndPassword(email, password);
        await result.user.updateProfile({ displayName: name });
        // onAuthStateChanged handles redirect
    } catch(e) {
        setLoading('registerSubmitBtn', false);
        const msg = getFirebaseErrorMessage(e.code);

        if (e.code === 'auth/email-already-in-use') {
            showError('registerEmailError', 'An account with this email already exists.');
        } else {
            Toast.error(msg);
        }
        console.error('Register error:', e);
    }
}

// ── LOCAL REGISTER (no Firebase) ──
function handleLocalRegister(name, email, password) {
    setLoading('registerSubmitBtn', true);
    const accounts = JSON.parse(localStorage.getItem('aitoolcor_mw_accounts') || '[]');

    if (accounts.find(a => a.email === email)) {
        setLoading('registerSubmitBtn', false);
        showError('registerEmailError', 'An account with this email already exists.');
        return;
    }

    const uid = 'local_' + Date.now().toString(36);
    accounts.push({ uid, name, email, password: btoa(password) });
    localStorage.setItem('aitoolcor_mw_accounts', JSON.stringify(accounts));

    setTimeout(() => {
        saveAuthSession({ uid, name, email, photo: null, provider: 'email', isGuest: false });
        Toast.success('Account created! Welcome, ' + name.split(' ')[0] + '!');
        setTimeout(redirectToApp, 600);
    }, 800);
}

// ── GUEST LOGIN ──
function handleGuestLogin() {
    const guestId = 'guest_' + Date.now().toString(36);
    saveAuthSession({
        uid:      guestId,
        name:     'Guest User',
        email:    'guest@local.moneywise',
        photo:    null,
        provider: 'guest',
        isGuest:  true
    });
    Toast.info('Continuing as Guest. Your data is saved locally.');
    setTimeout(redirectToApp, 600);
}

// ── FORGOT PASSWORD ──
async function handleForgotPassword() {
    const email = document.getElementById('loginEmail').value.trim();

    if (!email) {
        showError('loginEmailError', 'Enter your email address first');
        return;
    }

    if (!isValidEmail(email)) {
        showError('loginEmailError', 'Enter a valid email address');
        return;
    }

    if (!useFirebase) {
        Toast.info('Password reset not available in local mode.');
        return;
    }

    try {
        await firebaseAuth.sendPasswordResetEmail(email);
        Toast.success('Reset email sent! Check your inbox.', 'Check Email');
    } catch(e) {
        const msg = getFirebaseErrorMessage(e.code);
        Toast.error(msg);
    }
}

// ── FIREBASE ERROR MESSAGES ──
function getFirebaseErrorMessage(code) {
    const messages = {
        'auth/user-not-found':      'No account found with this email.',
        'auth/wrong-password':      'Incorrect password. Please try again.',
        'auth/invalid-email':       'Invalid email address.',
        'auth/email-already-in-use':'An account with this email already exists.',
        'auth/weak-password':       'Password is too weak. Use at least 6 characters.',
        'auth/network-request-failed': 'Network error. Check your connection.',
        'auth/too-many-requests':   'Too many attempts. Please try again later.',
        'auth/popup-closed-by-user':'Google sign-in was cancelled.',
        'auth/popup-blocked':       'Popup was blocked. Allow popups for this site.',
        'auth/invalid-credential':  'Invalid credentials. Please check and try again.',
        'auth/user-disabled':       'This account has been disabled.',
    };
    return messages[code] || 'An error occurred. Please try again.';
}

// ── KEYBOARD ENTER SUBMIT ──
function setupKeyboardSubmit() {
    // Login form — Enter key
    ['loginEmail', 'loginPassword'].forEach(id => {
        document.getElementById(id)?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleEmailLogin();
        });
    });

    // Register form — Enter key
    ['registerName', 'registerEmail', 'registerPassword', 'registerConfirmPassword'].forEach(id => {
        document.getElementById(id)?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') handleEmailRegister();
        });
    });
}

// ── REAL-TIME VALIDATION ──
function setupRealtimeValidation() {
    // Email validation on blur
    document.getElementById('loginEmail')?.addEventListener('blur', function() {
        if (this.value && !isValidEmail(this.value)) {
            showError('loginEmailError', 'Enter a valid email address');
        } else {
            clearError('loginEmailError');
        }
    });

    document.getElementById('registerEmail')?.addEventListener('blur', function() {
        if (this.value && !isValidEmail(this.value)) {
            showError('registerEmailError', 'Enter a valid email address');
        } else {
            clearError('registerEmailError');
        }
    });

    // Password match check
    document.getElementById('registerConfirmPassword')?.addEventListener('input', function() {
        const pw = document.getElementById('registerPassword').value;
        if (this.value && pw !== this.value) {
            showError('registerConfirmError', 'Passwords do not match');
        } else {
            clearError('registerConfirmError');
            if (this.value) this.classList.add('success');
        }
    });

    // Clear errors on input
    document.querySelectorAll('.auth-input').forEach(input => {
        input.addEventListener('input', function() {
            const errorId = this.id.replace('login', 'login').replace('register', 'register') + 'Error';
            clearError(this.id + 'Error');
        });
    });
}

// ── BUTTON EVENT LISTENERS ──
function setupEventListeners() {
    // Google Sign In
    document.getElementById('googleSignInBtn')?.addEventListener('click', handleGoogleSignIn);
    document.getElementById('googleRegisterBtn')?.addEventListener('click', handleGoogleSignIn);

    // Email Login
    document.getElementById('loginSubmitBtn')?.addEventListener('click', handleEmailLogin);

    // Email Register
    document.getElementById('registerSubmitBtn')?.addEventListener('click', handleEmailRegister);

    // Guest
    document.getElementById('guestBtn')?.addEventListener('click', handleGuestLogin);

    // Forgot Password
    document.getElementById('forgotPwBtn')?.addEventListener('click', (e) => {
        e.preventDefault();
        handleForgotPassword();
    });
}

// ── LOADER ──
function hideLoader() {
    const loader = document.getElementById('loaderScreen');
    if (loader) {
        setTimeout(() => loader.classList.add('hide'), 800);
    }
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
    initFirebase();
    checkExistingSession();
    setupEventListeners();
    setupKeyboardSubmit();
    setupRealtimeValidation();
    hideLoader();

    console.log(
        '%c💰 AitoolCor MoneyWise',
        'color:#6366F1; font-size:18px; font-weight:bold;'
    );
    console.log(
        '%chttps://moneywise.aitoolcor.com',
        'color:#94A3B8; font-size:11px;'
    );
});