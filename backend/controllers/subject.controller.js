const Subject = require('../models/Subject');
const Class = require('../models/Class');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response.utils');

// ─── HOD: Create a subject ────────────────────────────────────────────────────
const createSubject = async (req, res) => {
  try {
    const hod = await User.findById(req.user.id);
    if (!hod || hod.role !== 'hod') {
      return errorResponse(res, 'Only HOD can create subjects', 403);
    }

    const { name, code, description, credits, semester } = req.body;

    if (!name || !code) {
      return errorResponse(res, 'Subject name and code are required', 400);
    }

    // Check duplicate code in same department
    const existing = await Subject.findOne({
      code: code.toUpperCase(),
      department: hod.department,
    });
    if (existing) {
      return errorResponse(res, `Subject code ${code.toUpperCase()} already exists in ${hod.department}`, 400);
    }

    const subject = new Subject({
      name,
      code: code.toUpperCase(),
      description: description || '',
      department: hod.department,
      credits: credits || 3,
      semester: semester || '',
      createdBy: req.user.id,
      status: 'pending_assignment',
    });

    await subject.save();
    await subject.populate('createdBy', 'name email');

    successResponse(res, subject, 'Subject created successfully', 201);
  } catch (error) {
    errorResponse(res, 'Failed to create subject', 500, error.message);
  }
};

// ─── HOD: Get all subjects in their department ────────────────────────────────
const getDepartmentSubjects = async (req, res) => {
  try {
    const hod = await User.findById(req.user.id);
    if (!hod) return errorResponse(res, 'User not found', 404);

    const subjects = await Subject.find({ department: hod.department, isActive: true })
      .populate('createdBy', 'name email')
      .populate('assignedTeacher', 'name email teacherId')
      .populate('classId', 'name code isActive')
      .sort({ createdAt: -1 });

    successResponse(res, { subjects, count: subjects.length }, 'Subjects fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch subjects', 500, error.message);
  }
};

// ─── HOD: Assign a subject to a teacher ──────────────────────────────────────
const assignSubjectToTeacher = async (req, res) => {
  try {
    const hod = await User.findById(req.user.id);
    if (!hod || hod.role !== 'hod') {
      return errorResponse(res, 'Only HOD can assign subjects', 403);
    }

    const { teacherId } = req.body;
    const subject = await Subject.findById(req.params.id);

    if (!subject) return errorResponse(res, 'Subject not found', 404);
    if (subject.department !== hod.department) {
      return errorResponse(res, 'Subject does not belong to your department', 403);
    }

    // Verify teacher belongs to same department
    const teacher = await User.findById(teacherId);
    if (!teacher || (teacher.role !== 'teacher' && teacher.role !== 'hod')) {
      return errorResponse(res, 'Invalid instructor', 400);
    }
    if (teacher.department !== hod.department) {
      return errorResponse(res, 'Instructor does not belong to your department', 400);
    }

    subject.assignedTeacher = teacherId;
    subject.status = 'assigned';

    // If an existing class exists for this subject, update its teacher immediately
    if (subject.classId) {
      const Class = require('../models/Class');
      await Class.findByIdAndUpdate(subject.classId, { teacher: teacher._id });
      subject.status = 'class_created';
    }

    await subject.save();

    // If the subject is assigned to the HOD themselves and no class exists, auto-create one
    if (!subject.classId && teacher.role === 'hod' && teacher._id.toString() === hod._id.toString()) {
      const Class = require('../models/Class');
      const { getDepartmentAliases, normalizeDepartmentName } = require('../utils/departmentCatalog');
      const canonical = normalizeDepartmentName(hod.department) || hod.department;
      const aliases = getDepartmentAliases ? getDepartmentAliases(canonical) : [hod.department];

      const deptStudents = await User.find({
        role: 'student',
        department: { $in: aliases },
        isActive: true,
      }).select('_id');

      const newClass = new Class({
        name: `${subject.name} (${subject.code})`,
        description: subject.description || 'HOD self-taught class',
        credits: subject.credits || 10,
        teacher: hod._id,
        students: deptStudents.map(s => s._id),
      });
      await newClass.save();

      subject.classId = newClass._id;
      subject.status = 'class_created';
      await subject.save();
    }

    await subject.populate('assignedTeacher', 'name email teacherId');
    await subject.populate('createdBy', 'name email');

    successResponse(res, subject, `Subject assigned to ${teacher.name} successfully`);
  } catch (error) {
    errorResponse(res, 'Failed to assign subject', 500, error.message);
  }
};

// ─── HOD: Update subject ──────────────────────────────────────────────────────
const updateSubject = async (req, res) => {
  try {
    const hod = await User.findById(req.user.id);
    if (!hod || hod.role !== 'hod') {
      return errorResponse(res, 'Only HOD can update subjects', 403);
    }

    const subject = await Subject.findById(req.params.id);
    if (!subject) return errorResponse(res, 'Subject not found', 404);
    if (subject.department !== hod.department) {
      return errorResponse(res, 'Subject does not belong to your department', 403);
    }

    const { name, code, description, credits, semester, status, isActive } = req.body;
    if (name !== undefined && name.trim() !== '') subject.name = name.trim();
    if (code !== undefined && code.trim() !== '') {
      // Check if code is changing and if new code already exists for this department
      if (code.trim().toUpperCase() !== subject.code) {
        const existingSubject = await Subject.findOne({ 
          code: code.trim().toUpperCase(), 
          department: hod.department,
          _id: { $ne: req.params.id } 
        });
        if (existingSubject) {
          return errorResponse(res, `Course code "${code}" is already in use in your department`, 400);
        }
        subject.code = code.trim().toUpperCase();
      }
    }
    if (description !== undefined) subject.description = description;
    if (credits !== undefined) {
      if (credits < 1 || credits > 10) {
        return errorResponse(res, 'Credits must be between 1 and 10', 400);
      }
      subject.credits = credits;
    }
    if (semester !== undefined) subject.semester = semester;
    if (status && ['pending_assignment', 'assigned', 'class_created'].includes(status)) {
      subject.status = status;
    }
    if (isActive !== undefined) subject.isActive = isActive;

    await subject.save();
    await subject.populate('assignedTeacher', 'name email');
    await subject.populate('createdBy', 'name email');

    successResponse(res, subject, 'Subject updated successfully');
  } catch (error) {
    // Handle unique constraint error
    if (error.code === 11000 && error.keyPattern && error.keyPattern.code) {
      return errorResponse(res, 'Course code already exists in your department', 400);
    }
    errorResponse(res, 'Failed to update subject', 500, error.message);
  }
};

// ─── HOD: Delete subject ──────────────────────────────────────────────────────
const deleteSubject = async (req, res) => {
  try {
    const hod = await User.findById(req.user.id);
    if (!hod || hod.role !== 'hod') {
      return errorResponse(res, 'Only HOD can delete subjects', 403);
    }

    const subject = await Subject.findById(req.params.id);
    if (!subject) return errorResponse(res, 'Subject not found', 404);
    if (subject.department !== hod.department) {
      return errorResponse(res, 'Subject does not belong to your department', 403);
    }
    if (subject.status === 'class_created') {
      return errorResponse(res, 'Cannot delete subject that already has a class', 400);
    }

    subject.isActive = false;
    await subject.save();

    successResponse(res, null, 'Subject deleted successfully');
  } catch (error) {
    errorResponse(res, 'Failed to delete subject', 500, error.message);
  }
};

// ─── Teacher: Get subjects assigned to me ────────────────────────────────────
const getMyAssignedSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({
      assignedTeacher: req.user.id,
      isActive: true,
    })
      .populate('createdBy', 'name email')
      .populate('classId', 'name code isActive')
      .sort({ createdAt: -1 });

    successResponse(res, { subjects, count: subjects.length }, 'Assigned subjects fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch assigned subjects', 500, error.message);
  }
};

// ─── Teacher: Create class for an assigned subject ────────────────────────────
const createClassForSubject = async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id);
    if (!teacher || teacher.role !== 'teacher') {
      return errorResponse(res, 'Only teachers can create classes', 403);
    }

    const subject = await Subject.findById(req.params.id);
    if (!subject) return errorResponse(res, 'Subject not found', 404);

    // Verify this teacher is assigned to this subject
    if (!subject.assignedTeacher || subject.assignedTeacher.toString() !== req.user.id) {
      return errorResponse(res, 'You are not assigned to this subject', 403);
    }

    if (subject.classId) {
      return errorResponse(res, 'A class already exists for this subject', 400);
    }

    const { description, schedule } = req.body;

    // Create the class
    const newClass = new Class({
      name: `${subject.name} (${subject.code})`,
      description: description || subject.description,
      credits: subject.credits || 3,
      schedule: schedule || {},
      teacher: req.user.id,
    });

    // Auto-enroll all active students from teacher's department
    const departmentStudents = await User.find({
      role: 'student',
      department: teacher.department,
      isActive: true,
    }).select('_id');

    newClass.students = departmentStudents.map(s => s._id);
    await newClass.save();

    // Link class back to subject
    subject.classId = newClass._id;
    subject.status = 'class_created';
    await subject.save();

    await newClass.populate('teacher', 'name email department');

    successResponse(res, {
      class: newClass,
      subject: { id: subject._id, name: subject.name, code: subject.code },
      studentsEnrolled: departmentStudents.length,
      message: `Class created for "${subject.name}" and ${departmentStudents.length} students auto-enrolled`,
    }, 'Class created successfully', 201);
  } catch (error) {
    errorResponse(res, 'Failed to create class for subject', 500, error.message);
  }
};

// ─── Public: Get subject by ID ────────────────────────────────────────────────
const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTeacher', 'name email teacherId')
      .populate('classId', 'name code isActive students');

    if (!subject) return errorResponse(res, 'Subject not found', 404);

    successResponse(res, subject, 'Subject fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch subject', 500, error.message);
  }
};

module.exports = {
  createSubject,
  getDepartmentSubjects,
  assignSubjectToTeacher,
  updateSubject,
  deleteSubject,
  getMyAssignedSubjects,
  createClassForSubject,
  getSubjectById,
};
