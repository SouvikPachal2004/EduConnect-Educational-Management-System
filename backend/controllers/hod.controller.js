const User = require('../models/User');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');
const Grade = require('../models/Grade');
const { successResponse, errorResponse } = require('../utils/response.utils');

/**
 * Get HOD's own department info and stats
 * GET /api/hod/dashboard
 */
const getHodDashboard = async (req, res) => {
  try {
    const hod = await User.findById(req.user.id).select('-password');
    if (!hod || hod.role !== 'hod') {
      return errorResponse(res, 'Unauthorized', 403);
    }

    const { getDepartmentAliases, normalizeDepartmentName } = require('../utils/departmentCatalog');
    const canonicalDept = normalizeDepartmentName(hod.department) || hod.department;
    const aliases = getDepartmentAliases(canonicalDept);

    // Count teachers in department (using aliases)
    const teacherCount = await User.countDocuments({ role: 'teacher', department: { $in: aliases } });

    // Count students in department (using aliases)
    const studentCount = await User.countDocuments({ role: 'student', department: { $in: aliases } });

    // Count active classes by teachers in department
    const teacherIds = (await User.find({ role: 'teacher', department: { $in: aliases } }).select('_id')).map(t => t._id);
    const classCount = await Class.countDocuments({ teacher: { $in: teacherIds } });

    successResponse(res, {
      hod: {
        id: hod._id,
        name: hod.name,
        email: hod.email,
        department: hod.department,
        teacherId: hod.teacherId,
      },
      stats: {
        teacherCount,
        studentCount,
        classCount,
      }
    }, 'HOD dashboard data fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch HOD dashboard data', 500, error.message);
  }
};

/**
 * Get all teachers in HOD's department
 * GET /api/hod/teachers
 */
const getDepartmentTeachers = async (req, res) => {
  try {
    const hod = await User.findById(req.user.id).select('-password');
    if (!hod || hod.role !== 'hod') {
      return errorResponse(res, 'Unauthorized', 403);
    }

    const { getDepartmentAliases, normalizeDepartmentName } = require('../utils/departmentCatalog');
    const canonicalDept = normalizeDepartmentName(hod.department) || hod.department;
    const aliases = getDepartmentAliases(canonicalDept);

    const teachers = await User.find({
      role: 'teacher',
      department: { $in: aliases },
    }).select('-password').sort({ name: 1 });

    successResponse(res, { teachers, count: teachers.length }, 'Department teachers fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch department teachers', 500, error.message);
  }
};

/**
 * Get all students in HOD's department
 * GET /api/hod/students
 */
const getDepartmentStudents = async (req, res) => {
  try {
    const hod = await User.findById(req.user.id).select('-password');
    if (!hod || hod.role !== 'hod') {
      return errorResponse(res, 'Unauthorized', 403);
    }

    const { getDepartmentAliases, normalizeDepartmentName } = require('../utils/departmentCatalog');
    const canonicalDept = normalizeDepartmentName(hod.department) || hod.department;
    const aliases = getDepartmentAliases(canonicalDept);

    const students = await User.find({
      role: 'student',
      department: { $in: aliases },
    }).select('-password').sort({ name: 1 });

    successResponse(res, { students, count: students.length }, 'Department students fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch department students', 500, error.message);
  }
};

/**
 * Get all classes in HOD's department (classes taught by teachers in the department)
 * GET /api/hod/classes
 */
const getDepartmentClasses = async (req, res) => {
  try {
    const hod = await User.findById(req.user.id).select('-password');
    if (!hod || hod.role !== 'hod') {
      return errorResponse(res, 'Unauthorized', 403);
    }

    // Get all teachers in the department
    const teachers = await User.find({ role: 'teacher', department: hod.department }).select('_id');
    const teacherIds = teachers.map(t => t._id);

    // Get classes taught by those teachers
    const classes = await Class.find({ teacher: { $in: teacherIds } })
      .populate('teacher', 'name email teacherId')
      .sort({ name: 1 });

    successResponse(res, { classes, count: classes.length }, 'Department classes fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch department classes', 500, error.message);
  }
};

/**
 * Get all courses visible to HOD's department.
 * Returns MERGED view of:
 *   1. Department-specific Subjects (HOD-created, stored in Subject collection)
 *   2. Global Classes taught by teachers in this department (Admin-created, stored in Class collection without subject link)
 * GET /api/hod/courses
 */
const getDepartmentCourses = async (req, res) => {
  try {
    const hod = await User.findById(req.user.id).select('-password');
    if (!hod || hod.role !== 'hod') {
      return errorResponse(res, 'Unauthorized', 403);
    }

    const Subject = require('../models/Subject');
    const { getDepartmentAliases, normalizeDepartmentName } = require('../utils/departmentCatalog');
    const canonicalDept = normalizeDepartmentName(hod.department) || hod.department;
    const aliases = getDepartmentAliases(canonicalDept);

    const departmentTeachers = await User.find({
      role: { $in: ['teacher', 'hod'] },
      department: { $in: aliases },
    }).select('_id name');
    const teacherIds = departmentTeachers.map(t => t._id);

    // Count dept students once
    const deptStudentCount = await User.countDocuments({ role: 'student', department: { $in: aliases } });

    // ── 1. Get Subjects (HOD-created, department-specific) ───────────────────
    const subjects = await Subject.find({
      department: { $in: aliases },
      isActive: true,
    })
      .populate('assignedTeacher', 'name email teacherId _id')
      .populate({ path: 'classId', select: 'name code students isActive' });

    const subjectCourses = subjects.map(s => ({
      _id: s._id,
      name: s.name,
      code: s.code,
      credits: s.credits || 3,
      semester: s.semester || '',
      status: s.status === 'class_created' ? 'Active' : s.status === 'assigned' ? 'Assigned' : 'Pending',
      isActive: s.isActive,
      teacher: s.assignedTeacher
        ? { _id: s.assignedTeacher._id, name: s.assignedTeacher.name }
        : null,
      classId: s.classId ? s.classId._id : null,
      students: s.classId ? (s.classId.students && s.classId.students.length > 0 ? s.classId.students.length : deptStudentCount) : 0,
      source: 'subject',  // mark source
    }));

    // ── 2. Get Classes (Admin-created or teacher-created without Subject link) ──
    // Find classes taught by dept teachers that are NOT linked to any subject
    const allClasses = await Class.find({ teacher: { $in: teacherIds } })
      .populate('teacher', 'name email teacherId _id')
      .sort({ name: 1 });

    // Filter out classes that are already linked to a subject (avoid duplicates)
    const subjectClassIds = new Set(subjects.filter(s => s.classId).map(s => s.classId._id.toString()));
    const standaloneClasses = allClasses.filter(c => !subjectClassIds.has(c._id.toString()));

    const classCourses = standaloneClasses.map(c => ({
      _id: c._id,
      name: c.name,
      code: c.code || '',
      credits: c.credits || 3,
      semester: '',
      status: c.isActive !== false ? 'Active' : 'Inactive',
      isActive: c.isActive,
      teacher: c.teacher
        ? { _id: c.teacher._id, name: c.teacher.name }
        : null,
      classId: c._id,
      students: (c.students && c.students.length > 0) ? c.students.length : deptStudentCount,
      source: 'class',  // mark source
    }));

    // ── 3. Merge both sources ─────────────────────────────────────────────────
    const courses = [...subjectCourses, ...classCourses];

    successResponse(res, {
      courses,
      count: courses.length,
      breakdown: { subjects: subjectCourses.length, classes: classCourses.length }
    }, 'Department courses fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch department courses', 500, error.message);
  }
};

/**
 * Get attendance summary for HOD's department
 * GET /api/hod/attendance
 */
const getDepartmentAttendance = async (req, res) => {
  try {
    const hod = await User.findById(req.user.id).select('-password');
    if (!hod || hod.role !== 'hod') {
      return errorResponse(res, 'Unauthorized', 403);
    }

    // Get all students in department
    const students = await User.find({ role: 'student', department: hod.department }).select('_id name');
    const studentIds = students.map(s => s._id);

    // Get all classes taught by teachers in department
    const teachers = await User.find({ role: 'teacher', department: hod.department }).select('_id');
    const teacherIds = teachers.map(t => t._id);
    const classes = await Class.find({ teacher: { $in: teacherIds } }).select('_id name');
    const classIds = classes.map(c => c._id);

    // Get attendance records
    const attendanceRecords = await Attendance.find({
      student: { $in: studentIds },
      class: { $in: classIds }
    }).populate('class', 'name').populate('student', 'name studentId');

    // Aggregate by class
    const classAttendance = {};
    attendanceRecords.forEach(record => {
      const classId = record.class._id.toString();
      if (!classAttendance[classId]) {
        classAttendance[classId] = {
          className: record.class.name,
          total: 0,
          present: 0,
          absent: 0,
          late: 0
        };
      }
      classAttendance[classId].total++;
      if (record.status === 'present') classAttendance[classId].present++;
      else if (record.status === 'absent') classAttendance[classId].absent++;
      else if (record.status === 'late') classAttendance[classId].late++;
    });

    const attendanceSummary = Object.values(classAttendance).map(c => ({
      ...c,
      rate: c.total > 0 ? Math.round((c.present / c.total) * 100) : 0
    }));

    successResponse(res, { attendanceSummary }, 'Department attendance fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch department attendance', 500, error.message);
  }
};

/**
 * Get grades/performance for HOD's department
 * GET /api/hod/grades
 */
const getDepartmentGrades = async (req, res) => {
  try {
    const hod = await User.findById(req.user.id).select('-password');
    if (!hod || hod.role !== 'hod') {
      return errorResponse(res, 'Unauthorized', 403);
    }

    const { getDepartmentAliases, normalizeDepartmentName } = require('../utils/departmentCatalog');
    const canonicalDept = normalizeDepartmentName(hod.department) || hod.department;
    const aliases = getDepartmentAliases(canonicalDept);

    const students = await User.find({
      role: 'student',
      department: { $in: aliases },
    }).select('_id name studentId');

    const studentIds = students.map(s => s._id);

    const grades = await Grade.find({ student: { $in: studentIds } })
      .populate('student', 'name studentId')
      .populate('class', 'name')
      .sort({ createdAt: -1 });

    successResponse(res, { grades, count: grades.length }, 'Department grades fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch department grades', 500, error.message);
  }
};

/**
 * Get messages for HOD (uses existing message system)
 * GET /api/hod/messages
 */
const getHodMessages = async (req, res) => {
  try {
    const Message = require('../models/Message');
    const messages = await Message.find({ 
      recipients: req.user.id,
      isDeleted: false
    })
      .populate('sender', 'name email role')
      .sort({ createdAt: -1 })
      .limit(50);

    successResponse(res, { messages, count: messages.length }, 'Messages fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch messages', 500, error.message);
  }
};

/**
 * Update a Class (allows HOD to edit admin-created courses)
 * PUT /api/hod/classes/:id
 */
const updateClass = async (req, res) => {
  try {
    const hod = await User.findById(req.user.id).select('-password');
    if (!hod || hod.role !== 'hod') {
      return errorResponse(res, 'Unauthorized', 403);
    }

    const { name, code, credits, teacher, isActive } = req.body;
    console.log('📝 HOD updateClass called with:', { name, code, credits, teacher, isActive });
    
    const classToUpdate = await Class.findById(req.params.id);
    
    if (!classToUpdate) {
      return errorResponse(res, 'Class not found', 404);
    }

    console.log('📚 Current class data:', { 
      code: classToUpdate.code, 
      name: classToUpdate.name,
      credits: classToUpdate.credits 
    });

    // Verify the class belongs to a teacher in HOD's department
    const classTeacher = await User.findById(classToUpdate.teacher);
    const { getDepartmentAliases, normalizeDepartmentName } = require('../utils/departmentCatalog');
    const canonicalDept = normalizeDepartmentName(hod.department) || hod.department;
    const aliases = getDepartmentAliases(canonicalDept);
    
    if (!classTeacher || !aliases.includes(classTeacher.department)) {
      return errorResponse(res, 'You can only update classes in your department', 403);
    }

    // Update fields
    if (name !== undefined && name.trim() !== '') classToUpdate.name = name.trim();
    if (code !== undefined && code.trim() !== '') {
      // Check if code is changing and if new code already exists
      if (code.trim() !== classToUpdate.code) {
        console.log(`🔄 Code changing from "${classToUpdate.code}" to "${code.trim()}"`);
        const existingClass = await Class.findOne({ code: code.trim(), _id: { $ne: req.params.id } });
        if (existingClass) {
          console.log('❌ Code already exists:', existingClass.code);
          return errorResponse(res, `Course code "${code}" is already in use by another class`, 400);
        }
        classToUpdate.code = code.trim();
      } else {
        console.log('ℹ️ Code unchanged:', code.trim());
      }
    }
    if (credits !== undefined) {
      if (credits < 1 || credits > 10) {
        return errorResponse(res, 'Credits must be between 1 and 10', 400);
      }
      classToUpdate.credits = credits;
    }
    if (teacher) {
      // Verify new teacher is in HOD's department
      const newTeacher = await User.findById(teacher);
      if (!newTeacher || !aliases.includes(newTeacher.department)) {
        return errorResponse(res, 'Teacher must be from your department', 400);
      }
      classToUpdate.teacher = teacher;
    }
    if (isActive !== undefined) classToUpdate.isActive = isActive;

    await classToUpdate.save();
    console.log('✅ Class updated successfully:', {
      code: classToUpdate.code,
      name: classToUpdate.name,
      credits: classToUpdate.credits
    });
    
    await classToUpdate.populate('teacher', 'name email department');

    successResponse(res, classToUpdate, 'Class updated successfully');
  } catch (error) {
    console.error('❌ Error updating class:', error);
    // Handle unique constraint error
    if (error.code === 11000 && error.keyPattern && error.keyPattern.code) {
      return errorResponse(res, 'Course code already exists', 400);
    }
    errorResponse(res, 'Failed to update class', 500, error.message);
  }
};

module.exports = {
  getHodDashboard,
  getDepartmentTeachers,
  getDepartmentStudents,
  getDepartmentClasses,
  getDepartmentCourses,
  getDepartmentAttendance,
  getDepartmentGrades,
  getHodMessages,
  updateClass,
};
