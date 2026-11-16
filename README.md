# Book Management System

A small Laravel 13 app for adding, viewing, editing, deleting, and searching books. It uses Laragon MySQL.

## Run locally

Start MySQL in Laragon. This setup uses port `3307` and database `book_management`.

In Laragon Terminal, from this folder, run:

```powershell
composer install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
php artisan key:generate
php artisan migrate
php artisan serve
```

Open `http://127.0.0.1:8000`. Use the Laragon database manager to connect to `127.0.0.1:3307` and view the `book_management` database and `books` table. The `.env` file contains the MySQL username and password settings.

## Book API

Use JSON with `title`, `author`, `genre`, and `year_published`.

- `GET /api/books` (optional `?search=` searches title and author)
- `POST /api/books`
- `GET /api/books/{id}`
- `PUT /api/books/{id}`
- `DELETE /api/books/{id}`

## AniBayan

AniBayan is a working prototype served from `public/anibayan/`. With the app running, open `http://127.0.0.1:8000/anibayan/` and sign in with a test account. Every test account uses the password `anibayan`.

- `alex@example.com`: buyer (shop, cart, checkout, orders)
- `ramon@example.com`: representative of Benguet Highland Growers (orders, listings, members)
- `admin@example.com`: administrator (accounts, user reports, organization applications, site health)

AniBayan keeps its data in the browser for now, not in MySQL. Features, test accounts, source and build steps are in `resources/anibayan/README.md`.
