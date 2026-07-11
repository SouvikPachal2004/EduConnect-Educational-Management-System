# EduConnect Meeting Room — Quick Reference Guide

## 🎯 What's Working Now

The meeting room is **completely rewritten** and works exactly like **Google Meet**:
- ✅ Multiple users connected globally in the same room
- ✅ Real-time video/audio via Jitsi
- ✅ Approval flow (students wait → teacher accepts → auto-enter)
- ✅ In-meeting chat (both sides can send/receive)
- ✅ Participants panel (shows all users with mic/cam status)
- ✅ Clean end-meeting behavior (link expires, Join button disappears)

---

## 🔄 Complete User Flow

### 1️⃣ Teacher/HOD Creates Meeting

```
HOD Dashboard → Select Class → Start Class button
                     ↓
            Meeting link created
                     ↓
Class status changes to "Live — Join Meeting" (green)
                     ↓
Student dashboard auto-updates within 5 seconds
                     ↓
            Join button appears
```

**No time restrictions:** Teachers can create meetings at any time.  
**Auto-notification:** Students' dashboards update automatically (5s poll).

---

### 2️⃣ Student Joins & Waits for Approval

```
Student clicks Join → Lobby (camera preview)
                     ↓
          Student clicks "Join now"
                     ↓
    POST /api/meetings/:roomCode/join
                     ↓
   Backend adds participant (status='pending')
                     ↓
        "Waiting for Approval" screen
                     ↓
    Frontend polls every 3 seconds
                     ↓
        (Teacher accepts in step 3)
                     ↓
  Poll detects status='accepted'
                     ↓
    Jitsi iframe loads automatically
                     ↓
          Student in meeting!
```

**No page refresh:** Student screen auto-updates when approved.  
**No blank screen:** Jitsi loads directly via iframe.

---

### 3️⃣ Teacher Approves & Both Connect

```
Teacher opens meeting room → Jitsi loads
                     ↓
      Participants panel shows badge (e.g., "1")
                     ↓
        Teacher clicks "Accept"
                     ↓
 POST /api/meetings/:roomCode/approve
                     ↓
   Backend sets participant.status = 'accepted'
                     ↓
    Student's poll detects → auto-enters
                     ↓
Both in same Jitsi room (EduConnectabc1234xyz)
                     ↓
      Video/audio connects
```

**Global connectivity:** Both users see/hear each other.  
**Same room:** Room name is single string (no special chars).

---

### 4️⃣ Chat & Participants Work Live

**Chat:**
```
User types message → Click Send
                     ↓
      POST /api/meetings/:roomCode/chat
                     ↓
           Message saved in DB
                     ↓
     Other users poll every 3 seconds
                     ↓
        Message appears (3-6s delay)
```

**Participants:**
```
         Frontend polls every 5 seconds
                     ↓
     GET /api/meetings/:roomCode/participants
                     ↓
  Returns: accepted (active) + pending (waiting)
                     ↓
   Panel updates with mic/cam icons
```

---

### 5️⃣ Teacher Ends Meeting

```
Teacher clicks "End" → Confirm dialog
                     ↓
      POST /api/meetings/:roomCode/end
                     ↓
Backend: isActive=false, meetingLink='', all inactive
                     ↓
        All clients poll → detect isActive=false
                     ↓
      Everyone sees "Class Completed" screen
                     ↓
Student dashboard 5s poll → Join button disappears
                     ↓
    HOD dashboard shows "Online"
```

**Link expiry:** Old meeting links stop working immediately.  
**Clean state:** All dashboards update within 5 seconds.

---

## 🛠️ Technical Implementation

### Frontend (meeting-room.js)

**Key Functions:**
- `joinMeeting()` → POST /join → show waiting screen
- `startApprovalPolling()` → Poll every 3s until accepted
- `enterMeetingRoom()` → Load Jitsi iframe
- `loadJitsiMeet()` → Embed Jitsi via URL with hash config
- `handleApproval(userId, approve)` → Accept/reject requests
- `checkMeetingStatus()` → Poll every 5s to detect end

**Jitsi URL Format:**
```javascript
const roomName = 'EduConnect' + roomCode.replace(/-/g, '');
const src = `https://meet.jit.si/${roomName}` +
  `#userInfo.displayName="${name}"` +
  `&config.prejoinPageEnabled=false` +
  `&config.startWithAudioMuted=${!micOn}` +
  `&config.startWithVideoMuted=${!camOn}` +
  `&config.disableDeepLinking=true` + ...
```

**No `external_api.js`:** Direct iframe embed avoids auth issues.

---

### Backend (meeting.controller.js)

**Key Endpoints:**
- `POST /api/meetings` → Create meeting, notify participants
- `POST /api/meetings/:roomCode/join` → Register participant (pending or accepted)
- `POST /api/meetings/:roomCode/approve` → Set status='accepted'
- `POST /api/meetings/:roomCode/reject` → Set status='rejected'
- `GET /api/meetings/:roomCode/participants` → Return accepted + pending
- `POST /api/meetings/:roomCode/end` → Set isActive=false, clear link

**Permission Logic:**
```javascript
// Auto-accept: hosts, teachers, HODs, admin
// Require approval: students

const isHost = meeting.host.toString() === req.user.id;
const isPrivileged = ['teacher','hod','managing_authority','admin'].includes(role);
const status = isHost || isPrivileged ? 'accepted' : 'pending';
```

**Meeting Link Format:**
```javascript
const base = process.env.FRONTEND_URL || 'https://educonnect-2026.netlify.app';
return `${base}/meeting-room.html?room=${roomCode}&title=${title}&name=${userName}`;
```

**Why `FRONTEND_URL`?**  
Meeting room must open on the frontend origin to access localStorage auth token.  
Backend origin has no token → all API calls return 401.

---

## 🔑 Environment Variables (Backend)

**Must be set in Render:**
```
MONGO_URI=mongodb+srv://Educonnect:...
JWT_SECRET=EduConnect_Secret_2024
PORT=10000
NODE_ENV=production
FRONTEND_URL=https://educonnect-2026.netlify.app
```

**Critical:** `FRONTEND_URL` must match where your frontend is deployed.

---

## 📊 Database Schema (Meeting Model)

```javascript
{
  roomCode: String,          // "abc-defg-hij"
  title: String,             // "DSA - Section A"
  host: ObjectId,            // Teacher/HOD who created
  hostName: String,
  hostRole: String,
  classId: ObjectId,         // Associated class
  meetingLink: String,       // Full URL to meeting room
  isActive: Boolean,         // false when ended
  participants: [
    {
      userId: ObjectId,
      name: String,
      role: String,
      status: String,        // 'pending' | 'accepted' | 'rejected'
      micOn: Boolean,
      camOn: Boolean,
      handRaised: Boolean,
      active: Boolean,       // false when left
      lastSeen: Date
    }
  ],
  chat: [
    {
      senderId: ObjectId,
      senderName: String,
      message: String,
      createdAt: Date
    }
  ],
  scheduledDate: String,
  scheduledTime: String,
  createdAt: Date,
  endedAt: Date
}
```

---

## 🐛 Common Issues & Fixes

### Issue: "Failed to approve request"
**Cause:** Backend not deployed  
**Fix:** Deploy latest code (commit `194eaa6`) on Render

### Issue: Student meeting room blank
**Cause:** Jitsi iframe not loading  
**Fix:** Check console for errors, clear cache (Ctrl+Shift+R)

### Issue: "eight.auth0.com refused"
**Cause:** Old code with `external_api.js` cached  
**Fix:** Clear cache, verify Netlify deployed latest commit

### Issue: Users in separate rooms
**Cause:** Room name mismatch  
**Fix:** Verify both joined via same link, check room code matches

### Issue: Join button not appearing
**Cause:** Frontend poll not running or link not saved  
**Fix:** Check console, verify backend returned `meetingLink`

### Issue: Meeting link persists after End
**Cause:** Backend not clearing link  
**Fix:** Verify latest backend deployed, check logs

---

## 🎨 UI/UX Features

### Lobby Screen
- Camera/mic preview
- Toggle controls
- Pre-filled name from localStorage
- Clean "Join now" button

### Meeting Room
- Jitsi iframe (full video grid)
- Top bar: meeting title, clock, room code, copy link
- Bottom controls: mic, cam, screen, hand, leave
- Side panels: chat, participants
- End button (only for hosts/teachers)

### Waiting Screen
- Spinning icon
- "Waiting for Approval" message
- Cancel button

### End Screen
- Green checkmark (completed) or red stop (ended by teacher)
- "Class Completed" or "Meeting Ended"
- "Return to Dashboard" button

---

## 🚀 Performance

- **Approval detection:** 3-6 seconds (polls every 3s)
- **Chat delivery:** 3-6 seconds (polls every 3s)
- **Participants update:** 5-10 seconds (polls every 5s)
- **Meeting end detection:** 5-10 seconds (polls every 5s)
- **Join button appear:** 5-10 seconds (dashboard polls every 5s)

**No WebSockets:** Uses simple HTTP polling for simplicity.  
**Why?** Reliable, no connection issues, works everywhere.

---

## 📈 Scalability

**Current Limits:**
- Meeting participants: Unlimited (Jitsi handles it)
- Chat history: 200 messages (auto-trimmed)
- Active meetings: Unlimited (MongoDB)
- Concurrent users: Depends on Render/Netlify plan

**Jitsi Limits:**
- Free tier: ~50 participants per room (recommended)
- For larger classes: upgrade to Jitsi 8x8 paid plan or self-host

---

## 🔒 Security

- All routes protected by JWT middleware
- Only hosts/teachers can approve/reject/end
- Meeting links expire when ended
- userId always validated on backend (never trust client)
- Role checked from database (not from JWT claim)

---

## 📝 Future Enhancements (Optional)

- [ ] Recording (via Jitsi recording API)
- [ ] Breakout rooms (create sub-meetings)
- [ ] Polls (quick in-meeting surveys)
- [ ] Screen annotations (draw on shared screen)
- [ ] Attendance auto-mark (on join)
- [ ] Meeting analytics (duration, participants, chat count)

---

## 🎓 How It Compares to Google Meet

| Feature | Google Meet | EduConnect Meet |
|---------|-------------|-----------------|
| Video/audio | ✅ WebRTC | ✅ Jitsi (WebRTC) |
| Approval flow | ✅ Knock + admit | ✅ Pending + accept |
| Chat | ✅ Real-time | ✅ Polling (3s) |
| Participants | ✅ Real-time | ✅ Polling (5s) |
| Screen share | ✅ Built-in | ✅ Jitsi button |
| Recording | ✅ Cloud | ❌ Not yet |
| Breakout rooms | ✅ Yes | ❌ Not yet |
| Mobile app | ✅ Yes | ✅ Web-based (works on mobile browsers) |

---

## ✅ Production Checklist

- [x] Code complete and tested
- [x] Backend deployed on Render
- [x] Frontend deployed on Netlify
- [x] Environment variables set
- [x] MongoDB connected
- [x] Meeting creation works
- [x] Student join works
- [x] Approval flow works
- [x] Video/audio connects
- [x] Chat works
- [x] Participants panel works
- [x] End meeting works
- [x] Links expire correctly
- [x] Multiple students supported
- [x] Documentation complete

---

**Status:** ✅ PRODUCTION READY  
**Last Updated:** January 11, 2025  
**Version:** 2.0 (Complete Rewrite)

