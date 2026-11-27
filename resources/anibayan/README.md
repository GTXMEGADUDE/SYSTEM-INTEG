# AniBayan

A working prototype of AniBayan: the homepage, sign-in, and the buyer, farmer organization and administrator workspaces. Laravel serves the pages from `public/anibayan/`.

AniBayan serves **Calapan City, Oriental Mindoro** only. Organizations and delivery addresses pick one of the city's 62 barangays (`dashBarangays` in `src/data/dashboard-demo.ts`), and the starting data is set there.

All of AniBayan's data is in the team's Supabase project (Postgres); nothing is kept in the browser. Signing in uses Laravel's session, passwords are stored as hashes, and every change goes through the server, which checks who may make it. The administrator's **Settings → Reset all data** (or `php artisan migrate:fresh --seed`) puts every table back to the starting data for everyone. Setup with Laragon is in the main `README.md`.

With the app running (`php artisan serve`), open `http://127.0.0.1:8000/anibayan/`. The pages only work through the server.

## How the data flows

- **Tables:** `database/migrations/2026_11_21_000001_create_anibayan_tables.php`. Models are in `app/Models/`; the starting data is in `database/seeders/DatabaseSeeder.php`.
- **Reading:** each page asks `GET /api/state` for what the signed-in person may see (`app/Support/AppState.php`). Guests get the shop and public profiles. Buyers also get their own account, orders, cart and saved harvests; organizations get their own orders, reports, warnings and member farmers; administrators get everything, including the activity log. Buyers' privacy settings are applied there, so private details never leave the server.
- **Changing:** every change is `POST /api/actions/{action}` (`app/Http/Controllers/ActionController.php`), for example `cart.add`, `checkout`, `order.advance`, `listing.save`, `warning.create` or `account.suspend`. Each action checks the person's role, saves everything or nothing, writes the activity log, and answers with the person's fresh data.
- **Signing in:** `POST /api/login`, `/api/register` and `/api/logout` (`AuthController`). Pages send Laravel's `XSRF-TOKEN` cookie back as the `X-XSRF-TOKEN` header (`dashApi` in `src/shared.ts`).
- **Payments:** `POST /api/payments` and `/api/payments/check` (`PaymentController`) build the PayMongo checkout from the orders in the database and mark them paid only after PayMongo confirms.
- **Photos:** pages shrink a photo to a JPEG and send it; the server checks it and saves it under `public/anibayan/uploads/` (`app/Support/Photos.php`).

## Test accounts

Seeded sample accounts are for local development only. Their shared starter password is rejected by the production sign-in flow; use a unique password for hosted accounts.

| Email | Account |
| --- | --- |
| `alex@example.com` | Buyer (also `maria@`, `isabel@`, `daniel@example.com`) |
| `ramon@example.com` | Representative of Canubing Vegetable Growers (also `carlo@` for Managpi Fruit Growers, `teodoro@` for Bucayao Rice Farmers) |
| `admin@example.com` | Platform administrator |
| `jessa@example.com` | Suspended buyer: can't sign in |
| `joel@example.com`, `edna@example.com` | Representatives of organizations waiting for approval: can sign in once an administrator approves them |

New buyers can sign up and shop right away. New organizations apply on the sign-up page and appear under the admin's **Applications**.

## Pages

| Page | Who | What it covers |
| --- | --- | --- |
| `index.html` | Everyone | Homepage |
| `login.html` | Everyone | Sign in, create a buyer account, or apply as a farmer organization |
| `consumer.html` | Buyers (guests can browse) | Shop with filters, cart and checkout, orders, saved harvests, growers, payments, profile |
| `organization.html` | Organization representatives | Incoming orders, crop listings, ratings and feedback, member farmers, payments, profile |
| `admin.html` | Administrators | Account management, activity log, user reports, organization applications and site health only |

## What works

- **Buyers:**
  - Filter the shop, add to cart, and check out (one order per organization).
  - Pay by cash on delivery, or by card or GCash on PayMongo's test checkout (no money is charged; test card 4343 4343 4343 4345). An order turns Paid only after PayMongo confirms the payment.
  - Cancel pending orders, rate completed ones, and report problems.
  - Save harvests and edit delivery details (a street and a Calapan barangay).
  - A profile page, with privacy settings: public profile, show reviews, show city, show the growers they buy from.
- **Organizations:**
  - Confirm, prepare and complete orders, or decline them; declined or cancelled orders return their stock.
  - Add, edit, pause and remove listings, with photo upload.
  - Add and confirm member farmers, and edit the organization profile.
  - A public profile page with their harvests, buyer reviews and member count. Organization names in order and item pop-ups link to it.
  - Charts and trends come from real orders.
- **Administrators:**
  - Suspend or reactivate accounts, and reset passwords (a temporary password is shown once).
  - Activity log: sign-ins (failed and blocked ones in red), orders, listing and price changes, reports and every administrator action, with back-to-back repeats shown once with a count. Each account's pop-up lists its recent activity.
  - Uphold, dismiss or reopen user reports.
  - Warn organizations that break the rules, and terminate one after its final warning.
  - Approve or decline organization applications.
  - Run live site-health checks against the server, with graphs of the server's CPU, memory and storage (read by the Laravel route `/server-health`).
- **Everyone:** change password, remembered display preferences, CSV export of every table. Buyers and organizations add a profile picture and a banner (change, drag into position, remove) on their profile or settings page.

## Organization warnings

- Buyers rate completed orders from 1 to 5 stars, and can report a problem with any of their orders.
- **Every report an administrator upholds is a warning.** Administrators can also warn an organization directly (for example, abusive messages or misleading listings), with a reason the organization sees.
- **3 warnings, then termination.** The third is the final warning. The next upheld report or warning terminates the organization, after the administrator confirms: its listings leave the shop and its representative can no longer sign in. Termination can't be undone.
- Reopening an upheld report withdraws its warning. Administrators can withdraw a warning they gave until the organization is terminated.
- The limit is `dashWarningLimit` in `src/dashboards.ts`.
- Administrators see every organization's warnings under User reports. Organizations see theirs under Ratings & feedback, and get a notice on their overview.

## Shop filters

Crop type, price per unit (minimum and maximum), harvest time (last 3, 7 or 30 days) and location (barangay), with sorting by freshest harvest, price, rating or shelf life left. The shop only lists crops that are active, in stock and still within their shelf life, from organizations that aren't terminated.

## Harvest date on listings

- Harvest date is required on every listing. It can't be in the future or already past the crop's shelf life.
- Shelf life (days) is filled in from the crop type (vegetables and fruits 7, rice and grains 180) and can be changed.
- Buyers see the harvest date, how long ago that was, the shelf life, the best-before date and a freshness label.

## Editing

- HTML and CSS: edit the files in `public/anibayan/` directly.
- JavaScript: edit the TypeScript in `resources/anibayan/src/`, then compile it into `public/anibayan/js/` and commit both:

  ```bash
  cd resources/anibayan
  npx -p typescript@5.9.3 tsc -p tsconfig.dashboards.json   # workspaces (js/dashboards.js)
  npx -p typescript@5.9.3 tsc -p tsconfig.auth.json         # sign-in page (js/auth.js)
  npx -p typescript@5.9.3 tsc -p tsconfig.json              # homepage (js/preview.js)
  ```

- The data shapes the pages use are in `src/data/dashboard-demo.ts`; talking to the server and the form helpers every page shares are in `src/shared.ts`. The three dashboard pages load their data first with a small script in their HTML, then start `js/dashboards.js`.

## Credits

Image, video, font and map credits are in `CREDITS.md` and `PHOTO-CREDITS.md`.
