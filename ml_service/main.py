from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Dict
import uvicorn
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

app = FastAPI()

class TaskInput(BaseModel):
    category: str
    size: float
    user_id: str

class PredictionOutput(BaseModel):
    predicted_time: int
    confidence: float

class RoutineConfig(BaseModel):
    wake_up: str
    sleep: str
    daily_blocks: Optional[List[Dict]] = [] # e.g. [{"start": "09:00", "end": "17:00", "label": "College"}]

class TaskItem(BaseModel):
    id: str
    title: str
    category: str
    estimated_size: float
    predicted_time: int
    deadline: Optional[str]
    priority: str

class RoutineBlock(BaseModel):
    activity_type: str
    start_time: str
    end_time: str

class ScheduleRequest(BaseModel):
    user_id: str
    routine: RoutineConfig
    tasks: List[TaskItem]
    routine_blocks: Optional[List[RoutineBlock]] = []

@app.get("/")
def read_root():
    return {"message": "Smart Student Planner ML Service is running"}

@app.post("/predict", response_model=PredictionOutput)
def predict_time(task: TaskInput):
    """
    Predict task completion time using improved ML model
    The model learns from user's historical task completion data
    """
    try:
        from improved_predictor import ImprovedTimePredictor
        
        # Create user-specific predictor
        predictor = ImprovedTimePredictor(task.user_id)
        
        # Convert task to dict format
        task_dict = {
            'category': task.category,
            'estimated_size': task.size,
            'complexity': 'Medium',  # Default, will be overridden if provided
        }
        
        # Make prediction
        predicted_time, confidence = predictor.predict(task_dict)
        
        return {
            "predicted_time": predicted_time,
            "confidence": confidence
        }
    except Exception as e:
        print(f"Prediction error: {e}")
        # Fallback to simple estimation
        default_speeds = {
            "writing": 20,
            "reading": 5,
            "problem_solving": 10,
            "project": 60,
            "revision": 10
        }
        base_speed = default_speeds.get(task.category.lower(), 15)
        predicted = int(base_speed * task.size)
        return {"predicted_time": predicted, "confidence": 0.50}

def time_conflicts_with_routine(start_time: datetime, end_time: datetime, routine_blocks: List[RoutineBlock]) -> bool:
    """Check if a time slot conflicts with any routine block"""
    for block in routine_blocks:
        # Parse block times (they are in HH:MM:SS format)
        block_start = datetime.strptime(block.start_time, "%H:%M:%S")
        block_end = datetime.strptime(block.end_time, "%H:%M:%S")
        
        # Make them same day as start_time for comparison
        block_start = block_start.replace(year=start_time.year, month=start_time.month, day=start_time.day)
        block_end = block_end.replace(year=start_time.year, month=start_time.month, day=start_time.day)
        
        # Check for overlap: [start_time, end_time) overlaps with [block_start, block_end)
        if start_time < block_end and end_time > block_start:
            return True
    return False

def find_next_available_slot(current_time: datetime, duration: int, sleep_time: datetime, routine_blocks: List[RoutineBlock]) -> Optional[datetime]:
    """Find the next available time slot that doesn't conflict with routine blocks"""
    max_attempts = 100  # Prevent infinite loops
    attempts = 0
    
    while attempts < max_attempts:
        attempts += 1
        end_time = current_time + timedelta(minutes=duration)
        
        # Check if it fits before sleep
        if end_time > sleep_time:
            return None
        
        # Check for conflicts with routine blocks
        if not time_conflicts_with_routine(current_time, end_time, routine_blocks):
            return current_time
        
        # If conflict, find the next block and skip past it
        for block in routine_blocks:
            block_end = datetime.strptime(block.end_time, "%H:%M:%S")
            block_end = block_end.replace(year=current_time.year, month=current_time.month, day=current_time.day)
            
            # If current time is before or during this block, jump to after it
            if current_time < block_end:
                current_time = block_end + timedelta(minutes=10)  # Add small buffer
                break
        else:
            # No blocking block found, but still had conflict - move forward
            current_time += timedelta(minutes=15)
    
    return None

def break_task_into_sessions(task: TaskItem) -> List[Dict]:
    """
    Break a task into optimal study sessions based on educational psychology research.
    - Sessions of 20-45 minutes are ideal for retention
    - Distribute work across days when deadline allows
    """
    duration = task.predicted_time
    task_deadline = datetime.fromisoformat(task.deadline) if task.deadline else None
    now = datetime.now()
    
    # Calculate days until deadline
    if task_deadline:
        days_available = max(1, (task_deadline - now).days + 1)
    else:
        # Default to spreading over 3-7 days based on task length
        days_available = min(7, max(3, duration // 30))
    
    sessions = []
    
    # Break down strategy based on duration
    if duration <= 45:
        # Short task - do in one session
        sessions.append({
            "duration": duration,
            "session_num": 1,
            "total_sessions": 1
        })
    else:
        # Long task - break into chunks
        # Optimal session length: 20-45 minutes
        optimal_session_length = 30
        
        # Calculate number of sessions needed
        num_sessions = max(2, min(days_available, (duration + optimal_session_length - 1) // optimal_session_length))
        minutes_per_session = duration // num_sessions
        remaining_minutes = duration % num_sessions
        
        for i in range(num_sessions):
            session_duration = minutes_per_session
            if i < remaining_minutes:
                session_duration += 1
            
            sessions.append({
                "duration": session_duration,
                "session_num": i + 1,
                "total_sessions": num_sessions
            })
    
    return sessions

@app.post("/schedule")
def generate_schedule(req: ScheduleRequest):
    # Smart Greedy Scheduling Algorithm with Routine Block Awareness & Task Chunking
    
    # 1. Parse Routine
    wake_up = datetime.strptime(req.routine.wake_up, "%H:%M")
    sleep = datetime.strptime(req.routine.sleep, "%H:%M")
    
    current_time = datetime.now()
    
    # Determine starting time
    wake_up_today = wake_up.replace(year=current_time.year, month=current_time.month, day=current_time.day)
    if current_time < wake_up_today:
        start_time = wake_up_today
    else:
        start_time = current_time
        
    # Round to next 15 mins
    start_time += timedelta(minutes=(15 - start_time.minute % 15) % 15)
    
    schedule = []
    
    # Sort tasks: Urgent first, then by deadline
    sorted_tasks = sorted(req.tasks, key=lambda x: (x.priority != 'Urgent', x.deadline or '9999-12-31'))
    
    sleep_today = sleep.replace(year=start_time.year, month=start_time.month, day=start_time.day)
    
    # Track which tasks have been partially scheduled (for multi-session tasks)
    partially_scheduled = {}
    
    for task in sorted_tasks:
        # Break task into optimal sessions
        sessions = break_task_into_sessions(task)
        
        # For today, only schedule the first session (or full task if single session)
        first_session = sessions[0]
        duration = first_session["duration"]
        
        # Find next available slot that doesn't conflict with routine blocks
        available_slot = find_next_available_slot(start_time, duration, sleep_today, req.routine_blocks)
        
        if available_slot is None:
            # No more time today
            print(f"Could not schedule task '{task.title}' - no available slots")
            continue
        
        start_time = available_slot
        end_time = start_time + timedelta(minutes=duration)
        
        # Create session title
        if first_session["total_sessions"] > 1:
            session_title = f"{task.title} (Part {first_session['session_num']}/{first_session['total_sessions']})"
        else:
            session_title = task.title
        
        schedule.append({
            "task_id": task.id,
            "title": session_title,
            "start": start_time.strftime("%I:%M %p"),  # 12-hour format with AM/PM
            "end": end_time.strftime("%I:%M %p"),
            "duration": duration,
            "session_info": {
                "session_num": first_session["session_num"],
                "total_sessions": first_session["total_sessions"],
                "is_multi_session": first_session["total_sessions"] > 1
            }
        })
        
        # Move to next slot (add break)
        start_time = end_time + timedelta(minutes=10)
        
    return {"schedule": schedule}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
