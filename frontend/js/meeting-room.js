// 
//  EduConnect Meet  Meeting Room Logic
// 

const MR = {
    localStream: null,
    screenStream: null,
    micOn: true,
    camOn: true,
    handRaised: false,
    sharing: false,
    roomCode: null,
    meetingTitle: 'Class Meeting',
    user: null,
    hostId: null,
    joinStatus: 'pending', // 'pending', 'accepted', 'rejected'
    pendingRequestsCount: 0,
    chatPollTimer: null,
    participantsPollTimer: null,
    heartbeatTimer: null,
    lastChatCount: 0,
    unreadChat: 0,
    panelOpen: false,
    activePanel: 'chat',
    joined: false,
};

//  Helpers 
function qs(id) { return document.getElementById(id); }

function getParam(name) {
    return new URLSearchParams(window.location.search).get(name);
}

function getToken() { return localStorage.getItem('authToken'); }

function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem('currentUser') || '{}'); }
    catch { return {}; }
}

// Fetch fresh user info from API to avoid stale localStorage role
async function fetchCurrentUser() {
    try {
        const res = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();
        if (data.success && data.data) {
            // Always return with a consistent `id` field
            const user = data.data;
            user.id = user._id || user.id; // normalise _id → id
            return user;
        }
    } catch (err) { /* fallback */ }
    const local = getCurrentUser();
    local.id = local._id || local.id;
    return local;
}

function initials(name) {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
}

function toast(msg) {
    const t = qs('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('show'), 2600);
}

//  Init 
document.addEventListener('DOMContentLoaded', async () => {
    // Get server-authoritative user info (not stale localStorage)
    MR.user = await fetchCurrentUser();
    
    // If user name is still empty (e.g., opened on wrong domain without localStorage),
    // try to extract from URL parameter or meeting record as a fallback
    if (!MR.user.name || !MR.user.name.trim()) {
        const urlName = getParam('name');
        if (urlName) {
            MR.user.name = decodeURIComponent(urlName);
        }
    }
    
    MR.roomCode = getParam('room') || generateRoomCode();
    MR.meetingTitle = decodeURIComponent(getParam('title') || 'Class Meeting');

    // Lobby setup - always populate with the best available name
    qs('lobbyMeetingTitle').textContent = MR.meetingTitle;
    qs('lobbyMeetingMeta').textContent = `Room code: ${MR.roomCode}`;
    qs('lobbyNameInput').value = MR.user.name || '';
    qs('lobbyAvatar').textContent = initials(MR.user.name || 'You');

    await startLobbyPreview();
    wireLobby();
});

function generateRoomCode() {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const seg = (n) => Array.from({length:n}, () => chars[Math.floor(Math.random()*chars.length)]).join('');
    return `${seg(3)}-${seg(4)}-${seg(3)}`;
}

//  Lobby preview 
async function startLobbyPreview() {
    try {
        MR.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        qs('lobbyVideo').srcObject = MR.localStream;
        qs('lobbyCamOff').style.display = 'none';
    } catch (err) {
        console.warn('Media access denied or unavailable:', err);
        MR.camOn = false;
        MR.micOn = false;
        qs('lobbyCamOff').style.display = 'flex';
        updateLobbyButtons();
        toast('Camera/mic not available  you can still join');
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
    qs('lobbyNameInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') joinMeeting(); });
    // Keep the lobby avatar in sync with the name the user types
    qs('lobbyNameInput').addEventListener('input', (e) => {
        qs('lobbyAvatar').textContent = initials(e.target.value || 'You');
    });
}

function updateLobbyButtons() {
    const micBtn = qs('lobbyMicBtn');
    const camBtn = qs('lobbyCamBtn');
    micBtn.className = 'ctrl-btn' + (MR.micOn ? '' : ' off');
    micBtn.innerHTML = `<i class="fas fa-microphone${MR.micOn ? '' : '-slash'}"></i>`;
    camBtn.className = 'ctrl-btn' + (MR.camOn ? '' : ' off');
    camBtn.innerHTML = `<i class="fas fa-video${MR.camOn ? '' : '-slash'}"></i>`;
}

//  Join meeting 
async function joinMeeting() {
    const name = qs('lobbyNameInput').value.trim() || MR.user.name || 'Guest';
    MR.user.name = name;

    // Check if meeting is still active before joining
    try {
        const checkRes = await fetch(`/api/meetings/${MR.roomCode}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const checkData = await checkRes.json();
        
        if (!checkData.success || !checkData.data.isActive) {
            // Meeting has ended or doesn't exist
            qs('lobby').style.display = 'none';
            const leftCard = qs('leftScreen').querySelector('.left-card');
            if (leftCard) {
                leftCard.innerHTML = `
                    <i class="fas fa-times-circle" style="font-size:3.5rem; color:#ef4444; margin-bottom:1.5rem;"></i>
                    <h2>Meeting Has Ended</h2>
                    <p style="color:#94a3b8; margin-bottom:2rem;">${MR.meetingTitle}</p>
                    <p style="color:#64748b; font-size:0.9rem; margin-bottom:2rem;">This meeting link has expired. Please ask the host to generate a new meeting room.</p>
                    <div class="left-actions">
                        <button class="left-btn primary" onclick="goHome()"><i class="fas fa-home"></i> Return to Dashboard</button>
                    </div>
                `;
            }
            qs('leftScreen').style.display = 'flex';
            return;
        }

        // Store host ID to check if current user is host
        MR.hostId = checkData.data.hostId;
        
    } catch (err) {
        console.error('Error checking meeting status:', err);
        toast('Error checking meeting status. Please try again.');
        return;
    }

    // Try to join the meeting
    try {
        const joinRes = await fetch(`/api/meetings/${MR.roomCode}/join`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: MR.user.name, micOn: MR.micOn, camOn: MR.camOn })
        });
        const joinData = await joinRes.json();
        
        if (!joinData.success) {
            // Show error message
            toast(joinData.message || 'Failed to join meeting');
            return;
        }
        
        MR.joinStatus = joinData.data.status || 'accepted';
        // Ensure user id is set (from join response or from fetchCurrentUser earlier)
        MR.user.id = MR.user.id || joinData.data.userId || MR.user._id;
        
        // If status is pending, show waiting screen
        if (MR.joinStatus === 'pending') {
            qs('lobby').style.display = 'none';
            showWaitingScreen();
            // Poll for approval
            startApprovalPolling();
            return;
        }
        
        // If rejected, show error
        if (MR.joinStatus === 'rejected') {
            toast('Your join request was declined by the teacher');
            return;
        }
        
    } catch (err) {
        console.error('Error joining meeting:', err);
        toast('Failed to join meeting. Please try again.');
        return;
    }

    MR.joined = true;

    qs('lobby').style.display = 'none';
    qs('meetingRoom').style.display = 'flex';

    qs('meetTitle').textContent = MR.meetingTitle;
    qs('roomCodeText').textContent = MR.roomCode;
    qs('leftMeetingName').textContent = MR.meetingTitle;

    // Load Jitsi Meet for real video conferencing
    loadJitsiMeet();

    updateControlButtons();
    startClock();
    wireMeetingControls();

    // Register presence + start polling chat/participants from backend
    await registerPresence();
    startPolling();

    toast('You joined the meeting');
}

// Show waiting screen for pending approval
function showWaitingScreen() {
    const leftCard = qs('leftScreen').querySelector('.left-card');
    if (leftCard) {
        leftCard.innerHTML = `
            <i class="fas fa-hourglass-half fa-spin" style="font-size:3.5rem; color:#3b82f6; margin-bottom:1.5rem;"></i>
            <h2>Waiting for Teacher Approval</h2>
            <p style="color:#94a3b8; margin-bottom:2rem;">${MR.meetingTitle}</p>
            <p style="color:#64748b; font-size:0.9rem; margin-bottom:2rem;">Your join request has been sent to the teacher. Please wait for approval...</p>
            <div class="left-actions">
                <button class="left-btn secondary" onclick="cancelJoinRequest()"><i class="fas fa-times"></i> Cancel</button>
            </div>
        `;
    }
    qs('leftScreen').style.display = 'flex';
}

// Poll for approval status
function startApprovalPolling() {
    MR.approvalPollTimer = setInterval(async () => {
        try {
            const res = await fetch(`/api/meetings/${MR.roomCode}/participants`, {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const data = await res.json();
            
            if (data.success && data.data.participants) {
                // Check if current user is in accepted participants
                // Compare as strings to avoid ObjectId vs string mismatch
                const myId = String(MR.user.id || '');
                const accepted = data.data.participants.find(p => 
                    p.userId && String(p.userId) === myId
                );
                if (accepted && accepted.status === 'accepted') {
                    clearInterval(MR.approvalPollTimer);
                    MR.joinStatus = 'accepted';
                    MR.joined = true;
                    
                    // Hide waiting screen and show meeting room
                    qs('leftScreen').style.display = 'none';
                    qs('meetingRoom').style.display = 'flex';
                    
                    // Setup meeting UI
                    qs('meetTitle').textContent = MR.meetingTitle;
                    qs('roomCodeText').textContent = MR.roomCode;
                    qs('leftMeetingName').textContent = MR.meetingTitle;
                    
                    // Load Jitsi - this will join the meeting automatically
                    loadJitsiMeet();
                    
                    updateControlButtons();
                    startClock();
                    wireMeetingControls();
                    await registerPresence();
                    startPolling();
                    
                    toast('Teacher approved your request. Joining meeting...');
                }
            }
        } catch (err) {
            console.error('Error polling approval:', err);
        }
    }, 3000);
}

// Cancel join request
function cancelJoinRequest() {
    if (MR.approvalPollTimer) {
        clearInterval(MR.approvalPollTimer);
    }
    goHome();
}

//  Jitsi Meet Integration 
let jitsiAPI = null;

function loadJitsiMeet() {
    const container = qs('videoGrid');
    container.innerHTML = ''; // Clear any existing content
    
    // Show instruction overlay for 5 seconds
    const instructionOverlay = document.createElement('div');
    instructionOverlay.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(102, 126, 234, 0.95);
        color: white;
        padding: 20px 30px;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 500;
        z-index: 1000;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        pointer-events: none;
    `;
    instructionOverlay.innerHTML = `
        <i class="fas fa-info-circle" style="font-size: 24px; margin-bottom: 10px;"></i><br>
        When Jitsi loads, click <strong>"Join meeting"</strong> to enter the video conference
    `;
    container.parentElement.appendChild(instructionOverlay);
    
    // Remove instruction after 5 seconds
    setTimeout(() => {
        instructionOverlay.style.transition = 'opacity 0.5s';
        instructionOverlay.style.opacity = '0';
        setTimeout(() => instructionOverlay.remove(), 500);
    }, 5000);
    
    // Jitsi Meet configuration
    const domain = 'meet.jit.si';
    const options = {
        roomName: `EduConnect_${MR.roomCode}`,
        width: '100%',
        height: '100%',
        parentNode: container,
        configOverwrite: {
            startWithAudioMuted: !MR.micOn,
            startWithVideoMuted: !MR.camOn,
            prejoinPageEnabled: false,
            enableWelcomePage: false,
            disableDeepLinking: true,
            toolbarButtons: [
                'microphone', 'camera', 'desktop', 'fullscreen',
                'hangup', 'raisehand', 'settings', 'tileview'
            ],
        },
        interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            MOBILE_APP_PROMO: false,
        },
        userInfo: {
            displayName: MR.user.name
        }
    };
    
    // Load Jitsi Meet API
    jitsiAPI = new JitsiMeetExternalAPI(domain, options);
    
    // Wait for conference join
    jitsiAPI.addEventListener('videoConferenceJoined', () => {
        console.log('Jitsi conference joined');
        toast('Connected to meeting');
    });
    
    // Sync controls with Jitsi
    jitsiAPI.addEventListener('audioMuteStatusChanged', (e) => {
        MR.micOn = !e.muted;
        updateControlButtons();
        updatePresence();
    });
    
    jitsiAPI.addEventListener('videoMuteStatusChanged', (e) => {
        MR.camOn = !e.muted;
        updateControlButtons();
        updatePresence();
    });
    
    jitsiAPI.addEventListener('participantJoined', () => {
        fetchParticipants();
    });
    
    jitsiAPI.addEventListener('participantLeft', () => {
        fetchParticipants();
    });
    
    // When user leaves via Jitsi's hangup button
    jitsiAPI.addEventListener('readyToClose', () => {
        leaveMeeting();
    });
}

//  Local video tile (legacy - now replaced by Jitsi) 
function renderLocalTile() {
    const grid = qs('videoGrid');
    let tile = qs('tile-local');
    if (!tile) {
        tile = document.createElement('div');
        tile.id = 'tile-local';
        tile.className = 'video-tile local';
        grid.appendChild(tile);
    }
    tile.innerHTML = `
        <video id="localVideo" autoplay muted playsinline></video>
        <div class="video-tile-avatar" id="localAvatar" style="display:none;">
            <div class="avatar-circle">${initials(MR.user.name)}</div>
        </div>
        <div class="video-tile-name"><i class="fas fa-microphone${MR.micOn?'':'-slash'}" id="localMicIcon"></i> ${MR.user.name} (You)</div>
        <div class="video-tile-badges" id="localBadges"></div>
    `;
    if (MR.localStream) qs('localVideo').srcObject = MR.localStream;
    updateLocalTileVisual();
    refreshGridLayout();
}

function updateLocalTileVisual() {
    const vid = qs('localVideo');
    const av = qs('localAvatar');
    if (!vid || !av) return;
    if (MR.camOn && MR.localStream) { vid.style.display = 'block'; av.style.display = 'none'; }
    else { vid.style.display = 'none'; av.style.display = 'flex'; }

    const micIcon = qs('localMicIcon');
    if (micIcon) micIcon.className = `fas fa-microphone${MR.micOn ? '' : '-slash'}`;

    const badges = qs('localBadges');
    if (badges) {
        badges.innerHTML = '';
        if (!MR.micOn) badges.innerHTML += '<div class="tile-badge muted"><i class="fas fa-microphone-slash"></i></div>';
        if (MR.handRaised) badges.innerHTML += '<div class="tile-badge hand"><i class="fas fa-hand"></i></div>';
    }
}

function refreshGridLayout() {
    const grid = qs('videoGrid');
    const tiles = grid.querySelectorAll('.video-tile').length;
    grid.classList.toggle('single', tiles === 1);
}

//  Controls 
function wireMeetingControls() {
    qs('micBtn').addEventListener('click', toggleMic);
    qs('camBtn').addEventListener('click', toggleCam);
    qs('screenBtn').addEventListener('click', toggleScreen);
    qs('handBtn').addEventListener('click', toggleHand);
    qs('leaveBtn').addEventListener('click', leaveMeeting);
    qs('chatBtn').addEventListener('click', () => togglePanel('chat'));
    qs('participantsBtn').addEventListener('click', () => togglePanel('participants'));
    qs('closePanelBtn').addEventListener('click', closePanel);
    qs('chatSendBtn').addEventListener('click', sendChat);
    qs('chatInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(); });
    qs('copyLinkBtn').addEventListener('click', copyMeetingLink);

    // End Meeting button  show for host (teacher or hod role)
    const endBtn = qs('endMeetingBtn');
    if (endBtn) {
        const isHost = (MR.hostId && MR.user.id === MR.hostId)
            || MR.user.role === 'teacher'
            || MR.user.role === 'hod';
        if (isHost) {
            endBtn.style.display = 'flex';
            endBtn.addEventListener('click', endMeetingForAll);
        } else {
            endBtn.style.display = 'none';
        }
    }

    // Left screen actions
    qs('rejoinBtn').addEventListener('click', () => window.location.reload());
    qs('homeBtn').addEventListener('click', goHome);
}

function toggleMic() {
    MR.micOn = !MR.micOn;
    if (MR.localStream) MR.localStream.getAudioTracks().forEach(t => t.enabled = MR.micOn);
    if (jitsiAPI) {
        jitsiAPI.executeCommand('toggleAudio');
    }
    updateControlButtons();
    updatePresence();
}

function toggleCam() {
    MR.camOn = !MR.camOn;
    if (MR.localStream) MR.localStream.getVideoTracks().forEach(t => t.enabled = MR.camOn);
    if (jitsiAPI) {
        jitsiAPI.executeCommand('toggleVideo');
    }
    updateControlButtons();
    updatePresence();
}

async function toggleScreen() {
    if (jitsiAPI) {
        // Let Jitsi handle screen sharing
        jitsiAPI.executeCommand('toggleShareScreen');
        toast(MR.sharing ? 'Stopped screen share' : 'Started screen share');
        MR.sharing = !MR.sharing;
        updateControlButtons();
    }
}

function stopScreenShare() {
    if (jitsiAPI && MR.sharing) {
        jitsiAPI.executeCommand('toggleShareScreen');
    }
    if (MR.screenStream) MR.screenStream.getTracks().forEach(t => t.stop());
    MR.screenStream = null;
    MR.sharing = false;
    updateControlButtons();
}

function toggleHand() {
    MR.handRaised = !MR.handRaised;
    if (jitsiAPI) {
        // Jitsi will show the raised hand indicator
        // Our backend tracks it separately for our participant list
    }
    updateControlButtons();
    updatePresence();
    toast(MR.handRaised ? 'You raised your hand' : 'You lowered your hand');
}

function updateControlButtons() {
    const mic = qs('micBtn');
    mic.className = 'ctrl-btn' + (MR.micOn ? '' : ' off');
    mic.innerHTML = `<i class="fas fa-microphone${MR.micOn ? '' : '-slash'}"></i>`;

    const cam = qs('camBtn');
    cam.className = 'ctrl-btn' + (MR.camOn ? '' : ' off');
    cam.innerHTML = `<i class="fas fa-video${MR.camOn ? '' : '-slash'}"></i>`;

    const screen = qs('screenBtn');
    screen.className = 'ctrl-btn' + (MR.sharing ? ' active-toggle' : '');

    const hand = qs('handBtn');
    hand.className = 'ctrl-btn' + (MR.handRaised ? ' active-toggle' : '');
}

//  Clock 
function startClock() {
    const update = () => {
        const now = new Date();
        qs('meetClock').textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };
    update();
    setInterval(update, 30000);
}

//  Side Panel (chat / participants) 
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
    refreshGridLayout();
}

function closePanel() {
    MR.panelOpen = false;
    qs('meetPanel').style.display = 'none';
    refreshGridLayout();
}

//  Chat (backend-backed) 
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
    } catch (err) {
        // Fallback: show locally even if backend fails
        appendChatMessage({ senderName: MR.user.name, message: text, createdAt: new Date().toISOString(), self: true });
    }
}

async function fetchChat() {
    try {
        const res = await fetch(`/api/meetings/${MR.roomCode}/chat`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();
        const messages = data.success ? (data.data?.messages || []) : [];
        renderChat(messages);
    } catch (err) { /* offline-friendly */ }
}

function renderChat(messages) {
    const container = qs('chatMessages');
    const empty = qs('chatEmpty');

    if (messages.length === 0) { if (empty) empty.style.display = 'block'; return; }
    if (empty) empty.style.display = 'none';

    // Only re-render if count changed
    if (messages.length === MR.lastChatCount) return;

    // New messages arrived while chat closed
    if (messages.length > MR.lastChatCount && (!MR.panelOpen || MR.activePanel !== 'chat')) {
        MR.unreadChat += (messages.length - MR.lastChatCount);
        const badge = qs('chatBadge');
        badge.textContent = MR.unreadChat;
        badge.style.display = 'flex';
    }
    MR.lastChatCount = messages.length;

    container.querySelectorAll('.chat-msg').forEach(n => n.remove());
    messages.forEach(m => appendChatMessage({
        senderName: m.senderName,
        message: m.message,
        createdAt: m.createdAt,
        self: m.senderName === MR.user.name
    }, false));
    container.scrollTop = container.scrollHeight;
}

function appendChatMessage(m, scroll = true) {
    const container = qs('chatMessages');
    const empty = qs('chatEmpty');
    if (empty) empty.style.display = 'none';
    const div = document.createElement('div');
    div.className = 'chat-msg' + (m.self ? ' self' : '');
    const time = new Date(m.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = `
        <div class="chat-msg-head">
            <span class="chat-msg-author">${m.self ? 'You' : escapeHtml(m.senderName)}</span>
            <span class="chat-msg-time">${time}</span>
        </div>
        <div class="chat-msg-text">${escapeHtml(m.message)}</div>
    `;
    container.appendChild(div);
    if (scroll) container.scrollTop = container.scrollHeight;
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

//  Presence / participants (backend-backed) 
async function registerPresence() {
    try {
        const res = await fetch(`/api/meetings/${MR.roomCode}/join`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: MR.user.name, micOn: MR.micOn, camOn: MR.camOn })
        });
        const data = await res.json();
        // Update local user info with server-authoritative role + name
        if (data.success && data.data) {
            if (data.data.role) MR.user.role = data.data.role;
            if (data.data.name) MR.user.name = data.data.name;
            // Update display name in the local tile
            const nameEl = document.querySelector('#tile-local .video-tile-name');
            if (nameEl) nameEl.innerHTML = `<i class="fas fa-microphone${MR.micOn?'':'-slash'}"></i> ${MR.user.name} (You)`;
            
            // Check if current user is host and show End button accordingly
            const endBtn = qs('endMeetingBtn');
            if (endBtn && MR.hostId && MR.user.id === MR.hostId) {
                endBtn.style.display = 'flex';
                endBtn.addEventListener('click', endMeetingForAll);
            }
        }
    } catch (err) { /* offline-friendly */ }
    await fetchParticipants();
}

async function updatePresence() {
    try {
        await fetch(`/api/meetings/${MR.roomCode}/presence`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: MR.user.name, micOn: MR.micOn, camOn: MR.camOn, handRaised: MR.handRaised })
        });
    } catch (err) { /* offline-friendly */ }
}

async function fetchParticipants() {
    try {
        const res = await fetch(`/api/meetings/${MR.roomCode}/participants`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();
        const list = data.success ? (data.data?.participants || []) : [];
        const pending = data.success ? (data.data?.pendingRequests || []) : [];
        const hostId = data.success ? data.data?.hostId : null;
        
        MR.pendingRequestsCount = pending.length;
        
        // Update badge on participants button
        updatePendingBadge();
        
        renderParticipants(list, pending, hostId);
    } catch (err) {
        // At least show self
        renderParticipants([{ name: MR.user.name, role: MR.user.role, micOn: MR.micOn, camOn: MR.camOn, status: 'accepted' }], [], null);
    }
}

function updatePendingBadge() {
    const badge = document.createElement('span');
    badge.id = 'pendingBadge';
    badge.className = 'pending-badge';
    badge.textContent = MR.pendingRequestsCount;
    badge.style.cssText = 'position:absolute; top:-5px; right:-5px; background:#ef4444; color:white; border-radius:50%; width:20px; height:20px; font-size:11px; display:flex; align-items:center; justify-content:center; font-weight:bold;';
    
    const participantsBtn = qs('participantsBtn');
    if (participantsBtn) {
        const existingBadge = qs('pendingBadge');
        if (existingBadge) existingBadge.remove();
        
        if (MR.pendingRequestsCount > 0 && (MR.user.id === MR.hostId || MR.user.role === 'teacher' || MR.user.role === 'hod')) {
            participantsBtn.style.position = 'relative';
            participantsBtn.appendChild(badge);
        }
    }
}

function renderParticipants(list, pending = [], hostId = null) {
    // Ensure self is in the list
    if (!list.some(p => p.name === MR.user.name || (p.userId && MR.user.id && p.userId === MR.user.id))) {
        list.unshift({ userId: MR.user.id, name: MR.user.name, role: MR.user.role, micOn: MR.micOn, camOn: MR.camOn, status: 'accepted' });
    }
    
    const totalCount = list.length + pending.length;
    qs('participantCount').textContent = totalCount;

    const container = qs('participantsList');
    const isHost = MR.user.id === hostId || MR.user.role === 'teacher' || MR.user.role === 'hod';
    
    let html = '';
    
    // Show accepted participants
    list.forEach(p => {
        const isSelf = p.name === MR.user.name || (p.userId && MR.user.id && p.userId === MR.user.id);
        const roleLabel = p.role === 'hod' ? 'HOD' : p.role === 'teacher' ? 'Teacher'
            : p.role === 'managing_authority' ? 'Principal' : p.role === 'student' ? 'Student' : '';
        html += `
            <div class="participant-item">
                <div class="participant-avatar">${initials(p.name)}</div>
                <div class="participant-info">
                    <div class="participant-name">${escapeHtml(p.name)}${isSelf ? ' (You)' : ''}</div>
                    <div class="participant-role">${roleLabel}</div>
                </div>
                <div class="participant-icons">
                    <i class="fas fa-microphone${p.micOn ? '' : '-slash'}"></i>
                    <i class="fas fa-video${p.camOn ? '' : '-slash'}"></i>
                    ${p.handRaised ? '<i class="fas fa-hand" style="color:#fbbc04;"></i>' : ''}
                </div>
            </div>
        `;
    });
    
    // Show pending requests if user is host
    if (isHost && pending.length > 0) {
        html += '<div style="border-top:1px solid #334155; margin:10px 0; padding-top:10px;"><h4 style="color:#94a3b8; font-size:0.85rem; margin-bottom:10px;">Pending Requests (' + pending.length + ')</h4></div>';
        
        pending.forEach(p => {
            html += `
                <div class="participant-item pending-item" style="background:#1e293b;">
                    <div class="participant-avatar">${initials(p.name)}</div>
                    <div class="participant-info">
                        <div class="participant-name">${escapeHtml(p.name)}</div>
                        <div class="participant-role">${p.role === 'student' ? 'Student' : p.role}</div>
                    </div>
                    <div class="participant-actions" style="display:flex; gap:5px;">
                        <button onclick="approveJoinRequest('${p.userId}')" class="btn-approve" style="background:#22c55e; color:white; border:none; border-radius:5px; padding:5px 10px; font-size:12px; cursor:pointer;"><i class="fas fa-check"></i> Accept</button>
                        <button onclick="rejectJoinRequest('${p.userId}')" class="btn-reject" style="background:#ef4444; color:white; border:none; border-radius:5px; padding:5px 10px; font-size:12px; cursor:pointer;"><i class="fas fa-times"></i> Decline</button>
                    </div>
                </div>
            `;
        });
    }
    
    container.innerHTML = html;
}

// Approve join request
async function approveJoinRequest(userId) {
    try {
        const res = await fetch(`/api/meetings/${MR.roomCode}/approve`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        const data = await res.json();
        if (data.success) {
            toast('Join request approved');
            await fetchParticipants();
        } else {
            toast('Failed to approve request');
        }
    } catch (err) {
        console.error('Error approving request:', err);
        toast('Error approving request');
    }
}

// Reject join request
async function rejectJoinRequest(userId) {
    try {
        const res = await fetch(`/api/meetings/${MR.roomCode}/reject`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId })
        });
        const data = await res.json();
        if (data.success) {
            toast('Join request declined');
            await fetchParticipants();
        } else {
            toast('Failed to decline request');
        }
    } catch (err) {
        console.error('Error declining request:', err);
        toast('Error declining request');
    }
}

//  Polling 
function startPolling() {
    fetchChat();
    fetchParticipants();
    MR.chatPollTimer = setInterval(fetchChat, 3000);
    MR.participantsPollTimer = setInterval(checkMeetingAndParticipants, 5000);
    // Heartbeat every 10s to keep presence active
    MR.heartbeatTimer = setInterval(updatePresence, 10000);
}

// Poll meeting status  auto-kick non-host if host ended meeting
async function checkMeetingAndParticipants() {
    try {
        const res = await fetch(`/api/meetings/${MR.roomCode}`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();

        // If meeting ended (host clicked End), force all participants to leave
        if (data.success && !data.data.isActive && MR.joined) {
            stopPolling();
            MR.joined = false;
            if (MR.localStream) MR.localStream.getTracks().forEach(t => t.stop());
            qs('meetingRoom').style.display = 'none';

            // Show "Class Completed" screen
            const leftCard = qs('leftScreen').querySelector('.left-card');
            if (leftCard) {
                leftCard.innerHTML = `
                    <i class="fas fa-check-circle" style="font-size:3.5rem; color:#22c55e; margin-bottom:1.5rem;"></i>
                    <h2>Class Completed</h2>
                    <p style="color:#94a3b8; margin-bottom:2rem;">${MR.meetingTitle}</p>
                    <p style="color:#64748b; font-size:0.9rem; margin-bottom:2rem;">The teacher has ended the class. See you next time!</p>
                    <div class="left-actions">
                        <button class="left-btn primary" onclick="goHome()"><i class="fas fa-home"></i> Return to Dashboard</button>
                    </div>
                `;
            }
            qs('leftScreen').style.display = 'flex';
            return; // skip participants fetch
        }
    } catch (err) { /* ignore  keep polling */ }
    await fetchParticipants();
}

function stopPolling() {
    clearInterval(MR.chatPollTimer);
    clearInterval(MR.participantsPollTimer);
    clearInterval(MR.heartbeatTimer);
}

//  Copy link 
function copyMeetingLink() {
    const link = `${window.location.origin}/meeting-room.html?room=${MR.roomCode}&title=${encodeURIComponent(MR.meetingTitle)}`;
    navigator.clipboard.writeText(link).then(() => toast('Meeting link copied to clipboard'))
        .catch(() => toast('Could not copy link'));
}

//  End Meeting (host only) 
async function endMeetingForAll() {
    if (!confirm('End the meeting for everyone? The join link will expire and cannot be reused.')) return;

    stopPolling();
    
    // Dispose Jitsi instance
    if (jitsiAPI) {
        jitsiAPI.dispose();
        jitsiAPI = null;
    }
    
    try {
        await fetch(`/api/meetings/${MR.roomCode}/end`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' }
        });
        toast('Meeting ended. The join link has been expired.');
    } catch (err) {
        console.error('endMeeting error:', err);
    }

    if (MR.localStream) MR.localStream.getTracks().forEach(t => t.stop());
    if (MR.screenStream) MR.screenStream.getTracks().forEach(t => t.stop());

    qs('meetingRoom').style.display = 'none';

    // Show a special "ended" left screen
    const leftCard = qs('leftScreen').querySelector('.left-card');
    if (leftCard) {
        leftCard.innerHTML = `
            <i class="fas fa-stop-circle" style="font-size:3.5rem; color:#ef4444; margin-bottom:1.5rem;"></i>
            <h2>Meeting Ended</h2>
            <p id="leftMeetingName" style="color:#94a3b8; margin-bottom:2rem;">${MR.meetingTitle}</p>
            <p style="color:#64748b; font-size:0.9rem; margin-bottom:2rem;">The join link has been expired. Generate a new meeting room for your next class.</p>
            <div class="left-actions">
                <button class="left-btn primary" onclick="goHome()"><i class="fas fa-home"></i> Return to Dashboard</button>
            </div>
        `;
    }
    qs('leftScreen').style.display = 'flex';
}

//  Leave 
async function leaveMeeting() {
    stopPolling();
    
    // Dispose Jitsi instance
    if (jitsiAPI) {
        jitsiAPI.dispose();
        jitsiAPI = null;
    }
    
    try {
        await fetch(`/api/meetings/${MR.roomCode}/leave`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: MR.user.name })
        });
    } catch (err) { /* ignore */ }

    if (MR.localStream) MR.localStream.getTracks().forEach(t => t.stop());
    if (MR.screenStream) MR.screenStream.getTracks().forEach(t => t.stop());

    qs('meetingRoom').style.display = 'none';
    qs('leftScreen').style.display = 'flex';
}

function goHome() {
    const role = MR.user.role;
    const dashboards = {
        'student': 'student-dashboard.html',
        'teacher': 'teacher-dashboard.html',
        'hod': 'HOD-dashboard.html',
        'managing_authority': 'managing-authority.html',
        'admin': 'admin-dashboard.html'
    };
    window.location.href = dashboards[role] || 'index.html';
}

// Clean up media on unload
window.addEventListener('beforeunload', () => {
    if (MR.localStream) MR.localStream.getTracks().forEach(t => t.stop());
    if (MR.screenStream) MR.screenStream.getTracks().forEach(t => t.stop());
});
