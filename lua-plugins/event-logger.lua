--[[
  AMS2 Dedicated Server - Event Logger Plugin
  Purpose: Log all callback data to discover the exact shape of events,
           particularly whether Lap events expose sector times.

  Install: Place in <server>/lua/event-logger/ as event-logger.lua
           (alongside a minimal config.json — see bottom of file).
           The server loads plugins from subdirectories of lua/.

  Output:  Writes ams2-event-log-<timestamp>.txt to the server working directory.
           One file is opened at startup; a new one opens after each session unloads.
--]]

local _ = ...  -- addon_storage: not used by this logger, but must be consumed

-- ─── File handling ───────────────────────────────────────────────────────────
local logFile = nil

local function openLog()
  local path = "ams2-event-log-" .. os.date("%Y%m%d-%H%M%S") .. ".txt"
  logFile = io.open(path, "w")
  if logFile then
    logFile:write("=== AMS2 Event Logger started " .. os.date("%Y-%m-%d %H:%M:%S") .. " ===\n\n")
    logFile:flush()
  end
end

local function log(msg)
  if logFile then
    logFile:write(msg .. "\n")
    logFile:flush()
  end
end

-- ─── Serialiser ──────────────────────────────────────────────────────────────
local function ser(val, indent, seen)
  indent = indent or 0
  seen   = seen   or {}
  local pad = string.rep("  ", indent)
  local t = type(val)

  if t == "nil"     then return "nil"
  elseif t == "boolean" or t == "number" then return tostring(val)
  elseif t == "string"  then return string.format("%q", val)
  elseif t == "table"   then
    if seen[val] then return "<circular>" end
    seen[val] = true
    local parts = {}
    for i, v in ipairs(val) do
      parts[#parts+1] = pad .. "  [" .. i .. "] = " .. ser(v, indent+1, seen)
    end
    for k, v in pairs(val) do
      if type(k) ~= "number" then
        parts[#parts+1] = pad .. "  [" .. tostring(k) .. "] = " .. ser(v, indent+1, seen)
      end
    end
    seen[val] = nil
    if #parts == 0 then return "{}" end
    return "{\n" .. table.concat(parts, ",\n") .. "\n" .. pad .. "}"
  else
    return "<" .. t .. ">"
  end
end

-- ─── Main callback ───────────────────────────────────────────────────────────
local function addon_callback(callback, ...)
  local ts = os.date("%H:%M:%S")

  -- ── Tick: silent ──────────────────────────────────────────────────────────
  if callback == Callback.Tick then
    return
  end

  -- ── Server / session state ────────────────────────────────────────────────
  if callback == Callback.ServerStateChanged then
    local old, new = ...
    log("[" .. ts .. "] ServerStateChanged: " .. tostring(old) .. " -> " .. tostring(new))
    return
  end

  if callback == Callback.SessionManagerStateChanged then
    local old, new = ...
    log("[" .. ts .. "] SessionManagerStateChanged: " .. tostring(old) .. " -> " .. tostring(new))
    return
  end

  if callback == Callback.SessionAttributesChanged then
    local names = ...
    log("[" .. ts .. "] SessionAttributesChanged: " .. ser(names))
    -- Log the values that changed
    if type(names) == "table" and session and session.attributes then
      for _, name in ipairs(names) do
        log("    " .. name .. " = " .. ser(session.attributes[name]))
      end
    end
    return
  end

  -- ── Members ───────────────────────────────────────────────────────────────
  if callback == Callback.MemberJoined then
    local refid = ...
    local member = session and session.members and session.members[refid]
    log("[" .. ts .. "] MemberJoined refid=" .. tostring(refid))
    if member then
      log("  member = " .. ser(member, 1))
    end
    return
  end

  if callback == Callback.MemberLeft then
    local refid = ...
    log("[" .. ts .. "] MemberLeft refid=" .. tostring(refid))
    return
  end

  if callback == Callback.MemberAttributesChanged then
    local refid, names = ...
    log("[" .. ts .. "] MemberAttributesChanged refid=" .. tostring(refid) .. " names=" .. ser(names))
    return
  end

  -- ── Participants ──────────────────────────────────────────────────────────
  if callback == Callback.ParticipantAttributesChanged then
    local pid, names = ...
    log("[" .. ts .. "] ParticipantAttributesChanged pid=" .. tostring(pid) .. " names=" .. ser(names))
    return
  end

  -- ── Events (the interesting one) ──────────────────────────────────────────
  if callback == Callback.EventLogged then
    local event = ...
    local name = event and event.name or "?"
    local etype = event and event.type or "?"

    -- Always log the full event — this is what we're here to discover
    log("[" .. ts .. "] EventLogged type=" .. tostring(etype) .. " name=" .. tostring(name))
    if event then
      log("  event = " .. ser(event, 1))
    end

    -- For Lap events, also dump the full participant state
    if name == "Lap" and event.participantid and session and session.participants then
      local pid = event.participantid
      local participant = session.participants[pid]
      if participant then
        log("  participant[" .. tostring(pid) .. "] = " .. ser(participant, 1))
      end
    end

    -- For Results events, dump participant state too
    if name == "Results" and event.participantid and session and session.participants then
      local pid = event.participantid
      local participant = session.participants[pid]
      if participant then
        log("  participant[" .. tostring(pid) .. "] = " .. ser(participant, 1))
      end
    end

    return
  end

  -- ── Catch-all for any callback not explicitly handled ─────────────────────
  local args = { ... }
  log("[" .. ts .. "] UNKNOWN callback=" .. tostring(callback) .. " args=" .. ser(args, 1))
end

-- ─── Startup ─────────────────────────────────────────────────────────────────
openLog()
log("Plugin loaded. Registering callbacks...\n")

RegisterCallback(addon_callback)
EnableCallback(Callback.Tick)
EnableCallback(Callback.ServerStateChanged)
EnableCallback(Callback.SessionManagerStateChanged)
EnableCallback(Callback.SessionAttributesChanged)
EnableCallback(Callback.MemberAttributesChanged)
EnableCallback(Callback.MemberJoined)
EnableCallback(Callback.MemberLeft)
EnableCallback(Callback.ParticipantAttributesChanged)
EnableCallback(Callback.EventLogged)

log("All callbacks registered. Waiting for events...\n")

--[[
  Required alongside this file: config.json
  Minimal content: {}

  To install:
    <server>/lua/event-logger/event-logger.lua
    <server>/lua/event-logger/config.json
--]]
