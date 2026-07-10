const Resource = require('../models/Resource');
const Class = require('../models/Class');
const { successResponse, errorResponse } = require('../utils/response.utils');

// Create resource
const createResource = async (req, res) => {
  try {
    const { title, description, classId, resourceType, url, urlType, isPublic } = req.body;
    
    // Check if class exists
    const classItem = await Class.findById(classId).populate('students', '_id');
    if (!classItem) {
      return errorResponse(res, 'Class not found', 404);
    }
    
    // Check if user is the teacher of this class OR an HOD
    const user = await require('../models/User').findById(req.user.id).select('role department');
    const isHod = user && user.role === 'hod';
    if (!isHod && classItem.teacher.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to create resources for this class', 403);
    }
    
    const resource = new Resource({
      title,
      description,
      class: classId,
      teacher: req.user.id,
      resourceType: resourceType || 'file',
      isPublic: isPublic || false,
    });
    
    // Handle file upload — store bytes in MongoDB (multer memoryStorage gives
    // us req.file.buffer) so the file persists across server redeploys.
    if (req.file) {
      resource.fileName = req.file.originalname;
      resource.fileData = req.file.buffer;
      resource.fileSize = req.file.size;
      resource.mimeType = req.file.mimetype;
      resource.resourceType = 'file';
    }
    // Handle URL-based resources
    else if (url) {
      resource.url = url;
      resource.resourceType = resourceType || 'url';
      resource.urlType = urlType || detectUrlType(url);
      
      // Extract YouTube video ID if it's a YouTube URL
      if (resource.urlType === 'youtube') {
        const youtubeId = extractYouTubeId(url);
        if (youtubeId) {
          resource.thumbnail = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
        }
      }
    }
    
    await resource.save();
    
    // Populate references
    await resource.populate([
      { path: 'class', select: 'name code' },
      { path: 'teacher', select: 'name email' }
    ]);
    
    // If HOD uploaded, count all department students (not just class students)
    let studentsNotified = classItem.students.length;
    let notificationMessage = `${classItem.students.length} students in the class can now access it`;
    
    if (isHod && user.department) {
      try {
        const User = require('../models/User');
        const { getDepartmentAliases, normalizeDepartmentName } = require('../utils/departmentCatalog');
        const canonical = normalizeDepartmentName(user.department) || user.department;
        const aliases = getDepartmentAliases ? getDepartmentAliases(canonical) : [user.department];
        
        // Count all students in the department
        const deptStudentCount = await User.countDocuments({ 
          role: 'student', 
          department: { $in: aliases } 
        });
        
        studentsNotified = deptStudentCount;
        notificationMessage = `all ${deptStudentCount} students in ${user.department} department can now access it`;
      } catch (err) {
        console.error('Error counting department students:', err);
        // Fall back to class students count
      }
    }
    
    successResponse(res, {
      resource,
      studentsNotified,
      message: `Resource created and ${notificationMessage}`
    }, 'Resource created successfully', 201);
  } catch (error) {
    errorResponse(res, 'Failed to create resource', 500, error.message);
  }
};

// Helper function to detect URL type
function detectUrlType(url) {
  if (!url) return 'other';
  
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    return 'youtube';
  } else if (urlLower.includes('drive.google.com') || urlLower.includes('docs.google.com')) {
    return 'drive';
  } else if (urlLower.match(/\.(mp4|avi|mov|wmv|flv|webm)$/)) {
    return 'video';
  } else {
    return 'website';
  }
}

// Helper function to extract YouTube video ID
function extractYouTubeId(url) {
  if (!url) return null;
  
  // Handle different YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

// Get all resources
const getAllResources = async (req, res) => {
  try {
    const { classId, fileType, page = 1, limit = 10 } = req.query;
    
    // Build filter
    const filter = {};
    if (classId) filter.class = classId;
    if (fileType) filter.fileType = fileType;
    
    // If student, get resources from their classes + resources uploaded by HODs in their department
    if (req.user.role === 'student') {
      const User = require('../models/User');
      const student = await User.findById(req.user.id).select('department');
      
      // Get student's classes
      const studentClasses = await Class.find({ students: req.user.id });
      const classIds = studentClasses.map(c => c._id);
      
      // Get HODs from student's department
      let hodIds = [];
      if (student && student.department) {
        const { getDepartmentAliases, normalizeDepartmentName } = require('../utils/departmentCatalog');
        const canonical = normalizeDepartmentName(student.department) || student.department;
        const aliases = getDepartmentAliases ? getDepartmentAliases(canonical) : [student.department];
        
        const hods = await User.find({ 
          role: 'hod', 
          department: { $in: aliases } 
        }).select('_id');
        hodIds = hods.map(h => h._id);
      }
      
      // Student can see: public resources OR resources from their classes OR resources uploaded by their dept HOD
      filter.$or = [
        { isPublic: true }, 
        { class: { $in: classIds } },
        ...(hodIds.length > 0 ? [{ teacher: { $in: hodIds } }] : [])
      ];
    }
    // Teacher sees ONLY resources they personally uploaded
    else if (req.user.role === 'teacher') {
      filter.teacher = req.user.id;
    }
    // HOD sees ONLY resources they personally uploaded
    else if (req.user.role === 'hod') {
      filter.teacher = req.user.id;
    }
    
    // Pagination
    const skip = (page - 1) * limit;
    
    // Get resources
    const resources = await Resource.find(filter)
      .populate([
        { path: 'class', select: 'name code' },
        { path: 'teacher', select: 'name email' }
      ])
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
      
    // Get total count
    const total = await Resource.countDocuments(filter);
    
    successResponse(res, {
      resources,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    }, 'Resources fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch resources', 500, error.message);
  }
};

// Get resource by ID
const getResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate([
        { path: 'class', select: 'name code' },
        { path: 'teacher', select: 'name email' }
      ]);
      
    if (!resource) {
      return errorResponse(res, 'Resource not found', 404);
    }
    
    // Check authorization
    if (!resource.isPublic) {
      // If student, check if they're enrolled in the class
      if (req.user.role === 'student') {
        const classItem = await Class.findById(resource.class);
        if (!classItem.students.includes(req.user.id)) {
          return errorResponse(res, 'Not authorized to access this resource', 403);
        }
      }
      // If teacher, check if they're the owner or in the same department
      else if (req.user.role === 'teacher') {
        if (resource.teacher.toString() !== req.user.id) {
          const resourceClass = await Class.findById(resource.class);
          if (resourceClass.teacher.toString() !== req.user.id) {
            return errorResponse(res, 'Not authorized to access this resource', 403);
          }
        }
      }
    }
    
    successResponse(res, resource, 'Resource fetched successfully');
  } catch (error) {
    errorResponse(res, 'Failed to fetch resource', 500, error.message);
  }
};

// Update resource
const updateResource = async (req, res) => {
  try {
    const { title, description, fileType, fileUrl, isPublic } = req.body;
    
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return errorResponse(res, 'Resource not found', 404);
    }
    
    // Check if user is the teacher who created this resource
    if (resource.teacher.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to update this resource', 403);
    }
    
    // Update fields
    if (title) resource.title = title;
    if (description) resource.description = description;
    if (fileType) resource.fileType = fileType;
    if (fileUrl) resource.fileUrl = fileUrl;
    if (isPublic !== undefined) resource.isPublic = isPublic;
    
    await resource.save();
    
    // Populate references
    await resource.populate([
      { path: 'class', select: 'name code' },
      { path: 'teacher', select: 'name email' }
    ]);
    
    successResponse(res, resource, 'Resource updated successfully');
  } catch (error) {
    errorResponse(res, 'Failed to update resource', 500, error.message);
  }
};

// Delete resource
const deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return errorResponse(res, 'Resource not found', 404);
    }

    const User = require('../models/User');
    const requestingUser = await User.findById(req.user.id).select('role department');

    // HOD can delete any resource in their department
    if (requestingUser && requestingUser.role === 'hod') {
      const { getDepartmentAliases, normalizeDepartmentName } = require('../utils/departmentCatalog');
      const canonical = normalizeDepartmentName(requestingUser.department) || requestingUser.department;
      const aliases = getDepartmentAliases ? getDepartmentAliases(canonical) : [requestingUser.department];
      const resourceTeacher = await User.findById(resource.teacher).select('department');
      // Allow if teacher is in same dept, OR HOD uploaded it themselves
      if (
        resource.teacher.toString() === req.user.id ||
        (resourceTeacher && aliases.includes(resourceTeacher.department))
      ) {
        await Resource.findByIdAndDelete(req.params.id);
        return successResponse(res, null, 'Resource deleted successfully');
      }
      return errorResponse(res, 'Not authorized to delete this resource', 403);
    }

    // Teacher/admin: only their own resources
    if (resource.teacher.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to delete this resource', 403);
    }

    await Resource.findByIdAndDelete(req.params.id);
    successResponse(res, null, 'Resource deleted successfully');
  } catch (error) {
    errorResponse(res, 'Failed to delete resource', 500, error.message);
  }
};

// Download resource file
const downloadResource = async (req, res) => {
  try {
    // fileData is select:false on the schema, so request it explicitly.
    const resource = await Resource.findById(req.params.id).select('+fileData');
    if (!resource) {
      return errorResponse(res, 'Resource not found', 404);
    }

    // If it's a URL resource, redirect
    if (resource.resourceType === 'url' && resource.url) {
      return res.redirect(resource.url);
    }

    // Preferred path: file bytes stored in MongoDB (persists across redeploys)
    if (resource.fileData && resource.fileData.length) {
      res.setHeader('Content-Disposition', `attachment; filename="${resource.fileName || 'download'}"`);
      res.setHeader('Content-Type', resource.mimeType || 'application/octet-stream');
      return res.send(resource.fileData);
    }

    // Legacy fallback: file stored on disk (older resources)
    if (resource.filePath) {
      const fullPath = resolveLegacyFilePath(resource.filePath);
      if (!fullPath) {
        console.error('File not found | stored path:', resource.filePath);
        return errorResponse(res, 'File not found on server', 404);
      }

      res.setHeader('Content-Disposition', `attachment; filename="${resource.fileName || 'download'}"`);
      res.setHeader('Content-Type', resource.mimeType || 'application/octet-stream');

      const fs = require('fs');
      const fileStream = fs.createReadStream(fullPath);
      fileStream.pipe(res);
      fileStream.on('error', (error) => {
        console.error('File stream error:', error);
        if (!res.headersSent) errorResponse(res, 'Error reading file', 500);
      });
    } else {
      return errorResponse(res, 'No file associated with this resource', 404);
    }
  } catch (error) {
    console.error('Download resource error:', error);
    if (!res.headersSent) errorResponse(res, 'Failed to download resource', 500, error.message);
  }
};

// Resolve a legacy on-disk file path by trying several base locations.
// Returns the first existing absolute path, or null if none exist.
function resolveLegacyFilePath(filePath) {
  const path = require('path');
  const fs = require('fs');
  const candidates = [
    path.isAbsolute(filePath) ? filePath : path.join(__dirname, '../../', filePath),
    path.join(__dirname, '../', filePath),
    path.resolve(filePath),
  ];
  return candidates.find((p) => fs.existsSync(p)) || null;
}

// View resource file (for preview â€” same as download but inline)
const viewResource = async (req, res) => {
  try {
    // fileData is select:false on the schema, so request it explicitly.
    const resource = await Resource.findById(req.params.id).select('+fileData');
    if (!resource) {
      return errorResponse(res, 'Resource not found', 404);
    }

    // If it's a URL resource, redirect
    if (resource.resourceType === 'url' && resource.url) {
      return res.redirect(resource.url);
    }

    const ext = (resource.fileName || '').split('.').pop().toLowerCase();
    const mimeMap = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ppt: 'application/vnd.ms-powerpoint',
      pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif',
      mp4: 'video/mp4', webm: 'video/webm',
    };
    const mime = resource.mimeType || mimeMap[ext] || 'application/octet-stream';

    // Preferred path: file bytes stored in MongoDB (persists across redeploys)
    if (resource.fileData && resource.fileData.length) {
      res.setHeader('Content-Type', mime);
      res.setHeader('Content-Disposition', `inline; filename="${resource.fileName || 'file'}"`);
      return res.send(resource.fileData);
    }

    // Legacy fallback: file stored on disk (older resources)
    if (resource.filePath) {
      const fullPath = resolveLegacyFilePath(resource.filePath);
      if (!fullPath) {
        console.error('File not found | stored path:', resource.filePath);
        return errorResponse(res, 'File not found on server', 404);
      }

      res.setHeader('Content-Type', mime);
      res.setHeader('Content-Disposition', `inline; filename="${resource.fileName || 'file'}"`);

      const fs = require('fs');
      const fileStream = fs.createReadStream(fullPath);
      fileStream.pipe(res);
      fileStream.on('error', (error) => {
        console.error('File stream error:', error);
        if (!res.headersSent) errorResponse(res, 'Error reading file', 500);
      });
    } else {
      return errorResponse(res, 'No file associated with this resource', 404);
    }
  } catch (error) {
    console.error('View resource error:', error);
    if (!res.headersSent) errorResponse(res, 'Failed to view resource', 500, error.message);
  }
};

module.exports = {
  createResource,
  getAllResources,
  getResourceById,
  updateResource,
  deleteResource,
  downloadResource,
  viewResource,
};
