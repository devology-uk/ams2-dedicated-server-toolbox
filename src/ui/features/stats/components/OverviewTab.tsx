import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

import './OverviewTab.scss';
import type { AMS2StatsParser } from '../../../../shared/utils/ams2StatsParser.ts';
import { useGameLookup } from '../../../hooks/useGameLookup';

interface OverviewTabProps {
  parser: AMS2StatsParser;
}

export function OverviewTab({ parser }: OverviewTabProps) {
  const { resolveTrack } = useGameLookup();
  const uptime = parser.getFormattedUptime();
  const stats = parser.getEventOverviewStats();

  const trackUsage = [...stats.trackUsage].sort(
    (a, b) => b.qualifyingCount + b.raceCount - (a.qualifyingCount + a.raceCount),
  );

  return (
    <div className="flex flex-column gap-4">
      {/* Stats Cards */}
      <div className="grid">
        <div className="col-12 md:col-6 lg:col-4 xl:col-2">
          <StatCard
            title="Server Uptime"
            value={uptime}
            icon="pi-clock"
            color="blue"
          />
        </div>
        <div className="col-12 md:col-6 lg:col-4 xl:col-2">
          <StatCard
            title="Total Events"
            value={stats.totalEvents.toString()}
            icon="pi-calendar"
            color="green"
          />
        </div>
        <div className="col-12 md:col-6 lg:col-4 xl:col-2">
          <StatCard
            title="Qualifying Sessions"
            value={stats.qualifyingCount.toString()}
            icon="pi-stopwatch"
            color="purple"
          />
        </div>
        <div className="col-12 md:col-6 lg:col-4 xl:col-2">
          <StatCard
            title="Race Sessions"
            value={stats.raceCount.toString()}
            icon="pi-flag-fill"
            color="orange"
          />
        </div>
        <div className="col-12 md:col-6 lg:col-4 xl:col-2">
          <StatCard
            title="Unique Drivers"
            value={stats.uniqueDrivers.toString()}
            icon="pi-users"
            color="cyan"
          />
        </div>
      </div>

      {/* Event Track Usage */}
      <Card title="Event Track Usage" className="shadow-2">
        <DataTable value={trackUsage} stripedRows size="small" emptyMessage="No event sessions found.">
          <Column
            field="trackId"
            header="Track"
            sortable
            body={(row) => resolveTrack(row.trackId)}
          />
          <Column field="qualifyingCount" header="Qualifying" sortable style={{ width: '8rem' }} className="text-center" />
          <Column field="raceCount" header="Race" sortable style={{ width: '6rem' }} className="text-center" />
        </DataTable>
      </Card>
    </div>
  );
}

// --- Stat Card Component ---
interface StatCardProps {
  title: string;
  value: string;
  icon: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'cyan' | 'pink';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    cyan: 'bg-cyan-100 text-cyan-600',
    pink: 'bg-pink-100 text-pink-600',
  };

  return (
    <Card className="shadow-2 h-full">
      <div className="flex align-items-center gap-3">
        <div
          className={`flex align-items-center justify-content-center border-round ${colorClasses[color]}`}
          style={{ width: '3rem', height: '3rem' }}
        >
          <i className={`pi ${icon} text-xl`}></i>
        </div>
        <div>
          <span className="block text-color-secondary text-sm mb-1">{title}</span>
          <span className="block text-xl font-semibold">{value}</span>
        </div>
      </div>
    </Card>
  );
}
