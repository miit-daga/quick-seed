-- db/stress-test.sqlite.sql
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS organizations;

CREATE TABLE organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    subscription_level TEXT -- e.g., 'free', 'pro', 'enterprise'
);

CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    organization_id INTEGER NOT NULL,
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
);

CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_name TEXT NOT NULL,
    budget REAL, -- For floating point numbers
    is_active INTEGER DEFAULT 1,
    owner_id INTEGER NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users (id)
);

CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL, -- e.g., 'todo', 'in-progress', 'done'
    project_id INTEGER NOT NULL,
    assignee_id INTEGER, -- Nullable foreign key
    parent_task_id INTEGER, -- Nullable self-referencing foreign key
    metadata TEXT, -- For storing JSON
    FOREIGN KEY (project_id) REFERENCES projects (id),
    FOREIGN KEY (assignee_id) REFERENCES users (id),
    FOREIGN KEY (parent_task_id) REFERENCES tasks (id)
);