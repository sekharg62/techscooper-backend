# TechScopper Backend

Express REST API using **PostgreSQL** (Prisma), optional **MongoDB** (user activity), and **JWT** auth.

## Requirements

- **Node.js** 20 or newer
- **PostgreSQL** (e.g. Supabase)
- **MongoDB Atlas** (optional; activity tracking is disabled until `MONGODB_URI` is set)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

   `postinstall` runs `prisma generate` so the client in `src/generated/prisma` is created.

2. **Environment**

   Copy the example env file and fill in real values:

   ```bash
   cp .env.example .env
   ```

   See [Environment variables](#environment-variables).

3. **Database schema**

   Apply the Prisma schema to Postgres (pick one workflow):

   ```bash
   npm run db:push
   ```

   Or, if you manage migrations locally:

   ```bash
   npm run db:migrate
   ```

   For Supabase CLI issues with the pooler, set `DIRECT_URL` (port `5432`) in `.env`; Prisma CLI can use it via `prisma.config.ts`.

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start API with watch mode (`tsx watch src/server.ts`) |
| `npm run build` | `prisma generate` + compile TypeScript to `dist/` |
| `npm start` | Run built app: `node dist/server.js` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:generate` | Regenerate Prisma Client |
| `npm run db:push` | Push schema to DB (good for prototyping) |
| `npm run db:migrate` | Dev migrations (`prisma migrate dev`) |
| `npm run db:studio` | Open Prisma Studio |

## Running locally

```bash
npm run dev
```

Default URL: **http://localhost:3001** (override with `PORT`).

Set `CORS_ORIGIN` to your frontend origin (default `http://localhost:5173`).

## API layout

Routes are mounted under **`/api`**:

| Prefix | Purpose |
|--------|---------|
| `GET /api/health` | Health check |
| `POST /api/auth/register` | Register |
| `POST /api/auth/login` | Login |
| `GET /api/product` | List products (optional `category` query) |
| `GET /api/product/page` | Paginated products (`page`, `limit`, optional `category`) |
| `POST /api/product` | Create product |
| `POST /api/activity` | Track category search / product click |
| `GET /api/activity/get-activities/:userId` | User activity + product recommendations |

## Environment variables

| Variable | Required | Description |
|---------|----------|-------------|
| `DATABASE_URL` | Yes (runtime) | PostgreSQL URL for the app (`@prisma/adapter-pg`). Supabase pooler often uses `?pgbouncer=true&connection_limit=1`. |
| `JWT_SECRET` | Yes in production | Secret for signing tokens. Non-production may use an internal default during dev — set a strong value before deploy. |
| `JWT_EXPIRES_IN` | No | Token lifetime (default `7d`). |
| `CORS_ORIGIN` | No | Allowed browser origin(s) for CORS (default `http://localhost:5173`). |
| `PORT` | No | HTTP port (default `3001`). |
| `NODE_ENV` | No | Default `development`. |
| `DIRECT_URL` | No | Direct Postgres URL for Prisma CLI (`db push` / migrate) when the pooler blocks migrations. |
| `MONGODB_URI` | No | If omitted, Mongo is skipped; activity endpoints depending on Mongo will error until connected. |

Use `.env.example` as the template.

## Deployment (e.g. Vercel)

- Set the same secrets in the host dashboard (**`DATABASE_URL`**, **`JWT_SECRET`**, **`CORS_ORIGIN`**, **`MONGODB_URI`** if needed).
- Build command typically matches **`npm run build`**; start command **`npm start`** (or whatever your platform uses for Node servers).
- Ensure **Node 20+** matches `engines` in `package.json`.

Push schema to production DB separately (`db push`, migrate CI, or Supabase migrations) — the build alone does not migrate data.
