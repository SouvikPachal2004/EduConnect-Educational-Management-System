const Class = require('../models/Class');
const User = require('../models/User');
const Message = require('../models/Message');
const { successResponse, errorResponse } = require('../utils/response.utils');

// Create class
const createClass = async (req, res) => {
  try {
    const { name, description, schedule, subjectId } = req.body;
    
    // Get teacher's department
    const teacher = await User.findById(req.user.id);
    if (!teacher) {
      return errorResponse(res, 'Teacher not found', 404);
    }

    // If subjectId provided, validate it
    let subject = null;
    if (subjectId) {
      const Subject = require('../models/Subject');
      subject = await Subject.findById(subjectId);
      if (!subject) return errorResponse(res, 'Subject not found', 404);
      // HOD can self-assign; teachers must be formally assigned
      const isHod = teacher.role === 'hod';
      if (!isHod) {
        if (!subject.assignedTeacher || subject.assignedTeacher.toString() !== req.user.id) {
          return errorResponse(res, 'You are not assigned to this subject', 403);
        }
      }
      if (subject.classId) {
        return errorResponse(res, 'A class already exists for this subject', 400);
      }
    }
    
    const newClass = new Class({
      name: name || (subject ? `${subject.name} (${subject.code})` : 'Unnamed Class'),
      description: description || (subject ? subject.description : ''),
      credits: subject ? (subject.credits || 3) : 3,
      schedule,
      teacher: req.user.id,
    });
    
    // Auto-assign all students from teacher's department
    const departmentStudents = await User.find({
      role: 'student',
      department: teacher.department,
      isActive: true
    }).select('_id');
    
    newClass.students = departmentStudents.map(student => student._id);
    await newClass.save();

    // Link class to subject if provided
    if (subject) {
      const Subject = require('../models/Subject');
      await Subject.findByIdAndUpdate(subjectId, {
        classId: newClass._id,
        status: 'class_created',
      });
    }
    
    await newClass.populate('teacher', 'name email department');
    await newClass.populate('students', 'name email studentId department');
    
    successResponse(res, {
      class: newClass,
      studentsAdded: departmentStudents.length,
      message: `Class created and ${departmentStudents.length} students from ${teacher.department} department were automatically enrolled`
    }, 'Class created successfully', 201);
  } catch (error) {
    errorResponse(res, 'Failed to create class', 500, error.message);
  }
};

// Get all classes
const getAllClasses = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    let filter = {};

    // Teachers only see their own classes
    if (req.user.role === 'teacher') {
      filter.teacher = req.user.id;
    }
    // Students only see classes they are enrolled in
    else if (req.user.role === 'student') {
      filter.students = req.user.id;
    }
    // HOD sees classes from their department teachers (or own classes if myOwn=true)
    else if (req.user.role === 'hod') {
      if (req.query.myOwn === 'true') {
        // Show only HOD's personally taught classes
        filter.teacher = req.user.id;
      } else {
        const hod = await User.findById(req.user.id);
        if (hod) {
          const deptTeachers = await User.find({ role: 'teacher', department: hod.department }).select('_id');
          filter.teacher = { $in: deptTeachers.map(t => t._id) };
        }
      }
    }
    // Admin sees all classes

    const classes = await Class.find(filter)
      .populate('teacher', 'name email department')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await Class.countDocuments(filter);

    successResponse(res, {
      classes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    }, 'Classes fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch classes', 500, error.message);
  }
};

// Get class by ID
const getClassById = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id)
      .populate('teacher', 'name email')
      .populate('students', 'name email studentId');
      
    if (!classItem) {
      return errorResponse(res, 'Class not found', 404);
    }
    
    successResponse(res, classItem, 'Class fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch class', 500, error.message);
  }
};

// Update class
const updateClass = async (req, res) => {
  try {
    const { name, description, schedule, isActive } = req.body;
    
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return errorResponse(res, 'Class not found', 404);
    }
    
    // Check if user is the teacher of this class
    if (classItem.teacher.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to update this class', 403);
    }
    
    // Update fields
    if (name) classItem.name = name;
    if (description) classItem.description = description;
    if (schedule) classItem.schedule = schedule;
    if (isActive !== undefined) classItem.isActive = isActive;
    
    await classItem.save();
    
    // Populate teacher details
    await classItem.populate('teacher', 'name email');
    
    successResponse(res, classItem, 'Class updated successfully');
  } catch (error) {
    errorResponse(res, 'Failed to update class', 500, error.message);
  }
};

// Delete class
const deleteClass = async (req, res) => {
  try {
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return errorResponse(res, 'Class not found', 404);
    }
    
    // Check if user is the teacher of this class
    if (classItem.teacher.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to delete this class', 403);
    }
    
    await Class.findByIdAndDelete(req.params.id);
    
    successResponse(res, null, 'Class deleted successfully');
  } catch (error) {
    errorResponse(res, 'Failed to delete class', 500, error.message);
  }
};

// Add student to class
const addStudentToClass = async (req, res) => {
  try {
    const { studentId } = req.body;
    
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return errorResponse(res, 'Class not found', 404);
    }
    
    // Check if user is the teacher of this class
    if (classItem.teacher.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to add students to this class', 403);
    }
    
    // Check if student exists and is a student
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return errorResponse(res, 'Invalid student', 400);
    }
    
    // Check if student is already in class
    if (classItem.students.includes(studentId)) {
      return errorResponse(res, 'Student is already in this class', 400);
    }
    
    classItem.students.push(studentId);
    await classItem.save();
    
    // Populate students
    await classItem.populate('students', 'name email studentId');
    
    successResponse(res, classItem, 'Student added to class successfully');
  } catch (error) {
    errorResponse(res, 'Failed to add student to class', 500, error.message);
  }
};

// Remove student from class
const removeStudentFromClass = async (req, res) => {
  try {
    const { studentId } = req.body;
    
    const classItem = await Class.findById(req.params.id);
    if (!classItem) {
      return errorResponse(res, 'Class not found', 404);
    }
    
    // Check if user is the teacher of this class
    if (classItem.teacher.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to remove students from this class', 403);
    }
    
    // Check if student is in class
    if (!classItem.students.includes(studentId)) {
      return errorResponse(res, 'Student is not in this class', 400);
    }
    
    classItem.students = classItem.students.filter(
      student => student.toString() !== studentId
    );
    
    await classItem.save();
    
    // Populate students
    await classItem.populate('students', 'name email studentId');
    
    successResponse(res, classItem, 'Student removed from class successfully');
  } catch (error) {
    errorResponse(res, 'Failed to remove student from class', 500, error.message);
  }
};

// ── Update class mode (virtual/physical) and notify all enrolled students ──
const updateClassMode = async (req, res) => {
  try {
    const { mode, meetingLink, location, scheduledDate, scheduledTime } = req.body;

    if (!mode || !['virtual', 'physical'].includes(mode)) {
      return errorResponse(res, 'Invalid mode. Must be "virtual" or "physical"', 400);
    }
    if (mode === 'virtual' && !scheduledDate && !scheduledTime && !meetingLink) {
      return errorResponse(res, 'Scheduled date and time are required for virtual classes', 400);
    }
    if (mode === 'physical' && !location) {
      return errorResponse(res, 'Room/location is required for physical classes', 400);
    }

    const classItem = await Class.findById(req.params.id).populate('students', '_id name');
    if (!classItem) return errorResponse(res, 'Class not found', 404);

    // Allow teacher or HOD of the class to update
    const isTeacher = classItem.teacher.toString() === req.user.id;
    if (!isTeacher) {
      const teacher = await User.findById(req.user.id);
      if (!teacher || teacher.role !== 'hod') {
        return errorResponse(res, 'Not authorized to update this class', 403);
      }
    }

    // Update mode fields
    classItem.mode = mode;
    
    if (mode === 'virtual') {
      // Store schedule; if a live meetingLink is provided (from Start Class), save it
      if (!classItem.schedule) {
        classItem.schedule = {};
      }
      classItem.schedule.scheduledDate = scheduledDate;
      classItem.schedule.scheduledTime = scheduledTime;
      classItem.schedule.location = location || 'Online';
      // Only update meetingLink if one is explicitly provided
      if (meetingLink !== undefined) {
        classItem.meetingLink = meetingLink;
      } else {
        // Updating time/date — clear the old meeting link so it shows "Online"
        // and also expire any active meeting for this class
        const Meeting = require('../models/Meeting');
        if (classItem.meetingLink) {
          // End any active meeting that uses this link
          await Meeting.updateMany(
            { classId: classItem._id, isActive: true },
            { isActive: false, endedAt: new Date() }
          );
        }
        classItem.meetingLink = ''; // Will be set when Start Class is clicked
      }
    } else {
      // Physical mode
      classItem.meetingLink = '';
      if (classItem.schedule) {
        classItem.schedule.location = location || '';
      }
    }

    await classItem.save();

    // Notify all enrolled students via Message
    if (classItem.students && classItem.students.length > 0) {
      const teacherUser = await User.findById(req.user.id).select('name');
      const teacherName = teacherUser ? teacherUser.name : 'Your teacher';

      const modeLabel = mode === 'virtual' ? '🖥️ Virtual (Online)' : '🏫 Physical (In-Person)';
      let detailLine = '';
      
      if (mode === 'virtual') {
        detailLine = `\nScheduled Date: ${scheduledDate}\nScheduled Time: ${scheduledTime}\n\nThe meeting link will be available 15 minutes before class time.`;
      } else {
        detailLine = `\nRoom / Location: ${location}`;
      }

      const notifContent = `Dear Student,\n\nYour class "${classItem.name}" has been updated:\n\nMode: ${modeLabel}${detailLine}\n\nPlease make a note of this change.\n\nBest regards,\n${teacherName}`;

      const studentIds = classItem.students.map(s => s._id || s);

      const msg = new Message({
        sender: req.user.id,
        recipients: studentIds,
        subject: `📢 Class Update: ${classItem.name} — ${modeLabel}`,
        content: notifContent,
        isDraft: false,
      });
      await msg.save();
    }

    successResponse(res, classItem, `Class mode updated to ${mode}. Students have been notified.`);
  } catch (error) {
    errorResponse(res, 'Failed to update class mode', 500, error.message);
  }
};

module.exports = {
  createClass,
  getAllClasses,
  getClassById,
  updateClass,
  updateClassMode,
  deleteClass,
  addStudentToClass,
  removeStudentFromClass,
};
