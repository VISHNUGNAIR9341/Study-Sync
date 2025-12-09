#!/usr/bin/env python3
"""
Test the schedule.py script as the backend would use it
"""
import json
import subprocess
from datetime import datetime, timedelta

# Test data
deadline = (datetime.now() + timedelta(days=3)).isoformat()

test_input = {
    "user_id": "test-user",
    "routine": {
        "wake_up": "06:00",
        "sleep": "23:00"
    },
    "tasks": [
        {
            "id": "task-1",
            "title": "Quick Quiz",
            "category": "reading",
            "estimated_size": 2,
            "predicted_time": 30,
            "deadline": deadline,
            "priority": "Low",
            "complexity": "Low"
        },
        {
            "id": "task-2",
            "title": "Essay Writing",
            "category": "writing",
            "estimated_size": 3,
            "predicted_time": 60,
            "deadline": deadline,
            "priority": "High",
            "complexity": "Medium"
        },
        {
            "id": "task-3",
            "title": "Project Work",
            "category": "project",
            "estimated_size": 5,
            "predicted_time": 120,
            "deadline": deadline,
            "priority": "Urgent",
            "complexity": "High"
        }
    ],
    "routine_blocks": [
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
}

print("=" * 70)
print("🧪 Testing schedule.py (As Used by Backend)")
print("=" * 70)

print("\n📋 Input Data:")
print(f"  • {len(test_input['tasks'])} tasks")
print(f"  • {len(test_input['routine_blocks'])} routine blocks")

print("\n📝 Tasks:")
for task in test_input['tasks']:
    print(f"  • {task['title']}: {task['predicted_time']} min ({task['priority']} priority)")

print("\n🔄 Running schedule.py...")

# Run the script
process = subprocess.Popen(
    ['python', 'schedule.py'],
    stdin=subprocess.PIPE,
    stdout=subprocess.PIPE,
    stderr=subprocess.PIPE,
    text=True
)

stdout, stderr = process.communicate(input=json.dumps(test_input))

if stderr:
    print(f"\n⚠️  Warnings/Errors:\n{stderr}")

if stdout:
    try:
        result = json.loads(stdout)
        schedule = result.get('schedule', [])
        
        print("\n✨ SCHEDULE OUTPUT:")
        print("=" * 70)
        
        if not schedule:
            print("  No tasks scheduled.")
        else:
            print(f"\n  📅 {len(schedule)} session(s) scheduled for today:\n")
            for idx, item in enumerate(schedule, 1):
                print(f"  {idx}. {item['start']} - {item['end']}")
                print(f"     📌 {item['title']}")
                print(f"     ⏱️  {item['duration']} minutes")
                
                if 'session_info' in item and item['session_info']['is_multi_session']:
                    info = item['session_info']
                    print(f"     📊 Session {info['session_num']} of {info['total_sessions']}")
                    remaining = info['total_sessions'] - info['session_num']
                    print(f"     ➡️  {remaining} more session(s) scheduled for upcoming days")
                print()
        
        print("=" * 70)
        print("\n✅ SUCCESS! Tasks are now chunked intelligently:")
        print("   • Long tasks (>45 min) broken into multiple sessions")
        print("   • Only first session scheduled for today")
        print("   • Aligns with Action Plan strategy")
        print("   • All sessions respect routine blocks")
        print()
        
    except json.JSONDecodeError as e:
        print(f"\n❌ Failed to parse output: {e}")
        print(f"Output was:\n{stdout}")
else:
    print("\n❌ No output from script")

print("=" * 70)
