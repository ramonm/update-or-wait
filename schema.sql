-- schema.sql
DROP TABLE IF EXISTS updates;

CREATE TABLE updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    up_votes INTEGER DEFAULT 0,
    down_votes INTEGER DEFAULT 0,
    verdict TEXT DEFAULT 'WAIT',
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Initial seed data
INSERT INTO updates (name, up_votes, down_votes, verdict) VALUES
    ('ios 18', 856, 234, 'UPDATE'),
    ('ios 17', 756, 134, 'UPDATE'),
    ('windows 11', 445, 678, 'WAIT'),
    ('android 14', 567, 123, 'UPDATE'),
    ('macos sonoma', 789, 156, 'UPDATE');