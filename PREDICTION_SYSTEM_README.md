# EduConnect Student Performance Prediction System

## Overview
The Student Performance Prediction System is an AI-powered feature integrated into EduConnect that predicts student academic performance based on various factors such as attendance, assignment scores, exam results, and other academic indicators.

## Features
- Individual student performance prediction
- Class-wide performance analysis
- At-risk student identification
- Contributing factor analysis
- Performance trend visualization

## System Architecture
The prediction system consists of:
1. **Data Collection Layer**: Gathers data from existing EduConnect modules (attendance, grades, assignments)
2. **Prediction Engine**: Machine learning model that processes student data
3. **API Layer**: RESTful endpoints for accessing predictions
4. **Frontend Integration**: Dashboard components for visualizing predictions

## API Endpoints
All endpoints require authentication with a valid JWT token.

### Get Student Prediction
```
GET /api/prediction/students/:studentId
```
Returns performance prediction for a specific student.

### Get Class Predictions
```
GET /api/prediction/classes/:classId
```
Returns performance predictions for all students in a class.

### Get At-Risk Students
```
GET /api/prediction/at-risk
```
Returns list of students identified as at-risk based on their predicted performance.

## Training a New Model
To train a new prediction model with updated data:

1. Run the training script:
   ```bash
   python train_prediction_model.py
   ```

2. The script will:
   - Generate sample training data (in a real scenario, this would use actual EduConnect data)
   - Train a Random Forest Regressor model
   - Save the model as `student_performance_model.pkl`

3. Copy the model to the EduConnect backend:
   ```bash
   cp student_performance_model.pkl EduConnect/backend/models/
   ```

## Integration with EduConnect
The prediction system integrates with existing EduConnect components:

1. **Backend Integration**:
   - New controller: `prediction.controller.js`
   - New routes: `prediction.routes.js`
   - Utility functions: `prediction.utils.js`

2. **Frontend Integration**:
   - New section in teacher dashboard
   - Prediction visualization components
   - Interactive elements for viewing detailed predictions

## Model Details
The current implementation uses a Random Forest Regressor with the following features:
- Attendance rate
- Assignment scores
- Exam scores
- Course load
- Previous GPA
- Study hours per week
- Participation score

### Feature Importance (from training)
Based on the training data, the most important factors for predicting student performance are:
1. Exam scores (49%)
2. Assignment scores (14%)
3. Attendance rate (12%)
4. Participation score (10%)
5. Previous GPA (9%)
6. Study hours (5%)
7. Course load (1%)

## Extending the System
To enhance the prediction system:

1. **Add More Features**: Incorporate additional data points like:
   - Library usage
   - Online activity
   - Peer collaboration metrics
   - Extracurricular involvement

2. **Improve Model**: Experiment with different algorithms:
   - Neural networks
   - Gradient boosting
   - Support vector machines

3. **Real-time Predictions**: Implement streaming data processing for real-time performance updates

4. **Intervention Recommendations**: Add automated suggestions for helping at-risk students

## Testing
To test the prediction system:

1. Start the EduConnect backend:
   ```bash
   cd EduConnect/backend
   npm start
   ```

2. Authenticate with the API:
   ```bash
   curl -X POST http://localhost:5001/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "teacher@educonnect.com", "password": "teacher123", "role": "teacher"}'
   ```

3. Test prediction endpoints:
   ```bash
   curl -X GET http://localhost:5001/api/prediction/students/STU001 \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

## Troubleshooting
Common issues and solutions:

1. **Model Not Found**: Ensure `student_performance_model.pkl` is in the `backend/models/` directory
2. **Authentication Errors**: Verify JWT token is valid and user has appropriate permissions
3. **Poor Prediction Accuracy**: Retrain model with more recent or diverse data

## Future Enhancements
Planned improvements for the prediction system:
- Integration with external academic databases
- Multi-modal prediction (combining numerical and textual data)
- Explainable AI for better understanding of predictions
- Personalized intervention recommendations
- Performance trend analysis over time