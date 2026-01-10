import cv2
import numpy as np
import os
from PIL import Image
import pickle

# Check if opencv-contrib-python is installed
try:
    import cv2
    # Try different ways to access LBPH face recognizer
    def get_lbph_recognizer():
        try:
            # Try to create LBPH face recognizer
            if hasattr(cv2, 'face') and hasattr(cv2.face, 'LBPHFaceRecognizer_create'):
                return cv2.face.LBPHFaceRecognizer_create()
            elif hasattr(cv2, 'face_LBPHFaceRecognizer'):
                return cv2.face_LBPHFaceRecognizer.create()
            elif hasattr(cv2, 'createLBPHFaceRecognizer'):
                return cv2.createLBPHFaceRecognizer()
            else:
                return None
        except Exception as e:
            print(f"Error creating LBPH recognizer: {e}")
            return None
    
    LBPHFaceRecognizer_create = get_lbph_recognizer
    
    # Check if Haar cascades are available
    def get_haar_cascade_path():
        try:
            # Try to get Haar cascade path
            if hasattr(cv2, 'data') and hasattr(cv2.data, 'haarcascades'):
                return cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
            else:
                # Fallback path
                return 'haarcascade_frontalface_default.xml'
        except Exception:
            # Fallback path
            return 'haarcascade_frontalface_default.xml'
    
    HAAR_CASCADE_PATH = get_haar_cascade_path()
    
except (ImportError, AttributeError) as e:
    # Fallback if contrib modules are not available
    print(f"Warning: opencv-contrib-python not installed properly. Some features may not work. Error: {e}")
    LBPHFaceRecognizer_create = lambda: None
    HAAR_CASCADE_PATH = 'haarcascade_frontalface_default.xml'

class FaceRecognizer:
    def __init__(self):
        # Create LBPH face recognizer
        # Initialize recognizer with error handling
        self.recognizer = None
        if LBPHFaceRecognizer_create is not None:
            try:
                self.recognizer = LBPHFaceRecognizer_create()
                if self.recognizer is None:
                    print("Warning: Failed to create LBPH face recognizer")
            except Exception as e:
                print(f"Error creating recognizer: {e}")
                self.recognizer = None
        else:
            print("Face recognizer not available - opencv-contrib-python not installed properly")
                
        # Load Haar cascade classifier for face detection
        self.face_cascade = cv2.CascadeClassifier(HAAR_CASCADE_PATH)
        # Directory to store face samples
        self.dataset_path = 'dataset'
        # File to store trained model
        self.trainer_file = 'trainer.yml'
        
        # Create dataset directory if it doesn't exist
        if not os.path.exists(self.dataset_path):
            os.makedirs(self.dataset_path)
            
    def detect_face(self, img):
        """Detect faces in an image using Haar Cascade"""
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        return faces, gray
        
    def capture_samples(self, student_id, sample_count=30):
        """Capture face samples for a student"""
        # Check if camera is available
        cap = cv2.VideoCapture(0)
        if not cap.isOpened():
            print("Error: Could not open camera")
            return 0
            
        count = 0
        
        # Create directory for student if it doesn't exist
        student_path = os.path.join(self.dataset_path, str(student_id))
        if not os.path.exists(student_path):
            os.makedirs(student_path)
            
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Error: Could not read frame from camera")
                break
                
            faces, gray = self.detect_face(frame)
            
            for (x, y, w, h) in faces:
                count += 1
                # Save the captured image
                cv2.imwrite(f"{student_path}/sample_{count}.jpg", gray[y:y+h, x:x+w])
                
                # Draw rectangle around face
                cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
                cv2.putText(frame, f"Sample {count}/{sample_count}", (x, y-10), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 0, 0), 2)
                           
            cv2.imshow('Capturing Samples', frame)
            
            # Break if ESC key is pressed or required samples are captured
            if cv2.waitKey(1) & 0xFF == 27 or count >= sample_count:
                break
                
        cap.release()
        cv2.destroyAllWindows()
        return count
        
    def train_model(self):
        """Train the LBPH model with captured samples"""
        # Get all student IDs
        student_ids = [d for d in os.listdir(self.dataset_path) 
                      if os.path.isdir(os.path.join(self.dataset_path, d))]
        
        if not student_ids:
            print("No samples found for training")
            return False
            
        faces = []
        ids = []
        
        # Read all images and corresponding labels
        for student_id in student_ids:
            student_path = os.path.join(self.dataset_path, student_id)
            image_paths = [os.path.join(student_path, f) for f in os.listdir(student_path)]
            
            for image_path in image_paths:
                # Convert image to grayscale
                pil_image = Image.open(image_path).convert('L')
                image_np = np.array(pil_image, 'uint8')
                
                # Detect faces in the image
                face_np = np.array(image_np, 'uint8')
                faces.append(face_np)
                ids.append(int(student_id))
                
        if len(faces) == 0:
            print("No faces found for training")
            return False
            
        # Train the recognizer
        if self.recognizer is not None:
            try:
                self.recognizer.train(faces, np.array(ids))
                # Save the trained model
                self.recognizer.save(self.trainer_file)
                print(f"Model trained with {len(faces)} samples")
                return True
            except Exception as e:
                print(f"Error training recognizer: {e}")
                return False
        else:
            print("Recognizer not initialized - cannot train model")
            return False
        
    def recognize_face(self, img):
        """Recognize face in an image"""
        # Check if trained model exists
        if not os.path.exists(self.trainer_file):
            print("Model not trained yet")
            return []
            
        # Check if recognizer is properly initialized
        if self.recognizer is None:
            print("Recognizer not initialized")
            return []
            
        # Load trained model
        try:
            # Different versions of OpenCV have different methods
            if hasattr(self.recognizer, 'read'):
                self.recognizer.read(self.trainer_file)
            elif hasattr(self.recognizer, 'load'):
                self.recognizer.load(self.trainer_file)
            else:
                print("Recognizer doesn't have load/read method")
                return []
        except Exception as e:
            print(f"Error loading model: {e}")
            return []
        
        # Detect faces
        faces, gray = self.detect_face(img)
        
        recognized_faces = []
        for (x, y, w, h) in faces:
            try:
                # Recognize the face
                id_, confidence = self.recognizer.predict(gray[y:y+h, x:x+w])
                
                # Confidence is inverse (lower means better match)
                if confidence < 100:
                    recognized_faces.append((id_, 100 - confidence, (x, y, w, h)))
                else:
                    recognized_faces.append((None, 0, (x, y, w, h)))
            except Exception as e:
                print(f"Error in prediction: {e}")
                recognized_faces.append((None, 0, (x, y, w, h)))
                
        return recognized_faces
        
    def real_time_recognition(self, callback=None):
        """Real-time face recognition"""
        # Check if trained model exists
        if not os.path.exists(self.trainer_file):
            print("Model not trained yet")
            return
            
        # Check if recognizer is properly initialized
        if self.recognizer is None:
            print("Recognizer not initialized")
            return
            
        # Load trained model
        try:
            # Different versions of OpenCV have different methods
            if hasattr(self.recognizer, 'read'):
                self.recognizer.read(self.trainer_file)
            elif hasattr(self.recognizer, 'load'):
                self.recognizer.load(self.trainer_file)
            else:
                print("Recognizer doesn't have load/read method")
                return
        except Exception as e:
            print(f"Error loading model: {e}")
            return
            
        cap = cv2.VideoCapture(0)
        
        # Check if camera is opened successfully
        if not cap.isOpened():
            print("Error: Could not open camera")
            return
        
        while True:
            ret, frame = cap.read()
            if not ret:
                print("Error: Could not read frame from camera")
                break
                
            # Recognize faces
            recognized_faces = self.recognize_face(frame)
            
            for item in recognized_faces:
                if len(item) == 3:
                    id_, confidence, (x, y, w, h) = item
                    # Draw rectangle around face
                    color = (0, 255, 0) if id_ is not None else (0, 0, 255)
                    cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
                    
                    if id_ is not None:
                        # Display ID and confidence
                        text = f"ID: {id_} ({confidence:.2f}%)"
                        cv2.putText(frame, text, (x, y-10), 
                                   cv2.FONT_HERSHEY_SIMPLEX, 0.8, color, 2)
                        
                        # Call callback function if provided
                        if callback:
                            callback(id_, confidence)
                else:
                    print(f"Unexpected item format: {item}")
                        
            cv2.imshow('Face Recognition', frame)
            
            # Break if ESC key is pressed
            if cv2.waitKey(1) & 0xFF == 27:
                break
                
        cap.release()
        cv2.destroyAllWindows()