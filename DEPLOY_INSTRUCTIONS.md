# Deployment Instructions

## Quick Deploy Checklist

### 1. Backend Deployment (Render) - CRITICAL
The backend contains the fix for time restrictions. This MUST be deployed first.

**Files Changed:**
- `backend/controllers/meeting.controller.js`

**Deploy Steps:**
1. Commit your changes:
   ```bash
   git add backend/controllers/meeting.controller.js
   git commit -m "Fix: Remove time restrictions for joining meetings, add instruction overlay"
   ```

2. Push to GitHub:
   ```bash
   git push origin main
   ```

3. Render will auto-deploy (or manually trigger deploy in Render dashboard)

4. Wait for deployment to complete (~2-3 minutes)

5. Verify deployment:
   - Visit your backend URL: `https://your-backend.onrender.com/health` (if you have a health endpoint)
   - Or test by creating a meeting

### 2. Frontend Deployment (Netlify) - AUTO
Netlify auto-deploys when you push to GitHub.

**Files Changed:**
- `frontend/js/meeting-room.js`
- `frontend/css/meeting-room.css`
- `frontend/meeting-room.html`

**Deploy Steps:**
1. Commit your changes:
   ```bash
   git add frontend/js/meeting-room.js frontend/css/meeting-room.css frontend/meeting-room.html
   git commit -m "Fix: Improve Jitsi display and approval flow"
   ```

2. Push to GitHub:
   ```bash
   git push origin main
   ```

3. Netlify will automatically deploy (check Netlify dashboard)

4. Wait for build to complete (~1-2 minutes)

### 3. Verify Everything Works

**Test as Teacher:**
1. Log in as teacher
2. Go to a class
3. Click "Start Meeting" (test 15 min before class time restriction)
4. Verify meeting room loads
5. Verify Jitsi appears with instruction overlay
6. Click "Join meeting" in Jitsi pre-join
7. Verify you're in the conference

**Test as Student:**
1. Log in as student
2. Go to dashboard
3. Verify "Join" button appears for the class
4. Click "Join"
5. Verify custom lobby appears
6. Click "Join now"
7. Verify waiting screen appears: "Waiting for Teacher Approval"
8. Have teacher accept your request
9. Verify meeting room loads automatically
10. Verify instruction overlay appears
11. Click "Join meeting" in Jitsi
12. Verify you're in the conference with teacher

**Test Approval Flow:**
1. Have multiple students request to join
2. Teacher should see pending requests count badge on participants button
3. Teacher clicks participants button
4. Teacher sees list of pending requests with Accept/Decline buttons
5. Teacher accepts one student
6. Verify student joins automatically
7. Teacher declines another student
8. Verify declined student sees error

## Important Notes

### Meeting Link Creation:
- Teachers CAN create meetings 15 minutes before scheduled class time
- Teachers CANNOT create meetings earlier than 15 minutes before

### Joining Meetings:
- Anyone can join IMMEDIATELY after meeting link is created
- NO time restrictions for joining
- Students need teacher approval (unless they're teacher/HOD)

### Jitsi Pre-Join:
- Everyone will see Jitsi's pre-join screen (this is normal)
- Users just need to click "Join meeting" button
- Takes 1 second, name is already filled

### If Issues Occur:

**"Meeting opens X minutes before scheduled time":**
- Backend not deployed yet
- Clear browser cache and reload

**Student stuck on waiting screen:**
- Teacher hasn't accepted request
- Check backend logs for errors
- Verify polling is working (check browser console)

**Jitsi not loading:**
- Check browser console for errors
- Verify internet connection
- Try different browser
- Disable browser extensions

**Name not showing:**
- Clear localStorage and log in again
- Check that backend is returning name in JWT response

## Rollback Plan

If something breaks:

1. Revert backend:
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. Revert frontend:
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

3. Redeploy from Render/Netlify dashboards

## Success Criteria

✅ Teachers can create meetings 15 min before class
✅ Students can join immediately (no time errors)
✅ Approval flow works (pending → accepted → auto-join)
✅ Jitsi loads with instruction overlay
✅ Video/audio works between participants
✅ Chat and participants panel function correctly
✅ Meeting end button works (host only)
✅ All participants see each other

## Support

If you encounter issues:
1. Check browser console (F12) for JavaScript errors
2. Check Render logs for backend errors
3. Verify environment variables in Render dashboard
4. Test in incognito mode to rule out cache issues
5. Test with multiple browsers (Chrome, Firefox, Safari)
