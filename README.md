# AniBayan

AniBayan is a working prototype for Calapan City, Oriental Mindoro: the homepage, sign-in, and the buyer, farmer organization and administrator workspaces. The pages are in `public/anibayan/`. A Laravel 13 app serves them and keeps all the data in MySQL: accounts (passwords hashed), organizations, listings, orders, reviews, reports, warnings, member farmers, carts and the activity log. Uploaded photos are saved under `public/anibayan/uploads/`.

## Run locally with Laragon

1. Start Laragon (**Start All**), so MySQL runs on port 3306.
2. Create an empty database called `anibayan`, for example in HeidiSQL (Laragon → Database), or in Laragon's terminal with `mysql -u root -e "CREATE DATABASE anibayan"`.
3. In Laragon's terminal, from this folder, run:

   ```powershell
   composer install
   if (-not (Test-Path .env)) { Copy-Item .env.example .env }
   php artisan key:generate
   php artisan migrate --seed
   php artisan serve
   ```

   `migrate --seed` creates the tables and loads the starting data. Run `php artisan migrate:fresh --seed` to go back to the starting data at any time; the administrator's Settings page has the same reset.

4. Open `http://127.0.0.1:8000`. It goes straight to AniBayan (`/anibayan/`).

The project is pinned to PHP 8.3 (Laragon's version) in `composer.json`. If `composer install` says the lock file doesn't match, run `composer update` once.

For card and GCash payments, put the PayMongo test keys (PayMongo dashboard → Developers → API keys) in `.env` as `PAYMONGO_PUBLIC_KEY` and `PAYMONGO_SECRET_KEY`. Never commit them. If paying fails with "cURL error 60", PHP has no certificate list: set `curl.cainfo` in `php.ini`.

## Test accounts

Every test account uses the password `anibayan`.

- `alex@example.com`: buyer (shop, cart, checkout, orders)
- `ramon@example.com`: representative of Canubing Vegetable Growers (orders, listings, members)
- `admin@example.com`: administrator (accounts, activity log, user reports, organization applications, site health)

Features, the other test accounts, how the code is organized, and build steps are in `resources/anibayan/README.md`.
