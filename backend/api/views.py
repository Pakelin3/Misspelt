# api/views.py

from rest_framework import generics, status, viewsets, mixins
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from api.models import User, Word, Badge, UserStats, EmailVerificationToken, Avatar #
from api.services import award_badge_rewards #
from api.badge_unlock_logic import check_and_unlock_badges #
from django.shortcuts import redirect
from django.conf import settings
from django.db.models import F
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
class MyTokenObtainPairView(TokenObtainPairView): #
    serializer_class = myTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
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
class LogoutView(APIView): #
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user = request.user
        user.is_online = False 
        user.save() 
        return Response({"detail": "Sesión cerrada exitosamente."}, status=status.HTTP_200_OK)
    

# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA VERIFICACION DE EMAIL ---
# * --------------------------------------------------------------------------------------------------
class VerifyEmailView(APIView): #
    permission_classes = [AllowAny]

    def get(self, request, token, *args, **kwargs):
        try:
            verification_token = EmailVerificationToken.objects.get(token=token) #
            user = verification_token.user

            if user.profile.verified:
                return redirect(f"{settings.FRONTEND_URL}/verify-email?status=already_verified") #

            if verification_token.is_valid(): #
                user.profile.verified = True #
                user.profile.save() #
                verification_token.delete()

                return redirect(f"{settings.FRONTEND_URL}/verify-email?status=success")
            else:
                verification_token.delete() 
                return redirect(f"{settings.FRONTEND_URL}/verify-email?status=expired_or_invalid")

        except EmailVerificationToken.DoesNotExist: #
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
    #permission_classes = [IsAuthenticated, IsAdminUser]

# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA AVATARES (CRUD) ---
# * --------------------------------------------------------------------------------------------------
class AvatarViewSet(viewsets.ModelViewSet): 
    queryset = Avatar.objects.all().order_by('name') 
    serializer_class = AvatarSerializer 
    # Restringir permisos solo a administradores, ya que el CRUD es para gestión
    #permission_classes = [IsAuthenticated, IsAdminUser]


# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA ESTADISTICAS DE USUARIOS (CRUD) ---
# * --------------------------------------------------------------------------------------------------
class UserStatsViewSet(
    mixins.RetrieveModelMixin,   # Permite GET para detalle por ID (admin)
    mixins.UpdateModelMixin,     # Permite PUT/PATCH para detalle por ID (admin)
    mixins.ListModelMixin,       # Permite GET para lista (admin)
    viewsets.GenericViewSet      # Base para vistas que manejan operaciones específicas
):
    serializer_class = UserStatsSerializer #

    def get_queryset(self):
        """
        Permite a los administradores ver todas las estadísticas.
        Un usuario normal solo puede ver las suyas.
        """
        if self.request.user.is_staff: #
            return UserStats.objects.all().order_by('user__username') #
        return UserStats.objects.filter(user=self.request.user) #

    def get_permissions(self):
        """
        Ajusta los permisos para la acción 'me' (cualquier autenticado)
        y para las otras acciones (solo admins).
        """
        if self.action == 'me':
            self.permission_classes = [IsAuthenticated] # Cualquier usuario autenticado puede ver sus propias stats
        elif self.action in ['retrieve', 'list', 'update', 'partial_update']:
            self.permission_classes = [IsAuthenticated, IsAdminUser] # Para operaciones estándar, solo admin
        else:
            self.permission_classes = [IsAuthenticated] # Permisos por defecto para otras acciones
        return super().get_permissions()

    @action(detail=False, methods=['get', 'patch']) # Permite GET y PATCH para la acción 'me'
    def me(self, request):
        """
        Obtiene o actualiza parcialmente las estadísticas del usuario autenticado.
        Si no existen, las crea.
        También verifica y desbloquea insignias.
        """
        user_stats, created = UserStats.objects.get_or_create(user=request.user) #

        if request.method == 'GET':
            # Ejecutar check_and_unlock_badges en cada GET a /me/
            # Esto asegura que los badges se verifiquen y desbloqueen justo antes de devolver los datos.
            newly_unlocked_badges_on_get = check_and_unlock_badges(request.user) 
            # Recargar user_stats para obtener los cambios si los hubo (ej. badge añadido)
            user_stats.refresh_from_db() 
            serializer = self.get_serializer(user_stats)
            response_data = serializer.data
            
            # Incluir badges desbloqueados en esta petición GET
            if newly_unlocked_badges_on_get:
                response_data['newly_unlocked_badges_on_get'] = [badge.title for badge in newly_unlocked_badges_on_get]

            return Response(response_data)
        
        elif request.method == 'PATCH':
            # Usar partial=True para PATCH, actualiza solo los campos enviados
            serializer = self.get_serializer(user_stats, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            newly_unlocked_badges_on_patch = check_and_unlock_badges(request.user)
            
            response_data = serializer.data
            response_data['newly_unlocked_badges'] = [badge.title for badge in newly_unlocked_badges_on_patch]

            return Response(response_data)


# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA USUARIOS (CRUD) ---
# * --------------------------------------------------------------------------------------------------
class AdminUserViewSet(viewsets.ReadOnlyModelViewSet): # Usamos ReadOnly para evitar que el admin de frontend modifique usuarios directamente aquí
    queryset = User.objects.all().order_by('username') #
    serializer_class = AdminUserSerializer #
    permission_classes = [IsAuthenticated, IsAdminUser] #

# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA RUTAS ---
# * --------------------------------------------------------------------------------------------------
@api_view(['GET'])
def getRoutes(request): #
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
def testEndPoint(request): #
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
def process_game_action(request): #
    user = request.user
    newly_unlocked_badges = check_and_unlock_badges(user) #
    response_data = {
        'message': 'Acción procesada.',
        'newly_unlocked_badges': [badge.title for badge in newly_unlocked_badges]
    }
    return Response(response_data, status=status.HTTP_200_OK)

# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA EL JUEGO (GODOT) ---
# * --------------------------------------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_quiz_words(request):
    """
    Entrega un set de 10 palabras aleatorias para una ronda de juego en Godot.
    Opcional: ?limit=5&type=SLANG
    """
    limit = int(request.query_params.get('limit', 10))
    word_type = request.query_params.get('word_type', None)

    words = Word.objects.all()
    
    if word_type:
        words = words.filter(word_type=word_type)
    
    # Obtener aleatorias
    random_words = words.order_by('?')[:limit]
    
    serializer = WordSerializer(random_words, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_game_results(request):
    """
    Recibe los resultados de una partida desde Godot y actualiza las estadísticas.
    JSON Esperado:
    {
        "score": 100,
        "xp_earned": 50,
        "correct_answers": 5,
        "total_questions": 10,
        "word_type": "SLANG" (opcional)
    }
    """
    user = request.user
    data = request.data
    
    # 1. Extraer datos enviados por Godot
    score = data.get('score', 0)
    xp_earned = data.get('xp_earned', 0)
    correct_count = data.get('correct_answers', 0)
    total_questions = data.get('total_questions', 0)
    game_word_type = data.get('word_type', 'NONE')

    # 2. Guardar en Historial de Partidas
    from api.models import GameHistory # Asegúrate de tener importado esto
    GameHistory.objects.create(
        user=user,
        score=score,
        correct_in_game=correct_count,
        total_questions_in_game=total_questions
    )

    # 3. Actualizar UserStats (Usamos F() para evitar condiciones de carrera)
    stats, _ = UserStats.objects.get_or_create(user=user)
    
    stats.experience = F('experience') + xp_earned
    stats.total_questions_answered = F('total_questions_answered') + total_questions
    stats.correct_answers_total = F('correct_answers_total') + correct_count
    
    # Actualizar contadores específicos
    if game_word_type == 'SLANG':
        stats.total_slangs_questions = F('total_slangs_questions') + total_questions
        stats.correct_slangs = F('correct_slangs') + correct_count
    elif game_word_type == 'PHRASAL_VERB':
        stats.total_phrasal_verbs_questions = F('total_phrasal_verbs_questions') + total_questions
        stats.correct_phrasal_verbs = F('correct_phrasal_verbs') + correct_count
        
    # Manejo básico de Racha (Streak) - Simplificado
    # Godot debería enviar si mantuvo la racha, pero aquí asumimos que si jugó, suma racha.
    # Para lógica real de racha diaria, se requiere comparar fechas.
    from django.utils import timezone
    today = timezone.now().date()

    # 4. Actualizar palabras desbloqueadas
    seen_word_ids = data.get('seen_word_ids', [])
    
    if seen_word_ids:
        stats, _ = UserStats.objects.get_or_create(user=user)
        words_to_unlock = Word.objects.filter(id__in=seen_word_ids)
        stats.unlocked_words.add(*words_to_unlock)
        stats.words_seen_total = stats.unlocked_words.count()
        stats.save()
    
    if stats.last_login_date != today:
        stats.current_streak = F('current_streak') + 1
        stats.last_login_date = today
    
    stats.save()
    
    # Recargar stats para tener los valores numéricos actualizados (por el uso de F)
    stats.refresh_from_db()

    # Actualizar Longest Streak si es necesario
    if stats.current_streak > stats.longest_streak:
        stats.longest_streak = stats.current_streak
        stats.save()

    # 5. Verificar Insignias (Badges)
    newly_unlocked = check_and_unlock_badges(user)

    return Response({
        'message': 'Partida guardada correctamente',
        'new_xp': stats.experience,
        'new_level': stats.get_level(),
        'badges_unlocked': [b.title for b in newly_unlocked]
    }, status=status.HTTP_200_OK)

# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA EL JUEGO (QUIZ) ---
# * --------------------------------------------------------------------------------------------------
def get_quiz_question(word_id):
    correct_word = Word.objects.get(id=word_id)
    
    # 1. Buscar distractores inteligentes (mismo tag)
    tag_list = correct_word.tags.split(',')
    distractors = Word.objects.filter(tags__icontains=tag_list[0]).exclude(id=correct_word.id)[:3] 
    # 2. Si faltan, rellenar con aleatorios
    if len(distractors) < 3:
        randoms = Word.objects.exclude(id=correct_word.id).order_by('?')[:3 - len(distractors)]
    
    return {
        "question": f"¿Cómo se dice '{correct_word.translation}'?",
        "options": [correct_word.text] + [d.text for d in distractors], # (luego se desordena en frontend)
        "accepted_answers": [correct_word.text] + [s.text for s in correct_word.substitutes.all()]
    }