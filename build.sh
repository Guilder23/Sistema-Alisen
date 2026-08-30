#!/usr/bin/env bash
# exit on error
set -o errexit

echo "==== Actualizando pip ===="
pip install --upgrade pip

echo "==== Instalando dependencias ===="
pip install -r requirements.txt

echo "==== Recolectando archivos estáticos ===="
python manage.py collectstatic --no-input

echo "==== Ejecutando migraciones ===="
python manage.py migrate

echo "==== Limpieza opcional de ventas al deploy ===="
python scripts/clean_sales_on_deploy.py

echo "==== Creando usuarios iniciales ===="
python manage.py crear_administrador

echo "==== Build completado exitosamente ===="