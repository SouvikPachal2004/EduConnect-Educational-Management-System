/**
 * admin-programs.js
 * Handles Programs, Departments, and Subjects sections
 * for the EduConnect Admin Dashboard.
 */

'use strict';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function getToken() {
    return localStorage.getItem('authToken') || '';
}

function escH(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function toast(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `adm-toast ${type}`;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3200);
}

function openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('open');
}

function closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('open');
}

// Close modal when clicking the overlay (not the box)
document.addEventListener('click', function(e) {
    if (e.target && e.target.classList.contains('adm-modal-overlay')) {
        e.target.classList.remove('open');
    }
});

// ─────────────────────────────────────────────
// Sidebar Navigation
// ─────────────────────────────────────────────

const PAGE_TITLES = {
    overview: 'Admin Dashboard',
    programs: 'Degree Programs',
    departments: 'College Departments',
    users: 'User Management',
    subjects: 'Subject / Course Catalog',
    logs: 'Activity Logs',
    reports: 'System Reports',
};

document.addEventListener('DOMContentLoaded', function() {
    // Setup sidebar navigation
    document.querySelectorAll('.sidebar-menu a[data-section]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const sec = this.dataset.section;

            // Active link
            document.querySelectorAll('.sidebar-menu a').forEach(l => l.classList.remove('active'));
            this.classList.add('active');

            // Show/hide sections
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            const target = document.getElementById(sec);
            if (target) target.classList.add('active');

            // Update page title
            const titleEl = document.getElementById('pageTitle');
            if (titleEl) titleEl.textContent = PAGE_TITLES[sec] || 'Admin Dashboard';

            // Lazy-load data per section
            if (sec === 'programs')    loadPrograms();
            if (sec === 'departments') loadDepartments();
            if (sec === 'subjects')    loadSubjects();
            if (sec === 'users')       loadUsers();
            if (sec === 'logs')        loadLogs();
            if (sec === 'overview')    loadOverview();
        });
    });

    // Mobile menu
    const mobileBtn = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    if (mobileBtn && sidebar) {
        mobileBtn.addEventListener('click', () => sidebar.classList.toggle('active'));
        document.addEventListener('click', e => {
            if (!sidebar.contains(e.target) && !mobileBtn.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        });
    }

    // Logout
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            }
        });
    }

    // Load initial data
    checkAdminAuth();
    loadOverview();
    loadPrograms();   // Pre-load for dropdowns

    // Filter events for subjects
    document.getElementById('courseProgramFilter')?.addEventListener('change', loadSubjects);
    document.getElementById('courseDeptFilterBar')?.addEventListener('change', loadSubjects);

    // User form submit
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.addEventListener('submit', function(e) {
            e.preventDefault();
            addUser();
        });
    }
});

// ─────────────────────────────────────────────
// Auth check
// ─────────────────────────────────────────────

function checkAdminAuth() {
    const token = getToken();
    const raw = localStorage.getItem('currentUser');
    if (!token || !raw) { window.location.href = 'login.html'; return; }
    try {
        const user = JSON.parse(raw);
        if (user.role !== 'admin') {
            const map = { student:'student-dashboard.html', teacher:'teacher-dashboard.html',
                          hod:'HOD-dashboard.html', managing_authority:'managing-authority.html' };
            window.location.href = map[user.role] || 'login.html';
            return;
        }
        const nameEl = document.getElementById('adminName');
        if (nameEl && user.name) nameEl.textContent = user.name;
        const welcomeEl = document.getElementById('welcomeMessage');
        if (welcomeEl && user.name) {
            welcomeEl.textContent = `Welcome back, ${user.name.split(' ')[0]}! Here's what's happening with the system.`;
        }
    } catch(e) { window.location.href = 'login.html'; }
}

// ─────────────────────────────────────────────
// Overview
// ─────────────────────────────────────────────

async function loadOverview() {
    const token = getToken();
    if (!token) return;

    // Dept count
    fetch('/api/departments', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json()).then(d => {
            const el = document.getElementById('ovDeptCount');
            if (el && d.success) el.textContent = d.data.count;
        }).catch(() => {});

    // User count
    fetch('/api/users?limit=1', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json()).then(d => {
            const el = document.getElementById('ovUserCount');
            if (el && d.success) el.textContent = d.data.pagination?.total || '—';
        }).catch(() => {});

    // Program count
    fetch('/api/programs', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json()).then(d => {
            const el = document.getElementById('ovProgCount');
            if (el && d.success) el.textContent = d.data.count;
        }).catch(() => {});

    // Pending approvals
    fetch('/api/approvals?status=pending&limit=1', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json()).then(d => {
            const count = d.success ? (d.data?.pagination?.total || d.data?.count || 0) : 0;
            const valEl = document.getElementById('pendingApprovalsValue');
            const chEl  = document.getElementById('pendingApprovalsChange');
            if (valEl) valEl.textContent = count;
            if (chEl) {
                chEl.innerHTML = count > 0
                    ? `<i class="fas fa-exclamation-circle" style="color:#f59e0b;"></i> ${count} awaiting review`
                    : `<i class="fas fa-check-circle" style="color:#22c55e;"></i> No pending approvals`;
            }
        }).catch(() => {});

    // Recent activity
    const tbody = document.getElementById('recentActivityBody');
    if (tbody) {
        fetch('/api/activity-logs?limit=5', { headers: { 'Authorization': `Bearer ${token}` } })
            .then(r => r.json()).then(d => {
                const logs = d.success ? (d.data?.logs || []) : [];
                if (!logs.length) {
                    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:1.5rem;">No recent activity</td></tr>';
                    return;
                }
                tbody.innerHTML = logs.map(log => {
                    const sc = log.status === 'success' ? 'success' : log.status === 'failed' ? 'danger' : 'warning';
                    const sl = (log.status || 'Info').charAt(0).toUpperCase() + (log.status || 'info').slice(1);
                    const time = log.timestamp ? timeAgo(new Date(log.timestamp)) : 'Recently';
                    return `<tr>
                        <td><strong>${escH(log.userName || 'System')}</strong></td>
                        <td>${escH(log.actionLabel || log.action || 'Action')}</td>
                        <td style="max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escH(log.description || '—')}</td>
                        <td>${time}</td>
                        <td><span class="status-badge ${sc}">${sl}</span></td>
                    </tr>`;
                }).join('');
            }).catch(() => {
                if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#94a3b8;">Unable to load activity</td></tr>';
            });
    }
}

function timeAgo(date) {
    const diff = Math.floor((Date.now() - date) / 1000);
    if (diff < 60)   return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
    return `${Math.floor(diff/86400)}d ago`;
}

// ─────────────────────────────────────────────
// PROGRAMS
// ─────────────────────────────────────────────

let _programs = []; // cache

async function loadPrograms() {
    const tbody = document.getElementById('programsTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="fas fa-spinner fa-spin"></i> Loading programs...</td></tr>';

    const token = getToken();
    try {
        const res  = await fetch('/api/programs', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();

        if (!data.success) throw new Error(data.message || 'Failed');

        _programs = data.data.programs || [];

        if (tbody) {
            if (_programs.length === 0) {
                tbody.innerHTML = `<tr><td colspan="8" class="empty-state">
                    <i class="fas fa-university"></i>
                    <p>No programs yet. Click <strong>Add Program</strong> to create one.</p>
                </td></tr>`;
            } else {
                tbody.innerHTML = _programs.map(p => `
                    <tr>
                        <td><strong>${escH(p.code)}</strong></td>
                        <td>${escH(p.name)}</td>
                        <td>${p.duration} year${p.duration > 1 ? 's' : ''}</td>
                        <td>${p.totalSemesters} sem${p.totalSemesters > 1 ? 's' : ''}</td>
                        <td>${p.departmentCount || 0}</td>
                        <td>${p.subjectCount || 0}</td>
                        <td><span class="badge-active">Active</span></td>
                        <td style="white-space:nowrap;">
                            <button class="btn-edit-sm" onclick="openEditProgramModal('${p._id}')">Edit</button>
                            <button class="btn-del-sm"  onclick="deleteProgram('${p._id}','${escH(p.name)}')">Delete</button>
                        </td>
                    </tr>
                `).join('');
            }
        }

        // Populate program dropdowns everywhere
        populateProgramDropdowns(_programs);

    } catch(err) {
        console.error('loadPrograms:', err);
        if (tbody) tbody.innerHTML = `<tr><td colspan="8" class="empty-state" style="color:#ef4444;">Error loading programs</td></tr>`;
    }
}

function populateProgramDropdowns(programs) {
    const opts = '<option value="">— None —</option>' +
        programs.map(p => `<option value="${p._id}">${escH(p.name)} (${escH(p.code)})</option>`).join('');

    ['addDeptProgram','editDeptProgram','subProgram'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = opts;
    });

    // User program dropdown (for students)
    const userProg = document.getElementById('userProgram');
    if (userProg) {
        userProg.innerHTML = '<option value="">— Select Program —</option>' +
            programs.map(p => `<option value="${p._id}">${escH(p.name)} (${escH(p.code)})</option>`).join('');
    }

    // Filter dropdown (has "All Programs" as first option)
    const filterEl = document.getElementById('courseProgramFilter');
    if (filterEl) {
        filterEl.innerHTML = '<option value="">All Programs</option>' +
            programs.map(p => `<option value="${p._id}">${escH(p.name)} (${escH(p.code)})</option>`).join('');
    }
}

// Add Program
function openAddProgramModal() {
    document.getElementById('addProgramForm')?.reset();
    openModal('addProgramModal');
}

async function submitAddProgram() {
    const name     = document.getElementById('progName').value.trim();
    const code     = document.getElementById('progCode').value.trim();
    const desc     = document.getElementById('progDesc').value.trim();
    const duration = parseInt(document.getElementById('progDuration').value) || 4;
    const sems     = parseInt(document.getElementById('progSemesters').value) || 8;

    if (!name || !code) { toast('Program name and code are required', 'error'); return; }

    const btn = document.getElementById('saveProgramBtn');
    btn.disabled = true; btn.textContent = 'Creating...';
    const token = getToken();

    try {
        const res  = await fetch('/api/programs', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, code, description: desc, duration, totalSemesters: sems }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed');

        toast(`Program "${name}" created successfully!`, 'success');
        closeModal('addProgramModal');
        document.getElementById('addProgramForm').reset();
        loadPrograms();
    } catch(err) {
        toast(err.message || 'Error creating program', 'error');
    } finally {
        btn.disabled = false; btn.textContent = 'Create Program';
    }
}

// Edit Program
function openEditProgramModal(id) {
    const prog = _programs.find(p => p._id === id);
    if (!prog) return;

    document.getElementById('editProgId').value       = prog._id;
    document.getElementById('editProgName').value     = prog.name;
    document.getElementById('editProgCode').value     = prog.code;
    document.getElementById('editProgDesc').value     = prog.description || '';
    document.getElementById('editProgDuration').value = prog.duration;
    document.getElementById('editProgSemesters').value= prog.totalSemesters;

    openModal('editProgramModal');
}

async function submitEditProgram() {
    const id   = document.getElementById('editProgId').value;
    const name = document.getElementById('editProgName').value.trim();
    const code = document.getElementById('editProgCode').value.trim();
    const desc = document.getElementById('editProgDesc').value.trim();
    const dur  = parseInt(document.getElementById('editProgDuration').value);
    const sems = parseInt(document.getElementById('editProgSemesters').value);

    if (!name || !code) { toast('Name and code are required', 'error'); return; }

    const btn = document.getElementById('updateProgramBtn');
    btn.disabled = true; btn.textContent = 'Saving...';
    const token = getToken();

    try {
        const res  = await fetch(`/api/programs/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, code, description: desc, duration: dur, totalSemesters: sems }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed');

        toast('Program updated successfully', 'success');
        closeModal('editProgramModal');
        loadPrograms();
    } catch(err) {
        toast(err.message || 'Error updating program', 'error');
    } finally {
        btn.disabled = false; btn.textContent = 'Save Changes';
    }
}

// Delete Program
async function deleteProgram(id, name) {
    if (!confirm(`Deactivate program "${name}"? Existing departments won't be deleted.`)) return;
    const token = getToken();
    try {
        const res  = await fetch(`/api/programs/${id}`, {
            method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed');
        toast(`Program "${name}" deactivated`, 'success');
        loadPrograms();
    } catch(err) {
        toast(err.message || 'Error', 'error');
    }
}

// ─────────────────────────────────────────────
// DEPARTMENTS
// ─────────────────────────────────────────────

let _depts = []; // cache

async function loadDepartments() {
    const tbody = document.getElementById('deptsTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-spinner fa-spin"></i> Loading departments...</td></tr>';

    const token = getToken();

    // Also refresh programs for dropdowns
    if (_programs.length === 0) await loadPrograms();

    try {
        const res  = await fetch('/api/departments', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed');

        _depts = data.data.departments || [];

        if (!_depts.length) {
            if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="empty-state"><i class="fas fa-building"></i><p>No departments found</p></td></tr>';
            return;
        }

        if (tbody) {
            tbody.innerHTML = _depts.map(d => {
                const prog = d.program;
                const progBadge = prog
                    ? `<span class="badge-prog">${escH(prog.name || prog.code || prog)}</span>`
                    : '<span class="badge-na">N/A</span>';

                return `<tr>
                    <td><strong>${escH(d.name)}</strong></td>
                    <td>${progBadge}</td>
                    <td>${escH(d.hod || 'N/A')}</td>
                    <td>${d.faculty || 0}</td>
                    <td>${d.students || 0}</td>
                    <td>${d.established || '—'}</td>
                    <td style="white-space:nowrap;">
                        <button class="btn-del-sm" onclick="deleteDept('${d._id}','${escH(d.name)}')">Delete</button>
                        <button class="btn-edit-sm" onclick="openEditDeptModal('${d._id}')">Edit</button>
                    </td>
                </tr>`;
            }).join('');
        }

    } catch(err) {
        console.error('loadDepartments:', err);
        if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="empty-state" style="color:#ef4444;">Error loading departments</td></tr>`;
    }
}

// Add Department
function openAddDeptModal() {
    if (_programs.length === 0) loadPrograms();
    document.getElementById('addDeptForm')?.reset();
    openModal('addDeptModal');
}

async function submitAddDept() {
    const name        = document.getElementById('addDeptName').value.trim();
    const programId   = document.getElementById('addDeptProgram').value || null;
    const hod         = document.getElementById('addDeptHOD').value.trim();
    const established = parseInt(document.getElementById('addDeptEstablished').value);

    if (!name || !hod || !established) { toast('Please fill all required fields', 'error'); return; }

    const btn = document.getElementById('saveDeptBtn');
    btn.disabled = true; btn.textContent = 'Saving...';
    const token = getToken();

    try {
        const res  = await fetch('/api/departments', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, hod, faculty: 0, students: 0, established, program: programId }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed');

        toast(`Department "${name}" created successfully!`, 'success');
        closeModal('addDeptModal');
        document.getElementById('addDeptForm').reset();
        loadDepartments();
    } catch(err) {
        toast(err.message || 'Error creating department', 'error');
    } finally {
        btn.disabled = false; btn.textContent = 'Add Department';
    }
}

// Edit Department
function openEditDeptModal(id) {
    const dept = _depts.find(d => d._id === id);
    if (!dept) return;

    document.getElementById('editDeptId').value = dept._id;
    document.getElementById('editDeptName').value = dept.name;
    document.getElementById('editDeptHOD').value  = dept.hod || '';

    // Set established as date (YYYY-MM-DD)
    if (dept.established) {
        document.getElementById('editDeptEstablished').value = `${dept.established}-01-01`;
    } else {
        document.getElementById('editDeptEstablished').value = '';
    }

    // Populate + set program
    populateProgramDropdowns(_programs);
    const progSel = document.getElementById('editDeptProgram');
    if (progSel) {
        const progId = dept.program?._id || dept.program || '';
        progSel.value = progId;
    }

    openModal('editDeptModal');
}

async function submitEditDept() {
    const id          = document.getElementById('editDeptId').value;
    const name        = document.getElementById('editDeptName').value.trim();
    const hod         = document.getElementById('editDeptHOD').value.trim();
    const estRaw      = document.getElementById('editDeptEstablished').value;
    const programId   = document.getElementById('editDeptProgram').value || null;

    if (!name || !hod) { toast('Name and HOD are required', 'error'); return; }

    // Extract year from date string
    const established = estRaw ? parseInt(estRaw.split('-')[0]) : undefined;

    const btn = document.getElementById('updateDeptBtn');
    btn.disabled = true; btn.textContent = 'Saving...';
    const token = getToken();

    try {
        const payload = { name, hod, program: programId };
        if (established) payload.established = established;

        const res  = await fetch(`/api/departments/${id}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed');

        toast('Department updated successfully', 'success');
        closeModal('editDeptModal');
        loadDepartments();
    } catch(err) {
        toast(err.message || 'Error updating department', 'error');
    } finally {
        btn.disabled = false; btn.textContent = 'Save Changes';
    }
}

// Delete Department
async function deleteDept(id, name) {
    if (!confirm(`Delete department "${name}"?`)) return;
    const token = getToken();
    try {
        const res  = await fetch(`/api/departments/${id}`, {
            method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed');
        toast(`Department "${name}" deleted`, 'success');
        loadDepartments();
    } catch(err) {
        toast(err.message || 'Error', 'error');
    }
}

// ─────────────────────────────────────────────
// SUBJECTS
// ─────────────────────────────────────────────

async function loadSubjects() {
    const tbody = document.getElementById('subjectsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="fas fa-spinner fa-spin"></i> Loading subjects...</td></tr>';

    const token = getToken();
    const programFilter = document.getElementById('courseProgramFilter')?.value || '';
    const deptFilter    = document.getElementById('courseDeptFilterBar')?.value || '';

    let url = '/api/courses?';
    if (programFilter) url += `program=${programFilter}&`;
    if (deptFilter)    url += `department=${deptFilter}&`;

    try {
        const res  = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed');

        const courses = data.data.courses || [];

        if (!courses.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="empty-state"><i class="fas fa-book"></i><p>No subjects found. Add one above.</p></td></tr>';
            return;
        }

        tbody.innerHTML = courses.map(c => {
            const progBadge = c.program
                ? `<span class="badge-prog">${escH(c.program.code)}</span>`
                : '<span class="badge-na">N/A</span>';

            return `<tr>
                <td><strong>${escH(c.code)}</strong></td>
                <td>${escH(c.name)}</td>
                <td>${progBadge}</td>
                <td>${escH(c.department || '—')}</td>
                <td>${c.credits}</td>
                <td>${c.semester || '—'}</td>
                <td>${escH(c.type || 'Core')}</td>
                <td>
                    <button class="btn-del-sm" onclick="deleteSubject('${c._id}','${escH(c.name)}')">Delete</button>
                </td>
            </tr>`;
        }).join('');

    } catch(err) {
        console.error('loadSubjects:', err);
        tbody.innerHTML = `<tr><td colspan="8" class="empty-state" style="color:#ef4444;">Error loading subjects</td></tr>`;
    }
}

// Add Subject
function openAddSubjectModal() {
    if (_programs.length === 0) loadPrograms();
    document.getElementById('addSubjectForm')?.reset();
    openModal('addSubjectModal');
}

async function submitAddSubject() {
    const code    = document.getElementById('subCode').value.trim();
    const name    = document.getElementById('subName').value.trim();
    const program = document.getElementById('subProgram').value || null;
    const dept    = document.getElementById('subDept').value || null;
    const sem     = document.getElementById('subSemester').value || null;
    const credits = parseInt(document.getElementById('subCredits').value) || 3;
    const type    = document.getElementById('subType').value || 'Core';

    if (!code || !name) { toast('Subject code and name are required', 'error'); return; }

    const btn = document.getElementById('saveSubjectBtn');
    btn.disabled = true; btn.textContent = 'Adding...';
    const token = getToken();

    try {
        const res  = await fetch('/api/courses', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, name, program, department: dept, semester: sem, credits, type }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed');

        toast(`Subject "${name}" added!`, 'success');
        closeModal('addSubjectModal');
        document.getElementById('addSubjectForm').reset();
        loadSubjects();
    } catch(err) {
        toast(err.message || 'Error adding subject', 'error');
    } finally {
        btn.disabled = false; btn.textContent = 'Add Subject';
    }
}

// Delete Subject
async function deleteSubject(id, name) {
    if (!confirm(`Delete subject "${name}"?`)) return;
    const token = getToken();
    try {
        const res  = await fetch(`/api/courses/${id}`, {
            method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed');
        toast(`Subject "${name}" deleted`, 'success');
        loadSubjects();
    } catch(err) {
        toast(err.message || 'Error', 'error');
    }
}

// ─────────────────────────────────────────────
// USERS (delegated to existing admin.js logic)
// ─────────────────────────────────────────────

function loadUsers() {
    const usersTable = document.querySelector('#users tbody') || document.getElementById('usersTableBody');
    if (!usersTable) return;
    usersTable.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#94a3b8;"><i class="fas fa-spinner fa-spin"></i> Loading users...</td></tr>';

    const token = getToken();
    fetch('/api/users?limit=200', { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
            usersTable.innerHTML = '';
            const users = data.success ? (data.data.users || []) : [];
            if (!users.length) {
                usersTable.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:#94a3b8;">No users found</td></tr>';
                return;
            }
            users.forEach(u => {
                const roleLabel = { student:'Student', teacher:'Faculty', hod:'HOD', admin:'Administrator', managing_authority:'Managing Authority' }[u.role] || u.role;
                const uid = u.role === 'student' ? (u.studentId || '—') : ((u.role === 'teacher' || u.role === 'hod') ? (u.teacherId || '—') : (u._id?.substring(0,8) || '—'));
                const statusClass = u.isActive ? 'success' : 'warning';
                usersTable.insertAdjacentHTML('beforeend', `<tr>
                    <td>${escH(u.name)}</td>
                    <td>${escH(uid)}</td>
                    <td>${roleLabel}</td>
                    <td>${escH(u.department || 'N/A')}</td>
                    <td>${escH(u.email)}</td>
                    <td><span class="status-badge ${statusClass}">${u.isActive ? 'Active' : 'Suspended'}</span></td>
                    <td>
                        <button class="btn-del-sm" onclick="deleteUserById('${u._id}','${escH(u.name)}')">Delete</button>
                    </td>
                </tr>`);
            });
        }).catch(err => {
            usersTable.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#ef4444;">Error loading users</td></tr>`;
        });
}

async function deleteUserById(id, name) {
    if (!confirm(`Delete user "${name}"?`)) return;
    const token = getToken();
    try {
        const res  = await fetch(`/api/users/${id}`, { method:'DELETE', headers:{ 'Authorization':`Bearer ${token}` } });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Failed');
        toast(`User "${name}" deleted`, 'success');
        loadUsers();
    } catch(err) { toast(err.message || 'Error', 'error'); }
}

function showAddUserModal() {
    document.getElementById('addUserForm')?.reset();
    if (_programs.length > 0) populateProgramDropdowns(_programs);
    else loadPrograms();
    const modal = document.getElementById('addUserModal');
    if (modal) modal.style.display = 'block';

    // Load departments dynamically
    loadDepartmentsForDropdown();

    // Auto-fill roll number when program is selected and role is Student
    const programSel = document.getElementById('userProgram');
    const roleSel    = document.getElementById('userRole');
    const userIdEl   = document.getElementById('userId');

    const autoFillRoll = async () => {
        const role    = roleSel?.value;
        const progId  = programSel?.value;
        if (role !== 'Student' || !progId) { userIdEl.value = ''; return; }

        userIdEl.value = '';
        userIdEl.placeholder = 'Fetching...';
        try {
            const token = getToken();
            // Use the dedicated next-roll endpoint (max roll + 1, per program)
            const res  = await fetch(`/api/users/next-roll/${progId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                userIdEl.value       = data.nextRoll;
                userIdEl.placeholder = `Auto: ${data.nextRoll}`;
            } else {
                userIdEl.placeholder = 'Enter roll manually';
            }
        } catch (e) {
            userIdEl.placeholder = 'Enter roll manually';
        }
    };

    programSel?.addEventListener('change', autoFillRoll);
    roleSel?.addEventListener('change', autoFillRoll);
}

async function loadDepartmentsForDropdown() {
    const sel = document.getElementById('userDept');
    if (!sel) return;
    try {
        const token = getToken();
        const res   = await fetch('/api/departments', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data  = await res.json();
        const depts = data.success ? (data.data?.departments || []) : [];

        sel.innerHTML = '<option value="">Select Department</option>' +
            depts.map(d => `<option value="${escH(d.name)}">${escH(d.name)}</option>`).join('');
    } catch (e) {
        sel.innerHTML = '<option value="">Failed to load — refresh</option>';
    }
}

async function addUser() {
    const name     = document.getElementById('userName').value.trim();
    const userId   = document.getElementById('userId').value.trim();
    const roleRaw  = document.getElementById('userRole').value;
    const dept     = document.getElementById('userDept').value;
    const program  = document.getElementById('userProgram')?.value || null;
    const email    = document.getElementById('userEmail').value.trim();
    const password = document.getElementById('userPassword').value;
    const status   = document.getElementById('userStatus').value;

    if (!name || !roleRaw || !dept || !email || !password) { toast('Please fill all required fields', 'error'); return; }
    if (password.length < 6) { toast('Password must be at least 6 characters', 'error'); return; }

    const roleMap = { Student:'student', Faculty:'teacher', HOD:'hod', Administrator:'admin' };
    const backendRole = roleMap[roleRaw] || 'student';

    // Program required for students
    if (backendRole === 'student' && !program) {
        toast('Please select a Program for the student', 'error'); return;
    }

    try {
        const res  = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role: backendRole, department: dept, studentId: userId, program }),
        });
        const data = await res.json();
        console.log('Register response:', data);
        if (!data.success) throw new Error(data.message || data.error || JSON.stringify(data));

        toast(`User "${name}" added successfully!`, 'success');
        document.getElementById('addUserModal').style.display = 'none';
        document.getElementById('addUserForm').reset();
        loadUsers();
    } catch(err) {
        toast(err.message || 'Registration failed', 'error');
        console.error('addUser error:', err);
    }
}

// ─────────────────────────────────────────────
// LOGS
// ─────────────────────────────────────────────

function loadLogs(startDate = null, endDate = null) {
    const tbody = document.getElementById('logsTableBody');
    if (!tbody) return;
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#94a3b8;"><i class="fas fa-spinner fa-spin"></i></td></tr>';

    const token = getToken();
    let url = '/api/activity-logs?limit=50';
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate)   url += `&endDate=${endDate}`;

    fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json()).then(data => {
            const logs = data.success ? (data.data.logs || []) : [];
            if (!logs.length) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:#94a3b8;">No logs found</td></tr>';
                return;
            }
            tbody.innerHTML = logs.map(log => {
                const sc = log.status === 'success' ? 'success' : log.status === 'failed' ? 'danger' : 'warning';
                const ts = log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN') : '—';
                return `<tr>
                    <td>${ts}</td>
                    <td>${escH(log.userName || 'System')}</td>
                    <td>${escH(log.actionLabel || log.action || '—')}</td>
                    <td>${escH(log.ipAddress || '—')}</td>
                    <td>${escH(log.description || '—')}</td>
                    <td><span class="status-badge ${sc}">${log.status || 'info'}</span></td>
                </tr>`;
            }).join('');
        }).catch(() => {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#ef4444;">Error loading logs</td></tr>';
        });
}

function filterLogs() {
    const dateVal = document.getElementById('activityLogDate')?.value;
    loadLogs(dateVal || null, dateVal || null);
}

// ─────────────────────────────────────────────
// Notification container support
// (used by older admin.js showNotification calls)
// ─────────────────────────────────────────────

function showNotification(msg, type = 'info') {
    toast(msg, type === 'error' ? 'error' : type === 'success' ? 'success' : 'info');
}
