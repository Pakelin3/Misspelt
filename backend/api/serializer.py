from api.models import User, Profile, Word, Badge, UserStats, EmailVerificationToken, Avatar
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
# ! --- MODELO USER ---
# * --------------------------------------------------------------------------------------------------
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email']

# * --------------------------------------------------------------------------------------------------
# ! --- MODELO TOKEN ---
# * --------------------------------------------------------------------------------------------------
class myTokenObtainPairSerializer(TokenObtainPairSerializer):
    default_error_messages = {
        'no_active_account': 'Usuario no encontrado. Por favor, verifica tu correo y/o contraseña.',
        'user_not_found': 'El usuario no existe.',
        'invalid_password': 'La contraseña es incorrecta.',
    }
    def get_token(self, user):
        token = super().get_token(user)
        token['full_name'] = user.profile.full_name if hasattr(user, 'profile') else None
        token['username'] = user.username
        token['email'] = user.email
        token['bio'] = user.profile.bio if hasattr(user, 'profile') else None
        token['verified'] = user.profile.verified if hasattr(user, 'profile') else False
        token['is_staff'] = user.is_staff

        request = self.context.get('request')

        profile_image_url = None
        if hasattr(user, 'profile') and user.profile.image is not None and user.profile.image != '':
            if request:
                profile_image_url = request.build_absolute_uri(user.profile.image.url)
        token['profile_image_url'] = profile_image_url

        current_avatar_url = None
        if hasattr(user, 'profile') and user.profile.current_avatar is not None:
            if request:
                current_avatar_url = request.build_absolute_uri(user.profile.current_avatar.image.url)
        token['current_avatar_url'] = current_avatar_url

        return token        

# * --------------------------------------------------------------------------------------------------
# ! --- MODELO REGISTER ---
# * --------------------------------------------------------------------------------------------------
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True, required=True)
    email = serializers.EmailField(
        max_length=254,
    )

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

        token_obj, created = EmailVerificationToken.objects.get_or_create(
            user=user,
            defaults={'expires_at': timezone.now() + timedelta(hours=24)}
        )
        if not created:
            token_obj.expires_at = timezone.now() + timedelta(hours=24)
            token_obj.save()

        full_verify_url = f"{settings.FRONTEND_URL}/verify-email/{str(token_obj.token)}/" 

        subject = 'Activa tu cuenta en SlangMaster'
        message = render_to_string('emails/email_verification.html', {
            'username': user.username,
            'verify_url': full_verify_url,
        })
        send_mail(subject, '', settings.EMAIL_HOST_USER, [user.email], html_message=message)
        return user

# * --------------------------------------------------------------------------------------------------
# ! --- MODELO WORD (ACTUALIZADO) ---
# * --------------------------------------------------------------------------------------------------
class WordSerializer(serializers.ModelSerializer):
    is_unlocked = serializers.SerializerMethodField()
    substitutes = serializers.SlugRelatedField(
        many=True,
        read_only=True,
        slug_field='text'
    )

    class Meta:
        model = Word
        fields = [
            'id', 
            'text', 
            'translation', 
            'definition', 
            'word_type', 
            'examples', 
            'difficulty_level', 
            'tags', 
            'substitutes',
            'is_unlocked'
        ]

    def get_is_unlocked(self, obj):
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            if hasattr(request.user, 'stats'):
                return request.user.stats.unlocked_words.filter(id=obj.id).exists()
        return False

# * --------------------------------------------------------------------------------------------------
# ! --- MODELO BADGE ---
# * --------------------------------------------------------------------------------------------------
class BadgeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Badge
        fields = '__all__' 

# * --------------------------------------------------------------------------------------------------
# ! --- MODELO AVATAR ---
# * --------------------------------------------------------------------------------------------------
class AvatarSerializer(serializers.ModelSerializer):
    class Meta:
        model = Avatar
        fields = '__all__'

# * --------------------------------------------------------------------------------------------------
# ! --- MODELO USERSTATS ---
# * --------------------------------------------------------------------------------------------------
class UserStatsSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    level = serializers.SerializerMethodField()
    xp_for_next_level = serializers.SerializerMethodField()
    xp_progress_in_current_level = serializers.SerializerMethodField()
    unlocked_badges = BadgeSerializer(many=True, read_only=True, source='badges') 
    unlocked_avatars = AvatarSerializer(many=True, read_only=True)  
    
    class Meta:
        model = UserStats
        fields = '__all__'
        read_only_fields = ['user']

    def get_level(self, obj):
        return obj.get_level()

    def get_xp_for_next_level(self, obj):
        return obj.get_xp_for_next_level()

    def get_xp_progress_in_current_level(self, obj):
        return round(obj.get_xp_progress_in_current_level(), 2)


# * --------------------------------------------------------------------------------------------------
# ! --- MODELO ADMINUSER ---
# * --------------------------------------------------------------------------------------------------
class AdminUserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'is_staff', 'is_superuser', 'date_joined', 'last_login', 'is_online']
        read_only_fields = ['date_joined', 'last_login']