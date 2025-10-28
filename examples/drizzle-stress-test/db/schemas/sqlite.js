"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sqliteSchema = exports.tasksRelations = exports.projectsRelations = exports.usersRelations = exports.organizationsRelations = exports.tasks = exports.projects = exports.users = exports.organizations = void 0;
// examples/drizzle-stress-test/schemas/sqlite.ts
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.organizations = (0, sqlite_core_1.sqliteTable)('organizations', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    name: (0, sqlite_core_1.text)('name').notNull().unique(),
});
exports.users = (0, sqlite_core_1.sqliteTable)('users', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    email: (0, sqlite_core_1.text)('email').notNull().unique(),
    fullName: (0, sqlite_core_1.text)('full_name').notNull(),
});
exports.projects = (0, sqlite_core_1.sqliteTable)('projects', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    name: (0, sqlite_core_1.text)('name').notNull(),
    organizationId: (0, sqlite_core_1.integer)('organization_id').notNull().references(() => exports.organizations.id),
});
exports.tasks = (0, sqlite_core_1.sqliteTable)('tasks', {
    id: (0, sqlite_core_1.integer)('id').primaryKey({ autoIncrement: true }),
    title: (0, sqlite_core_1.text)('title').notNull(),
    projectId: (0, sqlite_core_1.integer)('project_id').notNull().references(() => exports.projects.id),
    assigneeId: (0, sqlite_core_1.integer)('assignee_id').references(() => exports.users.id),
    parentTaskId: (0, sqlite_core_1.integer)('parent_task_id'),
    metadata: (0, sqlite_core_1.text)('metadata'), // JSON stored as text in SQLite
});
// Relations
exports.organizationsRelations = (0, drizzle_orm_1.relations)(exports.organizations, ({ many }) => ({
    projects: many(exports.projects),
}));
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many }) => ({
    tasks: many(exports.tasks),
}));
exports.projectsRelations = (0, drizzle_orm_1.relations)(exports.projects, ({ one, many }) => ({
    organization: one(exports.organizations, {
        fields: [exports.projects.organizationId],
        references: [exports.organizations.id],
    }),
    tasks: many(exports.tasks),
}));
// This part correctly defines the self-referencing relationship
exports.tasksRelations = (0, drizzle_orm_1.relations)(exports.tasks, ({ one, many }) => ({
    project: one(exports.projects, {
        fields: [exports.tasks.projectId],
        references: [exports.projects.id],
    }),
    assignee: one(exports.users, {
        fields: [exports.tasks.assigneeId],
        references: [exports.users.id],
    }),
    parentTask: one(exports.tasks, {
        fields: [exports.tasks.parentTaskId],
        references: [exports.tasks.id],
        relationName: 'TaskToTask',
    }),
    subTasks: many(exports.tasks, {
        relationName: 'TaskToTask',
    }),
}));
exports.sqliteSchema = {
    organizations: exports.organizations,
    users: exports.users,
    projects: exports.projects,
    tasks: exports.tasks,
    organizationsRelations: exports.organizationsRelations,
    usersRelations: exports.usersRelations,
    projectsRelations: exports.projectsRelations,
    tasksRelations: exports.tasksRelations,
};
