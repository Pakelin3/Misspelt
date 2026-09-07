"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls'))
]

# Los avatares e insignias se sirven en /media/..., que es exactamente la URL que
# construyen los serializers con `request.build_absolute_uri(obj.image.url)`.
# Estaba declarado dentro de api/urls.py, donde heredaba el prefijo `api/`, asi
# que /media/avatars/... devolvia 404 y NINGUNA imagen de avatar o insignia
# cargaba en la aplicacion. En produccion las sirve el servidor web, no Django.
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
