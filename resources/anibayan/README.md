# AniBayan frontend layout

The AniBayan homepage and its three role dashboards. Laravel serves them as static pages from `public/anibayan/`. Every record is fictional sample data held in the browser: nothing is saved, and changes reset when the page reloads.

With the app running (`php artisan serve`), open `http://127.0.0.1:8000/anibayan/`.

## Pages

| Page | User | What it covers |
| --- | --- | --- |
| `index.html` | Everyone | Homepage |
| `admin.html` | Platform administrator | Account management, user reports, organization applications and site health only |
| `organization.html` | Farmer organization representative | Incoming orders, crop listings, ratings and feedback, member farmers, payments |
| `consumer.html` | Buyer | Shop with filters, orders, saved harvests, growers, payment history |

Orders, listings and payments belong to the organization and buyer dashboards. The admin dashboard does not show them.

## Organization credit score

- Buyers rate a completed order from 1 to 5 stars, and can report a problem with any of their orders.
- **Credit score (0–100) = average rating × 20, minus 10 points for each report an administrator upholds.** Reports under review and dismissed reports don't count. An organization with no ratings yet shows as "New".
- Bands: 90 and above Excellent, 75–89 Good, 60–74 Fair, below 60 At risk.
- Buyers see the score on shop listings, grower cards and listing details.
- Organizations see their score, its breakdown, buyer feedback and the reports about them under **Ratings & feedback**.
- Administrators uphold, dismiss or reopen reports under **User reports**. Each report shows what upholding it would do to the score.

## Shop filters

Consumer dashboard → **Shop**. Buyers can filter by crop type, price per unit (minimum and maximum), harvest time (last 3, 7 or 30 days) and location, and sort by freshest harvest, price, credit score or shelf life left. The shop only lists crops that are active, in stock and still within their shelf life.

## Harvest date on listings

- Organization dashboard → **Add listing**. Harvest date is a required field. It can't be in the future or already past the crop's shelf life.
- Shelf life (days) is filled in from the crop type (vegetables and fruits 7, rice and grains 180) and can be changed.
- Buyers see the harvest date, how many days ago that was, the shelf life, the best-before date and a freshness label ("Keeps 6 more days", "Use within 2 days").

## Editing

- HTML and CSS: edit the files in `public/anibayan/` directly.
- JavaScript: edit the TypeScript in `resources/anibayan/src/`, then compile it into `public/anibayan/js/` and commit both:

  ```bash
  cd resources/anibayan
  npx -p typescript@5.9.3 tsc -p tsconfig.dashboards.json   # dashboards (js/dashboards.js)
  npx -p typescript@5.9.3 tsc -p tsconfig.json              # homepage (js/preview.js)
  ```

- Links to the full application (for example `/products` or `/profile`) show a notice, because those pages don't exist yet. To send them to a deployed app instead, set `window.ANIBAYAN_APP_ORIGIN` in `public/anibayan/app-config.js`.

## Credits

Image, video, font and map credits are in `CREDITS.md` and `PHOTO-CREDITS.md`.
