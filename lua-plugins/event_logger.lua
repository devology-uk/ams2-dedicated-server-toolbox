--[[
  AMS2 Dedicated Server - Event Logger Plugin
  Purpose: Capture all callback data to discover the exact shape of events,
           particularly whether Lap events expose sector times.

  Install: Place in <server>/lua/event-logger/ alongside config.json.

  Output:  Events are stored in addon_storage.data and flushed to
           lua_config/event-logger/data.json via SavePersistentData().
           Configure max_events in config.json (default 500).
--]]

local addon_storage = ...

---@diagnostic disable: undefined-global
-- (session, SavePersistentData, RegisterCallback, EnableCallback, Callback are server-injected globals)

-- ─── Config ──────────────────────────────────────────────────────────────────
local config = addon_storage.config
local MAX_EVENTS = type(config.max_events) == "number" and config.max_events or 500

-- ─── Persistent data ─────────────────────────────────────────────────────────
local data = addon_storage.data
if type(data.events) ~= "table" then data.events = {} end
if type(data.meta)   ~= "table" then data.meta   = {} end

data.meta.last_start = os.date("%Y-%m-%d %H:%M:%S")

-- ─── Helpers ─────────────────────────────────────────────────────────────────
local function deepcopy(val, seen)
  if type(val) ~= "table" then return val end
  seen = seen or {}
  if seen[val] then return {} end
  seen[val] = true
  local copy = {}
  for k, v in pairs(val) do copy[k] = deepcopy(v, seen) end
  return copy
end

local function record(entry)
  entry.time = os.date("%Y-%m-%d %H:%M:%S")
  table.insert(data.events, entry)
  while #data.events > MAX_EVENTS do
    table.remove(data.events, 1)
  end
end

local function save()
  SavePersistentData()
end

-- ─── Main callback ───────────────────────────────────────────────────────────
local function addon_callback(callback, ...)

  -- ── Server / session state ────────────────────────────────────────────────
  if callback == Callback.ServerStateChanged then
    local old, new = ...
    record({ cb = "ServerStateChanged", old = old, new = new })
    save()
    return
  end

  if callback == Callback.SessionManagerStateChanged then
    local old, new = ...
    record({ cb = "SessionManagerStateChanged", old = old, new = new })
    save()
    return
  end

  if callback == Callback.SessionAttributesChanged then
    local names = ...
    local entry = { cb = "SessionAttributesChanged", names = deepcopy(names), values = {} }
    if type(names) == "table" and session and session.attributes then
      for _, name in ipairs(names) do
        entry.values[name] = deepcopy(session.attributes[name])
      end
    end
    record(entry)
    return
  end

  -- ── Members ───────────────────────────────────────────────────────────────
  if callback == Callback.MemberJoined then
    local refid = ...
    local entry = { cb = "MemberJoined", refid = refid }
    if session and session.members and session.members[refid] then
      entry.member = deepcopy(session.members[refid])
    end
    record(entry)
    save()
    return
  end

  if callback == Callback.MemberLeft then
    local refid = ...
    record({ cb = "MemberLeft", refid = refid })
    return
  end

  if callback == Callback.MemberAttributesChanged then
    local refid, names = ...
    record({ cb = "MemberAttributesChanged", refid = refid, names = deepcopy(names) })
    return
  end

  -- ── Participants ──────────────────────────────────────────────────────────
  if callback == Callback.ParticipantAttributesChanged then
    local pid, names = ...
    record({ cb = "ParticipantAttributesChanged", pid = pid, names = deepcopy(names) })
    return
  end

  -- ── Events ────────────────────────────────────────────────────────────────
  if callback == Callback.EventLogged then
    local event = ...
    local name  = event and event.name or "?"
    local entry = { cb = "EventLogged", name = name, event = deepcopy(event) }

    -- For Lap and Results events also capture the full participant state at
    -- the moment the event fires — this is what exposes sector times etc.
    if (name == "Lap" or name == "Results")
        and event and event.participantid
        and session and session.participants then
      entry.participant = deepcopy(session.participants[event.participantid])
    end

    record(entry)
    if name == "Lap" or name == "Results" then save() end
    return
  end

  -- ── Catch-all ─────────────────────────────────────────────────────────────
  local args = { ... }
  record({ cb = "UNKNOWN", callback = tostring(callback), args = deepcopy(args) })
  save()
end

-- ─── Startup ─────────────────────────────────────────────────────────────────
record({ cb = "STARTUP", msg = "Plugin loaded" })
save()

RegisterCallback(addon_callback)
EnableCallback(Callback.ServerStateChanged)
EnableCallback(Callback.SessionManagerStateChanged)
EnableCallback(Callback.SessionAttributesChanged)
EnableCallback(Callback.MemberAttributesChanged)
EnableCallback(Callback.MemberJoined)
EnableCallback(Callback.MemberLeft)
EnableCallback(Callback.ParticipantAttributesChanged)
EnableCallback(Callback.EventLogged)

--[[
  Required alongside this file: config.json
  Minimal content: {}

  Optional config keys:
    max_events  (number)  Max entries to keep in data.events (default 500)

  To install:
    <server>/lua/event-logger/event-logger.lua
    <server>/lua/event-logger/config.json
--]]
