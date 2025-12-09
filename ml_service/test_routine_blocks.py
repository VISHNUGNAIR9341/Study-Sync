import requests
import json
from datetime import datetime

# Test the updated ML service with routine blocks

base_url = "http://localhost:8000"

# Define test data matching your example
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

# Test tasks
tasks = [
    {
        "id": "4591abbc-d41d-4e5f-8061-f6f7afbe095d",
        "title": "nn",
        "category": "reading",
        "estimated_size": 2,
        "predicted_time": 10,
        "deadline": None,
        "priority": "Medium"
    },
    {
        "id": "fd5e87e7-ec7b-425b-a86a-dea4d956ec46",
        "title": "Eassy",
        "category": "writing",
        "estimated_size": 3,
        "predicted_time": 60,
        "deadline": None,
        "priority": "High"
    }
]

# Routine config
routine = {
    "wake_up": "06:00",
    "sleep": "23:00",
    "daily_blocks": []
}

# Prepare request
request_data = {
    "user_id": "test-user",
    "routine": routine,
    "tasks": tasks,
    "routine_blocks": routine_blocks
}

print("=" * 60)
print("Testing ML Service with Routine Blocks")
print("=" * 60)
print("\n📅 Routine Blocks:")
for block in routine_blocks:
    print(f"  • {block['activity_type']}: {block['start_time']} - {block['end_time']}")

print("\n📝 Tasks to Schedule:")
for task in tasks:
    print(f"  • {task['title']}: {task['predicted_time']} minutes")

print("\n🔄 Sending request to ML service...")

try:
    response = requests.post(f"{base_url}/schedule", json=request_data)
    
    if response.status_code == 200:
        result = response.json()
        schedule = result.get("schedule", [])
        
        print("\n✅ Schedule Generated Successfully!")
        print("\n📊 Generated Schedule:")
        print("-" * 60)
        
        for item in schedule:
            print(f"  {item['start']} - {item['end']} | {item['title']} ({item['duration']} min)")
        
        # Validate schedule doesn't conflict with routine blocks
        print("\n🔍 Validation:")
        conflicts = []
        
        for item in schedule:
            # Parse times (12-hour format)
            start = datetime.strptime(item['start'], "%I:%M %p")
            end = datetime.strptime(item['end'], "%I:%M %p")
            
            # Check against routine blocks
            for block in routine_blocks:
                block_start = datetime.strptime(block['start_time'], "%H:%M:%S")
                block_end = datetime.strptime(block['end_time'], "%H:%M:%S")
                
                # Check for overlap
                if start.time() < block_end.time() and end.time() > block_start.time():
                    conflicts.append(f"  ❌ {item['title']} conflicts with {block['activity_type']}")
        
        if conflicts:
            print("\n".join(conflicts))
            print("\n⚠️  FAILED: Schedule has conflicts with routine blocks!")
        else:
            print("  ✅ No conflicts detected!")
            print("  ✅ All tasks scheduled in available time slots!")
            print("\n🎉 SUCCESS: Schedule respects action plan!")
    else:
        print(f"\n❌ Error: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"\n❌ Error: {str(e)}")
    print("\nMake sure the ML service is running on http://localhost:8000")

print("\n" + "=" * 60)
