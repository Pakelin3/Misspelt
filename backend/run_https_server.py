import os
from werkzeug.serving import run_simple  # pyright: ignore[reportMissingImports]
from werkzeug.middleware.shared_data import SharedDataMiddleware
from django.core.wsgi import get_wsgi_application
from django.conf import settings

# Configura los settings de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

application = get_wsgi_application()

# Rutas a tus certificados SSL/TLS
# Asegúrate que 'localhost+1.pem' y 'localhost+1-key.pem' estén en la misma carpeta que manage.py
cert_file = os.path.join(settings.BASE_DIR, 'localhost+1.pem') #
key_file = os.path.join(settings.BASE_DIR, 'localhost+1-key.pem') #

# SharedDataMiddleware para servir archivos estáticos y de medios
# Se asume que settings.STATIC_ROOT está definido y que se ha ejecutado `collectstatic`
# para que los archivos estáticos de Django Admin y Jazzmin estén allí.
application = SharedDataMiddleware(application, {
    settings.STATIC_URL: settings.STATIC_ROOT, #
    settings.MEDIA_URL: settings.MEDIA_ROOT,   #
})

if __name__ == '__main__':
    # Mensajes de depuración para confirmar las rutas que Werkzeug usará
    print(f"Starting HTTPS development server at https://127.0.0.1:8000/")
    print(f"Serving static files from STATIC_ROOT: {settings.STATIC_ROOT}") # Confirma la ruta de STATIC_ROOT
    print(f"Serving media files from MEDIA_ROOT: {settings.MEDIA_ROOT}")   # Confirma la ruta de MEDIA_ROOT
    
    run_simple(
        '127.0.0.1',
        8000,
        application,
        use_reloader=True,
        use_debugger=True,
        ssl_context=(cert_file, key_file)
    )