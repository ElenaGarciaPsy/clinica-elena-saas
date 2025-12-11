#!/usr/bin/env bash
# Exit on error
set -o errexit

# 1. Instalar dependencias
pip install -r requirements.txt

# 2. Preparar la Base de Datos (Migraciones)
python manage.py migrate

# 3. Crear el Superusuario automáticamente (Script de Python incrustado)
python -c "
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='finaltest').exists():
    User.objects.create_superuser('finaltest', 'admin@example.com', 'final1234')
    print('✅ Superusuario finaltest creado exitosamente')
else:
    print('ℹ️ El usuario finaltest ya existe')
"