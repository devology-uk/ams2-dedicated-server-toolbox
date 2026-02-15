import { useState, useMemo, type ReactNode } from 'react';

import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Chip } from 'primereact/chip';
import { Divider } from 'primereact/divider';

import './SessionsTab.scss';
import type { AMS2StatsParser } from '../../../../shared/utils/ams2StatsParser.ts';
import type { Participant, SessionHistory } from '../../../../shared/types';
import { useGameLookup } from '../../../hooks/useGameLookup';
import { formatStageName, formatDurationSeconds } from '../../../utils/formatters';

interface SessionsTabProps {
  parser: AMS2StatsParser;
}

interface SessionRowData extends SessionHistory {
  participants: Participant[];
  startDate: Date;
  endDate: Date;
  duration: number;
  stageList: string[];
}

interface SessionDetailsDialogProps {
  session: SessionRowData | null;
  visible: boolean;
  onHide: () => void;
}


const SessionDetailsDialog = ({
  session,
  visible,
  onHide,
}: SessionDetailsDialogProps) => {
  const { resolveTrack, resolveVehicle } = useGameLookup();
  if (!session) return null;

  const headerElement = (
    <div className="session-details__header">
      <i className="pi pi-calendar" />
      <span>Session #{session.index} Details</span>
    </div>
  );

  return (
    <Dialog
      header={headerElement}
      visible={visible}
      onHide={onHide}
      className="session-details"
      breakpoints={{ '960px': '75vw', '641px': '95vw' }}
      style={{ width: '50vw' }}
    >
      <div className="session-details__content">
        {/* Session Info */}
        <div className="session-details__info-grid">
          <div className="session-details__info-item">
            <span className="session-details__label">Status</span>
            <Tag
              value={session.finished ? 'Completed' : 'Incomplete'}
              severity={session.finished ? 'success' : 'warning'}
            />
          </div>
          <div className="session-details__info-item">
            <span className="session-details__label">Start Time</span>
            <span className="session-details__value">
              {session.startDate.toLocaleString()}
            </span>
          </div>
          <div className="session-details__info-item">
            <span className="session-details__label">End Time</span>
            <span className="session-details__value">
              {session.endDate.toLocaleString()}
            </span>
          </div>
          <div className="session-details__info-item">
            <span className="session-details__label">Track</span>
            <span className="session-details__value">{resolveTrack(session.setup.TrackId)}</span>
          </div>
        </div>

        <Divider />

        {/* Participants */}
        <section className="session-details__section">
          <h4>
            <i className="pi pi-users" />
            Participants ({session.participants.length})
          </h4>
          <DataTable value={session.participants} size="small" stripedRows>
            <Column field="Name" header="Name" />
            <Column
              field="SteamID"
              header="Steam ID"
              body={(row: Participant) => <code>{row.SteamID}</code>}
            />
            <Column field="VehicleId" header="Vehicle" body={(row: Participant) => resolveVehicle(row.VehicleId)} />
            <Column field="LiveryId" header="Livery ID" />
          </DataTable>
        </section>

        <Divider />

        {/* Stages */}
        <section className="session-details__section">
          <h4>
            <i className="pi pi-flag" />
            Stages
          </h4>
          <div className="session-details__stages">
            {Object.entries(session.stages).map(([stageName, stageData]) => {
              const stageDuration = stageData.end_time - stageData.start_time;

              return (
                <Card key={stageName} className="session-details__stage-card">
                  <span className="session-details__stage-name">
                    {formatStageName(stageName)}
                  </span>
                  <span className="session-details__stage-duration">
                    Duration: {formatDurationSeconds(stageDuration)}
                  </span>
                </Card>
              );
            })}
          </div>
        </section>

        <Divider />

        {/* Setup */}
        <section className="session-details__section">
          <h4>
            <i className="pi pi-cog" />
            Setup
          </h4>
          <div className="session-details__setup-grid">
            <SetupItem label="Max Players" value={session.setup.MaxPlayers} />
            <SetupItem label="Grid Size" value={session.setup.GridSize} />
            <SetupItem
              label="Practice Length"
              value={`${session.setup.PracticeLength} min`}
            />
            <SetupItem
              label="Qualify Length"
              value={`${session.setup.QualifyLength} min`}
            />
            <SetupItem label="Damage Type" value={session.setup.DamageType} />
            <SetupItem label="Tire Wear" value={session.setup.TireWearType} />
            <SetupItem label="Fuel Usage" value={session.setup.FuelUsageType} />
            <SetupItem label="Penalties" value={session.setup.PenaltiesType} />
          </div>
        </section>
      </div>
    </Dialog>
  );
};

interface SetupItemProps {
  label: string;
  value: string | number;
}

const SetupItem = ({ label, value }: SetupItemProps) => (
  <div className="session-details__setup-item">
    <span className="session-details__label">{label}</span>
    <span className="session-details__value">{value}</span>
  </div>
);

export const SessionsTab = ({ parser }: SessionsTabProps) => {
  const [selectedSession, setSelectedSession] = useState<SessionRowData | null>(
    null
  );
  const [detailsVisible, setDetailsVisible] = useState<boolean>(false);

  const sessions = useMemo<SessionRowData[]>(() => {
    return parser.getRecentSessions(100).map((session) => ({
      ...session,
      participants: parser.getSessionParticipants(session),
      startDate: new Date(session.start_time * 1000),
      endDate: new Date(session.end_time * 1000),
      duration: session.end_time - session.start_time,
      stageList: Object.keys(session.stages),
    }));
  }, [parser]);

  const showDetails = (session: SessionRowData): void => {
    setSelectedSession(session);
    setDetailsVisible(true);
  };

  const hideDetails = (): void => {
    setDetailsVisible(false);
  };

  const indexBodyTemplate = (rowData: SessionRowData): ReactNode => (
    <span className="sessions-tab__index">#{rowData.index}</span>
  );

  const dateBodyTemplate = (rowData: SessionRowData): ReactNode => (
    <div className="sessions-tab__date">
      <span>{rowData.startDate.toLocaleDateString()}</span>
      <span className="sessions-tab__time">
        {rowData.startDate.toLocaleTimeString()}
      </span>
    </div>
  );

  const durationBodyTemplate = (rowData: SessionRowData): ReactNode => (
    <span>{formatDurationSeconds(rowData.duration)}</span>
  );

  const statusBodyTemplate = (rowData: SessionRowData): ReactNode => (
    <Tag
      value={rowData.finished ? 'Completed' : 'Incomplete'}
      severity={rowData.finished ? 'success' : 'warning'}
      icon={rowData.finished ? 'pi pi-check' : 'pi pi-clock'}
    />
  );

  const participantsBodyTemplate = (rowData: SessionRowData): ReactNode => (
    <div className="sessions-tab__participants">
      <i className="pi pi-users" />
      <span>{rowData.participants.length}</span>
    </div>
  );

  const stagesBodyTemplate = (rowData: SessionRowData): ReactNode => (
    <div className="sessions-tab__stages">
      {rowData.stageList.map((stage) => (
        <Chip key={stage} label={formatStageName(stage)} className="sessions-tab__stage-chip" />
      ))}
    </div>
  );

  const actionsBodyTemplate = (rowData: SessionRowData): ReactNode => (
    <Button
      icon="pi pi-eye"
      rounded
      text
      severity="info"
      onClick={() => showDetails(rowData)}
      tooltip="View Details"
      tooltipOptions={{ position: 'left' }}
    />
  );

  return (
    <>
      <Card className="sessions-tab">
        <DataTable
          value={sessions}
          paginator
          rows={10}
          rowsPerPageOptions={[10, 25, 50]}
          stripedRows
          emptyMessage="No sessions found."
          sortField="startDate"
          sortOrder={-1}
        >
          <Column
            field="index"
            header="Session"
            body={indexBodyTemplate}
            sortable
            className="sessions-tab__index-col"
          />
          <Column
            field="startDate"
            header="Date"
            body={dateBodyTemplate}
            sortable
            className="sessions-tab__date-col"
          />
          <Column
            field="duration"
            header="Duration"
            body={durationBodyTemplate}
            sortable
            className="sessions-tab__duration-col"
          />
          <Column
            field="finished"
            header="Status"
            body={statusBodyTemplate}
            sortable
            className="sessions-tab__status-col"
          />
          <Column
            header="Participants"
            body={participantsBodyTemplate}
            className="sessions-tab__participants-col"
          />
          <Column header="Stages" body={stagesBodyTemplate} />
          <Column body={actionsBodyTemplate} className="sessions-tab__actions-col" />
        </DataTable>
      </Card>

      <SessionDetailsDialog
        session={selectedSession}
        visible={detailsVisible}
        onHide={hideDetails}
      />
    </>
  );
};