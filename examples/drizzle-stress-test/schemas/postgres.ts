// examples/drizzle-stress-test/schemas/postgres.ts
import { pgTable, serial, text, integer, json, unique } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const organizations = pgTable('organizations', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
});

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
});

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  organizationId: integer('organization_id').notNull().references(() => organizations.id),
});

export const tasks = pgTable('tasks', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  projectId: integer('project_id').notNull().references(() => projects.id),
  assigneeId: integer('assignee_id').references(() => users.id),
  parentTaskId: integer('parent_task_id'),
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

export const postgresSchema = {
  organizations,
  users,
  projects,
  tasks,
  organizationsRelations,
  usersRelations,
  projectsRelations,
  tasksRelations,
};