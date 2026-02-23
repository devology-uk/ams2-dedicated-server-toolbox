// src/ui/features/config-builder/components/fields/TrackSelector.tsx

import { useMemo } from 'react';
import { Dropdown, type DropdownChangeEvent } from 'primereact/dropdown';
import { useServerCache } from '../../hooks/useServerCache';
import type { FieldMetadata } from '../../../../../shared/types/config';

interface TrackSelectorProps {
  field: FieldMetadata;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export const TrackSelector = ({
  field,
  value,
  onChange,
  disabled = false,
}: TrackSelectorProps) => {
  const { getTracks } = useServerCache();
  const tracks = getTracks();

  // Format track names for display — name with track ID in parentheses
  const options = useMemo(() => {
    return tracks.map(track => ({
      label: `${formatTrackName(track.name)} (${track.id})`,
      value: track.id,
      track,
    }));
  }, [tracks]);

  // Find selected track for display
  const selectedTrack = useMemo(() => {
    return tracks.find(t => t.id === value);
  }, [tracks, value]);

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
        virtualScrollerOptions={{ itemSize: 40 }}
        showClear
      />
      {selectedTrack && (
        <small className="text-color-secondary block mt-1">
          Default date: {selectedTrack.default_month}/{selectedTrack.default_day}/{selectedTrack.default_year}
          | Max grid: {selectedTrack.gridsize}
        </small>
      )}
    </>
  );
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
