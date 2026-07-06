const User = require('../models/User');
const Class = require('../models/Class');
const Department = require('../models/Department');
const Attendance = require('../models/Attendance');
const Grade = require('../models/Grade');
const Message = require('../models/Message');
const { successResponse, errorResponse } = require('../utils/response.utils');
const { getActiveDepartmentsData } = require('./department.controller');
const { normalizeDepartmentName } = require('../utils/departmentCatalog');

/**
 * Get overall system dashboard stats
 * GET /api/managing-authority/dashboard
 */
const getDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    const totalStudents = await User.countDocuments({ role: 'student', isActive: true });
    const totalTeachers = await User.countDocuments({ role: 'teacher', isActive: true });
    const totalHods = await User.countDocuments({ role: 'hod', isActive: true });
    const departments = await getActiveDepartmentsData();
    const totalDepartments = departments.length;
    const totalClasses = await Class.countDocuments();

    successResponse(res, {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      stats: {
        totalStudents,
        totalTeachers,
        totalHods,
        totalDepartments,
        totalClasses,
      }
    }, 'Dashboard data fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch dashboard data', 500, error.message);
  }
};

/**
 * Get all departments with stats
 * GET /api/managing-authority/departments
 */
const getAllDepartmentsWithStats = async (req, res) => {
  try {
    const enriched = await getActiveDepartmentsData();

    successResponse(res, { departments: enriched, count: enriched.length }, 'Departments fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch departments', 500, error.message);
  }
};

/**
 * Get all faculty (teachers + hods) across all departments
 * GET /api/managing-authority/faculty
 */
const getAllFaculty = async (req, res) => {
  try {
    const { department, page = 1, limit = 50 } = req.query;
    const filter = { role: { $in: ['teacher', 'hod'] }, isActive: true };
    if (department) filter.department = department;

    const skip = (page - 1) * limit;
    const faculty = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ department: 1, name: 1 });

    const total = await User.countDocuments(filter);

    successResponse(res, {
      faculty,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    }, 'Faculty fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch faculty', 500, error.message);
  }
};

/**
 * Get all students across all departments
 * GET /api/managing-authority/students
 */
const getAllStudents = async (req, res) => {
  try {
    const { department, page = 1, limit = 500 } = req.query;
    const filter = { role: 'student', isActive: true };
    if (department) filter.department = department;

    const skip = (page - 1) * limit;
    const students = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ department: 1, name: 1 });

    const total = await User.countDocuments(filter);

    successResponse(res, {
      students,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) }
    }, 'Students fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch students', 500, error.message);
  }
};

/**
 * Get overall attendance stats
 * GET /api/managing-authority/attendance
 */
const getOverallAttendance = async (req, res) => {
  try {
    const total = await Attendance.countDocuments();
    const present = await Attendance.countDocuments({ status: 'present' });
    const absent = await Attendance.countDocuments({ status: 'absent' });
    const late = await Attendance.countDocuments({ status: 'late' });

    const overallRate = total > 0 ? Math.round((present / total) * 100) : 0;

    // Per-department breakdown
    const departments = await Department.find({ isActive: true }).select('name');
    const deptBreakdown = await Promise.all(departments.map(async (dept) => {
      const deptStudents = await User.find({ role: 'student', department: dept.name }).select('_id');
      const deptStudentIds = deptStudents.map(s => s._id);
      const deptTotal = await Attendance.countDocuments({ student: { $in: deptStudentIds } });
      const deptPresent = await Attendance.countDocuments({ student: { $in: deptStudentIds }, status: 'present' });
      return {
        department: dept.name,
        total: deptTotal,
        present: deptPresent,
        rate: deptTotal > 0 ? Math.round((deptPresent / deptTotal) * 100) : 0
      };
    }));

    successResponse(res, {
      overall: { total, present, absent, late, rate: overallRate },
      byDepartment: deptBreakdown
    }, 'Attendance stats fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch attendance stats', 500, error.message);
  }
};

/**
 * Get overall grade/performance stats
 * GET /api/managing-authority/grades
 */
const getOverallGrades = async (req, res) => {
  try {
    const { department } = req.query;

    let studentFilter = { role: 'student', isActive: true };
    if (department) studentFilter.department = department;

    const students = await User.find(studentFilter).select('_id');
    const studentIds = students.map(s => s._id);

    const grades = await Grade.find({ student: { $in: studentIds } })
      .populate('student', 'name studentId department')
      .populate('class', 'name department')
      .sort({ createdAt: -1 })
      .limit(200);

    successResponse(res, { grades, count: grades.length }, 'Grades fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch grades', 500, error.message);
  }
};

/**
 * Create a new user (faculty/student/hod)
 * POST /api/managing-authority/users
 */
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    const bcrypt = require('bcryptjs');

    const existing = await User.findOne({ email });
    if (existing) {
      return errorResponse(res, 'User with this email already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(password || 'EduConnect@123', 10);

    // Normalize department name (e.g. CSE-AIML â†’ CSE(AI), CS-DS â†’ CSE(DS))
    const normalizedDepartment = normalizeDepartmentName(department) || department;

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      department: normalizedDepartment,
    });

    if (role === 'student') {
      // Auto-increment student roll number
      const lastStudent = await User.findOne({ role: 'student', studentId: { $exists: true, $ne: null } })
        .sort({ studentId: -1 })
        .select('studentId');
      
      let nextRollNumber = 1;
      if (lastStudent && lastStudent.studentId) {
        // Extract numeric part from studentId (handles both "69" and "STU69" formats)
        const numericPart = lastStudent.studentId.toString().replace(/\D/g, '');
        if (numericPart) {
          nextRollNumber = parseInt(numericPart) + 1;
        }
      }
      
      // Assign the next roll number as studentId
      user.studentId = nextRollNumber.toString();
    } else if (role === 'teacher' || role === 'hod') {
      user.teacherId = `${role === 'hod' ? 'HOD' : 'TEA'}${Date.now()}`;
    }

    await user.save();

    const userData = user.toObject();
    delete userData.password;

    successResponse(res, userData, 'User created successfully', 201);
  } catch (error) {
    errorResponse(res, 'Failed to create user', 500, error.message);
  }
};

/**
 * Update a user
 * PUT /api/managing-authority/users/:id
 */
const updateUser = async (req, res) => {
  try {
    const { name, email, department, isActive, role } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, 'User not found', 404);

    if (name) user.name = name;
    if (email) user.email = email;
    if (department) user.department = normalizeDepartmentName(department) || department;
    if (isActive !== undefined) user.isActive = isActive;
    if (role) user.role = role;

    await user.save();
    const userData = user.toObject();
    delete userData.password;

    successResponse(res, userData, 'User updated successfully');
  } catch (error) {
    errorResponse(res, 'Failed to update user', 500, error.message);
  }
};

/**
 * Delete a user
 * DELETE /api/managing-authority/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return errorResponse(res, 'User not found', 404);

    // Soft delete
    user.isActive = false;
    await user.save();

    successResponse(res, null, 'User deactivated successfully');
  } catch (error) {
    errorResponse(res, 'Failed to delete user', 500, error.message);
  }
};

/**
 * Get average CGPA per active department
 * Uses User.grade field (0-10 scale stored directly on each student).
 * GET /api/managing-authority/dept-cgpa
 */
const getDeptCgpa = async (req, res) => {
  try {
    const { getDepartmentAliases } = require('../utils/departmentCatalog');
    const departments = await getActiveDepartmentsData();

    const results = await Promise.all(departments.map(async (dept) => {
      const aliases = getDepartmentAliases(dept.name);
      const students = await User.find({
        role: 'student',
        isActive: true,
        department: { $in: aliases },
      }).select('grade');

      if (!students.length) {
        return { department: dept.name, avgCgpa: 'N/A', studentCount: 0 };
      }

      // Use User.grade (0-10 CGPA stored per student)
      const withGrade = students.filter(s => s.grade != null && s.grade > 0);
      if (!withGrade.length) {
        return { department: dept.name, avgCgpa: 'N/A', studentCount: students.length };
      }

      const totalCgpa = withGrade.reduce((sum, s) => sum + s.grade, 0);
      const avgCgpa = parseFloat((totalCgpa / withGrade.length).toFixed(2));

      return { department: dept.name, avgCgpa, studentCount: students.length };
    }));

    successResponse(res, { departments: results }, 'Department CGPA fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch department CGPA', 500, error.message);
  }
};

/**
 * Principal sends a message to HOD of a low-CGPA department.
 * HOD then sends individual alerts to students in that dept with CGPA < 7.0.
 * POST /api/managing-authority/alert-low-cgpa
 * Body: { department: String }
 */
const alertLowCgpaDept = async (req, res) => {
  try {
    const { department } = req.body;
    if (!department) return errorResponse(res, 'Department is required', 400);

    // Find HOD of the department
    const hod = await User.findOne({ role: 'hod', isActive: true, department }).select('_id name');
    if (!hod) return errorResponse(res, `No active HOD found for department: ${department}`, 404);

    // Send message from principal to HOD
    const hodMessage = new Message({
      sender: req.user.id,
      recipients: [hod._id],
      subject: `Low Average CGPA Alert â€“ ${department}`,
      content: `Dear ${hod.name},\n\nThis is to bring to your attention that the average CGPA of the ${department} department has fallen below 7.0. Please review the academic performance of the students in your department and take necessary corrective action.\n\nKindly identify students with CGPA below 7.0 and send them individual performance alerts.\n\nRegards,\nPrincipal / Managing Authority`,
      isDraft: false,
    });
    await hodMessage.save();

    // Find all students in dept with CGPA < 7.0 (using User.grade field, 0-10 scale)
    const { getDepartmentAliases: getAliases } = require('../utils/departmentCatalog');
    const deptAliases = getAliases(department);
    const students = await User.find({ role: 'student', isActive: true, department: { $in: deptAliases } }).select('_id name grade');
    const lowCgpaStudents = students
      .filter(s => s.grade != null && s.grade < 7.0)
      .map(s => ({ id: s._id, name: s.name, cgpa: parseFloat(s.grade.toFixed(2)) }));

    // HOD sends individual messages to each low-CGPA student
    if (lowCgpaStudents.length > 0) {
      await Promise.all(lowCgpaStudents.map(student =>
        new Message({
          sender: hod._id,
          recipients: [student.id],
          subject: `Academic Performance Alert â€“ Action Required`,
          content: `Dear ${student.name},\n\nThis is to inform you that your current CGPA (${student.cgpa}) is below the required threshold of 7.0. You are advised to:\n\nâ€¢ Meet with your subject teachers for additional guidance\nâ€¢ Attend all classes regularly\nâ€¢ Complete all assignments and assessments on time\nâ€¢ Visit the department academic counselor\n\nPlease take this as a serious concern and work towards improving your academic performance.\n\nFor any support, please contact the department office.\n\nRegards,\n${hod.name}\nHead of Department, ${department}`,
          isDraft: false,
        }).save()
      ));
    }

    successResponse(res, {
      hodNotified: true,
      hodName: hod.name,
      studentsAlerted: lowCgpaStudents.length,
      lowCgpaStudents,
    }, `Alert sent to HOD. ${lowCgpaStudents.length} student(s) notified.`);
  } catch (error) {
    errorResponse(res, 'Failed to send low CGPA alert', 500, error.message);
  }
};

module.exports = {
  getDashboard,
  getAllDepartmentsWithStats,
  getAllFaculty,
  getAllStudents,
  getOverallAttendance,
  getOverallGrades,
  createUser,
  updateUser,
  deleteUser,
  getDeptCgpa,
  alertLowCgpaDept,
};

