import pickle
import numpy as np
import os

# Get the directory of this script
script_dir = os.path.dirname(os.path.abspath(__file__))
# Path to the model file
model_path = os.path.join(script_dir, 'models', 'student_performance_model.pkl')

print(f"Looking for model at: {model_path}")

if os.path.exists(model_path):
    print("Model file found!")
    
    try:
        # Load the model
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        print("Model loaded successfully!")
        print(f"Model type: {type(model)}")
        
        # Test prediction with sample data
        # Features: attendance_rate, total_attendance, grade
        test_features = np.array([[85, 100, 3.2]])
        prediction = model.predict(test_features)
        print(f"Sample prediction: {prediction[0]}")
        
    except Exception as e:
        print(f"Error loading or using model: {str(e)}")
else:
    print("Model file not found!")