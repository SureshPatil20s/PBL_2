// Authentication related JavaScript

// Handle Login
async function handleLogin() {
    if (!preventMultipleSubmits()) return;

    const form = document.getElementById('loginForm');
    if (!form) return;

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    // Validation
    if (!username || !password) {
        showError('Please fill in all fields', 'errorMessage');
        return;
    }

    setSubmitting(true);

    try {
        const response = await apiRequest('/login', 'POST', {
            username: username,
            password: password
        });

        if (response.ok) {
            showSuccess('Login successful! Redirecting...', 'successMessage');
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } else {
            showError(response.data.message || 'Login failed', 'errorMessage');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('An error occurred during login', 'errorMessage');
    } finally {
        setSubmitting(false);
    }
}

// Handle Registration
async function handleRegister() {
    if (!preventMultipleSubmits()) return;

    const form = document.getElementById('registerForm');
    if (!form) return;

    const username = document.getElementById('username').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const confirmPassword = document.getElementById('confirmPassword').value.trim();
    const terms = document.getElementById('terms').checked;

    // Validation
    if (!username || !email || !password || !confirmPassword) {
        showError('Please fill in all fields', 'errorMessage');
        return;
    }

    if (!terms) {
        showError('You must agree to the Terms and Conditions', 'errorMessage');
        return;
    }

    if (username.length < 3) {
        showError('Username must be at least 3 characters', 'errorMessage');
        return;
    }

    if (password.length < 6) {
        showError('Password must be at least 6 characters', 'errorMessage');
        return;
    }

    if (password !== confirmPassword) {
        showError('Passwords do not match', 'errorMessage');
        return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showError('Please enter a valid email address', 'errorMessage');
        return;
    }

    setSubmitting(true);

    try {
        const response = await apiRequest('/register', 'POST', {
            username: username,
            email: email,
            password: password,
            confirm_password: confirmPassword
        });

        if (response.ok) {
            showSuccess('Registration successful! Redirecting...', 'successMessage');
            setTimeout(() => {
                window.location.href = '/';
            }, 1500);
        } else {
            showError(response.data.message || 'Registration failed', 'errorMessage');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('An error occurred during registration', 'errorMessage');
    } finally {
        setSubmitting(false);
    }
}

// Real-time password matching validation
document.addEventListener('DOMContentLoaded', function() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');

    if (passwordInput && confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            if (passwordInput.value && confirmPasswordInput.value) {
                if (passwordInput.value !== confirmPasswordInput.value) {
                    confirmPasswordInput.style.borderColor = '#E74C3C';
                } else {
                    confirmPasswordInput.style.borderColor = '#27AE60';
                }
            }
        });
    }

    // Username validation (alphanumeric and underscore only)
    const usernameInput = document.getElementById('username');
    if (usernameInput) {
        usernameInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^a-zA-Z0-9_]/g, '');
        });
    }
});

// Show/Hide password toggle
function togglePasswordVisibility(inputId) {
    const input = document.getElementById(inputId);
    if (input) {
        if (input.type === 'password') {
            input.type = 'text';
        } else {
            input.type = 'password';
        }
    }
}
