// src/ui/features/results/components/AddResultDialog.tsx

import { useState, useEffect } from 'react';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';

import type { StageResultRow } from '../../../../shared/types';
import { formatStageName } from '../../../utils/formatters';

interface AddResultDialogProps {
    visible: boolean;
    onHide: () => void;
    sessionId: number;
    stageName: string;
    existingResults: StageResultRow[];
    onResultAdded: () => void;
}

const STATE_OPTIONS = [
    { label: 'DNF', value: 'DNF' },
    { label: 'Finished', value: 'Finished' },
    { label: 'Retired', value: 'Retired' },
    { label: 'Disqualified', value: 'Disqualified' },
];

/** Parses "m:ss.mmm", "ss.mmm", or "ss" → milliseconds. Returns null on failure. */
function parseTimeInput(s: string): number | null {
    s = s.trim();
    if (!s) return null;
    try {
        const parts = s.split(':');
        if (parts.length === 2) {
            const minutes = parseInt(parts[0], 10);
            const [secStr, msStr = '0'] = parts[1].split('.');
            const seconds = parseInt(secStr, 10);
            const ms = parseInt(msStr.padEnd(3, '0').slice(0, 3), 10);
            if (isNaN(minutes) || isNaN(seconds) || isNaN(ms)) return null;
            return (minutes * 60 + seconds) * 1000 + ms;
        }
        const [secStr, msStr = '0'] = s.split('.');
        const seconds = parseInt(secStr, 10);
        const ms = parseInt(msStr.padEnd(3, '0').slice(0, 3), 10);
        if (isNaN(seconds) || isNaN(ms)) return null;
        return seconds * 1000 + ms;
    } catch {
        return null;
    }
}

export function AddResultDialog({
    visible,
    onHide,
    sessionId,
    stageName,
    existingResults,
    onResultAdded,
}: AddResultDialogProps) {
    const defaultPosition = existingResults.length + 1;

    const [name, setName] = useState('');
    const [steamId, setSteamId] = useState('');
    const [position, setPosition] = useState(defaultPosition);
    const [state, setState] = useState('DNF');
    const [lapsCompleted, setLapsCompleted] = useState(0);
    const [fastestLapInput, setFastestLapInput] = useState('');
    const [totalTimeInput, setTotalTimeInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset form when dialog opens
    useEffect(() => {
        if (visible) {
            setName('');
            setSteamId('');
            setPosition(existingResults.length + 1);
            setState('DNF');
            setLapsCompleted(0);
            setFastestLapInput('');
            setTotalTimeInput('');
            setError(null);
        }
    }, [visible, existingResults.length]);

    const handleSave = async () => {
        setError(null);

        if (!name.trim()) {
            setError('Driver name is required.');
            return;
        }
        if (position < 1) {
            setError('Position must be 1 or greater.');
            return;
        }

        let fastestLapTime: number | null = null;
        if (fastestLapInput.trim()) {
            fastestLapTime = parseTimeInput(fastestLapInput);
            if (fastestLapTime === null) {
                setError('Invalid fastest lap format. Use m:ss.mmm (e.g. 1:23.456)');
                return;
            }
        }

        let totalTime = 0;
        if (totalTimeInput.trim()) {
            const parsed = parseTimeInput(totalTimeInput);
            if (parsed === null) {
                setError('Invalid total time format. Use m:ss.mmm (e.g. 32:10.500)');
                return;
            }
            totalTime = parsed;
        }

        setSaving(true);
        try {
            const res = await window.electron.statsDb.insertManualResult({
                sessionId,
                stageName,
                name: name.trim(),
                steamId: steamId.trim() || null,
                position,
                state,
                lapsCompleted,
                fastestLapTime,
                totalTime,
            });

            if (res.success) {
                onResultAdded();
            } else {
                setError(res.error ?? 'Failed to save result.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setSaving(false);
        }
    };

    const footer = (
        <div className="flex justify-content-end gap-2">
            <Button label="Cancel" severity="secondary" onClick={onHide} disabled={saving} />
            <Button label="Save" icon="pi pi-check" onClick={handleSave} loading={saving} />
        </div>
    );

    return (
        <Dialog
            header={
                <div className="flex align-items-center gap-2">
                    <i className="pi pi-plus-circle text-primary" />
                    <span>Add Manual Result — {formatStageName(stageName)}</span>
                </div>
            }
            visible={visible}
            onHide={onHide}
            footer={footer}
            style={{ width: '32rem' }}
            breakpoints={{ '640px': '95vw' }}
        >
            <div className="flex flex-column gap-3 pt-2">
                {error && <Message severity="error" text={error} className="w-full" />}

                <div className="flex flex-column gap-1">
                    <label className="text-sm font-semibold">
                        Driver Name <span className="text-red-500">*</span>
                    </label>
                    <InputText
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                        placeholder="e.g. appollo13"
                        autoFocus
                    />
                </div>

                <div className="flex flex-column gap-1">
                    <label className="text-sm font-semibold">Steam ID (optional)</label>
                    <InputText
                        value={steamId}
                        onChange={(e) => setSteamId(e.target.value)}
                        placeholder="76561198xxxxxxxxx"
                        className="font-mono"
                    />
                    <span className="text-xs text-color-secondary">
                        Links the result to an existing player profile if provided.
                    </span>
                </div>

                <div className="grid">
                    <div className="col-6 flex flex-column gap-1">
                        <label className="text-sm font-semibold">
                            Finishing Position <span className="text-red-500">*</span>
                        </label>
                        <InputNumber
                            value={position}
                            onValueChange={(e) => setPosition(e.value ?? 1)}
                            min={1}
                            showButtons
                        />
                    </div>
                    <div className="col-6 flex flex-column gap-1">
                        <label className="text-sm font-semibold">Status</label>
                        <Dropdown
                            value={state}
                            options={STATE_OPTIONS}
                            onChange={(e) => setState(e.value)}
                        />
                    </div>
                </div>

                <div className="flex flex-column gap-1">
                    <label className="text-sm font-semibold">Laps Completed</label>
                    <InputNumber
                        value={lapsCompleted}
                        onValueChange={(e) => setLapsCompleted(e.value ?? 0)}
                        min={0}
                        showButtons
                    />
                </div>

                <div className="grid">
                    <div className="col-6 flex flex-column gap-1">
                        <label className="text-sm font-semibold">Fastest Lap (optional)</label>
                        <InputText
                            value={fastestLapInput}
                            onChange={(e) => setFastestLapInput(e.target.value)}
                            placeholder="1:23.456"
                            className="font-mono"
                        />
                    </div>
                    <div className="col-6 flex flex-column gap-1">
                        <label className="text-sm font-semibold">Total Time (optional)</label>
                        <InputText
                            value={totalTimeInput}
                            onChange={(e) => setTotalTimeInput(e.target.value)}
                            placeholder="32:10.500"
                            className="font-mono"
                        />
                    </div>
                </div>
            </div>
        </Dialog>
    );
}
