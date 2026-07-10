/**
 * Unified Notification System  EduConnect
 * Fetches LIVE data from backend for all roles.
 * Polls every 30 seconds to keep badge count fresh.
 */

class NotificationManager {
    constructor() {
        this.notifications = [];
        this.unreadCount = 0;
        this.initialized = false;
        this._pollInterval = null;
    }

    /* 
       INIT
     */
    init() {
        if (this.initialized) return;
        this.createNotificationUI();
        this.setupEventListeners();
        this.loadNotifications();
        // Poll every 30 s for live updates
        this._pollInterval = setInterval(() => this.loadNotifications(), 30000);
        this.initialized = true;
    }

    /* 
       UI CREATION
     */
    createNotificationUI() {
        if (document.getElementById('notificationSidebar')) return;

        const overlay = document.createElement('div');
        overlay.className = 'notification-overlay';
        overlay.id = 'notificationOverlay';
        document.body.appendChild(overlay);

        const sidebar = document.createElement('div');
        sidebar.className = 'notification-sidebar';
        sidebar.id = 'notificationSidebar';
        sidebar.innerHTML = `
            <div class="notification-header">
                <h2><i class="fas fa-bell" style="margin-right:8px;color:#667eea;"></i>Notifications</h2>
                <button class="close-notifications" id="closeNotifications">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="notification-content">
                <div class="notification-filters">
                    <button class="filter-btn active" data-filter="all">All</button>
                    <button class="filter-btn" data-filter="unread">Unread</button>
                    <button class="filter-btn" data-filter="important">Important</button>
                </div>
                <div class="notification-list" id="notificationList">
                    <div class="notification-loading"><i class="fas fa-spinner fa-spin"></i> Loading...</div>
                </div>
                <div class="notification-actions">
                    <button id="markAllRead"><i class="fas fa-check-double"></i> Mark all read</button>
                    <button id="clearNotifications"><i class="fas fa-trash"></i> Clear all</button>
                </div>
            </div>
        `;
        document.body.appendChild(sidebar);
    }

    /* 
       EVENT LISTENERS
     */
    setupEventListeners() {
        const notificationIcon = document.getElementById('notificationIcon');
        if (notificationIcon) {
            const fresh = notificationIcon.cloneNode(true);
            notificationIcon.parentNode.replaceChild(fresh, notificationIcon);
            fresh.addEventListener('click', (e) => { e.stopPropagation(); this.toggleSidebar(); });
        }

        document.getElementById('closeNotifications')?.addEventListener('click', () => this.closeSidebar());
        document.getElementById('notificationOverlay')?.addEventListener('click', () => this.closeSidebar());

        document.querySelectorAll('#notificationSidebar .filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('#notificationSidebar .filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.renderNotifications(e.target.dataset.filter);
            });
        });

        document.getElementById('markAllRead')?.addEventListener('click', () => this.markAllAsRead());
        document.getElementById('clearNotifications')?.addEventListener('click', () => this.clearAll());
    }

    toggleSidebar() {
        document.getElementById('notificationSidebar')?.classList.toggle('active');
        document.getElementById('notificationOverlay')?.classList.toggle('active');
    }

    closeSidebar() {
        document.getElementById('notificationSidebar')?.classList.remove('active');
        document.getElementById('notificationOverlay')?.classList.remove('active');
    }

    /* 
       LOAD NOTIFICATIONS (live from backend)
     */
    async loadNotifications() {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) { this.renderEmpty(); return; }

        let role = 'student';
        try { role = JSON.parse(localStorage.getItem('currentUser') || '{}').role || 'student'; }
        catch (e) { /* ignore */ }

        const liveNotifs = await this._fetchLiveNotifications(authToken, role);
        this.notifications = liveNotifs;
        this.updateUnreadCount();
        this.renderNotifications();
    }

    /* 
       ROLE-BASED LIVE NOTIFICATION FETCHING
     */
    async _fetchLiveNotifications(token, role) {
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
        const notifs = [];
        const now = Date.now();

        try {
            /*  MESSAGES (all roles)  */
            const msgRes = await fetch('/api/messages?folder=inbox&limit=20', { headers });
            const msgData = await msgRes.json();
            if (msgData.success && msgData.data?.messages) {
                msgData.data.messages.forEach(m => {
                    notifs.push({
                        id: `msg-${m._id}`,
                        type: 'message',
                        title: ` ${m.subject || 'New Message'}`,
                        description: `From: ${m.sender?.name || 'Unknown'}  ${(m.content || '').substring(0, 80)}${m.content?.length > 80 ? '...' : ''}`,
                        time: this._timeAgo(m.createdAt),
                        read: m.isRead || false,
                        important: !m.isRead,
                        category: 'message'
                    });
                });
            }
        } catch (e) { /* ignore */ }

        /*  STUDENT: enrollment requests  */
        if (role === 'student') {
            try {
                const enrRes = await fetch('/api/enrollments/pending', { headers });
                const enrData = await enrRes.json();
                if (enrData.success && enrData.data?.requests) {
                    enrData.data.requests.forEach(r => {
                        notifs.unshift({
                            id: `enr-${r._id}`,
                            type: 'warning',
                            title: ` Enrollment Request: ${r.class?.name || 'Course'}`,
                            description: `${r.teacher?.name || 'Teacher'} invited you to enroll. Go to My Courses to accept.`,
                            time: this._timeAgo(r.createdAt),
                            read: false,
                            important: true,
                            category: 'enrollment',
                            link: 'courses'
                        });
                    });
                }
            } catch (e) { /* ignore */ }
        }

        /*  HOD: approved/rejected events from Principal  */
        if (role === 'hod') {
            try {
                // Fetch ALL approval requests (both pending and approved/rejected)
                const appRes = await fetch('/api/approvals?limit=20', { headers });
                const appData = await appRes.json();
                if (appData.success && appData.data?.requests) {
                    appData.data.requests.forEach(r => {
                        const isApproved = r.status === 'approved';
                        const isRejected = r.status === 'rejected';
                        const isPending  = r.status === 'pending';

                        let title, description, type;
                        if (isApproved) {
                            title = `Event Approved: ${r.eventData?.title || 'Your Event'}`;
                            description = `Principal approved your event request.`;
                            type = 'success';
                        } else if (isRejected) {
                            title = `Event Declined: ${r.eventData?.title || 'Your Event'}`;
                            description = `Your event request was declined by the Principal.`;
                            type = 'danger';
                        } else {
                            title = `Event Pending: ${r.eventData?.title || 'Your Event'}`;
                            description = `Your event request is awaiting Principal approval.`;
                            type = 'info';
                        }

                        notifs.unshift({
                            id: `app-${r._id}`,
                            type,
                            title,
                            description,
                            time: this._timeAgo(r.updatedAt || r.createdAt),
                            read: isPending, // unread when approved/rejected
                            important: isApproved || isRejected,
                            category: 'approval'
                        });
                    });
                }
            } catch (e) { /* ignore */ }
        }

        /*  TEACHER: enrollment responses (students accepted/rejected)  */
        if (role === 'teacher') {
            try {
                // We fetch the teacher's classes first, then check stats
                const clsRes = await fetch('/api/classes', { headers });
                const clsData = await clsRes.json();
                if (clsData.success && clsData.data?.classes) {
                    for (const cls of clsData.data.classes.slice(0, 5)) {
                        try {
                            const statsRes = await fetch(`/api/enrollments/class/${cls._id}/stats`, { headers });
                            const statsData = await statsRes.json();
                            if (statsData.success && statsData.data) {
                                const { accepted, pending } = statsData.data;
                                if (accepted > 0) {
                                    notifs.unshift({
                                        id: `enr-stats-${cls._id}`,
                                        type: 'success',
                                        title: ` ${accepted} student(s) enrolled in ${cls.name}`,
                                        description: `${pending > 0 ? `${pending} invitation(s) still pending.` : 'All invitations processed.'}`,
                                        time: 'Recent',
                                        read: false,
                                        important: true,
                                        category: 'enrollment'
                                    });
                                }
                            }
                        } catch (e) { /* ignore per-class errors */ }
                    }
                }
            } catch (e) { /* ignore */ }
        }

        /*  MANAGING AUTHORITY / ADMIN: department approval requests  */
        if (role === 'managing_authority' || role === 'admin') {
            try {
                const appRes = await fetch('/api/approvals?status=pending&limit=20', { headers });
                const appData = await appRes.json();
                if (appData.success && appData.data?.requests) {
                    appData.data.requests.forEach(r => {
                        const title = r.requestType === 'department'
                            ? ` Dept Approval: ${r.departmentData?.name || 'New Department'}`
                            : ` Event Request: ${r.eventData?.title || 'New Event'}`;
                        const desc = r.requestType === 'department'
                            ? `${r.requestedBy?.name || 'Admin'} requested a new department`
                            : `${r.requestedBy?.name || 'HOD'} requested event on ${r.eventData?.date ? new Date(r.eventData.date).toLocaleDateString('en-IN') : 'TBD'}`;
                        notifs.unshift({
                            id: `app-${r._id}`,
                            type: 'warning',
                            title,
                            description: desc,
                            time: this._timeAgo(r.createdAt),
                            read: false,
                            important: true,
                            category: 'approval'
                        });
                    });
                }
            } catch (e) { /* ignore */ }
        }

        // Sort: unread first, then by time
        notifs.sort((a, b) => {
            if (!a.read && b.read) return -1;
            if (a.read && !b.read) return 1;
            return 0;
        });

        return notifs;
    }

    /* 
       RENDER
     */
    renderNotifications(filter = 'all') {
        const listContainer = document.getElementById('notificationList');
        if (!listContainer) return;

        let list = this.notifications;
        if (filter === 'unread') list = list.filter(n => !n.read);
        else if (filter === 'important') list = list.filter(n => n.important);

        if (list.length === 0) { this.renderEmpty(filter); return; }

        listContainer.innerHTML = list.map(n => `
            <div class="notification-item ${n.read ? '' : 'unread'}" data-id="${n.id}" ${n.link ? `data-link="${n.link}"` : ''} style="cursor:pointer;">
                <div class="notification-item-icon ${n.type}">
                    <i class="fas ${this._iconForType(n.type)}"></i>
                </div>
                <div class="notification-item-content">
                    <div class="notification-item-title">${n.title}</div>
                    <div class="notification-item-desc">${n.description}</div>
                    <div class="notification-item-time"><i class="fas fa-clock" style="font-size:0.7rem;"></i> ${n.time}</div>
                </div>
                ${!n.read ? '<div class="notification-dot"></div>' : ''}
            </div>
        `).join('');

        listContainer.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', () => {
                this.markAsRead(item.dataset.id);
                // If the notification has a link, navigate to that section
                const link = item.dataset.link;
                if (link) {
                    this.closeSidebar();
                    const sectionLink = document.querySelector(`[data-section="${link}"]`);
                    if (sectionLink) sectionLink.click();
                }
            });
        });
    }

    renderEmpty(filter = 'all') {
        const listContainer = document.getElementById('notificationList');
        if (!listContainer) return;
        const msg = filter === 'unread' ? 'No unread notifications'
                  : filter === 'important' ? 'No important notifications'
                  : 'No notifications';
        listContainer.innerHTML = `
            <div class="notification-empty">
                <i class="fas fa-bell-slash" style="font-size:2rem;color:#cbd5e1;margin-bottom:0.5rem;"></i>
                <p>${msg}</p>
            </div>
        `;
    }

    /* 
       HELPERS
     */
    _iconForType(type) {
        return { info: 'fa-info-circle', success: 'fa-check-circle', warning: 'fa-exclamation-triangle', error: 'fa-times-circle', message: 'fa-envelope' }[type] || 'fa-bell';
    }

    _timeAgo(dateStr) {
        if (!dateStr) return 'Recently';
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins} min ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
        const days = Math.floor(hrs / 24);
        return `${days} day${days > 1 ? 's' : ''} ago`;
    }

    markAsRead(id) {
        const n = this.notifications.find(n => n.id == id);
        if (n && !n.read) { 
            n.read = true; 
            this.updateUnreadCount(); 
            this.renderNotifications();
            
            // If it's a message notification, call the backend to mark it as read
            if (id && id.startsWith('msg-')) {
                const msgId = id.replace('msg-', '');
                const token = localStorage.getItem('authToken');
                if (token && msgId) {
                    fetch(`/api/messages/${msgId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).catch(() => {});
                }
            }
        }
    }

    markAllAsRead() {
        const token = localStorage.getItem('authToken');
        
        // Call backend for each unread message notification
        this.notifications.forEach(n => {
            if (!n.read && n.id && n.id.startsWith('msg-')) {
                const msgId = n.id.replace('msg-', '');
                if (token && msgId) {
                    fetch(`/api/messages/${msgId}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }).catch(() => {});
                }
            }
            n.read = true;
        });
        
        this.updateUnreadCount();
        this.renderNotifications();
    }

    clearAll() {
        if (!confirm('Clear all notifications?')) return;
        this.notifications = [];
        this.updateUnreadCount();
        this.renderEmpty();
    }

    updateUnreadCount() {
        this.unreadCount = this.notifications.filter(n => !n.read).length;
        const badge = document.querySelector('.notification-badge');
        if (badge) {
            badge.textContent = this.unreadCount > 99 ? '99+' : this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
        }
    }

    /** Add a transient (not persisted) notification  used by other scripts */
    addNotification(notification) {
        this.notifications.unshift({
            id: `local-${Date.now()}`,
            read: false,
            time: 'Just now',
            important: false,
            type: 'info',
            ...notification
        });
        this.updateUnreadCount();
        this.renderNotifications();
    }
}

//  Global singleton 
window.notificationManager = new NotificationManager();

function initNotificationManager() {
    if (window.notificationManager && !window.notificationManager.initialized) {
        window.notificationManager.init();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(initNotificationManager, 150));
} else {
    setTimeout(initNotificationManager, 150);
}
