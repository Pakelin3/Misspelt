from rest_framework import permissions

class IsInAdministratorsGroup(permissions.BasePermission):
    """
    Permiso personalizado para permitir el acceso solo a usuarios en el grupo 'Administrators'.
    """
    def has_permission(self, request, view):
        # Asume que el usuario está autenticado si se usa esta clase de permiso
        return bool(request.user and request.user.groups.filter(name='Administrators').exists())