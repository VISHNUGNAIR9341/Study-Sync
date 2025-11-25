import csv
import random

categories = ['writing', 'reading', 'problem_solving', 'project', 'revision', 'presentation']
priorities = ['Low', 'Medium', 'High', 'Urgent']
complexities = ['Low', 'Medium', 'High']
times_of_day = ['morning', 'afternoon', 'evening']
days_of_week = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

def generate_row():
    category = random.choice(categories)
    priority = random.choice(priorities)
    complexity = random.choice(complexities)
    
    # Base time in minutes
    base_time = 30
    
    # Category multiplier
    cat_mult = {
        'writing': 1.5, 'reading': 1.0, 'problem_solving': 2.0, 
        'project': 3.0, 'revision': 1.2, 'presentation': 2.5
    }
    
    # Priority multiplier (Urgent tasks might be rushed or take longer due to stress, let's say they take longer)
    pri_mult = {'Low': 0.8, 'Medium': 1.0, 'High': 1.2, 'Urgent': 1.4}
    
    # Complexity multiplier
    comp_mult = {'Low': 0.7, 'Medium': 1.0, 'High': 1.5}
    
    # Specific features
    num_pages = 0
    num_slides = 0
    num_questions = 0
    
    feature_impact = 0
    
    if category == 'reading':
        num_pages = random.randint(5, 50)
        feature_impact = num_pages * 2  # 2 mins per page
    elif category == 'problem_solving' or category == 'revision':
        num_questions = random.randint(5, 30)
        feature_impact = num_questions * 5 # 5 mins per question
    elif category == 'presentation':
        num_slides = random.randint(5, 20)
        feature_impact = num_slides * 10 # 10 mins per slide
    elif category == 'writing':
        # Maybe pages implies length of essay
        num_pages = random.randint(1, 10)
        feature_impact = num_pages * 15 # 15 mins per page
    
    # Estimated size (1-5 scale) still kept for backward compatibility or general size
    estimated_size = random.uniform(1.0, 5.0)
    
    # Calculate actual time
    # Formula: (Base + Feature Impact) * Priority * Complexity * Random Noise
    
    raw_time = (base_time + feature_impact) * pri_mult[priority] * comp_mult[complexity]
    
    # Add some randomness (+/- 20%)
    actual_time = int(raw_time * random.uniform(0.8, 1.2))
    
    return [
        category,
        f"{estimated_size:.1f}",
        random.randint(10, 50), # title_length
        priority,
        random.choice(times_of_day),
        random.choice(days_of_week),
        random.randint(1, 5), # user_experience
        complexity,
        num_pages,
        num_slides,
        num_questions,
        actual_time
    ]

header = [
    'category', 'estimated_size', 'title_length', 'priority', 'time_of_day', 
    'day_of_week', 'user_experience_level', 'complexity', 'num_pages', 
    'num_slides', 'num_questions', 'actual_time_minutes'
]

with open('training_data.csv', 'w', newline='') as f:
    writer = csv.writer(f)
    writer.writerow(header)
    for _ in range(1000): # Generate 1000 rows
        writer.writerow(generate_row())

print("Generated new training_data.csv with 1000 rows.")
