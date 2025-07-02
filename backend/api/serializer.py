from api.models import User, Profile, Word, Badge, UserStats, EmailVerificationToken
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from django.utils import timezone
from django.template.loader import render_to_string
from django.core.mail import send_mail
from django.conf import settings
from django.urls import reverse
from datetime import timedelta


# * --------------------------------------------------------------------------------------------------
# ! --- MODELO ---
# * --------------------------------------------------------------------------------------------------
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

# * --------------------------------------------------------------------------------------------------
# ! --- MODELO ---
# * --------------------------------------------------------------------------------------------------
class myTokenObtainPairSerializer(TokenObtainPairSerializer):
    default_error_messages = {
        'no_active_account': 'Usuario no encontrado. Por favor, verifica tu correo y/o contraseña.',
        'user_not_found': 'El usuario no existe.',
        'invalid_password': 'La contraseña es incorrecta.',
    }
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['full_name'] = user.profile.full_name if hasattr(user, 'profile') else None 
        token['username'] = user.username
        token['email'] = user.email
        token['bio'] = user.profile.bio if hasattr(user, 'profile') else None
        #token['online'] = user.is_online if hasattr(user, 'profile') else None
        token['image'] = str(user.profile.image) if hasattr(user, 'profile') and user.profile.image else None 
        token['verified'] = user.profile.verified if hasattr(user, 'profile') else False 
        token['is_staff'] = user.is_staff

        return token

# * --------------------------------------------------------------------------------------------------
# ! --- MODELO ---
# * --------------------------------------------------------------------------------------------------
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(
        max_length=254,
    ) # Corrected: 'unique' and its error_messages are now handled via Meta.extra_kwargs or model definition.

    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'password', 'confirm_password']
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {
                'error_messages': {'unique': "Correo electrónico ya existe."}
            }
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError({"confirm_password": ["Las contraseñas no coinciden."]})
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
        )
        user.set_password(validated_data['password'])
        user.save()

        # Usa get_or_create para manejar tokens existentes o crear uno nuevo
        token_obj, created = EmailVerificationToken.objects.get_or_create(
            user=user,
            defaults={'expires_at': timezone.now() + timedelta(hours=24)}
        )
        # Si el token ya existía, actualiza su expiración
        if not created:
            token_obj.expires_at = timezone.now() + timedelta(hours=24)
            token_obj.save()

        # Construye la URL completa que apunta al frontend, usando el token_obj correcto
        full_verify_url = f"{settings.FRONTEND_URL}/verify-email/{str(token_obj.token)}/" # Convertir a str explícitamente si es UUID

        # Envía el correo
        subject = 'Activa tu cuenta en SlangMaster'
        message = render_to_string('emails/email_verification.html', {
            'username': user.username,
            'verify_url': full_verify_url,
        })
        send_mail(subject, '', settings.EMAIL_HOST_USER, [user.email], html_message=message)
        return user

# * --------------------------------------------------------------------------------------------------
# ! --- MODELO ---
# * --------------------------------------------------------------------------------------------------
class WordSerializer(serializers.ModelSerializer):
    substitutes = serializers.SlugRelatedField(
        many=True,      
        read_only=True, 
        slug_field='text'
    )
    class Meta:
        model = Word
        fields = '__all__' 

# * --------------------------------------------------------------------------------------------------
# ! --- MODELO ---
# * --------------------------------------------------------------------------------------------------
class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = '__all__' 

# * --------------------------------------------------------------------------------------------------
# ! --- MODELO ---
# * --------------------------------------------------------------------------------------------------
class UserStatsSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserStats
        fields = '__all__'
        read_only_fields = ['user'] 

# * --------------------------------------------------------------------------------------------------
# ! --- MODELO ---
# * --------------------------------------------------------------------------------------------------
class AdminUserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff', 'is_superuser', 'date_joined', 'last_login', 'is_online']
        # 'is_staff' y 'is_superuser' deben poder ser editables si un admin va a cambiar roles.
        # Otros campos como 'date_joined' y 'last_login' son generalmente de solo lectura.
        read_only_fields = ['date_joined', 'last_login'] 
