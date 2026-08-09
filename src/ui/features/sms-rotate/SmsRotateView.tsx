// src/ui/features/sms-rotate/SmsRotateView.tsx

import { SmsRotateForm } from './components/SmsRotateForm';

export const SmsRotateView = () => {
    return (
        <div className="sms-rotate-view h-full flex flex-column">
            <div className="sms-rotate-view__header px-4 pt-4 pb-3 border-bottom-1 surface-border flex-shrink-0">
                <div className="flex align-items-center gap-3 mb-2">
                    <i className="pi pi-sync text-3xl text-pink-500" />
                    <h1 className="m-0 text-2xl">SMS Rotate</h1>
                </div>
                <p className="m-0 text-color-secondary">
                    Configures the <code>sms_rotate</code> plugin's <code>lua_config/sms_rotate_config.json</code> —
                    build a default session setup and a track/vehicle/weather rotation list for your AMS2 dedicated server.
                </p>
            </div>

            <div className="sms-rotate-view__content flex-grow-1 overflow-auto p-4">
                <SmsRotateForm />
            </div>
        </div>
    );
};
