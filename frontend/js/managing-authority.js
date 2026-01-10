document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first
    checkAuthentication();
    
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
    
    // Open modal functions
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }
    
    // Close modal functions
    function closeModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
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
    const addDepartmentBtn = document.getElementById('addDepartmentBtn');
    const addDepartmentForm = document.getElementById('addDepartmentForm');
    const viewDepartmentButtons = document.querySelectorAll('.view-department');
    const editDepartmentButtons = document.querySelectorAll('.edit-department');
    const editDepartmentForm = document.getElementById('editDepartmentForm');
    
    // Add Department
    if (addDepartmentBtn) {
        addDepartmentBtn.addEventListener('click', function() {
            openModal('addDepartmentModal');
        });
    }
    
    if (addDepartmentForm) {
        addDepartmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const deptName = document.getElementById('deptName').value;
            const deptHod = document.getElementById('deptHod').value;
            const deptFaculty = document.getElementById('deptFaculty').value;
            const deptStudents = document.getElementById('deptStudents').value;
            const deptBudget = document.getElementById('deptBudget').value;
            const deptEstablished = document.getElementById('deptEstablished').value;
            
            // In a real application, you would send this data to the server
            // For demonstration, we'll just show a success message
            showNotification('Department added successfully!', 'success');
            
            // Reset form and close modal
            addDepartmentForm.reset();
            closeModal(document.getElementById('addDepartmentModal'));
        });
    }
    
    // View Department
    viewDepartmentButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get department ID
            const deptId = this.getAttribute('data-id');
            
            // In a real application, you would fetch department data from the server
            // For demonstration, we'll use sample data
            const departmentData = getDepartmentData(deptId);
            
            // Populate modal with department data
            document.getElementById('viewDeptName').textContent = departmentData.name;
            document.getElementById('viewDeptHod').textContent = departmentData.hod;
            document.getElementById('viewDeptFaculty').textContent = departmentData.facultyCount;
            document.getElementById('viewDeptStudents').textContent = departmentData.studentCount;
            document.getElementById('viewDeptBudget').textContent = departmentData.budget;
            document.getElementById('viewDeptEstablished').textContent = departmentData.established;
            document.getElementById('viewDeptPerformance').innerHTML = `<span class="status-badge ${departmentData.performanceClass}">${departmentData.performance}</span>`;
            
            // Open modal
            openModal('viewDepartmentModal');
        });
    });
    
    // Edit Department
    editDepartmentButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get department ID
            const deptId = this.getAttribute('data-id');
            
            // In a real application, you would fetch department data from the server
            // For demonstration, we'll use sample data
            const departmentData = getDepartmentData(deptId);
            
            // Populate form with department data
            document.getElementById('editDeptId').value = deptId;
            document.getElementById('editDeptName').value = departmentData.name;
            document.getElementById('editDeptHod').value = departmentData.hod;
            document.getElementById('editDeptFaculty').value = departmentData.facultyCount;
            document.getElementById('editDeptStudents').value = departmentData.studentCount;
            document.getElementById('editDeptBudget').value = departmentData.budget;
            
            // Set performance value
            const performanceSelect = document.getElementById('editDeptPerformance');
            for (let i = 0; i < performanceSelect.options.length; i++) {
                if (performanceSelect.options[i].value.toLowerCase() === departmentData.performance.toLowerCase()) {
                    performanceSelect.selectedIndex = i;
                    break;
                }
            }
            
            // Open modal
            openModal('editDepartmentModal');
        });
    });
    
    if (editDepartmentForm) {
        editDepartmentForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const deptId = document.getElementById('editDeptId').value;
            const deptName = document.getElementById('editDeptName').value;
            const deptHod = document.getElementById('editDeptHod').value;
            const deptFaculty = document.getElementById('editDeptFaculty').value;
            const deptStudents = document.getElementById('editDeptStudents').value;
            const deptBudget = document.getElementById('editDeptBudget').value;
            const deptPerformance = document.getElementById('editDeptPerformance').value;
            
            // In a real application, you would send this data to the server
            // For demonstration, we'll just show a success message
            showNotification('Department updated successfully!', 'success');
            
            // Close modal
            closeModal(document.getElementById('editDepartmentModal'));
        });
    }
    
    // Faculty Management
    const addFacultyBtn = document.getElementById('addFacultyBtn');
    const addFacultyForm = document.getElementById('addFacultyForm');
    const viewFacultyButtons = document.querySelectorAll('.view-faculty');
    const evaluateFacultyButtons = document.querySelectorAll('.evaluate-faculty');
    const evaluateFacultyForm = document.getElementById('evaluateFacultyForm');
    
    // Add Faculty
    if (addFacultyBtn) {
        addFacultyBtn.addEventListener('click', function() {
            openModal('addFacultyModal');
        });
    }
    
    if (addFacultyForm) {
        addFacultyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const facultyName = document.getElementById('facultyName').value;
            const facultyDepartment = document.getElementById('facultyDepartment').value;
            const facultyPosition = document.getElementById('facultyPosition').value;
            const facultyExperience = document.getElementById('facultyExperience').value;
            const facultyEmail = document.getElementById('facultyEmail').value;
            const facultyPhone = document.getElementById('facultyPhone').value;
            const facultyQualification = document.getElementById('facultyQualification').value;
            
            // In a real application, you would send this data to the server
            // For demonstration, we'll just show a success message
            showNotification('Faculty added successfully!', 'success');
            
            // Reset form and close modal
            addFacultyForm.reset();
            closeModal(document.getElementById('addFacultyModal'));
        });
    }
    
    // View Faculty
    viewFacultyButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get faculty ID
            const facultyId = this.getAttribute('data-id');
            
            // In a real application, you would fetch faculty data from the server
            // For demonstration, we'll use sample data
            const facultyData = getFacultyData(facultyId);
            
            // Populate modal with faculty data
            document.getElementById('viewFacultyName').textContent = facultyData.name;
            document.getElementById('viewFacultyDepartment').textContent = facultyData.department;
            document.getElementById('viewFacultyPosition').textContent = facultyData.position;
            document.getElementById('viewFacultyExperience').textContent = facultyData.experience;
            document.getElementById('viewFacultyEmail').textContent = facultyData.email;
            document.getElementById('viewFacultyPhone').textContent = facultyData.phone;
            document.getElementById('viewFacultyPublications').textContent = facultyData.publications;
            document.getElementById('viewFacultyPerformance').innerHTML = `<span class="status-badge ${facultyData.performanceClass}">${facultyData.performance}</span>`;
            
            // Open modal
            openModal('viewFacultyModal');
        });
    });
    
    // Evaluate Faculty
    evaluateFacultyButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get faculty ID
            const facultyId = this.getAttribute('data-id');
            
            // In a real application, you would fetch faculty data from the server
            // For demonstration, we'll use sample data
            const facultyData = getFacultyData(facultyId);
            
            // Populate form with faculty data
            document.getElementById('evaluateFacultyId').value = facultyId;
            document.getElementById('evaluateFacultyName').value = facultyData.name;
            
            // Reset form fields
            document.getElementById('teachingPerformance').value = '';
            document.getElementById('researchOutput').value = '';
            document.getElementById('studentFeedback').value = '';
            document.getElementById('adminContribution').value = '';
            document.getElementById('evaluationComments').value = '';
            
            // Open modal
            openModal('evaluateFacultyModal');
        });
    });
    
    if (evaluateFacultyForm) {
        evaluateFacultyForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const facultyId = document.getElementById('evaluateFacultyId').value;
            const teachingPerformance = document.getElementById('teachingPerformance').value;
            const researchOutput = document.getElementById('researchOutput').value;
            const studentFeedback = document.getElementById('studentFeedback').value;
            const adminContribution = document.getElementById('adminContribution').value;
            const evaluationComments = document.getElementById('evaluationComments').value;
            
            // In a real application, you would send this data to the server
            // For demonstration, we'll just show a success message
            showNotification('Faculty evaluation submitted successfully!', 'success');
            
            // Close modal
            closeModal(document.getElementById('evaluateFacultyModal'));
        });
    }
    
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
    
    // View Approval
    viewApprovalButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get approval ID
            const approvalId = this.getAttribute('data-id');
            
            // In a real application, you would fetch approval data from the server
            // For demonstration, we'll use sample data
            const approvalData = getApprovalData(approvalId);
            
            // Populate modal with approval data
            document.getElementById('viewApprovalTitle').textContent = approvalData.title;
            document.getElementById('viewApprovalDepartment').textContent = approvalData.department;
            document.getElementById('viewApprovalRequestedBy').textContent = approvalData.requestedBy;
            document.getElementById('viewApprovalDate').textContent = approvalData.date;
            document.getElementById('viewApprovalPriority').innerHTML = `<span class="priority-badge ${approvalData.priorityClass}">${approvalData.priority}</span>`;
            document.getElementById('viewApprovalStatus').innerHTML = `<span class="status-badge ${approvalData.statusClass}">${approvalData.status}</span>`;
            document.getElementById('viewApprovalDescription').textContent = approvalData.description;
            document.getElementById('viewApprovalJustification').textContent = approvalData.justification;
            
            // Open modal
            openModal('viewApprovalModal');
        });
    });
    
    // Approve Approval
    approveApprovalButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get approval ID
            const approvalId = this.getAttribute('data-id');
            
            // In a real application, you would send this data to the server
            // For demonstration, we'll just show a success message
            showNotification('Approval approved successfully!', 'success');
            
            // Close modal if open
            const viewApprovalModal = document.getElementById('viewApprovalModal');
            if (viewApprovalModal.classList.contains('active')) {
                closeModal(viewApprovalModal);
            }
        });
    });
    
    // Reject Approval
    rejectApprovalButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get approval ID
            const approvalId = this.getAttribute('data-id');
            
            // In a real application, you would send this data to the server
            // For demonstration, we'll just show a success message
            showNotification('Approval rejected successfully!', 'success');
            
            // Close modal if open
            const viewApprovalModal = document.getElementById('viewApprovalModal');
            if (viewApprovalModal.classList.contains('active')) {
                closeModal(viewApprovalModal);
            }
        });
    });
    
    // Announcements Management
    const newAnnouncementBtn = document.getElementById('newAnnouncementBtn');
    const newAnnouncementForm = document.getElementById('newAnnouncementForm');
    const editAnnouncementButtons = document.querySelectorAll('.edit-announcement');
    const deleteAnnouncementButtons = document.querySelectorAll('.delete-announcement');
    const editAnnouncementForm = document.getElementById('editAnnouncementForm');
    
    // New Announcement
    if (newAnnouncementBtn) {
        newAnnouncementBtn.addEventListener('click', function() {
            openModal('newAnnouncementModal');
        });
    }
    
    if (newAnnouncementForm) {
        newAnnouncementForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form values
            const announcementTitle = document.getElementById('announcementTitle').value;
            const announcementContent = document.getElementById('announcementContent').value;
            const announcementPriority = document.getElementById('announcementPriority').value;
            const announcementTargetAudience = document.getElementById('announcementTargetAudience').value;
            const announcementExpiry = document.getElementById('announcementExpiry').value;
            
            // In a real application, you would send this data to the server
            // For demonstration, we'll just show a success message
            showNotification('Announcement posted successfully!', 'success');
            
            // Reset form and close modal
            newAnnouncementForm.reset();
            closeModal(document.getElementById('newAnnouncementModal'));
        });
    }
    
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
    
    // Logout Button
    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Clear authentication data
            localStorage.removeItem('authToken');
            localStorage.removeItem('currentUser');
            
            // Show notification
            showNotification('Logged out successfully!', 'success');
            
            // Redirect to login page after a short delay
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
        });
    }
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