// src/core/__tests__/relationship-resolver.spec.ts
import { RelationshipResolver } from '../relationship-resolver';

describe('RelationshipResolver', () => {
  let resolver: RelationshipResolver;

  beforeEach(() => {
    resolver = new RelationshipResolver();
  });

  it('should be initialized with an empty state', () => {
    expect(resolver.dbState).toEqual({});
  });

  it('should add records to the state correctly', () => {
    const users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
    resolver.addRecords('users', users);
    expect(resolver.dbState).toEqual({ users });
  });

  it('should overwrite records if a table is added twice', () => {
    const oldUsers = [{ id: 1, name: 'Old Alice' }];
    resolver.addRecords('users', oldUsers);

    const newUsers = [{ id: 2, name: 'New Bob' }];
    resolver.addRecords('users', newUsers);

    expect(resolver.dbState).toEqual({ users: newUsers });
  });

  it('should return a random record from a specified table', () => {
    const users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
    resolver.addRecords('users', users);

    const randomUser = resolver.getRandomRecord('users');
    expect(users).toContain(randomUser);
  });

  it('should throw an error when getting a random record from a table with no records', () => {
    resolver.addRecords('users', []);
    expect(() => resolver.getRandomRecord('users')).toThrow(
      'Cannot get a random record from table "users" because it has not been seeded yet or has no records.'
    );
  });

  it('should throw an error when getting a random record from a table that has not been seeded', () => {
    expect(() => resolver.getRandomRecord('nonexistent_table')).toThrow(
      'Cannot get a random record from table "nonexistent_table" because it has not been seeded yet or has no records.'
    );
  });

  it('should handle multiple tables in its state', () => {
    const users = [{ id: 1, name: 'Alice' }];
    const posts = [{ id: 101, title: 'Hello World' }];
    resolver.addRecords('users', users);
    resolver.addRecords('posts', posts);

    expect(resolver.dbState).toEqual({ users, posts });
    expect(resolver.getRandomRecord('users')).toBe(users[0]);
    expect(resolver.getRandomRecord('posts')).toBe(posts[0]);
  });
});