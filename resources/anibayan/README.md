# AniBayan

A working prototype of AniBayan: the homepage, sign-in, and the buyer, farmer organization and administrator workspaces. Laravel serves the pages from `public/anibayan/`.

AniBayan stores its accounts, listings, orders, ratings and reports in the browser's local storage for now. Every AniBayan page open in the same browser shares that data and updates when another tab changes it. **Settings → Reset all data** restores the starting data. Nothing is written to MySQL yet.

With the app running (`php artisan serve`), open `http://127.0.0.1:8000/anibayan/`. Run it through the server rather than opening the files directly; the admin's site-health checks need it.

## Test accounts

Every test account uses the password `anibayan` until it is changed or reset.

| Email | Account |
| --- | --- |
| `alex@example.com` | Buyer (also `maria@`, `isabel@`, `daniel@example.com`) |
| `ramon@example.com` | Representative of Benguet Highland Growers (also `carlo@` for Guimaras Mango Farmers, `teodoro@` for Nueva Ecija Rice Growers) |
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
  - Save harvests and edit delivery details.
- **Organizations:**
  - Confirm, prepare and complete orders, or decline them; declined or cancelled orders return their stock.
  - Add, edit, pause and remove listings, with photo upload.
  - Add and confirm member farmers, and edit the organization profile.
  - Charts and trends come from real orders.
- **Administrators:**
  - Suspend or reactivate accounts, and reset passwords (a temporary password is shown once).
  - Activity log: sign-ins (failed and blocked ones in red), orders, listing and price changes, reports and every administrator action, with back-to-back repeats shown once with a count. Each account's pop-up lists its recent activity.
  - Uphold, dismiss or reopen user reports.
  - Warn organizations that break the rules, and terminate one after its final warning.
  - Approve or decline organization applications.
  - Run live site-health checks against the server, with graphs of the server's CPU, memory and storage (read by the Laravel route `/server-health`).
- **Everyone:** change password, remembered display preferences, CSV export of every table.

## Organization warnings

- Buyers rate completed orders from 1 to 5 stars, and can report a problem with any of their orders.
- **Every report an administrator upholds is a warning.** Administrators can also warn an organization directly (for example, abusive messages or misleading listings), with a reason the organization sees.
- **3 warnings, then termination.** The third is the final warning. The next upheld report or warning terminates the organization, after the administrator confirms: its listings leave the shop and its representative can no longer sign in. Termination can't be undone.
- Reopening an upheld report withdraws its warning. Administrators can withdraw a warning they gave until the organization is terminated.
- The limit is `dashWarningLimit` in `src/dashboards.ts`.
- Administrators see every organization's warnings under User reports. Organizations see theirs under Ratings & feedback, and get a notice on their overview.

## Shop filters

Crop type, price per unit (minimum and maximum), harvest time (last 3, 7 or 30 days) and location, with sorting by freshest harvest, price, rating or shelf life left. The shop only lists crops that are active, in stock and still within their shelf life, from organizations that aren't terminated.

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

- The starting data is in `src/data/dashboard-demo.ts`; browser storage and form helpers shared by every page are in `src/shared.ts`.

## Credits

Image, video, font and map credits are in `CREDITS.md` and `PHOTO-CREDITS.md`.
