// ============================================
// EPINSTORE OFFC - AUTHENTICATION with ROLE
// ============================================

const SESSION_KEY = 'epin_session';
const SESSION_DURATION = 30 * 60 * 1000; // 30 menit

// Konfigurasi role dan password default
const ROLE_CONFIG = {
    '62882008748249': { role: 'owner', password: 'epinyaya', name: 'Epin Store Owner' },
    'super_reseller_default': { role: 'super_reseller', password: 'epinsuper', name: 'Super Reseller' },
    'reseller_default': { role: 'reseller', password: 'epinreseller', name: 'Reseller' }
};

// Fungsi login
async function login(phoneNumber, password) {
    clearError();
    
    if (!phoneNumber || !password) {
        showError('Masukkan nomor dan password!');
        return { success: false };
    }
    
    // Format nomor
    let formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (!formattedPhone.startsWith('62')) {
        formattedPhone = '62' + formattedPhone;
    }
    
    // Cek role berdasarkan nomor dan password
    let role = null;
    let name = null;
    
    // Cek owner
    if (formattedPhone === '62882008748249' && password === 'epinyaya') {
        role = 'owner';
        name = 'Epin Store Owner';
    }
    // Cek super reseller (bisa multiple nomor)
    else if (password === 'epinsuper') {
        role = 'super_reseller';
        name = 'Super Reseller';
    }
    // Cek reseller
    else if (password === 'epinreseller') {
        role = 'reseller';
        name = 'Reseller';
    }
    else {
        showError('Password salah!');
        return { success: false };
    }
    
    // Buat session
    const session = {
        phoneNumber: formattedPhone,
        role: role,
        name: name,
        loginTime: new Date().toISOString(),
        expires: new Date(Date.now() + SESSION_DURATION).toISOString()
    };
    
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    
    // Redirect sesuai role
    if (role === 'owner') {
        window.location.href = 'owner.html';
    } else if (role === 'super_reseller') {
        window.location.href = 'superreseller.html';
    } else {
        window.location.href = 'reseller.html';
    }
    
    return { success: true, role: role };
}

// Fungsi logout
function logout() {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = 'index.html';
}

// Fungsi cek session
function getCurrentSession() {
    const session = localStorage.getItem(SESSION_KEY);
    if (!session) return null;
    
    try {
        const parsed = JSON.parse(session);
        if (new Date(parsed.expires) > new Date()) {
            return parsed;
        }
        localStorage.removeItem(SESSION_KEY);
        return null;
    } catch (e) {
        return null;
    }
}

// Fungsi cek akses halaman
function checkPageAccess(requiredRole) {
    const session = getCurrentSession();
    if (!session) {
        window.location.href = 'index.html';
        return false;
    }
    
    const roleLevel = {
        'reseller': 1,
        'super_reseller': 2,
        'owner': 3
    };
    
    const requiredLevel = roleLevel[requiredRole];
    const userLevel = roleLevel[session.role];
    
    if (userLevel < requiredLevel) {
        // Redirect ke dashboard sesuai role
        if (session.role === 'owner') {
            window.location.href = 'owner.html';
        } else if (session.role === 'super_reseller') {
            window.location.href = 'superreseller.html';
        } else {
            window.location.href = 'reseller.html';
        }
        return false;
    }
    
    // Reset timer
    resetAutoLogout();
    
    // Tampilkan info user
    displayUserInfo(session);
    
    return true;
}

// Tampilkan info user di navbar
function displayUserInfo(session) {
    const roleNames = {
        owner: '👑 OWNER',
        super_reseller: '⭐ SUPER RESELLER',
        reseller: '🛡️ RESELLER'
    };
    
    const userInfoElements = document.querySelectorAll('.user-info');
    userInfoElements.forEach(el => {
        if (el) {
            el.innerHTML = `
                <span class="badge ${session.role}">
                    <i class="fas ${session.role === 'owner' ? 'fa-crown' : (session.role === 'super_reseller' ? 'fa-star' : 'fa-store')}"></i>
                    ${roleNames[session.role] || session.role.toUpperCase()}
                </span>
                <span class="user-phone" style="font-size:12px; color:#ff6600;">${session.phoneNumber}</span>
                <button class="btn-logout" onclick="logout()">
                    <i class="fas fa-sign-out-alt"></i> Logout
                </button>
            `;
        }
    });
}

// Tampilkan error message
function showError(message) {
    let errorDiv = document.getElementById('errorMsg');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'errorMsg';
        errorDiv.className = 'error-msg';
        const loginCard = document.querySelector('.login-card');
        if (loginCard) {
            loginCard.appendChild(errorDiv);
        }
    }
    errorDiv.innerHTML = `<i class="fas fa-exclamation-triangle"></i> ${message}`;
    errorDiv.style.display = 'block';
    
    setTimeout(() => {
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }, 3000);
}

function clearError() {
    const errorDiv = document.getElementById('errorMsg');
    if (errorDiv) {
        errorDiv.style.display = 'none';
        errorDiv.innerHTML = '';
    }
}

// Auto logout timer
let logoutTimer;
function startAutoLogout() {
    if (logoutTimer) clearTimeout(logoutTimer);
    logoutTimer = setTimeout(() => {
        localStorage.removeItem(SESSION_KEY);
        window.location.href = 'index.html';
    }, 30 * 60 * 1000);
}

function resetAutoLogout() {
    if (logoutTimer) clearTimeout(logoutTimer);
    startAutoLogout();
}

// Event listener untuk reset timer
if (typeof document !== 'undefined') {
    document.addEventListener('mousemove', resetAutoLogout);
    document.addEventListener('keypress', resetAutoLogout);
    document.addEventListener('click', resetAutoLogout);
    document.addEventListener('scroll', resetAutoLogout);
}

// Cek session saat halaman login
function checkAlreadyLoggedIn() {
    const session = getCurrentSession();
    if (session) {
        if (session.role === 'owner') {
            window.location.href = 'owner.html';
        } else if (session.role === 'super_reseller') {
            window.location.href = 'superreseller.html';
        } else if (session.role === 'reseller') {
            window.location.href = 'reseller.html';
        }
        return true;
    }
    return false;
}

// Event listener untuk form login
document.addEventListener('DOMContentLoaded', () => {
    checkAlreadyLoggedIn();
    
    const loginBtn = document.getElementById('loginBtn');
    const phoneInput = document.getElementById('phoneInput');
    const passwordInput = document.getElementById('passwordInput');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const phone = phoneInput?.value || '';
            const password = passwordInput?.value || '';
            await login(phone, password);
        });
    }
    
    if (passwordInput) {
        passwordInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                const phone = phoneInput?.value || '';
                const password = passwordInput?.value || '';
                await login(phone, password);
            }
        });
    }
});

// Export functions
window.login = login;
window.logout = logout;
window.checkPageAccess = checkPageAccess;