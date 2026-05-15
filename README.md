# Lumina Finance

A full-stack **personal expense and budget** web app for Indian users (amounts in **INR**). It uses the **MERN** stack: **MongoDB**, **Express**, **React** (Vite), and **Node.js**, with **JWT** authentication, dashboard charts (**Recharts**), category budgets, and in-app notifications for budget thresholds (50%, 90%, 100%).

## Features

- **Auth** — Register, login, JWT-protected API routes; change password from the profile modal (session ends after a successful change).
- **Dashboard** — Welcome message, balance / income / expense totals, cash-flow line chart, expense pie chart, rule-based insights.
- **Transactions** — Create (New Entry modal), list, search, filter by type, delete; fixed expense categories plus income-friendly categories (e.g. Salary).
- **Budget planner** — Monthly limits per category, spending vs limit with colour-coded progress.
- **Notifications** — Toasts + bell inbox for budget threshold alerts (session-scoped so repeats are limited).

## Tech stack

| Layer | Technologies |
|--------|----------------|
| Frontend | React 18, Vite, React Router, Tailwind CSS, Axios, Recharts, Lucide |
| Backend | Node.js, Express, Mongoose, bcryptjs, jsonwebtoken, CORS |
| Data | MongoDB (Atlas or self-hosted) |

## Prerequisites

- **Node.js** 18+ (LTS recommended; 20+ is fine).
- A **MongoDB** database (e.g. [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)) and a connection string that includes your **database name** in the path (e.g. `...mongodb.net/lumina_finance?...`).

## Quick start

1. **Clone** the repository and open the project root.

2. **Environment** — Copy the example env file and edit values:

   ```bash
   cp .env.example .env
   ```

   Set `MONGO_URI`, `JWT_SECRET`, and optionally `PORT` (default in this project is often **5001** to avoid macOS AirPlay using port 5000).

3. **Install dependencies** (root, backend, and frontend):

   ```bash
   npm run install:all
   ```

   Or from the root after `npm install`:

   ```bash
   npm install
   npm run install:all
   ```

4. **Run in development** (API + Vite together):

   ```bash
   npm run dev
   ```

   - **Frontend:** [http://localhost:5173](http://localhost:5173) (proxies `/api` to the backend).
   - **Backend:** listens on the `PORT` in `.env` (e.g. `5001`).

5. Open the app in a browser, **register** an account, then sign in.

## Environment variables

| Variable | Description |
|----------|-------------|
| `MONGO_URI` | MongoDB connection string (include DB name in the path). |
| `JWT_SECRET` | Long random string used to sign JWTs. |
| `PORT` | HTTP port for the Express server (default `5001` in `.env.example`). |
| `NODE_ENV` | `development` locally; set to `production` for production mode. |

The backend loads `.env` from the **project root** (same folder as the root `package.json`).

**Never commit `.env`** — only `.env.example` belongs in Git.

## npm scripts (root)

| Script | Purpose |
|--------|---------|
| `npm run install:all` | `npm install` in `backend/` and `frontend/`. |
| `npm run dev` | Runs backend (nodemon) and frontend (Vite) concurrently. |
| `npm run build` | Production build of the frontend into `frontend/dist/`. |
| `npm run start` | Runs the backend with `NODE_ENV=production`; Express serves `frontend/dist/` if present. |

## Project layout

```text
lumina-finance/
├── backend/           # Express API, Mongoose models, JWT auth
├── frontend/          # Vite + React app
│   ├── public/
│   └── src/
├── .env.example       # Copy to .env — not committed with secrets
├── .gitignore
├── package.json       # Root scripts + concurrently
└── README.md
```

## Production (single process)

1. Build the client: `npm run build`
2. Set `NODE_ENV=production` and the same env vars as in development (with a production `MONGO_URI` if needed).
3. Start: `npm run start`

The server serves the SPA from `frontend/dist/` and exposes REST routes under `/api`.

## Licence

Private / educational use unless you add an explicit licence.
