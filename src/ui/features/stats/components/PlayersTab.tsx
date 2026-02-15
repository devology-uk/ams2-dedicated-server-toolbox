import { useState, useMemo } from 'react';
import { DataTable, type DataTableFilterMeta } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { FilterMatchMode } from 'primereact/api';

import './PlayersTab.scss';
import type { AMS2StatsParser } from '../../../../shared/utils/ams2StatsParser.ts';

interface PlayersTabProps {
  parser: AMS2StatsParser;
}

type SortField = 'distance' | 'joins' | 'finishes';

export function PlayersTab({ parser }: PlayersTabProps) {
  const [sortBy, setSortBy] = useState<SortField>('distance');
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [filters] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
    steamId: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  const players = useMemo(() => {
    return parser.getPlayerLeaderboard(sortBy);
  }, [parser, sortBy]);

  const sortOptions = [
    { label: 'Distance', value: 'distance' },
    { label: 'Race Joins', value: 'joins' },
    { label: 'Race Finishes', value: 'finishes' },
  ];

  const header = (
    <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3">
      <div className="flex align-items-center gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search players..."
          />
        </span>
      </div>
      <div className="flex align-items-center gap-2">
        <label htmlFor="sortBy" className="font-semibold">
          Sort by:
        </label>
        <Dropdown
          id="sortBy"
          value={sortBy}
          options={sortOptions}
          onChange={(e) => setSortBy(e.value)}
          className="w-10rem"
        />
      </div>
    </div>
  );

  const rankBodyTemplate = (_: unknown, options: { rowIndex: number }) => {
    const rank = options.rowIndex + 1;
    if (rank <= 3) {
      const severities: Record<number, 'warning' | 'secondary' | 'danger'> = {
        1: 'warning',
        2: 'secondary',
        3: 'danger',
      };
      const icons: Record<number, string> = {
        1: '🥇',
        2: '🥈',
        3: '🥉',
      };
      return (
        <Tag value={icons[rank]} severity={severities[rank]} />
      );
    }
    return <span className="text-color-secondary">{rank}</span>;
  };

  const distanceBodyTemplate = (rowData: ReturnType<typeof parser.getPlayers>[0]) => {
    return (
      <span className="font-semibold">
        {(rowData.totalDistance / 1000).toFixed(2)} km
      </span>
    );
  };

  const dateBodyTemplate = (rowData: ReturnType<typeof parser.getPlayers>[0]) => {
    return (
      <span className="text-color-secondary">
        {rowData.lastJoined.toLocaleDateString()} {rowData.lastJoined.toLocaleTimeString()}
      </span>
    );
  };

  const steamIdBodyTemplate = (rowData: ReturnType<typeof parser.getPlayers>[0]) => {
    return (
      <code className="text-sm surface-100 px-2 py-1 border-round">
        {rowData.steamId}
      </code>
    );
  };

  return (
    <Card className="shadow-2">
      <DataTable
        value={players}
        header={header}
        globalFilter={globalFilter}
        filters={filters}
        paginator
        rows={10}
        rowsPerPageOptions={[10, 25, 50]}
        stripedRows
        emptyMessage="No players found."
        sortField={sortBy === 'distance' ? 'totalDistance' : sortBy === 'joins' ? 'raceJoins' : 'raceFinishes'}
        sortOrder={-1}
        removableSort
      >
        <Column
          header="#"
          body={rankBodyTemplate}
          style={{ width: '4rem' }}
          className="text-center"
        />
        <Column
          field="name"
          header="Name"
          sortable
          filter
          filterPlaceholder="Search by name"
          className="font-semibold"
        />
        <Column
          field="steamId"
          header="Steam ID"
          body={steamIdBodyTemplate}
          sortable
        />
        <Column
          field="totalDistance"
          header="Distance"
          body={distanceBodyTemplate}
          sortable
          style={{ width: '10rem' }}
        />
        <Column
          field="raceJoins"
          header="Joins"
          sortable
          style={{ width: '6rem' }}
          className="text-center"
        />
        <Column
          field="raceFinishes"
          header="Finishes"
          sortable
          style={{ width: '6rem' }}
          className="text-center"
        />
        <Column
          field="lastJoined"
          header="Last Seen"
          body={dateBodyTemplate}
          sortable
          style={{ width: '12rem' }}
        />
      </DataTable>
    </Card>
  );
}