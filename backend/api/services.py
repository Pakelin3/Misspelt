from api.models import UserStats, Avatar

def award_badge_rewards(user, badge):
    """
    Otorga las recompensas asociadas a un badge al usuario.
    """
    if not badge.reward_data: # Si no hay datos de recompensa
        return

    reward_data = badge.reward_data # Accede al JSONField

    # Otorgar EXP
    if 'exp' in reward_data:
        amount_exp = reward_data['exp']
        user_stats, created = UserStats.objects.get_or_create(user=user) 
        user_stats.experience += amount_exp 
        user_stats.save()
        print(f"Usuario {user.username} recibió {amount_exp} XP del badge '{badge.title}'.")

    # Otorgar Avatar
    if 'avatar_id' in reward_data:
        avatar_id = reward_data['avatar_id']
        try:
            avatar = Avatar.objects.get(id=avatar_id) #
            user_stats = user.stats # Accede a UserStats a través de la relación related_name 'stats'
            if avatar not in user_stats.unlocked_avatars.all():
                user_stats.unlocked_avatars.add(avatar) # Desbloquea el avatar
                user_stats.save()
                print(f"Usuario {user.username} desbloqueó el avatar '{avatar.name}' del badge '{badge.title}'.")
                # Opcional: Establecerlo como actual si el usuario no tiene uno o es el primero
                # if not user.profile.current_avatar:
                #    user.profile.current_avatar = avatar
                #    user.profile.save()
        except Avatar.DoesNotExist:
            print(f"Advertencia: Avatar con ID {avatar_id} no encontrado para recompensar.")

    # Más tipos de recompensas (ej. 'coins', 'items', etc.)