from django.db import models
from django.contrib.auth.models import AbstractUser 
from django.db.models.signals import post_save    
from django.conf import settings
from django.utils import timezone
from datetime import timedelta
import uuid             

# * --------------------------------------------------------------------------------------------------
#  ! --- MODELO VERIFICACION DE CORREO ---
# * --------------------------------------------------------------------------------------------------
class EmailVerificationToken(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='email_verification_token')
    token = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()

    def save(self, *args, **kwargs):
        if not self.id: 
            self.expires_at = timezone.now() + timedelta(hours=12) 
        super().save(*args, **kwargs)

    def is_valid(self):
        return timezone.now() < self.expires_at

    def __str__(self):
        return f"Token for {self.user.username}"

# * --------------------------------------------------------------------------------------------------
# ! --- MODELO DE USUARIO PERSONALIZADO ---
# * --------------------------------------------------------------------------------------------------
class User(AbstractUser):

    username = models.CharField(
        max_length=150,
        unique=True,
        error_messages={
            'unique': "Ya existe un usuario con ese nombre",
        })
    email = models.EmailField(
        max_length=254,
        unique=True,
        error_messages={
            'unique': "Correo electrónico ya existe",
        })
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return self.username
    
# * --------------------------------------------------------------------------------------------------
# ! --- MODELO DE PERFIL DE USUARIO ---
# * --------------------------------------------------------------------------------------------------

class Profile(models.Model):

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    
    full_name = models.CharField(max_length=255, blank=True, null=True)
    bio = models.TextField(blank=True, null=True)
    image = models.ImageField(default='default.jpg',upload_to='user_images', blank=True, null=True)
    verified = models.BooleanField(default=True)

    def __str__(self):
        return self.full_name if self.full_name else f"Perfil de {self.user.username}"
    
# * --------------------------------------------------------------------------------------------------
# ! --- FUNCIONES DE SEÑAL (SIGNALS) ---
# * --------------------------------------------------------------------------------------------------
def create_user_profile(sender, instance, created, **kwargs):
    if created: 
        Profile.objects.create(user=instance)

def save_user_profile(sender, instance, **kwargs):
    if hasattr(instance, 'profile'):
        instance.profile.save()

# * --------------------------------------------------------------------------------------------------
# ! --- MODELO WORD ---
# * --------------------------------------------------------------------------------------------------
class Word(models.Model):
    text = models.CharField(max_length=255, unique=True, help_text="El slang o phrasal verb en sí")
    description = models.TextField(help_text="Definición clara y concisa de la palabra o frase")
    
    WORD_TYPES = [
        ('SLANG', 'Jergas'),
        ('PHRASAL_VERB', 'Verbos Frasales'),
        ('NONE', 'Ninguno'), 
    ]
    word_type = models.CharField(max_length=20, choices=WORD_TYPES, default='NONE', help_text="Define si es un slang o un phrasal verb")
    examples = models.JSONField(default=list, blank=True, help_text="Lista de ejemplos de uso")
    substitutes = models.ManyToManyField('self', blank=True, symmetrical=False, related_name='related_to') 
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True) 
    difficulty_level = models.IntegerField(default=1, help_text="Nivel de dificultad de la palabra (1-5, por ejemplo)")
    tags = models.JSONField(default=list, blank=True, help_text="Lista de etiquetas para la palabra")

    def __str__(self):
        return f"{self.text} ({self.get_word_type_display()})"

# * --------------------------------------------------------------------------------------------------
# ! --- MODELO USERSTATS ---
# * --------------------------------------------------------------------------------------------------

class UserStats(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='stats')
    experience = models.IntegerField(default=0)
    words_seen_total = models.IntegerField(default=0)
    slangs_seen = models.IntegerField(default=0)
    phrasal_verbs_seen = models.IntegerField(default=0)
    correct_answers_total = models.IntegerField(default=0)
    total_questions_answered = models.IntegerField(default=0)
    correct_slangs = models.IntegerField(default=0)
    total_slangs_questions = models.IntegerField(default=0)
    correct_phrasal_verbs = models.IntegerField(default=0)
    total_phrasal_verbs_questions = models.IntegerField(default=0)
    last_login_date = models.DateField(null=True, blank=True)
    current_streak = models.IntegerField(default=0)
    longest_streak = models.IntegerField(default=0)
    badges = models.ManyToManyField('Badge', blank=True, related_name='unlocked_by_users')

    def get_accuracy_percentage(self):
        if self.total_questions_answered == 0:
            return 0.0
        return (self.correct_answers_total / self.total_questions_answered) * 100

    def get_slang_accuracy_percentage(self):
        if self.total_slangs_questions == 0:
            return 0.0
        return (self.correct_slangs / self.total_slangs_questions) * 100
    
    def get_phrasal_verb_accuracy_percentage(self):
        if self.total_phrasal_verbs_questions == 0:
            return 0.0
        return (self.correct_phrasal_verbs / self.total_phrasal_verbs_questions) * 100

    def __str__(self):
        return f"Estadísticas de {self.user.username}"

# * --------------------------------------------------------------------------------------------------
# ! --- MODELO GAMEHISTORY ---
# * --------------------------------------------------------------------------------------------------

class GameHistory(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='game_history')
    
    played_at = models.DateTimeField(auto_now_add=True) 
    score = models.IntegerField(default=0)
    correct_in_game = models.IntegerField(default=0)
    total_questions_in_game = models.IntegerField(default=0)
    
    def get_accuracy_in_game(self):
        if self.total_questions_in_game == 0:
            return 0.0
        return (self.correct_in_game / self.total_questions_in_game) * 100

    def __str__(self):
        return f"Partida de {self.user.username} el {self.played_at.strftime('%Y-%m-%d %H:%M')}"


# * --------------------------------------------------------------------------------------------------
# ! --- MODELO BADGE (INSIGNIA) ---
# * --------------------------------------------------------------------------------------------------

class Badge(models.Model):
    title = models.CharField(max_length=100, unique=True, help_text="Nombre de la insignia")
    description = models.TextField(help_text="Descripción de lo que se necesita para obtenerla")
    image = models.ImageField(upload_to='badges/', blank=True, null=True, help_text="Imagen de la insignia")
    
    CATEGORY_CHOICES = [
        ('BASIC', 'Básica'),
        ('RARE', 'Rara'),
        ('EPIC', 'Épica'),
        ('LEGENDARY', 'Legendaria'),
    ]
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='BASIC')
    condition_description = models.TextField(help_text="Descripción legible de la condición (e.g., 'Acertar 10 slangs')")
    
    reward_description = models.TextField(help_text="Descripción de la recompensa (e.g., '+30 EXP, Nuevo Avatar')")
    reward_data = models.JSONField(default=dict, blank=True, help_text="Datos programáticos para las recompensas (e.g., {'exp': 30, 'avatar_id': 5})")

    def __str__(self):
        return f"{self.title} ({self.get_category_display()})"

# * --------------------------------------------------------------------------------------------------
# ! --- CONEXIÓN DE SEÑALES ---
# * --------------------------------------------------------------------------------------------------
post_save.connect(create_user_profile, sender=settings.AUTH_USER_MODEL)
post_save.connect(save_user_profile, sender=settings.AUTH_USER_MODEL)