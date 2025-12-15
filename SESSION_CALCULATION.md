# 📊 How Session Count is Calculated

## Not a Default - It's Smart!

The number of sessions is **NOT fixed at 6**. It's **intelligently calculated** based on:
1. **Task duration** (how long the task takes)
2. **Days until deadline**
3. **Optimal session length** (30 minutes for best retention)

---

## 🧮 The Formula

```python
if duration <= 45 minutes:
    sessions = 1  # Short task, do in one go
else:
    optimal_session_length = 30 minutes
    
    # Calculate based on 30-min chunks
    sessions_needed = ceil(duration / 30)
    
    # But cap at days available
    num_sessions = max(2, min(days_available, sessions_needed))
```

---

## 📈 Examples

### Task: **60 minutes**, Deadline: **3 days**

```
Duration = 60 min
Optimal chunks = 60 / 30 = 2 sessions
Days available = 3

num_sessions = max(2, min(3, 2)) = 2 sessions ✅

Result: 2 parts (30 min each)
```

### Task: **180 minutes**, Deadline: **7 days**

```
Duration = 180 min
Optimal chunks = 180 / 30 = 6 sessions
Days available = 7

num_sessions = max(2, min(7, 6)) = 6 sessions ✅

Result: 6 parts (30 min each)
```

### Task: **180 minutes**, Deadline: **3 days**

```
Duration = 180 min
Optimal chunks = 180 / 30 = 6 sessions
Days available = 3

num_sessions = max(2, min(3, 6)) = 3 sessions ✅

Result: 3 parts (60 min each)
```

### Task: **300 minutes**, Deadline: **10 days**

```
Duration = 300 min
Optimal chunks = 300 / 30 = 10 sessions
Days available = 10

num_sessions = max(2, min(10, 10)) = 10 sessions ✅

Result: 10 parts (30 min each)
```

---

## 🎯 Why You're Seeing 6 Sessions

If you're seeing **6 sessions**, it means:

### Scenario 1: Long Task
```
Your task ≈ 180 minutes (3 hours)
Deadline: 6+ days away
→ 180 / 30 = 6 sessions
```

### Scenario 2: Deadline Limit
```
Your task > 180 minutes
Deadline: EXACTLY 6 days away
→ Capped at 6 sessions (one per day)
```

---

## 🔧 How to Control Session Count

### Want FEWER Sessions (Longer sessions)?

**Option 1: Reduce Task Duration**
- Lower the estimated time
- Fewer minutes = Fewer 30-min chunks

**Option 2: Shorter Deadline**
- Set deadline closer
- Fewer days = Fewer possible sessions
- Sessions will be longer to fit

**Example:**
```
Task: 180 min
Deadline: 2 days
→ 2 sessions of 90 min each
```

### Want MORE Sessions (Shorter sessions)?

**Option 1: Increase Task Duration**
- Estimate more time needed
- More minutes = More 30-min chunks

**Option 2: Longer Deadline**
- Set deadline further out
- More days = More sessions possible
- Sessions stay optimal (30 min)

**Example:**
```
Task: 180 min
Deadline: 10 days
→ 6 sessions of 30 min each
```

---

## 🧠 The Science Behind 30 Minutes

### Why 30-minute sessions?

**Educational Psychology:**
- ✅ Optimal attention span: 20-45 minutes
- ✅ Best for information retention
- ✅ Prevents mental fatigue
- ✅ Allows for spaced repetition

**Brain Science:**
- After 30-45 min: cognitive performance drops
- Short breaks improve long-term memory
- Distributed practice > Massed practice

---

## 📊 Session Calculation Table

| Duration | Deadline | Sessions | Per Session | Logic |
|----------|----------|----------|-------------|-------|
| 30 min | Any | **1** | 30 min | Short task |
| 60 min | 3+ days | **2** | 30 min | Optimal chunks |
| 90 min | 3+ days | **3** | 30 min | Optimal chunks |
| 120 min | 4+ days | **4** | 30 min | Optimal chunks |
| 150 min | 5+ days | **5** | 30 min | Optimal chunks |
| 180 min | 6+ days | **6** | 30 min | Optimal chunks |
| 180 min | 2 days | **2** | 90 min | Capped by deadline |
| 300 min | 10 days | **10** | 30 min | Optimal chunks |
| 300 min | 5 days | **5** | 60 min | Capped by deadline |

---

## 🎮 Try It Yourself

### Test 1: Short Task
```
Create task:
  Title: "Quick Review"
  Duration: 30 min
  Deadline: Tomorrow

Expected: 1 session (30 min)
```

### Test 2: Medium Task
```
Create task:
  Title: "Chapter Reading"
  Duration: 90 min
  Deadline: 3 days

Expected: 3 sessions (30 min each)
```

### Test 3: Long Task
```
Create task:
  Title: "Project Work"
  Duration: 180 min
  Deadline: 6 days

Expected: 6 sessions (30 min each)
```

### Test 4: Tight Deadline
```
Create task:
  Title: "Essay Writing"
  Duration: 120 min
  Deadline: Tomorrow

Expected: 2 sessions (60 min each)
```

---

## 🔍 Check Your Task

To see why YOUR task has X sessions:

1. **Check task duration** - How many minutes?
2. **Check deadline** - How many days away?
3. **Apply formula:**
   ```
   Ideal sessions = duration / 30
   Actual sessions = min(ideal, days_available)
   (minimum 2 if duration > 45)
   ```

---

## 💡 Tips

### For Better Learning:
- ✅ **Keep sessions ≈ 30 min** (most effective)
- ✅ **Spread over multiple days** (spaced repetition)
- ✅ **Don't cram** (avoid 1-2 giant sessions)

### For Time Management:
- Set realistic deadlines
- Let the system optimize session length
- Trust the 30-minute sweet spot

---

## ✅ Summary

**Sessions are NOT a default**. They're calculated by:

```
Sessions = min(days_until_deadline, ceil(duration / 30))
(With minimum of 2 for tasks > 45 min)
```

**Examples:**
- 60 min task, 3 days → **2 sessions** (30 min each)
- 180 min task, 6 days → **6 sessions** (30 min each)
- 180 min task, 2 days → **2 sessions** (90 min each)

**The system optimizes for:**
- ✅ Brain science (30-min chunks)
- ✅ Your deadline
- ✅ Realistic daily sessions

**You're seeing 6 because:** Your task is likely ~180 minutes with 6+ days until deadline!
