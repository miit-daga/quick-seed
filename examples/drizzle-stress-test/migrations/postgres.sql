-- PostgreSQL Migration Script
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL
);

CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    organization_id INTEGER NOT NULL REFERENCES organizations(id)
);

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    project_id INTEGER NOT NULL REFERENCES projects(id),
    assignee_id INTEGER REFERENCES users(id),
    parent_task_id INTEGER REFERENCES tasks(id),
    metadata JSONB
);



