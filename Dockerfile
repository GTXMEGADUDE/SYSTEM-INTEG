FROM php:8.3-apache

RUN apt-get update \
    && apt-get install -y --no-install-recommends libcurl4-openssl-dev libonig-dev libpq-dev libzip-dev unzip \
    && docker-php-ext-install -j"$(nproc)" bcmath curl mbstring opcache pdo_pgsql pgsql zip \
    && a2enmod headers rewrite \
    && rm -rf /var/lib/apt/lists/*

RUN printf 'expose_php=Off\n' > /usr/local/etc/php/conf.d/99-security.ini
RUN printf 'ServerTokens Prod\nServerSignature Off\n' > /etc/apache2/conf-available/zz-anibayan-security.conf \
    && a2enconf zz-anibayan-security

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

WORKDIR /var/www/html
COPY . .

RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker/apache-vhost.conf /etc/apache2/sites-available/000-default.conf
COPY docker/entrypoint.sh /usr/local/bin/anibayan-entrypoint
RUN chmod +x /usr/local/bin/anibayan-entrypoint

EXPOSE 10000
ENTRYPOINT ["/usr/local/bin/anibayan-entrypoint"]
