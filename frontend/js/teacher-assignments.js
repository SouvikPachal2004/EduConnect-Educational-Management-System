/**
 * teacher-assignments.js
 * Dynamic Assignments + Resources for Teacher and HOD dashboards
 */

'use strict';

// ─── State ───────────────────────────────────────────────────────────────────
let _teacherClasses   = [];     // teacher's classes
let _allAsgFilter     = 'all';  // current filter: all / published / pending_grade / draft
let _allAsgData       = [];     // cached assignments
let _allResources     = [];     // cached resources
let _currentResFilter = 'all';  // resource tab filter

// ─── HOD state ───────────────────────────────────────────────────────────────
let _hodClasses  = [];
let _hodAsgFilter = 'all';
let _hodAsgData   = [];

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    const isTeacher = !!document.getElementById('assignmentListContainer');
    const isHod     = !!document.getElementById('hodAssignmentListContainer');

    if (isTeacher) {
        // Lazy-load on sidebar click
        document.querySelectorAll('.sidebar-menu a[data-section]').forEach(link => {
            link.addEventListener('click', function () {
                const sec = this.dataset.section;
                if (sec === 'assignments') setTimeout(initTeacherAssignments, 80);
                if (sec === 'resources')   setTimeout(initTeacherResources, 80);
            });
        });

        // Wire forms
        const asgForm = document.getElementById('createAssignmentForm');
        if (asgForm) {
            asgForm.addEventListener('submit', function (e) { e.preventDefault(); doCreateAssignment(); });
        }
        const resForm = document.getElementById('teacherResourceForm');
        if (resForm) {
            resForm.addEventListener('submit', function (e) { e.preventDefault(); doTeacherUploadResource(); });
        }

        // Pre-load
        setTimeout(initTeacherAssignments, 500);
        setTimeout(initTeacherResources, 600);
    }

    if (isHod) {
        document.querySelectorAll('.sidebar-menu a[data-section]').forEach(link => {
            link.addEventListener('click', function () {
                if (this.dataset.section === 'hodassignments') setTimeout(initHodAssignments, 80);
            });
        });

        const hodForm = document.getElementById('hodCreateAssignmentForm');
        if (hodForm) {
            hodForm.addEventListener('submit', function (e) { e.preventDefault(); doHodCreateAssignment(); });
        }

        // Load HOD classes for modal (uses same /api/classes endpoint)
        setTimeout(loadHodClassesForModal, 800);
    }
});

// ─── Utility ─────────────────────────────────────────────────────────────────
function getToken() { return localStorage.getItem('authToken') || ''; }

function tNotify(msg, type = 'info') {
    if (typeof showNotification === 'function') { showNotification(msg, type); return; }
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;bottom:1.5rem;right:1.5rem;padding:0.8rem 1.4rem;border-radius:10px;
        font-size:0.9rem;font-weight:600;color:#fff;z-index:99999;font-family:inherit;
        background:${type==='success'?'#22c55e':type==='error'?'#ef4444':'#667eea'};
        box-shadow:0 4px 16px rgba(0,0,0,0.15);`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

function escH(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function fmtDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
}

function fmtDateTime(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
}

function fmtSize(bytes) {
    if (!bytes) return '—';
    return bytes > 1048576 ? `${(bytes/1048576).toFixed(1)} MB` : `${(bytes/1024).toFixed(0)} KB`;
}

function getFileIcon(name, type) {
    const ext = ((name || '') + (type || '')).toLowerCase();
    if (ext.includes('pdf'))  return 'fa-file-pdf';
    if (ext.includes('doc') || ext.includes('word')) return 'fa-file-word';
    if (ext.includes('ppt') || ext.includes('powerpoint')) return 'fa-file-powerpoint';
    if (ext.includes('xls') || ext.includes('excel')) return 'fa-file-excel';
    if (ext.includes('mp4') || ext.includes('video') || ext.includes('avi')) return 'fa-file-video';
    if (ext.includes('jpg') || ext.includes('png') || ext.includes('image')) return 'fa-file-image';
    if (ext.includes('zip') || ext.includes('rar')) return 'fa-file-archive';
    return 'fa-file';
}

// ═══════════════════════════════════════════════════════
// TEACHER — ASSIGNMENTS
// ═══════════════════════════════════════════════════════

async function initTeacherAssignments() {
    await loadTeacherClasses();
    await loadTeacherAssignments();
}

async function loadTeacherClasses() {
    const token = getToken();
    try {
        const res  = await fetch('/api/classes', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        _teacherClasses = data.success ? (data.data.classes || []) : [];

        // Populate assignment class select
        const asgSel = document.getElementById('assignmentClass');
        if (asgSel) {
            asgSel.innerHTML = '<option value="">Select a class...</option>' +
                _teacherClasses.map(c => `<option value="${c._id}">${escH(c.name)} (${escH(c.code||'')})</option>`).join('');
        }

        // Populate resource class select
        const resSel = document.getElementById('tResClass');
        if (resSel) {
            resSel.innerHTML = '<option value="">Select a class...</option>' +
                _teacherClasses.map(c => `<option value="${c._id}">${escH(c.name)}</option>`).join('');
        }

        // Populate filter dropdown
        const filterSel = document.getElementById('asgClassFilter');
        if (filterSel) {
            filterSel.innerHTML = '<option value="">All Classes</option>' +
                _teacherClasses.map(c => `<option value="${c._id}">${escH(c.name)}</option>`).join('');
        }
    } catch (err) {
        console.error('loadTeacherClasses:', err);
    }
}

async function loadTeacherAssignments() {
    const container = document.getElementById('assignmentListContainer');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center;padding:2rem;color:#94a3b8;"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    const token   = getToken();
    const classId = document.getElementById('asgClassFilter')?.value || '';
    let url = '/api/assignments';
    if (classId) url += `?classId=${classId}`;

    try {
        const res  = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        _allAsgData = data.success ? (data.data.assignments || []) : [];

        // Update stats
        updateAsgStats(_allAsgData, 'teacher');
        renderTeacherAssignments();
    } catch (err) {
        console.error('loadTeacherAssignments:', err);
        container.innerHTML = '<div style="text-align:center;padding:2rem;color:#ef4444;">Failed to load assignments.</div>';
    }
}

function updateAsgStats(assignments, role) {
    const prefix = role === 'hod' ? 'hodAsg' : 'asg';
    const total    = assignments.length;
    const published= assignments.filter(a => a.status === 'published').length;
    const drafts   = assignments.filter(a => a.status === 'draft').length;

    // Pending grade: published with ungraded submissions
    let pendingGrade = 0;
    assignments.forEach(a => {
        if (a.status === 'published' && a.submissionCount > 0 && a.ungradedCount > 0) pendingGrade++;
    });

    const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    if (role === 'hod') {
        setEl('hodAsgTotal', total); setEl('hodAsgPending', pendingGrade);
        setEl('hodAsgPublished', published); setEl('hodAsgDrafts', drafts);
    } else {
        setEl('asgTotalCount', total); setEl('asgPendingGrade', pendingGrade);
        setEl('asgPublishedCount', published); setEl('asgDraftCount', drafts);
    }
}

function setAsgFilter(filter, btn) {
    _allAsgFilter = filter;
    document.querySelectorAll('.asg-tab').forEach(b => {
        b.style.color = '#64748b';
        b.style.borderBottomColor = 'transparent';
    });
    btn.style.color = '#667eea';
    btn.style.borderBottomColor = '#667eea';
    renderTeacherAssignments();
}

function renderTeacherAssignments() {
    const container = document.getElementById('assignmentListContainer');
    if (!container) return;

    let filtered = _allAsgData;
    if (_allAsgFilter === 'published')     filtered = _allAsgData.filter(a => a.status === 'published');
    if (_allAsgFilter === 'draft')         filtered = _allAsgData.filter(a => a.status === 'draft');
    if (_allAsgFilter === 'pending_grade') filtered = _allAsgData.filter(a => a.status === 'published');

    if (!filtered.length) {
        container.innerHTML = `<div style="text-align:center;padding:3rem;color:#94a3b8;">
            <i class="fas fa-tasks" style="font-size:2.5rem;opacity:0.2;display:block;margin-bottom:0.75rem;"></i>
            <p>No assignments found. <a href="#" onclick="openCreateAssignmentModal();return false;" style="color:#667eea;">Create one</a></p>
        </div>`;
        return;
    }

    container.innerHTML = filtered.map(a => buildAssignmentCard(a, 'teacher')).join('');
}

function buildAssignmentCard(a, role) {
    const due       = new Date(a.dueDate);
    const now       = new Date();
    const isOverdue = due < now;
    const diffDay   = Math.ceil((due - now) / 86400000);
    const dueLabel  = isOverdue ? 'Overdue' : diffDay === 0 ? 'Due Today!' : `Due in ${diffDay}d`;
    const dueColor  = isOverdue ? '#ef4444' : diffDay <= 3 ? '#f59e0b' : '#22c55e';
    const className = a.class?.name || '—';
    const statusColor = a.status === 'published' ? '#22c55e' : a.status === 'draft' ? '#94a3b8' : '#f59e0b';
    const statusLabel = a.status === 'published' ? 'Published' : a.status === 'draft' ? 'Draft' : a.status;

    const viewBtn    = role === 'hod'
        ? `onclick="viewHodSubmissions('${a._id}','${escH(a.title).replace(/'/g,"\\'")}',${a.maxPoints})"`
        : `onclick="viewTeacherSubmissions('${a._id}','${escH(a.title).replace(/'/g,"\\'")}',${a.maxPoints})"`;
    const deleteBtn  = role === 'hod'
        ? `onclick="deleteHodAssignment('${a._id}','${escH(a.title).replace(/'/g,"\\'")}',this)"`
        : `onclick="deleteTeacherAssignment('${a._id}','${escH(a.title).replace(/'/g,"\\'")}',this)"`;

    // Publish button — only shown for drafts
    const publishBtn = a.status === 'draft' ? (role === 'hod'
        ? `<button onclick="publishAssignment('${a._id}', 'hod', this)"
               style="padding:0.4rem 0.9rem;background:#22c55e;color:#fff;border:none;border-radius:8px;
                      cursor:pointer;font-size:0.82rem;font-weight:600;font-family:inherit;white-space:nowrap;margin-bottom:0.4rem;">
               <i class="fas fa-paper-plane"></i> Publish
           </button>`
        : `<button onclick="publishAssignment('${a._id}', 'teacher', this)"
               style="padding:0.4rem 0.9rem;background:#22c55e;color:#fff;border:none;border-radius:8px;
                      cursor:pointer;font-size:0.82rem;font-weight:600;font-family:inherit;white-space:nowrap;margin-bottom:0.4rem;">
               <i class="fas fa-paper-plane"></i> Publish
           </button>`) : '';
    const attachHtml = a.attachments?.length
        ? `<div style="margin-top:0.4rem;display:flex;flex-wrap:wrap;gap:0.4rem;">
            ${a.attachments.map(att => `
                <a href="/api/assignments/${a._id}/download/${encodeURIComponent(att.fileName)}"
                   target="_blank"
                   style="font-size:0.75rem;color:#667eea;background:#ede9fe;padding:0.15rem 0.5rem;border-radius:4px;text-decoration:none;">
                    📎 ${escH(att.fileName)}
                </a>
            `).join('')}
           </div>` : '';

    return `
    <div style="border:1px solid #e2e8f0;border-radius:12px;padding:1rem;margin-bottom:0.75rem;background:#fff;
                border-left:4px solid ${statusColor};display:flex;gap:1rem;align-items:flex-start;flex-wrap:wrap;">
        <div style="flex-shrink:0;width:42px;height:42px;border-radius:10px;background:#ede9fe;
                    display:flex;align-items:center;justify-content:center;font-size:1.1rem;">📋</div>
        <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:0.5rem;flex-wrap:wrap;">
                <div>
                    <strong style="color:#1e293b;font-size:0.95rem;">${escH(a.title)}</strong>
                    <span style="background:${statusColor}18;color:${statusColor};padding:0.15rem 0.5rem;
                                 border-radius:4px;font-size:0.75rem;font-weight:700;margin-left:0.5rem;">${statusLabel}</span>
                </div>
                <div style="font-size:0.78rem;font-weight:700;color:${dueColor};white-space:nowrap;">${dueLabel}</div>
            </div>
            <div style="font-size:0.83rem;color:#64748b;margin-top:0.3rem;">
                <i class="fas fa-book" style="color:#667eea;"></i> ${escH(className)}
                &nbsp;•&nbsp;
                <i class="fas fa-calendar"></i> ${fmtDateTime(a.dueDate)}
                &nbsp;•&nbsp;
                <i class="fas fa-star"></i> ${a.maxPoints} marks
            </div>
            <div style="font-size:0.82rem;color:#94a3b8;margin-top:0.25rem;">${escH((a.description||'').substring(0,120))}${(a.description||'').length>120?'…':''}</div>
            ${attachHtml}
        </div>
        <div style="flex-shrink:0;display:flex;flex-direction:column;gap:0.4rem;align-items:flex-end;">
            ${publishBtn}
            <button ${viewBtn}
                style="padding:0.4rem 0.9rem;background:#667eea;color:#fff;border:none;border-radius:8px;
                       cursor:pointer;font-size:0.82rem;font-weight:600;font-family:inherit;white-space:nowrap;">
                <i class="fas fa-eye"></i> View Submissions
            </button>
            <button ${deleteBtn}
                style="padding:0.35rem 0.8rem;background:#fff;color:#ef4444;border:1px solid #fecaca;border-radius:8px;
                       cursor:pointer;font-size:0.8rem;font-family:inherit;white-space:nowrap;">
                <i class="fas fa-trash"></i> Delete
            </button>
        </div>
    </div>`;
}

// Open create assignment modal — load classes first
function openCreateAssignmentModal() {
    if (_teacherClasses.length === 0) loadTeacherClasses();
    document.getElementById('createAssignmentForm')?.reset();
    document.getElementById('createAssignmentModal').style.display = 'block';
}

async function doCreateAssignment() {
    const title   = document.getElementById('assignmentTitle').value.trim();
    const classId = document.getElementById('assignmentClass').value;
    const desc    = document.getElementById('assignmentDescription').value.trim();
    const due     = document.getElementById('assignmentDueDate').value;
    const points  = document.getElementById('assignmentPoints').value;
    const file    = document.getElementById('assignmentFile').files[0];
    const draft   = document.getElementById('saveAsDraft').checked;

    if (!title || !classId || !desc || !due || !points) {
        tNotify('Please fill all required fields', 'error');
        return;
    }

    const btn = document.getElementById('createAsgSubmitBtn');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

    const fd = new FormData();
    fd.append('title', title);
    fd.append('classId', classId);
    fd.append('description', desc);
    fd.append('dueDate', due);
    fd.append('maxPoints', points);
    fd.append('status', draft ? 'draft' : 'published');
    if (file) fd.append('file', file);

    try {
        const res  = await fetch('/api/assignments', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}` },
            body: fd,
        });
        const data = await res.json();
        if (data.success) {
            tNotify(`Assignment "${title}" ${draft ? 'saved as draft' : 'published to students'}!`, 'success');
            document.getElementById('createAssignmentModal').style.display = 'none';
            document.getElementById('createAssignmentForm').reset();
            loadTeacherAssignments();
        } else {
            tNotify(data.message || 'Failed to create assignment', 'error');
        }
    } catch (err) {
        tNotify('Network error', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Create & Publish';
    }
}

// View Submissions for an assignment
async function viewTeacherSubmissions(asgId, asgTitle, maxPoints) {
    document.getElementById('submissionsAsgTitle').textContent = asgTitle;
    document.getElementById('viewSubmissionsModal').style.display = 'block';
    const container = document.getElementById('submissionsContainer');
    container.innerHTML = '<div style="text-align:center;padding:2rem;color:#94a3b8;"><i class="fas fa-spinner fa-spin"></i> Loading submissions...</div>';

    try {
        const res  = await fetch(`/api/assignments/${asgId}/submissions`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();
        const subs = data.success ? (data.data || []) : [];
        renderSubmissionsTable(subs, maxPoints, container, asgId, 'teacher');
    } catch (err) {
        container.innerHTML = '<div style="text-align:center;padding:2rem;color:#ef4444;">Failed to load submissions</div>';
    }
}

function renderSubmissionsTable(subs, maxPoints, container, asgId, role) {
    if (!subs.length) {
        container.innerHTML = '<div style="text-align:center;padding:3rem;color:#94a3b8;"><i class="fas fa-inbox" style="font-size:2rem;opacity:0.3;display:block;margin-bottom:0.5rem;"></i>No submissions yet.</div>';
        return;
    }

    container.innerHTML = `
    <div style="padding:0.75rem 1rem;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-size:0.82rem;color:#64748b;">
        <strong>${subs.length}</strong> submission${subs.length !== 1 ? 's' : ''} received
    </div>
    <div style="overflow-x:auto;">
    <table style="width:100%;border-collapse:collapse;font-size:0.88rem;">
        <thead>
            <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
                <th style="padding:0.75rem 1rem;text-align:left;font-weight:600;color:#64748b;white-space:nowrap;">Student</th>
                <th style="padding:0.75rem 1rem;text-align:left;font-weight:600;color:#64748b;white-space:nowrap;">Submitted</th>
                <th style="padding:0.75rem 1rem;text-align:left;font-weight:600;color:#64748b;white-space:nowrap;">Answer File</th>
                <th style="padding:0.75rem 1rem;text-align:center;font-weight:600;color:#64748b;white-space:nowrap;">Marks (/${maxPoints})</th>
                <th style="padding:0.75rem 1rem;text-align:center;font-weight:600;color:#64748b;white-space:nowrap;">Action</th>
            </tr>
        </thead>
        <tbody>
        ${subs.map((sub, idx) => {
            const name   = sub.student?.name || '—';
            const sid    = sub.student?.studentId || '—';
            const date   = fmtDate(sub.submittedAt);
            const att    = sub.attachments?.[0];

            // File download link
            const fileCell = att
                ? `<a href="/api/assignments/submissions/${sub._id}/download/${encodeURIComponent(att.fileName)}"
                      target="_blank"
                      style="display:inline-flex;align-items:center;gap:0.35rem;color:#667eea;font-size:0.82rem;
                             background:#ede9fe;padding:0.3rem 0.65rem;border-radius:6px;text-decoration:none;white-space:nowrap;">
                       📎 ${escH(att.fileName)}
                   </a>`
                : `<span style="color:#94a3b8;font-size:0.8rem;font-style:italic;">${escH(sub.content?.substring(0,50) || 'No file')}</span>`;

            // Marks input
            const existPts = sub.graded ? sub.points : '';
            const marksCell = `<input
                id="marks_${idx}"
                type="number" min="0" max="${maxPoints}" step="1"
                value="${existPts}"
                placeholder="0–${maxPoints}"
                style="width:80px;padding:0.4rem 0.5rem;border:1.5px solid ${sub.graded ? '#22c55e' : '#d1d5db'};
                       border-radius:7px;font-size:0.9rem;text-align:center;font-family:inherit;outline:none;"
                onfocus="this.style.borderColor='#667eea'"
                onblur="this.style.borderColor='${sub.graded ? '#22c55e' : '#d1d5db'}'"
            >`;

            // Status badge
            const statusBadge = sub.graded
                ? `<span style="font-size:0.74rem;color:#15803d;background:#dcfce7;padding:0.15rem 0.5rem;border-radius:4px;display:block;text-align:center;margin-bottom:4px;">✓ Graded: ${sub.points}/${maxPoints}</span>`
                : '';

            // Submit/Save button
            const gradeFunc = role === 'hod'
                ? `saveIndividualGrade('${sub._id}',${maxPoints},'marks_${idx}','feedback_${idx}','hod')`
                : `saveIndividualGrade('${sub._id}',${maxPoints},'marks_${idx}','feedback_${idx}','teacher')`;

            return `<tr style="border-bottom:1px solid #f1f5f9;" id="row_${sub._id}">
                <td style="padding:0.85rem 1rem;">
                    <div style="font-weight:700;color:#1e293b;">${escH(name)}</div>
                    <div style="font-size:0.75rem;color:#94a3b8;">ID: ${escH(sid)}</div>
                </td>
                <td style="padding:0.85rem 1rem;color:#64748b;font-size:0.82rem;">${date}</td>
                <td style="padding:0.85rem 1rem;">${fileCell}</td>
                <td style="padding:0.85rem 1rem;text-align:center;">
                    ${statusBadge}
                    ${marksCell}
                    <input id="feedback_${idx}" type="text" placeholder="Feedback (optional)"
                           value="${escH(sub.feedback || '')}"
                           style="width:100%;margin-top:4px;padding:0.3rem 0.5rem;border:1px solid #e2e8f0;
                                  border-radius:6px;font-size:0.78rem;font-family:inherit;outline:none;box-sizing:border-box;">
                </td>
                <td style="padding:0.85rem 1rem;text-align:center;">
                    <button onclick="${gradeFunc}"
                        style="padding:0.45rem 1rem;background:linear-gradient(135deg,#667eea,#764ba2);
                               color:#fff;border:none;border-radius:8px;cursor:pointer;
                               font-size:0.82rem;font-weight:600;font-family:inherit;white-space:nowrap;"
                        id="gradeBtn_${sub._id}">
                        ${sub.graded ? '✏️ Update' : '⭐ Submit'}
                    </button>
                </td>
            </tr>`;
        }).join('')}
        </tbody>
    </table>
    </div>`;
}

// Save individual grade inline (no separate modal needed)
async function saveIndividualGrade(subId, maxPoints, marksInputId, feedbackInputId, role) {
    const marksEl    = document.getElementById(marksInputId);
    const feedbackEl = document.getElementById(feedbackInputId);
    const points     = parseInt(marksEl?.value);
    const feedback   = feedbackEl?.value?.trim() || '';
    const btn        = document.getElementById(`gradeBtn_${subId}`);

    if (isNaN(points) || points < 0 || points > maxPoints) {
        tNotify(`Marks must be between 0 and ${maxPoints}`, 'error'); return;
    }

    if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; }

    try {
        const res  = await fetch(`/api/assignments/submissions/${subId}/grade`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ points, feedback }),
        });
        const data = await res.json();
        if (data.success) {
            tNotify(`Marks saved: ${points}/${maxPoints} ✅`, 'success');
            // Update input border to green and button text
            if (marksEl) marksEl.style.borderColor = '#22c55e';
            if (btn) { btn.disabled = false; btn.innerHTML = '✏️ Update'; }
        } else {
            tNotify(data.message || 'Failed to save marks', 'error');
            if (btn) { btn.disabled = false; btn.innerHTML = '⭐ Submit'; }
        }
    } catch (err) {
        tNotify('Network error', 'error');
        if (btn) { btn.disabled = false; btn.innerHTML = '⭐ Submit'; }
    }
}

// Grade modal
function openGradeModal(subId, maxPts, studentName, existingPts, existingFeedback) {
    document.getElementById('gradeSubId').value = subId;
    document.getElementById('gradeAsgMaxPts').value = maxPts;
    document.getElementById('gradeStudentInfo').innerHTML = `<strong>${escH(studentName)}</strong>`;
    document.getElementById('gradeMaxLabel').textContent = `(max: ${maxPts})`;
    document.getElementById('gradePoints').value = existingPts || '';
    document.getElementById('gradePoints').max = maxPts;
    document.getElementById('gradeFeedback').value = existingFeedback || '';
    document.getElementById('gradeSubmissionModal').style.display = 'block';
}

async function submitGradeFromModal() {
    const subId    = document.getElementById('gradeSubId').value;
    const maxPts   = parseInt(document.getElementById('gradeAsgMaxPts').value);
    const points   = parseInt(document.getElementById('gradePoints').value);
    const feedback = document.getElementById('gradeFeedback').value.trim();

    if (isNaN(points) || points < 0 || points > maxPts) {
        tNotify(`Points must be between 0 and ${maxPts}`, 'error'); return;
    }

    try {
        const res  = await fetch(`/api/assignments/submissions/${subId}/grade`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ points, feedback }),
        });
        const data = await res.json();
        if (data.success) {
            tNotify(`Grade saved: ${points}/${maxPts}`, 'success');
            document.getElementById('gradeSubmissionModal').style.display = 'none';
            // Re-open submissions to refresh
            const modal = document.getElementById('viewSubmissionsModal');
            if (modal.style.display === 'block') {
                const title = document.getElementById('submissionsAsgTitle').textContent;
                // Find the assignment ID from cached data
                const asg = _allAsgData.find(a => a.title === title);
                if (asg) viewTeacherSubmissions(asg._id, asg.title, asg.maxPoints);
            }
        } else {
            tNotify(data.message || 'Failed to save grade', 'error');
        }
    } catch (err) { tNotify('Network error', 'error'); }
}

// Delete assignment (teacher)
async function deleteTeacherAssignment(id, title, btn) {
    if (!confirm(`Delete assignment "${title}"? This cannot be undone.`)) return;
    btn.disabled = true;
    try {
        const res  = await fetch(`/api/assignments/${id}`, {
            method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();
        if (data.success) { tNotify(`"${title}" deleted`, 'success'); loadTeacherAssignments(); }
        else tNotify(data.message || 'Failed', 'error');
    } catch (err) { tNotify('Network error', 'error'); }
    finally { btn.disabled = false; }
}

// ═══════════════════════════════════════════════════════
// TEACHER — RESOURCES (dynamic, like HOD)
// ═══════════════════════════════════════════════════════

async function initTeacherResources() {
    if (_teacherClasses.length === 0) await loadTeacherClasses();
    await loadTeacherResources();
}

async function loadTeacherResources() {
    const grid = document.getElementById('teacherResourceGrid');
    if (!grid) return;
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;color:#94a3b8;"><i class="fas fa-spinner fa-spin"></i> Loading resources...</div>';

    try {
        const res  = await fetch('/api/resources?limit=100', { headers: { 'Authorization': `Bearer ${getToken()}` } });
        const data = await res.json();
        _allResources = data.success ? (data.data.resources || []) : [];

        // Stats
        const docTypes = ['pdf','doc','docx','ppt','pptx','txt','xls','xlsx'];
        const mediaTypes = ['mp4','avi','mov','jpg','jpeg','png','gif','webm'];
        const sevenDaysAgo = Date.now() - 7*24*60*60*1000;
        let docs = 0, media = 0, recent = 0;
        _allResources.forEach(r => {
            const ext = (r.fileName || '').split('.').pop().toLowerCase();
            if (docTypes.includes(ext)) docs++;
            if (mediaTypes.includes(ext)) media++;
            if (new Date(r.createdAt).getTime() > sevenDaysAgo) recent++;
        });
        const setEl = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
        setEl('tResTotal', _allResources.length);
        setEl('tResDocs', docs);
        setEl('tResMedia', media);
        setEl('tResRecent', recent);
        const sub = document.getElementById('tResTotalSub');
        if (sub) sub.innerHTML = `<i class="fas fa-arrow-up"></i> ${recent} new this week`;

        renderTeacherResources();
    } catch (err) {
        grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:2rem;color:#ef4444;">Failed to load resources</div>';
    }
}

function filterTeacherResources(filter, btn) {
    _currentResFilter = filter;
    document.querySelectorAll('[data-rfilter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTeacherResources();
}

function renderTeacherResources() {
    const grid = document.getElementById('teacherResourceGrid');
    if (!grid) return;

    let filtered = _allResources;
    if (_currentResFilter === 'document') {
        const docExts = ['pdf','doc','docx','ppt','pptx','txt','xls','xlsx'];
        filtered = _allResources.filter(r => {
            const ext = (r.fileName || '').split('.').pop().toLowerCase();
            return docExts.includes(ext) || r.resourceType?.toLowerCase().includes('doc');
        });
    } else if (_currentResFilter === 'video') {
        const vidExts = ['mp4','avi','mov','webm'];
        filtered = _allResources.filter(r => {
            const ext = (r.fileName || '').split('.').pop().toLowerCase();
            return vidExts.includes(ext) || r.resourceType?.toLowerCase().includes('video');
        });
    } else if (_currentResFilter === 'link') {
        filtered = _allResources.filter(r => r.url && !r.filePath);
    }

    if (!filtered.length) {
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#94a3b8;">
            <i class="fas fa-folder-open" style="font-size:2.5rem;opacity:0.2;display:block;margin-bottom:0.75rem;"></i>
            <p>No resources found. <a href="#" onclick="openTeacherResourceModal();return false;" style="color:#667eea;">Upload one</a></p>
        </div>`;
        return;
    }

    grid.innerHTML = filtered.map(r => {
        const name     = r.title || r.fileName || 'Unnamed';
        const ext      = (r.fileName || '').split('.').pop().toUpperCase() || 'FILE';
        const size     = fmtSize(r.fileSize);
        const date     = fmtDate(r.createdAt);
        const cls      = r.class?.name || '—';
        const icon     = getFileIcon(r.fileName, r.resourceType);
        const dlUrl    = r.filePath ? `/api/resources/${r._id}/download` : (r.url || '#');
        const iconColor = ext === 'PDF' ? '#ef4444' : ext.includes('PP') ? '#f97316' : ext.includes('DOC') ? '#2563eb' : ext.includes('XLS') ? '#22c55e' : '#667eea';

        return `
        <div class="resource-card" style="position:relative;">
            <div class="resource-icon" style="background:${iconColor}18;">
                <i class="fas ${icon}" style="color:${iconColor};"></i>
            </div>
            <div class="resource-body">
                <h3 class="resource-title" title="${escH(name)}">${escH(name)}</h3>
                <p class="resource-meta">${ext} • ${size} • ${escH(cls)}</p>
                <p style="font-size:0.74rem;color:#94a3b8;margin:0 0 0.5rem;">${date}</p>
                <div class="resource-actions">
                    <a href="${dlUrl}" target="_blank" class="btn btn-primary btn-sm">
                        <i class="fas fa-download"></i> Download
                    </a>
                    <button onclick="deleteTeacherResource('${r._id}','${escH(name).replace(/'/g,"\\'")}',this)"
                        class="btn btn-sm" style="background:#fee2e2;color:#dc2626;border:1px solid #fca5a5;border-radius:6px;cursor:pointer;padding:4px 10px;font-size:0.78rem;font-weight:600;font-family:inherit;">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>`;
    }).join('');
}

function openTeacherResourceModal() {
    if (_teacherClasses.length === 0) loadTeacherClasses();
    document.getElementById('teacherResourceForm')?.reset();
    document.getElementById('uploadResourceModal').style.display = 'block';
}

function closeTeacherResourceModal() {
    document.getElementById('uploadResourceModal').style.display = 'none';
}

async function doTeacherUploadResource() {
    const title  = document.getElementById('tResTitle').value.trim();
    const classId = document.getElementById('tResClass').value;
    const desc   = document.getElementById('tResDesc').value.trim();
    const file   = document.getElementById('tResFile').files[0];

    if (!title || !classId || !file) {
        tNotify('Title, class and file are required', 'error'); return;
    }

    const btn = document.getElementById('tResUploadBtn');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

    const fd = new FormData();
    fd.append('title', title);
    fd.append('classId', classId);
    fd.append('description', desc);
    fd.append('resourceType', 'file');
    fd.append('file', file);

    try {
        const res  = await fetch('/api/resources', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}` },
            body: fd,
        });
        const data = await res.json();
        if (data.success) {
            tNotify(`✅ "${title}" uploaded successfully!`, 'success');
            closeTeacherResourceModal();
            loadTeacherResources();
        } else {
            tNotify(data.message || 'Upload failed', 'error');
        }
    } catch (err) { tNotify('Network error', 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-upload"></i> Upload & Share with Students'; }
}

async function deleteTeacherResource(id, name, btn) {
    if (!confirm(`Delete resource "${name}"?`)) return;
    btn.disabled = true;
    try {
        const res  = await fetch(`/api/resources/${id}`, {
            method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();
        if (data.success) { tNotify(`"${name}" deleted`, 'success'); loadTeacherResources(); }
        else tNotify(data.message || 'Failed', 'error');
    } catch (err) { tNotify('Network error', 'error'); }
    finally { btn.disabled = false; }
}

// ═══════════════════════════════════════════════════════
// HOD — ASSIGNMENTS
// ═══════════════════════════════════════════════════════

async function loadHodClassesForModal() {
    const token = getToken();
    try {
        // myOwn=true → only classes the HOD personally teaches (their own subjects)
        const res  = await fetch('/api/classes?myOwn=true', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        _hodClasses = data.success ? (data.data.classes || []) : [];

        const asgSel    = document.getElementById('hodAsgClass');
        const filterSel = document.getElementById('hodAsgClassFilter');
        const opts = _hodClasses.map(c => `<option value="${c._id}">${escH(c.name)} (${escH(c.code||'')})</option>`).join('');

        if (asgSel) {
            asgSel.innerHTML = _hodClasses.length
                ? '<option value="">Select class...</option>' + opts
                : '<option value="">No subjects assigned to you yet</option>';
        }
        if (filterSel) filterSel.innerHTML = '<option value="">All Classes</option>' + opts;
    } catch (err) { console.error('loadHodClassesForModal:', err); }
}

async function initHodAssignments() {
    await loadHodClassesForModal();
    await loadHodAssignments();
}

async function loadHodAssignments() {
    const container = document.getElementById('hodAssignmentListContainer');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center;padding:2rem;color:#94a3b8;"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    const token   = getToken();
    const classId = document.getElementById('hodAsgClassFilter')?.value || '';
    let url = '/api/assignments';
    if (classId) url += `?classId=${classId}`;

    try {
        const res  = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        _hodAsgData = data.success ? (data.data.assignments || []) : [];

        updateAsgStats(_hodAsgData, 'hod');
        renderHodAssignments();
    } catch (err) {
        container.innerHTML = '<div style="text-align:center;padding:2rem;color:#ef4444;">Failed to load assignments.</div>';
    }
}

function setHodAsgFilter(filter, btn) {
    _hodAsgFilter = filter;
    document.querySelectorAll('.hod-asg-tab').forEach(b => {
        b.style.color = '#64748b';
        b.style.borderBottomColor = 'transparent';
    });
    btn.style.color = '#667eea';
    btn.style.borderBottomColor = '#667eea';
    renderHodAssignments();
}

function renderHodAssignments() {
    const container = document.getElementById('hodAssignmentListContainer');
    if (!container) return;

    let filtered = _hodAsgData;
    if (_hodAsgFilter === 'published')     filtered = _hodAsgData.filter(a => a.status === 'published');
    if (_hodAsgFilter === 'draft')         filtered = _hodAsgData.filter(a => a.status === 'draft');
    if (_hodAsgFilter === 'pending_grade') filtered = _hodAsgData.filter(a => a.status === 'published');

    if (!filtered.length) {
        container.innerHTML = `<div style="text-align:center;padding:3rem;color:#94a3b8;">
            <i class="fas fa-tasks" style="font-size:2.5rem;opacity:0.2;display:block;margin-bottom:0.75rem;"></i>
            <p>No assignments found. <a href="#" onclick="openHodCreateAssignmentModal();return false;" style="color:#667eea;">Create one</a></p>
        </div>`;
        return;
    }

    container.innerHTML = filtered.map(a => buildAssignmentCard(a, 'hod')).join('');
}

function openHodCreateAssignmentModal() {
    if (_hodClasses.length === 0) loadHodClassesForModal();
    document.getElementById('hodCreateAssignmentForm')?.reset();
    document.getElementById('hodCreateAssignmentModal').style.display = 'block';
}

async function doHodCreateAssignment() {
    const title   = document.getElementById('hodAsgTitle').value.trim();
    const classId = document.getElementById('hodAsgClass').value;
    const desc    = document.getElementById('hodAsgDesc').value.trim();
    const due     = document.getElementById('hodAsgDue').value;
    const points  = document.getElementById('hodAsgPoints').value;
    const file    = document.getElementById('hodAsgFile').files[0];
    const draft   = document.getElementById('hodSaveAsDraft').checked;

    if (!title || !classId || !desc || !due || !points) {
        tNotify('Please fill all required fields', 'error'); return;
    }

    const btn = document.getElementById('hodCreateAsgBtn');
    btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';

    const fd = new FormData();
    fd.append('title', title);
    fd.append('classId', classId);
    fd.append('description', desc);
    fd.append('dueDate', due);
    fd.append('maxPoints', points);
    fd.append('status', draft ? 'draft' : 'published');
    if (file) fd.append('file', file);

    try {
        const res  = await fetch('/api/assignments', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${getToken()}` },
            body: fd,
        });
        const data = await res.json();
        if (data.success) {
            tNotify(`Assignment "${title}" ${draft ? 'saved as draft' : 'published'}!`, 'success');
            document.getElementById('hodCreateAssignmentModal').style.display = 'none';
            document.getElementById('hodCreateAssignmentForm').reset();
            loadHodAssignments();
        } else {
            tNotify(data.message || 'Failed to create assignment', 'error');
        }
    } catch (err) { tNotify('Network error', 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Create & Publish'; }
}

async function viewHodSubmissions(asgId, asgTitle, maxPoints) {
    document.getElementById('hodSubsAsgTitle').textContent = asgTitle;
    document.getElementById('hodViewSubmissionsModal').style.display = 'block';
    const container = document.getElementById('hodSubmissionsContainer');
    container.innerHTML = '<div style="text-align:center;padding:2rem;color:#94a3b8;"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    try {
        const res  = await fetch(`/api/assignments/${asgId}/submissions`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();
        const subs = data.success ? (data.data || []) : [];
        renderSubmissionsTable(subs, maxPoints, container, asgId, 'hod');
    } catch (err) {
        container.innerHTML = '<div style="text-align:center;padding:2rem;color:#ef4444;">Failed to load submissions</div>';
    }
}

function openHodGradeModal(subId, maxPts, studentName, existingPts, existingFeedback) {
    document.getElementById('hodGradeSubId').value = subId;
    document.getElementById('hodGradeMaxPts').value = maxPts;
    document.getElementById('hodGradeStudentInfo').innerHTML = `<strong>${escH(studentName)}</strong>`;
    document.getElementById('hodGradeMaxLabel').textContent = `(max: ${maxPts})`;
    document.getElementById('hodGradePoints').value = existingPts || '';
    document.getElementById('hodGradePoints').max = maxPts;
    document.getElementById('hodGradeFeedback').value = existingFeedback || '';
    document.getElementById('hodGradeModal').style.display = 'block';
}

async function hodSubmitGrade() {
    const subId    = document.getElementById('hodGradeSubId').value;
    const maxPts   = parseInt(document.getElementById('hodGradeMaxPts').value);
    const points   = parseInt(document.getElementById('hodGradePoints').value);
    const feedback = document.getElementById('hodGradeFeedback').value.trim();

    if (isNaN(points) || points < 0 || points > maxPts) {
        tNotify(`Points must be between 0 and ${maxPts}`, 'error'); return;
    }

    try {
        const res  = await fetch(`/api/assignments/submissions/${subId}/grade`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ points, feedback }),
        });
        const data = await res.json();
        if (data.success) {
            tNotify(`Grade saved: ${points}/${maxPts}`, 'success');
            document.getElementById('hodGradeModal').style.display = 'none';
            // Refresh submissions view
            const modal = document.getElementById('hodViewSubmissionsModal');
            if (modal.style.display === 'block') {
                const title = document.getElementById('hodSubsAsgTitle').textContent;
                const asg = _hodAsgData.find(a => a.title === title);
                if (asg) viewHodSubmissions(asg._id, asg.title, asg.maxPoints);
            }
        } else { tNotify(data.message || 'Failed', 'error'); }
    } catch (err) { tNotify('Network error', 'error'); }
}

async function deleteHodAssignment(id, title, btn) {
    if (!confirm(`Delete assignment "${title}"?`)) return;
    btn.disabled = true;
    try {
        const res  = await fetch(`/api/assignments/${id}`, {
            method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        const data = await res.json();
        if (data.success) { tNotify(`"${title}" deleted`, 'success'); loadHodAssignments(); }
        else tNotify(data.message || 'Failed', 'error');
    } catch (err) { tNotify('Network error', 'error'); }
    finally { btn.disabled = false; }
}

// Close modals on overlay click
document.addEventListener('click', function (e) {
    const modals = ['viewSubmissionsModal','gradeSubmissionModal','createAssignmentModal',
                    'uploadResourceModal','hodViewSubmissionsModal','hodGradeModal','hodCreateAssignmentModal'];
    modals.forEach(id => {
        const modal = document.getElementById(id);
        if (modal && e.target === modal) modal.style.display = 'none';
    });
});

// ── Publish a draft assignment ────────────────────────────────────────────────
async function publishAssignment(asgId, role, btn) {
    if (!confirm('Publish this assignment? Students will be able to see and submit it.')) return;
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';

    try {
        const res  = await fetch(`/api/assignments/${asgId}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'published' }),
        });
        const data = await res.json();
        if (data.success) {
            tNotify('Assignment published! Students can now see it. ✅', 'success');
            if (role === 'hod')     loadHodAssignments();
            else                    loadTeacherAssignments();
        } else {
            tNotify(data.message || 'Failed to publish', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish';
        }
    } catch (err) {
        tNotify('Network error', 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish';
    }
}
