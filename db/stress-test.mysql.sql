-- db/stress-test.mysql.sql
SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS tasks;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS organizations;
SET FOREIGN_KEY_CHECKS=1;

CREATE TABLE organizations (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `subscription_level` VARCHAR(50)
);

CREATE TABLE users (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `full_name` VARCHAR(255) NOT NULL,
    `organization_id` INT NOT NULL,
    FOREIGN KEY (`organization_id`) REFERENCES organizations(`id`)
);

CREATE TABLE projects (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `project_name` VARCHAR(255) NOT NULL,
    `budget` DECIMAL(10, 2),
    `is_active` BOOLEAN DEFAULT TRUE,
    `owner_id` INT NOT NULL,
    FOREIGN KEY (`owner_id`) REFERENCES users(`id`)
);

CREATE TABLE tasks (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT,
    `status` VARCHAR(50) NOT NULL,
    `project_id` INT NOT NULL,
    `assignee_id` INT,
    `parent_task_id` INT,
    `metadata` JSON,
    FOREIGN KEY (`project_id`) REFERENCES projects(`id`),
    FOREIGN KEY (`assignee_id`) REFERENCES users(`id`),
    FOREIGN KEY (`parent_task_id`) REFERENCES tasks(`id`)
);