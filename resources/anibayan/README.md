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
| `admin.html` | Administrators | Account management, user reports, organization applications and site health only |

## What works

- **Buyers:**
  - Filter the shop, add to cart, and check out (one order per organization).
  - Pay by cash on delivery, or by card or GCash through PayMongo test mode (no money is charged).
  - Cancel pending orders, rate completed ones, and report problems.
  - Save harvests and edit delivery details.
- **Organizations:**
  - Confirm, prepare and complete orders, or decline them; declined or cancelled orders return their stock.
  - Add, edit, pause and remove listings, with photo upload.
  - Add and confirm member farmers, and edit the organization profile.
  - Charts and trends come from real orders.
- **Administrators:**
  - Suspend or reactivate accounts, and reset passwords (a temporary password is shown once).
  - Uphold, dismiss or reopen user reports.
  - Approve or decline organization applications.
  - Run live site-health checks against the server.
- **Everyone:** change password, remembered display preferences, CSV export of every table.

## Organization credit score

- Buyers rate completed orders from 1 to 5 stars, and can report a problem with any of their orders.
- **Credit score (0–100) = average rating × 20, minus 10 points for each report an administrator upholds.** Reports under review and dismissed reports don't count. An organization with no ratings yet shows as "New".
- Bands: 90 and above Excellent, 75–89 Good, 60–74 Fair, below 60 At risk.

## Shop filters

Crop type, price per unit (minimum and maximum), harvest time (last 3, 7 or 30 days) and location, with sorting by freshest harvest, price, credit score or shelf life left. The shop only lists crops that are active, in stock and still within their shelf life.

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
