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
    """Convert minutes since midnight to time string (12-hour format)"""
    hours = minutes // 60
    mins = minutes % 60
    
    period = "AM"
    if hours >= 12:
        period = "PM"
    
    if hours > 12:
        hours -= 12
    elif hours == 0:
        hours = 12
        
    return f"{hours:02d}:{mins:02d} {period}"

def get_free_slots(wake_up_str, sleep_str, routine_blocks):
    """
    Calculate free time slots by excluding routine blocks from wake-sleep period
    Returns list of (start_minutes, end_minutes) tuples
    """
    wake_up = parse_time(wake_up_str)
    sleep = parse_time(sleep_str)
    
    wake_minutes = time_to_minutes(wake_up)
    sleep_minutes = time_to_minutes(sleep)
    
    # Preprocess routine blocks to handle midnight wrapping
    processed_blocks = []
    for block in routine_blocks:
        start = time_to_minutes(parse_time(block['start_time']))
        end = time_to_minutes(parse_time(block['end_time']))
        
        if end < start:
            # Split into two blocks: start->midnight and midnight->end
            processed_blocks.append((start, 24 * 60)) 
            processed_blocks.append((0, end))         
        else:
            processed_blocks.append((start, end))
    
    # Sort busy periods by start time
    processed_blocks.sort()
    
    # Find free slots
    free_slots = []
    current_time = wake_minutes
    
    for busy_start, busy_end in processed_blocks:
        # If block ends before current time, skip it
        if busy_end <= current_time:
            continue
            
        # If block starts after current time, we have a gap
        if current_time < busy_start:
            # The gap ends at the start of the busy period, or sleep time, whichever is earlier
            gap_end = min(busy_start, sleep_minutes)
            
            # Only add if it's a valid positive duration
            if current_time < gap_end:
                free_slots.append((current_time, gap_end))
        
        # Advance current time to end of busy period
        current_time = max(current_time, busy_end)
        
        # If we passed sleep time, stop
        if current_time >= sleep_minutes:
            break
    
    # Add remaining time after last busy period
    if current_time < sleep_minutes:
        free_slots.append((current_time, sleep_minutes))
    
    return free_slots

def break_task_into_sessions(task):
    """
    Break a task into sessions - one session per day until deadline.
    Distributes work evenly across all available days.
    """
    duration = task.get('predicted_time', 30)
    deadline_str = task.get('deadline')
    
    print(f"DEBUG: Task '{task.get('title')}', deadline_str='{deadline_str}'", file=sys.stderr, flush=True)
    
    # Calculate days until deadline
    if deadline_str:
        try:
            import math
            
            # Parse deadline - try ISO format and common formats
            task_deadline = None
            
            # Try ISO format first (most common from frontend)
            try:
                task_deadline = datetime.fromisoformat(deadline_str.replace('Z', '+00:00'))
            except:
                pass
            
            # Try parsing YYYY-MM-DD format
            if not task_deadline:
                try:
                    task_deadline = datetime.strptime(deadline_str.split('T')[0], '%Y-%m-%d')
                except:
                    pass
            
            if not task_deadline:
                raise ValueError(f"Could not parse deadline: {deadline_str}")
            
            # Make both timezone-naive for comparison
            if task_deadline.tzinfo is not None:
                task_deadline = task_deadline.replace(tzinfo=None)
            
            now = datetime.now()
            if now.tzinfo is not None:
                now = now.replace(tzinfo=None)
            
            # Match frontend: Math.ceil((deadline - now) / (1000 * 60 * 60 * 24))
            time_difference_seconds = (task_deadline - now).total_seconds()
            days_available = max(1, math.ceil(time_difference_seconds / 86400))
            
            print(f"DEBUG: Deadline={deadline_str}, Days={days_available}", file=sys.stderr, flush=True)
        except Exception as e:
            print(f"ERROR parsing deadline '{deadline_str}': {e}", file=sys.stderr, flush=True)
            # Default to 2 days if parsing fails
            days_available = 2
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
        # Divide by days - one session per day
        num_sessions = max(2, days_available)
        
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
        
        print(f"DEBUG: Received {len(sorted_tasks)} tasks to schedule", file=sys.stderr, flush=True)
        print(f"DEBUG: Available free slots: {len(free_slots)}", file=sys.stderr, flush=True)
        
        # Schedule tasks in free slots
        for task in sorted_tasks:
            # Break task into optimal sessions
            sessions = break_task_into_sessions(task)
            
            # For today, only schedule the first session (or full task if single session)
            first_session = sessions[0]
            duration = first_session["duration"]
            complexity = task.get('complexity', 'Medium')
            task_scheduled = False
            
            best_slot_index = -1
            best_slot_score = -float('inf')
            
            # Evaluate all available free slots
            for i, (slot_start, slot_end) in enumerate(free_slots):
                slot_duration = slot_end - slot_start
                
                # Check if task fits in this slot (with 10 min buffer)
                if slot_duration >= duration + 10:
                    # Calculate score for this slot
                    score = 0
                    
                    # 1. Time of Day Preference
                    # Morning (06:00 - 12:00): High Energy -> Good for High Complexity / Urgent
                    # Afternoon (12:00 - 17:00): Medium Energy -> Good for Medium Complexity
                    # Evening (17:00 - 22:00): Low Energy -> Good for Low Complexity / Reading
                    
                    slot_hour = (slot_start // 60)
                    
                    if 6 <= slot_hour < 12: # Morning
                        if complexity == 'High' or task.get('priority') == 'Urgent':
                            score += 10
                        elif complexity == 'Low':
                            score -= 5
                    elif 12 <= slot_hour < 17: # Afternoon
                        if complexity == 'Medium':
                            score += 5
                    elif 17 <= slot_hour < 22: # Evening
                        if complexity == 'Low':
                            score += 10
                        elif complexity == 'High':
                            score -= 5
                            
                    # 2. Tight Fit Bonus (Minimize wasted small gaps)
                    # If the task fits perfectly or leaves a small gap, that's good.
                    # If it leaves a huge gap, maybe save that for a bigger task?
                    # Actually, we want to prioritize slots where it fits well.
                    # But for now, let's just prioritize earlier slots slightly to break ties
                    score -= (slot_start / 1440) * 2 # Slight penalty for later slots
                    
                    if score > best_slot_score:
                        best_slot_score = score
                        best_slot_index = i
            
            # If we found a valid slot
            if best_slot_index != -1:
                slot_start, slot_end = free_slots[best_slot_index]
                
                # Schedule the task
                task_start_minutes = slot_start
                task_end_minutes = slot_start + duration
                
                # Create session title
                task_title = task.get('title')
                if first_session["total_sessions"] > 1:
                    session_title = f"{task_title} (Part {first_session['session_num']}/{first_session['total_sessions']})"
                else:
                    session_title = task_title
                
                schedule_list.append({
                    "task_id": task.get('id'),
                    "title": session_title,
                    "start": minutes_to_time(task_start_minutes),
                    "end": minutes_to_time(task_end_minutes),
                    "duration": duration,
                    "session_info": {
                        "session_num": first_session["session_num"],
                        "total_sessions": first_session["total_sessions"],
                        "is_multi_session": first_session["total_sessions"] > 1
                    }
                })
                
                # Update the free slot (reduce it or remove it)
                new_slot_start = task_end_minutes + 10  # 10 min break
                if new_slot_start < slot_end:
                    free_slots[best_slot_index] = (new_slot_start, slot_end)
                else:
                    free_slots.pop(best_slot_index)
                
                task_scheduled = True
            
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
