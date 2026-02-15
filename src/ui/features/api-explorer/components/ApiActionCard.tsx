import {Card} from 'primereact/card';

interface ApiActionCardProps {
    title: string;
    description: string;
    icon: string;
    loading: boolean;
    onClick: () => void;
}

export function ApiActionCard({title, description, icon, loading, onClick}: ApiActionCardProps) {
    return (
        <Card
            className='api-action-card cursor-pointer shadow-1 hover:shadow-3 transition-all transition-duration-200'
            onClick={loading ? undefined : onClick}
        >
            <div className='flex align-items-center gap-3'>
                <div
                    className='flex align-items-center justify-content-center bg-primary-100 text-primary border-round'
                    style={{width: '3rem', height: '3rem', flexShrink: 0}}
                >
                    <i className={`${icon} text-xl`}/>
                </div>
                <div className='flex flex-column'>
                    <span className='font-semibold'>{title}</span>
                    <span className='text-color-secondary text-sm'>{description}</span>
                </div>
            </div>
        </Card>
    );
}