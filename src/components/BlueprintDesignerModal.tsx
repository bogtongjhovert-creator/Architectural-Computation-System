import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Wall,
  Opening,
  DesignerDoor,
  DesignerWindow,
  DesignerRoomLabel,
  DesignerDimension,
  DesignerColumn,
  DesignerPlanState,
  DesignerRoomShape,
  WallType,
} from '../types';
import {
  DESIGNER_PRESETS,
  generateBlueprintDataUrl,
  ThemeMode,
} from '../utils/blueprintDesignerPresets';
import {
  SCALE_PPM,
  ARCHITECTURAL_ROOM_TEMPLATES,
  RoomShapeTemplate,
  buildRoomShapeWalls,
  distToSegment,
} from '../utils/shapePlanner';
import { ShapeInspectorPanel } from './ShapeInspectorPanel';
import { ShapePaletteDrawer } from './ShapePaletteDrawer';
import {
  Square,
  PenTool,
  DoorOpen,
  Layers,
  Columns,
  Tag,
  Ruler,
  MousePointer2,
  Hand,
  Undo2,
  Redo2,
  Grid,
  Magnet,
  Maximize,
  Download,
  CheckCircle2,
  X,
  HelpCircle,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  RotateCw,
  Box,
  Compass,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onApplyBlueprint: (dataUrl: string, title: string, walls: Wall[], floorArea: number) => void;
  existingWalls?: Wall[];
  chbAreaSqM?: number;
  wastePercentage?: number;
}

export type DrawTool =
  | 'select'
  | 'shape_rect'
  | 'shape_l'
  | 'partition'
  | 'door'
  | 'window'
  | 'column'
  | 'dimension'
  | 'pan';

export interface SelectedElement {
  type: 'shape' | 'wall' | 'door' | 'window' | 'room' | 'column' | 'dimension';
  id: string;
}

const DOOR_PRESETS = [
  { label: 'Main Entrance Door', width: 0.9, height: 2.1, code: 'D-1' },
  { label: 'Bedroom Single Door', width: 0.8, height: 2.1, code: 'D-2' },
  { label: 'T&B Bathroom Door', width: 0.7, height: 2.1, code: 'D-3' },
  { label: 'Double French Door', width: 1.6, height: 2.1, code: 'D-4' },
  { label: 'Sliding Patio Door', width: 1.8, height: 2.1, code: 'D-5' },
];

const WINDOW_PRESETS = [
  { label: 'Standard Window', width: 1.2, height: 1.2, code: 'W-1' },
  { label: 'Wide Living Window', width: 1.5, height: 1.2, code: 'W-2' },
  { label: 'Picture Window', width: 2.0, height: 1.5, code: 'W-3' },
  { label: 'Kitchen Window', width: 1.0, height: 0.9, code: 'W-4' },
  { label: 'Bathroom Awning', width: 0.6, height: 0.6, code: 'W-5' },
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

  // Initialize room shapes & state from presets
  const [shapes, setShapes] = useState<DesignerRoomShape[]>(() => [
    {
      id: 'shape-living',
      name: 'Living & Dining Area',
      kind: 'rectangle',
      x: 360,
      y: 280,
      widthM: 5.0,
      heightM: 4.5,
      wallHeightM: 3.0,
      wallType: 'Exterior Wall',
    },
    {
      id: 'shape-master',
      name: 'Master Bedroom',
      kind: 'rectangle',
      x: 580,
      y: 280,
      widthM: 4.0,
      heightM: 4.0,
      wallHeightM: 3.0,
      wallType: 'Exterior Wall',
    },
  ]);

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

  // Undo / Redo History
  const [history, setHistory] = useState<DesignerPlanState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // UI / Tool Controls - Shape is the default primary tool!
  const [activeTool, setActiveTool] = useState<DrawTool>('shape_rect');
  const [currentWallType, setCurrentWallType] = useState<WallType>('Exterior Wall');
  const [currentWallHeight, setCurrentWallHeight] = useState<number>(3.0);
  const [selectedDoorPreset, setSelectedDoorPreset] = useState(DOOR_PRESETS[0]);
  const [selectedWindowPreset, setSelectedWindowPreset] = useState(WINDOW_PRESETS[0]);
  const [blueprintTheme, setBlueprintTheme] = useState<ThemeMode>('blueprint');
  const [planTitle, setPlanTitle] = useState<string>('Custom Architectural Floor Plan');

  // Snapping and constraints
  const [gridSnapMeters, setGridSnapMeters] = useState<number>(0.5);
  const [isOrthoLocked, setIsOrthoLocked] = useState<boolean>(true);
  const [magneticSnap, setMagneticSnap] = useState<boolean>(true);

  // Viewport Pan/Zoom
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Interactive Drawing & Selection states
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [drawCurrent, setDrawCurrent] = useState<{ x: number; y: number } | null>(null);
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>({
    type: 'shape',
    id: 'shape-living',
  });
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [snapInfo, setSnapInfo] = useState<{ x: number; y: number; type: 'corner' | 'edge' | 'grid' } | null>(null);

  // Dragging & Resizing shapes
  const [isDraggingShape, setIsDraggingShape] = useState<boolean>(false);
  const [dragShapeStartOffset, setDragShapeStartOffset] = useState<{ x: number; y: number } | null>(null);
  const [isResizingShape, setIsResizingShape] = useState<boolean>(false);
  const [resizeHandle, setResizeHandle] = useState<'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'e' | 'w' | null>(null);

  // Sidebar navigation tab
  const [sidebarTab, setSidebarTab] = useState<'palette' | 'inspector' | 'templates' | 'schedule'>('palette');
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);

  // Push to history
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
      if (prev.shapes) setShapes(prev.shapes);
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
      if (next.shapes) setShapes(next.shapes);
      setHistoryIndex(historyIndex + 1);
      setSelectedElement(null);
    }
  };

  // Snapping helper with shape corner and edge alignment
  const snapToGridAndShapes = useCallback(
    (rawX: number, rawY: number): { x: number; y: number; snapType: 'corner' | 'edge' | 'grid' } => {
      if (magneticSnap) {
        const SNAP_RADIUS_PX = 16;
        // Check shape corners and edges
        for (const s of shapes) {
          const wPx = s.widthM * SCALE_PPM;
          const hPx = s.heightM * SCALE_PPM;
          const x1 = s.x - wPx / 2;
          const x2 = s.x + wPx / 2;
          const y1 = s.y - hPx / 2;
          const y2 = s.y + hPx / 2;

          const corners = [
            { x: x1, y: y1 },
            { x: x2, y: y1 },
            { x: x2, y: y2 },
            { x: x1, y: y2 },
          ];

          for (const c of corners) {
            if (Math.hypot(rawX - c.x, rawY - c.y) < SNAP_RADIUS_PX) {
              return { x: c.x, y: c.y, snapType: 'corner' };
            }
          }

          // Edge snaps
          if (Math.abs(rawX - x1) < SNAP_RADIUS_PX && rawY >= y1 - 20 && rawY <= y2 + 20) {
            return { x: x1, y: Math.round(rawY / (gridSnapMeters * SCALE_PPM)) * (gridSnapMeters * SCALE_PPM), snapType: 'edge' };
          }
          if (Math.abs(rawX - x2) < SNAP_RADIUS_PX && rawY >= y1 - 20 && rawY <= y2 + 20) {
            return { x: x2, y: Math.round(rawY / (gridSnapMeters * SCALE_PPM)) * (gridSnapMeters * SCALE_PPM), snapType: 'edge' };
          }
          if (Math.abs(rawY - y1) < SNAP_RADIUS_PX && rawX >= x1 - 20 && rawX <= x2 + 20) {
            return { x: Math.round(rawX / (gridSnapMeters * SCALE_PPM)) * (gridSnapMeters * SCALE_PPM), y: y1, snapType: 'edge' };
          }
          if (Math.abs(rawY - y2) < SNAP_RADIUS_PX && rawX >= x1 - 20 && rawX <= x2 + 20) {
            return { x: Math.round(rawX / (gridSnapMeters * SCALE_PPM)) * (gridSnapMeters * SCALE_PPM), y: y2, snapType: 'edge' };
          }
        }
      }

      // Standard Grid Snap
      if (gridSnapMeters <= 0) return { x: Math.round(rawX), y: Math.round(rawY), snapType: 'grid' };
      const snapPx = gridSnapMeters * SCALE_PPM;
      return {
        x: Math.round(rawX / snapPx) * snapPx,
        y: Math.round(rawY / snapPx) * snapPx,
        snapType: 'grid',
      };
    },
    [gridSnapMeters, magneticSnap, shapes]
  );

  // Canvas Mouse Coordinates Transformer
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, rawX: 0, rawY: 0, snapType: 'grid' as const };
    const rect = canvas.getBoundingClientRect();
    const rawX = (e.clientX - rect.left - pan.x) / zoom;
    const rawY = (e.clientY - rect.top - pan.y) / zoom;
    const snapped = snapToGridAndShapes(rawX, rawY);
    return {
      x: snapped.x,
      y: snapped.y,
      rawX,
      rawY,
      snapType: snapped.snapType,
    };
  };

  // Synchronize Walls whenever shapes change or are created
  const syncShapesToWalls = useCallback(
    (currentShapes: DesignerRoomShape[]) => {
      let allGeneratedWalls: Wall[] = [];
      let allGeneratedRooms: DesignerRoomLabel[] = [];
      let wallCounter = 1;

      for (const s of currentShapes) {
        const { walls: sWalls, room: sRoom } = buildRoomShapeWalls(s, chbAreaSqM, wallCounter);
        allGeneratedWalls.push(...sWalls);
        allGeneratedRooms.push(sRoom);
        wallCounter += sWalls.length;
      }

      setWalls(allGeneratedWalls);
      setRooms(allGeneratedRooms);
      return { walls: allGeneratedWalls, rooms: allGeneratedRooms };
    },
    [chbAreaSqM]
  );

  // Quick Drop a Shape from Template Library
  const handleDropShapeTemplate = (template: RoomShapeTemplate) => {
    const centerMetersX = 11;
    const centerMetersY = 8;
    const offsetPxX = (Math.random() - 0.5) * 60;
    const offsetPxY = (Math.random() - 0.5) * 60;

    const cx = centerMetersX * SCALE_PPM + offsetPxX;
    const cy = centerMetersY * SCALE_PPM + offsetPxY;

    const newShape: DesignerRoomShape = {
      id: `shape-${Date.now()}`,
      name: template.name,
      kind: template.kind,
      x: Math.round(cx / 20) * 20,
      y: Math.round(cy / 20) * 20,
      widthM: template.widthM,
      heightM: template.heightM,
      wallHeightM: template.wallHeightM,
      wallType: template.wallType,
    };

    const nextShapes = [...shapes, newShape];
    setShapes(nextShapes);
    const { walls: newWalls, rooms: newRooms } = syncShapesToWalls(nextShapes);

    pushToHistory({
      walls: newWalls,
      doors,
      windows,
      rooms: newRooms,
      dimensions,
      columns,
      shapes: nextShapes,
    });

    setSelectedElement({ type: 'shape', id: newShape.id });
    setSidebarTab('inspector');
  };

  // Add Custom Shape
  const handleAddCustomShape = (widthM: number, heightM: number, name: string) => {
    const newShape: DesignerRoomShape = {
      id: `shape-${Date.now()}`,
      name: name.toUpperCase(),
      kind: 'rectangle',
      x: 400 + (Math.random() - 0.5) * 40,
      y: 300 + (Math.random() - 0.5) * 40,
      widthM,
      heightM,
      wallHeightM: currentWallHeight,
      wallType: currentWallType,
    };

    const nextShapes = [...shapes, newShape];
    setShapes(nextShapes);
    const { walls: newWalls, rooms: newRooms } = syncShapesToWalls(nextShapes);

    pushToHistory({
      walls: newWalls,
      doors,
      windows,
      rooms: newRooms,
      dimensions,
      columns,
      shapes: nextShapes,
    });

    setSelectedElement({ type: 'shape', id: newShape.id });
    setSidebarTab('inspector');
  };

  // Shape Update & Manipulation Handlers
  const handleUpdateShape = (updated: DesignerRoomShape) => {
    const nextShapes = shapes.map((s) => (s.id === updated.id ? updated : s));
    setShapes(nextShapes);
    const { walls: newWalls, rooms: newRooms } = syncShapesToWalls(nextShapes);
    pushToHistory({
      walls: newWalls,
      doors,
      windows,
      rooms: newRooms,
      dimensions,
      columns,
      shapes: nextShapes,
    });
  };

  const handleDeleteShape = (shapeId: string) => {
    const nextShapes = shapes.filter((s) => s.id !== shapeId);
    setShapes(nextShapes);
    const { walls: newWalls, rooms: newRooms } = syncShapesToWalls(nextShapes);
    pushToHistory({
      walls: newWalls,
      doors,
      windows,
      rooms: newRooms,
      dimensions,
      columns,
      shapes: nextShapes,
    });
    setSelectedElement(null);
  };

  const handleDuplicateShape = (shape: DesignerRoomShape) => {
    const dup: DesignerRoomShape = {
      ...shape,
      id: `shape-${Date.now()}`,
      name: `${shape.name} (Copy)`,
      x: shape.x + shape.widthM * SCALE_PPM + 20,
      y: shape.y,
    };
    const nextShapes = [...shapes, dup];
    setShapes(nextShapes);
    const { walls: newWalls, rooms: newRooms } = syncShapesToWalls(nextShapes);
    pushToHistory({
      walls: newWalls,
      doors,
      windows,
      rooms: newRooms,
      dimensions,
      columns,
      shapes: nextShapes,
    });
    setSelectedElement({ type: 'shape', id: dup.id });
  };

  const handleRotateShape = (shape: DesignerRoomShape) => {
    const rotated: DesignerRoomShape = {
      ...shape,
      widthM: shape.heightM,
      heightM: shape.widthM,
    };
    handleUpdateShape(rotated);
  };

  // Punch Door onto a Shape's specific wall (North, South, East, West)
  const handleAddDoorToSide = (shape: DesignerRoomShape, side: 'north' | 'south' | 'east' | 'west') => {
    const wPx = shape.widthM * SCALE_PPM;
    const hPx = shape.heightM * SCALE_PPM;
    let dx = shape.x;
    let dy = shape.y;

    if (side === 'north') {
      dy = shape.y - hPx / 2;
    } else if (side === 'south') {
      dy = shape.y + hPx / 2;
    } else if (side === 'east') {
      dx = shape.x + wPx / 2;
    } else if (side === 'west') {
      dx = shape.x - wPx / 2;
    }

    const newDoor: DesignerDoor = {
      id: `door-${Date.now()}`,
      x: dx,
      y: dy,
      widthM: selectedDoorPreset.width,
      heightM: selectedDoorPreset.height,
      label: `${selectedDoorPreset.code} (${selectedDoorPreset.width}m)`,
      swingDirection: 'left-in',
    };

    const nextDoors = [...doors, newDoor];
    setDoors(nextDoors);
    pushToHistory({ walls, doors: nextDoors, windows, rooms, dimensions, columns, shapes });
    setSelectedElement({ type: 'door', id: newDoor.id });
  };

  // Punch Window onto a Shape's specific wall
  const handleAddWindowToSide = (shape: DesignerRoomShape, side: 'north' | 'south' | 'east' | 'west') => {
    const wPx = shape.widthM * SCALE_PPM;
    const hPx = shape.heightM * SCALE_PPM;
    let wx = shape.x;
    let wy = shape.y;

    if (side === 'north') {
      wy = shape.y - hPx / 2;
    } else if (side === 'south') {
      wy = shape.y + hPx / 2;
    } else if (side === 'east') {
      wx = shape.x + wPx / 2;
    } else if (side === 'west') {
      wx = shape.x - wPx / 2;
    }

    const newWin: DesignerWindow = {
      id: `win-${Date.now()}`,
      x: wx,
      y: wy,
      widthM: selectedWindowPreset.width,
      heightM: selectedWindowPreset.height,
      label: `${selectedWindowPreset.code} (${selectedWindowPreset.width}m)`,
    };

    const nextWins = [...windows, newWin];
    setWindows(nextWins);
    pushToHistory({ walls, doors, windows: nextWins, rooms, dimensions, columns, shapes });
    setSelectedElement({ type: 'window', id: newWin.id });
  };

  // Find item under cursor
  const findElementAtCoords = (x: number, y: number): SelectedElement | null => {
    // 1. Check doors
    for (const d of doors) {
      const w = d.widthM * SCALE_PPM;
      if (Math.abs(x - d.x) <= w / 2 + 8 && Math.abs(y - d.y) <= 14) {
        return { type: 'door', id: d.id };
      }
    }

    // 2. Check windows
    for (const win of windows) {
      const w = win.widthM * SCALE_PPM;
      if (Math.abs(x - win.x) <= w / 2 + 8 && Math.abs(y - win.y) <= 14) {
        return { type: 'window', id: win.id };
      }
    }

    // 3. Check Room Shapes (Inside boundary)
    for (const s of shapes) {
      const wPx = s.widthM * SCALE_PPM;
      const hPx = s.heightM * SCALE_PPM;
      if (
        x >= s.x - wPx / 2 - 10 &&
        x <= s.x + wPx / 2 + 10 &&
        y >= s.y - hPx / 2 - 10 &&
        y <= s.y + hPx / 2 + 10
      ) {
        return { type: 'shape', id: s.id };
      }
    }

    // 4. Check Individual Walls
    for (const w of walls) {
      if (w.tracePoints && w.tracePoints.length >= 2) {
        const dist = distToSegment({ x, y }, w.tracePoints[0], w.tracePoints[1]);
        if (dist <= 14) {
          return { type: 'wall', id: w.id };
        }
      }
    }

    // 5. Check Columns
    for (const col of columns) {
      const size = col.sizeM * SCALE_PPM;
      if (Math.abs(x - col.x) <= size / 2 + 6 && Math.abs(y - col.y) <= size / 2 + 6) {
        return { type: 'column', id: col.id };
      }
    }

    return null;
  };

  // Mouse Down handler
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coords = getCanvasCoords(e);

    // Pan viewport via middle click or pan tool
    if (e.button === 1 || activeTool === 'pan' || (activeTool === 'select' && e.shiftKey)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      return;
    }

    if (e.button !== 0) return;

    // SELECT TOOL
    if (activeTool === 'select') {
      // Check if clicking a resize handle of currently selected shape
      if (selectedElement?.type === 'shape') {
        const shape = shapes.find((s) => s.id === selectedElement.id);
        if (shape) {
          const wPx = shape.widthM * SCALE_PPM;
          const hPx = shape.heightM * SCALE_PPM;
          const x1 = shape.x - wPx / 2;
          const x2 = shape.x + wPx / 2;
          const y1 = shape.y - hPx / 2;
          const y2 = shape.y + hPx / 2;

          const HANDLE_SIZE = 12;
          if (Math.hypot(coords.rawX - x2, coords.rawY - y2) <= HANDLE_SIZE) {
            setIsResizingShape(true);
            setResizeHandle('se');
            return;
          }
          if (Math.hypot(coords.rawX - x1, coords.rawY - y1) <= HANDLE_SIZE) {
            setIsResizingShape(true);
            setResizeHandle('nw');
            return;
          }
          if (Math.hypot(coords.rawX - x2, coords.rawY - y1) <= HANDLE_SIZE) {
            setIsResizingShape(true);
            setResizeHandle('ne');
            return;
          }
          if (Math.hypot(coords.rawX - x1, coords.rawY - y2) <= HANDLE_SIZE) {
            setIsResizingShape(true);
            setResizeHandle('sw');
            return;
          }
        }
      }

      const found = findElementAtCoords(coords.rawX, coords.rawY);
      setSelectedElement(found);
      if (found && found.type === 'shape') {
        const shape = shapes.find((s) => s.id === found.id);
        if (shape) {
          setIsDraggingShape(true);
          setDragShapeStartOffset({ x: coords.rawX - shape.x, y: coords.rawY - shape.y });
        }
      }
      return;
    }

    // DRAW RECTANGLE ROOM SHAPE
    if (activeTool === 'shape_rect' || activeTool === 'shape_l' || activeTool === 'partition' || activeTool === 'dimension') {
      setDrawStart({ x: coords.x, y: coords.y });
      setDrawCurrent({ x: coords.x, y: coords.y });
      return;
    }

    // PLACE DOOR ON WALL
    if (activeTool === 'door') {
      const newDoor: DesignerDoor = {
        id: `door-${Date.now()}`,
        x: coords.x,
        y: coords.y,
        widthM: selectedDoorPreset.width,
        heightM: selectedDoorPreset.height,
        label: `${selectedDoorPreset.code} (${selectedDoorPreset.width}m)`,
        swingDirection: 'left-in',
      };
      const nextDoors = [...doors, newDoor];
      setDoors(nextDoors);
      pushToHistory({ walls, doors: nextDoors, windows, rooms, dimensions, columns, shapes });
      setSelectedElement({ type: 'door', id: newDoor.id });
      return;
    }

    // PLACE WINDOW ON WALL
    if (activeTool === 'window') {
      const newWin: DesignerWindow = {
        id: `win-${Date.now()}`,
        x: coords.x,
        y: coords.y,
        widthM: selectedWindowPreset.width,
        heightM: selectedWindowPreset.height,
        label: `${selectedWindowPreset.code} (${selectedWindowPreset.width}m)`,
      };
      const nextWins = [...windows, newWin];
      setWindows(nextWins);
      pushToHistory({ walls, doors, windows: nextWins, rooms, dimensions, columns, shapes });
      setSelectedElement({ type: 'window', id: newWin.id });
      return;
    }

    // PLACE COLUMN
    if (activeTool === 'column') {
      const newCol: DesignerColumn = {
        id: `col-${Date.now()}`,
        x: coords.x,
        y: coords.y,
        sizeM: 0.3,
      };
      const nextCols = [...columns, newCol];
      setColumns(nextCols);
      pushToHistory({ walls, doors, windows, rooms, dimensions, columns: nextCols, shapes });
      setSelectedElement({ type: 'column', id: newCol.id });
      return;
    }
  };

  // Mouse Move handler
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      return;
    }

    const coords = getCanvasCoords(e);
    setCursorPos({ x: coords.rawX, y: coords.rawY });
    setSnapInfo(coords.snapType !== 'grid' ? { x: coords.x, y: coords.y, type: coords.snapType } : null);

    // Resizing shape
    if (isResizingShape && selectedElement?.type === 'shape' && resizeHandle) {
      const shape = shapes.find((s) => s.id === selectedElement.id);
      if (shape) {
        let newWidth = shape.widthM;
        let newHeight = shape.heightM;
        let newX = shape.x;
        let newY = shape.y;

        if (resizeHandle === 'se') {
          const dxPx = coords.x - (shape.x - (shape.widthM * SCALE_PPM) / 2);
          const dyPx = coords.y - (shape.y - (shape.heightM * SCALE_PPM) / 2);
          newWidth = Math.max(1.0, Number((dxPx / SCALE_PPM).toFixed(2)));
          newHeight = Math.max(1.0, Number((dyPx / SCALE_PPM).toFixed(2)));
          newX = shape.x - (shape.widthM * SCALE_PPM) / 2 + (newWidth * SCALE_PPM) / 2;
          newY = shape.y - (shape.heightM * SCALE_PPM) / 2 + (newHeight * SCALE_PPM) / 2;
        }

        const updated: DesignerRoomShape = {
          ...shape,
          x: newX,
          y: newY,
          widthM: newWidth,
          heightM: newHeight,
        };
        const nextShapes = shapes.map((s) => (s.id === shape.id ? updated : s));
        setShapes(nextShapes);
        syncShapesToWalls(nextShapes);
      }
      return;
    }

    // Dragging shape
    if (isDraggingShape && selectedElement?.type === 'shape' && dragShapeStartOffset) {
      const shape = shapes.find((s) => s.id === selectedElement.id);
      if (shape) {
        const rawNewX = coords.rawX - dragShapeStartOffset.x;
        const rawNewY = coords.rawY - dragShapeStartOffset.y;
        const snapPx = gridSnapMeters * SCALE_PPM;
        const snappedX = Math.round(rawNewX / snapPx) * snapPx;
        const snappedY = Math.round(rawNewY / snapPx) * snapPx;

        const updated: DesignerRoomShape = {
          ...shape,
          x: snappedX,
          y: snappedY,
        };
        const nextShapes = shapes.map((s) => (s.id === shape.id ? updated : s));
        setShapes(nextShapes);
        syncShapesToWalls(nextShapes);
      }
      return;
    }

    // Drawing in progress
    if (drawStart) {
      setDrawCurrent({ x: coords.x, y: coords.y });
    }
  };

  // Mouse Up handler
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isResizingShape || isDraggingShape) {
      setIsResizingShape(false);
      setIsDraggingShape(false);
      setResizeHandle(null);
      setDragShapeStartOffset(null);
      pushToHistory({ walls, doors, windows, rooms, dimensions, columns, shapes });
      return;
    }

    if (!drawStart || !drawCurrent) {
      setDrawStart(null);
      setDrawCurrent(null);
      return;
    }

    const p1 = drawStart;
    const p2 = drawCurrent;
    const dx = Math.abs(p2.x - p1.x);
    const dy = Math.abs(p2.y - p1.y);

    // Minimum drag threshold
    if (dx < 15 && dy < 15) {
      setDrawStart(null);
      setDrawCurrent(null);
      return;
    }

    // CREATE RECTANGLE ROOM SHAPE
    if (activeTool === 'shape_rect') {
      const minX = Math.min(p1.x, p2.x);
      const maxX = Math.max(p1.x, p2.x);
      const minY = Math.min(p1.y, p2.y);
      const maxY = Math.max(p1.y, p2.y);

      const widthM = Number(((maxX - minX) / SCALE_PPM).toFixed(2));
      const heightM = Number(((maxY - minY) / SCALE_PPM).toFixed(2));
      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      const newShape: DesignerRoomShape = {
        id: `shape-${Date.now()}`,
        name: `Room ${shapes.length + 1}`,
        kind: 'rectangle',
        x: centerX,
        y: centerY,
        widthM,
        heightM,
        wallHeightM: currentWallHeight,
        wallType: currentWallType,
      };

      const nextShapes = [...shapes, newShape];
      setShapes(nextShapes);
      const { walls: newWalls, rooms: newRooms } = syncShapesToWalls(nextShapes);

      pushToHistory({
        walls: newWalls,
        doors,
        windows,
        rooms: newRooms,
        dimensions,
        columns,
        shapes: nextShapes,
      });

      setSelectedElement({ type: 'shape', id: newShape.id });
      setActiveTool('select');
      setSidebarTab('inspector');
    }

    // CREATE PARTITION WALL
    if (activeTool === 'partition') {
      const lengthM = Number((Math.hypot(p2.x - p1.x, p2.y - p1.y) / SCALE_PPM).toFixed(2));
      const grossArea = Number((lengthM * currentWallHeight).toFixed(2));
      const newWall: Wall = {
        id: `W${String(walls.length + 1).padStart(2, '0')}`,
        name: `Partition Divider ${walls.length + 1}`,
        type: 'Partition Wall',
        length: lengthM,
        height: currentWallHeight,
        grossArea,
        openingArea: 0,
        netArea: grossArea,
        baseCHB: Math.ceil(grossArea / chbAreaSqM),
        color: '#a855f7',
        tracePoints: [{ x: p1.x, y: p1.y }, { x: p2.x, y: p2.y }],
        openings: [],
      };

      const nextWalls = [...walls, newWall];
      setWalls(nextWalls);
      pushToHistory({ walls: nextWalls, doors, windows, rooms, dimensions, columns, shapes });
      setSelectedElement({ type: 'wall', id: newWall.id });
      setActiveTool('select');
    }

    // CREATE DIMENSION LINE
    if (activeTool === 'dimension') {
      const lengthM = (Math.hypot(p2.x - p1.x, p2.y - p1.y) / SCALE_PPM).toFixed(2);
      const newDim: DesignerDimension = {
        id: `dim-${Date.now()}`,
        p1,
        p2,
        label: `${lengthM} m`,
        offset: 20,
      };
      const nextDims = [...dimensions, newDim];
      setDimensions(nextDims);
      pushToHistory({ walls, doors, windows, rooms, dimensions: nextDims, columns, shapes });
      setSelectedElement({ type: 'dimension', id: newDim.id });
      setActiveTool('select');
    }

    setDrawStart(null);
    setDrawCurrent(null);
  };

  // Zoom Canvas via Wheel
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((z) => Math.min(3.0, Math.max(0.4, z * zoomFactor)));
  };

  // Canvas Primary Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to display
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const isBp = blueprintTheme === 'blueprint';
    const isDark = blueprintTheme === 'darkcad';

    // Canvas Background
    ctx.fillStyle = isBp ? '#0c2340' : isDark ? '#090d16' : '#f8fafc';
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Apply Pan and Zoom Transform
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // 1. Draw Architectural Grid
    const gridSize = SCALE_PPM * (gridSnapMeters || 0.5);
    const startX = Math.floor(-pan.x / zoom / gridSize) * gridSize - gridSize * 2;
    const endX = startX + rect.width / zoom + gridSize * 4;
    const startY = Math.floor(-pan.y / zoom / gridSize) * gridSize - gridSize * 2;
    const endY = startY + rect.height / zoom + gridSize * 4;

    ctx.strokeStyle = isBp ? 'rgba(56, 189, 248, 0.08)' : isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = startX; x < endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y < endY; y += gridSize) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // Major 1-meter grid lines
    const majorGrid = SCALE_PPM;
    ctx.strokeStyle = isBp ? 'rgba(56, 189, 248, 0.16)' : isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    ctx.beginPath();
    for (let x = startX; x < endX; x += majorGrid) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y < endY; y += majorGrid) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    // 2. Draw Room Shapes (Fills & Dimensions)
    shapes.forEach((shape) => {
      const isSelected = selectedElement?.type === 'shape' && selectedElement.id === shape.id;
      const wPx = shape.widthM * SCALE_PPM;
      const hPx = shape.heightM * SCALE_PPM;
      const x1 = shape.x - wPx / 2;
      const y1 = shape.y - hPx / 2;

      // Room Area Fill
      ctx.fillStyle = isSelected
        ? isBp
          ? 'rgba(14, 165, 233, 0.22)'
          : 'rgba(16, 185, 129, 0.18)'
        : isBp
        ? 'rgba(56, 189, 248, 0.08)'
        : isDark
        ? 'rgba(30, 41, 59, 0.5)'
        : 'rgba(241, 245, 249, 0.8)';
      ctx.fillRect(x1, y1, wPx, hPx);

      // Shape Boundary Highlight
      ctx.strokeStyle = isSelected
        ? '#10b981'
        : isBp
        ? 'rgba(56, 189, 248, 0.4)'
        : 'rgba(148, 163, 184, 0.4)';
      ctx.lineWidth = isSelected ? 2.5 : 1;
      ctx.setLineDash(isSelected ? [4, 4] : []);
      ctx.strokeRect(x1, y1, wPx, hPx);
      ctx.setLineDash([]);

      // Room Center Label Badge
      const area = (shape.widthM * shape.heightM).toFixed(1);
      ctx.fillStyle = isSelected ? '#10b981' : isBp ? '#e0f2fe' : isDark ? '#f8fafc' : '#0f172a';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(shape.name.toUpperCase(), shape.x, shape.y - 8);

      ctx.fillStyle = isBp ? '#38bdf8' : isDark ? '#94a3b8' : '#64748b';
      ctx.font = 'bold 10px monospace';
      ctx.fillText(`${shape.widthM}m × ${shape.heightM}m  (${area} m²)`, shape.x, shape.y + 10);

      // Selected Shape Dimension Annotations & Corner Handles
      if (isSelected) {
        // Dimension Text Callouts on all 4 sides
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 10px monospace';
        // North
        ctx.fillText(`${shape.widthM.toFixed(2)} m`, shape.x, y1 - 10);
        // South
        ctx.fillText(`${shape.widthM.toFixed(2)} m`, shape.x, y1 + hPx + 14);
        // West
        ctx.fillText(`${shape.heightM.toFixed(2)} m`, x1 - 24, shape.y);
        // East
        ctx.fillText(`${shape.heightM.toFixed(2)} m`, x1 + wPx + 24, shape.y);

        // Corner Resize Handles
        const corners = [
          { x: x1, y: y1 },
          { x: x1 + wPx, y: y1 },
          { x: x1 + wPx, y: y1 + hPx },
          { x: x1, y: y1 + hPx },
        ];
        corners.forEach((c) => {
          ctx.fillStyle = '#10b981';
          ctx.beginPath();
          ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        });
      }
    });

    // 3. Draw Concrete Walls (Double-line Architectural Masonry)
    walls.forEach((wall) => {
      if (!wall.tracePoints || wall.tracePoints.length < 2) return;
      const p1 = wall.tracePoints[0];
      const p2 = wall.tracePoints[1];
      const isSelected = selectedElement?.type === 'wall' && selectedElement.id === wall.id;

      // Masonry wall stroke
      ctx.strokeStyle = isSelected
        ? '#38bdf8'
        : wall.type === 'Exterior Wall'
        ? isBp
          ? '#e0f2fe'
          : isDark
          ? '#f8fafc'
          : '#0f172a'
        : isBp
        ? '#7dd3fc'
        : '#64748b';
      ctx.lineWidth = wall.type === 'Exterior Wall' ? 7 : 4.5;
      ctx.lineCap = 'square';
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    // 4. Draw Windows
    windows.forEach((win) => {
      const isSelected = selectedElement?.type === 'window' && selectedElement.id === win.id;
      const wPx = win.widthM * SCALE_PPM;
      ctx.fillStyle = isBp ? '#0c2340' : isDark ? '#090d16' : '#ffffff';
      ctx.fillRect(win.x - wPx / 2, win.y - 4, wPx, 8);

      ctx.strokeStyle = isSelected ? '#10b981' : isBp ? '#38bdf8' : '#0284c7';
      ctx.lineWidth = 2;
      ctx.strokeRect(win.x - wPx / 2, win.y - 4, wPx, 8);

      // Glass line
      ctx.beginPath();
      ctx.moveTo(win.x - wPx / 2, win.y);
      ctx.lineTo(win.x + wPx / 2, win.y);
      ctx.stroke();
    });

    // 5. Draw Doors
    doors.forEach((door) => {
      const isSelected = selectedElement?.type === 'door' && selectedElement.id === door.id;
      const wPx = door.widthM * SCALE_PPM;

      ctx.fillStyle = isBp ? '#0c2340' : isDark ? '#090d16' : '#ffffff';
      ctx.fillRect(door.x - wPx / 2, door.y - 5, wPx, 10);

      // Door Leaf
      ctx.strokeStyle = isSelected ? '#10b981' : '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(door.x - wPx / 2, door.y);
      ctx.lineTo(door.x - wPx / 2, door.y - wPx);
      ctx.stroke();

      // Swing Arc
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(door.x - wPx / 2, door.y, wPx, -Math.PI / 2, 0, false);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // 6. Draw Columns
    columns.forEach((col) => {
      const sizePx = col.sizeM * SCALE_PPM;
      ctx.fillStyle = isBp ? '#38bdf8' : '#334155';
      ctx.fillRect(col.x - sizePx / 2, col.y - sizePx / 2, sizePx, sizePx);
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(col.x - sizePx / 2, col.y - sizePx / 2, sizePx, sizePx);
    });

    // 7. Interactive Drawing Shape Preview
    if (drawStart && drawCurrent && activeTool === 'shape_rect') {
      const minX = Math.min(drawStart.x, drawCurrent.x);
      const maxX = Math.max(drawStart.x, drawCurrent.x);
      const minY = Math.min(drawStart.y, drawCurrent.y);
      const maxY = Math.max(drawStart.y, drawCurrent.y);
      const w = maxX - minX;
      const h = maxY - minY;

      const wM = (w / SCALE_PPM).toFixed(2);
      const hM = (h / SCALE_PPM).toFixed(2);
      const area = (parseFloat(wM) * parseFloat(hM)).toFixed(1);

      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.fillRect(minX, minY, w, h);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(minX, minY, w, h);

      // Dimension Pill
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${wM}m × ${hM}m (${area} m²)`, minX + w / 2, minY + h / 2);
    }

    // 8. Snap Indicator
    if (snapInfo) {
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(snapInfo.x, snapInfo.y, 7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`● ${snapInfo.type.toUpperCase()} SNAP`, snapInfo.x + 10, snapInfo.y + 3);
    }

    ctx.restore();
  }, [
    shapes,
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
    isResizingShape,
    isDraggingShape,
  ]);

  // Derived Totals
  const totalWallLength = walls.reduce((sum, w) => sum + w.length, 0);
  const totalGrossArea = walls.reduce((sum, w) => sum + w.grossArea, 0);
  const totalOpeningArea = walls.reduce((sum, w) => sum + w.openingArea, 0);
  const totalNetArea = Math.max(0, totalGrossArea - totalOpeningArea);
  const baseCHBTotal = Math.ceil(totalNetArea / chbAreaSqM);
  const finalCHBWithWaste = Math.ceil(baseCHBTotal * (1 + wastePercentage / 100));
  const estimatedFloorArea = shapes.reduce((sum, s) => sum + s.widthM * s.heightM, 0) || 72.0;

  // Selected Objects
  const activeSelectedShape = selectedElement?.type === 'shape' ? shapes.find((s) => s.id === selectedElement.id) || null : null;
  const activeSelectedWall = selectedElement?.type === 'wall' ? walls.find((w) => w.id === selectedElement.id) || null : null;
  const activeSelectedDoor = selectedElement?.type === 'door' ? doors.find((d) => d.id === selectedElement.id) || null : null;
  const activeSelectedWin = selectedElement?.type === 'window' ? windows.find((w) => w.id === selectedElement.id) || null : null;

  // Apply to Main Project
  const handleApplyToProject = () => {
    const dataUrl = generateBlueprintDataUrl(
      { walls, doors, windows, rooms, dimensions, columns, shapes },
      planTitle,
      blueprintTheme,
      chbAreaSqM
    );
    onApplyBlueprint(dataUrl, planTitle, walls, Number(estimatedFloorArea.toFixed(1)));
    onClose();
  };

  // Download high-resolution blueprint image
  const handleDownloadImage = () => {
    const dataUrl = generateBlueprintDataUrl(
      { walls, doors, windows, rooms, dimensions, columns, shapes },
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
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-950">
              <Square className="w-4 h-4" />
            </div>
            <div>
              <input
                type="text"
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
                className="bg-transparent border-b border-transparent hover:border-slate-600 focus:border-emerald-500 text-sm font-bold text-slate-100 focus:outline-none px-1 py-0.5"
                title="Click to rename blueprint project"
              />
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                <span>Shape-Based CAD Studio</span>
                <span>•</span>
                <span>{shapes.length} Room Shapes</span>
                <span>•</span>
                <span>{walls.length} Walls</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadImage}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 transition-colors"
              title="Export high-resolution blueprint PNG"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export PNG</span>
            </button>

            <button
              id="btn-apply-designer-blueprint"
              type="button"
              onClick={handleApplyToProject}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-950 transition-all"
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

        {/* Studio Core Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Drawing Canvas Viewport */}
          <div className="relative flex-1 bg-slate-950 overflow-hidden flex flex-col select-none">
            {/* Top Floating CAD Tool Ribbon */}
            <div className="absolute top-3 left-4 right-4 z-20 flex items-center justify-between pointer-events-none gap-2">
              {/* Primary Shape & CAD Tools */}
              <div className="pointer-events-auto flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1.5 rounded-2xl shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTool('shape_rect');
                    setSidebarTab('inspector');
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    activeTool === 'shape_rect'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title="Draw Room Shape (Drag on canvas)"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span>Room Shape</span>
                  <kbd className="text-[9px] bg-slate-950/60 px-1 rounded text-slate-300">R</kbd>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool('select')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    activeTool === 'select'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title="Select, Move & Resize Shape (V)"
                >
                  <MousePointer2 className="w-3.5 h-3.5" />
                  <span>Select</span>
                  <kbd className="text-[9px] bg-slate-950/60 px-1 rounded text-slate-300">V</kbd>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTool('partition')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    activeTool === 'partition'
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title="Draw Partition Dividing Wall (W)"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>Partition</span>
                  <kbd className="text-[9px] bg-slate-950/60 px-1 rounded text-slate-300">W</kbd>
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
                  onClick={() => setActiveTool('dimension')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                    activeTool === 'dimension'
                      ? 'bg-yellow-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                  title="Dimension Line (M)"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Measure</span>
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
                </button>
              </div>

              {/* Undo / Redo & Snap Controls */}
              <div className="pointer-events-auto flex items-center gap-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 p-1.5 rounded-2xl shadow-xl">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={historyIndex <= 0}
                  className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors"
                  title="Undo (Ctrl+Z)"
                >
                  <Undo2 className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={historyIndex >= history.length - 1}
                  className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 transition-colors"
                  title="Redo (Ctrl+Y)"
                >
                  <Redo2 className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-slate-800 mx-1" />

                <button
                  type="button"
                  onClick={() => setMagneticSnap(!magneticSnap)}
                  className={`p-1.5 rounded-xl text-xs flex items-center gap-1 transition-all ${
                    magneticSnap ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60' : 'text-slate-500 hover:text-slate-300'
                  }`}
                  title="Magnetic Shape Snapping"
                >
                  <Magnet className="w-3.5 h-3.5" />
                </button>

                <select
                  value={blueprintTheme}
                  onChange={(e) => setBlueprintTheme(e.target.value as ThemeMode)}
                  className="bg-slate-800 border border-slate-700 rounded-xl px-2 py-1 text-[11px] text-slate-300 focus:outline-none"
                >
                  <option value="blueprint">Blueprint Blue</option>
                  <option value="darkcad">Dark CAD</option>
                  <option value="monochrome">Monochrome</option>
                </select>
              </div>
            </div>

            {/* Interactive Drawing Canvas */}
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
              className="w-full h-full cursor-crosshair"
            />

            {/* Bottom Status Bar */}
            <div className="absolute bottom-2 left-4 right-4 z-20 flex items-center justify-between text-[11px] font-mono pointer-events-none">
              <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300 flex items-center gap-3">
                <span className="text-emerald-400 font-bold">● Shape CAD Mode</span>
                <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
                <span>
                  Cursor: {(cursorPos.x / SCALE_PPM).toFixed(1)}m, {(cursorPos.y / SCALE_PPM).toFixed(1)}m
                </span>
              </div>

              <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-slate-300 flex items-center gap-3">
                <span>
                  Area: <strong className="text-emerald-400 font-mono">{estimatedFloorArea.toFixed(1)} m²</strong>
                </span>
                <span>
                  Perimeter: <strong className="text-cyan-400 font-mono">{totalWallLength.toFixed(1)} m</strong>
                </span>
                <span>
                  Total CHB: <strong className="text-amber-400 font-mono">{finalCHBWithWaste} pcs</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Right Sidebar Inspector & Shape Library */}
          <div className="w-80 sm:w-96 bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden">
            {/* Sidebar Navigation Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950 p-1.5 gap-1 text-xs">
              <button
                type="button"
                onClick={() => setSidebarTab('palette')}
                className={`flex-1 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                  sidebarTab === 'palette'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> Shapes
              </button>

              <button
                type="button"
                onClick={() => setSidebarTab('inspector')}
                className={`flex-1 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                  sidebarTab === 'inspector'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Square className="w-3.5 h-3.5" /> Inspector
              </button>

              <button
                type="button"
                onClick={() => setSidebarTab('schedule')}
                className={`flex-1 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all ${
                  sidebarTab === 'schedule'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Ruler className="w-3.5 h-3.5" /> Takeoff
              </button>
            </div>

            {/* Sidebar Tab Content */}
            <div className="flex-1 overflow-y-auto">
              {sidebarTab === 'palette' && (
                <ShapePaletteDrawer
                  onSelectTemplate={handleDropShapeTemplate}
                  onQuickAddCustomShape={handleAddCustomShape}
                />
              )}

              {sidebarTab === 'inspector' && (
                <ShapeInspectorPanel
                  selectedShape={activeSelectedShape}
                  selectedWall={activeSelectedWall}
                  selectedDoor={activeSelectedDoor}
                  selectedWin={activeSelectedWin}
                  onUpdateShape={handleUpdateShape}
                  onDeleteShape={handleDeleteShape}
                  onDuplicateShape={handleDuplicateShape}
                  onRotateShape={handleRotateShape}
                  onAddDoorToSide={handleAddDoorToSide}
                  onAddWindowToSide={handleAddWindowToSide}
                  onUpdateWall={(w) => {
                    const next = walls.map((old) => (old.id === w.id ? w : old));
                    setWalls(next);
                    pushToHistory({ walls: next, doors, windows, rooms, dimensions, columns, shapes });
                  }}
                  onDeleteSelected={() => {
                    if (selectedElement?.type === 'shape') {
                      handleDeleteShape(selectedElement.id);
                    } else if (selectedElement?.type === 'wall') {
                      const next = walls.filter((w) => w.id !== selectedElement.id);
                      setWalls(next);
                      setSelectedElement(null);
                    } else if (selectedElement?.type === 'door') {
                      const next = doors.filter((d) => d.id !== selectedElement.id);
                      setDoors(next);
                      setSelectedElement(null);
                    } else if (selectedElement?.type === 'window') {
                      const next = windows.filter((w) => w.id !== selectedElement.id);
                      setWindows(next);
                      setSelectedElement(null);
                    }
                  }}
                  chbAreaSqM={chbAreaSqM}
                />
              )}

              {sidebarTab === 'schedule' && (
                <div className="p-4 space-y-4 text-xs font-sans">
                  <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 space-y-2">
                    <h4 className="font-bold text-slate-100 flex items-center justify-between">
                      <span>CHB Masonry Takeoff</span>
                      <span className="text-emerald-400 font-mono">{finalCHBWithWaste} pcs</span>
                    </h4>
                    <div className="text-[11px] text-slate-400 space-y-1">
                      <div className="flex justify-between">
                        <span>Gross Masonry Area:</span>
                        <span className="text-slate-200 font-mono">{totalGrossArea.toFixed(2)} m²</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Openings (Doors/Windows):</span>
                        <span className="text-amber-400 font-mono">-{totalOpeningArea.toFixed(2)} m²</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-200 border-t border-slate-800 pt-1">
                        <span>Net Masonry Wall Area:</span>
                        <span className="text-emerald-400 font-mono">{totalNetArea.toFixed(2)} m²</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Waste Factor ({wastePercentage}%):</span>
                        <span className="font-mono">+{finalCHBWithWaste - baseCHBTotal} pcs</span>
                      </div>
                    </div>
                  </div>

                  {/* Room Area Summary Table */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Room Shapes ({shapes.length})
                    </span>
                    <div className="space-y-1.5">
                      {shapes.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedElement({ type: 'shape', id: s.id });
                            setSidebarTab('inspector');
                          }}
                          className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 cursor-pointer flex justify-between items-center transition-colors"
                        >
                          <div>
                            <span className="font-bold text-slate-200 block text-xs">{s.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {s.widthM}m × {s.heightM}m • {s.wallHeightM}m High
                            </span>
                          </div>
                          <span className="text-xs font-bold font-mono text-emerald-400">
                            {(s.widthM * s.heightM).toFixed(1)} m²
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
