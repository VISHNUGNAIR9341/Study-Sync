import sys
import json
from datetime import datetime, timedelta

def parse_time(time_str):
    """Parse time string to datetime object"""
    # Handle HH:MM:SS format from database
    if isinstance(time_str, str) and len(time_str) > 5:
        time_str = time_str[:5]
    return datetime.strptime(time_str, "%H:%M")

def time_to_minutes(time_obj):
    """Convert time to minutes since midnight"""
    return time_obj.hour * 60 + time_obj.minute

def minutes_to_time(minutes):
    """Convert minutes since midnight to time string"""
    hours = minutes // 60
    mins = minutes % 60
    return f"{hours:02d}:{mins:02d}"

def get_free_slots(wake_up_str, sleep_str, routine_blocks):
    """
    Calculate free time slots by excluding routine blocks from wake-sleep period
    Returns list of (start_minutes, end_minutes) tuples
    """
    wake_up = parse_time(wake_up_str)
    sleep = parse_time(sleep_str)
    
    wake_minutes = time_to_minutes(wake_up)
    sleep_minutes = time_to_minutes(sleep)
    
    # Create list of busy periods from routine blocks
    busy_periods = []
    for block in routine_blocks:
        start = time_to_minutes(parse_time(block['start_time']))
        end = time_to_minutes(parse_time(block['end_time']))
        busy_periods.append((start, end))
    
    # Sort busy periods by start time
    busy_periods.sort()
    
    # Find free slots
    free_slots = []
    current_time = wake_minutes
    
    for busy_start, busy_end in busy_periods:
        # If there's a gap before this busy period
        if current_time < busy_start:
            free_slots.append((current_time, busy_start))
        # Move current time to end of busy period
        current_time = max(current_time, busy_end)
    
    # Add remaining time after last busy period
    if current_time < sleep_minutes:
        free_slots.append((current_time, sleep_minutes))
    
    return free_slots

def schedule():
    try:
        # Read input from stdin
        input_data = sys.stdin.read()
        if not input_data:
            return
            
        data = json.loads(input_data)
        routine = data.get('routine', {})
        tasks = data.get('tasks', [])
        routine_blocks = data.get('routine_blocks', [])
        
        # Get wake up and sleep times
        wake_up_str = routine.get('wake_up', '07:00')
        sleep_str = routine.get('sleep', '23:00')
        
        # Get free time slots
        free_slots = get_free_slots(wake_up_str, sleep_str, routine_blocks)
        
        # Sort tasks by priority and deadline
        sorted_tasks = sorted(
            tasks, 
            key=lambda x: (
                x.get('priority') != 'Urgent',
                x.get('priority') != 'High',
                x.get('deadline') or '9999-12-31'
            )
        )
        
        schedule_list = []
        
        # Schedule tasks in free slots
        for task in sorted_tasks:
            duration = task.get('predicted_time', 30)
            task_scheduled = False
            
            # Try to fit task in available free slots
            for i, (slot_start, slot_end) in enumerate(free_slots):
                slot_duration = slot_end - slot_start
                
                # Check if task fits in this slot (with 10 min buffer)
                if slot_duration >= duration + 10:
                    # Schedule the task
                    task_start_minutes = slot_start
                    task_end_minutes = slot_start + duration
                    
                    schedule_list.append({
                        "task_id": task.get('id'),
                        "title": task.get('title'),
                        "start": minutes_to_time(task_start_minutes),
                        "end": minutes_to_time(task_end_minutes),
                        "duration": duration
                    })
                    
                    # Update the free slot (reduce it or remove it)
                    new_slot_start = task_end_minutes + 10  # 10 min break
                    if new_slot_start < slot_end:
                        free_slots[i] = (new_slot_start, slot_end)
                    else:
                        free_slots.pop(i)
                    
                    task_scheduled = True
                    break
            
            # If task couldn't be scheduled, skip it
            if not task_scheduled:
                print(json.dumps({
                    "warning": f"Could not schedule task '{task.get('title')}' - no free slots available",
                    "schedule": schedule_list
                }), file=sys.stderr)
        
        print(json.dumps({"schedule": schedule_list}))
        
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    schedule()
