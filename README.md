# Experiment Lab — Operations

NestJS application using TypeScript, PostgreSQL, Sequelize 6, Yarn Classic, and PM2. This guide documents the setup agreed for this project; confirm the build entry path against your checkout.

Run all commands from the project root, beside `package.json`.

## Quick start

```bash
yarn install --frozen-lockfile
# Configure .env and ensure PostgreSQL is running first.
yarn db:migrate
yarn start:dev
```

For a database that does not exist yet, run `yarn db:create` before migrating. The configured account needs database creation privileges.

## Prerequisites

- Node.js compatible with the project's dependencies (Node 24 was used during setup).
- Yarn Classic 1.x and a running PostgreSQL server.
- PM2 for background and cluster execution: `yarn global add pm2`.

Install the database dependencies if they are not already in `package.json`:

```bash
yarn add @nestjs/sequelize sequelize@6 sequelize-typescript pg pg-hstore @nestjs/config dotenv
yarn add -D sequelize-cli@6 typescript @types/node
```

## Connection settings

Create `.env` in the project root, replacing the example credentials:

```dotenv
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=nest_app
```

Nest's `SequelizeModule.forRootAsync` reads these values through `ConfigService`, with `dialect: 'postgres'`, `autoLoadModels: true`, and `synchronize: false`. Register `Product` with `SequelizeModule.forFeature([Product])` in the module that provides the product service.

The CLI uses a separate connection file, `database/config/config.cjs`:

```javascript
require("dotenv").config();

module.exports = {
  development: {
    dialect: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    seederStorage: "sequelize",
  },
};
```

`development` is a CLI configuration key, not the name of the `.env` file. The scripts below select it explicitly so a shell's `NODE_ENV` cannot accidentally select a missing configuration. These scripts target the development database; add an explicit configuration and corresponding commands before using another environment.

## TypeScript database files

```text
database/
├── package.json
├── tsconfig.json
├── config/config.cjs
├── migrations/       # TypeScript source; edit these files
├── seeders/          # TypeScript source; edit these files
└── compiled/         # Generated JavaScript; do not edit or commit
```

Create `database/package.json`:

```json
{
  "type": "commonjs"
}
```

Create `database/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "rootDir": ".",
    "outDir": "./compiled",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmitOnError": true,
    "types": ["node"]
  },
  "include": ["migrations/**/*.ts", "seeders/**/*.ts"],
  "exclude": ["compiled", "node_modules"]
}
```

Keep the root application compiler configuration separate. Its `include` should cover `src/**/*.ts` and `test/**/*.ts`; exclude `database`, `dist`, and `node_modules`. Preserve `experimentalDecorators: true` and `emitDecoratorMetadata: true`. If `tsconfig.build.json` overrides `exclude`, add `database` there too.

Set root `.sequelizerc` to:

```javascript
const path = require("path");

module.exports = {
  config: path.resolve("database/config/config.cjs"),
  "migrations-path": path.resolve("database/compiled/migrations"),
  "seeders-path": path.resolve("database/compiled/seeders"),
};
```

Add these entries to `.gitignore`:

```gitignore
.env
database/compiled/
```

## Package scripts

Merge these into the existing `scripts` object in root `package.json`. Preserve Nest's existing build, start, and test scripts.

```json
{
  "db:build": "node -e \"require('node:fs').rmSync('database/compiled', { recursive: true, force: true })\" && tsc -p database/tsconfig.json",
  "db:create": "sequelize-cli db:create --config database/config/config.cjs --env development",
  "db:migrate": "yarn db:build && sequelize-cli db:migrate --config database/config/config.cjs --migrations-path database/compiled/migrations --env development",
  "db:migrate:status": "yarn db:build && sequelize-cli db:migrate:status --config database/config/config.cjs --migrations-path database/compiled/migrations --env development",
  "db:migrate:undo": "yarn db:build && sequelize-cli db:migrate:undo --config database/config/config.cjs --migrations-path database/compiled/migrations --env development",
  "db:seed": "yarn db:build && sequelize-cli db:seed:all --config database/config/config.cjs --seeders-path database/compiled/seeders --env development",
  "db:seed:undo": "yarn db:build && sequelize-cli db:seed:undo --config database/config/config.cjs --seeders-path database/compiled/seeders --env development",
  "migration:generate": "sequelize-cli migration:generate --migrations-path database/migrations",
  "seed:generate": "sequelize-cli seed:generate --seeders-path database/seeders"
}
```

The build removes only the generated `database/compiled` folder before compilation, preventing stale migrations from surviving a source rename. Keep source files outside that folder.

## Migrations

Migrations create and change database structure. Run them before seeders:

```bash
yarn migration:generate --name describe-change
yarn db:migrate
yarn db:migrate:status
```

The generator creates a JavaScript template. Before execution, rename the new source file from `.js` to `.ts` and convert it to typed exports:

```typescript
import type { QueryInterface } from "sequelize";

export async function up(queryInterface: QueryInterface): Promise<void> {
  // Apply the schema change.
}

export async function down(queryInterface: QueryInterface): Promise<void> {
  // Reverse the schema change.
}
```

Import `DataTypes` from `sequelize` when defining columns. The CLI executes compiled `.js` files, never source `.ts` files. Do not rename or rewrite migrations already applied to a shared database; add a new migration instead.

The intended product table name is `Products`, with a UUID `id`, `name`, nullable image URL `image`, integer `qty`, decimal `price`, and timestamps. Keep the model's `tableName`, migrations, and seeders consistent. PostgreSQL raw SQL must quote the capitalized name: `SELECT COUNT(*) FROM "Products";`.

If `products` was already created, apply a new rename migration rather than editing the original migration. A rename preserves the existing rows.

To undo the most recent migration:

```bash
yarn db:migrate:undo
```

Review its `down` function first: undoing a table-creation migration drops that table and its data.

## Seeders

Seeders insert initial or sample data:

```bash
yarn seed:generate --name seed-products
# Rename the generated file to .ts and implement typed up/down exports.
yarn db:seed
```

The product seeder described during setup inserts 1,000 sample products in batches of 100. All batches share one transaction: an error rolls back the entire insertion. It supplies fixed UUIDs, decimal prices as strings, nullable images, and timestamps. Its rollback deletes only those fixed IDs.

With `seederStorage: 'sequelize'`, completed seeders are recorded and skipped on subsequent runs. `db:seed` executes all pending seeders, so inspect pending files before running it. Sample products are for development and testing.

To undo a specific completed seeder, pass its compiled filename:

```bash
yarn db:seed:undo --seed 20260912220000-seed-products.js
```

Use the actual filename in your project. A seeder rollback removes data; inspect its `down` function first. Run database operations once from an operator terminal, not independently inside every PM2 worker.

## Development and resource generation

```bash
yarn start:dev
```

To scaffold a new REST resource:

```bash
yarn nest generate resource products
```

Choose REST API and CRUD entry points. Skip generation if the resource already exists. The generated service contains placeholders; connect it to the Sequelize model to implement database operations. UUID parameters should remain strings rather than being converted to numbers.

## PM2 cluster operation

Build and confirm the output entry file. The commands here use `dist/main.js`; substitute `dist/src/main.js` if that is your actual build output.

```bash
yarn build
pm2 start dist/main.js --name experiment-lab -i 3
pm2 status
pm2 logs experiment-lab --lines 100
pm2 save
```

`-i 3` starts three workers in cluster mode; use `-i 2` for two. Start the compiled Node entry directly. Do not add `--exec-mode`, which was rejected by the installed CLI. Cluster workers share the listening port. See the [PM2 cluster documentation](https://pm2.keymetrics.io/docs/usage/cluster-mode/).

If an old Yarn-based PM2 process already uses this name, stop and remove that specific process before the first direct cluster start:

```bash
pm2 delete experiment-lab
```

This interrupts the existing service. Do not delete it during routine updates; use reload instead.

### Routine commands

| Operation                   | Command                               |
| --------------------------- | ------------------------------------- |
| Inspect processes           | `pm2 status`                          |
| Inspect application details | `pm2 describe experiment-lab`         |
| View logs                   | `pm2 logs experiment-lab --lines 100` |
| Monitor CPU and memory      | `pm2 monit`                           |
| Change to two workers       | `pm2 scale experiment-lab 2`          |
| Reload workers              | `pm2 reload experiment-lab`           |
| Restart workers             | `pm2 restart experiment-lab`          |
| Stop application            | `pm2 stop experiment-lab`             |
| Save current process list   | `pm2 save`                            |

Save the process list after changing the worker count. A cluster reload replaces workers gradually; it can fall back to a restart if graceful replacement fails. Keep in-memory sessions and scheduled jobs in mind when using multiple workers: memory is separate, jobs may run per worker, and each worker has its own database connection pool.

### Apply application updates

After updating the source:

```bash
yarn install --frozen-lockfile
yarn build
yarn db:migrate
pm2 reload experiment-lab --update-env
pm2 status
pm2 logs experiment-lab --lines 100
```

Check an implemented endpoint after reload. For rolling updates, schema changes must remain compatible with the workers still running the previous version. Run seeders only when explicitly needed.

### Restore after reboot

```bash
pm2 startup
```

Follow the platform-specific command PM2 prints, then run `pm2 save`. Saving alone does not install startup integration. See [PM2 startup instructions](https://pm2.keymetrics.io/docs/usage/startup/).

## Troubleshooting

| Error                                         | What to check                                                                                                    |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Cannot find `config/config.json`              | Use the explicit `--config database/config/config.cjs` scripts above.                                            |
| Cannot use import statement outside a module  | The CLI may be loading `database/migrations/*.ts`; execution must target `database/compiled/migrations`.         |
| `module is not defined in ES module scope`    | Ensure `database/package.json` contains `"type": "commonjs"` and execution uses compiled files.                  |
| `database/tsconfig.json` does not exist       | Create the separate database compiler file shown above.                                                          |
| Deprecated `moduleResolution=node10`          | Use `Node16` for both `module` and `moduleResolution` in the database config.                                    |
| `queryInterface` implicitly has an `any` type | Annotate both migration functions with `queryInterface: QueryInterface`.                                         |
| Nest controller decorator errors              | Root config must include `src/**/*.ts` and enable both decorator options; restart the VS Code TypeScript server. |
| Relation `Products` does not exist            | Check migration status and exact capitalization; verify any rename migration ran.                                |
| Connection refused / authentication failed    | Check PostgreSQL is running and `.env` matches the host, port, database, and credentials.                        |
| PM2 unknown option `--exec-mode`              | Use `pm2 start dist/main.js --name experiment-lab -i 3`.                                                         |

For migration tracking and seeder storage behavior, see the [Sequelize migration documentation](https://sequelize.org/docs/v6/other-topics/migrations/).
