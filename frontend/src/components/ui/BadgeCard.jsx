import React from 'react';
import { TrophyIcon, PixelCheckIcon, PixelLockIcon } from '@/components/PixelIcons';


const BadgeCard = ({ badge, status }) => {
    const { unlocked, progress, showProgress, conditionText } = status;

    const buildRewardText = () => {
        const parts = [];
        if (badge.reward_data) {
            let rData = badge.reward_data;
            try {
                if (typeof rData === 'string') {
                    rData = JSON.parse(rData);
                }
            } catch (e) {
                console.warn("Invalid reward_data format", e);
            }

            if (rData.exp > 0) parts.push(`+${rData.exp} XP`);
            if (rData.title) parts.push(`Título: ${rData.title}`);
            if (rData.avatar_id) parts.push(`Avatar`);
        }

        if (parts.length > 0) return parts.join(' | ');

        if (badge.reward_description && badge.reward_description !== 'Sin Recompensa') {
            return badge.reward_description;
        }
        return null;
    };

    const finalRewardText = buildRewardText();

    return (
        <div className={`
            relative flex flex-col items-center p-6 transition-all duration-300
            bg-card pixel-border group
            ${unlocked ? 'hover:-translate-y-2' : 'opacity-80 grayscale hover:grayscale-0 hover:opacity-100'}
        `}>

            <div className="relative mb-4 w-24 h-24 flex items-center justify-center">
                <div className={`absolute inset-0 border-4 border-dashed rounded-full ${unlocked ? 'border-primary animate-spin-slow' : 'border-muted'}`} />
                {badge.image ? (
                    <img
                        src={badge.image}
                        alt={badge.title}
                        className={`w-20 h-20 object-contain z-10 transition-transform ${unlocked ? 'scale-110' : 'scale-90'}`}
                    />
                ) : (
                    <TrophyIcon className="w-12 h-12 text-muted-foreground z-10" />
                )}

                <div className={`absolute -bottom-2 -right-2 p-2 pixel-border z-20 ${unlocked ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                    {unlocked ? <PixelCheckIcon className="w-4 h-4" /> : <PixelLockIcon className="w-4 h-4" />}
                </div>
            </div>

            <div className="text-center w-full flex-1 flex flex-col">
                <h3 className={`font-mono text-sm mb-2 leading-tight ${unlocked ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {badge.title}
                </h3>

                <p className="font-sans text-sm text-muted-foreground leading-tight mb-2 flex-1">
                    {conditionText}
                </p>

                {finalRewardText && (
                    <div className="text-[10px] font-mono text-accent bg-accent/10 px-2 py-1 mb-4 pixel-border-accent border-2">
                        🎁 {finalRewardText}
                    </div>
                )}

                {showProgress && !unlocked && (
                    <div className="w-full mt-auto">
                        <div className="flex justify-between text-[10px] font-mono mb-1 text-muted-foreground">
                            <span>PROGRESO</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="w-full h-4 bg-muted border-2 border-foreground relative">
                            <div
                                className="h-full bg-accent transition-all duration-500 border-r-2 border-foreground"
                                style={{ width: `${progress}%` }}
                            />
                            <div className="absolute top-0 left-0 w-full h-1 bg-white/20" />
                        </div>
                    </div>
                )}

                {unlocked && (
                    <div className="w-full mt-auto py-1 bg-primary/20 border-2 border-primary text-primary font-mono text-[10px]">
                        ¡DESBLOQUEADO!
                    </div>
                )}
            </div>
        </div>
    );
};

export default BadgeCard;