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

class ScheduleRequest(BaseModel):
    user_id: str
    routine: RoutineConfig
    tasks: List[TaskItem]

@app.get("/")
def read_root():
    return {"message": "Smart Student Planner ML Service is running"}

@app.post("/predict", response_model=PredictionOutput)
def predict_time(task: TaskInput):
    # Logic:
    # 1. Load user history (mocked for now, in real app would query DB or receive history)
    # 2. Calculate weighted average speed
    
    default_speeds = { # mins per unit
        "writing": 20, 
        "reading": 5,
        "problem_solving": 10,
        "project": 60,
        "revision": 10
    }
    
    base_speed = default_speeds.get(task.category.lower(), 15)
    
    # Mock user adjustment (random variance for demo)
    user_factor = 0.9 # User is 10% faster than average
    
    predicted = int(base_speed * task.size * user_factor)
    return {"predicted_time": predicted, "confidence": 0.85}

@app.post("/schedule")
def generate_schedule(req: ScheduleRequest):
    # Simple Greedy Scheduling Algorithm
    
    # 1. Parse Routine
    wake_up = datetime.strptime(req.routine.wake_up, "%H:%M")
    sleep = datetime.strptime(req.routine.sleep, "%H:%M")
    
    # Create available slots
    # Start with full day from wake to sleep
    # Subtract fixed blocks
    
    # Simplified: Just assume free time is 5pm to 10pm for demo if no blocks
    # In real implementation, we'd do complex interval subtraction
    
    current_time = datetime.now()
    if current_time < wake_up.replace(year=current_time.year, month=current_time.month, day=current_time.day):
        start_time = wake_up.replace(year=current_time.year, month=current_time.month, day=current_time.day)
    else:
        start_time = current_time
        
    # Round to next 15 mins
    start_time += timedelta(minutes=(15 - start_time.minute % 15) % 15)
    
    schedule = []
    
    # Sort tasks: Urgent first, then by deadline
    sorted_tasks = sorted(req.tasks, key=lambda x: (x.priority != 'Urgent', x.deadline or '9999-12-31'))
    
    for task in sorted_tasks:
        duration = task.predicted_time
        
        # Add to schedule
        end_time = start_time + timedelta(minutes=duration)
        
        # Check if fits before sleep (simplified)
        sleep_today = sleep.replace(year=start_time.year, month=start_time.month, day=start_time.day)
        if end_time > sleep_today:
            break # Stop scheduling if day is full
            
        schedule.append({
            "task_id": task.id,
            "title": task.title,
            "start": start_time.strftime("%H:%M"),
            "end": end_time.strftime("%H:%M"),
            "duration": duration
        })
        
        # Add break
        start_time = end_time + timedelta(minutes=10)
        
    return {"schedule": schedule}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
