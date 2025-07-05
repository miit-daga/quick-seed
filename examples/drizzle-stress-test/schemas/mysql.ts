// examples/drizzle-stress-test/schemas/mysql.ts
import { mysqlTable, serial, varchar, int, json, unique } from 'drizzle-orm/mysql-core';
import { relations } from 'drizzle-orm';

export const organizations = mysqlTable('organizations', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull().unique(),
});

export const users = mysqlTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
});

export const projects = mysqlTable('projects', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  organizationId: int('organization_id').notNull().references(() => organizations.id),
});

export const tasks = mysqlTable('tasks', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  projectId: int('project_id').notNull().references(() => projects.id),
  assigneeId: int('assignee_id').references(() => users.id),
  parentTaskId: int('parent_task_id'),
  metadata: json('metadata'),
});

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  projects: many(projects),
}));

export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [projects.organizationId],
    references: [organizations.id],
  }),
  tasks: many(tasks),
}));

// This part correctly defines the self-referencing relationship
export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, {
    fields: [tasks.projectId],
    references: [projects.id],
  }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
  }),
  parentTask: one(tasks, {
    fields: [tasks.parentTaskId],
    references: [tasks.id],
    relationName: 'TaskToTask',
  }),
  subTasks: many(tasks, {
    relationName: 'TaskToTask',
  }),
}));

export const mysqlSchema = {
  organizations,
  users,
  projects,
  tasks,
  organizationsRelations,
  usersRelations,
  projectsRelations,
  tasksRelations,
};