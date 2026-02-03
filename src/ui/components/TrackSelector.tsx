import React, { useState, useEffect, useMemo } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import type { Track } from '../types/electron';

interface TrackGroup {
  label: string;
  items: Track[];
}

interface TrackSelectorProps {
  value: Track | null;
  onChange: (track: Track | null) => void;
  connectionId: string | null;
  disabled?: boolean;
  placeholder?: string;
  showClear?: boolean;
}

const TrackSelector: React.FC<TrackSelectorProps> = ({
  value,
  onChange,
  connectionId,
  disabled = false,
  placeholder = 'Select a track layout',
  showClear = true,
}) => {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTracks = async () => {
    if (!connectionId) return;

    setLoading(true);
    setError(null);

    const result = await window.electron.api.getTracks(connectionId);

    if (result.success && result.data) {
      setTracks(result.data);
    } else {
      setError(result.error || 'Failed to load tracks');
    }

    setLoading(false);
  };

  // Load tracks when connectionId changes
  useEffect(() => {
    if (connectionId) {
      loadTracks();
    } else {
      setTracks([]);
    }
  }, [connectionId]);

  // Group tracks by base track name
  const groupedTracks = useMemo(() => {
    if (tracks.length === 0) return [];

    // Extract base track name (remove common suffixes/variations)
    const getBaseTrackName = (name: string): string => {
      // Common patterns to identify the base track
      // e.g., "Spa_Francorchamps_2020" -> "Spa Francorchamps"
      // e.g., "Hockenheim_GP" -> "Hockenheim"
      // e.g., "Silverstone_1975" -> "Silverstone"
      
      const suffixPatterns = [
        /_GP$/i,
        /_National$/i,
        /_Nat$/i,
        /_International$/i,
        /_Intl$/i,
        /_Short$/i,
        /_Long$/i,
        /_Full$/i,
        /_Outer$/i,
        /_Inner$/i,
        /_Historic$/i,
        /_Modern$/i,
        /_Classic$/i,
        /_Vintage$/i,
        /_24hr?$/i,
        /_RC\d*$/i,
        /_OVAL$/i,
        /_RX$/i,
        /_DIRT\d*$/i,
        /_STT$/i,
        /_SCB$/i,
        /_\d{4}$/,  // Year suffix like _2020, _1988
        /_\d+k(?:nc)?$/i,  // Monza style _10k, _10knc
        /\d+$/,  // Trailing numbers
      ];

      let baseName = name;

      // Keep removing suffixes until we can't anymore
      let changed = true;
      while (changed) {
        changed = false;
        for (const pattern of suffixPatterns) {
          const newName = baseName.replace(pattern, '');
          if (newName !== baseName) {
            baseName = newName;
            changed = true;
            break;
          }
        }
      }

      // Replace underscores with spaces for display
      return baseName.replace(/_/g, ' ').trim();
    };

    // Format layout name for display (the part after the base name)
    const getLayoutDisplayName = (track: Track, baseName: string): string => {
      const basePattern = baseName.replace(/ /g, '_');
      let layoutName = track.name;
      
      // Remove the base name prefix
      if (layoutName.toLowerCase().startsWith(basePattern.toLowerCase())) {
        layoutName = layoutName.substring(basePattern.length);
      }
      
      // Clean up the layout name
      layoutName = layoutName.replace(/^_+/, '').replace(/_/g, ' ').trim();
      
      // If no specific layout name, use "Main" or the full name
      if (!layoutName) {
        layoutName = 'Main Layout';
      }
      
      return layoutName;
    };

    // Group tracks
    const groups: Map<string, Track[]> = new Map();
    
    tracks.forEach(track => {
      const baseName = getBaseTrackName(track.name);
      if (!groups.has(baseName)) {
        groups.set(baseName, []);
      }
      groups.get(baseName)!.push(track);
    });

    // Convert to array and sort
    const groupArray: TrackGroup[] = Array.from(groups.entries())
      .map(([label, items]) => ({
        label,
        items: items.sort((a, b) => {
          // Sort layouts within each group
          const aLayout = getLayoutDisplayName(a, label);
          const bLayout = getLayoutDisplayName(b, label);
          return aLayout.localeCompare(bLayout);
        }),
      }))
      .sort((a, b) => a.label.localeCompare(b.label));

    return groupArray;
  }, [tracks]);

  // Custom template for dropdown items
  const trackOptionTemplate = (option: Track) => {
    return (
      <div className="track-option">
        <span className="track-option-name">{formatLayoutName(option.name)}</span>
        <span className="track-option-details">
          Grid: {option.gridsize} | {option.default_day}/{option.default_month}/{option.default_year}
        </span>
      </div>
    );
  };

  // Format the layout name for display
  const formatLayoutName = (name: string): string => {
    return name.replace(/_/g, ' ');
  };

  // Template for the selected value
  const selectedTrackTemplate = (option: Track | null, props: { placeholder?: string }) => {
    if (option) {
      return (
        <div className="track-selected">
          <span>{formatLayoutName(option.name)}</span>
          <span className="track-selected-details">Grid: {option.gridsize}</span>
        </div>
      );
    }
    return <span>{props.placeholder}</span>;
  };

  // Template for group headers
  const groupTemplate = (option: TrackGroup) => {
    return (
      <div className="track-group-header">
        <i className="pi pi-map-marker"></i>
        <span>{option.label}</span>
        <span className="track-group-count">{option.items.length} layouts</span>
      </div>
    );
  };

  if (error) {
    return (
      <div className="selector-error">
        <span className="p-error">{error}</span>
        <Button
          icon="pi pi-refresh"
          className="p-button-text p-button-sm"
          onClick={loadTracks}
          tooltip="Retry"
        />
      </div>
    );
  }

  return (
    <Dropdown
      value={value}
      options={groupedTracks}
      onChange={(e) => onChange(e.value)}
      optionLabel="name"
      optionGroupLabel="label"
      optionGroupChildren="items"
      optionGroupTemplate={groupTemplate}
      placeholder={placeholder}
      filter
      filterBy="name"
      filterPlaceholder="Search tracks..."
      showClear={showClear}
      loading={loading}
      disabled={disabled || loading || !connectionId}
      className="track-selector"
      panelClassName="track-selector-panel"
      itemTemplate={trackOptionTemplate}
      valueTemplate={selectedTrackTemplate}
      emptyMessage="No tracks available"
      emptyFilterMessage="No tracks found"
    />
  );
};

export default TrackSelector;