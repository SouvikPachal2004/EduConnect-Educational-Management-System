// ─── API Helper ───────────────────────────────────────────────────────────────
const MA_API_BASE = '/api';

function maApiGet(endpoint) {
    const token = localStorage.getItem('authToken');
    return fetch(`${MA_API_BASE}${endpoint}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    }).then(r => r.json());
}

function maApiPost(endpoint, body) {
    const token = localStorage.getItem('authToken');
    return fetch(`${MA_API_BASE}${endpoint}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }).then(r => r.json());
}

function maApiPut(endpoint, body = {}) {
    const token = localStorage.getItem('authToken');
    return fetch(`${MA_API_BASE}${endpoint}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    }).then(r => r.json());
}

let approvalRequestsById = new Map();

function getStatusBadge(status) {
    const normalized = (status || 'active').toLowerCase();
    const badgeClass = normalized === 'approved' || normalized === 'active'
        ? 'success'
        : normalized === 'rejected'
            ? 'danger'
            : 'warning';
    const label = normalized === 'pending'
        ? 'Pending Review'
        : normalized.charAt(0).toUpperCase() + normalized.slice(1);

    return `<span class="status-badge ${badgeClass}">${label}</span>`;
}

function showMaNotification(message, type = 'success') {
    const notification = type === 'success'
        ? document.getElementById('successNotification')
        : document.getElementById('errorNotification');
    const messageEl = type === 'success'
        ? document.getElementById('successMessage')
        : document.getElementById('errorMessage');

    if (!notification || !messageEl) return;

    messageEl.textContent = message;
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 3000);
}

function formatDate(dateValue) {
    if (!dateValue) return 'N/A';
    return new Date(dateValue).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

function getRequestDepartment(request) {
    return request.departmentData?.name ||
        request.courseData?.department ||
        request.metadata?.department ||
        'N/A';
}

function updatePerformanceOverviewTable(departments) {
    const tbody = document.querySelector('#overview .card .data-table tbody');
    if (!tbody) return;

    // Show loading state
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:1.5rem; color:#94a3b8;">Loading CGPA data...</td></tr>';

    // Fetch real CGPA data for each department
    maApiGet('/managing-authority/dept-cgpa').then(cgpaData => {
        const cgpaMap = {};
        if (cgpaData.success && cgpaData.data?.departments) {
            cgpaData.data.departments.forEach(d => { cgpaMap[d.department] = d.avgCgpa; });
        }

        tbody.innerHTML = '';
        let totalCgpa = 0, cgpaCount = 0;

        departments.forEach(dept => {
            const avgCgpa = cgpaMap[dept.name];
            const hasGrades = avgCgpa !== null && avgCgpa !== undefined && avgCgpa !== 'N/A';
            const cgpaDisplay = hasGrades ? Number(avgCgpa).toFixed(2) : 'N/A';

            if (hasGrades) { totalCgpa += Number(avgCgpa); cgpaCount++; }

            const cgpaCell = !hasGrades
                ? `<span style="color:#94a3b8;">N/A</span>`
                : Number(avgCgpa) < 7.0
                    ? `<span style="color:#ef4444; font-weight:600;">${cgpaDisplay} ⚠</span>`
                    : `<span style="color:#22c55e; font-weight:600;">${cgpaDisplay}</span>`;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${dept.name}</strong></td>
                <td>${dept.students || 0}</td>
                <td>${dept.faculty || 0}</td>
                <td>${cgpaCell}</td>
                <td>${getStatusBadge('active')}</td>
            `;
            tbody.appendChild(row);
        });

        // Update the Avg. CGPA stat box
        const avgCgpaEl = document.getElementById('maAvgCgpa');
        if (avgCgpaEl) {
            avgCgpaEl.textContent = cgpaCount > 0 ? (totalCgpa / cgpaCount).toFixed(2) : '—';
        }
    }).catch(() => {
        // Fallback: show departments without CGPA
        tbody.innerHTML = '';
        departments.forEach(dept => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${dept.name}</strong></td>
                <td>${dept.students || 0}</td>
                <td>${dept.faculty || 0}</td>
                <td><span style="color:#94a3b8;">N/A</span></td>
                <td>${getStatusBadge('active')}</td>
            `;
            tbody.appendChild(row);
        });
    });
}

function updateApprovalsTable(requests) {
    const tbody = document.querySelector('#approvals table tbody');
    if (!tbody) return;

    approvalRequestsById = new Map(requests.map(request => [request._id, request]));
    tbody.innerHTML = '';

    if (!requests.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No approval requests found</td></tr>';
        return;
    }

    requests.forEach(request => {
        const isPending = request.status === 'pending';
        const priority = request.metadata?.priority || 'Normal';
        const priorityClass = priority.toLowerCase() === 'high'
            ? 'high'
            : priority.toLowerCase() === 'low'
                ? 'low'
                : 'medium';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${request.title}</td>
            <td>${getRequestDepartment(request)}</td>
            <td>${request.requestedBy?.name || 'Admin'}</td>
            <td>${formatDate(request.createdAt)}</td>
            <td><span class="priority-badge ${priorityClass}">${priority}</span></td>
            <td>${getStatusBadge(request.status)}</td>
            <td>
                <button class="btn btn-sm btn-outline view-approval" data-id="${request._id}">View Details</button>
                ${isPending ? `<button class="btn btn-sm btn-primary approve-approval" data-id="${request._id}">Approve</button>
                <button class="btn btn-sm btn-danger reject-approval" data-id="${request._id}">Reject</button>` : ''}
            </td>
        `;
        tbody.appendChild(row);
    });
}

function loadApprovals() {
    return maApiGet('/approvals?limit=100').then(data => {
        if (data.success && data.data.requests) {
            updateApprovalsTable(data.data.requests);
            const pendingCount = data.data.requests.filter(request => request.status === 'pending').length;
            const badge = document.querySelector('.notification-badge');
            if (badge) badge.textContent = pendingCount.toString();
        }
    }).catch(err => console.error('MA approvals error:', err));
}

function showApprovalDetails(approvalId) {
    const approvalData = approvalRequestsById.get(approvalId);
    if (!approvalData) {
        showMaNotification('Approval requests are still loading. Please try again.', 'error');
        return;
    }

    const eventTypes = ['fest', 'freshers_welcome', 'club', 'introductory_session', 'other'];
    const isEvent = eventTypes.includes(approvalData.requestType);

    document.getElementById('viewApprovalTitle').textContent = approvalData.title;
    document.getElementById('viewApprovalDepartment').textContent = getRequestDepartment(approvalData);
    document.getElementById('viewApprovalRequestedBy').textContent = approvalData.requestedBy?.name || 'HOD';
    document.getElementById('viewApprovalDate').textContent = formatDate(approvalData.createdAt);
    document.getElementById('viewApprovalPriority').innerHTML = '<span class="priority-badge medium">Normal</span>';
    document.getElementById('viewApprovalStatus').innerHTML = getStatusBadge(approvalData.status);
    document.getElementById('viewApprovalDescription').textContent = approvalData.description;

    if (isEvent && approvalData.eventData) {
        const ed = approvalData.eventData;
        document.getElementById('viewApprovalJustification').textContent = `Venue: ${ed.venue || 'N/A'} | Participants: ${ed.expectedParticipants || 'N/A'}`;

        // Show event-specific section
        document.getElementById('eventDetailsSection').style.display = '';
        document.getElementById('viewEventProposedDate').textContent = ed.eventDate
            ? new Date(ed.eventDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
            : 'N/A';
        document.getElementById('viewEventVenue').textContent = ed.venue || 'N/A';
        document.getElementById('viewEventParticipants').textContent = ed.expectedParticipants || 'N/A';

        // Pre-fill the date picker with proposed date or existing approved date
        const existingDate = approvalData.metadata?.approvedDate || ed.eventDate;
        const dateInput = document.getElementById('principalEventDate');
        if (dateInput && existingDate) {
            dateInput.value = new Date(existingDate).toISOString().split('T')[0];
        } else if (dateInput) {
            dateInput.value = '';
        }

        // Hide date picker row for already-processed requests
        document.getElementById('approvedDateRow').style.display = approvalData.status === 'pending' ? '' : 'none';
    } else {
        document.getElementById('eventDetailsSection').style.display = 'none';
        document.getElementById('viewApprovalJustification').textContent = approvalData.departmentData
            ? `HOD: ${approvalData.departmentData.hod || 'Not assigned'}, Faculty: ${approvalData.departmentData.faculty || 0}, Students: ${approvalData.departmentData.students || 0}`
            : 'No additional details provided.';
    }

    document.querySelectorAll('#viewApprovalModal .approve-approval, #viewApprovalModal .reject-approval')
        .forEach(button => {
            button.dataset.id = approvalId;
            button.style.display = approvalData.status === 'pending' ? '' : 'none';
        });

    const modal = document.getElementById('viewApprovalModal');
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function processApproval(approvalId, action) {
    if (!approvalId) return;
    if (!approvalRequestsById.has(approvalId)) {
        showMaNotification('Approval requests are still loading. Please try again.', 'error');
        return;
    }

    const approvalData = approvalRequestsById.get(approvalId);
    const eventTypes = ['fest', 'freshers_welcome', 'club', 'introductory_session', 'other'];
    const isEvent = eventTypes.includes(approvalData?.requestType);

    const endpoint = action === 'approve'
        ? `/approvals/${approvalId}/approve`
        : `/approvals/${approvalId}/reject`;

    let body = action === 'reject' ? { rejectionReason: 'Rejected by principal' } : {};

    // For event approvals, include the principal's chosen date in metadata
    if (action === 'approve' && isEvent) {
        const dateInput = document.getElementById('principalEventDate');
        if (dateInput && dateInput.value) {
            body.metadata = { approvedDate: new Date(dateInput.value).toISOString() };
        }
    }

    maApiPut(endpoint, body).then(data => {
        if (data.success) {
            showMaNotification(`Request ${action === 'approve' ? 'approved' : 'rejected'} successfully`, 'success');
            const modal = document.getElementById('viewApprovalModal');
            if (modal) {
                modal.classList.remove('active');
                document.body.style.overflow = '';
            }
            loadManagingAuthorityData();
            if (window.notificationManager) {
                window.notificationManager.loadNotifications();
            }
        } else {
            showMaNotification(data.message || `Failed to ${action} request`, 'error');
        }
    }).catch(error => {
        console.error(`Error ${action}ing approval:`, error);
        showMaNotification(`An error occurred while ${action}ing the request`, 'error');
    });
}

// ─── Load Dynamic Data ────────────────────────────────────────────────────────
function loadManagingAuthorityData() {
    // Load dashboard stats
    maApiGet('/managing-authority/dashboard').then(data => {
        if (data.success) {
            const stats = data.data.stats;
            const user = data.data.user;

            // Update sidebar user info
            const nameEl = document.getElementById('maUserName') || document.querySelector('.user-info h3');
            const roleEl = document.getElementById('maUserRole') || document.querySelector('.user-info p');
            if (nameEl) nameEl.textContent = user.name || 'Principal';
            if (roleEl) roleEl.textContent = 'Principal / Managing Authority';

            // Update header welcome
            const headerTitle = document.querySelector('.page-title p');
            if (headerTitle) {
                headerTitle.textContent = `Welcome back, ${user.name}! Here's what's happening at the college.`;
            }

            // Update stat cards
            const statValues = document.querySelectorAll('.stat-card-value');
            if (statValues[0]) statValues[0].textContent = stats.totalStudents || 0;
            if (statValues[1]) statValues[1].textContent = stats.totalTeachers || 0;
            if (statValues[2]) statValues[2].textContent = stats.totalDepartments || 0;
        }
    }).catch(err => console.error('MA dashboard error:', err));

    // Load departments + pending approval requests together
    Promise.all([
        maApiGet('/managing-authority/departments').catch(() => ({ success: false })),
        maApiGet('/approvals?requestType=department&status=pending&limit=100').catch(() => ({ success: false }))
    ]).then(([deptData, approvalData]) => {
        const departments = deptData.success ? (deptData.data?.departments || []) : [];
        const pendingRequests = approvalData.success ? (approvalData.data?.requests || []) : [];
        updateDepartmentsTable(departments, pendingRequests);
        updatePerformanceOverviewTable(departments);

        // Also update the Students section Avg. CGPA box from same data
        maApiGet('/managing-authority/dept-cgpa').then(cgpaData => {
            if (cgpaData.success && cgpaData.data?.departments) {
                const depts = cgpaData.data.departments;
                const validCgpas = depts.filter(d => d.avgCgpa !== null && d.avgCgpa !== undefined && d.avgCgpa !== 'N/A');
                if (validCgpas.length > 0) {
                    const avg = validCgpas.reduce((s, d) => s + Number(d.avgCgpa), 0) / validCgpas.length;
                    const el2 = document.getElementById('maStudentsAvgCgpa');
                    if (el2) el2.textContent = avg.toFixed(2);
                }
            }
        }).catch(() => {});
    });

    // Load approval requests
    loadApprovals();

    // Load faculty
    maApiGet('/managing-authority/faculty').then(data => {
        if (data.success && data.data.faculty) {
            updateFacultyTable(data.data.faculty);
        }
    }).catch(err => console.error('MA faculty error:', err));

    // Load students
    maApiGet('/managing-authority/students?limit=500').then(data => {
        if (data.success && data.data.students) {
            updateStudentsTable(data.data.students);
        }
    }).catch(err => console.error('MA students error:', err));

    // Load academics table (departments + CGPA)
    loadAcademicsTable();

    // Load upcoming events (approved event requests from HODs)
    loadUpcomingEvents();
}

// ─── Upcoming Events (approved HOD event requests) ───────────────────────────
function loadUpcomingEvents() {
    const tbody = document.querySelector('#upcomingEventsTable tbody');
    if (!tbody) return;

    const eventTypes = ['fest', 'freshers_welcome', 'club', 'introductory_session', 'other'];

    maApiGet('/approvals?limit=100').then(data => {
        const allRequests = data.success ? (data.data?.requests || []) : [];

        // Show all event requests (pending + approved) sorted by date
        const events = allRequests
            .filter(r => eventTypes.includes(r.requestType))
            .sort((a, b) => {
                const da = a.metadata?.approvedDate || a.eventData?.eventDate || a.createdAt;
                const db = b.metadata?.approvedDate || b.eventData?.eventDate || b.createdAt;
                return new Date(da) - new Date(db);
            });

        tbody.innerHTML = '';

        if (!events.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No events found. HODs can request events from their dashboard.</td></tr>';
            return;
        }

        events.forEach(req => {
            const ed = req.eventData || {};
            // Use principal's modified date if set, otherwise proposed date
            const rawDate = req.metadata?.approvedDate || ed.eventDate;
            const displayDate = rawDate
                ? new Date(rawDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'TBD';

            const statusBadge = req.status === 'approved'
                ? '<span class="status-badge success">Approved</span>'
                : req.status === 'rejected'
                    ? '<span class="status-badge danger">Rejected</span>'
                    : '<span class="status-badge warning">Pending</span>';

            const organizer = req.requestedBy?.name || 'HOD';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${req.title}</strong></td>
                <td>${displayDate}</td>
                <td>${ed.venue || 'TBD'}</td>
                <td>${organizer}</td>
                <td>${statusBadge}</td>
            `;
            tbody.appendChild(row);
        });
    }).catch(err => {
        console.error('Events load error:', err);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Error loading events.</td></tr>';
    });
}

// ─── Academics Table ─────────────────────────────────────────────────────────
function loadAcademicsTable() {
    const tbody = document.querySelector('#academicsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Loading...</td></tr>';

    Promise.all([
        maApiGet('/managing-authority/departments').catch(() => ({ success: false })),
        maApiGet('/managing-authority/dept-cgpa').catch(() => ({ success: false }))
    ]).then(([deptData, cgpaData]) => {
        const departments = deptData.success ? (deptData.data?.departments || []) : [];
        const cgpaMap = {};
        if (cgpaData.success && cgpaData.data?.departments) {
            cgpaData.data.departments.forEach(d => { cgpaMap[d.department] = d.avgCgpa; });
        }

        tbody.innerHTML = '';

        if (!departments.length) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">No departments found</td></tr>';
            return;
        }

        // ── Update the 4 stat boxes with real data ──
        const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
        setEl('acadTotalDepts', departments.length);

        // Total students across all departments
        const totalStudents = departments.reduce((sum, d) => sum + (d.students || 0), 0);
        setEl('acadTotalStudents', totalStudents);
        const studentsLabel = document.getElementById('acadStudentsLabel');
        if (studentsLabel) studentsLabel.innerHTML = `<i class="fas fa-users"></i> Across ${departments.length} departments`;

        // Avg CGPA across departments
        const cgpaValues = Object.values(cgpaMap).filter(v => v !== null && v !== undefined && v !== 'N/A' && !isNaN(Number(v)));
        const avgCgpa = cgpaValues.length > 0 ? (cgpaValues.reduce((s, v) => s + Number(v), 0) / cgpaValues.length).toFixed(2) : 'N/A';
        setEl('acadAvgCgpa', avgCgpa);
        const cgpaLabelEl = document.getElementById('acadCgpaLabel');
        if (cgpaLabelEl) cgpaLabelEl.innerHTML = `<i class="fas fa-info-circle"></i> College-wide average`;

        // Departments below 7.0
        const lowDepts = cgpaValues.filter(v => Number(v) < 7.0).length;
        setEl('acadLowCgpaDepts', lowDepts);
        const lowLabel = document.getElementById('acadLowLabel');
        if (lowLabel) {
            lowLabel.innerHTML = lowDepts > 0
                ? `<i class="fas fa-exclamation-triangle" style="color:#ef4444;"></i> <span style="color:#ef4444;">Below 7.0 threshold</span>`
                : `<i class="fas fa-check-circle" style="color:#22c55e;"></i> <span style="color:#22c55e;">All departments healthy</span>`;
        }

        const deptLabel = document.getElementById('acadDeptsLabel');
        if (deptLabel) deptLabel.innerHTML = `<i class="fas fa-building"></i> Active departments`;

        departments.forEach(dept => {
            const avgCgpa = cgpaMap[dept.name];
            const hasGrades = avgCgpa !== null && avgCgpa !== undefined && avgCgpa !== 'N/A';
            const cgpaDisplay = hasGrades ? Number(avgCgpa).toFixed(2) : 'N/A';
            const isLow = hasGrades && Number(avgCgpa) < 7.0;
            const cgpaCell = !hasGrades
                ? `<span style="color:#888;">N/A</span>`
                : isLow
                    ? `<span style="color:#F44336; font-weight:600;">${cgpaDisplay} ⚠</span>`
                    : `<span style="color:#4CAF50; font-weight:600;">${cgpaDisplay}</span>`;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${dept.name}</td>
                <td>${dept.students || 0}</td>
                <td>${cgpaCell}</td>
                <td><span class="status-badge success">Active</span></td>
                <td>
                    ${isLow ? `<button class="btn btn-sm btn-danger alert-hod-btn" data-dept="${dept.name}">Alert HOD</button>` : '<span style="color:#888;font-size:0.8rem;">—</span>'}
                </td>
            `;
            tbody.appendChild(row);
        });

        // Attach alert HOD handlers
        tbody.querySelectorAll('.alert-hod-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const dept = this.dataset.dept;
                if (confirm(`Send low CGPA alert to HOD of ${dept}? The HOD will also alert all students below 7.0 CGPA.`)) {
                    sendLowCgpaAlert(dept, this);
                }
            });
        });
    }).catch(err => {
        console.error('Academics table error:', err);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center">Error loading data</td></tr>';
    });
}

function sendLowCgpaAlert(department, btn) {
    btn.disabled = true;
    btn.textContent = 'Sending...';

    maApiPost('/managing-authority/alert-low-cgpa', { department }).then(data => {
        if (data.success) {
            const d = data.data;
            showMaNotification(
                `Alert sent to ${d.hodName}. ${d.studentsAlerted} student(s) notified.`,
                'success'
            );
            btn.textContent = '✓ Sent';
            btn.style.backgroundColor = '#9E9E9E';
        } else {
            showMaNotification(data.message || 'Failed to send alert', 'error');
            btn.disabled = false;
            btn.textContent = 'Alert HOD';
        }
    }).catch(err => {
        console.error('Alert error:', err);
        showMaNotification('An error occurred while sending the alert', 'error');
        btn.disabled = false;
        btn.textContent = 'Alert HOD';
    });
}

// ── Department data store (keyed by dept name for quick lookup) ──
const _deptDataMap = new Map();
window._deptDataMap = _deptDataMap; // expose globally for faculty view student count

// ── Modal helpers (module scope so usable anywhere) ──
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) { modal.classList.add('active'); document.body.style.overflow = 'hidden'; }
}
function closeModal(modal) {
    if (!modal) return;
    if (typeof modal === 'string') modal = document.getElementById(modal);
    if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; }
}

function updateDepartmentsTable(departments, pendingRequests) {
    const tbody = document.querySelector('#departments table tbody') ||
                  document.querySelector('.departments-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    _deptDataMap.clear();

    // Render pending department approval requests first
    if (pendingRequests && pendingRequests.length > 0) {
        pendingRequests.forEach(request => {
            const dd = request.departmentData || {};
            const row = document.createElement('tr');
            row.dataset.approvalId = request._id;
            row.innerHTML = `
                <td>${dd.name || request.title}</td>
                <td>${dd.hod || 'N/A'}</td>
                <td>${dd.faculty || 0}</td>
                <td>${dd.students || 0}</td>
                <td><span class="status-badge warning">Pending Approval</span></td>
                <td>
                    <button class="btn btn-sm btn-success dept-approve-btn" data-id="${request._id}">Approve</button>
                    <button class="btn btn-sm btn-danger dept-reject-btn" data-id="${request._id}">Decline</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Render active departments — store real data in map
    if (departments && departments.length > 0) {
        departments.forEach((dept) => {
            // Store real data keyed by dept name (used by View/Edit handlers)
            _deptDataMap.set(dept.name, dept);

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${dept.name}</td>
                <td>${dept.hod || 'N/A'}</td>
                <td>${dept.faculty || 0}</td>
                <td>${dept.students || 0}</td>
                <td><span class="status-badge success">Active</span></td>
                <td>
                    <button class="btn btn-sm btn-outline view-department" data-name="${dept.name}">View</button>
                    <button class="btn btn-sm btn-primary edit-department" data-name="${dept.name}">Edit</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    if (!pendingRequests?.length && !departments?.length) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No departments found</td></tr>';
    }

    // ── Event delegation for approve/decline ──
    tbody.querySelectorAll('.dept-approve-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.dataset.id;
            if (confirm('Approve this department request?')) {
                processDepartmentApproval(id, 'approve');
            }
        });
    });

    tbody.querySelectorAll('.dept-reject-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const id = this.dataset.id;
            if (confirm('Decline this department request?')) {
                processDepartmentApproval(id, 'reject');
            }
        });
    });
}

function processDepartmentApproval(approvalId, action) {
    const endpoint = action === 'approve'
        ? `/approvals/${approvalId}/approve`
        : `/approvals/${approvalId}/reject`;
    const body = action === 'reject' ? { rejectionReason: 'Declined by principal' } : {};

    maApiPut(endpoint, body).then(data => {
        if (data.success) {
            showMaNotification(
                `Department request ${action === 'approve' ? 'approved' : 'declined'} successfully`,
                'success'
            );
            loadManagingAuthorityData();
            if (window.notificationManager) {
                window.notificationManager.loadNotifications();
            }
        } else {
            showMaNotification(data.message || `Failed to ${action} request`, 'error');
        }
    }).catch(err => {
        console.error(`Error ${action}ing department approval:`, err);
        showMaNotification(`An error occurred. Please try again.`, 'error');
    });
}

function updateFacultyTable(faculty) {
    const tbody = document.querySelector('#faculty table tbody') ||
                  document.querySelector('.faculty-table tbody');
    if (!tbody) return;

    // Store faculty globally for View button access
    window._maFacultyData = faculty;

    // Calculate real-time stats
    const total = faculty.length;
    const hods  = faculty.filter(f => f.role === 'hod').length;
    const teachers = faculty.filter(f => f.role === 'teacher' && f.isActive !== false).length;
    const depts = new Set(faculty.map(f => f.department).filter(Boolean)).size;

    // Faculty section stat boxes
    if (document.getElementById('maFacultyTotal'))  document.getElementById('maFacultyTotal').textContent  = total;
    if (document.getElementById('maFacultyHods'))   document.getElementById('maFacultyHods').textContent   = hods;
    if (document.getElementById('maFacultyActive')) document.getElementById('maFacultyActive').textContent = teachers;
    if (document.getElementById('maFacultyDepts'))  document.getElementById('maFacultyDepts').textContent  = depts;

    // Overview section stat boxes (Task 1 — dynamic)
    if (document.getElementById('maOverviewTeachers')) {
        document.getElementById('maOverviewTeachers').textContent = teachers;
    }
    if (document.getElementById('maOverviewDepts')) {
        document.getElementById('maOverviewDepts').textContent = depts;
    }

    // Table rows
    tbody.innerHTML = '';
    if (!faculty.length) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:1.5rem;color:#94a3b8;">No faculty found</td></tr>';
        return;
    }

    faculty.forEach(f => {
        const position   = f.role === 'hod' ? 'HOD' : 'Teacher';
        const statusBadge = (f.isActive !== false)
            ? '<span class="status-badge success">Active</span>'
            : '<span class="status-badge danger">Inactive</span>';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${f.name}</strong></td>
            <td>${f.department || 'N/A'}</td>
            <td>${position}</td>
            <td>${f.email}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn btn-sm btn-outline view-faculty-btn" data-mongo-id="${f._id}">View</button>
                <button class="btn btn-sm btn-primary message-faculty-btn" data-mongo-id="${f._id}" data-name="${f.name}" data-email="${f.email}">Message</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Wire View buttons
    document.querySelectorAll('.view-faculty-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-mongo-id');
            const f  = (window._maFacultyData || []).find(x => String(x._id) === id);
            if (!f) return;
            document.getElementById('viewFacultyName').textContent       = f.name;
            document.getElementById('viewFacultyPosition').textContent   = f.role === 'hod' ? 'HOD' : 'Teacher';
            document.getElementById('viewFacultyDept2').textContent      = f.department || 'N/A';
            document.getElementById('viewFacultyDepartment').textContent = f.department || 'N/A';
            document.getElementById('viewFacultyEmail').textContent      = f.email;
            document.getElementById('viewFacultyStatus').innerHTML       = (f.isActive !== false) ? '<span class="status-badge success">Active</span>' : '<span class="status-badge danger">Inactive</span>';
            // Count students in their dept — use dept data map for accurate count
            let studentCount = 0;
            const deptName = (f.department || '').trim().toLowerCase();
            // Try from cached dept data first (most accurate)
            if (window._deptDataMap && window._deptDataMap.size > 0) {
                window._deptDataMap.forEach((dept, key) => {
                    if (key.trim().toLowerCase() === deptName || 
                        (dept.name || '').trim().toLowerCase() === deptName) {
                        studentCount = dept.students || 0;
                    }
                });
            }
            // Fallback: count from students array with case-insensitive match
            if (studentCount === 0 && window._maStudentsData) {
                studentCount = window._maStudentsData.filter(s => 
                    (s.department || '').trim().toLowerCase() === deptName
                ).length;
            }
            document.getElementById('viewFacultyStudents').textContent = studentCount > 0 ? `${studentCount} in ${f.department}` : 'N/A';
            // Wire message button inside modal
            const msgBtn = document.getElementById('viewFacultyMsgBtn');
            if (msgBtn) msgBtn.onclick = () => openMessageFacultyModal(f._id, f.name);
            openModal('viewFacultyModal');
        });
    });

    // Wire Message buttons
    document.querySelectorAll('.message-faculty-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const id   = this.getAttribute('data-mongo-id');
            const name = this.getAttribute('data-name');
            openMessageFacultyModal(id, name);
        });
    });
}

// Check if HOD already exists for selected department (called by onchange in HTML)
function checkHodExists() {
    const dept    = document.getElementById('facultyDepartment')?.value;
    const hodOpt  = document.getElementById('hodOption');
    const posSelect = document.getElementById('facultyPosition');
    const warning = document.getElementById('hodWarning');
    if (!dept || !hodOpt) return;
    const existingHod = (window._maFacultyData || []).find(f => f.role === 'hod' && f.department === dept);
    if (existingHod) {
        hodOpt.disabled = true;
        hodOpt.textContent = 'HOD (position filled)';
        if (warning) warning.style.display = 'block';
        if (posSelect.value === 'hod') posSelect.value = '';
    } else {
        hodOpt.disabled = false;
        hodOpt.textContent = 'HOD';
        if (warning) warning.style.display = 'none';
    }
}

// Open Message Faculty modal
function openMessageFacultyModal(facultyId, facultyName) {
    document.getElementById('messageFacultyId').value  = facultyId || '';
    document.getElementById('messageFacultyTo').value  = facultyName || '';
    document.getElementById('messageFacultySubject').value = '';
    document.getElementById('messageFacultyContent').value = '';
    closeModal(document.getElementById('viewFacultyModal'));
    openModal('messageFacultyModal');
}

function updateStudentsTable(students) {
    // Cache for cross-reference
    window._maStudentsData = students;

    // ── Stat boxes ────────────────────────────────────────────────────────
    const total   = students.length;
    const withGpa = students.filter(s => s.grade && parseFloat(s.grade) > 0);
    const avgCgpa = withGpa.length > 0
        ? (withGpa.reduce((a, s) => a + parseFloat(s.grade), 0) / withGpa.length).toFixed(2)
        : '—';
    const atRisk  = students.filter(s => s.grade && parseFloat(s.grade) < 6.0).length;
    const depts   = new Set(students.map(s => s.department).filter(Boolean)).size;

    if (document.getElementById('maStudentsTotal'))    document.getElementById('maStudentsTotal').textContent    = total;
    if (document.getElementById('maStudentsAvgCgpa'))  document.getElementById('maStudentsAvgCgpa').textContent  = avgCgpa;
    if (document.getElementById('maStudentsCgpaLabel')) document.getElementById('maStudentsCgpaLabel').textContent = `Total ${withGpa.reduce((a,s)=>a+parseFloat(s.grade),0).toFixed(2)} / ${withGpa.length} students`;
    if (document.getElementById('maStudentsAtRisk'))   document.getElementById('maStudentsAtRisk').textContent   = atRisk;
    if (document.getElementById('maStudentsDepts'))    document.getElementById('maStudentsDepts').textContent    = depts;
    if (document.getElementById('maOverviewStudents')) document.getElementById('maOverviewStudents').textContent = total;

    // ── Dept filter dropdown ──────────────────────────────────────────────
    const deptFilter = document.getElementById('studentDepartmentFilter');
    if (deptFilter) {
        const existing = Array.from(deptFilter.options).map(o => o.value);
        const allDepts = [...new Set(students.map(s => s.department).filter(Boolean))].sort();
        allDepts.forEach(d => {
            if (!existing.includes(d)) {
                const opt = document.createElement('option');
                opt.value = d; opt.textContent = d;
                deptFilter.appendChild(opt);
            }
        });
    }

    // ── Table ─────────────────────────────────────────────────────────────
    window._maAllStudentsRows = students; // store for filter
    renderStudentRows(students);
}

// Compute year CGPA from semesterCgpas array
// Year N = avg of sem(2N-1) and sem(2N), only if at least one has a value
function getYearCgpa(semCgpas, yearNum) {
    const s1 = parseFloat(semCgpas[(yearNum - 1) * 2] || 0);
    const s2 = parseFloat(semCgpas[(yearNum - 1) * 2 + 1] || 0);
    const cnt = (s1 > 0 ? 1 : 0) + (s2 > 0 ? 1 : 0);
    if (cnt === 0) return null;
    return parseFloat((((s1 || 0) + (s2 || 0)) / cnt).toFixed(2));
}

// Get total years for a student based on their program duration
function getProgramYears(student) {
    // Try to get from program data cached in departments
    const dept = window._deptDataMap ? (() => {
        let found = null;
        window._deptDataMap.forEach((d) => {
            if ((d.name || '').toLowerCase() === (student.department || '').toLowerCase()) found = d;
        });
        return found;
    })() : null;

    // Program duration from dept's program field
    const duration = dept?.program?.duration || dept?.program?.totalSemesters
        ? Math.ceil((dept.program.totalSemesters || 8) / 2)
        : null;

    return duration || 4; // default 4 years
}

function renderStudentRows(students) {
    const tbody = document.querySelector('#studentsDataTable tbody');
    if (!tbody) return;

    if (!students.length) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:1.5rem;color:#94a3b8;">No students found</td></tr>';
        return;
    }

    // Group by department
    const byDept = {};
    students.forEach(s => {
        const d = s.department || 'Unassigned';
        if (!byDept[d]) byDept[d] = [];
        byDept[d].push(s);
    });

    const deptColors = ['#667eea','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899'];
    let colorIdx = 0;
    let html = '';

    Object.keys(byDept).sort().forEach(dept => {
        const students = byDept[dept];
        const color = deptColors[colorIdx++ % deptColors.length];
        const avgCgpa = (() => {
            const w = students.filter(s => parseFloat(s.grade) > 0);
            return w.length ? (w.reduce((a,s)=>a+parseFloat(s.grade),0)/w.length).toFixed(2) : '—';
        })();

        // Department header row
        html += `<tr class="dept-header-row" onclick="toggleDeptGroup('${dept.replace(/'/g,"\\'")}', this)" style="cursor:pointer;background:${color}10;border-left:4px solid ${color};">
            <td colspan="9" style="padding:0.75rem 1rem;">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <div style="display:flex;align-items:center;gap:0.75rem;">
                        <div style="width:10px;height:10px;background:${color};border-radius:50%;"></div>
                        <strong style="color:${color};font-size:0.95rem;">${dept}</strong>
                        <span style="background:${color};color:#fff;padding:0.15rem 0.55rem;border-radius:20px;font-size:0.75rem;font-weight:700;">${students.length} students</span>
                        <span style="color:#64748b;font-size:0.82rem;">Avg CGPA: <strong>${avgCgpa}</strong></span>
                    </div>
                    <span class="dept-toggle-icon" style="color:${color};font-size:0.85rem;font-weight:700;">&#9650; Hide</span>
                </div>
            </td>
        </tr>`;

        // Student rows for this department
        students.forEach((s, i) => {
            const semCgpas = (s.semesterCgpas || []).map(v => parseFloat(v) || 0);
            const totalYears = getProgramYears(s);
            const rowBg = i % 2 === 0 ? '#fff' : '#f9fafb';

            const yearCells = [1,2,3,4].map(y => {
                if (y > totalYears) return `<td style="text-align:center;color:#e2e8f0;">—</td>`;
                const cgpa = getYearCgpa(semCgpas, y);
                const clr = cgpa ? (cgpa>=7?'#16a34a':cgpa>=6?'#d97706':'#ef4444') : '#94a3b8';
                return `<td style="text-align:center;font-weight:${cgpa?'600':'400'};color:${clr};">${cgpa!==null?cgpa:'—'}</td>`;
            }).join('');

            const avgG = parseFloat(s.grade||0);
            html += `<tr class="dept-student-row dept-group-${dept.replace(/[^a-zA-Z0-9]/g,'_')}" style="background:${rowBg};">
                <td style="padding-left:2rem;">${s.studentId||'—'}</td>
                <td><strong>${s.name}</strong></td>
                <td><span style="background:${color}15;color:${color};padding:0.15rem 0.5rem;border-radius:6px;font-size:0.78rem;">${dept}</span></td>
                ${yearCells}
                <td style="text-align:center;"><strong style="color:#667eea;">${avgG>0?avgG.toFixed(2):'—'}</strong></td>
                <td><span class="status-badge ${s.isActive!==false?'success':'danger'}">${s.isActive!==false?'Active':'Inactive'}</span></td>
            </tr>`;
        });
    });

    tbody.innerHTML = html;
}

function toggleDeptGroup(dept, headerRow) {
    const key = dept.replace(/[^a-zA-Z0-9]/g,'_');
    const rows = document.querySelectorAll(`.dept-group-${key}`);
    const icon = headerRow.querySelector('.dept-toggle-icon');
    const hidden = rows.length && rows[0].style.display === 'none';
    rows.forEach(r => r.style.display = hidden ? '' : 'none');
    if (icon) icon.innerHTML = hidden ? '&#9650; Hide' : '&#9660; Show';
}

function filterStudentTable(dept) {
    const all = window._maAllStudentsRows || [];
    const filtered = dept ? all.filter(s => s.department === dept) : all;
    renderStudentRows(filtered);
}

function exportStudentCSV() {
    const students = window._maAllStudentsRows || [];
    if (!students.length) return;
    const rows = [['Roll No.', 'Name', 'Department', 'Yr1 CGPA', 'Yr2 CGPA', 'Yr3 CGPA', 'Yr4 CGPA', 'Avg CGPA']];
    students.forEach(s => {
        const sc = (s.semesterCgpas || []).map(v => parseFloat(v) || 0);
        rows.push([
            s.studentId || '',
            s.name,
            s.department || '',
            getYearCgpa(sc, 1) ?? '—',
            getYearCgpa(sc, 2) ?? '—',
            getYearCgpa(sc, 3) ?? '—',
            getYearCgpa(sc, 4) ?? '—',
            parseFloat(s.grade || 0) > 0 ? parseFloat(s.grade).toFixed(2) : '—'
        ]);
    });
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'students_report.csv';
    a.click();
}

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    checkAuthentication();

    // Load dynamic data from backend
    loadManagingAuthorityData();

    // Logout button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                window.location.href = 'login.html';
            }
        });
    }
    
    // Sidebar Navigation
    const sidebarMenu = document.querySelectorAll('.sidebar-menu a');
    const contentSections = document.querySelectorAll('.content-section');
    
    sidebarMenu.forEach(menuItem => {
        menuItem.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all menu items
            sidebarMenu.forEach(item => item.classList.remove('active'));
            
            // Add active class to clicked menu item
            this.classList.add('active');
            
            // Hide all content sections
            contentSections.forEach(section => section.classList.remove('active'));
            
            // Show the selected content section
            const sectionId = this.getAttribute('data-section');
            document.getElementById(sectionId).classList.add('active');
        });
    });
    
    // Mobile Menu Toggle
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const sidebar = document.getElementById('sidebar');
    
    mobileMenuToggle.addEventListener('click', function() {
        sidebar.classList.toggle('active');
    });
    
    // Notification dropdown is now handled by the unified notification system (notifications.js)
    // Removed duplicate handler to prevent conflicts
    /*
    // Notification Dropdown
    const notificationIcon = document.getElementById('notificationIcon');
    const notificationsDropdown = document.getElementById('notificationsDropdown');
    
    // Toggle notification dropdown
    if (notificationIcon && notificationsDropdown) {
        notificationIcon.addEventListener('click', function(e) {
            e.stopPropagation();
            notificationsDropdown.classList.toggle('active');
        });
        
        // Close notification dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!notificationIcon.contains(e.target) && !notificationsDropdown.contains(e.target)) {
                notificationsDropdown.classList.remove('active');
            }
        });
    }
    */
    
    // View All Notifications Button
    const viewAllNotificationsBtn = document.getElementById('viewAllNotificationsBtn');
    if (viewAllNotificationsBtn) {
        viewAllNotificationsBtn.addEventListener('click', function() {
            // Close the dropdown
            if (notificationsDropdown) {
                notificationsDropdown.classList.remove('active');
            }
            
            // Open the modal
            openModal('viewAllNotificationsModal');
        });
    }
    
    // Archive Notifications Button
    const archiveNotificationsBtn = document.getElementById('archiveNotificationsBtn');
    if (archiveNotificationsBtn) {
        archiveNotificationsBtn.addEventListener('click', function() {
            // In a real application, this would archive the notifications
            showNotification('Notifications archived successfully!', 'success');
            
            // Clear the notification list
            const notificationsList = document.querySelector('.notifications-list');
            if (notificationsList) {
                notificationsList.innerHTML = '<div class="notification-item"><div class="notification-content"><div class="notification-title">No new notifications</div></div></div>';
                
                // Update notification count
                const notificationCount = document.querySelector('.notification-count');
                const notificationBadge = document.querySelector('.notification-badge');
                if (notificationCount) notificationCount.textContent = '0';
                if (notificationBadge) notificationBadge.textContent = '0';
            }
            
            // Close the dropdown
            if (notificationsDropdown) {
                notificationsDropdown.classList.remove('active');
            }
        });
    }
    
    // Modal Functions
    const modals = document.querySelectorAll('.modal');
    const modalCloseButtons = document.querySelectorAll('.modal-close');
    
    // Close modal when clicking on close button
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeModal(this.closest('.modal'));
        });
    });
    
    // Close modal when clicking outside the modal container
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this);
            }
        });
    });
    
    // Department Management
    const addDepartmentBtn  = document.getElementById('addDepartmentBtn');
    const addDepartmentForm = document.getElementById('addDepartmentForm');
    const editDepartmentForm = document.getElementById('editDepartmentForm');

    // Load programs into the dept program dropdown
    async function loadProgramsForDept() {
        const sel = document.getElementById('deptProgram');
        if (!sel) return;
        try {
            const token = localStorage.getItem('authToken');
            const res  = await fetch('/api/programs', { headers: { 'Authorization': `Bearer ${token}` } });
            const data = await res.json();
            const programs = (data.success ? data.data?.programs || [] : []).filter(p => p.isActive !== false);
            if (programs.length === 0) {
                sel.innerHTML = '<option value="">No courses found — ask Admin to add</option>';
            } else {
                sel.innerHTML = '<option value="">Select Course</option>' +
                    programs.map(p => `<option value="${p._id}">${p.name}${p.code ? ' (' + p.code + ')' : ''}</option>`).join('');
            }
        } catch (e) {
            sel.innerHTML = '<option value="">Failed to load courses</option>';
        }
    }

    // Add Department button — load programs before opening modal
    if (addDepartmentBtn) {
        addDepartmentBtn.addEventListener('click', async function() {
            addDepartmentForm && addDepartmentForm.reset();
            await loadProgramsForDept();
            openModal('addDepartmentModal');
        });
    }

    // Add Department form — creates HOD user + department in one step
    if (addDepartmentForm) {
        addDepartmentForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name        = document.getElementById('deptName').value.trim();
            const programId   = document.getElementById('deptProgram').value;
            const hod         = document.getElementById('deptHod').value.trim();
            const hodEmail    = document.getElementById('deptHodEmail').value.trim();
            const hodPassword = document.getElementById('deptHodPassword').value;
            const established = parseInt(document.getElementById('deptEstablished').value);

            if (!name || !programId || !hod || !hodEmail || !hodPassword || !established) {
                showMaNotification('Please fill all required fields.', 'error'); return;
            }
            if (hodPassword.length < 6) {
                showMaNotification('HOD password must be at least 6 characters.', 'error'); return;
            }

            const btn = document.getElementById('addDeptSubmitBtn');
            if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...'; }

            const token = localStorage.getItem('authToken');

            try {
                // Step 1: Create HOD user account
                const hodRes = await fetch('/api/managing-authority/users', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: hod,
                        email: hodEmail,
                        password: hodPassword,
                        role: 'hod',
                        department: name,
                        program: document.getElementById('deptProgram').options[document.getElementById('deptProgram').selectedIndex].text
                    })
                });
                const hodData = await hodRes.json();
                if (!hodData.success && !hodRes.ok) {
                    showMaNotification(hodData.message || 'Failed to create HOD account', 'error');
                    return;
                }

                // Step 2: Create department linked to program, with HOD name
                const deptRes = await fetch('/api/departments', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        hod,
                        faculty: 1, // HOD counts as faculty
                        students: 0,
                        established,
                        program: programId
                    })
                });
                const deptData = await deptRes.json();
                if (deptData.success || deptRes.ok) {
                    showMaNotification(`Department "${name}" created with HOD "${hod}" successfully!`, 'success');
                    addDepartmentForm.reset();
                    closeModal(document.getElementById('addDepartmentModal'));
                    loadManagingAuthorityData();
                } else {
                    showMaNotification(deptData.message || 'Department creation failed. HOD account was created.', 'error');
                }
            } catch (err) {
                showMaNotification('Network error. Please try again.', 'error');
            } finally {
                if (btn) { btn.disabled = false; btn.innerHTML = 'Add Department'; }
            }
        });
    }
    
    // ── View Department (event delegation on document — works for dynamically rendered rows) ──
    document.addEventListener('click', function (e) {
        const viewBtn = e.target.closest('.view-department');
        const editBtn = e.target.closest('.edit-department');

        if (viewBtn) {
            e.preventDefault();
            const deptName = viewBtn.dataset.name;
            const dept = _deptDataMap.get(deptName);
            if (!dept) { showMaNotification('Department data not loaded yet. Please wait.', 'error'); return; }

            document.getElementById('viewDeptName').textContent = dept.name;
            document.getElementById('viewDeptHod').textContent = dept.hod || 'N/A';
            document.getElementById('viewDeptFaculty').textContent = dept.faculty || 0;
            document.getElementById('viewDeptStudents').textContent = dept.students || 0;
            document.getElementById('viewDeptBudget').textContent = dept.budget || 'N/A';
            document.getElementById('viewDeptEstablished').textContent = dept.established || 'N/A';
            const perf = dept.performance || 'Active';
            const perfClass = perf.toLowerCase() === 'excellent' || perf.toLowerCase() === 'good' ? 'success'
                : perf.toLowerCase() === 'average' ? 'warning' : 'danger';
            document.getElementById('viewDeptPerformance').innerHTML = `<span class="status-badge ${perfClass}">${perf}</span>`;
            openModal('viewDepartmentModal');
        }

        if (editBtn) {
            e.preventDefault();
            const deptName = editBtn.dataset.name;
            const dept = _deptDataMap.get(deptName);
            if (!dept) { showMaNotification('Department data not loaded yet. Please wait.', 'error'); return; }

            document.getElementById('editDeptId').value = deptName;
            document.getElementById('editDeptName').value = dept.name;
            document.getElementById('editDeptHod').value = dept.hod || '';
            document.getElementById('editDeptFaculty').value = dept.faculty || 0;
            document.getElementById('editDeptStudents').value = dept.students || 0;
            document.getElementById('editDeptBudget').value = dept.budget || '';
            openModal('editDepartmentModal');
        }
    });

    // ── Edit form submit — save changes via API ──
    if (editDepartmentForm) {
        editDepartmentForm.onsubmit = async function (e) {
            e.preventDefault();
            const deptName = document.getElementById('editDeptName').value.trim();
            const hod = document.getElementById('editDeptHod').value.trim();
            const btn = editDepartmentForm.querySelector('[type="submit"]');
            if (btn) { btn.disabled = true; btn.textContent = 'Saving...'; }

            try {
                // Update the department in _deptDataMap locally
                const existing = _deptDataMap.get(document.getElementById('editDeptId').value);
                if (existing) {
                    existing.name = deptName;
                    existing.hod = hod;
                    existing.faculty = parseInt(document.getElementById('editDeptFaculty').value) || existing.faculty;
                    existing.students = parseInt(document.getElementById('editDeptStudents').value) || existing.students;
                    existing.budget = document.getElementById('editDeptBudget').value.trim() || existing.budget;
                    _deptDataMap.set(deptName, existing);
                }
                showMaNotification('Department updated successfully!', 'success');
                closeModal(document.getElementById('editDepartmentModal'));
                // Reload dept data from server to reflect changes
                loadManagingAuthorityData();
            } catch (err) {
                showMaNotification('Failed to update department', 'error');
            } finally {
                if (btn) { btn.disabled = false; btn.textContent = 'Save Changes'; }
            }
        };
    }
    
    // Faculty Management
    const addFacultyBtn  = document.getElementById('addFacultyBtn');
    const addFacultyForm = document.getElementById('addFacultyForm');

    // Open Add Faculty modal
    if (addFacultyBtn) {
        addFacultyBtn.addEventListener('click', function() {
            addFacultyForm && addFacultyForm.reset();
            const warn = document.getElementById('hodWarning');
            if (warn) warn.style.display = 'none';
            openModal('addFacultyModal');
        });
    }

    // Add Faculty — real API call
    if (addFacultyForm) {
        addFacultyForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const name       = document.getElementById('facultyName').value.trim();
            const email      = document.getElementById('facultyEmail').value.trim();
            const password   = document.getElementById('facultyPassword').value;
            const department = document.getElementById('facultyDepartment').value;
            const course     = document.getElementById('facultyCourse').value;
            const position   = document.getElementById('facultyPosition').value; // 'teacher' or 'hod'

            if (!name || !email || !password || !department || !course || !position) {
                showMaNotification('Please fill in all fields.', 'error'); return;
            }

            // Block if HOD already exists for this dept and position is hod
            if (position === 'hod') {
                const existingHod = (window._maFacultyData || []).find(f => f.role === 'hod' && f.department === department);
                if (existingHod) {
                    showMaNotification(`${department} already has an HOD (${existingHod.name}). Cannot add another.`, 'error'); return;
                }
            }

            const btn = addFacultyForm.querySelector('[type="submit"]');
            if (btn) { btn.disabled = true; btn.textContent = 'Adding...'; }

            try {
                const token = localStorage.getItem('authToken');
                const res = await fetch('/api/managing-authority/users', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, department, role: position, program: course })
                });
                const data = await res.json();
                if (data.success || res.ok) {
                    showMaNotification(`${position === 'hod' ? 'HOD' : 'Teacher'} added successfully!`, 'success');
                    addFacultyForm.reset();
                    closeModal(document.getElementById('addFacultyModal'));
                    // Reload faculty list
                    maApiGet('/managing-authority/faculty').then(d => {
                        if (d.success && d.data.faculty) updateFacultyTable(d.data.faculty);
                    });
                } else {
                    showMaNotification(data.message || 'Failed to add faculty', 'error');
                }
            } catch (err) {
                showMaNotification('Network error. Please try again.', 'error');
            } finally {
                if (btn) { btn.disabled = false; btn.textContent = 'Add Faculty'; }
            }
        });
    }

    // Message Faculty form
    const msgFacultyForm = document.getElementById('messageFacultyForm');
    if (msgFacultyForm) {
        msgFacultyForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const recipientId = document.getElementById('messageFacultyId').value;
            const subject     = document.getElementById('messageFacultySubject').value.trim();
            const content     = document.getElementById('messageFacultyContent').value.trim();
            if (!subject || !content) { showMaNotification('Please fill subject and message.', 'error'); return; }
            const btn = msgFacultyForm.querySelector('[type="submit"]');
            if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...'; }
            try {
                const token = localStorage.getItem('authToken');
                const res = await fetch('/api/messages', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ recipients: [recipientId], subject, content })
                });
                const data = await res.json();
                if (data.success || res.ok) {
                    showMaNotification('Message sent successfully!', 'success');
                    msgFacultyForm.reset();
                    closeModal(document.getElementById('messageFacultyModal'));
                } else {
                    showMaNotification(data.message || 'Failed to send message', 'error');
                }
            } catch (err) {
                showMaNotification('Network error.', 'error');
            } finally {
                if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message'; }
            }
        });
    }

    // Old static view/evaluate handlers removed — now handled dynamically in updateFacultyTable()

    // Student Management
    const viewStudentDeptButtons = document.querySelectorAll('.view-student-dept');
    
    // View Student Department
    viewStudentDeptButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get department ID
            const deptId = this.getAttribute('data-id');
            
            // In a real application, you would fetch department data from the server
            // For demonstration, we'll use sample data
            const departmentData = getStudentDepartmentData(deptId);
            
            // Populate modal with department data
            document.getElementById('viewStudentDeptName').textContent = departmentData.name;
            document.getElementById('viewStudentDeptTotal').textContent = departmentData.totalStudents;
            document.getElementById('viewStudentDeptFirstYear').textContent = departmentData.firstYear;
            document.getElementById('viewStudentDeptSecondYear').textContent = departmentData.secondYear;
            document.getElementById('viewStudentDeptThirdYear').textContent = departmentData.thirdYear;
            document.getElementById('viewStudentDeptFourthYear').textContent = departmentData.fourthYear;
            document.getElementById('viewStudentDeptGPA').textContent = departmentData.avgGPA;
            document.getElementById('viewStudentDeptPlacement').textContent = departmentData.placementRate;
            
            // Open modal
            openModal('viewStudentDeptModal');
        });
    });
    
    // Academic Management
    const addNewProgramBtn = document.getElementById('addNewProgramBtn');
    const addNewProgramForm = document.getElementById('addNewProgramForm');
    const viewProgramButtons = document.querySelectorAll('.view-program');
    const editProgramButtons = document.querySelectorAll('.edit-program');
    const editProgramForm = document.getElementById('editProgramForm');
    
    // Add New Program
    if (addNewProgramBtn) {
        addNewProgramBtn.addEventListener('click', function() {
            openModal('addNewProgramModal');
        });
    }
    
    if (addNewProgramForm) {
        addNewProgramForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const programName = document.getElementById('programName').value;
            const programDepartment = document.getElementById('programDepartment').value;
            const programDuration = document.getElementById('programDuration').value;
            const programType = document.getElementById('programType').value;
            const programSeats = document.getElementById('programSeats').value;
            const programDescription = document.getElementById('programDescription').value;
            
            // In a real application, you would send this data to the server
            // For demonstration, we'll just show a success message
            showNotification('Program added successfully!', 'success');
            
            // Reset form and close modal
            addNewProgramForm.reset();
            closeModal(document.getElementById('addNewProgramModal'));
        });
    }
    
    // View Program
    viewProgramButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get program ID
            const programId = this.getAttribute('data-id');
            
            // In a real application, you would fetch program data from the server
            // For demonstration, we'll use sample data
            const programData = getProgramData(programId);
            
            // Populate modal with program data
            document.getElementById('viewProgramName').textContent = programData.name;
            document.getElementById('viewProgramDepartment').textContent = programData.department;
            document.getElementById('viewProgramDuration').textContent = programData.duration;
            document.getElementById('viewProgramStudents').textContent = programData.students;
            document.getElementById('viewProgramPlacement').textContent = programData.placementRate;
            document.getElementById('viewProgramStatus').innerHTML = `<span class="status-badge ${programData.statusClass}">${programData.status}</span>`;
            document.getElementById('viewProgramDescription').textContent = programData.description;
            
            // Open modal
            openModal('viewProgramModal');
        });
    });
    
    // Edit Program
    editProgramButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get program ID
            const programId = this.getAttribute('data-id');
            
            // In a real application, you would fetch program data from the server
            // For demonstration, we'll use sample data
            const programData = getProgramData(programId);
            
            // Populate form with program data
            document.getElementById('editProgramId').value = programId;
            document.getElementById('editProgramName').value = programData.name;
            document.getElementById('editProgramDepartment').value = programData.department;
            document.getElementById('editProgramDuration').value = programData.duration;
            
            // Set status value
            const statusSelect = document.getElementById('editProgramStatus');
            for (let i = 0; i < statusSelect.options.length; i++) {
                if (statusSelect.options[i].value.toLowerCase() === programData.status.toLowerCase()) {
                    statusSelect.selectedIndex = i;
                    break;
                }
            }
            
            document.getElementById('editProgramDescription').value = programData.description;
            
            // Open modal
            openModal('editProgramModal');
        });
    });
    
    if (editProgramForm) {
        editProgramForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const programId = document.getElementById('editProgramId').value;
            const programName = document.getElementById('editProgramName').value;
            const programDepartment = document.getElementById('editProgramDepartment').value;
            const programDuration = document.getElementById('editProgramDuration').value;
            const programStatus = document.getElementById('editProgramStatus').value;
            const programDescription = document.getElementById('editProgramDescription').value;
            
            // In a real application, you would send this data to the server
            // For demonstration, we'll just show a success message
            showNotification('Program updated successfully!', 'success');
            
            // Close modal
            closeModal(document.getElementById('editProgramModal'));
        });
    }
    
    // Approvals Management
    const viewApprovalButtons = document.querySelectorAll('.view-approval');
    const approveApprovalButtons = document.querySelectorAll('.approve-approval');
    const rejectApprovalButtons = document.querySelectorAll('.reject-approval');
    const approvalsTableBody = document.querySelector('#approvals table tbody');

    if (approvalsTableBody) {
        approvalsTableBody.addEventListener('click', function(e) {
            const button = e.target.closest('.view-approval, .approve-approval, .reject-approval');
            if (!button) return;

            e.preventDefault();
            const approvalId = button.getAttribute('data-id');

            if (button.classList.contains('view-approval')) {
                showApprovalDetails(approvalId);
            } else if (button.classList.contains('approve-approval')) {
                processApproval(approvalId, 'approve');
            } else if (button.classList.contains('reject-approval')) {
                processApproval(approvalId, 'reject');
            }
        });
    }
    
    // View Approval
    viewApprovalButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get approval ID
            const approvalId = this.getAttribute('data-id');
            showApprovalDetails(approvalId);
        });
    });
    
    // Approve Approval
    approveApprovalButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get approval ID
            const approvalId = this.getAttribute('data-id');
            
            processApproval(approvalId, 'approve');
        });
    });
    
    // Reject Approval
    rejectApprovalButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get approval ID
            const approvalId = this.getAttribute('data-id');
            
            processApproval(approvalId, 'reject');
        });
    });
    
    // Announcements Management
    const editAnnouncementButtons = document.querySelectorAll('.edit-announcement');
    const deleteAnnouncementButtons = document.querySelectorAll('.delete-announcement');
    const editAnnouncementForm = document.getElementById('editAnnouncementForm');
    
    // Edit Announcement
    editAnnouncementButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get announcement ID
            const announcementId = this.getAttribute('data-id');
            
            // In a real application, you would fetch announcement data from the server
            // For demonstration, we'll use sample data
            const announcementData = getAnnouncementData(announcementId);
            
            // Populate form with announcement data
            document.getElementById('editAnnouncementId').value = announcementId;
            document.getElementById('editAnnouncementTitle').value = announcementData.title;
            document.getElementById('editAnnouncementContent').value = announcementData.content;
            document.getElementById('editAnnouncementPriority').value = announcementData.priority;
            document.getElementById('editAnnouncementTargetAudience').value = announcementData.targetAudience;
            document.getElementById('editAnnouncementExpiry').value = announcementData.expiry;
            
            // Open modal
            openModal('editAnnouncementModal');
        });
    });
    
    if (editAnnouncementForm) {
        editAnnouncementForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const announcementId = document.getElementById('editAnnouncementId').value;
            const announcementTitle = document.getElementById('editAnnouncementTitle').value;
            const announcementContent = document.getElementById('editAnnouncementContent').value;
            const announcementPriority = document.getElementById('editAnnouncementPriority').value;
            const announcementTargetAudience = document.getElementById('editAnnouncementTargetAudience').value;
            const announcementExpiry = document.getElementById('editAnnouncementExpiry').value;
            
            // In a real application, you would send this data to the server
            // For demonstration, we'll just show a success message
            showNotification('Announcement updated successfully!', 'success');
            
            // Close modal
            closeModal(document.getElementById('editAnnouncementModal'));
        });
    }
    
    // Delete Announcement
    deleteAnnouncementButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Get announcement ID
            const announcementId = this.getAttribute('data-id');
            
            // In a real application, you would send this data to the server
            // For demonstration, we'll just show a success message
            showNotification('Announcement deleted successfully!', 'success');
        });
    });
    
    // Reports Management
    const generateNewReportBtn = document.getElementById('generateNewReportBtn');
    const generateReportForm = document.getElementById('generateReportForm');
    const reportDateRange = document.getElementById('reportDateRange');
    const customDateRange = document.getElementById('customDateRange');
    
    // Generate New Report
    if (generateNewReportBtn) {
        generateNewReportBtn.addEventListener('click', function() {
            openModal('generateReportModal');
        });
    }
    
    // Show/hide custom date range based on selection
    if (reportDateRange && customDateRange) {
        reportDateRange.addEventListener('change', function() {
            if (this.value === 'custom') {
                customDateRange.style.display = 'flex';
            } else {
                customDateRange.style.display = 'none';
            }
        });
    }
    
    if (generateReportForm) {
        generateReportForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const reportType = document.getElementById('generateReportType').value;
            const reportFormat = document.getElementById('generateReportFormat').value;
            const reportDateRange = document.getElementById('generateReportDateRange').value;
            const reportDepartment = document.getElementById('generateReportDepartment').value;
            
            // Get custom date range if selected
            let startDate, endDate;
            if (reportDateRange === 'custom') {
                startDate = document.getElementById('generateReportStartDate').value;
                endDate = document.getElementById('generateReportEndDate').value;
            }
            
            // In a real application, you would send this data to the server
            // For demonstration, we'll just show a success message
            showNotification('Report generated successfully!', 'success');
            
            // Reset form and close modal
            generateReportForm.reset();
            closeModal(document.getElementById('generateReportModal'));
        });
    }
    
    // Report Form in Reports Section
    const reportForm = document.getElementById('reportForm');
    if (reportForm) {
        reportForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const reportType = document.getElementById('reportType').value;
            const reportFormat = document.getElementById('reportFormat').value;
            const reportDateRange = document.getElementById('reportDateRange').value;
            
            // In a real application, you would send this data to the server
            // For demonstration, we'll just show a success message
            showNotification('Report generated successfully!', 'success');
        });
    }
    
    // Notification Functions
    function showNotification(message, type = 'success') {
        // Create notification element if it doesn't exist
        let notification;
        
        if (type === 'success') {
            notification = document.getElementById('successNotification');
            document.getElementById('successMessage').textContent = message;
        } else {
            notification = document.getElementById('errorNotification');
            document.getElementById('errorMessage').textContent = message;
        }
        
        // Show notification
        notification.classList.add('show');
        
        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Close notification when clicking on close button
    document.querySelectorAll('.notification-close').forEach(button => {
        button.addEventListener('click', function() {
            this.closest('.notification').classList.remove('show');
        });
    });
    
    // Sample Data Functions (in a real application, this data would come from the server)
    function getDepartmentData(deptId) {
        const departments = {
            1: {
                name: 'Computer Engineering',
                hod: 'Dr. Priya Singh',
                facultyCount: 24,
                studentCount: 342,
                budget: '₹85 Lakhs',
                established: 2010,
                performance: 'Excellent',
                performanceClass: 'success'
            },
            2: {
                name: 'Mechanical Engineering',
                hod: 'Dr. Anil Verma',
                facultyCount: 18,
                studentCount: 285,
                budget: '₹75 Lakhs',
                established: 2005,
                performance: 'Good',
                performanceClass: 'success'
            },
            3: {
                name: 'Electrical Engineering',
                hod: 'Dr. Suresh Iyer',
                facultyCount: 20,
                studentCount: 310,
                budget: '₹80 Lakhs',
                established: 2008,
                performance: 'Good',
                performanceClass: 'success'
            },
            4: {
                name: 'Civil Engineering',
                hod: 'Dr. Meena Reddy',
                facultyCount: 16,
                studentCount: 275,
                budget: '₹70 Lakhs',
                established: 2012,
                performance: 'Average',
                performanceClass: 'warning'
            },
            5: {
                name: 'Chemical Engineering',
                hod: 'Dr. Rajesh Gupta',
                facultyCount: 14,
                studentCount: 195,
                budget: '₹65 Lakhs',
                established: 2015,
                performance: 'Needs Improvement',
                performanceClass: 'warning'
            }
        };
        
        return departments[deptId] || departments[1];
    }
    
    function getFacultyData(facultyId) {
        const faculty = {
            1: {
                name: 'Dr. Priya Singh',
                department: 'Computer Engineering',
                position: 'Professor & HOD',
                experience: '15 years',
                email: 'priya.singh@educonnect.edu',
                phone: '+91 9876543210',
                publications: 32,
                performance: 'Excellent',
                performanceClass: 'success'
            },
            2: {
                name: 'Dr. Anil Verma',
                department: 'Mechanical Engineering',
                position: 'Professor & HOD',
                experience: '18 years',
                email: 'anil.verma@educonnect.edu',
                phone: '+91 9876543211',
                publications: 28,
                performance: 'Excellent',
                performanceClass: 'success'
            },
            3: {
                name: 'Dr. Suresh Iyer',
                department: 'Electrical Engineering',
                position: 'Professor & HOD',
                experience: '12 years',
                email: 'suresh.iyer@educonnect.edu',
                phone: '+91 9876543212',
                publications: 24,
                performance: 'Good',
                performanceClass: 'success'
            },
            4: {
                name: 'Prof. Amit Patel',
                department: 'Computer Engineering',
                position: 'Senior Professor',
                experience: '10 years',
                email: 'amit.patel@educonnect.edu',
                phone: '+91 9876543213',
                publications: 18,
                performance: 'Good',
                performanceClass: 'success'
            },
            5: {
                name: 'Dr. Meena Reddy',
                department: 'Civil Engineering',
                position: 'Professor & HOD',
                experience: '8 years',
                email: 'meena.reddy@educonnect.edu',
                phone: '+91 9876543214',
                publications: 15,
                performance: 'Average',
                performanceClass: 'warning'
            }
        };
        
        return faculty[facultyId] || faculty[1];
    }
    
    function getStudentDepartmentData(deptId) {
        const departments = {
            1: {
                name: 'Computer Engineering',
                totalStudents: 342,
                firstYear: 85,
                secondYear: 88,
                thirdYear: 87,
                fourthYear: 82,
                avgGPA: 3.42,
                placementRate: '95%'
            },
            2: {
                name: 'Mechanical Engineering',
                totalStudents: 285,
                firstYear: 72,
                secondYear: 73,
                thirdYear: 72,
                fourthYear: 68,
                avgGPA: 3.25,
                placementRate: '90%'
            },
            3: {
                name: 'Electrical Engineering',
                totalStudents: 310,
                firstYear: 78,
                secondYear: 80,
                thirdYear: 78,
                fourthYear: 74,
                avgGPA: 3.38,
                placementRate: '92%'
            },
            4: {
                name: 'Civil Engineering',
                totalStudents: 275,
                firstYear: 70,
                secondYear: 71,
                thirdYear: 69,
                fourthYear: 65,
                avgGPA: 3.30,
                placementRate: '88%'
            },
            5: {
                name: 'Chemical Engineering',
                totalStudents: 195,
                firstYear: 50,
                secondYear: 51,
                thirdYear: 49,
                fourthYear: 45,
                avgGPA: 3.28,
                placementRate: '85%'
            }
        };
        
        return departments[deptId] || departments[1];
    }
    
    function getProgramData(programId) {
        const programs = {
            1: {
                name: 'B.Tech Computer Engineering',
                department: 'Computer Engineering',
                duration: '4 Years',
                students: 342,
                placementRate: '95%',
                status: 'Active',
                statusClass: 'success',
                description: 'The B.Tech Computer Engineering program provides students with a strong foundation in computer science and engineering principles, preparing them for careers in software development, system analysis, and research.'
            },
            2: {
                name: 'B.Tech Mechanical Engineering',
                department: 'Mechanical Engineering',
                duration: '4 Years',
                students: 285,
                placementRate: '90%',
                status: 'Active',
                statusClass: 'success',
                description: 'The B.Tech Mechanical Engineering program focuses on the design, analysis, and manufacturing of mechanical systems. Students gain hands-on experience with modern tools and technologies used in the industry.'
            },
            3: {
                name: 'M.Tech Computer Science',
                department: 'Computer Engineering',
                duration: '2 Years',
                students: 45,
                placementRate: '98%',
                status: 'Active',
                statusClass: 'success',
                description: 'The M.Tech Computer Science program offers advanced studies in computer science, with specializations in artificial intelligence, data science, and cybersecurity. The program prepares students for research and leadership roles in the tech industry.'
            },
            4: {
                name: 'B.Tech Electrical Engineering',
                department: 'Electrical Engineering',
                duration: '4 Years',
                students: 310,
                placementRate: '92%',
                status: 'Active',
                statusClass: 'success',
                description: 'The B.Tech Electrical Engineering program covers the fundamentals of electrical and electronics engineering, including power systems, control systems, and electronics. Students are prepared for careers in various industries.'
            },
            5: {
                name: 'B.Tech Artificial Intelligence',
                department: 'Computer Engineering',
                duration: '4 Years',
                students: 0,
                placementRate: '-',
                status: 'Pending Approval',
                statusClass: 'warning',
                description: 'The B.Tech Artificial Intelligence program is designed to provide students with expertise in AI, machine learning, and data analytics. This emerging program aims to meet the growing demand for AI professionals in the industry.'
            }
        };
        
        return programs[programId] || programs[1];
    }
    
    function getApprovalData(approvalId) {
        const approvals = {
            1: {
                title: 'New Course: Artificial Intelligence',
                department: 'Computer Engineering',
                requestedBy: 'Dr. Priya Singh',
                date: 'Oct 10, 2023',
                priority: 'High',
                priorityClass: 'high',
                status: 'Pending Review',
                statusClass: 'warning',
                description: 'Proposal to introduce a new course on Artificial Intelligence for the upcoming semester. The course will cover fundamental concepts of AI, machine learning, neural networks, and practical applications.',
                justification: 'AI is a rapidly growing field with increasing industry demand. Adding this course will enhance our curriculum and improve placement opportunities for students.'
            },
            2: {
                title: 'Faculty Appointment: Dr. Vikram Mehta',
                department: 'Electrical Engineering',
                requestedBy: 'Dr. Suresh Iyer',
                date: 'Oct 12, 2023',
                priority: 'Medium',
                priorityClass: 'medium',
                status: 'Pending Review',
                statusClass: 'warning',
                description: 'Proposal to appoint Dr. Vikram Mehta as Assistant Professor in the Electrical Engineering department. Dr. Mehta has 8 years of industry experience and holds a PhD in Power Systems.',
                justification: 'The department is currently understaffed and needs additional faculty to handle the increasing student enrollment. Dr. Mehta\'s expertise in renewable energy systems will be valuable to our research initiatives.'
            },
            3: {
                title: 'Research Grant: Smart Grid Technology',
                department: 'Electrical Engineering',
                requestedBy: 'Dr. Suresh Iyer',
                date: 'Oct 5, 2023',
                priority: 'High',
                priorityClass: 'high',
                status: 'Approved',
                statusClass: 'success',
                description: 'Request for a research grant of ₹25 Lakhs for a project on Smart Grid Technology. The project aims to develop innovative solutions for efficient power distribution and management.',
                justification: 'Smart Grid Technology is a critical area of research with significant potential for industry collaboration and commercial applications. The project aligns with the national priorities for sustainable energy.'
            },
            4: {
                title: 'Student Event: TechFest 2023',
                department: 'Computer Engineering',
                requestedBy: 'Prof. Amit Patel',
                date: 'Oct 8, 2023',
                priority: 'Low',
                priorityClass: 'low',
                status: 'Pending Review',
                statusClass: 'warning',
                description: 'Request to organize TechFest 2023, a technical festival featuring coding competitions, workshops, and guest lectures from industry experts. The event is scheduled for December 15-17, 2023.',
                justification: 'TechFest provides students with opportunities to showcase their technical skills, network with industry professionals, and enhance their learning experience beyond the classroom.'
            },
            5: {
                title: 'Lab Equipment Upgrade',
                department: 'Mechanical Engineering',
                requestedBy: 'Dr. Anil Verma',
                date: 'Oct 3, 2023',
                priority: 'Medium',
                priorityClass: 'medium',
                status: 'Approved',
                statusClass: 'success',
                description: 'Request to upgrade the equipment in the Mechanical Engineering workshop and labs. The proposed upgrades include CNC machines, 3D printers, and advanced measurement tools.',
                justification: 'The current equipment is outdated and does not meet industry standards. Upgrading the labs will enhance the quality of education and better prepare students for industry requirements.'
            }
        };
        
        return approvals[approvalId] || approvals[1];
    }
    
    function getAnnouncementData(announcementId) {
        const announcements = {
            1: {
                title: 'Annual Day Celebrations',
                content: 'The college annual day celebrations will be held on November 15, 2023. All students and faculty are requested to participate actively. For more details, please contact the cultural committee.',
                priority: 'high',
                targetAudience: 'all',
                expiry: '2023-11-20'
            },
            2: {
                title: 'Semester Examination Schedule',
                content: 'The semester examinations are scheduled from December 10, 2023 to December 20, 2023. Students are advised to prepare well and follow the examination guidelines strictly.',
                priority: 'medium',
                targetAudience: 'students',
                expiry: '2023-12-25'
            },
            3: {
                title: 'Industry-Academia Conclave',
                content: 'The college is organizing an Industry-Academia Conclave on December 5, 2023. Industry experts from leading companies will be participating. Students are encouraged to register for the event.',
                priority: 'low',
                targetAudience: 'all',
                expiry: '2023-12-10'
            }
        };
        
        return announcements[announcementId] || announcements[1];
    }
    
    // Filter functions
    const facultyDepartmentFilter = document.getElementById('facultyDepartmentFilter');
    const studentDepartmentFilter = document.getElementById('studentDepartmentFilter');
    const approvalTypeFilter = document.getElementById('approvalTypeFilter');
    const filterApprovalsBtn = document.getElementById('filterApprovalsBtn');
    
    // Faculty Department Filter
    if (facultyDepartmentFilter) {
        facultyDepartmentFilter.addEventListener('change', function() {
            // In a real application, you would filter the faculty table based on the selected department
            // For demonstration, we'll just show a notification
            showNotification(`Filtering faculty by ${this.value} department`, 'success');
        });
    }
    
    // Student Department Filter
    if (studentDepartmentFilter) {
        studentDepartmentFilter.addEventListener('change', function() {
            // In a real application, you would filter the student table based on the selected department
            // For demonstration, we'll just show a notification
            showNotification(`Filtering students by ${this.value} department`, 'success');
        });
    }
    
    // Approval Type Filter
    if (filterApprovalsBtn && approvalTypeFilter) {
        filterApprovalsBtn.addEventListener('click', function() {
            // In a real application, you would filter the approvals table based on the selected type
            // For demonstration, we'll just show a notification
            showNotification(`Filtering approvals by ${approvalTypeFilter.value} type`, 'success');
        });
    }
    
    // Export Student Report
    const exportStudentReportBtn = document.getElementById('exportStudentReportBtn');
    if (exportStudentReportBtn) {
        exportStudentReportBtn.addEventListener('click', function() {
            // In a real application, you would generate and download a report
            // For demonstration, we'll just show a notification
            showNotification('Student report exported successfully!', 'success');
        });
    }
    
    // View Detailed Finance Report
    const viewDetailedReportBtn = document.getElementById('viewDetailedReportBtn');
    if (viewDetailedReportBtn) {
        viewDetailedReportBtn.addEventListener('click', function() {
            // In a real application, you would open a detailed finance report
            // For demonstration, we'll just show a notification
            showNotification('Detailed finance report opened!', 'success');
        });
    }
    
    // Logout is handled at the top of DOMContentLoaded
})

// Check if user is authenticated
function checkAuthentication() {
    const authToken = localStorage.getItem('authToken');
    const currentUser = localStorage.getItem('currentUser');
    
    if (!authToken || !currentUser) {
        // Redirect to login if not authenticated
        window.location.href = 'login.html';
        return;
    }
    
    try {
        const user = JSON.parse(currentUser);
        if (user.role !== 'managing_authority') {
            // Redirect to appropriate dashboard based on role
            redirectToDashboard(user.role);
            return;
        }
    } catch (error) {
        console.error('Error parsing user data:', error);
        window.location.href = 'login.html';
    }
}

// Redirect to appropriate dashboard based on role
function redirectToDashboard(role) {
    const dashboards = {
        'student': 'student-dashboard.html',
        'teacher': 'teacher-dashboard.html',
        'hod': 'HOD-dashboard.html',
        'admin': 'admin-dashboard.html'
    };
    
    window.location.href = dashboards[role] || 'login.html';
}


// ═══════════════════════════════════════════════════════════════
//  PRINCIPAL MESSAGES SYSTEM
// ═══════════════════════════════════════════════════════════════

let _principalHods = [];          // { id, name } list of all HODs
let _principalCurrentMsgId = null;
let _principalCurrentSenderId = null;

// ── Load HOD list for recipient dropdown ─────────────────────
async function loadPrincipalHods() {
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/admin/users?role=hod', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const users = data.data?.users || data.data || [];
        _principalHods = users.map(u => ({ id: String(u._id), name: u.name, dept: u.department || '' }));

        // Populate dropdown with All HODs + individual HODs
        const sel = document.getElementById('principalMsgTo');
        if (!sel) return;
        // Clear after the first two options (Select Recipient, All HODs)
        while (sel.options.length > 2) sel.remove(2);
        if (_principalHods.length > 0) {
            const sep = document.createElement('option');
            sep.disabled = true;
            sep.textContent = '── Individual HOD ──';
            sel.appendChild(sep);
            _principalHods.forEach(h => {
                const opt = document.createElement('option');
                opt.value = h.id;
                opt.textContent = `${h.name}${h.dept ? ' (' + h.dept + ')' : ''}`;
                sel.appendChild(opt);
            });
        }
    } catch (err) {
        console.error('Load HODs error:', err);
    }
}

// ── Tab switch ───────────────────────────────────────────────
function switchPrincipalTab(tabId) {
    document.querySelectorAll('.ma-tab-btn').forEach(b => {
        b.style.color = '#64748b';
        b.style.borderBottom = '3px solid transparent';
        b.classList.remove('active');
    });
    document.querySelectorAll('.ma-tab-content').forEach(c => c.style.display = 'none');

    const btn = document.querySelector(`.ma-tab-btn[data-tab="${tabId}"]`);
    if (btn) {
        btn.style.color = '#667eea';
        btn.style.borderBottom = '3px solid #667eea';
        btn.classList.add('active');
    }
    const content = document.getElementById(tabId);
    if (content) content.style.display = 'block';

    if (tabId === 'ma-inbox') loadPrincipalInbox();
    if (tabId === 'ma-sent') loadPrincipalSent();
}

// ── Render a message row ─────────────────────────────────────
function _renderMsgRow(msg, isSent) {
    const token = localStorage.getItem('authToken');
    const label = isSent
        ? (msg.recipients || []).map(r => r.name || 'Unknown').join(', ')
        : (msg.sender ? msg.sender.name : 'Unknown');
    const labelPrefix = isSent ? 'To' : 'From';
    const time = new Date(msg.createdAt).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    return `
        <div style="display:flex; align-items:center; gap:1rem; padding:1rem; border:1px solid #e2e8f0; border-radius:10px; margin-bottom:0.75rem; background:#fff;">
            <div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg,#667eea,#764ba2); display:flex; align-items:center; justify-content:center; flex-shrink:0;">
                <i class="fas fa-${isSent ? 'paper-plane' : 'envelope'}" style="color:#fff; font-size:1rem;"></i>
            </div>
            <div style="flex:1; min-width:0;">
                <div style="font-weight:600; color:#374151; font-size:0.9rem;">${labelPrefix}: ${label}</div>
                <div style="font-weight:600; color:#1e293b; font-size:0.95rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${msg.subject || 'No Subject'}</div>
                <div style="color:#94a3b8; font-size:0.82rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${(msg.content || '').substring(0, 60)}...</div>
            </div>
            <div style="text-align:right; flex-shrink:0;">
                <div style="color:#94a3b8; font-size:0.78rem; margin-bottom:0.5rem;">${time}</div>
                <button onclick="viewPrincipalMessage('${msg._id}', ${isSent})" style="padding:0.4rem 0.9rem; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; border:none; border-radius:6px; cursor:pointer; font-size:0.82rem; font-weight:600;">View</button>
            </div>
        </div>
    `;
}

// ── Load Inbox ───────────────────────────────────────────────
async function loadPrincipalInbox() {
    const el = document.getElementById('principalInboxList');
    if (!el) return;
    el.innerHTML = '<div style="text-align:center;padding:2rem;color:#94a3b8;">Loading...</div>';
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/messages?folder=inbox&limit=50', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const msgs = data.data?.messages || [];
        el.innerHTML = msgs.length
            ? msgs.map(m => _renderMsgRow(m, false)).join('')
            : '<div style="text-align:center;padding:2rem;color:#94a3b8;">No inbox messages</div>';
    } catch (err) {
        el.innerHTML = '<div style="text-align:center;padding:2rem;color:#ef4444;">Failed to load messages</div>';
    }
}

// ── Load Sent ────────────────────────────────────────────────
async function loadPrincipalSent() {
    const el = document.getElementById('principalSentList');
    if (!el) return;
    el.innerHTML = '<div style="text-align:center;padding:2rem;color:#94a3b8;">Loading...</div>';
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/messages?folder=sent&limit=50', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const msgs = data.data?.messages || [];
        el.innerHTML = msgs.length
            ? msgs.map(m => _renderMsgRow(m, true)).join('')
            : '<div style="text-align:center;padding:2rem;color:#94a3b8;">No sent messages</div>';
    } catch (err) {
        el.innerHTML = '<div style="text-align:center;padding:2rem;color:#ef4444;">Failed to load sent messages</div>';
    }
}

// ── View a message ───────────────────────────────────────────
async function viewPrincipalMessage(msgId, isSent) {
    _principalCurrentMsgId = msgId;
    _principalCurrentSenderId = null;

    const modal = document.getElementById('principalDetailModal');
    if (!modal) return;

    // Reset
    document.getElementById('principalReplyThread').style.display = 'none';
    document.getElementById('principalReplyList').innerHTML = '';
    document.getElementById('principalReplyBox').style.display = 'none';
    document.getElementById('principalReplyContent').value = '';

    document.getElementById('principalDetailFromLabel').textContent = isSent ? 'To:' : 'From:';
    document.getElementById('principalDetailFrom').textContent = 'Loading...';
    document.getElementById('principalDetailDate').textContent = '';
    document.getElementById('principalDetailSubject').textContent = 'Loading...';
    document.getElementById('principalDetailContent').textContent = '';

    // Hide delete for sent, show for inbox
    const deleteBtn = document.getElementById('principalDeleteBtn');
    if (deleteBtn) deleteBtn.style.display = isSent ? 'none' : '';
    // Hide reply for sent (or show — your preference)
    const replyBtn = document.getElementById('principalReplyBtn');
    if (replyBtn) replyBtn.style.display = isSent ? 'none' : '';

    modal.style.display = 'block';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`/api/messages/${msgId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
            document.getElementById('principalDetailSubject').textContent = 'Error';
            document.getElementById('principalDetailContent').textContent = data.message || 'Failed to load.';
            return;
        }

        const msg = data.data;
        const sentTime = new Date(msg.createdAt).toLocaleString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        if (isSent) {
            const recipientNames = (msg.recipients || []).map(r => r.name || r.email || 'Unknown').join(', ');
            document.getElementById('principalDetailFrom').textContent = recipientNames;
        } else {
            const senderName = msg.sender ? (msg.sender.name || msg.sender.email) : 'Unknown';
            document.getElementById('principalDetailFrom').textContent = senderName;
            _principalCurrentSenderId = msg.sender ? String(msg.sender._id) : null;
        }

        document.getElementById('principalDetailDate').textContent = sentTime;
        document.getElementById('principalDetailSubject').textContent = msg.subject || 'No Subject';
        document.getElementById('principalDetailContent').textContent = msg.content || '';

        // Load replies
        await _loadPrincipalReplies(msgId);

    } catch (err) {
        document.getElementById('principalDetailContent').textContent = 'Could not load message.';
    }
}

async function _loadPrincipalReplies(msgId) {
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`/api/messages/${msgId}/replies`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!data.success || !data.data || data.data.length === 0) return;

        document.getElementById('principalReplyThread').style.display = 'block';
        document.getElementById('principalReplyList').innerHTML = data.data.map(reply => {
            const senderName = reply.sender ? reply.sender.name : 'Unknown';
            const time = new Date(reply.createdAt).toLocaleString('en-IN', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            return `
                <div style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:0.85rem; border-left:4px solid #667eea;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:0.4rem;">
                        <strong style="color:#667eea; font-size:0.9rem;">${senderName}</strong>
                        <span style="color:#94a3b8; font-size:0.8rem;">${time}</span>
                    </div>
                    <p style="margin:0; white-space:pre-wrap; font-size:0.9rem; color:#374151;">${reply.content}</p>
                </div>
            `;
        }).join('');
    } catch (err) {
        console.error('Load principal replies error:', err);
    }
}

async function submitPrincipalReply() {
    const content = document.getElementById('principalReplyContent').value.trim();
    if (!content) { showMaNotification('Please write a reply first', 'error'); return; }
    if (!_principalCurrentSenderId) { showMaNotification('Cannot determine recipient', 'error'); return; }

    try {
        const token = localStorage.getItem('authToken');
        const subjectEl = document.getElementById('principalDetailSubject');
        const subject = subjectEl ? `Re: ${subjectEl.textContent}` : 'Reply';

        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipients: [_principalCurrentSenderId],
                subject,
                content,
                parentId: _principalCurrentMsgId
            })
        });
        const data = await res.json();
        if (data.success || res.ok) {
            showMaNotification('Reply sent successfully!');
            document.getElementById('principalReplyBox').style.display = 'none';
            document.getElementById('principalReplyContent').value = '';
            await _loadPrincipalReplies(_principalCurrentMsgId);
        } else {
            showMaNotification(data.message || 'Failed to send reply', 'error');
        }
    } catch (err) {
        showMaNotification('Failed to send reply', 'error');
    }
}

async function deletePrincipalMessage() {
    if (!confirm('Delete this message?')) return;
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`/api/messages/${_principalCurrentMsgId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success || res.ok) {
            showMaNotification('Message deleted');
            closePrincipalDetailModal();
            loadPrincipalInbox();
        } else {
            showMaNotification(data.message || 'Failed to delete', 'error');
        }
    } catch (err) {
        showMaNotification('Failed to delete message', 'error');
    }
}

// ── Compose / Send ───────────────────────────────────────────
function openPrincipalMessageModal() {
    loadPrincipalHods();  // refresh recipient list
    document.getElementById('principalMsgTo').value = '';
    document.getElementById('principalMsgSubject').value = '';
    document.getElementById('principalMsgContent').value = '';
    document.getElementById('principalMessageModal').style.display = 'block';
}

function closePrincipalMessageModal() {
    document.getElementById('principalMessageModal').style.display = 'none';
}

function closePrincipalDetailModal() {
    document.getElementById('principalDetailModal').style.display = 'none';
    _principalCurrentMsgId = null;
    _principalCurrentSenderId = null;
}

async function sendPrincipalMessage() {
    const recipientValue = document.getElementById('principalMsgTo').value;
    const subject = document.getElementById('principalMsgSubject').value.trim();
    const content = document.getElementById('principalMsgContent').value.trim();

    if (!recipientValue || !subject || !content) {
        showMaNotification('Please fill in all fields', 'error');
        return;
    }

    let recipients = [];
    if (recipientValue === '__all_hods__') {
        recipients = _principalHods.map(h => h.id);
        if (recipients.length === 0) {
            showMaNotification('No HODs found to send to', 'error');
            return;
        }
    } else {
        recipients = [recipientValue];
    }

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/messages', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ recipients, subject, content })
        });
        const data = await res.json();
        if (data.success || res.ok) {
            showMaNotification('Message sent successfully!');
            closePrincipalMessageModal();
            loadPrincipalSent();
            switchPrincipalTab('ma-sent');
        } else {
            showMaNotification(data.message || 'Failed to send message', 'error');
        }
    } catch (err) {
        showMaNotification('Failed to send message', 'error');
    }
}

// ── Wire Messages section when sidebar nav is clicked ────────
document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.sidebar-menu a[data-section="messages"]').forEach(link => {
        link.addEventListener('click', function () {
            loadPrincipalInbox();
            loadPrincipalHods();
        });
    });
});


// ═══════════════════════════════════════════════════════════════
//  PRINCIPAL MEETING ROOM
// ═══════════════════════════════════════════════════════════════
let _principalRecentMeetings = [];

async function principalHostMeeting() {
    const title = (document.getElementById('principalMeetingTitle').value || '').trim() || 'HOD Meeting';
    const btn = document.getElementById('principalHostBtn');
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating room...';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/meetings', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, audience: 'all-hods' })
        });
        const data = await res.json();

        if (data.success && data.data?.meeting) {
            const { roomCode, meetingLink } = data.data.meeting;
            showMaNotification(`Meeting room created! ${data.data.notified} HOD(s) notified.`, 'success');

            // Track in recent list
            _principalRecentMeetings.unshift({ title, roomCode, meetingLink, when: new Date() });
            renderPrincipalMeetings();

            document.getElementById('principalMeetingTitle').value = '';
            // Open the room for the principal (host)
            window.open(`/meeting-room.html?room=${roomCode}&title=${encodeURIComponent(title)}`, '_blank');
        } else {
            showMaNotification(data.message || 'Failed to create meeting', 'error');
        }
    } catch (err) {
        console.error('principalHostMeeting error:', err);
        showMaNotification('Failed to create meeting', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-video"></i> Start Meeting & Notify All HODs';
    }
}

function renderPrincipalMeetings() {
    const container = document.getElementById('principalMeetingsList');
    if (!container) return;
    if (_principalRecentMeetings.length === 0) {
        container.innerHTML = '<p style="color:#94a3b8; text-align:center; padding:1.5rem;">No meetings hosted yet.</p>';
        return;
    }
    container.innerHTML = _principalRecentMeetings.map(m => {
        const time = new Date(m.when).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
        return `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:1rem; border:1px solid #e2e8f0; border-radius:10px; margin-bottom:0.75rem;">
                <div>
                    <div style="font-weight:600; color:#1e293b;">${m.title}</div>
                    <div style="color:#94a3b8; font-size:0.82rem;"><i class="fas fa-hashtag"></i> ${m.roomCode} · ${time}</div>
                </div>
                <button onclick="window.open('/meeting-room.html?room=${m.roomCode}&title=${encodeURIComponent(m.title)}','_blank')" style="padding:0.5rem 1rem; background:linear-gradient(135deg,#667eea,#764ba2); color:#fff; border:none; border-radius:8px; cursor:pointer; font-weight:600; font-size:0.85rem;">
                    <i class="fas fa-arrow-right-to-bracket"></i> Rejoin
                </button>
            </div>
        `;
    }).join('');
}


// ═══════════════════════════════════════════════════════════════
//  PRINCIPAL ANNOUNCEMENTS — Dynamic (backend-backed)
// ═══════════════════════════════════════════════════════════════

// Load and render announcements from API
async function loadAnnouncements() {
    const container = document.getElementById('announcementsList');
    if (!container) return;
    container.innerHTML = '<div style="text-align:center;padding:2rem;color:#94a3b8;"><i class="fas fa-spinner fa-spin"></i> Loading...</div>';

    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch('/api/announcements', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const announcements = data.success ? (data.data?.announcements || []) : [];

        if (announcements.length === 0) {
            container.innerHTML = '<div style="text-align:center;padding:2rem;color:#94a3b8;">No announcements yet. Click "New Announcement" to post one.</div>';
            return;
        }

        const priorityColors = {
            high: { bg:'#fef2f2', color:'#dc2626', label:'High Priority' },
            medium: { bg:'#fffbeb', color:'#d97706', label:'Medium Priority' },
            low: { bg:'#f0fdf4', color:'#16a34a', label:'Low Priority' },
        };
        const audienceLabels = {
            all: 'Everyone', hods: 'HODs Only', teachers: 'Teachers Only', students: 'Students Only'
        };

        container.innerHTML = announcements.map(a => {
            const p = priorityColors[a.priority] || priorityColors.medium;
            const date = new Date(a.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
            const audience = audienceLabels[a.targetAudience] || a.targetAudience;
            return `
                <div class="announcement-item" style="margin-bottom:1.2rem; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden;">
                    <div class="announcement-header" style="display:flex;justify-content:space-between;align-items:center;padding:1rem 1.2rem;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
                        <div class="announcement-title" style="font-weight:700;color:#1e293b;font-size:1rem;">${a.title}</div>
                        <div style="display:flex;align-items:center;gap:0.5rem;">
                            <span style="font-size:0.8rem;color:#94a3b8;">${date}</span>
                            <span style="background:${p.bg};color:${p.color};padding:0.2rem 0.6rem;border-radius:20px;font-size:0.75rem;font-weight:600;">${p.label}</span>
                        </div>
                    </div>
                    <div style="padding:1rem 1.2rem;">
                        <p style="color:#374151;margin:0 0 0.8rem;line-height:1.6;">${a.content}</p>
                        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:0.5rem;">
                            <div style="display:flex;gap:0.5rem;align-items:center;">
                                <span style="background:#e0e7ff;color:#4338ca;padding:0.2rem 0.6rem;border-radius:20px;font-size:0.75rem;font-weight:600;"><i class="fas fa-users"></i> ${audience}</span>
                                <span style="color:#94a3b8;font-size:0.8rem;">by ${a.postedByName || 'Principal'}</span>
                            </div>
                            <div style="display:flex;gap:0.5rem;">
                                <button onclick="editAnnouncement('${a._id}','${a.title.replace(/'/g,"\\'")}','${a.content.replace(/'/g,"\\'").replace(/\n/g,'\\n')}','${a.priority}','${a.targetAudience}')" class="btn btn-sm btn-outline">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button onclick="deleteAnnouncement('${a._id}')" class="btn btn-sm btn-danger">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

    } catch (err) {
        container.innerHTML = '<div style="text-align:center;padding:2rem;color:#ef4444;">Failed to load announcements.</div>';
    }
}

// Open modal for new announcement
function openAnnouncementModal() {
    document.getElementById('editingAnnouncementId').value = '';
    document.getElementById('announcementModalTitle').textContent = 'New Announcement';
    document.getElementById('newAnnouncementTitle').value = '';
    document.getElementById('newAnnouncementContent').value = '';
    document.getElementById('newAnnouncementPriority').value = 'medium';
    document.getElementById('newAnnouncementAudience').value = 'all';
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    const dateEl = document.getElementById('newAnnouncementDate');
    if (dateEl) dateEl.value = today;
    document.getElementById('saveAnnouncementBtn').textContent = 'Post Announcement';
    document.getElementById('newAnnouncementInlineModal').style.display = 'block';
}

function closeAnnouncementModal() {
    document.getElementById('newAnnouncementInlineModal').style.display = 'none';
}

function editAnnouncement(id, title, content, priority, audience) {
    document.getElementById('editingAnnouncementId').value = id;
    document.getElementById('announcementModalTitle').textContent = 'Edit Announcement';
    document.getElementById('newAnnouncementTitle').value = title;
    document.getElementById('newAnnouncementContent').value = content.replace(/\\n/g, '\n');
    document.getElementById('newAnnouncementPriority').value = priority;
    document.getElementById('newAnnouncementAudience').value = audience;
    document.getElementById('saveAnnouncementBtn').textContent = 'Save Changes';
    document.getElementById('newAnnouncementInlineModal').style.display = 'block';
}

async function saveAnnouncement() {
    const id = document.getElementById('editingAnnouncementId').value;
    const title = document.getElementById('newAnnouncementTitle').value.trim();
    const content = document.getElementById('newAnnouncementContent').value.trim();
    const priority = document.getElementById('newAnnouncementPriority').value;
    const audience = document.getElementById('newAnnouncementAudience').value;

    if (!title || !content) { showMaNotification('Title and content are required', 'error'); return; }

    const btn = document.getElementById('saveAnnouncementBtn');
    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
        const token = localStorage.getItem('authToken');
        const url = id ? `/api/announcements/${id}` : '/api/announcements';
        const method = id ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content, priority, targetAudience: audience })
        });
        const data = await res.json();

        if (data.success || res.ok) {
            showMaNotification(id ? 'Announcement updated!' : 'Announcement posted!', 'success');
            closeAnnouncementModal();
            loadAnnouncements();
        } else {
            showMaNotification(data.message || 'Failed to save', 'error');
        }
    } catch (err) {
        showMaNotification('Failed to save announcement', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = document.getElementById('editingAnnouncementId').value ? 'Save Changes' : 'Post Announcement';
    }
}

async function deleteAnnouncement(id) {
    if (!confirm('Delete this announcement?')) return;
    try {
        const token = localStorage.getItem('authToken');
        const res = await fetch(`/api/announcements/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success || res.ok) {
            showMaNotification('Announcement deleted', 'success');
            loadAnnouncements();
        } else {
            showMaNotification(data.message || 'Failed to delete', 'error');
        }
    } catch (err) {
        showMaNotification('Failed to delete', 'error');
    }
}

// Wire New Announcement button and announcements nav
document.addEventListener('DOMContentLoaded', function () {
    const newBtn = document.getElementById('newAnnouncementBtn');
    if (newBtn) newBtn.addEventListener('click', openAnnouncementModal);

    document.querySelectorAll('.sidebar-menu a[data-section="announcements"]').forEach(link => {
        link.addEventListener('click', loadAnnouncements);
    });
    // Load if section is active on start
    if (document.querySelector('#announcements.active')) loadAnnouncements();
});
