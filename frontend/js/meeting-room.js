// EduConnect Meet — Complete Meeting Room Logic
// Uses meet.jit.si iframe for video, backend for approval/chat/participants

const MR = {
    localStream: null,
    micOn: true,
    camOn: true,
    handRaised: false,
    roomCode: null,
    meetingTitle: 'Class Meeting',
    user: {},
    hostId: null,
    joinStatus: 'pending',
    pendingRequestsCount: 0,
    chatPollTimer: null,
    participantsPollTimer: null,
    heartbeatTimer: null,
    approvalPollTimer: null,
    lastChatCount: 0,
    unreadChat: 0,
    panelOpen: false,
    activePanel: 'chat',
    joined: false,
};

let _controlsWired = false;
let jitsiFrame = null;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function qs(id) { return document.getElementById(id); }
function getParam(name) { return new URLSearchParams(window.location.search).get(name); }
function getToken() { return localStorage.getItem('authToken'); }

function initials(name) {
    if (!name) return 'U';
    const p = name.trim().split(/\s+/);
    return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase();
}

function toast(msg) {
    const t = qs('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}

async function fetchCurrentUser() {
    try {
        const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();
        if (data.success && data.data) {
            const u = data.data;
            u.id = u._id || u.id;
            return u;
        }
    } catch (_) {}
    try {
        const local = JSON.parse(localStorage.getItem('currentUser') || '{}');
        local.id = local._id || local.id;
        return local;
    } catch (_) { return {}; }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    // The meeting requires a logged-in user (all meeting APIs are auth-protected).
    // If the visitor has no token (e.g. they opened the shared link without
    // logging in), send them to login first and bring them right back here.
    if (!getToken()) {
        localStorage.setItem('postLoginRedirect', window.location.href);
        window.location.href = 'login.html';
        return;
    }

    MR.user = await fetchCurrentUser();

    // Always prefer the logged-in user's real name. The URL 'name' param is only
    // a last-resort fallback for a truly unknown guest.
    if (!MR.user.name?.trim()) {
        const urlName = getParam('name');
        if (urlName) MR.user.name = decodeURIComponent(urlName);
    }
    MR.roomCode = getParam('room') || generateRoomCode();
    MR.meetingTitle = decodeURIComponent(getParam('title') || 'Class Meeting');

    qs('lobbyMeetingTitle').textContent = MR.meetingTitle;
    qs('lobbyMeetingMeta').textContent = `Room code: ${MR.roomCode}`;
    qs('lobbyNameInput').value = MR.user.name || '';
    qs('lobbyAvatar').textContent = initials(MR.user.name || 'You');

    await startLobbyPreview();
    wireLobby();
});

function generateRoomCode() {
    const c = 'abcdefghijklmnopqrstuvwxyz';
    const s = n => Array.from({length:n}, () => c[Math.floor(Math.random()*c.length)]).join('');
    return `${s(3)}-${s(4)}-${s(3)}`;
}

// ─── Lobby Preview ────────────────────────────────────────────────────────────
async function startLobbyPreview() {
    try {
        MR.localStream = await navigator.mediaDevices.getUserMedia({ video:true, audio:true });
        qs('lobbyVideo').srcObject = MR.localStream;
        qs('lobbyCamOff').style.display = 'none';
    } catch (err) {
        MR.camOn = false; MR.micOn = false;
        qs('lobbyCamOff').style.display = 'flex';
        updateLobbyButtons();
        toast('Camera/mic not available — you can still join');
    }
}

function wireLobby() {
    qs('lobbyMicBtn').addEventListener('click', () => {
        MR.micOn = !MR.micOn;
        if (MR.localStream) MR.localStream.getAudioTracks().forEach(t => t.enabled = MR.micOn);
        updateLobbyButtons();
    });
    qs('lobbyCamBtn').addEventListener('click', () => {
        MR.camOn = !MR.camOn;
        if (MR.localStream) MR.localStream.getVideoTracks().forEach(t => t.enabled = MR.camOn);
        qs('lobbyCamOff').style.display = MR.camOn ? 'none' : 'flex';
        updateLobbyButtons();
    });
    qs('joinNowBtn').addEventListener('click', joinMeeting);
    qs('lobbyNameInput').addEventListener('keydown', e => { if (e.key === 'Enter') joinMeeting(); });
    qs('lobbyNameInput').addEventListener('input', e => {
        qs('lobbyAvatar').textContent = initials(e.target.value || 'You');
    });
}

function updateLobbyButtons() {
    const m = qs('lobbyMicBtn'), v = qs('lobbyCamBtn');
    m.className = 'ctrl-btn' + (MR.micOn ? '' : ' off');
    m.innerHTML = `<i class="fas fa-microphone${MR.micOn ? '' : '-slash'}"></i>`;
    v.className = 'ctrl-btn' + (MR.camOn ? '' : ' off');
    v.innerHTML = `<i class="fas fa-video${MR.camOn ? '' : '-slash'}"></i>`;
}

// ─── Join Meeting ─────────────────────────────────────────────────────────────
async function joinMeeting() {
    const name = qs('lobbyNameInput').value.trim() || MR.user.name || 'Guest';
    MR.user.name = name;

    // 1. Check meeting is active
    try {
        const r = await fetch(`/api/meetings/${MR.roomCode}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });

        // Session expired / not authorized — send to login instead of a
        // misleading "Meeting Ended" screen.
        if (r.status === 401 || r.status === 403) {
            localStorage.setItem('postLoginRedirect', window.location.href);
            toast('Please log in to join the meeting.');
            setTimeout(() => { window.location.href = 'login.html'; }, 1200);
            return;
        }

        const d = await r.json();

        // Only treat as ended when the server DEFINITIVELY says it is inactive.
        if (d.success && d.data && d.data.isActive === false) {
            showEndedScreen('This meeting has ended.');
            return;
        }
        if (d.success && d.data) {
            MR.hostId = d.data.hostId ? String(d.data.hostId) : null;
        }
        // If the meeting record isn't found yet (d.success false / 404), we still
        // proceed to the join call below — the backend will validate and respond.
    } catch (err) {
        toast('Cannot reach server. Please check your connection and try again.');
        return;
    }

    // 2. POST /join
    try {
        const r = await fetch(`/api/meetings/${MR.roomCode}/join`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, micOn: MR.micOn, camOn: MR.camOn })
        });
        const d = await r.json();
        if (!d.success) { toast(d.message || 'Failed to join'); return; }

        MR.joinStatus = d.data.status || 'accepted';
        MR.user.id = MR.user.id || d.data.userId || MR.user._id;
        if (d.data.userId) MR.user.id = String(d.data.userId);

        if (MR.joinStatus === 'pending') {
            qs('lobby').style.display = 'none';
            showWaitingScreen();
            startApprovalPolling();
            return;
        }
        if (MR.joinStatus === 'rejected') {
            toast('Your join request was declined.');
            return;
        }
    } catch (err) {
        toast('Failed to join. Please try again.');
        return;
    }

    enterMeetingRoom();
}

function showEndedScreen(msg) {
    qs('lobby').style.display = 'none';
    const c = qs('leftScreen').querySelector('.left-card');
    if (c) c.innerHTML = `
        <i class="fas fa-times-circle" style="font-size:3.5rem;color:#ef4444;margin-bottom:1.5rem;"></i>
        <h2>Meeting Ended</h2>
        <p style="color:#94a3b8;margin-bottom:2rem;">${msg}</p>
        <div class="left-actions">
            <button class="left-btn primary" onclick="goHome()"><i class="fas fa-home"></i> Return to Dashboard</button>
        </div>`;
    qs('leftScreen').style.display = 'flex';
}

function showWaitingScreen() {
    const c = qs('leftScreen').querySelector('.left-card');
    if (c) c.innerHTML = `
        <i class="fas fa-hourglass-half fa-spin" style="font-size:3.5rem;color:#3b82f6;margin-bottom:1.5rem;"></i>
        <h2>Waiting for Approval</h2>
        <p style="color:#94a3b8;margin-bottom:2rem;">${MR.meetingTitle}</p>
        <p style="color:#64748b;font-size:0.9rem;margin-bottom:2rem;">Your request has been sent to the host. Please wait...</p>
        <div class="left-actions">
            <button class="left-btn secondary" onclick="cancelJoinRequest()"><i class="fas fa-times"></i> Cancel</button>
        </div>`;
    qs('leftScreen').style.display = 'flex';
}

// ─── Approval Polling ─────────────────────────────────────────────────────────
function startApprovalPolling() {
    MR.approvalPollTimer = setInterval(async () => {
        try {
            // KEEP-ALIVE (critical): refresh our lastSeen every tick so the backend
            // keeps us "active" while we wait. The backend drops any participant
            // whose lastSeen is older than 30s from BOTH the host's pending list
            // (host could no longer approve us) AND the accepted list (we'd never
            // detect approval). The poll runs every 3s, well within the 30s window.
            fetch(`/api/meetings/${MR.roomCode}/presence`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ micOn: MR.micOn, camOn: MR.camOn })
            }).catch(() => {});

            const r = await fetch(`/api/meetings/${MR.roomCode}/participants`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const d = await r.json();
            if (!d.success) return;

            // Approved? → auto-enter the meeting (no page reload needed)
            const myId = String(MR.user.id || '');
            const accepted = (d.data.participants || []).find(p =>
                p.userId && String(p.userId) === myId && p.status === 'accepted'
            );
            if (accepted) {
                clearInterval(MR.approvalPollTimer);
                MR.joinStatus = 'accepted';
                qs('leftScreen').style.display = 'none';
                toast('Approved! Joining meeting…');
                // Brief delay so the host's Jitsi iframe can refresh for a clean
                // peer connection, then we enter automatically.
                setTimeout(() => { enterMeetingRoom(); }, 1500);
                return;
            }

            // Meeting ended while waiting?
            const meetRes = await fetch(`/api/meetings/${MR.roomCode}`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const meetD = await meetRes.json();
            if (meetD.success && meetD.data && meetD.data.isActive === false) {
                clearInterval(MR.approvalPollTimer);
                showEndedScreen('The meeting has ended.');
            }
        } catch (_) {}
    }, 3000);
}

function cancelJoinRequest() {
    clearInterval(MR.approvalPollTimer);
    goHome();
}

// ─── Enter Meeting Room ───────────────────────────────────────────────────────
function enterMeetingRoom() {
    MR.joined = true;

    // Stop local lobby preview
    if (MR.localStream) {
        MR.localStream.getTracks().forEach(t => t.stop());
        MR.localStream = null;
    }

    qs('lobby').style.display = 'none';
    qs('meetingRoom').style.display = 'flex';

    qs('meetTitle').textContent = MR.meetingTitle;
    qs('roomCodeText').textContent = MR.roomCode;
    qs('leftMeetingName').textContent = MR.meetingTitle;

    loadJitsiMeet();
    startClock();
    wireMeetingControls();
    registerPresence();
    startPolling();
}

// ─── Jitsi iframe ─────────────────────────────────────────────────────────────
function loadJitsiMeet() {
    const container = qs('videoGrid');
    container.innerHTML = '';

    // Clean room name — alphanumeric only for Jitsi
    const roomName = 'EduConnect' + MR.roomCode.replace(/-/g, '');
    const displayName = encodeURIComponent(MR.user.name || 'User');

    // Add timestamp to force Jitsi to establish fresh connections
    const timestamp = Date.now();

    // Build Jitsi URL with hash config (bypasses pre-join, no external_api.js needed)
    const src = `https://meet.jit.si/${roomName}` +
        `#userInfo.displayName="${MR.user.name || 'User'}"` +
        `&config.prejoinPageEnabled=false` +
        `&config.startWithAudioMuted=${!MR.micOn}` +
        `&config.startWithVideoMuted=${!MR.camOn}` +
        `&config.disableDeepLinking=true` +
        `&config.enableWelcomePage=false` +
        `&config.disableInviteFunctions=true` +
        `&config.enableNoAudioDetection=false` +
        `&config.enableNoisyMicDetection=false` +
        `&config.toolbarButtons=["microphone","camera","desktop","fullscreen","hangup","raisehand","tileview"]` +
        `&interfaceConfig.SHOW_JITSI_WATERMARK=false` +
        `&interfaceConfig.MOBILE_APP_PROMO=false` +
        `&_t=${timestamp}`; // Cache buster to force fresh connection

    jitsiFrame = document.createElement('iframe');
    jitsiFrame.src = src;
    jitsiFrame.allow = 'camera *; microphone *; fullscreen *; display-capture *; autoplay *';
    jitsiFrame.style.cssText = 'width:100%;height:100%;border:none;border-radius:12px;position:absolute;top:0;left:0;';
    jitsiFrame.setAttribute('allowfullscreen', '');
    jitsiFrame.id = 'jitsiMeetFrame';
    container.appendChild(jitsiFrame);

    // Add load event listener to show when iframe is ready
    jitsiFrame.addEventListener('load', () => {
        console.log('[Jitsi] Iframe loaded successfully');
        toast('Connected to video room');
        
        // After 2 seconds, trigger a participant refresh to ensure connections
        setTimeout(() => {
            if (MR.joined) {
                console.log('[Jitsi] Triggering participant sync');
                updatePresence(); // Ping backend to confirm presence
            }
        }, 2000);
    });

    // FIRST-JOIN FIX: When a non-host participant (student) enters via the in-page
    // lobby→meeting transition, the freshly-created Jitsi iframe sometimes stays
    // blank until a manual rejoin. To fix this WITHOUT the user rejoining, we
    // automatically refresh the iframe src once, shortly after entering — this
    // reliably makes the Jitsi video load on the first join. Hosts don't need
    // this (they already refresh their iframe when approving a participant).
    const isHostUser = (MR.hostId && MR.user.id && String(MR.user.id) === String(MR.hostId))
        || ['teacher', 'hod', 'managing_authority', 'admin'].includes(MR.user.role);
    if (!isHostUser && !MR._studentJitsiReloaded) {
        MR._studentJitsiReloaded = true;
        setTimeout(() => {
            if (jitsiFrame && MR.joined) {
                const base = jitsiFrame.src.split('&_t=')[0];
                jitsiFrame.src = base + '&_t=' + Date.now();
                console.log('[Jitsi] Student first-join auto-refresh to load video');
            }
        }, 3000);
    }

    toast('Joining video conference...');
}

// ─── Controls ─────────────────────────────────────────────────────────────────
function wireMeetingControls() {
    if (_controlsWired) return;
    _controlsWired = true;

    qs('micBtn').addEventListener('click', () => {
        MR.micOn = !MR.micOn;
        updateControlButtons();
        updatePresence();
        toast(MR.micOn ? 'Mic on' : 'Mic off — use Jitsi toolbar to mute/unmute');
    });
    qs('camBtn').addEventListener('click', () => {
        MR.camOn = !MR.camOn;
        updateControlButtons();
        updatePresence();
        toast(MR.camOn ? 'Camera on' : 'Camera off — use Jitsi toolbar');
    });
    qs('screenBtn').addEventListener('click', () => {
        toast('Use the screen share button inside the video window');
    });
    qs('handBtn').addEventListener('click', () => {
        MR.handRaised = !MR.handRaised;
        updateControlButtons();
        updatePresence();
        toast(MR.handRaised ? 'Hand raised' : 'Hand lowered');
    });
    qs('leaveBtn').addEventListener('click', leaveMeeting);
    qs('chatBtn').addEventListener('click', () => togglePanel('chat'));
    qs('participantsBtn').addEventListener('click', () => togglePanel('participants'));
    qs('closePanelBtn').addEventListener('click', closePanel);
    qs('chatSendBtn').addEventListener('click', sendChat);
    qs('chatInput').addEventListener('keydown', e => { if (e.key === 'Enter') sendChat(); });
    qs('copyLinkBtn').addEventListener('click', copyMeetingLink);
    qs('rejoinBtn').addEventListener('click', () => window.location.reload());
    qs('homeBtn').addEventListener('click', goHome);

    // End button — visible only to host/teacher/hod
    const endBtn = qs('endMeetingBtn');
    if (endBtn) {
        const isHost = (MR.hostId && MR.user.id && String(MR.user.id) === String(MR.hostId))
            || ['teacher','hod','managing_authority','admin'].includes(MR.user.role);
        if (isHost) {
            endBtn.style.display = 'flex';
            endBtn.addEventListener('click', endMeetingForAll);
        }
    }
}

function updateControlButtons() {
    const m = qs('micBtn');
    m.className = 'ctrl-btn' + (MR.micOn ? '' : ' off');
    m.innerHTML = `<i class="fas fa-microphone${MR.micOn ? '' : '-slash'}"></i>`;

    const v = qs('camBtn');
    v.className = 'ctrl-btn' + (MR.camOn ? '' : ' off');
    v.innerHTML = `<i class="fas fa-video${MR.camOn ? '' : '-slash'}"></i>`;

    qs('handBtn').className = 'ctrl-btn' + (MR.handRaised ? ' active-toggle' : '');
}

// ─── Clock ────────────────────────────────────────────────────────────────────
function startClock() {
    const update = () => {
        const n = new Date();
        qs('meetClock').textContent = n.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
    };
    update();
    setInterval(update, 30000);
}

// ─── Panel ────────────────────────────────────────────────────────────────────
function togglePanel(which) {
    if (MR.panelOpen && MR.activePanel === which) { closePanel(); return; }
    MR.panelOpen = true;
    MR.activePanel = which;
    qs('meetPanel').style.display = 'flex';
    qs('chatPanel').style.display = which === 'chat' ? 'flex' : 'none';
    qs('participantsPanel').style.display = which === 'participants' ? 'flex' : 'none';
    qs('panelTitle').textContent = which === 'chat' ? 'In-call messages' : 'Participants';
    if (which === 'chat') {
        MR.unreadChat = 0;
        qs('chatBadge').style.display = 'none';
        setTimeout(() => qs('chatInput').focus(), 100);
    }
}

function closePanel() {
    MR.panelOpen = false;
    qs('meetPanel').style.display = 'none';
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
async function sendChat() {
    const input = qs('chatInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    try {
        await fetch(`/api/meetings/${MR.roomCode}/chat`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text, senderName: MR.user.name })
        });
        await fetchChat();
    } catch (_) {
        appendChatMsg({ senderName: MR.user.name, message: text, createdAt: new Date().toISOString(), self: true });
    }
}

async function fetchChat() {
    try {
        const r = await fetch(`/api/meetings/${MR.roomCode}/chat`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const d = await r.json();
        renderChat(d.success ? (d.data?.messages || []) : []);
    } catch (_) {}
}

function renderChat(messages) {
    const box = qs('chatMessages');
    const empty = qs('chatEmpty');
    if (!messages.length) { if (empty) empty.style.display = 'block'; return; }
    if (empty) empty.style.display = 'none';
    if (messages.length === MR.lastChatCount) return;
    if (messages.length > MR.lastChatCount && (!MR.panelOpen || MR.activePanel !== 'chat')) {
        MR.unreadChat += messages.length - MR.lastChatCount;
        const b = qs('chatBadge');
        b.textContent = MR.unreadChat;
        b.style.display = 'flex';
    }
    MR.lastChatCount = messages.length;
    box.querySelectorAll('.chat-msg').forEach(n => n.remove());
    messages.forEach(m => appendChatMsg({
        senderName: m.senderName, message: m.message,
        createdAt: m.createdAt, self: m.senderName === MR.user.name
    }, false));
    box.scrollTop = box.scrollHeight;
}

function appendChatMsg(m, scroll = true) {
    const box = qs('chatMessages');
    if (qs('chatEmpty')) qs('chatEmpty').style.display = 'none';
    const div = document.createElement('div');
    div.className = 'chat-msg' + (m.self ? ' self' : '');
    const t = new Date(m.createdAt).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
    div.innerHTML = `
        <div class="chat-msg-head">
            <span class="chat-msg-author">${m.self ? 'You' : esc(m.senderName)}</span>
            <span class="chat-msg-time">${t}</span>
        </div>
        <div class="chat-msg-text">${esc(m.message)}</div>`;
    box.appendChild(div);
    if (scroll) box.scrollTop = box.scrollHeight;
}

function esc(s) {
    return String(s).replace(/[&<>"']/g, c =>
        ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

// ─── Presence / Participants ──────────────────────────────────────────────────
async function registerPresence() {
    try {
        const r = await fetch(`/api/meetings/${MR.roomCode}/join`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: MR.user.name, micOn: MR.micOn, camOn: MR.camOn })
        });
        const d = await r.json();
        if (d.success && d.data) {
            if (d.data.role) MR.user.role = d.data.role;
            if (d.data.name) MR.user.name = d.data.name;
            if (d.data.userId) MR.user.id = String(d.data.userId);
        }
    } catch (_) {}
    await fetchParticipants();
}

async function updatePresence() {
    try {
        await fetch(`/api/meetings/${MR.roomCode}/presence`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: MR.user.name, micOn: MR.micOn, camOn: MR.camOn, handRaised: MR.handRaised })
        });
    } catch (_) {}
}

async function fetchParticipants() {
    try {
        const r = await fetch(`/api/meetings/${MR.roomCode}/participants`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const d = await r.json();
        const list = d.success ? (d.data?.participants || []) : [];
        const pending = d.success ? (d.data?.pendingRequests || []) : [];
        const hostId = d.success ? d.data?.hostId : null;
        MR.pendingRequestsCount = pending.length;
        updatePendingBadge();
        renderParticipants(list, pending, hostId);
    } catch (_) {
        renderParticipants([{ name: MR.user.name, role: MR.user.role, micOn: MR.micOn, camOn: MR.camOn }], [], null);
    }
}

function updatePendingBadge() {
    const btn = qs('participantsBtn');
    if (!btn) return;
    const old = qs('pendingBadge');
    if (old) old.remove();
    const isHost = ['teacher','hod','managing_authority','admin'].includes(MR.user.role)
        || (MR.hostId && MR.user.id && String(MR.user.id) === String(MR.hostId));
    if (MR.pendingRequestsCount > 0 && isHost) {
        const b = document.createElement('span');
        b.id = 'pendingBadge';
        b.style.cssText = 'position:absolute;top:-5px;right:-5px;background:#ef4444;color:white;border-radius:50%;width:20px;height:20px;font-size:11px;display:flex;align-items:center;justify-content:center;font-weight:bold;';
        b.textContent = MR.pendingRequestsCount;
        btn.style.position = 'relative';
        btn.appendChild(b);
    }
}

function renderParticipants(list, pending, hostId) {
    // Make sure self is in list
    const myId = String(MR.user.id || '');
    if (!list.some(p => (p.userId && String(p.userId) === myId) || p.name === MR.user.name)) {
        list.unshift({ userId: myId, name: MR.user.name, role: MR.user.role, micOn: MR.micOn, camOn: MR.camOn });
    }
    qs('participantCount').textContent = list.length + pending.length;

    const isHost = ['teacher','hod','managing_authority','admin'].includes(MR.user.role)
        || (hostId && myId && myId === String(hostId));

    let html = '';
    list.forEach(p => {
        const isSelf = (p.userId && String(p.userId) === myId) || p.name === MR.user.name;
        const role = { hod:'HOD', teacher:'Teacher', managing_authority:'Principal', student:'Student' }[p.role] || p.role || '';
        html += `<div class="participant-item">
            <div class="participant-avatar">${initials(p.name)}</div>
            <div class="participant-info">
                <div class="participant-name">${esc(p.name)}${isSelf ? ' (You)' : ''}</div>
                <div class="participant-role">${role}</div>
            </div>
            <div class="participant-icons">
                <i class="fas fa-microphone${p.micOn ? '' : '-slash'}"></i>
                <i class="fas fa-video${p.camOn ? '' : '-slash'}"></i>
                ${p.handRaised ? '<i class="fas fa-hand" style="color:#fbbc04;"></i>' : ''}
            </div>
        </div>`;
    });

    if (isHost && pending.length > 0) {
        html += `<div style="border-top:1px solid #334155;margin:10px 0;padding-top:10px;">
            <h4 style="color:#94a3b8;font-size:0.85rem;margin-bottom:10px;">Pending Requests (${pending.length})</h4></div>`;
        pending.forEach(p => {
            const uid = p.userId ? String(p.userId) : '';
            if (!uid) return;
            html += `<div class="participant-item pending-item" style="background:#1e293b;">
                <div class="participant-avatar">${initials(p.name)}</div>
                <div class="participant-info">
                    <div class="participant-name">${esc(p.name)}</div>
                    <div class="participant-role">${p.role === 'student' ? 'Student' : (p.role || '')}</div>
                </div>
                <div class="participant-actions" style="display:flex;gap:5px;">
                    <button data-uid="${uid}" data-action="approve" class="pending-action-btn" style="background:#22c55e;color:white;border:none;border-radius:5px;padding:5px 10px;font-size:12px;cursor:pointer;"><i class="fas fa-check"></i> Accept</button>
                    <button data-uid="${uid}" data-action="reject" class="pending-action-btn" style="background:#ef4444;color:white;border:none;border-radius:5px;padding:5px 10px;font-size:12px;cursor:pointer;"><i class="fas fa-times"></i> Decline</button>
                </div>
            </div>`;
        });
    }

    const container = qs('participantsList');
    container.innerHTML = html;

    // Wire approve/reject buttons
    container.querySelectorAll('.pending-action-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const uid = this.getAttribute('data-uid');
            const action = this.getAttribute('data-action');
            if (!uid) return;
            await handleApproval(uid, action === 'approve');
        });
    });
}

// ─── Approve / Reject ─────────────────────────────────────────────────────────
async function handleApproval(userId, approve) {
    const endpoint = approve ? 'approve' : 'reject';
    try {
        const r = await fetch(`/api/meetings/${MR.roomCode}/${endpoint}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        const d = await r.json();
        if (d.success) {
            toast(approve ? 'Student approved — they will join now' : 'Request declined');
            await fetchParticipants();
            
            // CRITICAL FIX: When approving, reload Jitsi iframe to force peer connection
            // This ensures the newly approved user will be visible to existing participants
            if (approve && jitsiFrame) {
                console.log('[Approval] Reloading Jitsi to establish connection with new participant');
                // Wait a moment for the approved user to enter, then reload
                setTimeout(() => {
                    const currentSrc = jitsiFrame.src;
                    // Remove old timestamp and add new one to force reconnection
                    const baseSrc = currentSrc.split('&_t=')[0];
                    jitsiFrame.src = baseSrc + '&_t=' + Date.now();
                    toast('Refreshing connections...');
                }, 1500); // Give the approved user time to load their iframe
            }
        } else {
            toast(`Error: ${d.message}`);
            console.error('Approval failed:', d);
        }
    } catch (err) {
        toast('Network error — please try again');
        console.error('Approval error:', err);
    }
}

// ─── Polling ──────────────────────────────────────────────────────────────────
function startPolling() {
    fetchChat();
    fetchParticipants();
    MR.chatPollTimer = setInterval(fetchChat, 3000);
    MR.participantsPollTimer = setInterval(checkMeetingStatus, 5000);
    MR.heartbeatTimer = setInterval(updatePresence, 10000);
}

async function checkMeetingStatus() {
    try {
        const r = await fetch(`/api/meetings/${MR.roomCode}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const d = await r.json();
        if (d.success && !d.data.isActive && MR.joined) {
            stopPolling();
            MR.joined = false;
            qs('meetingRoom').style.display = 'none';
            const c = qs('leftScreen').querySelector('.left-card');
            if (c) c.innerHTML = `
                <i class="fas fa-check-circle" style="font-size:3.5rem;color:#22c55e;margin-bottom:1.5rem;"></i>
                <h2>Class Completed</h2>
                <p style="color:#94a3b8;margin-bottom:2rem;">${MR.meetingTitle}</p>
                <p style="color:#64748b;font-size:0.9rem;margin-bottom:2rem;">The teacher has ended the class.</p>
                <div class="left-actions">
                    <button class="left-btn primary" onclick="goHome()"><i class="fas fa-home"></i> Return to Dashboard</button>
                </div>`;
            qs('leftScreen').style.display = 'flex';
            return;
        }
    } catch (_) {}
    await fetchParticipants();
}

function stopPolling() {
    clearInterval(MR.chatPollTimer);
    clearInterval(MR.participantsPollTimer);
    clearInterval(MR.heartbeatTimer);
}

// ─── Leave / End ──────────────────────────────────────────────────────────────
async function leaveMeeting() {
    stopPolling();
    if (jitsiFrame) { jitsiFrame.src = 'about:blank'; jitsiFrame.remove(); jitsiFrame = null; }
    try {
        await fetch(`/api/meetings/${MR.roomCode}/leave`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' }
        });
    } catch (_) {}
    qs('meetingRoom').style.display = 'none';
    qs('leftScreen').style.display = 'flex';
}

async function endMeetingForAll() {
    if (!confirm('End the meeting for everyone?')) return;
    stopPolling();
    if (jitsiFrame) { jitsiFrame.src = 'about:blank'; jitsiFrame.remove(); jitsiFrame = null; }
    try {
        await fetch(`/api/meetings/${MR.roomCode}/end`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' }
        });
    } catch (_) {}
    qs('meetingRoom').style.display = 'none';
    const c = qs('leftScreen').querySelector('.left-card');
    if (c) c.innerHTML = `
        <i class="fas fa-stop-circle" style="font-size:3.5rem;color:#ef4444;margin-bottom:1.5rem;"></i>
        <h2>Meeting Ended</h2>
        <p style="color:#64748b;font-size:0.9rem;margin-bottom:2rem;">The join link has expired.</p>
        <div class="left-actions">
            <button class="left-btn primary" onclick="goHome()"><i class="fas fa-home"></i> Return to Dashboard</button>
        </div>`;
    qs('leftScreen').style.display = 'flex';
}

// ─── Copy Link ────────────────────────────────────────────────────────────────
function copyMeetingLink() {
    const link = `${window.location.origin}/meeting-room.html?room=${MR.roomCode}&title=${encodeURIComponent(MR.meetingTitle)}`;
    navigator.clipboard.writeText(link).then(() => toast('Link copied!')).catch(() => toast('Could not copy'));
}

// ─── Go Home ──────────────────────────────────────────────────────────────────
function goHome() {
    const map = { student:'student-dashboard.html', teacher:'teacher-dashboard.html',
        hod:'HOD-dashboard.html', managing_authority:'managing-authority.html', admin:'admin-dashboard.html' };
    window.location.href = map[MR.user.role] || 'index.html';
}

window.addEventListener('beforeunload', () => {
    if (jitsiFrame) { jitsiFrame.src = 'about:blank'; }
});
