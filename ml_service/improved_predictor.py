"""
Improved ML Time Prediction Model
Learns from user's actual task completion times
"""

import numpy as np
from typing import Dict, List, Optional
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import pickle
import os

class ImprovedTimePredictor:
    """
    Learns from user's historical task data to make better predictions
    """
    
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.model = LinearRegression()
        self.scaler = StandardScaler()
        self.is_trained = False
        
        # Category encodings
        self.category_map = {
            'writing': 0,
            'reading': 1,
            'problem_solving': 2,
            'project': 3,
            'revision': 4,
            'other': 5
        }
        
        # Complexity encodings
        self.complexity_map = {
            'Low': 0,
            'Medium': 1,
            'High': 2
        }
        
        # Default estimates (fallback when no training data)
        self.default_speeds = {
            'writing': {'Low': 15, 'Medium': 20, 'High': 30},
            'reading': {'Low': 3, 'Medium': 5, 'High': 8},
            'problem_solving': {'Low': 8, 'Medium': 10, 'High': 15},
            'project': {'Low': 40, 'Medium': 60, 'High': 90},
            'revision': {'Low': 7, 'Medium': 10, 'High': 15},
            'other': {'Low': 10, 'Medium': 15, 'High': 20}
        }
        
        # Try to load existing model
        self.load_model()
    
    def extract_features(self, task: Dict) -> np.array:
        """
        Convert task dictionary to feature vector
        Features: [category, complexity, size, num_pages, num_slides, num_questions]
        """
        category = task.get('category', 'other').lower()
        complexity = task.get('complexity', 'Medium')
        size = task.get('estimated_size', 1.0)
        num_pages = task.get('num_pages', 0) or 0
        num_slides = task.get('num_slides', 0) or 0
        num_questions = task.get('num_questions', 0) or 0
        
        category_code = self.category_map.get(category, 5)
        complexity_code = self.complexity_map.get(complexity, 1)
        
        return np.array([
            category_code,
            complexity_code,
            size,
            num_pages,
            num_slides,
            num_questions
        ])
    
    def train(self, historical_tasks: List[Dict]):
        """
        Train the model on historical tasks
        Each task should have: category, complexity, size, actual_time
        """
        if len(historical_tasks) < 3:
            print(f"Not enough training data ({len(historical_tasks)} tasks). Need at least 3.")
            return False
        
        # Extract features and labels
        X = []
        y = []
        
        for task in historical_tasks:
            actual_time = task.get('actual_time') or task.get('manual_time')
            if not actual_time or actual_time <= 0:
                continue
            
            features = self.extract_features(task)
            X.append(features)
            y.append(actual_time)
        
        if len(X) < 3:
            print("Not enough valid training samples with actual_time")
            return False
        
        X = np.array(X)
        y = np.array(y)
        
        # Normalize features
        X_scaled = self.scaler.fit_transform(X)
        
        # Train model
        self.model.fit(X_scaled, y)
        self.is_trained = True
        
        # Save model
        self.save_model()
        
        print(f"Model trained on {len(X)} tasks. R² score: {self.model.score(X_scaled, y):.3f}")
        return True
    
    def predict(self, task: Dict) -> tuple:
        """
        Predict time for a task
        Returns: (predicted_time, confidence)
        """
        features = self.extract_features(task)
        
        if self.is_trained:
            # Use trained model
            X_scaled = self.scaler.transform([features])
            predicted_time = self.model.predict(X_scaled)[0]
            
            # Ensure reasonable bounds (10 min to 480 min)
            predicted_time = max(10, min(480, predicted_time))
            
            confidence = 0.85  # Could calculate based on model metrics
            return int(predicted_time), confidence
        else:
            # Fallback to rule-based estimation
            category = task.get('category', 'other').lower()
            complexity = task.get('complexity', 'Medium')
            size = task.get('estimated_size', 1.0)
            
            base_speed = self.default_speeds.get(category, {}).get(complexity, 15)
            predicted_time = base_speed * size
            
            # Add adjustments for specific features
            num_pages = task.get('num_pages', 0) or 0
            num_slides = task.get('num_slides', 0) or 0
            num_questions = task.get('num_questions', 0) or 0
            
            if num_pages > 0:
                predicted_time += num_pages * 2  # 2 min per page
            if num_slides > 0:
                predicted_time += num_slides * 1  # 1 min per slide
            if num_questions > 0:
                predicted_time += num_questions * 3  # 3 min per question
            
            # Ensure reasonable bounds
            predicted_time = max(10, min(480, predicted_time))
            
            confidence = 0.60  # Lower confidence without training
            return int(predicted_time), confidence
    
    def save_model(self):
        """Save model to disk"""
        model_dir = os.path.join(os.path.dirname(__file__), 'models')
        os.makedirs(model_dir, exist_ok=True)
        
        model_path = os.path.join(model_dir, f'user_{self.user_id}_model.pkl')
        
        with open(model_path, 'wb') as f:
            pickle.dump({
                'model': self.model,
                'scaler': self.scaler,
                'is_trained': self.is_trained
            }, f)
    
    def load_model(self):
        """Load model from disk if exists"""
        model_dir = os.path.join(os.path.dirname(__file__), 'models')
        model_path = os.path.join(model_dir, f'user_{self.user_id}_model.pkl')
        
        if os.path.exists(model_path):
            try:
                with open(model_path, 'rb') as f:
                    data = pickle.load(f)
                    self.model = data['model']
                    self.scaler = data['scaler']
                    self.is_trained = data['is_trained']
                print(f"Loaded existing model for user {self.user_id}")
            except Exception as e:
                print(f"Failed to load model: {e}")
                self.is_trained = False
