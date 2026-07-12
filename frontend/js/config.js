// 
//  EduConnect  API Configuration
//  Auto-detects localhost vs production
// 

const API_CONFIG = {
    BACKEND_URL: (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? ''   // relative paths work on localhost (same server)
        : 'https://educonnect-backend-rxq6.onrender.com'
};

window.API_BASE = API_CONFIG.BACKEND_URL;

//  Intercept ALL fetch calls and prepend backend URL for /api/ paths 
const _originalFetch = window.fetch;
window.fetch = function(url, options) {
    if (typeof url === 'string' && url.startsWith('/') && window.API_BASE) {
        url = window.API_BASE + url;
    }
    return _originalFetch.call(this, url, options);
};

//  Open a meeting room on the SAME origin the user is currently on 
//  ------------------------------------------------------------------
//  The backend builds a full meeting URL using its configured FRONTEND_URL
//  domain and stores/sends it. If that domain differs from where the user is
//  logged in, the meeting page has NO auth token (localStorage is per-origin)
//  and every meeting API returns 401 -> the room falsely shows "Meeting Ended".
//
//  This helper extracts the room code + title from ANY meeting link (full URL
//  or relative path) and re-opens the meeting on window.location.origin, so the
//  user's auth token is always available. Use this EVERYWHERE a meeting link is
//  opened (student, teacher, HOD, principal — every meeting type).
window.openMeetingOnCurrentOrigin = function(rawLink) {
    if (!rawLink) return;
    let room = '', title = '';
    try {
        const u = new URL(rawLink, window.location.origin);
        room = u.searchParams.get('room') || '';
        title = u.searchParams.get('title') || '';
    } catch (_) {
        const m = /[?&]room=([^&]+)/.exec(rawLink);
        if (m) room = decodeURIComponent(m[1]);
        const t = /[?&]title=([^&]+)/.exec(rawLink);
        if (t) title = decodeURIComponent(t[1]);
    }
    if (!room) { window.open(rawLink, '_blank'); return; } // last resort
    const url = `${window.location.origin}/meeting-room.html?room=${encodeURIComponent(room)}`
        + (title ? `&title=${encodeURIComponent(title)}` : '');
    window.open(url, '_blank');
};

//  Delegated click handler for meeting links 
//  ------------------------------------------------------------------
//  Inline onclick="openMeetingOnCurrentOrigin('<url>')" breaks when the meeting
//  link contains an apostrophe (e.g. a class titled "OOP's using java"), because
//  the ' terminates the JS string early. To avoid ALL quote-escaping problems,
//  render meeting links as:  <a class="js-open-meeting" data-mlink="<url>">
//  The URL lives in a double-quoted HTML attribute (apostrophes are safe there,
//  and encodeURIComponent never produces a double quote), and this one listener
//  opens it on the current origin. Works for links added dynamically too.
document.addEventListener('click', function(e) {
    const el = e.target.closest ? e.target.closest('.js-open-meeting') : null;
    if (el) {
        e.preventDefault();
        window.openMeetingOnCurrentOrigin(el.getAttribute('data-mlink'));
    }
});
