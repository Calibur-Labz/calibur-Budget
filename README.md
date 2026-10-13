# Budget

A mobile-style daily expense tracker. Next.js (App Router) + MongoDB, single user, PIN locked.

- **Home** – balance, total spent, today's limit, leftover or exceeded, daily chart, category breakdown
- **Add** – keypad entry with category, date and note
- **History** – expenses by day with an over/under badge per day; tap one to edit or delete
- **Settings** – monthly budget, currency, categories, lock

## How the day limit works

Each morning, whatever is left of the monthly budget is spread over the days remaining
(including today). Spend less and tomorrow's limit rises; spend more and it drops.
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
   | `APP_PIN` | The PIN you type to open the app (digits, 4–12 long) |
   | `SESSION_SECRET` | Random string, 16+ characters (`openssl rand -base64 32`) |

3. Run it:

   ```bash
   npm install
   npm run dev
   ```

Open http://localhost:3000, enter your PIN, then set a monthly budget in Settings.

To try it on your phone, run `npm run dev -- -H 0.0.0.0` and open `http://<your-mac-ip>:3000`
on the same Wi-Fi.

## Install as an app

Deploy it (for example to Vercel, with the three env variables set), open the site on your phone
and choose **Add to Home Screen**. It then opens fullscreen with its own icon.

## Scripts

| Command | Does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Unit tests for the budget maths |
| `npm run lint` | ESLint |
# calibur-Budget
