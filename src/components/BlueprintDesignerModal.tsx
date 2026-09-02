import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  PenTool,
  Square,
  DoorOpen,
  Maximize2,
  Trash2,
  Undo2,
  Redo2,
  Grid,
  Sparkles,
  Download,
  CheckCircle2,
  Layers,
  Move,
  X,
  Plus,
  Compass,
  Palette,
  Eye,
  Info,
  Sliders,
  Ruler,
  FileCode,
  FolderOpen,
  FileSpreadsheet,
  MousePointer2,
  Hand,
  RotateCcw,
  HelpCircle,
  Maximize,
  ZoomIn,
  ZoomOut,
  ChevronRight,
  Settings2,
  LayoutGrid,
  ListTree,
  Building,
  ShieldAlert,
  ArrowRightLeft,
  Columns,
  Tag,
} from 'lucide-react';
import {
  Wall,
  WallType,
  DesignerDoor,
  DesignerWindow,
  DesignerRoomLabel,
  DesignerDimension,
  DesignerColumn,
  DesignerPlanState,
  Opening,
} from '../types';
import { DESIGNER_PRESETS, generateBlueprintDataUrl } from '../utils/blueprintDesignerPresets';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyBlueprint: (
    blueprintDataUrl: string,
    blueprintName: string,
    walls: Wall[],
    floorArea: number
  ) => void;
  existingWalls?: Wall[];
  chbAreaSqM?: number;
  wastePercentage?: number;
}

type DrawTool =
  | 'select'
  | 'wall'
  | 'room'
  | 'door'
  | 'window'
  | 'room_label'
  | 'dimension'
  | 'column'
  | 'pan';

type ThemeMode = 'blueprint' | 'darkcad' | 'monochrome';

// 1 canvas unit = 40 pixels per meter in designer coordinate space
const SCALE_PPM = 40;

const ROOM_NAMES = [
  'LIVING AREA',
  'MASTER BEDROOM',
  'BEDROOM 2',
  'BEDROOM 3',
  'KITCHEN',
  'DINING AREA',
  'TOILET & BATH',
  'POWDER ROOM',
  'PORCH / VERANDA',
  'CARPORT / GARAGE',
  'SERVICE / LAUNDRY',
  'BALCONY',
  'HALLWAY',
  'OFFICE / STUDY',
  'STORAGE ROOM',
];

const QUICK_ROOM_TEMPLATES = [
  { name: 'Master Bedroom', widthM: 4.0, heightM: 4.0, area: 16.0, icon: '🛏️', type: 'Exterior Wall' as WallType },
  { name: 'Living Area', widthM: 5.0, heightM: 4.0, area: 20.0, icon: '🛋️', type: 'Exterior Wall' as WallType },
  { name: 'Kitchen', widthM: 3.0, heightM: 3.0, area: 9.0, icon: '🍳', type: 'Interior Wall' as WallType },
  { name: 'Dining Area', widthM: 4.0, heightM: 3.0, area: 12.0, icon: '🍽️', type: 'Interior Wall' as WallType },
  { name: 'Toilet & Bath', widthM: 2.0, heightM: 1.8, area: 3.6, icon: '🚿', type: 'Partition Wall' as WallType },
  { name: 'Carport / Garage', widthM: 5.0, heightM: 3.0, area: 15.0, icon: '🚗', type: 'Exterior Wall' as WallType },
  { name: 'Front Porch', widthM: 3.0, heightM: 1.5, area: 4.5, icon: '🌿', type: 'Exterior Wall' as WallType },
  { name: 'Service / Laundry', widthM: 2.5, heightM: 2.0, area: 5.0, icon: '🧺', type: 'Partition Wall' as WallType },
];

const DOOR_PRESETS = [
  { label: 'Main Entrance Door', width: 0.9, height: 2.1, code: 'D-1' },
  { label: 'Bedroom Single Door', width: 0.8, height: 2.1, code: 'D-2' },
  { label: 'T&B Bathroom Door', width: 0.7, height: 2.1, code: 'D-3' },
  { label: 'Double French Door', width: 1.6, height: 2.1, code: 'D-4' },
  { label: 'Sliding Patio Door', width: 1.8, height: 2.1, code: 'D-5' },
  { label: 'Vehicular Gate', width: 3.0, height: 2.0, code: 'GATE' },
];

const WINDOW_PRESETS = [
  { label: 'Standard Window', width: 1.2, height: 1.2, code: 'W-1' },
  { label: 'Wide Living Window', width: 1.5, height: 1.2, code: 'W-2' },
  { label: 'Picture Window', width: 2.0, height: 1.5, code: 'W-3' },
  { label: 'Kitchen Counter Window', width: 1.0, height: 0.9, code: 'W-4' },
  { label: 'Bathroom Awning', width: 0.6, height: 0.6, code: 'W-5' },
];

const WALL_HEIGHT_PRESETS = [2.6, 2.8, 3.0, 3.2, 3.6, 4.0];

interface SelectedElement {
  type: 'wall' | 'door' | 'window' | 'room' | 'column' | 'dimension';
  id: string;
}

export const BlueprintDesignerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onApplyBlueprint,
  existingWalls = [],
  chbAreaSqM = 0.08,
  wastePercentage = 5,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Plan Design State
  const [walls, setWalls] = useState<Wall[]>(() => {
    if (existingWalls && existingWalls.length > 0) {
      return JSON.parse(JSON.stringify(existingWalls));
    }
    return JSON.parse(JSON.stringify(DESIGNER_PRESETS[0].state.walls));
  });

  const [doors, setDoors] = useState<DesignerDoor[]>(() => {
    return JSON.parse(JSON.stringify(DESIGNER_PRESETS[0].state.doors));
  });

  const [windows, setWindows] = useState<DesignerWindow[]>(() => {
    return JSON.parse(JSON.stringify(DESIGNER_PRESETS[0].state.windows));
  });

  const [rooms, setRooms] = useState<DesignerRoomLabel[]>(() => {
    return JSON.parse(JSON.stringify(DESIGNER_PRESETS[0].state.rooms));
  });

  const [dimensions, setDimensions] = useState<DesignerDimension[]>(() => {
    return JSON.parse(JSON.stringify(DESIGNER_PRESETS[0].state.dimensions));
  });

  const [columns, setColumns] = useState<DesignerColumn[]>(() => {
    return JSON.parse(JSON.stringify(DESIGNER_PRESETS[0].state.columns));
  });

  // History for Undo / Redo
  const [history, setHistory] = useState<DesignerPlanState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // UI / Tool Controls
  const [activeTool, setActiveTool] = useState<DrawTool>('wall');
  const [currentWallType, setCurrentWallType] = useState<WallType>('Exterior Wall');
  const [currentWallHeight, setCurrentWallHeight] = useState<number>(3.0);
  const [selectedDoorPreset, setSelectedDoorPreset] = useState(DOOR_PRESETS[0]);
  const [selectedWindowPreset, setSelectedWindowPreset] = useState(WINDOW_PRESETS[0]);
  const [selectedRoomName, setSelectedRoomName] = useState<string>(ROOM_NAMES[0]);
  const [blueprintTheme, setBlueprintTheme] = useState<ThemeMode>('blueprint');
  const [planTitle, setPlanTitle] = useState<string>('Custom Architectural Blueprint');

  // Snapping and constraints
  const [gridSnapMeters, setGridSnapMeters] = useState<number>(0.5); // 0.5m snap
  const [isOrthoLocked, setIsOrthoLocked] = useState<boolean>(true); // 90° angle lock
  const [magneticVertexSnap, setMagneticVertexSnap] = useState<boolean>(true);

  // Canvas Viewport Pan/Zoom
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Interactive Drawing & Selection states
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [snapInfo, setSnapInfo] = useState<{ x: number; y: number; type: 'corner' | 'midpoint' | 'grid' } | null>(null);
  const [hoveredWall, setHoveredWall] = useState<Wall | null>(null);

  // Dragging selected element
  const [isDraggingElement, setIsDraggingElement] = useState<boolean>(false);
  const [dragElementStartPos, setDragElementStartPos] = useState<{ x: number; y: number } | null>(null);

  // Sidebar navigation tabs
  const [sidebarTab, setSidebarTab] = useState<'inspector' | 'templates' | 'schedule'>('inspector');
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  // Sync state to history
  const pushToHistory = useCallback(
    (newState: DesignerPlanState) => {
      const nextHistory = history.slice(0, historyIndex + 1);
      nextHistory.push(newState);
      if (nextHistory.length > 30) nextHistory.shift();
      setHistory(nextHistory);
      setHistoryIndex(nextHistory.length - 1);
    },
    [history, historyIndex]
  );

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setWalls(prev.walls);
      setDoors(prev.doors);
      setWindows(prev.windows);
      setRooms(prev.rooms);
      setDimensions(prev.dimensions);
      setColumns(prev.columns);
      setHistoryIndex(historyIndex - 1);
      setSelectedElement(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setWalls(next.walls);
      setDoors(next.doors);
      setWindows(next.windows);
      setRooms(next.rooms);
      setDimensions(next.dimensions);
      setColumns(next.columns);
      setHistoryIndex(historyIndex + 1);
      setSelectedElement(null);
    }
  };

  // Helper to snap canvas pixel coordinate with magnetic vertex snapping
  const snapToGridAndVertices = useCallback(
    (rawX: number, rawY: number): { x: number; y: number; snapType: 'corner' | 'midpoint' | 'grid' } => {
      // 1. Magnetic vertex snap to wall corners (endpoints)
      if (magneticVertexSnap) {
        const SNAP_RADIUS_PX = 18;
        for (const w of walls) {
          if (w.tracePoints && w.tracePoints.length >= 2) {
            const p1 = w.tracePoints[0];
            const p2 = w.tracePoints[1];

            const d1 = Math.hypot(rawX - p1.x, rawY - p1.y);
            if (d1 < SNAP_RADIUS_PX) {
              return { x: p1.x, y: p1.y, snapType: 'corner' };
            }

            const d2 = Math.hypot(rawX - p2.x, rawY - p2.y);
            if (d2 < SNAP_RADIUS_PX) {
              return { x: p2.x, y: p2.y, snapType: 'corner' };
            }

            // Midpoint snap
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2;
            const dMid = Math.hypot(rawX - midX, rawY - midY);
            if (dMid < SNAP_RADIUS_PX) {
              return { x: midX, y: midY, snapType: 'midpoint' };
            }
          }
        }
      }

      // 2. Standard Grid Snap
      if (gridSnapMeters <= 0) return { x: Math.round(rawX), y: Math.round(rawY), snapType: 'grid' };
      const snapPx = gridSnapMeters * SCALE_PPM;
      return {
        x: Math.round(rawX / snapPx) * snapPx,
        y: Math.round(rawY / snapPx) * snapPx,
        snapType: 'grid',
      };
    },
    [gridSnapMeters, magneticVertexSnap, walls]
  );

  // Helper to apply Ortho (horizontal / vertical constraint)
  const applyOrtho = useCallback(
    (start: { x: number; y: number }, current: { x: number; y: number }) => {
      if (!isOrthoLocked) return current;
      const dx = Math.abs(current.x - start.x);
      const dy = Math.abs(current.y - start.y);
      if (dx >= dy) {
        return { x: current.x, y: start.y };
      } else {
        return { x: start.x, y: current.y };
      }
    },
    [isOrthoLocked]
  );

  // Load a preset template
  const handleLoadPreset = (preset: (typeof DESIGNER_PRESETS)[0]) => {
    setWalls(JSON.parse(JSON.stringify(preset.state.walls)));
    setDoors(JSON.parse(JSON.stringify(preset.state.doors)));
    setWindows(JSON.parse(JSON.stringify(preset.state.windows)));
    setRooms(JSON.parse(JSON.stringify(preset.state.rooms)));
    setDimensions(JSON.parse(JSON.stringify(preset.state.dimensions)));
    setColumns(JSON.parse(JSON.stringify(preset.state.columns)));
    setPlanTitle(preset.name);
    setSelectedElement(null);
    pushToHistory(preset.state);
  };

  // Clear canvas to blank
  const handleClearCanvas = () => {
    if (window.confirm('Clear blueprint canvas and start with a blank architectural grid?')) {
      const blankState: DesignerPlanState = {
        walls: [],
        doors: [],
        windows: [],
        rooms: [],
        dimensions: [],
        columns: [],
      };
      setWalls([]);
      setDoors([]);
      setWindows([]);
      setRooms([]);
      setDimensions([]);
      setColumns([]);
      setSelectedElement(null);
      pushToHistory(blankState);
    }
  };

  // Quick Drop a Room Template into the canvas center
  const handleDropRoomTemplate = (template: typeof QUICK_ROOM_TEMPLATES[0]) => {
    const centerMetersX = 10;
    const centerMetersY = 8;
    const offsetPxX = (Math.random() - 0.5) * 80;
    const offsetPxY = (Math.random() - 0.5) * 80;

    const wPx = template.widthM * SCALE_PPM;
    const hPx = template.heightM * SCALE_PPM;
    const cx = (centerMetersX * SCALE_PPM) + offsetPxX;
    const cy = (centerMetersY * SCALE_PPM) + offsetPxY;

    const x1 = Math.round((cx - wPx / 2) / 20) * 20;
    const x2 = Math.round((cx + wPx / 2) / 20) * 20;
    const y1 = Math.round((cy - hPx / 2) / 20) * 20;
    const y2 = Math.round((cy + hPx / 2) / 20) * 20;

    const startNum = walls.length + 1;
    const roomWalls: Wall[] = [
      {
        id: `W${String(startNum).padStart(2, '0')}`,
        name: `${template.name} North Wall`,
        type: template.type,
        length: template.widthM,
        height: currentWallHeight,
        grossArea: Number((template.widthM * currentWallHeight).toFixed(2)),
        openingArea: 0,
        netArea: Number((template.widthM * currentWallHeight).toFixed(2)),
        baseCHB: Math.ceil((template.widthM * currentWallHeight) / chbAreaSqM),
        tracePoints: [{ x: x1, y: y1 }, { x: x2, y: y1 }],
        openings: [],
      },
      {
        id: `W${String(startNum + 1).padStart(2, '0')}`,
        name: `${template.name} East Wall`,
        type: template.type,
        length: template.heightM,
        height: currentWallHeight,
        grossArea: Number((template.heightM * currentWallHeight).toFixed(2)),
        openingArea: 0,
        netArea: Number((template.heightM * currentWallHeight).toFixed(2)),
        baseCHB: Math.ceil((template.heightM * currentWallHeight) / chbAreaSqM),
        tracePoints: [{ x: x2, y: y1 }, { x: x2, y: y2 }],
        openings: [],
      },
      {
        id: `W${String(startNum + 2).padStart(2, '0')}`,
        name: `${template.name} South Wall`,
        type: template.type,
        length: template.widthM,
        height: currentWallHeight,
        grossArea: Number((template.widthM * currentWallHeight).toFixed(2)),
        openingArea: 0,
        netArea: Number((template.widthM * currentWallHeight).toFixed(2)),
        baseCHB: Math.ceil((template.widthM * currentWallHeight) / chbAreaSqM),
        tracePoints: [{ x: x1, y: y2 }, { x: x2, y: y2 }],
        openings: [],
      },
      {
        id: `W${String(startNum + 3).padStart(2, '0')}`,
        name: `${template.name} West Wall`,
        type: template.type,
        length: template.heightM,
        height: currentWallHeight,
        grossArea: Number((template.heightM * currentWallHeight).toFixed(2)),
        openingArea: 0,
        netArea: Number((template.heightM * currentWallHeight).toFixed(2)),
        baseCHB: Math.ceil((template.heightM * currentWallHeight) / chbAreaSqM),
        tracePoints: [{ x: x1, y: y1 }, { x: x1, y: y2 }],
        openings: [],
      },
    ];

    const newRoom: DesignerRoomLabel = {
      id: `room-${Date.now()}`,
      name: template.name.toUpperCase(),
      x: (x1 + x2) / 2,
      y: (y1 + y2) / 2,
      widthM: template.widthM,
      heightM: template.heightM,
      customArea: template.area,
    };

    const updatedWalls = [...walls, ...roomWalls];
    const updatedRooms = [...rooms, newRoom];
    setWalls(updatedWalls);
    setRooms(updatedRooms);
    pushToHistory({ walls: updatedWalls, doors, windows, rooms: updatedRooms, dimensions, columns });
    setSelectedElement({ type: 'room', id: newRoom.id });
  };

  // Canvas Mouse Coordinates Transformer
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, rawX: 0, rawY: 0, snapType: 'grid' as const };
    const rect = canvas.getBoundingClientRect();
    const rawX = (e.clientX - rect.left - pan.x) / zoom;
    const rawY = (e.clientY - rect.top - pan.y) / zoom;
    const snapped = snapToGridAndVertices(rawX, rawY);
    return {
      x: snapped.x,
      y: snapped.y,
      rawX,
      rawY,
      snapType: snapped.snapType,
    };
  };

  // Find item under cursor for selection
  const findElementAtCoords = (x: number, y: number): SelectedElement | null => {
    // Check Doors first
    for (const d of doors) {
      const w = d.widthM * SCALE_PPM;
      if (Math.abs(x - d.x) <= w / 2 + 10 && Math.abs(y - d.y) <= 15) {
        return { type: 'door', id: d.id };
      }
    }

    // Check Windows
    for (const win of windows) {
      const w = win.widthM * SCALE_PPM;
      if (Math.abs(x - win.x) <= w / 2 + 10 && Math.abs(y - win.y) <= 15) {
        return { type: 'window', id: win.id };
      }
    }

    // Check Columns
    for (const col of columns) {
      const size = col.sizeM * SCALE_PPM;
      if (Math.abs(x - col.x) <= size / 2 + 5 && Math.abs(y - col.y) <= size / 2 + 5) {
        return { type: 'column', id: col.id };
      }
    }

    // Check Room labels
    for (const r of rooms) {
      if (Math.abs(x - r.x) <= 60 && Math.abs(y - r.y) <= 25) {
        return { type: 'room', id: r.id };
      }
    }

    // Check Walls
    for (const w of walls) {
      if (w.tracePoints && w.tracePoints.length >= 2) {
        const dist = distToSegment({ x, y }, w.tracePoints[0], w.tracePoints[1]);
        if (dist <= 14) {
          return { type: 'wall', id: w.id };
        }
      }
    }

    // Check Dimensions
    for (const dim of dimensions) {
      const dist = distToSegment({ x, y }, dim.p1, dim.p2);
      if (dist <= 12) {
        return { type: 'dimension', id: dim.id };
      }
    }

    return null;
  };

  // Delete currently selected element
  const handleDeleteSelected = () => {
    if (!selectedElement) return;

    if (selectedElement.type === 'wall') {
      const updated = walls.filter((w) => w.id !== selectedElement.id);
      setWalls(updated);
      pushToHistory({ walls: updated, doors, windows, rooms, dimensions, columns });
    } else if (selectedElement.type === 'door') {
      const updated = doors.filter((d) => d.id !== selectedElement.id);
      setDoors(updated);
      pushToHistory({ walls, doors: updated, windows, rooms, dimensions, columns });
    } else if (selectedElement.type === 'window') {
      const updated = windows.filter((w) => w.id !== selectedElement.id);
      setWindows(updated);
      pushToHistory({ walls, doors, windows: updated, rooms, dimensions, columns });
    } else if (selectedElement.type === 'room') {
      const updated = rooms.filter((r) => r.id !== selectedElement.id);
      setRooms(updated);
      pushToHistory({ walls, doors, windows, rooms: updated, dimensions, columns });
    } else if (selectedElement.type === 'column') {
      const updated = columns.filter((c) => c.id !== selectedElement.id);
      setColumns(updated);
      pushToHistory({ walls, doors, windows, rooms, dimensions, columns: updated });
    } else if (selectedElement.type === 'dimension') {
      const updated = dimensions.filter((d) => d.id !== selectedElement.id);
      setDimensions(updated);
      pushToHistory({ walls, doors, windows, rooms, dimensions: updated, columns });
    }

    setSelectedElement(null);
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'v' || e.key === 'V') setActiveTool('select');
      if (e.key === 'w' || e.key === 'W') setActiveTool('wall');
      if (e.key === 'r' || e.key === 'R') setActiveTool('room');
      if (e.key === 'd' || e.key === 'D') setActiveTool('door');
      if (e.key === 'n' || e.key === 'N') setActiveTool('window');
      if (e.key === 't' || e.key === 'T') setActiveTool('room_label');
      if (e.key === 'm' || e.key === 'M') setActiveTool('dimension');
      if (e.key === 'c' || e.key === 'C') setActiveTool('column');
      if (e.key === 'h' || e.key === 'H') setActiveTool('pan');

      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) {
        handleRedo();
      }

      if (e.key === 'Escape') {
        setSelectedElement(null);
        setDrawStart(null);
        setDrawCurrent(null);
        setActiveTool('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, historyIndex, history]);

  // Mouse Down Event Handler
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);

    // Pan via middle mouse or Pan tool or Space
    if (e.button === 1 || activeTool === 'pan' || (activeTool === 'select' && e.shiftKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (e.button !== 0) return;

    // SELECT TOOL
    if (activeTool === 'select') {
      const found = findElementAtCoords(coords.rawX, coords.rawY);
      setSelectedElement(found);
      if (found) {
        setIsDraggingElement(true);
        setDragElementStartPos({ x: coords.rawX, y: coords.rawY });
      }
      return;
    }

    // DRAW WALL / ROOM / DIMENSION
    if (activeTool === 'wall' || activeTool === 'room' || activeTool === 'dimension') {
      setDrawStart({ x: coords.x, y: coords.y });
      setDrawCurrent({ x: coords.x, y: coords.y });
      return;
    }

    // PLACE DOOR ON WALL
    if (activeTool === 'door') {
      // Find closest wall to attach door to
      let attachWall: Wall | null = null;
      let snapPoint = { x: coords.x, y: coords.y };

      for (const w of walls) {
        if (w.tracePoints && w.tracePoints.length >= 2) {
          const p1 = w.tracePoints[0];
          const p2 = w.tracePoints[1];
          const dist = distToSegment({ x: coords.rawX, y: coords.rawY }, p1, p2);
          if (dist < 28) {
            attachWall = w;
            // Project point onto line
            const l2 = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
            let t = ((coords.rawX - p1.x) * (p2.x - p1.x) + (coords.rawY - p1.y) * (p2.y - p1.y)) / l2;
            t = Math.max(0.1, Math.min(0.9, t));
            snapPoint = {
              x: Math.round(p1.x + t * (p2.x - p1.x)),
              y: Math.round(p1.y + t * (p2.y - p1.y)),
            };
            break;
          }
        }
      }

      const newDoor: DesignerDoor = {
        id: `door-${Date.now()}`,
        wallId: attachWall?.id,
        x: snapPoint.x,
        y: snapPoint.y,
        widthM: selectedDoorPreset.width,
        heightM: selectedDoorPreset.height,
        label: `${selectedDoorPreset.code} (${selectedDoorPreset.width}m)`,
        swingDirection: 'left-in',
      };

      const updatedDoors = [...doors, newDoor];
      setDoors(updatedDoors);

      // Add door deduction to wall
      let updatedWalls = walls;
      if (attachWall) {
        updatedWalls = walls.map((w) => {
          if (w.id === attachWall!.id) {
            const op: Opening = {
              id: `op-${Date.now()}`,
              type: 'door',
              label: selectedDoorPreset.label,
              width: selectedDoorPreset.width,
              height: selectedDoorPreset.height,
              quantity: 1,
              area: Number((selectedDoorPreset.width * selectedDoorPreset.height).toFixed(2)),
            };
            const newOpenings = [...w.openings, op];
            const opArea = Number(newOpenings.reduce((sum, o) => sum + o.area, 0).toFixed(2));
            const net = Math.max(0, Number((w.grossArea - opArea).toFixed(2)));
            return {
              ...w,
              openings: newOpenings,
              openingArea: opArea,
              netArea: net,
              baseCHB: Math.ceil(net / chbAreaSqM),
            };
          }
          return w;
        });
        setWalls(updatedWalls);
      }

      pushToHistory({ walls: updatedWalls, doors: updatedDoors, windows, rooms, dimensions, columns });
      setSelectedElement({ type: 'door', id: newDoor.id });
      return;
    }

    // PLACE WINDOW ON WALL
    if (activeTool === 'window') {
      let attachWall: Wall | null = null;
      let snapPoint = { x: coords.x, y: coords.y };

      for (const w of walls) {
        if (w.tracePoints && w.tracePoints.length >= 2) {
          const p1 = w.tracePoints[0];
          const p2 = w.tracePoints[1];
          const dist = distToSegment({ x: coords.rawX, y: coords.rawY }, p1, p2);
          if (dist < 28) {
            attachWall = w;
            const l2 = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
            let t = ((coords.rawX - p1.x) * (p2.x - p1.x) + (coords.rawY - p1.y) * (p2.y - p1.y)) / l2;
            t = Math.max(0.1, Math.min(0.9, t));
            snapPoint = {
              x: Math.round(p1.x + t * (p2.x - p1.x)),
              y: Math.round(p1.y + t * (p2.y - p1.y)),
            };
            break;
          }
        }
      }

      const newWin: DesignerWindow = {
        id: `win-${Date.now()}`,
        wallId: attachWall?.id,
        x: snapPoint.x,
        y: snapPoint.y,
        widthM: selectedWindowPreset.width,
        heightM: selectedWindowPreset.height,
        label: `${selectedWindowPreset.code} (${selectedWindowPreset.width}m)`,
      };

      const updatedWins = [...windows, newWin];
      setWindows(updatedWins);

      let updatedWalls = walls;
      if (attachWall) {
        updatedWalls = walls.map((w) => {
          if (w.id === attachWall!.id) {
            const op: Opening = {
              id: `op-${Date.now()}`,
              type: 'window',
              label: selectedWindowPreset.label,
              width: selectedWindowPreset.width,
              height: selectedWindowPreset.height,
              quantity: 1,
              area: Number((selectedWindowPreset.width * selectedWindowPreset.height).toFixed(2)),
            };
            const newOpenings = [...w.openings, op];
            const opArea = Number(newOpenings.reduce((sum, o) => sum + o.area, 0).toFixed(2));
            const net = Math.max(0, Number((w.grossArea - opArea).toFixed(2)));
            return {
              ...w,
              openings: newOpenings,
              openingArea: opArea,
              netArea: net,
              baseCHB: Math.ceil(net / chbAreaSqM),
            };
          }
          return w;
        });
        setWalls(updatedWalls);
      }

      pushToHistory({ walls: updatedWalls, doors, windows: updatedWins, rooms, dimensions, columns });
      setSelectedElement({ type: 'window', id: newWin.id });
      return;
    }

    // PLACE ROOM LABEL
    if (activeTool === 'room_label') {
      const newRoom: DesignerRoomLabel = {
        id: `room-${Date.now()}`,
        name: selectedRoomName,
        x: coords.x,
        y: coords.y,
        customArea: 16.0,
      };
      const updatedRooms = [...rooms, newRoom];
      setRooms(updatedRooms);
      pushToHistory({ walls, doors, windows, rooms: updatedRooms, dimensions, columns });
      setSelectedElement({ type: 'room', id: newRoom.id });
      return;
    }

    // PLACE COLUMN
    if (activeTool === 'column') {
      const newCol: DesignerColumn = {
        id: `col-${Date.now()}`,
        x: coords.x,
        y: coords.y,
        sizeM: 0.2,
      };
      const updatedCols = [...columns, newCol];
      setColumns(updatedCols);
      pushToHistory({ walls, doors, windows, rooms, dimensions, columns: updatedCols });
      setSelectedElement({ type: 'column', id: newCol.id });
      return;
    }
  };

  // Mouse Move Event Handler
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    const coords = getCanvasCoords(e);
    setCursorPos({ x: coords.x, y: coords.y });
    setSnapInfo({ x: coords.x, y: coords.y, type: coords.snapType });

    // Hover detection on walls for door/window placement or highlighting
    let wallUnderCursor: Wall | null = null;
    for (const w of walls) {
      if (w.tracePoints && w.tracePoints.length >= 2) {
        const dist = distToSegment({ x: coords.rawX, y: coords.rawY }, w.tracePoints[0], w.tracePoints[1]);
        if (dist <= 20) {
          wallUnderCursor = w;
          break;
        }
      }
    }
    setHoveredWall(wallUnderCursor);

    if (drawStart) {
      const orthoPos = applyOrtho(drawStart, { x: coords.x, y: coords.y });
      setDrawCurrent(orthoPos);
    }
  };

  // Mouse Up Event Handler
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDraggingElement) {
      setIsDraggingElement(false);
      setDragElementStartPos(null);
    }

    if (drawStart && drawCurrent) {
      const dx = drawCurrent.x - drawStart.x;
      const dy = drawCurrent.y - drawStart.y;
      const pixelDist = Math.hypot(dx, dy);

      if (pixelDist > 12) {
        if (activeTool === 'wall') {
          const lengthMeters = Number((pixelDist / SCALE_PPM).toFixed(2));
          const nextNum = walls.length + 1;
          const wallId = `W${String(nextNum).padStart(2, '0')}`;
          const gross = Number((lengthMeters * currentWallHeight).toFixed(2));

          const newWall: Wall = {
            id: wallId,
            name: `${currentWallType} ${wallId}`,
            type: currentWallType,
            length: lengthMeters,
            height: currentWallHeight,
            grossArea: gross,
            openingArea: 0,
            netArea: gross,
            baseCHB: Math.ceil(gross / chbAreaSqM),
            color: currentWallType === 'Exterior Wall' ? '#38bdf8' : '#818cf8',
            tracePoints: [drawStart, drawCurrent],
            openings: [],
            isAutoDetected: false,
          };

          const updatedWalls = [...walls, newWall];
          setWalls(updatedWalls);
          pushToHistory({ walls: updatedWalls, doors, windows, rooms, dimensions, columns });
          setSelectedElement({ type: 'wall', id: newWall.id });
        } else if (activeTool === 'room') {
          const wM = Number((Math.abs(dx) / SCALE_PPM).toFixed(2));
          const hM = Number((Math.abs(dy) / SCALE_PPM).toFixed(2));
          const x1 = Math.min(drawStart.x, drawCurrent.x);
          const x2 = Math.max(drawStart.x, drawCurrent.x);
          const y1 = Math.min(drawStart.y, drawCurrent.y);
          const y2 = Math.max(drawStart.y, drawCurrent.y);

          const startNum = walls.length + 1;
          const roomWalls: Wall[] = [
            {
              id: `W${String(startNum).padStart(2, '0')}`,
              name: `Room Wall North`,
              type: currentWallType,
              length: wM,
              height: currentWallHeight,
              grossArea: Number((wM * currentWallHeight).toFixed(2)),
              openingArea: 0,
              netArea: Number((wM * currentWallHeight).toFixed(2)),
              baseCHB: Math.ceil((wM * currentWallHeight) / chbAreaSqM),
              tracePoints: [{ x: x1, y: y1 }, { x: x2, y: y1 }],
              openings: [],
            },
            {
              id: `W${String(startNum + 1).padStart(2, '0')}`,
              name: `Room Wall East`,
              type: currentWallType,
              length: hM,
              height: currentWallHeight,
              grossArea: Number((hM * currentWallHeight).toFixed(2)),
              openingArea: 0,
              netArea: Number((hM * currentWallHeight).toFixed(2)),
              baseCHB: Math.ceil((hM * currentWallHeight) / chbAreaSqM),
              tracePoints: [{ x: x2, y: y1 }, { x: x2, y: y2 }],
              openings: [],
            },
            {
              id: `W${String(startNum + 2).padStart(2, '0')}`,
              name: `Room Wall South`,
              type: currentWallType,
              length: wM,
              height: currentWallHeight,
              grossArea: Number((wM * currentWallHeight).toFixed(2)),
              openingArea: 0,
              netArea: Number((wM * currentWallHeight).toFixed(2)),
              baseCHB: Math.ceil((wM * currentWallHeight) / chbAreaSqM),
              tracePoints: [{ x: x1, y: y2 }, { x: x2, y: y2 }],
              openings: [],
            },
            {
              id: `W${String(startNum + 3).padStart(2, '0')}`,
              name: `Room Wall West`,
              type: currentWallType,
              length: hM,
              height: currentWallHeight,
              grossArea: Number((hM * currentWallHeight).toFixed(2)),
              openingArea: 0,
              netArea: Number((hM * currentWallHeight).toFixed(2)),
              baseCHB: Math.ceil((hM * currentWallHeight) / chbAreaSqM),
              tracePoints: [{ x: x1, y: y1 }, { x: x1, y: y2 }],
              openings: [],
            },
          ];

          const newRoom: DesignerRoomLabel = {
            id: `room-${Date.now()}`,
            name: selectedRoomName,
            x: (x1 + x2) / 2,
            y: (y1 + y2) / 2,
            widthM: wM,
            heightM: hM,
            customArea: Number((wM * hM).toFixed(1)),
          };

          const updatedWalls = [...walls, ...roomWalls];
          const updatedRooms = [...rooms, newRoom];
          setWalls(updatedWalls);
          setRooms(updatedRooms);
          pushToHistory({ walls: updatedWalls, doors, windows, rooms: updatedRooms, dimensions, columns });
          setSelectedElement({ type: 'room', id: newRoom.id });
        } else if (activeTool === 'dimension') {
          const lengthMeters = Number((pixelDist / SCALE_PPM).toFixed(2));
          const newDim: DesignerDimension = {
            id: `dim-${Date.now()}`,
            p1: drawStart,
            p2: drawCurrent,
            label: `${lengthMeters.toFixed(2)} m`,
            offset: -30,
          };
          const updatedDims = [...dimensions, newDim];
          setDimensions(updatedDims);
          pushToHistory({ walls, doors, windows, rooms, dimensions: updatedDims, columns });
          setSelectedElement({ type: 'dimension', id: newDim.id });
        }
      }

      setDrawStart(null);
      setDrawCurrent(null);
    }
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.12 : 0.88;
    setZoom((z) => Math.max(0.3, Math.min(3.5, Number((z * factor).toFixed(2)))));
  };

  // Fit Blueprint to Viewport
  const handleFitToView = () => {
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Render Blueprint CAD Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Theme setup
    const isBp = blueprintTheme === 'blueprint';
    const isDark = blueprintTheme === 'darkcad';
    const bgColor = isBp ? '#0c2340' : isDark ? '#0b1329' : '#ffffff';
    const gridMinorColor = isBp ? 'rgba(56, 189, 248, 0.12)' : isDark ? 'rgba(71, 85, 105, 0.25)' : 'rgba(226, 232, 240, 0.8)';
    const gridMajorColor = isBp ? 'rgba(56, 189, 248, 0.32)' : isDark ? 'rgba(71, 85, 105, 0.55)' : 'rgba(203, 213, 225, 0.9)';
    const wallExtColor = isBp ? '#38bdf8' : isDark ? '#60a5fa' : '#0f172a';
    const wallIntColor = isBp ? '#93c5fd' : isDark ? '#818cf8' : '#334155';
    const textPrimary = isBp ? '#f0f9ff' : isDark ? '#f8fafc' : '#0f172a';
    const textSecondary = isBp ? '#7dd3fc' : isDark ? '#94a3b8' : '#64748b';

    ctx.save();
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    // Apply viewport Pan & Zoom
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw Dynamic Architectural Grid
    const snapPx = (gridSnapMeters > 0 ? gridSnapMeters : 0.5) * SCALE_PPM;
    const majorPx = snapPx * 4; // Every 2.0 meters

    ctx.lineWidth = 0.5;
    ctx.strokeStyle = gridMinorColor;
    for (let x = -3000; x <= 5000; x += snapPx) {
      ctx.beginPath();
      ctx.moveTo(x, -3000);
      ctx.lineTo(x, 5000);
      ctx.stroke();
    }
    for (let y = -3000; y <= 5000; y += snapPx) {
      ctx.beginPath();
      ctx.moveTo(-3000, y);
      ctx.lineTo(5000, y);
      ctx.stroke();
    }

    ctx.lineWidth = 1;
    ctx.strokeStyle = gridMajorColor;
    for (let x = -3000; x <= 5000; x += majorPx) {
      ctx.beginPath();
      ctx.moveTo(x, -3000);
      ctx.lineTo(x, 5000);
      ctx.stroke();
    }
    for (let y = -3000; y <= 5000; y += majorPx) {
      ctx.beginPath();
      ctx.moveTo(-3000, y);
      ctx.lineTo(5000, y);
      ctx.stroke();
    }

    // Origin Axes Indicator (0,0)
    ctx.strokeStyle = isBp ? 'rgba(56, 189, 248, 0.7)' : '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(0, 30);
    ctx.moveTo(-30, 0);
    ctx.lineTo(30, 0);
    ctx.stroke();

    // 1. Draw Rooms (Background shade & labels)
    rooms.forEach((r) => {
      const isSelected = selectedElement?.type === 'room' && selectedElement.id === r.id;

      if (r.widthM && r.heightM) {
        ctx.fillStyle = isSelected
          ? 'rgba(56, 189, 248, 0.18)'
          : isBp
          ? 'rgba(56, 189, 248, 0.06)'
          : isDark
          ? 'rgba(96, 165, 250, 0.08)'
          : 'rgba(241, 245, 249, 0.8)';
        ctx.fillRect(
          r.x - (r.widthM * SCALE_PPM) / 2,
          r.y - (r.heightM * SCALE_PPM) / 2,
          r.widthM * SCALE_PPM,
          r.heightM * SCALE_PPM
        );

        if (isSelected) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.strokeRect(
            r.x - (r.widthM * SCALE_PPM) / 2,
            r.y - (r.heightM * SCALE_PPM) / 2,
            r.widthM * SCALE_PPM,
            r.heightM * SCALE_PPM
          );
          ctx.setLineDash([]);
        }
      }

      // Room Title Badge
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 12px "Courier New", monospace, sans-serif';
      ctx.fillStyle = isSelected ? '#38bdf8' : textPrimary;
      ctx.fillText(r.name, r.x, r.y - 6);

      if (r.customArea) {
        ctx.font = 'bold 10px monospace, sans-serif';
        ctx.fillStyle = isSelected ? '#7dd3fc' : textSecondary;
        ctx.fillText(`${r.customArea.toFixed(1)} m²`, r.x, r.y + 9);
      }
    });

    // 2. Draw Columns
    columns.forEach((c) => {
      const isSelected = selectedElement?.type === 'column' && selectedElement.id === c.id;
      const size = c.sizeM * SCALE_PPM;
      ctx.fillStyle = isSelected ? '#e11d48' : isBp ? '#0284c7' : isDark ? '#3b82f6' : '#1e293b';
      ctx.strokeStyle = isSelected ? '#fb7185' : textPrimary;
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.fillRect(c.x - size / 2, c.y - size / 2, size, size);
      ctx.strokeRect(c.x - size / 2, c.y - size / 2, size, size);

      ctx.beginPath();
      ctx.moveTo(c.x - size / 2, c.y - size / 2);
      ctx.lineTo(c.x + size / 2, c.y + size / 2);
      ctx.moveTo(c.x + size / 2, c.y - size / 2);
      ctx.lineTo(c.x - size / 2, c.y + size / 2);
      ctx.stroke();
    });

    // 3. Draw Walls
    walls.forEach((w) => {
      if (!w.tracePoints || w.tracePoints.length < 2) return;
      const p1 = w.tracePoints[0];
      const p2 = w.tracePoints[1];
      const isSelected = selectedElement?.type === 'wall' && selectedElement.id === w.id;
      const isHovered = hoveredWall?.id === w.id;
      const isExt = w.type === 'Exterior Wall' || w.type === 'Firewall' || w.type === 'Perimeter / Fence';
      const wallThickness = isExt ? 9 : 6;

      ctx.strokeStyle = isSelected
        ? '#f59e0b'
        : isHovered
        ? '#10b981'
        : isExt
        ? wallExtColor
        : wallIntColor;
      ctx.lineWidth = isSelected || isHovered ? wallThickness + 2 : wallThickness;
      ctx.lineCap = 'square';

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Draw Wall Corners (Endpoints)
      ctx.fillStyle = isSelected ? '#f59e0b' : isExt ? wallExtColor : wallIntColor;
      ctx.fillRect(p1.x - 4, p1.y - 4, 8, 8);
      ctx.fillRect(p2.x - 4, p2.y - 4, 8, 8);

      // Wall Midpoint Tag
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      ctx.fillStyle = isSelected
        ? '#78350f'
        : isBp
        ? '#0369a1'
        : isDark
        ? '#1e293b'
        : '#f8fafc';
      ctx.strokeStyle = isSelected ? '#f59e0b' : isExt ? wallExtColor : wallIntColor;
      ctx.lineWidth = 1;
      ctx.fillRect(midX - 25, midY - 9, 50, 18);
      ctx.strokeRect(midX - 25, midY - 9, 50, 18);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = isSelected ? '#fef3c7' : textPrimary;
      ctx.fillText(`${w.id} ${w.length.toFixed(1)}m`, midX, midY);
    });

    // 4. Draw Windows
    windows.forEach((win) => {
      const isSelected = selectedElement?.type === 'window' && selectedElement.id === win.id;
      const width = win.widthM * SCALE_PPM;

      ctx.fillStyle = bgColor;
      ctx.fillRect(win.x - width / 2, win.y - 5, width, 10);

      ctx.strokeStyle = isSelected ? '#f59e0b' : isBp ? '#38bdf8' : '#0284c7';
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.strokeRect(win.x - width / 2, win.y - 5, width, 10);

      // Window glass lines
      ctx.beginPath();
      ctx.moveTo(win.x - width / 2, win.y);
      ctx.lineTo(win.x + width / 2, win.y);
      ctx.stroke();

      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = isSelected ? '#f59e0b' : textSecondary;
      ctx.textAlign = 'center';
      ctx.fillText(win.label || 'WIN', win.x, win.y - 8);
    });

    // 5. Draw Doors
    doors.forEach((door) => {
      const isSelected = selectedElement?.type === 'door' && selectedElement.id === door.id;
      const width = door.widthM * SCALE_PPM;

      ctx.fillStyle = bgColor;
      ctx.fillRect(door.x - width / 2, door.y - 6, width, 12);

      // Door Leaf
      ctx.strokeStyle = isSelected ? '#38bdf8' : '#f59e0b';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.beginPath();
      ctx.moveTo(door.x - width / 2, door.y);
      ctx.lineTo(door.x - width / 2, door.y - width);
      ctx.stroke();

      // Swing Arc
      ctx.strokeStyle = isSelected ? 'rgba(56, 189, 248, 0.8)' : 'rgba(245, 158, 11, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(door.x - width / 2, door.y, width, -Math.PI / 2, 0, false);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = 'bold 8px monospace';
      ctx.fillStyle = isSelected ? '#38bdf8' : textSecondary;
      ctx.textAlign = 'center';
      ctx.fillText(door.label || 'DOOR', door.x, door.y + 15);
    });

    // 6. Draw Dimensions
    dimensions.forEach((dim) => {
      const isSelected = selectedElement?.type === 'dimension' && selectedElement.id === dim.id;
      ctx.strokeStyle = isSelected ? '#38bdf8' : '#facc15';
      ctx.lineWidth = isSelected ? 2.5 : 1.5;

      ctx.beginPath();
      ctx.moveTo(dim.p1.x, dim.p1.y);
      ctx.lineTo(dim.p2.x, dim.p2.y);
      ctx.stroke();

      // Slashes
      const tick = 6;
      ctx.beginPath();
      ctx.moveTo(dim.p1.x - tick, dim.p1.y + tick);
      ctx.lineTo(dim.p1.x + tick, dim.p1.y - tick);
      ctx.moveTo(dim.p2.x - tick, dim.p2.y + tick);
      ctx.lineTo(dim.p2.x + tick, dim.p2.y - tick);
      ctx.stroke();

      const midX = (dim.p1.x + dim.p2.x) / 2;
      const midY = (dim.p1.y + dim.p2.y) / 2;
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = isSelected ? '#38bdf8' : '#facc15';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(dim.label, midX, midY - 3);
    });

    // 7. Active Drawing Preview Line / Box
    if (drawStart && drawCurrent) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;

      if (activeTool === 'wall' || activeTool === 'dimension') {
        ctx.beginPath();
        ctx.moveTo(drawStart.x, drawStart.y);
        ctx.lineTo(drawCurrent.x, drawCurrent.y);
        ctx.stroke();

        const dx = drawCurrent.x - drawStart.x;
        const dy = drawCurrent.y - drawStart.y;
        const liveMeters = (Math.hypot(dx, dy) / SCALE_PPM).toFixed(2);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${liveMeters} m`, (drawStart.x + drawCurrent.x) / 2, (drawStart.y + drawCurrent.y) / 2 - 10);
      } else if (activeTool === 'room') {
        const x = Math.min(drawStart.x, drawCurrent.x);
        const y = Math.min(drawStart.y, drawCurrent.y);
        const w = Math.abs(drawCurrent.x - drawStart.x);
        const h = Math.abs(drawCurrent.y - drawStart.y);

        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);

        const wM = (w / SCALE_PPM).toFixed(2);
        const hM = (h / SCALE_PPM).toFixed(2);
        const area = ((w / SCALE_PPM) * (h / SCALE_PPM)).toFixed(1);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${wM}m × ${hM}m (${area} m²)`, x + w / 2, y + h / 2);
      }
    }

    // 8. Magnetic Snap Indicator
    if (snapInfo && (activeTool === 'wall' || activeTool === 'room' || activeTool === 'dimension')) {
      if (snapInfo.type === 'corner') {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(snapInfo.x, snapInfo.y, 8, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('● Corner Snap', snapInfo.x + 12, snapInfo.y + 3);
      } else if (snapInfo.type === 'midpoint') {
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(snapInfo.x, snapInfo.y - 7);
        ctx.lineTo(snapInfo.x + 7, snapInfo.y + 5);
        ctx.lineTo(snapInfo.x - 7, snapInfo.y + 5);
        ctx.closePath();
        ctx.stroke();

        ctx.fillStyle = '#06b6d4';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('▲ Midpoint Snap', snapInfo.x + 12, snapInfo.y + 3);
      }
    }

    ctx.restore();
  }, [
    walls,
    doors,
    windows,
    rooms,
    dimensions,
    columns,
    drawStart,
    drawCurrent,
    activeTool,
    blueprintTheme,
    gridSnapMeters,
    pan,
    zoom,
    selectedElement,
    snapInfo,
    hoveredWall,
  ]);

  // Derived Totals
  const totalWallLength = walls.reduce((sum, w) => sum + w.length, 0);
  const totalGrossArea = walls.reduce((sum, w) => sum + w.grossArea, 0);
  const totalOpeningArea = walls.reduce((sum, w) => sum + w.openingArea, 0);
  const totalNetArea = Math.max(0, totalGrossArea - totalOpeningArea);
  const baseCHBTotal = Math.ceil(totalNetArea / chbAreaSqM);
  const finalCHBWithWaste = Math.ceil(baseCHBTotal * (1 + wastePercentage / 100));
  const estimatedFloorArea = rooms.reduce((sum, r) => sum + (r.customArea || 0), 0) || 72.0;

  // Find currently selected element object
  const activeSelectedWall = selectedElement?.type === 'wall' ? walls.find((w) => w.id === selectedElement.id) : null;
  const activeSelectedDoor = selectedElement?.type === 'door' ? doors.find((d) => d.id === selectedElement.id) : null;
  const activeSelectedWin = selectedElement?.type === 'window' ? windows.find((w) => w.id === selectedElement.id) : null;
  const activeSelectedRoom = selectedElement?.type === 'room' ? rooms.find((r) => r.id === selectedElement.id) : null;
  const activeSelectedCol = selectedElement?.type === 'column' ? columns.find((c) => c.id === selectedElement.id) : null;

  // Apply to Main App
  const handleApplyToProject = () => {
    const dataUrl = generateBlueprintDataUrl(
      { walls, doors, windows, rooms, dimensions, columns },
      planTitle,
      blueprintTheme,
      chbAreaSqM
    );

    onApplyBlueprint(dataUrl, planTitle, walls, estimatedFloorArea);
    onClose();
  };

  // Download high-res PNG image
  const handleDownloadBlueprintImage = () => {
    const dataUrl = generateBlueprintDataUrl(
      { walls, doors, windows, rooms, dimensions, columns },
      planTitle,
      blueprintTheme,
      chbAreaSqM
    );

    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `${planTitle.replace(/\s+/g, '_')}_Blueprint.png`;
    a.click();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-7xl h-[95vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header Bar */}
        <header className="bg-slate-950 border-b border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Title & Presets */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white flex items-center justify-center shadow-md shadow-cyan-950">
                <PenTool className="w-4 h-4" />
              </div>
              <div>
                <input
                  type="text"
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  className="bg-transparent border-b border-transparent hover:border-slate-600 focus:border-cyan-500 text-sm font-bold text-slate-100 focus:outline-none px-1 py-0.5"
                  title="Click to rename blueprint project"
                />
                <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                  <span>Architectural Blueprint CAD Studio</span>
                  <span>•</span>
                  <span>1m = {SCALE_PPM}px</span>
                </div>
              </div>
            </div>

            {/* Template Presets Picker */}
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-slate-400 text-[11px] hidden sm:inline">Templates:</span>
              {DESIGNER_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleLoadPreset(p)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-all hover:text-white"
                  title={p.description}
                >
                  {p.name.split(' ')[0]} <span className="text-[9px] text-cyan-400 font-mono">({p.floorArea}m²)</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowShortcutsModal(true)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Keyboard Shortcuts Cheat Sheet"
            >
              <HelpCircle className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleDownloadBlueprintImage}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors"
              title="Export high-resolution blueprint PNG"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Export PNG</span>
            </button>

            <button
              id="btn-apply-designer-blueprint"
              type="button"
              onClick={handleApplyToProject}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-950 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply to Project</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* CAD Studio Core Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Drawing Viewport & Floating Ribbon */}
          <div className="relative flex-1 bg-slate-950 overflow-hidden flex flex-col select-none">
            {/* Top Floating CAD Tool Ribbon */}
            <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none gap-2">
              {/* Primary Drawing Tool Switcher */}
              <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1.5 rounded-2xl shadow-xl">
                <button
                  type="button"
                  onClick={() => setActiveTool('select')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    activeTool === 'select'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title="Select & Move (V)"
                >
                  <MousePointer2 className="w-3.5 h-3.5" />
                  <span>Select</span>
                  <kbd className="text-[9px] bg-slate-950/60 px-1 rounded text-slate-300">V</kbd>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool('wall')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    activeTool === 'wall'
                      ? 'bg-cyan-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title="Draw Wall (W)"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Wall</span>
                  <kbd className="text-[9px] bg-slate-950/60 px-1 rounded text-slate-300">W</kbd>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool('room')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    activeTool === 'room'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title="Draw Room Box (R)"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Room</span>
                  <kbd className="text-[9px] bg-slate-950/60 px-1 rounded text-slate-300">R</kbd>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool('door')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    activeTool === 'door'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title="Add Door (D)"
                >
                  <DoorOpen className="w-3.5 h-3.5" />
                  <span>Door</span>
                  <kbd className="text-[9px] bg-slate-950/60 px-1 rounded text-slate-300">D</kbd>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool('window')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    activeTool === 'window'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title="Add Window (N)"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Window</span>
                  <kbd className="text-[9px] bg-slate-950/60 px-1 rounded text-slate-300">N</kbd>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool('column')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    activeTool === 'column'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title="Add RC Column (C)"
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Column</span>
                  <kbd className="text-[9px] bg-slate-950/60 px-1 rounded text-slate-300">C</kbd>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool('room_label')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    activeTool === 'room_label'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title="Room Stamp Tag (T)"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Stamp</span>
                  <kbd className="text-[9px] bg-slate-950/60 px-1 rounded text-slate-300">T</kbd>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool('dimension')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    activeTool === 'dimension'
                      ? 'bg-yellow-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title="Dimension Line (M)"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Dimension</span>
                  <kbd className="text-[9px] bg-slate-950/60 px-1 rounded text-slate-300">M</kbd>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool('pan')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    activeTool === 'pan'
                      ? 'bg-slate-700 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title="Pan Viewport (H)"
                >
                  <Hand className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Pan</span>
                  <kbd className="text-[9px] bg-slate-950/60 px-1 rounded text-slate-300">H</kbd>
                </button>
              </div>

              {/* Undo / Redo & Snap Controls */}
              <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1.5 rounded-2xl shadow-xl">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Redo (Ctrl+Y)"
                >
                  <Redo2 className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-slate-800 mx-0.5" />

                {/* Ortho Lock */}
                <button
                  type="button"
                  onClick={() => setIsOrthoLocked(!isOrthoLocked)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                    isOrthoLocked
                      ? 'bg-cyan-950 text-cyan-300 border border-cyan-700/80'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Lock Angle to 90° Angles (Ortho)"
                >
                  Ortho {isOrthoLocked ? 'ON' : 'OFF'}
                </button>

                {/* Magnetic Snap Toggle */}
                <button
                  type="button"
                  onClick={() => setMagneticVertexSnap(!magneticVertexSnap)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                    magneticVertexSnap
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/80'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Magnetic Wall Corner & Midpoint Snap"
                >
                  Snap {magneticVertexSnap ? 'ON' : 'OFF'}
                </button>

                {/* Grid Snap selector */}
                <select
                  value={gridSnapMeters}
                  onChange={(e) => setGridSnapMeters(parseFloat(e.target.value))}
                  className="bg-slate-950 text-slate-300 text-[11px] font-mono px-2 py-1 rounded-xl border border-slate-800 focus:outline-none"
                  title="Grid Snap Interval"
                >
                  <option value="0.25">0.25m</option>
                  <option value="0.5">0.50m</option>
                  <option value="1.0">1.00m</option>
                  <option value="0">Free</option>
                </select>

                {/* Theme Selector */}
                <select
                  value={blueprintTheme}
                  onChange={(e) => setBlueprintTheme(e.target.value as ThemeMode)}
                  className="bg-slate-950 text-slate-300 text-[11px] px-2 py-1 rounded-xl border border-slate-800 focus:outline-none"
                >
                  <option value="blueprint">Classic Blue</option>
                  <option value="darkcad">Dark CAD</option>
                  <option value="monochrome">White Print</option>
                </select>

                {/* Clear Canvas */}
                <button
                  type="button"
                  onClick={handleClearCanvas}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                  title="Clear All Elements"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Interactive Canvas Element */}
            <div className="relative flex-1 w-full h-full flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={1400}
                height={800}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onWheel={handleWheel}
                className={`w-full h-full block ${
                  activeTool === 'pan' || isPanning
                    ? 'cursor-grab active:cursor-grabbing'
                    : activeTool === 'select'
                    ? 'cursor-default'
                    : 'cursor-crosshair'
                }`}
              />

              {/* Floating Bottom-Left Zoom & Fit Bar */}
              <div className="absolute bottom-4 left-4 z-20 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1 rounded-2xl shadow-xl">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.3, Number((z * 0.85).toFixed(2))))}
                  className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <span className="text-[11px] font-mono font-bold text-slate-300 px-2 min-w-[46px] text-center">
                  {Math.round(zoom * 100)}%
                </span>

                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3.5, Number((z * 1.18).toFixed(2))))}
                  className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleFitToView}
                  className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800"
                  title="Reset & Fit to View (100%)"
                >
                  <Maximize className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-slate-800 mx-0.5" />

                <div className="text-[10px] font-mono text-cyan-300 px-2">
                  X: {(cursorPos.x / SCALE_PPM).toFixed(2)}m | Y: {(cursorPos.y / SCALE_PPM).toFixed(2)}m
                </div>
              </div>

              {/* Active Drawing Tool Guide Toast */}
              <div className="absolute bottom-4 right-4 z-20 pointer-events-none bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl px-3.5 py-2 text-xs text-slate-300 shadow-xl flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>
                  {activeTool === 'select' && 'Select mode: Click any element to inspect, drag, or delete with Backspace.'}
                  {activeTool === 'wall' && 'Click & drag on the grid to create masonry walls with corner snapping.'}
                  {activeTool === 'room' && 'Drag diagonally to build a complete 4-wall room and calculate m² floor area.'}
                  {activeTool === 'door' && 'Click any wall segment to install a door with opening deduction.'}
                  {activeTool === 'window' && 'Click any wall segment to drop a window opening and deduct CHB.'}
                  {activeTool === 'column' && 'Click any grid point to install an RC structural column.'}
                  {activeTool === 'room_label' && 'Click inside any room area to drop an architectural label.'}
                  {activeTool === 'dimension' && 'Click and drag to measure and place metric dimension markers.'}
                  {activeTool === 'pan' && 'Click and drag anywhere to pan across the blueprint drawing grid.'}
                </span>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Inspector, Room Library & Schedules */}
          <aside className="w-80 sm:w-96 bg-slate-950 border-l border-slate-800 flex flex-col z-20">
            {/* Sidebar Tab Header */}
            <div className="flex items-center border-b border-slate-800 p-2 gap-1 bg-slate-900/60">
              <button
                type="button"
                onClick={() => setSidebarTab('inspector')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  sidebarTab === 'inspector'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>Inspector</span>
              </button>

              <button
                type="button"
                onClick={() => setSidebarTab('templates')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  sidebarTab === 'templates'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-emerald-400" />
                <span>Room Library</span>
              </button>

              <button
                type="button"
                onClick={() => setSidebarTab('schedule')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  sidebarTab === 'schedule'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <ListTree className="w-3.5 h-3.5 text-amber-400" />
                <span>Takeoff ({walls.length})</span>
              </button>
            </div>

            {/* Tab 1: INSPECTOR & ACTIVE TOOL SETTINGS */}
            {sidebarTab === 'inspector' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
                {/* 1. If an element is selected */}
                {selectedElement ? (
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-950 text-indigo-300 font-bold uppercase text-[10px]">
                          {selectedElement.type}
                        </span>
                        <span className="font-bold text-slate-100 font-mono">{selectedElement.id}</span>
                      </div>

                      <button
                        type="button"
                        onClick={handleDeleteSelected}
                        className="p-1.5 rounded-lg text-rose-400 hover:text-white hover:bg-rose-900/60 transition-colors"
                        title="Delete Element (Backspace)"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Wall Properties */}
                    {activeSelectedWall && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-slate-400 block text-[11px] mb-1">Wall Name / ID:</label>
                          <input
                            type="text"
                            value={activeSelectedWall.name}
                            onChange={(e) => {
                              const updated = walls.map((w) =>
                                w.id === activeSelectedWall.id ? { ...w, name: e.target.value } : w
                              );
                              setWalls(updated);
                            }}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100 font-medium"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-slate-400 block text-[11px] mb-1">Type:</label>
                            <select
                              value={activeSelectedWall.type}
                              onChange={(e) => {
                                const newType = e.target.value as WallType;
                                const updated = walls.map((w) =>
                                  w.id === activeSelectedWall.id ? { ...w, type: newType } : w
                                );
                                setWalls(updated);
                              }}
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-slate-200"
                            >
                              <option value="Exterior Wall">Exterior 150mm</option>
                              <option value="Interior Wall">Interior 100mm</option>
                              <option value="Partition Wall">Partition 100mm</option>
                              <option value="Perimeter / Fence">Fence Boundary</option>
                              <option value="Firewall">Firewall 150mm</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-slate-400 block text-[11px] mb-1">Height (m):</label>
                            <input
                              type="number"
                              step="0.1"
                              min="1"
                              max="10"
                              value={activeSelectedWall.height}
                              onChange={(e) => {
                                const newH = Math.max(0.5, parseFloat(e.target.value) || 3.0);
                                const updated = walls.map((w) => {
                                  if (w.id === activeSelectedWall.id) {
                                    const gross = Number((w.length * newH).toFixed(2));
                                    const net = Math.max(0, Number((gross - w.openingArea).toFixed(2)));
                                    return {
                                      ...w,
                                      height: newH,
                                      grossArea: gross,
                                      netArea: net,
                                      baseCHB: Math.ceil(net / chbAreaSqM),
                                    };
                                  }
                                  return w;
                                });
                                setWalls(updated);
                              }}
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100 font-mono text-center"
                            />
                          </div>
                        </div>

                        <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 space-y-1 font-mono text-[11px]">
                          <div className="flex justify-between text-slate-400">
                            <span>Length:</span>
                            <span className="text-slate-200 font-bold">{activeSelectedWall.length.toFixed(2)} m</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Gross Area:</span>
                            <span className="text-slate-200">{activeSelectedWall.grossArea.toFixed(2)} m²</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Openings Deducted:</span>
                            <span className="text-amber-400">-{activeSelectedWall.openingArea.toFixed(2)} m²</span>
                          </div>
                          <div className="flex justify-between text-slate-300 font-bold pt-1 border-t border-slate-800">
                            <span>Net CHB Needed:</span>
                            <span className="text-emerald-400">{activeSelectedWall.baseCHB} pcs</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Door Properties */}
                    {activeSelectedDoor && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-slate-400 block text-[11px] mb-1">Door Label:</label>
                          <input
                            type="text"
                            value={activeSelectedDoor.label}
                            onChange={(e) => {
                              const updated = doors.map((d) =>
                                d.id === activeSelectedDoor.id ? { ...d, label: e.target.value } : d
                              );
                              setDoors(updated);
                            }}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-slate-400 block text-[11px] mb-1">Width (m):</label>
                            <input
                              type="number"
                              step="0.1"
                              value={activeSelectedDoor.widthM}
                              onChange={(e) => {
                                const newW = Math.max(0.4, parseFloat(e.target.value) || 0.9);
                                const updated = doors.map((d) =>
                                  d.id === activeSelectedDoor.id ? { ...d, widthM: newW } : d
                                );
                                setDoors(updated);
                              }}
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-slate-100 font-mono text-center"
                            />
                          </div>

                          <div>
                            <label className="text-slate-400 block text-[11px] mb-1">Height (m):</label>
                            <input
                              type="number"
                              step="0.1"
                              value={activeSelectedDoor.heightM || 2.1}
                              onChange={(e) => {
                                const newH = Math.max(1.0, parseFloat(e.target.value) || 2.1);
                                const updated = doors.map((d) =>
                                  d.id === activeSelectedDoor.id ? { ...d, heightM: newH } : d
                                );
                                setDoors(updated);
                              }}
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-slate-100 font-mono text-center"
                            />
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            const swings: ('left-in' | 'left-out' | 'right-in' | 'right-out')[] = [
                              'left-in',
                              'right-in',
                              'left-out',
                              'right-out',
                            ];
                            const curIdx = swings.indexOf((activeSelectedDoor.swingDirection as any) || 'left-in');
                            const nextSwing = swings[(curIdx + 1) % swings.length];
                            const updated = doors.map((d) =>
                              d.id === activeSelectedDoor.id ? { ...d, swingDirection: nextSwing } : d
                            );
                            setDoors(updated);
                          }}
                          className="w-full inline-flex items-center justify-center gap-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                          <span>Flip Swing Direction</span>
                        </button>
                      </div>
                    )}

                    {/* Window Properties */}
                    {activeSelectedWin && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-slate-400 block text-[11px] mb-1">Window Label:</label>
                          <input
                            type="text"
                            value={activeSelectedWin.label}
                            onChange={(e) => {
                              const updated = windows.map((w) =>
                                w.id === activeSelectedWin.id ? { ...w, label: e.target.value } : w
                              );
                              setWindows(updated);
                            }}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-slate-400 block text-[11px] mb-1">Width (m):</label>
                            <input
                              type="number"
                              step="0.1"
                              value={activeSelectedWin.widthM}
                              onChange={(e) => {
                                const newW = Math.max(0.4, parseFloat(e.target.value) || 1.2);
                                const updated = windows.map((w) =>
                                  w.id === activeSelectedWin.id ? { ...w, widthM: newW } : w
                                );
                                setWindows(updated);
                              }}
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-slate-100 font-mono text-center"
                            />
                          </div>

                          <div>
                            <label className="text-slate-400 block text-[11px] mb-1">Height (m):</label>
                            <input
                              type="number"
                              step="0.1"
                              value={activeSelectedWin.heightM}
                              onChange={(e) => {
                                const newH = Math.max(0.4, parseFloat(e.target.value) || 1.2);
                                const updated = windows.map((w) =>
                                  w.id === activeSelectedWin.id ? { ...w, heightM: newH } : w
                                );
                                setWindows(updated);
                              }}
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-slate-100 font-mono text-center"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Room Properties */}
                    {activeSelectedRoom && (
                      <div className="space-y-3">
                        <div>
                          <label className="text-slate-400 block text-[11px] mb-1">Room Name:</label>
                          <input
                            type="text"
                            value={activeSelectedRoom.name}
                            onChange={(e) => {
                              const updated = rooms.map((r) =>
                                r.id === activeSelectedRoom.id ? { ...r, name: e.target.value } : r
                              );
                              setRooms(updated);
                            }}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100"
                          />
                        </div>

                        <div>
                          <label className="text-slate-400 block text-[11px] mb-1">Floor Area (m²):</label>
                          <input
                            type="number"
                            step="0.5"
                            value={activeSelectedRoom.customArea || 16.0}
                            onChange={(e) => {
                              const newA = Math.max(1.0, parseFloat(e.target.value) || 16.0);
                              const updated = rooms.map((r) =>
                                r.id === activeSelectedRoom.id ? { ...r, customArea: newA } : r
                              );
                              setRooms(updated);
                            }}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100 font-mono text-center"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* 2. Active Tool Defaults when nothing is selected */
                  <div className="space-y-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <h4 className="font-bold text-slate-200 text-xs flex items-center gap-2">
                        <PenTool className="w-3.5 h-3.5 text-cyan-400" />
                        Wall Tool Settings
                      </h4>

                      <div>
                        <label className="text-slate-400 block text-[11px] mb-1">Default Wall Type:</label>
                        <select
                          value={currentWallType}
                          onChange={(e) => setCurrentWallType(e.target.value as WallType)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100 font-medium"
                        >
                          <option value="Exterior Wall">Exterior Wall (150mm / 6")</option>
                          <option value="Interior Wall">Interior Wall (100mm / 4")</option>
                          <option value="Partition Wall">Partition Wall (100mm)</option>
                          <option value="Perimeter / Fence">Perimeter Fence Boundary</option>
                          <option value="Firewall">Firewall (150mm)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-400 block text-[11px] mb-1">Height (Clear Height):</label>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {WALL_HEIGHT_PRESETS.map((h) => (
                            <button
                              key={h}
                              type="button"
                              onClick={() => setCurrentWallHeight(h)}
                              className={`px-2 py-1 rounded-lg font-mono text-xs font-bold transition-colors ${
                                currentWallHeight === h
                                  ? 'bg-cyan-600 text-white shadow-sm'
                                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {h.toFixed(1)}m
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                      <h4 className="font-bold text-slate-200 text-xs flex items-center gap-2">
                        <DoorOpen className="w-3.5 h-3.5 text-amber-400" />
                        Door & Window Presets
                      </h4>

                      <div>
                        <label className="text-slate-400 block text-[11px] mb-1">Selected Door Size:</label>
                        <select
                          value={selectedDoorPreset.label}
                          onChange={(e) => {
                            const found = DOOR_PRESETS.find((p) => p.label === e.target.value);
                            if (found) setSelectedDoorPreset(found);
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100"
                        >
                          {DOOR_PRESETS.map((dp) => (
                            <option key={dp.label} value={dp.label}>
                              {dp.label} ({dp.width}×{dp.height}m)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-400 block text-[11px] mb-1">Selected Window Size:</label>
                        <select
                          value={selectedWindowPreset.label}
                          onChange={(e) => {
                            const found = WINDOW_PRESETS.find((p) => p.label === e.target.value);
                            if (found) setSelectedWindowPreset(found);
                          }}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-slate-100"
                        >
                          {WINDOW_PRESETS.map((wp) => (
                            <option key={wp.label} value={wp.label}>
                              {wp.label} ({wp.width}×{wp.height}m)
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: 1-CLICK QUICK ROOM LIBRARY */}
            {sidebarTab === 'templates' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                <p className="text-slate-400 text-[11px]">
                  Click any pre-dimensioned room template to immediately drop it into your floor plan canvas:
                </p>

                <div className="grid grid-cols-1 gap-2.5">
                  {QUICK_ROOM_TEMPLATES.map((tmpl) => (
                    <button
                      key={tmpl.name}
                      type="button"
                      onClick={() => handleDropRoomTemplate(tmpl)}
                      className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 transition-all text-left group shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl p-1.5 rounded-xl bg-slate-950 border border-slate-800">{tmpl.icon}</span>
                        <div>
                          <div className="font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                            {tmpl.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {tmpl.widthM.toFixed(1)}m × {tmpl.heightM.toFixed(1)}m
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-cyan-400 text-xs">{tmpl.area.toFixed(1)} m²</span>
                        <div className="text-[9px] text-slate-500 font-mono">+ 4 Walls</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 3: TAKEOFF SCHEDULE OF ELEMENTS */}
            {sidebarTab === 'schedule' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between text-slate-400 text-[11px] pb-1 border-b border-slate-800">
                  <span>Wall Schedule ({walls.length})</span>
                  <span>Net CHB</span>
                </div>

                <div className="space-y-1.5">
                  {walls.map((w) => (
                    <div
                      key={w.id}
                      onClick={() => setSelectedElement({ type: 'wall', id: w.id })}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        selectedElement?.id === w.id
                          ? 'bg-cyan-950/60 border-cyan-500 text-cyan-200'
                          : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold font-mono text-[11px]">{w.id} • {w.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {w.length}m × {w.height}m ({w.netArea}m²)
                        </div>
                      </div>

                      <span className="font-mono font-bold text-emerald-400 text-xs">
                        {w.baseCHB} pcs
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* Bottom Real-Time CHB Takeoff Dashboard Bar */}
        <footer className="bg-slate-950 border-t border-slate-800 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap font-sans">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Total Walls:</span>
              <span className="font-mono font-bold text-slate-100 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                {walls.length} units ({totalWallLength.toFixed(1)}m length)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Net Masonry Area:</span>
              <span className="font-mono font-bold text-cyan-400 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                {totalNetArea.toFixed(2)} m²
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Openings:</span>
              <span className="font-mono font-medium text-amber-400 bg-slate-900 px-2.5 py-1 rounded-xl border border-slate-800">
                -{totalOpeningArea.toFixed(2)} m² ({doors.length} doors, {windows.length} windows)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-300 font-bold">Estimated CHB Needed:</span>
              <span className="font-mono font-black text-emerald-400 bg-emerald-950/80 border border-emerald-700/80 px-3 py-1 rounded-xl text-sm shadow-sm">
                {finalCHBWithWaste.toLocaleString()} pcs ({wastePercentage}% waste)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyToProject}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-950 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Blueprint &amp; Calculate</span>
            </button>
          </div>
        </footer>
      </div>

      {/* Keyboard Shortcuts Cheat Sheet Modal */}
      {showShortcutsModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                Blueprint Maker Keyboard Shortcuts
              </h3>
              <button
                type="button"
                onClick={() => setShowShortcutsModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-300">Select / Edit Tool</span>
                <kbd className="bg-slate-800 px-2 py-0.5 rounded text-cyan-400 font-mono font-bold">V</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-300">Draw Wall Tool</span>
                <kbd className="bg-slate-800 px-2 py-0.5 rounded text-cyan-400 font-mono font-bold">W</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-300">Draw Room Box</span>
                <kbd className="bg-slate-800 px-2 py-0.5 rounded text-cyan-400 font-mono font-bold">R</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-300">Add Door Opening</span>
                <kbd className="bg-slate-800 px-2 py-0.5 rounded text-cyan-400 font-mono font-bold">D</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-300">Add Window Opening</span>
                <kbd className="bg-slate-800 px-2 py-0.5 rounded text-cyan-400 font-mono font-bold">N</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-300">Room Stamp Tag</span>
                <kbd className="bg-slate-800 px-2 py-0.5 rounded text-cyan-400 font-mono font-bold">T</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-300">Dimension Line</span>
                <kbd className="bg-slate-800 px-2 py-0.5 rounded text-cyan-400 font-mono font-bold">M</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-300">Pan Canvas</span>
                <kbd className="bg-slate-800 px-2 py-0.5 rounded text-cyan-400 font-mono font-bold">H or Space+Drag</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-300">Delete Selected Element</span>
                <kbd className="bg-slate-800 px-2 py-0.5 rounded text-rose-400 font-mono font-bold">Delete / Backspace</kbd>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-300">Undo Action</span>
                <kbd className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono font-bold">Ctrl + Z</kbd>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-300">Redo Action</span>
                <kbd className="bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono font-bold">Ctrl + Y</kbd>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowShortcutsModal(false)}
              className="w-full py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Math helper for distance from point to line segment
function distToSegment(
  p: { x: number; y: number },
  v: { x: number; y: number },
  w: { x: number; y: number }
): number {
  const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
  if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const proj = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
  return Math.hypot(p.x - proj.x, p.y - proj.y);
}
