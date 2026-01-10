// Utility functions for student performance prediction

/**
 * Calculate attendance rate from attendance records
 * @param {Array} attendanceRecords - Array of attendance records
 * @returns {Number} Attendance rate as percentage
 */
function calculateAttendanceRate(attendanceRecords) {
  if (!attendanceRecords || attendanceRecords.length === 0) return 0;
  
  const totalClasses = attendanceRecords.length;
  const presentCount = attendanceRecords.filter(record => 
    record.status === 'present' || record.status === 'late'
  ).length;
  
  return Math.round((presentCount / totalClasses) * 100);
}

/**
 * Calculate average score from grade records
 * @param {Array} grades - Array of grade records
 * @param {String} type - Type of grades to calculate (optional)
 * @returns {Number} Average score as percentage
 */
function calculateAverageScore(grades, type = null) {
  if (!grades || grades.length === 0) return 0;
  
  let filteredGrades = grades;
  if (type) {
    filteredGrades = grades.filter(grade => grade.type === type);
  }
  
  if (filteredGrades.length === 0) return 0;
  
  const totalPercentage = filteredGrades.reduce((sum, grade) => sum + grade.percentage, 0);
  return Math.round(totalPercentage / filteredGrades.length);
}

/**
 * Extract features for prediction model
 * @param {Object} studentData - Student data including attendance and grades
 * @returns {Object} Feature vector for prediction
 */
function extractFeatures(studentData) {
  const { attendanceRecords, grades, courseLoad, previousGPA } = studentData;
  
  return {
    attendanceRate: calculateAttendanceRate(attendanceRecords),
    assignmentScore: calculateAverageScore(grades, 'assignment'),
    examScore: calculateAverageScore(grades, 'exam'),
    courseLoad: courseLoad || 0,
    previousGPA: previousGPA || 0
  };
}

/**
 * Calculate risk level based on predicted score
 * @param {Number} score - Predicted score
 * @returns {String} Risk level (low, medium, high)
 */
function calculateRiskLevel(score) {
  if (score >= 80) return 'low';
  if (score >= 60) return 'medium';
  return 'high';
}

/**
 * Convert score to letter grade
 * @param {Number} score - Numeric score
 * @returns {String} Letter grade
 */
function convertToLetterGrade(score) {
  if (score >= 97) return 'A+';
  if (score >= 93) return 'A';
  if (score >= 90) return 'A-';
  if (score >= 87) return 'B+';
  if (score >= 83) return 'B';
  if (score >= 80) return 'B-';
  if (score >= 77) return 'C+';
  if (score >= 73) return 'C';
  if (score >= 70) return 'C-';
  if (score >= 67) return 'D+';
  if (score >= 65) return 'D';
  return 'F';
}

/**
 * Analyze contributing factors for student performance
 * @param {Object} features - Student features
 * @returns {Array} Array of contributing factors
 */
function analyzeContributingFactors(features) {
  const factors = [];
  
  if (features.attendanceRate < 75) {
    factors.push({
      factor: 'Attendance',
      impact: 'High',
      recommendation: 'Improve attendance to at least 80%'
    });
  }
  
  if (features.assignmentScore < 70) {
    factors.push({
      factor: 'Assignments',
      impact: 'High',
      recommendation: 'Focus on completing assignments with higher scores'
    });
  }
  
  if (features.examScore < 70) {
    factors.push({
      factor: 'Exams',
      impact: 'Critical',
      recommendation: 'Seek additional help for exam preparation'
    });
  }
  
  if (features.courseLoad > 5) {
    factors.push({
      factor: 'Course Load',
      impact: 'Medium',
      recommendation: 'Consider reducing course load if possible'
    });
  }
  
  return factors;
}

module.exports = {
  calculateAttendanceRate,
  calculateAverageScore,
  extractFeatures,
  calculateRiskLevel,
  convertToLetterGrade,
  analyzeContributingFactors
};