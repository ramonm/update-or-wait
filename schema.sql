-- Drop existing tables
DROP TABLE IF EXISTS user_votes;
DROP TABLE IF EXISTS votes;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS updates;

-- Create simplified tables
CREATE TABLE updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    up_votes INTEGER DEFAULT 0,
    down_votes INTEGER DEFAULT 0,
    verdict TEXT DEFAULT 'WAIT',
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial data
INSERT INTO updates (name, up_votes, down_votes, verdict) VALUES 
    ('iOS 18', 856, 234, 'UPDATE'),
    ('iOS 17', 2456, 342, 'UPDATE'),
    ('Windows 11', 445, 678, 'WAIT'),
    ('Android 14', 567, 123, 'UPDATE'),
    ('macOS Sonoma', 789, 156, 'UPDATE');