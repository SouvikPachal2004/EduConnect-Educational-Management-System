// ═══════════════════════════════════════════════════
//  EduConnect — API Configuration
//  Auto-detects localhost vs production
// ═══════════════════════════════════════════════════

const API_CONFIG = {
    BACKEND_URL: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? ''   // relative paths work on localhost (same server)
        : 'https://educonnect-backend-rxq6.onrender.com'
};

window.API_BASE = API_CONFIG.BACKEND_URL;

// ── Intercept ALL fetch calls and prepend backend URL for /api/ paths ──
const _originalFetch = window.fetch;
window.fetch = function(url, options) {
    if (typeof url === 'string' && url.startsWith('/') && window.API_BASE) {
        url = window.API_BASE + url;
    }
    return _originalFetch.call(this, url, options);
};
