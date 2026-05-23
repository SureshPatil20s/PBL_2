// Main JavaScript file for Meal Planner App

// Display error message
function showError(message, elementId = 'errorMessage') {
    const errorEl = document.getElementById(elementId);
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 5000);
    }
}

// Display success message
function showSuccess(message, elementId = 'successMessage') {
    const successEl = document.getElementById(elementId);
    if (successEl) {
        successEl.textContent = message;
        successEl.style.display = 'block';
        setTimeout(() => {
            successEl.style.display = 'none';
        }, 5000);
    }
}

function getCookie(name) {
    const cookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${name}=`));
    return cookie ? decodeURIComponent(cookie.substring(name.length + 1)) : null;
}

// Make API request
async function apiRequest(url, method = 'GET', data = null) {
    const normalizedMethod = method.toUpperCase();
    const options = {
        method: normalizedMethod,
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (!['GET', 'HEAD', 'OPTIONS'].includes(normalizedMethod)) {
        const csrfToken = getCookie('csrf_access_token');
        if (csrfToken) {
            options.headers['X-CSRF-TOKEN'] = csrfToken;
        }
    }

    if (data) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);
        const responseData = await response.json();
        
        return {
            ok: response.ok,
            status: response.status,
            data: responseData
        };
    } catch (error) {
        console.error('API Error:', error);
        return {
            ok: false,
            status: 0,
            data: { message: 'Network error occurred' }
        };
    }
}

// Format timestamp
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get current user info
async function getCurrentUser() {
    const response = await apiRequest('/api/user');
    if (response.ok) {
        return response.data.user;
    }
    return null;
}

// Show loading spinner
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div class="spinner">Loading...</div>';
    }
}

// Initialize tooltips or other general UI enhancements
document.addEventListener('DOMContentLoaded', function() {
    console.log('Meal Planner App Loaded');

    // Add smooth scroll behavior for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});

// Prevent multiple form submissions
let isSubmitting = false;

function preventMultipleSubmits() {
    return !isSubmitting;
}

function setSubmitting(value) {
    isSubmitting = value;
}
