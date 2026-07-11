const Meeting = require('../models/Meeting');
const User = require('../models/User');
const Class = require('../models/Class');
const Message = require('../models/Message');
const { successResponse, errorResponse } = require('../utils/response.utils');

// Generate a Google-Meet-style room code: abc-defg-hij
function generateRoomCode() {
  const chars = 'abcdefghijklmnopqrstuvwxyz';
  const seg = (n) => Array.from({ length: n }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${seg(3)}-${seg(4)}-${seg(3)}`;
}

function buildMeetingLink(req, roomCode, title) {
  // The meeting link MUST point to the frontend origin (where the user is logged
  // in and their auth token lives in localStorage). Building it against the
  // backend host breaks auth: localStorage is per-origin, so the meeting page
  // opened on the backend domain has no token and every /api call returns 401
  // ("Meeting Has Ended", blank participant name, etc.).
  let base = process.env.FRONTEND_URL;
  if (!base && req.headers.origin) {
    base = req.headers.origin;
  }
  if (!base && req.headers.referer) {
    try { base = new URL(req.headers.referer).origin; } catch (_) { /* ignore */ }
  }
  // Known production frontend as a safe fallback. We intentionally avoid falling
  // back to the backend host because meeting-room.html served from the backend
  // origin has no access to the user's auth token (localStorage is per-origin).
  if (!base || /onrender\.com/i.test(base)) {
    base = 'https://educonnect-2026.netlify.app';
  }
  base = base.replace(/\/+$/, '');
  
  // Include the user's name in the URL so it pre-fills even if localStorage is empty
  const userName = req.user?.name || 'Guest';
  return `${base}/meeting-room.html?room=${roomCode}&title=${encodeURIComponent(title || 'Class Meeting')}&name=${encodeURIComponent(userName)}`;
}

/**
 * Create a meeting and notify the chosen audience.
 * POST /api/meetings
 * Body: { title, classId?, audience, scheduledDate?, scheduledTime? }
 *   audience: 'class-students' | 'all-hods' | 'department-teachers'
 * 
 * Teachers can create meetings 15 minutes before the scheduled class time.
 * Once created, anyone can join immediately (no time restrictions on joining).
 */
const createMeeting = async (req, res) => {
  try {
    const { title, classId, audience = 'class-students', scheduledDate, scheduledTime } = req.body;
    const host = await User.findById(req.user.id);
    if (!host) return errorResponse(res, 'User not found', 404);

    // TIME RESTRICTION FOR CREATION: Teachers can create meetings starting 15 minutes before scheduled time
    if (scheduledDate && scheduledTime) {
      const now = new Date();
      const [hours, minutes] = scheduledTime.split(':').map(Number);
      const scheduledDateTime = new Date(scheduledDate);
      scheduledDateTime.setHours(hours, minutes, 0, 0);
      
      // Allow creation starting 15 minutes before scheduled time
      const earlyCreateTime = new Date(scheduledDateTime.getTime() - 15 * 60 * 1000);
      
      if (now < earlyCreateTime) {
        const minutesUntilCreate = Math.ceil((earlyCreateTime - now) / (60 * 1000));
        return errorResponse(res, `You can create this meeting ${minutesUntilCreate} minutes before the scheduled time (${scheduledTime})`, 403);
      }
    }

    // Generate a unique room code
    let roomCode;
    for (let i = 0; i < 5; i++) {
      roomCode = generateRoomCode();
      const exists = await Meeting.findOne({ roomCode });
      if (!exists) break;
    }

    const meetingTitle = title || 'Class Meeting';
    const meetingLink = buildMeetingLink(req, roomCode, meetingTitle);

    const meeting = new Meeting({
      roomCode,
      title: meetingTitle,
      host: host._id,
      hostName: host.name,
      hostRole: host.role,
      classId: classId || null,
      audience,
      meetingLink,
      scheduledDate: scheduledDate || new Date().toISOString().split('T')[0],
      scheduledTime: scheduledTime || new Date().toTimeString().slice(0, 5),
      participants: [],
      chat: [],
      isActive: true,
    });
    await meeting.save();

    // ── Auto-save meeting link to the class record (so student dashboard updates immediately) ──
    if (classId) {
      await Class.findByIdAndUpdate(classId, { meetingLink });
    }
    let recipientIds = [];

    if (audience === 'all-hods') {
      // Only principal/admin can send to all HODs
      if (!['managing_authority', 'admin'].includes(host.role)) {
        return errorResponse(res, 'Only the Principal can send meetings to all HODs', 403);
      }
      const hods = await User.find({ role: 'hod', isActive: true }).select('_id');
      recipientIds = hods.map(h => h._id);
    } else if (audience === 'department-teachers') {
      // Only HOD can send to their department teachers
      if (!['hod', 'admin'].includes(host.role)) {
        return errorResponse(res, 'Only HODs can send meetings to department teachers', 403);
      }
      const teachers = await User.find({
        role: 'teacher',
        department: host.department,
        isActive: true,
      }).select('_id');
      recipientIds = teachers.map(t => t._id);
    } else {
      // class-students: notify all students in the class
      if (classId) {
        const cls = await Class.findById(classId).select('students');
        if (cls && cls.students) recipientIds = cls.students;
      } else {
        // fallback: notify all students in host's department
        const students = await User.find({
          role: 'student',
          department: host.department,
          isActive: true,
        }).select('_id');
        recipientIds = students.map(s => s._id);
      }
    }

    let notified = 0;
    if (recipientIds.length > 0) {
      const audienceLabel = audience === 'all-hods' ? 'All HODs'
        : audience === 'department-teachers' ? 'Department Teachers'
        : 'class students';

      const dateTimeInfo = scheduledDate && scheduledTime 
        ? `\nScheduled for: ${scheduledDate} at ${scheduledTime}`
        : '';

      const content = `Dear participant,\n\n${host.name} has started a live virtual meeting: "${meetingTitle}".${dateTimeInfo}\n\nJoin using this link:\n${meetingLink}\n\nRoom code: ${roomCode}\n\nClick the link to join the meeting room.`;

      const msg = new Message({
        sender: host._id,
        recipients: recipientIds,
        subject: `🎥 Live Meeting: ${meetingTitle}`,
        content,
        isDraft: false,
      });
      await msg.save();
      notified = recipientIds.length;
    }

    successResponse(res, {
      meeting: {
        roomCode: meeting.roomCode,
        title: meeting.title,
        meetingLink: meeting.meetingLink,
        audience: meeting.audience,
        scheduledDate: meeting.scheduledDate,
        scheduledTime: meeting.scheduledTime,
      },
      notified,
    }, `Meeting created. ${notified} participant(s) notified.`, 201);
  } catch (error) {
    errorResponse(res, 'Failed to create meeting', 500, error.message);
  }
};

/** Get meeting details by room code  — GET /api/meetings/:roomCode */
const getMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ roomCode: req.params.roomCode });
    if (!meeting) return errorResponse(res, 'Meeting not found', 404);
    successResponse(res, {
      roomCode: meeting.roomCode,
      title: meeting.title,
      hostName: meeting.hostName,
      hostId: meeting.host,
      isActive: meeting.isActive,
      meetingLink: meeting.meetingLink,
      scheduledDate: meeting.scheduledDate,
      scheduledTime: meeting.scheduledTime,
    }, 'Meeting fetched');
  } catch (error) {
    errorResponse(res, 'Failed to fetch meeting', 500, error.message);
  }
};

/** Join meeting (register presence) — POST /api/meetings/:roomCode/join */
const joinMeeting = async (req, res) => {
  try {
    const { name, micOn = true, camOn = true } = req.body;

    // ALWAYS use the server-side role from the JWT — never trust the client-sent role
    const authUser = await User.findById(req.user.id).select('name role');
    const trustedRole = authUser ? authUser.role : 'student';
    const trustedName = name || (authUser ? authUser.name : 'Guest');

    let meeting = await Meeting.findOne({ roomCode: req.params.roomCode });

    // If meeting doesn't exist in DB, create it on-the-fly
    if (!meeting) {
      meeting = new Meeting({
        roomCode: req.params.roomCode,
        title: 'Class Meeting',
        host: req.user.id,
        hostName: trustedName,
        hostRole: trustedRole,
        isActive: true,
        participants: [],
        chat: [],
      });
      await meeting.save();
    }

    // Check if meeting is active
    if (!meeting.isActive) {
      return errorResponse(res, 'Meeting has ended', 403);
    }

    // NO TIME RESTRICTIONS FOR JOINING
    // Anyone can join anytime after the meeting link is created
    // Time restrictions only apply to meeting CREATION (handled in createMeeting)

    const existing = meeting.participants.find(p => p.userId && p.userId.toString() === req.user.id);
    
    // Check if user is host
    const isHost = meeting.host.toString() === req.user.id;
    
    if (existing) {
      // Update existing participant
      existing.active = true;
      existing.micOn = micOn;
      existing.camOn = camOn;
      existing.lastSeen = new Date();
      existing.name = trustedName;
      existing.role = trustedRole;
      
      // If previously rejected and trying to rejoin, reset to pending (unless host)
      if (existing.status === 'rejected' && !isHost) {
        existing.status = 'pending';
      }
      // Hosts are always accepted
      if (isHost && existing.status !== 'accepted') {
        existing.status = 'accepted';
      }
    } else {
      // Add new participant
      // Hosts and teachers are auto-accepted, students need approval
      const status = isHost || ['teacher', 'hod', 'managing_authority', 'admin'].includes(trustedRole) ? 'accepted' : 'pending';
      
      meeting.participants.push({
        userId: req.user.id,
        name: trustedName,
        role: trustedRole,
        status: status,
        micOn, 
        camOn,
        joinedAt: new Date(),
        lastSeen: new Date(),
        active: true,
      });
    }
    
    await meeting.save();
    
    const participant = meeting.participants.find(p => p.userId && p.userId.toString() === req.user.id);
    
    successResponse(res, { 
      roomCode: meeting.roomCode, 
      role: trustedRole, 
      name: trustedName,
      status: participant ? participant.status : 'pending',
      isHost: isHost
    }, participant && participant.status === 'pending' ? 'Join request sent to teacher' : 'Joined meeting');
  } catch (error) {
    errorResponse(res, 'Failed to join meeting', 500, error.message);
  }
};

/** Update presence (mic/cam/hand) — PUT /api/meetings/:roomCode/presence */
const updatePresence = async (req, res) => {
  try {
    const { micOn, camOn, handRaised } = req.body;
    const meeting = await Meeting.findOne({ roomCode: req.params.roomCode });
    if (!meeting) return errorResponse(res, 'Meeting not found', 404);

    const p = meeting.participants.find(pp => pp.userId && pp.userId.toString() === req.user.id);
    if (p) {
      if (micOn !== undefined) p.micOn = micOn;
      if (camOn !== undefined) p.camOn = camOn;
      if (handRaised !== undefined) p.handRaised = handRaised;
      p.lastSeen = new Date();
      await meeting.save();
    }
    successResponse(res, null, 'Presence updated');
  } catch (error) {
    errorResponse(res, 'Failed to update presence', 500, error.message);
  }
};

/** Get participants — GET /api/meetings/:roomCode/participants */
const getParticipants = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ roomCode: req.params.roomCode });
    if (!meeting) return errorResponse(res, 'Meeting not found', 404);

    // Active = seen in the last 30 seconds (poll interval is 5s, allow some buffer)
    const cutoff = Date.now() - 30000;
    const active = meeting.participants.filter(p => p.active && new Date(p.lastSeen).getTime() > cutoff);

    // Separate pending and accepted participants
    const accepted = active.filter(p => p.status === 'accepted');
    const pending = active.filter(p => p.status === 'pending');

    successResponse(res, {
      participants: accepted.map(p => ({
        userId: p.userId,
        name: p.name, 
        role: p.role, 
        micOn: p.micOn, 
        camOn: p.camOn, 
        handRaised: p.handRaised,
        status: p.status
      })),
      pendingRequests: pending.map(p => ({
        userId: p.userId,
        name: p.name,
        role: p.role,
        status: p.status
      })),
      hostId: meeting.host
    }, 'Participants fetched');
  } catch (error) {
    errorResponse(res, 'Failed to fetch participants', 500, error.message);
  }
};

/** Leave meeting — POST /api/meetings/:roomCode/leave */
const leaveMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ roomCode: req.params.roomCode });
    if (!meeting) return errorResponse(res, 'Meeting not found', 404);
    const p = meeting.participants.find(pp => pp.userId && pp.userId.toString() === req.user.id);
    if (p) { p.active = false; await meeting.save(); }
    successResponse(res, null, 'Left meeting');
  } catch (error) {
    errorResponse(res, 'Failed to leave meeting', 500, error.message);
  }
};

/** Get chat — GET /api/meetings/:roomCode/chat */
const getChat = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ roomCode: req.params.roomCode });
    if (!meeting) return errorResponse(res, 'Meeting not found', 404);
    successResponse(res, {
      messages: meeting.chat.map(c => ({
        senderName: c.senderName, message: c.message, createdAt: c.createdAt,
      })),
    }, 'Chat fetched');
  } catch (error) {
    errorResponse(res, 'Failed to fetch chat', 500, error.message);
  }
};

/** Send chat message — POST /api/meetings/:roomCode/chat */
const sendChat = async (req, res) => {
  try {
    const { message, senderName } = req.body;
    if (!message || !message.trim()) return errorResponse(res, 'Message is required', 400);

    const meeting = await Meeting.findOne({ roomCode: req.params.roomCode });
    if (!meeting) return errorResponse(res, 'Meeting not found', 404);

    meeting.chat.push({
      senderId: req.user.id,
      senderName: senderName || 'Guest',
      message: message.trim(),
      createdAt: new Date(),
    });
    // Cap chat history at 200 messages
    if (meeting.chat.length > 200) meeting.chat = meeting.chat.slice(-200);
    await meeting.save();

    successResponse(res, null, 'Message sent');
  } catch (error) {
    errorResponse(res, 'Failed to send message', 500, error.message);
  }
};

/** End meeting — POST /api/meetings/:roomCode/end */
const endMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ roomCode: req.params.roomCode });
    if (!meeting) return errorResponse(res, 'Meeting not found', 404);
    if (meeting.host.toString() !== req.user.id) {
      return errorResponse(res, 'Only the host can end the meeting', 403);
    }
    meeting.isActive = false;
    meeting.endedAt = new Date();
    await meeting.save();

    // Clear the meeting link on the associated class so a new one can be generated next time
    if (meeting.classId) {
      await Class.findByIdAndUpdate(meeting.classId, {
        meetingLink: '',
        // Keep mode as virtual — host just needs to create a new room for next class
      });
    }

    successResponse(res, null, 'Meeting ended. The join link has been expired.');
  } catch (error) {
    errorResponse(res, 'Failed to end meeting', 500, error.message);
  }
};

/** Approve join request — POST /api/meetings/:roomCode/approve */
const approveJoinRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    const meeting = await Meeting.findOne({ roomCode: req.params.roomCode });

    if (!meeting) return errorResponse(res, 'Meeting not found', 404);

    // Only the meeting host (the person who created/started it) can approve
    if (meeting.host.toString() !== req.user.id) {
      return errorResponse(res, 'Only the meeting host can approve join requests', 403);
    }

    const participant = meeting.participants.find(
      p => p.userId && p.userId.toString() === userId
    );
    if (!participant) {
      return errorResponse(res, 'Participant not found', 404);
    }

    participant.status = 'accepted';
    await meeting.save();

    successResponse(res, null, 'Join request approved');
  } catch (error) {
    errorResponse(res, 'Failed to approve request', 500, error.message);
  }
};

/** Reject join request — POST /api/meetings/:roomCode/reject */
const rejectJoinRequest = async (req, res) => {
  try {
    const { userId } = req.body;
    const meeting = await Meeting.findOne({ roomCode: req.params.roomCode });
    
    if (!meeting) return errorResponse(res, 'Meeting not found', 404);
    
    // Only the meeting host can reject
    if (meeting.host.toString() !== req.user.id) {
      return errorResponse(res, 'Only the meeting host can reject join requests', 403);
    }

    const participant = meeting.participants.find(p => p.userId && p.userId.toString() === userId);
    if (!participant) {
      return errorResponse(res, 'Participant not found', 404);
    }
    
    participant.status = 'rejected';
    participant.active = false;
    await meeting.save();
    
    successResponse(res, null, 'Join request rejected');
  } catch (error) {
    errorResponse(res, 'Failed to reject request', 500, error.message);
  }
};

module.exports = {
  createMeeting,
  getMeeting,
  joinMeeting,
  updatePresence,
  getParticipants,
  leaveMeeting,
  getChat,
  sendChat,
  endMeeting,
  approveJoinRequest,
  rejectJoinRequest,
};
