from api.models import Badge, UserStats
from api.services import award_badge_rewards
from django.db import transaction

def check_and_unlock_badges(user):
    """
    Verifica todas las condiciones de los badges desbloqueables
    para un usuario dado y otorga los badges si las condiciones se cumplen.
    """
    user_stats, created = UserStats.objects.get_or_create(user=user) 

    # Obtener todos los badges que son "desbloqueables" (si implementas el campo is_unlockable)
    # o simplemente todos los badges si todas las condiciones están en unlock_condition_data
    all_badges = Badge.objects.all() 

    unlocked_badges_this_session = []

    with transaction.atomic(): 
        for badge in all_badges:
            if not badge.unlock_condition_data:
                continue 

            if badge in user_stats.badges.all():
                continue 

            condition = badge.unlock_condition_data
            is_unlocked = False

            if condition.get('type') == 'correct_slangs':
                required_slangs = condition.get('value')
                if user_stats.correct_slangs >= required_slangs:
                    is_unlocked = True

            elif condition.get('type') == 'total_exp_achieved':
                required_exp = condition.get('value')
                if user_stats.experience >= required_exp:
                    is_unlocked = True

            elif condition.get('type') == 'answered_total_questions':
                required_questions = condition.get('value')
                if user_stats.total_questions_answered >= required_questions:
                    is_unlocked = True

            if is_unlocked:
                user_stats.badges.add(badge) 
                user_stats.save()
                award_badge_rewards(user, badge) 
                unlocked_badges_this_session.append(badge)
                print(f"DEBUG: Badge '{badge.title}' desbloqueado para {user.username}!")

    return unlocked_badges_this_session