#!/bin/bash
# SmartSales AI — Mac/Linux Setup Script
set -e

cd "$(dirname "$0")/backend"

echo ""
echo "SmartSales AI — Setup"
echo "====================="
echo ""

echo "[1/4] Installing PHP dependencies..."
composer install --no-interaction --prefer-dist --optimize-autoloader

echo ""
echo "[2/4] Setting up environment..."
if [ ! -f .env ]; then
  cp .env.example .env
  php artisan key:generate
  php artisan jwt:secret
fi

echo ""
echo "[3/4] Running database migrations + seed..."
php artisan migrate --seed

echo ""
echo "[4/4] Done!"
echo ""
echo "======================================================"
echo " Open 3 terminal tabs and run:"
echo ""
echo "  Tab 1: cd backend  && php artisan serve"
echo "  Tab 2: cd backend  && php artisan queue:work --queue=ai,default"
echo "  Tab 3: cd frontend && npm install && ng serve"
echo ""
echo "  Login: admin@smartsales.dev / Password1"
echo "======================================================"
