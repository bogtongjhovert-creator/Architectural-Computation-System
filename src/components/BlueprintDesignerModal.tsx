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
  | 'column';

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
];

const DOOR_PRESETS = [
  { label: 'Main Door (0.90 × 2.10m)', width: 0.9, height: 2.1, type: 'door' },
  { label: 'Bedroom Door (0.80 × 2.10m)', width: 0.8, height: 2.1, type: 'door' },
  { label: 'T&B Door (0.70 × 2.10m)', width: 0.7, height: 2.1, type: 'door' },
  { label: 'Double French Door (1.60 × 2.10m)', width: 1.6, height: 2.1, type: 'door' },
  { label: 'Sliding Patio Door (1.80 × 2.10m)', width: 1.8, height: 2.1, type: 'door' },
  { label: 'Vehicular Gate (3.00 × 2.00m)', width: 3.0, height: 2.0, type: 'door' },
];

const WINDOW_PRESETS = [
  { label: 'Standard Window (1.20 × 1.20m)', width: 1.2, height: 1.2, type: 'window' },
  { label: 'Wide Living Window (1.50 × 1.20m)', width: 1.5, height: 1.2, type: 'window' },
  { label: 'Picture Window (2.00 × 1.50m)', width: 2.0, height: 1.5, type: 'window' },
  { label: 'Kitchen Counter Window (1.00 × 0.90m)', width: 1.0, height: 0.9, type: 'window' },
  { label: 'Bathroom Awning (0.60 × 0.60m)', width: 0.6, height: 0.6, type: 'window' },
];

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
  const [planTitle, setPlanTitle] = useState<string>('Custom Floor Plan & Masonry Layout');

  // Snapping and constraints
  const [gridSnapMeters, setGridSnapMeters] = useState<number>(0.5); // 0.5m snap
  const [isOrthoLocked, setIsOrthoLocked] = useState<boolean>(true); // 90° angle lock

  // Canvas Viewport Pan/Zoom
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Interactive Drawing states
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Sync state to history
  const pushToHistory = useCallback(
    (newState: DesignerPlanState) => {
      const nextHistory = history.slice(0, historyIndex + 1);
      nextHistory.push(newState);
      if (nextHistory.length > 25) nextHistory.shift();
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
    }
  };

  // Helper to snap canvas pixel coordinate to grid meters
  const snapToGrid = useCallback(
    (pixelVal: number): number => {
      if (gridSnapMeters <= 0) return Math.round(pixelVal);
      const snapPx = gridSnapMeters * SCALE_PPM;
      return Math.round(pixelVal / snapPx) * snapPx;
    },
    [gridSnapMeters]
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
    pushToHistory(preset.state);
  };

  // Clear canvas to blank
  const handleClearCanvas = () => {
    if (window.confirm('Clear blueprint canvas and start with a blank drawing grid?')) {
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
      pushToHistory(blankState);
    }
  };

  // Canvas Mouse Coordinates Transformer
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const rawX = (e.clientX - rect.left - pan.x) / zoom;
    const rawY = (e.clientY - rect.top - pan.y) / zoom;
    return {
      x: snapToGrid(rawX),
      y: snapToGrid(rawY),
      rawX,
      rawY,
    };
  };

  // Mouse Down Event Handler
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);

    // Middle mouse or Space pan
    if (e.button === 1 || activeTool === 'select' && e.shiftKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (e.button !== 0) return;

    if (activeTool === 'wall' || activeTool === 'room' || activeTool === 'dimension') {
      setDrawStart({ x: coords.x, y: coords.y });
      setDrawCurrent({ x: coords.x, y: coords.y });
      return;
    }

    if (activeTool === 'door') {
      // Add door at click location
      const newDoor: DesignerDoor = {
        id: `door-${Date.now()}`,
        x: coords.x,
        y: coords.y,
        widthM: selectedDoorPreset.width,
        heightM: selectedDoorPreset.height,
        label: selectedDoorPreset.label.split(' ')[0] + ` (${selectedDoorPreset.width}m)`,
        swingDirection: 'left-in',
      };

      const updatedDoors = [...doors, newDoor];
      setDoors(updatedDoors);

      // Add door opening deduction to closest wall
      const updatedWalls = walls.map((w) => {
        if (w.tracePoints && w.tracePoints.length >= 2) {
          const p1 = w.tracePoints[0];
          const p2 = w.tracePoints[1];
          const dist = distToSegment({ x: coords.x, y: coords.y }, p1, p2);
          if (dist < 25) {
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
        }
        return w;
      });

      setWalls(updatedWalls);
      pushToHistory({ walls: updatedWalls, doors: updatedDoors, windows, rooms, dimensions, columns });
      return;
    }

    if (activeTool === 'window') {
      const newWin: DesignerWindow = {
        id: `win-${Date.now()}`,
        x: coords.x,
        y: coords.y,
        widthM: selectedWindowPreset.width,
        heightM: selectedWindowPreset.height,
        label: selectedWindowPreset.label.split(' ')[0] + ` (${selectedWindowPreset.width}m)`,
      };

      const updatedWins = [...windows, newWin];
      setWindows(updatedWins);

      // Add window opening deduction to closest wall
      const updatedWalls = walls.map((w) => {
        if (w.tracePoints && w.tracePoints.length >= 2) {
          const p1 = w.tracePoints[0];
          const p2 = w.tracePoints[1];
          const dist = distToSegment({ x: coords.x, y: coords.y }, p1, p2);
          if (dist < 25) {
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
        }
        return w;
      });

      setWalls(updatedWalls);
      pushToHistory({ walls: updatedWalls, doors, windows: updatedWins, rooms, dimensions, columns });
      return;
    }

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
      return;
    }

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

    if (drawStart && drawCurrent) {
      const dx = drawCurrent.x - drawStart.x;
      const dy = drawCurrent.y - drawStart.y;
      const pixelDist = Math.sqrt(dx * dx + dy * dy);

      if (pixelDist > 10) {
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
        } else if (activeTool === 'room') {
          // Create 4 connected walls for a rectangular room
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
    setZoom((z) => Math.max(0.4, Math.min(3.0, Number((z * factor).toFixed(2)))));
  };

  // Render Blueprint CAD Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Palette
    const isBp = blueprintTheme === 'blueprint';
    const isDark = blueprintTheme === 'darkcad';
    const bgColor = isBp ? '#0c2340' : isDark ? '#0f172a' : '#ffffff';
    const gridMinorColor = isBp ? 'rgba(56, 189, 248, 0.12)' : isDark ? 'rgba(71, 85, 105, 0.25)' : 'rgba(226, 232, 240, 0.8)';
    const gridMajorColor = isBp ? 'rgba(56, 189, 248, 0.3)' : isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(203, 213, 225, 0.9)';
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

    // Draw Dynamic Grid
    const snapPx = gridSnapMeters * SCALE_PPM;
    const majorPx = snapPx * 4; // Every 2 meters

    ctx.lineWidth = 0.5;
    ctx.strokeStyle = gridMinorColor;
    for (let x = -2000; x <= 4000; x += snapPx) {
      ctx.beginPath();
      ctx.moveTo(x, -2000);
      ctx.lineTo(x, 4000);
      ctx.stroke();
    }
    for (let y = -2000; y <= 4000; y += snapPx) {
      ctx.beginPath();
      ctx.moveTo(-2000, y);
      ctx.lineTo(4000, y);
      ctx.stroke();
    }

    ctx.lineWidth = 1;
    ctx.strokeStyle = gridMajorColor;
    for (let x = -2000; x <= 4000; x += majorPx) {
      ctx.beginPath();
      ctx.moveTo(x, -2000);
      ctx.lineTo(x, 4000);
      ctx.stroke();
    }
    for (let y = -2000; y <= 4000; y += majorPx) {
      ctx.beginPath();
      ctx.moveTo(-2000, y);
      ctx.lineTo(4000, y);
      ctx.stroke();
    }

    // Origin Axes Indicator (0,0)
    ctx.strokeStyle = isBp ? 'rgba(56, 189, 248, 0.6)' : '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -20);
    ctx.lineTo(0, 20);
    ctx.moveTo(-20, 0);
    ctx.lineTo(20, 0);
    ctx.stroke();

    // 1. Draw Rooms
    rooms.forEach((r) => {
      if (r.widthM && r.heightM) {
        ctx.fillStyle = isBp ? 'rgba(56, 189, 248, 0.05)' : isDark ? 'rgba(96, 165, 250, 0.06)' : 'rgba(241, 245, 249, 0.7)';
        ctx.fillRect(
          r.x - (r.widthM * SCALE_PPM) / 2,
          r.y - (r.heightM * SCALE_PPM) / 2,
          r.widthM * SCALE_PPM,
          r.heightM * SCALE_PPM
        );
      }

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 12px "Courier New", monospace, sans-serif';
      ctx.fillStyle = textPrimary;
      ctx.fillText(r.name, r.x, r.y - 6);

      if (r.customArea) {
        ctx.font = '10px monospace, sans-serif';
        ctx.fillStyle = textSecondary;
        ctx.fillText(`${r.customArea.toFixed(1)} m²`, r.x, r.y + 8);
      }
    });

    // 2. Draw Columns
    columns.forEach((c) => {
      const size = c.sizeM * SCALE_PPM;
      ctx.fillStyle = isBp ? '#0284c7' : isDark ? '#3b82f6' : '#1e293b';
      ctx.strokeStyle = textPrimary;
      ctx.lineWidth = 1.5;
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
      const isExt = w.type === 'Exterior Wall' || w.type === 'Firewall' || w.type === 'Perimeter / Fence';
      const wallThickness = isExt ? 8 : 5;

      ctx.strokeStyle = isExt ? wallExtColor : wallIntColor;
      ctx.lineWidth = wallThickness;
      ctx.lineCap = 'square';

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      // Wall midpoint label
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;

      ctx.fillStyle = isBp ? '#0369a1' : isDark ? '#1e293b' : '#f8fafc';
      ctx.strokeStyle = isExt ? wallExtColor : wallIntColor;
      ctx.lineWidth = 1;
      ctx.fillRect(midX - 22, midY - 9, 44, 18);
      ctx.strokeRect(midX - 22, midY - 9, 44, 18);

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = textPrimary;
      ctx.fillText(`${w.id} ${w.length.toFixed(1)}m`, midX, midY);
    });

    // 4. Draw Windows
    windows.forEach((win) => {
      const width = win.widthM * SCALE_PPM;
      ctx.fillStyle = bgColor;
      ctx.fillRect(win.x - width / 2, win.y - 4, width, 8);

      ctx.strokeStyle = isBp ? '#38bdf8' : '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(win.x - width / 2, win.y - 4, width, 8);

      ctx.beginPath();
      ctx.moveTo(win.x - width / 2, win.y);
      ctx.lineTo(win.x + width / 2, win.y);
      ctx.stroke();

      ctx.font = '8px monospace';
      ctx.fillStyle = textSecondary;
      ctx.textAlign = 'center';
      ctx.fillText(win.label || 'WIN', win.x, win.y - 7);
    });

    // 5. Draw Doors
    doors.forEach((door) => {
      const width = door.widthM * SCALE_PPM;
      ctx.fillStyle = bgColor;
      ctx.fillRect(door.x - width / 2, door.y - 5, width, 10);

      // Door Leaf
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(door.x - width / 2, door.y);
      ctx.lineTo(door.x - width / 2, door.y - width);
      ctx.stroke();

      // Swing Arc
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(door.x - width / 2, door.y, width, -Math.PI / 2, 0, false);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.font = '8px monospace';
      ctx.fillStyle = textSecondary;
      ctx.textAlign = 'center';
      ctx.fillText(door.label || 'DOOR', door.x, door.y + 14);
    });

    // 6. Draw Dimensions
    dimensions.forEach((dim) => {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.moveTo(dim.p1.x, dim.p1.y);
      ctx.lineTo(dim.p2.x, dim.p2.y);
      ctx.stroke();

      const tick = 5;
      ctx.beginPath();
      ctx.moveTo(dim.p1.x - tick, dim.p1.y + tick);
      ctx.lineTo(dim.p1.x + tick, dim.p1.y - tick);
      ctx.moveTo(dim.p2.x - tick, dim.p2.y + tick);
      ctx.lineTo(dim.p2.x + tick, dim.p2.y - tick);
      ctx.stroke();

      const midX = (dim.p1.x + dim.p2.x) / 2;
      const midY = (dim.p1.y + dim.p2.y) / 2;
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#facc15';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(dim.label, midX, midY - 2);
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
        const liveMeters = (Math.sqrt(dx * dx + dy * dy) / SCALE_PPM).toFixed(2);

        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${liveMeters} m`, (drawStart.x + drawCurrent.x) / 2, (drawStart.y + drawCurrent.y) / 2 - 8);
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
  ]);

  // Derived Totals
  const totalWallLength = walls.reduce((sum, w) => sum + w.length, 0);
  const totalGrossArea = walls.reduce((sum, w) => sum + w.grossArea, 0);
  const totalOpeningArea = walls.reduce((sum, w) => sum + w.openingArea, 0);
  const totalNetArea = Math.max(0, totalGrossArea - totalOpeningArea);
  const baseCHBTotal = Math.ceil(totalNetArea / chbAreaSqM);
  const finalCHBWithWaste = Math.ceil(baseCHBTotal * (1 + wastePercentage / 100));
  const estimatedFloorArea = rooms.reduce((sum, r) => sum + (r.customArea || 0), 0) || 72.0;

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

  // Download high-res PNG image of the created blueprint
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
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-7xl h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header Bar */}
        <div className="bg-slate-950 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Title & Presets */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-600 text-white font-bold">
                <PenTool className="w-4 h-4" />
              </div>
              <div>
                <input
                  type="text"
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  className="bg-transparent border-b border-transparent hover:border-slate-600 focus:border-cyan-500 text-sm font-bold text-slate-100 focus:outline-none px-1 py-0.5"
                  title="Click to rename blueprint"
                />
                <div className="text-[10px] text-slate-400 font-mono">
                  In-App Architectural Blueprint CAD Studio • 1m = {SCALE_PPM}px
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
                  className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                >
                  {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadBlueprintImage}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors"
              title="Download high-resolution architectural blueprint PNG"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              Download Plan
            </button>

            <button
              id="btn-apply-designer-blueprint"
              type="button"
              onClick={handleApplyToProject}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-950 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Use as Project Blueprint
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Secondary CAD Toolbar */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Main Drawing Tools */}
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setActiveTool('wall')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${
                activeTool === 'wall'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              Draw Wall
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('room')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${
                activeTool === 'room'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              Draw Room (Box)
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('door')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${
                activeTool === 'door'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <DoorOpen className="w-3.5 h-3.5" />
              Add Door
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('window')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${
                activeTool === 'window'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Add Window
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('room_label')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${
                activeTool === 'room_label'
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Room Stamp
            </button>

            <button
              type="button"
              onClick={() => setActiveTool('dimension')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-colors ${
                activeTool === 'dimension'
                  ? 'bg-yellow-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Ruler className="w-3.5 h-3.5" />
              Dimension Line
            </button>
          </div>

          {/* Active Tool Modifier Sub-Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {activeTool === 'wall' && (
              <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px]">Wall Type:</span>
                <select
                  value={currentWallType}
                  onChange={(e) => setCurrentWallType(e.target.value as WallType)}
                  className="bg-slate-900 text-slate-100 text-xs px-2 py-0.5 rounded border border-slate-700 font-medium"
                >
                  <option value="Exterior Wall">Exterior Wall (150mm)</option>
                  <option value="Interior Wall">Interior Wall (100mm)</option>
                  <option value="Partition Wall">Partition Wall (100mm)</option>
                  <option value="Perimeter / Fence">Perimeter Fence</option>
                  <option value="Firewall">Firewall (150mm)</option>
                </select>

                <span className="text-slate-400 text-[11px] ml-1">Height:</span>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="10"
                  value={currentWallHeight}
                  onChange={(e) => setCurrentWallHeight(parseFloat(e.target.value) || 3.0)}
                  className="w-14 bg-slate-900 text-slate-100 text-xs px-1.5 py-0.5 rounded border border-slate-700 font-mono text-center"
                />
                <span className="text-slate-400 text-[11px]">m</span>
              </div>
            )}

            {activeTool === 'door' && (
              <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px]">Door Size:</span>
                <select
                  value={selectedDoorPreset.label}
                  onChange={(e) => {
                    const found = DOOR_PRESETS.find((p) => p.label === e.target.value);
                    if (found) setSelectedDoorPreset(found);
                  }}
                  className="bg-slate-900 text-slate-100 text-xs px-2 py-0.5 rounded border border-slate-700"
                >
                  {DOOR_PRESETS.map((dp) => (
                    <option key={dp.label} value={dp.label}>
                      {dp.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeTool === 'window' && (
              <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px]">Window Size:</span>
                <select
                  value={selectedWindowPreset.label}
                  onChange={(e) => {
                    const found = WINDOW_PRESETS.find((p) => p.label === e.target.value);
                    if (found) setSelectedWindowPreset(found);
                  }}
                  className="bg-slate-900 text-slate-100 text-xs px-2 py-0.5 rounded border border-slate-700"
                >
                  {WINDOW_PRESETS.map((wp) => (
                    <option key={wp.label} value={wp.label}>
                      {wp.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {activeTool === 'room_label' && (
              <div className="flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-slate-400 text-[11px]">Room Label:</span>
                <select
                  value={selectedRoomName}
                  onChange={(e) => setSelectedRoomName(e.target.value)}
                  className="bg-slate-900 text-slate-100 text-xs px-2 py-0.5 rounded border border-slate-700"
                >
                  {ROOM_NAMES.map((rn) => (
                    <option key={rn} value={rn}>
                      {rn}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Grid Snap & Ortho Toggle */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setIsOrthoLocked(!isOrthoLocked)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                  isOrthoLocked
                    ? 'bg-cyan-900/60 text-cyan-300 border border-cyan-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Toggle Orthogonal 90-degree Lock"
              >
                Ortho {isOrthoLocked ? 'ON' : 'OFF'}
              </button>

              <select
                value={gridSnapMeters}
                onChange={(e) => setGridSnapMeters(parseFloat(e.target.value))}
                className="bg-slate-900 text-slate-300 text-[11px] px-1.5 py-0.5 rounded border border-slate-700"
                title="Grid Snap interval"
              >
                <option value="0.25">Snap 0.25m</option>
                <option value="0.5">Snap 0.50m</option>
                <option value="1.0">Snap 1.00m</option>
                <option value="0">No Snap</option>
              </select>

              {/* Theme Picker */}
              <select
                value={blueprintTheme}
                onChange={(e) => setBlueprintTheme(e.target.value as ThemeMode)}
                className="bg-slate-900 text-slate-300 text-[11px] px-1.5 py-0.5 rounded border border-slate-700"
              >
                <option value="blueprint">Classic Blue</option>
                <option value="darkcad">Dark CAD</option>
                <option value="monochrome">White Blueprint</option>
              </select>

              {/* Clear */}
              <button
                type="button"
                onClick={handleClearCanvas}
                className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40"
                title="Clear Blueprint"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Central Drawing Viewport */}
        <div className="relative flex-1 bg-slate-950 overflow-hidden flex items-center justify-center select-none">
          <canvas
            ref={canvasRef}
            width={1200}
            height={700}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            className="w-full h-full cursor-crosshair block"
          />

          {/* Floating Instructions Pill */}
          <div className="absolute top-3 left-4 pointer-events-none bg-slate-950/85 backdrop-blur-xs border border-slate-800 rounded-lg px-3 py-1.5 text-[11px] text-slate-300 flex items-center gap-2 shadow-lg">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>
              {activeTool === 'wall' && 'Click and drag on the grid to draw wall segments with automatic length calculation.'}
              {activeTool === 'room' && 'Click and drag diagonally to generate 4 connected room walls and floor area.'}
              {activeTool === 'door' && 'Click any wall line to install a door with architectural swing arc and deduction.'}
              {activeTool === 'window' && 'Click any wall line to install a window opening with automatic CHB deduction.'}
              {activeTool === 'room_label' && 'Click inside any room to drop an architectural label tag.'}
              {activeTool === 'dimension' && 'Click and drag to place architectural dimension markers.'}
            </span>
          </div>

          {/* Floating Live Coordinates readout */}
          <div className="absolute bottom-3 left-4 pointer-events-none bg-slate-950/85 backdrop-blur-xs border border-slate-800 rounded-lg px-3 py-1 text-[11px] font-mono text-cyan-300 shadow-lg flex items-center gap-3">
            <span>X: {(cursorPos.x / SCALE_PPM).toFixed(2)}m</span>
            <span>Y: {(cursorPos.y / SCALE_PPM).toFixed(2)}m</span>
            <span>Zoom: {Math.round(zoom * 100)}%</span>
          </div>
        </div>

        {/* Bottom Real-Time CHB Takeoff Summary Bar */}
        <div className="bg-slate-950 border-t border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Total Walls:</span>
              <span className="font-mono font-bold text-slate-100 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {walls.length} walls ({totalWallLength.toFixed(1)}m length)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Net Masonry Area:</span>
              <span className="font-mono font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {totalNetArea.toFixed(2)} m²
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Openings Deducted:</span>
              <span className="font-mono font-medium text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                -{totalOpeningArea.toFixed(2)} m² ({doors.length} doors, {windows.length} windows)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Estimated CHB Needed:</span>
              <span className="font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-700/60 px-2.5 py-0.5 rounded text-sm">
                {finalCHBWithWaste.toLocaleString()} pcs ({wastePercentage}% waste)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyToProject}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-md shadow-cyan-950 transition-all"
            >
              <CheckCircle2 className="w-4 h-4" />
              Apply Blueprint & Calculate
            </button>
          </div>
        </div>
      </div>
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
  if (l2 === 0) return Math.sqrt((p.x - v.x) * (p.x - v.x) + (p.y - v.y) * (p.y - v.y));
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const proj = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) };
  return Math.sqrt((p.x - proj.x) * (p.x - proj.x) + (p.y - proj.y) * (p.y - proj.y));
}
