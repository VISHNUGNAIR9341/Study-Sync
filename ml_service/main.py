from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
import uvicorn
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from improved_predictor import ImprovedTimePredictor

app = FastAPI()

# 1. CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Predictor Instance (to load artifacts once)
# Note: ImprovedTimePredictor init takes user_id, but base pipeline is shared.
# We will use this instance for base predictions.
base_predictor = ImprovedTimePredictor("global_base")

class TaskInput(BaseModel):
    user_id: str
    category: str
    estimated_size: float = Field(alias="size", default=1.0) # Support alias 'size' or 'estimated_size'
    title: Optional[str] = ""
    title_length: Optional[int] = 0
    priority: Optional[str] = "Medium"
    time_of_day: Optional[str] = "morning"
    day_of_week: Optional[str] = "Monday"
    user_experience_level: Optional[int] = 3
    complexity: Optional[str] = "Medium"
    num_pages: Optional[int] = 0
    num_slides: Optional[int] = 0
    num_questions: Optional[int] = 0
    created_at: Optional[str] = None

class PredictionResponse(BaseModel):
    predicted_minutes: int
    predicted_time: int # For backward compatibility
    model_source: str
    confidence_interval: List[int]
    explanations: List[Dict[str, Any]]
    explanations_text: str
    confidence: float

class RoutineConfig(BaseModel):
    wake_up: str
    sleep: str
    daily_blocks: Optional[List[Dict]] = []

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

@app.post("/api/predict", response_model=PredictionResponse)
def api_predict(task: TaskInput):
    """
    Production-ready prediction endpoint.
    """
    # Create input dict (handle aliasing manually if needed, but pydantic helps)
    task_dict = task.dict(by_alias=True)
    
    # Ensure title_length is set if title is present but length is 0
    if task.title and not task.title_length:
        task_dict['title_length'] = len(task.title)
        
    # Predict
    # We use base_predictor. The user_id in init doesn't matter for base model usage.
    # Logic inside predict handles loading the correct model if we implemented user-switching logic.
    # Currently it defaults to base_pipeline if user model undefined.
    
    result = base_predictor.predict(task_dict)
    
    # Unpack
    predicted_minutes, confidence, explanations, text, source, interval = result
    
    return {
        "predicted_minutes": predicted_minutes,
        "predicted_time": predicted_minutes,
        "model_source": source,
        "confidence_interval": interval,
        "explanations": explanations,
        "explanations_text": text,
        "confidence": confidence
    }

# Legacy endpoint support
@app.post("/predict")
def legacy_predict(task: TaskInput):
    # Map to new structure
    return api_predict(task)

# ... (Schedule logic preserved) ...
# For brevity, I am re-implementing schedule logic from previous file viewing if needed?
# The prompt says: "Update and complete... Project files already present (work with or update them)"
# I should NOT delete existing schedule logic if it was there.
# I will use multi_replace or append, OR since I am overwriting `main.py` here, I must include the schedule logic.
# I'll check `main.py` content again to copy the schedule functions. 
# Re-reading Step 8 view of main.py shows `generate_schedule` and helper functions.
# I need to keep them.

def time_conflicts_with_routine(start_time: datetime, end_time: datetime, routine_blocks: List[RoutineBlock]) -> bool:
    """Check if a time slot conflicts with any routine block"""
    for block in routine_blocks:
        block_start = datetime.strptime(block.start_time, "%H:%M:%S")
        block_end = datetime.strptime(block.end_time, "%H:%M:%S")
        block_start = block_start.replace(year=start_time.year, month=start_time.month, day=start_time.day)
        block_end = block_end.replace(year=start_time.year, month=start_time.month, day=start_time.day)
        if start_time < block_end and end_time > block_start:
            return True
    return False

def find_next_available_slot(current_time: datetime, duration: int, sleep_time: datetime, routine_blocks: List[RoutineBlock]) -> Optional[datetime]:
    max_attempts = 100
    attempts = 0
    while attempts < max_attempts:
        attempts += 1
        end_time = current_time + timedelta(minutes=duration)
        if end_time > sleep_time:
            return None
        if not time_conflicts_with_routine(current_time, end_time, routine_blocks):
            return current_time
        for block in routine_blocks:
            block_end = datetime.strptime(block.end_time, "%H:%M:%S")
            block_end = block_end.replace(year=current_time.year, month=current_time.month, day=current_time.day)
            if current_time < block_end:
                current_time = block_end + timedelta(minutes=10)
                break
        else:
            current_time += timedelta(minutes=15)
    return None

def break_task_into_sessions(task: TaskItem) -> List[Dict]:
    duration = task.predicted_time
    task_deadline = datetime.fromisoformat(task.deadline) if task.deadline else None
    now = datetime.now()
    if task_deadline:
        days_available = max(1, (task_deadline - now).days + 1)
    else:
        days_available = min(7, max(3, duration // 30))
    sessions = []
    if duration <= 45:
        sessions.append({"duration": duration, "session_num": 1, "total_sessions": 1})
    else:
        optimal_session_length = 30
        num_sessions = max(2, min(days_available, (duration + optimal_session_length - 1) // optimal_session_length))
        minutes_per_session = duration // num_sessions
        remaining_minutes = duration % num_sessions
        for i in range(num_sessions):
            session_duration = minutes_per_session
            if i < remaining_minutes:
                session_duration += 1
            sessions.append({"duration": session_duration, "session_num": i + 1, "total_sessions": num_sessions})
    return sessions

@app.post("/schedule")
def generate_schedule(req: ScheduleRequest):
    wake_up = datetime.strptime(req.routine.wake_up, "%H:%M")
    sleep = datetime.strptime(req.routine.sleep, "%H:%M")
    current_time = datetime.now()
    wake_up_today = wake_up.replace(year=current_time.year, month=current_time.month, day=current_time.day)
    if current_time < wake_up_today:
        start_time = wake_up_today
    else:
        start_time = current_time
    start_time += timedelta(minutes=(15 - start_time.minute % 15) % 15)
    schedule = []
    sorted_tasks = sorted(req.tasks, key=lambda x: (x.priority != 'Urgent', x.deadline or '9999-12-31'))
    sleep_today = sleep.replace(year=start_time.year, month=start_time.month, day=start_time.day)
    
    for task in sorted_tasks:
        sessions = break_task_into_sessions(task)
        first_session = sessions[0]
        duration = first_session["duration"]
        available_slot = find_next_available_slot(start_time, duration, sleep_today, req.routine_blocks)
        if available_slot is None:
            continue
        start_time = available_slot
        end_time = start_time + timedelta(minutes=duration)
        session_title = f"{task.title} (Part {first_session['session_num']}/{first_session['total_sessions']})" if first_session["total_sessions"] > 1 else task.title
        schedule.append({
            "task_id": task.id,
            "title": session_title,
            "start": start_time.strftime("%I:%M %p"),
            "end": end_time.strftime("%I:%M %p"),
            "duration": duration,
            "session_info": {"session_num": first_session["session_num"], "total_sessions": first_session["total_sessions"], "is_multi_session": first_session["total_sessions"] > 1}
        })
        start_time = end_time + timedelta(minutes=10)
    return {"schedule": schedule}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
