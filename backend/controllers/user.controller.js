const User = require('../models/User');
const Grade = require('../models/Grade');
const { successResponse, errorResponse } = require('../utils/response.utils');

// Get all users
const getAllUsers = async (req, res) => {
  try {
    const { role, department, page = 1, limit = 10 } = req.query;
    
    // Build filter
    const filter = {};
    if (role) {
      filter.role = role;
    }
    if (department) {
      filter.department = department;
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Get users
    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
      
    // Get total count
    const total = await User.countDocuments(filter);
    
    successResponse(res, {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    }, 'Users fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch users', 500, error.message);
  }
};

// Get user by ID
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    successResponse(res, user, 'User fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch user', 500, error.message);
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { name, email, department, isActive } = req.body;
    
    const user = await User.findById(req.params.id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    
    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (department) user.department = department;
    if (isActive !== undefined) user.isActive = isActive;
    
    await user.save();
    
    const userData = user.toObject();
    delete userData.password;
    
    successResponse(res, userData, 'User updated successfully');
  } catch (error) {
    errorResponse(res, 'Failed to update user', 500, error.message);
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }
    successResponse(res, null, 'User deleted successfully');
  } catch (error) {
    errorResponse(res, 'Failed to delete user', 500, error.message);
  }
};

// Get students by teacher's department
const getStudentsByTeacherDepartment = async (req, res) => {
  try {
    console.log('Fetching students for teacher ID:', req.user.id);
    
    // Get the teacher's department
    const teacher = await User.findById(req.user.id);
    console.log('Teacher data:', teacher);
    
    if (!teacher || teacher.role !== 'teacher') {
      console.log('Unauthorized access attempt. User role:', teacher ? teacher.role : 'not found');
      return errorResponse(res, 'Unauthorized access', 403);
    }

    console.log('Teacher department:', teacher.department);
    
    // Check if teacher has a department
    if (!teacher.department) {
      console.log('Teacher has no department assigned');
      return successResponse(res, { users: [] }, 'No department assigned to teacher');
    }
    
    // Get students in the same department
    const students = await User.find({
      role: 'student',
      department: teacher.department
    }).select('-password');
    
    console.log('Students found in department:', students.length);
    console.log('Students data:', students);

    successResponse(res, { users: students }, 'Students fetched successfully');
  } catch (error) {
    console.error('Error fetching students by teacher department:', error);
    errorResponse(res, 'Failed to fetch students', 500, error.message);
  }
};

// Get grades for students in teacher's department
const getGradesByTeacherDepartment = async (req, res) => {
  try {
    console.log('Fetching grades for students in teacher department. Teacher ID:', req.user.id);
    
    // Get the teacher's department
    const teacher = await User.findById(req.user.id);
    console.log('Teacher data:', teacher);
    
    if (!teacher || teacher.role !== 'teacher') {
      console.log('Unauthorized access attempt. User role:', teacher ? teacher.role : 'not found');
      return errorResponse(res, 'Unauthorized access', 403);
    }

    console.log('Teacher department:', teacher.department);
    
    // Check if teacher has a department
    if (!teacher.department) {
      console.log('Teacher has no department assigned');
      return successResponse(res, { grades: [] }, 'No department assigned to teacher');
    }
    
    // Get students in the same department
    const students = await User.find({
      role: 'student',
      department: teacher.department
    }).select('_id');
    
    const studentIds = students.map(student => student._id);
    console.log('Student IDs in department:', studentIds.length);
    
    // Get grades for these students
    const grades = await Grade.find({
      student: { $in: studentIds }
    })
    .populate([
      { path: 'student', select: 'name email studentId department' },
      { path: 'class', select: 'name' },
      { path: 'assignment', select: 'title' },
      { path: 'gradedBy', select: 'name email' }
    ])
    .sort({ createdAt: -1 });
    
    console.log('Grades found:', grades.length);

    successResponse(res, { grades }, 'Grades fetched successfully');
  } catch (error) {
    console.error('Error fetching grades by teacher department:', error);
    errorResponse(res, 'Failed to fetch grades', 500, error.message);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getStudentsByTeacherDepartment,
  getGradesByTeacherDepartment,
};