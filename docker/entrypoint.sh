#!/bin/sh
set -eu

PORT="${PORT:-10000}"
APP_URL="${APP_URL:-${RENDER_EXTERNAL_URL:-http://localhost}}"
PAYMONGO_IMAGE_URL="${PAYMONGO_IMAGE_URL:-${APP_URL%/}/anibayan/assets}"

export PORT APP_URL PAYMONGO_IMAGE_URL

sed -i "s/Listen 80/Listen ${PORT}/" /etc/apache2/ports.conf
sed -i "s/<VirtualHost \*:80>/<VirtualHost *:${PORT}>/" /etc/apache2/sites-available/000-default.conf

mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs bootstrap/cache public/anibayan/uploads
chown -R www-data:www-data storage bootstrap/cache public/anibayan/uploads

if [ ! -e public/storage ]; then
    php artisan storage:link
fi

php artisan config:cache
exec apache2-foreground
