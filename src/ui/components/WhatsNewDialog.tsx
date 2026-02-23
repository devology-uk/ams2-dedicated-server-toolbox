// src/ui/components/WhatsNewDialog.tsx

import { type ReactNode } from 'react';
import { Dialog } from 'primereact/dialog';
import { Button } from 'primereact/button';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';

interface WhatsNewDialogProps {
    visible: boolean;
    currentVersion: string;
    markdown: string;
    onDismiss: () => void;
}

/** Section heading colours matching the stage tag palette */
const SECTION_SEVERITY: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
    Added:   'success',
    Changed: 'info',
    Fixed:   'warning',
    Removed: 'danger',
};

/**
 * Render the subset of Keep-a-Changelog markdown we actually use:
 *   ## [x.x.x] - date   → version heading
 *   ### Added / Changed / Fixed / Removed  → coloured tag + divider
 *   - bullet text        → list item
 */
function renderMarkdown(markdown: string): ReactNode[] {
    const lines = markdown.split('\n');
    const elements: ReactNode[] = [];
    let listItems: string[] = [];
    let key = 0;

    const flushList = () => {
        if (listItems.length === 0) return;
        elements.push(
            <ul key={key++} className="m-0 pl-4 flex flex-column gap-1">
                {listItems.map((item, i) => (
                    <li key={i} className="text-sm">{item}</li>
                ))}
            </ul>,
        );
        listItems = [];
    };

    for (const raw of lines) {
        const line = raw.trimEnd();

        // Version heading: ## [1.1.0] - 2026-02-24
        if (line.startsWith('## [')) {
            flushList();
            const match = line.match(/^## \[(\d+\.\d+\.\d+)\]/);
            if (match) {
                if (elements.length > 0) {
                    elements.push(<Divider key={key++} className="my-2" />);
                }
                elements.push(
                    <div key={key++} className="flex align-items-center gap-2 mb-2">
                        <i className="pi pi-tag text-primary" />
                        <span className="font-semibold text-base">v{match[1]}</span>
                    </div>,
                );
            }
            continue;
        }

        // Section tag: ### Added / Changed / Fixed / Removed
        if (line.startsWith('### ')) {
            flushList();
            const section = line.slice(4).trim();
            const severity = SECTION_SEVERITY[section] ?? 'secondary';
            elements.push(
                <Tag key={key++} value={section} severity={severity} className="mb-1 mt-2" />,
            );
            continue;
        }

        // Bullet item: - text
        if (line.startsWith('- ')) {
            listItems.push(line.slice(2).trim());
            continue;
        }

        // Anything else: flush pending list, skip blank lines
        if (line.trim()) {
            flushList();
            elements.push(<p key={key++} className="text-sm m-0">{line.trim()}</p>);
        } else {
            flushList();
        }
    }

    flushList();
    return elements;
}

export function WhatsNewDialog({ visible, currentVersion, markdown, onDismiss }: WhatsNewDialogProps) {
    const header = (
        <div className="flex align-items-center gap-3">
            <i className="pi pi-sparkles text-2xl text-primary" />
            <div className="flex flex-column">
                <span className="text-xl font-semibold">What's New</span>
                <span className="text-xs text-color-secondary">Version {currentVersion}</span>
            </div>
        </div>
    );

    const footer = (
        <div className="flex justify-content-end">
            <Button label="Got it" icon="pi pi-check" onClick={onDismiss} />
        </div>
    );

    return (
        <Dialog
            header={header}
            footer={footer}
            visible={visible}
            onHide={onDismiss}
            style={{ width: '36rem' }}
            breakpoints={{ '640px': '95vw' }}
            modal
        >
            <ScrollPanel style={{ width: '100%', height: '22rem' }}>
                <div className="flex flex-column gap-1 pr-3">
                    {renderMarkdown(markdown)}
                </div>
            </ScrollPanel>
        </Dialog>
    );
}
