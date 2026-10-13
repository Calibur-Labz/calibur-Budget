# Budget

A mobile-style daily expense tracker. Next.js (App Router) + MongoDB, with email and password accounts; each account has its own data.

- **Home** – main budget left, daily budget, spent today, leftover or exceeded, daily chart, category breakdown
- **Add** – keypad entry with category, date and note
- **History** – expenses by day with an over/under badge per day; tap one to edit or delete
- **Upcoming** – payments that are due; marking one paid adds it to today's expenses
- **Settings** – main budget, daily budget, month start day, currency, categories, log out

## How the budgets work

The main budget is the money for the whole budget month (from salary); the top card shows what
is left of it after the month's spending. The daily budget is a separate spending target, the
same every day. A budget month can start on any day from 1 to 28.
The maths lives in `src/lib/budget.ts` and is covered by `src/lib/budget.test.ts`.

## Setup

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas), add a database user,
   allow your IP under **Network Access** (`0.0.0.0/0` if you deploy to Vercel), and copy the
   connection string from **Connect → Drivers**.
2. Copy the env file and fill it in:

   ```bash
   cp .env.example .env.local
   ```

   | Variable | What it is |
   |---|---|
   | `MONGODB_URI` | Atlas connection string, with `/budget` as the database name |
   | `SESSION_SECRET` | Random string, 16+ characters (`openssl rand -base64 32`) |

3. Run it:

   ```bash
   npm install
   npm run dev
   ```

Open http://localhost:3000, create an account, then set your budgets in Settings.
Passwords are stored as salted scrypt hashes.

To try it on your phone, run `npm run dev -- -H 0.0.0.0` and open `http://<your-mac-ip>:3000`
on the same Wi-Fi.

## Install as an app

Deploy it (for example to Vercel, with the two env variables set), open the site on your phone
and choose **Add to Home Screen**. It then opens fullscreen with its own icon.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Unit tests for the budget maths |
| `npm run lint` | ESLint |
# calibur-Budget
