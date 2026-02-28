from api.models import Badge, UserStats
from api.services import award_badge_rewards
from django.db import transaction

def check_and_unlock_badges(user):
    """
    Verifica todas las condiciones de los badges desbloqueables
    para un usuario dado y otorga los badges si las condiciones se cumplen.
    """
    user_stats, created = UserStats.objects.get_or_create(user=user)
    
    all_badges = Badge.objects.all()
    
    unlocked_badges_this_session = []

    with transaction.atomic(): 
        for badge in all_badges:

            if not badge.unlock_condition_data or not isinstance(badge.unlock_condition_data, list):
                continue 

            if badge in user_stats.badges.all():
                continue 

            all_conditions_met = True
            for condition in badge.unlock_condition_data:
                is_condition_met = False
                condition_type = condition.get('type')
                required_value = condition.get('value')
                if not condition_type or required_value is None:
                    all_conditions_met = False
                    break 
                if condition_type == 'correct_slangs':
                    if user_stats.correct_slangs >= required_value:
                        is_condition_met = True
                elif condition_type == 'total_exp_achieved':
                    if user_stats.experience >= required_value:
                        is_condition_met = True
                elif condition_type == 'answered_total_questions':
                    if user_stats.total_questions_answered >= required_value:
                        is_condition_met = True
                elif condition_type == 'words_seen_total':
                    if user_stats.words_seen_total >= required_value:
                        is_condition_met = True
                elif condition_type == 'phrasal_verbs_seen':
                    if user_stats.phrasal_verbs_seen >= required_value:
                        is_condition_met = True
                elif condition_type == 'correct_answers_total':
                    if user_stats.correct_answers_total >= required_value:
                        is_condition_met = True
                elif condition_type == 'total_slangs_questions':
                    if user_stats.total_slangs_questions >= required_value:
                        is_condition_met = True
                elif condition_type == 'correct_phrasal_verbs':
                    if user_stats.correct_phrasal_verbs >= required_value:
                        is_condition_met = True
                elif condition_type == 'total_phrasal_verbs_questions':
                    if user_stats.total_phrasal_verbs_questions >= required_value:
                        is_condition_met = True
                elif condition_type == 'current_streak':
                    if user_stats.current_streak >= required_value:
                        is_condition_met = True
                elif condition_type == 'longest_streak':
                    if user_stats.longest_streak >= required_value:
                        is_condition_met = True
                elif condition_type == 'slangs_learned':
                    if user_stats.slangs_learned >= required_value:
                        is_condition_met = True
                elif condition_type == 'idioms_learned':
                    if user_stats.idioms_learned >= required_value:
                        is_condition_met = True
                elif condition_type == 'phrasal_verbs_learned':
                    if user_stats.phrasal_verbs_learned >= required_value:
                        is_condition_met = True
                elif condition_type == 'vocabulary_learned':
                    if user_stats.vocabulary_learned >= required_value:
                        is_condition_met = True
                elif condition_type == 'level_reached':
                    if user_stats.get_level() >= required_value:
                        is_condition_met = True
                elif condition_type == 'general_accuracy':
                    if user_stats.get_accuracy_percentage() >= required_value:
                        is_condition_met = True
                elif condition_type == 'slang_accuracy':
                    if user_stats.get_slang_accuracy_percentage() >= required_value:
                        is_condition_met = True
                elif condition_type == 'phrasal_verb_accuracy':
                    if user_stats.get_phrasal_verb_accuracy_percentage() >= required_value:
                        is_condition_met = True
                elif condition_type == 'unique_words_unlocked':
                    if user_stats.unlocked_words.count() >= required_value:
                        is_condition_met = True
                elif condition_type == 'avatars_unlocked':
                    if user_stats.unlocked_avatars.count() >= required_value:
                        is_condition_met = True
                elif condition_type == 'slangs_seen':
                    if user_stats.slangs_seen >= required_value:
                        is_condition_met = True

                if not is_condition_met:
                    all_conditions_met = False
                    break 
            
            if all_conditions_met:
                user_stats.badges.add(badge)
                user_stats.save()
                award_badge_rewards(user, badge)
                unlocked_badges_this_session.append(badge)
                print(f"DEBUG: Badge '{badge.title}' desbloqueado para {user.username}!")

    return unlocked_badges_this_session