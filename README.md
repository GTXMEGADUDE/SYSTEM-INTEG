# AniBayan

AniBayan is a working prototype: the homepage, sign-in, and the buyer, farmer organization and administrator workspaces. A small Laravel 13 app serves its pages from `public/anibayan/` and reads the server's CPU, memory and storage for the Site health page (`/server-health`).

## Run locally

In Laragon Terminal, from this folder, run:

```powershell
composer install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
php artisan key:generate
php artisan serve
```

For card and GCash payments, put the PayMongo test keys (PayMongo dashboard → Developers → API keys) in `.env` as `PAYMONGO_PUBLIC_KEY` and `PAYMONGO_SECRET_KEY`. Never commit them. If paying fails with "cURL error 60", PHP has no certificate list: set `curl.cainfo` in `php.ini`.

Open `http://127.0.0.1:8000`. It goes straight to AniBayan (`/anibayan/`). Sign in with a test account. Every test account uses the password `anibayan`.

- `alex@example.com`: buyer (shop, cart, checkout, orders)
- `ramon@example.com`: representative of Benguet Highland Growers (orders, listings, members)
- `admin@example.com`: administrator (accounts, activity log, user reports, organization applications, site health)

AniBayan keeps its data in the browser for now, not in a database. Features, test accounts, source and build steps are in `resources/anibayan/README.md`.
