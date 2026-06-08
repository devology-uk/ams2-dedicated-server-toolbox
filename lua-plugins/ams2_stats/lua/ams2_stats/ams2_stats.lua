--[[
  AMS2 Dedicated Server - Enhanced Stats Plugin (ams2-stats)

  Improvements over sms_stats:
    - Sector times (S1/S2/S3) on every lap and in the results summary
    - Every driver that started is included in results, not just finishers
    - Full lap history per driver with valid/invalid flag

  Install:
    <server>/lua/ams2-stats/ams2-stats.lua
    <server>/lua/ams2-stats/config.json   (minimal content: {})

  Output:
    lua_config/ams2-stats/data.json  (via SavePersistentData)

  Session identification for external apps:
    Each session record has a `uid` field (YYYYMMDD_HHMMSS of session start).
    Sessions are stored newest-last in data.sessions[].
    data.meta.last_updated changes whenever a session is finalised.
--]]

local addon_storage = ...
---@diagnostic disable: undefined-global
-- (session, SavePersistentData, RegisterCallback, EnableCallback, Callback are server globals)

-- ─── Config ──────────────────────────────────────────────────────────────────

local config       = addon_storage.config
local MAX_SESSIONS = type(config.max_sessions) == "number" and config.max_sessions or 20

-- ─── Persistent storage ───────────────────────────────────────────────────────

local data = addon_storage.data
if type(data.sessions) ~= "table" then data.sessions = {} end
if type(data.meta)     ~= "table" then data.meta     = {} end

-- ─── Module-level state ───────────────────────────────────────────────────────

-- Known members survive stage changes within one server session.
-- Keyed by refid → { name }
local known_members = {}

-- Participant-id → refid mapping; also survives stage changes.
local pid_to_refid = {}

-- In-progress session record (nil between sessions).
local cur = nil

-- Stage name received from SessionManagerStateChanged before the first event
-- fires and creates the session record.  Cleared once consumed.
local pending_stage = nil

-- Telemetry attribute names we do not want to capture on participant change.
local SKIP_ATTRS = {
  Speed=true, Orientation=true, RPM=true,
  PositionX=true, PositionY=true, PositionZ=true, Ping=true,
}

-- ─── Helpers ─────────────────────────────────────────────────────────────────

local function save()
  SavePersistentData()
end

local function uid_now()
  return os.date("%Y%m%d_%H%M%S")
end

-- Read a safe snapshot of the session attribute table.
-- session.attributes is a server proxy — access by known key only.
local function snapshot_session_attrs()
  if not (session and session.attributes) then return {} end
  local keys = {
    "TrackVariation", "TrackLocation", "TrackId",
    "Stage", "SessionType",
    "MaxPlayers", "GridSize", "ServerName",
    "DamageType", "TireWear", "FuelUsage",
    "RaceWeatherSlots", "WeatherSlots",
    "AllowedViews", "Privacy",
  }
  local out = {}
  for _, k in ipairs(keys) do
    local v = session.attributes[k]
    if v ~= nil then out[k] = v end
  end
  return out
end

-- Attempt to read car/team from a participant proxy object.
-- Returns car, team (either may be nil).
local function read_participant_car_team(p)
  if not p then return nil, nil end
  -- Try the common attribute names used by the AMS2 server API.
  -- These may or may not be populated depending on server version.
  local car  = p.CarName  or p.carname  or p.car
  local team = p.TeamName or p.teamname or p.team
  -- Also try the attributes sub-table if it exists.
  if (not car or not team) and p.attributes then
    car  = car  or p.attributes.CarName  or p.attributes.carname
    team = team or p.attributes.TeamName or p.attributes.teamname
  end
  return car, team
end

-- ─── Session lifecycle ────────────────────────────────────────────────────────

local function new_session(stage, duration_mins)
  cur = {
    uid          = uid_now(),
    stage        = stage,
    duration_mins = duration_mins,
    started_at   = os.date("%Y-%m-%dT%H:%M:%S"),
    attrs        = snapshot_session_attrs(),
    -- drivers keyed by refid; converted to sorted array on finalise.
    drivers      = {},
    -- results array built from Results events + DNF inference.
    results      = {},
  }
end

local function get_or_create_driver(refid)
  if not cur.drivers[refid] then
    local name = known_members[refid] and known_members[refid].name or nil
    cur.drivers[refid] = {
      refid          = refid,
      name           = name,
      car            = nil,
      team           = nil,
      laps           = {},
      best_lap       = nil,   -- { lap, time, s1, s2, s3 }
      best_s1        = nil,
      best_s2        = nil,
      best_s3        = nil,
      started        = false,
      state          = nil,   -- "Finished" | "DNF" | nil
      final_position = nil,
      has_result     = false, -- true once a Results event has been processed
    }
  end
  return cur.drivers[refid]
end

local function finalise_session()
  if not cur then return end

  cur.finished_at = os.date("%Y-%m-%dT%H:%M:%S")

  -- Add any driver that started but has no Results event (i.e. a DNF).
  for refid, d in pairs(cur.drivers) do
    if d.started and not d.has_result then
      d.state = d.state or "DNF"
      table.insert(cur.results, {
        position      = nil,
        refid         = refid,
        name          = d.name,
        car           = d.car,
        team          = d.team,
        best_lap_time = d.best_lap and d.best_lap.time or nil,
        best_s1       = d.best_s1,
        best_s2       = d.best_s2,
        best_s3       = d.best_s3,
        total_time    = nil,
        laps_complete = #d.laps,
        state         = d.state,
      })
    end
  end

  -- Sort results: finishers by position, then DNFs by laps completed desc.
  table.sort(cur.results, function(a, b)
    local pa = a.position or 9999
    local pb = b.position or 9999
    if pa ~= pb then return pa < pb end
    return (a.laps_complete or 0) > (b.laps_complete or 0)
  end)

  -- Convert drivers map to array sorted by final_position.
  local drivers_arr = {}
  for _, d in pairs(cur.drivers) do
    d.has_result = nil  -- internal field, not needed in output
    table.insert(drivers_arr, d)
  end
  table.sort(drivers_arr, function(a, b)
    local pa = a.final_position or 9999
    local pb = b.final_position or 9999
    if pa ~= pb then return pa < pb end
    return (#a.laps) > (#b.laps)
  end)

  local record = {
    uid           = cur.uid,
    stage         = cur.stage,
    duration_mins = cur.duration_mins,
    started_at    = cur.started_at,
    finished_at   = cur.finished_at,
    attrs         = cur.attrs,
    drivers       = drivers_arr,
    results       = cur.results,
  }

  table.insert(data.sessions, record)
  while #data.sessions > MAX_SESSIONS do
    table.remove(data.sessions, 1)
  end

  data.meta.last_updated = os.date("%Y-%m-%dT%H:%M:%S")
  cur = nil
  save()
end

-- ─── Main callback ────────────────────────────────────────────────────────────

local function addon_callback(cb, ...)

  -- ── Session manager state ─────────────────────────────────────────────────
  if cb == Callback.SessionManagerStateChanged then
    local _, new_state = ...
    -- "Idle" means the server session has fully ended.
    if new_state == "Idle" then
      finalise_session()
      -- Reset cross-stage state; server session is over.
      known_members  = {}
      pid_to_refid   = {}
      pending_stage  = nil
    else
      -- The server is entering a new stage (e.g. "Practice1", "Race1").
      -- Record this so the next new_session() call can name the stage correctly,
      -- covering the case where no StageChanged event precedes the first event.
      if cur then
        if not cur.stage then cur.stage = new_state end
      else
        pending_stage = new_state
      end
    end
    return
  end

  -- Ensure we have an active session record for all other events.
  if not cur then new_session(pending_stage, nil); pending_stage = nil end

  -- ── Session attributes ────────────────────────────────────────────────────
  if cb == Callback.SessionAttributesChanged then
    cur.attrs = snapshot_session_attrs()
    return
  end

  -- ── Member joined ─────────────────────────────────────────────────────────
  if cb == Callback.MemberJoined then
    local refid = ...
    if session and session.members and session.members[refid] then
      local m    = session.members[refid]
      local name = m.name or m.Name or tostring(refid)
      known_members[refid] = { name = name }
      -- Back-fill name into any existing driver record for this session.
      if cur.drivers[refid] then
        cur.drivers[refid].name = cur.drivers[refid].name or name
      end
    end
    save()
    return
  end

  -- ── Member left ───────────────────────────────────────────────────────────
  -- Both MemberLeft callback and EventLogged:PlayerLeft fire together.
  -- We handle it here; EventLogged:PlayerLeft is ignored below.
  if cb == Callback.MemberLeft then
    local refid = ...
    local d = cur.drivers[refid]
    -- Only mark DNF if they actually started and haven't finished.
    if d and d.started and not d.state then
      d.state = "DNF"
    end
    return
  end

  -- ── Participant attributes changed ────────────────────────────────────────
  if cb == Callback.ParticipantAttributesChanged then
    local pid, names = ...
    if not (session and session.participants and session.participants[pid]) then return end
    local p = session.participants[pid]
    -- p.refid links the participant to a member.
    local refid = p.refid
    if not refid then return end
    pid_to_refid[pid] = refid
    -- Only process non-telemetry attribute changes.
    local has_interesting = false
    if type(names) == "table" then
      for _, aname in ipairs(names) do
        if not SKIP_ATTRS[aname] then has_interesting = true; break end
      end
    end
    if not has_interesting then return end
    local d     = get_or_create_driver(refid)
    local car, team = read_participant_car_team(p)
    if car  then d.car  = car  end
    if team then d.team = team end
    return
  end

  -- ── EventLogged ───────────────────────────────────────────────────────────
  if cb == Callback.EventLogged then
    local event = ...
    if not event then return end
    local ename = event.name
    local attrs = event.attributes or {}

    -- ── StageChanged — primary session boundary ───────────────────────────
    if ename == "StageChanged" then
      -- The previous stage just ended.  Finalise it.
      -- Give the current record the stage name we now know it was.
      if cur and not cur.stage then
        cur.stage = attrs.PreviousStage
      end
      finalise_session()
      -- Begin a fresh record for the new stage.
      new_session(attrs.NewStage, attrs.Length)
      -- Re-snapshot attrs now the new stage is live.
      cur.attrs = snapshot_session_attrs()
      save()
      return
    end

    -- ── SessionDestroyed — server session ended without StageChanged ──────
    if ename == "SessionDestroyed" then
      finalise_session()
      return
    end

    -- ── Participant state change (Finished / Retired etc.) ────────────────
    if ename == "State" and event.type == "Participant" then
      local refid = event.refid
      if refid then
        local d = get_or_create_driver(refid)
        -- Only update state if not already set by Results.
        if not d.has_result then
          d.state = attrs.NewState
        end
      end
      return
    end

    -- ── Lap ───────────────────────────────────────────────────────────────
    if ename == "Lap" then
      local refid = event.refid
      local pid   = event.participantid
      if not refid then return end
      if pid then pid_to_refid[pid] = refid end

      local d = get_or_create_driver(refid)
      d.started = true

      -- Opportunistic car/team capture from participant proxy.
      if not d.car and pid then
        local p = session and session.participants and session.participants[pid]
        if p then
          local car, team = read_participant_car_team(p)
          if car  then d.car  = car  end
          if team then d.team = team end
        end
      end

      local lap_n = attrs.Lap
      local lt    = attrs.LapTime
      local s1    = attrs.Sector1Time
      local s2    = attrs.Sector2Time
      local s3    = attrs.Sector3Time
      local valid = (attrs.CountThisLapTimes == 1)

      table.insert(d.laps, {
        lap      = lap_n,
        time     = lt,
        s1       = s1,
        s2       = s2,
        s3       = s3,
        valid    = valid,
        position = attrs.RacePosition,
      })

      -- Update best lap and best individual sector times (valid laps only).
      if valid and lt then
        if not d.best_lap or lt < d.best_lap.time then
          d.best_lap = { lap = lap_n, time = lt, s1 = s1, s2 = s2, s3 = s3 }
        end
        if s1 and (not d.best_s1 or s1 < d.best_s1) then d.best_s1 = s1 end
        if s2 and (not d.best_s2 or s2 < d.best_s2) then d.best_s2 = s2 end
        if s3 and (not d.best_s3 or s3 < d.best_s3) then d.best_s3 = s3 end
      end

      save()
      return
    end

    -- ── Results — end-of-session result per finisher ──────────────────────
    if ename == "Results" then
      local refid = event.refid
      local pid   = event.participantid
      if not refid then return end
      if pid then pid_to_refid[pid] = refid end

      local d = get_or_create_driver(refid)
      d.has_result     = true
      d.state          = attrs.State or "Finished"
      d.final_position = attrs.RacePosition

      -- Fall back to Results FastestLapTime if we have no Lap events.
      if not d.best_lap and attrs.FastestLapTime then
        d.best_lap = { lap = nil, time = attrs.FastestLapTime }
      end

      table.insert(cur.results, {
        position      = attrs.RacePosition,
        refid         = refid,
        name          = d.name,
        car           = d.car,
        team          = d.team,
        best_lap_time = d.best_lap and d.best_lap.time or nil,
        best_s1       = d.best_s1,
        best_s2       = d.best_s2,
        best_s3       = d.best_s3,
        total_time    = attrs.TotalTime,
        laps_complete = attrs.Lap,
        state         = attrs.State,
      })

      save()
      return
    end

    -- All other events (PlayerLeft, StateChanged, etc.) are not needed.
    return
  end
end

-- ─── Startup ─────────────────────────────────────────────────────────────────

data.meta.plugin_version = "1.0"
new_session(nil, nil)
save()

RegisterCallback(addon_callback)
EnableCallback(Callback.SessionManagerStateChanged)
EnableCallback(Callback.SessionAttributesChanged)
EnableCallback(Callback.MemberJoined)
EnableCallback(Callback.MemberLeft)
EnableCallback(Callback.ParticipantAttributesChanged)
EnableCallback(Callback.EventLogged)

--[[
  Required alongside this file:  config.json
  Minimal content: {}

  Optional config keys:
    max_sessions  (number)  Max completed session records to keep (default 20)

  To install:
    <server>/lua/ams2-stats/ams2-stats.lua
    <server>/lua/ams2-stats/config.json
--]]
