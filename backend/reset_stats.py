import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from api.models import UserStats, GameHistory

# Clean histories
GameHistory.objects.all().delete()

# Reset stats
for stats in UserStats.objects.all():
    stats.words_seen_total = 0
    stats.correct_answers_total = 0
    stats.total_questions_answered = 0
    stats.slangs_seen = 0
    stats.correct_slangs = 0
    stats.total_slangs_questions = 0
    stats.phrasal_verbs_seen = 0
    stats.correct_phrasal_verbs = 0
    stats.total_phrasal_verbs_questions = 0
    stats.total_letters_killed = 0
    stats.total_bosses_killed = 0
    stats.total_time_played_seconds = 0
    stats.experience = 0
    stats.slangs_learned = 0
    stats.idioms_learned = 0
    stats.phrasal_verbs_learned = 0
    stats.vocabulary_learned = 0
    stats.save()
    print(f"Stats reset for user: {stats.user.username}")

print("Done. All stats and game history have been reset to 0.")
