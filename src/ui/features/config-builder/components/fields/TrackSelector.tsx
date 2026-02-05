// src/ui/features/config-builder/components/fields/TrackSelector.tsx

import React, { useMemo, useState } from 'react';
import { Dropdown, type DropdownChangeEvent } from 'primereact/dropdown';
import type { Track } from '../../../../types/electron';
import { useServerCache } from '../../hooks/useServerCache';
import type { FieldMetadata } from '../../types/config-builder.types';

interface TrackSelectorProps {
  field: FieldMetadata;
  value: number;
  onChange: (value: number) => void;
  connectionId: string | null;
  disabled?: boolean;
}

export const TrackSelector: React.FC<TrackSelectorProps> = ({
  field,
  value,
  onChange,
  connectionId,
  disabled = false,
}) => {
  const { getTracks } = useServerCache(connectionId);
  const tracks = getTracks();

  const [filter, setFilter] = useState('');

  // Format track names for display
  const options = useMemo(() => {
    return tracks.map(track => ({
      label: formatTrackName(track.name),
      value: track.id,
      gridsize: track.gridsize,
      track,
    }));
  }, [tracks]);

  // Find selected track for display
  const selectedTrack = useMemo(() => {
    return tracks.find(t => t.id === value);
  }, [tracks, value]);

  // Custom option template
  const optionTemplate = (option: { label: string; gridsize: number; track: Track }) => {
    return (
      <div className="flex justify-content-between align-items-center">
        <span>{option.label}</span>
        <span className="text-color-secondary text-sm">
          Grid: {option.gridsize}
        </span>
      </div>
    );
  };

  // Custom value template
  const valueTemplate = (option: { label: string; gridsize: number } | null) => {
    if (!option) {
      return <span className="text-color-secondary">Select a track...</span>;
    }
    return (
      <div className="flex justify-content-between align-items-center">
        <span>{option.label}</span>
        <span className="text-color-secondary text-sm">
          Grid: {option.gridsize}
        </span>
      </div>
    );
  };

  return (
    <>
      <Dropdown
        id={field.name}
        value={value}
        options={options}
        onChange={(e: DropdownChangeEvent) => onChange(e.value)}
        disabled={disabled || field.isReadOnly}
        filter
        filterBy="label"
        placeholder="Select a track..."
        className="w-full"
        itemTemplate={optionTemplate}
        valueTemplate={valueTemplate}
        virtualScrollerOptions={{ itemSize: 40 }}
        showClear
      />
      {selectedTrack && (
        <small className="text-color-secondary block mt-1">
          Default date: {selectedTrack.default_month}/{selectedTrack.default_day}/{selectedTrack.default_year} 
          | Max grid: {selectedTrack.gridsize}
        </small>
      )
    }    
    </>
  )
};

/**
 * Format track internal name to display name
 * e.g., "Spa_Francorchamps_2022" -> "Spa Francorchamps 2022"
 */
function formatTrackName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/(\d{4})$/, ' $1') // Add space before year
    .replace(/\s+/g, ' ')
    .trim();
}