CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id TEXT UNIQUE,
    password TEXT,
    name TEXT NOT NULL,
    points INT DEFAULT 0,
    streak INT DEFAULT 0,
    routine_config JSONB DEFAULT '{}',
    ml_profile JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    estimated_size FLOAT,
    default_expected_time INT,
    ml_predicted_time INT,
    priority TEXT CHECK (priority IN ('Low', 'Medium', 'High', 'Urgent')),
    complexity TEXT CHECK (complexity IN ('Low', 'Medium', 'High')),
    num_pages INT,
    num_slides INT,
    num_questions INT,
    manual_time INT,
    progress INT DEFAULT 0,
    deadline TIMESTAMP,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'In-Progress', 'Completed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    duration_minutes INT,
    accuracy_score FLOAT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS routine_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    days TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS task_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    task_id UUID,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    priority TEXT,
    status TEXT NOT NULL,
    actual_time INT,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_task_history_user ON task_history(user_id);
CREATE INDEX IF NOT EXISTS idx_task_history_status ON task_history(status);
