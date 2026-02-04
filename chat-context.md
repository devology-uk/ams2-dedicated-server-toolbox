## Context Summary for New Chat

---

### Project Overview

I'm building a desktop app using **Electron + React + TypeScript + Vite** for managing Automobilista 2 (AMS2) Dedicated Servers. The app uses **PrimeReact** and **PrimeIcons** for UI components.

The app has two main features:
1. **API Explorer** - Browse the HTTP API of an AMS2 dedicated server (complete)
2. **Configuration Builder** - Import/export and edit `server.cfg` files with a dynamic form UI (in progress)

---

### Key Technical Details

- **Module System**: Uses `verbatimModuleSyntax` - requires explicit `import type` for type-only imports
- **Bundler**: Vite (requires explicit file paths for imports, e.g., `../types/config-builder.types` not `../types`)
- **State Management**: Electron-store for persistence, IPC for main/renderer communication
- **Data Caching**: API data is cached per-connection in `apiCache[connectionId].lists[path]`

---

### Project Structure

```
src/
├── app/                          # Electron main process
│   ├── main.ts
│   ├── preload.cts
│   ├── store.ts                  # electron-store schema
│   └── ams2api.ts                # API service
├── ui/                           # React renderer
│   ├── features/
│   │   └── config-builder/
│   │       ├── components/
│   │       │   ├── fields/       # TextField, NumberField, SliderField, etc.
│   │       │   ├── FieldRenderer.tsx
│   │       │   ├── DynamicForm.tsx
│   │       │   ├── ServerSettingsForm.tsx
│   │       │   └── AccessControlForm.tsx
│   │       ├── hooks/
│   │       │   ├── useServerCache.ts
│   │       │   ├── useConfigState.ts
│   │       │   └── useFieldSchema.ts
│   │       ├── utils/
│   │       │   ├── hocon-parser.ts
│   │       │   ├── schema-processor.ts
│   │       │   └── flags-helper.ts
│   │       └── types/
│   │           └── config-builder.types.ts
│   ├── components/
│   ├── views/
│   │   └── ConfigBuilderView.tsx
│   └── types/
│       └── electron.d.ts
```

---

### Config Builder Architecture

The config builder dynamically generates forms based on API schema data:

1. **Schema Source**: `/api/list/attributes/session` returns attribute definitions with name, type, access, description
2. **Schema Processor** (`schema-processor.ts`): Parses descriptions to detect:
   - Enum references (e.g., `/api/list/enums/damage`)
   - Flag references (e.g., `/api/list/flags/session`)
   - Range constraints (e.g., "range 0-100")
   - Boolean patterns (e.g., "(0) disabled (1) enabled")
3. **Field Types**: text, number, slider, switch, dropdown, flags, track, vehicle, vehicleClass, weather, readonly
4. **Field Components**: Each type has a PrimeReact-based component
5. **FieldRenderer**: Routes to correct component based on `fieldType`
6. **DynamicForm**: Renders grouped fields in collapsible panels

---

### server.cfg Format

Uses HOCON-like syntax (not JSON):
```hocon
name : "My Server"
maxPlayerCount : 20
secure : true

sessionAttributes : {
    "TrackId" : 1910889511,
    "GridSize" : 20,
    "Flags" : 553910394
}
```

---

### API Data Shapes

**Enums** (`/api/list/enums/damage`):
```json
{ "value": 0, "name": "OFF" }
```

**Flags** (`/api/list/flags/session`) - bitfield values:
```json
{ "value": 2, "name": "FORCE_IDENTICAL_VEHICLES" }
```

**Tracks** (`/api/list/tracks`):
```json
{ "id": 1910889511, "name": "CadwellPark", "gridsize": 26, "default_day": 5, "default_month": 6, "default_year": 2020 }
```

**Vehicles** (`/api/list/vehicles`):
```json
{ "id": 1330326301, "name": "MINI Cooper S 1965", "class": "TC60S2" }
```

**Vehicle Classes** (`/api/list/vehicle_classes`):
```json
{ "value": 1101044510, "name": "GT3_Gen2", "translated_name": "GT3 Gen2" }
```

---

### IPC API (window.electron)

```typescript
window.electron.cache.get(connectionId)        // Returns ServerCache | null
window.electron.cache.set(connectionId, data)
window.electron.importConfig()                  // File dialog, returns { success, data, filename }
window.electron.exportConfig(data: string)      // Save dialog
window.electron.getActiveConnection()           // Returns ServerConnection | null
```

---

### Current State

**Completed:**
- ✅ All field components (TextField, NumberField, SliderField, SwitchField, DropdownField, FlagsField, TrackSelector, VehicleSelector, VehicleClassSelector, WeatherSelector)
- ✅ FieldRenderer and DynamicForm
- ✅ ConfigBuilderView with tabs
- ✅ Session Attributes tab (dynamic form)
- ✅ Server Settings tab (ServerSettingsForm)
- ✅ Access Control tab (AccessControlForm with Users/Groups CRUD)
- ✅ Import/Export functionality
- ✅ HOCON parser and serializer

**TODO:**
- Access Levels editor (key-value mapping)
- Access Filters editor (complex nested rules)
- Validation rules for mutual exclusivity:
  - `FORCE_IDENTICAL_VEHICLES`, `FORCE_SAME_VEHICLE_CLASS`, `FORCE_MULTI_VEHICLE_CLASS` are mutually exclusive
  - `MaxPlayers` ≤ `GridSize` ≤ track's `gridsize`
  - `ServerControlsVehicle=1` should combine with `FORCE_IDENTICAL_VEHICLE` flag
- Lua addons array editor
- Styling refinements

---

### Known Boolean Fields

These `int8` fields should render as switches (0/1):
```typescript
const KNOWN_BOOLEAN_FIELDS = new Set([
  'ServerControlsSetup',
  'ServerControlsTrack',
  'ServerControlsVehicleClass',
  'ServerControlsVehicle',
  'AutoAdvanceSession',
  'PracticeWeatherProgression',
  'QualifyWeatherProgression',
  'RaceWeatherProgression',
]);
```

---

### Import Pattern Note

Due to Vite resolution, use explicit paths:
```typescript
// ✅ Correct
import type { FieldMetadata } from '../../types/config-builder.types';
import type { Track } from '../../../../types/electron';

// ❌ Won't work
import type { FieldMetadata } from '../../types';
```

---