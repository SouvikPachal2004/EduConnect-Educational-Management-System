import sys
import json
import pickle
import numpy as np
import os

def load_model():
    """Load the trained model"""
    try:
        # Get the directory of this script
        script_dir = os.path.dirname(os.path.abspath(__file__))
        # Go up one directory to reach the backend folder
        backend_dir = os.path.dirname(script_dir)
        # Path to the model file
        model_path = os.path.join(backend_dir, 'models', 'student_performance_model.pkl')
        
        print(f"Looking for model at: {model_path}", file=sys.stderr)
        
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found at {model_path}")
            
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        return model
    except Exception as e:
        print(f"Error loading model: {str(e)}", file=sys.stderr)
        raise

def predict_performance(attendance_rate, total_attendance, grade):
    """Make a prediction using the loaded model"""
    try:
        # Load the model
        model = load_model()
        
        # Prepare features - the model expects [[attendance_rate, total_attendance, grade]]
        # Using only the two required attributes as specified
        features = np.array([[attendance_rate, total_attendance, grade]])
        
        # Make prediction
        prediction = model.predict(features)[0]
        
        # Get probability estimates if available
        probability = None
        if hasattr(model, 'predict_proba'):
            proba = model.predict_proba(features)[0]
            probability = float(np.max(proba))
        
        return {
            'predicted_score': float(prediction),
            'probability': probability
        }
    except Exception as e:
        print(f"Error making prediction: {str(e)}", file=sys.stderr)
        raise

def main():
    """Main function to process input and return prediction"""
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        if not input_data:
            raise ValueError("No input data received")
        
        # Parse JSON input
        data = json.loads(input_data)
        
        # Extract features - using only the two required attributes as specified
        attendance_rate = float(data['attendance_rate'])
        total_attendance = float(data['total_attendance'])
        grade = float(data['grade'])  # This represents the student's academic performance
        
        # Make prediction
        result = predict_performance(attendance_rate, total_attendance, grade)
        
        # Output result as JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'success': False
        }
        print(json.dumps(error_result))

if __name__ == "__main__":
    main()