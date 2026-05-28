/* ============================================================
   AITOOLCOR MONEYWISE - AUTH SYSTEM (UPDATED)
   File: js/auth.js
   
   ✅ Real Firebase Google Auth
   ✅ Per-user data isolation
   ✅ Guest → dummy data
   ✅ New user → blank data
   ✅ Default INR currency
   ============================================================ */

// ══════════════════════════════════════════
// FIREBASE CONFIG — Replace with YOUR config
// Go to: console.firebase.google.com
// Project Settings → Web App → Config
// ══════════════════════════════════════════
const FIREBASE_CONFIG = {
    apiKey:            "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXX",
    authDomain:        "your-project.firebaseapp.com",
    projectId:         "your-project-id",
    storageBucket:     "your-project.appspot.com",
    messagingSenderId: "123456789",
    appId:             "1:123456789:web:abcdef123456"
};

// ══════════════════════════════════════════
// CONSTANTS
// ══════════════════════════════════════════
const AUTH_KEY        = 'aitoolcor_mw_auth';
const SESSION_KEY     = 'aitoolcor_mw_session';
const DATA_PREFIX     = 'aitoolcor_mw_data_';
const ACCOUNTS_KEY    = 'aitoolcor_mw_accounts';

let firebaseApp       = null;
let firebaseAuth      = null;
let useFirebase       = false;
let googleProvider    = null;

// ══════════════════════════════════════════
// FIREBASE INIT
// ══════════════════════════════════════════
function initFirebase() {
    try {
        if (typeof firebase !== 'undefined' &&
            FIREBASE_CONFIG.apiKey &&
            !FIREBASE_CONFIG.apiKey.includes('XXXX')) {

            firebaseApp    = firebase.initializeApp(FIREBASE_CONFIG);
            firebaseAuth   = firebase.auth();
            googleProvider = new firebase.auth.GoogleAuthProvider();

            googleProvider.addScope('profile');
            googleProvider.addScope('email');

            // Persistence
            firebaseAuth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

            // Auth state watcher
            firebaseAuth.onAuthStateChanged((user) => {
                if (user) {
                    handleFirebaseUser(user);
                }
            });

            useFirebase = true;
            console.log('✅ Firebase initialized');
        } else {
            console.warn('⚠️ Firebase not configured — local mode');
        }
    } catch(e) {
        console.warn('⚠️ Firebase init error:', e);
        useFirebase = false;
    }
}

// ══════════════════════════════════════════
// HANDLE FIREBASE USER (Google or Email)
// ══════════════════════════════════════════
function handleFirebaseUser(user) {
    const authData = {
        uid:        user.uid,
        name:       user.displayName || user.email?.split('@')[0] || 'User',
        email:      user.email,
        photo:      user.photoURL,
        provider:   user.providerData[0]?.providerId || 'email',
        isGuest:    false,
        isNewUser:  false, // will be set properly
        loginTime:  Date.now()
    };

    // Check if this user has existing data
    const existingData = localStorage.getItem(DATA_PREFIX + user.uid);
    if (existingData) {
        authData.isNewUser = false;
        console.log('✅ Returning user — loading saved data');
    } else {
        authData.isNewUser = true;
        console.log('🆕 New user — will create blank data');
    }

    saveAuthSession(authData);
}

// ══════════════════════════════════════════
// SAVE / GET / CLEAR SESSION
// ══════════════════════════════════════════
function saveAuthSession(user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    localStorage.setItem(SESSION_KEY, JSON.stringify({
        timestamp: Date.now(),
        expires:   Date.now() + (90 * 24 * 60 * 60 * 1000) // 90 days
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
    } catch(e) {
        return null;
    }
}

function clearAuthSession() {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(SESSION_KEY);
}

// ══════════════════════════════════════════
// GET USER-SPECIFIC STORAGE KEY
// ══════════════════════════════════════════
function getUserStorageKey() {
    const auth = getAuthSession();
    if (!auth || !auth.uid) return DATA_PREFIX + 'guest_default';
    return DATA_PREFIX + auth.uid;
}

function isNewUser() {
    const auth = getAuthSession();
    return auth?.isNewUser === true;
}

function isGuestUser() {
    const auth = getAuthSession();
    return auth?.isGuest === true;
}

function markUserAsReturning() {
    const auth = getAuthSession();
    if (auth) {
        auth.isNewUser = false;
        saveAuthSession(auth);
    }
}

// ══════════════════════════════════════════
// REDIRECT
// ══════════════════════════════════════════
function redirectToApp() {
    window.location.href = 'app.html';
}

function checkExistingSession() {
    const session = getAuthSession();
    if (session) {
        redirectToApp();
    }
}

// ══════════════════════════════════════════
// GOOGLE SIGN IN
// ══════════════════════════════════════════
async function handleGoogleSignIn() {
    if (!useFirebase) {
        Toast.warning('Firebase not configured. Use Guest mode or Email login.');
        return;
    }

    try {
        setLoading('googleSignInBtn', true);

        const result = await firebaseAuth.signInWithPopup(googleProvider);
        const user   = result.user;
        const isNew  = result.additionalUserInfo?.isNewUser || false;

        const authData = {
            uid:       user.uid,
            name:      user.displayName || 'User',
            email:     user.email,
            photo:     user.photoURL,
            provider:  'google',
            isGuest:   false,
            isNewUser: isNew && !localStorage.getItem(DATA_PREFIX + user.uid),
            loginTime: Date.now()
        };

        saveAuthSession(authData);
        Toast.success(`Welcome${isNew ? '' : ' back'}, ${authData.name.split(' ')[0]}!`);
        setTimeout(redirectToApp, 600);

    } catch(e) {
        setLoading('googleSignInBtn', false);
        const msg = getFirebaseErrorMessage(e.code);
        if (e.code !== 'auth/popup-closed-by-user') {
            Toast.error(msg);
        }
        console.error('Google sign-in error:', e);
    }
}

// ══════════════════════════════════════════
// EMAIL LOGIN
// ══════════════════════════════════════════
async function handleEmailLogin() {
    clearAllErrors();

    const email    = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    let hasError   = false;

    if (!email) {
        showError('loginEmailError', 'Email is required');
        hasError = true;
    } else if (!isValidEmail(email)) {
        showError('loginEmailError', 'Enter a valid email');
        hasError = true;
    }

    if (!password) {
        showError('loginPasswordError', 'Password is required');
        hasError = true;
    } else if (password.length < 6) {
        showError('loginPasswordError', 'Min. 6 characters');
        hasError = true;
    }

    if (hasError) return;

    if (useFirebase) {
        // Firebase email login
        try {
            setLoading('loginSubmitBtn', true);
            const result = await firebaseAuth.signInWithEmailAndPassword(email, password);
            // onAuthStateChanged handles the rest
            Toast.success('Welcome back!');
            setTimeout(redirectToApp, 600);
        } catch(e) {
            setLoading('loginSubmitBtn', false);
            const msg = getFirebaseErrorMessage(e.code);
            if (e.code.includes('user-not-found') || e.code.includes('invalid-credential')) {
                showError('loginEmailError', msg);
            } else if (e.code.includes('wrong-password')) {
                showError('loginPasswordError', 'Incorrect password');
            } else {
                Toast.error(msg);
            }
        }
    } else {
        // Local email login
        handleLocalLogin(email, password);
    }
}

function handleLocalLogin(email, password) {
    setLoading('loginSubmitBtn', true);
    const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');
    const account  = accounts.find(a =>
        a.email === email && a.password === btoa(password)
    );

    setTimeout(() => {
        if (account) {
            const hasData = !!localStorage.getItem(DATA_PREFIX + account.uid);
            saveAuthSession({
                uid:       account.uid,
                name:      account.name,
                email:     account.email,
                photo:     null,
                provider:  'email',
                isGuest:   false,
                isNewUser: !hasData,
                loginTime: Date.now()
            });
            Toast.success('Welcome back, ' + account.name.split(' ')[0] + '!');
            setTimeout(redirectToApp, 500);
        } else {
            setLoading('loginSubmitBtn', false);
            showError('loginEmailError', 'No account found or wrong password');
            showError('loginPasswordError', 'Check your credentials');
        }
    }, 600);
}

// ══════════════════════════════════════════
// EMAIL REGISTER
// ══════════════════════════════════════════
async function handleEmailRegister() {
    clearAllErrors();

    const name     = document.getElementById('registerName').value.trim();
    const email    = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirm  = document.getElementById('registerConfirmPassword').value;
    const terms    = document.getElementById('termsCheckbox').checked;
    let hasError   = false;

    if (!name || name.length < 2) {
        showError('registerNameError', 'Name required (min. 2 chars)');
        hasError = true;
    }

    if (!email) {
        showError('registerEmailError', 'Email is required');
        hasError = true;
    } else if (!isValidEmail(email)) {
        showError('registerEmailError', 'Enter a valid email');
        hasError = true;
    }

    if (!password) {
        showError('registerPasswordError', 'Password required');
        hasError = true;
    } else if (password.length < 6) {
        showError('registerPasswordError', 'Min. 6 characters');
        hasError = true;
    }

    if (!confirm) {
        showError('registerConfirmError', 'Confirm your password');
        hasError = true;
    } else if (password !== confirm) {
        showError('registerConfirmError', 'Passwords don\'t match');
        hasError = true;
    }

    if (!terms) {
        Toast.warning('Please agree to Terms & Privacy Policy');
        hasError = true;
    }

    if (hasError) return;

    if (useFirebase) {
        try {
            setLoading('registerSubmitBtn', true);
            const result = await firebaseAuth.createUserWithEmailAndPassword(email, password);
            await result.user.updateProfile({ displayName: name });

            saveAuthSession({
                uid:       result.user.uid,
                name:      name,
                email:     email,
                photo:     null,
                provider:  'email',
                isGuest:   false,
                isNewUser: true, // new user → blank data
                loginTime: Date.now()
            });

            Toast.success(`Account created! Welcome, ${name.split(' ')[0]}!`);
            setTimeout(redirectToApp, 600);
        } catch(e) {
            setLoading('registerSubmitBtn', false);
            if (e.code === 'auth/email-already-in-use') {
                showError('registerEmailError', 'Email already registered');
            } else {
                Toast.error(getFirebaseErrorMessage(e.code));
            }
        }
    } else {
        handleLocalRegister(name, email, password);
    }
}

function handleLocalRegister(name, email, password) {
    setLoading('registerSubmitBtn', true);
    const accounts = JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || '[]');

    if (accounts.find(a => a.email === email)) {
        setLoading('registerSubmitBtn', false);
        showError('registerEmailError', 'Email already registered');
        return;
    }

    const uid = 'local_' + Date.now().toString(36) +
                Math.random().toString(36).substr(2, 5);

    accounts.push({ uid, name, email, password: btoa(password) });
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));

    setTimeout(() => {
        saveAuthSession({
            uid, name, email,
            photo:     null,
            provider:  'email',
            isGuest:   false,
            isNewUser: true, // blank data
            loginTime: Date.now()
        });
        Toast.success(`Account created! Welcome, ${name.split(' ')[0]}!`);
        setTimeout(redirectToApp, 600);
    }, 600);
}

// ══════════════════════════════════════════
// GUEST LOGIN → LOADS DUMMY DATA
// ══════════════════════════════════════════
function handleGuestLogin() {
    const guestId = 'guest_' + Date.now().toString(36);

    saveAuthSession({
        uid:       guestId,
        name:      'Guest User',
        email:     'guest@moneywise.local',
        photo:     null,
        provider:  'guest',
        isGuest:   true,
        isNewUser: false, // Guest = dummy data (NOT blank)
        loginTime: Date.now()
    });

    Toast.info('Continuing as Guest with sample data. Your data is saved locally.');
    setTimeout(redirectToApp, 500);
}

// ══════════════════════════════════════════
// FORGOT PASSWORD
// ══════════════════════════════════════════
async function handleForgotPassword() {
    const email = document.getElementById('loginEmail').value.trim();

    if (!email || !isValidEmail(email)) {
        showError('loginEmailError', 'Enter your email first');
        return;
    }

    if (!useFirebase) {
        Toast.info('Password reset not available in local mode');
        return;
    }

    try {
        await firebaseAuth.sendPasswordResetEmail(email);
        Toast.success('Password reset email sent! Check inbox.', 'Email Sent');
    } catch(e) {
        Toast.error(getFirebaseErrorMessage(e.code));
    }
}

// ══════════════════════════════════════════
// FIREBASE ERROR MESSAGES
// ══════════════════════════════════════════
function getFirebaseErrorMessage(code) {
    const map = {
        'auth/user-not-found':         'No account found with this email',
        'auth/wrong-password':         'Incorrect password',
        'auth/invalid-email':          'Invalid email address',
        'auth/email-already-in-use':   'Email already registered',
        'auth/weak-password':          'Password too weak (min 6 chars)',
        'auth/network-request-failed': 'Network error. Check connection.',
        'auth/too-many-requests':      'Too many attempts. Try later.',
        'auth/popup-closed-by-user':   'Sign-in cancelled',
        'auth/popup-blocked':          'Popup blocked. Allow popups.',
        'auth/invalid-credential':     'Invalid credentials',
        'auth/user-disabled':          'Account disabled',
        'auth/requires-recent-login':  'Please login again',
    };
    return map[code] || 'An error occurred. Please try again.';
}

// ══════════════════════════════════════════
// FORM HELPERS
// ══════════════════════════════════════════
function switchForm(form) {
    clearAllErrors();
    const loginPanel    = document.getElementById('loginPanel');
    const registerPanel = document.getElementById('registerPanel');

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

function checkPasswordStrength(value) {
    const wrap  = document.getElementById('pwStrengthWrap');
    const label = document.getElementById('pwStrengthLabel');
    const bars  = ['pwBar1','pwBar2','pwBar3','pwBar4'].map(id =>
        document.getElementById(id));

    if (!value) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'block';
    bars.forEach(b => b.className = 'pw-bar');

    let score = 0;
    if (value.length >= 6)  score++;
    if (value.length >= 10) score++;
    if (/[A-Z]/.test(value) && /[0-9]/.test(value)) score++;
    if (/[^a-zA-Z0-9]/.test(value)) score++;

    const levels = [
        { max: 1, cls: 'weak',   text: 'Weak' },
        { max: 2, cls: 'medium', text: 'Fair' },
        { max: 3, cls: 'strong', text: 'Good' },
        { max: 4, cls: 'strong', text: 'Strong 💪' }
    ];

    const level = levels.find(l => score <= l.max) || levels[3];
    for (let i = 0; i < score; i++) {
        bars[i]?.classList.add(level.cls);
    }
    label.textContent = level.text;
    label.className = `pw-strength-label ${level.cls}`;
}

function showError(fieldId, msg) {
    const el    = document.getElementById(fieldId);
    const input = document.getElementById(fieldId.replace('Error', ''));
    if (el)    { el.querySelector('span').textContent = msg; el.classList.add('show'); }
    if (input) input.classList.add('error');
}

function clearError(fieldId) {
    const el    = document.getElementById(fieldId);
    const input = document.getElementById(fieldId.replace('Error', ''));
    if (el)    el.classList.remove('show');
    if (input) input.classList.remove('error');
}

function clearAllErrors() {
    document.querySelectorAll('.auth-field-error').forEach(el =>
        el.classList.remove('show'));
    document.querySelectorAll('.auth-input').forEach(el =>
        el.classList.remove('error'));
}

function isValidEmail(e) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

function setLoading(btnId, loading) {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.classList.toggle('loading', loading);
    btn.disabled = loading;
}

// ══════════════════════════════════════════
// SETUP
// ══════════════════════════════════════════
function setupKeyboardSubmit() {
    ['loginEmail','loginPassword'].forEach(id => {
        document.getElementById(id)?.addEventListener('keydown', e => {
            if (e.key === 'Enter') handleEmailLogin();
        });
    });

    ['registerName','registerEmail','registerPassword','registerConfirmPassword']
        .forEach(id => {
        document.getElementById(id)?.addEventListener('keydown', e => {
            if (e.key === 'Enter') handleEmailRegister();
        });
    });
}

function setupRealtimeValidation() {
    document.getElementById('loginEmail')?.addEventListener('blur', function() {
        if (this.value && !isValidEmail(this.value))
            showError('loginEmailError', 'Enter a valid email');
        else clearError('loginEmailError');
    });

    document.getElementById('registerEmail')?.addEventListener('blur', function() {
        if (this.value && !isValidEmail(this.value))
            showError('registerEmailError', 'Enter a valid email');
        else clearError('registerEmailError');
    });

    document.getElementById('registerConfirmPassword')?.addEventListener('input',
        function() {
        const pw = document.getElementById('registerPassword').value;
        if (this.value && pw !== this.value)
            showError('registerConfirmError', 'Passwords don\'t match');
        else {
            clearError('registerConfirmError');
            if (this.value && pw === this.value) this.classList.add('success');
        }
    });

    document.querySelectorAll('.auth-input').forEach(input => {
        input.addEventListener('input', () =>
            clearError(input.id + 'Error'));
    });
}

function setupEventListeners() {
    document.getElementById('googleSignInBtn')
        ?.addEventListener('click', handleGoogleSignIn);
    document.getElementById('googleRegisterBtn')
        ?.addEventListener('click', handleGoogleSignIn);
    document.getElementById('loginSubmitBtn')
        ?.addEventListener('click', handleEmailLogin);
    document.getElementById('registerSubmitBtn')
        ?.addEventListener('click', handleEmailRegister);
    document.getElementById('guestBtn')
        ?.addEventListener('click', handleGuestLogin);
    document.getElementById('forgotPwBtn')
        ?.addEventListener('click', (e) => {
            e.preventDefault();
            handleForgotPassword();
        });
}

function hideLoader() {
    setTimeout(() => {
        document.getElementById('loaderScreen')?.classList.add('hide');
    }, 800);
}

// ══════════════════════════════════════════
// INIT
// ══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    initFirebase();
    checkExistingSession();
    setupEventListeners();
    setupKeyboardSubmit();
    setupRealtimeValidation();
    hideLoader();

    console.log('%c💰 AitoolCor MoneyWise',
        'color:#6366F1;font-size:18px;font-weight:bold;');
    console.log('%chttps://moneywise.aitoolcor.com',
        'color:#94A3B8;font-size:11px;');
});