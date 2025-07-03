from django.contrib import admin
from .models import User, Profile, Word, UserStats, GameHistory, Badge, Avatar


class UserAdmin(admin.ModelAdmin):
    list_display = ['username', 'email']
    # search_fields = ['username', 'email']

class ProfileAdmin(admin.ModelAdmin):
    list_editable = ['verified']
    list_display = ['user', 'full_name', 'verified']
    # list_filter = ['verified']


class WordAdmin(admin.ModelAdmin):
    list_display = ('text', 'word_type', 'difficulty_level', 'created_at')
    list_filter = ('word_type', 'difficulty_level')
    search_fields = ('text', 'description', 'tags') 


class UserStatsAdmin(admin.ModelAdmin):
    list_display = ('user', 'experience', 'correct_answers_total', 'total_questions_answered')
    list_filter = ('last_login_date',)
    search_fields = ('user__username',) 


class GameHistoryAdmin(admin.ModelAdmin):
    list_display = ('user', 'played_at', 'score', 'correct_in_game', 'total_questions_in_game')
    list_filter = ('played_at',)
    search_fields = ('user__username',)


class BadgeAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'condition_description', 'unlock_condition_data_display')
    list_filter = ('category',)
    search_fields = ('title', 'description', 'condition_description')
    fields = ('title', 'description', 'image', 'category',
            'condition_description', 'unlock_condition_data',
            'reward_description', 'reward_data')

    def unlock_condition_data_display(self, obj):
        return str(obj.unlock_condition_data)
    unlock_condition_data_display.short_description = "Condición Desbloqueo"

class AvatarAdmin(admin.ModelAdmin):
    list_display = ('name', 'image', 'is_default')
    list_filter = ('is_default',)
    search_fields = ('name',)




admin.site.register(User, UserAdmin)
admin.site.register(Profile, ProfileAdmin)
admin.site.register(Word, WordAdmin)
admin.site.register(UserStats, UserStatsAdmin)
admin.site.register(GameHistory, GameHistoryAdmin)
admin.site.register(Badge, BadgeAdmin)
admin.site.register(Avatar, AvatarAdmin)