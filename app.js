// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is already logged in
    const currentUser = getCurrentUser();
    if (currentUser) {
        showDashboard();
    } else {
        showLoginPage();
    }

    // Event listeners
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registerForm').addEventListener('submit', handleRegister);
    document.getElementById('forgotPasswordForm').addEventListener('submit', handleForgotPassword);
    document.getElementById('resetPasswordForm').addEventListener('submit', handleResetPassword);
});

// ==================== PAGE NAVIGATION ====================

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
    });

    // Show the selected page
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.remove('hidden');
    }

    // Clear messages
    clearAllMessages();
}

function showLoginPage() {
    showPage('loginPage');
    document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
}

function goToRegister() {
    showPage('registerPage');
}

function goToLogin() {
    showPage('loginPage');
}

function goToForgotPassword() {
    showPage('forgotPasswordPage');
}

function goToResetPassword() {
    showPage('resetPasswordPage');
}

function showDashboard() {
    const currentUser = getCurrentUser();
    if (currentUser) {
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('userNameDisplay').textContent = currentUser.name;
        document.getElementById('userEmailDisplay').textContent = currentUser.email;
    }
    showPage('dashboardPage');
    document.body.style.background = 'white';
}

// ==================== AUTH FUNCTIONS ====================

function handleLogin(e) {
    e.preventDefault();
    clearAllMessages();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    // Validate input
    if (!email || !password) {
        showError('loginError', 'กรุณากรอกอีเมลและรหัสผ่าน');
        return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
        showError('loginError', 'รูปแบบอีเมลไม่ถูกต้อง');
        return;
    }

    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email);

    if (!user) {
        showError('loginError', 'ไม่พบอีเมลนี้ในระบบ');
        return;
    }

    if (!verifyPassword(password, user.password)) {
        showError('loginError', 'รหัสผ่านไม่ถูกต้อง');
        return;
    }

    // Login successful
    const userData = {
        id: user.id,
        name: user.name,
        email: user.email
    };

    if (rememberMe) {
        localStorage.setItem('currentUser', JSON.stringify(userData));
        localStorage.setItem('rememberMe', 'true');
    } else {
        sessionStorage.setItem('currentUser', JSON.stringify(userData));
    }

    showSuccess('loginSuccess', 'ล็อกอินสำเร็จ! กำลังเปลี่ยนหน้า...');
    setTimeout(() => {
        showDashboard();
    }, 1000);
}

function handleRegister(e) {
    e.preventDefault();
    clearAllMessages();

    const name = document.getElementById('registerName').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;

    // Validate input
    if (!name || !email || !password || !confirmPassword) {
        showError('registerError', 'กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
    }

    if (!isValidEmail(email)) {
        showError('registerError', 'รูปแบบอีเมลไม่ถูกต้อง');
        return;
    }

    if (password.length < 6) {
        showError('registerError', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
        return;
    }

    if (password !== confirmPassword) {
        showError('registerError', 'รหัสผ่านไม่ตรงกัน');
        return;
    }

    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    // Check if email already exists
    if (users.some(u => u.email === email)) {
        showError('registerError', 'อีเมลนี้ถูกใช้งานแล้ว');
        return;
    }

    // Create new user
    const newUser = {
        id: Date.now().toString(),
        name: name,
        email: email,
        password: hashPassword(password)
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    showSuccess('registerSuccess', 'ลงทะเบียนสำเร็จ! กำลังเปลี่ยนไปหน้าล็อกอิน...');
    
    // Clear form
    document.getElementById('registerForm').reset();

    setTimeout(() => {
        goToLogin();
        showSuccess('loginSuccess', 'ลงทะเบียนเรียบร้อย ยินดีต้อนรับ! กรุณาล็อกอิน');
    }, 1500);
}

function handleForgotPassword(e) {
    e.preventDefault();
    clearAllMessages();

    const email = document.getElementById('forgotEmail').value.trim();

    if (!email) {
        showError('forgotError', 'กรุณากรอกอีเมล');
        return;
    }

    if (!isValidEmail(email)) {
        showError('forgotError', 'รูปแบบอีเมลไม่ถูกต้อง');
        return;
    }

    // Get users from localStorage
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.email === email);

    if (!user) {
        showError('forgotError', 'ไม่พบอีเมลนี้ในระบบ');
        return;
    }

    // Create reset token
    const resetToken = {
        email: email,
        token: generateToken(),
        createdAt: new Date().getTime()
    };

    localStorage.setItem('resetToken', JSON.stringify(resetToken));

    showSuccess('forgotSuccess', 'ได้รับการยืนยัน! ระบบจะเปลี่ยนไปหน้ารีเซ็ตรหัสผ่านในไม่ช้า');
    document.getElementById('forgotPasswordForm').reset();

    setTimeout(() => {
        goToResetPassword();
    }, 2000);
}

function handleResetPassword(e) {
    e.preventDefault();
    clearAllMessages();

    const newPassword = document.getElementById('resetPassword').value;
    const confirmPassword = document.getElementById('resetConfirmPassword').value;

    if (!newPassword || !confirmPassword) {
        showError('resetError', 'กรุณากรอกรหัสผ่าน');
        return;
    }

    if (newPassword.length < 6) {
        showError('resetError', 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
        return;
    }

    if (newPassword !== confirmPassword) {
        showError('resetError', 'รหัสผ่านไม่ตรงกัน');
        return;
    }

    // Get reset token
    const resetToken = JSON.parse(localStorage.getItem('resetToken'));

    if (!resetToken) {
        showError('resetError', 'ไม่มีการร้องขอรีเซ็ตรหัสผ่าน');
        return;
    }

    // Check if token is still valid (24 hours)
    const now = new Date().getTime();
    const tokenAge = now - resetToken.createdAt;
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    if (tokenAge > maxAge) {
        showError('resetError', 'ลิงก์รีเซ็ตหมดอายุแล้ว');
        localStorage.removeItem('resetToken');
        return;
    }

    // Update user password
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const userIndex = users.findIndex(u => u.email === resetToken.email);

    if (userIndex !== -1) {
        users[userIndex].password = hashPassword(newPassword);
        localStorage.setItem('users', JSON.stringify(users));
    }

    localStorage.removeItem('resetToken');

    showSuccess('resetSuccess', 'รีเซ็ตรหัสผ่านสำเร็จ! กำลังเปลี่ยนไปหน้าล็อกอิน...');
    document.getElementById('resetPasswordForm').reset();

    setTimeout(() => {
        goToLogin();
        showSuccess('loginSuccess', 'รีเซ็ตรหัสผ่านเรียบร้อย กรุณาล็อกอิน');
    }, 2000);
}

function logout() {
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('currentUser');
    localStorage.removeItem('rememberMe');
    showLoginPage();
    document.getElementById('loginForm').reset();
}

// ==================== UTILITY FUNCTIONS ====================

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function hashPassword(password) {
    // Simple hash function (for demo purposes only)
    // In production, use bcrypt or similar
    let hash = 0;
    for (let i = 0; i < password.length; i++) {
        const char = password.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'hash_' + Math.abs(hash).toString(36);
}

function verifyPassword(password, hash) {
    return hashPassword(password) === hash;
}

function generateToken() {
    return Math.random().toString(36).substr(2) + Date.now().toString(36);
}

function getCurrentUser() {
    const currentUser = localStorage.getItem('currentUser') || sessionStorage.getItem('currentUser');
    return currentUser ? JSON.parse(currentUser) : null;
}

function showError(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.add('show');
    }
}

function showSuccess(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = message;
        element.classList.add('show');
    }
}

function clearAllMessages() {
    document.querySelectorAll('.error-message, .success-message').forEach(el => {
        el.classList.remove('show');
        el.textContent = '';
    });
}

// ==================== DEMO DATA ====================

function initializeDemoData() {
    // Create demo users if not exist
    const existingUsers = localStorage.getItem('users');
    if (!existingUsers) {
        const demoUsers = [
            {
                id: '1',
                name: 'สมชาย ใจดี',
                email: 'somchai@example.com',
                password: hashPassword('123456')
            },
            {
                id: '2',
                name: 'สมหญิง สวยใจ',
                email: 'somying@example.com',
                password: hashPassword('password123')
            }
        ];
        localStorage.setItem('users', JSON.stringify(demoUsers));
    }
}

// Initialize demo data
initializeDemoData();
