import sys
import json
from schedule import create_schedule

# Dummy data
data = {
    "user_id": "123",
    "routine": {},
    "tasks": [
        {"id": "1", "title": "Task 1", "estimated_size": 1, "predicted_time": 30, "priority": "High", "deadline": None},
        {"id": "2", "title": "Task 2", "estimated_size": 1, "predicted_time": 45, "priority": "Medium", "deadline": None}
    ],
    "routine_blocks": [
        {"activity_type": "Class", "start_time": "09:00", "end_time": "10:00"}
    ]
}

try:
    schedule = create_schedule(data['user_id'], data['routine'], data['tasks'], data['routine_blocks'])
    print(json.dumps({"schedule": schedule}, indent=2))
except Exception as e:
    print(f"Error: {e}")
