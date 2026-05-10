// Konfigurasi Firebase EpinStoreOffc
const FIREBASE_URL = 'https://epin-3b848-default-rtdb.asia-southeast1.firebasedatabase.app/';

// Database References
const DB_ACTIVE = `${FIREBASE_URL}epin_active_numbers.json`;
const DB_BLOCKED = `${FIREBASE_URL}epin_blocked_numbers.json`;
const DB_CHAT = `${FIREBASE_URL}epin_chat_messages.json`;
const DB_ACTIVITY = `${FIREBASE_URL}epin_activity_log.json`;

// ========== SISTEM ROLE ==========
const DB_USERS = `${FIREBASE_URL}epin_users.json`;

// Role level
const ROLE_LEVEL = {
    'reseller': 1,
    'super_reseller': 2,
    'owner': 3
};

// Default user
const DEFAULT_USERS = {
    '62882008748249': {
        role: 'owner',
        password: 'epinyaya',
        name: 'Epin Store Owner',
        createdAt: new Date().toISOString()
    }
};

// Fungsi fetch
async function fetchFromFirebase(url, options = {}) {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json', ...options.headers }
        });
        clearTimeout(timeoutId);
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Fetch error:', error);
        return null;
    }
}

async function saveToFirebase(url, data, method = 'PUT') {
    try {
        const response = await fetch(url, {
            method: method,
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' }
        });
        return await response.json();
    } catch (error) {
        console.error('Save error:', error);
        return null;
    }
}

// Format waktu
function getEpinTime() {
    const now = new Date();
    const date = now.toLocaleDateString('id-ID', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        timeZone: 'Asia/Jakarta'
    });
    const time = now.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' });
    return { date, time, full: `${date} - ${time}`, timestamp: now.toISOString() };
}

// Ambil data user
async function getEpinUsers() {
    const users = await fetchFromFirebase(DB_USERS);
    if (!users || Object.keys(users).length === 0) {
        await saveToFirebase(DB_USERS, DEFAULT_USERS);
        return DEFAULT_USERS;
    }
    return users;
}

// Cek role
async function getUserRole(phoneNumber) {
    const users = await getEpinUsers();
    return users[phoneNumber]?.role || null;
}

// Cek password
async function checkEpinPassword(phoneNumber, password) {
    const users = await getEpinUsers();
    const user = users[phoneNumber];
    if (!user) return false;
    return user.password === password;
}

// Update user (owner & super reseller)
async function updateEpinUser(phoneNumber, data, requesterPhone) {
    const users = await getEpinUsers();
    const requester = users[requesterPhone];
    
    if (!requester) return { success: false, message: 'Unauthorized' };
    
    if (requester.role === 'owner') {
        users[phoneNumber] = { ...users[phoneNumber], ...data };
        await saveToFirebase(DB_USERS, users);
        return { success: true, message: 'User updated' };
    }
    
    if (requester.role === 'super_reseller') {
        if (data.role === 'owner' || data.role === 'super_reseller') {
            return { success: false, message: 'Tidak bisa membuat role diatas super reseller' };
        }
        users[phoneNumber] = { ...users[phoneNumber], ...data };
        await saveToFirebase(DB_USERS, users);
        return { success: true, message: 'User updated' };
    }
    
    return { success: false, message: 'Tidak punya akses' };
}

// Login dengan role
async function loginWithRole(phoneNumber, password) {
    const isValid = await checkEpinPassword(phoneNumber, password);
    if (!isValid) return { success: false, message: 'Password salah' };
    
    const users = await getEpinUsers();
    const user = users[phoneNumber];
    
    if (!user) return { success: false, message: 'User tidak ditemukan' };
    
    const blocked = await fetchFromFirebase(DB_BLOCKED) || [];
    if (blocked.includes(phoneNumber)) {
        return { success: false, message: 'Akun diblokir' };
    }
    
    return {
        success: true,
        role: user.role,
        name: user.name || phoneNumber,
        dashboard: getDashboardUrl(user.role)
    };
}

function getDashboardUrl(role) {
    switch(role) {
        case 'owner': return 'owner.html';
        case 'super_reseller': return 'superreseller.html';
        default: return 'reseller.html';
    }
}

// Log aktivitas
async function logEpinActivity(action, role, details) {
    const { date, time, timestamp } = getEpinTime();
    const existing = await fetchFromFirebase(DB_ACTIVITY) || [];
    existing.unshift({ action, role, details, date, time, timestamp });
    if (existing.length > 200) existing.pop();
    await saveToFirebase(DB_ACTIVITY, existing);
}

// Auto logout
let logoutTimer;
function startAutoLogout() {
    if (logoutTimer) clearTimeout(logoutTimer);
    logoutTimer = setTimeout(() => {
        localStorage.removeItem('epin_session');
        window.location.href = 'index.html';
    }, 30 * 60 * 1000);
}

function resetAutoLogout() {
    if (logoutTimer) clearTimeout(logoutTimer);
    startAutoLogout();
}

if (typeof document !== 'undefined') {
    document.addEventListener('mousemove', resetAutoLogout);
    document.addEventListener('keypress', resetAutoLogout);
    document.addEventListener('click', resetAutoLogout);
}