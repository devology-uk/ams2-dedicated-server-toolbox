// src/ui/features/home/components/FeatureTile.tsx

import { Card } from 'primereact/card';

export type TileColor = 'blue' | 'green' | 'orange' | 'purple' | 'cyan' | 'pink';

interface FeatureTileProps {
    title: string;
    description: string;
    icon: string;
    color?: TileColor;
    onClick: () => void;
}

const COLOR_CLASSES: Record<TileColor, { bg: string; text: string }> = {
    blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
    green: { bg: 'bg-green-100', text: 'text-green-600' },
    orange: { bg: 'bg-orange-100', text: 'text-orange-600' },
    purple: { bg: 'bg-purple-100', text: 'text-purple-600' },
    cyan: { bg: 'bg-cyan-100', text: 'text-cyan-600' },
    pink: { bg: 'bg-pink-100', text: 'text-pink-600' },
};

export const FeatureTile = ({
                                title,
                                description,
                                icon,
                                color = 'blue',
                                onClick,
                            }: FeatureTileProps) => {
    const colors = COLOR_CLASSES[color];

    return (
        <Card className="feature-tile" onClick={onClick}>
            <div className="feature-tile__content">
                <div
                    className={`feature-tile__icon-wrapper ${colors.bg}`}
                >
                    <i className={`feature-tile__icon ${icon} ${colors.text}`} />
                </div>
                <h3 className="feature-tile__title">{title}</h3>
                <p className="feature-tile__description">{description}</p>
            </div>
        </Card>
    );
};