# api/views.py

from rest_framework import generics, status, viewsets, mixins
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from api.models import User, Word, Badge, UserStats, EmailVerificationToken, Avatar, GameHistory
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
                Q(text__icontains=search_param) | Q(definition__icontains=search_param)
            )
        return queryset


    @action(detail=False, methods=['get'])
    def random(self, request):
        word = Word.objects.order_by('?').first()
        if word:
            serializer = self.get_serializer(word)
            return Response(serializer.data)
        return Response({'detail': 'No words found'}, status=404)

    @action(detail=False, methods=['post'])
    def import_csv(self, request):
        import csv
        import io
        from django.db import transaction

        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file was provided.'}, status=400)
            
        if not file.name.endswith('.csv'):
            return Response({'error': 'The file must be a .csv file.'}, status=400)

        decoded_file = file.read().decode('utf-8')
        io_string = io.StringIO(decoded_file)
        # Assuming the CSV has a header row like:
        # word,translation,word_type,difficulty_level,definition,tags,ex1_en,ex1_es,ex2_en,ex2_es
        reader = csv.DictReader(io_string)

        words_to_create = []
        errors = []

        try:
            with transaction.atomic():
                for index, row in enumerate(reader, start=2): 
                    text = row.get('word', '').strip()
                    definition = row.get('definition', '').strip()
                    
                    if not text or not definition:
                        errors.append(f"Row {index}: 'word' and 'definition' are required.")
                        continue
                        
                    if Word.objects.filter(text__iexact=text).exists():
                        errors.append(f"Row {index}: Word '{text}' already exists.")
                        continue

                    examples = []
                    
                    if row.get('ex1_en') and row.get('ex1_es'):
                        examples.append({'en': row.get('ex1_en').strip(), 'es': row.get('ex1_es').strip()})
                    if row.get('ex2_en') and row.get('ex2_es'):
                        examples.append({'en': row.get('ex2_en').strip(), 'es': row.get('ex2_es').strip()})
                        
                    word_type = row.get('word_type', '').strip().upper()
                    valid_types = [choice[0] for choice in Word.WordType.choices]
                    if word_type not in valid_types:
                        word_type = Word.WordType.SLANG

                    try:
                        difficulty_level = int(row.get('difficulty_level', 1))
                    except ValueError:
                        difficulty_level = 1

                    word_instance = Word(
                        text=text,
                        translation=row.get('translation', '').strip(),
                        definition=definition,
                        word_type=word_type,
                        difficulty_level=difficulty_level,
                        tags=row.get('tags', '').strip(),
                        examples=examples
                    )
                    words_to_create.append(word_instance)
                
                if errors:
                    raise ValueError("Validation failed")
                    
                Word.objects.bulk_create(words_to_create)
                
        except ValueError:
            return Response({'errors': errors}, status=400)
        except Exception as e:
            return Response({'error': f"Uncaught error processing CSV: {str(e)}"}, status=500)

        return Response({
            'message': f"Successfully imported {len(words_to_create)} words.",
            'count': len(words_to_create)
        }, status=201)


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
    Entrega un set de palabras aleatorias para una ronda de juego en Godot.
    Opcional: ?limit=5&type=SLANG&difficulty=EASY
    """
    limit = int(request.query_params.get('limit', 10))
    word_type = request.query_params.get('word_type', None)
    difficulty = request.query_params.get('difficulty', None)

    words = Word.objects.all()
    
    if word_type:
        words = words.filter(word_type=word_type)
        
    if difficulty:
        difficulty = difficulty.upper()
        if difficulty == 'EASY':
            words = words.filter(difficulty_level__lte=3)
        elif difficulty == 'NORMAL':
            words = words.filter(difficulty_level__gt=3, difficulty_level__lte=6)
        elif difficulty == 'HARD':
            words = words.filter(difficulty_level__gt=6)

    random_words = words.order_by('?')[:limit]
    
    serializer = WordSerializer(random_words, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_game_results(request):
    data = request.data
    user = request.user
    
    score = data.get('score', 0)
    xp_earned = data.get('xp_earned', 0)
    correct_answers = data.get('correct_answers', 0)
    total_questions = data.get('total_questions', 0)
    game_mode = data.get('game_mode', 'SURVIVOR')
    
    time_spent = data.get('time_spent', 0)
    seen_word_ids = data.get('seen_word_ids', [])
    correct_word_ids = data.get('correct_word_ids', [])

    try:
        stats = UserStats.objects.get(user=user)
    except UserStats.DoesNotExist:
        return Response({'error': 'UserStats no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    seen_words = Word.objects.filter(id__in=seen_word_ids)
    correct_words = Word.objects.filter(id__in=correct_word_ids)

    match_breakdown = {
        "seen": {"SLANG": 0, "IDIOM": 0, "PHRASAL_VERB": 0, "VOCABULARY": 0},
        "correct": {"SLANG": 0, "IDIOM": 0, "PHRASAL_VERB": 0, "VOCABULARY": 0}
    }

    for w in seen_words:
        if w.word_type in match_breakdown["seen"]:
            match_breakdown["seen"][w.word_type] += 1
        stats.words_seen_total = F('words_seen_total') + 1
        if w.word_type == "SLANG": stats.slangs_seen = F('slangs_seen') + 1
        elif w.word_type == "PHRASAL_VERB": stats.phrasal_verbs_seen = F('phrasal_verbs_seen') + 1

    for w in correct_words:
        if w.word_type in match_breakdown["correct"]:
            match_breakdown["correct"][w.word_type] += 1
            
            if w.word_type == "SLANG": 
                stats.slangs_learned = F('slangs_learned') + 1
                stats.correct_slangs = F('correct_slangs') + 1
            elif w.word_type == "IDIOM": 
                stats.idioms_learned = F('idioms_learned') + 1
            elif w.word_type == "PHRASAL_VERB": 
                stats.phrasal_verbs_learned = F('phrasal_verbs_learned') + 1
                stats.correct_phrasal_verbs = F('correct_phrasal_verbs') + 1
            elif w.word_type == "VOCABULARY": 
                stats.vocabulary_learned = F('vocabulary_learned') + 1
                
    stats.save()
    
    if correct_words.exists():
        stats.unlocked_words.add(*correct_words)

    stats.experience = F('experience') + xp_earned
    stats.total_questions_answered = F('total_questions_answered') + total_questions
    stats.correct_answers_total = F('correct_answers_total') + correct_answers
    
    from django.utils import timezone
    today = timezone.now().date()
    if stats.last_login_date != today:
        stats.current_streak = F('current_streak') + 1
        stats.last_login_date = today
        
    stats.save()
    stats.refresh_from_db()

    if stats.current_streak > stats.longest_streak:
        stats.longest_streak = stats.current_streak
        stats.save()

    # 4. Crear el Historial
    from api.models import GameHistory
    GameHistory.objects.create(
        user=user,
        score=score,
        correct_in_game=correct_answers,
        total_questions_in_game=total_questions,
        game_mode=game_mode,
        time_spent_seconds=time_spent,
        match_breakdown=match_breakdown
    )

    newly_unlocked = check_and_unlock_badges(user)

    return Response({
        'message': 'Partida guardada correctamente',
        'new_xp': stats.experience,
        'new_level': stats.get_level(),
        'badges_unlocked': [
            {
                'title': b.title,
                'image': request.build_absolute_uri(b.image.url) if b.image else None
            } 
            for b in newly_unlocked
        ],
        'match_breakdown': match_breakdown,
        'time_spent': time_spent
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