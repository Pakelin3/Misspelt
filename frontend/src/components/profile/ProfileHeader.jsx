import React from 'react';
import {
    PixelEditIcon, PixelSaveIcon, PixelStarIcon, TrophyIcon, PixelFireIcon, SwordIcon,
} from '@/components/PixelIcons';
import AvatarPicker from './AvatarPicker';

// ─── Identity card: avatar, name/title, edit form, XP bar, quick stats ───
const ProfileHeader = ({
    userStats,
    profileData,
    isEditing,
    editForm,
    setEditForm,
    saving,
    avatarSrc,
    onStartEditing,
    onSaveProfile,
    onCancelEdit,
}) => {
    const editingAvatarSrc = userStats.unlocked_avatars?.find(a => a.id === editForm.current_avatar)?.image || avatarSrc;

    return (
        <div className="relative bg-card pixel-border p-6 md:p-8 mb-8">

            {!isEditing ? (
                <button
                    onClick={onStartEditing}
                    aria-label="Editar perfil"
                    className="absolute bottom-4 right-4 p-2 text-muted-foreground hover:text-primary hover:bg-primary hover:text-primary-foreground/10 transition-colors border-2 border-transparent hover:border-primary"
                >
                    <PixelEditIcon className="w-4 h-4" aria-hidden="true" />
                </button>
            ) : (
                <div className="absolute bottom-4 right-4 flex gap-2">
                    <button
                        onClick={onSaveProfile}
                        disabled={saving}
                        aria-label="Guardar perfil"
                        className="p-2 bg-primary text-primary-foreground border-2 border-foreground hover:brightness-110 transition-all disabled:opacity-50"
                    >
                        <PixelSaveIcon className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                        onClick={onCancelEdit}
                        aria-label="Cancelar edición"
                        className="p-2 text-muted-foreground hover:text-destructive text-base font-mono border-2 border-transparent hover:border-destructive transition-colors"
                    >
                        X
                    </button>
                </div>
            )}

            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                <div id="tutorial-avatar" className="relative shrink-0 flex flex-col items-center">
                    <div className="w-28 h-28 pixel-border bg-muted/30 p-1 overflow-hidden flex items-center justify-center">
                        <img
                            loading="lazy"
                            src={isEditing ? editingAvatarSrc : avatarSrc}
                            alt={`Avatar de ${userStats.user_username}`}
                            width={112}
                            height={112}
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <div className="absolute -bottom-2 -right-2 px-2 py-0.5 bg-accent text-accent-foreground font-mono text-2xs font-bold pixel-border-accent z-10">
                        NVL {userStats.level}
                    </div>
                </div>
                <div className="flex-1 text-center md:text-left">
                    {!isEditing ? (
                        <>
                            <h1 className="text-2xl md:text-3xl font-mono font-bold text-foreground mb-1">
                                {profileData?.full_name || userStats.user_username}
                            </h1>
                            <p className="text-sm text-muted-foreground font-mono mb-1">@{userStats.user_username}</p>
                            {profileData?.current_title && (
                                <span className="inline-block px-3 py-1 text-2xs font-mono font-bold bg-primary/20 text-primary border-2 border-primary/40 mt-1">
                                    {profileData.current_title}
                                </span>
                            )}
                        </>
                    ) : (
                        <div className="space-y-3 max-w-md">
                            <div>
                                <label htmlFor="profile-full-name" className="text-2xs font-mono uppercase text-muted-foreground block mb-1">Nombre Completo</label>
                                <input
                                    id="profile-full-name"
                                    value={editForm.full_name}
                                    onChange={e => setEditForm({ ...editForm, full_name: e.target.value })}
                                    className="w-full h-9 px-3 bg-background border-2 border-foreground rounded-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:border-primary text-sm font-mono"
                                    placeholder="Tu nombre..."
                                />
                            </div>
                            <AvatarPicker
                                avatars={userStats.unlocked_avatars}
                                selectedId={editForm.current_avatar}
                                onSelect={id => setEditForm({ ...editForm, current_avatar: id })}
                            />
                            <div>
                                <label htmlFor="profile-title" className="text-2xs font-mono uppercase text-muted-foreground block mb-1">Título</label>
                                <select
                                    id="profile-title"
                                    value={editForm.current_title}
                                    onChange={e => setEditForm({ ...editForm, current_title: e.target.value })}
                                    className="w-full h-9 px-3 bg-background border-2 border-foreground text-foreground rounded-none focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus:border-primary text-sm font-mono"
                                >
                                    <option value="">Sin título</option>
                                    {(userStats.unlocked_titles || []).map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                    <div id="tutorial-xp" className="mt-4 max-w-sm mx-auto md:mx-0">
                        <div className="flex justify-between text-2xs font-mono text-muted-foreground mb-1">
                            <span>XP: {userStats.experience}</span>
                            <span>Siguiente: {userStats.xp_for_next_level}</span>
                        </div>
                        <div className="w-full h-3 bg-muted border-2 border-foreground relative">
                            <div
                                className="h-full bg-accent transition-all duration-700"
                                style={{ width: `${userStats.xp_progress_in_current_level}%` }}
                            />
                            <div className="absolute top-0 left-0 w-full h-px bg-primary-foreground/25" />
                        </div>
                        <p className="text-2xs font-mono text-right text-muted-foreground mt-0.5">
                            {userStats.xp_progress_in_current_level?.toFixed(1)}%
                        </p>
                    </div>
                </div>
                <div id="tutorial-quick-stats" className="hidden md:grid grid-cols-2 gap-2 shrink-0">
                    {[
                        { label: 'Racha', value: userStats.current_streak, icon: <PixelFireIcon className="w-6 h-6 text-warning" aria-hidden="true" /> },
                        { label: 'Récord', value: userStats.longest_streak, icon: <PixelStarIcon className="w-6 h-6 text-accent-strong" aria-hidden="true" /> },
                        { label: 'Insignias', value: userStats.unlocked_badges?.length || 0, icon: <TrophyIcon className="w-6 h-6 text-accent-strong" aria-hidden="true" /> },
                        { label: 'Avatares', value: userStats.unlocked_avatars?.length || 0, icon: <SwordIcon className="w-6 h-6" aria-hidden="true" /> },
                    ].map(s => (
                        <div key={s.label} className="flex items-center gap-2 px-3 py-2 bg-muted/20 border border-foreground/20">
                            <div className="shrink-0 flex justify-center w-8">{s.icon}</div>
                            <div>
                                <p className="text-base font-mono font-bold text-foreground leading-none">{s.value}</p>
                                <p className="text-3xs font-mono text-muted-foreground uppercase">{s.label}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <p className="mt-4 text-3xs font-mono text-muted-foreground text-center md:text-left">
                Los avatares y títulos nuevos se desbloquean subiendo de nivel y ganando insignias.
            </p>
        </div>
    );
};

export default ProfileHeader;
