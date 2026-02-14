import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';

import './OverviewTab.scss';
import type { AMS2StatsParser } from '../utils/ams2StatsParser';

interface OverviewTabProps {
  parser: AMS2StatsParser;
}

export function OverviewTab({ parser }: OverviewTabProps) {
  const stats = parser.getSessionStats();
  const trackUsage = parser.getTrackUsage();
  const vehicleUsage = parser.getVehicleUsage();

console.log('Track Usage:', trackUsage);
console.log('Vehicle Usage:', vehicleUsage);

  const stageData = Object.entries(stats.stageCounts).map(([stage, count]) => ({
    stage: formatStageName(stage),
    count,
    duration: stats.stageDurations[stage] || '-',
  }));

  return (
    <div className="flex flex-column gap-4">
      {/* Stats Cards */}
      <div className="grid">
        <div className="col-12 md:col-6 lg:col-4 xl:col-2">
          <StatCard
            title="Server Uptime"
            value={parser.getFormattedUptime()}
            icon="pi-clock"
            color="blue"
          />
        </div>
        <div className="col-12 md:col-6 lg:col-4 xl:col-2">
          <StatCard
            title="Total Sessions"
            value={stats.totalSessions.toString()}
            icon="pi-calendar"
            color="green"
          />
        </div>
        <div className="col-12 md:col-6 lg:col-4 xl:col-2">
          <StatCard
            title="Total Lobbies"
            value={stats.totalLobbies.toString()}
            icon="pi-th-large"
            color="purple"
          />
        </div>
        <div className="col-12 md:col-6 lg:col-4 xl:col-2">
          <StatCard
            title="Total Distance"
            value={parser.getFormattedTotalDistance()}
            icon="pi-map"
            color="orange"
          />
        </div>
        <div className="col-12 md:col-6 lg:col-4 xl:col-2">
          <StatCard
            title="Race Finishes"
            value={stats.raceFinishes.toString()}
            icon="pi-flag-fill"
            color="cyan"
          />
        </div>
        <div className="col-12 md:col-6 lg:col-4 xl:col-2">
          <StatCard
            title="Race Loads"
            value={stats.raceLoads.toString()}
            icon="pi-download"
            color="pink"
          />
        </div>
      </div>

      {/* Stage Statistics */}
      <Card title="Stage Statistics" className="shadow-2">
        <DataTable value={stageData} stripedRows size="small">
          <Column field="stage" header="Stage" sortable />
          <Column field="count" header="Count" sortable />
          <Column field="duration" header="Total Duration" sortable />
        </DataTable>
      </Card>

      {/* Track & Vehicle Usage */}
      <div className="grid">
        <div className="col-12 lg:col-6">
          <Card title="Track Usage" className="shadow-2 h-full">
            <DataTable value={trackUsage} stripedRows size="small">
              <Column field="trackId" header="Track ID" sortable />
              <Column field="sessions" header="Sessions" sortable />
              <Column
                field="distance"
                header="Distance"
                sortable
                body={(row) => `${(row.distance / 1000).toFixed(2)} km`}
              />
            </DataTable>
          </Card>
        </div>
        <div className="col-12 lg:col-6">
          <Card title="Vehicle Usage" className="shadow-2 h-full">
            <DataTable value={vehicleUsage} stripedRows size="small">
              <Column field="vehicleId" header="Vehicle ID" sortable />
              <Column
                field="distance"
                header="Distance"
                sortable
                body={(row) => `${(row.distance / 1000).toFixed(2)} km`}
              />
            </DataTable>
          </Card>
        </div>
      </div>
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

function formatStageName(stage: string): string {
  return stage
    .replace(/([0-9]+)/g, ' \$1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}