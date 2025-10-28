# Quick Seed

**Tired of manually creating test data or writing complex seed scripts?** Quick Seed is a powerful, database-agnostic seeding tool that generates realistic development data with proper relationships - automatically.

## The Problem

Database seeding is **painfully manual** and **error-prone**:
- ❌ Writing custom seed scripts for every table
- ❌ Maintaining referential integrity by hand
- ❌ Creating realistic fake data that looks natural
- ❌ Dealing with different database syntax and ORMs
- ❌ Managing complex relationships and foreign keys

**Quick Seed solves this** by providing a simple schema-based approach that works across PostgreSQL, MySQL, SQLite, Prisma, and Drizzle.

## Features

- 🚀 **Database Agnostic**: Works with PostgreSQL, MySQL, SQLite, Prisma, and Drizzle
- 🔍 **ORM Auto-Detection**: Automatically detects and configures Prisma/Drizzle projects
- 🎯 **Schema-Aware**: Understands relationships and maintains referential integrity
- 📊 **Progress Tracking**: Visual progress bars for large datasets
- 🎨 **Realistic Data**: Uses Faker.js for high-quality fake data
- ⚡ **CLI Tool**: Simple command-line interface for quick setup
- 🔧 **Customizable**: Override defaults with custom generators
- 📝 **JavaScript Schemas**: Support for .js files with comments and functions
- 🔄 **Self-Referencing Tables**: Schema definitions support self-referencing relationships
- ✅ **Comprehensive Testing**: Full test suite with relationship validation

## Installation

For most projects, we recommend installing Quick Seed as a local development dependency:

```bash
npm install quick-seed --save-dev
```

This allows you to run it via `npx quick-seed` and ensures version consistency across your team.

If you prefer to have the `quick-seed` command available globally across all your projects:

```bash
npm install -g quick-seed
```

## Quick Start

### 1. Initialize Configuration

```bash
# If installed globally
quick-seed init

# If installed locally
npx quick-seed init
```

This will:
- Auto-detect Prisma/Drizzle setups
- Guide you through database selection
- Generate a `quick-seed.config.js` file

### 2. Create a Schema File

Create a `schema.js` file. Using a `.js` file allows for comments and advanced features like custom functions:

```javascript
// schema.js
module.exports = {
  "users": {
    "count": 10,
    "fields": {
      "name": "person.fullName",
      "email": "internet.email",
      "created_at": "date.recent"
    }
  },
  "posts": {
    "count": 50,
    "fields": {
      "title": "lorem.sentence",
      "content": "lorem.paragraphs",
      "user_id": { "references": "users.id" },
      "published": true
    }
  }
};
```

### 3. Seed Your Database

```bash
# If installed globally
quick-seed seed --schema schema.js

# If installed locally
npx quick-seed seed --schema schema.js
```

## CLI Commands

### Initialize Configuration
```bash
# Global
quick-seed init

# Local
npx quick-seed init
```

### Seed Database
```bash
# Global
quick-seed seed --schema path/to/schema.js
quick-seed seed --schema schema.js --config path/to/config.js

# Local
npx quick-seed seed --schema path/to/schema.js
npx quick-seed seed --schema schema.js --config path/to/config.js
```

### Options
- `--schema, -s`: Path to schema file (.js or .json)
- `--config, -c`: Path to config file (default: quick-seed.config.js)

## Configuration Examples

### PostgreSQL
```javascript
module.exports = {
  adapter: 'postgres',
  connection: 'postgresql://user:pass@localhost:5432/dbname'
};
```

### MySQL
```javascript
module.exports = {
  adapter: 'mysql',
  connection: 'mysql://user:pass@localhost:3306/dbname'
};
```

### SQLite
```javascript
module.exports = {
  adapter: 'sqlite',
  connection: './database.db'
};
```

### Prisma ORM (Auto-generated)
```javascript
const { PrismaClient } = require('@prisma/client');
const { PrismaAdapter } = require('quick-seed/adapters');

const prisma = new PrismaClient();

module.exports = {
  adapter: new PrismaAdapter(),
  connection: prisma
};
```

### Drizzle ORM (Auto-generated)
```javascript
const { DrizzleAdapter } = require('quick-seed/adapters');

module.exports = {
  adapter: new DrizzleAdapter(),
  connection: async () => {
    const { db, schema } = await createDrizzleConnection('sqlite');
    return { db, schema };
  }
};
```

## Faker.js Integration

Quick Seed uses [Faker.js](https://fakerjs.dev/) for data generation. All Faker.js methods are available:

- `person.fullName`, `person.firstName`, `person.lastName`
- `internet.email`, `internet.username`, `internet.password`
- `lorem.sentence`, `lorem.paragraph`, `lorem.words`
- `date.recent`, `date.past`, `date.future`
- `number.int`, `number.float`, `datatype.boolean`
- And many more!

## Advanced Usage

### Custom Field Generators

```javascript
{
  "users": {
    "count": 10,
    "fields": {
      "role": (faker, db) => {
        return faker.helpers.arrayElement(['admin', 'user', 'moderator']);
      },
      "username": (faker, db) => {
        // Generate unique username from name
        const firstName = faker.person.firstName().toLowerCase();
        const lastName = faker.person.lastName().toLowerCase();
        return `${firstName}.${lastName}${faker.number.int({ min: 1, max: 999 })}`;
      }
    }
  },
  "posts": {
    "count": 50,
    "fields": {
      "title": "lorem.sentence",
      "content": "lorem.paragraphs",
      "user_id": { "references": "users.id" },
      "author_email": (faker, db) => {
        // Access data from previously seeded tables
        const userRecord = faker.helpers.arrayElement(db.users);
        return userRecord.email;
      }
    }
  }
}
```

### Self-Referencing Relationships

**Note:** Due to the seeder's architecture, using the standard `references` syntax for self-referencing relationships will throw an error. You must use a custom generator that checks if records exist.

**❌ Incorrect (will throw error):**
```javascript
{
  "categories": {
    "count": 5,
    "fields": {
      "name": "commerce.department",
      "parent_id": { "references": "categories.id" } // ERROR: No categories exist yet
    }
  }
}
```

**✅ Correct (use custom generator):**
```javascript
{
  "categories": {
    "count": 5,
    "fields": {
      "name": "commerce.department",
      "parent_id": (faker, db) => {
        // Check if categories exist before referencing
        if (db.categories && db.categories.length > 0) {
          return faker.helpers.arrayElement(db.categories).id;
        }
        return null; // No parent for root categories
      }
    }
  }
}
```

## Current Limitations

- **Self-referencing table relationships**: Using the standard `references` syntax for self-referencing relationships will throw an error, as the seeder cannot find existing records to link to while the table is being generated.
- **Workaround**: Use custom generators that check if records exist before attempting to reference them, or seed self-referencing tables in multiple passes.
- **True circular dependencies**: Dependencies between different tables that create cycles are not supported and will throw an error.

## Examples

Check out the `examples/` directory for complete working examples:

- `examples/prisma-stress-test/`: Prisma ORM integration
- `examples/drizzle-stress-test/`: Drizzle ORM integration

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT

## Support

- 📖 [Documentation](https://github.com/miit-daga/quick-seed)
- 🐛 [Issues](https://github.com/miit-daga/quick-seed/issues)
- 💬 [Discussions](https://github.com/miit-daga/quick-seed/discussions)

## Author

**Miit Daga**
- 💼 [LinkedIn](https://www.linkedin.com/in/miit-daga/)
- 🌐 [Website](https://miitdaga.tech/)