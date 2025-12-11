#!/bin/bash
# --- Script de Encendido Automático ---

APP_PATH="/Users/elenagarciagarcia/Desktop/app_psicologos"
VENV_ACTIVATE="$APP_PATH/venv/bin/activate"

# Función para limpiar y salir
cleanup() {
    echo "--- Deteniendo servidores... ---"
    kill $DJANGO_PID $REACT_PID 2>/dev/null
    echo "Aplicación detenida."
    exit
}
trap cleanup SIGINT

# --- 1. ACTIVAR ENTORNO VIRTUAL Y ARRANCAR DJANGO ---
echo "⚙️ Iniciando Backend (Django) en http://localhost:8000"
cd "$APP_PATH"
source "$VENV_ACTIVATE"
python manage.py runserver &
DJANGO_PID=$!
sleep 3 # Dar tiempo para que Django arranque

# --- 2. ARRANCAR REACT ---
echo "⚛️ Iniciando Frontend (React) en http://localhost:5173"
cd frontend
npm run dev &
REACT_PID=$!
sleep 5

# --- 3. ABRIR EN EL NAVEGADOR ---
open http://localhost:5173

echo "--- Servidores activos: Django (PID $DJANGO_PID), React (PID $REACT_PID) ---"
echo "Pulsa Control+C para cerrar AMBOS servidores."
wait