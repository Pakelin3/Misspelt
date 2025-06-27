from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.pagination import PageNumberPagination 
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import filters
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from api.models import User, Profile, Word, Badge, UserStats, EmailVerificationToken
from django.http import HttpResponse
from django.shortcuts import redirect
from django.conf import settings
import random
from api.serializer import (
    UserSerializer,
    myTokenObtainPairSerializer,
    RegisterSerializer,
    WordSerializer,
    BadgeSerializer,
    UserStatsSerializer,
    AdminUserSerializer,
)



class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = myTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs) 
        if response.status_code == 200:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')
            print("\n--- TOKEN JWT GENERADO ---")
            print(f"Access Token: {access_token}")
            print(f"Refresh Token: {refresh_token}")
            print("--------------------------\n")

        return response 
    
class VerifyEmailView(APIView):
    permission_classes = [AllowAny] # No requiere autenticación para verificar

    def get(self, request, token, *args, **kwargs):
        try:
            verification_token = EmailVerificationToken.objects.get(token=token)
            user = verification_token.user

            if user.profile.verified:
                # El usuario ya está verificado, redirige a una página de éxito
                return redirect(f"{settings.FRONTEND_URL}/verify-email?status=already_verified")

            if verification_token.is_valid():
                # Marca el perfil del usuario como verificado
                user.profile.verified = True
                user.profile.save()
                verification_token.delete() # Elimina el token después de usarlo

                # Redirige al frontend a una página de éxito
                return redirect(f"{settings.FRONTEND_URL}/verify-email?status=success")
            else:
                # Token inválido (expirado o ya usado)
                verification_token.delete() # Elimina tokens expirados/inválidos para limpieza
                return redirect(f"{settings.FRONTEND_URL}/verify-email?status=expired_or_invalid")

        except EmailVerificationToken.DoesNotExist:
            # Token no encontrado en la base de datos
            return redirect(f"{settings.FRONTEND_URL}/verify-email?status=token_not_found")
        except Exception as e:
            # Cualquier otro error
            print(f"Error durante la verificación del email: {e}")
            return redirect(f"{settings.FRONTEND_URL}/login?verified=true")
        
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    def perform_create(self, serializer):
        user = serializer.save()

class AdminDashboardDataAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser] 

    def get(self, request, *args, **kwargs):
        dashboard_stats = {
            'message': f'¡Bienvenido {request.user.username} al Panel de Administración!',
            'total_users': User.objects.count(),
            'active_users': User.objects.filter(is_active=True).count(),
            'total_words': Word.objects.count(),
            'total_badges': Badge.objects.count(),
        }
        return Response(dashboard_stats, status=status.HTTP_200_OK)

class UserIsStaffAPIView(APIView):
    permission_classes = [IsAuthenticated] 

    def get(self, request, *args, **kwargs):
        is_staff_user = request.user.is_staff or request.user.is_superuser
        return Response({'is_staff': is_staff_user}, status=status.HTTP_200_OK)

class WordPagination(PageNumberPagination):
    page_size = 6
    page_size_query_param = 'limit'
    max_page_size = 100
# ViewSet para la gestión completa de Palabras (CRUD)
class WordViewSet(viewsets.ModelViewSet):
    queryset = Word.objects.all().order_by('-created_at')
    serializer_class = WordSerializer
    pagination_class = WordPagination

    # Temporalmente REMOVEMOS filters.SearchFilter de filter_backends
    # Y lo haremos manualmente en get_queryset
    filter_backends = [DjangoFilterBackend] 
    filterset_fields = ['word_type']
    # search_fields = ['text', 'description'] # Esto ya no es necesario si lo haces manualmente

    def get_queryset(self):
        queryset = super().get_queryset()
        search_param = self.request.query_params.get('search')
        if search_param:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(text__icontains=search_param) | Q(description__icontains=search_param)
            )
        return queryset


    @action(detail=False, methods=['get'])
    def random(self, request):
        word = Word.objects.order_by('?').first()
        if word:
            serializer = self.get_serializer(word)
            return Response(serializer.data)
        return Response({'detail': 'No words found'}, status=404)


# ViewSet para la gestión completa de Insignias (CRUD)
class BadgeViewSet(viewsets.ModelViewSet):
    queryset = Badge.objects.all().order_by('title')
    serializer_class = BadgeSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

# ViewSet para ver estadísticas individuales de usuarios (solo lectura para el admin)
class UserStatsViewSet(viewsets.ReadOnlyModelViewSet): 
    queryset = UserStats.objects.all().order_by('user__username') # Ordena por nombre de usuario
    serializer_class = UserStatsSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

# ViewSet para listar y ver detalles de usuarios para el administrador (solo lectura)
class AdminUserViewSet(viewsets.ReadOnlyModelViewSet): # Usamos ReadOnly para evitar que el admin de frontend modifique usuarios directamente aquí
    queryset = User.objects.all().order_by('username')
    serializer_class = AdminUserSerializer 
    permission_classes = [IsAuthenticated, IsAdminUser]


@api_view(['GET'])
def getRoutes(request):
    routes = [
        '/api/token/',
        '/api/register/',
        '/api/token/refresh/',
        '/api/admin/dashboard-data/',
        '/api/user/is-staff/',     
        
        # Rutas CRUD para Word (generadas por el router)
        '/api/admin/words/',         # GET (lista), POST (crear)
        '/api/admin/words/<id>/',    # GET (detalle), PUT/PATCH (actualizar), DELETE (eliminar)
        
        # Rutas CRUD para Badge (generadas por el router)
        '/api/admin/badges/',
        '/api/admin/badges/<id>/',

        # Rutas para UserStats (generadas por el router, solo lectura)
        '/api/admin/user-stats/',
        '/api/admin/user-stats/<id>/',

        # Rutas para Users (generadas por el router, solo lectura para admin)
        '/api/admin/users/',
        '/api/admin/users/<id>/',
    ]
    return Response(routes)


@api_view(['GET' , 'POST'])
@permission_classes([IsAuthenticated])
def testEndPoint(request):
    if request.method == 'GET':
        message = f'Bienvenido {request.user} al dashboard [GET request]'
        return Response({'message': message}, status=status.HTTP_200_OK)
    elif request.method == 'POST':
        text = request.data.get('text')
        message = f'epale {request.user.username} has enviado el texto: {text} [POST request]' 
        return Response({'message': message}, status=status.HTTP_200_OK)
    return Response({'detail': 'Método no permitido'}, status=status.HTTP_405_METHOD_NOT_ALLOWED)

