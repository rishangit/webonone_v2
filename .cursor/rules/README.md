# Cursor rules index

## Always apply

| Rule | Description |
|------|-------------|
| [cursor-rules.mdc](cursor-rules.mdc) | How to add, edit, and maintain rules |
| [code-cleanliness.mdc](code-cleanliness.mdc) | Path aliases, focused diffs, no dead code or empty folders |
| [microservice-architecture.mdc](microservice-architecture.mdc) | Standalone services, secure data passing (JWT, events, iframe/postMessage) |

## Front-end (`front-end/`)

| Rule | Globs | Description |
|------|-------|-------------|
| [front-end-structure.mdc](front-end-structure.mdc) | `front-end/src/**/*.{ts,tsx}` | `src/` layout, feature modules, `shared/` boundaries |
| [react-typescript.mdc](react-typescript.mdc) | `front-end/**/*.{ts,tsx}` | Components, TypeScript, hooks, forms |
| [tailwind-css.mdc](tailwind-css.mdc) | `front-end/src/**/*.{ts,tsx}` | Tailwind utilities, tokens, shadcn/ui styling |
| [redux-store-and-epics.mdc](redux-store-and-epics.mdc) | `front-end/**/store/**/*.ts` | RTK slices, redux-observable epics, store wiring |

## Backend (`backend/`)

| Rule | Globs | Description |
|------|-------|-------------|
| [nodejs-express.mdc](nodejs-express.mdc) | `backend/**/*.{ts,js}` | Express layout, REST, JWT, handlers |
| [mysql-database-architecture.mdc](mysql-database-architecture.mdc) | `backend/**/{migrations,prisma,models,db,repositories}/**` | MySQL schema, nanoid, migrations, per-service DB |

## Cross-links (avoid duplicating these topics)

| Topic | Authoritative rule |
|-------|-------------------|
| One DB per service, events, JWT, iframe/postMessage | `microservice-architecture.mdc` |
| Identity ↔ WebOnOne integration (spec) | [spec/1.0.0/07-identity-webonone-integration.md](../../spec/1.0.0/07-identity-webonone-integration.md) |
| Tables, migrations, nanoid `CHAR(21)` | `mysql-database-architecture.mdc` |
| Express routes, JWT, HTTP errors | `nodejs-express.mdc` |
| Feature folders, `@/shared` between features | `front-end-structure.mdc` |
| Slices, epics, `rootEpic` | `redux-store-and-epics.mdc` |
| Tailwind, shadcn/ui, responsive layout | `tailwind-css.mdc` |
| `@/` imports, unused code cleanup | `code-cleanliness.mdc` |
