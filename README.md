# AniBayan

AniBayan is a working prototype for Calapan City, Oriental Mindoro: the homepage, sign-in, and the buyer, farmer organization and administrator workspaces. The pages are in `public/anibayan/`. A Laravel 13 app serves them and keeps all the data in the team's **Supabase** project (Postgres): accounts (passwords hashed), organizations, listings, orders, refunds, reviews, reports, warnings, member farmers, carts and the activity log. In local development uploaded files use local folders; Render production stores public photos and private application/refund files in separate Supabase Storage buckets so they survive service restarts and deploys.

## Run locally with Laragon

1. In Laragon's `php.ini`, turn on Postgres: remove the `;` in front of `extension=pdo_pgsql` and `extension=pgsql`.
2. In Laragon's terminal, from this folder, run:

   ```powershell
   composer install
   if (-not (Test-Path .env)) { Copy-Item .env.example .env }
   php artisan key:generate
   ```

3. In `.env`, set `DB_PASSWORD` to the Supabase project's database password (ask whoever owns the project; never commit it). The other `DB_` lines in `.env.example` already point at the project's Session pooler, which works on IPv4 networks.
4. Run `php artisan serve`.

The Supabase database is **shared by the whole team** and already has the tables and data. Running `php artisan migrate:fresh --seed` (or Settings → Reset all data as an administrator) puts it back to the starting data **for everyone**. On a brand-new Supabase project, run `php artisan migrate --seed` once. The last migration takes every table away from Supabase's public API keys, so the data can only be reached through this app.

The database is in Paris, so each page needs about a second from the Philippines.

5. Open `http://127.0.0.1:8000`. It goes straight to AniBayan (`/anibayan/`).

The project is pinned to PHP 8.3 (Laragon's version) in `composer.json`. If `composer install` says the lock file doesn't match, run `composer update` once.

For card and GCash payments, put the PayMongo test keys (PayMongo dashboard → Developers → API keys) in `.env` as `PAYMONGO_PUBLIC_KEY` and `PAYMONGO_SECRET_KEY`. Never commit them. If paying fails with "cURL error 60", PHP has no certificate list: set `curl.cainfo` in `php.ini`.

## Persistent uploads on Render

Create two buckets in Supabase Storage before enabling uploads on the hosted app:

- `anibayan-public`: set the bucket to **Public**, with a 4 MB object limit and only `image/jpeg`, `image/png` and `image/webp`.
- `anibayan-private`: keep the bucket **Private**, with an 8 MB object limit and `application/pdf`, the three image types above, `video/mp4`, `video/webm` and `video/quicktime`.

In Render's `anibayan` service environment, set `SUPABASE_SERVICE_ROLE_KEY` to the project's server-side `service_role` secret. `render.yaml` already selects Supabase Storage and sets the project URL and bucket names. Keep the service-role secret in Render only; it must never be added to frontend code or Git. The app serves private files through its authenticated API routes.

## Email notifications on Render

AniBayan sends service emails for new accounts and organization applications, application decisions, placed and updated orders, confirmed payments, refund requests and decisions, password resets, and password changes. Render is set to `MAIL_MAILER=resend`, which sends through Resend's HTTPS API so it works on Render's free plan. In Render, set `RESEND_API_KEY` and a Resend-verified `MAIL_FROM_ADDRESS`; keep the API key in Render only. `MAIL_FROM_NAME` is `AniBayan`. Site health checks whether the provider credentials are present; it does not confirm an email reached an inbox. Password resets remain unavailable until a provider is configured. Placeholder demo addresses on `example.com` do not receive service emails.

Uploads that were already on Render's temporary filesystem cannot be recovered by this change. Copy them to the new buckets first if you still have a separate backup.

## Test accounts

The hosted demo login keeps the shared starter password for these three accounts. The shared password is rejected for other production accounts; use the demo accounts only for testing.

- `alex@example.com`: buyer (shop, cart, checkout, orders)
- `ramon@example.com`: representative of Canubing Vegetable Growers (orders, listings, members)
- `admin@example.com`: administrator (accounts, activity log, user reports, organization applications, site health)

Features, the other test accounts, how the code is organized, and build steps are in `resources/anibayan/README.md`.
