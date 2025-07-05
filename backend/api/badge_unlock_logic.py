# api/badge_unlock_logic.py (COMPLETO)
from api.models import Badge, UserStats #
from api.services import award_badge_rewards #
from django.db import transaction

def check_and_unlock_badges(user):
    """
    Verifica todas las condiciones de los badges desbloqueables
    para un usuario dado y otorga los badges si las condiciones se cumplen.
    """
    user_stats, created = UserStats.objects.get_or_create(user=user) #
    
    all_badges = Badge.objects.all() #
    
    unlocked_badges_this_session = []

    with transaction.atomic(): 
        for badge in all_badges:
            # Los badges que no tienen `unlock_condition_data` o es una lista vacía no se verifican aquí.
            if not badge.unlock_condition_data or not isinstance(badge.unlock_condition_data, list):
                continue 

            if badge in user_stats.badges.all(): #
                continue # El usuario ya tiene este badge

            # Si el badge tiene múltiples condiciones, TODAS deben cumplirse.
            all_conditions_met = True
            for condition in badge.unlock_condition_data: # Itera sobre la lista de condiciones
                is_condition_met = False
                condition_type = condition.get('type')
                required_value = condition.get('value')

                if not condition_type or required_value is None: # Si la condición está mal formada
                    all_conditions_met = False
                    break 
                
                # --- VERIFICACIÓN DE CONDICIONES (Case Handling) ---
                if condition_type == 'correct_slangs':
                    if user_stats.correct_slangs >= required_value: # ? 
                        is_condition_met = True

                elif condition_type == 'total_exp_achieved':
                    if user_stats.experience >= required_value: # ? 
                        is_condition_met = True

                elif condition_type == 'answered_total_questions':
                    if user_stats.total_questions_answered >= required_value: # ? 
                        is_condition_met = True
                
                # Añade más condiciones aquí según tus campos en UserStats:
                elif condition_type == 'words_seen_total':
                    if user_stats.words_seen_total >= required_value: # ?
                        is_condition_met = True
                
                elif condition_type == 'phrasal_verbs_seen':
                    if user_stats.phrasal_verbs_seen >= required_value: # ?
                        is_condition_met = True
                
                elif condition_type == 'correct_answers_total':
                    if user_stats.correct_answers_total >= required_value: # ?
                        is_condition_met = True
                
                elif condition_type == 'total_slangs_questions':
                    if user_stats.total_slangs_questions >= required_value: # ?
                        is_condition_met = True

                elif condition_type == 'correct_phrasal_verbs':
                    if user_stats.correct_phrasal_verbs >= required_value: # ?
                        is_condition_met = True
                
                elif condition_type == 'total_phrasal_verbs_questions':
                    if user_stats.total_phrasal_verbs_questions >= required_value: # ?
                        is_condition_met = True

                elif condition_type == 'current_streak':
                    if user_stats.current_streak >= required_value: # ? 
                        is_condition_met = True
                
                elif condition_type == 'longest_streak':
                    if user_stats.longest_streak >= required_value: # ? 
                        is_condition_met = True

                # --- FIN DE VERIFICACIÓN DE CONDICIONES ---

                if not is_condition_met:
                    all_conditions_met = False
                    break # Si una condición no se cumple, no hay necesidad de verificar las demás
            
            if all_conditions_met:
                user_stats.badges.add(badge) #
                user_stats.save()
                award_badge_rewards(user, badge) #
                unlocked_badges_this_session.append(badge)
                print(f"DEBUG: Badge '{badge.title}' desbloqueado para {user.username}!")

    return unlocked_badges_this_session