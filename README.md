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
- Protected pages require a valid session token
- SQLite database file is created automatically at `server/data/dongci.sqlite`
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
- Explore
- Social
- Profile

## Notes

- Current data is mocked to help you move quickly into UI design, demos, and presentation work.
- Map routes, AI suggestions, leaderboard, and buddy-matching are represented as product-ready placeholders with endpoint structure ready to extend.
