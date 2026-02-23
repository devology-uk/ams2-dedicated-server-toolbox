import { useState, useMemo } from 'react';
import { DataTable, type DataTableFilterMeta } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ColumnGroup } from 'primereact/columngroup';
import { Row } from 'primereact/row';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Tooltip } from 'primereact/tooltip';
import { FilterMatchMode } from 'primereact/api';

import './PlayersTab.scss';
import type { AMS2StatsParser } from '../../../../shared/utils/ams2StatsParser.ts';
import type { PlayerEventStats } from '../../../../shared/types/index.ts';
import { useDriverAliases } from '../../../hooks/useDriverAliases';

interface PlayersTabProps {
  parser: AMS2StatsParser;
}

const DASH = '—';

function TooltipHeader({ id, label, tip }: { id: string; label: string; tip: string }) {
  return (
    <>
      <Tooltip target={`#${id}`} content={tip} position="top" />
      <span id={id} style={{ cursor: 'default' }}>
        {label} <i className="pi pi-info-circle text-xs text-color-secondary" />
      </span>
    </>
  );
}

export function PlayersTab({ parser }: PlayersTabProps) {
  const [globalFilter, setGlobalFilter] = useState<string>('');
  const [filters] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    name: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });
  const { resolveAlias, aliasVersion } = useDriverAliases();

  const players = useMemo(() => parser.getPlayerEventStats(), [parser]);

  // Pre-resolve display names into new row objects so PrimeReact DataTable
  // sees changed data (and re-runs body templates) when aliases change.
  const resolvedPlayers = useMemo(
    () => players.map((p) => ({ ...p, name: resolveAlias(p.steamId, p.name) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [players, aliasVersion],
  );

  const header = (
    <div className="flex align-items-center gap-2">
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search drivers..."
        />
      </span>
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
      return <Tag value={icons[rank]} severity={severities[rank]} />;
    }
    return <span className="text-color-secondary">{rank}</span>;
  };

  const colHeader = (
    <ColumnGroup>
      <Row>
        <Column header="#" rowSpan={2} style={{ width: '3.5rem' }} className="text-center" />
        <Column header="Driver" rowSpan={2} />
        <Column header="Qualifying" colSpan={3} className="text-center" />
        <Column header="Race" colSpan={5} className="text-center" />
      </Row>
      <Row>
        <Column
          header={<TooltipHeader id="qual-apps" label="Apps" tip="Number of qualifying sessions participated in" />}
          sortable field="qualifying.appearances"
          style={{ width: '5rem' }} className="text-center"
        />
        <Column header="Poles" sortable field="qualifying.poles" style={{ width: '4.5rem' }} className="text-center" />
        <Column header="Best Grid" sortable field="qualifying.bestPosition" style={{ width: '6rem' }} className="text-center" />
        <Column
          header={<TooltipHeader id="race-apps" label="Apps" tip="Number of races entered (Finishes + DNFs)" />}
          sortable field="race.appearances"
          style={{ width: '5rem' }} className="text-center"
        />
        <Column header="Wins" sortable field="race.wins" style={{ width: '4.5rem' }} className="text-center" />
        <Column header="Podiums" sortable field="race.podiums" style={{ width: '5.5rem' }} className="text-center" />
        <Column header="Finishes" sortable field="race.finishes" style={{ width: '5.5rem' }} className="text-center" />
        <Column header="DNFs" sortable field="race.dnfs" style={{ width: '4.5rem' }} className="text-center" />
        <Column header="Best Pos" sortable field="race.bestPosition" style={{ width: '5.5rem' }} className="text-center" />
      </Row>
    </ColumnGroup>
  );

  return (
    <Card className="shadow-2">
      <DataTable
        value={resolvedPlayers}
        header={header}
        headerColumnGroup={colHeader}
        globalFilter={globalFilter}
        filters={filters}
        globalFilterFields={['name']}
        paginator
        rows={10}
        rowsPerPageOptions={[10, 25, 50]}
        stripedRows
        emptyMessage="No event data found."
        sortField="race.wins"
        sortOrder={-1}
        removableSort
      >
        <Column body={rankBodyTemplate} style={{ width: '3.5rem' }} className="text-center" />
        <Column
          field="name"
          className="font-semibold"
          body={(row: PlayerEventStats) => <span>{row.name}</span>}
        />
        <Column
          field="qualifying.appearances"
          body={(row: PlayerEventStats) =>
            row.qualifying ? row.qualifying.appearances : DASH
          }
          style={{ width: '5rem' }}
          className="text-center"
        />
        <Column
          field="qualifying.poles"
          body={(row: PlayerEventStats) =>
            row.qualifying ? row.qualifying.poles : DASH
          }
          style={{ width: '4.5rem' }}
          className="text-center"
        />
        <Column
          field="qualifying.bestPosition"
          body={(row: PlayerEventStats) =>
            row.qualifying && row.qualifying.bestPosition > 0
              ? `P${row.qualifying.bestPosition}`
              : DASH
          }
          style={{ width: '6rem' }}
          className="text-center"
        />
        <Column
          field="race.appearances"
          body={(row: PlayerEventStats) =>
            row.race ? row.race.appearances : DASH
          }
          style={{ width: '5rem' }}
          className="text-center"
        />
        <Column
          field="race.wins"
          body={(row: PlayerEventStats) =>
            row.race ? row.race.wins : DASH
          }
          style={{ width: '4.5rem' }}
          className="text-center"
        />
        <Column
          field="race.podiums"
          body={(row: PlayerEventStats) =>
            row.race ? row.race.podiums : DASH
          }
          style={{ width: '5.5rem' }}
          className="text-center"
        />
        <Column
          field="race.finishes"
          body={(row: PlayerEventStats) =>
            row.race ? row.race.finishes : DASH
          }
          style={{ width: '5.5rem' }}
          className="text-center"
        />
        <Column
          field="race.dnfs"
          body={(row: PlayerEventStats) =>
            row.race ? row.race.dnfs : DASH
          }
          style={{ width: '4.5rem' }}
          className="text-center"
        />
        <Column
          field="race.bestPosition"
          body={(row: PlayerEventStats) =>
            row.race && row.race.bestPosition > 0
              ? `P${row.race.bestPosition}`
              : DASH
          }
          style={{ width: '5.5rem' }}
          className="text-center"
        />
      </DataTable>
    </Card>
  );
}
