const EnrollmentRequest = require('../models/EnrollmentRequest');
const Class = require('../models/Class');
const User = require('../models/User');
const Subject = require('../models/Subject');
const { successResponse, errorResponse } = require('../utils/response.utils');

/**
 * Teacher: Send enrollment invites to all students in department
 * POST /api/enrollments/invite
 * Body: { classId, subjectId? }
 * Auto-enrolls all students without requiring acceptance
 */
const sendEnrollmentInvites = async (req, res) => {
  try {
    const teacher = await User.findById(req.user.id);
    if (!teacher || teacher.role !== 'teacher') {
      return errorResponse(res, 'Only teachers can send enrollment invites', 403);
    }

    const { classId, subjectId } = req.body;
    const classDoc = await Class.findById(classId);
    
    if (!classDoc) {
      return errorResponse(res, 'Class not found', 404);
    }

    if (classDoc.teacher.toString() !== req.user.id) {
      return errorResponse(res, 'You can only send invites for your own classes', 403);
    }

    // Get all students in teacher's department
    const { getDepartmentAliases, normalizeDepartmentName } = require('../utils/departmentCatalog');
    const canonical = normalizeDepartmentName(teacher.department) || teacher.department;
    const aliases = getDepartmentAliases(canonical);

    const students = await User.find({
      role: 'student',
      department: { $in: aliases },
      isActive: true,
    }).select('_id name email');

    if (!students.length) {
      return errorResponse(res, 'No students found in your department', 404);
    }

    // Auto-enroll students (create enrollment requests with 'accepted' status)
    const requests = [];
    const Message = require('../models/Message');
    let newEnrollments = 0;
    let alreadyEnrolled = 0;
    
    for (const student of students) {
      try {
        const existing = await EnrollmentRequest.findOne({ class: classId, student: student._id });
        
        if (!existing) {
          // Create enrollment request with auto-accepted status
          const enrollReq = new EnrollmentRequest({
            class: classId,
            subject: subjectId || null,
            student: student._id,
            teacher: req.user.id,
            status: 'accepted', // AUTO-ACCEPTED
            message: `You have been automatically enrolled in ${classDoc.name}`,
            respondedAt: new Date(), // Mark as immediately responded
          });
          await enrollReq.save();
          
          // Add student to class.students array
          if (!classDoc.students.includes(student._id)) {
            classDoc.students.push(student._id);
          }
          
          requests.push(enrollReq);
          newEnrollments++;
          
          // Send notification message
          const message = new Message({
            sender: req.user.id,
            recipients: [student._id],
            subject: `✅ Enrolled: ${classDoc.name}`,
            content: `Dear ${student.name},\n\nYou have been successfully enrolled in **${classDoc.name}** (${classDoc.code || 'Code TBD'}).\n\nYou can now access this course in your "My Courses" section.\n\nBest regards,\n${teacher.name}`,
            isDraft: false,
          });
          await message.save();
        } else if (existing.status === 'pending') {
          // Auto-accept existing pending requests
          existing.status = 'accepted';
          existing.respondedAt = new Date();
          await existing.save();
          
          // Add student to class if not already added
          if (!classDoc.students.includes(student._id)) {
            classDoc.students.push(student._id);
          }
          
          newEnrollments++;
        } else {
          // Already enrolled (accepted or rejected before)
          alreadyEnrolled++;
        }
      } catch (err) {
        // Skip duplicates (unique index violation)
        if (err.code !== 11000) throw err;
        alreadyEnrolled++;
      }
    }

    // Save class with updated students array
    await classDoc.save();

    successResponse(res, {
      enrolled: newEnrollments,
      totalStudents: students.length,
      alreadyEnrolled: alreadyEnrolled,
      currentEnrollmentCount: classDoc.students.length,
    }, `Successfully enrolled ${newEnrollments} students in ${classDoc.name}`);
  } catch (error) {
    errorResponse(res, 'Failed to send enrollment invites', 500, error.message);
  }
};

/**
 * Student: Get my pending enrollment requests
 * GET /api/enrollments/pending
 */
const getPendingEnrollments = async (req, res) => {
  try {
    const requests = await EnrollmentRequest.find({
      student: req.user.id,
      status: 'pending',
    })
      .populate('class', 'name code description credits')
      .populate('subject', 'name code credits')
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });

    successResponse(res, { requests, count: requests.length }, 'Pending enrollments fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch pending enrollments', 500, error.message);
  }
};

/**
 * Student: Get all my enrollment requests (pending + accepted + rejected)
 * GET /api/enrollments/my-requests
 */
const getMyEnrollments = async (req, res) => {
  try {
    const requests = await EnrollmentRequest.find({ student: req.user.id })
      .populate('class', 'name code description credits')
      .populate('subject', 'name code credits')
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });

    successResponse(res, { requests, count: requests.length }, 'Enrollment requests fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch enrollment requests', 500, error.message);
  }
};

/**
 * Student: Accept enrollment request
 * POST /api/enrollments/:id/accept
 */
const acceptEnrollment = async (req, res) => {
  try {
    const enrollmentReq = await EnrollmentRequest.findById(req.params.id);
    
    if (!enrollmentReq) {
      return errorResponse(res, 'Enrollment request not found', 404);
    }

    if (enrollmentReq.student.toString() !== req.user.id) {
      return errorResponse(res, 'You can only accept your own enrollment requests', 403);
    }

    if (enrollmentReq.status !== 'pending') {
      return errorResponse(res, 'This request has already been processed', 400);
    }

    // Add student to class.students array
    const classDoc = await Class.findById(enrollmentReq.class);
    if (!classDoc) {
      return errorResponse(res, 'Class not found', 404);
    }

    if (!classDoc.students.includes(req.user.id)) {
      classDoc.students.push(req.user.id);
      await classDoc.save();
    }

    // Update enrollment request status
    enrollmentReq.status = 'accepted';
    enrollmentReq.respondedAt = new Date();
    await enrollmentReq.save();

    await enrollmentReq.populate('class', 'name code');
    await enrollmentReq.populate('teacher', 'name');

    successResponse(res, enrollmentReq, `Successfully enrolled in ${classDoc.name}`);
  } catch (error) {
    errorResponse(res, 'Failed to accept enrollment', 500, error.message);
  }
};

/**
 * Student: Reject enrollment request
 * POST /api/enrollments/:id/reject
 */
const rejectEnrollment = async (req, res) => {
  try {
    const enrollmentReq = await EnrollmentRequest.findById(req.params.id);
    
    if (!enrollmentReq) {
      return errorResponse(res, 'Enrollment request not found', 404);
    }

    if (enrollmentReq.student.toString() !== req.user.id) {
      return errorResponse(res, 'You can only reject your own enrollment requests', 403);
    }

    if (enrollmentReq.status !== 'pending') {
      return errorResponse(res, 'This request has already been processed', 400);
    }

    enrollmentReq.status = 'rejected';
    enrollmentReq.respondedAt = new Date();
    await enrollmentReq.save();

    successResponse(res, enrollmentReq, 'Enrollment request rejected');
  } catch (error) {
    errorResponse(res, 'Failed to reject enrollment', 500, error.message);
  }
};

/**
 * Teacher: Get enrollment stats for a class
 * GET /api/enrollments/class/:classId/stats
 */
const getClassEnrollmentStats = async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.classId);
    if (!classDoc) {
      return errorResponse(res, 'Class not found', 404);
    }

    if (classDoc.teacher.toString() !== req.user.id && req.user.role !== 'hod') {
      return errorResponse(res, 'Unauthorized', 403);
    }

    const total = await EnrollmentRequest.countDocuments({ class: req.params.classId });
    const pending = await EnrollmentRequest.countDocuments({ class: req.params.classId, status: 'pending' });
    const accepted = await EnrollmentRequest.countDocuments({ class: req.params.classId, status: 'accepted' });
    const rejected = await EnrollmentRequest.countDocuments({ class: req.params.classId, status: 'rejected' });

    successResponse(res, {
      total,
      pending,
      accepted,
      rejected,
      enrolled: classDoc.students.length,
    }, 'Enrollment stats fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch enrollment stats', 500, error.message);
  }
};

/**
 * Teacher: Get all enrollment requests for a class with student details
 * GET /api/enrollments/class/:classId/requests
 */
const getClassEnrollmentRequests = async (req, res) => {
  try {
    const classDoc = await Class.findById(req.params.classId);
    if (!classDoc) {
      return errorResponse(res, 'Class not found', 404);
    }

    if (classDoc.teacher.toString() !== req.user.id && req.user.role !== 'hod') {
      return errorResponse(res, 'Unauthorized', 403);
    }

    // Fetch all enrollment requests for this class with student details
    const requests = await EnrollmentRequest.find({ class: req.params.classId })
      .populate('student', 'studentId name email')
      .populate('teacher', 'name email')
      .sort({ createdAt: -1 });

    successResponse(res, {
      requests,
      count: requests.length,
    }, 'Enrollment requests fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch enrollment requests', 500, error.message);
  }
};

module.exports = {
  sendEnrollmentInvites,
  getPendingEnrollments,
  getMyEnrollments,
  acceptEnrollment,
  rejectEnrollment,
  getClassEnrollmentStats,
  getClassEnrollmentRequests,
};
