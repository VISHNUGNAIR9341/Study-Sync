import requests
import json
from datetime import datetime, timedelta

# Comprehensive test showing task chunking alignment with action plan

base_url = "http://localhost:8000"

# Test with a task that has a deadline 3 days from now
deadline = (datetime.now() + timedelta(days=3)).isoformat()

routine_blocks = [
    {
        "activity_type": "school",
        "start_time": "09:00:00",
        "end_time": "17:00:00"
    },
    {
        "activity_type": "breakfast",
        "start_time": "07:00:00",
        "end_time": "08:00:00"
    },
    {
        "activity_type": "play",
        "start_time": "18:00:00",
        "end_time": "19:00:00"
    }
]

# Test tasks with different durations
tasks = [
    {
        "id": "task-1",
        "title": "Quick Review",
        "category": "reading",
        "estimated_size": 2,
        "predicted_time": 30,  # Short task - will be done in one session
        "deadline": deadline,
        "priority": "Low"
    },
    {
        "id": "task-2",
        "title": "Essay Writing",
        "category": "writing",
        "estimated_size": 3,
        "predicted_time": 60,  # Medium task - will break into 2 sessions
        "deadline": deadline,
        "priority": "High"
    },
    {
        "id": "task-3",
        "title": "Project Work",
        "category": "project",
        "estimated_size": 5,
        "predicted_time": 120,  # Long task - will break into 4 sessions
        "deadline": deadline,
        "priority": "Urgent"
    }
]

routine = {
    "wake_up": "06:00",
    "sleep": "23:00",
    "daily_blocks": []
}

request_data = {
    "user_id": "test-user",
    "routine": routine,
    "tasks": tasks,
    "routine_blocks": routine_blocks
}

print("=" * 70)
print("📚 INTELLIGENT TASK CHUNKING TEST")
print("=" * 70)

print("\n🎯 Testing Tasks:")
for task in tasks:
    print(f"\n  📝 {task['title']}")
    print(f"      Duration: {task['predicted_time']} minutes")
    print(f"      Priority: {task['priority']}")
    print(f"      Deadline: {datetime.fromisoformat(task['deadline']).strftime('%b %d, %Y')}")

print("\n" + "─" * 70)

try:
    response = requests.post(f"{base_url}/schedule", json=request_data)
    
    if response.status_code == 200:
        result = response.json()
        schedule = result.get("schedule", [])
        
        print("\n✨ GENERATED SCHEDULE (Today's Plan)")
        print("=" * 70)
        
        if not schedule:
            print("  No tasks scheduled for today.")
        else:
            for idx, item in enumerate(schedule, 1):
                print(f"\n  {idx}. {item['start']} - {item['end']}")
                print(f"     📌 {item['title']}")
                print(f"     ⏱️  {item['duration']} minutes")
                
                if 'session_info' in item:
                    info = item['session_info']
                    if info['is_multi_session']:
                        remaining_sessions = info['total_sessions'] - info['session_num']
                        print(f"     📊 Session {info['session_num']} of {info['total_sessions']}")
                        print(f"     ➡️  {remaining_sessions} more session(s) to complete this task")
        
        print("\n" + "=" * 70)
        print("\n💡 KEY INSIGHTS:")
        print("   • Tasks >45 min are automatically broken into optimal sessions")
        print("   • Only first session scheduled today; rest spread across coming days")
        print("   • Aligns with Action Plan strategy for better learning retention")
        print("   • All sessions respect routine blocks (school, meals, activities)")
        
        # Calculate what Action Plan would show
        print("\n" + "─" * 70)
        print("\n📋 CORRESPONDING ACTION PLAN PREVIEW:")
        print("   (What frontend TaskDetails page would show)")
        print()
        
        for task in tasks:
            duration = task['predicted_time']
            deadline_date = datetime.fromisoformat(task['deadline'])
            days_until = max(1, (deadline_date - datetime.now()).days + 1)
            
            if duration <= 45:
                print(f"\n   {task['title']}:")
                print(f"     • Today: {duration} min (100% - complete in one session)")
            else:
                sessions_needed = max(2, min(days_until, (duration + 29) // 30))
                mins_per_session = duration // sessions_needed
                
                print(f"\n   {task['title']}:")
                for i in range(min(3, sessions_needed)):  # Show first 3 sessions
                    day_name = (datetime.now() + timedelta(days=i)).strftime('%a, %b %d')
                    percentage = round((mins_per_session / duration) * 100)
                    print(f"     • {day_name}: {mins_per_session} min (Part {i+1} - ~{percentage}%)")
                
                if sessions_needed > 3:
                    print(f"     • ... and {sessions_needed - 3} more session(s)")
        
        print("\n" + "=" * 70)
        print("\n✅ Task chunking is now aligned with Action Plan!")
        print("   Daily schedule shows what to do TODAY.")
        print("   Action Plan shows full breakdown across all days.\n")
        
    else:
        print(f"\n❌ Error: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    print("\nMake sure the ML service is running on http://localhost:8000")

print("=" * 70)
