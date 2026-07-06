const Department = require('../models/Department');
const User = require('../models/User');
const Program = require('../models/Program');
const { successResponse, errorResponse } = require('../utils/response.utils');
const { logActivity } = require('../utils/activityLogger');
const {
  SUPPORTED_DEPARTMENTS,
  DEPARTMENT_DEFAULTS,
  normalizeDepartmentName,
  getDepartmentAliases,
  getAllDepartmentAliases,
  sortByDepartmentOrder,
} = require('../utils/departmentCatalog');

const buildCountMap = (rows) => {
  const countMap = new Map(SUPPORTED_DEPARTMENTS.map(department => [department, 0]));

  rows.forEach(row => {
    const department = normalizeDepartmentName(row._id);
    if (department) {
      countMap.set(department, (countMap.get(department) || 0) + row.count);
    }
  });

  return countMap;
};

const getDepartmentStats = async (departmentNames) => {
  const allDepartmentNames = Array.from(new Set([
    ...getAllDepartmentAliases(),
    ...departmentNames,
  ]));

  const [studentRows, facultyRows, hods] = await Promise.all([
    User.aggregate([
      { $match: { role: 'student', isActive: true, department: { $in: allDepartmentNames } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
    ]),
    User.aggregate([
      { $match: { role: { $in: ['teacher', 'hod'] }, isActive: true, department: { $in: allDepartmentNames } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
    ]),
    User.find({ role: 'hod', isActive: true, department: { $in: allDepartmentNames } })
      .select('name department')
      .sort({ name: 1 })
      .lean(),
  ]);

  const hodMap = new Map();
  hods.forEach(hod => {
    const department = normalizeDepartmentName(hod.department);
    if (department && !hodMap.has(department)) {
      hodMap.set(department, hod.name);
    }
  });

  return {
    studentCounts: buildCountMap(studentRows),
    facultyCounts: buildCountMap(facultyRows),
    hodMap,
  };
};

const formatDepartment = (department, stats) => {
  const canonicalName = normalizeDepartmentName(department.name);
  const defaults = DEPARTMENT_DEFAULTS[canonicalName] || {
    name: canonicalName,
    hod: 'Not assigned',
    faculty: 0,
    students: 0,
    established: new Date().getFullYear(),
  };
  const data = department.toObject ? department.toObject() : department;

  return {
    ...data,
    name: canonicalName,
    hod: stats.hodMap.get(canonicalName) || data.hod || defaults.hod,
    faculty: stats.facultyCounts.get(canonicalName) || 0,
    students: stats.studentCounts.get(canonicalName) || 0,
    established: data.established || defaults.established,
    isActive: true,
    program: data.program || null,
  };
};

const getActiveDepartmentsData = async () => {
  const rawDepartments = await Department.find({ isActive: true }).populate('program', 'name code totalSemesters duration');
  const activeNames = rawDepartments.map(department => normalizeDepartmentName(department.name)).filter(Boolean);

  const stats = await getDepartmentStats(activeNames);
  const departmentsByName = new Map();

  rawDepartments.forEach(department => {
    const canonicalName = normalizeDepartmentName(department.name);
    if (canonicalName && !departmentsByName.has(canonicalName)) {
      departmentsByName.set(canonicalName, department);
    }
  });

  SUPPORTED_DEPARTMENTS.forEach(name => {
    if (!departmentsByName.has(name)) {
      departmentsByName.set(name, DEPARTMENT_DEFAULTS[name]);
    }
  });

  return Array.from(departmentsByName.values())
    .map(department => formatDepartment(department, stats))
    .sort(sortByDepartmentOrder);
};

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
const getAllDepartments = async (req, res) => {
  try {
    const departments = await getActiveDepartmentsData();
    
    successResponse(res, {
      departments,
      count: departments.length
    }, 'Departments retrieved successfully');
  } catch (error) {
    errorResponse(res, 'Error fetching departments', 500, error.message);
  }
};

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Private
const getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return errorResponse(res, 'Department not found', 404);
    }
    
    successResponse(res, department, 'Department retrieved successfully');
  } catch (error) {
    errorResponse(res, 'Error fetching department', 500, error.message);
  }
};

// @desc    Create new department
// @route   POST /api/departments
// @access  Private (Admin/Managing Authority)
const createDepartment = async (req, res) => {
  try {
    const { name, hod, faculty, students, established, program } = req.body;
    const canonicalName = normalizeDepartmentName(name);
    
    // Check if department already exists
    const existingDepartment = await Department.findOne({
      name: { $in: getDepartmentAliases(canonicalName) }
    });
    if (existingDepartment) {
      return errorResponse(res, 'Department with this name already exists', 400);
    }

    // Validate program if provided
    if (program) {
      const prog = await Program.findById(program);
      if (!prog) return errorResponse(res, 'Program not found', 404);
    }
    
    const department = await Department.create({
      name: canonicalName,
      hod,
      faculty,
      students,
      established,
      program: program || null,
    });
    
    // Log activity
    if (req.user) {
      await logActivity({
        userId: req.user._id,
        userName: req.user.name,
        action: 'department_creation',
        actionLabel: 'Department creation',
        description: `Created department: ${canonicalName}`,
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
        status: 'success'
      });
    }
    
    await department.populate('program', 'name code');
    successResponse(res, department, 'Department created successfully', 201);
  } catch (error) {
    errorResponse(res, 'Error creating department', 500, error.message);
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Private (Admin/Managing Authority)
const updateDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return errorResponse(res, 'Department not found', 404);
    }

    const oldName = department.name;

    // Normalize the new name if provided
    if (req.body.name) {
      req.body.name = normalizeDepartmentName(req.body.name) || req.body.name;
    }

    // Validate program if provided
    if (req.body.program) {
      const prog = await Program.findById(req.body.program);
      if (!prog) return errorResponse(res, 'Program not found', 404);
    }

    const updatedDepartment = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('program', 'name code');

    // If name changed, update all users who had the old department name
    const newName = updatedDepartment.name;
    if (oldName !== newName) {
      const { getDepartmentAliases } = require('../utils/departmentCatalog');
      const oldAliases = getDepartmentAliases(oldName);
      await User.updateMany(
        { department: { $in: oldAliases } },
        { department: newName }
      );
    }

    successResponse(res, updatedDepartment, 'Department updated successfully');
  } catch (error) {
    errorResponse(res, 'Error updating department', 500, error.message);
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Private (Admin/Managing Authority)
const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return errorResponse(res, 'Department not found', 404);
    }
    
    // Soft delete
    department.isActive = false;
    await department.save();
    
    // Log activity
    if (req.user) {
      await logActivity({
        userId: req.user._id,
        userName: req.user.name,
        action: 'department_deletion',
        actionLabel: 'Department deletion',
        description: `Deleted department: ${department.name}`,
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
        status: 'success'
      });
    }
    
    successResponse(res, null, 'Department deleted successfully');
  } catch (error) {
    errorResponse(res, 'Error deleting department', 500, error.message);
  }
};

module.exports = {
  getAllDepartments,
  getActiveDepartmentsData,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment
};
