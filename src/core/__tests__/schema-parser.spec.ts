// src/core/__tests__/schema-parser.spec.ts
import { getExecutionOrder } from '../schema-parser';
import { Schema } from '../../types/schema';

describe('getExecutionOrder', () => {

  it('should return a simple linear dependency order correctly', () => {
    const schema: Schema = {
      posts: { count: 1, fields: { user_id: { references: 'users.id' } } },
      users: { count: 1, fields: {} },
    };
    const order = getExecutionOrder(schema);
    expect(order).toEqual(['users', 'posts']);
  });

  it('should handle a table with multiple dependencies', () => {
    const schema: Schema = {
      users: { count: 1, fields: {} },
      categories: { count: 1, fields: {} },
      posts: {
        count: 1,
        fields: {
          user_id: { references: 'users.id' },
          category_id: { references: 'categories.id' },
        },
      },
    };
    const order = getExecutionOrder(schema);
    // The first two can be in any order, but 'posts' must be last.
    expect(order[2]).toBe('posts');
    expect(order).toContain('users');
    expect(order).toContain('categories');
  });

  it('should handle a more complex dependency chain', () => {
    const schema: Schema = {
      comments: { count: 1, fields: { post_id: { references: 'posts.id' } } },
      posts: { count: 1, fields: { user_id: { references: 'users.id' } } },
      users: { count: 1, fields: { organization_id: { references: 'organizations.id' } } },
      organizations: { count: 1, fields: {} },
    };
    const order = getExecutionOrder(schema);
    expect(order).toEqual(['organizations', 'users', 'posts', 'comments']);
  });

  it('should handle tables with no dependencies', () => {
    const schema: Schema = {
      users: { count: 1, fields: {} },
      products: { count: 1, fields: {} },
      tags: { count: 1, fields: {} },
    };
    const order = getExecutionOrder(schema);
    expect(order.length).toBe(3);
    expect(order).toContain('users');
    expect(order).toContain('products');
    expect(order).toContain('tags');
  });
  
  it('should not treat self-referencing foreign keys as a dependency cycle', () => {
    const schema: Schema = {
      tasks: { 
        count: 1, 
        fields: { 
          parent_task_id: { references: 'tasks.id' } 
        } 
      },
    };
    const order = getExecutionOrder(schema);
    expect(order).toEqual(['tasks']);
  });

  it('should throw an error for a simple circular dependency', () => {
    const schema: Schema = {
      tableA: { count: 1, fields: { b_id: { references: 'tableB.id' } } },
      tableB: { count: 1, fields: { a_id: { references: 'tableA.id' } } },
    };
    expect(() => getExecutionOrder(schema)).toThrow('Circular dependency detected involving tables: tableA, tableB');
  });

  it('should throw an error for a longer circular dependency', () => {
    const schema: Schema = {
      tableA: { count: 1, fields: { c_id: { references: 'tableC.id' } } },
      tableB: { count: 1, fields: { a_id: { references: 'tableA.id' } } },
      tableC: { count: 1, fields: { b_id: { references: 'tableB.id' } } },
    };
    expect(() => getExecutionOrder(schema)).toThrow('Circular dependency detected involving tables: tableA, tableB, tableC');
  });

});