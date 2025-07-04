-- db/schema.mysql.sql

-- Set a safe mode to allow dropping tables with foreign keys
SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS=1;


CREATE TABLE users (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `full_name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `created_at` DATETIME NOT NULL
);


CREATE TABLE posts (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT,
    `published` BOOLEAN NOT NULL,
    `user_id` INT NOT NULL,
    FOREIGN KEY (`user_id`) REFERENCES users(`id`)
);