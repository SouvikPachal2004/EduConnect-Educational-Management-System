const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Class = require('../models/Class');
const { successResponse, errorResponse } = require('../utils/response.utils');
const path = require('path');
const fs = require('fs');

// Create assignment
const createAssignment = async (req, res) => {
  try {
    const { title, description, classId, dueDate, maxPoints } = req.body;
    
    // Check if class exists
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return errorResponse(res, 'Class not found', 404);
    }
    
    // Check if user is the teacher of this class
    if (classItem.teacher.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to create assignment for this class', 403);
    }
    
    const assignment = new Assignment({
      title,
      description,
      class: classId,
      teacher: req.user.id,
      dueDate: new Date(dueDate),
      maxPoints,
    });
    
    // If file was uploaded, add file info
    if (req.file) {
      assignment.attachments.push({
        fileName: req.file.originalname,
        data: req.file.buffer,   // store bytes in DB (survives server restarts)
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      });
    }
    
    await assignment.save();
    
    // Populate class and teacher details
    await assignment.populate([
      { path: 'class', select: 'name code' },
      { path: 'teacher', select: 'name email' }
    ]);
    
    // Strip the raw file bytes from the response (keep metadata only)
    const createdOut = assignment.toObject();
    if (createdOut.attachments) {
      createdOut.attachments = createdOut.attachments.map(({ data, ...rest }) => rest);
    }
    successResponse(res, createdOut, 'Assignment created successfully', 201);
  } catch (error) {
    errorResponse(res, 'Failed to create assignment', 500, error.message);
  }
};

// Get all assignments
const getAllAssignments = async (req, res) => {
  try {
    const { classId, status, page = 1, limit = 50 } = req.query;
    
    // Build filter
    const filter = {};
    if (classId) filter.class = classId;

    // Students only see published assignments
    if (req.user.role === 'student') {
      filter.status = 'published';
    } else if (status) {
      filter.status = status;
    }

    // Teacher and HOD only see assignments THEY created (their own subjects)
    if (req.user.role === 'teacher' || req.user.role === 'hod') {
      filter.teacher = req.user.id;
    }
    
    // For students: filter assignments from their department's classes (teachers + HODs)
    if (req.user.role === 'student') {
      const User = require('../models/User');
      const studentUser = await User.findById(req.user.id).select('department');
      if (studentUser?.department) {
        const { getDepartmentAliases, normalizeDepartmentName } = require('../utils/departmentCatalog');
        const canonical = normalizeDepartmentName(studentUser.department) || studentUser.department;
        const aliases = getDepartmentAliases ? getDepartmentAliases(canonical) : [canonical, studentUser.department];

        // Find all teachers AND HODs in the student's department
        const deptStaff = await User.find({
          role: { $in: ['teacher', 'hod'] },
          department: { $in: aliases }
        }).select('_id');
        const staffIds = deptStaff.map(s => s._id);

        // Get classes taught by any dept staff member
        const deptClasses = await Class.find({ teacher: { $in: staffIds } }).select('_id');
        const deptClassIds = deptClasses.map(c => c._id);

        filter.$or = [
          { class: { $in: deptClassIds } },   // assignments linked to dept classes
          { teacher: { $in: staffIds } }       // assignments created by dept staff (HOD direct)
        ];
        if (classId) {
          filter.$or = [{ class: classId }];   // override if specific class requested
        }
      }
    }
    
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get assignments
    const assignments = await Assignment.find(filter)
      .select('-attachments.data')   // exclude raw file bytes from list payload
      .populate([
        { path: 'class', select: 'name code' },
        { path: 'teacher', select: 'name email department' }
      ])
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ dueDate: 1 });
      
    // Get total count
    const total = await Assignment.countDocuments(filter);
    
    // For students: attach submission info to each assignment
    let enrichedAssignments = assignments;
    if (req.user.role === 'student') {
      const assignmentIds = assignments.map(a => a._id);
      const submissions = await Submission.find({
        assignment: { $in: assignmentIds },
        student: req.user.id,
      }).select('-attachments.data').lean();

      const submissionMap = {};
      submissions.forEach(s => {
        submissionMap[s.assignment.toString()] = s;
      });

      enrichedAssignments = assignments.map(a => {
        const aObj = a.toObject();
        const sub  = submissionMap[a._id.toString()];
        aObj.submitted = !!sub;
        aObj.submission = sub || null;
        return aObj;
      });
    }
    
    successResponse(res, {
      assignments: enrichedAssignments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    }, 'Assignments fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch assignments', 500, error.message);
  }
};

// Get assignment by ID
const getAssignmentById = async (req, res) => {
  try {
    // Check if this is a download request
    if (req.params.filename) {
      const assignment = await Assignment.findById(req.params.id);
      if (!assignment) {
        return errorResponse(res, 'Assignment not found', 404);
      }
      
      // Find the attachment with the matching filename
      const attachment = assignment.attachments.find(att => att.fileName === req.params.filename);
      if (!attachment) {
        return errorResponse(res, 'File not found', 404);
      }
      
      // Serve the file
      const filePath = path.resolve(attachment.filePath);
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Disposition', `attachment; filename="${attachment.fileName}"`);
        res.setHeader('Content-Type', attachment.fileType);
        return res.sendFile(filePath);
      } else {
        return errorResponse(res, 'File not found on server', 404);
      }
    }
    
    const assignment = await Assignment.findById(req.params.id)
      .populate([
        { path: 'class', select: 'name code' },
        { path: 'teacher', select: 'name email' }
      ]);
      
    if (!assignment) {
      return errorResponse(res, 'Assignment not found', 404);
    }
    
    successResponse(res, assignment, 'Assignment fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch assignment', 500, error.message);
  }
};

// Update assignment
const updateAssignment = async (req, res) => {
  try {
    const { title, description, dueDate, maxPoints, status } = req.body;
    
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return errorResponse(res, 'Assignment not found', 404);
    }
    
    // Check if user is the teacher of this assignment
    if (assignment.teacher.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to update this assignment', 403);
    }
    
    // Update fields
    if (title) assignment.title = title;
    if (description) assignment.description = description;
    if (dueDate) assignment.dueDate = new Date(dueDate);
    if (maxPoints) assignment.maxPoints = maxPoints;
    if (status) assignment.status = status;
    
    // If file was uploaded, add file info
    if (req.file) {
      assignment.attachments.push({
        fileName: req.file.originalname,
        data: req.file.buffer,   // store bytes in DB (survives server restarts)
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      });
    }
    
    await assignment.save();
    
    // Populate class and teacher details
    await assignment.populate([
      { path: 'class', select: 'name code' },
      { path: 'teacher', select: 'name email' }
    ]);
    
    successResponse(res, assignment, 'Assignment updated successfully');
  } catch (error) {
    errorResponse(res, 'Failed to update assignment', 500, error.message);
  }
};

// Delete assignment
const deleteAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return errorResponse(res, 'Assignment not found', 404);
    }
    
    // Check if user is the teacher of this assignment (or HOD/admin)
    if (assignment.teacher.toString() !== req.user.id && req.user.role !== 'hod' && req.user.role !== 'admin') {
      return errorResponse(res, 'Not authorized to delete this assignment', 403);
    }
    
    // Delete associated disk files (legacy records only; new files live in the DB)
    assignment.attachments.forEach(attachment => {
      if (attachment.filePath && fs.existsSync(attachment.filePath)) {
        fs.unlinkSync(attachment.filePath);
      }
    });
    
    await Assignment.findByIdAndDelete(req.params.id);
    
    successResponse(res, null, 'Assignment deleted successfully');
  } catch (error) {
    errorResponse(res, 'Failed to delete assignment', 500, error.message);
  }
};

// Submit assignment
const submitAssignment = async (req, res) => {
  try {
    const { content } = req.body;
    
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return errorResponse(res, 'Assignment not found', 404);
    }
    
    // Check if assignment is published
    if (assignment.status !== 'published') {
      return errorResponse(res, 'Assignment is not published', 400);
    }
    
    // Check if user is a student
    if (req.user.role !== 'student') {
      return errorResponse(res, 'Only students can submit assignments', 403);
    }
    
    // Check if student is enrolled in the class OR is from the same department
    const classItem = await Class.findById(assignment.class);
    if (classItem) {
      const isEnrolled = classItem.students.some(s => s.toString() === req.user.id.toString());
      if (!isEnrolled) {
        // Also allow if student is in the same department as the assignment teacher
        const User = require('../models/User');
        const [student, teacher] = await Promise.all([
          User.findById(req.user.id).select('department'),
          User.findById(assignment.teacher).select('department role'),
        ]);
        const { normalizeDepartmentName } = require('../utils/departmentCatalog');
        const studentDept  = normalizeDepartmentName(student?.department) || student?.department;
        const teacherDept  = normalizeDepartmentName(teacher?.department) || teacher?.department;
        if (!studentDept || !teacherDept || studentDept !== teacherDept) {
          return errorResponse(res, 'Not enrolled in this class', 403);
        }
      }
    }
    
    // Check if submission already exists
    const existingSubmission = await Submission.findOne({
      assignment: req.params.id,
      student: req.user.id,
    });
    
    if (existingSubmission) {
      return errorResponse(res, 'Assignment already submitted', 400);
    }
    
    const submission = new Submission({
      assignment: req.params.id,
      student: req.user.id,
      class: assignment.class,
      content,
    });
    
    // If file was uploaded, add file info
    if (req.file) {
      submission.attachments.push({
        fileName: req.file.originalname,
        data: req.file.buffer,   // store bytes in DB (survives server restarts)
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      });
    }
    
    await submission.save();
    
    // Populate references
    await submission.populate([
      { path: 'assignment', select: 'title' },
      { path: 'student', select: 'name email' },
      { path: 'class', select: 'name' }
    ]);
    
    // Strip the raw file bytes from the response (keep metadata only)
    const subOut = submission.toObject();
    if (subOut.attachments) {
      subOut.attachments = subOut.attachments.map(({ data, ...rest }) => rest);
    }
    successResponse(res, subOut, 'Assignment submitted successfully', 201);
  } catch (error) {
    errorResponse(res, 'Failed to submit assignment', 500, error.message);
  }
};

// Get submissions for assignment (teacher only)
const getSubmissionsForAssignment = async (req, res) => {
  try {
    // Check if this is a download request
    if (req.params.filename) {
      const submission = await Submission.findById(req.params.id);
      if (!submission) {
        return errorResponse(res, 'Submission not found', 404);
      }
      
      // Find the attachment with the matching filename
      const attachment = submission.attachments.find(att => att.fileName === req.params.filename);
      if (!attachment) {
        return errorResponse(res, 'File not found', 404);
      }
      
      // Serve the file
      const filePath = path.resolve(attachment.filePath);
      if (fs.existsSync(filePath)) {
        res.setHeader('Content-Disposition', `attachment; filename="${attachment.fileName}"`);
        res.setHeader('Content-Type', attachment.fileType);
        return res.sendFile(filePath);
      } else {
        return errorResponse(res, 'File not found on server', 404);
      }
    }
    
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) {
      return errorResponse(res, 'Assignment not found', 404);
    }
    
    // Check if user is the teacher of this assignment
    if (assignment.teacher.toString() !== req.user.id && req.user.role !== 'hod') {
      return errorResponse(res, 'Not authorized to view submissions for this assignment', 403);
    }
    
    const submissions = await Submission.find({ assignment: req.params.id })
      .select('-attachments.data')   // exclude raw file bytes; download uses a separate route
      .populate([
        { path: 'student', select: 'name email studentId' },
        { path: 'class', select: 'name' }
      ])
      .sort({ submittedAt: -1 });
    
    successResponse(res, submissions, 'Submissions fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch submissions', 500, error.message);
  }
};

// Grade submission
const gradeSubmission = async (req, res) => {
  try {
    const { points, feedback } = req.body;
    
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return errorResponse(res, 'Submission not found', 404);
    }
    
    // Check if user is the teacher of this assignment (or HOD)
    const assignment = await Assignment.findById(submission.assignment);
    if (assignment.teacher.toString() !== req.user.id && req.user.role !== 'hod') {
      return errorResponse(res, 'Not authorized to grade this submission', 403);
    }
    
    // Update submission
    submission.points = points;
    submission.feedback = feedback;
    submission.graded = true;
    submission.gradedAt = Date.now();
    submission.gradedBy = req.user.id;
    
    await submission.save();
    
    // Populate references
    await submission.populate([
      { path: 'assignment', select: 'title' },
      { path: 'student', select: 'name email' },
      { path: 'class', select: 'name' },
      { path: 'gradedBy', select: 'name email' }
    ]);
    
    successResponse(res, submission, 'Submission graded successfully');
  } catch (error) {
    errorResponse(res, 'Failed to grade submission', 500, error.message);
  }
};

module.exports = {
  createAssignment,
  getAllAssignments,
  getAssignmentById,
  updateAssignment,
  deleteAssignment,
  submitAssignment,
  getSubmissionsForAssignment,
  gradeSubmission,
};