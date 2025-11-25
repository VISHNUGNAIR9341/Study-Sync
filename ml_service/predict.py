import sys
import json
import pickle
import pandas as pd
import os

def load_model():
    """Load the trained model"""
    model_path = os.path.join(os.path.dirname(__file__), 'time_predictor_model.pkl')
    
    if not os.path.exists(model_path):
        return None, None
    
    with open(model_path, 'rb') as f:
        model_data = pickle.load(f)
    
    return model_data['model'], model_data['feature_columns']

def predict():
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        if not input_data:
            return
            
        data = json.loads(input_data)
        category = data.get('category', 'writing')
        size = float(data.get('size', 1))
        
        # Try to load trained model
        model, feature_columns = load_model()
        
        if model is None:
            # Fallback to rule-based prediction if model not found
            default_speeds = { 
                "writing": 20, 
                "reading": 5,
                "problem_solving": 10,
                "project": 60,
                "revision": 10,
                "assignment": 30,
                "lab_work": 45,
                "presentation": 35
            }
            
            base_speed = default_speeds.get(category.lower(), 15)
            user_factor = 0.9 
            predicted = int(base_speed * size * user_factor)
            
            print(json.dumps({"predicted_time": predicted, "model_used": "rule_based"}))
            return
        
        # Use ML model for prediction
        # Create input dataframe with all required features
        input_df = pd.DataFrame([{
            'estimated_size': size,
            'title_length': int(data.get('title_length', 25)),
            'user_experience_level': int(data.get('user_experience', 3)),
            'num_pages': int(data.get('num_pages', 0) or 0),
            'num_slides': int(data.get('num_slides', 0) or 0),
            'num_questions': int(data.get('num_questions', 0) or 0)
        }])
        
        # Add category one-hot encoding
        for cat in ['writing', 'reading', 'problem_solving', 'project', 'revision', 'assignment', 'lab_work', 'presentation']:
            input_df[f'category_{cat}'] = 1 if category.lower() == cat else 0
        
        # Add priority one-hot encoding (default to Medium)
        priority = data.get('priority', 'Medium')
        for pri in ['Low', 'Medium', 'High', 'Urgent']:
            input_df[f'priority_{pri}'] = 1 if priority == pri else 0

        # Add complexity one-hot encoding (default to Medium)
        complexity = data.get('complexity', 'Medium')
        for comp in ['Low', 'Medium', 'High']:
            input_df[f'complexity_{comp}'] = 1 if complexity == comp else 0
        
        # Add time_of_day one-hot encoding (default to morning)
        time_of_day = data.get('time_of_day', 'morning')
        for tod in ['morning', 'afternoon', 'evening', 'night']:
            input_df[f'time_of_day_{tod}'] = 1 if time_of_day == tod else 0
        
        # Add day_of_week one-hot encoding (default to Monday)
        day_of_week = data.get('day_of_week', 'Monday')
        for dow in ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']:
            input_df[f'day_of_week_{dow}'] = 1 if day_of_week == dow else 0
        
        # Ensure all feature columns are present in the correct order
        for col in feature_columns:
            if col not in input_df.columns:
                input_df[col] = 0
        
        input_df = input_df[feature_columns]
        
        # Make prediction
        predicted_time = int(model.predict(input_df)[0])
        
        # Print result to stdout
        print(json.dumps({
            "predicted_time": predicted_time,
            "model_used": "random_forest"
        }))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    predict()
