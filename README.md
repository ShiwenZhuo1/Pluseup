# 动次

Vue + Express product prototype for the 动次 concept.

## Structure

- `client`: Vue 3 frontend for the 4 core product pages
- `server`: Express API serving login/register, SQLite persistence, and product data

## Quick start

1. Install dependencies:
   - `npm run install:all`
2. Configure AMap for the Explore page:
   - copy `client/.env.example` to `client/.env.local`
   - set `VITE_AMAP_KEY`
   - set `VITE_AMAP_SECURITY_JS_CODE`
   - because your screenshot exposed both values, rotate them in the AMap console before using them here
3. Start backend:
   - `npm run dev:server`
4. Start frontend in another terminal:
   - `npm run dev:client`

## Auth and database

- Login and register are available at `/auth`
- Home is public, and feature pages redirect to login first
- SQLite database file is created automatically at `data/dongci.sqlite`
- DeepSeek key should be stored server-side in `server/.env` using `DEEPSEEK_API_KEY`
- Backend supports:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
  - `GET /api/checkin`
  - `POST /api/plans/recommendation`
  - `POST /api/plans`
  - `POST /api/tasks/:taskId/complete`

## Core pages included

- Home
- Checkin
- Explore
- Social

## Fastest deploy

The easiest way to get this online is a single Node service on Render:

1. Create a new `Web Service` from this GitHub repo.
2. Set:
   - Build Command: `npm run install:all && npm run build`
   - Start Command: `npm run start`
3. Add a persistent disk and mount it to `/opt/render/project/src/data`
   - this keeps the SQLite file after redeploys
4. Add environment variables if needed:
   - `NODE_ENV=production`
   - `CLIENT_ORIGIN=https://your-domain.onrender.com`
   - `DEEPSEEK_API_KEY=...`
5. Deploy once, then open the Render URL.

Because the Express server now serves `client/dist` in production, you only need one service instead of splitting frontend and backend.

## Notes

- Current data is mocked to help you move quickly into UI design, demos, and presentation work.
- Map routes, AI suggestions, leaderboard, and buddy-matching are represented as product-ready placeholders with endpoint structure ready to extend.
