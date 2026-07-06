const User = require('../models/User');
const { hashPassword, comparePassword, generateAuthToken } = require('../utils/auth.utils');
const { successResponse, errorResponse, validationErrorResponse } = require('../utils/response.utils');
const { logActivity } = require('../utils/activityLogger');
const { normalizeDepartmentName } = require('../utils/departmentCatalog');

// Register user
const register = async (req, res) => {
  try {
    const { name, email, password, role, department, program } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return errorResponse(res, 'User with this email already exists', 400);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Normalize department name (e.g. CSE-AIML → CSE(AI), CS-DS → CSE(DS))
    const normalizedDepartment = normalizeDepartmentName(department) || department;

    // Create user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      department: normalizedDepartment,
    });

    // For students: assign program (if provided) and default to semester 1
    if (role === 'student') {
      if (program) user.program = program;
      user.currentSemester = 1;
      user.semesterCgpas = [];
    }

    // Generate role-specific ID based on role
    if (role === 'student') {
      // Per-program roll number: unique within the same program only
      const programId = user.program || null;
      let desiredRoll = req.body.studentId ? req.body.studentId.toString() : null;

      if (desiredRoll) {
        // Check if this roll already exists in the SAME program
        const exists = await User.findOne({ studentId: desiredRoll, program: programId, role: 'student' });
        if (exists) {
          // Roll taken — use max+1 in this program
          const programStudents = await User.find({ role: 'student', program: programId }).select('studentId').lean();
          let maxRoll = 0;
          programStudents.forEach(s => { const n = parseInt(String(s.studentId).replace(/\D/g,''),10); if (!isNaN(n) && n > maxRoll) maxRoll = n; });
          desiredRoll = (maxRoll + 1).toString();
        }
        user.studentId = desiredRoll;
      } else {
        // Auto-assign: max roll in this program + 1
        const programStudents = await User.find({ role: 'student', program: programId }).select('studentId').lean();
        let maxRoll = 0;
        programStudents.forEach(s => { const n = parseInt(String(s.studentId).replace(/\D/g,''),10); if (!isNaN(n) && n > maxRoll) maxRoll = n; });
        user.studentId = (maxRoll + 1).toString();
      }
    } else if (role === 'teacher') {
      user.teacherId = `TEA${Date.now()}`;
    } else if (role === 'admin') {
      // Admins don't need special IDs, but we could generate one if needed
      // For now, we'll leave it as is
    } else if (role === 'hod') {
      // HODs are teachers with special roles, so they get teacher IDs
      user.teacherId = `HOD${Date.now()}`;
    } else if (role === 'managing_authority') {
      // Managing authority members don't need special IDs
    }

    await user.save();

    // Log user creation activity
    await logActivity({
      userId: user._id,
      userName: user.name,
      action: 'user_creation',
      actionLabel: 'User Registration',
      description: `New ${role} user registered with email ${email}`,
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
      status: 'success',
      metadata: {
        role: role,
        department: department,
        studentId: user.studentId,
        teacherId: user.teacherId
      }
    });

    // Generate auth token
    const token = generateAuthToken(user);

    // Return success response
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      studentId: user.studentId,
      teacherId: user.teacherId,
    };

    successResponse(res, { user: userData, token }, 'User registered successfully', 201);
  } catch (error) {
    errorResponse(res, 'Registration failed', 500, error.message);
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Find user by email and role
    const user = await User.findOne({ email, role });
    if (!user) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    // Check if password is correct
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      // Log failed login attempt
      await logActivity({
        userId: user._id,
        userName: user.name,
        action: 'login',
        actionLabel: 'Login attempt',
        description: `Failed login attempt - invalid password`,
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
        status: 'failed'
      });
      return errorResponse(res, 'Invalid credentials', 401);
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate auth token
    const token = generateAuthToken(user);
    
    // Log successful login
    await logActivity({
      userId: user._id,
      userName: user.name,
      action: 'login',
      actionLabel: 'Login',
      description: `Successful login as ${user.role}`,
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
      status: 'success'
    });

    // Return success response
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      studentId: user.studentId,
      teacherId: user.teacherId,
    };

    successResponse(res, { user: userData, token }, 'Login successful');
  } catch (error) {
    errorResponse(res, 'Login failed', 500, error.message);
  }
};

// Get current user
const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    successResponse(res, user, 'User fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch user', 500, error.message);
  }
};

// Update semester CGPAs for student
const updateSemesterCgpas = async (req, res) => {
  try {
    const { semesterCgpas, currentSemester } = req.body;

    if (!Array.isArray(semesterCgpas)) {
      return errorResponse(res, 'semesterCgpas must be an array', 400);
    }

    // Validate all values are numbers 0-10
    for (const val of semesterCgpas) {
      if (typeof val !== 'number' || val < 0 || val > 10) {
        return errorResponse(res, 'Each CGPA value must be a number between 0 and 10', 400);
      }
    }

    // Calculate overall grade as average of non-zero semesters
    const nonZero = semesterCgpas.filter(v => v > 0);
    const overallGrade = nonZero.length > 0
      ? Math.round((nonZero.reduce((a, b) => a + b, 0) / nonZero.length) * 100) / 100
      : 0;

    // Auto-compute current semester = highest completed semester + 1 (capped at total)
    let highestFilled = 0;
    semesterCgpas.forEach((v, idx) => {
      if (v > 0) highestFilled = idx + 1; // 1-based semester number
    });
    const totalSems = semesterCgpas.length || 8;
    // Student is currently in the semester AFTER the last completed one
    let computedCurrentSem = Math.min(highestFilled + 1, totalSems);
    if (highestFilled === 0) computedCurrentSem = 1; // nothing completed yet

    const updateData = {
      semesterCgpas,
      grade: overallGrade,
      currentSemester: computedCurrentSem,
    };
    // Allow explicit override if provided
    if (currentSemester) updateData.currentSemester = currentSemester;

    const user = await User.findByIdAndUpdate(req.user.id, updateData, { new: true }).select('-password');
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    successResponse(res, user, 'CGPA updated successfully');
  } catch (error) {
    errorResponse(res, 'Failed to update CGPA', 500, error.message);
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  updateSemesterCgpas,
};