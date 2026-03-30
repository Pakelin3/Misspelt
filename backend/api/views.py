from rest_framework import generics, status, viewsets, mixins # pyright: ignore[reportMissingImports]
from rest_framework.decorators import api_view, permission_classes, action # pyright: ignore[reportMissingImports]
from rest_framework.pagination import PageNumberPagination # pyright: ignore[reportMissingImports]
from django_filters.rest_framework import DjangoFilterBackend # pyright: ignore[reportMissingImports]
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser # pyright: ignore[reportMissingImports]
from rest_framework.response import Response # pyright: ignore[reportMissingImports]
from rest_framework.views import APIView # pyright: ignore[reportMissingImports]
from rest_framework_simplejwt.views import TokenObtainPairView # pyright: ignore[reportMissingImports]
from api.models import User, Word, Badge, UserStats, EmailVerificationToken, Avatar, GameHistory, Farm
from api.services import award_badge_rewards
from api.badge_unlock_logic import check_and_unlock_badges
from django.shortcuts import redirect  # pyright: ignore[reportMissingImports]
from django.conf import settings # pyright: ignore[reportMissingImports]
import os
import google.generativeai as genai  # pyright: ignore[reportMissingImports]
from django.db.models import F, ExpressionWrapper, FloatField, Count # pyright: ignore[reportMissingImports]
from api.serializer import (
    myTokenObtainPairSerializer,
    RegisterSerializer,
    WordSerializer,
    BadgeSerializer,
    UserStatsSerializer,
    AdminUserSerializer,
    AvatarSerializer,
    GameHistorySerializer,
    ProfileUpdateSerializer,
    FarmSerializer,
    FarmDetailSerializer
)
import random
import string
from google.oauth2 import id_token # pyright: ignore[reportMissingImports]
import google.auth.transport.requests # pyright: ignore[reportMissingImports]
import requests # pyright: ignore[reportMissingImports]
import uuid
from rest_framework_simplejwt.tokens import RefreshToken # pyright: ignore[reportMissingImports]
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

class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({"detail": "Token no proporcionado"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user_info_response = requests.get(
                'https://www.googleapis.com/oauth2/v3/userinfo',
                headers={'Authorization': f'Bearer {token}'}
            )

            if not user_info_response.ok:
                return Response({"detail": "Token inválido de Google"}, status=status.HTTP_400_BAD_REQUEST)
                
            user_info = user_info_response.json()
            email = user_info.get('email')
            name = user_info.get('name', '')
            
            if not email:
                return Response({"detail": "Email no proporcionado por Google"}, status=status.HTTP_400_BAD_REQUEST)

            user, created = User.objects.get_or_create(email=email, defaults={
                'username': email.split('@')[0] + str(uuid.uuid4())[:4],
                'is_active': True
            })

            if created:
                user.set_unusable_password() 
                user.save()
                
            if hasattr(user, 'profile'):
                profile = user.profile
                profile.verified = True
                if created:
                    profile.full_name = name
                profile.save()
            else:

                from api.models import Profile, UserStats
                profile = Profile.objects.create(user=user, verified=True, full_name=name)
                UserStats.objects.get_or_create(user=user)

            user.is_online = True
            user.save()
            
            from api.serializer import myTokenObtainPairSerializer
            serializer = myTokenObtainPairSerializer(context={'request': request})
            refresh = serializer.get_token(user)

            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK if not created else status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"detail": f"Error de autenticación con Google: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

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

class AvatarPagination(PageNumberPagination):
    page_size = 15
    page_size_query_param = 'limit'
    max_page_size = 100

class BadgePagination(PageNumberPagination):
    page_size = 12
    page_size_query_param = 'limit'
    max_page_size = 100

class GameHistoryPagination(PageNumberPagination):
    page_size = 5
    page_size_query_param = 'limit'
    max_page_size = 50

# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA PALABRAS (CRUD) ---
# * --------------------------------------------------------------------------------------------------
class WordViewSet(viewsets.ModelViewSet): 
    queryset = Word.objects.all().order_by('-created_at') 
    serializer_class = WordSerializer 
    pagination_class = WordPagination
    filter_backends = [DjangoFilterBackend] 
    filterset_fields = ['word_type']

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'random']:
            self.permission_classes = [IsAuthenticated]
        else:
            self.permission_classes = [IsAuthenticated, IsAdminUser]
        return super().get_permissions()

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
    pagination_class = BadgePagination
    
    def get_queryset(self):
        queryset = super().get_queryset()
        search_param = self.request.query_params.get('search')
        if search_param:
            queryset = queryset.filter(title__icontains=search_param)
        return queryset

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [IsAuthenticated]
        else:
            self.permission_classes = [IsAuthenticated, IsAdminUser]
        return super().get_permissions()

# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA AVATARES (CRUD) ---
# * --------------------------------------------------------------------------------------------------
class AvatarViewSet(viewsets.ModelViewSet): 
    queryset = Avatar.objects.all().order_by('name') 
    serializer_class = AvatarSerializer 
    pagination_class = AvatarPagination
    
    def get_queryset(self):
        queryset = super().get_queryset()
        search_param = self.request.query_params.get('search')
        if search_param:
            queryset = queryset.filter(name__icontains=search_param)
        return queryset

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            self.permission_classes = [IsAuthenticated]
        else:
            self.permission_classes = [IsAuthenticated, IsAdminUser]
        return super().get_permissions()


# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA ESTADISTICAS DE USUARIOS (CRUD) ---
# * --------------------------------------------------------------------------------------------------
class UserStatsViewSet(
    mixins.RetrieveModelMixin,   
    mixins.UpdateModelMixin,     
    mixins.ListModelMixin,       
    viewsets.GenericViewSet      
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
            self.permission_classes = [IsAuthenticated] 
        elif self.action in ['retrieve', 'list', 'update', 'partial_update']:
            self.permission_classes = [IsAuthenticated, IsAdminUser] 
        else:
            self.permission_classes = [IsAuthenticated] 
        return super().get_permissions()

    @action(detail=False, methods=['get', 'patch'])
    def me(self, request):
        """
        Obtiene o actualiza parcialmente las estadísticas del usuario autenticado.
        Si no existen, las crea.
        También verifica y desbloquea insignias.
        """
        user_stats, created = UserStats.objects.get_or_create(user=request.user) #

        if request.method == 'GET':
            newly_unlocked_badges_on_get = check_and_unlock_badges(request.user) 
            user_stats.refresh_from_db() 
            serializer = self.get_serializer(user_stats)
            response_data = serializer.data
            
            if newly_unlocked_badges_on_get:
                response_data['newly_unlocked_badges_on_get'] = [badge.title for badge in newly_unlocked_badges_on_get]

            return Response(response_data)
        
        elif request.method == 'PATCH':
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
class AdminUserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all().order_by('username') 
    serializer_class = AdminUserSerializer 
    permission_classes = [IsAuthenticated, IsAdminUser] 

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
@permission_classes([AllowAny])
def get_quiz_words(request):
    """
    Entrega un set de palabras aleatorias para una ronda de juego en Godot.
    Opcional: ?limit=5&type=SLANG&difficulty=EASY
    """
    limit = int(request.query_params.get('limit', 10))
    word_type = request.query_params.get('word_type', None)
    difficulty = request.query_params.get('difficulty', None)
    discovered = request.query_params.get('discovered', 'false').lower() == 'true'

    if discovered and request.user.is_authenticated:
        try:
            stats = UserStats.objects.get(user=request.user)
            words = stats.unlocked_words.all()
        except UserStats.DoesNotExist:
            words = Word.objects.none()
    else:
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
    letters_killed = data.get('letters_killed', 0)
    bosses_killed = data.get('bosses_killed', 0)
    seen_word_ids = data.get('seen_word_ids', [])
    correct_word_ids = data.get('correct_word_ids', [])
    ai_evaluation = data.get('ai_evaluation', None)

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
        stats.words_seen_total += 1
        if w.word_type == "SLANG":
            stats.slangs_seen += 1
        elif w.word_type == "PHRASAL_VERB":
            stats.phrasal_verbs_seen += 1

    for w in correct_words:
        if w.word_type in match_breakdown["correct"]:
            match_breakdown["correct"][w.word_type] += 1
            
            if w.word_type == "SLANG": 
                stats.slangs_learned += 1
                stats.correct_slangs += 1
            elif w.word_type == "IDIOM": 
                stats.idioms_learned += 1
            elif w.word_type == "PHRASAL_VERB": 
                stats.phrasal_verbs_learned += 1
                stats.correct_phrasal_verbs += 1
            elif w.word_type == "VOCABULARY": 
                stats.vocabulary_learned += 1
                
    stats.save()
    
    if correct_words.exists():
        stats.unlocked_words.add(*correct_words)

    stats.experience += xp_earned
    stats.total_questions_answered += total_questions
    stats.correct_answers_total += correct_answers
    stats.total_letters_killed += letters_killed
    stats.total_bosses_killed += bosses_killed
    stats.total_time_played_seconds += time_spent
    
    from django.utils import timezone
    from datetime import timedelta
    today = timezone.now().date()
    
    if stats.last_login_date != today:
        if stats.last_login_date == today - timedelta(days=1):
            stats.current_streak += 1
        else:
            stats.current_streak = 1
        stats.last_login_date = today
        
    stats.save()

    if stats.current_streak > stats.longest_streak:
        stats.longest_streak = stats.current_streak
        stats.save()

    from api.models import GameHistory
    GameHistory.objects.create(
        user=user,
        score=score,
        correct_in_game=correct_answers,
        total_questions_in_game=total_questions,
        game_mode=game_mode,
        time_spent_seconds=time_spent,
        match_breakdown=match_breakdown,
        letters_killed=letters_killed,
        bosses_killed=bosses_killed,
        ai_evaluation=ai_evaluation
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
    tag_list = correct_word.tags.split(',')
    distractors = Word.objects.filter(tags__icontains=tag_list[0]).exclude(id=correct_word.id)[:3] 
    if len(distractors) < 3:
        randoms = Word.objects.exclude(id=correct_word.id).order_by('?')[:3 - len(distractors)]
    
    return {
        "question": f"¿Cómo se dice '{correct_word.translation}'?",
        "options": [correct_word.text] + [d.text for d in distractors], 
        "accepted_answers": [correct_word.text] + [s.text for s in correct_word.substitutes.all()]
    }



# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA LA LEADERBOARD ---
# * --------------------------------------------------------------------------------------------------

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_leaderboard(request):
    
    leaderboard = UserStats.objects.select_related('user').annotate(
        unlocked_count=Count('unlocked_words'),
        true_accuracy=ExpressionWrapper(
            (F('correct_answers_total')) / (F('total_questions_answered') + 10.0),
            output_field=FloatField()
        ),
        performance_score=ExpressionWrapper(
            F('experience') + (F('unlocked_count') * 50) + (F('total_questions_answered') * 10 * F('true_accuracy')),
            output_field=FloatField()
        )
    ).order_by('-performance_score')[:10] 

    data = []
    for stat in leaderboard:
        data.append({
            'id': stat.id,
            'user_username': stat.user.username,
            'level': stat.get_level(),
            'experience': stat.experience,
            'current_streak': stat.current_streak,
            'unlocked_count': stat.unlocked_count,
            'true_accuracy': round(stat.true_accuracy * 100, 1) if stat.true_accuracy else 0,
            'performance_score': round(stat.performance_score) if stat.performance_score else 0
        })

    return Response(data, status=status.HTTP_200_OK)
# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA HISTORIAL DE PARTIDAS ---
# * --------------------------------------------------------------------------------------------------
class GameHistoryListView(generics.ListAPIView):
    serializer_class = GameHistorySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = GameHistoryPagination

    def get_queryset(self):
        return GameHistory.objects.filter(user=self.request.user).order_by('-played_at')

# * --------------------------------------------------------------------------------------------------
# ! --- VIEW PARA ACTUALIZAR PERFIL ---
# * --------------------------------------------------------------------------------------------------
class ProfileUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        return Response({
            'full_name': profile.full_name,
            'current_avatar': profile.current_avatar.id if profile.current_avatar else None,
            'current_title': profile.current_title,
        })

    def patch(self, request):
        profile = request.user.profile
        serializer = ProfileUpdateSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA ORÁCULO DICCIONARIO ---
# * --------------------------------------------------------------------------------------------------


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def oracle_query(request):
    """
    Endpoint para el Oráculo del Diccionario.
    """
    word_id = request.data.get('word_id')
    question_type = request.data.get('question_type')

    if not word_id or not question_type:
        return Response({'error': 'word_id y question_type son requeridos'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        word = Word.objects.get(id=word_id)
    except Word.DoesNotExist:
        return Response({'error': 'Palabra no encontrada'}, status=status.HTTP_404_NOT_FOUND)

    api_key = getattr(settings, 'GEMINI_API_KEY', os.getenv("GEMINI_API_KEY") if os.getenv("GEMINI_API_KEY") else os.getenv("VITE_GEMINI_API_KEY"))
    if not api_key:
         print("[Oracle] API Key de Gemini ausente en .env del backend.")
         return Response({'error': 'API key de Gemini no configurada en el backend'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    genai.configure(api_key=api_key)
    
    base_context = f'Eres el "Oráculo del Granero", un sabio y misterioso campesino mágico del juego Misspelt. El usuario pregunta sobre la palabra en inglés "{word.text}" ("{word.translation}" en español), definición: "{word.definition}". Responde en un tono sabio, conciso (máximo 4 oraciones) y amigable. No uses subtítulos ni markdown. Usa español pero resaltando la palabra en inglés.'

    if question_type == 'WHAT':
        question_prompt = "Explica el significado directo de la palabra de forma sencilla para alguien que la está aprendiendo."
    elif question_type == 'WHY':
        question_prompt = "Explica brevemente la lógica o etimología (el origen) detrás de esta palabra o frase. ¿Por qué se dice así?"
    elif question_type == 'HOW':
        question_prompt = "Explica la estructura gramatical y las reglas de uso para esta palabra. ¿Cómo se usa correctamente en una oración?"
    elif question_type == 'WHEN':
        question_prompt = "Explica el contexto social: ¿Es formal, informal, de enojo, tristeza? ¿Cuándo es apropiado usarla?"
    elif question_type == 'EXAMPLES':
        question_prompt = "Dame exactamente 3 ejemplos creativos y variados de cómo usar esta palabra en oraciones. Separa cada ejemplo y provee su traducción."
    else:
         return Response({'error': 'Tipo de pregunta inválido'}, status=status.HTTP_400_BAD_REQUEST)

    system_prompt = f"{base_context}\nInstrucción: {question_prompt}"

    try:
        model = genai.GenerativeModel('gemini-2.5-flash', system_instruction=system_prompt)
        response = model.generate_content("Responde a la consulta lo más preciso posible.")
        text_response = response.text.replace('*', '').strip()
        
        return Response({'response': text_response}, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"[Oracle] Error generando contenido: {str(e)}")
        try:
            model = genai.GenerativeModel('gemini-1.5-flash', system_instruction=system_prompt)
            response = model.generate_content("Responde a la consulta lo más preciso posible.")
            text_response = response.text.replace('*', '').strip()
            return Response({'response': text_response}, status=status.HTTP_200_OK)
        except Exception as fallback_e:
            print(f"[Oracle] Fallback falló: {str(fallback_e)}")
            return Response({'error': f'Error en Oráculo: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA ORÁCULO POST-PARTIDA ---
# * --------------------------------------------------------------------------------------------------

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def oracle_post_game_query(request):
    """
    Endpoint para el Oráculo Post-Partida, que recibe todo el historial
    y lo envía a Gemini.
    """
    history = request.data.get('history', [])

    api_key = getattr(settings, 'GEMINI_API_KEY', os.getenv("GEMINI_API_KEY") if os.getenv("GEMINI_API_KEY") else os.getenv("VITE_GEMINI_API_KEY"))
    if not api_key:
         return Response({'error': 'API key de Gemini no configurada en el backend'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    genai.configure(api_key=api_key)
    
    formatted_history = []
    for msg in history:
        role = msg.get('role', 'user')
        parts = msg.get('parts', [])
        # Extract text from parts (JS sends [{'text': '...'}])
        text_parts = [p.get('text', '') if isinstance(p, dict) else str(p) for p in parts]
        formatted_history.append({'role': role, 'parts': text_parts})
        
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')
        response = model.generate_content(formatted_history)
        text_response = response.text.replace('*', '').strip()
        return Response({'response': text_response}, status=status.HTTP_200_OK)
    except Exception as e:
        print(f"[Oracle Post-Game] Error: {str(e)}")
        try:
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content(formatted_history)
            text_response = response.text.replace('*', '').strip()
            return Response({'response': text_response}, status=status.HTTP_200_OK)
        except Exception as fallback_e:
            return Response({'error': str(fallback_e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# * --------------------------------------------------------------------------------------------------
# ! --- VIEWS PARA GRANJAS (FARMS) ---
# * --------------------------------------------------------------------------------------------------

class FarmViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['retrieve', 'leaderboard']:
            return FarmDetailSerializer
        return FarmSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Farm.objects.filter(owner=user)
        return Farm.objects.filter(students=user)

    def create(self, request, *args, **kwargs):
        if not request.user.is_staff:
            return Response({"error": "Solo Profesores pueden crear Granjas."}, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        while Farm.objects.filter(invite_code=code).exists():
            code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        serializer.save(owner=self.request.user, invite_code=code)

    @action(detail=True, methods=['get'])
    def leaderboard(self, request, pk=None):
        farm = self.get_object()
        if not request.user.is_staff and farm not in Farm.objects.filter(students=request.user):
            return Response({"error": "No tienes acceso a esta granja."}, status=status.HTTP_403_FORBIDDEN)
        serializer = FarmDetailSerializer(farm)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='remove-student')
    def remove_student(self, request, pk=None):
        farm = self.get_object()
        if farm.owner != request.user:
            return Response({'error': 'No eres el dueño de la granja.'}, status=status.HTTP_403_FORBIDDEN)
        student_id = request.data.get('student_id')
        try:
            student = User.objects.get(id=student_id)
            farm.students.remove(student)
            return Response({'status': 'Estudiante removido exitosamente'})
        except User.DoesNotExist:
            return Response({'error': 'Estudiante no encontrado.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def join(self, request):
        code = request.data.get('invite_code')
        if not code:
            return Response({'error': 'El código es requerido.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            farm = Farm.objects.get(invite_code=code.upper())
            farm.students.add(request.user)
            return Response({'status': '¡Te has unido exitosamente!', 'farm_name': farm.name})
        except Farm.DoesNotExist:
            return Response({'error': 'Código inválido o granja no existente.'}, status=status.HTTP_404_NOT_FOUND)