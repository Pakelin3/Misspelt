import os
from werkzeug.serving import run_simple
from werkzeug.middleware.shared_data import SharedDataMiddleware # <--- CAMBIO AQUÍ
from django.core.wsgi import get_wsgi_application
from django.conf import settings # Importar settings

# Configura los settings de Django
# Asegúrate que 'backend.settings' sea el path correcto a tu settings.py
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
# Ya que los settings se cargan con get_wsgi_application, no necesitas settings.configure()
# settings.configure() # COMENTA o ELIMINA esta línea si la habías añadido

application = get_wsgi_application()

# Rutas a tus certificados SSL/TLS (creados con mkcert, como antes)
# Asegúrate que 'localhost.pem' y 'localhost-key.pem' esten en la misma carpeta que manage.py
# y que settings.BASE_DIR apunte a la ruta correcta (Jwt-Auth/backend/)
cert_file = os.path.join(settings.BASE_DIR, 'localhost+1.pem')
key_file = os.path.join(settings.BASE_DIR, 'localhost+1-key.pem')

# Añade STATIC_URL y MEDIA_URL para que Werkzeug los sirva
application = SharedDataMiddleware(application, {
    settings.STATIC_URL: settings.STATIC_ROOT if settings.STATIC_ROOT else os.path.join(settings.BASE_DIR, 'static'), # Manejar caso de STATIC_ROOT vacío
    settings.MEDIA_URL: settings.MEDIA_ROOT,   # Para servir archivos de medios
})

if __name__ == '__main__':
    print(f"Starting HTTPS development server at https://127.0.0.1:8000/")
    print(f"Serving static files from: {settings.STATIC_ROOT if settings.STATIC_ROOT else os.path.join(settings.BASE_DIR, 'static')}")
    print(f"Serving media files from: {settings.MEDIA_ROOT}")
    run_simple(
        '127.0.0.1',
        8000,
        application,
        use_reloader=True, # Para recargar el servidor en cambios de código
        use_debugger=True, # Para un depurador interactivo en el navegador
        ssl_context=(cert_file, key_file)
    )