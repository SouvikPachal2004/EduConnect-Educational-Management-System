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

//  Authenticated file download 
//  ------------------------------------------------------------------
//  All /api file endpoints are auth-protected. A plain <a href="/api/..."> click
//  does NOT send the Authorization header, so the backend returns 401 and the
//  browser shows "File wasn't available on site". This helper fetches the file
//  WITH the JWT header, then downloads the resulting blob. Use it everywhere a
//  protected file (assignment attachment, submission answer) is downloaded.
window.authedDownload = async function(apiPath, filename) {
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(apiPath, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) {
            alert('Unable to download this file. It may no longer be available on the server (files can be cleared when the server restarts). Please ask for it to be re-uploaded.');
            return;
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (err) {
        alert('Download failed. Please check your connection and try again.');
    }
};

//  Delegated handler: any element with class "js-download-file" downloads
//  data-url (the /api path) as data-fname. Avoids quote-escaping issues in
//  inline onclick when filenames contain special characters.
document.addEventListener('click', function(e) {
    const el = e.target.closest ? e.target.closest('.js-download-file') : null;
    if (el) {
        e.preventDefault();
        window.authedDownload(el.getAttribute('data-url'), el.getAttribute('data-fname'));
    }
});
