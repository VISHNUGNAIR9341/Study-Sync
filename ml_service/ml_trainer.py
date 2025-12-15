"""
ML Model Training Script
Trains user-specific models from completed task history
"""

import sys
import json
from improved_predictor import ImprovedTimePredictor

def train_user_model(user_id: str, completed_tasks: list):
    """
    Train ML model for a specific user based on their completed tasks
    """
    predictor = ImprovedTimePredictor(user_id)
    
    # Filter tasks with actual completion time
    valid_tasks = []
    for task in completed_tasks:
        # Need actual_time from task_history or manual_time
        actual_time = task.get('actual_time') or task.get('manual_time')
        if actual_time and actual_time > 0:
            valid_tasks.append(task)
    
    if len(valid_tasks) < 3:
        return {
            "success": False,
            "message": f"Need at least 3 completed tasks to train. Found {len(valid_tasks)}.",
            "trained_on": 0
        }
    
    # Train the model
    success = predictor.train(valid_tasks)
    
    if success:
        return {
            "success": True,
            "message": f"Model trained successfully on {len(valid_tasks)} tasks",
            "trained_on": len(valid_tasks)
        }
    else:
        return {
            "success": False,
            "message": "Training failed",
            "trained_on": 0
        }

if __name__ == "__main__":
    # Read input from stdin
    input_data = sys.stdin.read()
    if not input_data:
        print(json.dumps({"error": "No input data"}))
        sys.exit(1)
    
    try:
        data = json.loads(input_data)
        user_id = data.get('user_id')
        completed_tasks = data.get('completed_tasks', [])
        
        result = train_user_model(user_id, completed_tasks)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
