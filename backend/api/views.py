from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.pagination import PageNumberPagination 
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from api.models import User, Word, Badge, UserStats, EmailVerificationToken, Avatar
from api.services import award_badge_rewards
from api.badge_unlock_logic import check_and_unlock_badges
from django.shortcuts import redirect
from django.conf import settings
from api.serializer import (
    myTokenObtainPairSerializer,
    RegisterSerializer,
    WordSerializer,
    BadgeSerializer,
    UserStatsSerializer,
    AdminUserSerializer,
    AvatarSerializer
)


# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA AUTENTICACION ---
# * --------------------------------------------------------------------------------------------------
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = myTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        response = Response(serializer.validated_data, status=status.HTTP_200_OK)
        user = serializer.user 

        if user:
            user.is_online = True
            user.save() 

            print("\n--- TOKEN JWT GENERADO ---")
            print(f"Access Token: {response.data.get('access')}")
            print(f"Refresh Token: {response.data.get('refresh')}")
            print("--------------------------\n")
        
        return response

# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA CIERRE DE SESION ---
# * --------------------------------------------------------------------------------------------------
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        user.is_online = False 
        user.save() 
        return Response({"detail": "Sesión cerrada exitosamente."}, status=status.HTTP_200_OK)
    

# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA VERIFICACION DE EMAIL ---
# * --------------------------------------------------------------------------------------------------
class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token, *args, **kwargs):
        try:
            verification_token = EmailVerificationToken.objects.get(token=token)
            user = verification_token.user

            if user.profile.verified:
                return redirect(f"{settings.FRONTEND_URL}/verify-email?status=already_verified")

            if verification_token.is_valid():
                user.profile.verified = True
                user.profile.save()
                verification_token.delete()

                return redirect(f"{settings.FRONTEND_URL}/verify-email?status=success")
            else:
                verification_token.delete() 
                return redirect(f"{settings.FRONTEND_URL}/verify-email?status=expired_or_invalid")

        except EmailVerificationToken.DoesNotExist:
            return redirect(f"{settings.FRONTEND_URL}/verify-email?status=token_not_found")
        except Exception as e:
            print(f"Error durante la verificación del email: {e}")
            return redirect(f"{settings.FRONTEND_URL}/login?verified=true")

# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA REGISTRO DE USUARIO ---
# * --------------------------------------------------------------------------------------------------
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer
    def perform_create(self, serializer):
        user = serializer.save()

# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA DASHBOARD ADMIN ---
# * --------------------------------------------------------------------------------------------------
class AdminDashboardDataAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAdminUser] 

    def get(self, request, *args, **kwargs):
        dashboard_stats = {
            'message': f'¡Bienvenido {request.user.username} al Panel de Administración!',
            'total_users': User.objects.count(),
            'active_users': User.objects.filter(is_online=True).count(),
            'total_words': Word.objects.count(),
            'total_badges': Badge.objects.count(),
        }
        return Response(dashboard_stats, status=status.HTTP_200_OK)

# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA DASHBOARD USUARIO ---
# * --------------------------------------------------------------------------------------------------
class UserIsStaffAPIView(APIView):
    permission_classes = [IsAuthenticated] 

    def get(self, request, *args, **kwargs):
        is_staff_user = request.user.is_staff or request.user.is_superuser
        return Response({'is_staff': is_staff_user}, status=status.HTTP_200_OK)

# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA PAGINACION ---
# * --------------------------------------------------------------------------------------------------
class WordPagination(PageNumberPagination):
    page_size = 6
    page_size_query_param = 'limit'
    max_page_size = 100

# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA PALABRAS (CRUD) ---
# * --------------------------------------------------------------------------------------------------
class WordViewSet(viewsets.ModelViewSet):
    queryset = Word.objects.all().order_by('-created_at')
    serializer_class = WordSerializer
    pagination_class = WordPagination
    filter_backends = [DjangoFilterBackend] 
    filterset_fields = ['word_type']

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


# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA INSIGNIAS (CRUD) ---
# * --------------------------------------------------------------------------------------------------
class BadgeViewSet(viewsets.ModelViewSet):
    queryset = Badge.objects.all().order_by('title')
    serializer_class = BadgeSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA ESTADISTICAS DE USUARIOS (CRUD) ---
# * --------------------------------------------------------------------------------------------------
class UserStatsViewSet(viewsets.ReadOnlyModelViewSet): 
    queryset = UserStats.objects.all().order_by('user__username') # Ordena por nombre de usuario
    serializer_class = UserStatsSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]

# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA AVATARES (CRUD) ---
# * --------------------------------------------------------------------------------------------------
class AvatarViewSet(viewsets.ModelViewSet):
    queryset = Avatar.objects.all().order_by('name') # Consulta todos los avatares, ordenados por nombre
    serializer_class = AvatarSerializer # Usa el serializador que acabas de crear
    # Restringir permisos solo a administradores, ya que el CRUD es para gestión
    permission_classes = [IsAuthenticated, IsAdminUser]
    # No necesitas paginación si la lista de avatares no es muy grande,
    # pero puedes añadirla si es necesario (como en WordPagination)

# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA ESTADISTICAS DE USUARIOS (CRUD) ---
# * --------------------------------------------------------------------------------------------------
class UserStatsViewSet(viewsets.ReadOnlyModelViewSet): 
    serializer_class = UserStatsSerializer #

    def get_queryset(self):
        """
        Permite a los administradores ver todas las estadísticas,
        y a los usuarios normales ver solo las suyas.
        """
        if self.request.user.is_staff: #
            return UserStats.objects.all().order_by('user__username') #
        return UserStats.objects.filter(user=self.request.user) #

    def get_permissions(self):
        """
        Ajusta los permisos para la acción 'me' y otras.
        """
        if self.action == 'me':
            self.permission_classes = [IsAuthenticated] # Cualquier usuario autenticado puede ver sus propias stats
        else:
            self.permission_classes = [IsAuthenticated, IsAdminUser] # Para listado y detalle (por ID), solo admin
        return super().get_permissions()

    # ACERCIÓN 'me' - MOVIDA DENTRO DE LA CLASE
    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Obtiene las estadísticas del usuario actualmente autenticado.
        Si no existen, las crea.
        """
        user_stats, created = UserStats.objects.get_or_create(user=request.user) #
        serializer = self.get_serializer(user_stats)
        return Response(serializer.data)

# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA USUARIOS (CRUD) ---
# * --------------------------------------------------------------------------------------------------
class AdminUserViewSet(viewsets.ReadOnlyModelViewSet): # Usamos ReadOnly para evitar que el admin de frontend modifique usuarios directamente aquí
    queryset = User.objects.all().order_by('username')
    serializer_class = AdminUserSerializer 
    permission_classes = [IsAuthenticated, IsAdminUser]

# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA RUTAS ---
# * --------------------------------------------------------------------------------------------------
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


# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA TEST ENDPOINT ---
# * --------------------------------------------------------------------------------------------------
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


# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA PROCESAR ACCIONES DEL JUEGO ---
# * --------------------------------------------------------------------------------------------------
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_game_action(request):
    user = request.user
    newly_unlocked_badges = check_and_unlock_badges(user)
    response_data = {
        'message': 'Acción procesada.',
        'newly_unlocked_badges': [badge.title for badge in newly_unlocked_badges]
    }
    return Response(response_data, status=status.HTTP_200_OK)


