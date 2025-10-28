"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mysqlSchema = exports.tasksRelations = exports.projectsRelations = exports.usersRelations = exports.organizationsRelations = exports.tasks = exports.projects = exports.users = exports.organizations = void 0;
// examples/drizzle-stress-test/schemas/mysql.ts
const mysql_core_1 = require("drizzle-orm/mysql-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.organizations = (0, mysql_core_1.mysqlTable)('organizations', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    name: (0, mysql_core_1.varchar)('name', { length: 255 }).notNull().unique(),
});
exports.users = (0, mysql_core_1.mysqlTable)('users', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    email: (0, mysql_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    fullName: (0, mysql_core_1.varchar)('full_name', { length: 255 }).notNull(),
});
exports.projects = (0, mysql_core_1.mysqlTable)('projects', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    name: (0, mysql_core_1.varchar)('name', { length: 255 }).notNull(),
    organizationId: (0, mysql_core_1.int)('organization_id').notNull().references(() => exports.organizations.id),
});
exports.tasks = (0, mysql_core_1.mysqlTable)('tasks', {
    id: (0, mysql_core_1.serial)('id').primaryKey(),
    title: (0, mysql_core_1.varchar)('title', { length: 255 }).notNull(),
    projectId: (0, mysql_core_1.int)('project_id').notNull().references(() => exports.projects.id),
    assigneeId: (0, mysql_core_1.int)('assignee_id').references(() => exports.users.id),
    parentTaskId: (0, mysql_core_1.int)('parent_task_id'),
    metadata: (0, mysql_core_1.json)('metadata'),
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
exports.mysqlSchema = {
    organizations: exports.organizations,
    users: exports.users,
    projects: exports.projects,
    tasks: exports.tasks,
    organizationsRelations: exports.organizationsRelations,
    usersRelations: exports.usersRelations,
    projectsRelations: exports.projectsRelations,
    tasksRelations: exports.tasksRelations,
};
