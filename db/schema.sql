-- db/schema.sql

-- Drop tables if they exist to ensure a fresh start
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS users;

-- Create the users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fullName TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    createdAt TEXT NOT NULL
);

-- Create the posts table with a foreign key to users
CREATE TABLE posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    published BOOLEAN NOT NULL,
    userId INTEGER NOT NULL,
    FOREIGN KEY (userId) REFERENCES users (id)
);