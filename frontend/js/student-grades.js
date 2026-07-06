/**
 * student-grades.js
 * Complete Grades & Assignments section for EduConnect Student Dashboard
 * - Grade records from /api/grades/student
 * - Semester CGPAs from user profile
 * - CGPA prediction (linear regression on semesters)
 * - Assignment grades from /api/assignments (graded submissions)
 * - Dynamic assignment list with submit modal
 */

'use strict';

// ──────────────────────────────────────────────
// State
// ──────────────────────────────────────────────
let _allGrades      = [];   // raw grade records
let _allAssignments = [];   // raw assignment objects
let _userProfile    = null; // cached /api/auth/me response
let _cgpaChart      = null; // Chart.js instance

// ──────────────────────────────────────────────
// Init — run when DOM ready + sections clicked
// ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
    // Load when grades section becomes visible
    document.querySelectorAll('.sidebar-menu a[data-section]').forEach(link => {
        link.addEventListener('click', function () {
            const sec = this.dataset.section;
            if (sec === 'grades')      { setTimeout(initGradesSection, 80); }
            if (sec === 'assignments') { setTimeout(fetchAssignmentsData, 80); }
        });
    });

    // Initial load if already on grades
    const gradesSection = document.getElementById('grades');
    if (gradesSection && gradesSection.classList.contains('active')) {
        setTimeout(initGradesSection, 400);
    }

    // Initial assignments load
    setTimeout(fetchAssignmentsData, 600);

    // Assignment submit modal
    setupAssignmentModal();

    // Tab switching for assignments
    setupAssignmentTabs();
});

// ──────────────────────────────────────────────
// GRADES SECTION — main entry point
// ──────────────────────────────────────────────
async function initGradesSection() {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        // Parallel fetch: user profile + grades + grade summary
        const [profileRes, gradesRes, summaryRes, assignRes] = await Promise.all([
            fetch('/api/auth/me',             { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/grades/student',      { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/grades/summary/student', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/assignments',         { headers: { 'Authorization': `Bearer ${token}` } }),
        ]);

        const profile = await profileRes.json();
        const grades  = await gradesRes.json();
        const summary = await summaryRes.json();
        const assigns = await assignRes.json();

        if (profile.success) {
            _userProfile = profile.data;
            renderOverallGPA(_userProfile);
            renderSemesterCgpaGrid(_userProfile);
            renderPrediction(_userProfile);
            localStorage.setItem('currentUser', JSON.stringify(_userProfile));
        }

        if (grades.success) {
            _allGrades = grades.data || [];
            renderGradeTable(_allGrades);
            buildClassFilter(_allGrades);
        }

        if (summary.success) {
            renderGradeSummaryCards(summary.data);
        }

        if (assigns.success) {
            _allAssignments = assigns.data.assignments || [];
            renderAssignmentGrades(_allAssignments);
        }

    } catch (err) {
        console.error('initGradesSection error:', err);
    }
}

// ──────────────────────────────────────────────
// Overall GPA Card
// ──────────────────────────────────────────────
function renderOverallGPA(user) {
    const gpa = parseFloat(user.grade || 0).toFixed(2);

    // ── Grades section cards ──
    const overallEl = document.getElementById('overallGPA');
    if (overallEl) overallEl.textContent = gpa;

    const semEl = document.getElementById('gradeCurrentSem');
    if (semEl) semEl.textContent = user.currentSemester || 1;

    // AVG % = avg CGPA × 10
    const avgCgpa = parseFloat(user.grade || 0);
    const pctEl   = document.getElementById('gradeAvgPct');
    if (pctEl) {
        pctEl.textContent = avgCgpa > 0 ? (avgCgpa * 10).toFixed(1) + '%' : '—';
    }

    // Sems completed
    const countEl = document.getElementById('gradeTotalCount');
    if (countEl) {
        const filledSems = (user.semesterCgpas || []).filter(v => v > 0).length;
        countEl.textContent = filledSems;
    }

    // ── Dashboard overview "Average Grade" card — keep in sync ──
    const dashGradeEl = document.getElementById('averageGrade');
    if (dashGradeEl) dashGradeEl.textContent = gpa;

    // Also update localStorage so other parts of the page see the new value
    try {
        const stored = JSON.parse(localStorage.getItem('currentUser') || '{}');
        stored.grade           = user.grade;
        stored.semesterCgpas   = user.semesterCgpas;
        stored.currentSemester = user.currentSemester;
        localStorage.setItem('currentUser', JSON.stringify(stored));
    } catch(e) {}
}

// ──────────────────────────────────────────────
// Grade Summary Cards — not used separately now
// (avg% and count come from renderOverallGPA)
// ──────────────────────────────────────────────
function renderGradeSummaryCards(summary) {
    // avg% and count are now derived from semesterCgpas in renderOverallGPA
    // Only update if there are actual grade records from teacher
    if (summary && summary.totalGrades > 0) {
        const countEl = document.getElementById('gradeTotalCount');
        if (countEl) countEl.textContent = summary.totalGrades;
    }
}

// ──────────────────────────────────────────────
// Semester CGPA Grid (EDITABLE inline)
// ──────────────────────────────────────────────
function renderSemesterCgpaGrid(user) {
    const grid = document.getElementById('semesterCgpaGrid');
    if (!grid) return;

    const totalSems = getTotalSemesters(user);
    const cgpas     = user.semesterCgpas || [];
    const currentSem = user.currentSemester || 1;

    grid.innerHTML = '';
    for (let i = 1; i <= totalSems; i++) {
        const val      = cgpas[i - 1];
        const hasValue = val && val > 0;
        const isCurrent = (i === currentSem);

        const box = document.createElement('div');
        box.style.cssText = `
            background: ${isCurrent ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#fff'};
            border: 1.5px solid ${isCurrent ? 'transparent' : (hasValue ? '#c4b5fd' : '#e2e8f0')};
            border-radius: 12px; padding: 0.7rem 0.4rem; text-align: center;
            box-shadow: 0 2px 6px rgba(0,0,0,0.04); transition: all .15s;
        `;
        box.innerHTML = `
            <div style="font-size:0.68rem; font-weight:700; text-transform:uppercase;
                        letter-spacing:0.4px; margin-bottom:0.3rem;
                        color:${isCurrent ? 'rgba(255,255,255,0.85)' : '#94a3b8'};">
                Semester ${i}
            </div>
            <input id="semInput_${i}" type="number" min="0" max="10" step="0.01"
                value="${hasValue ? parseFloat(val).toFixed(2) : ''}"
                placeholder="—"
                onchange="onSemCgpaChange(${i}, this)"
                onfocus="this.select()"
                title="Enter CGPA (0-10) for Semester ${i}"
                style="width:100%; border:none; background:transparent; text-align:center;
                       font-size:1.3rem; font-weight:800; outline:none; padding:0;
                       -moz-appearance:textfield;
                       color:${isCurrent ? '#fff' : (hasValue ? '#667eea' : '#cbd5e1')};">
        `;
        grid.appendChild(box);
    }
}

// Called when a semester CGPA input is changed
async function onSemCgpaChange(semNum, inputEl) {
    const raw = inputEl.value.trim();
    let val = raw === '' ? 0 : parseFloat(raw);

    if (raw !== '' && (isNaN(val) || val < 0 || val > 10)) {
        showGradeToast('CGPA must be a number between 0 and 10', 'error');
        inputEl.value = '';
        inputEl.focus();
        return;
    }

    const user  = _userProfile || JSON.parse(localStorage.getItem('currentUser') || '{}');
    const total = getTotalSemesters(user);

    // Gather all semester inputs into an array
    const cgpas = [];
    for (let i = 1; i <= total; i++) {
        const el = document.getElementById(`semInput_${i}`);
        let v = el && el.value.trim() !== '' ? parseFloat(el.value) : 0;
        if (isNaN(v) || v < 0 || v > 10) v = 0;
        cgpas.push(v);
    }

    await saveSemesterCgpas(cgpas);
}

// Save semester CGPAs to backend, then re-render everything
async function saveSemesterCgpas(cgpas) {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        const res  = await fetch('/api/auth/me/cgpas', {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ semesterCgpas: cgpas }),
        });
        const data = await res.json();

        if (data.success) {
            _userProfile = data.data;
            localStorage.setItem('currentUser', JSON.stringify(data.data));

            // Re-render everything with fresh data (incl. updated currentSemester)
            renderOverallGPA(data.data);
            renderSemesterCgpaGrid(data.data);
            renderPrediction(data.data);

            // Sync Dashboard overview "Average Grade" card immediately
            if (typeof updateDashboardStats === 'function') {
                updateDashboardStats();
            }

            showGradeToast(`CGPA saved! You are now in Semester ${data.data.currentSemester || 1}.`, 'success');
        } else {
            showGradeToast(data.message || 'Failed to save CGPA', 'error');
        }
    } catch (err) {
        console.error('saveSemesterCgpas error:', err);
        showGradeToast('Network error. Please try again.', 'error');
    }
}

function getTotalSemesters(user) {
    // Could come from user.program in future; for now default 8 (B.Tech)
    const dept = (user.department || '').toLowerCase();
    if (dept.includes('bca')) return 6;
    if (dept.includes('mca')) return 4;
    return 8; // B.Tech default
}

// ──────────────────────────────────────────────
// Performance Prediction (Linear Regression)
// ──────────────────────────────────────────────
function renderPrediction(user) {
    const cgpas      = (user.semesterCgpas || []).filter(v => v > 0);
    const attendance = parseFloat(user.attendanceRate || 85);
    const overall    = parseFloat(user.grade || 0);
    const filledCount = cgpas.length;

    const predEl = document.getElementById('predictedCgpa');
    const confEl = document.getElementById('predictionConfidence');
    const noteEl = document.getElementById('predictionNote');

    if (filledCount < 1) {
        if (predEl) { predEl.textContent = '—'; predEl.style.color = '#cbd5e1'; }
        if (confEl) confEl.textContent = 'Awaiting data';
        if (noteEl) noteEl.textContent = 'Enter your CGPA in at least one semester box above to generate a prediction.';
        drawChart(cgpas, null);
        return;
    }

    // Linear regression prediction
    let predicted;
    if (filledCount === 1) {
        predicted = cgpas[0];
    } else {
        const n = filledCount;
        const x = Array.from({ length: n }, (_, i) => i + 1);
        const sumX  = x.reduce((a, b) => a + b, 0);
        const sumY  = cgpas.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((acc, xi, i) => acc + xi * cgpas[i], 0);
        const sumX2 = x.reduce((acc, xi) => acc + xi * xi, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        predicted = intercept + slope * (n + 1);
    }
    predicted = Math.max(0, Math.min(10, predicted));

    // Attendance adjustment
    let attBoost = 0;
    if (attendance >= 90) attBoost = 0.15;
    else if (attendance >= 80) attBoost = 0.05;
    else if (attendance < 70) attBoost = -0.15;
    predicted = Math.max(0, Math.min(10, predicted + attBoost));

    const confidence = Math.min(95, 45 + filledCount * 8);
    const nextSem = filledCount + 1;

    if (predEl) {
        predEl.textContent = predicted.toFixed(2);
        predEl.style.color = predicted >= 8 ? '#22c55e' : predicted >= 6 ? '#667eea' : '#f59e0b';
    }
    if (confEl) confEl.textContent = `Confidence Level: ${confidence}%`;
    if (noteEl) {
        const trend = filledCount >= 2
            ? (cgpas[filledCount - 1] >= cgpas[0] ? 'an upward trend 📈' : 'a downward trend 📉')
            : 'your Semester 1 baseline';
        noteEl.innerHTML = `Predicted for <strong>Semester ${nextSem}</strong> based on ${trend} across ${filledCount} semester${filledCount > 1 ? 's' : ''} and ${attendance}% attendance.`;
    }

    // Legacy factors list (only if element still exists)
    const factors = document.getElementById('predictionFactors');
    if (factors) {
        factors.innerHTML = `<li style="color:#64748b;font-size:0.85rem;">Prediction based on ${filledCount} semester(s).</li>`;
    }

    drawChart(cgpas, predicted);
}

// ──────────────────────────────────────────────
// CGPA Trend Chart
// ──────────────────────────────────────────────
function drawChart(cgpas, predicted) {
    const canvas = document.getElementById('cgpaTrendChart');
    if (!canvas || !window.Chart) return;

    if (_cgpaChart) { _cgpaChart.destroy(); _cgpaChart = null; }

    const hasPrediction = predicted !== null && predicted !== undefined;
    const labels = cgpas.map((_, i) => `Sem ${i + 1}`);
    const data   = [...cgpas];

    if (hasPrediction) {
        labels.push(`Sem ${cgpas.length + 1}`);
        data.push(predicted);
    }

    const lastIdx = data.length - 1;

    // Grade quality label for tooltips
    const gradeLabel = v => v >= 9 ? 'Outstanding' : v >= 8 ? 'Excellent' : v >= 7 ? 'Very Good'
                          : v >= 6 ? 'Good' : v >= 5 ? 'Average' : 'Needs Improvement';

    // Soft drop-shadow for the line + points (custom plugin, scoped to this chart)
    const glowPlugin = {
        id: 'cgpaGlow',
        beforeDatasetDraw(chart, args) {
            const { ctx } = chart;
            if (args.index === 0) {
                ctx.save();
                ctx.shadowColor   = 'rgba(124,108,240,0.40)';
                ctx.shadowBlur    = 12;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 5;
            }
        },
        afterDatasetDraw(chart, args) {
            if (args.index === 0) chart.ctx.restore();
        }
    };

    // Animated pulsing ring around the latest / predicted point (modern touch)
    const pulsePlugin = {
        id: 'cgpaPulse',
        afterDatasetsDraw(chart) {
            const meta = chart.getDatasetMeta(0);
            if (!meta || !meta.data || !meta.data.length) return;
            const pt = meta.data[lastIdx];
            if (!pt) return;

            const t = (Date.now() % 1600) / 1600;          // 0 → 1 loop
            const radius = 6 + t * 16;                       // expanding ring
            const alpha  = 0.45 * (1 - t);                   // fading out
            const color  = hasPrediction ? '168,85,247' : '99,102,241';

            const ctx = chart.ctx;
            ctx.save();
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${color},${alpha})`;
            ctx.fill();
            ctx.restore();

            // keep the animation looping smoothly
            if (!chart._pulseRAF) {
                const loop = () => {
                    if (!chart.ctx) { chart._pulseRAF = null; return; }
                    chart.draw();
                    chart._pulseRAF = requestAnimationFrame(loop);
                };
                chart._pulseRAF = requestAnimationFrame(loop);
            }
        }
    };

    _cgpaChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'CGPA',
                data,
                // Gradient line stroke: blue → violet
                borderColor: function (context) {
                    const { ctx, chartArea } = context.chart;
                    if (!chartArea) return '#667eea';
                    const g = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
                    g.addColorStop(0, '#6366f1');
                    g.addColorStop(0.6, '#7c6cf0');
                    g.addColorStop(1, '#a855f7');
                    return g;
                },
                // Richer area gradient fill
                backgroundColor: function (context) {
                    const { ctx, chartArea } = context.chart;
                    if (!chartArea) return 'rgba(102,126,234,0.10)';
                    const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    g.addColorStop(0, 'rgba(124,108,240,0.28)');
                    g.addColorStop(0.55, 'rgba(102,126,234,0.10)');
                    g.addColorStop(1, 'rgba(102,126,234,0.00)');
                    return g;
                },
                // Dotted violet segment for the prediction (last segment only)
                segment: {
                    borderColor: ctx => (hasPrediction && ctx.p1DataIndex === lastIdx) ? '#a855f7' : undefined,
                    borderDash:  ctx => (hasPrediction && ctx.p1DataIndex === lastIdx) ? [6, 6] : undefined,
                },
                pointBackgroundColor: data.map((_, i) => (hasPrediction && i === lastIdx) ? '#a855f7' : '#6366f1'),
                pointBorderColor: '#fff',
                pointBorderWidth: 3,
                pointRadius: data.map((_, i) => (hasPrediction && i === lastIdx) ? 7 : 5),
                pointHoverRadius: 10,
                pointHoverBorderWidth: 3,
                pointHoverBackgroundColor: data.map((_, i) => (hasPrediction && i === lastIdx) ? '#9333ea' : '#4f46e5'),
                pointStyle: data.map((_, i) => (hasPrediction && i === lastIdx) ? 'rectRot' : 'circle'),
                tension: 0.4,
                fill: true,
                borderWidth: 3.5,
                borderCapStyle: 'round',
                borderJoinStyle: 'round',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            // Modern progressive "draw-in" animation — line grows + points pop sequentially
            animation: {
                duration: 1100,
                easing: 'easeOutQuart',
                delay: ctx => (ctx.type === 'data' && ctx.mode === 'default') ? ctx.dataIndex * 130 : 0,
            },
            animations: {
                y: {
                    from: ctx => ctx.chart.scales.y.getPixelForValue(0),
                },
            },
            interaction: { intersect: false, mode: 'index' },
            layout: { padding: { top: 18, right: 20, left: 4, bottom: 4 } },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(30,41,59,0.96)',
                    titleColor: '#c4b5fd',
                    bodyColor: '#fff',
                    padding: 13,
                    cornerRadius: 10,
                    displayColors: false,
                    titleFont: { size: 12, weight: '700' },
                    bodyFont: { size: 13, weight: '600' },
                    caretSize: 7,
                    callbacks: {
                        title: ctx => ctx[0].label + (hasPrediction && ctx[0].dataIndex === lastIdx ? '  •  Predicted' : ''),
                        label: ctx => `  CGPA  ${parseFloat(ctx.raw).toFixed(2)}`,
                        afterLabel: ctx => `  ${gradeLabel(parseFloat(ctx.raw))}`
                    }
                }
            },
            scales: {
                y: {
                    min: 0,
                    max: 10,
                    ticks: {
                        stepSize: 2,
                        font: { size: 11, weight: '600' },
                        color: '#a78bfa',
                        padding: 8,
                        callback: v => v.toFixed(0)
                    },
                    grid: {
                        color: 'rgba(148,163,184,0.14)',
                        lineWidth: 1,
                        drawTicks: false,
                    },
                    border: { display: false },
                    title: {
                        display: true, text: 'CGPA',
                        color: '#a78bfa',
                        font: { size: 11, weight: '700' }
                    }
                },
                x: {
                    ticks: { font: { size: 12, weight: '700' }, color: '#64748b', padding: 8 },
                    grid: { display: false },
                    border: { color: '#e2e8f0' }
                }
            }
        },
        plugins: [glowPlugin, pulsePlugin]
    });
}

// ──────────────────────────────────────────────
// Grade Records Table
// ──────────────────────────────────────────────
function renderGradeTable(grades, filterClassId = '') {
    const tbody = document.getElementById('gradesTableBody');
    if (!tbody) return;

    const filtered = filterClassId
        ? grades.filter(g => g.class?._id === filterClassId || g.class === filterClassId)
        : grades;

    if (!filtered.length) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:#94a3b8;">
            <i class="fas fa-chart-bar" style="font-size:1.5rem;opacity:0.3;margin-bottom:0.5rem;display:block;"></i>
            No grade records found. Your teacher will add grades here.
        </td></tr>`;
        return;
    }

    const letterColors = {
        'A+':'#15803d','A':'#16a34a','A-':'#22c55e',
        'B+':'#1d4ed8','B':'#2563eb','B-':'#3b82f6',
        'C+':'#b45309','C':'#d97706','C-':'#f59e0b',
        'D+':'#dc2626','D':'#ef4444','F':'#991b1b'
    };

    tbody.innerHTML = filtered.map(g => {
        const className   = g.class?.name || 'Unknown Subject';
        const graderName  = g.gradedBy?.name || '—';
        const letterColor = letterColors[g.letterGrade] || '#64748b';
        const date        = g.createdAt ? new Date(g.createdAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';
        const typeIcon    = { exam:'📝', assignment:'📋', participation:'🙋', project:'🏗️', other:'📌' }[g.type] || '📌';

        return `<tr>
            <td><strong>${escH(className)}</strong></td>
            <td>${typeIcon} <span style="font-size:0.82rem;text-transform:capitalize;">${g.type}</span></td>
            <td style="font-size:0.88rem;">${escH(g.name)}</td>
            <td>${g.points} / ${g.maxPoints}</td>
            <td>
                <div style="display:flex;align-items:center;gap:0.5rem;">
                    <div style="flex:1;height:6px;background:#f1f5f9;border-radius:3px;min-width:60px;">
                        <div style="width:${g.percentage}%;height:100%;background:${letterColor};border-radius:3px;"></div>
                    </div>
                    <span style="font-size:0.82rem;font-weight:600;color:${letterColor};">${g.percentage}%</span>
                </div>
            </td>
            <td>
                <span style="background:${letterColor}18;color:${letterColor};font-weight:800;
                             padding:0.2rem 0.6rem;border-radius:6px;font-size:0.9rem;">
                    ${g.letterGrade || '—'}
                </span>
            </td>
            <td style="font-size:0.85rem;">${escH(graderName)}</td>
            <td style="font-size:0.82rem;color:#64748b;">${date}</td>
        </tr>`;
    }).join('');
}

function buildClassFilter(grades) {
    const sel = document.getElementById('gradeClassFilter');
    if (!sel) return;

    const classMap = {};
    grades.forEach(g => {
        if (g.class?._id) classMap[g.class._id] = g.class.name;
    });

    const opts = '<option value="">All Subjects</option>' +
        Object.entries(classMap).map(([id, name]) => `<option value="${id}">${escH(name)}</option>`).join('');
    sel.innerHTML = opts;
}

function filterGradesByClass(classId) {
    renderGradeTable(_allGrades, classId);
}

// ──────────────────────────────────────────────
// Assignment Grades (from graded submissions)
// ──────────────────────────────────────────────
function renderAssignmentGrades(assignments) {
    const tbody = document.getElementById('assignmentGradesBody');
    if (!tbody) return;

    const graded = assignments.filter(a => a.submitted && a.submission?.graded);

    if (!graded.length) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#94a3b8;">
            No graded assignments yet.
        </td></tr>`;
        return;
    }

    tbody.innerHTML = graded.map(a => {
        const sub  = a.submission || {};
        const pct  = sub.points && a.maxPoints ? Math.round((sub.points / a.maxPoints) * 100) : 0;
        const date = sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';

        return `<tr>
            <td><strong>${escH(a.title)}</strong></td>
            <td style="font-size:0.85rem;">${escH(a.class?.name || '—')}</td>
            <td><span style="font-weight:700;color:${pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444'};">${sub.points || 0}</span></td>
            <td>${a.maxPoints}</td>
            <td style="font-size:0.83rem;color:#64748b;max-width:200px;">${escH(sub.feedback || '—')}</td>
            <td style="font-size:0.82rem;color:#64748b;">${date}</td>
        </tr>`;
    }).join('');
}

// ──────────────────────────────────────────────
// CGPA Edit Modal
// ──────────────────────────────────────────────
function openEditCgpaModal() {
    const user   = _userProfile || JSON.parse(localStorage.getItem('currentUser') || '{}');
    const total  = getTotalSemesters(user);
    const cgpas  = user.semesterCgpas || [];
    const grid   = document.getElementById('cgpaInputsGrid');

    if (grid) {
        grid.innerHTML = '';
        for (let i = 1; i <= total; i++) {
            const val = cgpas[i - 1] || 0;
            grid.insertAdjacentHTML('beforeend', `
                <div style="display:flex;flex-direction:column;gap:0.3rem;">
                    <label style="font-size:0.78rem;font-weight:600;color:#64748b;">Semester ${i}</label>
                    <input id="cgpaInput_${i}" type="number" min="0" max="10" step="0.01"
                           value="${val > 0 ? val : ''}" placeholder="0.00"
                           style="padding:0.55rem;border:1px solid #d1d5db;border-radius:8px;
                                  font-size:0.9rem;width:100%;box-sizing:border-box;outline:none;
                                  font-family:inherit;">
                </div>
            `);
        }
    }

    document.getElementById('editCgpaModal').style.display = 'block';
}

async function saveCgpaUpdate() {
    const user   = _userProfile || JSON.parse(localStorage.getItem('currentUser') || '{}');
    const total  = getTotalSemesters(user);
    const token  = localStorage.getItem('authToken');
    const cgpas  = [];

    for (let i = 1; i <= total; i++) {
        const inp = document.getElementById(`cgpaInput_${i}`);
        const val = inp ? parseFloat(inp.value) : 0;
        cgpas.push(isNaN(val) || val < 0 || val > 10 ? 0 : val);
    }

    try {
        const res  = await fetch('/api/auth/me/cgpas', {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ semesterCgpas: cgpas }),
        });
        const data = await res.json();

        if (data.success) {
            _userProfile = data.data;
            localStorage.setItem('currentUser', JSON.stringify(data.data));

            // Close modal
            document.getElementById('editCgpaModal').style.display = 'none';

            // Re-render
            renderOverallGPA(data.data);
            renderSemesterCgpaGrid(data.data);
            renderPrediction(data.data);

            // Sync Dashboard overview card
            if (typeof updateDashboardStats === 'function') updateDashboardStats();

            showGradeToast('CGPA updated successfully!', 'success');
        } else {
            showGradeToast(data.message || 'Failed to update CGPA', 'error');
        }
    } catch (err) {
        console.error('saveCgpaUpdate error:', err);
        showGradeToast('Network error. Please try again.', 'error');
    }
}

// ──────────────────────────────────────────────
// ASSIGNMENTS SECTION
// ──────────────────────────────────────────────
async function fetchAssignmentsData() {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        const res  = await fetch('/api/assignments', { headers: { 'Authorization': `Bearer ${token}` } });
        const data = await res.json();

        if (!data.success) return;

        _allAssignments = data.data.assignments || [];
        renderAssignmentLists(_allAssignments);
    } catch (err) {
        console.error('fetchAssignmentsData error:', err);
    }
}

function renderAssignmentLists(assignments) {
    const pending   = assignments.filter(a => !a.submitted && a.status !== 'closed');
    const completed = assignments.filter(a => a.submitted);

    // Update count badges
    const pCount = document.getElementById('pendingCount');
    const cCount = document.getElementById('completedCount');
    if (pCount) pCount.textContent = pending.length;
    if (cCount) cCount.textContent = completed.length;

    // Overview stat
    const pendingEl = document.getElementById('pendingAssignmentsCount');
    if (pendingEl) pendingEl.textContent = pending.length;

    renderPendingList(pending);
    renderCompletedList(completed);
}

function renderPendingList(assignments) {
    const list = document.getElementById('pendingAssignmentList');
    if (!list) return;

    if (!assignments.length) {
        list.innerHTML = `<li style="list-style:none;text-align:center;padding:3rem;color:#94a3b8;">
            <i class="fas fa-check-circle" style="font-size:2.5rem;opacity:0.3;margin-bottom:0.75rem;display:block;color:#22c55e;"></i>
            <p style="font-weight:600;">All caught up! No pending assignments.</p>
        </li>`;
        return;
    }

    list.innerHTML = '';
    assignments.forEach(a => {
        const due     = new Date(a.dueDate);
        const now     = new Date();
        const diffMs  = due - now;
        const diffDay = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const isUrgent = diffDay <= 3 && diffDay >= 0;
        const isOverdue = diffDay < 0;

        const dueLabel = isOverdue ? `Overdue (${Math.abs(diffDay)}d ago)` :
                         diffDay === 0 ? 'Due Today!' :
                         diffDay === 1 ? 'Due Tomorrow!' :
                         `Due in ${diffDay} days`;

        const dueColor = isOverdue ? '#ef4444' : isUrgent ? '#f59e0b' : '#64748b';
        const teacherName = a.teacher?.name || 'Unknown';
        const className   = a.class?.name   || 'Unknown Class';

        const li = document.createElement('li');
        li.className = 'assignment-item';
        li.style.listStyle = 'none';
        li.innerHTML = `
            <div style="display:flex;align-items:flex-start;gap:1rem;padding:1rem;border:1px solid #e2e8f0;
                         border-radius:12px;margin-bottom:0.75rem;background:#fff;
                         border-left:4px solid ${isOverdue ? '#ef4444' : isUrgent ? '#f59e0b' : '#667eea'};">
                <div style="flex-shrink:0;width:42px;height:42px;border-radius:10px;
                             background:${isOverdue ? '#fef2f2' : '#ede9fe'};
                             display:flex;align-items:center;justify-content:center;font-size:1.1rem;">
                    ${isOverdue ? '⚠️' : '📋'}
                </div>
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:700;color:#1e293b;margin-bottom:0.2rem;">${escH(a.title)}</div>
                    <div style="font-size:0.83rem;color:#64748b;margin-bottom:0.35rem;">
                        <i class="fas fa-book" style="color:#667eea;"></i> ${escH(className)}
                        &nbsp;•&nbsp;
                        <i class="fas fa-user" style="color:#667eea;"></i> ${escH(teacherName)}
                    </div>
                    <div style="font-size:0.8rem;color:#94a3b8;">${escH(a.description?.substring(0, 100) || '')}${a.description?.length > 100 ? '...' : ''}</div>
                    ${a.attachments?.length ? `
                    <div style="margin-top:0.4rem;display:flex;gap:0.4rem;flex-wrap:wrap;">
                        ${a.attachments.map(att => `
                            <a href="#" onclick="downloadAssignmentFile('${a._id}','${escH(att.fileName)}')"
                               style="font-size:0.75rem;color:#667eea;background:#ede9fe;padding:0.15rem 0.5rem;border-radius:4px;">
                                📎 ${escH(att.fileName)}
                            </a>
                        `).join('')}
                    </div>` : ''}
                </div>
                <div style="flex-shrink:0;text-align:right;">
                    <div style="font-size:0.78rem;font-weight:700;color:${dueColor};margin-bottom:0.5rem;white-space:nowrap;">
                        ${dueLabel}
                    </div>
                    <div style="font-size:0.74rem;color:#94a3b8;margin-bottom:0.6rem;">
                        ${due.toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                    </div>
                    <div style="font-size:0.74rem;color:#94a3b8;margin-bottom:0.5rem;">Max: ${a.maxPoints} pts</div>
                    <button onclick="openSubmitModal('${a._id}','${escH(a.title).replace(/'/g,"\\'")}','${a.maxPoints}')"
                            style="padding:0.45rem 1rem;background:linear-gradient(135deg,#667eea,#764ba2);
                                   color:#fff;border:none;border-radius:8px;cursor:pointer;
                                   font-size:0.82rem;font-weight:600;font-family:inherit;
                                   ${isOverdue ? 'opacity:0.5;cursor:not-allowed;' : ''}">
                        Submit
                    </button>
                </div>
            </div>
        `;
        list.appendChild(li);
    });
}

function renderCompletedList(assignments) {
    const list = document.getElementById('completedAssignmentList');
    if (!list) return;

    if (!assignments.length) {
        list.innerHTML = `<li style="list-style:none;text-align:center;padding:3rem;color:#94a3b8;">
            <i class="fas fa-inbox" style="font-size:2.5rem;opacity:0.3;margin-bottom:0.75rem;display:block;"></i>
            <p>No submitted assignments yet.</p>
        </li>`;
        return;
    }

    list.innerHTML = '';
    assignments.forEach(a => {
        const sub         = a.submission || {};
        const className   = a.class?.name || 'Unknown Class';
        const teacherName = a.teacher?.name || 'Unknown';
        const submitDate  = sub.submittedAt ? new Date(sub.submittedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—';

        let gradeDisplay = '';
        if (sub.graded) {
            const pct = sub.points !== undefined ? Math.round((sub.points / a.maxPoints) * 100) : 0;
            const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';
            gradeDisplay = `<span style="background:${color}18;color:${color};padding:0.2rem 0.6rem;border-radius:6px;font-weight:700;font-size:0.85rem;">${sub.points}/${a.maxPoints} (${pct}%)</span>`;
        } else {
            gradeDisplay = `<span style="background:#fef9c3;color:#a16207;padding:0.2rem 0.6rem;border-radius:6px;font-size:0.82rem;">Pending Review</span>`;
        }

        const li = document.createElement('li');
        li.style.listStyle = 'none';
        li.innerHTML = `
            <div style="display:flex;align-items:flex-start;gap:1rem;padding:1rem;border:1px solid #e2e8f0;
                         border-radius:12px;margin-bottom:0.75rem;background:#fff;border-left:4px solid #22c55e;">
                <div style="flex-shrink:0;width:42px;height:42px;border-radius:10px;
                             background:#f0fdf4;display:flex;align-items:center;justify-content:center;font-size:1.1rem;">✅</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-weight:700;color:#1e293b;margin-bottom:0.2rem;">${escH(a.title)}</div>
                    <div style="font-size:0.83rem;color:#64748b;margin-bottom:0.4rem;">
                        <i class="fas fa-book" style="color:#22c55e;"></i> ${escH(className)}
                        &nbsp;•&nbsp;
                        <i class="fas fa-user" style="color:#22c55e;"></i> ${escH(teacherName)}
                    </div>
                    ${sub.feedback ? `<div style="font-size:0.82rem;color:#374151;background:#f8fafc;padding:0.4rem 0.7rem;border-radius:6px;margin-top:0.4rem;">
                        💬 ${escH(sub.feedback)}
                    </div>` : ''}
                    ${sub.attachments?.length ? `
                    <div style="margin-top:0.4rem;display:flex;gap:0.4rem;flex-wrap:wrap;">
                        ${sub.attachments.map(att => `
                            <a href="#" onclick="downloadSubmissionFile('${sub._id}','${escH(att.fileName)}')"
                               style="font-size:0.75rem;color:#667eea;background:#ede9fe;padding:0.15rem 0.5rem;border-radius:4px;">
                                📎 ${escH(att.fileName)}
                            </a>
                        `).join('')}
                    </div>` : ''}
                </div>
                <div style="flex-shrink:0;text-align:right;">
                    ${gradeDisplay}
                    <div style="font-size:0.74rem;color:#94a3b8;margin-top:0.4rem;">Submitted: ${submitDate}</div>
                </div>
            </div>
        `;
        list.appendChild(li);
    });
}

// ──────────────────────────────────────────────
// Submit Assignment Modal
// ──────────────────────────────────────────────
let _submitAssignmentId = null;

function openSubmitModal(id, title, maxPoints) {
    _submitAssignmentId = id;

    const modal = document.getElementById('assignmentModal');
    if (!modal) return;

    const titleEl = document.getElementById('assignmentTitle');
    if (titleEl) titleEl.value = title;

    const user = _userProfile || JSON.parse(localStorage.getItem('currentUser') || '{}');
    const nameInputs = document.querySelectorAll('#assignmentForm .student-name');
    nameInputs.forEach(el => { if (el.tagName === 'INPUT') el.value = user.name || ''; });

    const deptInputs = document.querySelectorAll('#assignmentForm .student-department');
    deptInputs.forEach(el => { if (el.tagName === 'INPUT') el.value = user.department || ''; });

    const notesEl = document.getElementById('submissionNotes');
    if (notesEl) notesEl.value = '';

    const fileEl = document.getElementById('submissionFile');
    if (fileEl) fileEl.value = '';

    modal.style.display = 'block';
}

function setupAssignmentModal() {
    const modal = document.getElementById('assignmentModal');
    if (!modal) return;

    // Close buttons
    const closeBtn = modal.querySelector('.close');
    if (closeBtn) closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    window.addEventListener('click', e => { if (e.target === modal) modal.style.display = 'none'; });

    // Form submit
    const form = document.getElementById('assignmentForm');
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            if (!_submitAssignmentId) return;

            const file  = document.getElementById('submissionFile')?.files[0];
            const notes = document.getElementById('submissionNotes')?.value || '';

            const submitBtn = form.querySelector('[type="submit"]');
            if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Submitting...'; }

            await doSubmitAssignment(_submitAssignmentId, file, notes);

            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Submit Assignment'; }
            modal.style.display = 'none';
        });
    }
}

async function doSubmitAssignment(assignmentId, file, notes) {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    try {
        const fd = new FormData();
        fd.append('content', notes || 'Assignment submission');
        if (file) fd.append('file', file);

        const res  = await fetch(`/api/assignments/${assignmentId}/submit`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: fd,
        });
        const data = await res.json();

        if (data.success) {
            showGradeToast('Assignment submitted successfully! ✅', 'success');
            await fetchAssignmentsData();
        } else {
            showGradeToast(data.message || 'Failed to submit assignment', 'error');
        }
    } catch (err) {
        console.error('doSubmitAssignment error:', err);
        showGradeToast('Network error. Please try again.', 'error');
    }
}

// ──────────────────────────────────────────────
// Assignment Tab Switching
// ──────────────────────────────────────────────
function setupAssignmentTabs() {
    document.addEventListener('click', function (e) {
        const btn = e.target.closest('#assignments .tab-btn');
        if (!btn) return;

        const tabId = btn.dataset.tab;
        if (!tabId) return;

        // Active state
        btn.closest('.assignment-tabs').querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Show/hide tab content
        const section = document.getElementById('assignments');
        if (!section) return;
        section.querySelectorAll('.tab-content').forEach(tc => tc.classList.remove('active'));
        const target = document.getElementById(tabId);
        if (target) target.classList.add('active');
    });
}

// ──────────────────────────────────────────────
// Toast notification
// ──────────────────────────────────────────────
function showGradeToast(msg, type = 'info') {
    // Use existing showNotification if available
    if (typeof showNotification === 'function') {
        showNotification(msg, type);
        return;
    }
    const el = document.createElement('div');
    el.style.cssText = `
        position:fixed;bottom:1.5rem;right:1.5rem;
        padding:0.8rem 1.4rem;border-radius:10px;
        font-size:0.9rem;font-weight:600;color:#fff;z-index:99999;
        background:${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#667eea'};
        box-shadow:0 4px 16px rgba(0,0,0,0.15);font-family:inherit;
        animation:fadeUp .2s ease;
    `;
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3500);
}

// ──────────────────────────────────────────────
// Utility
// ──────────────────────────────────────────────
function escH(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// Reload grades when grades sidebar link clicked
document.addEventListener('click', function (e) {
    const link = e.target.closest('a[data-section="grades"]');
    if (link) setTimeout(initGradesSection, 100);
});
