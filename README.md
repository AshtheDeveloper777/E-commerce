# SYNTH.CO E-commerce

React + Vite storefront with Express API and Supabase PostgreSQL.

## Local development

```bash
npm install
npm install --prefix server
npm run dev
```

- Frontend: http://localhost:5173  
- API: http://localhost:5000/api  

Copy `.env.example` to `.env` in the project root (or `server/.env`) and set `DATABASE_URL` and `JWT_SECRET`.

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Prepare for Vercel deployment"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import your repository.
2. Framework preset: **Vite** (auto-detected from `vercel.json`).
3. Add **Environment Variables** (Production + Preview):

| Name | Value |
|------|--------|
| `DATABASE_URL` | Your Supabase pooler URI (`postgresql://postgres.[ref]:[password]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres`) |
| `JWT_SECRET` | A long random secret string |

4. Click **Deploy**.

### 3. Supabase tips for serverless

- Use the **Transaction pooler** connection string (port **6543**), not the direct DB port.
- In Supabase → Project Settings → Database, enable pooler if needed.
- Tables are created automatically on first API request.

### Project layout on Vercel

| Path | Handled by |
|------|------------|
| `/`, `/products/*`, assets | Static `dist` (Vite build) |
| `/api/*` | Serverless function `api/index.cjs` |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Vite + Express with hot reload |
| `npm run build` | Build frontend to `dist` |
| `npm start` | Build + run local full-stack server |
| `npm run start:server` | API only on port 5000 |
