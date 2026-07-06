const express = require('express');
const {
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
} = require('../controllers/meeting.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

// Create a meeting (teacher, hod, principal)
router.post('/', createMeeting);

// Room-specific actions
router.get('/:roomCode', getMeeting);
router.post('/:roomCode/join', joinMeeting);
router.put('/:roomCode/presence', updatePresence);
router.get('/:roomCode/participants', getParticipants);
router.post('/:roomCode/leave', leaveMeeting);
router.get('/:roomCode/chat', getChat);
router.post('/:roomCode/chat', sendChat);
router.post('/:roomCode/end', endMeeting);
router.post('/:roomCode/approve', approveJoinRequest);
router.post('/:roomCode/reject', rejectJoinRequest);

module.exports = router;

module.exports = router;
