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
3. **Before Deploy** → open **Environment Variables** and add **all** of these for **Production** and **Preview**:

| Variable | Required | How to get it |
|----------|----------|----------------|
| **`DATABASE_URL`** | **Yes** | Supabase → **Project Settings** → **Database** → **Connection string** → choose **URI** → **Session pooler** (port **6543**) |
| `JWT_SECRET` | Yes | Any long random string |
| `RAZORPAY_KEY_ID` | Yes | [Razorpay Dashboard](https://dashboard.razorpay.com/app/keys) |
| `RAZORPAY_KEY_SECRET` | Yes | Same Razorpay page (secret key) |
| `VITE_RAZORPAY_KEY_ID` | Yes | Same value as `RAZORPAY_KEY_ID` |

**`DATABASE_URL` example** (replace password and project ref):

```
postgresql://postgres.hdoejjtkbxyjloezpqhn:YOUR_PASSWORD@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
```

> Without `DATABASE_URL`, the API will fail on Vercel — products, login, and orders need the database.

4. Click **Deploy**, then redeploy after adding env vars if the first deploy failed.

5. Verify: `https://your-app.vercel.app/api/health` → `"database": "connected"` and `"databaseUrlConfigured": true`.

### 3. Razorpay payments

Checkout uses **Razorpay** (INR):

1. Create an account at [razorpay.com](https://razorpay.com).
2. Use **Test Mode** keys while developing.
3. Flow: server creates order → Razorpay popup → server verifies signature → order saved in DB.

`/api/health` returns `"razorpay": true` when keys are configured.

### 4. Supabase tips for serverless

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
