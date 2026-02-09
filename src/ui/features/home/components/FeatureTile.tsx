import { Card } from 'primereact/card';

interface FeatureTileProps {
  title: string;
  description: string;
  icon: string;
  onClick: () => void;
}

export const FeatureTile = ({
  title,
  description,
  icon,
  onClick,
}: FeatureTileProps) => {
  return (
    <Card className="feature-tile" onClick={onClick}>
      <div className="feature-tile__content">
        <i className={`feature-tile__icon ${icon}`} />
        <h3 className="feature-tile__title">{title}</h3>
        <p className="feature-tile__description">{description}</p>
      </div>
    </Card>
  );
};