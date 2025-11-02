const Resource = require('../models/Resource');
const Class = require('../models/Class');
const { successResponse, errorResponse } = require('../utils/response.utils');

// Create resource
const createResource = async (req, res) => {
  try {
    const { title, description, classId, fileType, fileUrl, isPublic } = req.body;
    
    // Check if class exists
    const classItem = await Class.findById(classId);
    if (!classItem) {
      return errorResponse(res, 'Class not found', 404);
    }
    
    // Check if user is the teacher of this class
    if (classItem.teacher.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to create resources for this class', 403);
    }
    
    const resource = new Resource({
      title,
      description,
      class: classId,
      teacher: req.user.id,
      fileType,
      fileUrl,
      isPublic: isPublic || false,
    });
    
    // If file was uploaded, add file info
    if (req.file) {
      resource.fileName = req.file.originalname;
      resource.filePath = req.file.path;
      resource.fileSize = req.file.size;
    }
    
    await resource.save();
    
    // Populate references
    await resource.populate([
      { path: 'class', select: 'name code' },
      { path: 'teacher', select: 'name email' }
    ]);
    
    successResponse(res, resource, 'Resource created successfully', 201);
  } catch (error) {
    errorResponse(res, 'Failed to create resource', 500, error.message);
  }
};

// Get all resources
const getAllResources = async (req, res) => {
  try {
    const { classId, fileType, page = 1, limit = 10 } = req.query;
    
    // Build filter
    const filter = {};
    if (classId) filter.class = classId;
    if (fileType) filter.fileType = fileType;
    
    // If student, only get public resources or resources from their classes
    if (req.user.role === 'student') {
      const studentClasses = await Class.find({ students: req.user.id });
      const classIds = studentClasses.map(c => c._id);
      
      filter.$or = [
        { isPublic: true },
        { class: { $in: classIds } }
      ];
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
    
    // Check if user is the teacher who created this resource
    if (resource.teacher.toString() !== req.user.id) {
      return errorResponse(res, 'Not authorized to delete this resource', 403);
    }
    
    await Resource.findByIdAndDelete(req.params.id);
    
    successResponse(res, null, 'Resource deleted successfully');
  } catch (error) {
    errorResponse(res, 'Failed to delete resource', 500, error.message);
  }
};

module.exports = {
  createResource,
  getAllResources,
  getResourceById,
  updateResource,
  deleteResource,
};